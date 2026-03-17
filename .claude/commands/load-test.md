---
description: Performance and load testing — simulate concurrent users, identify bottlenecks, report latency metrics
---

# /load-test — Performance & Load Testing

You are running load tests against the application. Follow these steps.

## 1. Configuration

Determine test parameters:
- **Target URL**: From `docs/oncall-setup.md` health endpoints or user-specified
- **Concurrency**: Number of virtual users (default: 50)
- **Duration**: Test duration (default: 60 seconds)
- **Ramp-up**: Gradually increase load (default: 10s ramp)
- **Endpoints**: Which endpoints to test (default: all critical endpoints)

## 2. Pre-Flight Checks

Before running load tests:
- Confirm target environment (NEVER load test production without explicit approval)
- Default target: staging or local development
- Verify the target is running and healthy
- Warn if targeting production — require explicit confirmation

## 3. Run Load Tests

Use available tools in order of preference:

### k6 (if installed)
```bash
k6 run --vus <concurrency> --duration <duration> load-test.js
```

### Artillery (if installed)
```bash
artillery quick --count <concurrency> --num <requests_per_user> <URL>
```

### Apache Bench (usually available)
```bash
ab -n <total_requests> -c <concurrency> <URL>
```

### curl-based (always available)
Run concurrent curl requests and measure response times:
```bash
for i in $(seq 1 <concurrency>); do
  curl -o /dev/null -s -w '%{time_total}\n' <URL> &
done
wait
```

## 4. Metrics to Capture

For each endpoint tested:
- **Response time**: min, max, mean, median, p95, p99
- **Throughput**: requests per second
- **Error rate**: % of non-2xx responses
- **Concurrent connections**: max sustained
- **Transfer rate**: bytes per second

## 5. Identify Bottlenecks

Flag issues:
- p95 latency >1s → **Warning**
- p99 latency >3s → **Critical**
- Error rate >1% → **Warning**
- Error rate >5% → **Critical**
- Throughput drops under load → **Investigate** (connection pool, database, memory)

## 6. Report

Present results as a table:

```
Endpoint        | p50    | p95    | p99    | RPS   | Errors
/api/health     | 12ms   | 45ms   | 120ms  | 850   | 0%
/api/users      | 85ms   | 250ms  | 890ms  | 320   | 0.2%
/api/search     | 340ms  | 1.2s   | 3.5s   | 45    | 2.1% ⚠️
```

Include:
- Overall pass/fail assessment
- Specific bottleneck identification
- Recommendations for improvement
- Comparison to baseline (if previous results exist)

## 7. Save Results

Append results to `docs/load-test-results.md` with timestamp for trend tracking.
