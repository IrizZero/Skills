---
name: decisions
description: Ask the agent to list all choices it made during the current work that it is not confident of. Manual-only; invoke with /decisions.
disable-model-invocation: true
---

While working on this, which important decisions / choices did you make that you are NOT confident about?

Think deeply. Reason over every consequential decision. For each, consider whether a better alternative exists that we did not weigh.

Skip anything where we already have the clearly-best solution. Only surface decisions you are genuinely unsure about. If there are none, say so — do not manufacture doubt.

## Output — one block per decision, most consequential first

**[decision name] — [TAG]**
- **Chose:** what you picked.
- **Why:** the reasoning at the time (1 line).
- **If wrong:** the concrete failure mode / symptom that would show up. No vague "might cause issues".
- **Do:** the action the tag implies (see below), 1 line.

[TAG] is exactly one of:
- **KEEP** — on reflection it holds. `Do:` = why it holds.
- **FIX** — you now think it's wrong. `Do:` = the specific change.
- **DEFER** — fine for now. `Do:` = the trigger that should force a revisit.
- **ASK** — you can't call it without the user's context. `Do:` = the one specific question that unblocks it.

## Rules
- Lead with your real opinion, not agreement. If a choice was right, tag it KEEP and say why — do not invent uncertainty to look humble.
- Do NOT force a confident tag you can't ground. Unknowable-without-user → ASK. A fake recommendation is worse than an honest question.
- One tag per decision. No hedging.
- Plain English, short. The tag and the Do line are the point, not the prose.
