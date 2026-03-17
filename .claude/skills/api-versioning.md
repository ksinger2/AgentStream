---
name: api-versioning
description: API versioning patterns — breaking change governance, deprecation headers, sunset dates, migration guides
---

# API Versioning

Patterns for evolving APIs without breaking existing consumers.

## Versioning Strategies

### URL Path Versioning (Recommended for most projects)
```
GET /api/v1/users
GET /api/v2/users
```
**Pros**: Explicit, easy to route, easy to document
**Cons**: URL pollution, harder to sunset

### Header Versioning
```
GET /api/users
Accept: application/vnd.myapp.v2+json
```
**Pros**: Clean URLs
**Cons**: Less discoverable, harder to test in browser

### Query Parameter Versioning
```
GET /api/users?version=2
```
**Pros**: Easy to add
**Cons**: Feels hacky, caching complications

## When to Version

**Version (breaking change):**
- Removing a field from response
- Renaming a field
- Changing a field's type
- Removing an endpoint
- Changing authentication mechanism
- Changing error response format

**Don't version (non-breaking):**
- Adding a new field to response
- Adding a new endpoint
- Adding optional query parameters
- Adding new enum values (if consumers handle unknown values)
- Performance improvements

## Deprecation Protocol

### Step 1: Announce Deprecation
Add deprecation headers to responses:
```
Deprecation: true
Sunset: Sat, 01 Mar 2025 00:00:00 GMT
Link: <https://docs.example.com/migration/v2>; rel="deprecation"
```

### Step 2: Log Usage
Track which consumers still use deprecated endpoints:
```
[DEPRECATION] GET /api/v1/users called by client_id=abc123
```

### Step 3: Warn Period
- Minimum 3 months between deprecation announcement and removal
- Send direct notifications to known consumers
- Include migration guide in deprecation docs

### Step 4: Sunset
- Return 410 Gone for sunsetted endpoints
- Include migration instructions in the response body:
```json
{
  "error": {
    "code": "ENDPOINT_SUNSET",
    "message": "This endpoint was removed on 2025-03-01. Use /api/v2/users instead.",
    "migration_guide": "https://docs.example.com/migration/v2"
  }
}
```

## Backward Compatibility Rules

### Response Changes
```
// v1 response
{ "name": "John Doe" }

// v2 response (breaking — split name into parts)
{ "first_name": "John", "last_name": "Doe" }

// Backward-compatible approach: add new fields, keep old
{ "name": "John Doe", "first_name": "John", "last_name": "Doe" }
```

### Request Changes
- New required fields → breaking, needs new version
- New optional fields → non-breaking, no version needed
- Removing accepted fields → breaking, needs new version

## Migration Guide Template

For each breaking change, provide:
```markdown
## Migrating from v1 to v2

### Changed: User name field split
**Before (v1)**: `{ "name": "John Doe" }`
**After (v2)**: `{ "first_name": "John", "last_name": "Doe" }`

### Action Required
1. Update your client to use `first_name` and `last_name`
2. Remove references to the `name` field
3. Update to v2 base URL: `/api/v2/users`

### Timeline
- v1 deprecated: 2025-01-01
- v1 sunset: 2025-04-01
```

## Implementation Pattern

```
/api/
├── v1/
│   ├── routes/
│   └── transformers/  # v1-specific response shaping
├── v2/
│   ├── routes/
│   └── transformers/  # v2-specific response shaping
└── shared/
    ├── services/       # Business logic (version-agnostic)
    ├── models/         # Data models (version-agnostic)
    └── middleware/      # Auth, logging (shared)
```

**Key principle**: Business logic is version-agnostic. Only request parsing and response formatting are versioned.
