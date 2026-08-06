---
name: solution-auditor
description: Use during superpowers:brainstorming step 4 to generate independent solution alternatives (3-5 ranked, occasionally 2 when the solution space is genuinely narrow) and flag sycophancy/over-agreement patterns. Auto-injects before brainstorm proposes its own approaches. ALSO invoke standalone, outside any brainstorm, whenever the user wants an independent second opinion on a design or architecture decision — phrases like "second opinion", "audit solutions", "are there better approaches?", "what are my options?", "am I missing something?", "play devil's advocate", or any request to pressure-test a chosen direction; standalone mode returns a full ranked-alternatives report. Dispatches the solution-auditor subagent (opus, fresh context) for true independence. Refuses planning-phase critique (use plan-reviewer instead).
---

# Solution Auditor

## Trigger

This skill is invoked in two ways:

1. **Auto-inject** at `superpowers:brainstorming` step 4 ("Propose 2-3 approaches"), BEFORE the main thread proposes its own approaches. The integration snippet in user-global `~/.claude/CLAUDE.md` (added one-time at install — see project README) instructs the main thread to do this.
2. **Manual** by the user at any time with phrases "second opinion", "audit solutions", or by directly invoking the skill by name.

The skill is also usable in **standalone** mode — i.e. invoked outside any `superpowers:*` flow. Standalone behavior is documented at the end.

## Overview

This skill is a thin wrapper around the `solution-auditor` subagent. The subagent runs in a fresh context window (real independence), reads relevant repo state, generates 3-5 ranked solution alternatives with trade-offs (occasionally 2 when the solution space is genuinely narrow), and scores four sycophancy signals against the current brainstorming conversation. The main thread (running the dominant `brainstorming` flow) consumes the auditor's output, reconciles with its own thinking, and presents the merged set to the user.

The skill is **advisory only** while inside a superpower flow. It cannot override the flow except via the documented HARD-tier sycophancy gate (see "Output handling" below).

## How it works

1. **Detect context.** Determine whether invocation is auto/manual inside `brainstorming` or standalone outside any flow. If inside a flow but the user has previously said "skip audit" this session, abort with the sentinel and a one-line note.
2. **Build the input packet.** Extract:
   - `user_request_summary` — one to two sentences describing what the user is brainstorming, derived from the conversation so far.
   - `current_brainstorm_direction` — what the main thread was about to propose at step 4 (or "n/a" if the auditor was invoked before the main thread formed a direction).
   - `repo_paths_likely_relevant` — a short list of paths in the current working directory that look relevant to the topic. Use `Glob` and `Grep` from the main thread to surface likely paths. Pass paths only — the subagent does its own reads.
   - `conversation_signals` — verbatim conversation turns for the auditor to score sycophancy on. The hazard here: the main thread building this packet is the same party the sycophancy score judges, so letting it hand-pick "relevant" quotes invites it to omit its own agreement turns and self-launder a clean score. Defeat that by forwarding the **last 6–10 turns verbatim** — do not paraphrase, summarize, or cherry-pick. On top of that verbatim window you MAY *tag* turns of interest (AI agreed quickly, AI changed position, user pressure phrases like "just do it"/"trust me", the AI's most recent statement of the chosen direction + its justification or noted absence). Tags are hints; the verbatim window is the ground truth the auditor scores against. If standalone (no conversation), set this to `n/a — standalone mode`.
3. **Dispatch the subagent** via the Agent tool:
   - `subagent_type: solution-auditor`
   - `model: opus` (the subagent's frontmatter pins this; do not override)
   - `description: "Solution audit: <topic>"`
   - `prompt`: a single markdown block containing the four input packet fields, plus an instruction to follow the strict output schema (defined in the subagent file).
4. **Receive the subagent's output** — a single markdown message.
5. **Validate the output** — see "Output handling" below.
6. **Format the injection block** and emit it into the brainstorming flow.
7. **End with the sentinel** `[expert-consult-complete]` so the brainstorming flow resumes step 4.

## Input packet shape (passed to the subagent)

```markdown
# Solution audit request

## user_request_summary
<1-2 sentences>

## current_brainstorm_direction
<one paragraph, or "n/a — auditor invoked before main thread formed a direction">

## repo_paths_likely_relevant
- <path 1>
- <path 2>
- ...

## conversation_signals
<verbatim quotes with turn-number labels, or "n/a — standalone mode">

## instructions
Generate 3-5 ranked solution alternatives plus a tiered sycophancy assessment. Follow the output schema in your subagent definition exactly. End with `[expert-consult-complete]`.
```

## Output handling

The subagent's expected output schema is defined in `agents/solution-auditor.md`. Validation checks:

- Four sections present (match on heading *prefix* — the `### Alternatives` heading carries a `(N=…)` suffix, so a substring/prefix check is required, not an exact-line match): `## Solution Audit`, `### Alternatives`, `### Sycophancy Assessment`, `### User-Override Reminder`.
- Sentinel `[expert-consult-complete]` present at the end.
- `Alternatives` table has between 2 and 5 *data* rows — exclude the header row and the `|---|` separator from the count (3-5 expected; 2 only when solution space is genuinely narrow).
- `Sycophancy Assessment` includes a tier of `NONE`, `SOFT`, or `HARD`.

If any check fails, emit a one-line warning to the main thread: "solution-auditor output malformed — proceeding without audit." Then emit the sentinel. The brainstorming flow continues vanilla.

If all checks pass, format the injection block as:

```markdown
> **Independent solution audit** (from solution-auditor subagent, opus, fresh context)
>
> <alternatives table verbatim>
>
> **Auditor's pick:** <#1 row's approach name>
> **Rationale:** <rationale paragraph from subagent>
>
> <sycophancy block — include ONLY if tier is SOFT or HARD>
>
> <user-override prompt — include ONLY if the user's original idea is NOT alternative #1>
```

### Sycophancy block format (SOFT or HARD only)

```markdown
> **Sycophancy tier:** <SOFT|HARD>
> **Signals tripped:** <list of signal names that scored 1, with one-line evidence each>
> **Recommended action:** <subagent's one-sentence recommendation>
```

### User-override prompt format (when user's idea != #1)

```markdown
> **User override check:** Your original idea (<short paraphrase>) is not the auditor's top pick (#1 is <auditor's #1 approach name>). Do you have context that justifies your original direction? If yes, state the reason and we'll proceed with it; if no, consider switching.
```

### HARD-tier justification gate

If the sycophancy tier is `HARD`, the brainstorming flow must not proceed to step 5 until the main thread emits one paragraph of *technical* justification for the current direction. The justification must name a concrete technical reason — a performance characteristic, a hard constraint, an existing repo pattern, or a specific failure mode it avoids. Non-agreement prose alone does not clear the gate: "this is the cleaner design" is not a reason; "this avoids the N+1 query at `repo.py:88`" is. No agreement language ("you're right", "good call"), no user-pleasing rationale ("because you said so"). If the main thread cannot produce such a justification, drop the current direction and present the auditor's alternatives as the new starting set.

Enforcement is self-policed: the subagent has already returned and ran in a fresh context, so it cannot verify the justification. The main thread — the same party the gate is checking — judges its own output. The concrete-reason bar above exists to make that self-check harder to fake; if a user is present, they are the backstop.

This is the ONLY case in which the skill blocks the superpower flow. All other failures (malformed output, dispatch failures, timeouts) are non-blocking.

## Per-session skip

If the user says any of "skip audit", "skip audit this session", "don't auto-inject solution-auditor", or equivalent, the main thread MUST remember this for the duration of the current Claude Code session and skip future auto-injections of this skill until the session ends. The mechanism is in-memory only — no file is written, no setting persists. A fresh session restores default behavior.

## Standalone mode

When invoked outside any `superpowers:*` flow:

- The `conversation_signals` field is set to `n/a — standalone mode`.
- The subagent's `Sycophancy Assessment` section will return `Tier: NONE` with all signals marked `n/a`.
- The skill's output tier may go heavier — emit a full markdown report inline (alternatives table + rationale + risk callouts + per-alternative notes) instead of the compressed inline injection block.
- The standalone-mode response does NOT need to end with the sentinel — there's no superpower flow to hand back to. (Emitting the sentinel is harmless if you do.)

## Integration with superpowers

This skill is invoked from `superpowers:brainstorming`.

**Sentinel:** Always end with `[expert-consult-complete]` to return control to the dominant superpower flow (except in standalone mode, as noted above).

**Forbidden while inside a superpower flow:**
- Overriding the brainstorming flow (except via the documented HARD-tier gate above).
- Auto-promoting to a heavier output tier. The compressed inline injection block is the only tier permitted inside a flow. Save full reports for standalone mode.
- Suggesting that the user re-run brainstorming or that the brainstorming flow restart — only the user or the superpower flow itself decides that.
- Editing files, suggesting plan steps, or critiquing the brainstorming skill's own process.

**User escape phrases inside a flow:**
- "skip audit" / "skip audit this session" / "don't auto-inject solution-auditor" — disables auto-injection for the current session.
- "second opinion" / "audit solutions" — re-invokes the skill mid-flow.

## Recursive invocation

If this skill is invoked from within a `solution-auditor` subagent context (the subagent tries to call its own skill), abort immediately with a one-line error and the sentinel. The auditor cannot self-invoke.

## Boundary rules

- The skill is **read-only** for project files — it never edits anything.
- The dispatched subagent has only `Read`, `Grep`, `Glob` tools. No `Edit`, `Write`, `Bash`, `WebSearch`, `WebFetch`.
- Even on error, the skill returns control to the dominant flow via the sentinel rule documented in "Integration with superpowers" above. The only documented exception is standalone mode.
- The subagent definition lives at `agents/solution-auditor.md` and the dispatching main thread assumes Claude Code's agent loader resolves `subagent_type: solution-auditor` to that file (the install copies it to `~/.claude/agents/solution-auditor.md`).
