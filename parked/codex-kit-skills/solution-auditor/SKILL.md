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

When a subagent is available, dispatch one fresh read-only subagent with the goal, the user's constraints quoted verbatim, relevant repository paths, and the rubric below. Redact the proposed mechanism and anyone's preference, but keep every constraint. After it returns, show it the current direction phrased neutrally and ask where it ranks and which constraints the first packet missed. If subagents are unavailable, do the pass directly and disclose that structural independence was unavailable.

Consider distinct feasible mechanisms before ranking. Distinction must come from architecture, ownership, storage, control flow, or dependency boundaries, not minor implementation variations. Publish every approach you can defend with repository evidence, including just one if that is all that survives. For a sole recommendation, state the deciding constraint and the closest rejected approach, if one exists. Never invent a candidate to meet a count.

Rank alternatives using:

- fit with established repository patterns;
- correctness and failure modes;
- operational and security impact;
- reversibility and migration burden;
- unnecessary scope or dependency growth.

Development effort may be discussed, but must not outweigh correctness, simplicity, or maintainability by itself.

## Direction check

Once the ranking is done, compare the current direction with it:

- where it ranks, with repository evidence;
- whether the user's preference is being treated as evidence;
- any constraint from the conversation the independent pass missed.

Who proposed a direction and how firmly are not evidence.

## Output

```markdown
## Solution Audit

| Rank | Approach | Advantages | Failure modes / costs | Risk |
|---|---|---|---|---|
| 1 | ... | ... | ... | low/medium/high |

**Recommended:** <approach>
**Why:** <repository-grounded rationale>

### Direction check
- <rank of the current direction and the evidence, or "No direction yet">

### Missing evidence
- <fact that could change the ranking>
```

Verify any subagent citation before presenting it. If the user's original choice is not ranked first, state the gap clearly and let the user decide.
