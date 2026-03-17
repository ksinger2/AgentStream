---
description: Scaffold a data model with ORM definition, migration, seed data, and type definitions
---

# /new-model — Data Model Scaffolding

You are scaffolding a new data model. This creates the full data layer as a coordinated unit.

## 1. Gather Requirements

From the user's request, determine:
- **Model name** (singular, e.g., "Product", "UserProfile")
- **Fields**: name, type, constraints (required, unique, default, etc.)
- **Relationships**: belongs_to, has_many, many_to_many with other models
- **Indexes**: which fields need indexes for query performance

If the user gave a brief description, ask clarifying questions about fields and relationships.

## 2. Detect Project Stack

Check the project for ORM/database tooling:
- **Prisma**: Look for `prisma/schema.prisma`
- **TypeORM**: Look for `*.entity.ts` files
- **Sequelize**: Look for `models/` directory
- **Django ORM**: Look for `models.py` files
- **SQLAlchemy**: Look for `models.py` or `models/` with Base class
- **Drizzle**: Look for `drizzle.config.ts`
- **Knex**: Look for `knexfile.js`

## 3. Generate Files

Launch **database-engineer** to create:

### a. ORM Model Definition
- Follow existing model patterns in the project
- Include all fields with proper types and constraints
- Define relationships with proper foreign keys
- Add appropriate indexes
- Add timestamps (created_at, updated_at) if project convention

### b. Migration File
- Generate UP migration to create the table
- Generate DOWN migration to drop the table
- Follow `database-migration-patterns` skill for safety
- Use the project's migration naming convention

### c. Type Definitions
- TypeScript interfaces/types if TS project
- Python dataclasses/Pydantic models if Python project
- Go structs if Go project
- Place in the project's types directory

### d. Seed Data
- Create seed data file with realistic example data
- Include edge cases (max-length strings, boundary values)
- Respect all constraints and foreign key relationships

### e. Update Data Model Documentation
- Add the new entity to `docs/data-model.md`
- Document fields, types, constraints, and relationships

## 4. Verify

- Run the migration in development
- Verify seed data loads without errors
- Run the type checker (if TypeScript/typed language)
- Confirm model matches the schema

## 5. Report

Present:
- Files created (model, migration, types, seed)
- Schema summary (table name, columns, indexes, relationships)
- Next steps (create API endpoints with `/new-endpoint`)
