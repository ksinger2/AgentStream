# Autobuild — Autonomous Build Loop

Autonomous end-to-end build workflow: plan → build → test → decide next → loop. Stops only at checkpoints, when stuck, or when done.

---

## Phase 0: Initialize

1. Read `CLAUDE.md`, `HardRules.md`, `Features.md`, `NextSteps.md`
2. Check for `{{PROJECT_NAME}}` placeholders in `CLAUDE.md` — if found, stop and tell user to run `/setup` first
3. Check if `tasks/build-state.md` exists:
   - **Exists:** Show summary (iteration count, tasks completed, last action). Ask: "Resume or start fresh?"
     - If fresh: archive to `tasks/build-state-{YYYY-MM-DD-HHmmss}.md`, then proceed to Phase 1
     - If resume: proceed to Phase 2 at current state
   - **Does not exist:** Proceed to Phase 1
4. Set iteration counter to 0

---

## Phase 1: Plan (Requires User Approval)

### 1.1 Gather Requirements
- Ask user what to build — OR read planned items from `Features.md` if user says "build what's planned"
- If requirement is ambiguous, ask for clarification. Do NOT guess.

### 1.2 Parallel Planning
Launch two agents in parallel:

**Agent:** `principal-product-manager`
**Task:** Break the request into user stories with acceptance criteria. Define what "done" looks like for each.

**Agent:** `principal-engineer`
**Task:** Design architecture, identify files to create/modify, choose patterns from existing codebase. Flag anything that touches database schemas, auth, payments, or secrets — these require explicit user approval.

### 1.3 Build Plan Table
Combine outputs into a structured plan:

```markdown
| # | Task | Files | Agent | Depends On | Priority | Status | Retries |
```

- Use TaskCreate for each row with dependencies
- Assign agents based on task type:
  - UI work → `frontend-engineer` or `senior-frontend-engineer`
  - API/backend → `backend-lead-engineer`
  - Tests → `qa-engineer`
  - AI features → `ai-engineer`
  - Infra → `devops-engineer`

### 1.4 Write State File
Write plan to `tasks/build-state.md` using the State File Format below.

### 1.5 User Approval Gate
**STOP. Present the plan to the user. Do NOT proceed until user approves.**

Show: task count, estimated agent assignments, files affected, anything flagged as risky.

---

## Phase 2: Build Loop (Core Autonomous Cycle)

Each iteration runs these steps in order:

### Step 1 — Read State
- Read `tasks/build-state.md` and TaskList
- Increment iteration counter
- Update state file with new iteration number

### Step 2 — Check Guardrails
Evaluate STOP conditions in order:

| Condition | Action |
|-----------|--------|
| `iteration > 30` | **HARD STOP.** Report final status to user. |
| `iteration % 10 == 0` | **MANDATORY CHECKPOINT.** Show status report, ask user to continue. |
| Same task failed 3+ times | **STOP.** Show error log for that task, ask user for help. |
| 2 consecutive iterations with zero progress | **STOP.** Report what's stuck, ask user. |

If no stop condition triggered, continue.

### Step 3 — Pick Next Work
- Find highest-priority task with status `pending` and all dependencies met
- If multiple independent tasks have no file overlap → run them in parallel
- If ALL tasks are `completed` → go to Phase 3

### Step 4 — Execute
- Launch the assigned agent for the selected task(s)
- Use cost-appropriate models: `haiku` for status/lint checks, `sonnet` for code generation, `opus` only for architecture decisions
- After agent completes, verify output:
  - Files exist that should exist
  - No syntax errors (run linter/build if available)
  - Follows existing codebase conventions
- If verification passes → mark task `completed` via TaskUpdate
- If verification fails → log error, increment retry counter, mark task `failed`

### Step 5 — Test (every 3 completions OR when all build tasks done)
- Run build command from `CLAUDE.md` "How to Run" section
- Run test command from `CLAUDE.md` "How to Test" section
- If build/test failures:
  - Analyze error output
  - If obvious fix (missing import, type error, lint issue) → create fix task with `priority: high`, continue loop
  - If unclear → log error, continue to next task
- Launch **qa-engineer** (model: `sonnet`) to check test coverage for completed tasks
- Create tasks for any missing test coverage

### Step 6 — Update State
- Write updated status to `tasks/build-state.md`
- Every 5 iterations: update `NextSteps.md` with current progress
- Loop back to Step 1

---

## Phase 3: Verify & Ship

### 3.1 Final Build Check
- Run build command — must exit 0
- Run test command — must pass
- If failures → create fix tasks, return to Phase 2

### 3.2 Parallel QA Review
Launch in parallel:

**Agent:** `qa-engineer` (model: `sonnet`)
**Task:** Review test coverage, check for missing edge cases, verify all acceptance criteria have tests.

**Agent:** `manual-qa-tester` (model: `sonnet`)
**Task:** Walk through all user flows, check UI states, verify interactions work correctly.

### 3.3 Parallel Specialist Reviews
Launch ALL of the following in parallel:

**Agent:** `lead-designer` (model: `sonnet`)
**Task:** Visually review every screen/view that was built or changed. For each screen: take a screenshot (or use browser tools directly), inspect layout, spacing, typography, color, responsiveness, and accessibility. **Delete screenshots after observation to save disk space.** Flag any visual issues, inconsistencies with the design system, or accessibility violations.

**Agent:** `principal-engineer` (model: `sonnet`)
**Task:** Final code review — check for bugs, hardcoded values, convention violations, over-engineering.

**Agent:** `security-reviewer` (model: `sonnet`)
**Task:** Full security audit of all new/changed code. Check for OWASP top 10: injection (SQL, command, XSS), broken auth, sensitive data exposure, insecure deserialization, CSRF, SSRF, path traversal, insecure dependencies. Review API endpoints for authorization bypass, rate limiting gaps, and input validation holes. **Create fix tasks with patches for every vulnerability found** — do not just report, fix them.

**Agent:** `ai-engineer` (model: `sonnet`)
**Task:** Review all prompts, system messages, and LLM integration code that was built or changed. Optimize prompt wording for clarity, token efficiency, and output quality. Check for prompt injection vulnerabilities, missing guardrails, and hallucination risks. Improve few-shot examples, output parsing, and error handling around AI calls. **Apply optimizations directly** — rewrite prompts in-place where improvements are found. *(Skip this agent if no AI/LLM code was built this session.)*

### 3.4 Issue Resolution
- If QA, design review, security audit, AI review, or code review found issues → create fix tasks, return to Phase 2
- If all clear → proceed to 3.5

### 3.5 Ship
1. Use `verification-before-completion` skill to confirm everything passes
2. Commit changes with descriptive message summarizing what was built
3. Update `Features.md` — mark completed features
4. Update `NextSteps.md` — capture final state
5. Report to user: what was built, files changed, tasks completed, iterations used

---

## Decision Tree

### ASK USER:
- Project not set up (placeholders in CLAUDE.md)
- Plan created, needs approval (Phase 1.5)
- Ambiguous requirement — agent can't determine what to build
- Same task failed 3 times
- No progress for 2 consecutive iterations
- Every 10 iterations (mandatory checkpoint)
- Build complete (final sign-off in Phase 3.5)
- Task touches database schemas, auth, payments, or secrets

### KEEP GOING:
- Next task is clear and unblocked
- Build/test failure with obvious fix (lint, missing import, type error)
- Iteration count < 10 since last checkpoint
- QA found minor issues that map to clear fix tasks

---

## Guardrails

| Guardrail | Value | Action |
|-----------|-------|--------|
| Hard iteration cap | 30 | Stop, report status |
| Mandatory checkpoint | Every 10 iterations | Pause, show status, wait for user |
| Per-task retry cap | 3 | Stop task, ask user |
| Stuck detection | 2 zero-progress iterations | Stop, ask user |
| Protected domains | DB schemas, auth, payments, secrets | Always ask user before modifying |

### Cost-Aware Model Selection
- `haiku` — status checks, file existence, lint runs
- `sonnet` — code generation, test writing, QA reviews
- `opus` — architecture decisions, complex debugging, principal-engineer reviews (only when needed)

---

## State File Format

`tasks/build-state.md`:

```markdown
# Autobuild State

## Request
[Original user request — verbatim]

## Plan
| # | Task | Files | Agent | Depends On | Priority | Status | Retries |
|---|------|-------|-------|------------|----------|--------|---------|

## Current
- Phase: [init|plan|build|verify|done]
- Iteration: [N]
- Last action: [description of what just happened]
- Tasks completed: [X/Y]
- Last checkpoint: [iteration number]

## Progress Log
| Iteration | Action | Result |
|-----------|--------|--------|

## Error Log
| Iteration | Task # | Error | Resolution |
|-----------|--------|-------|------------|
```

---

## Recovery Protocol

When `/autobuild` starts and finds existing `tasks/build-state.md`:

1. Read and parse the state file
2. Show summary:
   - Phase: `[current phase]`
   - Iteration: `[N]`
   - Tasks: `[X/Y completed]`
   - Last action: `[description]`
   - Errors: `[count]`
3. Ask: **"Resume from iteration [N] or start fresh?"**
4. If resume → jump to Phase 2, Step 1
5. If fresh → rename to `tasks/build-state-{YYYY-MM-DD-HHmmss}.md`, start Phase 0
