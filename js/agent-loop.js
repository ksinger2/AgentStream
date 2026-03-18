// Autonomous character loops

import { requestDecision } from './ai-brain.js';
import { eventBus, worldState, addToHistory, consumeOperatorEvents, clearOperatorBuffer } from './events.js';

async function startAgentLoop(character, allCharacters, options = {}) {
  const interval = options.interval || 15000;
  let consecutiveErrors = 0;

  while (true) {
    try {
      // 1. Check for operator events
      const operatorEvents = consumeOperatorEvents();

      // 2. Build perception
      let perception = character.getPerception(allCharacters, worldState);
      if (operatorEvents.length > 0) {
        perception += '\n\n[Operator Events]:\n' + operatorEvents.join('\n');
      }

      // 3. Request decision from AI
      const decision = await requestDecision(character, perception);

      // 4. Execute the returned action
      const action = decision.action || 'idle';

      switch (action) {
        case 'moveTo':
          if (decision.target) {
            character.moveTo(decision.target);
          }
          break;

        case 'speak':
          if (decision.dialogue) {
            // character.speak() emits 'character:speak' which ui.js listens to
            character.speak(decision.dialogue);
          }
          break;

        case 'emote':
          if (decision.mood) {
            character.setMood(decision.mood);
          }
          break;

        case 'interact':
          if (decision.dialogue) {
            character.speak(decision.dialogue);
          }
          break;

        case 'idle':
        default:
          break;
      }

      // 5. Update mood + store thought for debug
      if (decision.mood) {
        character.setMood(decision.mood);
      }
      if (decision.thought) {
        character.lastThought = decision.thought;
      }

      // 6. Add to history
      addToHistory({
        type: action,
        actor: character.name,
        description: decision.dialogue || decision.thought || action,
      });

      // 7. Emit character action event
      eventBus.emit('characterAction', {
        type: action,
        actor: character.name,
        decision,
      });

      // Reset error count on success
      consecutiveErrors = 0;
    } catch (err) {
      console.error(`Agent loop error for ${character.name}:`, err);
      consecutiveErrors++;

      // Extra cooldown after repeated failures
      if (consecutiveErrors >= 3) {
        console.warn(`${character.name}: ${consecutiveErrors} consecutive errors, cooling down 30s`);
        await delay(30000);
        consecutiveErrors = 0;
      }
    }

    await delay(interval);
  }
}

function startAllAgentLoops(characters) {
  characters.forEach((character, index) => {
    const stagger = index * 5000;
    setTimeout(() => {
      startAgentLoop(character, characters);
    }, stagger);
  });

  // Clear operator buffer after all characters have had a chance to see it
  // (last character starts at 10s, so clear at 12s, then every 15s)
  setTimeout(() => {
    setInterval(() => clearOperatorBuffer(), 15000);
  }, 12000);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export { startAgentLoop, startAllAgentLoops };
