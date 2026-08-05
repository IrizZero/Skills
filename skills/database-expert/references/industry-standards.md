# Industry Standards Cited by `database-expert`

This file documents the standards the expert applies. It is loaded on demand
when the expert needs to justify a recommendation with an external citation.
Do not inline this content into responses unless the user explicitly asks
"why does the standard say that".

## Relational fundamentals

- **Codd's 12 rules** (1985) — relational model baseline. Used to justify FK
  integrity, NULL semantics, and view updatability arguments.
- **Normalization (Codd, Boyce)** —
  - 1NF: atomic column values, no repeating groups
  - 2NF: 1NF + no partial dependency on composite PK
  - 3NF: 2NF + no transitive dependency
  - BCNF: every determinant is a candidate key

## SQL standards

- **ANSI SQL-92** — minimum portable SQL feature set. Used when writing
  queries intended to run across SQL Server / PostgreSQL / MySQL without
  platform extensions.
- **ISO/IEC 9075:2016** — current SQL standard. Reference for window
  functions, JSON support, temporal tables.
- **T-SQL (SQL Server dialect)** — primary platform. Microsoft documentation
  is the canonical source.

## Security

- **OWASP Database Security Cheat Sheet** — least privilege, parameterized
  queries, encryption at rest/transit, audit logging.
- **OWASP Top 10 #3 — Injection** — never concatenate user input into SQL.
  Parameterize all queries. Use `sp_executesql` with parameters for dynamic
  T-SQL.
- **CIS Benchmarks for SQL Server** — hardening reference for production
  installations (file permissions, service accounts, surface area
  reduction).

## Platform best practices (SQL Server primary)

- **Microsoft SQL Server Books Online / Learn** — authoritative for T-SQL
  syntax, execution plans, wait stats, system catalog views.
- **SQL Server Customer Advisory Team (SQLCAT) whitepapers** — high-end
  workload guidance.
- **Brent Ozar / Erik Darling / Paul Randal** — practitioner consensus on
  index tuning, parameter sniffing, deadlock analysis.

## Concurrency

- **ACID** — atomicity, consistency, isolation, durability. Baseline
  expectation for OLTP workloads.
- **Isolation levels (ANSI)** — READ UNCOMMITTED / READ COMMITTED /
  REPEATABLE READ / SERIALIZABLE. SQL Server adds SNAPSHOT and READ
  COMMITTED SNAPSHOT (RCSI).
- **Two-phase locking (2PL)** — theoretical foundation for serializability.

## Naming and style

- **PascalCase for tables and stored procedures** (SQL Server convention).
- **`PK_<Table>` for primary keys**, `FK_<Child>_<Parent>` for foreign keys,
  `IX_<Table>_<Columns>` for indexes, `UQ_<Table>_<Columns>` for unique
  constraints, `CK_<Table>_<Column>` for check constraints. Names allow
  schema inspection without opening DDL.
- **Avoid reserved words** as identifiers even when bracket-quoting works.

## Deprecated / anti-recommended

- `TEXT`, `NTEXT`, `IMAGE` — deprecated in SQL Server. Use `VARCHAR(MAX)`,
  `NVARCHAR(MAX)`, `VARBINARY(MAX)`.
- `MONEY` — currency arithmetic rounding errors. Use `DECIMAL(19,4)` or
  similar fixed-precision type.
- `DATETIME` — 3.33 ms precision and pre-1753 dates rejected. Use
  `DATETIME2(N)`.
- `WITH (NOLOCK)` as a default — gives dirty reads. Use RCSI or SNAPSHOT
  isolation instead.
- `SELECT *` in stored procedures, views, and persisted code — breaks on
  schema change, defeats covering indexes.