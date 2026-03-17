---
description: Observability scaffolding — add structured logging, distributed tracing, and metrics to endpoints
---

# /instrument — Observability Scaffolding

You are adding observability instrumentation to the application. Follow these steps.

## 1. Assess Current State

Check what observability exists:
- Search for logging libraries (winston, pino, logging, logrus, zap)
- Search for tracing (OpenTelemetry, Jaeger, Datadog, New Relic)
- Search for metrics (Prometheus, StatsD, CloudWatch)
- Check `docs/architecture.md` for monitoring setup

## 2. Determine Scope

What to instrument (from user request or default to all):
- **Logging**: Structured request/response logging
- **Tracing**: Distributed tracing across services
- **Metrics**: Application and business metrics
- **Target**: Specific endpoint, service, or entire application

## 3. Structured Logging

Add structured JSON logging with consistent fields:

```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "level": "info",
  "service": "api",
  "requestId": "req-abc123",
  "method": "GET",
  "path": "/api/users",
  "statusCode": 200,
  "duration": 45,
  "userId": "user-xyz",
  "message": "Request completed"
}
```

### Log Levels
- **error**: Application errors requiring attention
- **warn**: Unexpected but handled situations
- **info**: Key business events (user signup, payment, etc.)
- **debug**: Detailed diagnostic info (disabled in production)

### What to Log
- Every incoming request (method, path, status, duration)
- Authentication events (login, logout, failed attempts)
- Business events (creation, updates, deletions of resources)
- External API calls (URL, status, duration)
- Errors with full stack traces

### What NOT to Log
- Passwords, tokens, or secrets
- Full request/response bodies (PII risk)
- Health check requests (too noisy)

## 4. Distributed Tracing

Add OpenTelemetry instrumentation:
- Auto-instrument HTTP server and client
- Add span attributes for business context
- Propagate trace context across service boundaries
- Add custom spans for expensive operations (DB queries, external calls)

## 5. Metrics

Add key application metrics:

| Metric | Type | Description |
|--------|------|-------------|
| `http_requests_total` | Counter | Total requests by method, path, status |
| `http_request_duration_seconds` | Histogram | Request latency distribution |
| `active_connections` | Gauge | Current active connections |
| `db_query_duration_seconds` | Histogram | Database query latency |
| `external_api_duration_seconds` | Histogram | External API call latency |
| `error_total` | Counter | Errors by type and severity |

### Business Metrics (project-specific)
- User signups, logins
- Feature usage counters
- Conversion events

## 6. Verify

- Confirm logs are in structured JSON format
- Verify trace propagation works across services
- Check metrics are exposed at `/metrics` endpoint (if Prometheus)
- Ensure no PII is being logged
- Confirm log level is configurable via environment variable

## 7. Report

Present:
- What was instrumented (logging, tracing, metrics)
- Files modified
- How to view: log output, tracing dashboard URL, metrics endpoint
- Recommended dashboards to create
