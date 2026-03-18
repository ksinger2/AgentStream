// Event bus + shared world state for decoupled communication between modules

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

// Shared world state — consumed by agent-loop and characters
export const worldState = {
  currentEvent: null,
  history: [],
  operatorBuffer: [],
};

// Convenience alias used by characters.js getPerception()
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

export function bufferOperatorEvent(text) {
  worldState.operatorBuffer.push(text);
}

export function consumeOperatorEvents() {
  // Returns a copy — buffer is cleared only after ALL characters have been given
  // a chance to see it (cleared after one full cycle via clearOperatorBuffer)
  return worldState.operatorBuffer.slice();
}

export function clearOperatorBuffer() {
  worldState.operatorBuffer.length = 0;
}

// Wire operator:command events into the buffer automatically
eventBus.on('operator:command', ({ text }) => {
  bufferOperatorEvent(text);
});
