---
name: plan-reviewer
description: Independently critique an implementation plan against the current repository, finding blockers, warnings, and optional improvements with file-and-line evidence. Invoke explicitly with "$plan-reviewer", "review this plan", or "critique the implementation plan" before implementation begins.
---

# Plan Reviewer

Perform a read-only senior-engineer review of a plan. Do not implement or rewrite the plan unless the user later requests changes.

## Resolve the review scope

1. Use the plan path supplied by the user. If none is supplied, identify likely plan files in the repository and ask only when the target is ambiguous.
2. Read the entire plan, relevant project instructions, referenced specification, affected files, and existing review sidecar if present.
3. Search for callers, dependents, related utilities, established patterns, and tests for symbols the plan changes.
4. Treat files that the plan intends to create as missing context, not errors.

## Independent pass

When a subagent is available, dispatch one fresh read-only subagent with only the plan path, relevant repository paths, and the review rubric below. Do not include your expected findings. Use the returned report as evidence to assess, not as authority. If subagents are unavailable, perform the same review directly and disclose that independence was unavailable.

The reviewer must check:

- unmentioned callers or interface breakage;
- conflict with existing architecture or duplicated utilities;
- missing error, concurrency, partial-write, empty-input, or migration behavior;
- security-sensitive changes;
- missing verification for the behavior being changed;
- plan steps that do not match repository reality;
- requirements introduced without a supporting specification.

Do not flag style preferences, imaginary future requirements, or speculation without evidence.

## Severity

- `Blocker`: the plan is likely broken, unsafe, or observably regressive as written.
- `Warning`: a real issue worth resolving before implementation.
- `Suggestion`: an optional improvement with clear benefit.

## Output

```markdown
## Plan Review

### Blockers
- [B1] <plan section or file:line> - <problem>. Fix: <smallest correction>.

### Warnings
- [W1] <plan section or file:line> - <problem>. Fix: <smallest correction>.

### Suggestions
- [S1] <plan section or file:line> - <improvement>.

### Context inspected
- Plan: <path>
- Read: <paths>
- Searched: <patterns>
- Missing: <referenced paths that do not exist>
```

Keep empty severity headings so a clean result is explicit. Never fabricate a file or line citation. If a subagent produced a finding, verify it before presenting it.
