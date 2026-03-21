// Love Island Villa room renderer — image-based backgrounds with PixiJS 8
import * as PIXI from 'https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.mjs';
import { ZONES } from './characters.js';

const roomCache = new Map();
let ambientTick = 0;
let ambientObjects = [];

const ROOM_DISPLAY_NAMES = {
  Kitchen: 'The Kitchen',
  'Living Room': 'The Fire Pit',
  Bedroom: 'The Bedroom',
  Bathroom: 'The Day Beds',
};

const ACCENT = {
  Kitchen: 0xFF6B6B,
  'Living Room': 0xFF8C00,
  Bedroom: 0xFF1493,
  Bathroom: 0x00CED1,
};

// Map room names to generated background image paths
const ROOM_IMAGES = {
  Kitchen: '/assets/rooms/kitchen-bg.png',
  'Living Room': '/assets/rooms/fire-pit-bg.png',
  Bedroom: '/assets/rooms/bedroom-bg.png',
  Bathroom: '/assets/rooms/day-beds-bg.png',
};

export async function drawAllRooms(stage) {
  ambientObjects = [];

  // Load all room textures in parallel
  const texturePromises = {};
  for (const [name, imgPath] of Object.entries(ROOM_IMAGES)) {
    texturePromises[name] = PIXI.Assets.load(imgPath).catch(err => {
      console.warn(`Failed to load room image for ${name}: ${err.message}`);
      return null;
    });
  }

  for (const [name, zone] of Object.entries(ZONES)) {
    const texture = await texturePromises[name];
    const container = drawRoom(name, zone, texture);
    stage.addChild(container);
    roomCache.set(name, container);
  }
}

export function updateAmbient(delta) {
  ambientTick += delta;
  for (const obj of ambientObjects) {
    switch (obj.type) {
      case 'flame': {
        const t = ambientTick * 0.08 + obj.seed;
        obj.graphic.alpha = 0.5 + Math.sin(t) * 0.3;
        obj.graphic.y = obj.baseY + Math.sin(t * 1.7) * 3;
        obj.graphic.scale.set(0.9 + Math.sin(t * 2.3) * 0.15);
        break;
      }
      case 'torchFlame': {
        const t = ambientTick * 0.1 + obj.seed;
        obj.graphic.alpha = 0.6 + Math.sin(t) * 0.25;
        obj.graphic.y = obj.baseY + Math.sin(t * 2) * 2;
        obj.graphic.scale.x = 0.85 + Math.sin(t * 3) * 0.15;
        break;
      }
      case 'fairyLight': {
        const t = ambientTick * 0.03 + obj.seed;
        obj.graphic.alpha = 0.4 + Math.sin(t) * 0.4;
        break;
      }
      case 'neonGlow': {
        const t = ambientTick * 0.025;
        const pulse = 0.6 + Math.sin(t) * 0.3;
        obj.graphic.alpha = pulse;
        break;
      }
      case 'neonText': {
        const t = ambientTick * 0.025;
        const pulse = 0.7 + Math.sin(t) * 0.3;
        obj.graphic.alpha = pulse;
        break;
      }
      case 'poolShimmer': {
        const t = ambientTick * 0.04 + obj.seed;
        const wave = Math.sin(t);
        obj.graphic.alpha = 0.15 + wave * 0.12;
        break;
      }
      case 'palmFrond': {
        const t = ambientTick * 0.015 + obj.seed;
        obj.graphic.rotation = obj.baseRot + Math.sin(t) * 0.04;
        break;
      }
      case 'pendantGlow': {
        const t = ambientTick * 0.02 + obj.seed;
        obj.graphic.alpha = 0.12 + Math.sin(t) * 0.06;
        break;
      }
      case 'starTwinkle': {
        const t = ambientTick * 0.05 + obj.seed;
        obj.graphic.alpha = 0.3 + Math.sin(t) * 0.5;
        break;
      }
    }
  }
}

function drawRoom(name, zone, texture) {
  const container = new PIXI.Container();
  const { x, y, w, h } = zone;

  if (texture) {
    // Use the generated image as the room background
    const sprite = new PIXI.Sprite(texture);
    sprite.x = x;
    sprite.y = y;
    sprite.width = w;
    sprite.height = h;
    container.addChild(sprite);

    // Subtle border
    const border = new PIXI.Graphics();
    border.roundRect(x, y, w, h, 4).stroke({ color: ACCENT[name], width: 2, alpha: 0.4 });
    container.addChild(border);
  } else {
    // Fallback: solid color if image failed to load
    const fallback = new PIXI.Graphics();
    fallback.rect(x, y, w, h).fill({ color: zone.color || 0x1a1a2e });
    fallback.roundRect(x, y, w, h, 4).stroke({ color: ACCENT[name], width: 2, alpha: 0.5 });
    container.addChild(fallback);
  }

  // Room label overlay (camera-style)
  const accent = ACCENT[name];
  const displayName = ROOM_DISPLAY_NAMES[name] || name;

  const labelGlow = new PIXI.Text({
    text: displayName,
    style: {
      fontSize: 22,
      fontWeight: '700',
      fontFamily: 'Arial, sans-serif',
      fill: accent,
      dropShadow: {
        color: accent,
        blur: 12,
        distance: 0,
        alpha: 0.8,
      },
    },
  });
  labelGlow.anchor.set(0, 0);
  labelGlow.x = x + 18;
  labelGlow.y = y + 10;
  labelGlow.alpha = 0.85;
  container.addChild(labelGlow);

  return container;
}
