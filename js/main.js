import * as PIXI from 'https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.mjs';
import { characters, setCharacters, createDefaultCharacters, createRandomCast, createCharactersFromConfig, ZONES, getZoneCenter, SKIN_TONES, HAIR_STYLES } from './characters.js';
import { initUI, updateUI, toggleDebugOverlay } from './ui.js';
import { eventBus, updateDayCycle, worldState, coupleUp } from './events.js';
import { startAllAgentLoops } from './agent-loop.js';
import { drawAllRooms, updateAmbient } from './room-renderer.js';
import { initEffects, updateEffects } from './effects.js';
import { initConfessional } from './confessional.js';
import { initCamera, updateCamera, setCameraMode } from './camera.js';

const app = new PIXI.Application();
let isPaused = false;
let agentLoopsStarted = false;

async function init() {
  await app.init({
    width: 1920,
    height: 1080,
    background: 0x0a0520,
    antialias: true,
    resolution: 1,
    autoDensity: true,
  });

  const container = document.getElementById('canvas-container');
  container.insertBefore(app.canvas, container.firstChild);

  // Auto-generate random cast — skip setup modal
  const randomCast = createRandomCast(4);
  setCharacters(randomCast);

  startShow();
}

async function startShow() {
  // Draw rooms with image backgrounds
  await drawAllRooms(app.stage);

  // Init effects system (particles, world object visuals)
  initEffects(app.stage);

  // Spawn characters
  const chars = characters;
  for (const char of chars) {
    const sprite = char.createSprite();
    app.stage.addChild(sprite);
  }

  // Init UI
  initUI(app, chars);

  // Init confessional system (Beach Hut)
  initConfessional(chars);

  // Init camera system (security camera overlays)
  initCamera(app, app.stage);

  // Initial coupling — Day 1 ceremony (pair up characters)
  if (chars.length >= 2) {
    for (let i = 0; i < chars.length - 1; i += 2) {
      coupleUp(chars[i].name, chars[i + 1].name);
    }
  }

  // Pause button
  const pauseBtn = document.getElementById('pause-btn');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', togglePause);
  }

  // Recast button
  const recastBtn = document.getElementById('recast-btn');
  if (recastBtn) {
    recastBtn.addEventListener('click', () => {
      location.reload();
    });
  }

  // Camera mode buttons
  const camBtns = document.querySelectorAll('.cam-btn');
  camBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      const room = btn.dataset.room || null;
      camBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setCameraMode(mode, room);
    });
  });

  // Game loop
  app.ticker.add((ticker) => {
    const delta = ticker.deltaTime;

    // Camera transitions always run — even when paused
    updateCamera(delta);

    if (isPaused) return;

    for (const char of chars) {
      char.update(delta);
    }

    // Y-sort
    const sortable = chars.filter(c => c.sprite);
    sortable.sort((a, b) => a.y - b.y);
    for (let i = 0; i < sortable.length; i++) {
      if (sortable[i].sprite.parent) {
        sortable[i].sprite.zIndex = 100 + i;
      }
    }
    app.stage.sortableChildren = true;

    // Ambient room animations
    updateAmbient(delta);

    // World object effects (fire, meteor, etc.)
    updateEffects(delta);

    // Day/night cycle
    updateDayCycle();

    // Update day display
    const dayEl = document.getElementById('day-cycle');
    if (dayEl) {
      const phase = worldState.timeOfDay.charAt(0).toUpperCase() + worldState.timeOfDay.slice(1);
      dayEl.textContent = `Day ${worldState.dayNumber} — ${phase}`;
    }

    updateUI();
  });

  // Keyboard
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      toggleDebugOverlay();
    }
    if (e.key === ' ') {
      e.preventDefault();
      togglePause();
    }
  });

  // Seed initial event
  eventBus.emit('character:move', { character: chars[0], zone: chars[0].currentZone });

  // Start AI loops
  if (!agentLoopsStarted) {
    startAllAgentLoops(chars);
    agentLoopsStarted = true;
  }

  // Listen for "I'VE GOT A TEXT!" notifications
  eventBus.on('day:phaseChange', ({ day, phase }) => {
    showTextNotification(`Day ${day} — ${phase.charAt(0).toUpperCase() + phase.slice(1)} in the villa`);
  });

  eventBus.on('ceremony:recoupling:start', () => {
    showTextNotification('🔥 RECOUPLING CEREMONY 🔥');
  });

  eventBus.on('bombshell:arrival', ({ name }) => {
    showTextNotification(`💣 BOMBSHELL ALERT: ${name} has entered the villa!`);
  });

  eventBus.on('contestant:dumped', ({ name }) => {
    showTextNotification(`💔 ${name} has been dumped from the island`);
  });

  console.log('Love Island: AI Villa initialized');
}

function togglePause() {
  isPaused = !isPaused;
  const btn = document.getElementById('pause-btn');
  if (btn) {
    btn.textContent = isPaused ? '▶ Resume' : '⏸ Pause';
    btn.classList.toggle('paused', isPaused);
  }
  // Pause/resume agent loops
  eventBus.emit(isPaused ? 'simulation:pause' : 'simulation:resume');
}

// Expose pause state for agent-loop
export function getIsPaused() { return isPaused; }

function showTextNotification(text) {
  const el = document.getElementById('text-notification');
  if (!el) return;
  el.textContent = `📱 ${text}`;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 4000);
}

function showSetupModal() {
  const modal = document.getElementById('setup-modal');
  if (!modal) return;
  modal.classList.add('visible');

  // Populate hair style dropdowns
  const hairSelects = modal.querySelectorAll('.hair-style-select');
  hairSelects.forEach(sel => {
    HAIR_STYLES.forEach(style => {
      const opt = document.createElement('option');
      opt.value = style;
      opt.textContent = style.charAt(0).toUpperCase() + style.slice(1);
      sel.appendChild(opt);
    });
  });

  // Populate skin tone buttons
  const skinGroups = modal.querySelectorAll('.skin-tone-group');
  skinGroups.forEach(group => {
    Object.entries(SKIN_TONES).forEach(([name, hex]) => {
      const btn = document.createElement('button');
      btn.className = 'skin-btn';
      btn.dataset.tone = name;
      btn.style.background = '#' + hex.toString(16).padStart(6, '0');
      btn.title = name;
      if (name === 'medium') btn.classList.add('selected');
      btn.addEventListener('click', () => {
        group.querySelectorAll('.skin-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
      group.appendChild(btn);
    });
  });

  // Set defaults
  const defaults = [
    { name: 'Alex', color: '#E74C3C', hairColor: '#4A3728' },
    { name: 'Maya', color: '#2ECC71', hairColor: '#111111' },
    { name: 'Jordan', color: '#3498DB', hairColor: '#222222' },
  ];
  const cards = modal.querySelectorAll('.setup-card');
  cards.forEach((card, i) => {
    const d = defaults[i];
    card.querySelector('.char-name-input').value = d.name;
    card.querySelector('.char-color-input').value = d.color;
    card.querySelector('.hair-color-input').value = d.hairColor;
  });

  // Start Show button
  const startBtn = document.getElementById('start-show-btn');
  startBtn.addEventListener('click', () => {
    const configs = [];
    cards.forEach((card, i) => {
      const name = card.querySelector('.char-name-input').value.trim() || defaults[i].name;
      const color = card.querySelector('.char-color-input').value;
      const hairColor = card.querySelector('.hair-color-input').value;
      const hairStyle = card.querySelector('.hair-style-select').value;
      const skinGroup = card.querySelector('.skin-tone-group');
      const selectedSkin = skinGroup.querySelector('.skin-btn.selected');
      const skinTone = selectedSkin ? selectedSkin.dataset.tone : 'medium';
      const personality = card.querySelector('.personality-input').value.trim() || '';
      const accessory = card.querySelector('.accessory-select').value;

      configs.push({ name, color, hairColor, hairStyle, skinTone, personality: personality || undefined, accessory: accessory || null });
    });

    localStorage.setItem('agentstream_characters', JSON.stringify(configs));

    const newChars = createCharactersFromConfig(configs);
    setCharacters(newChars);

    modal.classList.remove('visible');
    startShow();
  });
}

init().catch(console.error);

export { app };
export { getZoneCenter as getZonePosition } from './characters.js';
