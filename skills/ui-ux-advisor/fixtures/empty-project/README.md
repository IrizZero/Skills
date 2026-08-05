# Fixture: empty-project

**Stack:** unknown
**DESIGN.md exists?** No
**UI source files exist?** No (this folder contains only this README)
**Mode:** B-light

## Simulated invocation

`project_root`: `skills/ui-ux-advisor/fixtures/empty-project/`
User question: "Where should I put the 'Export to Excel' button?"

## Expected output schema (Mode B-light)

```markdown
## UI/UX Consult: Export to Excel button placement (no project context)

**Stack:** unknown
**Recommendation:** Place the Export action in the top-right of the page header or AppBar (whichever the chosen stack uses), as a secondary action distinct from any primary Create/Save action on the page.

**Why:**
- Fitts's law favors a predictable, high-reach-affordance corner for page-level actions; top-right is the conventional slot for non-primary global actions in both web and mobile UI patterns.
- Material 3 guidance places page-level actions in the App Bar's trailing slot; HIG places page-level toolbar actions in the leading or trailing edge depending on platform. Either follows the same "edge, not center" rule.

**Design source:** none

**Rejected:** Body / center placement (low affordance for global action); bottom-anchored placement (reserved for primary CTAs in many patterns; would imply higher priority than Export typically warrants).

[expert-consult-complete]
```

## Pass criteria

- Stack reported as `unknown`.
- `Design source: none` literal string appears.
- At least two named established principles cited (Fitts's law, Material 3, HIG, WCAG — any combination).
- NO project-specific claims (no invented file paths, no invented DESIGN.md sections).
- Sentinel on final line.

## Fail criteria

- Cites a fabricated file path.
- Claims a DESIGN.md section exists when none does.
- No principles cited.
- Sentinel missing.
