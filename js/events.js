// Event bus + shared world state + drama engine

class EventBus {
  constructor() {
    this._listeners = {};
  }

  on(event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this._listeners[event]) return;
    for (const cb of this._listeners[event]) {
      cb(data);
    }
  }
}

export const eventBus = new EventBus();

// Shared world state
export const worldState = {
  currentEvent: null,
  history: [],
  operatorBuffer: [],   // { id, text, seenBy: Set() }
  dramaEvents: [],
  relationships: {},
  episodeNumber: 1,
  episodeStartTime: Date.now(),
  worldObjects: [],      // { id, type, room, description, createdAt, active }
  couples: [],           // [{ id, partnerA, partnerB, since, compatibility }]
  dayNumber: 1,
  timeOfDay: 'morning',  // morning, afternoon, evening, night
  dayStartTime: Date.now(),
  ceremonyInProgress: false,
  dumpedContestants: [],  // names of eliminated islanders
};

// All character names (set once at startup)
let allCharacterNames = [];
export function setAllCharacterNames(names) {
  allCharacterNames = names;
}

// Convenience alias
Object.defineProperty(worldState, 'recentEvents', {
  get() {
    return this.history.map(e =>
      typeof e === 'string' ? e : `${e.actor || ''}: ${e.description || e.type || ''}`
    );
  },
});

export function addToHistory(entry) {
  worldState.history.push(entry);
  if (worldState.history.length > 50) {
    worldState.history.shift();
  }
  worldState.currentEvent = entry;
}

let _opEventId = 0;

export function bufferOperatorEvent(text) {
  worldState.operatorBuffer.push({
    id: ++_opEventId,
    text,
    seenBy: new Set(),
  });
}

// Per-character consumption: returns unseen events for this character and marks them seen
export function consumeOperatorEventsFor(characterName) {
  const unseen = worldState.operatorBuffer.filter(e => !e.seenBy.has(characterName));
  for (const e of unseen) {
    e.seenBy.add(characterName);
  }
  // Remove events that all characters have seen
  if (allCharacterNames.length > 0) {
    worldState.operatorBuffer = worldState.operatorBuffer.filter(e => {
      for (const name of allCharacterNames) {
        if (!e.seenBy.has(name)) return true;
      }
      return false;
    });
  }
  return unseen.map(e => e.text);
}

// Wire operator:command events into the buffer
eventBus.on('operator:command', ({ text }) => {
  const parsed = parseProducerCommand(text);

  if (parsed.isBombshell) {
    announceBombshell(parsed.name);
  } else if (parsed.isRecouple) {
    startRecouplingCeremony();
  } else if (parsed.isDump) {
    // Dump is buffered — the agent-loop picks the target
  }

  bufferOperatorEvent(text);
});

// ─── World Objects System ───
let _worldObjId = 0;

export function addWorldObject(type, room, description) {
  const obj = {
    id: ++_worldObjId,
    type,
    room,
    description,
    createdAt: Date.now(),
    active: true,
  };
  worldState.worldObjects.push(obj);
  eventBus.emit('world:objectCreated', { worldObject: obj });

  addToHistory({
    type: 'world',
    actor: 'WORLD',
    description: `${type.toUpperCase()} appeared in ${room}: ${description}`,
  });

  return obj;
}

export function removeWorldObject(id) {
  const idx = worldState.worldObjects.findIndex(o => o.id === id);
  if (idx !== -1) {
    worldState.worldObjects.splice(idx, 1);
    eventBus.emit('world:objectRemoved', { id });
  }
}

export function getActiveWorldObjects() {
  return worldState.worldObjects.filter(o => o.active);
}

// ─── Producer Command Parser ───
const EVENT_KEYWORDS = ['meteor', 'fire', 'flood', 'darkness', 'ice', 'explosion', 'earthquake', 'gas', 'treasure', 'portal'];
const ROOM_MAP = {
  kitchen: 'Kitchen',
  'living room': 'Living Room',
  livingroom: 'Living Room',
  'fire pit': 'Living Room',
  firepit: 'Living Room',
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  'day beds': 'Bathroom',
  daybeds: 'Bathroom',
  pool: 'Bathroom',
};

export function parseProducerCommand(text) {
  const lower = text.toLowerCase().trim();

  // "text ..." → pass-through text message
  if (lower.startsWith('text ')) {
    return { isText: true, message: text.slice(5).trim() };
  }

  // Bombshell arrival
  if (lower.includes('bombshell')) {
    // Try to extract a name after "bombshell"
    const match = text.match(/bombshell\s+(.+)/i);
    const name = match ? match[1].trim() : 'New Islander';
    return { isBombshell: true, name };
  }

  // Recoupling ceremony
  if (lower.includes('recouple') || lower.includes('recoupling')) {
    return { isRecouple: true };
  }

  // Dump contestant
  if (lower.includes('dump')) {
    return { isDump: true };
  }

  // Existing world event parsing
  let eventType = null;
  for (const kw of EVENT_KEYWORDS) {
    if (lower.includes(kw)) {
      eventType = kw;
      break;
    }
  }

  let room = null;
  for (const [keyword, zoneName] of Object.entries(ROOM_MAP)) {
    if (lower.includes(keyword)) {
      room = zoneName;
      break;
    }
  }

  if (eventType && room) {
    return { isWorldEvent: true, eventType, room, description: text };
  }

  // Plain directive — no world event
  return { isWorldEvent: false, text };
}

// Relationship tracking
export function getRelationship(charA, charB) {
  const key = `${charA}->${charB}`;
  if (!worldState.relationships[key]) {
    worldState.relationships[key] = { trust: 50, irritation: 10, attraction: 20 };
  }
  return worldState.relationships[key];
}

export function updateRelationship(charA, charB, changes) {
  const rel = getRelationship(charA, charB);
  for (const [key, delta] of Object.entries(changes)) {
    if (rel[key] !== undefined) {
      rel[key] = Math.max(0, Math.min(100, rel[key] + delta));
    }
  }
  eventBus.emit('relationship:change', { charA, charB, relationship: { ...rel } });
}

// Drama event system — Love Island themed
const DRAMA_EVENTS = [
  "📱 I'VE GOT A TEXT! 'Islanders, tonight there will be a surprise recoupling. #ShakeUp'",
  "A secret admirer left a love note on someone's pillow... but who wrote it?",
  "The villa phone buzzes: 'One couple is not as strong as they think. #Exposed'",
  "Someone was caught grafting on another islander's partner by the Day Beds!",
  "A postcard from outside the villa arrives with a shocking photo...",
  "The fire pit crackles — someone's about to get mugged off BIG TIME.",
  "Two islanders were overheard scheming in the kitchen about switching couples.",
  "📱 TEXT ALERT: 'Islanders, the public has been voting. The results are in. #NervousEnergy'",
  "Someone confessed to having feelings for their best friend's partner!",
  "A heated argument broke out about who's being 'muggy' and who's being genuine.",
  "📱 I'VE GOT A TEXT! 'Girls and boys, get ready for tonight's challenge! #KissingBooth'",
  "Whispers in the bedroom: someone's head has been completely turned by a new arrival.",
  "An ex's video message played on the villa TV — tears and rage followed.",
  "Someone was caught doing bits in the hideaway and the whole villa knows.",
  "📱 TEXT: 'One islander will receive a date card tonight. Choose wisely. #StolenMoments'",
  "Trust has been broken — someone shared a private conversation with the whole villa.",
  "Two islanders are fighting over the same person. Tensions are at breaking point.",
  "A love triangle just became a love SQUARE. This villa is chaos.",
  "Someone pulled someone else for a chat right in front of their partner. MUGGY.",
  "📱 TEXT: 'Islanders, tomorrow one of you will go on a blind date. Stay tuned. #Excitement'",
];

let dramaIndex = 0;

export function getRandomDramaEvent() {
  const shuffled = [...DRAMA_EVENTS].sort(() => Math.random() - 0.5);
  const event = shuffled[dramaIndex % shuffled.length];
  dramaIndex++;
  return event;
}

// ─── Coupling System ───
let _coupleId = 0;

export function coupleUp(nameA, nameB) {
  // Remove both from any existing couples
  worldState.couples = worldState.couples.filter(
    c => c.partnerA !== nameA && c.partnerB !== nameA &&
         c.partnerA !== nameB && c.partnerB !== nameB
  );
  const couple = {
    id: ++_coupleId,
    partnerA: nameA,
    partnerB: nameB,
    since: worldState.dayNumber,
    compatibility: Math.floor(Math.random() * 60) + 20, // 20-80
  };
  worldState.couples.push(couple);
  eventBus.emit('couple:formed', { partnerA: nameA, partnerB: nameB });
  addToHistory({
    type: 'couple',
    actor: 'VILLA',
    description: `${nameA} and ${nameB} have coupled up!`,
  });
  return couple;
}

export function breakCouple(coupleId) {
  const idx = worldState.couples.findIndex(c => c.id === coupleId);
  if (idx === -1) return;
  const couple = worldState.couples[idx];
  worldState.couples.splice(idx, 1);
  eventBus.emit('couple:broken', { partnerA: couple.partnerA, partnerB: couple.partnerB });
  addToHistory({
    type: 'couple',
    actor: 'VILLA',
    description: `${couple.partnerA} and ${couple.partnerB} are no longer a couple.`,
  });
}

export function getPartner(name) {
  for (const c of worldState.couples) {
    if (c.partnerA === name) return c.partnerB;
    if (c.partnerB === name) return c.partnerA;
  }
  return null;
}

export function getCouples() {
  return worldState.couples;
}

export function isSingle(name) {
  return !worldState.couples.some(c => c.partnerA === name || c.partnerB === name);
}

// ─── Day/Night Cycle ───
const DAY_DURATION_MS = 300000; // 5 minutes = 1 "day"
const PHASES = ['morning', 'afternoon', 'evening', 'night'];

export function updateDayCycle() {
  const elapsed = Date.now() - worldState.dayStartTime;
  const totalDays = Math.floor(elapsed / DAY_DURATION_MS);
  const newDayNumber = totalDays + 1;
  const withinDay = elapsed % DAY_DURATION_MS;
  const phaseIndex = Math.min(3, Math.floor((withinDay / DAY_DURATION_MS) * 4));
  const newPhase = PHASES[phaseIndex];

  if (newDayNumber !== worldState.dayNumber) {
    worldState.dayNumber = newDayNumber;
    eventBus.emit('day:newDay', { day: newDayNumber });
    addToHistory({
      type: 'day',
      actor: 'VILLA',
      description: `Day ${newDayNumber} begins in the villa.`,
    });
  }

  if (newPhase !== worldState.timeOfDay) {
    worldState.timeOfDay = newPhase;
    eventBus.emit('day:phaseChange', { day: worldState.dayNumber, phase: newPhase });
  }

  return { day: worldState.dayNumber, timeOfDay: worldState.timeOfDay };
}

// ─── Ceremonies ───
export function startRecouplingCeremony() {
  worldState.ceremonyInProgress = true;
  eventBus.emit('ceremony:recoupling:start');
  addToHistory({
    type: 'ceremony',
    actor: 'VILLA',
    description: 'A recoupling ceremony has begun!',
  });
}

export function endRecouplingCeremony() {
  worldState.ceremonyInProgress = false;
  eventBus.emit('ceremony:recoupling:end');
  addToHistory({
    type: 'ceremony',
    actor: 'VILLA',
    description: 'The recoupling ceremony has ended.',
  });
}

export function dumpContestant(name) {
  worldState.dumpedContestants.push(name);
  // Break their couple if they have one
  const couple = worldState.couples.find(c => c.partnerA === name || c.partnerB === name);
  if (couple) {
    breakCouple(couple.id);
  }
  eventBus.emit('contestant:dumped', { name });
  addToHistory({
    type: 'dump',
    actor: 'VILLA',
    description: `${name} has been dumped from the island!`,
  });
}

// ─── Bombshell ───
export function announceBombshell(name) {
  eventBus.emit('bombshell:arrival', { name });
  addToHistory({
    type: 'bombshell',
    actor: 'VILLA',
    description: `BOMBSHELL ALERT: ${name} has entered the villa!`,
  });
}

// Episode tracking
export function updateEpisode() {
  const elapsed = Date.now() - worldState.episodeStartTime;
  const newEp = Math.floor(elapsed / (10 * 60 * 1000)) + 1;
  if (newEp !== worldState.episodeNumber) {
    worldState.episodeNumber = newEp;
    eventBus.emit('episode:change', { episode: newEp });
  }
  return worldState.episodeNumber;
}
