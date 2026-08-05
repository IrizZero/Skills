---
name: plan-reviewer
description: Use to critique an implementation plan from superpowers:writing-plans before the user-review gate. Senior-dev lens. Surfaces blockers/warnings/suggestions with codebase-aware reasoning. Auto-trigger phrases include "review plan", "plan-reviewer", "critique plan". Advisory only — cannot override the superpower flow.
---

# Plan Reviewer

## Trigger

Invoked automatically at the end of the `superpowers:writing-plans` flow, after the plan is saved but before the user-review gate. May also be invoked manually by the user with phrases like "re-review the plan" or "run plan reviewer".

## Overview

A senior-developer review pass on an implementation plan. The skill is a thin wrapper around the `plan-reviewer` subagent. The subagent reads the plan plus the affected codebase files (in its own context window), then returns structured findings (Blockers / Warnings / Suggestions). The main thread (running the dominant superpower flow) judges every finding itself and writes a sidecar review file capturing the dialogue.

The skill is **advisory only**. It cannot override the superpower flow, edit the plan, or write the sidecar.

## How it works

1. Resolve the target plan:
   - If the main thread provides an explicit plan path, use that.
   - Otherwise pick the most recently modified `*.md` file under `docs/superpowers/plans/`, excluding sidecars (`*.review.md`, `*.yagni.md`).
   - If no plan can be resolved, abort with a one-line error and the sentinel.
2. Parse the plan for an `## Affected files` section if present. Otherwise fall back to grep-detecting filesystem-shaped paths in the plan body.
3. Dispatch the `plan-reviewer` subagent via the Agent tool:
   - `subagent_type: plan-reviewer`
   - `model: opus` — the reviewer MUST use the strongest available model. Review accuracy beats cost here. Cheaper models have produced false positives in practice (misreading markdown-table-escape rendering as file content, flagging intentionally-empty sections, etc.). Do not downgrade this.
   - `description: "Plan review: <topic>"`
   - `prompt`: includes the plan path, affected paths list, and an instruction to follow the strict output schema (defined below).
4. Receive the subagent's findings (single markdown message).
5. Return the findings to the main thread verbatim, prefaced with a one-line summary count (e.g. "3 findings: 1 blocker, 1 warning, 1 suggestion").
6. End with the sentinel `[expert-consult-complete]`.

## Output schema (subagent → skill)

The subagent must return markdown matching this exact structure:

```markdown
## Findings

### Blockers
- [B1] <file:line if applicable> — <problem>. <suggested fix>.

### Warnings
- [W1] <file:line if applicable> — <problem>. <suggested fix>.

### Suggestions
- [S1] <file:line if applicable> — <improvement>. <suggested fix>.

## Context inspected
- Read: <files read>
- Grep: <patterns searched>
- Missing: <files referenced by plan that don't exist, if any>
```

Each finding line MUST match the regex `^- \[(B|W|S)\d+\]`. Sections may be empty but headers must always be present.

If the subagent returns malformed output, pass it through verbatim with a one-line warning prefix; do not silently fix. The main thread handles malformed cases.

## Verdict policy (for the main thread, not the skill)

After the skill returns findings, the main thread (writing-plans persona) judges each finding. Verdicts MUST include justification with evidence:

- `ACCEPT — <reason + file:line evidence>` — main thread agrees; applies fix to the plan.
- `DISMISS — <reason + evidence why the finding is wrong or irrelevant>` — main thread judges the finding incorrect or already covered.
- `DEFER — <reason + what the user must decide>` — main thread uncertain; surfaces to the user at the standard review gate.

Bare verdicts are forbidden. Each verdict must justify itself.

Special case: any finding tagged `severity-override: security` must, on DISMISS, include explicit security analysis (not "looks fine"). The main thread must also escalate the security finding in the chat summary regardless of verdict.

## Integration with superpowers

This skill is invoked from the `superpowers:writing-plans` flow.

**Sentinel:** Always ends with `[expert-consult-complete]` to return control to the dominant superpower flow.

**Forbidden while inside a superpower flow:**
- Overriding the superpower flow.
- Auto-promoting to a heavier output tier (no FULL reports or multi-step audits while inside the flow).
- Blocking the user-review gate on a failed review.
- Suggesting a re-run of brainstorming or writing-plans on its own authority — only the user or the superpower flow decides that.

**If heavier output is warranted:**
1. Deliver the lightweight version (findings + summary count) inline.
2. Append one line: "Standalone deeper review available by invoking `plan-reviewer` outside the superpower flow."
3. Return the sentinel.

**User escapes:** If the user says "skip review", "skip plan review", or "exit reviewer", abort and return the sentinel. The writing-plans flow continues without the reviewer.

## Boundary rules

- The skill is **read-only** — it never edits the plan or writes the sidecar. Those are main-thread responsibilities.
- The dispatched subagent has only `Read`, `Grep`, `Glob`, `Bash` tools. Bash is constrained to inspection commands (`git log`, `git diff`, `ls`-equivalents). No build / test / install / deploy.
- The skill **always** returns control via the sentinel, even on error. Never hang the superpower flow.
- The `plan-reviewer` subagent definition lives at `agents/plan-reviewer.md` (source), deployed to `~/.claude/agents/plan-reviewer.md`. Claude Code's agent loader resolves `subagent_type: plan-reviewer` by name to that file.

[expert-consult-complete]
