require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// AI config — budget-capped, disabled by default
const AI_ENABLED = process.env.AI_ENABLED === "true";
const DAILY_AI_BUDGET = parseInt(process.env.DAILY_AI_BUDGET || "50000", 10);
let dailyCallCount = 0;
let dailyResetDate = new Date().toDateString();

// Ollama config
const OLLAMA_HOST = process.env.OLLAMA_HOST || "localhost";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "mistral";

// TTS config — ElevenLabs, disabled by default (zero cost)
const TTS_ENABLED = process.env.TTS_ENABLED === "true";
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const TTS_DIR = path.join(__dirname, "public", "assets", "audio", "tts");
const TTS_MAX_FILES = 50;

if (TTS_ENABLED) {
  fs.mkdirSync(TTS_DIR, { recursive: true });
}

async function generateTTS(text, voiceId) {
  if (!TTS_ENABLED || !ELEVENLABS_API_KEY || !voiceId) return null;
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.4, similarity_boost: 0.8 },
      }),
    });
    if (!res.ok) {
      console.error(`[${timestamp()}] ElevenLabs error: ${res.status}`);
      return null;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const filename = `tts-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp3`;
    const filepath = path.join(TTS_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    cleanupTTSFiles();
    return `/assets/audio/tts/${filename}`;
  } catch (err) {
    console.error(`[${timestamp()}] TTS generation failed:`, err.message);
    return null;
  }
}

function cleanupTTSFiles() {
  try {
    const files = fs.readdirSync(TTS_DIR)
      .filter(f => f.endsWith(".mp3"))
      .map(f => ({ name: f, time: fs.statSync(path.join(TTS_DIR, f)).mtimeMs }))
      .sort((a, b) => b.time - a.time);
    if (files.length > TTS_MAX_FILES) {
      for (const f of files.slice(TTS_MAX_FILES)) {
        fs.unlinkSync(path.join(TTS_DIR, f.name));
      }
    }
  } catch (_) {}
}

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

function timestamp() {
  return new Date().toISOString();
}

// ─── Crowd-Source Voting Poll System ───
let activePoll = null;
let pollVotes = {};
let pollId = 0;

app.post("/api/poll/create", (req, res) => {
  const { type, question, options } = req.body;
  if (!type || !question || !options || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "type, question, and options (2+) are required" } });
  }

  pollId++;
  activePoll = { id: pollId, type, question, options, createdAt: Date.now() };
  pollVotes = {};
  for (const opt of options) {
    pollVotes[opt.label] = 0;
  }

  console.log(`[${timestamp()}] Poll created: ${question}`);
  return res.json({ data: { poll: activePoll, votes: pollVotes } });
});

app.post("/api/poll/vote", (req, res) => {
  const { option } = req.body;
  if (!activePoll) {
    return res.status(404).json({ error: { code: "NO_POLL", message: "No active poll" } });
  }
  if (pollVotes[option] === undefined) {
    return res.status(400).json({ error: { code: "INVALID_OPTION", message: "Invalid vote option" } });
  }
  pollVotes[option]++;
  return res.json({ data: { votes: { ...pollVotes } } });
});

app.get("/api/poll", (_req, res) => {
  if (!activePoll) {
    return res.json({ data: null });
  }
  return res.json({ data: { poll: activePoll, votes: { ...pollVotes } } });
});

app.post("/api/poll/close", (_req, res) => {
  if (!activePoll) {
    return res.status(404).json({ error: { code: "NO_POLL", message: "No active poll" } });
  }
  const result = { poll: activePoll, votes: { ...pollVotes } };
  let maxVotes = 0;
  let winner = null;
  for (const [label, count] of Object.entries(pollVotes)) {
    if (count > maxVotes) {
      maxVotes = count;
      winner = label;
    }
  }
  result.winner = winner;
  result.winnerVotes = maxVotes;
  activePoll = null;
  pollVotes = {};
  console.log(`[${timestamp()}] Poll closed. Winner: ${winner} (${maxVotes} votes)`);
  return res.json({ data: result });
});

// ─── Budget-Capped AI Decision Endpoint ───
const SYSTEM_PROMPTS = {
  general: `You are a Love Island contestant making a decision. Choose ONE action based on your personality, memories, and current situation.

Actions: speak, moveTo, flirt, gossip, confront, emote, idle

Respond with JSON:
{"action":"your action","target":"zone name for moveTo OR character name for speech actions","reason":"why you chose this action","dialogue":"what you say (empty for moveTo/emote/idle)","audioDialogue":"same dialogue rewritten for voice acting: use ... for pauses, ALL CAPS for emphasis, — for dramatic pauses, ! for energy","mood":"emoji","thought":"inner thought"}

Movement rules:
- Use moveTo to go find someone specific, escape drama, seek privacy, or explore
- target must be one of: Kitchen, Living Room, Bedroom, Bathroom
- ALWAYS have a reason for moving — you're going somewhere WITH PURPOSE
- If someone you want to talk to is in another room, go find them

Speech rules:
- target should be the name of the character you're addressing
- Keep dialogue under 2 sentences. Use British slang.
- Match your personality and current mood

Be intentional. Real people don't wander randomly — they go places for reasons.`,

  night: `You are a Love Island contestant in bed at night. It's PILLOW TALK time — intimate, whispered, raw.

Actions: speak, flirt, gossip, confront, emote, idle (NO moveTo — you CANNOT leave the Bedroom at night)

Respond with JSON:
{"action":"your action","target":"character name you're addressing","reason":"why","dialogue":"what you whisper","audioDialogue":"same dialogue rewritten for voice acting: use ... for pauses, ALL CAPS for emphasis, — for dramatic pauses, ! for energy","mood":"emoji","thought":"inner thought"}

Night rules:
- Be vulnerable, confess feelings, question relationships, share fears about recoupling
- Or be sneaky — whisper about other islanders, plot moves, stir things up
- Keep it intimate and whispered. Under 2 sentences. British slang.
- You CANNOT leave the Bedroom. Do NOT use moveTo.`,

  drama: `You are a Love Island contestant reacting to DRAMA. Be dramatic, emotional, and entertaining. Respond with JSON: {"action":"speak","dialogue":"your line","audioDialogue":"same line rewritten for voice acting: use ... for pauses, ALL CAPS for emphasis, — for dramatic pauses, ! for energy","mood":"emoji","thought":"inner thought"}. Keep dialogue under 2 sentences. Use British slang.`,
  confessional: `You are a Love Island contestant in the Beach Hut confessional. Speak directly to camera. Be raw, honest, funny or emotional. Respond with JSON: {"action":"speak","dialogue":"your confessional","audioDialogue":"same confessional rewritten for voice acting: use ... for pauses, ALL CAPS for emphasis, — for dramatic pauses, ! for energy","mood":"emoji","thought":"inner thought"}. Keep it under 3 sentences. Use British slang.`,
};

app.post("/api/ai/decide", async (req, res) => {
  // Reset daily counter at midnight
  const today = new Date().toDateString();
  if (today !== dailyResetDate) {
    dailyCallCount = 0;
    dailyResetDate = today;
  }

  if (!AI_ENABLED) {
    return res.status(503).json({ error: { code: "AI_DISABLED", message: "AI is disabled" } });
  }

  if (dailyCallCount >= DAILY_AI_BUDGET) {
    return res.status(429).json({ error: { code: "BUDGET_EXCEEDED", message: `Daily AI budget of ${DAILY_AI_BUDGET} calls exceeded` } });
  }

  const { characterName, perception, context, voiceId } = req.body;
  if (!characterName || !perception) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "characterName and perception required" } });
  }

  const systemPrompt = SYSTEM_PROMPTS[context] || SYSTEM_PROMPTS.drama;

  try {
    dailyCallCount++;
    const ollamaUrl = `http://${OLLAMA_HOST}:11434/api/chat`;
    const ollamaRes = await fetch(ollamaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Character: ${characterName}\n${perception}` },
        ],
        stream: false,
        options: { temperature: 0.9, num_predict: (context === 'general' || context === 'night') ? 250 : 200 },
      }),
    });

    if (!ollamaRes.ok) {
      throw new Error(`Ollama returned ${ollamaRes.status}: ${await ollamaRes.text()}`);
    }

    const ollamaData = await ollamaRes.json();
    const raw = ollamaData.message?.content || "";
    let decision;
    try {
      // Try to parse JSON from the response
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      decision = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (_) {
      // If not valid JSON, wrap the text as dialogue
      decision = { action: "speak", dialogue: raw.slice(0, 200), mood: "😏", thought: "" };
    }

    // Generate TTS audio if enabled
    let audioUrl = null;
    if (TTS_ENABLED && decision && voiceId) {
      const ttsText = decision.audioDialogue || decision.dialogue;
      if (ttsText) {
        audioUrl = await generateTTS(ttsText, voiceId);
      }
    }
    if (decision) decision.audioUrl = audioUrl;

    console.log(`[${timestamp()}] AI call #${dailyCallCount}/${DAILY_AI_BUDGET} for ${characterName} (${context})${audioUrl ? ' [TTS]' : ''}`);
    return res.json({ decision });
  } catch (err) {
    console.error(`[${timestamp()}] AI error:`, err.message);
    return res.status(500).json({ error: { code: "AI_ERROR", message: err.message } });
  }
});

app.get("/api/ai/stats", (_req, res) => {
  res.json({
    data: {
      enabled: AI_ENABLED,
      dailyCalls: dailyCallCount,
      dailyBudget: DAILY_AI_BUDGET,
      remaining: Math.max(0, DAILY_AI_BUDGET - dailyCallCount),
    },
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: timestamp() });
});

app.listen(PORT, () => {
  console.log(`[${timestamp()}] AgentStream server running on http://localhost:${PORT}`);
  if (AI_ENABLED) {
    console.log(`[${timestamp()}] Mode: AI-DRIVEN — all decisions via Ollama (budget: ${DAILY_AI_BUDGET}/day, model: ${OLLAMA_MODEL}, host: ${OLLAMA_HOST})`);
  } else {
    console.log(`[${timestamp()}] Mode: OFFLINE — preset scripts only (set AI_ENABLED=true to enable AI)`);
  }
  if (TTS_ENABLED) {
    console.log(`[${timestamp()}] TTS: ENABLED — ElevenLabs voice generation active`);
  }
});
