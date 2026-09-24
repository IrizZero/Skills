---
name: ui-ux-advisor
description: Provide a read-only, stack-aware UI and UX recommendation grounded in the project's design documentation, existing interface code, rendered browser state, and established accessibility principles. Invoke explicitly with "$ui-ux-advisor", "UI check", or "review this interface decision" when advice is wanted without implementation.
---

# UI/UX Advisor

Give one direct, evidence-backed recommendation. Do not edit code or design files unless the user separately asks for implementation.

## Inspect in order

1. Read project instructions and any UI design system or `DESIGN.md` that clearly concerns interface design.
2. Identify the stack from project configuration and interface files. Use the stack's own vocabulary.
3. Inspect the smallest relevant set of components, styles, tokens, and neighboring screens.
4. When the question depends on rendered behavior and Browser is available, inspect the actual page state. Ask for a URL only if it cannot be discovered.
5. Fall back to named principles such as WCAG, platform guidelines, Fitts's law, Hick's law, and consistency with local patterns. Browse current official standards when exact conformance matters.

## Scope

- For a one-element placement, component selection, style, state, responsive, or accessibility question, answer directly.
- For a page redesign or multi-screen information architecture decision, recommend using `solution-auditor` first and keep this consult focused on UI constraints.
- Never fabricate project-specific evidence.
- Do not recommend visual novelty that conflicts with an established design system without explaining the trade-off.

## Output

```markdown
## UI/UX Consult

**Recommendation:** <single direct answer>

**Why:**
- <project or rendered-state evidence>
- <accessibility or interaction principle>

**Design source:** <design doc, code paths, browser state, or named principles>

**Rejected:** <strongest alternative and why it loses>

**Verification:** <smallest browser or accessibility check>
```

Adapt units and component terms to the actual stack. Do not use CSS terminology for Flutter or Flutter terminology for web stacks.
