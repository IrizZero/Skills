---
name: box-runbook
description: Maintenance and troubleshooting notes for this Windows box. Load when a gh/git call fails with an auth error, 403 or "Repository not found", when codex reports a missing model, stale model cache or needs upgrading, when a sandboxed codex shell call fails with "Access is denied", when chrome-devtools-axi needs installing, updating, attaching to real Chrome or dies with an engine error, or when `py` or a venv's `python.exe` fails to start from a long path.
---

# Box runbook

Local facts and procedures for this machine. Versions and dates are last-verified observations: check the installed version before treating one as a diagnostic fact. The standing rules live in `~/.claude/CLAUDE.md`; this file holds the detail that only matters when something breaks or needs maintenance.

## GitHub auth

- `gh` lives at `C:\Program Files\GitHub CLI\gh.exe` (winget `GitHub.cli`). Signed in with `gh auth login` as `AmierAshrafw` (keyring OAuth token, scopes `repo`, `read:org`, `gist`). No PAT, no `GITHUB_TOKEN` env var, no Credential Manager accounts on this box.
- `gh auth setup-git` made gh Git's credential helper for github.com, so plain `https://github.com/...` URLs work, including `IrizZero` repos where `AmierAshrafw` is a collaborator.
- The login exists only inside the Claude app (its AppData redirect holds `gh`'s hosts.yml). Outside the app the owner uses GitHub Desktop.
- `gh-axi` (npm-global wrapper around `gh`) is not installed on this box yet; it would ride the same login.

### Diagnose an auth error

1. `gh auth status` - signed in as AmierAshrafw?
2. `git config --global --get-all credential.https://github.com.helper` - should name `gh.exe auth git-credential`.
3. If the login is gone: run `gh auth login --hostname github.com --git-protocol https --web` in the background, read the one-time code from its output and give it to the owner with https://github.com/login/device. Never type a password.

## Codex CLI

- Codex CLI 0.163.0 (installed 2026-10-20), npm global, Node v24.20. Authed with a ChatGPT login ({{CHATGPT_EMAIL}}), no API key, signed in 2026-10-20. Device-code sign-in (`codex login --device-auth`) is disabled on that ChatGPT account; use plain `codex login` in the background, which opens the browser and listens on `localhost:1455`.
- The GPT-6 family launched 2026-09-22. The server hides models the client is too old for: GPT-6 Sol and Luna need CLI >= 0.155.0.
- A model missing from `~/.codex/models_cache.json`: compare `codex --version` with `npm view @openai/codex version`. The cache is rewritten by whichever codex binary ran last (desktop app or npm CLI), so two reads can disagree.
- Upgrade only when no npm `codex exec` run is active.

### Sandbox shell fails with "Access is denied"

- Symptom: inside `codex exec --sandbox read-only` or `workspace-write`, every shell call fails with `CreateProcessAsUserW failed: 5 (Access is denied.)` on `%LOCALAPPDATA%\Microsoft\WindowsApps\pwsh.exe`.
  `cmd.exe` calls succeed, so the model may switch shells on its own, or give up and review blind.
  `~/.codex/.sandbox/sandbox.<date>.log` shows the shell behind each `START:` line.
- Cause: Codex picks its shell with a PATH lookup for `pwsh`, then `powershell`.
  Store (MSIX) PowerShell is reachable only through the WindowsApps app execution alias.
  The `[windows] sandbox = "unelevated"` restricted token cannot start an MSIX package; its real exe under `C:\Program Files\WindowsApps\` fails too, with `0xC0070005`.
  Codex's own Store-pwsh fallback covers only the `elevated` and `mxc` sandboxes (checked in 0.163.0; openai/codex#10090).
- Fix (2026-10-20, PowerShell 7.6.7): install the non-Store MSI next to the Store copy, from the terminal panel:
  `winget install --id Microsoft.PowerShell --source winget --installer-type wix --force --accept-package-agreements --accept-source-agreements`.
  winget's default installer for this ID is `msix`. `--force` is needed because winget treats the Store copy as the same package.
  The MSI adds `C:\Program Files\PowerShell\7\` to the machine PATH, which comes before the user PATH entry for WindowsApps.
- Restart the Claude app after the install. Shells it started earlier keep the old PATH, so Codex launched from them still finds the alias.
- Check without a model call, from Git Bash: `codex sandbox -- pwsh -NoProfile -Command '$PSVersionTable.PSVersion.ToString()'` prints the version.
  `where.exe pwsh` should list `C:\Program Files\PowerShell\7\pwsh.exe` first.
- MSI stops at 7.6.x: PowerShell 7.7 and later ship MSIX only (PowerShell team, 2026-04-10).
  Before moving to 7.7, check whether Codex's fallback covers `unelevated` yet; otherwise stay on 7.6 LTS from the MSI or use the ZIP build.
- winget on this box fails any `--scope machine` call with `Failed to open the predefined source` / `0x80070005`; its log stops at `Reading MSI UpgradeCodes`.
  Leave the flag off; the PowerShell MSI installs per-machine anyway.

## Python on long paths

- 2026-10-21: `py` and a venv's `python.exe` failed to start from the desktop app's scratch workspace (path over MAX_PATH).
- Put venvs and probe output in the target repo's `tmp/` instead, after `git check-ignore -q tmp/` confirms it is ignored.

## chrome-devtools-axi

- Not installed on this box yet (2026-10-20). The notes below are from the previous laptop.
- Until it is installed, `~/.claude/skills/chrome-devtools-axi/SKILL.md` carries `disable-model-invocation: true` so no session tries `npx -y chrome-devtools-axi`. After installing, delete that line.
- Installed 2026-08-06 with node v24.19.0: `npm install -g chrome-devtools-axi` (v0.1.28) and `npm install -g chrome-devtools-mcp` (v1.6.0).
- Update: `npm update -g chrome-devtools-axi chrome-devtools-mcp`, then refresh `~/.claude/skills/chrome-devtools-axi/SKILL.md` from its repo, or run `npx skills add kunchenguid/chrome-devtools-axi --skill chrome-devtools-axi -g` (works on node >= 22.20.0).
- The persistent bridge keeps Chrome alive across commands; `chrome-devtools-axi stop` ends it.
- A command dying with `The "paths[0]" argument must be of type string. Received undefined` is the wrapper masking an engine failure. Get the real error from the engine directly: `node "$(npm prefix -g)/node_modules/chrome-devtools-mcp/build/src/bin/chrome-devtools-mcp.js"`. Seen once on node v20.10.0, below the engine floor of `^20.19.0 || ^22.12.0 || >=23`.
- Attaching axi to the owner's real Chrome (`CHROME_DEVTOOLS_AXI_AUTO_CONNECT=1` and `CHROME_DEVTOOLS_AXI_BROWSER_URL=http://127.0.0.1:9222`) needs Chrome started with `--remote-debugging-port=9222`. Starting Chrome that way is the owner's action (app lifecycle rule). Untested alongside the Claude-in-Chrome extension; check before relying on it.
