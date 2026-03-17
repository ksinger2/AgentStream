---
description: Environment variable validation — audit, sync, and verify env vars across environments
---

# /env — Environment Variable Management

You are auditing and managing environment variables. Follow these steps.

## 1. Scan Codebase for Env Var Usage

Search the codebase for all environment variable references:
- Node.js: `process.env.VAR_NAME`, `process.env['VAR_NAME']`
- Python: `os.getenv('VAR_NAME')`, `os.environ['VAR_NAME']`, `os.environ.get('VAR_NAME')`
- Go: `os.Getenv("VAR_NAME")`
- General: `.env` file parsing, config libraries

Build a list of all referenced env vars with:
- Variable name
- File(s) where referenced
- Whether it has a default/fallback value
- Whether it appears required (no fallback, used in critical path)

## 2. Compare Against .env.example

Read `.env.example` (create if it doesn't exist) and compare:
- **Missing from .env.example**: Vars used in code but not documented → ADD them
- **Extra in .env.example**: Vars documented but not referenced in code → FLAG for removal
- **Missing descriptions**: Vars without comments explaining their purpose → ADD descriptions

## 3. Validate Current Environment

If `.env` or `.env.local` exists, check:
- All required vars are set (not empty)
- No placeholder values left (e.g., `your-api-key-here`, `changeme`, `xxx`)
- URLs are properly formatted
- Numeric values are valid numbers
- Boolean values are consistent format (true/false, not 1/0 mixed with true/false)

## 4. Cross-Environment Audit

If the user has access to staging/production configs, compare:
- All required vars present in every environment
- No development-only vars leaked to production (DEBUG=true, verbose logging)
- No production secrets present in development configs
- URL values point to correct environment (no staging URLs in production)

## 5. Generate/Update .env.example

Write a comprehensive `.env.example` with:
```bash
# ===========================
# {{PROJECT_NAME}} Environment Variables
# ===========================

# --- Required ---
# DATABASE_URL=postgresql://user:password@localhost:5432/dbname
# Description: PostgreSQL connection string
# Where to get: Create a local PostgreSQL database

# --- Optional ---
# LOG_LEVEL=info
# Description: Application log level (debug, info, warn, error)
# Default: info
```

For each variable include:
- Whether it's required or optional
- Description of what it does
- Example value (not a real secret)
- Where to obtain the value
- What breaks if it's missing

## 6. Security Check

Flag any potential issues:
- Secrets that appear to be committed (actual API keys, passwords in `.env`)
- `.env` files not in `.gitignore`
- Secrets in plain text in config files
- Environment variables with overly broad permissions

## Report

Present:
- Total env vars found in code: N
- Documented in .env.example: N
- Missing documentation: N (list them)
- Unused in .env.example: N (list them)
- Security concerns: N (list them)
- Changes made to .env.example
