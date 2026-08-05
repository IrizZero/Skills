# Borderline Plan Fixture

> Fixture for yagni-guardian. Expected output: Tier=NONE, 0 findings — all surface-level YAGNI shapes are justified.

**Goal:** Add a caching layer to the post-slug endpoint.

**Spec reference:** `skills/yagni-guardian/fixtures/cache-spec.md`

## Affected files
- Create: `src/cache/post-slug-cache.ts`
- Modify: `src/routes/post.ts`
- Modify: `src/auth/api-key.ts`
- Test: `src/cache/post-slug-cache.test.ts`

### Task 1: Add post-slug cache

**Step 1:** Implementation with cache:

```typescript
// src/cache/post-slug-cache.ts
const cache = new Map<string, string>();
export function getCachedSlug(id: string): string | undefined {
  return cache.get(id);
}
export function setCachedSlug(id: string, slug: string): void {
  cache.set(id, slug);
}
```

**Justification for caching (Y5 carve-out):** Prod metric M2026-04-12 shows /posts/:id/slug endpoint hit 8,200 QPS sustained; p99 latency degraded from 12ms to 380ms during traffic spike. Cache hit ratio simulation projects 92% with 5-min TTL.

**Step 2:** Wire into route:

```typescript
// src/routes/post.ts
import { getCachedSlug, setCachedSlug } from "../cache/post-slug-cache";
import { slugify } from "../text/slugify";

export function getPostSlug(id: string, title: string): string {
  const cached = getCachedSlug(id);
  if (cached) return cached;
  const slug = slugify(title);
  setCachedSlug(id, slug);
  return slug;
}
```

**Justification for `getPostSlug` wrapper (Y2 carve-out):** Route-handler entry point invoked by the Express router at `src/server.ts` — caller exists but is in framework wiring outside this diff's scope. Inlining would force route-handler logic into a closure, breaking testability.

**Step 3:** Add try/catch around external API key validation (Y7 carve-out — trust boundary):

```typescript
// src/auth/api-key.ts
export async function validateApiKey(key: string): Promise<boolean> {
  try {
    const res = await fetch("https://auth.example.com/validate", { /* ... */ });
    return res.ok;
  } catch (err) {
    log.warn("api-key validation failed", err);
    return false;
  }
}
```

(Y7 NOT flagged — external API is a trust boundary; carve-out applies.)
