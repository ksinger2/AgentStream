---
name: caching-strategy
description: Caching patterns — CDN vs application vs database cache, invalidation strategies, cache key design
---

# Caching Strategy

Decision framework for when, where, and how to cache, plus invalidation patterns.

## Cache Layers

| Layer | Latency | Best For | Technology |
|-------|---------|----------|------------|
| Browser cache | 0ms | Static assets, API responses | Cache-Control headers |
| CDN | 5-50ms | Static assets, public pages | Cloudflare, CloudFront, Vercel |
| Application cache | 1-5ms | Session data, computed results | Redis, Memcached |
| Database query cache | 1-10ms | Repeated queries, aggregations | Built-in query cache, materialized views |

## Decision Framework

```
Is the data public and identical for all users?
├── YES → CDN cache (static assets, marketing pages, public API responses)
└── NO → Is the data user-specific but read-heavy?
    ├── YES → Application cache (session, preferences, computed dashboards)
    └── NO → Is it an expensive query run repeatedly?
        ├── YES → Database query cache / materialized view
        └── NO → Don't cache — complexity isn't worth it
```

## Cache-Control Headers

```
# Static assets (CSS, JS, images) — immutable, cache forever
Cache-Control: public, max-age=31536000, immutable

# API responses (public, short-lived)
Cache-Control: public, max-age=60, s-maxage=300

# User-specific data (private, revalidate)
Cache-Control: private, no-cache, must-revalidate

# Never cache (auth, payments, real-time)
Cache-Control: no-store
```

## Application Cache Patterns

### Cache-Aside (Lazy Loading)
```typescript
async function getUser(id: string) {
  // 1. Check cache
  const cached = await cache.get(`user:${id}`);
  if (cached) return JSON.parse(cached);

  // 2. Cache miss — query database
  const user = await db.users.findById(id);

  // 3. Populate cache
  await cache.set(`user:${id}`, JSON.stringify(user), 'EX', 300); // 5 min TTL

  return user;
}
```

### Write-Through
```typescript
async function updateUser(id: string, data: Partial<User>) {
  // 1. Update database
  const user = await db.users.update(id, data);

  // 2. Update cache immediately
  await cache.set(`user:${id}`, JSON.stringify(user), 'EX', 300);

  return user;
}
```

### Write-Behind (Async)
```typescript
async function updateUser(id: string, data: Partial<User>) {
  // 1. Update cache immediately (fast response)
  await cache.set(`user:${id}`, JSON.stringify({ ...currentUser, ...data }), 'EX', 300);

  // 2. Queue database write (async)
  await queue.add('db-write', { table: 'users', id, data });

  return { ...currentUser, ...data };
}
```

## Cache Key Design

```
# Pattern: {entity}:{identifier}:{variant}
user:123                    # Single user
user:123:preferences        # User's preferences
users:list:page=1:limit=20  # Paginated list
search:products:q=shoes     # Search results
```

### Key Rules
- Include all query parameters that affect the result
- Use consistent key ordering (alphabetical)
- Prefix with entity type for namespacing
- Keep keys short but unambiguous

## Invalidation Strategies

| Strategy | When to Use | Complexity |
|----------|-------------|------------|
| **TTL-based** | Data that can be slightly stale | Low |
| **Event-based** | Data that must be fresh after writes | Medium |
| **Version-based** | Infrequent changes to reference data | Low |
| **Tag-based** | Related data that changes together | High |

### TTL Guidelines
| Data Type | Suggested TTL |
|-----------|--------------|
| Static config | 1 hour - 24 hours |
| User profiles | 5 - 15 minutes |
| Search results | 1 - 5 minutes |
| Real-time data | Don't cache |
| Aggregated metrics | 1 - 60 minutes |

## Cache Anti-Patterns

- **Cache everything** — adds complexity without proportional benefit
- **No TTL** — stale data forever, memory leak
- **Cache stampede** — many requests rebuild cache simultaneously (use locking or stale-while-revalidate)
- **Caching errors** — 404s and 500s cached as valid responses (always check before caching)
- **Premature caching** — optimize only after measuring actual performance issues

## Monitoring

- Track cache hit rate (target: >90% for cached endpoints)
- Monitor cache memory usage
- Alert on sudden drop in hit rate (may indicate invalidation bug)
- Log cache misses that result in slow queries
