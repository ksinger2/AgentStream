import * as PIXI from 'https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.mjs';
import { eventBus, updateEpisode, worldState, parseProducerCommand, addWorldObject, getPartner } from './events.js';
import { getResponseStats } from './ai-brain.js';

let _app = null;
let _characters = [];
const activeBubbles = [];
const MAX_CHAT_MESSAGES = 80;

// Love Island action tag display names
const TAG_LABELS = {
  speak: 'CHAT',
  confront: 'KICKED OFF',
  gossip: 'GOSSIP',
  flirt: 'GRAFTING',
  scheme: 'GAME PLAN',
  interact: 'MOMENT',
  emote: 'MOOD',
};

export function initUI(app, characters) {
  _app = app;
  _characters = characters;

  _updateCharacterCards();
  _updateEpisodeCounter();

  // Chat feed events
  eventBus.on('character:speak', ({ character, text }) => {
    showSpeechBubble(character, text);
    addChatMessage(character.name, text, 'speak', character.color);
  });

  eventBus.on('character:speechType', ({ character, type, dialogue }) => {
    const feed = document.getElementById('chat-feed');
    if (feed && feed.lastElementChild) {
      const tag = feed.lastElementChild.querySelector('.msg-tag');
      if (tag) {
        tag.textContent = TAG_LABELS[type] || type.toUpperCase();
        tag.className = `msg-tag tag-${type}`;
      }
    }
  });

  eventBus.on('character:move', ({ character, zone }) => {
    addChatMessage(null, `${character.name} moved to ${zone}`, 'system');
  });

  eventBus.on('character:mood', ({ character, mood }) => {
    addChatMessage(null, `${character.name} is now ${mood}`, 'system');
  });

  eventBus.on('drama:event', ({ text }) => {
    addChatMessage(null, text, 'drama');
  });

  eventBus.on('episode:change', ({ episode }) => {
    _updateEpisodeCounter();
    addChatMessage(null, `--- Episode ${episode} ---`, 'episode');
  });

  // Ceremony events
  eventBus.on('ceremony:recoupling:start', () => {
    addChatMessage(null, '🔥 RECOUPLING CEREMONY — Everyone to the Fire Pit! 🔥', 'ceremony');
  });

  eventBus.on('ceremony:recoupling:end', () => {
    addChatMessage(null, '🌹 The recoupling is complete.', 'ceremony');
  });

  eventBus.on('couple:formed', ({ partnerA, partnerB }) => {
    addChatMessage(null, `💕 ${partnerA} and ${partnerB} have coupled up!`, 'ceremony');
    _updateCharacterCards();
  });

  eventBus.on('couple:broken', ({ partnerA, partnerB }) => {
    addChatMessage(null, `💔 ${partnerA} and ${partnerB} are no longer coupled.`, 'ceremony');
    _updateCharacterCards();
  });

  eventBus.on('bombshell:arrival', ({ name }) => {
    addChatMessage(null, `💣 BOMBSHELL! ${name} has just walked into the villa!`, 'ceremony');
  });

  eventBus.on('contestant:dumped', ({ name }) => {
    addChatMessage(null, `😢 ${name} has been dumped from the island. Goodbye!`, 'ceremony');
  });

  // Confessional display
  eventBus.on('confessional:show', ({ characterName, color, mood, confession, about }) => {
    _showConfessionalPanel(characterName, color, mood, confession, about);
    addChatMessage(characterName, confession, 'confessional', color);
  });

  eventBus.on('confessional:hide', () => {
    _hideConfessionalPanel();
  });

  // Wire up chat input
  _initChatInput();
}

function _initChatInput() {
  const input = document.getElementById('chat-input');
  const btn = document.getElementById('chat-send');
  if (!input || !btn) return;

  const submit = () => {
    const text = input.value.trim();
    if (!text) return;

    // Poll commands: "poll dump" or "poll couple" or "poll close"
    const pollMatch = text.match(/^poll\s+(dump|couple|close)/i);
    if (pollMatch) {
      const pollCmd = pollMatch[1].toLowerCase();
      if (pollCmd === 'close') {
        _closePoll();
      } else {
        _createPoll(pollCmd);
      }
      input.value = '';
      return;
    }

    // Parse for world events (meteor, fire, etc.)
    const parsed = parseProducerCommand(text);
    if (parsed.isWorldEvent) {
      addWorldObject(parsed.eventType, parsed.room, parsed.description);
      addChatMessage('PRODUCER', text, 'world-event');
    } else if (parsed.isRecouple) {
      addChatMessage('PRODUCER', '📱 Triggering recoupling ceremony...', 'operator');
    } else if (parsed.isBombshell) {
      addChatMessage('PRODUCER', `📱 Bombshell ${parsed.name} entering the villa...`, 'operator');
    } else if (parsed.isDump) {
      addChatMessage('PRODUCER', '📱 Initiating dumping...', 'operator');
    } else if (parsed.isText) {
      addChatMessage('PRODUCER', `📱 "${parsed.message}"`, 'operator');
    } else {
      addChatMessage('PRODUCER', text, 'operator');
    }

    // Always emit as operator command so agents see it
    eventBus.emit('operator:command', { text });
    input.value = '';
  };

  btn.addEventListener('click', submit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  });
}

function addChatMessage(sender, text, type = 'speak', color = null) {
  const feed = document.getElementById('chat-feed');
  if (!feed) return;

  const msg = document.createElement('div');
  msg.className = `chat-msg chat-${type}`;

  if (type === 'system') {
    msg.innerHTML = `<span class="msg-system">${text}</span>`;
  } else if (type === 'drama') {
    msg.innerHTML = `<span class="msg-drama">🔥 ${text}</span>`;
  } else if (type === 'episode') {
    msg.innerHTML = `<span class="msg-episode">${text}</span>`;
  } else if (type === 'world-event') {
    msg.innerHTML = `<span class="msg-drama">🌋 [WORLD EVENT] ${text}</span>`;
  } else if (type === 'ceremony') {
    msg.innerHTML = `<span class="msg-ceremony">${text}</span>`;
  } else if (type === 'confessional') {
    const colorHex = color ? '#' + color.toString(16).padStart(6, '0') : '#FF6B6B';
    msg.innerHTML = `<span class="msg-confessional-label">🏖️ BEACH HUT</span> <span class="msg-name" style="color:${colorHex}">${sender}</span><br><span class="msg-confessional-text">"${_escapeHtml(text)}"</span>`;
  } else if (type === 'operator') {
    msg.innerHTML = `<span class="msg-operator">📱 [PRODUCER] ${text}</span>`;
  } else {
    const colorHex = color ? '#' + color.toString(16).padStart(6, '0') : '#fff';
    msg.innerHTML = `<span class="msg-name" style="color:${colorHex}">${sender}</span> <span class="msg-tag tag-speak">${TAG_LABELS.speak}</span><br><span class="msg-text">${_escapeHtml(text)}</span>`;
  }

  feed.appendChild(msg);

  // Trim old messages
  while (feed.children.length > MAX_CHAT_MESSAGES) {
    feed.removeChild(feed.firstChild);
  }

  // Auto-scroll
  feed.scrollTop = feed.scrollHeight;

  // Slide-in animation
  if (type !== 'system' && type !== 'episode') {
    msg.style.opacity = '0';
    msg.style.transform = 'translateY(8px)';
    requestAnimationFrame(() => {
      msg.style.transition = 'opacity 0.3s, transform 0.3s';
      msg.style.opacity = '1';
      msg.style.transform = 'translateY(0)';
    });
  }
}

function _escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ─── Confessional Panel ───
function _showConfessionalPanel(name, color, mood, confession, about) {
  const panel = document.getElementById('confessional-panel');
  if (!panel) return;

  const nameEl = document.getElementById('confessional-name');
  const textEl = document.getElementById('confessional-text');

  if (nameEl) {
    const colorHex = color ? '#' + color.toString(16).padStart(6, '0') : '#FF6B6B';
    nameEl.textContent = `${mood} ${name}`;
    nameEl.style.color = colorHex;
  }
  if (textEl) {
    textEl.textContent = confession;
  }

  panel.classList.remove('confessional-hidden');
  panel.classList.add('confessional-visible');
}

function _hideConfessionalPanel() {
  const panel = document.getElementById('confessional-panel');
  if (!panel) return;
  panel.classList.remove('confessional-visible');
  panel.classList.add('confessional-hidden');
}

export function showSpeechBubble(character, text) {
  if (!_app || !character.sprite) return;

  // Only one speech bubble at a time — remove all existing ones
  for (const b of activeBubbles) {
    if (b.parent) b.parent.removeChild(b);
  }
  activeBubbles.length = 0;

  const container = new PIXI.Container();
  const colorHex = character.color;

  // Name tag
  const nameObj = new PIXI.Text({
    text: character.name,
    style: {
      fontSize: 13,
      fontWeight: '700',
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fill: colorHex,
      letterSpacing: 0.5,
    },
  });
  nameObj.x = 14;
  nameObj.y = 8;

  // Message text — modern chat style
  const textObj = new PIXI.Text({
    text,
    style: {
      fontSize: 15,
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fill: 0xEEEEEE,
      wordWrap: true,
      wordWrapWidth: 300,
      lineHeight: 21,
    },
  });
  textObj.x = 14;
  textObj.y = 26;

  const padX = 28;
  const padY = 38;
  const bw = Math.min(Math.max(textObj.width, nameObj.width) + padX, 360);
  const bh = textObj.height + padY;

  const bg = new PIXI.Graphics();
  // Dark rounded bubble — modern iMessage/WhatsApp style
  bg.roundRect(0, 0, bw, bh, 16).fill({ color: 0x1E1E2E, alpha: 0.92 });
  // Colored accent line at top
  bg.roundRect(0, 0, bw, 3, 2).fill({ color: colorHex, alpha: 0.8 });
  // Pointer triangle
  bg.moveTo(bw / 2 - 6, bh).lineTo(bw / 2, bh + 8).lineTo(bw / 2 + 6, bh).closePath()
    .fill({ color: 0x1E1E2E, alpha: 0.92 });

  container.addChild(bg);
  container.addChild(nameObj);
  container.addChild(textObj);

  container.x = character.sprite.x - bw / 2;
  container.y = character.sprite.y - 120 - bh;

  // Keep on screen
  if (container.x < 10) container.x = 10;
  if (container.x + bw > 1910) container.x = 1910 - bw;
  if (container.y < 10) container.y = 10;

  _app.stage.addChild(container);
  activeBubbles.push(container);

  // Stay up for 10s so user can read
  setTimeout(() => {
    if (container.parent) container.parent.removeChild(container);
    const idx = activeBubbles.indexOf(container);
    if (idx !== -1) activeBubbles.splice(idx, 1);
  }, 10000);
}

function _updateCharacterCards() {
  const cardsEl = document.getElementById('character-cards');
  if (!cardsEl) return;

  let html = '';
  for (const c of _characters) {
    const colorHex = '#' + c.color.toString(16).padStart(6, '0');
    const partner = getPartner(c.name);
    const coupleText = partner
      ? `<span class="char-card-couple">💕 Coupled with ${partner}</span>`
      : `<span class="char-card-single">💔 Single</span>`;

    html += `<div class="char-card" style="border-left: 3px solid ${colorHex}">
      <div class="char-card-header">
        <span class="char-card-name" style="color:${colorHex}">${c.name}</span>
        <span class="char-card-mood">${c.mood}</span>
      </div>
      <div class="char-card-zone">${c.currentZone}</div>
      ${coupleText}
    </div>`;
  }
  cardsEl.innerHTML = html;
}

function _updateEpisodeCounter() {
  const el = document.getElementById('episode-counter');
  if (el) el.textContent = `🌴 Episode ${worldState.episodeNumber}`;
}

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
    const colorHex = '#' + c.color.toString(16).padStart(6, '0');
    html += `<div class="debug-char">`;
    html += `<strong style="color:${colorHex}">${c.name}</strong><br>`;
    html += `Zone: ${c.currentZone}<br>`;
    html += `Partner: ${getPartner(c.name) || 'Single'}<br>`;
    html += `Pos: (${Math.round(c.x)}, ${Math.round(c.y)})<br>`;
    html += `Moving: ${c.isMoving}<br>`;
    if (c.lastThought) html += `Thought: ${c.lastThought}<br>`;
    const stats = getResponseStats().get(c.name);
    if (stats) {
      html += `API: ${Math.round(stats.lastResponseTime)}ms (avg ${Math.round(stats.avgResponseTime)}ms, ${stats.requestCount} reqs)<br>`;
    }
    html += `</div>`;
  }
  overlay.innerHTML = html;
}

let _lastCardState = '';

export function updateUI() {
  // Update character cards when state changes (include couple state)
  const coupleState = worldState.couples.map(c => `${c.partnerA}-${c.partnerB}`).join(',');
  const cardState = _characters.map(c => `${c.name}${c.mood}${c.currentZone}`).join('|') + coupleState;
  if (cardState !== _lastCardState) {
    _lastCardState = cardState;
    _updateCharacterCards();
  }

  // Episode counter
  updateEpisode();

  // Debug overlay
  _renderDebugOverlay();
}

// ─── Voting Poll System ───
let _pollRefreshTimer = null;

async function _createPoll(type) {
  const names = _characters.map(c => c.name);
  let question, options;

  if (type === 'dump') {
    question = 'Which islander should be DUMPED from the island?';
    options = names.map(n => ({ label: n, value: n }));
  } else if (type === 'couple') {
    question = 'Which couple do you want to see together?';
    // Generate pair combos
    options = [];
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        options.push({ label: `${names[i]} + ${names[j]}`, value: `${names[i]}|${names[j]}` });
      }
    }
  } else {
    return;
  }

  try {
    const res = await fetch('/api/poll/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, question, options }),
    });
    const json = await res.json();
    if (json.data) {
      _renderPoll(json.data.poll, json.data.votes);
      addChatMessage('PRODUCER', `📊 VOTE NOW: ${question}`, 'ceremony');
      // Auto-refresh poll results
      _pollRefreshTimer = setInterval(_refreshPoll, 3000);
    }
  } catch (err) {
    console.error('Poll create error:', err);
  }
}

async function _refreshPoll() {
  try {
    const res = await fetch('/api/poll');
    const json = await res.json();
    if (json.data) {
      _renderPoll(json.data.poll, json.data.votes);
    } else {
      _hidePoll();
    }
  } catch (_) {}
}

async function _closePoll() {
  if (_pollRefreshTimer) {
    clearInterval(_pollRefreshTimer);
    _pollRefreshTimer = null;
  }
  try {
    const res = await fetch('/api/poll/close', { method: 'POST' });
    const json = await res.json();
    if (json.data) {
      const { winner, winnerVotes, poll } = json.data;
      addChatMessage('PRODUCER', `📊 VOTE RESULT: ${winner} wins with ${winnerVotes} votes!`, 'ceremony');

      // Auto-execute the result
      if (poll.type === 'dump' && winner) {
        eventBus.emit('operator:command', { text: `dump ${winner}` });
        addChatMessage('PRODUCER', `💔 The public has spoken. ${winner} has been dumped!`, 'ceremony');
      } else if (poll.type === 'couple' && winner) {
        const [a, b] = winner.split(' + ');
        if (a && b) {
          eventBus.emit('operator:command', { text: `couple ${a} and ${b}` });
          addChatMessage('PRODUCER', `💕 The public has chosen: ${a} and ${b} are coupled up!`, 'ceremony');
        }
      }
    }
  } catch (err) {
    console.error('Poll close error:', err);
  }
  _hidePoll();
}

function _renderPoll(poll, votes) {
  const panel = document.getElementById('poll-panel');
  if (!panel) return;
  panel.classList.add('active');

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
  const typeClass = `poll-type-${poll.type}`;

  let html = `<div class="poll-type-badge ${typeClass}">${poll.type}</div>`;
  html += `<div class="poll-question">${_escapeHtml(poll.question)}</div>`;
  html += '<div class="poll-options">';

  for (const opt of poll.options) {
    const count = votes[opt.label] || 0;
    const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
    html += `<div class="poll-option" data-option="${_escapeHtml(opt.label)}">
      <span class="poll-option-name">${_escapeHtml(opt.label)}</span>
      <div class="poll-option-bar"><div class="poll-option-fill" style="width:${pct}%"></div></div>
      <span class="poll-option-count">${count}</span>
    </div>`;
  }

  html += '</div>';
  html += '<button class="poll-close-btn" id="poll-close-btn">Close Poll & Execute</button>';
  panel.innerHTML = html;

  // Wire vote clicks
  panel.querySelectorAll('.poll-option').forEach(el => {
    el.addEventListener('click', async () => {
      const option = el.dataset.option;
      try {
        const res = await fetch('/api/poll/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ option }),
        });
        const json = await res.json();
        if (json.data) {
          _renderPoll(poll, json.data.votes);
        }
      } catch (_) {}
      el.classList.add('voted');
    });
  });

  // Wire close button
  const closeBtn = document.getElementById('poll-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', _closePoll);
  }
}

function _hidePoll() {
  const panel = document.getElementById('poll-panel');
  if (panel) {
    panel.classList.remove('active');
    panel.innerHTML = '';
  }
}

export { activeBubbles };
