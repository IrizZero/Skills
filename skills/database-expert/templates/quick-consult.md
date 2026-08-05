# QUICK tier output template

Use this template when the task fits the QUICK tier:

- Stored procedure / function authoring (1-3 tables)
- Single query optimization
- Schema change with backfill (NOT NULL add, type change)
- Single-table risk check
- Effort estimate: 5-50 lines of SQL, 1-3 tables involved

Fill every `[bracketed]` placeholder with task-specific content. Do not
output the template with placeholders intact — that is a plan failure.

```
[expert] DB consult — QUICK
───────────────────────────
Task: [restate the user's task in one line]
Platform: SQL Server
Classification: INTERNAL

Recommended approach:
[2-3 sentences explaining the pick and the reason]

[SQL DRAFT]
-- Status: DRAFT — requires DBA sign-off before execution
-- Industry-standard checks applied: 3NF / SARGable / IX_ naming
[5-50 lines of T-SQL, fully commented, named per convention]

Industry-standard checks:
✓ [check 1, e.g. "3NF — no transitive dependencies introduced"] — pass
✓ [check 2, e.g. "SARGable predicates"] — pass
✓ [check 3, e.g. "FK columns have supporting index"] — pass / note

Top risks:
1. [risk] — [mitigation]
2. [risk] — [mitigation]

Wouldn't pick if: [condition under which a different approach is preferred]

[expert-consult-complete]
```

## Authoring rules

- Always end the response with `[expert-consult-complete]` sentinel.
- Every SQL block must carry the `-- Status: DRAFT` header comment.
- If the user pastes a real credential, replace with `[REDACTED]` and warn
  before producing any SQL.
- Default Classification is INTERNAL. Promote to CONFIDENTIAL if input
  contains client identifiers.
- Top risks list: minimum 2 items, maximum 4. Pick the most likely failure
  modes, not theoretical edge cases.