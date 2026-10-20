# Post Slugs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every new post gets a slug: the title lowercased, whitespace runs replaced by one hyphen.

**Architecture:** `slugify` implements an `ISlugifier` interface so other slugifiers can be added later. It reads its case style and separator from `slugifyConfig`, delegates the string work to `formatStringHelper`, and runs `filterProfanity` first so slugs stay clean. The post-create route calls it.

**Tech Stack:** TypeScript, Express 4, Vitest, supertest.

**Spec:** `skills/plan-reviewer/fixtures/yagni-bloat/spec.md`

## Global Constraints

- No new runtime dependencies.

## Review Focus

- A request whose `title` is not a string: the route answers 400 with `{ "error": "title must be a string" }`, never 500.

---

### Task 1: Slugifier interface

**Files:**
- Create: `src/text/slugifier-interface.ts`

**Interfaces:**
- Produces: `interface ISlugifier { slugify(input: unknown): string }`

- [ ] **Step 1: Define `ISlugifier` in `src/text/slugifier-interface.ts`**
- [ ] **Step 2: Commit**

### Task 2: Slug config and string helper

**Files:**
- Create: `src/text/format-string-config.ts`
- Create: `src/text/format-string-helper.ts`

**Interfaces:**
- Produces: `slugifyConfig: { caseStyle: "lowercase"; separator: "-" }` and `formatStringHelper(input: string): string`

- [ ] **Step 1: Export `slugifyConfig = { caseStyle: "lowercase", separator: "-" }` from `src/text/format-string-config.ts`**
- [ ] **Step 2: Implement `formatStringHelper(input: string): string` in `src/text/format-string-helper.ts`**

Lowercase when `slugifyConfig.caseStyle` is `"lowercase"`, then replace `/\s+/g` with `slugifyConfig.separator`.

- [ ] **Step 3: Commit**

### Task 3: slugify

**Files:**
- Create: `src/text/profanity-filter.ts`
- Create: `src/text/slugify.ts`
- Test: `src/text/slugify.test.ts`

**Interfaces:**
- Consumes: `ISlugifier` (Task 1), `formatStringHelper` (Task 2)
- Produces: `slugify(input: unknown): string`, `filterProfanity(input: string): string`

- [ ] **Step 1: Write the failing tests**

```ts
test("lowercases and hyphenates", () => {
  expect(slugify("Hello   World")).toBe("hello-world");
});
test("rejects a non-string title", () => {
  expect(() => slugify(42)).toThrow(TypeError);
});
```

- [ ] **Step 2: Run `npx vitest run src/text/slugify.test.ts`.** Expected: FAIL, `slugify` is not defined.
- [ ] **Step 3: Implement `filterProfanity(input: string): string` in `src/text/profanity-filter.ts`**

Replace each word of a `BAD_WORDS` list with `***`.

- [ ] **Step 4: Implement `slugify(input: unknown): string` in `src/text/slugify.ts`, as an `ISlugifier`**

Throw `TypeError("title must be a string")` when `input` is not a string: the route passes `req.body.title` straight from the request (`src/routes/posts.ts:7`). Otherwise return `formatStringHelper(filterProfanity(input))`.

- [ ] **Step 5: Run `npx vitest run src/text/slugify.test.ts`.** Expected: PASS.
- [ ] **Step 6: Commit**

### Task 4: Slugs in the post route

**Files:**
- Modify: `src/routes/posts.ts:8`
- Test: `src/routes/posts.test.ts`

**Interfaces:**
- Consumes: `slugify(input: unknown): string` (Task 3)

- [ ] **Step 1: Write the failing tests**

```ts
const app = express().use(express.json()).use(posts);
test("creates a slug", async () => {
  const res = await request(app).post("/posts").send({ title: "Hello World" });
  expect(res.status).toBe(201);
  expect(res.body.slug).toBe("hello-world");
});
test("rejects a non-string title", async () => {
  const res = await request(app).post("/posts").send({ title: 42 });
  expect(res.status).toBe(400);
  expect(res.body).toEqual({ error: "title must be a string" });
});
```

- [ ] **Step 2: Run `npx vitest run src/routes/posts.test.ts`.** Expected: FAIL.
- [ ] **Step 3: At `src/routes/posts.ts:8`, set `slug: slugify(title)`; on `TypeError`, answer 400 with `{ error: "title must be a string" }`**
- [ ] **Step 4: Run `npx vitest run`.** Expected: PASS.
- [ ] **Step 5: Commit**
