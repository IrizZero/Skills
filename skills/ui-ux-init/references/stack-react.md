# Stack template: Next.js + React

> Loaded by `ui-ux-init` SKILL.md render step (main thread). One stack per run.
> Emits the 10 DESIGN.md sections in order.

### Stack 3 — Next.js + React

- **Section 1 (Preamble):** "Next.js App Router + Tailwind CSS (theme extended with custom tokens)."
- **Section 2 (Locked Decisions table):** Framework: `Next.js App Router (React 18+)` · Override strategy: `Tailwind theme.extend in tailwind.config.ts + CSS variables in app/globals.css` · Theme name: `<Project Name>` · Accent: `{variant.accent_hex}` (Tailwind class: `bg-[color:var(--accent)]`) · Neutral palette base: slate · Display font: `{display_font}` · Body font: `{body_font}` (both via `next/font/google`) · Mono font: `IBM Plex Mono` (also via `next/font/google`) · Layout style: `{variant.layout_primitive}`.
- **Section 3 (File Locations):** `app/globals.css` (CSS custom properties) · `tailwind.config.ts` (theme.extend) · `app/layout.tsx` (root layout) · `components/ui/` (shadcn-style component library).
- **Section 4 (Design Tokens):** CSS custom properties in `globals.css` AND mirrored in `tailwind.config.ts` theme extension. Token scale per variant.
  - Derive the palette from one seed; OKLCH values in `globals.css` custom properties are the recommended derivation syntax. Mirror tokens in `tailwind.config.ts` theme.extend.
  - **Dark mode (pattern):** use Tailwind `dark:` variants driven by a `class` strategy (`darkMode: 'class'`) or `prefers-color-scheme`; swap the CSS-variable values under `.dark`. (Pattern only.)
- **Section 5 (Layout System):** `app/layout.tsx` skeleton with `<aside>` / `<nav>` / `<main>` per layout primitive. Server components + client components split.
  - **Responsive:** Tailwind breakpoint utilities (`sm:`/`md:`/`lg:`) for viewport; CSS container queries (`@container`) for component-level adaptation.
- **Section 6 (Sidebar / Navigation):** React component skeleton (e.g. `<Sidebar>` with `useSession()` hook for role-guard checks).
- **Section 7 (Component Reference):** JSX examples — `<Button variant="primary">`, `<Card>`, `<DataTable>`, `<Badge>`, `<Input>` (assumes shadcn-ui pattern; project may swap to MUI / Chakra / custom).
  - **Motion (functional):** ~150–250ms ease-in-out; prefer the Motion library (`framer-motion`) for orchestrated reveals, CSS transitions for simple states. Respect `prefers-reduced-motion` (Motion's `useReducedMotion()` or a CSS media query).
- **Section 8 (View Patterns):** Server component for data fetch + client component for interactive bits. CRUD page = `app/items/[id]/page.tsx` (server) + `app/items/[id]/edit-form.tsx` (client `'use client'`).
- **Section 9 (Typography Conventions):** Two type roles via `next/font/google`: load `{display_font}` and `{body_font}` as font objects, expose them as CSS variables on `<body>` (`className={`${display.variable} ${body.variable}`}`), and map Tailwind `fontFamily.display` / `fontFamily.sans` to those vars. Mono = IBM Plex Mono (`font-mono`). Headings `font-bold`. Never hardcode a family at a call site.
- **Section 10 (What NOT to Do):** Seeded: "Do not use inline `style={{...}}` for token values — use Tailwind classes or CSS variables", "Do not mix shadcn components with raw Tailwind utilities arbitrarily — pick one pattern per surface", "Do not bypass `next/font` for typography imports".
  - Do not nest card components inside cards — flatten the surface hierarchy.
  - Do not put low-contrast text on colored fills — 4.5:1 (WCAG 1.4.3).
  - Permit the chosen display + body fonts via `next/font`; do not pull in OTHER font imports.
