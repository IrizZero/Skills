# Project Design System (Flutter)

## Screen anatomy
- AppBar: title + 1-2 primary actions as IconButton in `actions`.
- Body: scrollable content. Forms, lists, detail panels.
- FloatingActionButton: reserved for the screen's single most important action (Create / Add).

## Action affordances
- Page-level data export / share / settings → AppBar `actions` IconButton with tooltip.
- Per-row actions → trailing IconButton in ListTile or PopupMenuButton.
- Destructive → AlertDialog confirm, never direct.

## Theme
- Use `Theme.of(context).colorScheme` for all colors.
- Spacing: `EdgeInsets.all(8/16/24)` — no arbitrary values.
- Typography: `Theme.of(context).textTheme` only.
