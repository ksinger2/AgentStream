# {{PROJECT_NAME}}

> **Read and follow @HardRules.md — these are non-negotiable.**

## Project Overview
[Describe what this project does, who it's for, and the core problem it solves]

## Tech Stack
[List frameworks, languages, key dependencies — e.g. "React + TypeScript frontend, FastAPI backend, PostgreSQL"]

## Architecture
[High-level architecture description — how components connect, data flow, key services]
For detailed architecture docs, see @docs/architecture.md

## Key Conventions
[Project-specific patterns, naming conventions, file organization rules]
- Follow existing patterns in the codebase before introducing new ones
- Check for reusable components/utilities before building new ones

## How to Run
[Build and run commands — e.g. `npm install && npm run dev`, `docker compose up`]

## How to Test
[Test commands — e.g. `npm test`, `pytest`, `flutter test`]

## How to Deploy
[Deploy commands — see @docs/deployment.md for full deployment guide]

## Session Protocol
1. Read `NextSteps.md` before starting work — it has the latest context
2. Read `Features.md` for current feature status
3. Update `NextSteps.md` when ending a session — capture what you did, what's broken, and what's next
4. Update `Features.md` when features are started, completed, or planned
5. Use `/reinit` to re-initialize project context at the start of each session
6. Use `/plan` to create structured implementation plans before building
7. Use `/review` before committing to catch issues early
8. Use `/ship` for the full build+test+verify+commit workflow
9. Use `/setup` to initialize a new project from this template
10. Use `/onboard` for comprehensive project onboarding

## Quality & Testing Commands
- `/runqa` — Internal QA audit using agents — no external tools needed
- `/qa` — Comprehensive QA with automated + manual testing
- `/fix` — Team-based QA and fix workflow
- `/designreview` — Designer + QA review all screens, then engineering fixes issues
- `/visual-loop` — Real-time visual iteration: screenshot → design review → PM review → engineering fix → loop until polished
- `/codeclean` — All engineering agents review and clean up the entire codebase
- `/security` — Full security audit (OWASP top 10, auth, injection, data exposure)
- `/privacy` — Privacy and data protection compliance audit (GDPR, CCPA)

## Operations Commands
- `/deploy` — Production deployment with pre-flight checks and monitoring
- `/costoptimization` — Audit agent usage, context waste, and code for cost savings
- `/oncall` — Start autonomous production monitoring with self-healing
- `/distribute` — Full release workflow: version, build, publish, deploy, announce
- `/social-post` — Create and post social media content about the project
- `/rollback` — Explicit versioned rollback with optional migration revert
- `/deps` — Dependency audit and upgrade workflow
- `/env` — Environment variable validation and sync across environments
- `/instrument` — Add structured logging, tracing, and metrics to endpoints
- `/changelog` — Generate changelog from conventional commits
- `/autobuild` — Autonomous build loop: plan → build → test → loop until done or checkpoint

## Database & Data Commands
- `/migrate` — Database migration management: create, run, validate, rollback
- `/new-model <name>` — Scaffold a data model with ORM, migration, seed data, and types

## Testing & Debugging Commands
- `/debug` — Structured debugging workflow: isolate, diagnose, fix, verify
- `/load-test` — Performance and load testing with latency metrics
- `/snapshot` — Visual regression testing: capture and diff UI screenshots

## Feature Management Commands
- `/feature-flag` — Create, toggle, audit, and retire feature flags

## Scaffolding Commands
- `/new-component <name>` — Scaffold a UI component with styles, tests, and exports
- `/new-page <name>` — Scaffold a page/route with loading and error states
- `/new-endpoint <description>` — Scaffold an API endpoint with validation and tests
- `/new-service <name>` — Scaffold a microservice with Dockerfile, health endpoint, and logging

## Available Agents
This project includes a full product development team in `.claude/agents/`:
- **principal-product-manager** — Product strategy, requirements, competitive analysis
- **principal-engineer** — Architecture decisions, technical standards, cross-team alignment
- **project-manager** — Task tracking, coordination, exit criteria enforcement
- **lead-designer** — Design system, component specs, accessibility, visual QA
- **frontend-lead-engineer** — Frontend architecture, code reviews, component library
- **frontend-engineer** — UI implementation, design system adherence, state handling
- **senior-frontend-engineer** — End-to-end feature building, AI integration
- **backend-lead-engineer** — API design, database, security, infrastructure
- **ai-engineer** — AI/ML integration, prompt engineering, RAG, agent frameworks
- **qa-engineer** — Automated testing, test infrastructure, coverage
- **manual-qa-tester** — Manual testing, interaction testing, visual auditing
- **data-scientist** — Analytics tracking, event taxonomy, measurement plans
- **security-reviewer** — Security auditing, OWASP top 10, auth flaws, data exposure
- **gtm-strategist** — Go-to-market strategy, positioning, launch planning, growth experiments, content/social strategy
- **social-strategist** — Autonomous social media management, content generation, Playwright automation, platform optimization
- **on-call-engineer** — Autonomous production monitoring, incident diagnosis, self-healing, rollback, alerting
- **release-engineer** — Release management, versioning, changelog, package publishing, CI/CD, multi-environment promotion
- **database-engineer** — Schema design, migrations, query optimization, indexing, data modeling, seed data
- **technical-writer** — Documentation ownership: API docs, architecture docs, runbooks, changelogs
- **devops-engineer** — Infrastructure-as-code, CI/CD, containers, environment provisioning, secrets management
- **growth-engineer** — A/B testing, conversion funnel optimization, referral mechanics, growth experiments

## Browser Automation (Chrome CDP)

This project includes the `chrome-cdp` skill for real-time browser interaction:

**Setup:**
1. Enable remote debugging: `chrome://inspect/#remote-debugging` → toggle switch
2. Requires Node.js 22+

**Quick Commands:**
```bash
# List open tabs
.claude/skills/chrome-cdp/scripts/cdp.mjs list

# Take screenshot
.claude/skills/chrome-cdp/scripts/cdp.mjs shot <target> /tmp/screenshot.png

# Navigate, click, type
.claude/skills/chrome-cdp/scripts/cdp.mjs nav <target> http://localhost:3000
.claude/skills/chrome-cdp/scripts/cdp.mjs click <target> "button.submit"
.claude/skills/chrome-cdp/scripts/cdp.mjs type <target> "test input"

# Cleanup screenshots
rm ~/.cache/cdp/screenshot-*.png
```

Use with `/visual-loop` for automated design review iterations.

## API Documentation
See @docs/api.md for endpoint documentation and response formats.
