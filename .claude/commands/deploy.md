# Deploy — Production Deployment Workflow

Structured deployment with pre-flight checks, build verification, and monitoring.

## Step 1: Pre-Flight Checks

Run these checks before deploying:

1. **Git state**: Ensure working directory is clean, on the correct branch
2. **Tests**: Run the full test suite — all must pass
3. **Build**: Run production build — must succeed
4. **Lint**: Run linter — no errors allowed
5. **Security**: Launch the **security-reviewer** agent on recent changes
6. **Dependencies**: Run dependency audit (`npm audit`, `pip audit`, etc.)

If ANY check fails, stop and report the failure. Do not proceed.

## Step 2: Deployment Checklist

Use the `deployment-checklist` skill to verify:
- [ ] All environment variables set for target
- [ ] Database migrations ready and tested
- [ ] Feature flags configured
- [ ] Rollback plan documented
- [ ] Previous working version identified

## Step 3: Tag Release

1. Determine version number (check existing tags, follow semver)
2. Create a git tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z: [summary]"`
3. Generate changelog from commits since last tag

## Step 4: Deploy

Execute the deployment command configured in `CLAUDE.md`.
If no deploy command is configured, provide instructions for common platforms:
- Vercel: `vercel --prod`
- Netlify: `netlify deploy --prod`
- Docker: `docker build && docker push`
- Custom: Ask the user

## Step 5: Post-Deploy Verification

1. Run smoke tests against production URL
2. Check health endpoint
3. Verify critical user flows
4. Monitor error rates for 15 minutes

## Step 6: Report

```
## Deployment Report

### Version: vX.Y.Z
### Environment: [production/staging]
### Status: [SUCCESS/FAILED/ROLLED BACK]

### Pre-Flight Results
- Tests: ✅/❌
- Build: ✅/❌
- Lint: ✅/❌
- Security: ✅/❌
- Deps audit: ✅/❌

### Post-Deploy
- Health check: ✅/❌
- Smoke tests: ✅/❌
- Error rate: [normal/elevated]

### Rollback
If needed: [rollback command/instructions]
```
