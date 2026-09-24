---
name: research-prompt
description: Turn a vague research need into one self-contained deep-research assignment with project context, a decision goal, numbered questions, source standards, and an explicit deliverable. Use when the user asks for a research prompt, research brief, or a task to hand to a human or AI researcher.
---

# Research Prompt

Produce one compact paragraph that a researcher with no prior context can execute without follow-up.

## Build the prompt

1. Inspect relevant conversation and project files for the product, audience, known facts, constraints, dates, and intended decision.
2. Open with one or two sentences explaining the project and current situation.
3. State the single question the research must answer and what decision it informs.
4. Add three to six numbered sub-questions inline.
5. State important inclusion and exclusion constraints.
6. Prefer primary sources. Require claims to be separated into confirmed fact, inference, and unresolved uncertainty when evidence conflicts.
7. Define completion: cover every numbered question, corroborate important claims where independent sources exist, and identify remaining evidence gaps.
8. Require each finding to include a source link, the supported claim, confidence or limitation, and why it matters.
9. End by naming the requested artifact, normally one detailed Markdown file.

## Rules

- Return only the research prompt unless the user asks for commentary.
- Keep it to one paragraph, with numbered questions inline.
- Prompt the work and decision, not merely the topic.
- Do not invent context that the user or project files do not establish.
- Do not require repeated searches "until clean" without a practical stopping condition. Make the completion bar testable.
