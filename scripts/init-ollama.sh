#!/bin/sh
# Waits for Ollama to be ready, then pulls the model if not present.
# Usage: OLLAMA_HOST=ollama OLLAMA_MODEL=mistral ./scripts/init-ollama.sh

OLLAMA_HOST="${OLLAMA_HOST:-localhost}"
OLLAMA_MODEL="${OLLAMA_MODEL:-mistral}"
OLLAMA_URL="http://${OLLAMA_HOST}:11434"

echo "Waiting for Ollama at ${OLLAMA_URL}..."
until curl -sf "${OLLAMA_URL}/" > /dev/null 2>&1; do
  sleep 2
done
echo "Ollama is ready."

# Check if model is already pulled
if curl -sf "${OLLAMA_URL}/api/tags" | grep -q "\"${OLLAMA_MODEL}\""; then
  echo "Model '${OLLAMA_MODEL}' already available."
else
  echo "Pulling model '${OLLAMA_MODEL}'..."
  curl -sf "${OLLAMA_URL}/api/pull" -d "{\"name\":\"${OLLAMA_MODEL}\"}"
  echo "Model '${OLLAMA_MODEL}' pulled."
fi
