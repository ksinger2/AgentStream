// Generate room background assets using OpenAI gpt-image-1
// Usage: node scripts/generate-rooms.js

require('dotenv').config();
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'rooms');

// Shared style block for all room backgrounds
const SHARED_STYLE = `
STYLE REQUIREMENTS:
- Front-facing perspective view, as if a security camera is mounted on the front wall looking INTO the room
- 2D game background art — NOT photorealistic, NOT 3D render
- Retro pixel-art inspired with clean edges, but detailed enough to read as a real room
- Warm, saturated, tropical color palette — Love Island villa aesthetic
- Night-time ambient lighting with warm glows, fairy lights, candles, and neon accents
- The room should feel lived-in, luxurious, and romantic
- NO people, NO characters, NO silhouettes of humans — environment only
- The bottom 40% of the image is FLOOR (where game characters will walk), keep it relatively clear of large objects
- The top 60% is the BACK WALL with furniture, decorations, and details
- Slight perspective: floor tiles/planks converge toward a vanishing point at center-top
- Output as a clean, game-ready background with no UI overlays
- Aspect ratio: wide landscape (roughly 2:1)
- Transparent or solid dark edges are fine — will be composited in-game
`;

const ROOMS = [
  {
    name: 'kitchen',
    filename: 'kitchen-bg.png',
    prompt: `Create a 2D game background of a luxury villa KITCHEN interior, front-facing view.

${SHARED_STYLE}

KITCHEN SPECIFIC:
- Back wall: warm terracotta/cream colored walls with Mediterranean tile backsplash in decorative patterns
- Large open wooden shelving on the back wall displaying colorful plates, bowls, and cocktail glasses
- A sleek espresso machine and wine rack on the counter against the back wall
- A large kitchen island in the center with a white marble countertop and dark wood base
- 4 wooden bar stools in front of the island
- A tropical fruit bowl (mangoes, pineapple, passion fruit) on the island counter
- 3 hanging copper pendant lights from the ceiling casting warm pools of light
- Terracotta checkerboard floor tiles with warm tones
- Accent color: coral red / warm pink for small details (dish towels, a neon "cocktails" sign on the wall)
- Potted herbs on the windowsill, a blender, colorful mugs
- Feel: warm, social, the hub where morning gossip happens over coffee
`,
  },
  {
    name: 'fire-pit',
    filename: 'fire-pit-bg.png',
    prompt: `Create a 2D game background of an OUTDOOR FIRE PIT area at night, front-facing view.

${SHARED_STYLE}

FIRE PIT SPECIFIC:
- This is OUTDOORS — no ceiling, no walls. The "back wall" is a beautiful STARRY NIGHT SKY with a gradient from deep indigo at top to warm dark purple at horizon
- Scattered bright stars and a crescent moon
- String fairy lights draped across the top of the image in gentle curves, warm golden glow
- A central circular stone fire pit with visible orange/red flames and glowing embers
- Curved stone bench seating arranged in a semicircle around the fire pit, with cream/tan cushions
- 2 tall bamboo tiki torches on either side with flickering orange flames
- Sandy stone ground with warm tones, some scattered pebbles
- Tropical plants and palm leaf silhouettes at the edges
- Maybe a distant villa building silhouette in the far background
- Accent color: warm orange / fire gold
- Feel: dramatic, romantic, this is where recouplings and confrontations happen. Iconic Love Island location.
`,
  },
  {
    name: 'bedroom',
    filename: 'bedroom-bg.png',
    prompt: `Create a 2D game background of a luxury villa BEDROOM interior at night, front-facing view.

${SHARED_STYLE}

BEDROOM SPECIFIC:
- Back wall: deep plum/purple textured wall
- A glowing NEON "LOVE" sign on the center of the back wall in hot pink neon with white inner core and pink glow halo — this is the room's signature feature
- 3 double beds arranged side by side across the room, headboards against the back wall
- Each bed has a different colored luxury throw blanket: royal blue, hot pink, and lavender
- White fluffy pillows on each bed
- Dark wooden bed frames with upholstered headboards
- Small nightstands between each bed with small table lamps casting soft warm glow
- Fairy string lights draped across the ceiling in two rows, pink and warm white bulbs
- Soft plush carpet floor in dark purple/charcoal
- Maybe a full-length mirror on one side wall, some scattered shoes/slippers on floor
- Accent color: hot pink / magenta neon
- Feel: intimate, dramatic, where pillow talk and secret whispered conversations happen at night
`,
  },
  {
    name: 'day-beds',
    filename: 'day-beds-bg.png',
    prompt: `Create a 2D game background of an OUTDOOR POOLSIDE DAY BEDS area, front-facing view.

${SHARED_STYLE}

DAY BEDS SPECIFIC:
- This is OUTDOORS — the "back wall" is a tropical SUNSET/DUSK SKY gradient from warm orange at horizon to deep teal/purple at top
- Silhouettes of palm trees against the sky on both sides
- One prominent palm tree on the right side with detailed fronds
- A turquoise/teal swimming pool taking up the right portion, with visible water shimmer and gentle ripples
- Stone/tile pool edge coping in cream color
- 3 luxurious canopy day beds on the left side with white curtain drapes, white cushions, and wooden frames
- Each day bed has flowing sheer curtains gently hanging from the canopy frame
- Warm wooden deck planking as the floor, with visible plank lines for perspective
- Scattered lanterns and candles on the deck providing warm ambient glow
- Some tropical plants and flowers at the edges
- Accent color: teal / turquoise (from the pool)
- Feel: chill, romantic, tropical paradise. Where secret conversations happen on the day beds away from the group.
`,
  },
];

async function generateRoom(room) {
  console.log(`\n🎨 Generating: ${room.name}...`);
  const startTime = Date.now();

  try {
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: room.prompt,
      n: 1,
      size: '1536x1024',
      quality: 'high',
    });

    const imageData = response.data[0];

    if (imageData.b64_json) {
      const buffer = Buffer.from(imageData.b64_json, 'base64');
      const outputPath = path.join(OUTPUT_DIR, room.filename);
      fs.writeFileSync(outputPath, buffer);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ ${room.name} saved to ${outputPath} (${elapsed}s, ${(buffer.length / 1024).toFixed(0)}KB)`);
      return true;
    } else if (imageData.url) {
      // Download from URL
      const imgResponse = await fetch(imageData.url);
      const arrayBuffer = await imgResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const outputPath = path.join(OUTPUT_DIR, room.filename);
      fs.writeFileSync(outputPath, buffer);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ ${room.name} saved to ${outputPath} (${elapsed}s, ${(buffer.length / 1024).toFixed(0)}KB)`);
      return true;
    }

    console.error(`❌ ${room.name}: No image data in response`);
    return false;
  } catch (err) {
    console.error(`❌ ${room.name} failed: ${err.message}`);
    if (err.error) console.error(JSON.stringify(err.error, null, 2));
    return false;
  }
}

async function main() {
  console.log('🏝️  Love Island: AI Villa — Room Background Generator');
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Generating ${ROOMS.length} rooms...\n`);

  // Generate sequentially to avoid rate limits
  let success = 0;
  for (const room of ROOMS) {
    const ok = await generateRoom(room);
    if (ok) success++;
  }

  console.log(`\n🏁 Done: ${success}/${ROOMS.length} rooms generated`);
  if (success > 0) {
    console.log('\nGenerated files:');
    const files = fs.readdirSync(OUTPUT_DIR);
    for (const f of files) {
      const stat = fs.statSync(path.join(OUTPUT_DIR, f));
      console.log(`  📁 /public/assets/rooms/${f} (${(stat.size / 1024).toFixed(0)}KB)`);
    }
  }
}

main().catch(console.error);
