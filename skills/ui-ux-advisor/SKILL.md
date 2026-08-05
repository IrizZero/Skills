---
name: ui-ux-advisor
description: On-demand UI/UX expert consult for the main session. Invoke whenever a task involves UI signal (page, button, layout, form, component, theme, color, typography, nav, card, modal, mobile, responsive, a11y, design) — including small-scope questions (single-element placement, one style/component pick) and as an optional injection inside superpowers:brainstorming step 4. Stack-aware (ASP.NET Razor, Flutter, React/Vue/etc). Read-only advisor. Discovers the project's UI/UX DESIGN.md anywhere under project_root (canonical paths first, glob fallback, top-50-line UI/UX-signal sniff filters non-UI design docs); falls back to code-scan, then to established principles. Advisory only — never blocks the flow.
---

# ui-ux-advisor

Read-only UI/UX expert consult. Stack-aware. Discovers any qualifying UI/UX `DESIGN.md` under `project_root`; falls back to code-scan; falls back to named UI principles.

## When to invoke

### Trigger A — brainstorm-inject (main-thread invoked, NOT automatic)

> **This does not fire on its own.** No integration block for this skill exists in user-global `~/.claude/CLAUDE.md`, and description-only auto-fire at a mid-flow gate is unreliable — tested and failed for `yagni-guardian` at the equivalent `writing-plans` gate (`yagni-guardian/fixtures/test-log.md`, Task 10, 2026-05-22), where `plan-reviewer` fired (it has a CLAUDE.md block) and `yagni-guardian` did not. Treat Trigger A as a documented option the main thread may take, not a guarantee. If you want it reliable, add a CLAUDE.md block; otherwise invoke by name.

At `superpowers:brainstorming` step 4 ("Propose 2-3 approaches"), AFTER `solution-auditor` returns, BEFORE main thread proposes its own approaches: if topic contains any of these UI-signal terms:

`UI, UX, page, view, screen, layout, button, form, dashboard, modal, component, theme, color, typography, navigation, nav, sidebar, header, footer, card, table, list, menu, dropdown, tooltip, badge, icon, mobile, responsive, dark mode, accessibility, a11y, design, drawer, sheet, dialog, alert, toast`

Main thread invokes the skill and merges the returned **Mode A** consult into the brainstorm step 4 output. Output sits alongside `solution-auditor`'s alternatives, not in place of them.

### Trigger B-light — direct consult (user-invoked, small scope)

User asks a small-scope UI question. Examples:
- "Where should I put the Export button on the Reports page?"
- "Should this state use a banner or a toast?"
- "Card or list for these items?"
- "What color for the delete confirm?"
- "Which icon for 'archive'?"

Main thread invokes the skill directly (no brainstorm). Returns **Mode B-light** consult.

Manual invoke phrases: `ui check`, `ui advisor`, `run ui advisor`.

### Trigger B-routed — user-invoked, big scope

User asks a big-scope UI question. Examples:
- "Redesign the dashboard."
- "Restructure the navigation for the whole app."
- "I want to add a new page for X with these 5 elements."

Main thread invokes `superpowers:brainstorming` first, then invokes this skill at step 4 per Trigger A. Since Trigger A is not automatic, if the brainstorm reaches step 4 without a UI consult, ask for one by name.

### Scope heuristic (B-light vs B-routed)

| Signal | Route |
|---|---|
| 1-element placement | B-light |
| Single style choice | B-light |
| One component pick | B-light |
| ≥2 elements affected | B-routed |
| New page / new view | B-routed |
| Redesign / restructure | B-routed |
| Layout structural change | B-routed |
| Ambiguous | Main thread asks user: "quick consult or full brainstorm?" |

## What it does

1. **Resolve `project_root`.**
   - Explicit arg → use it (e.g. user invokes `ui check <path>`).
   - Inside a `superpowers:brainstorming` flow (Mode A) → repo root (`.`) of the active session.
   - Direct Mode B-light invocation without an arg → repo root (`.`).
   - If the resolved `project_root` does not exist, abort with a one-line error and the sentinel.
2. **Build the input packet** (markdown shape below).
3. **Dispatch the `ui-ux-advisor` subagent** via the Agent tool with `subagent_type: ui-ux-advisor`, `model: opus` (pinned by agent frontmatter), `description: "UI/UX consult: <topic>"`.
4. **Receive the subagent's output** (single markdown message).
5. **Validate the output** — sentinel present on final line; Stack line + Design source line present; if Mode B-light, Recommendation + Why + Rejected sections present. On malformed output, pass through verbatim with a one-line warning prefix.
6. **Emit** into the active flow (Mode A) or to the user (Mode B-light). End with the sentinel.

## Input packet shape (passed to the subagent)

```markdown
# UI/UX consult request

## mode
A | B-light

## project_root
<absolute or repo-relative path; subagent scopes ALL Reads and Globs under this path>

## question
<UI question to advise on, verbatim>

## stack_hint
<optional: Razor | Flutter | React | Vue | Svelte | Astro | HTML/CSS | unknown>

## instructions
Follow the process in your subagent definition. Output schema = Mode <A|B-light>. End with [expert-consult-complete].
```

The subagent then:

1. **Discovers a qualifying `DESIGN.md`** under `<project_root>` via canonical-path probe (`docs/ui-ux/DESIGN.md` → `docs/design/DESIGN.md` → `docs/DESIGN.md` → `DESIGN.md`), then `Glob <project_root>/**/DESIGN.md` fallback. Each candidate is gated by a top-50-line UI/UX-signal sniff (keywords listed in the agent file process step 1). A `DESIGN.md` whose top matter is about DB / API / architecture is skipped — wrong domain. First qualifying file is read in full; its actual path is cited in `Design source`.
2. Globs `<project_root>/**/*.{cshtml,razor,dart,html,tsx,jsx,vue,svelte,astro}` for stack detection (and code-scan fallback when no qualifying DESIGN.md found).
3. Reads up to 5 matched files (200 lines each) for the code-scan path.
4. Falls through to named UI principles (WCAG incl. 1.4.3 contrast + 2.3.3 reduced motion, Material 3 incl. elevation + motion tokens, HIG, Fitts's law, type-role pairing) when neither qualifying DESIGN.md nor UI files exist.
5. Adapts vocabulary to the detected stack — Razor uses `class="..."`/Tag Helpers; Flutter uses Widgets/EdgeInsets and never CSS terms.
6. Returns Mode A or Mode B-light consult with every recommendation citing a source.

## What it does NOT do

- Write or edit any file. Read-only.
- Generate HTML mockups (that is the deferred sibling skill `ui-ux-init`).
- Write or edit `docs/ui-ux/DESIGN.md` (also `ui-ux-init`'s job).
- Search the web (`WebSearch`/`WebFetch` not in subagent tools).
- Override or block any active superpower flow.
- Produce advice using vocabulary the detected stack does not use (no CSS terms in Flutter output; no Widget terms in Razor output).
- Auto-promote to a heavier output tier while inside a flow.

## Integration with superpowers

This skill is **superpower-integrated** (Mode A) AND **standalone** (Mode B-light).

**Integration point:** `superpowers:brainstorming` step 4 ("Propose 2-3 approaches"), invoked AFTER `solution-auditor` returns.

**Sentinel:** every output ends with `[expert-consult-complete]` on the final line of body.

**Advisory-only constraint:** the advisor NEVER overrides or blocks the active superpower flow. If a finding appears to conflict with the flow's direction, the advisor compresses the finding into the smallest useful form and emits the sentinel. The main thread judges what to do with each finding.

**Lightest-output rule (inside a flow):** inside an active superpower flow, the advisor uses Mode A (compact, inline) only. The heavier Mode B-light report is reserved for standalone direct-consult invocations outside any flow.

**Conflict resolution (per project `CLAUDE.md`):**
1. Superpower flow wins.
2. Advisor compresses to smallest useful form.
3. Ends with sentinel.

## Output schemas

### Mode A (brainstorm-inject)

```markdown
## UI/UX Consult

**Stack:** <Razor | Flutter | React | Vue | Svelte | Astro | HTML/CSS | mixed | unknown>
**Design source:** <docs/ui-ux/DESIGN.md | code-scan: file:line, file:line | none>

### Considerations (max 5)
- <point>: <rationale citing source>

### Alternative angle (optional, max 1)
<one paragraph UI-first approach not already in main thread's draft>

### Design tension (omit if none)
- <existing pattern at file:line> conflicts with <proposed element>. Reconcile by <action>.

[expert-consult-complete]
```

### Mode B-light (direct consult)

```markdown
## UI/UX Consult: <question summary>

**Stack:** <as above>
**Recommendation:** <single direct answer>

**Why:**
- <reason citing source>
- <reason citing source>

**Design source:** <DESIGN.md section | code-scan: file:line | none>

**Rejected:** <one-line list of alternatives considered + why>

[expert-consult-complete]
```

## Skip phrases

- `skip ui` — disables Trigger A for the current session.
- `ui advisor off` — same as above.
- Per-invoke skip: user does not invoke.

## Stack vocabulary at a glance

| Stack | Use | Never use |
|---|---|---|
| ASP.NET Razor | `class="..."`, Tag Helpers, Bootstrap/Tailwind utilities, `<button>`, CSS units | Flutter widget names |
| Flutter | `IconButton`, `AppBar`, `EdgeInsets`, `ColorScheme`, `Theme.of(context)` | `class=`, `<button>`, CSS, `px`/`rem` |
| React/Vue/Svelte | Component idioms, hooks/composables/stores, JSX/SFC/template syntax | The other stack's vocab |
| unknown | Named principles only (WCAG incl. 1.4.3/2.3.3, Material 3 incl. elevation + motion, HIG, Fitts's law, type-role pairing) | Fabricated project-specific claims |

[expert-consult-complete]
