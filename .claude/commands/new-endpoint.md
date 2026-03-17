# New Endpoint — Scaffold an API Endpoint

Create a new API endpoint with validation, error handling, and tests.

## Arguments
- **Endpoint description**: $ARGUMENTS (or ask if not provided — e.g., "GET /api/users/:id" or "create a user endpoint")

## Step 1: Determine API Conventions

Read `CLAUDE.md` and examine the existing codebase to determine:
- API framework (Express, FastAPI, Next.js API routes, Django, etc.)
- Route file structure
- Request validation approach (zod, joi, pydantic, etc.)
- Response format/envelope
- Authentication middleware
- Error handling patterns

## Step 2: Design the Contract

Before writing code, define:
- HTTP method and path
- Request parameters (path, query, body) with types
- Response schema (success and error cases)
- Status codes for each scenario
- Authentication requirements

Present this to the user for approval.

## Step 3: Create Endpoint Files

Based on the project's API conventions, create:

1. **Route/handler file** — The endpoint handler with:
   - Input validation
   - Authentication check (if needed)
   - Business logic (or service call)
   - Proper error handling
   - Correct response format
2. **Validation schema** — Request/response validation (if project uses separate schema files)
3. **Service/controller** — If the project separates business logic from route handlers
4. **Test file** — Integration tests covering:
   - Happy path (valid request → expected response)
   - Validation errors (missing/invalid params → 400/422)
   - Auth errors (no token → 401, wrong permissions → 403)
   - Not found (invalid ID → 404)
   - Any business logic edge cases

## Step 4: Register the Route

Add the endpoint to the router, route index, or API manifest as needed.

## Step 5: Verify

- Run the test suite for the new endpoint
- Run the linter
- Verify the endpoint works with a curl command or test client

## Step 6: Report

Tell the user what was created, the endpoint URL, and provide example request/response.
