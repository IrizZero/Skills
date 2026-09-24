---
name: plan-reviewer
description: Use to critique an implementation plan from superpowers:writing-plans before the user-review gate. Senior-dev lens. Surfaces blockers/warnings/suggestions with codebase-aware reasoning. Auto-trigger phrases include "review plan", "plan-reviewer", "critique plan". Advisory only — cannot override the superpower flow.
---

# Plan Reviewer

## Trigger

Invoked automatically at the end of the `superpowers:writing-plans` flow, after the plan is saved but before the user-review gate. May also be invoked manually by the user with phrases like "re-review the plan" or "run plan reviewer".

## Overview

A senior-developer review pass on an implementation plan, run by **two reviewers of different model lineage** for uncorrelated blind spots:

1. **Primary — `plan-reviewer` subagent (Claude opus).** Reads the plan plus the affected codebase files in its own context window, returns structured findings (Blockers / Warnings / Suggestions).
2. **Adversarial — Codex `gpt-6-sol` @ high effort.** A skeptic pass that runs AFTER the primary. It does a cold independent scan of the same plan, THEN critiques the primary's findings (confirm / refute / raise / lower). Different training lineage from opus, so it breaks lineage-correlated misses that context-isolation alone cannot.

The main thread (running the dominant superpower flow) then judges the reconciled finding set and writes a sidecar review file capturing the dialogue.

The skill is **advisory only**. It cannot override the superpower flow, edit the plan, or write the sidecar. The adversarial pass is **best-effort**: if Codex errors or times out, the skill falls back to opus-only findings and notes it — it never blocks the flow.

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
4. Receive the subagent's findings (single markdown message). Call this **findings-A**.
5. **Adversarial Codex pass (cold-scan-then-critique).** Best-effort; on any failure skip to step 7 with opus-only.
   - Assemble the prompt from the template in **Adversarial pass prompt** below: substitute the plan path, the affected-paths list, and **findings-A pasted verbatim** into the `FIRST REVIEWER FINDINGS` slot.
   - Write the assembled prompt to a scratchpad file, then invoke Codex passing it as an **argument** (never stdin — stdin hangs on Windows):
     ```bash
     codex exec -m gpt-6-sol -c model_reasoning_effort=high --sandbox read-only "$(cat <scratchpad>/plan-reviewer-codex-prompt.txt)"
     ```
     `--sandbox read-only` lets Codex read the agent spec, the plan, and the affected files itself; it needs no network and writes nothing.
   - **Model/effort is fixed at `gpt-6-sol` @ `high`.** This is within standing policy and needs no approval. Do NOT escalate to `xhigh` — sol@xhigh requires explicit owner approval first.
   - Codex returns **cold findings** (its own independent scan) plus **verdicts** on each findings-A line. Call this **findings-B**.
   - Failure handling: if the command errors, returns non-zero, times out, or emits no parseable schema block, discard findings-B, set a `codex_failed` note, and continue with opus-only.
6. **Reconcile** findings-A and findings-B into one set for the main thread:
   - Keep every findings-A line; annotate it with the Codex verdict (`CONFIRM` / `REFUTE` / `RAISE` / `LOWER` / `— no verdict` if Codex failed).
   - Append each Codex cold finding NOT already covered by a findings-A line (dedupe by `file:line` or plan-section), tagged `[sol]`.
   - Tag findings-A lines that Codex independently raised too as `[both]` — highest confidence.
7. Return the reconciled set to the main thread, prefaced with a one-line summary count (e.g. "4 findings: 1 blocker [both], 1 warning, 2 suggestions [1 sol-only]; codex: ok"). If `codex_failed`, the summary says `codex: failed — opus-only`.
8. End with the sentinel `[expert-consult-complete]`.

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

## Adversarial pass prompt

Assemble this verbatim, substituting `<plan_path>`, `<affected_paths>`, and the `FIRST REVIEWER FINDINGS` slot (findings-A pasted in full). The two phases MUST stay ordered — the cold scan happens before Codex sees the primary findings, which is what preserves independent recall.

```
You are an adversarial second reviewer of an implementation plan. A first reviewer (Claude opus) has already produced findings. Do the two phases below IN ORDER. Do not read the first reviewer's findings until Phase 1 is finished.

Reviewer spec — read this file in full and follow it for what counts as a finding, the severity tiers (Blocker/Warning/Suggestion), and the finding-line format:
  ~/.claude/agents/plan-reviewer.md

Target plan: <plan_path>
Affected files: <affected_paths>   (if blank, detect filesystem-shaped paths from the plan body)

PHASE 1 — COLD SCAN (before reading the findings below):
Review the plan yourself from scratch. Read the plan and every affected file. Build your own independent findings list using the spec's severity tiers and line format.

PHASE 2 — CRITIQUE:
Now read the first reviewer's findings (below). For EACH line emit exactly one verdict with evidence:
  CONFIRM — real, <why + file:line>
  REFUTE  — false positive or non-issue, <why + file:line>
  RAISE   — severity too low, <why>
  LOWER   — severity too high, <why>

FIRST REVIEWER FINDINGS:
<findings-A verbatim>

OUTPUT — emit ONLY this, no preamble, no closing remarks:

## Cold findings (independent)

### Blockers
- [B1] <file:line if applicable> — <problem>. <suggested fix>.

### Warnings
- [W1] <file:line if applicable> — <problem>. <suggested fix>.

### Suggestions
- [S1] <file:line if applicable> — <improvement>. <suggested fix>.

## Verdicts on first reviewer
- [B1] <CONFIRM|REFUTE|RAISE|LOWER> — <reason + file:line>
- [W1] <CONFIRM|REFUTE|RAISE|LOWER> — <reason + file:line>

[expert-consult-complete]
```

Parse the two blocks out of Codex stdout. Cold-finding lines match the same `^- \[(B|W|S)\d+\]` regex; verdict lines match `^- \[(B|W|S)\d+\] (CONFIRM|REFUTE|RAISE|LOWER)`. If neither block parses, treat as a Codex failure (step 5 fallback).

## Verdict policy (for the main thread, not the skill)

After the skill returns findings, the main thread (writing-plans persona) judges each finding. Verdicts MUST include justification with evidence:

- `ACCEPT — <reason + file:line evidence>` — main thread agrees; applies fix to the plan.
- `DISMISS — <reason + evidence why the finding is wrong or irrelevant>` — main thread judges the finding incorrect or already covered.
- `DEFER — <reason + what the user must decide>` — main thread uncertain; surfaces to the user at the standard review gate.

Bare verdicts are forbidden. Each verdict must justify itself.

**Codex verdict as evidence.** Each opus finding now carries a Codex verdict; each Codex cold finding is tagged `[sol]` or `[both]`. Weigh them:
- `[both]` (both models raised it independently) — strong signal; DISMISS only with explicit counter-evidence.
- Codex `REFUTE` with `file:line` — treat as a real dismissal argument. The main thread still adjudicates, but a bare "opus said so" is no longer enough to ACCEPT over a cited refutation; engage the refutation on its evidence.
- Codex `RAISE` / `LOWER` — adjust the severity you triage at if the reasoning holds.
- `[sol]`-only cold findings — triage exactly like any other finding (ACCEPT / DISMISS / DEFER with evidence).
- When Codex failed (`— no verdict` on every line), triage findings-A as before; note the missing adversarial pass so the confidence bar is understood.

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
- The `plan-reviewer` subagent definition lives at `agents/plan-reviewer.md` (source), deployed to `~/.claude/agents/plan-reviewer.md`. Claude Code's agent loader resolves `subagent_type: plan-reviewer` by name to that file. The adversarial Codex pass reads that same file as its spec, so the two reviewers share one source of truth — no persona to keep in sync.
- The adversarial Codex pass runs `--sandbox read-only`: it reads the spec, plan, and affected files but writes nothing and needs no network. It is best-effort and never blocks the flow. Invoke Codex directly via `codex exec` with the prompt as an argument — never the background/companion runtime (it deadlocks on Windows).
