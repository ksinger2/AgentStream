# AgentStream — Feature Tracking

## Core Architecture
- **Frontend:** PixiJS 8 canvas (1920x1080) + HTML/CSS chat sidebar, served as static files
- **Backend:** Express.js server with `/api/decide` endpoint calling Claude Haiku 4.5
- **AI Loop:** Per-character autonomous loops (8s interval) with reactive conversation triggers
- **Event Bus:** Decoupled pub/sub communication between all modules (`js/events.js`)

---

## Done

### Room Rendering (`js/room-renderer.js`) — 2026-03-19
- [x] Four rooms drawn with programmatic PixiJS Graphics — furniture, floors, walls, depth layers
- **TLDR:** Kitchen (tile floor, counter, stove, fridge, table+chairs), Living Room (hardwood, couch, coffee table, TV, bookshelf, rug), Bedroom (carpet, bed+pillows, nightstand+lamp, dresser, window), Bathroom (tile, bathtub, toilet, sink, mirror). All cached on first draw.
- **Ambient animations:** Stove glow pulse, TV color cycling, lamp flicker, faucet drip — driven by `updateAmbient(delta)` each frame.

### Character Visual System (`js/characters.js`) — 2026-03-19
- [x] Characters drawn as figures (circle head, body, arms, legs, hair, eyes, shoes) — not sprites
- [x] Configurable: `skinTone` (5 tones), `hairStyle` (6 styles), `hairColor`, `color` (shirt), `accessory` (glasses/hat/earring)
- [x] Idle sinusoidal bobbing when stationary, walking sway when moving
- **TLDR:** `createSprite()` builds a PIXI.Container with Graphics drawings. `update(delta)` handles ease-out movement (5%/frame) + animation via `_animTick`. Movement is zone-based with random offset within zone bounds.

### Layout + Chat Panel (`public/index.html`, `js/ui.js`) — 2026-03-19
- [x] Flexbox layout — canvas (~70% left), chat sidebar (~30% right)
- [x] Sidebar: character cards (top), relationship meters, scrolling chat feed (max 80 msgs), input+Send (bottom)
- [x] Removed old ticker, operator modal, backtick handler
- **TLDR:** All speech/movement/mood/drama events flow into the chat feed with colored messages and slide-in animation. Action tags (CONFRONT, GOSSIP, FLIRT, SCHEME) have distinct colors. Speech bubbles on canvas have pointer triangles + colored accent bars, auto-fade 5s.

### Personality + Drama Engine (`js/agent-loop.js`, `server.js`, `js/events.js`) — 2026-03-19
- [x] Rich personality objects: `bio`, `traits`, `likes`, `dislikes`, `quirks`, `secretGoal`
- [x] Claude prompt: "You are on a reality TV show. Be dramatic." Actions: confront, gossip, flirt, scheme
- [x] 8s loop interval (down from 15s), reactive conversations for roommates (2-4s trigger)
- [x] Drama events every 2-3 min from pool of 20 scenarios
- [x] Dialogue limit 200 chars, max concurrent API requests = 2, max tokens = 400
- **TLDR:** Each character loop builds perception → calls `/api/decide` → executes action → updates history. When someone speaks, roommates get triggered early for natural back-and-forth. Drama engine injects events like "power went out" or "mysterious letter" into world state.

### Relationship System (`js/events.js`) — 2026-03-19
- [x] Directional relationship scores per pair: trust (0-100), irritation (0-100), attraction (0-100)
- [x] AI returns `relationshipChanges` with deltas, clamped to 0-100
- [x] ~~Sidebar displays averaged bidirectional scores with colored bars~~ (removed — UI cleanup)
- **TLDR:** Stored in `worldState.relationships` keyed as `"CharA->CharB"`. Defaults: trust=50, irritation=10, attraction=20. Updated via `updateRelationship()` in events.js. Relationship meters removed from sidebar for cleaner UI.

### Character Customization (`js/main.js`) — 2026-03-19
- [x] Setup modal on first load — 3 character cards with name, colors, hair, skin tone, accessory, personality
- [x] Config saved to `localStorage` key `agentstream_characters`, restored on reload
- **TLDR:** `showSetupModal()` in main.js populates dropdowns/buttons dynamically. "START THE SHOW" saves config, creates characters via `createCharactersFromConfig()`, hides modal, calls `startShow()`. Delete localStorage key to reset.

### Pause/Resume — 2026-03-19
- [x] Pause button in HUD + spacebar toggle
- [x] When paused: game loop skips, agent loops wait (no API calls = no token spend)
- **TLDR:** `isPaused` flag in main.js. Events `simulation:pause`/`simulation:resume` on event bus. Agent loop's `waitWhilePaused()` polls 500ms. Visual indicator on button.

### Episode Counter — 2026-03-19
- [x] "Episode X" in HUD, increments every 10 minutes
- **TLDR:** Tracked via `worldState.episodeStartTime` in events.js. `updateEpisode()` called each frame. Episode dividers appear in chat feed.

---

## Key Technical Reference

| Setting | Value | File |
|---------|-------|------|
| Canvas resolution | 1920x1080 | `js/main.js` |
| Agent loop interval | 8s | `js/agent-loop.js` |
| Agent stagger | 3s per character | `js/agent-loop.js` |
| Max concurrent API | 2 | `js/ai-brain.js` |
| Dialogue max length | 200 chars | `server.js` |
| Claude model | claude-haiku-4-5-20251001 | `server.js` |
| Max tokens/request | 400 | `server.js` |
| Speech bubble duration | 5s | `js/ui.js` |
| Drama event interval | 2-3 min | `js/agent-loop.js` |
| Episode duration | 10 min | `js/events.js` |
| World history max | 50 entries | `js/events.js` |
| Chat feed max | 80 messages | `js/ui.js` |
| Relationship range | 0-100 | `js/events.js` |
| localStorage key | `agentstream_characters` | `js/main.js` |

## File Map

| File | Purpose |
|------|---------|
| `public/index.html` | Layout, CSS, setup modal, sidebar HTML |
| `js/main.js` | Entry point, PixiJS init, setup modal, pause, game loop |
| `js/ui.js` | Chat feed, character cards, speech bubbles, debug overlay |
| `js/characters.js` | Character class, figure drawing, zones, perception builder |
| `js/room-renderer.js` | Programmatic room/furniture rendering + ambient animations |
| `js/events.js` | Event bus, world state, relationships, drama events, episode tracking |
| `js/agent-loop.js` | Per-character AI loops, reactive conversations, drama engine scheduler |
| `js/ai-brain.js` | API request queue (max 2 concurrent), stats tracking |
| `server.js` | Express server, `/api/decide` endpoint, Claude prompt, JSON extraction |

### Sprite Sheet Animation Pipeline (`js/sprite-animator.js`, `scripts/generate-spritesheet.js`) — 2026-03-19
- [x] `SpriteAnimator` class — loads metadata JSON, slices horizontal strips into PIXI.Texture[], drives PIXI.AnimatedSprite
- [x] Supports loop, oneShot, holdLastFrame, returnTo animation modes
- [x] `generate-spritesheet.js` CLI — generates sprite sheets via gpt-image-1, validates/resizes with sharp
- [x] Fallback chain in characters.js: sprite sheet → static PNG → procedural drawing
- [x] Walk/idle animation switching based on movement state, sprite flipping based on direction
- **TLDR:** `createSprite()` tries loading `{charId}/{charId}.json` metadata first. If found, creates SpriteAnimator with animated sprite. Falls back to static PNG, then procedural. `update()` switches walk↔idle and mirrors sprite on direction change.

### Character Quality Upgrade (`scripts/generate-characters.js`) — 2026-03-19
- [x] Updated SHARED_STYLE from pixel-art to "clean cartoon illustration with smooth lines, cel-shading, and anti-aliased edges"
- [x] Removed 1.15x width stretch — uniform scale now
- [ ] Regenerate all 12 characters with new style (requires running the script)

### UI Cleanup — 2026-03-19
- [x] Removed relationship meters from sidebar (HTML, CSS, JS)

## Planned
- [ ] Context-appropriate idle behaviors (cook in kitchen, watch TV in living room)
- [ ] Day/night cycle on bedroom window
- [ ] Sound effects / ambient audio
- [ ] Batch sprite sheet generation for all characters
- [ ] Additional animation triggers (mood → happy/sad/argue animations)
