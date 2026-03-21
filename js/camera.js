// Love Island Camera System — security camera overlays with quad/single/auto modes
import * as PIXI from 'https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.mjs';
import { ZONES } from './characters.js';
import { eventBus } from './events.js';

const ROOM_CAM_LABELS = {
  Kitchen: 'CAM 1 — THE KITCHEN',
  'Living Room': 'CAM 2 — THE FIRE PIT',
  Bedroom: 'CAM 3 — THE BEDROOM',
  Bathroom: 'CAM 4 — THE DAY BEDS',
};

let _app = null;
let _stage = null;
let cameraMode = 'quad'; // 'quad' | 'single' | 'auto'
let activeRoom = null;
let overlayContainer = null;
let roomOverlays = {};
let recDots = {};
let timestamps = {};
let scanlineGraphics = null;

// Transition state
let transitioning = false;
let transitionProgress = 0;
let targetScale = 1;
let targetX = 0;
let targetY = 0;

// Auto-follow: track most recent speech room
let lastSpeechRoom = null;
let lastSpeechTime = 0;

export function initCamera(app, stage) {
  _app = app;
  _stage = stage;

  overlayContainer = new PIXI.Container();
  overlayContainer.zIndex = 500;
  stage.addChild(overlayContainer);

  // Create overlays for each room
  for (const [name, zone] of Object.entries(ZONES)) {
    const overlay = new PIXI.Container();

    // Camera label background
    const labelBg = new PIXI.Graphics();
    labelBg.roundRect(zone.x + 8, zone.y + 6, 260, 24, 4)
      .fill({ color: 0x000000, alpha: 0.6 });
    overlay.addChild(labelBg);

    // Camera label text
    const label = new PIXI.Text({
      text: ROOM_CAM_LABELS[name] || name,
      style: {
        fontSize: 12,
        fontFamily: 'Courier New, monospace',
        fontWeight: '700',
        fill: 0xCCCCCC,
        letterSpacing: 1,
      },
    });
    label.x = zone.x + 14;
    label.y = zone.y + 10;
    overlay.addChild(label);

    // REC indicator
    const recContainer = new PIXI.Container();

    const recDot = new PIXI.Graphics();
    recDot.circle(0, 0, 4).fill({ color: 0xFF0000 });
    recContainer.addChild(recDot);

    const recText = new PIXI.Text({
      text: 'REC',
      style: {
        fontSize: 10,
        fontFamily: 'Courier New, monospace',
        fontWeight: '700',
        fill: 0xFF0000,
        letterSpacing: 1,
      },
    });
    recText.x = 8;
    recText.y = -6;
    recContainer.addChild(recText);

    recContainer.x = zone.x + zone.w - 50;
    recContainer.y = zone.y + 18;
    overlay.addChild(recContainer);
    recDots[name] = recDot;

    // Timestamp
    const ts = new PIXI.Text({
      text: _getTimestamp(),
      style: {
        fontSize: 10,
        fontFamily: 'Courier New, monospace',
        fill: 0x999999,
      },
    });
    ts.x = zone.x + zone.w - 120;
    ts.y = zone.y + zone.h - 20;
    overlay.addChild(ts);
    timestamps[name] = ts;

    // Vignette corners (darkening at edges)
    const vignette = new PIXI.Graphics();
    const vSize = 60;
    // Top-left corner
    vignette.rect(zone.x, zone.y, vSize, vSize).fill({ color: 0x000000, alpha: 0.15 });
    // Top-right corner
    vignette.rect(zone.x + zone.w - vSize, zone.y, vSize, vSize).fill({ color: 0x000000, alpha: 0.15 });
    // Bottom-left corner
    vignette.rect(zone.x, zone.y + zone.h - vSize, vSize, vSize).fill({ color: 0x000000, alpha: 0.15 });
    // Bottom-right corner
    vignette.rect(zone.x + zone.w - vSize, zone.y + zone.h - vSize, vSize, vSize).fill({ color: 0x000000, alpha: 0.15 });
    overlay.addChild(vignette);

    // Scan lines (subtle horizontal lines)
    const scanlines = new PIXI.Graphics();
    for (let sy = 0; sy < zone.h; sy += 4) {
      scanlines.rect(zone.x, zone.y + sy, zone.w, 1)
        .fill({ color: 0x000000, alpha: 0.06 });
    }
    overlay.addChild(scanlines);

    overlayContainer.addChild(overlay);
    roomOverlays[name] = overlay;
  }

  // Listen for speech events to track active room
  eventBus.on('character:speak', ({ character }) => {
    lastSpeechRoom = character.currentZone;
    lastSpeechTime = Date.now();
  });

  // Click on canvas to zoom into room
  _app.canvas.addEventListener('click', (e) => {
    if (transitioning) return;

    const rect = _app.canvas.getBoundingClientRect();
    const scaleX = 1920 / rect.width;
    const scaleY = 1080 / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;

    if (cameraMode === 'single') {
      // Click again to go back to quad
      setCameraMode('quad');
      _updateCamButtons('quad');
      return;
    }

    // Find which room was clicked
    for (const [name, zone] of Object.entries(ZONES)) {
      if (cx >= zone.x && cx <= zone.x + zone.w && cy >= zone.y && cy <= zone.y + zone.h) {
        setCameraMode('single', name);
        _updateCamButtons('single');
        break;
      }
    }
  });

  // ESC to return to quad view
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cameraMode === 'single') {
      setCameraMode('quad');
      _updateCamButtons('quad');
    }
  });
}

function _updateCamButtons(mode) {
  const btns = document.querySelectorAll('.cam-btn');
  btns.forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
}

export function setCameraMode(mode, room = null) {
  cameraMode = mode;
  activeRoom = room;
  transitioning = true;
  transitionProgress = 0;

  if (mode === 'single' && room) {
    const zone = ZONES[room];
    if (!zone) return;
    // Calculate scale to fill the canvas with this room
    targetScale = Math.min(1920 / zone.w, 1080 / zone.h) * 0.9;
    targetX = -(zone.x + zone.w / 2) * targetScale + 960;
    targetY = -(zone.y + zone.h / 2) * targetScale + 540;
  } else {
    targetScale = 1;
    targetX = 0;
    targetY = 0;
  }
}

export function updateCamera(delta) {
  if (!_stage) return;

  // Animate transition
  if (transitioning) {
    transitionProgress += delta * 0.04;
    if (transitionProgress >= 1) {
      transitionProgress = 1;
      transitioning = false;
    }

    const t = _easeInOut(transitionProgress);
    const currentScale = _stage.scale.x;
    const currentX = _stage.x;
    const currentY = _stage.y;

    _stage.scale.set(currentScale + (targetScale - currentScale) * t);
    _stage.x = currentX + (targetX - currentX) * t;
    _stage.y = currentY + (targetY - currentY) * t;
  }

  // Auto-follow mode: switch to room with most recent speech
  if (cameraMode === 'auto' && lastSpeechRoom && Date.now() - lastSpeechTime < 10000) {
    if (activeRoom !== lastSpeechRoom) {
      setCameraMode('auto', lastSpeechRoom);
      activeRoom = lastSpeechRoom;
      const zone = ZONES[lastSpeechRoom];
      if (zone) {
        targetScale = Math.min(1920 / zone.w, 1080 / zone.h) * 0.9;
        targetX = -(zone.x + zone.w / 2) * targetScale + 960;
        targetY = -(zone.y + zone.h / 2) * targetScale + 540;
      }
    }
  }

  // Update REC dot blink
  const blinkPhase = Math.sin(Date.now() * 0.005);
  for (const [name, dot] of Object.entries(recDots)) {
    const isActive = (cameraMode === 'quad') || (activeRoom === name);
    dot.alpha = isActive ? (0.5 + blinkPhase * 0.5) : 0.2;
  }

  // Update timestamps
  const tsStr = _getTimestamp();
  for (const ts of Object.values(timestamps)) {
    ts.text = tsStr;
  }
}

function _getTimestamp() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function _easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
