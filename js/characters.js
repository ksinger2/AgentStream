import * as PIXI from 'https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.mjs';
import { eventBus, getRelationship, getActiveWorldObjects, getPartner, getCouples } from './events.js';

const MIN_CHAR_DISTANCE = 80; // Minimum pixels between character pivots
const ZONE_GAP = 16;
const CANVAS_W = 1920;
const TOP_INSET = 72;
const BOTTOM_INSET = 1040;
const USABLE_H = BOTTOM_INSET - TOP_INSET;
const HALF_W = CANVAS_W / 2;
const HALF_H = USABLE_H / 2;

export const ZONES = {
  Kitchen: {
    x: 0, y: TOP_INSET,
    w: HALF_W - ZONE_GAP / 2, h: HALF_H - ZONE_GAP / 2,
    color: 0xD4A017, label: 'Kitchen',
  },
  'Living Room': {
    x: HALF_W + ZONE_GAP / 2, y: TOP_INSET,
    w: HALF_W - ZONE_GAP / 2, h: HALF_H - ZONE_GAP / 2,
    color: 0x4A6B8A, label: 'Living Room',
  },
  Bedroom: {
    x: 0, y: TOP_INSET + HALF_H + ZONE_GAP / 2,
    w: HALF_W - ZONE_GAP / 2, h: HALF_H - ZONE_GAP / 2,
    color: 0x6B4A8A, label: 'Bedroom',
  },
  Bathroom: {
    x: HALF_W + ZONE_GAP / 2, y: TOP_INSET + HALF_H + ZONE_GAP / 2,
    w: HALF_W - ZONE_GAP / 2, h: HALF_H - ZONE_GAP / 2,
    color: 0x4A8A7A, label: 'Bathroom',
  },
};

export function getZoneCenter(zoneName) {
  const z = ZONES[zoneName];
  if (!z) return { x: 960, y: 540 };
  // Characters walk on the floor area (bottom 40% of the room)
  const floorTop = z.y + z.h * 0.6;
  const floorBottom = z.y + z.h * 0.92;
  const floorCenterY = (floorTop + floorBottom) / 2;
  return { x: z.x + z.w / 2, y: floorCenterY };
}

// Find a position in a zone that doesn't overlap other characters
function _findNonOverlappingPos(zoneName, excludeName) {
  const center = getZoneCenter(zoneName);
  const z = ZONES[zoneName];
  if (!z) return center;

  // Lazy import of live characters list (may not exist yet during init)
  let others;
  try { others = characters; } catch (_) { others = []; }

  for (let attempt = 0; attempt < 20; attempt++) {
    const xOff = (Math.random() - 0.5) * (z.w * 0.7);
    const yOff = (Math.random() - 0.5) * (z.h * 0.25);
    const px = center.x + xOff;
    const py = center.y + yOff;

    let tooClose = false;
    for (const other of others) {
      if (other.name === excludeName) continue;
      if (other.currentZone !== zoneName) continue;
      const dx = px - (other.targetX ?? other.x);
      const dy = py - (other.targetY ?? other.y);
      if (Math.sqrt(dx * dx + dy * dy) < MIN_CHAR_DISTANCE) {
        tooClose = true;
        break;
      }
    }
    if (!tooClose) return { x: px, y: py };
  }
  // Fallback: offset from center based on how many are already in this zone
  const countInZone = others.filter(c => c.currentZone === zoneName && c.name !== excludeName).length;
  const angle = (countInZone * 1.2) % (Math.PI * 2);
  return {
    x: center.x + Math.cos(angle) * MIN_CHAR_DISTANCE * 1.5,
    y: center.y + Math.sin(angle) * MIN_CHAR_DISTANCE * 0.5,
  };
}

// Skin tone palette
const SKIN_TONES = {
  light: 0xFFDBAC,
  medium: 0xD4A574,
  tan: 0xC68642,
  brown: 0x8D5524,
  dark: 0x5C3317,
};

// Hair styles
const HAIR_STYLES = ['short', 'long', 'spiky', 'curly', 'bun', 'mohawk'];

// Default rich personalities — Love Island archetypes
const DEFAULT_PERSONALITIES = [
  {
    bio: 'Fitness model from Essex who came to find "the one" but can\'t help flirting with everyone. Biggest flirt in the villa.',
    traits: ['flirtatious', 'confident', 'jealous', 'charming'],
    likes: ['gym sessions', 'cocktails', 'being the center of attention'],
    dislikes: ['being mugged off', 'disloyalty', 'people who play games'],
    quirks: ['Flexes in every mirror', 'Says "100%" after everything'],
    secretGoal: 'Wants to be in the most powerful couple and win the show',
    archetype: 'The Bombshell',
  },
  {
    bio: 'Sweet nursery teacher who wears her heart on her sleeve. Falls fast and hard. Already planned the wedding in her head.',
    traits: ['romantic', 'emotional', 'loyal', 'sensitive'],
    likes: ['deep conversations', 'breakfast in bed', 'love songs'],
    dislikes: ['players', 'people who aren\'t genuine', 'being second choice'],
    quirks: ['Cries at everything', 'Writes love notes on napkins'],
    secretGoal: 'Find genuine love, even if it means getting her heart broken',
    archetype: 'The Hopeless Romantic',
  },
  {
    bio: 'Smooth-talking estate agent who always has a plan. Came on the show with a strategy and isn\'t afraid to step on toes.',
    traits: ['strategic', 'manipulative', 'witty', 'calculating'],
    likes: ['power moves', 'insider knowledge', 'pulling strings'],
    dislikes: ['being outsmarted', 'genuine people who see through him', 'losing control'],
    quirks: ['Whispers strategy to allies', 'Always has a backup plan'],
    secretGoal: 'Play every islander against each other and come out on top',
    archetype: 'The Game Player',
  },
];

export class Character {
  constructor({ name, color, personality, startZone, skinTone, hairStyle, hairColor, accessory, voiceId }) {
    this.name = name;
    this.color = color;
    this.personality = personality;
    this.voiceId = voiceId || null;
    this.mood = '😐';
    this.currentZone = startZone;
    this.recentActions = [];
    this.memory = [];  // { event, who, feeling, day }
    this.relationships = {};
    this.isMoving = false;

    // Visual customization
    this.skinTone = skinTone || 'medium';
    this.hairStyle = hairStyle || 'short';
    this.hairColor = hairColor || 0x222222;
    this.accessory = accessory || null;

    const pos = _findNonOverlappingPos(startZone, name);
    this.x = pos.x;
    this.y = pos.y;
    this.targetX = this.x;
    this.targetY = this.y;

    this.sprite = null;
    this._nameText = null;
    this._moodIndicator = null;
    this._bodyGraphics = null;
    this._animTick = Math.random() * 100;
    this._facingLeft = false;
  }

  createSprite() {
    const container = new PIXI.Container();

    // Use procedural character graphics (no external assets needed)
    this._drawProceduralBody(container);

    // Shadow under character
    const shadow = new PIXI.Graphics();
    shadow.ellipse(0, 4, 20, 6).fill({ color: 0x000000, alpha: 0.25 });
    container.addChild(shadow);

    // Mood indicator — small colored dot instead of emoji
    this._moodIndicator = new PIXI.Graphics();
    this._updateMoodIndicator();
    this._moodIndicator.y = -48;
    container.addChild(this._moodIndicator);

    // Name below
    this._nameText = new PIXI.Text({
      text: this.name,
      style: {
        fontSize: 13,
        fontWeight: 'bold',
        fill: 0xffffff,
        align: 'center',
        dropShadow: { color: 0x000000, blur: 4, distance: 2 },
      },
    });
    this._nameText.anchor.set(0.5, 0);
    this._nameText.y = 8;
    container.addChild(this._nameText);

    container.x = this.x;
    container.y = this.y;
    this.sprite = container;
    return container;
  }

  _drawProceduralBody(container) {
    const skinColor = SKIN_TONES[this.skinTone] || SKIN_TONES.medium;
    const g = new PIXI.Graphics();
    this._bodyGraphics = g;

    g.ellipse(0, 36, 18, 6).fill({ color: 0x000000, alpha: 0.3 });
    g.roundRect(-10, 18, 8, 20, 2).fill({ color: 0x333344 });
    g.roundRect(2, 18, 8, 20, 2).fill({ color: 0x333344 });
    g.roundRect(-12, 34, 12, 6, 2).fill({ color: 0x222222 });
    g.roundRect(0, 34, 12, 6, 2).fill({ color: 0x222222 });
    g.roundRect(-16, -8, 32, 28, 6).fill({ color: this.color });
    g.roundRect(-22, -4, 8, 22, 3).fill({ color: skinColor });
    g.roundRect(14, -4, 8, 22, 3).fill({ color: skinColor });
    g.rect(-4, -14, 8, 8).fill({ color: skinColor });
    g.circle(0, -24, 16).fill({ color: skinColor });
    g.circle(-5, -26, 2.5).fill({ color: 0xFFFFFF });
    g.circle(5, -26, 2.5).fill({ color: 0xFFFFFF });
    g.circle(-5, -26, 1.5).fill({ color: 0x222222 });
    g.circle(5, -26, 1.5).fill({ color: 0x222222 });
    g.moveTo(-4, -18).quadraticCurveTo(0, -15, 4, -18).stroke({ color: 0x333333, width: 1.5 });
    this._drawHair(g);

    if (this.accessory === 'glasses') {
      g.circle(-5, -26, 5).stroke({ color: 0x444444, width: 1.5 });
      g.circle(5, -26, 5).stroke({ color: 0x444444, width: 1.5 });
    } else if (this.accessory === 'hat') {
      g.roundRect(-18, -44, 36, 8, 2).fill({ color: 0x333333 });
      g.roundRect(-12, -52, 24, 10, 4).fill({ color: 0x333333 });
    } else if (this.accessory === 'earring') {
      g.circle(-16, -22, 2).fill({ color: 0xFFD700 });
    }

    container.addChild(g);
  }

  // Mood colors — map emoji moods to indicator colors
  _getMoodColor() {
    const m = this.mood;
    if ('😍🥰❤️💕😘'.includes(m)) return 0xFF1493; // love — pink
    if ('😊😄😁😃🤗'.includes(m)) return 0x2ECC71; // happy — green
    if ('😡🤬👊😤'.includes(m)) return 0xE74C3C; // angry — red
    if ('😢😭💔😞'.includes(m)) return 0x3498DB; // sad — blue
    if ('😏😈🤔🧐'.includes(m)) return 0x9B59B6; // scheming — purple
    if ('😴💤'.includes(m)) return 0x95A5A6; // sleeping — grey
    if ('😳😨😱'.includes(m)) return 0xF39C12; // shocked — orange
    return 0xBDC3C7; // neutral — light grey
  }

  _updateMoodIndicator() {
    if (!this._moodIndicator) return;
    this._moodIndicator.clear();
    const color = this._getMoodColor();
    // Small glowing dot
    this._moodIndicator.circle(0, 0, 5).fill({ color, alpha: 0.9 });
    this._moodIndicator.circle(0, 0, 8).fill({ color, alpha: 0.2 });
  }

  _drawHairCap(g, hc) {
    // Semicircle dome over head — PixiJS 8 compatible (no .arc())
    g.moveTo(-17, -26)
      .bezierCurveTo(-17, -44, 17, -44, 17, -26)
      .closePath()
      .fill({ color: hc });
  }

  _drawHair(g) {
    const hc = this.hairColor;
    switch (this.hairStyle) {
      case 'short':
        this._drawHairCap(g, hc);
        break;
      case 'long':
        this._drawHairCap(g, hc);
        g.roundRect(-17, -30, 8, 24, 2).fill({ color: hc });
        g.roundRect(9, -30, 8, 24, 2).fill({ color: hc });
        break;
      case 'spiky':
        for (let i = -12; i <= 12; i += 6) {
          g.moveTo(i - 3, -38).lineTo(i, -50).lineTo(i + 3, -38).closePath().fill({ color: hc });
        }
        this._drawHairCap(g, hc);
        break;
      case 'curly':
        for (let a = Math.PI; a >= 0; a -= 0.4) {
          const cx = Math.cos(a) * 18;
          const cy = -26 + Math.sin(a) * -18;
          g.circle(cx, cy, 5).fill({ color: hc });
        }
        break;
      case 'bun':
        this._drawHairCap(g, hc);
        g.circle(0, -44, 8).fill({ color: hc });
        break;
      case 'mohawk':
        g.roundRect(-4, -50, 8, 26, 3).fill({ color: hc });
        break;
      default:
        this._drawHairCap(g, hc);
    }
  }

  moveTo(zoneName) {
    const pos = _findNonOverlappingPos(zoneName, this.name);
    this.targetX = pos.x;
    this.targetY = pos.y;
    this.currentZone = zoneName;
    this.isMoving = true;
    this.recentActions.push(`Moved to ${zoneName}`);
    if (this.recentActions.length > 10) this.recentActions.shift();
    eventBus.emit('character:move', { character: this, zone: zoneName });
  }

  addMemory(entry) {
    this.memory.push(entry);
    if (this.memory.length > 20) this.memory.shift();
  }

  getMemorySummary(count = 5) {
    const recent = this.memory.slice(-count);
    return recent.map(m => {
      const who = m.who ? ` with ${m.who}` : '';
      const feeling = m.feeling ? ` — felt ${m.feeling}` : '';
      return `Day ${m.day || '?'}: ${m.event}${who}${feeling}`;
    });
  }

  speak(text, audioUrl = null) {
    this.recentActions.push(`Said: "${text}"`);
    if (this.recentActions.length > 10) this.recentActions.shift();
    eventBus.emit('character:speak', { character: this, text, audioUrl });
  }

  setMood(mood) {
    this.mood = mood;
    this._updateMoodIndicator();
    eventBus.emit('character:mood', { character: this, mood });
  }

  getPerception(allCharacters, worldState) {
    const lines = [];
    lines.push(`I am ${this.name}. I'm in the ${this.currentZone}. My mood: ${this.mood}`);

    // Rich personality
    if (typeof this.personality === 'object') {
      const p = this.personality;
      lines.push(`Bio: ${p.bio}`);
      lines.push(`Traits: ${p.traits.join(', ')}`);
      lines.push(`I like: ${p.likes.join(', ')}`);
      lines.push(`I dislike: ${p.dislikes.join(', ')}`);
      lines.push(`Quirks: ${p.quirks.join(', ')}`);
      lines.push(`Secret goal: ${p.secretGoal}`);
      if (p.backstory) lines.push(`Backstory: ${p.backstory}`);
      if (p.deepFears) lines.push(`Deep fear: ${p.deepFears}`);
      if (p.hiddenVulnerability) lines.push(`Hidden vulnerability: ${p.hiddenVulnerability}`);
    } else {
      lines.push(`Personality: ${this.personality}`);
    }

    // Couple status
    const partner = getPartner(this.name);
    if (partner) {
      lines.push(`I'm COUPLED UP with ${partner}. We share a bed.`);
      const partnerChar = allCharacters.find(c => c.name === partner);
      if (partnerChar && partnerChar.currentZone !== this.currentZone) {
        lines.push(`My partner ${partner} isn't here with me... they're somewhere else in the villa.`);
      }
    } else {
      lines.push(`I'm currently SINGLE and vulnerable. I need to couple up or I could be dumped!`);
    }

    // Other couples context
    const couples = getCouples();
    for (const couple of couples) {
      if (couple.partnerA !== this.name && couple.partnerB !== this.name) {
        lines.push(`${couple.partnerA} and ${couple.partnerB} are coupled up.`);
      }
    }

    // Day/time awareness
    if (worldState && worldState.timeOfDay) {
      lines.push(`It's ${worldState.timeOfDay} on Day ${worldState.dayNumber} in the villa.`);
    }

    if (worldState && worldState.ceremonyInProgress) {
      lines.push(`\u26A0\uFE0F A RECOUPLING CEREMONY is happening right now at the Fire Pit!`);
    }

    // Islanders in the villa — characters can only see details of those in same room
    lines.push(`\nIslanders in the ${this.currentZone} WITH ME:`);
    const inMyRoom = allCharacters.filter(c => c !== this && c.currentZone === this.currentZone);
    if (inMyRoom.length === 0) {
      lines.push('  (Nobody else is here right now)');
    }
    for (const other of inMyRoom) {
      const rel = getRelationship(this.name, other.name);
      lines.push(`  - ${other.name}, mood: ${other.mood} | My feelings: trust=${rel.trust}, irritation=${rel.irritation}, attraction=${rel.attraction}`);
    }

    const elsewhere = allCharacters.filter(c => c !== this && c.currentZone !== this.currentZone);
    if (elsewhere.length > 0) {
      lines.push(`\nOther islanders (somewhere else in the villa):`);
      for (const other of elsewhere) {
        const rel = getRelationship(this.name, other.name);
        lines.push(`  - ${other.name} | My feelings: trust=${rel.trust}, irritation=${rel.irritation}, attraction=${rel.attraction}`);
      }
    }

    lines.push(`\nTHESE ARE THE ONLY ISLANDERS IN THE VILLA. Do NOT mention anyone else.`);

    if (worldState && worldState.recentEvents && worldState.recentEvents.length > 0) {
      lines.push('Recent events:');
      for (const e of worldState.recentEvents.slice(-8)) {
        lines.push(`  - ${e}`);
      }
    }

    if (worldState && worldState.dramaEvents && worldState.dramaEvents.length > 0) {
      lines.push('BREAKING: ' + worldState.dramaEvents[worldState.dramaEvents.length - 1]);
    }

    // Active world objects
    const worldObjects = getActiveWorldObjects();
    if (worldObjects.length > 0) {
      for (const obj of worldObjects) {
        const inMyRoom = obj.room === this.currentZone;
        if (inMyRoom) {
          lines.push(`⚠️ WARNING: There is ${obj.type.toUpperCase()} in the ${obj.room}! ${obj.description}`);
        } else {
          lines.push(`📢 ALERT: ${obj.type.toUpperCase()} reported in the ${obj.room}.`);
        }
      }
    }

    // Memories
    const memories = this.getMemorySummary(5);
    if (memories.length > 0) {
      lines.push('\nMemories:');
      for (const m of memories) {
        lines.push(`  - ${m}`);
      }
    }

    if (this.recentActions.length > 0) {
      lines.push('My recent actions:');
      for (const a of this.recentActions.slice(-5)) {
        lines.push(`  - ${a}`);
      }
    }

    // Room awareness — list all rooms and who's in each
    const allZones = ['Kitchen', 'Living Room', 'Bedroom', 'Bathroom'];
    lines.push('\nRooms:');
    for (const zone of allZones) {
      const occupants = allCharacters.filter(c => c !== this && c.currentZone === zone).map(c => c.name);
      if (zone === this.currentZone) {
        lines.push(`  ${zone} (YOU ARE HERE): ${occupants.length > 0 ? occupants.join(', ') : 'empty'}`);
      } else {
        lines.push(`  ${zone}: ${occupants.length > 0 ? occupants.join(', ') : 'empty'}`);
      }
    }

    return lines.join('\n');
  }

  // Compressed perception for AI calls (~200 tokens vs ~425 for full)
  getCompressedPerception(allCharacters, worldState) {
    const p = this.personality;
    const archetype = (typeof p === 'object') ? p.archetype : p;
    const partner = getPartner(this.name);
    const coupleStatus = partner ? `Coupled with ${partner}` : 'Single';

    let lines = [];
    lines.push(`I am ${this.name} (${archetype}) in ${this.currentZone}. Mood: ${this.mood}`);
    lines.push(`${coupleStatus}.`);

    // Characters in same room — compact format
    const inRoom = allCharacters.filter(c => c !== this && c.currentZone === this.currentZone);
    if (inRoom.length > 0) {
      const roommates = inRoom.map(c => {
        const rel = getRelationship(this.name, c.name);
        return `${c.name} (trust:${rel.trust} irr:${rel.irritation} att:${rel.attraction})`;
      }).join(', ');
      lines.push(`In room: ${roommates}`);
    }

    // 3 most recent memories
    const memories = this.getMemorySummary(3);
    if (memories.length > 0) {
      lines.push(`Mem: ${memories.join('; ')}`);
    }

    // Last 3 recent events
    if (worldState && worldState.recentEvents && worldState.recentEvents.length > 0) {
      const recent = worldState.recentEvents.slice(-3).join('; ');
      lines.push(`Recent: ${recent}`);
    }

    // Latest drama
    if (worldState && worldState.dramaEvents && worldState.dramaEvents.length > 0) {
      lines.push(`Drama: ${worldState.dramaEvents[worldState.dramaEvents.length - 1]}`);
    }

    return lines.join('\n');
  }

  update(delta) {
    this._animTick += (delta || 1);
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 2) {
      this.x += dx * 0.05;
      this.y += dy * 0.05;
      this.isMoving = true;
      // Track facing direction
      if (Math.abs(dx) > 1) this._facingLeft = dx < 0;
    } else {
      this.isMoving = false;
    }

    // Flip procedural body based on direction
    if (this._bodyGraphics) {
      this._bodyGraphics.scale.x = this._facingLeft ? -1 : 1;
    }

    if (this.sprite) {
      this.sprite.x = this.x;

      // Perspective scaling — characters at the bottom (closer to camera) are bigger
      const zone = ZONES[this.currentZone];
      if (zone) {
        const floorTop = zone.y + zone.h * 0.55;
        const floorBottom = zone.y + zone.h;
        const t = Math.max(0, Math.min(1, (this.y - floorTop) / (floorBottom - floorTop)));
        const perspectiveScale = 0.55 + t * 0.5; // 0.55 at back, 1.05 at front
        this.sprite.scale.set(perspectiveScale);
      }

      this.sprite.y = this.y;
    }
  }
}

// Full character pool — diverse Love Island archetypes
const CHARACTER_POOL = [
  {
    name: 'Jade',
    color: 0xFF1493,
    skinTone: 'tan',
    hairStyle: 'long',
    hairColor: 0x111111,
    accessory: 'earring',
    voiceId: 'wwhH7LnHwekglU0w37aP',
    personality: {
      bio: 'Fitness model from Essex who built her following from nothing after dropping out of sixth form. Came to find "the one" but can\'t help flirting with everyone because attention is the only thing that makes her feel safe.',
      traits: ['flirtatious', 'confident', 'jealous', 'charming'],
      likes: ['gym sessions', 'cocktails', 'being the center of attention'],
      dislikes: ['being mugged off', 'disloyalty', 'people who play games'],
      quirks: ['Tosses her hair constantly', 'Says "literally" every other sentence'],
      secretGoal: 'Be in the most powerful couple and win the show',
      archetype: 'The Bombshell',
      backstory: 'Grew up on a council estate with a single mum who worked three jobs. Started modelling at 16 to help pay bills. The Instagram fame gave her confidence but also made her addicted to validation.',
      deepFears: 'Terrified that without her looks she has nothing to offer — that nobody would stay if they really knew her.',
      hiddenVulnerability: 'Cries alone in the bathroom when she feels overlooked, then walks out smiling like nothing happened.',
      growthArc: 'Learning that being loved for who she is matters more than being desired for how she looks.',
    },
  },
  {
    name: 'Marcus',
    color: 0x3498DB,
    skinTone: 'dark',
    hairStyle: 'short',
    hairColor: 0x111111,
    accessory: null,
    voiceId: 'Sq93GQT4X1lKDXsQcixO',
    personality: {
      bio: 'Sweet PE teacher from Birmingham who wears his heart on his sleeve. Falls fast and hard, already planning the wedding in his head by day three. His students love him but his exes say he\'s "too much."',
      traits: ['romantic', 'emotional', 'loyal', 'sensitive'],
      likes: ['deep conversations', 'sunrise runs', 'old-school R&B'],
      dislikes: ['players', 'people who aren\'t genuine', 'being second choice'],
      quirks: ['Writes love notes on napkins', 'Gets teary-eyed at sunsets'],
      secretGoal: 'Find genuine love, even if it means getting his heart broken',
      archetype: 'The Hopeless Romantic',
      backstory: 'Parents had a fairytale marriage until his dad walked out when he was 12 with no explanation. Raised by his mum and nan, who taught him that love should be everything. Still hasn\'t fully processed the abandonment.',
      deepFears: 'That he\'s fundamentally unlovable — that everyone he lets in will eventually leave without a word, just like his dad.',
      hiddenVulnerability: 'Puts partners on a pedestal so high that the relationship becomes about worshipping them, not actually connecting.',
      growthArc: 'Learning that love isn\'t about grand gestures — it\'s about showing up consistently without losing himself.',
    },
  },
  {
    name: 'Priya',
    color: 0x9B59B6,
    skinTone: 'medium',
    hairStyle: 'long',
    hairColor: 0x1A0A00,
    accessory: null,
    voiceId: 'gcgATH9maP3HG8oRh9Pn',
    personality: {
      bio: 'Smooth-talking estate agent from Manchester who always has a plan. She reads people like properties — assessing value, spotting flaws, calculating the best deal. Not afraid to step on toes because she learned early that nice girls finish last.',
      traits: ['strategic', 'manipulative', 'witty', 'calculating'],
      likes: ['power moves', 'insider knowledge', 'pulling strings'],
      dislikes: ['being outsmarted', 'genuine people who see through her', 'losing control'],
      quirks: ['Whispers strategy to allies', 'Always has a backup plan'],
      secretGoal: 'Play every islander against each other and come out on top',
      archetype: 'The Game Player',
      backstory: 'Grew up in a chaotic household with parents who weaponised the kids against each other during their divorce. Learned manipulation as a survival mechanism — the child who controlled the narrative got hurt the least.',
      deepFears: 'That if she ever stops strategising and lets someone in for real, they\'ll use it to destroy her the way her parents destroyed each other.',
      hiddenVulnerability: 'Sometimes at night she wonders what it would feel like to just be honest with someone, but the thought makes her physically ill.',
      growthArc: 'Realising that control is a cage, and the bravest move is letting someone see the real her.',
    },
  },
  {
    name: 'Tyler',
    color: 0xE74C3C,
    skinTone: 'brown',
    hairStyle: 'curly',
    hairColor: 0x222222,
    accessory: 'glasses',
    voiceId: 'oTQK6KgOJHp8UGGZjwUu',
    personality: {
      bio: 'Loud and proud barber from South London who built his shop from scratch at 21. Lives for drama and never backs down from a confrontation — not because he\'s aggressive, but because he grew up watching people get walked over and swore it would never be him.',
      traits: ['confrontational', 'entertaining', 'opinionated', 'loyal'],
      likes: ['banter', 'roasting people', 'telling it like it is'],
      dislikes: ['fake people', 'being ignored', 'anyone who chats behind backs'],
      quirks: ['Claps when making a point', 'Starts every sentence with "Listen yeah..."'],
      secretGoal: 'Be the most talked-about islander and go viral',
      archetype: 'The Drama Magnet',
      backstory: 'Eldest of five kids, became the man of the house at 14 when his dad went inside. Had to be loud and tough to protect his siblings. The barbershop is the first thing he ever built that was just for him.',
      deepFears: 'Being invisible — that without the noise and the drama, nobody would notice he was even there.',
      hiddenVulnerability: 'The toughness is a shield. When someone is genuinely kind to him with no agenda, he doesn\'t know how to handle it and retreats.',
      growthArc: 'Discovering that he doesn\'t have to fight for attention — the right person will see him without him having to shout.',
    },
  },
  {
    name: 'Sienna',
    color: 0xF39C12,
    skinTone: 'light',
    hairStyle: 'bun',
    hairColor: 0xC4872A,
    accessory: null,
    voiceId: '8N2ng9i2uiUWqstgmWlH',
    personality: {
      bio: 'Yoga instructor from Brighton who projects zen calm but underneath is fiercely competitive and silently judges everyone. Her "spiritual journey" started as a way to cope with her parents\' ugly divorce, and now she can\'t tell where the coping ends and the real her begins.',
      traits: ['spiritual', 'calm', 'perceptive', 'passive-aggressive'],
      likes: ['meditation', 'acai bowls', 'meaningful eye contact'],
      dislikes: ['negative energy', 'people who shout', 'being rushed'],
      quirks: ['Meditates before confrontations', 'Speaks in metaphors'],
      secretGoal: 'Find someone who matches her energy and prove love can be peaceful',
      archetype: 'The Free Spirit',
      backstory: 'Grew up in a screaming household in Surrey — crystal bowls and incense were her escape. Moved to Brighton at 18 to reinvent herself. The spirituality is real but it\'s also armour against feeling anything too intensely.',
      deepFears: 'That the "calm" version of herself is a performance, and underneath she\'s just as messy and explosive as her parents were.',
      hiddenVulnerability: 'When pushed hard enough, the zen mask cracks and she becomes exactly the kind of person she claims to have transcended.',
      growthArc: 'Accepting that having big emotions doesn\'t make her broken — it makes her human.',
    },
  },
  {
    name: 'Devon',
    color: 0x2ECC71,
    skinTone: 'brown',
    hairStyle: 'mohawk',
    hairColor: 0xFFD700,
    accessory: null,
    voiceId: 'UaYTS0wayjmO9KD1LR4R',
    personality: {
      bio: 'Club promoter from Ibiza who\'s been the life of every party since he was 15. Knows everyone, trusts nobody. The golden mohawk and the huge smile hide a kid who learned that if you keep everyone entertained, nobody asks why you\'re always alone at the end of the night.',
      traits: ['charismatic', 'unreliable', 'fun', 'impulsive'],
      likes: ['parties', 'new connections', 'spontaneous adventures'],
      dislikes: ['commitment', 'boring people', 'early mornings'],
      quirks: ['Gives everyone nicknames', 'Suggests shots at inappropriate moments'],
      secretGoal: 'Have the most fun possible and leave with a massive following',
      archetype: 'The Entertainer',
      backstory: 'Foster kid who bounced between seven homes before aging out. Never stayed anywhere long enough to get attached. Ibiza was the first place where being rootless was a feature, not a flaw.',
      deepFears: 'That commitment means being trapped in another home that doesn\'t want him — and that if he stays still long enough, people will see he\'s damaged goods.',
      hiddenVulnerability: 'Sabotages every genuine connection right before it gets real because leaving first hurts less than being left.',
      growthArc: 'Learning that choosing to stay is the most courageous thing a person who\'s always run can do.',
    },
  },
  {
    name: 'Aaliyah',
    color: 0xE91E63,
    skinTone: 'dark',
    hairStyle: 'curly',
    hairColor: 0x111111,
    accessory: 'earring',
    voiceId: 'Xb7hH8MSUJpSbSDYk0k2',
    personality: {
      bio: 'Trainee doctor from London who\'s used to being the smartest in the room. Intimidating but soft inside — she built walls so high that by the time someone climbs over, she\'s already decided they\'re not worthy. Her parents sacrificed everything for her education and she carries that weight in every decision.',
      traits: ['intelligent', 'guarded', 'ambitious', 'secretly romantic'],
      likes: ['intellectual banter', 'wine', 'people who challenge her'],
      dislikes: ['being underestimated', 'small talk', 'people who rely on looks'],
      quirks: ['Analyses people like patients', 'Quotes obscure poetry'],
      secretGoal: 'Find someone who loves her mind as much as her looks',
      archetype: 'The Intimidator',
      backstory: 'Daughter of Nigerian immigrants who worked cleaning jobs so she could go to private school. Was the only Black girl in her year and learned to be twice as good to get half the credit. Intimacy feels like a vulnerability she can\'t afford.',
      deepFears: 'That letting someone in means letting her parents down — that love is a distraction from the life they sacrificed for.',
      hiddenVulnerability: 'Secretly reads romance novels under the covers and yearns for the kind of messy, irrational love she publicly dismisses as foolish.',
      growthArc: 'Realising that being smart and being in love aren\'t mutually exclusive — that her parents would want her to be happy, not just successful.',
    },
  },
  {
    name: 'Kai',
    color: 0x1ABC9C,
    skinTone: 'medium',
    hairStyle: 'spiky',
    hairColor: 0x333333,
    accessory: null,
    voiceId: '9x3LCv1U6rJuU05dIEO3',
    personality: {
      bio: 'Professional surfer from Cornwall with a cheeky smile and sun-bleached soul. Laid back about everything except winning — and the second someone threatens his position, the competitive monster comes out. Tells everyone he\'s "just vibing" but keeps a mental scoreboard of every interaction.',
      traits: ['cheeky', 'competitive', 'easygoing', 'flirty'],
      likes: ['beach sunsets', 'adventure', 'friendly competitions'],
      dislikes: ['jealousy', 'people who take themselves too seriously', 'drama'],
      quirks: ['Uses surf metaphors for everything', 'Winks constantly'],
      secretGoal: 'Find a partner who is down for adventure and doesn\'t try to change him',
      archetype: 'The Cheeky One',
      backstory: 'Grew up in a tiny coastal village, homeschooled by hippie parents who never pushed him. Won his first surf competition at 14 and discovered the only time he felt alive was when he was competing. The chill surfer persona hides someone who is terrified of being average.',
      deepFears: 'That "laid back" is just another word for "lazy" and that his parents\' lack of ambition is his destiny too.',
      hiddenVulnerability: 'Uses humour and flirtation to avoid any conversation that goes deeper than surface level — panics when someone asks him what he actually wants from life.',
      growthArc: 'Finding someone who makes him want to stop competing and start being present.',
    },
  },
  {
    name: 'Valentina',
    color: 0xFF6B6B,
    skinTone: 'tan',
    hairStyle: 'long',
    hairColor: 0x8B4513,
    accessory: null,
    voiceId: '7tq0KpB5OH4Tbvfz3oMR',
    personality: {
      bio: 'Italian fashion designer who grew up between Milan and London. Passionate about everything — love, food, arguments, revenge. She doesn\'t do anything quietly. Every relationship is a soap opera because she secretly believes she doesn\'t deserve the quiet, steady love she actually craves.',
      traits: ['passionate', 'dramatic', 'expressive', 'possessive'],
      likes: ['grand gestures', 'fashion', 'being wooed properly'],
      dislikes: ['laziness in love', 'bad style', 'people who hide their feelings'],
      quirks: ['Gestures wildly when talking', 'Switches to Italian when angry'],
      secretGoal: 'Find a love story worthy of a movie',
      archetype: 'The Passionate One',
      backstory: 'Her parents had an explosive, on-and-off marriage — screaming fights followed by grand reconciliations. She learned that love is supposed to be chaotic and painful. Her nonna told her to find a boring man, but she can\'t stop chasing the storm.',
      deepFears: 'That calm love means no love at all — and if someone isn\'t fighting for her, they don\'t really care.',
      hiddenVulnerability: 'Sabotages relationships that are going well by creating drama, because peace makes her anxious — she doesn\'t know what to do when nobody\'s shouting.',
      growthArc: 'Learning that real passion isn\'t chaos — it\'s choosing someone every day without needing a crisis to prove it.',
    },
  },
  {
    name: 'Zane',
    color: 0x34495E,
    skinTone: 'light',
    hairStyle: 'short',
    hairColor: 0x4A3728,
    accessory: null,
    voiceId: 'JBFqnCBsd6RMkjVDRZzb',
    personality: {
      bio: 'Firefighter and part-time model from Leeds. Loyal to a fault but has a jealous streak that has ended his last three relationships. Cooks when stressed, works out when angry, and bottles up everything else until it explodes.',
      traits: ['protective', 'jealous', 'brave', 'loyal'],
      likes: ['working out', 'cooking for people', 'acts of service'],
      dislikes: ['liars', 'anyone flirting with his partner', 'being vulnerable'],
      quirks: ['Cooks when stressed', 'Gets territorial at parties'],
      secretGoal: 'Find someone worth being vulnerable for',
      archetype: 'The Loyal One',
      backstory: 'Watched his mum get cheated on repeatedly by his stepdad, who always charmed his way back in. Became a firefighter because saving people is the one thing that makes him feel in control. His jealousy isn\'t about possession — it\'s about never being the fool his mum was.',
      deepFears: 'Being betrayed by someone he\'s fully opened up to — that giving someone his whole heart just gives them a better weapon.',
      hiddenVulnerability: 'Pushes partners away with suspicion before they can hurt him, then wonders why he\'s always alone.',
      growthArc: 'Accepting that trust is a choice you make despite the risk, not a reward someone has to earn.',
    },
  },
  {
    name: 'Nkechi',
    color: 0xFF9800,
    skinTone: 'dark',
    hairStyle: 'bun',
    hairColor: 0x111111,
    accessory: null,
    voiceId: 'X5gGKB97vhrZhE6AgMYI',
    personality: {
      bio: 'Nigerian-British fashion blogger from Peckham who built a 200k following by being unapologetically herself. Loud, warm, and fiercely loyal to her circle — but if you cross her once, you\'re dead to her. No second chances, no exceptions. People think she\'s bulletproof but the truth is she just never shows the wounds.',
      traits: ['sassy', 'confident', 'direct', 'warm'],
      likes: ['good vibes', 'fashion', 'people who keep it real'],
      dislikes: ['two-faced people', 'being told to calm down', 'mediocrity'],
      quirks: ['Reads people with one look', 'Has a catchphrase for every situation'],
      secretGoal: 'Find someone who can handle her energy and match it',
      archetype: 'The Queen Bee',
      backstory: 'Eldest daughter who practically raised her three younger siblings while mum worked nights. Had to grow up fast, become the strong one, never show weakness. The "queen bee" persona started as protection and became her whole identity.',
      deepFears: 'That she\'s so used to being strong for everyone else that she\'s forgotten how to let someone be strong for her.',
      hiddenVulnerability: 'Desperately wants to be taken care of but can\'t say it out loud because it feels like admitting defeat.',
      growthArc: 'Learning that asking for help isn\'t weakness — and that the right partner will want to carry her sometimes.',
    },
  },
  {
    name: 'Ravi',
    color: 0x8E44AD,
    skinTone: 'medium',
    hairStyle: 'short',
    hairColor: 0x111111,
    accessory: 'glasses',
    voiceId: 'Yg7C1g7suzNt5TisIqkZ',
    personality: {
      bio: 'Stand-up comedian from Leicester who uses humour like a force field. Every serious moment gets deflected with a joke, every genuine compliment gets turned into a bit. He\'s the funniest person in every room and the loneliest person at every party.',
      traits: ['funny', 'deflective', 'insecure', 'kind'],
      likes: ['making people laugh', 'late-night chats', 'people who see past the jokes'],
      dislikes: ['being serious', 'rejection', 'people who can\'t take a joke'],
      quirks: ['Turns everything into a bit', 'Does impressions of other islanders'],
      secretGoal: 'Find someone who loves the real him, not just the funny guy',
      archetype: 'The Comedian',
      backstory: 'Was badly bullied at school until he learned that making people laugh meant they couldn\'t hurt him. Got into stand-up at university and finally found somewhere he belonged — but even on stage, he\'s performing a version of himself, never the real thing.',
      deepFears: 'That without the jokes he\'s boring — that the real Ravi isn\'t enough and nobody would choose to be around him if he wasn\'t entertaining them.',
      hiddenVulnerability: 'When someone is genuinely vulnerable with him, he panics and makes a joke — then hates himself for it afterwards.',
      growthArc: 'Discovering that the right person will sit with him in the silence and love what they find there.',
    },
  },
];

// Randomly pick N islanders from the pool
export function createRandomCast(count = 4) {
  const zones = ['Kitchen', 'Living Room', 'Bedroom', 'Bathroom'];
  const shuffled = [...CHARACTER_POOL].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, Math.min(count, shuffled.length));
  return picked.map((cfg, i) => new Character({
    ...cfg,
    startZone: zones[i % zones.length],
  }));
}

// Default characters (can be overridden by customization)
export function createDefaultCharacters() {
  return createRandomCast(4);
}

// Create characters from saved config
export function createCharactersFromConfig(configs) {
  const zones = ['Kitchen', 'Living Room', 'Bedroom'];
  return configs.map((cfg, i) => new Character({
    name: cfg.name,
    color: parseInt(cfg.color.replace('#', ''), 16),
    personality: cfg.personality || DEFAULT_PERSONALITIES[i],
    startZone: zones[i] || 'Kitchen',
    skinTone: cfg.skinTone || 'medium',
    hairStyle: cfg.hairStyle || 'short',
    hairColor: parseInt((cfg.hairColor || '#222222').replace('#', ''), 16),
    accessory: cfg.accessory || null,
  }));
}

export let characters = createDefaultCharacters();

export function setCharacters(newChars) {
  characters = newChars;
}

export { SKIN_TONES, HAIR_STYLES, DEFAULT_PERSONALITIES };
