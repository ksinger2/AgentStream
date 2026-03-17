---
description: Full release workflow — version, build, publish, deploy, announce
---

# /distribute — Release Distribution Workflow

You are running the full release distribution pipeline. Follow these steps in order.

## 1. Pre-Release Checks (parallel)

Launch these agents in parallel:
- **qa-engineer**: Run the full test suite, report pass/fail with details
- **security-reviewer**: Audit all changes since last release for security issues

Wait for both to complete. If either reports blocking issues, stop and present findings to the user.

## 2. Version & Changelog

Launch **release-engineer** to:
1. Determine version bump from commit history (conventional commits)
2. Generate changelog entries since last release
3. Present the proposed version and changelog to the user for approval

**Wait for user approval before proceeding.**

## 3. Build & Publish

After approval, launch **release-engineer** to:
1. Bump version in all relevant files
2. Run production build
3. Run dependency security audit
4. Create annotated git tag
5. Publish to configured registries (npm, PyPI, Docker, etc.)
6. Create GitHub Release with changelog

## 4. Deploy

Follow the multi-environment promotion flow:

1. **Staging**: Deploy tagged version to staging
2. **Smoke tests**: Run critical path tests against staging
3. **Health checks**: Verify all staging health endpoints
4. **User approval**: Ask user to approve production deploy
5. **Production**: Deploy to production
6. **Verify**: Health checks + smoke tests against production

If any step fails, stop and report. Do not proceed to production without passing staging checks.

## 5. Announce (parallel)

After successful production deploy, launch in parallel:
- **social-strategist**: Draft and post release announcement (if user wants social posts)
- **release-engineer**: Send release notifications to configured channels (Slack/Discord webhooks)

## 6. Report

Present final summary:
- Version released (e.g., v1.2.0)
- Changelog highlights (top 3-5 items)
- Registries published to
- Environments deployed to
- Health check status (all green / any issues)
- Announcement status
