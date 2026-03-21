# Love Island Overhaul Plan

## Overview
Transform AgentStream from a generic "AI House" into a Love Island-style dating show with coupling, recoupling ceremonies, voting/dumping, bombshell arrivals, confessional booth, and a tropical villa UI.

---

## Phase 1: Visual Overhaul — "The Villa"
**Files:** `public/index.html` (CSS + HTML), `js/room-renderer.js`, `js/characters.js`

### Rooms → Love Island Locations
| Current | New | Vibe |
|---------|-----|------|
| Kitchen | Kitchen | Morning debrief, coffee chats, breakfast drama |
| Living Room | Fire Pit | THE ceremony location — semicircle seating, torches, dramatic lighting |
| Bedroom | Bedroom | Shared beds, pillow talk, nighttime whispers |
| Bathroom | Day Beds | Poolside lounging, secret chats, "can I pull you for a chat?" |

### Color Palette Overhaul
- Background: Deep navy/sunset gradient (`#0a0520` → `#1a0a3e`)
- Accents: Hot pink (`#FF1493`), coral (`#FF6B6B`), electric blue (`#00D4FF`), lime (`#7CFF01`)
- Neon glow effects on room labels
- Fire Pit: Warm orange/amber glow
- Day Beds: Tropical teal/aqua

### HUD Redesign
- "LIVE" badge → neon pink pulsing heart + "LOVE ISLAND: AI VILLA"
- Episode counter → gold with palm tree emoji
- Add "COUPLED UP" status display
- Add "I'VE GOT A TEXT!" notification banner (slides in from top)

### Room Rendering Changes
- Fire Pit: Semicircle stone seats, central fire bowl, torch columns, starry sky
- Day Beds: White curtain drapes, pool edge with water shimmer, palm trees
- Kitchen: Tropical counters, fruit bowl, island-style open layout
- Bedroom: Multiple beds side by side (for couples), fairy lights, neon "LOVE" sign

### Chat Sidebar Restyling
- Rename "Character Cards" → couple status cards (shows who's coupled with who)
- Relationship meters → "Compatibility" meters with heart fills
- Message tags restyled: GRAFTING, PIED OFF, MUGGY, CONFESSIONAL, RECOUPLING
- Pink/coral accent colors throughout

---

## Phase 2: Game Mechanics — Coupling & Ceremonies
**Files:** `js/events.js`, `js/agent-loop.js`, `js/characters.js`, `server.js`

### Coupling System
```
worldState.couples = [{ id, partnerA, partnerB, since, compatibility }]
worldState.singleContestants = []
```
- All contestants start single
- Initial coupling ceremony happens at show start (Day 1)
- Characters reference their partner in perception: "I'm coupled up with Maya"
- Coupled characters gravitate toward each other (movement bias)

### Recoupling Ceremony (every ~5 min real-time = 1 "day")
- Event: `ceremony:recoupling`
- One gender picks (alternates each time)
- AI generates recoupling speeches: "The person I want to couple up with is..."
- Last person left uncoupled = at risk
- Chat displays full ceremony with dramatic formatting
- Fire Pit glows brighter during ceremonies

### Dumping / Vote-Off (every ~15 min)
- Bottom couple (lowest combined compatibility) faces the vote
- Other islanders vote who to dump OR producer (user) decides
- Dumped character: farewell speech, walks off, removed from sim
- Chat: "🚨 DUMPING ALERT 🚨" banner

### Bombshell Arrivals
- Producer command: "bombshell" or auto-triggered when cast drops below 4
- New character enters with dramatic intro
- Gets to go on dates with existing islanders
- Must couple up at next recoupling or go home

### Day/Night Cycle (~5 min per "day")
- Morning: Characters debrief, gossip about last night
- Afternoon: Challenges, dates, grafting
- Evening: Getting ready, fire pit gatherings
- Night: Bedtime conversations, pillow talk with partner
- Time shown in HUD: "Day 3 — Evening"

---

## Phase 3: Confessional Booth (Beach Hut)
**Files:** `js/confessional.js` (new), `js/ui.js`, `server.js`, `public/index.html`

### How It Works
- Every 30-60s, a random character is "pulled to the confessional"
- AI generates an unfiltered monologue (separate prompt — more raw/honest)
- Confessional appears in a special UI panel on screen:
  - Polaroid-style frame with character's name
  - Typewriter text animation for their thoughts
  - Character portrait/emoji
  - Background: Tropical wallpaper or neon sign
- Confessionals are UNFILTERED:
  - Talk trash about other islanders
  - Reveal secret crushes
  - Complain about their partner
  - Strategize about alliances
  - React to recent drama
  - Make fun of people they're annoyed with

### Confessional Prompt (server-side)
Separate `/api/confessional` endpoint with a different system prompt:
- "You're in the Beach Hut confessional. No one can hear you. Be BRUTALLY honest."
- Longer responses allowed (400 chars)
- More emotional range — crying, ranting, gushing, scheming
- References specific recent events and other characters by name

### UI Component
- Slides in from bottom-right as an overlay panel
- Stays visible for 8-10 seconds
- Character name + mood emoji at top
- Quote-style text with quotation marks
- Subtle tropical background pattern
- Auto-cycles through characters

---

## Phase 4: Dialogue & Personality Overhaul
**Files:** `server.js` (system prompt), `js/characters.js` (personalities)

### System Prompt Rewrite
- Characters use Love Island slang: "grafting," "muggy," "pied off," "my head's turned," "it is what it is"
- Reference their couple status in every decision
- React to bombshells with jealousy/excitement
- During ceremonies: generate recoupling speeches
- Awareness of "the game" — strategy + genuine feelings mixed

### Default Personalities (Love Island Archetypes)
1. **The Bombshell** — Confident, flirty, here to steal someone's partner
2. **The Loyal One** — Committed to their couple, gets devastated by betrayal
3. **The Game Player** — Strategic, forms alliances, plays multiple people
4. **The Drama Magnet** — Everything is a crisis, confrontational, memorable quotes
5. **The Hopeless Romantic** — Falls hard and fast, writes love notes, cries easily

### "I'VE GOT A TEXT!" System
- When game events trigger (recoupling, dumping, challenge, bombshell):
- One character "gets a text" — reads it aloud
- Full-screen notification banner
- All characters react

---

## Phase 5: Producer Controls Enhancement
**Files:** `js/ui.js`, `js/events.js`

### New Producer Commands
| Command | Effect |
|---------|--------|
| "bombshell [name]" | Introduce new contestant |
| "recouple" | Trigger recoupling ceremony |
| "dump" | Trigger dumping vote |
| "challenge" | Start a couples challenge |
| "casa amor" | Split couples into separate groups |
| "movie night" | Reveal secret clips to all islanders |
| "text [message]" | Send an "I'VE GOT A TEXT!" to islanders |

---

## File Changes Summary

| File | Changes |
|------|---------|
| `public/index.html` | Complete visual overhaul — tropical colors, neon accents, confessional panel, ceremony UI, couple cards |
| `js/room-renderer.js` | Redraw all 4 rooms as Love Island locations (Fire Pit, Day Beds, Kitchen, Bedroom) |
| `js/characters.js` | Love Island personalities, couple awareness in perception, new archetypes |
| `js/events.js` | Coupling system, ceremony events, day/night cycle, bombshell mechanics |
| `js/agent-loop.js` | Ceremony participation, confessional triggers, couple-aware behavior |
| `js/confessional.js` | NEW — confessional booth logic, random character selection, display timer |
| `js/ui.js` | Confessional panel rendering, ceremony display, "I GOT A TEXT" banner, restyled messages |
| `server.js` | New `/api/confessional` endpoint, rewritten system prompt with Love Island slang |
| `js/main.js` | Init confessional system, day/night cycle |

---

## Implementation Order
1. **Phase 1** — Visual overhaul (rooms + CSS + HUD) — makes it look right immediately
2. **Phase 4** — Dialogue overhaul (system prompt + personalities) — makes it sound right
3. **Phase 3** — Confessional booth — high-impact, standalone feature
4. **Phase 2** — Coupling & ceremonies — core game loop
5. **Phase 5** — Producer commands — polish

## Verification
1. Server starts, villa renders with tropical aesthetic
2. Characters speak with Love Island slang
3. Confessionals appear every 30-60s with unfiltered thoughts
4. Recoupling ceremony triggers every ~5 min
5. "I'VE GOT A TEXT!" notifications appear
6. Producer can type "bombshell" to add new contestant
7. Dumping removes a character with farewell speech
