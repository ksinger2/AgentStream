---
name: database-migration-patterns
description: Safe database migration patterns — expand-contract, zero-downtime migrations, backward-compatible schema changes
---

# Database Migration Patterns

Safe patterns for evolving database schemas without downtime or data loss.

## Golden Rules

1. **Every migration must be reversible** — write both UP and DOWN
2. **Never mix schema changes with data migrations** — separate migrations
3. **Never break running application code** — old code must work with new schema during rollout
4. **Test on production-sized data** — a migration that takes 1s on dev can take 1h on production

## Expand-Contract Pattern

The safest way to make breaking schema changes across multiple deploys:

```
Deploy 1 (Expand): Add new column/table, write to both old and new
Deploy 2 (Migrate): Backfill data, switch reads to new
Deploy 3 (Contract): Remove old column/table, remove dual-write
```

### Example: Renaming a Column

**BAD** (breaks running code):
```sql
ALTER TABLE users RENAME COLUMN name TO full_name;
```

**GOOD** (3-deploy process):
```sql
-- Deploy 1: Add new column
ALTER TABLE users ADD COLUMN full_name VARCHAR(255);
-- App code: write to BOTH name and full_name

-- Deploy 2: Backfill + switch reads
UPDATE users SET full_name = name WHERE full_name IS NULL;
-- App code: read from full_name, still write to both

-- Deploy 3: Drop old column
ALTER TABLE users DROP COLUMN name;
-- App code: only uses full_name
```

## Adding Columns

### Safe: Nullable column
```sql
ALTER TABLE users ADD COLUMN bio TEXT;
-- No default needed, existing rows get NULL
```

### Safe: Column with default
```sql
ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
-- Existing rows automatically get true
```

### UNSAFE: NOT NULL without default
```sql
-- This WILL FAIL if table has existing rows
ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL;
-- Fix: add with default, then optionally remove default later
```

## Removing Columns

**Never drop a column in the same deploy that removes code references.**

```
Deploy 1: Remove all code references to the column
Deploy 2: Drop the column from the database
```

## Adding Indexes

### Small tables (<100K rows)
```sql
CREATE INDEX idx_users_email ON users(email);
```

### Large tables (use CONCURRENTLY to avoid locking)
```sql
-- PostgreSQL
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
-- Note: cannot run inside a transaction
```

## Data Migrations

### Batched processing (avoid locking entire table)
```sql
-- Process in batches of 1000
DO $$
DECLARE
  batch_size INT := 1000;
  rows_updated INT;
BEGIN
  LOOP
    UPDATE users
    SET full_name = name
    WHERE full_name IS NULL
    LIMIT batch_size;

    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    EXIT WHEN rows_updated = 0;

    PERFORM pg_sleep(0.1); -- Brief pause to reduce load
  END LOOP;
END $$;
```

## Dangerous Operations — Extra Caution Required

| Operation | Risk | Mitigation |
|-----------|------|------------|
| DROP TABLE | Data loss | Backup first, verify no code references |
| DROP COLUMN | Data loss | 2-deploy process (remove code first) |
| ALTER COLUMN TYPE | Lock + possible data loss | Create new column, migrate, drop old |
| ADD NOT NULL | Fails on existing data | Add with DEFAULT |
| TRUNCATE | Data loss | Almost never appropriate in production |

## Migration Testing Checklist

- [ ] UP migration runs on empty database
- [ ] UP migration runs on database with existing data
- [ ] DOWN migration cleanly reverses the UP
- [ ] Migration completes in <30 seconds on production-sized data
- [ ] Running application code works with both old and new schema
- [ ] No exclusive locks held for >1 second on large tables
- [ ] Indexes created CONCURRENTLY on large tables
