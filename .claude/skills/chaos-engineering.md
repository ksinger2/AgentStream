---
name: chaos-engineering
description: Chaos engineering patterns — failure mode validation, dependency failures, degraded states, resilience testing
---

# Chaos Engineering

Patterns for validating that your application handles failures gracefully — before production teaches you the hard way.

## Principles

1. **Start with a hypothesis**: "When X fails, the system should Y"
2. **Minimize blast radius**: Test in staging first, then production with small scope
3. **Automate experiments**: Manual chaos is just breaking things
4. **Run continuously**: Resilience is a property that degrades over time

## Failure Categories

### 1. Dependency Failures
What happens when an external service is unavailable?

```typescript
// Test: external API returns 500
// Expected: graceful degradation, cached/default response, no cascade

// Implementation: circuit breaker pattern
const breaker = new CircuitBreaker(externalApiCall, {
  timeout: 3000,           // 3s timeout
  errorThresholdPercentage: 50,  // Open after 50% failures
  resetTimeout: 30000,     // Try again after 30s
});

breaker.fallback(() => cachedResponse || defaultResponse);
```

### 2. Latency Injection
What happens when a dependency is slow but not down?

```
Test scenarios:
- Database queries take 5x longer than normal
- External API responds in 10s instead of 200ms
- DNS resolution is slow

Expected behavior:
- Request times out gracefully (not infinite hang)
- User sees loading state, then timeout message
- Other requests are not blocked (no thread/connection exhaustion)
```

### 3. Resource Exhaustion
What happens when system resources run out?

```
Test scenarios:
- Disk full (df shows 100%)
- Memory pressure (OOM conditions)
- Connection pool exhausted
- File descriptor limit reached

Expected behavior:
- Application logs the issue clearly
- New requests get clean error, not hang
- Application recovers when resources free up
- Alerts fire before complete exhaustion
```

### 4. Network Partitions
What happens when services can't communicate?

```
Test scenarios:
- Database unreachable
- Cache (Redis) unreachable
- Message queue unreachable
- Partial network failure (some services up, some down)

Expected behavior:
- Application identifies which dependency failed
- Degrades gracefully (read-only mode, cached data, queue retry)
- Does not corrupt data during partition
- Recovers automatically when connectivity restores
```

### 5. Data Corruption
What happens when data is unexpected?

```
Test scenarios:
- API returns unexpected schema
- Database returns null for required field
- Message queue delivers duplicate messages
- Clock skew between services

Expected behavior:
- Validation catches bad data before processing
- Error is logged with enough context to diagnose
- Partial failures don't corrupt good data
- Idempotent operations handle duplicates
```

## Experiment Template

```markdown
## Chaos Experiment: [Name]

**Hypothesis**: When [condition], the system should [expected behavior]

**Steady State**: [What "normal" looks like — metrics, behavior]

**Method**:
1. Verify steady state
2. Introduce failure: [specific action]
3. Observe: [what to watch — logs, metrics, user experience]
4. Verify: [does the system behave as hypothesized?]
5. Restore: [how to undo the failure]

**Blast Radius**: [What's affected — users, services, data]

**Abort Criteria**: [When to stop — e.g., error rate >10%, data corruption]

**Results**:
- [ ] Hypothesis confirmed / denied
- [ ] Issues found: [list]
- [ ] Action items: [list]
```

## Resilience Patterns to Validate

| Pattern | What to Test | How |
|---------|-------------|-----|
| Circuit breaker | Opens on failures, closes on recovery | Fail dependency, verify breaker opens |
| Retry with backoff | Retries transient failures, respects backoff | Return 503 intermittently |
| Timeout | Requests don't hang indefinitely | Add latency to dependency |
| Bulkhead | One slow endpoint doesn't block others | Slow down one endpoint, verify others work |
| Fallback | Graceful degradation on failure | Kill dependency, verify fallback |
| Idempotency | Duplicate requests are safe | Send same request twice |

## Testing Approach

### Level 1: Unit Tests (always)
```typescript
test('handles API timeout gracefully', async () => {
  mockApi.onGet('/users').timeout();
  const result = await getUsers();
  expect(result).toEqual({ users: [], error: 'Service temporarily unavailable' });
});
```

### Level 2: Integration Tests (staging)
- Kill a dependency container: `docker stop redis`
- Verify application behavior
- Restart: `docker start redis`
- Verify recovery

### Level 3: Production Experiments (with guardrails)
- Use feature flags to limit blast radius
- Monitor key metrics during experiment
- Have rollback ready
- Run during low-traffic periods initially

## Tools

- **Toxiproxy**: Simulate network conditions (latency, down, bandwidth)
- **Chaos Monkey**: Randomly terminate instances
- **Litmus**: Kubernetes-native chaos engineering
- **Gremlin**: SaaS chaos platform
- **tc/iptables**: Linux network manipulation (manual)
