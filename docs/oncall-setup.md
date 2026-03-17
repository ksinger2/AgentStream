# On-Call Setup Guide

Configuration guide for autonomous production monitoring, alerting, and self-healing.

## Health Checks

Configure endpoints to monitor. The on-call-engineer checks these at the configured interval.

| Endpoint | Method | Expected Status | Timeout | Critical | Notes |
|----------|--------|----------------|---------|----------|-------|
| `{{BASE_URL}}/health` | GET | 200 | 5s | Yes | Primary health endpoint |
| `{{BASE_URL}}/api/health` | GET | 200 | 5s | Yes | API health endpoint |
<!-- Add more endpoints as needed -->
<!-- | `{{BASE_URL}}/api/v1/status` | GET | 200 | 10s | No | Extended status check | -->

## Alerting Channels

Configure at least one channel. The on-call-engineer tries them in order.

| Channel | Config | Priority |
|---------|--------|----------|
| Slack Webhook | `SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...` | 1 (primary) |
| Discord Webhook | `DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...` | 2 |
| Gmail MCP | Recipient: `oncall@example.com` | 3 |
| GitHub Issues | Auto-enabled (uses `gh` CLI) | 4 (always-on fallback) |

### Setting Up Webhooks

**Slack**: Create an Incoming Webhook at https://api.slack.com/messaging/webhooks
**Discord**: Server Settings → Integrations → Webhooks → New Webhook

Store webhook URLs in environment variables or `.env.local` (never commit secrets).

## Auto-Fix Boundaries

### CAN Modify (autonomous fixes allowed)
- `src/` — Application source code
- `config/` — Application configuration
- `package.json` / `requirements.txt` / `go.mod` — Dependency pinning
- `public/` — Static assets
- `.env.example` — Example env files (not actual secrets)

### CANNOT Modify (escalate to human)
- Database migrations / schema files
- Authentication and authorization logic
- Payment / billing code
- Secrets, credentials, `.env` files
- Infrastructure config (Terraform, CloudFormation, Kubernetes manifests)
- CI/CD pipeline files (`.github/workflows/`)
- `CLAUDE.md`, `HardRules.md`

### Fix Attempt Limits
- **Max 2 autonomous fix attempts** per incident
- After 2 failures → escalate to Tier 3 (alert + hands off)
- Model escalation: attempt 1 on sonnet, attempt 2 on opus

## Monitoring Interval

| Environment | Default Interval | Configurable |
|-------------|-----------------|--------------|
| Production | 5 minutes | Yes |
| Staging | 15 minutes | Yes |

Override by passing interval to `/oncall` command: `/oncall 3m` for 3-minute checks.

**Note**: CronCreate jobs are session-bound and auto-expire after 3 days. Re-run `/oncall` in new sessions. The CI workflow health-check job provides durable monitoring as a fallback.

## Log Locations

| Log | Path | Error Patterns |
|-----|------|---------------|
| Application | `logs/app.log` | `ERROR`, `FATAL`, `Exception` |
| Access | `logs/access.log` | 5xx status codes |
| System | `/var/log/syslog` | `OOM`, `panic`, `segfault` |
<!-- Update paths for your project -->

## Incident Log

All incidents are automatically logged to `docs/incidents.log` with:
- Timestamp (ISO-8601)
- Incident number
- Severity tier
- Status (detected → fixing → fixed/escalated/rolled-back)
- Symptom, root cause, fix description
- Commit hash (if auto-fixed)
- Duration (detection to resolution)

## Quick Start

1. Update the health check table above with your actual endpoints
2. Configure at least one alerting channel
3. Review auto-fix boundaries — adjust for your project
4. Run `/oncall` to start monitoring
5. Check `docs/incidents.log` for incident history
