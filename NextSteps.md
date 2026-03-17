# {{PROJECT_NAME}} — Session Handoff

<!--
PURPOSE: This file is the handoff document between Claude Code sessions.
Every time you end a work session, update this file so the next session
can pick up exactly where you left off. Think of it as a note to your
future self (or a future agent).

HOW TO UPDATE:
- Summarize what was built or changed this session
- Note what's working and what's broken
- List specific next steps with enough detail to act on immediately
- Include any blockers, open questions, or decisions needed
- Keep it concise — bullet points, not essays
- Use /reinit at the start of each new session to read this file + project context

WHEN TO UPDATE:
- At the end of every work session
- After completing a significant feature or fix
- When you hit a blocker and need to context-switch
- Before handing off to another person or agent
-->

## What Was Done This Session

### Autonomous Build Loop
- Created `/autobuild` command — autonomous plan → build → test → loop workflow with checkpoint support
- Created `build-loop-state` skill — persistent state management for build iterations (reads/writes `tasks/build-state.md`)
- Updated `CLAUDE.md` — added `/autobuild` to commands section
- Created `tasks/` directory with `.gitkeep` — referenced by HardRules (plans), autobuild (build state), and task tracking
- Added Phase 3.3 specialist reviews to autobuild: design (`lead-designer`), security (`security-reviewer`), and AI prompt optimization (`ai-engineer`) — all run in parallel as blocking gates before shipping

### Autonomous On-Call & Self-Healing System
- Created **on-call-engineer** agent — autonomous monitoring, 4-tier escalation, self-healing protocol with guardrails
- Created **release-engineer** agent — semantic versioning, changelog generation, multi-environment promotion
- Created `/oncall` command — starts CronCreate-based monitoring loop (session-bound, 3-day expiry)
- Created `/distribute` command — full release pipeline: test → version → build → publish → deploy → announce
- Created `/social-post` command — social media content creation and posting workflow
- Created `docs/oncall-setup.md` — health check config, alerting channels, auto-fix boundaries
- Created `incident-response` skill — severity classification, diagnosis checklist, rollback decision tree
- Updated `.github/workflows/ci.yml` — added health-check, auto-rollback, and notify jobs (commented, ready to uncomment)

### Agent Brainstorm & Implementation (4 new agents)
- Created **database-engineer** — schema design, migrations, query optimization, expand-contract patterns
- Created **technical-writer** — docs-as-code ownership, API docs, runbooks, changelogs
- Created **devops-engineer** — IaC, CI/CD, containers, environment provisioning, secrets management
- Created **growth-engineer** — A/B testing, conversion funnels, referral mechanics, growth experiments

### 12 New Commands
- `/migrate` — database migration lifecycle (create, run, rollback, validate)
- `/debug` — structured debugging: reproduce → isolate → classify → root cause → fix → verify
- `/env` — environment variable audit, sync, and validation across environments
- `/load-test` — performance testing with p50/p95/p99 latency reporting
- `/deps` — dependency security audit + outdated package upgrade workflow
- `/rollback` — explicit versioned rollback with optional migration revert
- `/new-model` — scaffold data model + migration + seed data + types as a unit
- `/new-service` — scaffold microservice with Dockerfile, health endpoint, logging
- `/snapshot` — visual regression testing via Playwright screenshots
- `/instrument` — add structured logging, distributed tracing, and metrics
- `/changelog` — generate changelog from conventional commits
- `/feature-flag` — create, toggle, audit, and retire feature flags

### 8 New Skills
- `contract-testing` — consumer-driven API contract patterns (Pact, OpenAPI)
- `database-migration-patterns` — expand-contract, zero-downtime migrations
- `api-versioning` — breaking change governance, deprecation protocol, sunset dates
- `feature-flags` — flag lifecycle, naming, testing, debt prevention
- `caching-strategy` — CDN vs app vs DB cache, invalidation patterns, key design
- `chaos-engineering` — failure mode validation, resilience patterns
- `testing-strategy` — test pyramid enforcement, mock vs real, coverage philosophy
- `state-management-patterns` — local vs global vs server state decision framework

### New Docs & Config
- `docs/runbook.md` — operational procedures for restart, DB ops, cache, incidents, backup
- `docs/data-model.md` — entity-relationship template with field definitions
- `docs/adr/0000-template.md` — Architecture Decision Record template
- `.github/PULL_REQUEST_TEMPLATE.md` — standardized PR descriptions
- `.github/ISSUE_TEMPLATE/bug_report.md` — bug report template
- `.github/ISSUE_TEMPLATE/feature_request.md` — feature request template
- `CONTRIBUTING.md` — branch naming, commit format, PR requirements, code review SLAs

## What's Working
- 21 agent files in `.claude/agents/` — full product + ops + data team
- 34 slash commands in `.claude/commands/`
- 16 skills in `.claude/skills/`
- 8 docs files covering architecture, API, deployment, on-call, runbook, data model, ADR
- GitHub templates for PRs and issues
- CLAUDE.md lists all 21 agents and all commands
- `/autobuild` autonomous build loop with persistent state tracking
- CI workflow has health-check + auto-rollback jobs (commented, ready to configure)

## What's Broken / In Progress
- CI health-check/auto-rollback/notify jobs are commented out — need project-specific URLs and webhook config
- `docs/oncall-setup.md` has placeholder `{{BASE_URL}}` values — configure per project
- `docs/data-model.md` has example entities — replace with actual project schema

## Next Steps
1. Use `/setup` to initialize a new project from this template
2. Run `/autobuild` to autonomously plan and build the first feature
3. Or use the manual workflow: `/plan` → `/ship` → `/review`
4. Configure `docs/oncall-setup.md` with real health endpoints and webhook URLs
5. Uncomment CI workflow jobs in `.github/workflows/ci.yml` and set `HEALTH_URL` and `SLACK_WEBHOOK_URL` repository variables
6. Configure MCP servers per `docs/mcp-setup.md` for device testing
7. Define brand voice and platform priorities for the social-strategist agent

## Architecture
- Template project with agent-first workflow
- 21 specialized agents in `.claude/agents/`
- 34 slash commands in `.claude/commands/`
- 16 skills in `.claude/skills/`
- MCP integration for device testing, browser automation, Figma, Gmail, Google Calendar
- CI pipeline with health-check and auto-rollback capability

## Key Files
| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project conventions, all agents, all commands |
| `HardRules.md` | Non-negotiable AI behavior rules |
| `Features.md` | Feature tracking board |
| `NextSteps.md` | This file — session handoff document |
| `CONTRIBUTING.md` | Contributor guidelines |
| `docs/oncall-setup.md` | On-call monitoring configuration |
| `docs/runbook.md` | Operational procedures |
| `docs/data-model.md` | Database schema documentation |
| `docs/adr/0000-template.md` | Architecture Decision Record template |
| `docs/mcp-setup.md` | MCP server configuration guide |
| `.github/workflows/ci.yml` | CI pipeline with health-check + auto-rollback |
