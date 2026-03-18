import * as PIXI from 'https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.mjs';
import { eventBus } from './events.js';
import { getResponseStats } from './ai-brain.js';

let _app = null;
let _characters = [];
const activeBubbles = [];
const MAX_TICKER_ITEMS = 10;

export function initUI(app, characters) {
  _app = app;
  _characters = characters;

  // Build HUD right — character statuses
  _updateHudRight();

  // Listen for events to drive ticker + speech bubbles
  eventBus.on('character:speak', ({ character, text }) => {
    showSpeechBubble(character, text);
    updateTicker(`${character.name}: "${text}"`);
  });

  eventBus.on('character:move', ({ character, zone }) => {
    updateTicker(`${character.name} moved to ${zone}`);
  });

  eventBus.on('character:mood', ({ character, mood }) => {
    updateTicker(`${character.name} is now ${mood}`);
  });
}

function _updateHudRight() {
  const hudRight = document.getElementById('hud-right');
  if (!hudRight) return;

  const parts = _characters.map(c => {
    return `<span class="char-status"><span class="dot" style="background:${_hexStr(c.color)}"></span>${c.name} ${c.mood}</span>`;
  });
  hudRight.innerHTML = parts.join('');
}

function _hexStr(n) {
  return '#' + n.toString(16).padStart(6, '0');
}

export function showSpeechBubble(character, text) {
  if (!_app || !character.sprite) return;

  const container = new PIXI.Container();

  // Measure text first
  const textObj = new PIXI.Text({
    text,
    style: {
      fontSize: 18,
      fill: 0x111111,
      wordWrap: true,
      wordWrapWidth: 300,
      lineHeight: 22,
    },
  });
  textObj.x = 12;
  textObj.y = 10;

  const padX = 24;
  const padY = 20;
  const bw = Math.min(textObj.width + padX, 340);
  const bh = textObj.height + padY;

  const bg = new PIXI.Graphics();
  bg.roundRect(0, 0, bw, bh, 8).fill({ color: 0xffffff, alpha: 0.9 });
  container.addChild(bg);
  container.addChild(textObj);

  // Position above sprite
  container.x = character.sprite.x - bw / 2;
  container.y = character.sprite.y - 100 - bh;

  _app.stage.addChild(container);
  activeBubbles.push(container);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (container.parent) {
      container.parent.removeChild(container);
    }
    const idx = activeBubbles.indexOf(container);
    if (idx !== -1) activeBubbles.splice(idx, 1);
  }, 5000);
}

export function updateTicker(eventText) {
  const tickerContent = document.getElementById('ticker-content');
  if (!tickerContent) return;

  const item = document.createElement('span');
  item.className = 'ticker-item';
  item.textContent = `\u25CF ${eventText}`;
  tickerContent.appendChild(item);

  // Trim to last N items
  while (tickerContent.children.length > MAX_TICKER_ITEMS) {
    tickerContent.removeChild(tickerContent.firstChild);
  }

  // Let items flow continuously — no animation reset
}

let _operatorCallback = null;

export function toggleOperatorPanel(callback) {
  const panel = document.getElementById('operator-panel');
  if (!panel) return;

  const isVisible = panel.classList.toggle('visible');

  if (isVisible) {
    const input = document.getElementById('operator-input');
    if (input) {
      input.value = '';
      input.focus();
    }
    if (callback) _operatorCallback = callback;
  }
}

// Wire up operator panel submit
function _initOperatorPanel() {
  const input = document.getElementById('operator-input');
  const btn = document.getElementById('operator-submit');
  const panel = document.getElementById('operator-panel');

  if (!input || !btn) return;

  const submit = () => {
    const text = input.value.trim();
    if (!text) return;
    if (_operatorCallback) _operatorCallback(text);
    eventBus.emit('operator:command', { text });
    updateTicker(`[OPERATOR] ${text}`);
    input.value = '';
    panel.classList.remove('visible');
  };

  btn.addEventListener('click', submit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
    if (e.key === 'Escape') {
      panel.classList.remove('visible');
    }
  });
}

// Call once on module load
_initOperatorPanel();

export function toggleDebugOverlay() {
  const overlay = document.getElementById('debug-overlay');
  if (!overlay) return;
  overlay.classList.toggle('visible');
}

function _renderDebugOverlay() {
  const overlay = document.getElementById('debug-overlay');
  if (!overlay || !overlay.classList.contains('visible')) return;

  let html = '<h3>DEBUG INFO</h3>';
  for (const c of _characters) {
    html += `<div class="debug-char">`;
    html += `<strong style="color:${_hexStr(c.color)}">${c.name}</strong><br>`;
    html += `Zone: ${c.currentZone}<br>`;
    html += `Pos: (${Math.round(c.x)}, ${Math.round(c.y)})<br>`;
    html += `Target: (${Math.round(c.targetX)}, ${Math.round(c.targetY)})<br>`;
    html += `Mood: ${c.mood}<br>`;
    html += `Moving: ${c.isMoving}<br>`;
    if (c.lastThought) {
      html += `Thought: ${c.lastThought}<br>`;
    }
    if (c.recentActions.length > 0) {
      html += `Last action: ${c.recentActions[c.recentActions.length - 1]}<br>`;
    }
    const stats = getResponseStats().get(c.name);
    if (stats) {
      html += `API: ${Math.round(stats.lastResponseTime)}ms (avg ${Math.round(stats.avgResponseTime)}ms, ${stats.requestCount} reqs)<br>`;
    }
    html += `</div>`;
  }
  overlay.innerHTML = html;
}

let _lastHudState = '';

export function updateUI() {
  // Only rebuild HUD when character state actually changes
  const hudState = _characters.map(c => `${c.name}${c.mood}${c.currentZone}`).join('|');
  if (hudState !== _lastHudState) {
    _lastHudState = hudState;
    _updateHudRight();
  }

  // Debug overlay only updates when visible
  _renderDebugOverlay();
}

export { activeBubbles };
