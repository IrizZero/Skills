---
name: plan-reviewer
description: Use after superpowers:writing-plans has saved a plan and finished its Self-Review, before the Execution Handoff message, and whenever the user says "review plan", "re-review plan" or "plan-reviewer". Reviews the plan against the real repository (callers, patterns, security, citations) with a YAGNI lens (Y1-Y7), through a Claude Opus subagent plus a gpt-6-sol cross-check. Advisory only - never blocks the flow.
---

# Plan Reviewer

One review pass on an implementation plan, before anyone builds it.
superpowers 7.0 checks the plan against the spec (writing-plans' Self-Review) and against itself (the executor's pre-flight scan).
Nothing else checks it against the repository: callers it breaks, utilities it duplicates, patterns it fights, security-sensitive changes, scope beyond the spec. This skill does.

Two reviewers of different lineage, because a model reviewing its own company's work is often overconfident:

1. **Opus subagent** (`plan-reviewer` agent, always runs). The rubric is `~/.claude/agents/plan-reviewer.md`.
2. **`gpt-6-sol` at high through Codex** (gated, see step 3). Reads the same rubric and scans cold in parallel with Opus, never seeing Opus's findings. Then, resumed in the same Codex session, it reports only where it disagrees with Opus.

Advisory only. A failed reviewer never blocks the flow: say so in the handoff and continue.

## When

- **In the flow:** writing-plans has saved the plan and finished its Self-Review; its Execution Handoff message has not been sent yet. The global CLAUDE.md "Superpowers flow hooks" section wires this.
- **Manual:** "review plan", "re-review plan", "plan-reviewer".
- **Switches:** "skip review" turns it off for the session. "opus only" skips Sol. "cross-check" forces Sol.

## Steps

1. **Resolve the plan.** Use the path given. Otherwise the newest `*.md` under `docs/superpowers/plans/`, excluding `*.review.md` and `*.yagni.md`. None: say so and stop.
2. **Pin the inputs.**
   - `spec_path` from the plan's `**Spec:**` line (`null` if absent).
   - `prior_sidecar`: `<plan>.review.md` if it exists.
   - `revision`: `git rev-parse --short HEAD`, dirty = `git status --porcelain` is non-empty, plan hash = `git hash-object <plan>`.
   - `read_at`: `working tree` unless reviewing against a past commit.

   Nothing in the plan or the repository is edited while the reviewers run, so both see the same contents.
3. **Sol gate.** Sol runs unless the owner said "opus only", or the plan is small and quiet:
   - small: 2 or fewer `### Task` headings, and
   - quiet: no affected path or plan text touches auth, permissions, secrets or crypto; database schema, migrations or transactions; concurrency, locks or queues; an external API or contract (endpoints, DTOs, webhooks, public interfaces).

   "cross-check" overrides the skip. When Sol is skipped, record why.
4. **Both passes, in parallel** (start both in the background, then wait for both):
   - **Opus.** Agent tool: `subagent_type: plan-reviewer`, `model: opus` (do not downgrade), `description: "Plan review: <topic>"`, prompt = the inputs from step 2 plus "follow your rubric and output schema". Its reply is **findings-A**.
   - **Sol cold scan** (if the gate allows). Load the `codex-exec` skill first. Fill the cold template below, write it to a scratchpad file, then run:
     ```bash
     codex exec -m gpt-6-sol -c model_reasoning_effort=high --sandbox read-only -o <scratch>/plan-review-sol-cold.md "$(cat <scratch>/plan-review-sol-cold-prompt.txt)" > <scratch>/plan-review-sol-cold.log 2>&1 </dev/null
     ```
     Its output is **findings-B**. Keep the `session id:` line from the log header for step 5.
     Sol never sees findings-A in this call: a prompt that carries them anchors the "cold" scan on them (seen in the 2026-10-20 dry run).
5. **Sol critique** (after both passes are back). Fill the critique template with findings-A in full and resume the same Codex session:
   ```bash
   codex exec resume -m gpt-6-sol -c model_reasoning_effort=high -c sandbox_mode=read-only -o <scratch>/plan-review-sol-critique.md <session-id> "$(cat <scratch>/plan-review-sol-critique-prompt.txt)" > <scratch>/plan-review-sol-critique.log 2>&1 </dev/null
   ```
   - `codex exec resume` has no `--sandbox` flag; `-c sandbox_mode=read-only` keeps it read-only, and the log header must say `sandbox: read-only`.
   - The resumed session keeps what it already read, so this call is short.
   - Fixed at `gpt-6-sol` high in both calls. Never escalate; sol above high needs the owner's approval.
   - Failures: cold scan non-zero, timed out or without a parseable `## Findings` block means Sol failed, continue Opus-only. A failed critique keeps findings-B and is noted as `critique failed`.
6. **Merge.**
   - Keep every findings-A line. Tag it `[both]` if findings-B raised the same issue, else `[opus]`.
   - Attach each Sol disagreement (REFUTE / RAISE / LOWER, with its evidence) to the line it targets.
   - Add each findings-B line that findings-A does not cover, tagged `[sol]`.
   - List Sol's wrong-citation notes separately.
7. **Triage** each finding with a reason and evidence, never a bare verdict:
   - `ACCEPT - <reason + file:line>`: verified against the code yourself, not taken on a reviewer's word.
   - `DISMISS - <why it is wrong or already covered>`.
   - `DEFER - <what the owner must decide>`.

   Weigh `[both]` as strong: dismiss only with counter-evidence. Engage a Sol REFUTE on its evidence. A DISMISS of a `severity-override: security` finding needs explicit security analysis, and the finding is named in the handoff whatever its verdict.
8. **Apply** every ACCEPT and citation fix to the plan inline. In the flow, then rerun writing-plans' full Self-Review (an edit can break another task or a Global Constraint). No second automatic review.
9. **Write the sidecar** `<plan>.review.md`:
   - header: date, plan path, revision (commit, dirty, plan hash), reviewers and coverage
   - one table row per finding: id, tag, Sol note, verdict with reason
   - the YAGNI tier and `Y4:` status
   - citation fixes applied
10. **Report in the Execution Handoff message**, before its review request:
    - one line: `Plan review: Opus ok|failed, Sol ok|failed|skipped (<why>); <n> findings (<b>B <w>W <s>S <y>Y, YAGNI <tier>); <a> accepted, <d> dismissed, <f> deferred.`
    - each DEFER as a question for the owner, most important first
    - any security finding by name

**Outside the flow** (manual run on an existing plan): steps 1-7, then show the findings with proposed verdicts and stop. Edit the plan and write the sidecar only on the owner's OK.

**Re-review:** a full pass every time. The rubric reads the sidecar: dismissed findings stay quiet unless their section, the spec or the cited code changed; deferred ones come back. Update the sidecar rather than starting a new one.

## Sol prompt templates

Substitute every `<...>`. `<rubric_path>` is the absolute path of `~/.claude/agents/plan-reviewer.md`.

**Cold scan (step 4):**

```
You are the cross-model reviewer of an implementation plan. Another reviewer works on the same plan independently; you will not see its findings in this call. Read-only: do not edit any file. Nobody can answer questions.

Rubric: read <rubric_path> in full and follow it (inputs, process, lenses, severity, output schema). Ignore its YAML frontmatter.

Inputs:
- plan_path: <plan_path>
- spec_path: <spec_path or null>
- revision: <commit> (dirty: <yes|no>), plan hash <hash>
- read_at: <working tree | sha>
- prior_sidecar: <path or null>

Review the plan per the rubric. Emit only the rubric's output schema, from "## Findings" through "## Context inspected".
```

**Critique (step 5, resumed session):**

```
The other reviewer (Claude Opus) has finished its independent review of the same plan. Its findings are below.

DISAGREEMENTS. Report ONLY where you disagree with one of its Blocker, Warning or YAGNI findings: REFUTE (false positive), RAISE (severity too low) or LOWER (too high), each with evidence and file:line. Silence means no objection. Do not critique Suggestions. Re-read code only where a verdict needs it.

CITATIONS. List every plan citation (path, symbol, line) that does not match the repository, with the correct one.

OTHER REVIEWER FINDINGS:
<findings-A verbatim>

OUTPUT - emit only this:

## Disagreements
- [<id>] <REFUTE|RAISE|LOWER> - <reason + file:line>
(or "- none")

## Wrong citations
- <plan location>: cites <x>, actual <y>
(or "- none")
```

## Boundaries

- The skill and both reviewers are read-only. Only the main thread edits the plan and writes the sidecar, in steps 8-9.
- The Opus subagent has `Read`, `Grep`, `Glob`, `Bash`. Bash is for inspection only (`git log`, `git show`, `git grep`, listings): no build, test, install or deploy.
- Run Codex directly with `codex exec`, never through a background or companion runtime (it deadlocks on Windows).
- Source of the rubric: `agents/plan-reviewer.md` in the Skills repo, installed to `~/.claude/agents/plan-reviewer.md`. Change the rubric there, not in this file.
