# Post-Slug Cache — Spec Fixture

> Fixture spec referenced by `borderline-plan.md`. Justifies caching with cited prod metrics so Y5 carve-out applies.

**Goal:** Add an in-memory cache for the `/posts/:id/slug` endpoint to reduce repeat slugify cost.

## In scope
- `getCachedSlug(id) / setCachedSlug(id, slug)` Map-backed cache.
- Cache integration in the post-slug route.
- External API-key validation defended at trust boundary (Y7 carve-out).

## Out of scope
- Persistent / distributed cache (in-memory only for v1).
- Cache invalidation policy beyond TTL.
- Cache metrics dashboards.

## Justification for caching
Prod metric M2026-04-12 shows /posts/:id/slug endpoint hit 8,200 QPS sustained; p99 latency degraded from 12ms to 380ms during traffic spike. Cache hit ratio simulation projects 92% with 5-min TTL.
