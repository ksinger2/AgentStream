// Particle effects system + world object visuals
import * as PIXI from 'https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.mjs';
import { ZONES } from './characters.js';
import { eventBus } from './events.js';

const activeEffects = [];
let effectsContainer = null;

export function initEffects(stage) {
  effectsContainer = new PIXI.Container();
  effectsContainer.zIndex = 50;
  stage.addChild(effectsContainer);

  eventBus.on('world:objectCreated', ({ worldObject }) => {
    spawnEffect(worldObject);
  });

  eventBus.on('world:objectRemoved', ({ id }) => {
    removeEffect(id);
  });
}

export function updateEffects(delta) {
  for (let i = activeEffects.length - 1; i >= 0; i--) {
    const effect = activeEffects[i];
    effect.update(delta);

    // Auto-expire after duration
    if (effect.duration > 0) {
      effect.elapsed += delta;
      if (effect.elapsed > effect.duration) {
        effect.destroy();
        activeEffects.splice(i, 1);
      }
    }
  }
}

function spawnEffect(worldObject) {
  const zone = ZONES[worldObject.room];
  if (!zone) return;

  let effect;
  switch (worldObject.type) {
    case 'fire': effect = new FireEffect(zone, worldObject.id); break;
    case 'meteor': effect = new MeteorEffect(zone, worldObject.id); break;
    case 'flood': effect = new FloodEffect(zone, worldObject.id); break;
    case 'darkness': effect = new DarknessEffect(zone, worldObject.id); break;
    case 'explosion': effect = new ExplosionEffect(zone, worldObject.id); break;
    case 'ice': effect = new IceEffect(zone, worldObject.id); break;
    case 'gas': effect = new GasEffect(zone, worldObject.id); break;
    case 'earthquake': effect = new EarthquakeEffect(zone, worldObject.id); break;
    case 'treasure': effect = new TreasureEffect(zone, worldObject.id); break;
    case 'portal': effect = new PortalEffect(zone, worldObject.id); break;
    default: effect = new GenericEffect(zone, worldObject.id, worldObject.type); break;
  }

  if (effectsContainer) effectsContainer.addChild(effect.container);
  activeEffects.push(effect);
}

function removeEffect(id) {
  const idx = activeEffects.findIndex(e => e.id === id);
  if (idx !== -1) {
    activeEffects[idx].destroy();
    activeEffects.splice(idx, 1);
  }
}

// ─── Base Effect ───
class BaseEffect {
  constructor(zone, id, duration = 0) {
    this.zone = zone;
    this.id = id;
    this.container = new PIXI.Container();
    this.particles = [];
    this.tick = 0;
    this.duration = duration; // 0 = permanent until removed
    this.elapsed = 0;
  }

  update(delta) { this.tick += delta; }

  destroy() {
    if (this.container.parent) this.container.parent.removeChild(this.container);
    this.container.destroy({ children: true });
  }
}

// ─── Fire ───
class FireEffect extends BaseEffect {
  constructor(zone, id) {
    super(zone, id);
    this.graphics = new PIXI.Graphics();
    this.container.addChild(this.graphics);

    // Fire overlay tint
    this.overlay = new PIXI.Graphics();
    this.overlay.rect(zone.x, zone.y, zone.w, zone.h).fill({ color: 0xFF2200, alpha: 0.08 });
    this.container.addChild(this.overlay);

    // Init particles
    for (let i = 0; i < 60; i++) {
      this.particles.push(this._newParticle());
    }
  }

  _newParticle() {
    const { x, y, w, h } = this.zone;
    return {
      x: x + 40 + Math.random() * (w - 80),
      y: y + h - 20 - Math.random() * 40,
      vx: (Math.random() - 0.5) * 1.2,
      vy: -1.5 - Math.random() * 3,
      life: Math.random() * 50,
      maxLife: 40 + Math.random() * 50,
      size: 3 + Math.random() * 8,
      color: [0xFF4500, 0xFF6600, 0xFFAA00, 0xFF2200, 0xFFCC00][Math.floor(Math.random() * 5)],
    };
  }

  update(delta) {
    super.update(delta);
    this.graphics.clear();

    // Flickering overlay
    this.overlay.alpha = 0.06 + Math.sin(this.tick * 0.1) * 0.04;

    for (const p of this.particles) {
      p.life += delta;
      if (p.life > p.maxLife) {
        Object.assign(p, this._newParticle());
        p.life = 0;
      }
      p.x += p.vx * delta * 0.5;
      p.y += p.vy * delta * 0.5;
      p.vx += (Math.random() - 0.5) * 0.3;

      const t = p.life / p.maxLife;
      const alpha = t < 0.2 ? t * 5 : (1 - t) * 1.2;
      const size = p.size * (1 - t * 0.5);

      this.graphics.circle(p.x, p.y, size).fill({ color: p.color, alpha: Math.max(0, Math.min(1, alpha)) });
    }

    // Smoke above fire
    for (let i = 0; i < 8; i++) {
      const smokeT = (this.tick * 0.02 + i * 0.4) % 1;
      const sx = this.zone.x + this.zone.w * (0.2 + i * 0.08);
      const sy = this.zone.y + this.zone.h * 0.3 - smokeT * this.zone.h * 0.4;
      const smokeAlpha = (1 - smokeT) * 0.15;
      const smokeSize = 8 + smokeT * 20;
      this.graphics.circle(sx, sy, smokeSize).fill({ color: 0x444444, alpha: smokeAlpha });
    }
  }
}

// ─── Meteor ───
class MeteorEffect extends BaseEffect {
  constructor(zone, id) {
    super(zone, id);
    this.graphics = new PIXI.Graphics();
    this.container.addChild(this.graphics);
    this.impactX = zone.x + zone.w * (0.3 + Math.random() * 0.4);
    this.impactY = zone.y + zone.h * (0.4 + Math.random() * 0.3);
    this.phase = 'falling'; // falling -> impact -> burning
    this.fallY = zone.y - 200;
    this.debrisParticles = [];
    this.smokeParticles = [];

    for (let i = 0; i < 30; i++) {
      this.smokeParticles.push({
        x: this.impactX + (Math.random() - 0.5) * 80,
        y: this.impactY + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -0.5 - Math.random() * 1.5,
        size: 5 + Math.random() * 15,
        life: Math.random() * 60,
        maxLife: 60 + Math.random() * 40,
      });
    }
  }

  update(delta) {
    super.update(delta);
    this.graphics.clear();

    if (this.phase === 'falling' && this.tick < 60) {
      // Meteor falling
      const t = Math.min(this.tick / 60, 1);
      const mx = this.impactX - 100 + t * 100;
      const my = this.fallY + t * (this.impactY - this.fallY);

      // Trail
      for (let i = 0; i < 8; i++) {
        const tt = Math.max(0, t - i * 0.03);
        const tx = this.impactX - 100 + tt * 100;
        const ty = this.fallY + tt * (this.impactY - this.fallY);
        this.graphics.circle(tx, ty, 12 - i * 1.2).fill({ color: 0xFF4400, alpha: 0.6 - i * 0.07 });
      }

      // Meteor body
      this.graphics.circle(mx, my, 16).fill({ color: 0x8B4513 });
      this.graphics.circle(mx - 3, my - 3, 6).fill({ color: 0xFF6600, alpha: 0.7 });

      if (t >= 1) {
        this.phase = 'impact';
        // Spawn debris
        for (let i = 0; i < 20; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 + Math.random() * 5;
          this.debrisParticles.push({
            x: this.impactX, y: this.impactY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 3,
            life: 0, maxLife: 30 + Math.random() * 30,
            size: 2 + Math.random() * 4,
            color: [0xFF4400, 0x8B4513, 0xFFAA00, 0x666666][Math.floor(Math.random() * 4)],
          });
        }
      }
    } else {
      // Impact/burning phase
      // Crater
      this.graphics.ellipse(this.impactX, this.impactY + 5, 50, 20).fill({ color: 0x1a1008, alpha: 0.8 });
      this.graphics.ellipse(this.impactX, this.impactY + 3, 40, 15).fill({ color: 0x332200, alpha: 0.6 });

      // Meteor rock
      const glow = 0.5 + Math.sin(this.tick * 0.08) * 0.2;
      this.graphics.circle(this.impactX, this.impactY - 8, 18).fill({ color: 0x8B4513 });
      this.graphics.circle(this.impactX, this.impactY - 8, 22).fill({ color: 0xFF4400, alpha: glow * 0.3 });
      this.graphics.circle(this.impactX - 4, this.impactY - 12, 6).fill({ color: 0xFF6600, alpha: glow * 0.5 });

      // Debris particles
      for (const d of this.debrisParticles) {
        d.life += delta;
        if (d.life < d.maxLife) {
          d.x += d.vx * delta * 0.3;
          d.y += d.vy * delta * 0.3;
          d.vy += 0.15 * delta;
          const a = 1 - d.life / d.maxLife;
          this.graphics.circle(d.x, d.y, d.size * a).fill({ color: d.color, alpha: a });
        }
      }

      // Smoke
      for (const s of this.smokeParticles) {
        s.life += delta;
        if (s.life > s.maxLife) { s.life = 0; s.y = this.impactY; s.x = this.impactX + (Math.random() - 0.5) * 60; }
        s.x += s.vx * delta * 0.3;
        s.y += s.vy * delta * 0.3;
        const t = s.life / s.maxLife;
        this.graphics.circle(s.x, s.y, s.size * (0.5 + t)).fill({ color: 0x555555, alpha: (1 - t) * 0.2 });
      }

      // Scorch marks
      this.graphics.ellipse(this.impactX, this.impactY + 10, 60, 25).fill({ color: 0x111100, alpha: 0.3 });
    }
  }
}

// ─── Flood ───
class FloodEffect extends BaseEffect {
  constructor(zone, id) {
    super(zone, id);
    this.graphics = new PIXI.Graphics();
    this.container.addChild(this.graphics);
  }

  update(delta) {
    super.update(delta);
    this.graphics.clear();
    const { x, y, w, h } = this.zone;
    const waterLevel = h * 0.35;

    // Water body
    this.graphics.rect(x, y + h - waterLevel, w, waterLevel)
      .fill({ color: 0x1E90FF, alpha: 0.25 });

    // Waves
    for (let wave = 0; wave < 3; wave++) {
      const waveY = y + h - waterLevel + wave * 8;
      for (let wx = 0; wx < w; wx += 4) {
        const wy = Math.sin((wx + this.tick * (2 + wave)) * 0.03) * (4 - wave);
        this.graphics.circle(x + wx, waveY + wy, 2).fill({ color: 0x4FC3F7, alpha: 0.3 - wave * 0.08 });
      }
    }

    // Ripples
    for (let i = 0; i < 5; i++) {
      const rx = x + (w * 0.15) + (i * w * 0.18);
      const ry = y + h - waterLevel * 0.5;
      const rippleT = (this.tick * 0.03 + i * 0.6) % 1;
      const rs = 5 + rippleT * 20;
      this.graphics.circle(rx, ry, rs).stroke({ color: 0x87CEEB, width: 1, alpha: (1 - rippleT) * 0.3 });
    }
  }
}

// ─── Darkness ───
class DarknessEffect extends BaseEffect {
  constructor(zone, id) {
    super(zone, id);
    this.graphics = new PIXI.Graphics();
    this.container.addChild(this.graphics);
  }

  update(delta) {
    super.update(delta);
    this.graphics.clear();
    const { x, y, w, h } = this.zone;
    const flicker = 0.7 + Math.sin(this.tick * 0.04) * 0.05;
    this.graphics.rect(x, y, w, h).fill({ color: 0x000000, alpha: flicker });

    // Eerie glow spots
    for (let i = 0; i < 3; i++) {
      const gx = x + w * (0.2 + i * 0.3);
      const gy = y + h * (0.4 + Math.sin(this.tick * 0.02 + i) * 0.1);
      this.graphics.circle(gx, gy, 15 + Math.sin(this.tick * 0.05 + i * 2) * 5)
        .fill({ color: 0x4444FF, alpha: 0.06 });
    }
  }
}

// ─── Explosion ───
class ExplosionEffect extends BaseEffect {
  constructor(zone, id) {
    super(zone, id, 180); // Auto-expire after ~3s at 60fps
    this.graphics = new PIXI.Graphics();
    this.container.addChild(this.graphics);
    this.cx = zone.x + zone.w / 2;
    this.cy = zone.y + zone.h / 2;
    this.shrapnel = [];
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.shrapnel.push({
        x: this.cx, y: this.cy,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 5,
        color: [0xFF4400, 0xFFAA00, 0xFF0000, 0xFFFF00][Math.floor(Math.random() * 4)],
      });
    }
  }

  update(delta) {
    super.update(delta);
    this.graphics.clear();
    const t = Math.min(this.tick / 30, 1);

    // Blast rings
    for (let ring = 0; ring < 3; ring++) {
      const rt = Math.max(0, t - ring * 0.15);
      if (rt > 0) {
        const radius = rt * 120;
        const alpha = (1 - rt) * 0.4;
        this.graphics.circle(this.cx, this.cy, radius)
          .stroke({ color: 0xFFAA00, width: 4 - ring, alpha });
      }
    }

    // Flash
    if (this.tick < 10) {
      this.graphics.circle(this.cx, this.cy, 60 - this.tick * 4)
        .fill({ color: 0xFFFFFF, alpha: (10 - this.tick) / 10 * 0.6 });
    }

    // Shrapnel
    for (const s of this.shrapnel) {
      s.x += s.vx * delta * 0.4;
      s.y += s.vy * delta * 0.4;
      s.vy += 0.08 * delta;
      const fadeT = this.elapsed / this.duration;
      this.graphics.circle(s.x, s.y, s.size * (1 - fadeT))
        .fill({ color: s.color, alpha: 1 - fadeT });
    }

    // Scorch mark (permanent-ish)
    if (this.tick > 20) {
      this.graphics.ellipse(this.cx, this.cy, 40, 25)
        .fill({ color: 0x111100, alpha: 0.4 });
    }
  }
}

// ─── Ice ───
class IceEffect extends BaseEffect {
  constructor(zone, id) {
    super(zone, id);
    this.graphics = new PIXI.Graphics();
    this.container.addChild(this.graphics);
    // Generate ice crystal positions once
    this.crystals = [];
    for (let i = 0; i < 15; i++) {
      this.crystals.push({
        x: zone.x + Math.random() * zone.w,
        y: zone.y + Math.random() * zone.h,
        size: 5 + Math.random() * 15,
        angle: Math.random() * Math.PI,
      });
    }
  }

  update(delta) {
    super.update(delta);
    this.graphics.clear();
    const { x, y, w, h } = this.zone;

    // Ice overlay
    this.graphics.rect(x, y, w, h).fill({ color: 0x88CCFF, alpha: 0.12 });

    // Frost on edges
    for (let i = 0; i < w; i += 12) {
      const fh = 5 + Math.sin(i * 0.1 + this.tick * 0.02) * 4;
      this.graphics.rect(x + i, y, 10, fh).fill({ color: 0xCCEEFF, alpha: 0.3 });
      this.graphics.rect(x + i, y + h - fh, 10, fh).fill({ color: 0xCCEEFF, alpha: 0.3 });
    }

    // Ice crystals
    for (const c of this.crystals) {
      const sparkle = Math.sin(this.tick * 0.08 + c.angle * 5) * 0.3;
      this.graphics.star(c.x, c.y, 6, c.size, c.size * 0.5, c.angle + this.tick * 0.005)
        .fill({ color: 0xDDEEFF, alpha: 0.3 + sparkle });
    }
  }
}

// ─── Gas/Poison ───
class GasEffect extends BaseEffect {
  constructor(zone, id) {
    super(zone, id);
    this.graphics = new PIXI.Graphics();
    this.container.addChild(this.graphics);
    this.clouds = [];
    for (let i = 0; i < 12; i++) {
      this.clouds.push({
        x: zone.x + Math.random() * zone.w,
        y: zone.y + zone.h * 0.3 + Math.random() * zone.h * 0.6,
        size: 20 + Math.random() * 40,
        speed: 0.2 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  update(delta) {
    super.update(delta);
    this.graphics.clear();

    // Green tint
    this.graphics.rect(this.zone.x, this.zone.y, this.zone.w, this.zone.h)
      .fill({ color: 0x00FF00, alpha: 0.04 + Math.sin(this.tick * 0.03) * 0.02 });

    for (const c of this.clouds) {
      c.x += c.speed * delta * 0.3;
      if (c.x > this.zone.x + this.zone.w + c.size) c.x = this.zone.x - c.size;
      const pulseSize = c.size + Math.sin(this.tick * 0.04 + c.phase) * 8;
      this.graphics.circle(c.x, c.y, pulseSize)
        .fill({ color: 0x44FF44, alpha: 0.08 });
      this.graphics.circle(c.x, c.y, pulseSize * 0.6)
        .fill({ color: 0x88FF88, alpha: 0.05 });
    }
  }
}

// ─── Earthquake ───
class EarthquakeEffect extends BaseEffect {
  constructor(zone, id) {
    super(zone, id, 300); // ~5s
    this.graphics = new PIXI.Graphics();
    this.container.addChild(this.graphics);
    this.cracks = [];
    for (let i = 0; i < 8; i++) {
      const startX = zone.x + Math.random() * zone.w;
      const startY = zone.y + Math.random() * zone.h;
      const points = [{ x: startX, y: startY }];
      for (let j = 0; j < 4 + Math.floor(Math.random() * 4); j++) {
        const last = points[points.length - 1];
        points.push({
          x: last.x + (Math.random() - 0.5) * 60,
          y: last.y + (Math.random() - 0.5) * 60,
        });
      }
      this.cracks.push({ points, width: 1 + Math.random() * 2 });
    }
  }

  update(delta) {
    super.update(delta);
    this.graphics.clear();

    // Screen shake via container offset
    if (this.elapsed < this.duration * 0.7) {
      const intensity = 4 * (1 - this.elapsed / this.duration);
      this.container.x = (Math.random() - 0.5) * intensity;
      this.container.y = (Math.random() - 0.5) * intensity;
    } else {
      this.container.x = 0;
      this.container.y = 0;
    }

    // Cracks appear over time
    const revealT = Math.min(this.tick / 60, 1);
    for (const crack of this.cracks) {
      const pts = crack.points;
      const showPts = Math.ceil(pts.length * revealT);
      if (showPts < 2) continue;
      this.graphics.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < showPts; i++) {
        this.graphics.lineTo(pts[i].x, pts[i].y);
      }
      this.graphics.stroke({ color: 0x222200, width: crack.width, alpha: 0.6 });
    }

    // Dust particles
    if (this.elapsed < this.duration * 0.8) {
      for (let i = 0; i < 10; i++) {
        const dx = this.zone.x + Math.random() * this.zone.w;
        const dy = this.zone.y + Math.random() * this.zone.h;
        this.graphics.circle(dx, dy, 1 + Math.random() * 2)
          .fill({ color: 0xAA9966, alpha: 0.2 * (1 - this.elapsed / this.duration) });
      }
    }
  }
}

// ─── Treasure ───
class TreasureEffect extends BaseEffect {
  constructor(zone, id) {
    super(zone, id);
    this.graphics = new PIXI.Graphics();
    this.container.addChild(this.graphics);
    this.tx = zone.x + zone.w * (0.3 + Math.random() * 0.4);
    this.ty = zone.y + zone.h * (0.5 + Math.random() * 0.2);
  }

  update(delta) {
    super.update(delta);
    this.graphics.clear();

    // Chest
    this.graphics.roundRect(this.tx - 20, this.ty - 10, 40, 25, 4).fill({ color: 0x8B6914 });
    this.graphics.roundRect(this.tx - 20, this.ty - 15, 40, 12, 4).fill({ color: 0x6B4914 }); // lid
    this.graphics.rect(this.tx - 3, this.ty - 8, 6, 8).fill({ color: 0xFFD700 }); // lock

    // Sparkle particles
    for (let i = 0; i < 6; i++) {
      const angle = (this.tick * 0.05 + i * Math.PI / 3) % (Math.PI * 2);
      const dist = 20 + Math.sin(this.tick * 0.08 + i) * 8;
      const sx = this.tx + Math.cos(angle) * dist;
      const sy = this.ty - 5 + Math.sin(angle) * dist * 0.5;
      const sparkleAlpha = 0.3 + Math.sin(this.tick * 0.1 + i * 1.5) * 0.3;
      this.graphics.star(sx, sy, 4, 3, 1.5, this.tick * 0.02 + i)
        .fill({ color: 0xFFD700, alpha: sparkleAlpha });
    }

    // Glow
    this.graphics.circle(this.tx, this.ty - 5, 30)
      .fill({ color: 0xFFD700, alpha: 0.06 + Math.sin(this.tick * 0.06) * 0.03 });
  }
}

// ─── Portal ───
class PortalEffect extends BaseEffect {
  constructor(zone, id) {
    super(zone, id);
    this.graphics = new PIXI.Graphics();
    this.container.addChild(this.graphics);
    this.px = zone.x + zone.w / 2;
    this.py = zone.y + zone.h / 2;
  }

  update(delta) {
    super.update(delta);
    this.graphics.clear();

    // Concentric rings
    for (let ring = 0; ring < 5; ring++) {
      const r = 15 + ring * 12 + Math.sin(this.tick * 0.06 + ring) * 4;
      const a = 0.3 - ring * 0.05;
      const hue = (this.tick * 3 + ring * 30) % 360;
      const color = hslToHex(hue, 80, 50);
      this.graphics.circle(this.px, this.py, r)
        .stroke({ color, width: 3, alpha: a });
    }

    // Center glow
    this.graphics.circle(this.px, this.py, 12)
      .fill({ color: 0xFFFFFF, alpha: 0.15 + Math.sin(this.tick * 0.1) * 0.1 });

    // Orbiting particles
    for (let i = 0; i < 8; i++) {
      const angle = this.tick * 0.04 + i * Math.PI / 4;
      const dist = 35 + Math.sin(this.tick * 0.08 + i * 2) * 10;
      const ox = this.px + Math.cos(angle) * dist;
      const oy = this.py + Math.sin(angle) * dist * 0.6;
      this.graphics.circle(ox, oy, 2).fill({ color: 0xCCAAFF, alpha: 0.6 });
    }
  }
}

// ─── Generic (fallback for unknown types) ───
class GenericEffect extends BaseEffect {
  constructor(zone, id, type) {
    super(zone, id);
    this.type = type;
    this.graphics = new PIXI.Graphics();
    this.container.addChild(this.graphics);

    // Warning indicator
    this.cx = zone.x + zone.w / 2;
    this.cy = zone.y + zone.h / 2;
  }

  update(delta) {
    super.update(delta);
    this.graphics.clear();

    // Pulsing warning circle
    const pulse = 0.5 + Math.sin(this.tick * 0.08) * 0.3;
    this.graphics.circle(this.cx, this.cy, 30)
      .fill({ color: 0xFFAA00, alpha: pulse * 0.15 });
    this.graphics.circle(this.cx, this.cy, 30)
      .stroke({ color: 0xFFAA00, width: 2, alpha: pulse * 0.4 });

    // Exclamation mark
    this.graphics.roundRect(this.cx - 3, this.cy - 15, 6, 18, 2)
      .fill({ color: 0xFFAA00, alpha: 0.7 });
    this.graphics.circle(this.cx, this.cy + 10, 3)
      .fill({ color: 0xFFAA00, alpha: 0.7 });
  }
}

// Helper
function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color);
  };
  return (f(0) << 16) | (f(8) << 8) | f(4);
}

export { activeEffects };
