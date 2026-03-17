---
description: Scaffold a new microservice/module with Dockerfile, health endpoint, env template, and logging
---

# /new-service — Microservice/Module Scaffolding

You are scaffolding a new service or module. This creates a complete, runnable service boundary.

## 1. Gather Requirements

From the user's request, determine:
- **Service name** (e.g., "notification-service", "payment-gateway")
- **Purpose**: What this service does
- **Stack**: Language/framework (default: match main project stack)
- **Communication**: REST API, gRPC, message queue, or event-driven
- **Dependencies**: Database, cache, external APIs needed

## 2. Scaffold Structure

Create the service directory with:

```
services/<service-name>/
├── src/
│   ├── index.ts (or main.py, main.go)  # Entry point
│   ├── routes/                          # API routes/handlers
│   │   └── health.ts                    # Health check endpoint
│   ├── config/                          # Configuration
│   │   └── index.ts                     # Env var loading + validation
│   └── lib/                             # Shared utilities
├── tests/                               # Service-specific tests
│   └── health.test.ts                   # Health endpoint test
├── Dockerfile                           # Multi-stage production build
├── .env.example                         # Documented env vars
├── package.json (or equivalent)         # Dependencies
└── README.md                            # Service-specific docs
```

## 3. Required Components

### Health Endpoint
Every service MUST have `GET /health` returning:
```json
{
  "status": "ok",
  "service": "<service-name>",
  "version": "<version>",
  "uptime": "<seconds>",
  "dependencies": {
    "database": "connected",
    "cache": "connected"
  }
}
```

### Dockerfile
```dockerfile
# Multi-stage build
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
RUN addgroup --system app && adduser --system --ingroup app app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER app
EXPOSE 3000
HEALTHCHECK CMD curl -f http://localhost:3000/health || exit 1
CMD ["node", "dist/index.js"]
```
Adapt for the project's actual stack.

### Configuration
- Load all config from environment variables
- Validate required vars at startup (fail fast if missing)
- Use `.env.example` with full documentation

### Logging
- Structured JSON logging (not console.log)
- Include: timestamp, level, service name, request ID, message
- Log levels: debug, info, warn, error

### Error Handling
- Global error handler that catches unhandled errors
- Graceful shutdown on SIGTERM/SIGINT
- Return structured error responses

## 4. Integration

- Add service to `docker-compose.yml` (if exists)
- Add to service registry/discovery (if applicable)
- Wire up to API gateway (if applicable)
- Add health endpoint to `docs/oncall-setup.md` monitoring list
- Document in `docs/architecture.md`

## 5. Verify

- Service starts without errors
- Health endpoint returns 200
- Docker build succeeds
- Tests pass

## 6. Report

Present:
- Files created
- How to run: `docker compose up <service-name>` or direct command
- Health endpoint URL
- Next steps (add routes, connect to database, etc.)
