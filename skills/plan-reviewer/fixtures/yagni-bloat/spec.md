# Post Slugs - Design

**Goal:** Give every new post a URL slug: the title lowercased, with each run of whitespace replaced by a single hyphen.

## In scope
- One pure function: `slugify(input): string`.
- One call site: slug generation in the post-create route.
- Unit tests for lowercasing and hyphenation.
- The route answers 400 when the request's `title` is not a string.

## Out of scope
- Profanity filtering.
- Internationalization and unicode normalization.
- Caching or memoization.
- Configurable case style or separator.
