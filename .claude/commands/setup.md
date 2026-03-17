# Setup — New Project Initialization

Guided setup for initializing a new project from this template.

## Step 1: Gather Project Info

Ask the user for:
1. **Project name** — What's this project called?
2. **Description** — One-line description of what it does
3. **Tech stack** — Framework, language, database, key dependencies (provide common options: React/Next.js/Vue + TypeScript, Python/FastAPI/Django, etc.)
4. **Architecture** — Monolith, microservices, serverless, or jamstack?
5. **Target platforms** — Web, mobile (iOS/Android), desktop, API-only?

## Step 2: Populate CLAUDE.md

Update `CLAUDE.md` with the gathered information:
- Replace `{{PROJECT_NAME}}` with the project name
- Fill in Project Overview, Tech Stack, Architecture sections
- Add appropriate build/run/test commands for the chosen stack
- Add stack-specific conventions

## Step 3: Update Template Files

- Replace `{{PROJECT_NAME}}` in `Features.md` and `NextSteps.md`
- Update `NextSteps.md` with initial setup steps specific to the chosen stack

## Step 4: Configure .claudeignore

Review `.claudeignore` and add/remove patterns specific to the chosen stack:
- Add framework-specific build outputs
- Add framework-specific generated files
- Remove patterns that don't apply

## Step 5: Configure Settings

Review `.claude/settings.json` and adjust:
- Add stack-specific safe commands to permission allowlist
- Adjust hooks for the chosen linter/formatter

## Step 6: Initialize Project

If the user wants, help scaffold the initial project:
- Run the framework's init command (e.g., `npx create-next-app`, `pip install`, etc.)
- Set up the initial directory structure
- Install dependencies
- Initialize git if not already done
- Create initial commit

## Step 7: Configure CI

Update `.github/workflows/ci.yml` with the correct:
- Language/runtime version
- Install command
- Build command
- Test command
- Lint command

## Step 8: Verify

- Run the build command
- Run the test command (if tests exist)
- Confirm all template placeholders are replaced

## Step 9: Report

Summarize what was set up and suggest the first feature to build.
