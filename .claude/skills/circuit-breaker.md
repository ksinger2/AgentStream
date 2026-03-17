---
name: circuit-breaker
description: Drop-in circuit breaker with retry, backoff, timeout, and graceful fallback — use when integrating external APIs or any unreliable dependency (Claude API, databases, third-party services)
---

# Circuit Breaker — Drop-In Resilience

Use this skill when building any integration that calls an external service. The circuit breaker prevents cascading failures by failing fast when a dependency is unhealthy, then automatically recovering when it comes back.

## When to Use

- Any Claude/LLM API call (streaming or request/response)
- Database connections through unreliable networks
- Third-party API integrations (Stripe, Twilio, etc.)
- Microservice-to-microservice calls
- Any 24/7 or long-running application that can't afford to hang

## Architecture

```
Request → [Circuit Breaker] → [Retry w/ Backoff] → [Timeout] → External Service
                ↓ (if open)
           [Fallback Response]
```

**States:**
- **CLOSED** (normal): requests flow through, failures are counted
- **OPEN** (tripped): requests short-circuit to fallback immediately
- **HALF-OPEN** (probing): one test request allowed through to check recovery

## JavaScript/TypeScript Implementation

### `lib/circuit-breaker.js`

```javascript
class CircuitBreaker {
  constructor(fn, options = {}) {
    this.fn = fn;
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeout = options.resetTimeout ?? 30000;
    this.timeout = options.timeout ?? 10000;
    this.fallbackFn = options.fallback ?? null;
    this.onStateChange = options.onStateChange ?? null;
  }

  async call(...args) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this._setState('HALF_OPEN');
      } else {
        return this._fallback('Circuit OPEN — skipping call');
      }
    }

    try {
      const result = await this._callWithTimeout(args);
      this._onSuccess();
      return result;
    } catch (error) {
      this._onFailure(error);
      return this._fallback(error.message);
    }
  }

  async _callWithTimeout(args) {
    return Promise.race([
      this.fn(...args),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${this.timeout}ms`)), this.timeout)
      ),
    ]);
  }

  _onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this._setState('CLOSED');
    }
  }

  _onFailure(error) {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this._setState('OPEN');
    }
  }

  _setState(newState) {
    const oldState = this.state;
    this.state = newState;
    if (this.onStateChange) {
      this.onStateChange(oldState, newState);
    }
    console.warn(`[CircuitBreaker] ${oldState} → ${newState}`);
  }

  _fallback(reason) {
    if (this.fallbackFn) {
      console.warn(`[CircuitBreaker] Using fallback: ${reason}`);
      return this.fallbackFn(reason);
    }
    throw new Error(`Circuit breaker open, no fallback: ${reason}`);
  }
}

module.exports = { CircuitBreaker };
```

### `lib/resilient-fetch.js` — Retry + Backoff Wrapper

```javascript
const { CircuitBreaker } = require('./circuit-breaker');

const DEFAULT_RETRY_OPTIONS = {
  retries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['overloaded_error', 'api_error', 'rate_limit_error'],
};

async function resilientFetch(url, fetchOptions = {}, retryOptions = {}) {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...retryOptions };

  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    try {
      const res = await fetch(url, fetchOptions);

      // Parse response
      const data = await res.json();

      // Check for API-level errors that are retryable
      if (data.error?.type && opts.retryableErrors.includes(data.error.type)) {
        throw new RetryableError(data.error.type, data.error.message);
      }

      // Check for retryable HTTP status codes
      if (opts.retryableStatuses.includes(res.status)) {
        throw new RetryableError(res.status, `HTTP ${res.status}`);
      }

      return data;
    } catch (error) {
      const isLastAttempt = attempt === opts.retries;
      const isRetryable = error instanceof RetryableError || error.name === 'TypeError'; // network errors

      if (isLastAttempt || !isRetryable) {
        throw error;
      }

      const delay = Math.min(
        opts.baseDelay * Math.pow(2, attempt) + Math.random() * 1000, // jitter
        opts.maxDelay
      );
      console.warn(
        `[resilientFetch] Attempt ${attempt + 1}/${opts.retries} failed: ${error.message}. Retrying in ${Math.round(delay / 1000)}s`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

class RetryableError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'RetryableError';
    this.code = code;
  }
}

module.exports = { resilientFetch, RetryableError };
```

### Usage: Claude API with Circuit Breaker

```javascript
const { CircuitBreaker } = require('./lib/circuit-breaker');
const { resilientFetch } = require('./lib/resilient-fetch');

// Define your fallback behavior
const FALLBACK_RESPONSE = {
  content: [{ text: JSON.stringify({
    goal: 'wait around',
    steps: ['stand idle', 'look around'],
    dialogue: null,
    moodChange: null,
  })}],
};

// Raw API call function
async function rawClaudeCall(payload) {
  return resilientFetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(payload),
  });
}

// Wrap in circuit breaker
const claudeBreaker = new CircuitBreaker(rawClaudeCall, {
  failureThreshold: 3,      // Open after 3 consecutive failures
  resetTimeout: 30000,       // Try again after 30s
  timeout: 15000,            // 15s per-request timeout
  fallback: () => FALLBACK_RESPONSE,
  onStateChange: (from, to) => {
    if (to === 'OPEN') console.error('[Claude] Circuit OPEN — all calls will use fallback');
    if (to === 'CLOSED') console.log('[Claude] Circuit recovered');
  },
});

// Use it
async function callClaude(payload) {
  return claudeBreaker.call(payload);
}
```

### Usage: Staggered Parallel Calls (Prevent Thundering Herd)

```javascript
// DON'T: all characters hit the API at once
characters.forEach(c => characterLoop(c));

// DO: stagger starts by 2-3 seconds each
characters.forEach((c, i) => {
  setTimeout(() => characterLoop(c), i * 3000);
});
```

## Python Implementation

### `lib/circuit_breaker.py`

```python
import time
import asyncio
import logging
from enum import Enum
from typing import Callable, Any, Optional

logger = logging.getLogger(__name__)


class State(Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"


class CircuitBreaker:
    def __init__(
        self,
        fn: Callable,
        failure_threshold: int = 5,
        reset_timeout: float = 30.0,
        timeout: float = 10.0,
        fallback: Optional[Callable] = None,
    ):
        self.fn = fn
        self.state = State.CLOSED
        self.failure_count = 0
        self.last_failure_time = 0.0
        self.failure_threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self.timeout = timeout
        self.fallback = fallback

    async def call(self, *args, **kwargs) -> Any:
        if self.state == State.OPEN:
            if time.time() - self.last_failure_time >= self.reset_timeout:
                self._set_state(State.HALF_OPEN)
            else:
                return self._do_fallback("Circuit OPEN")

        try:
            result = await asyncio.wait_for(self.fn(*args, **kwargs), timeout=self.timeout)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure(e)
            return self._do_fallback(str(e))

    def _on_success(self):
        self.failure_count = 0
        if self.state == State.HALF_OPEN:
            self._set_state(State.CLOSED)

    def _on_failure(self, error):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self._set_state(State.OPEN)

    def _set_state(self, new_state: State):
        old = self.state
        self.state = new_state
        logger.warning(f"[CircuitBreaker] {old.value} → {new_state.value}")

    def _do_fallback(self, reason: str):
        if self.fallback:
            logger.warning(f"[CircuitBreaker] Using fallback: {reason}")
            return self.fallback(reason)
        raise RuntimeError(f"Circuit breaker open, no fallback: {reason}")
```

### `lib/resilient_request.py` — Retry + Backoff

```python
import asyncio
import random
import logging
import httpx

logger = logging.getLogger(__name__)

RETRYABLE_STATUSES = {408, 429, 500, 502, 503, 504}
RETRYABLE_ERROR_TYPES = {"overloaded_error", "api_error", "rate_limit_error"}


async def resilient_request(
    url: str,
    method: str = "POST",
    retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 30.0,
    timeout: float = 15.0,
    **kwargs,
) -> dict:
    async with httpx.AsyncClient(timeout=timeout) as client:
        for attempt in range(retries + 1):
            try:
                response = await client.request(method, url, **kwargs)
                data = response.json()

                error_type = (data.get("error") or {}).get("type", "")
                if error_type in RETRYABLE_ERROR_TYPES:
                    raise RetryableError(error_type)

                if response.status_code in RETRYABLE_STATUSES:
                    raise RetryableError(f"HTTP {response.status_code}")

                return data

            except (RetryableError, httpx.TransportError) as e:
                if attempt == retries:
                    raise
                delay = min(base_delay * (2 ** attempt) + random.uniform(0, 1), max_delay)
                logger.warning(f"Attempt {attempt + 1}/{retries} failed: {e}. Retrying in {delay:.1f}s")
                await asyncio.sleep(delay)

    raise RuntimeError("Unreachable")


class RetryableError(Exception):
    pass
```

## Configuration Guidelines

| Parameter | Default | 24/7 Stream | Interactive App | Batch Job |
|-----------|---------|-------------|-----------------|-----------|
| `failureThreshold` | 5 | 3 | 5 | 10 |
| `resetTimeout` | 30s | 30s | 15s | 60s |
| `timeout` | 10s | 15s | 10s | 60s |
| `retries` | 3 | 3 | 2 | 5 |
| `baseDelay` | 1s | 2s | 1s | 5s |

## Key Rules

1. **Always define a fallback** — never let the circuit breaker throw to the user
2. **Log state changes** — OPEN/CLOSED transitions are critical operational signals
3. **Stagger parallel calls** — prevent thundering herd after recovery
4. **Don't retry 4xx errors** — they won't succeed on retry
5. **Use jitter on backoff** — `delay + random()` prevents synchronized retries
6. **Monitor the circuit** — track open/closed ratio as a health metric
7. **Fallback should be safe** — idle/cached behavior, never a mutation
