# Onboard — Project Onboarding Guide

Comprehensive project onboarding that goes beyond `/reinit` to explain architecture, decisions, patterns, and how to contribute effectively.

## Step 1: Project Overview

Read and present:
1. `CLAUDE.md` — Project identity, stack, and conventions
2. `HardRules.md` — Non-negotiable rules
3. `Features.md` — What's been built and what's planned
4. `NextSteps.md` — Current state and immediate priorities

## Step 2: Architecture Deep Dive

Analyze the codebase structure:
1. Map the directory structure and explain each top-level directory's purpose
2. Identify entry points and explain the application flow
3. Trace a typical request/response through the system
4. Document key abstractions, services, and their relationships
5. Read `docs/architecture.md` if it exists

## Step 3: Key Patterns & Conventions

Identify and explain the project's patterns:
1. How components/modules are structured
2. State management approach
3. API communication patterns
4. Error handling conventions
5. Testing patterns and where tests live
6. Naming conventions in practice

## Step 4: Development Workflow

Explain how to work in this project:
1. How to run the project locally
2. How to run tests
3. Available slash commands and when to use each
4. Available agents and when to invoke each
5. The session protocol (NextSteps → work → update NextSteps)
6. How to use `/plan` before building, `/review` before committing, `/ship` to deploy

## Step 5: Critical Files Map

Create a map of the most important files:
```
## Critical Files
| File | Purpose | When to Read |
|------|---------|-------------|
```

## Step 6: Known Gotchas

Identify and document:
- Common pitfalls in the codebase
- Non-obvious dependencies between components
- Environment-specific quirks
- Things that look wrong but are intentional (and why)

## Step 7: Summary

Provide a concise "cheat sheet" the developer can reference:
- 5-line project summary
- Key commands to remember
- First thing to do to start contributing
- Who/what to ask when stuck
