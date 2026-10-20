# Parked

Kept in the repo, never installed. `install.ps1`, `install.sh` and `backup.ps1` only touch `skills/`, `agents/`, `commands/`, `hooks/`, `snapshot/`, `settings.json` and `statusline.js`, so nothing here reaches a box or gets overwritten by a backup.

## What is here (parked 2026-10-20)

| Path | What |
|---|---|
| `skills/solution-auditor/`, `skills/yagni-guardian/` | Claude Code skills |
| `agents/solution-auditor.md`, `agents/yagni-guardian.md` | their Claude Code subagents |
| `codex-kit-skills/<same two>/` | their copies from the Codex plugin `plugins/amier-workflow-kit/skills/` |
| `superpowers-hooks.md` | the old "Superpowers flow hooks" instructions that wired the add-ons (and the fog-of-war plan rules) into superpowers flows, from `snapshot/CLAUDE.md` and the Codex global `AGENTS.md` |

## Why

All three add-ons hooked into superpowers flows: solution-auditor ran at brainstorming "step 4", plan-reviewer and yagni-guardian ran after writing-plans.
Superpowers 7.0.0 rewrote brainstorming and writing-plans, so those step numbers and gates no longer exist.
The owner chose to start fresh from plain superpowers 7.0 on the new laptop (RPS-MV-L-5101) instead of re-fitting the add-ons.

## Restored: plan-reviewer (2026-10-20)

plan-reviewer is back in `skills/`, `agents/` and `plugins/amier-workflow-kit/skills/`, re-fitted to superpowers 7.0.
It runs after writing-plans' Self-Review, before the Execution Handoff, as one Opus pass plus a gated `gpt-6-sol` cross-check.
Its new hook text lives in `snapshot/CLAUDE.md` and the Codex global `AGENTS.md`, not in `superpowers-hooks.md`.

yagni-guardian's review now runs inside plan-reviewer as its YAGNI lens. What moved:

- the 7 signals Y1-Y7 (speculative abstraction, single-caller wrapper, dead config flag, feature outside request, premature optimization, existing utility, defensive code), with their flag / do-not-flag rules and cut shapes;
- the 5 robustness carve-outs;
- the NONE / SOFT / HARD tier rule, and the Y4 skipped-without-spec warning;
- one fixture, rewritten in 7.0 format as `skills/plan-reviewer/fixtures/yagni-bloat/`.

What did not move: the separate agent, the `.yagni.md` sidecar (findings now go into the one `.review.md`), the `[expert-consult-complete]` sentinel and the standalone "yagni check" mode.
yagni-guardian stays here as the reference copy. Do not restore it next to plan-reviewer: the two would review the same signals twice.
The fog-of-war plan rules in `superpowers-hooks.md` stay parked.

## Restore one

1. `git mv parked/skills/<name> skills/<name>` and `git mv parked/agents/<name>.md agents/<name>.md`.
2. For Codex: `git mv parked/codex-kit-skills/<name> plugins/amier-workflow-kit/skills/<name>`, then reinstall the kit (`codex plugin remove` / `codex plugin add amier-workflow-kit@amier-skills-repo`).
3. Re-fit the matching hook text from `superpowers-hooks.md` to the current superpowers flow, and add it to the global CLAUDE.md / AGENTS.md.
4. Update `manifest.json` (`counts`, `skills`, `agents`, `parked`), the README counts and the kit's `plugin.json` description.
