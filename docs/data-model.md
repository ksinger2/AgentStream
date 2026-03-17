# {{PROJECT_NAME}} — Data Model

## Overview

[Describe the core data model and how entities relate to each other]

## Entity-Relationship Diagram

```
[User] 1──N [Project] 1──N [Task]
  │                          │
  └────────N [Comment] N─────┘
```

[Update with actual project entities]

## Entities

### User
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID / Integer | PK, auto-generated | Unique identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| `name` | VARCHAR(255) | NOT NULL | Display name |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `role` | ENUM | NOT NULL, DEFAULT 'user' | user, admin |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Soft delete flag |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_users_email` UNIQUE on `email`
- `idx_users_created_at` on `created_at`

**Relationships:**
- Has many Projects (owner)
- Has many Comments (author)

[Add actual project entities below. Delete these examples.]

### [Entity Name]
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | | PK | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Indexes:**
-

**Relationships:**
-

## Enums

| Enum | Values | Used In | Description |
|------|--------|---------|-------------|
| `UserRole` | `user`, `admin` | `users.role` | User permission level |
| | | | |

[Add actual enums]

## Validation Rules

| Entity | Field | Rule | Error Message |
|--------|-------|------|---------------|
| User | email | Valid email format | "Invalid email address" |
| User | name | 1-255 characters | "Name must be 1-255 characters" |
| User | password | Min 8 chars, 1 upper, 1 number | "Password requirements not met" |

[Add actual validation rules]

## Cascade Rules

| Parent | Child | On Delete | On Update |
|--------|-------|-----------|-----------|
| User | Project | CASCADE / SET NULL | CASCADE |
| Project | Task | CASCADE | CASCADE |

[Update with actual cascade behavior]

## Migration History

| Version | Date | Description | Reversible |
|---------|------|-------------|------------|
| 001 | YYYY-MM-DD | Initial schema | Yes |

[Auto-populated by migration tool or /migrate command]

## Notes

- All timestamps stored in UTC
- Soft deletes preferred over hard deletes for user-facing data
- UUIDs used for public-facing IDs, auto-increment for internal references
- [Add project-specific data modeling decisions]
