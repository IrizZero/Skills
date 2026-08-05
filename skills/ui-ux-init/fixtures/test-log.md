# ui-ux-init dogfood log

Optional. This skill is markdown-only — no formal smoke-test gate. The 3 fixture READMEs (`wildlife-conservation/`, `finance-dashboard/`, `bare-empty/`) exist as project-context exemplars you can invoke against if you want to dogfood behavior in a fresh session:

```
ui init --overview skills/ui-ux-init/fixtures/wildlife-conservation/README.md
ui init --overview skills/ui-ux-init/fixtures/finance-dashboard/README.md
ui init --skip-context   # on bare-empty
```

Record outcomes here in any shape you find useful. No required format.

## Entries

### 2026-05-29 — design-depth enrichment (spec/plan: ui-pair-enrichment)

Enriched the 5 stack templates (now in `references/stack-*.md`) + added shared `type_pairing`.

**Automated checks (passed):**
- moat-guard unit tests (`scripts/test_check_flutter_css.py`): 6/6 PASS.
- moat-guard on `references/stack-flutter.md`: exit 0 (CSS-free).
- render-proxy (Flutter template with `{display_font}`/`{body_font}` + variant placeholders substituted) scanned by moat-guard: 0 web-only hits — moat holds on generated output.
- coherence: no hardcoded `Body font: IBM Plex Sans` left in any template; `{display_font}` present in §2 + §9 of all 5; `WCAG 1.4.3` in all 5.
- `deploy.ps1 -DryRun`: `ui-ux-init` skill dir + agent listed (recursive copy carries `references/` + `scripts/`).

**Still requires a live interactive run (could not be automated — `ui init` prompts):**
- Full `ui init` against `wildlife-conservation` (Flutter) / `finance-dashboard` (Razor) / `--skip-context` (generic): confirm subagent returns a themed non-generic `type_pairing`, render resolves placeholders, skip path keeps IBM Plex neutral pairing.
- Run after `deploy.ps1` + a fresh session.
