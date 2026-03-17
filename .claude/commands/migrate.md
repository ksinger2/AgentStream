---
description: Database migration management — create, run, validate, and rollback migrations
---

# /migrate — Database Migration Management

You are managing database migrations. Follow these steps based on the user's intent.

## Determine Action

Parse the user's request to determine which action:
- `/migrate create <description>` — Generate a new migration
- `/migrate run` — Run pending migrations
- `/migrate rollback` — Rollback the last migration
- `/migrate status` — Show migration status
- `/migrate validate` — Validate migrations are safe

If no action specified, show migration status and ask what to do.

## Create Migration

Launch **database-engineer** to:
1. Analyze the requested schema change
2. Generate migration file using the project's migration tool
3. Write both UP and DOWN migrations (every migration must be reversible)
4. Apply safety checks from `database-migration-patterns` skill:
   - No dropping columns in same deploy as code removal (expand-contract)
   - No adding NOT NULL without DEFAULT to existing tables
   - No renaming columns directly (add new → migrate data → remove old)
   - Large table changes use batched operations
   - Index creation uses CONCURRENTLY where supported
5. Update `docs/data-model.md` with schema changes
6. Present migration for review before running

## Run Migrations

1. Show pending migrations: list files not yet applied
2. Run against target environment (default: development)
3. Verify migration succeeded: check schema matches expected state
4. For staging/production: require explicit user approval before running

## Rollback

1. Identify the last applied migration
2. Show the DOWN migration that will run
3. Ask for confirmation
4. Run rollback
5. Verify schema state after rollback

## Validate

Launch **database-engineer** to check all migrations for:
- Every UP has a corresponding DOWN
- No destructive operations without expand-contract pattern
- No locking operations on large tables
- Consistent naming conventions
- No raw SQL that bypasses the ORM (unless justified)

## Safety Guardrails

- **NEVER** run migrations in production without explicit user approval
- **NEVER** drop tables or columns without confirming data has been migrated
- Always test migrations on development first, then staging, then production
- Keep a backup before running production migrations
