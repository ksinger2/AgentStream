---
name: agent-efficiency
description: Use when delegating work to agents or running multi-agent workflows to ensure efficient model selection, parallel execution, batching, and minimal context waste
---

# Agent Efficiency Patterns

## Core Principle
Every agent call costs tokens. Minimize calls, maximize parallelism, choose the cheapest model that works.

## Model Selection Guide

| Task Type | Recommended Model | Why |
|-----------|------------------|-----|
| Architecture decisions | opus | Requires deep reasoning |
| Complex debugging | opus | Needs full context understanding |
| Security/privacy review | opus | High stakes, needs thoroughness |
| Code generation | sonnet | Good at code, much cheaper |
| Code review | sonnet | Pattern matching, sufficient quality |
| Scaffolding/boilerplate | sonnet | Templated work |
| Documentation | sonnet | Writing quality is fine |
| File search/exploration | haiku | Simple retrieval tasks |
| Formatting/linting | haiku | Mechanical transformation |
| Status checks | haiku | Simple Q&A |
| Test generation | sonnet | Pattern-based work |

## Parallel Execution Rules

1. **Always parallelize independent agents** — If agents don't depend on each other's output, launch them simultaneously
2. **Batch similar operations** — Instead of 5 separate agent calls for 5 files, give one agent all 5 files
3. **Pipeline dependent work** — If agent B needs agent A's output, run A first, then B. Don't run both and hope

## Context Efficiency

1. **Read only what you need** — Don't read entire files when you need one function
2. **Use Grep before Read** — Find the relevant section first, then read just that
3. **Don't re-read** — If you already have the content in context, don't read it again
4. **Use .claudeignore** — Ensure build artifacts and deps aren't polluting context
5. **Keep prompts lean** — Say what you need in fewer words. Remove filler.

## Anti-Patterns to Avoid

| Anti-Pattern | Why It's Wasteful | Better Approach |
|-------------|-------------------|-----------------|
| Opus for scaffolding | 15x more expensive than needed | Use sonnet or haiku |
| Sequential independent agents | 3x slower, same cost | Parallel launch |
| Reading entire codebase | Fills context with irrelevant code | Targeted Grep + Read |
| Retry loops without backoff | Multiplies cost on failures | Exponential backoff with max 3 retries |
| Agent for simple file read | Overhead of agent setup | Direct tool call |
| Redundant verification | Running same check twice | Cache/remember results |
| Over-delegating | Agent call for a one-line change | Do it directly |

## Batching Strategies

- **Multi-file edits**: Give one agent a list of files to edit with all changes, instead of one agent per file
- **Multi-test generation**: One QA agent writes tests for all changed files, not one per file
- **Bulk review**: One review pass over all changes, not per-file reviews
- **Grouped searches**: One Explore agent for all questions about a module, not one per question

## When NOT to Use an Agent

- Reading a specific file → Use Read tool
- Finding a file by name → Use Glob tool
- Searching for a string → Use Grep tool
- Running a command → Use Bash tool
- Simple one-line edit → Use Edit tool
- Answering from existing context → Just answer

## Cost Estimation Mental Model

- Opus ≈ 15x Haiku cost per token
- Sonnet ≈ 5x Haiku cost per token
- Each agent call has fixed overhead (~500 tokens for setup)
- Parallel agents don't save tokens, but save wall-clock time
