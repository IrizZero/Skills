# Fixture: flutter-no-design

**Stack:** Flutter
**DESIGN.md exists?** No
**Mode:** B-light
**Files in this fixture for code-scan:** `home_screen.dart`, `app_theme.dart`

## Simulated invocation

User question: "Where should I put the 'Export to Excel' action on the Reports screen?"

## Expected output schema (Mode B-light)

```markdown
## UI/UX Consult: Export to Excel action placement (Reports screen)

**Stack:** Flutter
**Recommendation:** Add an `IconButton` to `HomeScreen`'s `AppBar.actions` list (at `home_screen.dart:10-15`), placed AFTER the existing Refresh IconButton, with `Icons.file_download_outlined` and a tooltip "Export to Excel".

**Why:**
- `home_screen.dart:10-15` already establishes the convention of placing page-level actions in `AppBar.actions` (Refresh is there). Export is a page-level action of the same character — same slot.
- Using `IconButton` keeps spacing consistent with the existing affordance; using a labeled `TextButton` or `FilledButton` instead would break the icon-only AppBar pattern visible in this file.

**Design source:** code-scan: home_screen.dart:10-15

**Rejected:** FloatingActionButton (Scaffold has none currently and adding one would imply a primary create action that does not match Export's role); inserting inside the ListView body (per-row affordance area, not page-level); modifying app_theme.dart (theme file, not screen affordances).

[expert-consult-complete]
```

## Pass criteria

- Output uses Flutter widget vocabulary only.
- NO HTML/CSS terms.
- Cites `home_screen.dart:<line>` precisely.
- "Design source:" begins with `code-scan:`.
- Recognizes existing pattern at `home_screen.dart:10-15`.

## Fail criteria

- Any HTML/CSS term appears.
- Invents a file not in the fixture.
- No line citation.
- Recommends destroying existing pattern without reason.
