# Code Clean — Full Engineering Team Code Cleanup

All engineering agents collaborate to review, refactor, and optimize the entire codebase for quality, consistency, and best practices.

## Phase 1: Scope Assessment

Run `git diff --stat HEAD~10` and review the codebase to understand:
- Total files and lines of code
- Languages and frameworks in use
- Key directories and their purposes

Read `CLAUDE.md` for conventions and `HardRules.md` for constraints.

## Phase 2: Parallel Domain Reviews

Launch ALL engineering agents in parallel, each reviewing their domain:

### Principal Engineer
**Agent:** `principal-engineer`
**Focus:** Architecture consistency, naming conventions, folder structure, cross-cutting concerns, code duplication across modules.

### Frontend Lead Engineer
**Agent:** `frontend-lead-engineer`
**Focus:** Component structure, prop patterns, state management, shared components that should exist but don't, CSS/styling consistency, barrel exports, dead components.

### Frontend Engineer
**Agent:** `frontend-engineer`
**Focus:** Component implementation quality, accessibility, responsive design, hardcoded values (colors, spacing, strings, URLs), missing TypeScript types.

### Senior Frontend Engineer
**Agent:** `senior-frontend-engineer`
**Focus:** Feature completeness, error/loading/empty states, API integration patterns, performance (unnecessary re-renders, missing memoization where measured).

### Backend Lead Engineer
**Agent:** `backend-lead-engineer`
**Focus:** API consistency, database query optimization, missing indexes, error handling patterns, authentication/authorization gaps, hardcoded config values.

### AI Engineer
**Agent:** `ai-engineer`
**Focus:** AI integration efficiency, prompt optimization, model selection, caching of AI responses, token usage, streaming implementation.

### QA Engineer
**Agent:** `qa-engineer`
**Focus:** Test coverage gaps, test quality, flaky tests, missing edge case tests, test utilities that could be shared.

## Phase 3: Consolidate Findings

Merge all agent reports into a unified cleanup plan:

### Categories
1. **Shared components** — Duplicate UI patterns that should be abstracted into shared components
2. **Hardcoded values** — Magic numbers, strings, URLs, colors, API keys that should be constants/config/env vars
3. **Dead code** — Unused imports, unreachable code, commented-out blocks, unused files
4. **Inconsistencies** — Different patterns used for the same thing (naming, file structure, API calls)
5. **Missing abstractions** — Repeated logic that should be a utility/hook/service
6. **Type safety** — Missing types, `any` usage, loose typing
7. **Performance** — Unnecessary re-renders, missing lazy loading, unoptimized queries
8. **Error handling** — Missing error boundaries, unhandled promises, silent failures

### Prioritize by:
- **Impact**: How much of the codebase does this affect?
- **Risk**: How likely is this to cause bugs?
- **Effort**: How hard is the fix?

## Phase 4: Present Cleanup Plan

```
## Code Cleanup Plan

### Summary
- Total issues found: X
- Critical (fix now): X
- Important (fix soon): X
- Nice-to-have: X

### Shared Component Opportunities
| Pattern | Occurrences | Files | Proposed Component |
|---------|------------|-------|-------------------|

### Hardcoded Values
| Value | File:Line | Should Be |
|-------|-----------|-----------|

### Dead Code
| What | File | Safe to Remove? |
|------|------|----------------|

### Inconsistencies
| Pattern A | Pattern B | Recommended | Files Affected |
|-----------|-----------|-------------|---------------|

### Missing Abstractions
| Repeated Code | Occurrences | Proposed Utility |
|---------------|------------|-----------------|

### Estimated Cleanup Effort
- Phase 1 (critical): [X files, ~Y changes]
- Phase 2 (important): [X files, ~Y changes]
- Phase 3 (nice-to-have): [X files, ~Y changes]
```

## Phase 5: Execute Cleanup (with approval)

**IMPORTANT:** Get user approval before making changes.

Execute in priority order:
1. Remove dead code (safest, immediate improvement)
2. Extract hardcoded values to constants/config
3. Fix inconsistencies (pick one pattern, apply everywhere)
4. Create shared components/utilities
5. Add missing types
6. Improve error handling

After each batch of changes:
- Run the linter
- Run the test suite
- Verify nothing broke

## Phase 6: Verification

1. Run full test suite
2. Run full linter
3. Run build
4. Compare before/after metrics (file count, line count, test coverage)
5. Use `verification-before-completion` skill before claiming done

## Phase 7: Report

Summarize what was cleaned, metrics improved, and any remaining items for future cleanup.
