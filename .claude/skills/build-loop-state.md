# Build Loop State Management

Conventions and invariants for the `/autobuild` autonomous build loop state.

## State File

- **Location:** `tasks/build-state.md` is the single source of truth for build loop state
- **Created:** Phase 1 of `/autobuild` after plan approval
- **Updated:** Every iteration in Phase 2, Step 6
- **Archived:** On fresh restart, renamed to `tasks/build-state-{YYYY-MM-DD-HHmmss}.md`

## Invariants

These must hold true at all times during the build loop:

1. **Iteration always increments** — never decremented, never skipped, never reset mid-run
2. **State file written every cycle** — Step 6 always runs, even if the iteration did nothing
3. **Error log is append-only** — errors are never removed or edited, only added
4. **State file status matches TaskList** — if a task is marked `completed` in the state file, it must also be `completed` in TaskList (and vice versa)
5. **Progress log is append-only** — every iteration logs what happened, even "no action taken"

## Phase Transitions

```
init → plan → build → verify → done
                ↑        |
                └────────┘  (verify can loop back to build if issues found)
```

- **init → plan:** Always happens on fresh start
- **plan → build:** Only after user approves the plan
- **build → verify:** When all build tasks are `completed`
- **verify → build:** When QA or code review creates fix tasks
- **verify → done:** When all checks pass and user signs off

## Progress Detection

An iteration counts as "making progress" if ANY of these are true:

- A task moved from `pending` to `completed`
- A new fix task was created (response to a discovered issue)
- Test failures decreased compared to last test run
- A previously `failed` task was retried and moved to `completed`

An iteration has "zero progress" if NONE of the above occurred.

## Guardrail Checks

Run these checks in order at Step 2 of every iteration:

1. **Hard cap:** `iteration > 30` → stop immediately
2. **Checkpoint:** `iteration % 10 == 0` → pause for user
3. **Task retry cap:** any task with `retries >= 3` → stop and ask user about that task
4. **Stuck detection:** last 2 iterations both had zero progress → stop and ask user

## Task Status Values

| Status | Meaning |
|--------|---------|
| `pending` | Not yet started, waiting for dependencies or selection |
| `in-progress` | Currently being worked on by an agent |
| `completed` | Done and verified |
| `failed` | Attempted but failed verification — will retry if under cap |
| `blocked` | Cannot proceed — dependency failed or user input needed |

## Cost Model Assignment

Match agent model to task complexity:

| Task Type | Model | Examples |
|-----------|-------|---------|
| Status check, lint, file verify | `haiku` | "Does file X exist?", "Run linter" |
| Code generation, test writing | `sonnet` | "Implement component", "Write unit tests" |
| Architecture, complex debug | `opus` | "Design data model", "Debug race condition" |
