import * as PIXI from 'https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.mjs';
import { characters, Character, ZONES, getZoneCenter } from './characters.js';
import { initUI, updateUI, toggleOperatorPanel, toggleDebugOverlay } from './ui.js';
import { eventBus } from './events.js';
import { startAllAgentLoops } from './agent-loop.js';

const app = new PIXI.Application();

async function init() {
  await app.init({
    width: 1920,
    height: 1080,
    background: 0x1a1a2e,
    antialias: true,
    resolution: 1,
    autoDensity: true,
  });

  const container = document.getElementById('canvas-container');
  container.insertBefore(app.canvas, container.firstChild);

  // Draw room zones
  for (const [name, zone] of Object.entries(ZONES)) {
    const g = new PIXI.Graphics();
    g.roundRect(zone.x, zone.y, zone.w, zone.h, 8).fill({ color: zone.color, alpha: 0.35 });
    // Border
    g.roundRect(zone.x, zone.y, zone.w, zone.h, 8).stroke({ color: zone.color, width: 2, alpha: 0.6 });
    app.stage.addChild(g);

    // Zone label
    const label = new PIXI.Text({
      text: zone.label,
      style: {
        fontSize: 36,
        fontWeight: 'bold',
        fill: 0xffffff,
        alpha: 0.45,
      },
    });
    label.alpha = 0.45;
    label.anchor.set(0.5);
    label.x = zone.x + zone.w / 2;
    label.y = zone.y + zone.h / 2;
    app.stage.addChild(label);
  }

  // Spawn characters
  for (const char of characters) {
    const sprite = char.createSprite();
    app.stage.addChild(sprite);
  }

  // Init UI
  initUI(app, characters);

  // Game loop
  app.ticker.add(() => {
    // Update character positions
    for (const char of characters) {
      char.update();
    }

    // Y-sort: characters lower on screen render on top
    const sortable = characters.filter(c => c.sprite);
    sortable.sort((a, b) => a.y - b.y);
    for (let i = 0; i < sortable.length; i++) {
      if (sortable[i].sprite.parent) {
        sortable[i].sprite.zIndex = i;
      }
    }
    app.stage.sortableChildren = true;

    // Update HUD
    updateUI();
  });

  // Keyboard handlers
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === '`') {
      e.preventDefault();
      toggleOperatorPanel((text) => {
        console.log('[Operator]', text);
      });
    }

    if (e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      toggleDebugOverlay();
    }
  });

  // Seed initial ticker
  eventBus.emit('character:move', { character: characters[0], zone: characters[0].currentZone });

  // Start autonomous AI agent loops for each character
  startAllAgentLoops(characters);

  console.log('AgentStream initialized');
}

init().catch(console.error);

export { app };
export { getZoneCenter as getZonePosition } from './characters.js';
