---
name: testing-strategy
description: Test pyramid enforcement — what belongs at each layer, when to mock vs use real dependencies, coverage targets
---

# Testing Strategy

Defines the testing philosophy, pyramid structure, and placement rules for the project.

## Test Pyramid

```
        /  E2E  \          Few, slow, expensive
       /----------\        Critical user journeys only
      / Integration \      Service boundaries, API contracts
     /----------------\    Real dependencies where practical
    /    Unit Tests     \  Fast, isolated, comprehensive
   /--------------------\  Business logic, utilities, pure functions
```

## Layer Definitions

### Unit Tests (Base — Most Tests Here)
**What**: Individual functions, classes, utilities, pure business logic
**How**: Isolated, no external dependencies, fast (<100ms each)
**Mock**: Everything external (database, APIs, file system)
**Coverage target**: >80% of business logic

```typescript
// Good unit test — tests logic, not framework
test('calculates discount for premium users', () => {
  const discount = calculateDiscount({ tier: 'premium', subtotal: 100 });
  expect(discount).toBe(15); // 15% off
});
```

### Integration Tests (Middle — Moderate Count)
**What**: Component interactions, API endpoints, database queries
**How**: Real dependencies where practical (test database, test cache)
**Mock**: External third-party APIs only
**Coverage target**: All API endpoints, all database queries

```typescript
// Good integration test — real database, real HTTP
test('POST /api/users creates a user', async () => {
  const response = await request(app)
    .post('/api/users')
    .send({ name: 'Jane', email: 'jane@test.com' });

  expect(response.status).toBe(201);

  // Verify in database
  const user = await db.users.findByEmail('jane@test.com');
  expect(user).toBeDefined();
});
```

### E2E Tests (Top — Fewest Tests)
**What**: Critical user journeys from UI to database and back
**How**: Real browser, real backend, real database
**Mock**: Nothing (except external payment/email services)
**Coverage target**: Top 5-10 user flows

```typescript
// Good E2E test — complete user journey
test('user can sign up, create a project, and invite a teammate', async () => {
  await page.goto('/signup');
  await page.fill('[name="email"]', 'test@example.com');
  // ... complete flow
  await expect(page.locator('.project-created')).toBeVisible();
});
```

## What to Test at Each Layer

| Scenario | Unit | Integration | E2E |
|----------|------|-------------|-----|
| Business logic / calculations | ✅ | | |
| Input validation | ✅ | | |
| Error handling | ✅ | ✅ | |
| API request/response format | | ✅ | |
| Database queries | | ✅ | |
| Authentication flow | | ✅ | ✅ |
| Critical user journeys | | | ✅ |
| Third-party integrations | ✅ (mocked) | | |
| Performance under load | | | ✅ |

## When to Mock

### MOCK (isolate from external concerns)
- Third-party APIs (Stripe, SendGrid, etc.)
- System clock (use fake timers for time-dependent logic)
- Random number generators (seed them for reproducibility)
- File system in unit tests
- Network requests in unit tests

### DON'T MOCK (use real implementations)
- Your own database (use a test database)
- Your own API endpoints (test them for real)
- Your own cache (use a test Redis instance)
- Simple utility functions (just call them)
- Data structures and models

### NEVER MOCK
- The thing you're testing
- Simple getters/setters
- Language built-ins

## Test Quality Checklist

- [ ] Test describes behavior, not implementation ("calculates tax" not "calls multiply")
- [ ] Test fails when the behavior breaks (not a no-op test)
- [ ] Test doesn't depend on other tests (isolated, any order)
- [ ] Test has clear arrange/act/assert structure
- [ ] Test name reads as a sentence ("should return 404 when user not found")
- [ ] No logic in tests (no if/else, no loops, no try/catch)
- [ ] Assertions are specific (not `toBeTruthy()` when you can check exact value)

## Test Data Management

- Use factories for creating test data (not raw object literals everywhere)
- Each test creates its own data (no shared mutable state)
- Clean up after tests (transaction rollback or truncate)
- Use realistic but deterministic data (not "test", "foo", "bar")

## CI Test Configuration

```
PR pipeline (fast, <5 min):
  1. Lint + type check
  2. Unit tests (parallel)
  3. Integration tests (parallel)

Merge to main (thorough, <15 min):
  1. Everything in PR pipeline
  2. E2E tests
  3. Visual regression (snapshot)
  4. Performance benchmarks

Nightly (comprehensive):
  1. Everything above
  2. Full E2E suite (all browsers)
  3. Load tests
  4. Security scan
```

## Coverage Philosophy

- Coverage is a tool, not a target. 100% coverage with bad tests is worse than 70% with good tests.
- Measure coverage to find untested code, not to prove quality.
- Business logic should have high coverage (>80%). Glue code and framework boilerplate can be lower.
- A test that catches real bugs is worth 100 tests that just inflate coverage.
