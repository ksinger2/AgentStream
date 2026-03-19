import * as PIXI from 'https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.mjs';

export class SpriteAnimator {
  constructor(characterId, metadata) {
    this._characterId = characterId;
    this._metadata = metadata;
    this._animations = {};       // name -> PIXI.Texture[]
    this._currentAnim = null;
    this._currentName = null;
    this._frameIndex = 0;
    this._elapsed = 0;
    this._sprite = null;
    this._stopped = false;
  }

  async load() {
    const { frameWidth, frameHeight, animations } = this._metadata;
    const basePath = `/assets/characters/${this._characterId}`;

    // Load each animation's sprite sheet
    for (const [name, anim] of Object.entries(animations)) {
      const sheetUrl = `${basePath}/${name}.png`;
      try {
        const texture = await PIXI.Assets.load(sheetUrl);
        this._animations[name] = this._sliceFrames(texture, frameWidth, frameHeight, anim.frames);
      } catch {
        // Animation sheet not found — skip
      }
    }

    // Create the animated sprite with the first available animation
    const firstAvailable = Object.keys(this._animations)[0];
    if (firstAvailable) {
      this._sprite = new PIXI.AnimatedSprite(this._animations[firstAvailable]);
      this._sprite.animationSpeed = 0; // We drive frames manually
      this._sprite.loop = false;
      this._currentName = firstAvailable;
      this._currentAnim = this._metadata.animations[firstAvailable];
    } else {
      throw new Error(`No animation sheets loaded for ${this._characterId}`);
    }
  }

  _sliceFrames(texture, frameW, frameH, count) {
    const frames = [];
    const baseTexture = texture.source || texture.baseTexture || texture;
    for (let i = 0; i < count; i++) {
      const rect = new PIXI.Rectangle(i * frameW, 0, frameW, frameH);
      frames.push(new PIXI.Texture({ source: baseTexture, frame: rect }));
    }
    return frames;
  }

  play(name) {
    if (name === this._currentName && !this._stopped) return;
    if (!this._animations[name]) return; // Animation not loaded

    this._currentName = name;
    this._currentAnim = this._metadata.animations[name];
    this._frameIndex = 0;
    this._elapsed = 0;
    this._stopped = false;

    if (this._sprite) {
      this._sprite.textures = this._animations[name];
      this._sprite.gotoAndStop(0);
    }
  }

  update(delta) {
    if (!this._sprite || !this._currentAnim || this._stopped) return;

    const fps = this._currentAnim.fps || 6;
    const frameDuration = 60 / fps; // delta is in frames at 60fps
    this._elapsed += delta;

    if (this._elapsed >= frameDuration) {
      this._elapsed -= frameDuration;
      this._frameIndex++;

      const totalFrames = this._currentAnim.frames;

      if (this._frameIndex >= totalFrames) {
        if (this._currentAnim.loop) {
          this._frameIndex = 0;
        } else if (this._currentAnim.holdLastFrame) {
          this._frameIndex = totalFrames - 1;
          this._stopped = true;
        } else if (this._currentAnim.returnTo) {
          this.play(this._currentAnim.returnTo);
          return;
        } else {
          this._frameIndex = totalFrames - 1;
          this._stopped = true;
        }
      }

      this._sprite.gotoAndStop(this._frameIndex);
    }
  }

  getDisplayObject() {
    return this._sprite;
  }
}
