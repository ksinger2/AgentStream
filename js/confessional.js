// Beach Hut Confessional System — AI-enhanced with preset fallback

import { eventBus, worldState } from './events.js';
import { requestAIDecision } from './ai-brain.js';

const CONFESSIONAL_INTERVAL_MIN = 90000;  // 90s
const CONFESSIONAL_INTERVAL_MAX = 120000; // 120s
const CONFESSIONAL_DISPLAY_TIME = 10000;  // 10s on screen
let _characters = [];
let _timer = null;
let _displayTimer = null;
let _active = false;
let _lastConfessor = null;
let _confessionIndex = 0;

const PRESET_CONFESSIONALS = [
  { confession: "I'm not being funny but I am FUMING right now. Like, who does that? You can't just crack on with someone else's partner and expect no one to notice. I've got eyes yeah?", mood: '😤', about: 'general' },
  { confession: "OK so don't judge me but... I think I actually really like them? Like properly like them. And I didn't expect that at all coming in here. My head's gone.", mood: '🥰', about: 'general' },
  { confession: "I came in here with a game plan and honestly it's gone completely out the window. Everyone's so fit and funny, how am I supposed to choose?", mood: '😂', about: 'general' },
  { confession: "Right so between me and you, I think someone in there is being proper fake. They're saying one thing to people's faces and another behind their backs. I see it all.", mood: '😏', about: 'general' },
  { confession: "I'm having the absolute time of my life in here. Like, best summer ever. If I go home tomorrow I'd still say it was worth it. But I am NOT going home tomorrow.", mood: '😊', about: 'general' },
  { confession: "My head is literally spinning. One minute I'm buzzing, next minute I'm crying in the bathroom. This place does things to you, I swear.", mood: '😢', about: 'general' },
  { confession: "I need to step my game up because I can see someone else making moves and I'm not having it. This is MY time. Watch this space.", mood: '😈', about: 'general' },
  { confession: "Can I just say, the food in here is absolutely banging. Like forget the drama, I'm here for the breakfast. Don't tell the producers I said that.", mood: '😂', about: 'general' },
  { confession: "I've never felt like this about anyone before and it's proper scary. Like what if they don't feel the same? What if I'm making a mug of myself?", mood: '😟', about: 'general' },
  { confession: "Day one I said I wasn't gonna get involved in drama. Day two I started the biggest row in the villa. I can't help it, I'm passionate innit.", mood: '🤷', about: 'general' },
  { confession: "I miss my mum's cooking, my dog, and my own bed. But I would not swap this experience for anything. Well... maybe for my mum's Sunday roast.", mood: '😊', about: 'general' },
  { confession: "Everyone thinks I'm this confident person but honestly? I'm bricking it. Every single day. I just hide it well with the banter.", mood: '😰', about: 'general' },
];

// Preset audio clips (generated offline)
const PRESET_AUDIO = [
  '/assets/audio/speech-female1.mp3',
  '/assets/audio/speech-male1.mp3',
  '/assets/audio/speech-female2.mp3',
];

export function initConfessional(characters) {
  _characters = characters;
  scheduleNext();

  eventBus.on('confessional:trigger', ({ characterName }) => {
    const char = _characters.find(c => c.name === characterName);
    if (char) runConfessional(char);
  });
}

function scheduleNext() {
  const interval = CONFESSIONAL_INTERVAL_MIN +
    Math.random() * (CONFESSIONAL_INTERVAL_MAX - CONFESSIONAL_INTERVAL_MIN);
  _timer = setTimeout(() => {
    const eligible = _characters.filter(c =>
      !worldState.dumpedContestants.includes(c.name) && c.name !== _lastConfessor
    );
    if (eligible.length === 0) {
      scheduleNext();
      return;
    }
    const chosen = eligible[Math.floor(Math.random() * eligible.length)];
    runConfessional(chosen);
  }, interval);
}

async function runConfessional(character) {
  if (_active) return;
  _active = true;
  _lastConfessor = character.name;

  let confession, mood, audioUrl = null;

  // Try AI-powered confessional first
  try {
    const perception = character.getCompressedPerception
      ? character.getCompressedPerception(_characters, worldState)
      : `I am ${character.name} in the Beach Hut.`;
    const decision = await requestAIDecision(character, perception, 'confessional');
    if (decision && decision.dialogue) {
      confession = decision.dialogue;
      mood = decision.mood || '😏';
      audioUrl = decision.audioUrl || null;
    }
  } catch (_) {
    // Fall through to preset
  }

  // Fallback to preset if AI didn't produce a result
  if (!confession) {
    const preset = PRESET_CONFESSIONALS[_confessionIndex % PRESET_CONFESSIONALS.length];
    _confessionIndex++;
    confession = preset.confession;
    mood = preset.mood;
  }

  // Show confessional in UI
  eventBus.emit('confessional:show', {
    characterName: character.name,
    color: character.color,
    mood,
    confession,
    about: 'general',
    audioUrl,
  });

  // Play TTS audio if available, otherwise play preset
  if (audioUrl) {
    playTTSAudio(audioUrl);
  } else {
    playPresetAudio();
  }

  // Auto-hide after display time
  _displayTimer = setTimeout(() => {
    eventBus.emit('confessional:hide');
    _active = false;
    scheduleNext();
  }, CONFESSIONAL_DISPLAY_TIME);
}

let _currentAudio = null;

function playPresetAudio() {
  try {
    if (_currentAudio) {
      _currentAudio.pause();
      _currentAudio = null;
    }
    const clip = PRESET_AUDIO[Math.floor(Math.random() * PRESET_AUDIO.length)];
    _currentAudio = new Audio(clip);
    _currentAudio.volume = 0.5;
    _currentAudio.play().catch(() => {}); // Ignore autoplay blocks
    _currentAudio.addEventListener('ended', () => { _currentAudio = null; });
  } catch (_) {
    // Audio not available — text-only fallback
  }
}

function playTTSAudio(audioUrl) {
  try {
    if (_currentAudio) {
      _currentAudio.pause();
      _currentAudio = null;
    }
    _currentAudio = new Audio(audioUrl);
    _currentAudio.volume = 0.6;
    _currentAudio.play().catch(() => {});
    _currentAudio.addEventListener('ended', () => { _currentAudio = null; });
  } catch (_) {}
}

export function stopConfessional() {
  if (_timer) clearTimeout(_timer);
  if (_displayTimer) clearTimeout(_displayTimer);
  if (_currentAudio) {
    _currentAudio.pause();
    _currentAudio = null;
  }
  _active = false;
}
