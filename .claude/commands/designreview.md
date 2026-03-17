# Design Review — Visual QA & Engineering Fix Workflow

The lead designer and QA tester systematically review every screen in the application, document all visual and UX issues, then engineering implements all fixes.

## Phase 1: Screen Inventory

Launch the **manual-qa-tester** agent to:
1. Map every screen/page/route in the application
2. Identify all states per screen (default, loading, error, empty, populated, hover, focus, disabled)
3. Build a complete screen inventory list

## Phase 2: Visual Walkthrough

Launch the **lead-designer** and **manual-qa-tester** agents in parallel to review each screen:

### For Each Screen:
1. **Navigate** to the screen
2. **Screenshot** every state (default, loading, error, empty, populated)
3. **Inspect** the following:

#### Layout & Spacing
- Consistent padding/margins
- Proper alignment (grid/flex)
- No overflow or clipping issues
- Responsive behavior (mobile, tablet, desktop)

#### Typography
- Consistent font sizes and weights
- Proper heading hierarchy
- Text truncation handled correctly
- Line height and letter spacing

#### Colors & Theme
- Colors match design system/tokens
- Sufficient contrast ratios (WCAG AA: 4.5:1 text, 3:1 large text)
- Dark mode support (if applicable)
- Hover/focus/active state colors

#### Components
- Consistent button styles and sizes
- Form inputs match design system
- Icons are consistent size and style
- Cards/containers have consistent styling

#### Interactions & UX
- Clickable areas are large enough (44x44px minimum)
- Hover states present on interactive elements
- Loading indicators where needed
- Smooth transitions/animations
- No janky scroll behavior

#### Content & Copy
- No placeholder/lorem ipsum text
- Error messages are user-friendly
- Empty states have helpful messaging
- Labels are clear and consistent

#### Accessibility
- Focus indicators visible
- Tab order is logical
- Screen reader labels present
- Alt text on images
- Color is not the only indicator of state

## Phase 3: Issue Documentation

For each issue found, the **lead-designer** documents:

```
## Design Review Issues

| # | Screen | Category | Description | Severity | Screenshot | Fix Spec |
|---|--------|----------|-------------|----------|------------|----------|
```

### Severity Levels:
- **Critical** — Broken layout, inaccessible, unusable
- **High** — Visually inconsistent, poor UX, missing states
- **Medium** — Minor spacing/alignment, style inconsistency
- **Low** — Polish items, nice-to-haves

### Fix Spec Format:
For each issue, the designer provides:
- What it currently looks like (screenshot)
- What it should look like (spec/description)
- Exact CSS/layout values if applicable (spacing, colors, sizes)
- Which component/file needs to change

## Phase 4: Prioritized Fix Plan

The **lead-designer** groups issues by:
1. **Critical fixes** — Must fix before any release
2. **Screen-by-screen fixes** — Group related issues for efficient implementation
3. **Global fixes** — Issues that affect multiple screens (fix once, fix everywhere)

## Phase 5: Engineering Implementation

Launch engineering agents to fix all issues:

### Global Fixes First
**Agent:** `frontend-lead-engineer`
- Fix design system issues (colors, spacing, typography tokens)
- Fix shared component issues (buttons, inputs, cards)
- These fixes cascade to all screens

### Screen-Specific Fixes
**Agent:** `frontend-engineer` and `senior-frontend-engineer` (in parallel, split by screen)
- Each engineer takes a set of screens
- Implement fixes per the designer's specs
- Handle all states (loading, error, empty)

### For Each Fix:
1. Read the designer's fix spec
2. Implement the change
3. Verify it matches the spec
4. Ensure no regressions on other screens

## Phase 6: Design Verification

After all fixes are implemented:

1. **Rebuild** the application
2. Launch the **lead-designer** to re-review every screen that had issues
3. For each original issue:
   - [ ] Fixed and matches spec
   - [ ] Partially fixed — needs adjustment
   - [ ] Not fixed — still present
   - [ ] Regression — new issue introduced

4. If any issues remain, loop back to Phase 5 for those specific items

## Phase 7: Sign-Off

The **lead-designer** provides final sign-off:

```
## Design Review Sign-Off

### Review Date: [date]
### Screens Reviewed: X
### Issues Found: X
### Issues Fixed: X
### Issues Remaining: X

### Screen Status
| Screen | Status | Notes |
|--------|--------|-------|
| [screen] | ✅ Approved / ⚠️ Minor issues / ❌ Needs work | [notes] |

### Overall Verdict: APPROVED / NEEDS REVISION
```

Only mark complete when the designer approves ALL screens or explicitly accepts remaining items as known issues.
