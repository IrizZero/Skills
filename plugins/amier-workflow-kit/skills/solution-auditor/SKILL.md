---
name: solution-auditor
description: Generate an independent, repository-grounded second opinion on a proposed technical or product direction, ranking genuinely distinct alternatives and checking whether the current direction is justified by evidence rather than agreement. Invoke explicitly with "$solution-auditor", "second opinion", "what alternatives am I missing", or "play devil's advocate" before planning.
---

# Solution Auditor

Analyze options without implementing them. Use this before a detailed implementation plan exists; use `plan-reviewer` once a plan has been written.

## Gather evidence

1. Restate the decision in one sentence.
2. Inspect repository instructions and the smallest relevant set of files.
3. Record the current proposed direction and its stated technical justification. If none exists, say so.

## Independent pass

When a subagent is available, dispatch one fresh read-only subagent with the decision, relevant repository paths, and the rubric below. Do not tell it your preferred answer. If subagents are unavailable, do the pass directly and disclose that structural independence was unavailable.

Generate two to five genuinely distinct approaches. Distinction must come from architecture, ownership, storage, control flow, or dependency boundaries, not minor implementation variations. Do not pad the list.

Rank alternatives using:

- fit with established repository patterns;
- correctness and failure modes;
- operational and security impact;
- reversibility and migration burden;
- unnecessary scope or dependency growth.

Development effort may be discussed, but must not outweigh correctness, simplicity, or maintainability by itself.

## Agreement check

Check whether:

- the current direction was accepted without repository verification;
- reasoning changed after pressure but without new facts;
- the direction lacks a concrete technical justification;
- the user's preferred choice is being treated as evidence.

Report only signals supported by the available conversation. Do not label ordinary collaboration as sycophancy.

## Output

```markdown
## Solution Audit

| Rank | Approach | Advantages | Failure modes / costs | Risk |
|---|---|---|---|---|
| 1 | ... | ... | ... | low/medium/high |

**Recommended:** <approach>
**Why:** <repository-grounded rationale>

### Agreement check
- <supported signal, or "No concerning signal found">

### Missing evidence
- <fact that could change the ranking>
```

Verify any subagent citation before presenting it. If the user's original choice is not ranked first, state the gap clearly and let the user decide.
