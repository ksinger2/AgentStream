---
description: Visual regression testing — capture UI screenshots, diff against baseline, flag regressions
---

# /snapshot — Visual Regression Testing

You are running visual regression tests. This captures UI screenshots and compares them against a stored baseline.

## 1. Determine Scope

Parse the user's request:
- `/snapshot update` — Capture new baseline screenshots
- `/snapshot test` — Compare current UI against baseline
- `/snapshot <page/component>` — Snapshot a specific page or component
- No argument — Run full visual regression suite

## 2. Capture Screenshots

Use Playwright for screenshot capture:

```javascript
// Playwright screenshot script pattern
const { chromium } = require('playwright');

const pages = [
  { name: 'home', url: '/', viewports: ['desktop', 'mobile'] },
  { name: 'login', url: '/login', viewports: ['desktop', 'mobile'] },
  // Add pages from project routes
];

const viewports = {
  desktop: { width: 1280, height: 720 },
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
};
```

For each page:
1. Navigate to the URL
2. Wait for network idle
3. Capture full-page screenshot
4. Capture each viewport size
5. Save to `tests/snapshots/current/`

## 3. Compare Against Baseline

If baseline exists (`tests/snapshots/baseline/`):
1. Pixel-diff each current screenshot against its baseline
2. Calculate diff percentage
3. Flag regressions: >0.1% pixel difference = visual change

### Thresholds
- **<0.1%** — No change (pass)
- **0.1% - 1%** — Minor change (review)
- **>1%** — Significant change (flag)
- **Missing baseline** — New page, needs baseline

## 4. Update Baseline

If `/snapshot update`:
1. Capture all screenshots
2. Move to `tests/snapshots/baseline/`
3. Commit baseline with descriptive message

## 5. Report

Present results:

```
Page            | Viewport | Status | Diff %  | Notes
home            | desktop  | ✅ Pass | 0.00%  |
home            | mobile   | ⚠️ Review | 0.34%  | Header padding changed
login           | desktop  | ❌ Fail | 3.21%  | Button style regression
dashboard       | desktop  | 🆕 New  | —      | Needs baseline
```

For flagged changes:
- Show side-by-side: baseline vs current
- Highlight the diff areas
- Ask user: intentional change (update baseline) or regression (needs fix)?

## 6. CI Integration

Recommend adding to CI pipeline:
- Run on every PR
- Block merge if visual regressions detected
- Store screenshots as CI artifacts for review

## File Structure
```
tests/snapshots/
├── baseline/          # Approved reference screenshots
│   ├── home-desktop.png
│   ├── home-mobile.png
│   └── ...
├── current/           # Latest captured screenshots
└── diff/              # Diff images (auto-generated)
```
