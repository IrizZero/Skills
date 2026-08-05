# Project Design System

## Buttons
- Primary actions: top-right of page header, `btn-primary` class.
- Secondary actions: inline with the row they apply to, `btn-outline-secondary`.
- Destructive actions: confirm-modal triggered from anywhere; never raw `btn-danger` without modal.

## Page anatomy
- Page header: title + primary CTAs, fixed top.
- Toolbar: bulk actions + filters, sticky under header.
- Content: data table or detail panel.

## Spacing scale
- 4 / 8 / 16 / 24 / 32 / 48 px. Use Bootstrap utilities `p-*`, `m-*`, `gap-*`.
