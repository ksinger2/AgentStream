---
description: Dependency audit and upgrade — security scan, outdated packages, upgrade plan
---

# /deps — Dependency Audit & Upgrade

You are auditing and upgrading project dependencies. Follow these steps.

## 1. Security Audit

Run security scans based on project stack:

- **npm**: `npm audit`
- **Python**: `pip-audit` or `safety check`
- **Go**: `govulncheck ./...`
- **Ruby**: `bundle audit`

Report findings by severity:
- **Critical/High**: Must fix before next release — block deploy
- **Medium**: Fix in next sprint
- **Low**: Track and batch fix

## 2. Outdated Dependencies

Check for outdated packages:

- **npm**: `npm outdated`
- **Python**: `pip list --outdated`
- **Go**: `go list -m -u all`
- **Ruby**: `bundle outdated`

Categorize updates:
- **Patch** (1.0.0 → 1.0.1): Safe to auto-update, bug fixes only
- **Minor** (1.0.0 → 1.1.0): Usually safe, may add features
- **Major** (1.0.0 → 2.0.0): Breaking changes — needs manual review

## 3. Upgrade Plan

Present a prioritized upgrade plan:

```
Priority | Package        | Current | Latest | Type  | Risk    | Action
---------|---------------|---------|--------|-------|---------|--------
1        | lodash         | 4.17.20 | 4.17.21| Patch | Low     | Auto-update
2        | express        | 4.18.0  | 4.19.0 | Minor | Low     | Auto-update
3        | react          | 17.0.2  | 18.2.0 | Major | High    | Manual review
```

## 4. Safe Auto-Upgrade

For patch and safe minor updates:
1. Create a branch: `git checkout -b chore/deps-update-$(date +%Y%m%d)`
2. Update packages: `npm update` / `pip install --upgrade` (patch/minor only)
3. Run the full test suite
4. If tests pass → commit with descriptive message
5. If tests fail → identify which package caused the failure, revert it, note in report

## 5. Major Upgrade Assessment

For each major version bump:
1. Read the changelog/migration guide
2. Identify breaking changes that affect this project
3. Estimate effort to migrate
4. Present decision to user: upgrade now, defer, or pin current version

## 6. License Check

Verify all dependencies use compatible licenses:
- Flag GPL/AGPL in MIT/Apache projects
- Flag unknown or missing licenses
- Note any license changes in updated packages

## 7. Report

Present:
- **Security**: N critical, N high, N medium, N low vulnerabilities
- **Outdated**: N packages outdated (N patch, N minor, N major)
- **Auto-updated**: N packages safely updated
- **Needs review**: N major updates requiring manual migration
- **License issues**: N packages with license concerns
- **Action items**: Specific next steps for remaining updates
