---
name: yagni-guardian
description: Use to audit an implementation plan for YAGNI violations — speculative abstractions, dead config flags, scope creep, single-caller wrappers, premature optimization, duplicate utilities, defensive code for impossible states. Invoke manually with "yagni check", "yagni audit", "yagni-guardian", or "run yagni" — most often at the end of superpowers:writing-plans, after plan-reviewer and before approving the plan, but also standalone against any plan file. Reach for this whenever a plan looks over-engineered, adds an abstraction or config knob with only one caller, or grows past its spec. Advisory only — surfaces per-finding cuts + a density tier (NONE/SOFT/HARD); never blocks the flow.
---

# YAGNI Guardian

## Trigger

1. **Manual — the reliable path.** The user types "yagni check", "yagni audit", "yagni-guardian", or "run yagni", most often at the end of the `superpowers:writing-plans` flow: after `plan-reviewer` has fired and before approving the plan. The skill resolves the plan automatically (most-recent under `docs/superpowers/plans/`) or from an explicit path argument.
2. **Standalone.** Invoked outside any `superpowers:*` flow against a user-supplied path, or fallback to the most-recent plan.
3. **Auto-inject from writing-plans — NOT wired in v1.** Description-only auto-fire was tested at this exact gate (`fixtures/test-log.md`, Task 10, 2026-05-22) and FAILED — `plan-reviewer` fired automatically, `yagni-guardian` did not. Reliable auto-fire would require a hook block in `~/.claude/CLAUDE.md` (snippet in the design spec, Section 9), and that hook is deliberately NOT installed: manual invocation is the chosen v1 workflow (keeps global `CLAUDE.md` lean; explicit invocation is preferred for an advisory tool). Until a hook is added, do not assume this skill fires on its own — if you reach the writing-plans approval gate, prompt the user to run `yagni check`.

## Overview

A thin wrapper around the `yagni-guardian` subagent. The subagent runs in a fresh opus context window (real independence), reads the plan + originating spec + affected files, scores 7 YAGNI signals (Y1–Y7), applies 5 robustness carve-outs, and emits a per-finding list plus density tier (NONE / SOFT / HARD). The main thread judges each finding ACCEPT / DISMISS / DEFER and writes a sidecar `<plan>.yagni.md` capturing verdicts.

The skill is **advisory only**. It cannot override or block the writing-plans flow. HARD tier emits stronger language but does NOT gate the user-review step.

## How it works

1. **Detect context.** Determine whether invocation is auto/manual inside `superpowers:writing-plans` or standalone outside any flow. If the user said "skip yagni" earlier this session, abort with the sentinel + one-line note.
2. **Resolve plan path:**
   - Explicit arg → use it.
   - Otherwise pick the most recently modified `*.md` file under `docs/superpowers/plans/`, excluding `*.review.md` and `*.yagni.md` sidecars.
   - If no plan can be resolved, abort with a one-line error and the sentinel.
3. **Resolve spec path:**
   - Plan frontmatter `Spec reference:` link OR `## Spec` section → use it.
   - Else: topic-slug match in `docs/superpowers/specs/`.
   - None found → `spec_path: null`; subagent skips Y4 and notes in Context inspected.
4. **Parse plan for `## Affected files` section.** If absent, fall back to grep-detecting filesystem-shaped paths in the plan body.
5. **Build the input packet** (markdown shape below).
6. **Dispatch the `yagni-guardian` subagent** via the Agent tool:
   - `subagent_type: yagni-guardian`
   - `model: opus` — pinned by the subagent's frontmatter; do not override.
   - `description: "YAGNI audit: <topic>"`
   - `prompt`: input packet markdown + an instruction to follow the strict output schema.
7. **Receive the subagent's output** (single markdown message).
8. **Validate the output** — see "Output handling" below.
9. **Format the injection block** and emit it into the writing-plans flow.
10. **End with the sentinel** `[expert-consult-complete]` so writing-plans resumes.

## Input packet shape (passed to the subagent)

```markdown
# YAGNI audit request

## plan_path
<absolute or repo-relative path to plan file>

## spec_path
<path to spec, or "null">

## affected_paths
- <path 1>
- <path 2>
- ...

## prior_review_sidecar
<path to *.yagni.md from prior run, or "null">

## instructions
Score Y1–Y7 against the rubric in your subagent definition. Apply the 5 robustness carve-outs as hard exclusions. Compute tier from count + signal mix. Follow the output schema exactly. End with `[expert-consult-complete]`.
```

## Output handling

Validation checks:

- Three required sections present: `## YAGNI Audit`, `### Findings`, `### Context inspected`.
- Tier line present with value in `{NONE, SOFT, HARD}`.
- Count line present with non-negative integer.
- `Y4 status` line present with value `scored` or `skipped — no spec resolved`.
- Sentinel `[expert-consult-complete]` present at the end.
- Each finding line matches `^- \[Y[1-7]\]`.
- Signal token in each finding is one of the 7 canonical labels.

If any check fails, pass the output verbatim with a one-line warning prefix: "yagni-guardian output malformed — raw output below." Then emit the sentinel. The writing-plans flow continues vanilla.

If all checks pass, format the injection block:

```markdown
> **Independent YAGNI audit** (from yagni-guardian subagent, opus, fresh context)
>
> **Tier:** <NONE | SOFT | HARD> — <N findings>
> <if the subagent reports Y4 was not scored, add this line verbatim: **⚠ Scope check skipped:** no spec resolved, so Y4 (feature-outside-request) was not evaluated — a NONE/SOFT tier here does NOT clear scope creep.>
>
> <findings list verbatim, if any>
>
> <context-inspected footer verbatim>
>
> **Suggested next step:** <one line — see below>
```

The subagent signals a skipped scope check by emitting a `**Y4 status:**` line (see the subagent's output schema) and logging "Y4 skipped: no spec" in Context inspected. When present, the `⚠ Scope check skipped` line is REQUIRED in the injection block — Y4 is the only signal that escalates straight to HARD, so a clean tier reached without it is not the same as a clean tier with it. Do not let a NONE/SOFT result lull the user into approving a plan whose scope was never checked against a spec.

Suggested-next-step copy:
- NONE → "No YAGNI findings. Plan scope and abstractions look tight." (If the scope check was skipped, instead: "No YAGNI findings in Y1–Y3, Y5–Y7 — but scope was not checked (no spec). Confirm the plan matches your intent before approving.")
- SOFT → "Consider cutting flagged items before implementing. Each finding above shows the cut."
- HARD → "Scope creep or significant bloat detected. Resolve Y4 / high-density findings before approving plan."

## Verdict policy (for the main thread, not the skill)

After the skill returns findings, the main thread judges each one with justification:

- `ACCEPT — <reason + evidence>` — main thread agrees; applies cut to the plan.
- `DISMISS — <reason + evidence why the finding is wrong or covered by a carve-out>` — main thread judges the finding incorrect or already justified.
- `DEFER — <reason + what the user must decide>` — main thread uncertain; surfaces to the user at the standard review gate.

Bare verdicts are forbidden. Each verdict must justify itself.

The main thread writes the sidecar `<plan>.yagni.md` with one entry per finding capturing the verdict. Sidecars are gitignored — `.gitignore` covers `docs/superpowers/plans/*.yagni.md`, alongside the matching `.review.md` rule.

## Integration with superpowers

This skill is invoked from the `superpowers:writing-plans` flow.

**Sentinel:** Always ends with `[expert-consult-complete]` to return control to the dominant superpower flow.

**Forbidden while inside a superpower flow:**
- Overriding or blocking the writing-plans flow.
- Auto-promoting to a heavier output tier (no full reports while inside the flow).
- Gating the user-review step on a failed audit. HARD tier emits stronger language only.
- Suggesting that writing-plans or plan-reviewer be re-run on the skill's own authority.

**If heavier output is warranted:**
1. Deliver the lightweight per-finding + tier output inline.
2. Append a one-line note: "Standalone deeper review available by invoking `yagni-guardian` outside the superpower flow."
3. Return the sentinel.

**User escape phrases inside a flow:**
- "skip yagni" / "skip yagni this session" — disables auto-injection for the current session.
- "yagni check" / "yagni audit" / "run yagni" — re-invokes the skill mid-flow.

## Per-session skip

If the user says "skip yagni" or equivalent, the main thread MUST remember this for the duration of the current Claude Code session and skip future auto-injections until the session ends. In-memory only — no file written, no setting persists. A fresh session restores default behavior.

## Standalone mode

When invoked outside any `superpowers:*` flow:

- `prior_review_sidecar` field is set to `null` — fresh audit every time.
- No sidecar `<plan>.yagni.md` written — standalone is exploratory.
- Main thread does NOT produce ACCEPT/DISMISS verdicts. User reads, decides directly.
- Output shape is identical to inside-flow (per-finding + tier).
- The standalone response does NOT need to end with the sentinel — there is no superpower flow to hand back to. Emitting it is harmless.

## Boundary rules

- The skill is **read-only** — never edits plan, code, or any file.
- The dispatched subagent has only `Read`, `Grep`, `Glob`, `Bash` tools. Bash is constrained to inspection commands (`git log`, `git diff`, directory listing). No build / test / install / deploy.
- The skill **always** returns control via the sentinel, even on error. Never hang the superpower flow.
- The `yagni-guardian` subagent definition lives at `agents/yagni-guardian.md` and is installed to `~/.claude/agents/yagni-guardian.md` by `deploy.ps1`.

## Recursive invocation

If the skill is invoked from within a `yagni-guardian` subagent context (an agent tries to call the skill), abort immediately with an error message and the sentinel. The reviewer cannot self-invoke.

[expert-consult-complete]
