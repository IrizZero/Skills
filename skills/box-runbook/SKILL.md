---
name: box-runbook
description: Facts, maintenance and troubleshooting for this Windows box. Load before cloning a repo, installing anything, using sqlcmd or writing under AppData, and for the box's repo locations, GitHub login, git identity, installed tools and paths. Also load when a gh/git call fails with an auth error, 403 or "Repository not found", when codex reports a missing model, stale model cache or needs upgrading, when a sandboxed codex shell call fails with "Access is denied", when chrome-devtools-axi needs installing, updating, attaching to real Chrome or dies with an engine error, or when `py` or a venv's `python.exe` fails to start from a long path.
---

# Box runbook

Local facts and procedures for this machine. Versions and dates are last-verified observations: check the installed version before treating one as a diagnostic fact. The standing rules live in `~/.claude/CLAUDE.md`; this file holds the box facts (repos, GitHub, installed tools) and the detail that matters when something breaks or needs maintenance.

## Repos on this box

- Every repo lives in `C:\git\<RepoName>`: one folder per repo, named exactly as on GitHub, case included. Current: `C:\git\ODS`, `C:\git\Second_Brain`, `C:\git\Skills`.
- Clone new repos there, never into a session or scratch folder, `~`, Documents or OneDrive (OneDrive sync corrupts `.git`). Check the exact name first with `gh repo view <owner>/<repo> --json nameWithOwner` (it is `IrizZero/Skills`, not `skills`).
- Clone: `git clone https://github.com/<owner>/<repo>.git C:\git\<RepoName>`, then confirm with `git -C C:\git\<RepoName> status -sb`.
- Project work happens in a session opened on that repo's `C:\git\<RepoName>` folder, not in a setup or scratch session.
- Run `C:\git\Skills\backup.ps1` only when I ask. It replaces the Skills repo's skills, agents, hooks and `snapshot/CLAUDE.md` with this box's `~/.claude`. This box's copies were edited on install (caveman removed, GitHub and hostname facts updated), so a backup changes the shared snapshot.

## GitHub on this box

- Tools: Git for Windows 2.55 (per-user, `%LOCALAPPDATA%\Programs\Git`) and GitHub CLI 2.102 (`C:\Program Files\GitHub CLI\gh.exe`), both installed with winget.
- Git identity (global): `AmierAshrafw` / `{{OWNER_EMAIL}}`. Do not change it without asking.
- `gh` is signed in as `AmierAshrafw` (keyring token, HTTPS, scopes `repo`, `read:org`, `gist`) and `gh auth setup-git` is done, so clone, pull and push to github.com need no prompt from Claude sessions, and plain `https://github.com/...` origin URLs work. That login exists only inside the Claude app (see the AppData note below): in the terminal panel, VS Code or Windows Terminal, `gh` is not signed in. I use GitHub Desktop there; leave it that way.
- No `GITHUB_TOKEN` PAT, no Credential Manager accounts and no username in origin URLs on this box. `IrizZero` is my personal account; its repos are reached as a collaborator through `AmierAshrafw`. `gh-axi` is not installed, so use `gh`.
- If auth breaks: run `gh auth login --hostname github.com --git-protocol https --web` in the background, read the one-time code from its output and give it to me with https://github.com/login/device. I can't easily answer prompts in the terminal panel.
- A shell started before an install may not see `git` or `gh`. Refresh PATH: `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`.
- Windows PowerShell 5.1 strips double quotes inside native-exe arguments, so `gh ... --jq` filters containing `"` break. Pipe the JSON into `ConvertFrom-Json` instead.

## Tools and installs on this box

- Installed 2026-10-20: Node 24 LTS, PowerShell 7.6 (Store copy plus the MSI in `C:\Program Files\PowerShell\7`; keep the MSI, Codex's sandbox cannot start the Store one, see `box-runbook`), .NET SDK 8 and 10, uv, Serena 2.1 (`uv tool`, Python 3.13, `~\.local\bin\serena.exe`), Codex CLI (npm), and pyright (npm) plus csharp-ls (dotnet tool) for the `pyright-lsp` / `csharp-lsp` plugins, Python 3.12.10 (per-user, with the `py` launcher), SQL Server 2025 Express (instance `RPS-MV-L-5101\SQLEXPRESS`, my account is sysadmin) with sqlcmd 1.10 (connect with `-S "lpc:RPS-MV-L-5101\SQLEXPRESS" -E -C`; the bare name times out) and SSMS 22, Visual Studio, and ffmpeg 9.0.1 (`C:\ffmpeg\bin` is a junction to the winget package folder). ODS dev setup details live in the ODS project memory. Not installed yet: Android Studio, gh-axi, chrome-devtools-axi.
- Caveman is not used on this box.
- The Claude app redirects AppData writes made by Claude's own shell into its private package folder (`%LOCALAPPDATA%\Packages\Claude_*\LocalCache`), so they are invisible outside the app. winget installs are not affected. Anything else that writes under `%APPDATA%` or `%LOCALAPPDATA%` (`npm install -g`, `uv tool install`, `gh auth login`, tool config files) goes in a `.ps1` run from the terminal panel with `powershell -NoProfile -ExecutionPolicy Bypass -File <script>`, because the terminal panel runs outside the redirect.

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
