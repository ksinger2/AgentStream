# Ship — Build, Test, Verify, Commit

End-to-end workflow to ship changes with confidence.

## Step 1: Review

Run the `/review` command workflow on all pending changes.
If the review verdict is FIX FIRST, stop and fix the issues before continuing.

## Step 2: Build

Run the build command from `CLAUDE.md` (How to Run section).
Verify it completes with exit code 0.
If no build command is configured, skip this step.

## Step 3: Test

Run the test command from `CLAUDE.md` (How to Test section).
Verify all tests pass — read the full output, count failures.
If no test command is configured, skip this step.

## Step 4: Verify

Use the `verification-before-completion` skill.
Confirm: build passed, tests passed, review passed. Show evidence for each.

## Step 5: Commit

1. `git add` the relevant changed files (not blanket `git add .`)
2. `git commit` with a descriptive message summarizing what changed and why
3. Run `git status` to confirm clean state

## Step 6: Update Docs

1. Update `NextSteps.md` — what was just shipped, what's next
2. Update `Features.md` — move shipped features to Done with today's date

Report the commit hash and a one-line summary when done.
