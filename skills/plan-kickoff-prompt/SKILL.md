---
name: plan-kickoff-prompt
description: Generate a directive kickoff prompt for a fresh session to EXECUTE an approved implementation plan - typically right after superpowers:writing-plans finishes and the user wants to run the plan in its own session. Use whenever the user asks for a prompt to execute, run, implement, or kick off a written plan or spec in a new session ("give me the prompt to execute this plan", "kickoff for the implementation session", "prompt to run the plan"). Leading is intended here - the plan already passed its review gates. Do NOT use for discussion, brainstorm, or second-opinion handoffs - that is neutral-handoff-prompt's job.
---

# Plan-Execution Kickoff Prompt

Write the prompt that starts a fresh executor session on an approved plan.
This prompt is directive by design: the thinking already happened (brainstorm,
plan, plan-reviewer, yagni, user approval). The executor's job is faithful
execution, not re-design. Do not water it down with neutrality - an executor
given open questions re-litigates settled scope.

## Output rules

- The prompt goes in **chat, in a fenced code block**. Never write it to a
  file unless the user names a path.
- Normal prose, no caveman compression - the receiving session did not opt
  into any style mode.

## Preconditions (check before writing)

1. **The plan file exists on disk.** Get its exact path (typically
   `docs/superpowers/plans/<date>-<name>.md`). No file = nothing to execute -
   stop and say so; do not write a kickoff for a plan that lives only in chat.
2. **Gates ran.** Check for the `<plan>.review.md` / `<plan>.yagni.md`
   sidecars and user approval in the conversation. Missing gates are not a
   hard block (the user may have skipped them deliberately) but say it in
   chat before handing over the prompt, so the user decides eyes-open.

## Prompt structure

**1. Identity + entry point.**
Repo path (exact cwd the session must start in), and the instruction to begin
with the executing-plans skill:
> cd into `<repo>`. Invoke `superpowers:executing-plans` and execute the plan
> at `<exact plan path>`.

**2. Scope anchor.**
One or two sentences: what the plan delivers and the plan id/name. Enough for
the executor to detect "I have drifted off-plan", not a re-explanation of the
design (the plan file owns that).

**3. Binding decisions.**
Anything the user decided AFTER the plan was written, or that lives only in
chat (a changed constraint, a deferred step, "skip step 4, already done").
State each as a directive: "amier decided X (<date>) - follow it even where
the plan text differs." If none: omit the section entirely.

**4. Fog protocol (if the plan has fog sections).**
Superpowers plans end with "Not yet specified" / "Out of scope". Remind the
executor: hit something blurry -> check the fog sections; listed = skip it,
not listed = stop and ask. Never improvise past fog.

**5. Guardrails.** Standard block, include verbatim unless the plan says
otherwise:
> - Execute the plan as written. If a step is impossible or the codebase
>   contradicts the plan, STOP and report - do not redesign around it.
> - Edit only what the plan and its collateral require (build/tests green).
>   Unrelated findings: report, don't fix.
> - Verify each step's success criteria before marking it done; run the
>   plan's verification commands and show real output.

**6. Report-back contract.**
What the user wants at the end: steps completed vs plan, deviations (with
why), test/verify evidence, anything stopped-and-waiting. One short section.

## Template

```
cd into <repo path>. Invoke superpowers:executing-plans and execute the plan
at <plan path>.

Plan scope: <one-two sentences - what it delivers>.

Decisions made after the plan was written - these override the plan text:
- <decision, date>   [omit section if none]

Fog protocol: the plan's "Not yet specified" / "Out of scope" sections govern
blurry edges. Listed there = skip. Not listed = stop and ask.

Guardrails:
- Execute the plan as written. Step impossible or codebase contradicts it:
  STOP and report - do not redesign around it.
- Edit only what the plan and its collateral require. Unrelated findings:
  report, don't fix.
- Verify each step's success criteria before marking done; show real output.

When finished, report: steps completed vs plan, any deviations and why,
verification evidence, and anything left waiting on input.
```

Fill the template; cut sections that do not apply rather than padding them.
