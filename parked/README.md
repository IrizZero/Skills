# Parked

Kept in the repo, never installed. `install.ps1`, `install.sh` and `backup.ps1` only touch `skills/`, `agents/`, `commands/`, `hooks/`, `snapshot/`, `settings.json` and `statusline.js`, so nothing here reaches a box or gets overwritten by a backup.

## What is here (parked 2026-10-20)

| Path | What |
|---|---|
| `skills/plan-reviewer/`, `skills/solution-auditor/`, `skills/yagni-guardian/` | Claude Code skills |
| `agents/plan-reviewer.md`, `agents/solution-auditor.md`, `agents/yagni-guardian.md` | their Claude Code subagents |
| `codex-kit-skills/<same three>/` | their copies from the Codex plugin `plugins/amier-workflow-kit/skills/` |
| `superpowers-hooks.md` | the "Superpowers flow hooks" instructions that wired them (and the fog-of-war plan rules) into superpowers flows, from `snapshot/CLAUDE.md` and the Codex global `AGENTS.md` |

## Why

All three are add-ons to superpowers flows: solution-auditor ran at brainstorming "step 4", plan-reviewer and yagni-guardian ran after writing-plans.
Superpowers 7.0.0 rewrote brainstorming and writing-plans, so those step numbers and gates no longer exist.
The owner chose to start fresh from plain superpowers 7.0 on the new laptop (RPS-MV-L-5101) instead of re-fitting the add-ons.

## Restore one

1. `git mv parked/skills/<name> skills/<name>` and `git mv parked/agents/<name>.md agents/<name>.md`.
2. For Codex: `git mv parked/codex-kit-skills/<name> plugins/amier-workflow-kit/skills/<name>`, then reinstall the kit (`codex plugin remove` / `codex plugin add amier-workflow-kit@amier-skills-repo`).
3. Re-fit the matching hook text from `superpowers-hooks.md` to the current superpowers flow, and add it to the global CLAUDE.md / AGENTS.md.
4. Update `manifest.json` (`counts`, `skills`, `agents`, `parked`), the README counts and the kit's `plugin.json` description.
