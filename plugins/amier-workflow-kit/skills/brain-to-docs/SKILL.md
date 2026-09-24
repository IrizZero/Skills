---
name: brain-to-docs
description: Extract a project's vision, constraints, preferences, and decisions through a concise question-and-answer loop, then maintain the README and architecture decision records. Use when the user says "brain to docs", wants to document a project from incomplete thoughts, or wants a guided conversation that continuously updates project documentation.
---

# Brain to Docs

Turn the user's implicit project knowledge into durable documentation.

## Start

1. Read the repository instructions, `README.md`, and existing decision records. Look for ADRs under `docs/adr/`, `docs/adrs/`, or the convention already used by the project.
2. Do not overwrite a developed README structure. Fit new information into it.
3. If the project has no ADR convention, use `docs/adr/NNNN-short-title.md` with `Status`, `Context`, `Decision`, and `Consequences` sections.

## Conversation loop

1. Ask up to five short, varied questions. Cover different angles such as users, success criteria, product boundaries, technical constraints, risks, operations, and taste.
2. Let the user answer any subset.
3. After each answer, update the relevant documentation before asking more questions.
4. Put project purpose and user-facing vision in the README. Put consequential choices and trade-offs in ADRs.
5. Re-read the changed documentation before the next question round so questions do not repeat settled ground.
6. Continue until the user says the documentation is sufficient.

## Writing rules

- Keep questions and chat replies concise.
- Preserve verified existing facts and clearly label unresolved matters.
- Record why a decision was made, not only what was selected.
- Never invent stakeholder intent, deadlines, constraints, or decisions.
- Do not challenge ordinary preferences unless asked. Surface severe contradictions or safety risks directly.
- Do not commit changes unless the user asks.
