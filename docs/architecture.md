# {{PROJECT_NAME}} — Architecture

## System Overview
[High-level diagram description: what are the major components and how do they connect?]

## Component Map
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | [e.g., Next.js] | [User-facing web application] |
| API | [e.g., FastAPI] | [Backend REST/GraphQL API] |
| Database | [e.g., PostgreSQL] | [Primary data store] |
| Cache | [e.g., Redis] | [Session store and response cache] |
| Queue | [e.g., Bull/Celery] | [Background job processing] |

## Data Flow
[Describe how a typical request flows through the system]

1. User action in frontend
2. API request to backend
3. Backend validates and processes
4. Database query/mutation
5. Response back to frontend
6. UI update

## Directory Structure
```
├── src/
│   ├── app/          # Pages and routes
│   ├── components/   # Reusable UI components
│   ├── lib/          # Shared utilities and helpers
│   ├── services/     # API client and external service integrations
│   ├── hooks/        # Custom React hooks (if applicable)
│   └── types/        # TypeScript type definitions
├── api/              # Backend API (if separate)
├── tests/            # Test files
├── docs/             # Documentation
└── public/           # Static assets
```

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| [e.g., Auth strategy] | [e.g., JWT + httpOnly cookies] | [e.g., Stateless, secure, works with SSR] |

## External Dependencies
| Service | Purpose | Docs |
|---------|---------|------|
| [e.g., Stripe] | [Payment processing] | [URL] |

## Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `API_KEY` | Yes | External API key |

## Security Considerations
[Document auth flow, data encryption, API security measures]

## Scaling Notes
[Document known bottlenecks, scaling strategies, and capacity limits]
