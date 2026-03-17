# MCP Server Setup Guide

Configuration guide for MCP servers used in this project template.

## Where MCP Servers Are Configured

MCP servers are configured in `.claude/settings.json` under the `mcpServers` key, alongside existing `permissions` and `hooks` settings:

```json
{
  "permissions": { ... },
  "hooks": { ... },
  "mcpServers": {
    "playwright": { ... },
    "ios-simulator": { ... },
    "android-simulator": { ... }
  }
}
```

## Playwright MCP

Browser automation for web testing and social media management.

### Prerequisites
- Node.js 18+

### Install
```bash
npm install -g @anthropic/mcp-playwright
# or
npx @anthropic/mcp-playwright
```

### Configuration
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@anthropic/mcp-playwright"],
      "env": {
        "BROWSER": "chromium"
      }
    }
  }
}
```

**Browser options**: `chromium` (default), `firefox`, `webkit`

### Available Tools
| Tool | Purpose |
|------|---------|
| `mcp__playwright__browser_navigate` | Navigate to a URL |
| `mcp__playwright__browser_click` | Click an element by selector |
| `mcp__playwright__browser_type` | Type text into an input |
| `mcp__playwright__browser_screenshot` | Capture page screenshot |
| `mcp__playwright__browser_wait` | Wait for element/condition |
| `mcp__playwright__browser_evaluate` | Execute JavaScript on page |

### Verification
After configuration, verify by asking Claude to navigate to a URL and take a screenshot.

---

## iOS Simulator MCP

iOS app testing via idb (iOS Development Bridge).

### Prerequisites
- macOS (required)
- Xcode installed with iOS simulators
- idb companion

### Install
```bash
brew install idb-companion
npm install -g @anthropic/mcp-ios-simulator
```

### Boot a Simulator
```bash
# List available simulators
xcrun simctl list devices

# Boot a simulator
xcrun simctl boot "iPhone 15 Pro"
```

### Configuration
```json
{
  "mcpServers": {
    "ios-simulator": {
      "command": "npx",
      "args": ["@anthropic/mcp-ios-simulator"]
    }
  }
}
```

### Available Tools
| Tool | Purpose |
|------|---------|
| `mcp__ios-simulator__screenshot` | Capture current screen |
| `mcp__ios-simulator__ui_tap` | Tap by accessibility ID or coordinates |
| `mcp__ios-simulator__ui_describe_all` | Full UI hierarchy with labels/positions |
| `mcp__ios-simulator__ui_swipe` | Swipe gestures (scroll, dismiss, navigate) |
| `mcp__ios-simulator__ui_type_text` | Type into focused field |
| `mcp__ios-simulator__ui_press_button` | Hardware/system buttons (home, lock) |
| `mcp__ios-simulator__install_app` | Install .app bundle |
| `mcp__ios-simulator__launch_app` | Launch app by bundle ID |

### Verification
Boot a simulator, then ask Claude to take a screenshot of it.

---

## Android Simulator MCP

Android app testing via adb (Android Debug Bridge).

### Prerequisites
- Android Studio with SDK installed
- Android emulator image downloaded
- adb in PATH

### Install
```bash
# Ensure adb is available
adb version

npm install -g @anthropic/mcp-android-simulator
```

### Start an Emulator
```bash
# List available AVDs
emulator -list-avds

# Start an emulator
emulator -avd Pixel_7_API_34
```

### Configuration
```json
{
  "mcpServers": {
    "android-simulator": {
      "command": "npx",
      "args": ["@anthropic/mcp-android-simulator"]
    }
  }
}
```

### Available Tools
| Tool | Purpose |
|------|---------|
| `mcp__android-simulator__screenshot` | Capture current screen |
| `mcp__android-simulator__tap` | Tap coordinates or element |
| `mcp__android-simulator__input_text` | Type text |
| `mcp__android-simulator__swipe` | Swipe/scroll gestures |
| `mcp__android-simulator__dump_ui` | UI hierarchy XML |
| `mcp__android-simulator__install_apk` | Install APK |
| `mcp__android-simulator__launch_activity` | Launch an activity |
| `mcp__android-simulator__press_key` | System keys (back, home, recent) |

### Verification
Start an emulator, then ask Claude to take a screenshot.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| MCP server not connecting | Check `settings.json` syntax, restart Claude Code |
| Playwright can't launch browser | Ensure browser is installed: `npx playwright install chromium` |
| iOS simulator not found | Boot simulator first: `xcrun simctl boot "iPhone 15 Pro"` |
| Android emulator not detected | Ensure emulator is running and `adb devices` shows it |
| Permission denied | Check that MCP tool permissions are granted in settings |
