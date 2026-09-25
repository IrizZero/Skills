---
name: solution-auditor
description: Independent second opinion on a design direction. Runs Claude opus and Codex gpt-6-sol in parallel - each first blind to the leaning direction, then shown it - and returns merged ranked alternatives with provenance tags. Auto-injects at superpowers:brainstorming step 4 before the main thread proposes approaches, and adds an exit check before the user reviews the spec. Also invoke standalone for "second opinion", "audit solutions", "are there better approaches?", "what are my options?", "am I missing something?", "play devil's advocate", or any request to pressure-test a chosen direction. Not for critiquing a written plan (use plan-reviewer).
---

# Solution Auditor

Two models from different vendors audit the decision in parallel: the `solution-auditor` subagent (Claude opus, effort high) and Codex `gpt-6-sol` at high effort. Each works in one session over up to three turns:

1. **Cold** - goal, quoted constraints and repo paths only. The leaning direction is withheld so it cannot anchor the search.
2. **Reveal** - the candidate direction, phrased neutrally, plus verbatim conversation turns.
3. **Exit check** (brainstorm mode only) - the final chosen direction plus the turns since the reveal.

The subagent spec `~/.claude/agents/solution-auditor.md` defines the turns and their output. Both models follow that one file.

The skill is advisory and never blocks the flow. The user decides; the audit gives them evidence.

## Modes

- **Brainstorm** - auto-injected at `superpowers:brainstorming` step 4, before the main thread proposes approaches. Cold + reveal run at step 4; the exit check runs between steps 7 and 8.
- **Standalone** - a trigger phrase outside any flow. Cold + reveal, then a full report. No exit check.

If the user said "skip audit" this session, skip auto-injection and say so in one line. "Second opinion" or "audit solutions" re-invokes mid-flow.

## Step 1 - build the cold packet

Make a fresh folder per invocation, `<run>` = `<scratchpad>/sa-<HHMMSS>`, so a second "second opinion" run never overwrites the first. Every file below lives in it. Write `<run>/solution-auditor-cold.md`:

```markdown
# Solution audit - turn 1 (cold)

Spec: read ~/.claude/agents/solution-auditor.md and follow its Turn 1.

## Goal
<what must be achieved, 1-2 sentences, no mechanism named>

## Constraints
- "<short verbatim quote>" - user, turn <n>
- <repo fact> - <file:line>

## Repo paths
- <path>

## Git history
$ git log --oneline -20 -- <paths>
<output, unedited>
```

- Redact the proposed mechanism, the main thread's direction and anyone's preference. Keep every constraint: "use Redis because we can't add a DB" becomes the constraint `"we can't add a DB"`.
- Quote constraints; do not paraphrase them.
- If a constraint cannot be stated without naming the mechanism, keep it and label the run **not blind**.
- Include the git history section only when history bears on the decision.

## Step 2 - cold turn, in parallel

Send both in one message, both in the background:

- **Claude:** Agent tool, `subagent_type: solution-auditor`, `description: "Solution audit: <topic>"`, prompt = the cold packet. Save its reply to `<run>/sa-opus-cold.md`.
- **Codex:** Bash with `run_in_background: true`:
  ```bash
  timeout 1200 codex exec -m gpt-6-sol -c model_reasoning_effort=high --sandbox read-only -o <run>/sa-sol-cold.md "Read <run>/solution-auditor-cold.md and follow it." > <run>/sa-sol-cold.log 2>&1
  ```
  `-o` writes the final message; the `.log` holds the `session id:` line. Pass a short instruction as the argument, not the packet itself: that stays under the Windows command-line limit, and stdin hangs on Windows. Exit code 124 means the 20-minute timeout fired; treat it as a failure. Call `codex exec` directly, never the companion runtime. Model and effort are fixed; sol at xhigh needs owner approval.

Write both IDs to `<run>/sessions.md` (the opus agent ID, the Codex session ID). Step 5 runs many turns later and must not depend on the main thread remembering them.

## Step 3 - reveal turn

Write `<run>/solution-auditor-reveal.md`:

```markdown
# Solution audit - turn 2 (reveal)

One candidate under consideration: <direction or user preference, stated neutrally, no advocate named>. Where does it rank against your cold list? What does it miss?

## Conversation turns (verbatim)
<last 6-10 turns, unedited>
```

With no candidate yet, write "No candidate yet." in place of the first paragraph.

- **Claude:** SendMessage to the opus agent ID with this text; save the reply to `<run>/sa-opus-reveal.md`. Load the SendMessage schema via ToolSearch if it is deferred.
- **Codex:**
  ```bash
  timeout 1200 codex exec resume <session-id> -m gpt-6-sol -c model_reasoning_effort=high -c sandbox_mode='"read-only"' -o <run>/sa-sol-reveal.md "Read <run>/solution-auditor-reveal.md and follow it." > <run>/sa-sol-reveal.log 2>&1
  ```
  `resume` has no `--sandbox` flag; the `-c sandbox_mode` override does the same.

If a model's continuation fails, write the cold packet followed by the reveal text to `<run>/fallback-<model>.md`, send that model one fresh prompt pointing at it, and label its result **not blind**. If a model fails entirely, continue with the other and say which one is missing.

## Step 4 - merge and present

- One table of all approaches, each tagged `[opus]`, `[sol]` or `[both]`. Dedupe by mechanism, not wording.
- `[both]` means two models agreed on the same brief. It is agreement, not proof.
- Where ranks differ, show both. Do not average them away.
- Spot-check each cited `file:line` before presenting. Drop a citation that does not hold and say so.

Brainstorm mode injects:

```markdown
> **Independent solution audit** (opus + gpt-6-sol, cold then reveal)
>
> | # | Approach | Source | Rank opus / sol | Risk | Key trade-off |
> |---|---|---|---|---|---|
>
> **Picks:** opus - <name>; sol - <name>
> **Candidate verdict:** opus - <one line>; sol - <one line>
> **Missed constraints:** <from the reveal, or "none">
> **User override check:** <only when the user's own idea is neither model's pick> Your idea (<paraphrase>) is not the top pick. Is that a preference or a technical claim? If technical, what fact supports it?

[expert-consult-complete]
```

Add "not blind: <model>" to the heading line when a fallback ran.

Standalone mode gives a full report instead: the merged table, each model's pick, rationale and rejected list, both reveal verdicts, missing evidence, and the cold packet as sent.

## Step 5 - exit check (brainstorm mode)

Run it the first time the flow passes from brainstorming step 7 (spec self-review) to step 8 (user reviews spec). The one skip: when the final direction is the same named approach as both models' #1 pick after the reveal (look it up in `<run>/sa-opus-reveal.md` and `<run>/sa-sol-reveal.md`; if either reveal changed the ranking, use the new #1), say "exit check skipped: final direction is both models' pick" and do not run it. Otherwise run it; do not judge whether it is needed. If the spec review loops back and the chosen direction changes, run it again on the same sessions; if the direction is unchanged, do not rerun.

Read the IDs from `<run>/sessions.md`. Send each model its third turn by the same continuation method, saving replies to `<run>/sa-<model>-exit.md`:

```markdown
# Solution audit - turn 3 (exit check)

Final chosen direction: <from the spec>

## Conversation turns since the reveal (verbatim)
<unedited>
```

Show both verdicts next to the spec review request. UNEXPLAINED is information for the user, not a block.

If a session can no longer be resumed, write the cold packet, that model's earlier outputs and the turn 3 text to `<run>/fallback-<model>-exit.md`, send a fresh prompt pointing at it, and label the result **not blind**.

## Boundaries

- Read-only for project files. Only scratchpad files are written.
- The subagent has `Read`, `Grep`, `Glob` only. Codex runs `--sandbox read-only`.
- Not for critiquing a written plan: that is `plan-reviewer`.
