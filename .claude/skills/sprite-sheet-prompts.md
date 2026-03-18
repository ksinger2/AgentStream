---
name: sprite-sheet-prompts
description: Use when generating GPT image prompts for character sprite sheets. Produces copy-paste-ready prompts for each animation state (idle, walk, sit, eat, drink, argue, happy, sad, sleep, die) following the exact sprite sheet format spec.
---

# Sprite Sheet — GPT Image Generation Prompts

## How to Use
1. Replace `{{CHARACTER_NAME}}` and `{{CHARACTER_DESCRIPTION}}` with the character's details
2. Send each prompt to GPT image generation (gpt-image-1 or DALL·E)
3. Save the output as `animation_name.png` in `/assets/characters/{{character_id}}/`
4. Create the matching `{{character_id}}.json` metadata file (template below)

## Format Spec (MUST be in every prompt)
- **Single horizontal strip** — all frames in one row, left to right
- **Frame size**: 128×128 pixels each
- **Total image dimensions**: (frameCount × 128) wide × 128 tall
- **Transparent PNG background** (alpha channel)
- **Consistent character appearance** across ALL frames and ALL animations
- **Side-view perspective** (like a 2D platformer / The Sims)
- **Clean pixel-art or cartoon style** — no photorealism

---

## Prompt Templates

### idle.png — 4 frames (512×128)
```
Create a 2D sprite sheet as a single horizontal strip PNG image with transparent background.
The strip contains exactly 4 frames, each 128x128 pixels, for a total image size of 512x128 pixels.

Character: {{CHARACTER_NAME}} — {{CHARACTER_DESCRIPTION}}

Animation: IDLE — subtle breathing/standing animation.
- Frame 1: Standing neutral pose
- Frame 2: Slight chest rise (breathing in)
- Frame 3: Standing neutral pose
- Frame 4: Slight settle (breathing out)

Style: Clean 2D cartoon/pixel-art, side-view perspective, consistent character design across all frames. No background — transparent PNG only.
```

### walk.png — 8 frames (1024×128)
```
Create a 2D sprite sheet as a single horizontal strip PNG image with transparent background.
The strip contains exactly 8 frames, each 128x128 pixels, for a total image size of 1024x128 pixels.

Character: {{CHARACTER_NAME}} — {{CHARACTER_DESCRIPTION}}

Animation: WALK CYCLE — smooth side-view walking loop.
- Frame 1: Right foot forward (contact)
- Frame 2: Right foot passing
- Frame 3: Right foot forward (passing center)
- Frame 4: Right foot push-off
- Frame 5: Left foot forward (contact)
- Frame 6: Left foot passing
- Frame 7: Left foot forward (passing center)
- Frame 8: Left foot push-off

Style: Clean 2D cartoon/pixel-art, side-view perspective (facing right), consistent character design across all frames. Arms should swing naturally. No background — transparent PNG only.
```

### sit.png — 4 frames (512×128)
```
Create a 2D sprite sheet as a single horizontal strip PNG image with transparent background.
The strip contains exactly 4 frames, each 128x128 pixels, for a total image size of 512x128 pixels.

Character: {{CHARACTER_NAME}} — {{CHARACTER_DESCRIPTION}}

Animation: SIT DOWN — transition from standing to seated.
- Frame 1: Standing, beginning to bend knees
- Frame 2: Half-way down, knees bent
- Frame 3: Almost seated, lowering into chair
- Frame 4: Fully seated, relaxed pose (hold frame)

Style: Clean 2D cartoon/pixel-art, side-view perspective, consistent character design across all frames. No background — transparent PNG only.
```

### eat.png — 6 frames (768×128)
```
Create a 2D sprite sheet as a single horizontal strip PNG image with transparent background.
The strip contains exactly 6 frames, each 128x128 pixels, for a total image size of 768x128 pixels.

Character: {{CHARACTER_NAME}} — {{CHARACTER_DESCRIPTION}}

Animation: EATING — seated character eating food in a loop.
- Frame 1: Seated, holding food/fork near plate
- Frame 2: Lifting food toward mouth
- Frame 3: Food at mouth, mouth open
- Frame 4: Chewing, mouth closed, content expression
- Frame 5: Chewing, slight jaw movement
- Frame 6: Swallowing, reaching for next bite

Style: Clean 2D cartoon/pixel-art, side-view perspective, consistent character design across all frames. No background — transparent PNG only.
```

### drink.png — 6 frames (768×128)
```
Create a 2D sprite sheet as a single horizontal strip PNG image with transparent background.
The strip contains exactly 6 frames, each 128x128 pixels, for a total image size of 768x128 pixels.

Character: {{CHARACTER_NAME}} — {{CHARACTER_DESCRIPTION}}

Animation: DRINKING — character drinking from a cup/glass in a loop.
- Frame 1: Holding cup at chest level
- Frame 2: Raising cup toward mouth
- Frame 3: Cup at lips, tilting back
- Frame 4: Drinking, cup tilted
- Frame 5: Lowering cup, satisfied expression
- Frame 6: Cup at chest level, slight pause

Style: Clean 2D cartoon/pixel-art, side-view perspective, consistent character design across all frames. No background — transparent PNG only.
```

### argue.png — 6 frames (768×128)
```
Create a 2D sprite sheet as a single horizontal strip PNG image with transparent background.
The strip contains exactly 6 frames, each 128x128 pixels, for a total image size of 768x128 pixels.

Character: {{CHARACTER_NAME}} — {{CHARACTER_DESCRIPTION}}

Animation: ARGUING — heated animated argument gestures in a loop.
- Frame 1: Standing tense, fists slightly clenched
- Frame 2: Leaning forward, mouth open, one arm gesturing
- Frame 3: Both arms up in frustration
- Frame 4: Pointing finger forward aggressively
- Frame 5: Arms crossed, scowling
- Frame 6: Throwing hands up in exasperation

Style: Clean 2D cartoon/pixel-art, side-view perspective, angry/frustrated expression, consistent character design across all frames. No background — transparent PNG only.
```

### happy.png — 6 frames (768×128)
```
Create a 2D sprite sheet as a single horizontal strip PNG image with transparent background.
The strip contains exactly 6 frames, each 128x128 pixels, for a total image size of 768x128 pixels.

Character: {{CHARACTER_NAME}} — {{CHARACTER_DESCRIPTION}}

Animation: HAPPY CELEBRATION — one-shot joy reaction, returns to idle.
- Frame 1: Surprise expression, eyes wide
- Frame 2: Big smile forming, arms starting to raise
- Frame 3: Arms up in the air, jumping slightly
- Frame 4: Peak of jump, huge grin, arms spread
- Frame 5: Landing, still smiling, arms coming down
- Frame 6: Settled, warm smile, relaxed happy pose

Style: Clean 2D cartoon/pixel-art, side-view perspective, joyful expression throughout, consistent character design across all frames. No background — transparent PNG only.
```

### sad.png — 4 frames (512×128)
```
Create a 2D sprite sheet as a single horizontal strip PNG image with transparent background.
The strip contains exactly 4 frames, each 128x128 pixels, for a total image size of 512x128 pixels.

Character: {{CHARACTER_NAME}} — {{CHARACTER_DESCRIPTION}}

Animation: SAD — dejected looping animation.
- Frame 1: Shoulders slumped, looking down
- Frame 2: Slight sigh, chest deflating
- Frame 3: Hand wiping eye / touching face
- Frame 4: Shoulders slumped again, head slightly lower

Style: Clean 2D cartoon/pixel-art, side-view perspective, sad/dejected expression, consistent character design across all frames. No background — transparent PNG only.
```

### sleep.png — 4 frames (512×128)
```
Create a 2D sprite sheet as a single horizontal strip PNG image with transparent background.
The strip contains exactly 4 frames, each 128x128 pixels, for a total image size of 512x128 pixels.

Character: {{CHARACTER_NAME}} — {{CHARACTER_DESCRIPTION}}

Animation: SLEEPING — gentle breathing while asleep, looping.
- Frame 1: Lying/reclined, eyes closed, relaxed
- Frame 2: Slight chest rise, small "Z" above head
- Frame 3: Chest at peak, "ZZ" above head
- Frame 4: Chest settling back down, "Z" fading

Style: Clean 2D cartoon/pixel-art, side-view perspective, peaceful sleeping expression, consistent character design across all frames. No background — transparent PNG only.
```

### die.png — 8 frames (1024×128)
```
Create a 2D sprite sheet as a single horizontal strip PNG image with transparent background.
The strip contains exactly 8 frames, each 128x128 pixels, for a total image size of 1024x128 pixels.

Character: {{CHARACTER_NAME}} — {{CHARACTER_DESCRIPTION}}

Animation: DRAMATIC DEATH — one-shot death sequence, freezes on last frame.
- Frame 1: Shocked expression, clutching chest
- Frame 2: Staggering backward, eyes wide
- Frame 3: Knees buckling, reaching out
- Frame 4: Falling to knees
- Frame 5: Upper body tilting forward
- Frame 6: Collapsing to the ground
- Frame 7: Lying on ground, last twitch
- Frame 8: Completely still, X eyes or closed eyes (hold forever)

Style: Clean 2D cartoon/pixel-art, side-view perspective, dramatic but not gory, consistent character design across all frames. No background — transparent PNG only.
```

---

## Metadata JSON Template

After generating all sprite sheets for a character, create this JSON file as `{{character_id}}.json`:

```json
{
  "frameWidth": 128,
  "frameHeight": 128,
  "animations": {
    "idle":   { "frames": 4, "fps": 6,  "loop": true,  "oneShot": false },
    "walk":   { "frames": 8, "fps": 12, "loop": true,  "oneShot": false },
    "sit":    { "frames": 4, "fps": 8,  "loop": false, "oneShot": true,  "holdLastFrame": true },
    "eat":    { "frames": 6, "fps": 8,  "loop": true,  "oneShot": false },
    "drink":  { "frames": 6, "fps": 8,  "loop": true,  "oneShot": false },
    "sleep":  { "frames": 4, "fps": 4,  "loop": true,  "oneShot": false },
    "argue":  { "frames": 6, "fps": 10, "loop": true,  "oneShot": false },
    "happy":  { "frames": 6, "fps": 10, "loop": false, "oneShot": true,  "returnTo": "idle" },
    "sad":    { "frames": 4, "fps": 6,  "loop": true,  "oneShot": false },
    "die":    { "frames": 8, "fps": 10, "loop": false, "oneShot": true,  "holdLastFrame": true }
  }
}
```

---

## Character Descriptions for Prompts

Use these when replacing `{{CHARACTER_DESCRIPTION}}`:

### Maya
```
Young woman in her mid-20s with long dark hair in a ponytail, wearing a red crop top and high-waisted jeans. Athletic build, expressive brown eyes, confident posture. Has a small star tattoo on her wrist.
```

### Jake
```
Tall man in his late 20s with messy blonde hair, wearing a blue flannel shirt (unbuttoned over white tee) and dark jeans. Scruffy short beard, laid-back slouchy posture, green eyes.
```

### Sofia
```
Petite woman in her early 30s with short purple-dyed bob haircut, wearing a black turtleneck and yellow skirt. Round glasses, sharp features, always looks slightly skeptical.
```

---

## Batch Generation Workflow

To generate all assets for one character:
1. Run each of the 10 prompts above with the character's description
2. Save outputs as: `idle.png`, `walk.png`, `sit.png`, `eat.png`, `drink.png`, `argue.png`, `happy.png`, `sad.png`, `sleep.png`, `die.png`
3. Place in `/assets/characters/{{character_id}}/`
4. Copy the metadata JSON template as `{{character_id}}.json` into the same folder
5. Test in the simulation — the SpriteAnimator will pick them up automatically

## Tips for Better Results
- **Consistency**: Include "must match previous frames exactly" in follow-up prompts
- **Size accuracy**: Explicitly state pixel dimensions — GPT sometimes ignores them
- **Transparency**: Always specify "transparent PNG background" — models default to white
- **Re-rolls**: If a frame breaks the strip format, regenerate just that animation
- **Post-processing**: You may need to manually resize/crop outputs to exact dimensions
