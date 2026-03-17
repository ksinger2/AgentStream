---
description: Structured debugging workflow — isolate root cause, trace errors, propose and verify fixes
---

# /debug — Structured Debugging Workflow

You are running a structured debugging session. Follow this protocol systematically.

## 1. Capture the Problem

Gather from the user:
- **Symptom**: What's happening? (error message, unexpected behavior, crash)
- **Expected**: What should happen instead?
- **Reproducibility**: Always, sometimes, or first occurrence?
- **Context**: When did it start? What changed recently?

If the user provided an error message or stack trace, start from that.

## 2. Reproduce

Before diagnosing, confirm the issue:
1. Run the failing command/test/endpoint
2. Capture the exact error output
3. If it can't be reproduced, check logs for the original occurrence
4. If intermittent, identify the conditions that trigger it

## 3. Isolate

Narrow down the scope systematically:

### Check Recent Changes
```
git log --oneline -10
git diff HEAD~3 -- <suspected files>
```

### Trace the Error
- Read the stack trace bottom-to-top (most specific → most general)
- Identify the exact file and line where the error originates
- Read surrounding code for context
- Check inputs to the failing function — are they what you expect?

### Binary Search (for regressions)
If the issue was introduced recently:
1. Find a known-good commit: `git log --oneline -20`
2. Test at midpoint between good and bad
3. Narrow the range until you find the introducing commit

## 4. Classify

Categorize the bug:
- **Type error / null reference** — Missing type check, unexpected null/undefined
- **Logic error** — Code runs but produces wrong result
- **State bug** — Race condition, stale state, incorrect state transition
- **Integration error** — API contract mismatch, schema drift, wrong assumptions
- **Configuration error** — Missing env var, wrong setting, environment mismatch
- **Dependency error** — Broken update, version conflict, missing package
- **Resource error** — Memory leak, connection exhaustion, disk full

## 5. Root Cause

Form a hypothesis and verify:
1. **Hypothesis**: "The bug is caused by X because Y"
2. **Evidence**: Read the code, check logs, inspect state
3. **Verify**: Can you prove the hypothesis? Add a temporary log/assert to confirm
4. If wrong, go back to step 3 with a new hypothesis
5. Max 3 hypotheses before stepping back and re-examining assumptions

## 6. Fix

Once root cause is confirmed:
1. Write the minimal fix that addresses the root cause
2. Don't fix symptoms — fix the actual problem
3. Run the test suite to ensure no regressions
4. Verify the original bug is resolved
5. Consider: should a test be added to prevent recurrence?

## 7. Verify

- Re-run the exact reproduction steps from step 2
- Run related tests
- Check for edge cases the fix might not cover
- If the fix involves async/timing, verify under load

## Report

Present to the user:
- **Root cause**: What caused the bug (1-2 sentences)
- **Fix**: What was changed and why
- **Verification**: Evidence that the fix works
- **Prevention**: Should a test or guard be added?
