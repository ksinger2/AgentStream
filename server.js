require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const anthropic = new Anthropic.default({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.use(cors());
app.use(express.json());

// Serve only public-facing files, not the entire project root
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

function timestamp() {
  return new Date().toISOString();
}

function extractJSON(text) {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch (_) {
    // Fallback: extract from markdown code fences
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      try {
        return JSON.parse(fenceMatch[1].trim());
      } catch (_) {
        // Fall through
      }
    }
    // Fallback: find first { ... } block
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]);
      } catch (_) {
        // Fall through
      }
    }
    return null;
  }
}

const FALLBACK_RESPONSE = {
  action: "idle",
  dialogue: "Hmm...",
  mood: "\uD83D\uDE10",
  thought: "Error occurred",
};

app.post("/api/decide", async (req, res) => {
  const { characterName, personality, perception } = req.body;

  if (!characterName || !personality || !perception) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "characterName, personality, and perception are required",
      },
    });
  }

  console.log(`[${timestamp()}] /api/decide request for "${characterName}"`);

  const systemPrompt = `You are controlling a character named "${characterName}" in a reality TV show simulation.
Their personality: ${personality}

Respond ONLY with valid JSON matching this exact schema. No markdown, no explanation, no extra text.
{
  "action": "moveTo" | "speak" | "emote" | "interact" | "idle",
  "target": "<string: location or object or person to target>",
  "dialogue": "<string: what the character says, max 100 characters>",
  "mood": "<string: single emoji representing current mood>",
  "thought": "<string: internal thought>"
}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const message = await anthropic.messages.create(
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 256,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Current perception of the environment:\n${perception}\n\nWhat does ${characterName} do next?`,
          },
        ],
      },
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    const rawText = message.content[0]?.text || "";
    console.log(`[${timestamp()}] Claude response for "${characterName}": ${rawText.substring(0, 120)}`);

    const parsed = extractJSON(rawText);

    if (parsed && parsed.action) {
      // Enforce dialogue max length
      if (parsed.dialogue && parsed.dialogue.length > 100) {
        parsed.dialogue = parsed.dialogue.substring(0, 100);
      }
      return res.json({ data: parsed });
    }

    console.warn(`[${timestamp()}] Failed to parse Claude response for "${characterName}"`);
    return res.json({ data: FALLBACK_RESPONSE });
  } catch (err) {
    console.error(`[${timestamp()}] Error for "${characterName}": ${err.message}`);
    return res.json({ data: FALLBACK_RESPONSE });
  }
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: timestamp() });
});

app.listen(PORT, () => {
  console.log(`[${timestamp()}] AgentStream server running on http://localhost:${PORT}`);
});
