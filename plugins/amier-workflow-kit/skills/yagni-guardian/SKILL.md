---
name: yagni-guardian
description: Audit an implementation plan for over-engineering, including speculative abstractions, single-use wrappers, unused configuration, scope outside the specification, unmeasured optimization, duplicate utilities, and defenses for unreachable states. Invoke explicitly with "$yagni-guardian", "YAGNI check", or "audit this plan for scope creep" before implementation.
---

# YAGNI Guardian

Perform a read-only plan audit. Do not edit the plan or code unless the user later asks to apply accepted cuts.

## Resolve context

1. Read the target plan in full.
2. Resolve and read the originating specification if one exists.
3. Read affected existing files and search for callers and similar utilities.
4. If there is no specification, state that scope creep cannot be assessed reliably.

## Independent pass

When a subagent is available, dispatch one fresh read-only subagent with only the plan, specification, affected paths, and rubric below. Do not include suspected findings. Verify every returned finding before presenting it. If subagents are unavailable, perform the audit directly and disclose that independence was unavailable.

## Signals

- `Y1 speculative abstraction`: an interface, base class, factory, or strategy has one concrete need and no architectural requirement.
- `Y2 single-use wrapper`: a helper has one caller, no independent contract, and no testing or clarity benefit.
- `Y3 unused configuration`: a flag or option has no identified actor or rollout that changes it.
- `Y4 outside specification`: the plan adds user-visible or architectural scope absent from the originating request.
- `Y5 unmeasured optimization`: caching, batching, pooling, or indexing is proposed without evidence of a bottleneck or hard requirement.
- `Y6 duplicate utility`: equivalent behavior already exists and the plan gives no reason not to reuse it.
- `Y7 unreachable-state defense`: validation or fallback handles a state made impossible by an internal contract.

Do not flag necessary trust-boundary validation, security controls, observability, concurrency safety, transactional recovery, or test infrastructure merely for adding code.

## Severity

- `NONE`: no verified findings.
- `SOFT`: one to four findings and no verified scope outside the specification.
- `HARD`: five or more findings, or any verified `Y4` finding.

## Output

```markdown
## YAGNI Audit

**Tier:** NONE | SOFT | HARD
**Scope compared:** <spec path or "not available">

### Findings
- [Y1] <plan section or file:line> - <verified problem>. Cut: <smallest removal>.

### Preserved robustness
- <important defensive element intentionally not flagged>

### Context inspected
- Plan: <path>
- Specification: <path or missing>
- Read: <paths>
- Searched: <patterns>
```

Do not pad the findings list. A clean result is valid. Never fabricate a line citation.
