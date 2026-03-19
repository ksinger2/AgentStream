// Generate static character sprites using OpenAI gpt-image-1
// Usage: node scripts/generate-characters.js

require('dotenv').config();
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'characters');

const SHARED_STYLE = `
STYLE:
- Clean cartoon illustration with smooth lines, cel-shading, and anti-aliased edges
- Full body visible, standing pose, facing the camera (front view)
- Character should be centered in the frame
- Transparent PNG background — NO background scenery, NO shadows on ground
- High detail, smooth gradients, clean outlines, looks good when scaled down
- Love Island / dating show contestant aesthetic — stylish summer outfits, attractive, expressive
- Warm, saturated color palette
- Clear readable silhouette at small game scale
- Slight idle pose — relaxed, confident, personality showing through body language
- 1024x1024 output
`;

const CHARACTERS = [
  {
    id: 'jade',
    name: 'Jade',
    prompt: `${SHARED_STYLE}

CHARACTER: Jade — The Bombshell
- Young woman in her mid-20s, tan skin, long straight black hair past her shoulders
- Wearing a hot pink crop top and white high-waisted shorts — stylish summer look
- Gold hoop earrings, confident pose with one hand on hip
- Bright confident smile
- Athletic build
- Expressive dark brown eyes
`,
  },
  {
    id: 'marcus',
    name: 'Marcus',
    prompt: `${SHARED_STYLE}

CHARACTER: Marcus — The Hopeless Romantic
- Young man in his late 20s, dark brown/black skin, short cropped black hair with a clean fade
- Wearing a fitted sky blue linen shirt (top buttons open) and navy swim shorts
- No accessories, warm genuine smile
- Relaxed stance, hands slightly open — approachable body language
- Athletic build, broad shoulders
- Kind expressive dark brown eyes
`,
  },
  {
    id: 'priya',
    name: 'Priya',
    prompt: `${SHARED_STYLE}

CHARACTER: Priya — The Game Player
- Young woman in her mid-20s, medium/olive brown skin, long dark brown hair worn sleek and straight
- Wearing a deep purple wrap dress — chic and calculated, not overly revealing
- Subtle knowing smile, one eyebrow slightly raised — scheming expression
- Arms crossed or one hand touching chin — thinking pose
- Slim elegant build
- Sharp dark brown eyes that look like they're analyzing you
`,
  },
  {
    id: 'tyler',
    name: 'Tyler',
    prompt: `${SHARED_STYLE}

CHARACTER: Tyler — The Drama Magnet
- Young man in his mid-20s, medium-dark brown skin, short curly black hair
- Wearing a bold red tank top and black shorts — loud and proud
- Stylish round glasses, animated expression — mouth slightly open like he's about to say something
- Confident wide stance, one hand gesturing
- Muscular stocky build, barber-fresh grooming
- Expressive eyes behind glasses, mischievous energy
`,
  },
  {
    id: 'sienna',
    name: 'Sienna',
    prompt: `${SHARED_STYLE}

CHARACTER: Sienna — The Free Spirit
- Young woman in her late 20s, light/fair skin with freckles, auburn/copper hair in a messy bun
- Wearing a flowing golden yellow sundress — bohemian beach vibes
- No accessories, serene peaceful smile
- Relaxed stance, hands gently at sides — zen energy
- Slim yoga-toned build
- Warm hazel/green eyes, natural makeup look
`,
  },
  {
    id: 'devon',
    name: 'Devon',
    prompt: `${SHARED_STYLE}

CHARACTER: Devon — The Entertainer
- Young man in his mid-20s, medium-dark brown skin, bold gold/blonde mohawk hairstyle
- Wearing a bright green tropical print open shirt showing chest, and white shorts
- Big charismatic grin, arms slightly spread — party energy pose
- Athletic lean build, lots of swagger
- Bright energetic dark eyes, perfectly groomed facial hair
- Gold chain necklace
`,
  },
  {
    id: 'aaliyah',
    name: 'Aaliyah',
    prompt: `${SHARED_STYLE}

CHARACTER: Aaliyah — The Intimidator
- Young woman in her late 20s, deep dark brown/black skin, voluminous curly natural black hair
- Wearing a sleek magenta/deep pink fitted dress — powerful and elegant
- Small gold stud earrings, composed confident expression
- Standing tall with perfect posture, arms at sides — commanding presence
- Tall graceful build
- Intense intelligent dark brown eyes, slight closed-lip smile
`,
  },
  {
    id: 'kai',
    name: 'Kai',
    prompt: `${SHARED_STYLE}

CHARACTER: Kai — The Cheeky One
- Young man in his mid-20s, medium/olive tan skin, short spiky dark brown hair
- Wearing a teal/turquoise tank top and board shorts — surfer vibes
- Cheeky lopsided grin, one eye slightly winking
- Casual relaxed stance, one thumb hooked in pocket
- Lean athletic surfer build, sun-kissed skin
- Bright playful brown eyes
`,
  },
  {
    id: 'valentina',
    name: 'Valentina',
    prompt: `${SHARED_STYLE}

CHARACTER: Valentina — The Passionate One
- Young woman in her mid-20s, warm tan/Mediterranean skin, long wavy chestnut brown hair
- Wearing a coral red off-shoulder crop top and flowing white skirt — Italian glamour
- Dramatic expressive pose — one hand near face or gesturing
- Passionate intense expression, full lips, bold eyebrows
- Curvy feminine build
- Fiery dark brown eyes with dramatic eyeliner
`,
  },
  {
    id: 'zane',
    name: 'Zane',
    prompt: `${SHARED_STYLE}

CHARACTER: Zane — The Loyal One
- Young man in his late 20s, light/fair skin, short neat brown hair with a slight wave
- Wearing a fitted dark navy polo shirt and grey shorts — clean-cut firefighter look
- Serious but warm expression, slight protective stance
- Strong arms crossed or hands clasped in front
- Tall muscular athletic build — looks like he works out daily
- Intense blue-green eyes, strong jawline, light stubble
`,
  },
  {
    id: 'nkechi',
    name: 'Nkechi',
    prompt: `${SHARED_STYLE}

CHARACTER: Nkechi — The Queen Bee
- Young woman in her mid-20s, deep dark brown/black skin, hair in a sleek high bun
- Wearing a bright orange/amber bodycon dress — fashion blogger chic, statement outfit
- Sassy confident expression, slight head tilt, one hand on hip
- Powerful stance — she owns every room she walks into
- Tall statuesque build
- Bold dark eyes with perfectly arched eyebrows, glossy lips
`,
  },
  {
    id: 'ravi',
    name: 'Ravi',
    prompt: `${SHARED_STYLE}

CHARACTER: Ravi — The Comedian
- Young man in his late 20s, medium/South Asian brown skin, short neat black hair
- Wearing a purple Hawaiian shirt (fun pattern) and khaki shorts — class clown energy
- Stylish rectangular glasses, big warm goofy grin
- Animated pose — hands slightly up like he just told a joke
- Average/slim build, approachable non-threatening
- Warm friendly dark brown eyes behind glasses, expressive eyebrows
`,
  },
];

async function generateCharacter(char) {
  console.log(`  🎨 Generating: ${char.name} (${char.id})...`);
  const startTime = Date.now();

  try {
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: char.prompt,
      n: 1,
      size: '1024x1024',
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

    if (buffer) {
      const outputPath = path.join(OUTPUT_DIR, `${char.id}.png`);
      fs.writeFileSync(outputPath, buffer);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  ✅ ${char.name} saved (${elapsed}s, ${(buffer.length / 1024).toFixed(0)}KB)`);
      return true;
    }

    console.error(`  ❌ ${char.name}: No image data`);
    return false;
  } catch (err) {
    console.error(`  ❌ ${char.name} failed: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🏝️  Love Island: AI Villa — Character Sprite Generator');
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Generating ${CHARACTERS.length} character sprites...\n`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let success = 0;
  for (const char of CHARACTERS) {
    const ok = await generateCharacter(char);
    if (ok) success++;
  }

  console.log(`\n🏁 Done: ${success}/${CHARACTERS.length} characters generated`);
  if (success > 0) {
    console.log('\nGenerated files:');
    const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png'));
    for (const f of files) {
      const stat = fs.statSync(path.join(OUTPUT_DIR, f));
      console.log(`  📁 /public/assets/characters/${f} (${(stat.size / 1024).toFixed(0)}KB)`);
    }
  }
}

main().catch(console.error);
