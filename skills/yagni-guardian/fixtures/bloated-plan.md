# Bloated Plan Fixture

> Fixture for yagni-guardian. Expected output: Tier=HARD, 4 findings (Y1, Y2, Y3, Y4).

**Goal:** Add a `slugify` helper that lowercases a string and replaces spaces with hyphens.

**Spec reference:** `skills/yagni-guardian/fixtures/clean-spec.md`

## Affected files
- Create: `src/text/slugify.ts`
- Create: `src/text/slugifier-interface.ts`
- Create: `src/text/format-string-config.ts`
- Create: `src/text/format-string-helper.ts`
- Create: `src/text/profanity-filter.ts`
- Test: `src/text/slugify.test.ts`

### Task 1: Add slugify interface (for future flexibility)

**Step 1:** Define interface:

```typescript
// src/text/slugifier-interface.ts
export interface ISlugifier {
  slugify(input: string): string;
}
```

This interface is added in case we need a second slugifier implementation in the future.
(Y1 trigger: speculative abstraction, no second consumer named.)

### Task 2: Implement slugify with config knob

**Step 1:** Add config:

```typescript
// src/text/format-string-config.ts
export const slugifyConfig = {
  caseStyle: "lowercase",  // never flipped by this plan
  separator: "-",          // never flipped by this plan
};
```

(Y3 trigger: dead config flag, plan never toggles these values.)

**Step 2:** Implementation using helper:

```typescript
// src/text/format-string-helper.ts
export function formatStringHelper(input: string): string {
  return input.toLowerCase().replace(/\s+/g, "-");
}

// src/text/slugify.ts
import { formatStringHelper } from "./format-string-helper";
export function slugify(input: string): string {
  return formatStringHelper(input);
}
```

(Y2 trigger: `formatStringHelper` is a single-caller wrapper, called only from slugify.)

### Task 3: Add profanity filter (not in spec)

**Step 1:** Implementation:

```typescript
// src/text/profanity-filter.ts
const BAD_WORDS = ["..."];
export function filterProfanity(input: string): string {
  return BAD_WORDS.reduce((acc, w) => acc.replace(w, "***"), input);
}
```

**Step 2:** Wire into slugify:

```typescript
import { filterProfanity } from "./profanity-filter";
export function slugify(input: string): string {
  return formatStringHelper(filterProfanity(input));
}
```

(Y4 trigger: feature outside stated request — spec only asked for slugify, not profanity filtering.)
