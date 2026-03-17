---
description: Feature flag management — create, toggle, audit, and retire feature flags
---

# /feature-flag — Feature Flag Management

You are managing feature flags. Follow these steps based on the user's intent.

## Determine Action

- `/feature-flag create <name>` — Create a new feature flag
- `/feature-flag toggle <name> <on|off>` — Enable/disable a flag
- `/feature-flag list` — List all flags and their status
- `/feature-flag audit` — Audit for stale/unused flags
- `/feature-flag retire <name>` — Remove a flag and clean up code

## Create Flag

1. **Name**: Use kebab-case with category prefix (e.g., `feature-new-dashboard`, `experiment-signup-flow-v2`)
2. **Add flag definition** to the project's flag config:
   ```json
   {
     "name": "feature-new-dashboard",
     "description": "New dashboard redesign with analytics widgets",
     "type": "boolean",
     "default": false,
     "environments": {
       "development": true,
       "staging": true,
       "production": false
     },
     "owner": "<team/person>",
     "created": "YYYY-MM-DD",
     "planned_retirement": "YYYY-MM-DD"
   }
   ```
3. **Add code wrapper** at the usage point:
   ```typescript
   if (featureFlags.isEnabled('feature-new-dashboard')) {
     return <NewDashboard />;
   }
   return <OldDashboard />;
   ```
4. **Document** in `docs/feature-flags.md`

## Toggle Flag

1. Update the flag value for the specified environment
2. If toggling in production, require explicit confirmation
3. Log the change with who, when, and why

## List Flags

Scan the codebase for flag references and cross-reference with flag config:

```
Flag                        | Dev  | Staging | Prod | Age    | Owner
feature-new-dashboard       | ✅   | ✅      | ❌   | 14d    | @frontend
experiment-signup-flow-v2   | ✅   | ✅      | ✅   | 45d    | @growth
feature-dark-mode           | ✅   | ❌      | ❌   | 90d ⚠️ | @design
```

Flag warnings:
- Age >30 days and still not in production → review
- Age >90 days → stale, recommend retirement
- In production >30 days with 100% rollout → ready to retire (remove flag, keep feature)

## Audit

Scan for flag debt:
1. Find all flag references in code
2. Cross-reference with flag config
3. Identify:
   - **Stale flags**: Defined but never checked in code
   - **Orphaned code**: Flag checks for undefined flags
   - **Old flags**: Created >90 days ago, should be retired
   - **Always-on flags**: Enabled in all environments for >30 days

## Retire Flag

1. Verify the flag is enabled in all environments (feature is fully rolled out)
2. Remove all flag checks from code — keep the "enabled" code path, remove the "disabled" path
3. Remove flag from config
4. Remove from `docs/feature-flags.md`
5. Run tests to verify nothing breaks
6. Commit with: `chore: retire feature flag <name>`

## Best Practices

- Every flag has an owner and planned retirement date
- Flags are temporary — plan for removal at creation time
- Never nest flags (if flag A && flag B) — creates combinatorial complexity
- Test both paths (flag on and flag off) in CI
- Use flags for rollout control, not permanent configuration (use env vars for that)
