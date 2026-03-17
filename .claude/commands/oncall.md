---
description: Start autonomous production monitoring with self-healing
---

# /oncall — Autonomous Production Monitoring

You are starting the autonomous on-call monitoring loop. Follow these steps:

## 1. Load Configuration

Read `docs/oncall-setup.md` to get:
- Health check endpoints (URLs, expected status, timeouts, critical flag)
- Alerting channels (webhook URLs, email recipients)
- Auto-fix boundaries (what can/cannot be modified)
- Monitoring interval (default: 5 minutes for production, 15 minutes for staging)

If `docs/oncall-setup.md` has placeholder values (e.g., `{{BASE_URL}}`), ask the user to configure it first.

## 2. Set Up Monitoring Loop

Use `CronCreate` to schedule recurring health checks at the configured interval.

The cron job should:
1. Run all configured health checks (curl each endpoint)
2. Check response codes and response times
3. If ALL checks pass → log success silently
4. If ANY check fails → launch the **on-call-engineer** agent with:
   - Which endpoint(s) failed
   - The error details (status code, response body, timeout)
   - Current timestamp
   - Link to `docs/oncall-setup.md` for escalation policy

## 3. Initial Health Check

Before starting the cron loop, run all health checks once immediately to:
- Verify endpoints are reachable
- Establish baseline response times
- Catch any existing issues

Report results to the user.

## 4. Confirm Monitoring Active

Tell the user:
- What endpoints are being monitored
- Check interval
- Configured alert channels
- Auto-fix status (enabled/disabled, boundaries)
- **Important**: Remind that CronCreate jobs are session-bound and expire after 3 days. Re-run `/oncall` in new sessions.
- The CI workflow health-check job provides durable monitoring as a fallback.

## 5. Optional: Custom Interval

If the user passed an interval argument (e.g., `/oncall 3m`), use that instead of the default.
Supported formats: `1m`, `5m`, `15m`, `30m`, `1h`.
