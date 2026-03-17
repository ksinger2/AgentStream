# Re-initialize Project Context

Read the following files and information to re-establish context for this session.

## 1. Hard Rules
Read `HardRules.md` in the project root. These are non-negotiable rules that apply to every response.

## 2. Handoff Document
Read `NextSteps.md` in the project root. This contains:
- What was built and the current architecture
- What's working and what's broken
- Specific next steps to pick up from

## 3. Feature Status
Read `Features.md` in the project root for:
- What features are planned, in progress, and done
- Current priorities

## 4. Project Configuration
Read `CLAUDE.md` in the project root for:
- Tech stack and architecture overview
- Key conventions and patterns
- How to build, run, and test

## 5. Key Source Files
Identify and read the most critical source files for the project. Look at:
- Entry points (main files, index files, app files)
- Configuration files (package.json, docker-compose.yml, etc.)
- Core business logic files

## 6. Project State
Run these commands to understand current state:
- `git log --oneline -10` to see recent commits
- `git status` to see uncommitted changes
- Check if services are running (docker, dev servers, etc.)

## 7. Kick Off Domain Reviews
Launch agents in parallel to review their domains:
- **Engineering agents**: Read code files, check for technical debt, review architecture
- **Design agents**: Read any design docs, check UI consistency
- **Product agents**: Read any PRDs or specs, check feature completeness

## 8. Summarize
After reading everything, provide:
1. A brief summary of the project state
2. What's currently working vs broken
3. The recommended next action to take
4. Any blockers or questions to resolve first
