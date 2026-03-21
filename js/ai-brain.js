// Preset + AI hybrid brain system
// Regular dialogue: presets (zero cost)
// Drama moments + confessionals: AI via server endpoint (budget-capped)

const DIALOGUE_POOL = {
  speak: [
    "So what d'you actually do then? You look like you work in finance or something haha",
    "Nah shut up, you did NOT just say that. That's well rude!",
    "I'm not even gonna lie, I'm proper buzzing right now",
    "You're actually jokes though, I didn't expect that",
    "Oh my god babe, come here — you will NOT believe what just happened",
    "Listen yeah, I've got my eye on someone and I ain't being subtle about it",
    "I swear if someone mugs me off again I'm gonna lose it",
    "Can we just appreciate how fit everyone is in here though?",
    "I'm getting proper good vibes from you, not gonna lie",
    "That's a bit sus though innit, like why would they say that?",
    "Right I need a chat with you because I've heard some things",
    "I'm not being funny but that outfit is absolutely killing it babe",
    "Who d'you reckon is the biggest game player in here?",
    "Honestly? I came in here thinking I knew my type and now I'm confused",
    "I'm not the jealous type but if someone tried it on with my partner I'd go mad",
    "Has anyone got any snacks? I'm absolutely starving",
    "I proper love it in here, best decision I ever made coming on this show",
    "D'you know what, I think today's gonna be a good day",
    "I've been thinking about what you said earlier and you're actually right",
    "Right who wants a cuppa? I'm putting the kettle on",
    "I'm actually SO happy right now, like this is exactly what I needed",
    "You know what winds me up? When people chat behind your back instead of saying it to your face",
    "I've got the biggest smile on my face and I cannot stop it",
    "Babe, I need your honest opinion — am I being too much?",
    "I woke up today and just thought, you know what, today's MY day",
    "This is giving me proper butterflies and I hate it because I don't do feelings",
    "Can someone PLEASE explain to me what just happened because I'm lost",
    "I'm just gonna be myself and if people don't like it that's their problem innit",
    "Hold on, hold on — let me process this because my brain is NOT braining right now",
    "Right that's it, I'm pulling them for a chat because I need answers",
    "Anyone else feel like this place brings out sides of you that you didn't know existed?",
    "Nah this is peak, I love it here so much",
    "I'm trying to play it cool but inside I'm absolutely screaming",
    "You lot are actually mad, I've never laughed so much in my life",
    "OK but seriously though, who's making breakfast? Because I'm useless in the kitchen",
    "I feel like today something big is going to happen, I can feel it in my bones",
    "Don't look at me like that, you KNOW what you did",
    "I'm just vibing honestly, like whatever happens, happens",
    "That conversation we just had was everything, I needed that so badly",
    "Why is everyone being so quiet? That's suspicious behaviour right there",
  ],
  flirt: [
    "So come on then, what's your type on paper?",
    "I'm not gonna lie, you've got proper nice eyes",
    "Are you always this charming or is it just for my benefit?",
    "I reckon me and you would actually be well good together",
    "Stop looking at me like that, you're making me go red!",
    "You're well fit though, has anyone told you that today?",
    "I keep catching myself staring at you and I'm not even sorry",
    "You smell amazing, what is that? I need to get closer to check",
    "If I wasn't trying to be cool right now I'd be giggling like a schoolkid",
    "I've never been grafted on like this before and honestly? I'm here for it",
    "Your smile does something to me and I can't even explain it",
    "I could sit and talk to you all night, you know that?",
    "I feel like we've got this connection that nobody else can see yet",
  ],
  gossip: [
    "Have you noticed how they keep looking at each other? Something's going on there",
    "Right don't tell anyone but I heard that they're not actually that into each other",
    "I'm getting snake vibes from someone in here and I'm not happy about it",
    "Did you see what happened earlier? I was absolutely screaming",
    "Between me and you, I think someone's about to make a move",
    "I overheard them chatting and honestly I was shook",
    "OK so I probably shouldn't be telling you this but... someone's head has turned",
    "I've been keeping my mouth shut but I need to say something because it's eating me up",
    "Have you clocked how they act different when the cameras are on them?",
    "Babe, pull up a chair because I have TEA and it is piping hot",
    "Something went down last night and I'm trying to piece together what happened",
    "I'm not one to gossip but... actually yes I am, come here",
  ],
  confront: [
    "Oi, can I have a word? Because I'm not happy about what you said earlier",
    "Don't mug me off like that, I'm being serious right now",
    "You need to be honest with me because I've heard some things",
    "I'm not starting drama but that was proper disrespectful",
    "Nah we need to clear the air because this ain't it",
    "I've been holding this in but I can't anymore — we need to talk",
    "Look me in the eyes and tell me the truth because I already know what happened",
    "Don't walk away from me, I'm trying to have a conversation here",
    "Everyone's been tiptoeing around this but I'm just gonna say it",
    "That was a proper low blow and you know it",
  ],
  morning: [
    "Morning gorgeous! Did you sleep alright? I barely slept, too much going on in my head",
    "Who's making coffee? I am NOT a morning person and I need caffeine NOW",
    "Right, new day new me. Yesterday was yesterday, today I'm on a mission",
    "Good morning villa! Today's gonna be a good one, I can feel it",
    "I had the weirdest dream about this place last night, proper bizarre",
  ],
  night: [
    "*whispers* Are you still awake? I can't stop thinking about what happened today",
    "I wonder what tomorrow's gonna bring... I'm nervous but excited",
    "Night night everyone... well, most of you anyway",
    "*yawns* I'm absolutely knackered but my brain won't switch off",
    "Sweet dreams babe, don't let the bed bugs bite",
  ],
  postDrama: [
    "Did that just actually happen? I'm still shaking honestly",
    "Well THAT was unexpected. I did NOT see that coming",
    "I need a minute because my head is absolutely spinning after that",
    "Right, everyone needs to calm down because that was A LOT",
    "I'm still processing what just went down... like, wow",
    "That's changed everything hasn't it? The whole dynamic just shifted",
    "I knew something like that was gonna happen, I could feel the tension building",
  ],
};

const MOODS = ['😊', '😏', '😍', '😂', '🤔', '😤', '😢', '😈', '🥰', '😐'];

const THOUGHTS = [
  "I need to step up my game",
  "This could actually go somewhere",
  "I don't trust them fully yet",
  "I'm having the best time",
  "Someone's playing games and I can see right through it",
  "Need to pull them for a chat later",
  "I wonder what everyone thinks of me",
  "Today's been emotional ngl",
  "I'm feeling really good about this",
  "Something doesn't feel right",
];

// Track which dialogues have been used to avoid repeats
const usedDialogue = new Set();

function pickRandom(arr) {
  // Try to avoid recent repeats
  const unused = arr.filter(item => !usedDialogue.has(item));
  const pool = unused.length > 0 ? unused : arr;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  usedDialogue.add(pick);
  // Reset when we've used most of them
  if (usedDialogue.size > 40) usedDialogue.clear();
  return pick;
}

const VALID_ACTIONS = new Set(['speak', 'moveTo', 'flirt', 'gossip', 'confront', 'emote', 'idle', 'scheme', 'interact']);

async function requestDecision(character, perception, context = 'general') {
  try {
    const decision = await requestAIDecision(character, perception, context);
    // Validate action is in known set
    if (decision && decision.action && VALID_ACTIONS.has(decision.action)) {
      return decision;
    }
    // Unknown action — fall back
    console.warn(`AI returned unknown action "${decision?.action}", falling back to preset`);
    return generatePresetDecision(character);
  } catch (err) {
    // AI failed — fall back to preset with natural delay
    return new Promise((resolve) => {
      const delay = 800 + Math.random() * 2000;
      setTimeout(() => {
        resolve(generatePresetDecision(character));
      }, delay);
    });
  }
}

function generatePresetDecision(character) {
  // Weighted action selection — speak most often, with some movement and variety
  const roll = Math.random();
  let action;
  if (roll < 0.40) action = 'speak';
  else if (roll < 0.55) action = 'moveTo';
  else if (roll < 0.70) action = 'flirt';
  else if (roll < 0.80) action = 'gossip';
  else if (roll < 0.88) action = 'confront';
  else if (roll < 0.94) action = 'emote';
  else action = 'idle';

  if (action === 'moveTo') {
    const zones = ['Kitchen', 'Living Room', 'Bedroom', 'Bathroom'];
    // Don't move to current zone
    const otherZones = zones.filter(z => z !== character.currentZone);
    const target = otherZones[Math.floor(Math.random() * otherZones.length)];
    return {
      action: 'moveTo',
      target,
      dialogue: '',
      mood: pickRandom(MOODS),
      thought: pickRandom(THOUGHTS),
    };
  }

  if (action === 'emote' || action === 'idle') {
    return {
      action,
      dialogue: '',
      mood: pickRandom(MOODS),
      thought: pickRandom(THOUGHTS),
    };
  }

  const pool = DIALOGUE_POOL[action] || DIALOGUE_POOL.speak;
  return {
    action,
    dialogue: pickRandom(pool),
    mood: pickRandom(MOODS),
    thought: pickRandom(THOUGHTS),
  };
}

// AI decision — calls server endpoint for drama/confessional moments
// Falls back to preset if API fails, budget exceeded, or AI disabled
async function requestAIDecision(character, perception, context = 'drama') {
  try {
    const res = await fetch('/api/ai/decide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        characterName: character.name,
        perception,
        context,
        voiceId: character.voiceId || null,
      }),
    });

    if (!res.ok) {
      // 429 = budget exceeded, 503 = AI disabled — fall back to preset
      console.warn(`AI endpoint returned ${res.status}, falling back to preset`);
      return generatePresetDecision(character);
    }

    const data = await res.json();
    if (data && data.decision) {
      return data.decision;
    }
    return generatePresetDecision(character);
  } catch (err) {
    console.warn('AI decision failed, using preset:', err.message);
    return generatePresetDecision(character);
  }
}

function getResponseStats() {
  return new Map();
}

export { requestDecision, requestAIDecision, getResponseStats };
