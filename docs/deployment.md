# {{PROJECT_NAME}} — Deployment Guide

## Environments

| Environment | URL | Branch | Auto-deploy |
|-------------|-----|--------|-------------|
| Development | localhost:3000 | — | — |
| Staging | [staging URL] | `staging` | [Yes/No] |
| Production | [production URL] | `main` | [Yes/No] |

## Prerequisites
- [ ] Access to deployment platform ([Vercel/AWS/GCP/etc.])
- [ ] Environment variables configured per environment
- [ ] Database provisioned and migrations applied
- [ ] DNS configured (if custom domain)

## Deployment Process

### Staging
```bash
# 1. Merge to staging branch
git checkout staging && git merge main

# 2. Push (auto-deploys if configured)
git push origin staging

# 3. Verify
curl -s https://staging.example.com/health
```

### Production
```bash
# 1. Use the /deploy command for full pre-flight checks
# Or manually:

# 2. Tag the release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# 3. Deploy
[deploy command here]

# 4. Verify
curl -s https://example.com/health
```

## Database Migrations
```bash
# Run pending migrations
[migration command]

# Rollback last migration
[rollback command]

# Check migration status
[status command]
```

## Rollback Procedure
1. Identify the last working version: `git tag --sort=-v:refname | head -5`
2. Deploy the previous version: `[rollback deploy command]`
3. Rollback database if needed: `[rollback migration command]`
4. Verify rollback: `curl -s https://example.com/health`
5. Investigate and fix the issue on a branch

## Monitoring
- **Error tracking**: [Sentry/Bugsnag URL]
- **Logs**: [Log service URL]
- **Metrics**: [Dashboard URL]
- **Uptime**: [Status page URL]

## Incident Response
1. Detect (monitoring alert or user report)
2. Assess severity (P1-P4)
3. Mitigate (rollback if needed)
4. Communicate (status page, stakeholders)
5. Fix and deploy
6. Post-mortem
