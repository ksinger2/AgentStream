---
name: neon-sign-prompts
description: Use when generating GPT/DALL-E image prompts for neon sign assets. Produces copy-paste-ready prompts for Love Island villa environment signs (room labels, decorative signs, UI elements) following retro 80s pixel-art neon style.
---

# Neon Sign Assets — GPT Image Generation Prompts

## How to Use
1. Replace `{{SIGN_TEXT}}` with the desired sign wording
2. Replace `{{SIGN_VARIANT}}` with the specific style notes (color, shape, motif)
3. Send the prompt to GPT image generation (gpt-image-1 or DALL-E)
4. Save as PNG in `/public/assets/signs/`
5. Load in PixiJS with `PIXI.Assets.load('/assets/signs/filename.png')`

## Base Style Spec (MUST be in every prompt)

```
Create a retro 80s pixel-art neon sign asset for a 2D game UI/environment.

STYLE:
- authentic 1980s arcade pixel art
- clean pixel edges, not painterly, not vector, not smooth 3D
- bright neon tubing effect with strong glow
- romantic tropical dating-show vibe
- use hot pink neon and/or light blue neon as primary colors
- white inner highlight/core inside the neon tubing to sell the lit sign effect
- glowing colored halo around the sign
- high contrast, saturated, playful, dreamy, flirty
- cohesive with a Love Island-inspired villa aesthetic

SIGN DESIGN RULES:
- script/cursive lettering when appropriate
- letters should feel like real neon tubes, continuous and believable
- some signs can include hearts, underline bars, rounded frames, or double-heart motifs
- keep silhouettes clean and readable at game scale
- wording should feel cute, romantic, dramatic, or villa-themed
- filled neon look, not thin outline only
- inner white core + pink or blue neon glow
- transparent background
- no wall, no room mockup, no photo background, no extra scenery unless requested
- asset should feel export-ready for a game

OUTPUT:
- isolated sign only
- centered composition
- transparent background
- crisp readable shape
- consistent pixel-art scale and finish
- no shadows outside the intended neon glow
```

---

## Room Sign Prompts

### kitchen-sign.png
```
{{BASE_STYLE_SPEC}}

SIGN TEXT: "The Kitchen"
VARIANT: Hot pink neon script lettering with a small fork-and-knife motif on the left. Underline bar beneath the text. Warm pink glow halo. Size: 320x96 pixels.
```

### fire-pit-sign.png
```
{{BASE_STYLE_SPEC}}

SIGN TEXT: "The Fire Pit"
VARIANT: Orange-red neon with flickering flame motif above the text. Bold block lettering, not cursive. Strong warm orange glow halo. Size: 320x96 pixels.
```

### bedroom-sign.png
```
{{BASE_STYLE_SPEC}}

SIGN TEXT: "The Bedroom"
VARIANT: Deep pink/magenta neon in flowing cursive script. Two small heart motifs flanking the text. Romantic pink glow halo. Size: 320x96 pixels.
```

### day-beds-sign.png
```
{{BASE_STYLE_SPEC}}

SIGN TEXT: "The Day Beds"
VARIANT: Light blue/cyan neon in relaxed script. Small palm tree silhouette motif on the right. Cool blue glow halo. Size: 320x96 pixels.
```

---

## Decorative Signs

### love-neon.png
```
{{BASE_STYLE_SPEC}}

SIGN TEXT: "LOVE"
VARIANT: Large bold neon letters, hot pink with white inner core. Each letter should look like a thick neon tube. Strong pink glow halo. This is a wall-mounted decorative sign for the bedroom. Size: 256x128 pixels.
```

### villa-life-sign.png
```
{{BASE_STYLE_SPEC}}

SIGN TEXT: "Villa Life"
VARIANT: Dual-color — "Villa" in light blue neon, "Life" in hot pink neon. Cursive script. Small palm tree between the words. Size: 320x128 pixels.
```

### coupled-up-sign.png
```
{{BASE_STYLE_SPEC}}

SIGN TEXT: "Coupled Up"
VARIANT: Hot pink neon cursive with double-heart motif. Underline swoosh. Romantic and celebratory. Used for ceremony announcements. Size: 384x128 pixels.
```

### dumped-sign.png
```
{{BASE_STYLE_SPEC}}

SIGN TEXT: "DUMPED"
VARIANT: Red neon block letters, slightly cracked/broken tube effect on the last letter. Dramatic red glow. Used for elimination announcements. Size: 320x96 pixels.
```

### bombshell-sign.png
```
{{BASE_STYLE_SPEC}}

SIGN TEXT: "BOMBSHELL"
VARIANT: Gold/yellow neon with explosion/starburst motif. Bold uppercase block letters. Each letter outlined in hot pink, filled with gold glow. Size: 384x128 pixels.
```

### beach-hut-sign.png
```
{{BASE_STYLE_SPEC}}

SIGN TEXT: "Beach Hut"
VARIANT: Light blue neon cursive with a small surfboard or palm motif. Relaxed, tropical feel. Gentle cyan glow. Used for confessional panel header. Size: 256x96 pixels.
```

### recoupling-sign.png
```
{{BASE_STYLE_SPEC}}

SIGN TEXT: "Recoupling"
VARIANT: Hot pink and gold dual-color neon. Elegant cursive script. Rose motif beneath. Dramatic and ceremonial. Size: 384x128 pixels.
```

---

## Camera Overlay Signs

### cam-label.png (template for all 4 cameras)
```
{{BASE_STYLE_SPEC}}

SIGN TEXT: "CAM 1"
VARIANT: Small monospace/blocky neon text in light green (security camera green). Minimal glow. Looks like a real CCTV overlay label. No hearts or romantic motifs — this is functional UI. Size: 128x32 pixels.
```

### rec-indicator.png
```
{{BASE_STYLE_SPEC}}

SIGN TEXT: "REC"
VARIANT: Small red neon dot followed by "REC" in red monospace neon. Pulsing red glow effect around the dot. Security camera style. Size: 96x32 pixels.
```

---

## UI Header Signs

### villa-chat-sign.png
```
{{BASE_STYLE_SPEC}}

SIGN TEXT: "Villa Chat"
VARIANT: Hot pink neon cursive, compact size for sidebar header. Small speech bubble motif. Size: 256x64 pixels.
```

### live-indicator-sign.png
```
{{BASE_STYLE_SPEC}}

SIGN TEXT: "LIVE"
VARIANT: Bright red neon block letters with pulsing red glow. Broadcasting/streaming indicator style. Heart motif replacing the dot on the I. Size: 128x48 pixels.
```

---

## Custom Sign Template

For generating additional signs not listed above:

```
Create a retro 80s pixel-art neon sign asset for a 2D game UI/environment.

STYLE:
- authentic 1980s arcade pixel art
- clean pixel edges, not painterly, not vector, not smooth 3D
- bright neon tubing effect with strong glow
- romantic tropical dating-show vibe
- use hot pink neon and/or light blue neon as primary colors
- white inner highlight/core inside the neon tubing to sell the lit sign effect
- glowing colored halo around the sign
- high contrast, saturated, playful, dreamy, flirty
- cohesive with a Love Island-inspired villa aesthetic

SIGN DESIGN RULES:
- script/cursive lettering when appropriate
- letters should feel like real neon tubes, continuous and believable
- some signs can include hearts, underline bars, rounded frames, or double-heart motifs
- keep silhouettes clean and readable at game scale
- wording should feel cute, romantic, dramatic, or villa-themed
- filled neon look, not thin outline only
- inner white core + pink or blue neon glow
- transparent background
- no wall, no room mockup, no photo background, no extra scenery unless requested
- asset should feel export-ready for a game

OUTPUT:
- isolated sign only
- centered composition
- transparent background
- crisp readable shape
- consistent pixel-art scale and finish
- no shadows outside the intended neon glow

SIGN TEXT: "{{SIGN_TEXT}}"
VARIANT: {{SIGN_VARIANT}}
SIZE: {{WIDTH}}x{{HEIGHT}} pixels.
```

---

## Asset Integration

After generating signs, load them in the game:

```js
// In room-renderer.js or camera.js
const signTexture = await PIXI.Assets.load('/assets/signs/love-neon.png');
const sign = new PIXI.Sprite(signTexture);
sign.anchor.set(0.5);
sign.x = zone.x + zone.w / 2;
sign.y = zone.y + 50;
container.addChild(sign);
```

For animated glow effect, pulse the alpha:
```js
// In updateAmbient()
sign.alpha = 0.7 + Math.sin(tick * 0.03) * 0.3;
```

## Batch Generation Workflow
1. Generate all room signs (4 signs)
2. Generate decorative signs (7 signs)
3. Generate camera overlay signs (2 signs)
4. Generate UI header signs (2 signs)
5. Save all to `/public/assets/signs/`
6. Update `room-renderer.js` to load and display room signs
7. Update `camera.js` to use camera overlay sign assets
8. Update `index.html` sidebar to use UI header sign assets

## Tips for Better Results
- **Consistency**: Generate all signs in one session for consistent pixel scale
- **Size**: Always specify exact pixel dimensions — DALL-E needs explicit sizes
- **Transparency**: Re-emphasize "transparent PNG" — models often add white backgrounds
- **Post-processing**: Trim whitespace and verify transparency with an image editor
- **Glow radius**: If glow bleeds too far, add "tight glow, not spread out" to the prompt
