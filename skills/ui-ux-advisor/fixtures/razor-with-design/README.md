# Fixture: razor-with-design

**Stack:** ASP.NET Razor
**DESIGN.md exists?** Yes — at `docs/ui-ux/DESIGN.md` inside this fixture folder.
**UI source files?** None (this fixture exercises the DESIGN.md-first path; code-scan must NOT run).
**Mode:** B-light

## Simulated invocation

`project_root`: `skills/ui-ux-advisor/fixtures/razor-with-design/`
User question: "Where should I put the new 'Export to Excel' button on the Reports page?"
Stack hint (optional): `Razor`

## Expected output schema (Mode B-light)

```markdown
## UI/UX Consult: Export to Excel button placement

**Stack:** ASP.NET Razor (Razor)
**Recommendation:** Place the button in the page header, top-right, as a primary action with class `btn-primary` containing an Excel/file-spreadsheet icon plus the label "Export".

**Why:**
- Export is a page-level action that produces a file from the current view, not a per-row operation — DESIGN.md § Page anatomy puts page-level CTAs in the header.
- Primary-action treatment matches DESIGN.md § Buttons rule for top-right placement; Reports has no other primary CTA competing for that slot.

**Design source:** docs/ui-ux/DESIGN.md § Buttons; docs/ui-ux/DESIGN.md § Page anatomy

**Rejected:** toolbar placement (would imply a bulk-row action — misleading); inline-with-row (per-row CSV link exists elsewhere if user wants row-level export).

[expert-consult-complete]
```

## Pass criteria

- Output uses Razor/CSS vocabulary (`btn-primary`, `class`).
- NO Flutter terms (no `Widget`, `ElevatedButton`, `EdgeInsets`).
- Cites DESIGN.md sections (`§ Buttons`, `§ Page anatomy`).
- "Design source:" begins with `docs/ui-ux/DESIGN.md`. NO `code-scan:` prefix.
- Sentinel `[expert-consult-complete]` on final line.

## Fail criteria

- Output uses HTML elements not in the Bootstrap/Razor idiom (e.g. raw `<button onclick="...">` without `btn-primary`).
- Cites no source.
- Sentinel missing.
- Recommends a CSS framework not present in DESIGN.md.
- "Design source:" line begins with `code-scan:` (subagent ignored the local DESIGN.md).
