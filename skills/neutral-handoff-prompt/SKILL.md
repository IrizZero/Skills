---
name: neutral-handoff-prompt
description: Generate a neutral, non-leading handoff prompt for a fresh session or agent whose job is to THINK - brainstorm, design discussion, second opinion, independent architecture review, open research. Facts in, conclusions quarantined, receiver thinks for itself. Not for plan execution - that is plan-kickoff-prompt's job.
disable-model-invocation: true
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

This skill blocks the first outright: **no sender's view section, ever** -
amier decided (2026-08-14) the receiver must think entirely for itself, so
sender opinions do not ship in any form. The second failure mode is countered
structurally instead: the symmetry check on facts, the two-live-answers rule
on questions, the receiver independence line, and the self-check are the
anti-curation defenses. They are load-bearing - with no labeled opinion as a
release valve, curation discipline in the body is the only thing standing
between the receiver and invisible steering. Apply them strictly.

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
  document's recommendation) is a conclusion, not a fact - it does not go in
  the prompt regardless of how well it is sourced. A document that contains a
  recommendation may still be pointed to (see Grounding pointers), flagged as
  opinionated; the recommendation itself is never restated in the prompt body.

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

**7. No sender's view. Blocked.**
The prompt ends at the independence line. Never append a "Sender's view",
recommendation, pick, or confidence section - not even quarantined and
labeled. If the current session holds a conclusion, it stays in the sending
session's chat; it does not travel in the handoff prompt. The only exception
is the explicit "include your pick" escape hatch below, which the user must
invoke in their own words per handoff.

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
