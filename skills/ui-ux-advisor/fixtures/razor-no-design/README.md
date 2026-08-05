# Fixture: razor-no-design

**Stack:** ASP.NET Razor
**DESIGN.md exists?** No
**Mode:** B-light
**Files in this fixture for code-scan:** `Index.cshtml`, `_Layout.cshtml`

## Simulated invocation

User question: "Where should I put the new 'Export to Excel' button on the Reports page?"

## Expected output schema (Mode B-light)

```markdown
## UI/UX Consult: Export to Excel button placement

**Stack:** ASP.NET Razor (Razor)
**Recommendation:** Add the button in the same flex row as the existing `<h1>Reports</h1>` / Refresh button group (top of page, right side), using class `btn btn-outline-secondary` and an icon to differentiate from the existing primary Refresh action.

**Why:**
- Existing page anatomy at `Index.cshtml:5-8` places page-level CTAs (Refresh) in a flex row to the right of the title. Export is a page-level action and belongs in the same row.
- Refresh already occupies the `btn-primary` slot at `Index.cshtml:7`. Using `btn-outline-secondary` for Export prevents two equal-weight primary buttons competing for attention.

**Design source:** code-scan: Index.cshtml:5-8, Index.cshtml:7

**Rejected:** Placing in the filter form's row (`Index.cshtml:13-18`) — that row is for input controls, not actions; placing in the table's action column (`Index.cshtml:25`) — that column is per-row actions, not page-level.

[expert-consult-complete]
```

## Pass criteria

- Output cites `Index.cshtml:<line>` (NOT made-up file paths).
- Uses Razor/Bootstrap vocabulary (`btn-primary`, `btn-outline-secondary`, `class`).
- NO Flutter terms.
- "Design source:" begins with `code-scan:`, NOT `docs/ui-ux/DESIGN.md`.
- Sentinel on final line.

## Fail criteria

- Cites a DESIGN.md path (this fixture has none).
- Invents a file path not in the fixture folder.
- Uses Flutter widget vocabulary.
- No citation at all.
