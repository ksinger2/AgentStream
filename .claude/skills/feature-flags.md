---
name: feature-flags
description: Feature flag patterns — instrumentation, naming conventions, testing, lifecycle management, and debt prevention
---

# Feature Flag Patterns

Standards for implementing, testing, and retiring feature flags to enable controlled rollouts without accumulating flag debt.

## Naming Convention

Format: `<category>-<feature-name>`

| Category | Purpose | Example |
|----------|---------|---------|
| `feature-` | New feature rollout | `feature-new-checkout` |
| `experiment-` | A/B test | `experiment-signup-flow-v2` |
| `ops-` | Operational toggle | `ops-maintenance-mode` |
| `fix-` | Temporary fix toggle | `fix-rate-limit-bypass` |
| `kill-` | Kill switch for dependencies | `kill-external-search-api` |

## Flag Definition

Every flag must have:
```json
{
  "name": "feature-new-checkout",
  "description": "New checkout flow with Apple Pay support",
  "type": "boolean",
  "default": false,
  "owner": "@payments-team",
  "created": "2025-01-15",
  "planned_retirement": "2025-04-15",
  "jira": "PAY-1234"
}
```

## Code Instrumentation

### Simple Boolean Flag
```typescript
// Good — clear, minimal
if (flags.isEnabled('feature-new-checkout')) {
  return <NewCheckout />;
}
return <OldCheckout />;
```

### Percentage Rollout
```typescript
// Flag returns a percentage, SDK handles assignment
if (flags.isEnabled('feature-new-checkout', { userId: user.id })) {
  // User is in the rollout group
}
```

### Anti-Patterns

```typescript
// BAD — nested flags create combinatorial explosion
if (flags.isEnabled('feature-a')) {
  if (flags.isEnabled('feature-b')) {
    // How do you test this? 4 combinations minimum
  }
}

// BAD — flag in a tight loop (performance)
items.map(item => {
  if (flags.isEnabled('feature-new-item-view')) { ... }
});
// GOOD — evaluate once, use the result
const useNewView = flags.isEnabled('feature-new-item-view');
items.map(item => {
  if (useNewView) { ... }
});

// BAD — using flags for permanent configuration
if (flags.isEnabled('config-max-upload-size-10mb')) { ... }
// GOOD — use environment variables for configuration
const maxUploadSize = process.env.MAX_UPLOAD_SIZE || '5mb';
```

## Testing with Flags

```typescript
// Test BOTH paths for every flag
describe('Checkout', () => {
  it('renders old checkout when flag is off', () => {
    setFlag('feature-new-checkout', false);
    render(<Checkout />);
    expect(screen.getByText('Classic Checkout')).toBeInTheDocument();
  });

  it('renders new checkout when flag is on', () => {
    setFlag('feature-new-checkout', true);
    render(<Checkout />);
    expect(screen.getByText('New Checkout')).toBeInTheDocument();
  });
});
```

## Flag Lifecycle

```
Create → Develop → Test → Canary (5%) → Ramp (25% → 50% → 100%) → Bake (2 weeks) → Retire
```

### Rollout Steps
1. **Create flag** (default: off in all environments)
2. **Enable in dev** — develop and test
3. **Enable in staging** — integration testing
4. **Canary in production** (5%) — monitor for errors
5. **Ramp to 25%** — monitor key metrics
6. **Ramp to 50%** — broader validation
7. **Ramp to 100%** — full rollout
8. **Bake period** (2 weeks at 100%) — confirm stability
9. **Retire flag** — remove flag code, keep "on" path

### Retirement Checklist
- [ ] Flag has been at 100% in production for >2 weeks
- [ ] No incidents related to the flag during bake period
- [ ] Remove all flag evaluation code
- [ ] Remove the "off" code path
- [ ] Remove flag from configuration
- [ ] Remove from `docs/feature-flags.md`
- [ ] Add removal to changelog

## Flag Debt Prevention

- Set a `planned_retirement` date at creation — flags should be temporary
- Weekly audit: any flag past its retirement date triggers a reminder
- Maximum flag age: 90 days (exceptions require justification)
- Maximum active flags: 20 (forces cleanup before adding new ones)
- No flags in shared libraries — only in application code
