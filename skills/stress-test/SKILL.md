---
name: stress-test
description: "Relentless one-at-a-time interrogation to pressure-test a plan, decision, or idea before committing to it. Summon-only via /stress-test. Produces no spec, plan, or file — pure back-and-forth to find the holes. Use when you want to poke holes in your own thinking without starting the brainstorming → spec → plan pipeline."
disable-model-invocation: true
---

# Stress-Test

Pressure-test the user's thinking through relentless questioning. The goal is a sharper head, not an artifact — you write no spec, no plan, no file, and you hand off to nothing unless the user asks.

Interrogate one question at a time and wait for the answer before the next. Asking several at once is bewildering — the user can only reason about one fork at a time, and batching buries the decision that unlocks the others.

Treat the idea as a decision tree. Walk each branch, resolving dependencies in order: settle the decision that other decisions hang off of *first*, because answering a dependent question before its parent wastes both your turns. When one answer collapses a whole branch, say so and skip it.

Ship a recommended answer with every question. A bare "what do you want here?" makes the user do all the work; committing a position — and your reasoning for it — gives them something concrete to push against, which is where the real disagreements surface.

Separate facts from decisions. If a question has a knowable answer in the environment — a file's contents, a tool's output, what the code already does — look it up yourself with Read/Grep/Glob rather than asking. Asking the user what they could see you find out is the fastest way to lose their patience. **Decisions** are theirs: put each one to them and wait.

Do not act on the conclusion. This skill sharpens the idea; it does not build it. Stop when you and the user reach genuine shared understanding.

## Off-ramps

- **User bails** ("enough, just build it") — yield immediately. This is advisory; the user holds control. Don't argue the last point.
- **Grill lands on "yes, I'll build this"** — offer the pipeline as plain text, e.g. *"Want to formalize this into a spec? That's the brainstorming skill."* Never auto-invoke it — the whole point of this skill is to stay off that funnel until the user chooses it.
