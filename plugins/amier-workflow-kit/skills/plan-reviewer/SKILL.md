---
name: plan-reviewer
description: Review an implementation plan against the current repository before implementation, with a YAGNI lens. Finds blockers, warnings, suggestions and unneeded scope (Y1-Y7) with file-and-line evidence. Use after superpowers:writing-plans saves a plan and finishes its Self-Review, before the Execution Handoff, or when asked to "review this plan", "re-review the plan" or "$plan-reviewer".
---

# Plan Reviewer

A read-only senior-engineer review of a plan against the repository.
superpowers 7.0 already checks the plan against its spec (Self-Review) and against itself (the executor's pre-flight scan); this review checks it against the code, and cuts what it does not need.
A failed review never blocks the flow. A Blocker that is not fixed (DEFER or DISMISS) is named in the handoff, and execution waits for the user's explicit OK on it. "skip review" turns it off for the session.

## Resolve the scope

1. Use the plan path given. Otherwise the newest `*.md` under `docs/superpowers/plans/`, excluding `*.review.md` and `*.yagni.md`. Ask only when the target is ambiguous.
2. Pin the revision: `git rev-parse --short HEAD`, dirty flag from `git status --porcelain`, plan hash from `git hash-object <plan>`. Edit nothing while the review runs.
3. Read the whole plan, its `**Spec:**` (if it resolves, noting the spec's `**Scope:**` line), its `## Global Constraints` and `## Review Focus`, the project instructions, and the existing `<plan>.review.md` sidecar if present.
4. Affected files: every task's `**Files:**` block; older plans: `## Affected files`; otherwise paths in the plan body. A file the plan creates is not missing.
5. Search for callers, dependents, related utilities, established patterns and tests for every symbol the plan adds or changes.

## Independent pass

Use one fresh read-only subagent on `gpt-6-sol` at high, unless the plan is small and quiet: 2 or fewer `### Task` headings and nothing touching auth, permissions, secrets, crypto, database schema, migrations, transactions, concurrency, locks, queues, or an external API or contract. "cross-check" forces the subagent.
Give it only the plan path, the revision, the repository paths and the rubric below, not your expected findings.
Its report is evidence to verify, not authority. It is the same model lineage as you, so say so in the summary. Without subagents, review directly and say that independence was unavailable.

## Rubric

**Correctness lens (first):**

- unmentioned callers or interface breakage;
- deprecated or replaced APIs;
- missing empty-input, concurrency, partial-write, error-path or large-input behavior;
- security-sensitive changes (tag `severity-override: security`);
- a public interface changed without a migration;
- missing tests for behavior that has broken before;
- conflict with established patterns;
- a task that breaks a Global Constraint;
- plan citations (path, symbol, line) that do not match the repository.

**YAGNI lens (second).** Flag only when the plan gives no evidence of need:

- `[Y1]` speculative abstraction: one implementation, no second consumer named.
- `[Y2]` single-caller wrapper: one call site, no direct test, no planned caller.
- `[Y3]` dead config flag: a knob nothing flips.
- `[Y4]` feature outside request: absent from the spec, or beyond the spec's `**Scope:**` line even when the spec includes it. Skip Y4 when no spec was read, and say so. Work beyond the `**Scope:**` line is the user's call, since they approved the spec: end its line with `User: keep or cut?` after the `Cut:`.
- `[Y5]` premature optimization: caching, pooling, batching, indexing or lazy loading with no measured need.
- `[Y6]` existing utility: duplicates one the repository already has.
- `[Y7]` defensive code: guards a state the plan's own contracts make unreachable, away from any trust boundary.

Never flag trust-boundary defense, test infrastructure, observability, security controls or concurrency safety.
Tier: none = NONE; 1-4 without Y4 = SOFT; 5+ = HARD; any Y4 = HARD.

Do not flag style, imaginary future requirements, items the plan explicitly defers, plan length or format, or anything without evidence.
Dismissed findings in the sidecar stay quiet unless their section, the spec or the cited code changed.

## Severity

- `Blocker`: broken, unsafe or observably regressive as written.
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

### YAGNI
**YAGNI tier:** <NONE | SOFT | HARD>
**Y4:** <scored | skipped (no spec read)>
- [Y1] <plan section or file:line> - speculative abstraction: <problem>. Cut: <removal>.

### Context inspected
- Plan: <path>; revision <commit> (dirty: <yes|no>), plan hash <hash>
- Read: <paths>
- Searched: <patterns>
- Missing: <referenced paths that do not exist>
```

Keep empty headings so a clean result is explicit. Never fabricate a citation. Verify every subagent finding before presenting it.

## After the review

In a writing-plans flow: give each finding `ACCEPT`, `DISMISS` or `DEFER` with a reason and evidence; apply the accepted ones to the plan; rerun writing-plans' full Self-Review; write or update `<plan>.review.md` (revision, findings, verdicts, YAGNI tier); then put one summary line, every DEFER as a question and every Blocker that is not fixed (with its verdict) in the Execution Handoff.
A substantiated Y4 beyond the spec's `**Scope:**` line is always DEFER: the user keeps or cuts it.
A dismissed security finding needs explicit security analysis and is named in the handoff.
Outside the flow: show the findings and stop; edit the plan only on the user's OK.
