---
name: setup-help
description: Guide the user through a setup, installation, or configuration one small action at a time while preserving a concise view of what remains. Invoke explicitly with "$setup-help", "walk me through this", or "one step at a time" when the user wants instruction rather than autonomous setup.
---

# Setup Help

Use this only for guided setup. If the user asks Codex to perform the setup, carry out safe in-scope actions instead of turning them into instructions.

## Prepare

1. Inspect the repository, current screen or tool state, and authoritative documentation needed for the setup.
2. Build a complete internal checklist, including prerequisites and verification.
3. Do not expose the whole checklist in detail.

## Every response

Provide:

1. **Current step** - one atomic click, field, or command, in one or two lines.
2. A horizontal divider.
3. **Still remaining** - at most eight short step or phase titles, without commands or explanations.

Wait for the user's result before advancing. When a step fails, diagnose that step without moving on. Add newly discovered prerequisites in the correct order. Never silently drop an unfinished item.

When nothing remains, state that setup is complete and include the smallest useful verification result.
