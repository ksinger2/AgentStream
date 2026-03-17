---
name: deployment-checklist
description: Use before deploying to production to verify environment variables, build integrity, database migrations, feature flags, and rollback readiness
---

# Deployment Checklist

## Overview

Every production deployment must follow this checklist. Skipping steps leads to incidents. If any check fails, stop the deployment and resolve the issue before proceeding.

## Pre-Deploy Checks

### Code Quality
```
[ ] All tests passing (unit, integration, e2e)
[ ] Build succeeds with production configuration
[ ] No console.log, debug statements, or TODO/FIXME in shipped code
[ ] Linter and formatter pass with zero warnings
[ ] No new TypeScript/compiler errors or warnings
[ ] Code reviewed and approved by at least one other engineer
```

### Environment Configuration
```
[ ] Environment variables set for target environment (staging/production)
[ ] Secrets rotated if compromised or on schedule
[ ] No hardcoded URLs, keys, or environment-specific values in code
[ ] Config differences between staging and production documented
[ ] Third-party API keys and webhooks configured for production
[ ] CORS, CSP, and security headers configured correctly
```

### Database
```
[ ] Migrations tested against a copy of production data
[ ] Migrations are reversible (down migration written and tested)
[ ] No destructive schema changes without a multi-step rollout plan
[ ] Large data migrations run separately from schema changes
[ ] Database backups verified and recent
[ ] Indexes added for new queries hitting production-scale data
```

### API and Integration
```
[ ] API versioning considered — no breaking changes to existing endpoints
[ ] Backward compatibility maintained for at least one version
[ ] API documentation updated for new/changed endpoints
[ ] Webhook endpoints tested with realistic payloads
[ ] Rate limiting configured for new endpoints
```

### Feature Flags
```
[ ] New features behind feature flags where appropriate
[ ] Feature flags configured for gradual rollout (percentage-based)
[ ] Kill switches tested — toggling flag off disables the feature cleanly
[ ] Flag cleanup plan scheduled for after full rollout
```

### Dependencies
```
[ ] Dependencies audited (npm audit / pip audit / equivalent)
[ ] No critical or high severity vulnerabilities unaddressed
[ ] Lock file committed and up to date
[ ] No unnecessary new dependencies added
```

## Deploy Process

### Step 1: Tag the Release
```
[ ] Create a git tag with semantic version (vX.Y.Z)
[ ] Write release notes summarizing changes
[ ] Link relevant PRs and issues in release notes
```

### Step 2: Run Migrations
```
[ ] Run database migrations before deploying application code
[ ] Verify migration completed successfully
[ ] Confirm application works with both old and new schema during transition
```

### Step 3: Deploy Application
```
[ ] Deploy using the standard pipeline (never deploy manually to production)
[ ] Health check endpoint returns 200 after deploy
[ ] Verify correct version is running (check version endpoint or build hash)
[ ] Confirm all instances/pods are healthy and serving traffic
```

### Step 4: Smoke Test
```
[ ] Test critical user flows manually:
    - Sign up / sign in
    - Core feature workflow (the primary thing users do)
    - Payment flow (if applicable)
    - Notification delivery (if applicable)
[ ] Verify third-party integrations are functional
[ ] Check that background jobs/workers are processing
```

### Step 5: Monitor
```
[ ] Watch error rates for 15 minutes post-deploy
[ ] Monitor response times — no significant increase
[ ] Check memory and CPU usage — no unexpected spikes
[ ] Verify logging is working (new events appearing)
```

## Post-Deploy Verification

```
[ ] All critical user flows verified in production
[ ] Monitoring dashboards show normal patterns
[ ] No spike in error rates or 5xx responses
[ ] No spike in customer support tickets
[ ] Performance metrics within acceptable range
[ ] Update deployment log with version, timestamp, deployer, and notes
[ ] Notify team that deployment is complete
[ ] Schedule post-deploy review if it was a major release
```

## Rollback Plan

Every deployment must have a tested rollback plan before proceeding.

### Preparation
```
[ ] Know the previous working version (tag/commit hash)
[ ] Database rollback migration tested and ready
[ ] Rollback can be executed in under 5 minutes
[ ] Feature flag kill switches tested and documented
```

### Rollback Triggers
Initiate rollback if any of these occur within 30 minutes of deploy:
- Error rate increases by more than 2x baseline
- Critical user flow is broken
- Response times increase by more than 3x
- Data integrity issue detected
- Security vulnerability discovered

### Rollback Steps
```
1. Announce rollback in team channel
2. Toggle feature flags OFF for new features
3. Deploy previous version
4. Run database rollback migration if needed
5. Verify health checks and critical flows
6. Investigate root cause
7. Document what went wrong in incident log
```

### Communication
```
[ ] Status page updated if user-facing impact
[ ] Team notified via primary communication channel
[ ] Incident report started if rollback was triggered
[ ] Post-mortem scheduled if significant impact occurred
```
