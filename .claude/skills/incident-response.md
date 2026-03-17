---
name: incident-response
description: Standardized incident handling — severity classification, diagnosis, alerting, rollback decisions, and post-incident documentation
---

# Incident Response

Reusable skill for standardized incident handling. Used by the on-call-engineer agent and available to any agent dealing with production issues.

## Severity Classification

| Severity | Description | Response Time | Examples |
|----------|-------------|---------------|----------|
| **P1 — Critical** | Service down, data loss, security breach | Immediate (<5 min) | Production unreachable, database corruption, unauthorized access |
| **P2 — High** | Major feature broken, significant degradation | <15 min | API returning 500s, auth failures, payment processing down |
| **P3 — Medium** | Minor feature broken, partial degradation | <1 hour | Non-critical endpoint slow, minor UI bug in production, intermittent errors |
| **P4 — Low** | Cosmetic, minor inconvenience | <24 hours | Styling issue, non-user-facing error logs, deprecation warnings |

### Severity → Escalation Tier Mapping
- P1 → Tier 3 (alert + hands off) or Tier 2 (alert + attempt fix) if clearly code-related
- P2 → Tier 2 (alert + attempt fix)
- P3 → Tier 1 (auto-fix + notify)
- P4 → Tier 0 (self-heal silently) or log only

## Standard Diagnosis Checklist

Run through this checklist for every incident:

- [ ] **Confirm**: Is the failure real? (3x check with 10s gaps — 2/3 must fail)
- [ ] **Scope**: Single endpoint, single service, or system-wide?
- [ ] **Timeline**: When did it start? Correlate with recent deploys: `git log --oneline -10`
- [ ] **Logs**: Check application logs for stack traces, error messages
- [ ] **Resources**: Disk, memory, CPU within normal ranges?
- [ ] **Dependencies**: External services responding? Database connected?
- [ ] **Recent changes**: Any deploys, config changes, or infra changes in the last hour?
- [ ] **Impact**: How many users affected? Is there a workaround?

## Alert Message Templates

### P1 — Critical
```
🚨 [P1 CRITICAL] [SERVICE] — [TIMESTAMP]
IMPACT: Service is DOWN / Data loss detected / Security incident
SYMPTOM: <description>
STARTED: <when first detected>
ACTION: Investigating. Human intervention required.
RUNBOOK: Check docs/oncall-setup.md
```

### P2 — High
```
⚠️ [P2 HIGH] [SERVICE] — [TIMESTAMP]
IMPACT: <feature/capability> is broken for users
SYMPTOM: <description>
STARTED: <when first detected>
ACTION: Attempting automated fix. Will update in 5 min.
```

### P3 — Medium
```
📋 [P3 MEDIUM] [SERVICE] — [TIMESTAMP]
IMPACT: <minor degradation description>
SYMPTOM: <description>
ACTION: Auto-fix applied. Monitoring for recurrence.
```

### Resolution
```
✅ [RESOLVED] [SERVICE] — [TIMESTAMP]
INCIDENT: <brief description>
DURATION: <time from detection to resolution>
FIX: <what was done>
COMMIT: <hash or "manual intervention">
```

## Rollback Decision Tree

```
Is the service DOWN (P1)?
├── YES → Rollback immediately, investigate after
└── NO → Is there a clear code fix?
    ├── YES → Fix forward (apply fix, test, deploy)
    │   └── Fix attempt failed?
    │       ├── YES (attempt 1) → Try once more with opus model
    │       └── YES (attempt 2) → Rollback + escalate
    └── NO → Is it config/infrastructure?
        ├── YES → Escalate to human (Tier 3)
        └── NO → Is it an external dependency?
            ├── YES → Add circuit breaker/fallback if possible, otherwise alert and wait
            └── NO → Rollback to last known good version + escalate
```

### Rollback Procedure
```bash
# 1. Find last known good version
git tag --sort=-v:refname | head -5

# 2. Revert the breaking change
git revert HEAD --no-edit  # or multiple commits: git revert HEAD~N..HEAD --no-edit

# 3. Deploy the reverted state
# Use project deploy workflow from CLAUDE.md

# 4. Verify
# Re-run the failing health checks

# 5. If revert is complex, deploy previous tag directly
git checkout vX.Y.Z
# Deploy this version
```

## Post-Incident Documentation

After every P1 or P2 incident, create a post-incident report:

```markdown
# Incident Report: INCIDENT-<N>

## Summary
- **Severity**: P<N>
- **Duration**: <detection to resolution>
- **Impact**: <who/what was affected>
- **Status**: Resolved / Mitigated / Ongoing

## Timeline
| Time (UTC) | Event |
|------------|-------|
| HH:MM | Issue detected by <method> |
| HH:MM | Investigation started |
| HH:MM | Root cause identified |
| HH:MM | Fix applied |
| HH:MM | Service restored |

## Root Cause
<What caused the incident>

## Resolution
<What was done to fix it>

## Lessons Learned
- What went well
- What could be improved
- Action items to prevent recurrence

## Action Items
- [ ] <Preventive measure 1>
- [ ] <Preventive measure 2>
```

## Integration

This skill is used by:
- **on-call-engineer** — Primary consumer for autonomous incident handling
- **release-engineer** — For post-deploy incident response
- **principal-engineer** — For incident review and process improvement
- Any agent can invoke this skill when encountering production issues
