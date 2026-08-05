# Clean Plan Fixture

> Fixture for yagni-guardian. Expected output: Tier=NONE, 0 findings.

**Goal:** Add a `slugify` helper that lowercases a string and replaces spaces with hyphens.

**Spec reference:** `skills/yagni-guardian/fixtures/clean-spec.md`

## Affected files
- Create: `src/text/slugify.ts`
- Test: `src/text/slugify.test.ts`

### Task 1: Add slugify helper

**Step 1:** Write test:

```typescript
import { slugify } from "./slugify";

test("lowercases and hyphenates", () => {
  expect(slugify("Hello World")).toBe("hello-world");
});
```

**Step 2:** Implementation:

```typescript
export function slugify(input: string): string {
  return input.toLowerCase().replace(/\s+/g, "-");
}
```

**Step 3:** Caller:

```typescript
// src/routes/post.ts:42
const slug = slugify(post.title);
```

**Step 4:** Commit.
