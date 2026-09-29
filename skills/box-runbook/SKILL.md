---
name: box-runbook
description: Maintenance and troubleshooting notes for this Windows box. Load when a gh/git call fails with an auth error, 403 or "Repository not found", when the GitHub PAT needs rotating, when codex reports a missing model, stale model cache or needs upgrading, or when chrome-devtools-axi needs installing, updating, attaching to real Chrome or dies with an engine error.
---

# Box runbook

Local facts and procedures for this machine. Versions and dates are last-verified observations: check the installed version before treating one as a diagnostic fact. The standing rules live in `~/.claude/CLAUDE.md`; this file holds the detail that only matters when something breaks or needs maintenance.

## GitHub auth

- `gh` lives at `C:\Program Files\GitHub CLI\gh.exe` (winget `GitHub.cli`). It reads `GITHUB_TOKEN` automatically.
- `gh-axi` is an npm-global wrapper around `gh` (`npm install -g gh-axi`) and rides the same token.
- The PAT is held in two Windows User-scope env vars, `GITHUB_TOKEN` and `GITHUB_PERSONAL_ACCESS_TOKEN`. They persist across reboot. Set with `[Environment]::SetEnvironmentVariable(name, value, 'User')`.
- A process started before a rotation still holds the old token. Reload per command: `$env:GITHUB_TOKEN = [Environment]::GetEnvironmentVariable('GITHUB_TOKEN','User')`.

### Token rotation

- Current PAT: classic, note "for agent", created 2026-08-05, expires 2026-10-04 (60 days).
- Use a CLASSIC PAT, not fine-grained. A fine-grained PAT cannot reach repos owned by another personal account even as collaborator (e.g. `IrizZero/Skills` from the `AmierAshrafw` token): PR create fails with 403 "Resource not accessible by personal access token". Classic `repo` scope covers collaborator repos.
- Regenerate at https://github.com/settings/tokens (AmierAshrafw account) with scopes `repo`, `workflow`, `read:org`, `gist`.
- Update both User env vars with the new value, then restart every process that loaded the old one (Claude Code Desktop, terminals). Never print the value: read it via `$env:GITHUB_TOKEN` and pipe it straight to `SetEnvironmentVariable`.

### Diagnose an auth error

1. `gh auth status` - does gh see a token?
2. `[Environment]::GetEnvironmentVariables('User').GetEnumerator() | Where Name -like "*GITHUB*" | Select Name` - are the env vars persisted? Names only.
3. `git remote -v` - does an `AmierAshrafw` origin embed `AmierAshrafw@`?
4. Token prefix only, never the full value: `ghp_` = classic (current), `github_pat_` = fine-grained (stale).
5. Past 2026-10-04 the PAT has probably expired: rotate as above.

## Codex CLI

- Codex CLI 0.156.0 (upgraded 2026-09-23), npm global, Node v24.19. Authed with a ChatGPT login ({{CHATGPT_EMAIL}}), no API key.
- The GPT-6 family launched 2026-09-22. The server hides models the client is too old for: GPT-6 Sol and Luna need CLI >= 0.155.0.
- A model missing from `~/.codex/models_cache.json`: compare `codex --version` with `npm view @openai/codex version`. The cache is rewritten by whichever codex binary ran last (desktop app or npm CLI), so two reads can disagree.
- Upgrade only when no npm `codex exec` run is active.

## chrome-devtools-axi

- Installed 2026-08-06 with node v24.19.0: `npm install -g chrome-devtools-axi` (v0.1.28) and `npm install -g chrome-devtools-mcp` (v1.6.0).
- Update: `npm update -g chrome-devtools-axi chrome-devtools-mcp`, then refresh `~/.claude/skills/chrome-devtools-axi/SKILL.md` from its repo, or run `npx skills add kunchenguid/chrome-devtools-axi --skill chrome-devtools-axi -g` (works on node >= 22.20.0).
- The persistent bridge keeps Chrome alive across commands; `chrome-devtools-axi stop` ends it.
- A command dying with `The "paths[0]" argument must be of type string. Received undefined` is the wrapper masking an engine failure. Get the real error from the engine directly: `node "$(npm prefix -g)/node_modules/chrome-devtools-mcp/build/src/bin/chrome-devtools-mcp.js"`. Seen once on node v20.10.0, below the engine floor of `^20.19.0 || ^22.12.0 || >=23`.
- Attaching axi to the owner's real Chrome (`CHROME_DEVTOOLS_AXI_AUTO_CONNECT=1` and `CHROME_DEVTOOLS_AXI_BROWSER_URL=http://127.0.0.1:9222`) needs Chrome started with `--remote-debugging-port=9222`. Starting Chrome that way is the owner's action (app lifecycle rule). Untested alongside the Claude-in-Chrome extension; check before relying on it.
