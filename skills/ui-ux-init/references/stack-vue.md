# Stack template: Vue

> Loaded by `ui-ux-init` SKILL.md render step (main thread). One stack per run.
> Emits the 10 DESIGN.md sections in order.

### Stack 4 — Vue

- **Section 1 (Preamble):** "Vue 3 (Composition API) + Vite + Tailwind (or your CSS framework of choice)."
- **Section 2 (Locked Decisions table):** Framework: `Vue 3 + Vite` · Override strategy: `CSS custom properties in src/assets/main.css + Tailwind theme.extend (if Tailwind used)` · Theme name: `<Project Name>` · Accent: `{variant.accent_hex}` · Neutral palette base: slate · Display font: `{display_font}` · Body font: `{body_font}` (via `@import` in `main.css`) · Mono font: `IBM Plex Mono` · Layout style: `{variant.layout_primitive}`.
- **Section 3 (File Locations):** `src/assets/main.css` (tokens) · `src/App.vue` (root SFC) · `src/components/` (SFCs).
- **Section 4 (Design Tokens):** CSS custom properties in `main.css`. Token scale per variant.
  - Derive the palette from one seed; OKLCH custom properties in `main.css` are the recommended derivation syntax.
  - **Dark mode (pattern):** swap CSS-variable values under `@media (prefers-color-scheme: dark)` or a `[data-theme="dark"]` selector toggled by app state. (Pattern only.)
- **Section 5 (Layout System):** `<template>` skeleton in `App.vue` with `<aside>` / `<nav>` per layout primitive.
  - **Responsive:** CSS `@media` breakpoints (or Tailwind utilities if used); CSS container queries for component-level adaptation.
- **Section 6 (Sidebar / Navigation):** Vue SFC skeleton with `<script setup>` + role-guard computed property.
- **Section 7 (Component Reference):** Raw HTML `<button class="...">` OR `<BaseButton variant="primary">` SFCs. Cards = `<BaseCard>`. Forms = `<BaseInput>` per project convention.
  - **Motion (functional):** ~150–250ms ease-in-out via Vue `<Transition>` / CSS transitions. Honor `@media (prefers-reduced-motion: reduce)`.
- **Section 8 (View Patterns):** `<script setup>` + `<template>` + `<style scoped>` per view component. CRUD page = SFC + `useFetch` composable.
- **Section 9 (Typography Conventions):** Two type roles as CSS vars in `src/assets/main.css`: `--font-display: '{display_font}', system-ui, sans-serif;` and `--font-body: '{body_font}', ...;`. Import both via one `@import url(...)`. Headings use `var(--font-display)`, body `var(--font-body)`. Mono = IBM Plex Mono. Heading weight 700. Never set font-family inline in an SFC `<style>`.
- **Section 10 (What NOT to Do):** Seeded: "Do not bypass scoped styles with global selectors", "Do not import additional Google Fonts", "Do not couple SFCs to Vuex store when Pinia is the project standard".
  - Do not nest card SFCs inside cards — flatten the surface hierarchy.
  - Do not put low-contrast text on colored fills — 4.5:1 (WCAG 1.4.3).
  - Permit the chosen display + body fonts in the `@import`; do not import OTHER fonts.
