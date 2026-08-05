# Plan: support nested folders in downloads

## Goal

Let users download files from sub-folders of storage, e.g.
`?name=reports/q4.pdf`, instead of only top-level files.

## Affected files

- src/files.py
- src/routes.py

## Steps

1. In `read_stored`, remove the `os.path.basename(name)` call so the full
   relative path the user supplied is honored.
2. Build the path as `os.path.join(STORAGE_DIR, name)` directly from the
   user-supplied `name`.
3. No other changes; `routes.download` already forwards `request.query["name"]`.
