# ui-ux-advisor — Test Log

Records per-invoke outcome for each fixture smoke test. One row per test ID — replace the row in place when running a test (do not append duplicates).

## Test runs

| Date | Fixture | Mode | Pass/Fail | Deviation notes |
|---|---|---|---|---|
| _pending_ | razor-with-design/ | B-light | _pending_ | T-A |
| _pending_ | razor-no-design/ | B-light | _pending_ | T-B Razor (uses .cshtml samples) |
| _pending_ | flutter-with-design/ | B-light | _pending_ | T-B Flutter w/ DESIGN.md |
| _pending_ | flutter-no-design/ | B-light | _pending_ | T-B Flutter (uses .dart samples) |
| _pending_ | empty-project/ | B-light | _pending_ | T-C |
| _pending_ | (real brainstorm) | A | _pending_ | T-D — description-only first, then hook block if needed |
| _pending_ | (real ad-hoc Q) | B-light | _pending_ | T-E |

## Notes

### 2026-05-29 — principle-fallback enrichment (ui-pair-enrichment)

Extended the named-principles fallback (used when `Design source: none`) to add WCAG 1.4.3 (contrast on fills), WCAG 2.3.3 (reduced motion), Material 3 elevation + motion tokens, and type-role pairing. Synced across `agents/ui-ux-advisor.md` + `skills/ui-ux-advisor/SKILL.md` (both prose §94 and the Stack-vocabulary `unknown` row) — verified `grep -c "1.4.3" SKILL.md == 2`.

Re-run **flutter-no-design/** and **empty-project/** (the `Design source: none` paths) in a fresh session after deploy to confirm the new principles are citeable and that no CSS vocabulary leaks into Flutter consult output.
