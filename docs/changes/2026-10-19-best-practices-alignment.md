# 2026-10-19 - Best-practices alignment

The config was compared with the Claude Code best-practices page (`https://code.claude.com/docs/en/best-practices`), then checked with `/doctor prompt-audit`.
This note lists what changed in this snapshot and why.
The audit report itself lives with the project it was run from (ODS repo, `docs/audit-2026-10-19-prompt/report.md`).

## Why

- CLAUDE.md is advisory; hooks are deterministic. Rules that must hold every time move into hooks.
- Instruction text that contradicts other files or the code makes the model pick one at random. Stale facts are worse than missing ones.
- Context fills fast and quality drops as it does. Show context use, and load guidance only when it is needed.

## What changed

**Hooks (new `hooks/`, wired in `settings.json`):**

- `guard.js` (PreToolUse on Bash, PowerShell, Edit, Write, MultiEdit, NotebookEdit) blocks:
  - Codex models other than the three `gpt-6-*` slugs
  - a `Co-Authored-By` trailer on commits
  - IIS, app pool and Windows service commands
  - non-loopback dev-server binds
  - env dumps and echoing secret-named variables
  - `ConvertFrom-Json` on appsettings
  - Edit/Write on `CHANGELOG.md`

  It asks first for `gpt-6-astra`, or `gpt-6-sol` at xhigh/max/ultra. It understands wrapper commands (`timeout 1200 codex exec ...`) and fails open on its own errors.
- `serena-notice.js` (SubagentStart for `general-purpose`, `claude` and `Plan`) injects the Serena code-navigation note when the repo's `.mcp.json` lists Serena, plus a worktree caveat.

**Status line (new `statusline.js`):** shows the caveman badge (same safety checks as the plugin's script) and `ctx NN%` (grey, yellow from 50%, red from 75%). It replaces the plugin-cache path, which broke on every caveman update.

**Skills:**

- New `codex-exec`: the how-to for `codex exec` (`</dev/null`, prompt from a file, non-interactive preamble, sandbox limits, checks after edit runs). CLAUDE.md now points to it instead of carrying the details.
- `handoff`: prints to chat; writes a file only when the user names a path or says save.
- `plan-reviewer`, `solution-auditor`: their Codex commands end in `</dev/null` (the documented stdin hang).
- `yagni-guardian`, `ui-ux-advisor`: removed stale claims (gitignored sidecars, a "deeper review" mode that does not exist, `ui-ux-init` called "deferred").

**Global CLAUDE.md (`snapshot/CLAUDE.md`):**

- Each hook-enforced Fixed rule names its hook. The Serena subagent section points to the hook.
- New "Compaction" line: what to keep when the context is compacted.
- Overrides for plugin behavior, since plugin files are overwritten on update:
  - the AskUserQuestion picker stays off even when a skill asks for it
  - review subagents run on Opus, and `caveman:cavecrew-reviewer` is not used
  - caveman compresses chat replies only, never docs or prompts
  - skills are invoked when they clearly fit, not on superpowers' "1% chance"
  - the plan's "Not yet specified" section is exempt from writing-plans' placeholder rules

**Caveman default (outside `~/.claude`, not in this repo):** `%APPDATA%\caveman\config.json` sets `"defaultMode": "off"`. Turn it on with `/caveman full`; a bare `/caveman` stays off.

**Backup tooling:** `backup.ps1` now mirrors `hooks/` and copies `statusline.js`. `manifest.json` and the README cover installing them.

## Still open

- **Audit cleanup batch.** Medium-priority wording and history fixes are not applied yet. They touch these files here:
  - the CLAUDE.md PAT-date line
  - the `ui-ux-init` agent and skill
  - `plan-reviewer`'s "deeper review" note
  - `yagni-guardian`'s recursion guard
  - three skill descriptions (`database-expert`, `ui-ux-advisor`, `solution-auditor`)
  - `database-expert` knowledge section
  - `decisions`, `brain-to-docs`, `folder-specific-claude-and-agents-md`, `teach`
- **Installers.** `install.ps1` and `install.sh` still copy only `skills/`, `agents/` and `commands/`. The installing agent copies `hooks/` and `statusline.js` (README step 4).
