# Platform notes

Use these as routing reminders, not substitutes for the target engine's current official documentation.

## SQL Server

- Prefer evidence from actual execution plans, Query Store, wait statistics, and data distribution.
- Check implicit conversions, parameter sensitivity, statistics quality, key lookups, spills, and blocking chains.
- Consider schema-modification locks, transaction-log growth, availability groups, and edition/version support before proposing online operations.
- Do not recommend `NOLOCK` as a generic performance fix. Explain dirty, missing, and duplicated-read risks.
- Treat `DATETIME2`, bounded string types, constraints, and parameterized queries as common defaults, while respecting compatibility requirements.

## PostgreSQL

- Consider MVCC, autovacuum, table/index bloat, visibility maps, statistics, and concurrent-index limitations.
- Use `EXPLAIN (ANALYZE, BUFFERS)` only when executing the query is safe and authorized.
- Account for locks and table rewrites in the specific server version when reviewing DDL.

## MySQL

- Identify the storage engine and server version.
- Inspect `EXPLAIN`, composite-index leftmost-prefix behavior, transaction isolation, and online-DDL support for the exact operation.
- Consider replication mode and lag during migrations.

## SQLite

- Account for file-level deployment, single-writer behavior, journaling mode, foreign-key configuration, and limited `ALTER TABLE` behavior.
- Favor simple schemas and explicit application-level migration verification.

## Cross-platform review

- Confirm the real engine before writing syntax.
- Cite repository evidence with file and line when available.
- Separate known facts, inferences, and missing operational data.
- Require before/after measurements for performance claims.
