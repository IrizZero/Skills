---
name: ui-ux-init
description: Bootstrap docs/ui-ux/DESIGN.md for a project that lacks one. Asks for project context (paste a brief, point to an overview file via --overview, or `skip` for neutral defaults). Subagent reasons about domain and proposes 3 distinct themed variants — different layout primitive, token scale, component default; all share a domain-themed accent palette family. User picks one variant, then picks stack (Razor / Flutter / Next-React / Vue / generic-translatable). Skill writes DESIGN.md filled from picked variant + stack template. Generic-translatable stack includes per-section Translation hints for downstream agents on other stacks. Ships per-variant standalone HTML preview in .ui-ux-init-preview/ for visual side-by-side comparison. Refuses to overwrite existing DESIGN.md without --force. Standalone, user-invoked via phrases "ui init", "ui-ux init", "bootstrap design", "init design".
---

# ui-ux-init

Standalone skill that bootstraps `docs/ui-ux/DESIGN.md` for a project that lacks one. Context-driven (no repo scan). v2 — supersedes v1 scan-driven hybrid (commits `8a6878b` through `e6f3be6`).

## When to invoke

User-invoked only. Trigger phrases:
- `ui init`
- `ui-ux init`
- `bootstrap design`
- `init design`

No auto-fire from any superpower flow. No hook block in `~/.claude/CLAUDE.md`.

## What it does (end-to-end flow)

1. Resolve `project_root` (explicit arg or cwd).
2. Parse flags (`--force`, `--draft`, `--keep-preview`, `--overview <path>`, `--skip-context`, `--no-commit`, `--walk`, `--re-roll-extra`).
3. Check target file:
   - target = `docs/ui-ux/DESIGN.md` (default):
     - exists, no `--force` → REFUSE: `DESIGN.md exists at <path>. Pass --force to overwrite, or --draft to write docs/ui-ux/DESIGN.draft.md.`
     - exists, `--force` → continue (loud overwrite confirm at step 15).
     - absent → continue.
   - target = `docs/ui-ux/DESIGN.draft.md` (under `--draft`):
     - canonical DESIGN.md irrelevant under `--draft` (never read or clobbered).
     - draft exists, no `--force` → REFUSE: `DESIGN.draft.md exists at <path>. Pass --force to overwrite the draft, or delete it first.`
     - draft exists, `--force` → continue (loud overwrite confirm at step 15).
     - draft absent → continue.
4. Prompt user for project context. Three input modes:
   a. Inline paste — show prompt: `Tell me about this project (1-3 sentences, brand voice, target user, domain). Or press Enter / type 'skip' for neutral defaults.`
   b. `--overview <path>` flag was passed at invocation → read the file content into a string; skip the inline prompt.
   c. User types `skip` (or empty submit) at the inline paste prompt, OR `--skip-context` flag was passed → no subagent dispatch.
5. If context provided (paste or file), dispatch the `ui-ux-init` subagent. If `skip`, jump to step 7 using fixed neutral defaults below.
6. Receive 3-variant response packet from subagent.
7. Validate packet (sentinel `[ui-init-variants-ready]` on final line; exactly 3 variants; variant_A/B/C each have Layout / Tokens / Component default / Accent hex; palette_family field; type_pairing block with Display + Body present (non-skip responses only); within-batch ≥2-axis diff per pair).
8. Render 3 HTML previews from the "Preview HTML template" below + per-variant substitutions. Write to `.ui-ux-init-preview/variant-{A,B,C}.html`.
9. Append `.ui-ux-init-preview/` to `.gitignore` if absent.
10. Present variants summary to user — one paragraph per variant (Layout / Scale / Components / Accent hex / preview file path). Prompt: `Pick A, B, C, 'more' to re-roll, or 'cancel'.`
11. Branch on response:
    - `A` / `B` / `C` → proceed to step 13.
    - `more` → re-dispatch subagent with `re_roll` in flags + `previous_variants` list (3 prior axis tuples). On return, re-validate per step 7 (positional ≥2-axis diff vs previous variants AND within-batch ≥2-axis diff). Re-render previews (step 8). Loop back to step 10. One re-roll allowed unless `--re-roll-extra` was passed; second `more` exits with: `Already re-rolled once. Pass --re-roll-extra at invocation to re-roll again, or pick A/B/C.`
    - `cancel` → clean up `.ui-ux-init-preview/` and exit with no writes.
12. (Reserved.)
13. Prompt for stack: `Stack? (1) ASP.NET Razor (2) Flutter (3) Next.js + React (4) Vue (5) generic-translatable HTML.`
14. User picks `1`-`5`.
15. If `--force` was passed at invocation, confirm overwrite: `About to write/overwrite <target path> with variant <X> on <stack>. Proceed? (y/n)`. If no → cancel as in step 11.
16. If `--walk` was passed, walk user through each of the 10 DESIGN.md sections in turn (render + edit). Else proceed.
17. Read `references/stack-<picked stack>.md` and render DESIGN.md from
    `(picked variant × that template × domain label × type_pairing)`. Write to target path.
18. Clean up `.ui-ux-init-preview/` (unless `--keep-preview`).
19. Print summary: path written, sections included, advisor's next step (`ui-ux-advisor will now cite <path>`).
20. Ask `Stage + commit? (y/n)` unless `--no-commit`. If yes → `git add <path>` + `git commit -m "docs(ui-ux): bootstrap DESIGN.md (variant <X> on <stack> via ui-ux-init)"`.

## Input packet shape (skill → subagent)

```markdown
# ui-ux-init request

## project_context
<project context string — paste content, --overview file content, or empty under skip>

## flags
<comma-separated list: walk, keep-preview, re_roll>

## previous_variants (only if re_roll is in flags)
<3 prior variants as axis tuples; positional re-roll rule: new_A vs old_A, new_B vs old_B, new_C vs old_C must each differ on ≥2 of (Layout / Tokens / Component default)>

## instructions
Classify domain. Map to palette family. Pick 3 distinct variant configs satisfying the within-batch ≥2-axis-difference rule (and positional rule on re-roll). Return response packet. End with [ui-init-variants-ready].
```

## Subagent response packet schema (received by skill)

```markdown
# ui-ux-init variants

## domain
<label, e.g. "wildlife conservation">

## palette_family
<label + 1-2 hex>

## type_pairing
**Display:** <display font family>
**Body:** <body font family>
**Mono:** IBM Plex Mono

## variant_A
**Layout:** <layout primitive>
**Tokens:** <scale label + 5-value scale>
**Component default:** <label>
**Accent hex:** <hex>

## variant_B
<same shape, differing from A on ≥2 of (Layout / Tokens / Component default)>

## variant_C
<same shape, differing from A and B on ≥2 of (Layout / Tokens / Component default)>

## reasoning
<one paragraph>

[ui-init-variants-ready]
```

## Fixed neutral defaults (used under `skip` / `--skip-context`)

Subagent NOT dispatched. Use these 3 deterministic preset configs:

| Variant | Layout | Scale | Components | Accent |
|---|---|---|---|---|
| A | sidebar-left | comfortable (4/8/16/24/32) | filled+rounded | `#475569` |
| B | topnav | compact (4/8/12/16/24) | outline+sharp | `#475569` |
| C | split-pane | spacious (8/16/24/40/56) | ghost+soft-shadow | `#475569` |

Domain = `generic`. Palette family = `neutral`. Same A/B/C every invocation.

Type pairing under skip: Display = `IBM Plex Sans`, Body = `IBM Plex Sans`, Mono = `IBM Plex Mono`.
This is the deliberate NEUTRAL pairing (no domain signal), not the everywhere-default the
themed path avoids.

## Flags

| Flag | Behaviour |
|---|---|
| `--force` | Overwrite the existing target file (with confirmation prompt at step 15). Target is `docs/ui-ux/DESIGN.md` by default, or `docs/ui-ux/DESIGN.draft.md` when combined with `--draft`. |
| `--draft` | Write to `docs/ui-ux/DESIGN.draft.md` instead of canonical path. Never reads or clobbers canonical. If draft exists, requires `--force` to overwrite. |
| `--keep-preview` | Skip preview-dir cleanup after pick. |
| `--overview <path>` | Read project context from file at `<path>` (relative to project_root or absolute). Skips inline paste prompt. |
| `--skip-context` | Equivalent to typing `skip`. Uses fixed neutral defaults. Subagent not dispatched. |
| `--no-commit` | Skip stage+commit prompt at step 20. |
| `--walk` | Force per-section walk-through after pick. |
| `--re-roll-extra` | Allow more than one `more` re-roll per invocation. |

## Preview HTML template

Same skeleton across all variants; substitutions per axis values.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>ui-ux-init preview — variant {LETTER}</title>
<style>
  :root {
    --accent: {ACCENT_HEX};
    --bg: #fafafa;
    --surface: #ffffff;
    --border: #e5e5e5;
    --text: #1a1a1a;
  }
  body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); margin: 0; }
  .shell { display: {LAYOUT_DISPLAY}; min-height: 100vh; }
  .sidebar, .topnav { background: #1a1a1a; color: white; padding: {SCALE_LG}px; }
  .sidebar { width: 220px; }
  .topnav { width: 100%; }
  .content { padding: {SCALE_LG}px; flex: 1; }
  .btn { padding: {SCALE_SM}px {SCALE_MD}px; background: {COMPONENT_BG}; color: {COMPONENT_FG}; border: {COMPONENT_BORDER}; border-radius: {COMPONENT_RADIUS}px; cursor: pointer; }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: {COMPONENT_RADIUS}px; padding: {SCALE_LG}px; margin: {SCALE_MD}px 0; {COMPONENT_SHADOW} }
  table { width: 100%; border-collapse: collapse; }
  td, th { padding: {SCALE_SM}px; border-bottom: 1px solid var(--border); text-align: left; }
  input { padding: {SCALE_SM}px; border: 1px solid var(--border); border-radius: {COMPONENT_RADIUS}px; width: 100%; box-sizing: border-box; }
</style>
</head>
<body>
<div class="shell">
  {LAYOUT_CHROME}
  <div class="content">
    <h1>Variant {LETTER} preview — {DOMAIN_LABEL}</h1>
    <button class="btn">Primary action</button>
    <div class="card"><strong>Card</strong><p>Sample card body using variant {LETTER} tokens.</p></div>
    <table><thead><tr><th>Name</th><th>Value</th></tr></thead><tbody><tr><td>Token scale</td><td>{SCALE_LABEL}</td></tr></tbody></table>
    <input placeholder="Sample form input">
  </div>
</div>
</body>
</html>
```

Substitution map:
- `{LETTER}` — A / B / C
- `{DOMAIN_LABEL}` — domain string from subagent response (or `generic` under skip)
- `{ACCENT_HEX}` — variant's accent hex
- `{LAYOUT_DISPLAY}` — `flex` for sidebar-left + split-pane; `block` for topnav + mobile-drawer
- `{LAYOUT_CHROME}` — `<aside class="sidebar">Nav</aside>` for sidebar-left; `<nav class="topnav">Nav</nav>` for topnav; `<aside class="sidebar">Detail</aside>` for split-pane; `<nav class="topnav">☰ Menu</nav>` for mobile-drawer
- `{SCALE_SM/MD/LG}` — middle 3 of variant's 5-value scale (drop smallest + largest). Compact 4/8/12/16/24 → SM=8 MD=12 LG=16. Comfortable 4/8/16/24/32 → SM=8 MD=16 LG=24. Spacious 8/16/24/40/56 → SM=16 MD=24 LG=40.
- `{SCALE_LABEL}` — `compact` / `comfortable` / `spacious`
- `{COMPONENT_BG}` — `var(--accent)` for filled+rounded; `transparent` for outline+sharp; `transparent` for ghost+soft-shadow
- `{COMPONENT_FG}` — `white` for filled+rounded; `var(--accent)` for outline+sharp; `var(--accent)` for ghost+soft-shadow
- `{COMPONENT_BORDER}` — `none` for filled+rounded; `1px solid var(--accent)` for outline+sharp; `none` for ghost+soft-shadow
- `{COMPONENT_RADIUS}` — `8` for filled+rounded; `0` for outline+sharp; `12` for ghost+soft-shadow
- `{COMPONENT_SHADOW}` — `box-shadow: 0 2px 8px rgba(0,0,0,0.05);` for ghost+soft-shadow; empty for filled+rounded + outline+sharp

## DESIGN.md stack templates

The 5 stack templates live in `references/stack-{razor,flutter,react,vue,generic}.md`,
one file per stack. At render time (workflow step 17) the main thread reads ONLY the
picked stack's file and renders DESIGN.md from it. The subagent never reads these files.

All templates emit the same 10 sections in order: 1 Preamble · 2 Locked Decisions ·
3 File Locations · 4 Design Tokens · 5 Layout System · 6 Sidebar/Navigation (omitted on
generic) · 7 Component Reference · 8 View Patterns · 9 Typography Conventions ·
10 What NOT to Do.

**Template font substitutions (render step):** the picked stack template uses `{display_font}` and `{body_font}`; resolve them as:
- `{display_font}` → `type_pairing.Display` (or `IBM Plex Sans` under skip)
- `{body_font}` → `type_pairing.Body` (or `IBM Plex Sans` under skip)

## Cross-skill note

After this skill ships, `ui-ux-advisor` emits a one-line tip in its `Design source: none` branch: `> Tip: run \`ui init\` to seed a docs/ui-ux/DESIGN.md so future consults cite project-specific patterns.` That edit already shipped at commit `5ad74d6`. Advisor still does NOT auto-invoke `ui init` — the tip is informational only.
