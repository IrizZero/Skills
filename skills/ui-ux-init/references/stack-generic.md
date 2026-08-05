# Stack template: generic-translatable

> Loaded by `ui-ux-init` SKILL.md render step (main thread). One stack per run.
> Emits the 10 DESIGN.md sections in order.

### Stack 5 — generic-translatable

This stack is consumable by ANY downstream agent. Each section emits a plain HTML/CSS example PLUS a `**Translation hints (for downstream agents on other stacks):**` block listing the canonical idiom on each of Stacks 1-4.

- **Section 1 (Preamble):** "Plain HTML/CSS reference. This file is consumable by future agents on any stack — see Translation hints under each section."
- **Section 2 (Locked Decisions table):** Framework: `HTML/CSS (translatable)` · Override strategy: `CSS custom properties in css/site.css` · Theme name: `<Project Name>` · Accent: `{variant.accent_hex}` · Neutral palette base: slate · Display font: `{display_font}` · Body font: `{body_font}` · Mono font: `IBM Plex Mono` · Layout style: `{variant.layout_primitive}`. Plus `**Translation hints**` block mapping each decision to where it lives on Razor / Flutter / React / Vue.
- **Section 3 (File Locations):** `css/site.css` (tokens) plus a note "(file structure depends on stack — see Translation hints in each subsequent section)".
- **Section 4 (Design Tokens):** CSS custom properties + Translation hints:
  - ASP.NET Razor: declare under `:root` in `wwwroot/css/site.css`; reference via `var(--token-name)`.
  - Flutter: declare as `static const Color tokenName = Color(0xFF...);` in `lib/theme/app_theme.dart`.
  - React (Next.js): declare in `app/globals.css` as CSS custom properties AND mirror in `tailwind.config.ts` theme extension.
  - Vue: declare as CSS custom properties in `src/assets/main.css`.
  - Single-seed-derived palette + dark-mode pattern. **Translation hints:**
    - Razor: OKLCH custom properties; dark via `prefers-color-scheme` / `[data-theme]`.
    - Flutter: `ColorScheme.fromSeed`; dark via second `ThemeData` (`brightness: Brightness.dark`).
    - React: OKLCH vars mirrored in Tailwind; dark via `darkMode: 'class'`.
    - Vue: OKLCH vars in `main.css`; dark via `[data-theme]`.
- **Section 5 (Layout System):** HTML skeleton + Translation hints:
  - ASP.NET Razor: `Views/Shared/_Layout.cshtml` with `<aside class="sidebar">` + `<main class="content">@RenderBody()</main>`.
  - Flutter: `Scaffold(drawer: Drawer(child: ...), body: ...)` (mobile-drawer) or `Scaffold(body: Row(children: [NavigationRail(...), Expanded(...)]))` (sidebar-left).
  - React (Next.js): `app/layout.tsx` with `<aside>`/`<nav>` + `{children}`.
  - Vue: `App.vue` `<template>` with `<aside>`/`<nav>` + `<router-view />`.
  - **Responsive: components adapt to available space.** Translation hints: Razor Bootstrap grid/`@media` + container queries (`@container`); Flutter `MediaQuery`/`LayoutBuilder`/`Wrap`; React Tailwind breakpoints + `@container`; Vue `@media` + container queries.
- **Section 6 (Sidebar / Navigation):** **OMITTED on generic-translatable.** Layout System Translation hints cover stack-specific nav patterns; no separate Sidebar section emitted.
- **Section 7 (Component Reference):** Each component (Buttons / Cards / Page Header / Tables / Badges / Forms) emits an HTML example + Translation hints. Example for Buttons:
  ```html
  <button class="btn btn-primary">Save</button>
  ```
  **Translation hints (for downstream agents on other stacks):**
  - ASP.NET Razor: same HTML; classes map to Bootstrap-overridden `.btn` variants in `wwwroot/css/site.css`.
  - Flutter: `FilledButton(onPressed: ..., child: const Text('Save'))` with `Theme.of(context).colorScheme.primary` as background.
  - React (Next.js): `<Button variant="primary">Save</Button>` per project's component library (shadcn / MUI / Chakra / custom).
  - Vue: `<button class="btn btn-primary">Save</button>` (template) or `<BaseButton variant="primary">Save</BaseButton>` per project convention.
  - **Motion (functional, ~150–250ms, ease-in-out, honor reduced-motion).** Translation hints: Razor `transition`+`cubic-bezier`+`prefers-reduced-motion`; Flutter `AnimatedContainer`/`Curves.easeInOut`/`MediaQuery.disableAnimations`; React `framer-motion`/`useReducedMotion()`; Vue `<Transition>`/`prefers-reduced-motion`.
- **Section 8 (View Patterns):** HTML CRUD skeleton + Translation hints mapping to each stack's CRUD pattern (Razor MVC controller + view, Flutter Scaffold + FAB, React server-component + client-form, Vue SFC + composable).
- **Section 9 (Typography Conventions):** Two type roles — Display `{display_font}` + Body `{body_font}` (Mono = IBM Plex Mono). HTML/CSS example uses `--font-display` / `--font-body` vars.
  **Translation hints (for downstream agents on other stacks):**
  - Razor: CSS vars in `site.css` + one Google Fonts `@import`.
  - Flutter: declare both in `pubspec.yaml` `flutter.fonts`; bind via `TextTheme` (`fontFamily`).
  - React (Next.js): `next/font/google` font objects exposed as CSS variables.
  - Vue: CSS vars in `main.css` + `@import`.
- **Section 10 (What NOT to Do):** Seeded: "Do not assume any specific component library — this is a translatable spec", "Do not add stack-specific code outside the Translation hints blocks", "Do not omit the Translation hints block under a new section".
  - Do not nest cards/surfaces — breaks elevation hierarchy (Material 3).
  - Do not put low-contrast text on colored fills — 4.5:1 (WCAG 1.4.3).
  - Permit only the declared display + body (+ mono) fonts.
