---
description: Explicit versioned rollback — revert deployment, optionally rollback migration, notify stakeholders
---

# /rollback — Versioned Rollback

You are performing a production rollback. Speed matters — follow this protocol precisely.

## 1. Assess

Determine rollback scope:
- **Code only**: Revert to previous deployed version
- **Code + migration**: Revert code AND rollback database migration
- **Config only**: Revert configuration change

Ask the user if unclear. Default to code-only rollback (safest).

## 2. Identify Target Version

```bash
# List recent tags/versions
git tag --sort=-v:refname | head -10

# Show what changed between current and previous
git log --oneline $(git describe --tags --abbrev=0 HEAD~1)..HEAD
```

Present the target rollback version to the user for confirmation.

## 3. Execute Rollback

### Code Rollback
```bash
# Option A: Revert the breaking commits
git revert HEAD~N..HEAD --no-edit

# Option B: Deploy previous tag directly
# Use the deploy workflow with the target version
```

### Database Rollback (if needed)
- **Only if the user explicitly confirmed migration rollback**
- Run the DOWN migration for the last applied migration
- Verify schema state after rollback
- **WARNING**: Data migrations may not be fully reversible — flag this risk

### Config Rollback
- Revert config files to previous state
- Restart services to pick up config changes

## 4. Deploy Rolled-Back Version

Use the project's deploy workflow:
1. Deploy to staging first (if time permits and not P1)
2. Verify staging health
3. Deploy to production
4. Verify production health

For P1 incidents: deploy directly to production, verify immediately.

## 5. Verify

Run health checks from `docs/oncall-setup.md`:
- All health endpoints return 200
- Response times within normal range
- No error spikes in logs
- Critical user flows functional

## 6. Notify

Send notifications through configured channels:
- What was rolled back and why
- Which version is now deployed
- Whether the issue is fully resolved or mitigated
- Next steps (investigation, fix-forward plan)

Create a GitHub issue if one doesn't exist:
```bash
gh issue create --title "Rollback: <description>" --label "incident" --body "<details>"
```

## 7. Post-Rollback

- Log the rollback in `docs/incidents.log`
- Determine fix-forward plan: what needs to change before re-deploying
- Assign investigation to appropriate agent/engineer
- Schedule post-incident review if P1/P2

## Safety

- **NEVER** rollback without verifying the target version is known-good
- **NEVER** rollback database migrations without explicit user approval
- **NEVER** force-push to main — use revert commits
- If unsure about scope, rollback less (code only) and investigate
