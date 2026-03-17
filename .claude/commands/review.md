# Review — Pre-Commit Code Review

Run a code review on all pending changes before committing.

## Step 1: See What Changed

Run `git diff` and `git diff --cached` to see all staged and unstaged changes.
Run `git status` to see new/deleted files.

## Step 2: Review Checklist

For each changed file, check:

- **Bugs**: Logic errors, off-by-one, null/undefined access, race conditions
- **Security**: Hardcoded secrets, injection vectors, exposed endpoints, missing auth
- **Hardcoded values**: Magic numbers, URLs, paths that should be config/env vars
- **Missing error handling**: Unhandled promises, missing try/catch, silent failures
- **Naming & patterns**: Do names and patterns match what's in `CLAUDE.md`?
- **Dead code**: Unused imports, unreachable branches, commented-out code
- **Edge cases**: Empty inputs, large inputs, concurrent access

## Step 3: Run Checks

If the project has a linter or test suite configured in `CLAUDE.md`:
1. Run the linter
2. Run the tests
3. Report results

## Step 4: Verdict

Provide a structured report:

```
## Review Summary
- Files changed: X
- Issues found: X

### Issues
| # | File | Line | Issue | Severity |
|---|------|------|-------|----------|

### Verdict: SHIP / FIX FIRST
[One line explanation]
```

If verdict is SHIP, the code is ready to commit.
If verdict is FIX FIRST, list what needs to change before committing.
