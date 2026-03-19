// Generate sprite sheet strips for character animations using OpenAI gpt-image-1
// Usage: node scripts/generate-spritesheet.js <characterId> <animationName>
// Example: node scripts/generate-spritesheet.js jade idle

require('dotenv').config();
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Character descriptions for prompt injection (matches generate-characters.js pool)
const CHARACTER_DESCRIPTIONS = {
  jade: 'Young woman in her mid-20s, tan skin, long straight black hair past her shoulders. Wearing a hot pink crop top and white high-waisted shorts. Gold hoop earrings, confident pose. Athletic build, bright confident smile.',
  marcus: 'Young man in his late 20s, dark brown/black skin, short cropped black hair with a clean fade. Wearing a fitted sky blue linen shirt and navy swim shorts. Athletic build, broad shoulders, warm genuine smile.',
  priya: 'Young woman in her mid-20s, medium/olive brown skin, long dark brown hair worn sleek and straight. Wearing a deep purple wrap dress. Slim elegant build, sharp dark brown eyes, subtle knowing smile.',
  tyler: 'Young man in his mid-20s, medium-dark brown skin, short curly black hair. Wearing a bold red tank top and black shorts. Stylish round glasses, muscular stocky build, animated expression.',
  sienna: 'Young woman in her late 20s, light/fair skin with freckles, auburn/copper hair in a messy bun. Wearing a flowing golden yellow sundress. Slim yoga-toned build, warm hazel/green eyes.',
  devon: 'Young man in his mid-20s, medium-dark brown skin, bold gold/blonde mohawk. Wearing a bright green tropical print open shirt and white shorts. Athletic lean build, gold chain necklace.',
  aaliyah: 'Young woman in her late 20s, deep dark brown/black skin, voluminous curly natural black hair. Wearing a sleek magenta/deep pink fitted dress. Small gold stud earrings, tall graceful build.',
  kai: 'Young man in his mid-20s, medium/olive tan skin, short spiky dark brown hair. Wearing a teal/turquoise tank top and board shorts. Lean athletic surfer build, cheeky lopsided grin.',
  valentina: 'Young woman in her mid-20s, warm tan/Mediterranean skin, long wavy chestnut brown hair. Wearing a coral red off-shoulder crop top and flowing white skirt. Curvy feminine build.',
  zane: 'Young man in his late 20s, light/fair skin, short neat brown hair. Wearing a fitted dark navy polo shirt and grey shorts. Tall muscular athletic build, intense blue-green eyes.',
  nkechi: 'Young woman in her mid-20s, deep dark brown/black skin, hair in a sleek high bun. Wearing a bright orange/amber bodycon dress. Tall statuesque build, bold dark eyes.',
  ravi: 'Young man in his late 20s, medium/South Asian brown skin, short neat black hair. Wearing a purple Hawaiian shirt and khaki shorts. Stylish rectangular glasses, average/slim build.',
};

// Animation definitions (matches sprite-sheet-prompts.md but updated for cartoon style)
const ANIMATION_DEFS = {
  idle: {
    frames: 4,
    fps: 6,
    loop: true,
    oneShot: false,
    frameDescriptions: [
      'Standing neutral pose',
      'Slight chest rise (breathing in)',
      'Standing neutral pose',
      'Slight settle (breathing out)',
    ],
    description: 'IDLE — subtle breathing/standing animation',
  },
  walk: {
    frames: 8,
    fps: 12,
    loop: true,
    oneShot: false,
    frameDescriptions: [
      'Right foot forward (contact)',
      'Right foot passing',
      'Right foot forward (passing center)',
      'Right foot push-off',
      'Left foot forward (contact)',
      'Left foot passing',
      'Left foot forward (passing center)',
      'Left foot push-off',
    ],
    description: 'WALK CYCLE — smooth side-view walking loop',
  },
  sit: {
    frames: 4,
    fps: 8,
    loop: false,
    oneShot: true,
    holdLastFrame: true,
    frameDescriptions: [
      'Standing, beginning to bend knees',
      'Half-way down, knees bent',
      'Almost seated, lowering into chair',
      'Fully seated, relaxed pose (hold frame)',
    ],
    description: 'SIT DOWN — transition from standing to seated',
  },
  argue: {
    frames: 6,
    fps: 10,
    loop: true,
    oneShot: false,
    frameDescriptions: [
      'Standing tense, fists slightly clenched',
      'Leaning forward, mouth open, one arm gesturing',
      'Both arms up in frustration',
      'Pointing finger forward aggressively',
      'Arms crossed, scowling',
      'Throwing hands up in exasperation',
    ],
    description: 'ARGUING — heated animated argument gestures',
  },
  happy: {
    frames: 6,
    fps: 10,
    loop: false,
    oneShot: true,
    returnTo: 'idle',
    frameDescriptions: [
      'Surprise expression, eyes wide',
      'Big smile forming, arms starting to raise',
      'Arms up in the air, jumping slightly',
      'Peak of jump, huge grin, arms spread',
      'Landing, still smiling, arms coming down',
      'Settled, warm smile, relaxed happy pose',
    ],
    description: 'HAPPY CELEBRATION — one-shot joy reaction',
  },
  sad: {
    frames: 4,
    fps: 6,
    loop: true,
    oneShot: false,
    frameDescriptions: [
      'Shoulders slumped, looking down',
      'Slight sigh, chest deflating',
      'Hand wiping eye / touching face',
      'Shoulders slumped again, head slightly lower',
    ],
    description: 'SAD — dejected looping animation',
  },
};

function buildPrompt(charId, animName) {
  const charDesc = CHARACTER_DESCRIPTIONS[charId];
  if (!charDesc) throw new Error(`Unknown character: ${charId}`);

  const anim = ANIMATION_DEFS[animName];
  if (!anim) throw new Error(`Unknown animation: ${animName}. Available: ${Object.keys(ANIMATION_DEFS).join(', ')}`);

  const totalWidth = anim.frames * 128;
  const frameList = anim.frameDescriptions
    .map((desc, i) => `- Frame ${i + 1}: ${desc}`)
    .join('\n');

  return `Create a 2D sprite sheet as a single horizontal strip PNG image with transparent background.
The strip contains exactly ${anim.frames} frames, each 128x128 pixels, for a total image size of ${totalWidth}x128 pixels.

Character: ${charId.charAt(0).toUpperCase() + charId.slice(1)} — ${charDesc}

Animation: ${anim.description}.
${frameList}

Style: Clean cartoon illustration with smooth lines, cel-shading, and anti-aliased edges. Side-view perspective. High detail, smooth gradients, clean outlines. Consistent character design across all frames. Love Island summer aesthetic. No background — transparent PNG only.`;
}

async function generateSpriteSheet(charId, animName) {
  const anim = ANIMATION_DEFS[animName];
  const totalWidth = anim.frames * 128;
  const prompt = buildPrompt(charId, animName);

  console.log(`  Generating: ${charId}/${animName} (${anim.frames} frames, ${totalWidth}x128)...`);
  const startTime = Date.now();

  const response = await openai.images.generate({
    model: 'gpt-image-1',
    prompt,
    n: 1,
    size: '1024x1024', // gpt-image-1 generates square, we'll validate/resize
    quality: 'high',
    background: 'transparent',
  });

  const imageData = response.data[0];
  let buffer;

  if (imageData.b64_json) {
    buffer = Buffer.from(imageData.b64_json, 'base64');
  } else if (imageData.url) {
    const imgResponse = await fetch(imageData.url);
    buffer = Buffer.from(await imgResponse.arrayBuffer());
  }

  if (!buffer) throw new Error('No image data returned');

  // Save the raw output
  const charDir = path.join(__dirname, '..', 'public', 'assets', 'characters', charId);
  fs.mkdirSync(charDir, { recursive: true });

  const outputPath = path.join(charDir, `${animName}.png`);
  fs.writeFileSync(outputPath, buffer);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  Saved ${outputPath} (${elapsed}s, ${(buffer.length / 1024).toFixed(0)}KB)`);

  // Validate dimensions using sharp if available
  try {
    const sharp = require('sharp');
    const meta = await sharp(buffer).metadata();
    console.log(`  Dimensions: ${meta.width}x${meta.height}`);

    if (meta.width !== totalWidth || meta.height !== 128) {
      console.log(`  Resizing from ${meta.width}x${meta.height} to ${totalWidth}x128...`);
      const resized = await sharp(buffer)
        .resize(totalWidth, 128, { fit: 'fill' })
        .png()
        .toBuffer();
      fs.writeFileSync(outputPath, resized);
      console.log(`  Resized and saved (${(resized.length / 1024).toFixed(0)}KB)`);
    } else {
      console.log(`  Dimensions OK`);
    }
  } catch {
    console.log('  (sharp not installed — skipping dimension validation. Run: npm install sharp)');
  }

  return outputPath;
}

function writeMetadata(charId) {
  const charDir = path.join(__dirname, '..', 'public', 'assets', 'characters', charId);
  const metaPath = path.join(charDir, `${charId}.json`);

  // Build metadata from available animation files
  const metadata = {
    frameWidth: 128,
    frameHeight: 128,
    animations: {},
  };

  for (const [name, anim] of Object.entries(ANIMATION_DEFS)) {
    const sheetPath = path.join(charDir, `${name}.png`);
    if (fs.existsSync(sheetPath)) {
      metadata.animations[name] = {
        frames: anim.frames,
        fps: anim.fps,
        loop: anim.loop,
        oneShot: anim.oneShot,
      };
      if (anim.holdLastFrame) metadata.animations[name].holdLastFrame = true;
      if (anim.returnTo) metadata.animations[name].returnTo = anim.returnTo;
    }
  }

  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
  console.log(`  Metadata written to ${metaPath}`);
  return metaPath;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node scripts/generate-spritesheet.js <characterId> <animationName>');
    console.log('       node scripts/generate-spritesheet.js <characterId> all');
    console.log('');
    console.log('Characters:', Object.keys(CHARACTER_DESCRIPTIONS).join(', '));
    console.log('Animations:', Object.keys(ANIMATION_DEFS).join(', '));
    process.exit(1);
  }

  const charId = args[0].toLowerCase();
  const animName = args[1].toLowerCase();

  if (!CHARACTER_DESCRIPTIONS[charId]) {
    console.error(`Unknown character: ${charId}`);
    process.exit(1);
  }

  console.log(`Sprite Sheet Generator — ${charId}`);

  if (animName === 'all') {
    for (const name of Object.keys(ANIMATION_DEFS)) {
      try {
        await generateSpriteSheet(charId, name);
      } catch (err) {
        console.error(`  Failed ${name}: ${err.message}`);
      }
    }
  } else {
    if (!ANIMATION_DEFS[animName]) {
      console.error(`Unknown animation: ${animName}. Available: ${Object.keys(ANIMATION_DEFS).join(', ')}`);
      process.exit(1);
    }
    await generateSpriteSheet(charId, animName);
  }

  writeMetadata(charId);
  console.log('\nDone!');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
