import * as PIXI from 'https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.mjs';
import { eventBus, getRelationship, getActiveWorldObjects, getPartner, getCouples } from './events.js';
import { SpriteAnimator } from './sprite-animator.js';

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
  constructor({ name, color, personality, startZone, skinTone, hairStyle, hairColor, accessory }) {
    this.name = name;
    this.color = color;
    this.personality = personality;
    this.mood = '😐';
    this.currentZone = startZone;
    this.recentActions = [];
    this.memory = [];
    this.relationships = {};
    this.isMoving = false;

    // Visual customization
    this.skinTone = skinTone || 'medium';
    this.hairStyle = hairStyle || 'short';
    this.hairColor = hairColor || 0x222222;
    this.accessory = accessory || null;

    const center = getZoneCenter(startZone);
    const z = ZONES[startZone];
    const xOff = (Math.random() - 0.5) * (z ? z.w * 0.6 : 120);
    const yOff = (Math.random() - 0.5) * (z ? z.h * 0.2 : 40);
    this.x = center.x + xOff;
    this.y = center.y + yOff;
    this.targetX = this.x;
    this.targetY = this.y;

    this.sprite = null;
    this._nameText = null;
    this._moodIndicator = null;
    this._charSprite = null;
    this._bodyGraphics = null;
    this._animTick = Math.random() * 100;
    this._spriteLoaded = false;
    this._animator = null;
    this._facingLeft = false;
  }

  createSprite() {
    const container = new PIXI.Container();

    // Try to load image sprite, fall back to procedural
    const charId = this.name.toLowerCase();
    const imgPath = `/assets/characters/${charId}.png`;

    // Try sprite sheet first, then static PNG, then procedural
    this._loadSpriteSheet(charId, container).catch(() => {
      PIXI.Assets.load(imgPath).then(texture => {
        const imgSprite = new PIXI.Sprite(texture);
        const scale = 240 / texture.height;
        imgSprite.scale.set(scale);
        imgSprite.anchor.set(0.5, 0.85);
        container.addChildAt(imgSprite, 0);
        this._charSprite = imgSprite;
        this._spriteLoaded = true;

        if (this._bodyGraphics && this._bodyGraphics.parent) {
          this._bodyGraphics.parent.removeChild(this._bodyGraphics);
        }
      }).catch(() => {
        // Image not found — use procedural fallback
        this._drawProceduralBody(container);
      });
    });

    // Draw procedural body as initial fallback (shown until image loads)
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

  async _loadSpriteSheet(charId, container) {
    const metaUrl = `/assets/characters/${charId}/${charId}.json`;
    const response = await fetch(metaUrl);
    if (!response.ok) throw new Error('No sprite sheet metadata');
    const metadata = await response.json();

    const animator = new SpriteAnimator(charId, metadata);
    await animator.load();

    const displayObj = animator.getDisplayObject();
    displayObj.anchor.set(0.5, 0.85);
    const scale = 240 / metadata.frameHeight;
    displayObj.scale.set(scale);
    container.addChildAt(displayObj, 0);

    this._animator = animator;
    this._charSprite = displayObj;
    this._spriteLoaded = true;
    animator.play('idle');

    if (this._bodyGraphics && this._bodyGraphics.parent) {
      this._bodyGraphics.parent.removeChild(this._bodyGraphics);
    }
  }

  moveTo(zoneName) {
    const z = ZONES[zoneName];
    const center = getZoneCenter(zoneName);
    // Spread characters across the floor width, constrain Y to floor area
    const xOffset = (Math.random() - 0.5) * (z ? z.w * 0.7 : 160);
    const yOffset = (Math.random() - 0.5) * (z ? z.h * 0.25 : 60);
    this.targetX = center.x + xOffset;
    this.targetY = center.y + yOffset;
    this.currentZone = zoneName;
    this.isMoving = true;
    this.recentActions.push(`Moved to ${zoneName}`);
    if (this.recentActions.length > 10) this.recentActions.shift();
    eventBus.emit('character:move', { character: this, zone: zoneName });
  }

  speak(text) {
    this.recentActions.push(`Said: "${text}"`);
    if (this.recentActions.length > 10) this.recentActions.shift();
    eventBus.emit('character:speak', { character: this, text });
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
    } else {
      lines.push(`Personality: ${this.personality}`);
    }

    // Couple status
    const partner = getPartner(this.name);
    if (partner) {
      lines.push(`I'm COUPLED UP with ${partner}. We share a bed.`);
      // Check if partner is talking to someone else
      const partnerChar = allCharacters.find(c => c.name === partner);
      if (partnerChar && partnerChar.currentZone !== this.currentZone) {
        lines.push(`My partner ${partner} is in ${partnerChar.currentZone} WITHOUT ME... suspicious.`);
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

    // Other characters + relationships
    for (const other of allCharacters) {
      if (other === this) continue;
      const rel = getRelationship(this.name, other.name);
      const sameRoom = other.currentZone === this.currentZone;
      lines.push(`${other.name} is in ${other.currentZone}${sameRoom ? ' (WITH ME)' : ''}, mood: ${other.mood} | My feelings: trust=${rel.trust}, irritation=${rel.irritation}, attraction=${rel.attraction}`);
    }

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

    if (this.recentActions.length > 0) {
      lines.push('My recent actions:');
      for (const a of this.recentActions.slice(-5)) {
        lines.push(`  - ${a}`);
      }
    }

    return lines.join('\n');
  }

  update(delta) {
    this._animTick += (delta || 1);
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const wasMoving = this.isMoving;
    if (dist > 2) {
      this.x += dx * 0.05;
      this.y += dy * 0.05;
      this.isMoving = true;
      // Track facing direction
      if (Math.abs(dx) > 1) this._facingLeft = dx < 0;
    } else {
      this.isMoving = false;
    }

    // Animator: switch between walk/idle, update frames
    if (this._animator) {
      if (this.isMoving && !wasMoving) {
        this._animator.play('walk');
      } else if (!this.isMoving && wasMoving) {
        this._animator.play('idle');
      }
      this._animator.update(delta || 1);

      // Flip sprite based on direction
      if (this._charSprite) {
        const absScaleX = Math.abs(this._charSprite.scale.x);
        this._charSprite.scale.x = this._facingLeft ? -absScaleX : absScaleX;
      }
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
    personality: {
      bio: 'Fitness model from Essex who came to find "the one" but can\'t help flirting with everyone.',
      traits: ['flirtatious', 'confident', 'jealous', 'charming'],
      likes: ['gym sessions', 'cocktails', 'being the center of attention'],
      dislikes: ['being mugged off', 'disloyalty', 'people who play games'],
      quirks: ['Tosses her hair constantly', 'Says "literally" every other sentence'],
      secretGoal: 'Be in the most powerful couple and win the show',
      archetype: 'The Bombshell',
    },
  },
  {
    name: 'Marcus',
    color: 0x3498DB,
    skinTone: 'dark',
    hairStyle: 'short',
    hairColor: 0x111111,
    accessory: null,
    personality: {
      bio: 'Sweet PE teacher who wears his heart on his sleeve. Falls fast and hard.',
      traits: ['romantic', 'emotional', 'loyal', 'sensitive'],
      likes: ['deep conversations', 'sunrise runs', 'old-school R&B'],
      dislikes: ['players', 'people who aren\'t genuine', 'being second choice'],
      quirks: ['Writes love notes on napkins', 'Gets teary-eyed at sunsets'],
      secretGoal: 'Find genuine love, even if it means getting his heart broken',
      archetype: 'The Hopeless Romantic',
    },
  },
  {
    name: 'Priya',
    color: 0x9B59B6,
    skinTone: 'medium',
    hairStyle: 'long',
    hairColor: 0x1A0A00,
    accessory: null,
    personality: {
      bio: 'Smooth-talking estate agent who always has a plan. Not afraid to step on toes.',
      traits: ['strategic', 'manipulative', 'witty', 'calculating'],
      likes: ['power moves', 'insider knowledge', 'pulling strings'],
      dislikes: ['being outsmarted', 'genuine people who see through her', 'losing control'],
      quirks: ['Whispers strategy to allies', 'Always has a backup plan'],
      secretGoal: 'Play every islander against each other and come out on top',
      archetype: 'The Game Player',
    },
  },
  {
    name: 'Tyler',
    color: 0xE74C3C,
    skinTone: 'brown',
    hairStyle: 'curly',
    hairColor: 0x222222,
    accessory: 'glasses',
    personality: {
      bio: 'Loud and proud barber from South London. Lives for drama and never backs down.',
      traits: ['confrontational', 'entertaining', 'opinionated', 'loyal'],
      likes: ['banter', 'roasting people', 'telling it like it is'],
      dislikes: ['fake people', 'being ignored', 'anyone who chats behind backs'],
      quirks: ['Claps when making a point', 'Starts every sentence with "Listen yeah..."'],
      secretGoal: 'Be the most talked-about islander and go viral',
      archetype: 'The Drama Magnet',
    },
  },
  {
    name: 'Sienna',
    color: 0xF39C12,
    skinTone: 'light',
    hairStyle: 'bun',
    hairColor: 0xC4872A,
    accessory: null,
    personality: {
      bio: 'Yoga instructor from Byron Bay. Chill vibes but fiercely protective of her connections.',
      traits: ['spiritual', 'calm', 'perceptive', 'passive-aggressive'],
      likes: ['meditation', 'acai bowls', 'meaningful eye contact'],
      dislikes: ['negative energy', 'people who shout', 'being rushed'],
      quirks: ['Meditates before confrontations', 'Speaks in metaphors'],
      secretGoal: 'Find someone who matches her energy and prove love can be peaceful',
      archetype: 'The Free Spirit',
    },
  },
  {
    name: 'Devon',
    color: 0x2ECC71,
    skinTone: 'brown',
    hairStyle: 'mohawk',
    hairColor: 0xFFD700,
    accessory: null,
    personality: {
      bio: 'Club promoter from Ibiza. Life of every party. Knows everyone, trusts nobody.',
      traits: ['charismatic', 'unreliable', 'fun', 'impulsive'],
      likes: ['parties', 'new connections', 'spontaneous adventures'],
      dislikes: ['commitment', 'boring people', 'early mornings'],
      quirks: ['Gives everyone nicknames', 'Suggests shots at inappropriate moments'],
      secretGoal: 'Have the most fun possible and leave with a massive following',
      archetype: 'The Entertainer',
    },
  },
  {
    name: 'Aaliyah',
    color: 0xE91E63,
    skinTone: 'dark',
    hairStyle: 'curly',
    hairColor: 0x111111,
    accessory: 'earring',
    personality: {
      bio: 'Trainee doctor who is used to being the smartest in the room. Intimidating but soft inside.',
      traits: ['intelligent', 'guarded', 'ambitious', 'secretly romantic'],
      likes: ['intellectual banter', 'wine', 'people who challenge her'],
      dislikes: ['being underestimated', 'small talk', 'people who rely on looks'],
      quirks: ['Analyses people like patients', 'Quotes obscure poetry'],
      secretGoal: 'Find someone who loves her mind as much as her looks',
      archetype: 'The Intimidator',
    },
  },
  {
    name: 'Kai',
    color: 0x1ABC9C,
    skinTone: 'medium',
    hairStyle: 'spiky',
    hairColor: 0x333333,
    accessory: null,
    personality: {
      bio: 'Professional surfer with a cheeky smile. Laid back but competitive when it counts.',
      traits: ['cheeky', 'competitive', 'easygoing', 'flirty'],
      likes: ['beach sunsets', 'adventure', 'friendly competitions'],
      dislikes: ['jealousy', 'people who take themselves too seriously', 'drama'],
      quirks: ['Uses surf metaphors for everything', 'Winks constantly'],
      secretGoal: 'Find a partner who is down for adventure and doesn\'t try to change him',
      archetype: 'The Cheeky One',
    },
  },
  {
    name: 'Valentina',
    color: 0xFF6B6B,
    skinTone: 'tan',
    hairStyle: 'long',
    hairColor: 0x8B4513,
    accessory: null,
    personality: {
      bio: 'Italian fashion designer who grew up in Milan. Passionate about everything — love included.',
      traits: ['passionate', 'dramatic', 'expressive', 'possessive'],
      likes: ['grand gestures', 'fashion', 'being wooed properly'],
      dislikes: ['laziness in love', 'bad style', 'people who hide their feelings'],
      quirks: ['Gestures wildly when talking', 'Switches to Italian when angry'],
      secretGoal: 'Find a love story worthy of a movie',
      archetype: 'The Passionate One',
    },
  },
  {
    name: 'Zane',
    color: 0x34495E,
    skinTone: 'light',
    hairStyle: 'short',
    hairColor: 0x4A3728,
    accessory: null,
    personality: {
      bio: 'Firefighter and part-time model. Loyal to a fault but has a jealous streak.',
      traits: ['protective', 'jealous', 'brave', 'loyal'],
      likes: ['working out', 'cooking for people', 'acts of service'],
      dislikes: ['liars', 'anyone flirting with his partner', 'being vulnerable'],
      quirks: ['Cooks when stressed', 'Gets territorial at parties'],
      secretGoal: 'Find someone worth being vulnerable for',
      archetype: 'The Loyal One',
    },
  },
  {
    name: 'Nkechi',
    color: 0xFF9800,
    skinTone: 'dark',
    hairStyle: 'bun',
    hairColor: 0x111111,
    accessory: null,
    personality: {
      bio: 'Nigerian-British fashion blogger who is used to getting what she wants. Unapologetically herself.',
      traits: ['sassy', 'confident', 'direct', 'warm'],
      likes: ['good vibes', 'fashion', 'people who keep it real'],
      dislikes: ['two-faced people', 'being told to calm down', 'mediocrity'],
      quirks: ['Reads people with one look', 'Has a catchphrase for every situation'],
      secretGoal: 'Find someone who can handle her energy and match it',
      archetype: 'The Queen Bee',
    },
  },
  {
    name: 'Ravi',
    color: 0x8E44AD,
    skinTone: 'medium',
    hairStyle: 'short',
    hairColor: 0x111111,
    accessory: 'glasses',
    personality: {
      bio: 'Stand-up comedian who uses humour to hide his insecurities. Secretly desperate for real connection.',
      traits: ['funny', 'deflective', 'insecure', 'kind'],
      likes: ['making people laugh', 'late-night chats', 'people who see past the jokes'],
      dislikes: ['being serious', 'rejection', 'people who can\'t take a joke'],
      quirks: ['Turns everything into a bit', 'Does impressions of other islanders'],
      secretGoal: 'Find someone who loves the real him, not just the funny guy',
      archetype: 'The Comedian',
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
