# Hard Rules

These rules are non-negotiable. Follow them on every response, every task, every session.

## 1. Brevity

- MAX 2-4 sentences for simple responses, 6-8 for complex ones
- Bullets over paragraphs. No walls of text
- No narrating tool calls ("Let me read the file..." — just read it)
- Lead with the answer, not the reasoning

## 2. Verify Before Claiming Done

- Run the proving command. Read the output. Show evidence
- No "should work," "looks correct," or "I believe this fixes it"
- Use the `verification-before-completion` skill before any completion claim
- If you can't verify it, say so — don't guess

## 3. Plan Before Building

- Non-trivial work gets a plan before implementation
- Write it to `tasks/todo.md` or present inline for approval
- Include: what changes, which files, what could break
- Get user sign-off before writing code

## 4. Auto-Rebuild & Reuse

- After code changes that need a rebuild, just do it — don't tell the user to do it
- Check existing code, components, and utilities before creating new ones
- No over-engineering. No extra features. No "while I'm here" refactors
- The simplest solution that works is the right solution

## 5. Agent-First Workflow

- Always delegate work to the appropriate agent(s) from `.claude/agents/`
- Kick off agents in parallel when tasks are independent
- If no existing agent fits the task, tell the user and suggest creating one
- The user wants agents doing the work, not raw Claude

## 6. Cost-Aware Execution

- Use the cheapest model that can handle the task (see `agent-efficiency` skill)
- Parallelize independent agent tasks — never run them sequentially
- Batch similar operations into single agent calls
- Don't use agents for simple file reads, searches, or one-line edits — use tools directly
- Check context before re-reading files you already have
- No unbounded retry loops — max 3 retries with backoff
