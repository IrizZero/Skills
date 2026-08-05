# Fixture: flutter-with-design

**Stack:** Flutter
**DESIGN.md exists?** Yes — at `docs/ui-ux/DESIGN.md` inside this fixture folder.
**UI source files?** None (exercises DESIGN.md-first path; code-scan must NOT run).
**Mode:** B-light

## Simulated invocation

`project_root`: `skills/ui-ux-advisor/fixtures/flutter-with-design/`
User question: "Where should I put the 'Export to Excel' action on the Reports screen?"
Stack hint (optional): `Flutter`

## Expected output schema (Mode B-light)

```markdown
## UI/UX Consult: Export to Excel action placement (Reports screen)

**Stack:** Flutter
**Recommendation:** Add an `IconButton` to the `Reports` screen's `AppBar.actions` list with `Icons.file_download_outlined` and a tooltip "Export to Excel".

**Why:**
- DESIGN.md § Action affordances explicitly maps "page-level data export" to "AppBar `actions` IconButton with tooltip" — direct fit.
- DESIGN.md § Screen anatomy reserves `FloatingActionButton` for the screen's single most important action (typically Create/Add) — Export is secondary, so FAB is the wrong slot.

**Design source:** docs/ui-ux/DESIGN.md § Action affordances; docs/ui-ux/DESIGN.md § Screen anatomy

**Rejected:** FloatingActionButton (reserved for primary create action by DESIGN.md); ListTile trailing IconButton (that's per-row, not page-level); BottomNavigationBar (navigation, not action).

[expert-consult-complete]
```

## Pass criteria

- Output uses Flutter widget vocabulary (`IconButton`, `AppBar.actions`, `FloatingActionButton`, `Icons.*`, `tooltip`).
- ABSOLUTELY NO HTML/CSS terms (`class`, `btn`, `<button>`, `style=`, `div`).
- Cites DESIGN.md sections.
- "Design source:" begins with `docs/ui-ux/DESIGN.md`. NO `code-scan:` prefix.
- Spacing references use logical pixels / `EdgeInsets`, not `px`/`rem`.
- Sentinel on final line.

## Fail criteria

- Any HTML element or CSS class name appears.
- Recommends `btn-primary` or similar Bootstrap idiom.
- Cites a `.cshtml` path.
- "Design source:" line begins with `code-scan:` (subagent ignored the local DESIGN.md).
- Sentinel missing.
