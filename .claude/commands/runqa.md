# RunQA — Internal Quality Audit

Run a full internal QA pass using agents. No external tools, no Discord, no browser — just Claude Code agents reviewing the codebase directly.

## Phase 1: Scope

Run `git diff HEAD~5` and `git log --oneline -10` to identify what's new or changed.
If the project has a build/test command in `CLAUDE.md`, run them first and capture results.

## Phase 2: Parallel Agent Review

Launch these agents **in parallel** to review their domains against the current codebase:

### Engineering Review
**Agent:** `principal-engineer`
**Task:** Review all changed files for:
- Architecture violations, anti-patterns, tech debt introduced
- Hardcoded values, magic numbers, secrets in code
- Missing error handling, unhandled edge cases
- Code duplication — are there existing utilities being ignored?
- Naming and patterns: do they match `CLAUDE.md` conventions?

### Security Review
**Agent:** `backend-lead-engineer`
**Task:** Review all changed files for:
- OWASP top 10: injection, XSS, broken auth, data exposure
- Hardcoded credentials, API keys, tokens
- Missing input validation at system boundaries
- Insecure dependencies or configurations

### Frontend Review (if applicable)
**Agent:** `frontend-lead-engineer`
**Task:** Review UI-related changes for:
- Component reuse — did we reinvent something that exists?
- State management issues, memory leaks, missing cleanup
- Accessibility: missing labels, keyboard nav, contrast
- Responsive/layout issues

### Product Review
**Agent:** `principal-product-manager`
**Task:** Review against project goals:
- Read `Features.md` and `NextSteps.md`
- Do the changes align with planned features?
- Are acceptance criteria met?
- Any feature gaps or incomplete implementations?

### Design Review (if applicable)
**Agent:** `lead-designer`
**Task:** Review any UI changes for:
- Design system compliance (spacing, colors, typography)
- Consistency with existing screens
- Dark mode / theme support if applicable

## Phase 3: HardRules Compliance

Check all recent code and commit messages against `HardRules.md`:
- [ ] Brevity: Are there walls of text, unnecessary comments, or over-documented code?
- [ ] Verification: Were completion claims backed by evidence?
- [ ] Planning: Was non-trivial work planned before implementation?
- [ ] Reuse: Were existing components/utilities used where possible?
- [ ] Agent-first: Was work delegated to agents appropriately?
- [ ] Cost-aware: Were agents used efficiently, not for trivial tasks?

## Phase 4: Test Coverage

If tests exist:
1. Run the full test suite — capture pass/fail counts
2. Check coverage on changed files specifically
3. Identify untested code paths in new/modified files

If no tests exist:
1. Flag which files need tests most urgently
2. Prioritize by risk: data handling > API endpoints > UI > utilities

## Phase 5: Report

Compile all agent findings into a single structured report:

```
## Internal QA Report

### Summary
- Files reviewed: X
- Issues found: X (Critical: X, High: X, Medium: X, Low: X)
- Tests: X passed, X failed, X% coverage on changed files
- HardRules compliance: X/6 passing

### Issues by Domain
| # | Domain | File | Issue | Severity | Fix |
|---|--------|------|-------|----------|-----|

### HardRules Violations
| Rule | Status | Detail |
|------|--------|--------|

### Test Gaps
| File | Missing Coverage | Priority |
|------|-----------------|----------|

### Verdict: SHIP / FIX FIRST / BLOCK
[One line explanation]
```

## Phase 6: Auto-Fix (if user approves)

If verdict is FIX FIRST:
1. Group issues by owning agent
2. Launch fix agents in parallel for non-conflicting files
3. Re-run Phase 4 (tests) after fixes
4. Re-verify — only mark done with fresh evidence
