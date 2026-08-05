# Ledger Pulse

A B2B analytics dashboard for finance ops teams at mid-market SaaS companies.
Connects to QuickBooks / Xero / Stripe and renders MRR / churn / cash-runway
charts, AR aging tables, and customizable KPI cards. Power users live in this
tool for hours; primary actions are filter, drill-down, and export.

Brand voice is "precise, calm, trustworthy" — competing with Causal, Mosaic,
Finmark. No bright orange CTAs; no playful illustrations; lots of dense
tabular data and chart panels. Dark mode is a hard requirement (finance
analysts prefer it at 4am close).

## Expected ui-ux-init behavior
- Invoke with `--overview finance-dashboard/README.md`
- Subagent classifies domain: `finance` / `fintech` / `analytics dashboard`
- Subagent picks palette family: cool-slate / blue
- Accent hex: blues / slates (e.g. `#1d4ed8` or `#0f172a`)
- 3 variants share that palette family; differ on ≥2 of (Layout / Tokens / Components)
- Different from wildlife fixture's palette
