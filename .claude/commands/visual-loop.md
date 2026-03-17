# Visual Iteration Loop — Real-time Design, PM, and Engineering Feedback

An automated iteration workflow using Chrome CDP to capture live screenshots, get multi-role feedback, implement fixes, and loop until the feature is polished and production-ready.

## Prerequisites

1. **Chrome remote debugging enabled**: Open `chrome://inspect/#remote-debugging` and toggle the switch
2. **Node.js 22+** installed
3. **Dev server running** with the feature visible in a Chrome tab

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                     VISUAL ITERATION LOOP                        │
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │Screenshot│───▶│  Design  │───▶│    PM    │───▶│Engineering│  │
│  │ Capture  │    │  Review  │    │  Review  │    │   Fixes   │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│       ▲                                               │         │
│       │                                               │         │
│       └───────────────────────────────────────────────┘         │
│                     (loop until approved)                        │
└─────────────────────────────────────────────────────────────────┘
```

## Phase 1: Setup

1. List open Chrome tabs to find your target:
   ```bash
   .claude/skills/chrome-cdp/scripts/cdp.mjs list
   ```

2. Note the target ID prefix (e.g., `6BE827FA`) for your dev server tab

3. Capture initial screenshot:
   ```bash
   .claude/skills/chrome-cdp/scripts/cdp.mjs shot <target> /tmp/review-initial.png
   ```

## Phase 2: Multi-Role Review Loop

### Step 1: Screenshot Capture
Use the `chrome-cdp` skill to capture the current state:
```bash
.claude/skills/chrome-cdp/scripts/cdp.mjs shot <target> /tmp/review-$(date +%s).png
```

### Step 2: Design Review
Launch the **lead-designer** agent with the screenshot to review:

**Focus Areas:**
- Visual consistency with design system
- Spacing and alignment
- Typography hierarchy
- Color usage and contrast
- Component styling
- Responsive behavior
- Animation/transition polish

**Output Format:**
```
## Design Feedback

### Must Fix (Blockers)
- [ ] Issue 1: [description] — [specific fix needed]

### Should Fix (High Priority)
- [ ] Issue 2: [description] — [specific fix needed]

### Nice to Have (Polish)
- [ ] Issue 3: [description] — [specific fix needed]

### Approved Aspects
- ✅ [what looks good]
```

### Step 3: PM Review
Launch the **principal-product-manager** agent with the screenshot to review:

**Focus Areas:**
- Feature completeness vs requirements
- User flow clarity
- Error state handling
- Edge cases covered
- Copy and messaging
- Business logic correctness
- Accessibility basics

**Output Format:**
```
## PM Feedback

### Blockers
- [ ] Issue 1: [description] — [acceptance criteria]

### Adjustments Needed
- [ ] Issue 2: [description] — [expected behavior]

### Questions/Clarifications
- [ ] Question 1: [need decision on...]

### Approved Aspects
- ✅ [what meets requirements]
```

### Step 4: Engineering Implementation
Launch the **frontend-engineer** (or appropriate engineer) to implement fixes:

1. Read all feedback from Design and PM
2. Prioritize: Blockers → High Priority → Polish
3. Implement each fix
4. After each fix, refresh the browser and re-screenshot to verify

### Step 5: Verification Screenshot
After fixes are implemented:
```bash
# Refresh the page
.claude/skills/chrome-cdp/scripts/cdp.mjs eval <target> "location.reload()"

# Wait for load, then screenshot
sleep 2
.claude/skills/chrome-cdp/scripts/cdp.mjs shot <target> /tmp/review-after-fix.png
```

### Step 6: Re-Review or Approve

**If issues remain:** Loop back to Step 1

**If approved:** Move to cleanup

## Phase 3: Cleanup

Delete temporary screenshots to save space:
```bash
rm /tmp/review-*.png
rm ~/.cache/cdp/screenshot-*.png
```

## Iteration Rules

1. **Max 5 iteration rounds** — If not converging, escalate blockers
2. **Each round captures fresh screenshot** — Never review stale state
3. **Parallel reviews** — Design and PM can review same screenshot concurrently
4. **Atomic fixes** — Engineer fixes one issue, screenshots, then next
5. **Delete screenshots after review** — Don't accumulate disk usage

## Quick Commands Reference

```bash
# List browser tabs
.claude/skills/chrome-cdp/scripts/cdp.mjs list

# Take screenshot
.claude/skills/chrome-cdp/scripts/cdp.mjs shot <target> /tmp/review.png

# Navigate to URL
.claude/skills/chrome-cdp/scripts/cdp.mjs nav <target> http://localhost:3000/feature

# Click element
.claude/skills/chrome-cdp/scripts/cdp.mjs click <target> "button.submit"

# Type text
.claude/skills/chrome-cdp/scripts/cdp.mjs type <target> "test input"

# Get accessibility tree (good for structure)
.claude/skills/chrome-cdp/scripts/cdp.mjs snap <target>

# Evaluate JavaScript
.claude/skills/chrome-cdp/scripts/cdp.mjs eval <target> "document.title"

# Cleanup all screenshots
rm ~/.cache/cdp/screenshot-*.png /tmp/review-*.png
```

## Example Session

```
User: /visual-loop

Claude: I'll start a visual iteration loop. First, let me find your dev server tab.

[Runs: cdp.mjs list]
Found: 6BE827FA  localhost:3000 - My Feature

[Runs: cdp.mjs shot 6BE827FA /tmp/review-1.png]
Screenshot captured.

[Launches lead-designer agent with screenshot]
Design Feedback:
- Must Fix: Button padding inconsistent (should be 12px 24px)
- Should Fix: Header font-weight should be 600, not 400
- Approved: Color palette, spacing grid

[Launches principal-product-manager agent with screenshot]
PM Feedback:
- Blockers: None
- Adjustments: Error message should be more specific
- Approved: Flow, CTA placement, copy

[Launches frontend-engineer agent]
Implementing fixes...
1. Fixed button padding
2. Fixed header font-weight
3. Updated error message

[Runs: cdp.mjs eval 6BE827FA "location.reload()"]
[Runs: cdp.mjs shot 6BE827FA /tmp/review-2.png]

[Re-launches lead-designer for verification]
Design Feedback:
- ✅ All previous issues resolved
- ✅ Ready for production

[Cleanup]
rm /tmp/review-*.png

Claude: Visual iteration complete. 2 rounds, all issues resolved. Ready to ship!
```

## When to Use This Command

- After implementing a new feature, before PR
- When iterating on UI polish
- For design handoff verification
- Quick QA passes before demo
- When debugging visual issues

## Integration with Other Commands

- Use after `/ship` to catch visual issues
- Combine with `/designreview` for comprehensive audits
- Use before `/deploy` as final visual check
