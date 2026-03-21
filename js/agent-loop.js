// Autonomous character loops with drama engine + reactive conversations

import { requestDecision, requestAIDecision } from './ai-brain.js';
import { eventBus, worldState, addToHistory, consumeOperatorEventsFor, setAllCharacterNames, getRandomDramaEvent, updateRelationship, coupleUp, endRecouplingCeremony, dumpContestant, getPartner } from './events.js';

const LOOP_INTERVAL = 20000;  // 20s between each character action
const NIGHT_LOOP_INTERVAL = 30000; // 30s pillow talk at night
const DRAMA_INTERVAL_MIN = 300000; // 5 min
const DRAMA_INTERVAL_MAX = 480000; // 8 min
let allCharsRef = [];
let mainLoopTimers = new Map();   // character name -> main loop timeout ID
let reactiveTimers = new Map();   // character name -> reactive timeout ID
let reactingTo = new Set();       // characters currently in a reactive response
let paused = false;

// Listen for pause/resume
eventBus.on('simulation:pause', () => { paused = true; });
eventBus.on('simulation:resume', () => { paused = false; });

async function waitWhilePaused() {
  while (paused) {
    await delay(500);
  }
}

async function startAgentLoop(character, allCharacters) {
  allCharsRef = allCharacters;
  let consecutiveErrors = 0;

  const loop = async () => {
    await waitWhilePaused();

    // Night time — characters go to bedroom for pillow talk with their couple
    const isNight = worldState.timeOfDay === 'night';
    if (isNight) {
      // Force everyone to Bedroom — no leaving
      if (character.currentZone !== 'Bedroom') {
        character.moveTo('Bedroom');
        addToHistory({ type: 'sleep', actor: character.name, description: `${character.name} went to bed.` });
      }

      // Pillow talk — still call AI but with night context
      try {
        const partner = getPartner(character.name);
        const operatorEvents = consumeOperatorEventsFor(character.name);
        let perception = character.getPerception(allCharsRef, worldState);

        // Inject night/pillow talk context
        perception += '\n\n[NIGHT TIME — PILLOW TALK]';
        if (partner) {
          perception += `\nYou are in bed with ${partner}. This is PILLOW TALK — intimate, whispered, raw.`;
          perception += '\nBe vulnerable, confess feelings, question the relationship, share fears about recoupling.';
          perception += '\nOr be sneaky — whisper about other islanders, plot moves, stir things up.';
          perception += '\nYou CANNOT leave the Bedroom at night. Stay in bed.';
        } else {
          perception += '\nYou are SINGLE and sleeping alone. Lie awake thinking about who to graft on tomorrow.';
          perception += '\nWhisper to nearby islanders about your strategy. Be restless and scheming.';
          perception += '\nYou CANNOT leave the Bedroom at night.';
        }

        if (operatorEvents.length > 0) {
          perception += '\n\n[PRODUCER DIRECTIVE]:\n' + operatorEvents.join('\n');
        }

        const decision = await requestDecision(character, perception, 'night');
        // Block moveTo at night — force stay in Bedroom
        if (decision.action === 'moveTo') {
          decision.action = 'speak';
          decision.dialogue = decision.dialogue || '*tosses and turns*';
        }
        executeDecision(character, decision, allCharsRef);
      } catch (err) {
        console.error(`Night loop error for ${character.name}:`, err);
      }

      const nightTimer = setTimeout(loop, NIGHT_LOOP_INTERVAL);
      mainLoopTimers.set(character.name, nightTimer);
      return;
    }

    try {
      const operatorEvents = consumeOperatorEventsFor(character.name);

      let perception = character.getPerception(allCharacters, worldState);
      if (operatorEvents.length > 0) {
        perception += '\n\n[PRODUCER DIRECTIVE]:\n' + operatorEvents.join('\n');
      }

      const decision = await requestDecision(character, perception);
      executeDecision(character, decision, allCharacters);
      consecutiveErrors = 0;
    } catch (err) {
      console.error(`Agent loop error for ${character.name}:`, err);
      consecutiveErrors++;
      if (consecutiveErrors >= 3) {
        console.warn(`${character.name}: ${consecutiveErrors} errors, cooling down 30s`);
        await delay(30000);
        consecutiveErrors = 0;
      }
    }

    const timerId = setTimeout(loop, LOOP_INTERVAL);
    mainLoopTimers.set(character.name, timerId);
  };

  loop();
}

function executeDecision(character, decision, allCharacters) {
  const action = decision.action || 'idle';

  switch (action) {
    case 'moveTo':
      if (decision.target) character.moveTo(decision.target);
      break;
    case 'speak':
    case 'confront':
    case 'gossip':
    case 'flirt':
    case 'scheme':
    case 'interact':
      if (decision.dialogue) {
        character.speak(decision.dialogue, decision.audioUrl || null);
        eventBus.emit('character:speechType', {
          character,
          type: action,
          target: decision.target,
          dialogue: decision.dialogue,
        });
        // Trigger reactive conversation for characters in same room
        triggerReactiveLoop(character, allCharacters);
      }
      break;
    case 'emote':
      if (decision.mood) character.setMood(decision.mood);
      break;
    case 'idle':
    default:
      break;
  }

  // Update mood
  if (decision.mood) character.setMood(decision.mood);
  if (decision.thought) character.lastThought = decision.thought;

  // Process relationship changes from AI
  if (decision.relationshipChanges) {
    for (const [otherName, changes] of Object.entries(decision.relationshipChanges)) {
      updateRelationship(character.name, otherName, changes);
    }
  }

  // Add to history
  addToHistory({
    type: action,
    actor: character.name,
    description: decision.dialogue || decision.thought || action,
  });

  // Record significant events to character memory
  const day = worldState.dayNumber || 1;
  if (action === 'moveTo' && decision.target) {
    const reason = decision.reason || 'no particular reason';
    character.addMemory({ event: `Went to ${decision.target}`, who: null, feeling: reason, day });
  } else if (['speak', 'flirt', 'gossip', 'confront'].includes(action) && decision.dialogue) {
    const target = decision.target || 'someone';
    const feelingMap = { flirt: 'flirty', gossip: 'sneaky', confront: 'frustrated', speak: 'chatty' };
    const feeling = decision.reason || feelingMap[action] || 'neutral';
    const summary = decision.dialogue.length > 60 ? decision.dialogue.slice(0, 60) + '...' : decision.dialogue;
    character.addMemory({ event: `${action === 'confront' ? 'Confronted' : action === 'flirt' ? 'Flirted with' : action === 'gossip' ? 'Gossiped about' : 'Talked to'} ${target}: "${summary}"`, who: target, feeling, day });
  }

  eventBus.emit('characterAction', {
    type: action,
    actor: character.name,
    decision,
  });
}

function triggerReactiveLoop(speaker, allCharacters) {
  // Only ONE character reacts per speech — pick the most relevant (same room, not already reacting)
  const eligible = allCharacters.filter(other =>
    other !== speaker &&
    other.currentZone === speaker.currentZone &&
    !reactingTo.has(other.name)
  );

  if (eligible.length === 0) return;

  // Pick one random reactor (or the speaker's partner if present)
  const partner = allCharacters.find(c =>
    c !== speaker &&
    c.currentZone === speaker.currentZone &&
    !reactingTo.has(c.name) &&
    worldState.couples.some(cp =>
      (cp.partnerA === speaker.name && cp.partnerB === c.name) ||
      (cp.partnerB === speaker.name && cp.partnerA === c.name)
    )
  );
  const reactor = partner || eligible[Math.floor(Math.random() * eligible.length)];

  // Cancel any existing reactive timer
  const existingReactive = reactiveTimers.get(reactor.name);
  if (existingReactive) {
    clearTimeout(existingReactive);
  }

  const reactDelay = 6000 + Math.random() * 6000; // 6-12s before reacting
  const newTimer = setTimeout(async () => {
    reactingTo.add(reactor.name);
    try {
      await runReactiveResponse(reactor, allCharacters);
    } finally {
      reactingTo.delete(reactor.name);
      reactiveTimers.delete(reactor.name);
    }
  }, reactDelay);
  reactiveTimers.set(reactor.name, newTimer);
}

async function runReactiveResponse(character, allCharacters) {
  await waitWhilePaused();
  try {
    const operatorEvents = consumeOperatorEventsFor(character.name);
    let perception = character.getPerception(allCharacters, worldState);
    if (operatorEvents.length > 0) {
      perception += '\n\n[PRODUCER DIRECTIVE]:\n' + operatorEvents.join('\n');
    }

    const decision = await requestDecision(character, perception);
    // Execute but do NOT trigger another reactive loop (prevents cascades)
    const action = decision.action || 'idle';

    switch (action) {
      case 'moveTo':
        if (decision.target) character.moveTo(decision.target);
        break;
      case 'speak':
      case 'confront':
      case 'gossip':
      case 'flirt':
      case 'scheme':
      case 'interact':
        if (decision.dialogue) {
          character.speak(decision.dialogue, decision.audioUrl || null);
          eventBus.emit('character:speechType', {
            character,
            type: action,
            target: decision.target,
            dialogue: decision.dialogue,
          });
          // No triggerReactiveLoop here — prevents cascade
        }
        break;
      case 'emote':
        if (decision.mood) character.setMood(decision.mood);
        break;
    }

    if (decision.mood) character.setMood(decision.mood);
    if (decision.thought) character.lastThought = decision.thought;
    if (decision.relationshipChanges) {
      for (const [otherName, changes] of Object.entries(decision.relationshipChanges)) {
        updateRelationship(character.name, otherName, changes);
      }
    }

    addToHistory({
      type: action,
      actor: character.name,
      description: decision.dialogue || decision.thought || action,
    });

    // Record memories for reactive responses too
    const day = worldState.dayNumber || 1;
    if (action === 'moveTo' && decision.target) {
      const reason = decision.reason || 'no particular reason';
      character.addMemory({ event: `Went to ${decision.target}`, who: null, feeling: reason, day });
    } else if (['speak', 'flirt', 'gossip', 'confront'].includes(action) && decision.dialogue) {
      const target = decision.target || 'someone';
      const feelingMap = { flirt: 'flirty', gossip: 'sneaky', confront: 'frustrated', speak: 'chatty' };
      const feeling = decision.reason || feelingMap[action] || 'neutral';
      const summary = decision.dialogue.length > 60 ? decision.dialogue.slice(0, 60) + '...' : decision.dialogue;
      character.addMemory({ event: `${action === 'confront' ? 'Confronted' : action === 'flirt' ? 'Flirted with' : action === 'gossip' ? 'Gossiped about' : 'Talked to'} ${target}: "${summary}"`, who: target, feeling, day });
    }
  } catch (err) {
    console.error(`Reactive loop error for ${character.name}:`, err);
  }
  // No rescheduling — main loop continues on its own timer
}

// Drama event injection
function startDramaEngine() {
  const scheduleNext = () => {
    const interval = DRAMA_INTERVAL_MIN + Math.random() * (DRAMA_INTERVAL_MAX - DRAMA_INTERVAL_MIN);
    setTimeout(() => {
      const event = getRandomDramaEvent();
      worldState.dramaEvents.push(event);
      if (worldState.dramaEvents.length > 5) worldState.dramaEvents.shift();

      addToHistory({
        type: 'drama',
        actor: 'HOUSE',
        description: event,
      });

      eventBus.emit('drama:event', { text: event });

      scheduleNext();
    }, interval);
  };
  scheduleNext();
}

// When drama fires, pick 2 characters in the most populated room and get AI decisions
function setupDramaAIHandler() {
  eventBus.on('drama:event', async ({ text }) => {
    if (paused || allCharsRef.length === 0) return;

    // Find most populated room
    const roomCounts = {};
    for (const c of allCharsRef) {
      if (worldState.dumpedContestants.includes(c.name)) continue;
      roomCounts[c.currentZone] = (roomCounts[c.currentZone] || 0) + 1;
    }
    const busiestRoom = Object.entries(roomCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!busiestRoom) return;

    // Pick up to 2 characters from that room
    const candidates = allCharsRef.filter(c =>
      c.currentZone === busiestRoom &&
      !worldState.dumpedContestants.includes(c.name)
    );
    const picked = candidates.sort(() => Math.random() - 0.5).slice(0, 2);

    for (const character of picked) {
      try {
        const perception = character.getCompressedPerception(allCharsRef, worldState);
        const decision = await requestAIDecision(character, perception, 'drama');
        executeDecision(character, decision, allCharsRef);
      } catch (err) {
        console.warn(`Drama AI failed for ${character.name}:`, err.message);
      }
    }
  });
}

function startAllAgentLoops(characters) {
  allCharsRef = characters;

  // Register all character names for operator buffer tracking
  setAllCharacterNames(characters.map(c => c.name));

  characters.forEach((character, index) => {
    const stagger = index * 5000;
    setTimeout(() => {
      startAgentLoop(character, characters);
    }, stagger);
  });

  // Spatial awareness — characters in a room notice when someone enters
  eventBus.on('character:move', ({ character: mover, zone }) => {
    const day = worldState.dayNumber || 1;
    for (const other of allCharsRef) {
      if (other === mover) continue;
      if (other.currentZone === zone && !worldState.dumpedContestants.includes(other.name)) {
        other.addMemory({ event: `${mover.name} walked into the ${zone}`, who: mover.name, feeling: null, day });
      }
    }
  });

  // Start drama engine
  startDramaEngine();

  // Wire drama events to AI decisions
  setupDramaAIHandler();
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export { startAgentLoop, startAllAgentLoops };
