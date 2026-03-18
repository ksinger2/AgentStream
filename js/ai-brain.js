// Claude API integration with request queue

const pendingQueue = [];
let activeRequests = 0;
const MAX_CONCURRENT = 1;
const responseStats = new Map();

function requestDecision(character, perception) {
  return new Promise((resolve, reject) => {
    if (activeRequests < MAX_CONCURRENT) {
      executeRequest(character, perception, resolve, reject);
    } else {
      pendingQueue.push({ resolve, reject, args: { character, perception } });
    }
  });
}

async function executeRequest(character, perception, resolve, reject) {
  activeRequests++;
  const startTime = performance.now();

  try {
    const response = await fetch('/api/decide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        characterName: character.name,
        personality: character.personality,
        perception,
      }),
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const json = await response.json();
    const elapsed = performance.now() - startTime;
    trackStats(character.name, elapsed);
    resolve(json.data);
  } catch (err) {
    console.error(`AI request failed for ${character.name}:`, err);
    reject(err);
  } finally {
    activeRequests--;
    processQueue();
  }
}

function processQueue() {
  if (pendingQueue.length === 0 || activeRequests >= MAX_CONCURRENT) return;
  const next = pendingQueue.shift();
  executeRequest(next.args.character, next.args.perception, next.resolve, next.reject);
}

function trackStats(characterName, responseTime) {
  const existing = responseStats.get(characterName);
  if (existing) {
    existing.requestCount++;
    existing.lastResponseTime = responseTime;
    existing.avgResponseTime =
      (existing.avgResponseTime * (existing.requestCount - 1) + responseTime) /
      existing.requestCount;
  } else {
    responseStats.set(characterName, {
      lastResponseTime: responseTime,
      avgResponseTime: responseTime,
      requestCount: 1,
    });
  }
}

function getResponseStats() {
  return new Map(responseStats);
}

export { requestDecision, getResponseStats };
