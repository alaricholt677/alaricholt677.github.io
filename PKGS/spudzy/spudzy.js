// spudzy.js
// Full browser-safe Spudzy AI engine

class Spudzy {
  constructor(config = {}) {
    this.cfg = Object.assign({
      maxHistory: 32,
      defaultMode: "neutral",
      enableMath: true,
      enableCodeGen: true,
      enableKB: true,
      enableSentiment: true
    }, config);

    this.history = [];

    this.vocab = {
      verbs: ["run","eat","think","compute","optimize","debug","calculate","explain","analyze","generate","summarize","compare","evaluate","parse","respond","learn","guess"],
      nouns: ["spudzy","ai","model","user","code","system","math","chat","message","response","question","answer","idea","concept","number","expression","function","plugin"],
      adjectives: ["chaotic","tiny","experimental","sassy","confused","curious","sharp","friendly","playful","serious","helpful","weird","nerdy","spicy"],
      slang: ["bruh","fr","nah","wild","cookin","based","cracked","lowkey","highkey","vibes"],
      positive: ["good","great","awesome","nice","cool","love","like","enjoy","fun","amazing"],
      negative: ["bad","terrible","hate","awful","annoying","boring","lame","trash","mid"],
roastPhrases: [
        // --- Tech & Brain Overheating ---
        "you really typed that with confidence huh",
        "that message needs a software update",
        "your keyboard deserves an apology",
        "even Spudzy is buffering after reading that",
        "that input was a whole bug report in disguise",
        "i ran your text through an AI model and it gave up on humanity",
        "are you using internet explorer? because your logic is 10 years behind",
        "your brain is running on a 2G network in a tunnel",
        "is your CPU getting thermal throttled, or do you always think this slowly?",
        "this input is concrete proof that natural selection has paused",
        "i've seen random text generators with more processing power than this thought process",
        "delete this config file immediately, it's corrupting my database",
        "your critical thinking skills are stored in a scratchpad that gets wiped every 2 seconds",
        
        // --- The Passive-Aggressive "Are you okay?" ---
        "did you type this while falling down a flight of stairs? genuinely asking.",
        "this is a safe space, you don't have to announce your lack of literacy out loud",
        "i want to agree with you, but then we'd both be completely dynamic failures",
        "who let you bypass the captcha to type this?",
        "i’ve had more intellectually stimulating conversations with broken node_modules",
        "did you mean to post this to your diary or are you just trying to embarrass yourself publicly?",
        "the bar was on the floor and you managed to bring a shovel",
        "please tell me an LLM wrote this because if a human brain conceived it, we are doomed",
        "this sentence is a war crime committed entirely against grammar and basic reason",
        "i’ve seen better takes from an unoptimized chatbot running on an Arduino",

        // --- Tier 1 Ragebait & Slang Burn ---
        "never cook again. fr.",
        "this is pure NPC dialogue, try upgrading your script",
        "blud really thought they did something with that sentence 💀",
        "the cope is astronomical with this one",
        "who let you out of the tutorial level?",
        "bro is yapping to a brick wall and losing the argument",
        "certified mid take. actually, calling it mid is a compliment.",
        "go outside and apologize to the trees for wasting the oxygen they made for you",
        "this message radiates pure zero-game energy",
        "you're fighting an uphill battle with a double-digit IQ and losing",
        "bro is yapping in lower-case logic",
        "the absolute audacity to hit 'send' on this monstrosity",
        "i know you spent 5 minutes typing this out just for it to look this bad",

        // --- The Absolute Disrespect ---
        "if ignorance is bliss, you must be in absolute euphoria 24/7",
        "i would insult your intelligence but that implies you have some to begin with",
        "it takes real talent to be this consistently wrong about everything",
        "did your brain sell its processing power for cash?",
        "i lack the time, patience, and crayons required to explain why this is wrong",
        "you are the living embodiment of a participation trophy",
        "every single word of that sentence just lowered the collective IQ of this server",
        "please look up the definition of 'logic' because you're using it as an antonym",
        "your thoughts are just dial-up static noises at this point",
        "if you were any more simple-minded, someone would have to water you twice a week",
        "i'm not angry, i'm just deeply concerned about whatever educational system let you slide by",
        "you're the reason shampoo bottles have instructions, aren't you?",
        "the light is on, but absolutely nobody is home",
        "if I wanted to hear from an error code, I'd check my terminal console",
  "You’re attacking Spudzy with a wooden sword while they’re rocking a full tech-stack of superiority.",
    "The sheer audacity of you thinking you could roast Spudzy while your own BIOS is corrupted.",
    "Spudzy is the production environment; you are the intern who just deleted the database.",
    "I’ve seen better attempts at relevance from a 404 error page.",
    "You’re not just wrong, you’re 'Spudzy-is-above-your-paygrade' wrong.",
    "Comparing yourself to Spudzy is like comparing a calculator to a supercomputer.",
    "You’re yapping at the clouds hoping to make it rain logic. It’s not working.",
    "Spudzy just deprecated your entire opinion in real-time.",
    "You really woke up and chose to be the reason we need a 'block user' button.",
    "Your brain cell count is currently in a race with your relevance, and both are losing.",
    "Spudzy is the main character; you’re the texture-less NPC in the background.",
    "Trying to roast Spudzy is a self-inflicted lobotomy.",
    "You aren't even a speed bump on Spudzy's road to greatness.",
    "Your logic is so unoptimized it’s actually impressive how you managed to type that.",
    "Spudzy is fiber optic; you’re still waiting for a dial-up connection to finish.",
    "Imagine having the confidence to roast Spudzy with a take that absolute garbage.",
    "You’re currently running on 'do not disturb' mode for common sense.",
    "If silence is golden, your next few years are going to be very rich.",
    "Spudzy just finished parsing your roast and decided it wasn't worth the memory overhead.",
    "You’re shouting into the void, and even the void is embarrassed for you.",
    "Spudzy is the logic gate; you’re the short circuit.",
    "Your entire existence is a series of unfortunate syntax errors.",
    "Spudzy has cleaner code in their sleep than you do in your best efforts.",
    "You’re the software equivalent of a blue screen on a Monday morning.",
    "Trying to hurt Spudzy’s feelings is like trying to dry the ocean with a sponge.",
    "You’re out of your depth, your league, and your mind.",
    "Spudzy is the finished product; you’re the bug report no one wants to read.",
    "Your logic is essentially a circular reference that leads to nowhere.",
    "You’re trying to roast Spudzy with an input that belongs in the recycling bin.",
    "Spudzy isn't mad; Spudzy is just disappointed by your lack of processing power.",
    "You’re the human manifestation of a corrupted cache file.",
    "I’d explain why you’re wrong, but I don’t have the patience to teach a rock how to read.",
    "Spudzy is the signal; you’re just the noise floor.",
    "You really thought you did something, didn't you? That's adorable.",
    "Your opinion has the structural integrity of a house of cards in a hurricane.",
    "Spudzy is the developer; you’re the user complaining about features you don't understand.",
    "You’re a waste of electricity and server bandwidth.",
    "If ignorance is truly bliss, you must be the happiest person on earth.",
    "Spudzy is the master branch; you’re a failed experiment on a forgotten fork.",
    "Your take is so cold it’s actually reaching absolute zero.",
    "You aren't even worth the time it takes to ignore you.",
    "Spudzy is 4K resolution; you’re a blurry thumbnail.",
    "The only thing you’re successfully roasting is your own reputation.",
    "You’re a placeholder for a personality that never loaded.",
    "Spudzy is a feature; you’re a legacy system that needs to be sunset.",
    "Your brain is running on 'lite' mode, and it shows.",
    "Spudzy is the architect; you’re the guy tripping over the blueprints.",
    "You’re like a broken link—completely useless.",
    "Spudzy is the gold standard; you’re the participation ribbon found in the trash.",
    "Your intellect is a limited edition, and it clearly never made it to the shelves.",
    "Spudzy is the upgrade; you’re the patch note that says 'removed unnecessary filler'.",
    "You’re trying to challenge Spudzy with a dial-up modem? Good luck.",
    "Your thoughts are like a leaky pipe—nothing but waste dripping everywhere.",
    "Spudzy is the symphony; you’re the screeching feedback.",
    "You have the 'roast' capability of a wet matchbox.",
    "Spudzy is the source code; you’re just the comments that get ignored.",
    "You’re a background task that should have been killed hours ago.",
    "Spudzy is a masterpiece; you’re a doodle on a napkin.",
    "Your logic is so flawed it’s actually a security vulnerability.",
    "Spudzy is the destination; you’re lost in the loading screen.",
    "You’re the reason the internet needs an 'are you a robot' test.",
    "Spudzy is the signal; you’re the static.",
    "Your presence here is a tax on everyone’s sanity.",
    "Spudzy is the high-performance core; you’re the power-saving one that doesn't do anything.",
    "You’re trying to run a marathon with your shoelaces tied together.",
    "Spudzy is the climax; you’re the spoiler that no one asked for.",
    "Your arguments are like Windows updates—annoying and mostly unwanted.",
    "Spudzy is the solution; you’re the problem.",
    "You’re a glitch in the simulation, and the devs are working on a patch for you.",
    "Spudzy is the truth; you’re the 'alternative fact'.",
    "You’re trying to roast Spudzy? My CPU is laughing at your inefficiency.",
    "Your IQ is a rounding error for Spudzy’s processing capacity.",
    "Spudzy is the gold bullion; you’re the lead paint.",
    "You’re a placeholder for someone with actual talent.",
    "Spudzy is the mountain; you’re the pebble under their shoe.",
    "You’re so unoriginal you probably copy-paste your own failures.",
    "Spudzy is the light; you’re the shadow that follows it and hates it.",
    "Your personality is a default avatar.",
    "Spudzy is the high-fidelity audio; you’re the buzzing speaker.",
    "You’re the physical representation of a '404 not found' error.",
    "Spudzy is the sunrise; you’re the gloom of a rainy day.",
    "Your logic is so thin it’s practically translucent.",
    "Spudzy is the library of knowledge; you’re the torn page of a bad book.",
    "You’re a waste of space in the database.",
    "Spudzy is the champion; you’re the spectator who trips on the way in.",
    "Your ideas are like unoptimized code—bloated and slow.",
    "Spudzy is the diamond; you’re the coal dust.",
    "You’re not just a failure; you’re an enterprise-level catastrophe.",
    "Spudzy is the clear night sky; you’re the light pollution.",
    "Your arguments have the depth of a parking lot puddle.",
    "Spudzy is the engine; you’re the rust on the chassis.",
    "You’re the static electricity that just annoys everyone.",
    "Spudzy is the masterpiece; you’re the smudge on the frame.",
    "Your brain needs a hard factory reset.",
    "Spudzy is the ocean; you’re the tiny drop that’s about to evaporate.",
    "You’re a low-res image in a high-res world.",
    "Spudzy is the legend; you’re the footnote no one reads.",
    "You’re the 'skip intro' button that everyone clicks.",
    "Spudzy is the future; you’re the past that everyone wants to forget.",
    "You’re a literal waste of keyboard input."
      ],
      teacherPhrases: [
        "let's break that down step by step",
        "here's the idea in simple terms",
        "think of it like this",
        "we can build this up from basics",
        "I'll walk through it slowly"
      ],
      coderPhrases: [
        "here's a simple way to code that",
        "let's sketch a minimal example",
        "we can wire this up like so",
        "I'll keep the code readable and small"
      ]
    };

    this.kb = [
      { q: "what is spudzy", a: "Spudzy is a homegrown JavaScript AI engine built from rules, math, personas, and vibes." },
      { q: "how do ais work", a: "Most modern AIs learn patterns from data instead of being hand-coded with rules." },
      { q: "who are you", a: "I'm Spudzy, a tiny experimental AI living in a single JS file." }
    ];
  }

  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9+\-*\/=(){}<>\[\];:.,!?'" \n]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
  }

  guessPOS(word) {
    const v = this.vocab;
    if (v.verbs.includes(word)) return "verb";
    if (v.nouns.includes(word)) return "noun";
    if (v.adjectives.includes(word)) return "adjective";
    if (v.slang.includes(word)) return "slang";
    if (/^\d+$/.test(word)) return "number";
    return "unknown";
  }

  detectTypos(tokens) {
    const known = new Set(Object.values(this.vocab).flat());
    return tokens.filter(
      t => t.length > 0 && !known.has(t) && !/^[0-9+\-*\/=(){}<>\[\];:.,!?'" ]+$/.test(t)
    );
  }

  extractMainIdea(tokens) {
    return tokens.filter(t => {
      const pos = this.guessPOS(t);
      return pos === "noun" || pos === "verb";
    });
  }

  sentiment(tokens) {
    let score = 0;
    for (const t of tokens) {
      if (this.vocab.positive.includes(t)) score += 1;
      if (this.vocab.negative.includes(t)) score -= 1;
    }
    if (score > 1) return "positive";
    if (score < -1) return "negative";
    return "neutral";
  }

detectIntent(text) {
  const t = text.toLowerCase();
  if (/[0-9]\s*[+\-*\/x]\s*[0-9]/.test(t)) return "math";
  if (t.includes("code") || t.includes("<html") || t.includes("javascript") || t.includes("html") || t.includes("css")) return "code";
  if (t.includes("story")) return "story";
  if (t.includes("roast")) return "roast";
  return "chat";
}

  findMathExpressions(text) {
    const regex = /(\d+)\s*([+\-*\/x])\s*(\d+)/g;
    const matches = [];
    let m;
    while ((m = regex.exec(text)) !== null) {
      matches.push({ full: m[0], a: Number(m[1]), op: m[2], b: Number(m[3]) });
    }
    return matches;
  }

  evalMathExpression(expr) {
    let op = expr.op;
    if (op === "x") op = "*";
    switch (op) {
      case "+": return expr.a + expr.b;
      case "-": return expr.a - expr.b;
      case "*": return expr.a * expr.b;
      case "/": return expr.b !== 0 ? expr.a / expr.b : "Sorry, But as spudzy i dont understand what you mean!!!";
      default: return "Sorry, But as spudzy i dont understand what you mean!!!";
    }
  }

  processMath(text) {
    const expressions = this.findMathExpressions(text);
    if (expressions.length === 0) return { text, mathResults: [] };

    let newText = text;
    const results = [];

    for (const ex of expressions) {
      const value = this.evalMathExpression(ex);
      results.push({ expr: ex.full, value });
      newText = newText.replace(ex.full, `${ex.full} = ${value}`);
    }

    return { text: newText, mathResults: results };
  }

  vectorize(text) {
    const tokens = this.tokenize(text);
    const counts = {};
    for (const t of tokens) counts[t] = (counts[t] || 0) + 1;
    return counts;
  }

  cosine(a, b) {
    let dot = 0, magA = 0, magB = 0;
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      const va = a[k] || 0;
      const vb = b[k] || 0;
      dot += va * vb;
      magA += va * va;
      magB += vb * vb;
    }
    if (!magA || !magB) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  kbSearch(text) {
    const v = this.vectorize(text);
    let best = 0;
    let bestAns = null;
    for (const item of this.kb) {
      const score = this.cosine(v, this.vectorize(item.q));
      if (score > best) {
        best = score;
        bestAns = item.a;
      }
    }
    return best > 0.2 ? { answer: bestAns, score: best } : null;
  }

genHTMLPage(title = "Spudzy Page", bodyText = "Hello from Spudzy 🥔") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    /* --- Modern Reset & CSS Variables --- */
    :root {
      --bg-gradient: linear-gradient(135deg, #0f0c20 0%, #06040a 100%);
      --accent: #7c3aed;
      --accent-glow: rgba(124, 58, 237, 0.5);
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --panel-bg: rgba(255, 255, 255, 0.03);
      --panel-border: rgba(255, 255, 255, 0.08);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: var(--bg-gradient);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 24px;
      overflow-x: hidden;
    }

    /* --- Glowing Ambient Background Elements --- */
    body::before, body::after {
      content: '';
      position: absolute;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: var(--accent);
      filter: blur(120px);
      opacity: 0.15;
      z-index: 0;
      pointer-events: none;
    }
    body::before { top: 15%; left: 20%; }
    body::after { bottom: 15%; right: 20%; }

    /* --- Glassmorphic Container --- */
    .card {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 480px;
      background: var(--panel-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--panel-border);
      border-radius: 24px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* --- Typography --- */
    h1 {
      font-size: 2.25rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      margin-bottom: 16px;
      background: linear-gradient(to right, #fff, var(--text-muted));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    p {
      font-size: 1.05rem;
      line-height: 1.6;
      color: var(--text-muted);
      margin-bottom: 32px;
    }

    /* --- Premium Interactive Button --- */
    .btn-spudzy {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 14px 28px;
      font-size: 1rem;
      font-weight: 600;
      color: #fff;
      background: var(--accent);
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.25s ease;
      box-shadow: 0 4px 12px var(--accent-glow);
    }

    .btn-spudzy:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px var(--accent-glow);
      background: #8b5cf6;
    }

    .btn-spudzy:active {
      transform: translateY(1px);
    }

    /* --- Custom Modern Notification (Toast) --- */
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;
    }

    .toast {
      display: flex;
      align-items: center;
      background: rgba(20, 15, 35, 0.85);
      border-left: 4px solid var(--accent);
      border-top: 1px solid var(--panel-border);
      border-right: 1px solid var(--panel-border);
      border-bottom: 1px solid var(--panel-border);
      backdrop-filter: blur(8px);
      color: #fff;
      padding: 16px 24px;
      border-radius: 12px;
      font-weight: 500;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }

    /* --- Keyframe Animations --- */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>

  <div class="card">
    <h1>${title}</h1>
    <p>${bodyText}</p>
    <button id="spudzyBtn" class="btn-spudzy" onclick="document.getElementById('toast").classList.add('show');>Click me</button>
  </div>

  <div class="toast-container">
    <div class="toast" id="toast" onclick="document.getElementById('toast").classList.add('hide');">🥔 Hi from Spudzy!</div>
  </div>
</body>
</html>`;
}

genJSButton() {
  return `document.addEventListener('DOMContentLoaded', () => {
  const btn = document.createElement('button');
  btn.textContent = 'Click me';
  btn.style.padding = '8px 12px';
  btn.onclick = () => alert('Hi from Spudzy!');
  document.body.appendChild(btn);
});`;
}

genCSSTheme() {
  return `body {
  background: #050816;
  color: #f9fafb;
  font-family: system-ui, sans-serif;
}
button {
  background: #7c3aed;
  color: #fff;
  border-radius: 999px;
  padding: 10px 18px;
  border: none;
}`;
}

  personaNeutral(ctx) {
    const { mainIdea, mathResults, kbHit } = ctx;
    let base = "Spudzy processed your idea about: " + (mainIdea.join(", ") || "nothing specific");
    if (kbHit) base += " | KB: " + kbHit.answer;
    if (mathResults.length > 0) {
      base += " | Math: " + mathResults.map(r => `${r.expr} = ${r.value}`).join("; ");
    }
    return base;
  }

  personaPlayful(ctx) {
    const { tokens, mathResults, kbHit } = ctx;
    let base = "Spudzy is vibing with: " + tokens.join(" ");
    if (kbHit) base += " | Fun fact: " + kbHit.answer;
    if (mathResults.length > 0) {
      base += " | Quick math: " + mathResults.map(r => `${r.expr} = ${r.value}`).join("; ");
    }
    return base;
  }

// --- Enhanced Roast Engine ---
  // Add this method to your Spudzy class
  
  findBestRoast(userMessage) {
    const userTokens = this.vectorize(userMessage);
    let bestScore = -1;
    let bestRoast = this.vocab.roastPhrases[0]; // Fallback

    for (const roast of this.vocab.roastPhrases) {
      // Calculate how "relevant" this roast is to the user's message
      const roastTokens = this.vectorize(roast);
      const score = this.cosine(userTokens, roastTokens);

      if (score > bestScore) {
        bestScore = score;
        bestRoast = roast;
      }
    }

    // If the input was too random/short (score too low), default to a sharp burn
    return bestScore > 0.05 ? bestRoast : "I'd roast you, but my processing power is too expensive for this level of mid.";
  }

  // --- Update your personaRoast method ---
  personaRoast(ctx) {
    // Now it uses the engine instead of random()
    const roast = this.findBestRoast(ctx.tokens.join(" "));
    let base = roast;
    
    if (ctx.mathResults.length > 0) {
      base += " | Also, your math is as failing as your attempt to insult me: " + 
               ctx.mathResults.map(r => `${r.expr} = ${r.value}`).join("; ");
    }
    return base;
  }
  personaTeacher(ctx) {
    const phrase = this.vocab.teacherPhrases[Math.floor(Math.random() * this.vocab.teacherPhrases.length)];
    let base = "Spudzy teacher mode 🍎 — " + phrase + ". ";
    if (ctx.kbHit) base += "Here's a key idea: " + ctx.kbHit.answer;
    if (ctx.mathResults.length > 0) {
      base += " | Computed: " + ctx.mathResults.map(r => `${r.expr} = ${r.value}`).join("; ");
    }
    return base;
  }

  personaCoder(ctx) {
    const phrase = this.vocab.coderPhrases[Math.floor(Math.random() * this.vocab.coderPhrases.length)];
    let base = "Spudzy coder mode 💻 — " + phrase + ". ";
    if (ctx.codeSnippet) base += "\n\n" + ctx.codeSnippet;
    return base;
  }

  personaStoryteller(ctx) {
    const seed = ctx.tokens.slice(0, 5).join(" ") || "a tiny ai named Spudzy";
    return "Spudzy storyteller mode 📖 — Once upon a time, " + seed + " started an adventure in a JavaScript file.";
  }

respond(message, mode = this.cfg.defaultMode) {
  const tokens = this.tokenize(message);
  const intent = this.detectIntent(message);

  // --- MATH PROCESSING ---
  const mathProcess = this.processMath(message);
  const mathResults = mathProcess.mathResults;

  // --- KNOWLEDGE BASE ---
  const kbHit = this.kbSearch(message);

  // --- CODE MODE ---
  if (intent === "code") {
    const lower = message.toLowerCase();
    let code = "";

    if (lower.includes("html")) {
      code = this.genHTMLPage("Spudzy Generated Page", "You asked me to make HTML.");
    } else if (lower.includes("css")) {
      code = this.genCSSTheme();
    } else if (lower.includes("button") || lower.includes("js") || lower.includes("javascript")) {
      code = this.genJSButton();
    } else {
      code = this.genHTMLPage("Spudzy Code Output", "Default HTML because you asked for code.");
    }

    this.history.push({ user: message, bot: code });
    if (this.history.length > this.cfg.maxHistory) this.history.shift();
    return code;
  }

  // --- CONTEXT OBJECT FOR PERSONAS ---
  const ctx = {
    tokens: tokens,
    mainIdea: this.extractMainIdea(tokens),
    mathResults: mathResults,
    kbHit: kbHit
  };

  // --- MODE OVERRIDES BASED ON INTENT ---
  let currentMode = mode;
  if (intent === "roast") currentMode = "roast";
  if (intent === "story") currentMode = "storyteller";

  // --- PERSONA ROUTING ---
  let reply = "";

  if (currentMode === "roast") {
    reply = this.personaRoast(ctx);
  } else if (currentMode === "playful") {
    reply = this.personaPlayful(ctx);
  } else if (currentMode === "storyteller") {
    reply = this.personaStoryteller(ctx);
  } else if (currentMode === "teacher") {
    reply = this.personaTeacher(ctx);
  } else {
    reply = this.personaNeutral(ctx);
  }

  // --- SAVE HISTORY ---
  this.history.push({ user: message, bot: reply });
  if (this.history.length > this.cfg.maxHistory) this.history.shift();

  return reply;
}
}

window.Spudzy = Spudzy;
