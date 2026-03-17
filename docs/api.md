# {{PROJECT_NAME}} — API Documentation

## Base URL
- Development: `http://localhost:3000/api`
- Staging: `https://staging.example.com/api`
- Production: `https://example.com/api`

## Authentication
[Describe auth mechanism: Bearer token, API key, session cookie, etc.]

```
Authorization: Bearer <token>
```

## Response Format
All responses follow this envelope:

### Success
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "has_more": true
  }
}
```

### Error
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": { ... }
  }
}
```

## Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No content (successful delete) |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (missing/invalid auth) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not found |
| 422 | Unprocessable entity |
| 429 | Rate limited |
| 500 | Internal server error |

## Rate Limiting
- **Default**: 100 requests/minute per API key
- **Auth endpoints**: 10 requests/minute per IP
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create new account |
| POST | `/auth/login` | Sign in |
| POST | `/auth/logout` | Sign out |
| POST | `/auth/refresh` | Refresh token |

### Users
| Method | Path | Description |
|--------|------|-------------|
| GET | `/users/me` | Get current user |
| PATCH | `/users/me` | Update current user |
| DELETE | `/users/me` | Delete account |

### [Resource Name]
| Method | Path | Description |
|--------|------|-------------|
| GET | `/resources` | List resources |
| POST | `/resources` | Create resource |
| GET | `/resources/:id` | Get resource |
| PATCH | `/resources/:id` | Update resource |
| DELETE | `/resources/:id` | Delete resource |

---

*Add endpoint details as they are built. For each endpoint, document: request params, request body, response body, error cases, and example curl command.*
