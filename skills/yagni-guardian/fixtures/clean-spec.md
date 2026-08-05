# Slugify Helper — Spec Fixture

> Fixture spec referenced by `clean-plan.md` and `bloated-plan.md`. Intentionally minimal scope.

**Goal:** Add a single `slugify` helper that lowercases a string and replaces whitespace runs with a single hyphen.

## In scope
- One pure function: `slugify(input: string): string`.
- One call site: post-route slug generation.
- Unit test for lowercase + hyphenation behavior.

## Out of scope
- Profanity filtering.
- Internationalization / unicode normalization.
- Caching / memoization.
- Configurable case style or separator.
