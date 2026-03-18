import * as PIXI from 'https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.mjs';
import { eventBus } from './events.js';

// Zone positions defined here to avoid circular deps — main.js also uses these
const ZONE_GAP = 16;
const CANVAS_W = 1920;
const TOP_INSET = 72;      // clear HUD
const BOTTOM_INSET = 1040; // clear ticker
const USABLE_H = BOTTOM_INSET - TOP_INSET;
const HALF_W = CANVAS_W / 2;
const HALF_H = USABLE_H / 2;

export const ZONES = {
  Kitchen: {
    x: 0,
    y: TOP_INSET,
    w: HALF_W - ZONE_GAP / 2,
    h: HALF_H - ZONE_GAP / 2,
    color: 0xD4A017,
    label: 'Kitchen',
  },
  'Living Room': {
    x: HALF_W + ZONE_GAP / 2,
    y: TOP_INSET,
    w: HALF_W - ZONE_GAP / 2,
    h: HALF_H - ZONE_GAP / 2,
    color: 0x4A6B8A,
    label: 'Living Room',
  },
  Bedroom: {
    x: 0,
    y: TOP_INSET + HALF_H + ZONE_GAP / 2,
    w: HALF_W - ZONE_GAP / 2,
    h: HALF_H - ZONE_GAP / 2,
    color: 0x6B4A8A,
    label: 'Bedroom',
  },
  Bathroom: {
    x: HALF_W + ZONE_GAP / 2,
    y: TOP_INSET + HALF_H + ZONE_GAP / 2,
    w: HALF_W - ZONE_GAP / 2,
    h: HALF_H - ZONE_GAP / 2,
    color: 0x4A8A7A,
    label: 'Bathroom',
  },
};

export function getZoneCenter(zoneName) {
  const z = ZONES[zoneName];
  if (!z) return { x: 960, y: 540 };
  return { x: z.x + z.w / 2, y: z.y + z.h / 2 };
}

export class Character {
  constructor({ name, color, personality, startZone }) {
    this.name = name;
    this.color = color;
    this.personality = personality;
    this.mood = '😐';
    this.currentZone = startZone;
    this.recentActions = [];
    this.memory = [];
    this.relationships = {};
    this.isMoving = false;

    const center = getZoneCenter(startZone);
    const offset = () => (Math.random() - 0.5) * 120;
    this.x = center.x + offset();
    this.y = center.y + offset();
    this.targetX = this.x;
    this.targetY = this.y;

    this.sprite = null;
    this._nameText = null;
    this._moodText = null;
  }

  createSprite() {
    const container = new PIXI.Container();

    // Body — rounded rect with white outline
    const body = new PIXI.Graphics();
    body.roundRect(-36, -48, 72, 96, 14).fill(this.color).stroke({ color: 0xffffff, width: 2 });
    container.addChild(body);

    // Mood emoji above
    this._moodText = new PIXI.Text({
      text: this.mood,
      style: { fontSize: 28, align: 'center' },
    });
    this._moodText.anchor.set(0.5, 1);
    this._moodText.y = -54;
    container.addChild(this._moodText);

    // Name below
    this._nameText = new PIXI.Text({
      text: this.name,
      style: {
        fontSize: 16,
        fontWeight: 'bold',
        fill: 0xffffff,
        align: 'center',
        dropShadow: { color: 0x000000, blur: 4, distance: 2 },
      },
    });
    this._nameText.anchor.set(0.5, 0);
    this._nameText.y = 52;
    container.addChild(this._nameText);

    container.x = this.x;
    container.y = this.y;
    this.sprite = container;
    return container;
  }

  moveTo(zoneName) {
    const center = getZoneCenter(zoneName);
    const offset = () => (Math.random() - 0.5) * 160;
    this.targetX = center.x + offset();
    this.targetY = center.y + offset();
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
    if (this._moodText) {
      this._moodText.text = mood;
    }
    eventBus.emit('character:mood', { character: this, mood });
  }

  getPerception(allCharacters, worldState) {
    const lines = [];
    lines.push(`I am ${this.name}. I'm in the ${this.currentZone}. My mood: ${this.mood}`);
    lines.push(`Personality: ${this.personality}`);

    for (const other of allCharacters) {
      if (other === this) continue;
      lines.push(`${other.name} is in the ${other.currentZone}, mood: ${other.mood}`);
    }

    if (worldState && worldState.recentEvents && worldState.recentEvents.length > 0) {
      lines.push('Recent events:');
      for (const e of worldState.recentEvents.slice(-5)) {
        lines.push(`  - ${e}`);
      }
    }

    if (this.recentActions.length > 0) {
      lines.push('My recent actions:');
      for (const a of this.recentActions.slice(-3)) {
        lines.push(`  - ${a}`);
      }
    }

    return lines.join('\n');
  }

  update() {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 2) {
      // Ease-out interpolation — decelerates as character approaches target
      this.x += dx * 0.05;
      this.y += dy * 0.05;
      this.isMoving = true;
    } else {
      this.isMoving = false;
    }

    if (this.sprite) {
      this.sprite.x = this.x;
      this.sprite.y = this.y;
    }
  }
}

// Pre-built character instances
export const characters = [
  new Character({
    name: 'Alex',
    color: 0xE74C3C,
    personality: 'Ambitious tech bro, always pitching startup ideas',
    startZone: 'Kitchen',
  }),
  new Character({
    name: 'Maya',
    color: 0x2ECC71,
    personality: 'Chill artist, passive-aggressive when annoyed',
    startZone: 'Living Room',
  }),
  new Character({
    name: 'Jordan',
    color: 0x3498DB,
    personality: 'Conspiracy theorist, surprisingly insightful',
    startZone: 'Bedroom',
  }),
];
