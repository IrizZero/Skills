# Claude Code Config Backup

Portable backup of my personal Claude Code setup — **skills, subagents, slash commands, and plugin/hook config** — so any box can be brought up to the same config, driven by an agent.

The intended flow: on a new machine you tell its Claude Code agent *"install my Claude config from this repo"*, and it follows [Installing agent: do this](#installing-agent-do-this) below.

## What's here

| Path | What | Install handling |
|------|------|------------------|
| `skills/` | 17 personal skills (one folder each) | **additive copy** into `~/.claude/skills/` |
| `agents/` | 5 subagent definitions (`*.md`) | **additive copy** into `~/.claude/agents/` |
| `commands/` | 1 slash command (`*.md`) | **additive copy** into `~/.claude/commands/` |
| `settings.json` | plugin + hook + statusline + model config | **MERGE**, do not overwrite |
| `CLAUDE.md` | global instructions | **hands-off** — diff + merge by hand |
| `manifest.json` | machine-readable install spec (source→dest, merge keys, counts) | — |
| `install.ps1` / `install.sh` | mechanical installer (skills/agents/commands) | — |
| `backup.ps1` | refresh this repo from the current box | — |

Plugin **binaries are not stored** — they reinstall from their marketplace via `settings.json`. Secrets and session state are never committed (see `.gitignore`).

## Codex plugin

The Claude backup remains the source for `skills/`, `agents/`, and `commands/`.
The Codex-compatible distribution lives separately at
`plugins/amier-workflow-kit/` and is exposed for local testing through
`.agents/plugins/marketplace.json`.

Do not install the plugin alongside standalone Codex skills with the same names.
Codex does not merge same-named skills, so both copies can appear and drift.

---

## Installing agent: do this

You are a Claude Code agent asked to install this repo onto **this** box. Follow exactly. `manifest.json` is the machine-readable version of these steps.

**1. Run the mechanical installer** (copies `skills/`, `agents/`, `commands/` into `~/.claude/`; moves any same-named item to `~/.claude/install-backups/<timestamp>/<group>/<name>`).

Backups live outside `skills/`, `agents/`, `commands/` on purpose: a backup folder inside `skills/` loads as an extra skill. If an older installer left `*.bak-*` items inside those folders, move them into `~/.claude/install-backups/` or delete them.

- Windows / PowerShell: `./install.ps1`  (dry run first: `./install.ps1 -WhatIf`)
- macOS / Linux / bash: `bash install.sh`  (dry run first: `DRY_RUN=1 bash install.sh`)

**2. Merge `settings.json` — do NOT overwrite the target's file.**
Read this repo's `settings.json` and the target `~/.claude/settings.json`. Inject **only** these keys into the target, union-merging where the target already has them:

- `enabledPlugins`
- `extraKnownMarketplaces`
- `statusLine` — only if the target has none **and** the referenced path exists on this box.

Leave the target's `model`, `permissions`, `effortLevel`, and everything else untouched. The `statusLine` value is **box-specific**: it points at `...plugins/cache/caveman/caveman/<hash>/hooks/caveman-statusline.ps1` (a version hash + a Windows path). On a different box the hash differs, and on macOS/Linux the path is meaningless — if it does not resolve, **drop `statusLine`**. Caveman still works via the plugin without it.

**3. `CLAUDE.md` — hands-off.** Do NOT overwrite `~/.claude/CLAUDE.md`. Copy this repo's `CLAUDE.md` to `~/.claude/CLAUDE.md.from-repo` and tell the user to diff + merge manually — it holds per-person identity, token-rotation dates, and absolute paths that are wrong on another box.

**4. Plugins / hooks.** The caveman SessionStart hook and statusline come from the `caveman@caveman` marketplace plugin declared in `settings.json` (handled in step 2). After merging, tell the user to **restart Claude Code** — plugins reinstall automatically from `enabledPlugins` + `extraKnownMarketplaces`. There are no loose hook scripts to copy.

**5. Verify** against `manifest.json`:

- `~/.claude/skills/` contains the 17 folders in `manifest.skills`
- `~/.claude/agents/` contains 5 `*.md`
- `~/.claude/commands/` contains 1 `*.md`

Report: what was installed, what was backed up, and the `settings.json` / `CLAUDE.md` actions you took.

---

## Manual install (human)

Run the installer for your OS (step 1 above), then do the `settings.json` merge (step 2) and `CLAUDE.md` merge (step 3) yourself. Restart Claude Code.

## Refresh the backup (source box)

After changing your skills/agents/config on the source box, pull the current state back into this repo, then commit:

```bash
./backup.ps1
```

If skill/agent/command counts changed, bump them in `manifest.json`.

## Not synced (by design)

Secrets (`.credentials.json`, `*.key`, `*.pem`, `.env`), install-time backups (`install-backups/`), and Claude session state (`projects/ sessions/ tasks/ telemetry/ shell-snapshots/ file-history/`) are gitignored or simply never copied. Plugin binaries reinstall from the marketplace.
