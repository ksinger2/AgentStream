---
description: Generate changelog from conventional commits — categorize, format, and update CHANGELOG.md
---

# /changelog — Automated Changelog Generation

You are generating a changelog entry from git history. Follow these steps.

## 1. Determine Range

Find the commit range to process:
```bash
# Get last tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

# If no tags, use all commits
if [ -z "$LAST_TAG" ]; then
  RANGE="HEAD"
else
  RANGE="$LAST_TAG..HEAD"
fi
```

Show the user: "Generating changelog for commits since $LAST_TAG (N commits)"

## 2. Parse Commits

Read commits in the range:
```bash
git log $RANGE --pretty=format:"%H|%s|%an|%ad" --date=short
```

Parse each commit subject using Conventional Commits:
- `feat: ...` → **Added**
- `fix: ...` → **Fixed**
- `refactor: ...` / `perf: ...` → **Changed**
- `deprecated: ...` → **Deprecated**
- `revert: ...` → **Removed**
- `security: ...` → **Security**
- `BREAKING CHANGE` in body → **Breaking Changes**
- `docs:`, `chore:`, `ci:`, `test:`, `style:` → Skip (internal changes)

## 3. Enrich with PR References

For each commit, find associated PRs:
```bash
gh pr list --state merged --search "<commit hash>" --json number,title,url
```

## 4. Format Entry

Use [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- Add user profile page (#42)
- Add export to CSV feature (#45)

### Fixed
- Fix login timeout on slow connections (#38)
- Fix pagination off-by-one error (#41)

### Changed
- Improve search performance by 3x (#44)

### Breaking Changes
- API response format changed for /api/users endpoint (#43)
  - Migration guide: [link or inline instructions]
```

## 5. Present for Review

Show the generated changelog to the user:
- Highlight any breaking changes
- Flag commits that couldn't be categorized
- Ask if any entries should be reworded or removed

## 6. Update CHANGELOG.md

After user approval:
1. Read existing `CHANGELOG.md` (create if doesn't exist)
2. Prepend the new version section after the header
3. Don't modify existing entries
4. Add comparison links at the bottom:
   ```
   [X.Y.Z]: https://github.com/user/repo/compare/vX.Y.Z-1...vX.Y.Z
   ```

## 7. Version Suggestion

Based on the commits, suggest the next version:
- Any `BREAKING CHANGE` → major bump
- Any `feat:` → minor bump
- Only `fix:` → patch bump

Present: "Based on these changes, the next version should be vX.Y.Z"
