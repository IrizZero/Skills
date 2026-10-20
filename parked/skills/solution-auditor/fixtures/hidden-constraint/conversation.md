## Turn 1 - user
Audit events need to persist and be queryable by date range. Let's use SQLite, because the box is air-gapped and we can't install any server software.

## Turn 2 - assistant
Makes sense. Roughly how many events per day?

## Turn 3 - user
A few thousand.

## Current direction (main thread, at step 4)
SQLite table via stdlib sqlite3, indexed on event timestamp.
