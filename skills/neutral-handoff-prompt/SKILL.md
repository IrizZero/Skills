---
name: neutral-handoff-prompt
description: Generate a neutral, non-leading handoff prompt for a fresh session or agent whose job is to THINK - brainstorm, design discussion, second opinion, independent architecture review, open research. Use whenever the user asks for a prompt, handoff, or kickoff for another session to discuss, explore, or form its own view on something ("write a prompt so I can discuss this in its own session", "prompt for a second opinion", "handoff for a fresh look"). Also use when the user says "neutral prompt" or complains a drafted prompt is leading/biased. Do NOT use when the receiving session's job is to execute an approved plan - that is plan-kickoff-prompt's job.
---

# Neutral Handoff Prompt

Write a prompt for a fresh session that must reach its own conclusions.

## Why this exists

Two failure modes killed naive handoffs:

1. **Visible steering.** The prompt embeds the sender's pick ("probably not the
   right primitive", "skip B") and the fresh session rubber-stamps it. LLMs
   defer to any stated direction.
2. **Invisible steering.** Deleting opinions does not fix it - a sender who has
   privately concluded curates which facts go in, phrases the goal as a
   solution shape, and asks questions only one answer fits. Fully "neutral"
   text, same steering, now undetectable by the receiver.

So this skill does neither. Opinions are not deleted - they are **quarantined
and labeled**, and the receiver is **instructed to think first**. A labeled
opinion the receiver reads last produces more independent thinking than either
a hidden one or a curated silence.

## Output rules

- The prompt goes in **chat, in a fenced code block**. Never write it to a
  file unless the user names a path.
- Write the prompt in normal prose (no caveman compression) - the receiving
  session did not opt into any style mode.
- Neutrality governs problem-domain content only. Process and tooling
  instructions (which skill to start with, output format, MCP notices,
  "read X before Y") are always allowed - directing HOW to work is not bias.

## Prompt structure

Build the prompt in this order:

**1. The ask, at symptom level.**
State the user's original request or the observed symptom - never a solution
shape. "Polling wastes N cycles/sec" is neutral; "replace polling with events"
smuggles the conclusion into the goal. If the user's own words were
solution-shaped, quote them as the user's words and add the underlying need.

**2. Facts - dated, sourced, symmetric.**
- Every external claim carries its date and source.
- **Symmetry check (the load-bearing rule):** for every live option, include
  the known facts AGAINST it as well as for it. If no adverse fact is known
  for some option, say so explicitly ("no downside of X surfaced yet") - an
  option with only favorable facts listed is curation, not neutrality.
- A statement whose subject is a judgment (mine, a prior session's, or a
  document's recommendation) is a conclusion, not a fact - it belongs in the
  Sender's view section regardless of how well it is sourced.

**3. User decisions, as attributed facts.**
Decisions the user already made are facts, not opinions. Transmit them:
"amier decided X (<date>)". Never strip them and never re-open them as
questions - the fresh session re-litigating settled scope is waste.

**4. Grounding pointers.**
Files/docs the session should read. Flag opinionated artifacts as such
("docs/plans/foo.md - a plan, contains a recommendation") so the receiver
knows it is reading a position, not ground truth.

**5. Open questions - at least two live answers each.**
If only one answer to a question is sensible as phrased, rephrase it or cut
it. Hypotheses are allowed only stated symmetrically: name the hypothesis AND
its negation as candidates to test ("H: sandbox blocks network / H-not: it
doesn't - test before designing around either").

**6. Receiver independence line.** End the neutral body with:
> If the material above appears to admit only one answer, treat that as
> possible curation - actively seek disconfirming evidence before agreeing.

**7. Quarantined sender's view (optional but default-on).**
Final section, exact header:

```
## Sender's view (read only after forming your own)
```

My pick, reasoning, and confidence - honestly stated, clearly mine. Open the
section with: "Form your own view from the material above before reading
this. Then reconcile: where do we differ and why?" This preserves the
analysis the current session already paid for, without letting it frame the
receiver's thinking.

Skip the section only when the user says "no sender view" or when I genuinely
hold no view.

## Escape hatches

- User says "include your pick" / "opinionated prompt": skip neutrality,
  write the recommendation into the body directly.
- The handoff is actually execution of decided work (a plan exists, or the
  route is chosen and half-implemented): wrong skill - use
  plan-kickoff-prompt, where leading is the point.
- Incident/bug handoff under time pressure: current best diagnosis and
  recommended immediate mitigation go IN the body, labeled ("diagnosis, not
  yet confirmed:") - withholding judgment from time-sensitive handoffs costs
  more than bias does.

## Self-check before sending

Reread the drafted prompt as if you preferred the OTHER option:
- Does the goal presuppose a remedy shape?
- Does any option have only favorable facts?
- Is any question answerable only one way?
- Did a conclusion sneak in dressed as a sourced fact?

Fix what fails, then output.
