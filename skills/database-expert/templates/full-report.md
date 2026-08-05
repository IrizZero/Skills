# FULL tier output template

Use this template when the task fits the FULL tier:

- Schema design / redesign (multi-table)
- Cross-table risk audit
- Performance audit (multiple queries, wait stats)
- Migration plan with rollback
- Deadlock investigation
- Index strategy review across schema
- Effort estimate: > 50 lines of SQL, 3+ tables, or systematic analysis

Fill every `[bracketed]` placeholder with task-specific content. Do not
output the template with placeholders intact — that is a plan failure.

```
[expert] DB REPORT — FULL
═══════════════════════════════════════
Task:           [task title]
Type:           [Schema / Audit / Performance / Migration / Deadlock]
Platform:       SQL Server (T-SQL)
Classification: INTERNAL
Date:           [YYYY-MM-DD]
Status:         DRAFT — requires DBA sign-off before execution

[CONTEXT]
[2-4 sentences: problem statement, current state, scope of schema or
queries under review]

[ANALYSIS]
[Systematic findings. For audits: one row per table or query with
finding. For schema design: per-entity rationale. For deadlocks: lock
acquisition order and the cycle.]

[RECOMMENDED SCRIPT / FINDINGS]
-- Status: DRAFT — requires DBA sign-off before execution
-- Industry-standard checks applied: see [INDUSTRY-STANDARD CHECKS]
[full T-SQL implementation, commented, named per convention]

[ROLLBACK SCRIPT]
-- Status: DRAFT — reverses the forward script above
[reverse-direction T-SQL — drop indexes created, revert column adds,
restore original SP body]

[INDUSTRY-STANDARD CHECKS]
✓ Normalization: [3NF / BCNF state — where denormalization was used and why]
✓ Index coverage: [FK indexes present? covering indexes used? unused indexes flagged?]
✓ Naming convention: [PascalCase / IX_ / FK_ / PK_ followed throughout?]
✓ Data types: [DATETIME2 over DATETIME? VARCHAR(MAX) over TEXT? DECIMAL over MONEY?]
✓ Security: [parameterized queries? least-privilege grant? no embedded credentials?]
✓ Concurrency: [isolation level appropriate? deadlock-safe lock order? transaction scope tight?]

[RISKS]
🔴 CRITICAL: [risk that blocks safe execution]
🟡 WARNING:  [risk that needs documentation / monitoring]
🟢 MINOR:    [risk worth noting but not blocking]

[NEXT STEPS]
1. Pre-execution: verify backup exists, schedule off-peak window, dry-run on staging
2. Execution: run forward script inside transaction with explicit COMMIT
3. Post-execution: run validation queries, monitor wait stats for 24 h

[ARTIFACT]
Saved to: docs/db-reports/db-report-[slug]-[YYYY-MM-DD].md

[expert-report-ready-for-save]
```

## Authoring rules

- Always end the response with `[expert-report-ready-for-save]` sentinel,
  then ask: `Save this report to docs/db-reports/? (yes / no / edit)`.
- Forward script and rollback script are both mandatory. A FULL report
  without rollback is a plan failure.
- All six INDUSTRY-STANDARD CHECKS must be present even if the answer is
  "N/A for this task" — explicit N/A is acceptable, omission is not.
- Risks section minimum: 1 of each tier if applicable. If no CRITICAL
  risks exist, write `🔴 CRITICAL: none`.
- Slug rule: lowercase task title, spaces → `-`, drop punctuation, cap at
  40 characters.
- If the user says "no" to save, do not write a file. If "edit", revise
  and re-show the report; ask again.