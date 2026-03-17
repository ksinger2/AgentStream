---
name: contract-testing
description: API contract testing patterns — consumer-driven contracts between frontend and backend to prevent integration drift
---

# Contract Testing

Patterns for ensuring frontend and backend stay aligned after initial API contracts are defined.

## What is Contract Testing?

Contract tests verify that the API producer (backend) and consumer (frontend) agree on the request/response format. They catch integration bugs before deployment — without requiring both services to be running.

## Consumer-Driven Contract Flow

```
1. Consumer (frontend) writes a contract: "I expect GET /api/users to return { id: number, name: string }"
2. Contract is shared with producer (backend)
3. Producer runs the contract against its actual API
4. If the contract breaks, the producer knows before deploying
```

## Implementation Patterns

### Pattern 1: OpenAPI/Swagger Validation
```typescript
// Generate types from OpenAPI spec
// Both frontend and backend validate against the same spec

// Backend: validate responses match spec
app.use(openApiValidator({ apiSpec: './openapi.yaml' }));

// Frontend: generate types from spec
// npx openapi-typescript openapi.yaml --output src/types/api.ts
```

### Pattern 2: Pact (Consumer-Driven)
```typescript
// Consumer test (frontend)
const interaction = {
  state: 'users exist',
  uponReceiving: 'a request for users',
  withRequest: { method: 'GET', path: '/api/users' },
  willRespondWith: {
    status: 200,
    body: eachLike({ id: integer(), name: string() }),
  },
};

// Provider test (backend)
// Verifies the pact file against actual API
verifier.verifyProvider({ pactUrls: ['./pacts/frontend-backend.json'] });
```

### Pattern 3: Schema Snapshot Testing
```typescript
// Capture API response schema as a snapshot
test('GET /api/users response shape', async () => {
  const response = await request(app).get('/api/users');
  expect(response.body).toMatchSchema(userListSchema);
});

// Frontend uses the same schema for type validation
const userListSchema = z.array(z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
}));
```

## What to Contract Test

- **Always**: Authentication endpoints, core CRUD operations, any endpoint the frontend depends on
- **Sometimes**: Internal service-to-service calls, webhook payloads
- **Never**: Health checks, metrics endpoints, admin-only endpoints

## Contract Test Checklist

- [ ] Response status codes match expected values
- [ ] Response body shape matches expected schema (field names, types)
- [ ] Required fields are always present
- [ ] Nullable fields are handled correctly
- [ ] Pagination format is consistent
- [ ] Error response format matches expected envelope
- [ ] Date/time formats are consistent (ISO-8601)
- [ ] Enum values match expected set

## When Contracts Break

1. **Producer broke it**: Backend changed the API without updating consumers → backend must fix or version the API
2. **Consumer expectation wrong**: Frontend expected a field that was never guaranteed → update consumer contract
3. **Intentional change**: Both sides need to update → coordinate via API versioning

## CI Integration

- Run contract tests on every PR
- Block merge if contracts fail
- Publish contracts to a shared location (Pact Broker, artifact storage)
- Producer and consumer pipelines both validate against shared contracts
