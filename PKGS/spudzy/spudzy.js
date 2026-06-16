// spudzy.js
// Spudzy AI Engine v9
// SAMPLE: How sending to the AI works in this app
// 1. Get text from the input box
// const text = inputEl.value.trim();

// 2. Read the selected mode (neutral, playful, etc)
// const mode = modeEl.value;

// 3. Send the message to the AI engine
// const reply = await spudzy.respond(text, {
//   mode,
//   persona: mode
// });

// 4. Show the AI response in the chat UI
// addMessage(reply, "bot");

// Browser-safe GitHub Pages assistant focused on:
// - Strong typo handling
// - Strong "make html ..." prompt handling
// - Prompt-to-page planning
// - Special app generation
// - Async respond()
// - Browser-safe search
// - Math + memory
//
// Usage:
// const spudzy = new Spudzy();
// const reply = await spudzy.respond("make html for a neon portfolio with cards and contact form");

class Spudzy {
  constructor(config = {}) {
    this.version = "9.0.0";

    this.cfg = {
      name: "Spudzy",
      defaultMode: "neutral",
      defaultPersona: "neutral",
      maxHistory: 120,
      maxMemory: 120,
      enableSearch: true,
      enableCode: true,
      enableMath: true,
      enableMemory: true,
      searchLimit: 6,
      customSearchEndpoint: null,
      typoCorrection: true,
      typoMaxDistance: 2,
      typoConfidenceThreshold: 0.72,
      debug: false,
      ...config
    };

    this.history = [];
    this.memory = [];

    this.kb = [
      {
        q: "what is spudzy",
        a: "Spudzy is a browser-safe JavaScript assistant engine that can generate HTML pages, explain code, fix common code issues, search browser-safe sources, do math, and remember local notes."
      },
      {
        q: "can spudzy search the internet",
        a: "Yes, Spudzy can search browser-safe public APIs like Wikipedia, GitHub repositories, and Hacker News. Full search engine scraping still needs a backend."
      },
      {
        q: "how do i make spudzy a real ai",
        a: "To connect Spudzy to a real AI model, use a backend service that calls an LLM API. Keep private API keys on the backend, not in frontend JavaScript."
      }
    ];

    this.lexicon = this.buildLexicon();
    this.typoOverrides = this.buildTypoOverrides();
    this.synonyms = this.buildSynonyms();
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  async respond(message, options = {}) {
    const input = String(message ?? "").trim();

    if (!input) {
      return this.saveAndReturn(input, "Spudzy 🥔 — Say something first.", {
        intent: "empty"
      });
    }

    const ctx = this.analyze(input, options);
    let reply = "";

    try {
      switch (ctx.intent) {
        case "search":
          reply = await this.handleSearch(ctx);
          break;
        case "code":
          reply = this.handleCode(ctx);
          break;
        case "explainCode":
          reply = this.handleExplainCode(ctx);
          break;
        case "explainFile":
          reply = this.handleExplainFile(ctx);
          break;
        case "fixCode":
          reply = this.handleFixCode(ctx);
          break;
        case "math":
          reply = this.handleMath(ctx);
          break;
        case "memory":
          reply = this.handleMemory(ctx);
          break;
        case "summarize":
          reply = this.handleSummarize(ctx);
          break;
        case "story":
          reply = this.handleStory(ctx);
          break;
        case "roast":
          reply = this.handleRoast(ctx);
          break;
        case "question":
          reply = this.handleQuestion(ctx);
          break;
        case "best-vid-gen":
          reply = "try https://alaricholt677.github.io/PKGS/spudzy-vid and get videos ran by me as a video genrator FOR FREE"
          break;
        case "aboutwork":
          reply = "Oh, So i work by using your browsers js logic, uses localstorage, and is a web based ai portfolio, that dosent need big databases, feel free to ask your questions by using 'search the internet fo' then what you want an answer for."
          break;
        default:
          reply = this.handleChat(ctx);
          break;
      }
    } catch (error) {
      reply = "Spudzy error: " + (error && error.message ? error.message : "Unknown error");
    }

    return this.saveAndReturn(input, reply, ctx);
  }

  saveAndReturn(user, bot, meta = {}) {
    this.history.push({
      user,
      bot,
      meta,
      time: new Date().toISOString()
    });

    while (this.history.length > this.cfg.maxHistory) {
      this.history.shift();
    }

    return bot;
  }

  exportState() {
    return {
      version: this.version,
      history: this.history,
      memory: this.memory,
      kb: this.kb
    };
  }

  importState(state = {}) {
    if (Array.isArray(state.history)) this.history = state.history;
    if (Array.isArray(state.memory)) this.memory = state.memory;
    if (Array.isArray(state.kb)) this.kb = state.kb;
  }

  addKnowledge(question, answer) {
    this.kb.push({
      q: String(question || ""),
      a: String(answer || "")
    });
  }

  clearHistory() {
    this.history = [];
  }

  clearMemory() {
    this.memory = [];
  }

  // ===========================================================================
  // ANALYSIS
  // ===========================================================================

  analyze(input, options = {}) {
    const raw = String(input ?? "");
    const normalized = this.normalizeText(raw);

    const typoReport = this.cfg.typoCorrection
      ? this.correctTextWithReport(normalized)
      : { output: normalized, changes: [] };

    const corrected = typoReport.output;
    const canonical = this.applySynonyms(corrected);
    const tokens = this.tokenize(canonical);

    const ctx = {
      raw,
      normalized,
      corrected,
      canonical,
      tokens,
      options,
      mode: options.mode || options.persona || this.cfg.defaultMode,
      intent: this.detectIntent(canonical, tokens),
      topic: this.extractTopic(canonical),
      typoChanges: typoReport.changes,
      pagePlan: null
    };

    if (ctx.intent === "code") {
      ctx.pagePlan = this.planHtmlPage(ctx);
    }

    return ctx;
  }

  normalizeText(text) {
    return String(text ?? "")
      .toLowerCase()
      .replace(/[“”]/g, "\"")
      .replace(/[‘’]/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  tokenize(text) {
    return String(text ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9_+\-*/=(){}[\].,!?'"<>:;/#\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
  }

  // ===========================================================================
  // LEXICON / TYPO DATA
  // ===========================================================================

  buildLexicon() {
    return {
      intents: new Set([
        "make", "create", "generate", "write", "build", "design", "craft",
        "html", "css", "javascript", "js", "website", "page", "web", "app",
        "search", "internet", "look", "google", "summarize", "summary",
        "explain", "fix", "debug", "repair", "calculate", "math", "solve",
        "remember", "forget", "story", "roast"
      ]),

      pageTypes: {
        landing: "landing",
        homepage: "landing",
        home: "landing",
        portfolio: "portfolio",
        dashboard: "dashboard",
        admin: "dashboard",
        blog: "blog",
        shop: "shop",
        store: "shop",
        ecommerce: "shop",
        restaurant: "restaurant",
        cafe: "restaurant",
        food: "restaurant",
        business: "business",
        startup: "business",
        company: "business",
        agency: "business",
        calculator: "calculator",
        todo: "todo",
        chatbot: "chatbot",
        weather: "weather",
        music: "music",
        movie: "movie",
        fitness: "fitness",
        school: "school",
        game: "game",
        voxel: "voxel",
        minecraft: "voxel",
        sandbox: "voxel",
        profile: "profile",
        social: "social",
        notes: "notes"
      },

      components: {
        navbar: "navbar",
        nav: "navbar",
        hero: "hero",
        header: "hero",
        cards: "cards",
        card: "cards",
        features: "cards",
        grid: "cards",
        gallery: "gallery",
        pricing: "pricing",
        price: "pricing",
        form: "form",
        contact: "form",
        login: "login",
        signup: "signup",
        footer: "footer",
        testimonials: "testimonials",
        faq: "faq",
        sidebar: "sidebar",
        search: "searchBox",
        searchbox: "searchBox",
        chart: "chart",
        charts: "chart",
        stats: "stats",
        table: "table",
        menu: "menu",
        canvas: "canvas",
        animation: "animation",
        animated: "animation",
        particles: "particles",
        snake: "snake",
        blocks: "blocks",
        block: "blocks",
        clock: "clock",
        timer: "timer"
      },

      colors: {
        red: "#ef4444",
        orange: "#f97316",
        yellow: "#eab308",
        green: "#22c55e",
        blue: "#3b82f6",
        purple: "#8b5cf6",
        pink: "#ec4899",
        cyan: "#06b6d4",
        teal: "#14b8a6",
        lime: "#84cc16",
        emerald: "#10b981",
        indigo: "#6366f1",
        violet: "#7c3aed",
        brown: "#92400e",
        gold: "#f59e0b",
        black: "#020617",
        white: "#f8fafc",
        gray: "#64748b",
        grey: "#64748b"
      },

      moods: {
        dark: "dark",
        light: "light",
        modern: "modern",
        minimal: "minimal",
        clean: "clean",
        luxury: "luxury",
        futuristic: "futuristic",
        professional: "professional",
        playful: "playful",
        cute: "playful",
        pixel: "pixel",
        blocky: "voxel",
        voxel: "voxel",
        retro: "retro",
        neon: "neon",
        cyberpunk: "cyberpunk",
        glass: "glass",
        glassmorphism: "glass"
      },

      effects: {
        responsive: "responsive",
        mobile: "responsive",
        rounded: "rounded",
        glow: "glow",
        shadow: "shadow",
        gradient: "gradient",
        hover: "hover",
        animated: "animated",
        animation: "animated",
        floating: "floating",
        bounce: "bounce",
        blur: "blur",
        interactive: "interactive"
      },

      subjects: new Set([
        "minecraft", "voxel", "sandbox", "forest", "cave", "lava", "snow",
        "desert", "biome", "adventure", "survival", "crafting", "mining",
        "building", "portfolio", "business", "restaurant", "fitness", "music",
        "movie", "school", "shop", "store", "agency", "startup", "space",
        "ocean", "gaming", "dashboard", "notes", "profile", "crypto", "ai",
        "weather", "menu", "chef", "food", "analytics", "admin"
      ])
    };
  }

  buildTypoOverrides() {
    return {
      "mkae": "make",
      "mak": "make",
      "maek": "make",
      "creat": "create",
      "genrate": "generate",
      "wrtie": "write",
      "buid": "build",
      "hmtl": "html",
      "htlm": "html",
      "htnl": "html",
      "htmll": "html",
      "javascritp": "javascript",
      "javscript": "javascript",
      "javasript": "javascript",
      "jscript": "javascript",
      "ccs": "css",
      "webiste": "website",
      "websiite": "website",
      "serahc": "search",
      "searhc": "search",
      "sreach": "search",
      "internt": "internet",
      "fopr": "for",
      "fo": "for",
      "wit": "with",
      "wih": "with",
      "wth": "with",
      "jus": "just",
      "evbery": "every",
      "evry": "every",
      "anamation": "animation",
      "animtion": "animation",
      "responive": "responsive",
      "respnsive": "responsive",
      "modren": "modern",
      "mordern": "modern",
      "futurstic": "futuristic",
      "glasmorphism": "glassmorphism",
      "glassmorphsim": "glassmorphism",
      "porfolio": "portfolio",
      "portflio": "portfolio",
      "portfoilio": "portfolio",
      "dashbord": "dashboard",
      "dashbaord": "dashboard",
      "restraunt": "restaurant",
      "resturant": "restaurant",
      "galery": "gallery",
      "gallary": "gallery",
      "prcing": "pricing",
      "pricng": "pricing",
      "contct": "contact",
      "conact": "contact",
      "frm": "form",
      "foem": "form",
      "signpu": "signup",
      "logn": "login",
      "buton": "button",
      "btn": "button",
      "navbr": "navbar",
      "nabar": "navbar",
      "sidebr": "sidebar",
      "minecrfat": "minecraft",
      "mincraft": "minecraft",
      "minecarft": "minecraft",
      "voxle": "voxel",
      "voxl": "voxel",
      "pixle": "pixel",
      "pixal": "pixel",
      "blokcy": "blocky",
      "bloky": "blocky",
      "blcoky": "blocky",
      "surivval": "survival",
      "buidling": "building",
      "crafitng": "crafting",
      "minning": "mining",
      "calcualtor": "calculator",
      "calculater": "calculator",
      "calulator": "calculator",
      "weathr": "weather",
      "charbot": "chatbot",
      "to-do": "todo",
      "chat bot": "chatbot",
      "log in": "login",
      "sign up": "signup",
      "od": "do",
      "wrok": "work",
      "hwo": "how",
      "yup": "you",
      "yuo": "you"
    };
  }

  buildSynonyms() {
    return {
      "site": "website",
      "webpage": "website",
      "homepage": "landing",
      "landingpage": "landing",
      "home page": "landing",
      "card grid": "cards",
      "feature cards": "cards",
      "cta": "buttons",
      "call to action": "buttons",
      "biomes": "gallery",
      "realm": "pricing",
      "realms": "pricing",
      "join form": "form",
      "contact form": "form",
      "reservation": "form",
      "booking": "form",
      "pixel art": "pixel",
      "block style": "blocky",
      "voxel style": "voxel",
      "minecraft like": "minecraft voxel blocky sandbox",
      "minecraft-inspired": "minecraft voxel blocky sandbox",
      "glassy": "glass",
      "fancy": "luxury",
      "sleek": "modern",
      "enterprise": "professional",
      "dashboard ui": "dashboard",
      "admin panel": "dashboard",
      "storefront": "shop",
      "online store": "shop",
      "portfolio site": "portfolio"
    };
  }

  // ===========================================================================
  // TYPO HANDLING
  // ===========================================================================

  correctTextWithReport(text) {
    let working = " " + String(text ?? "") + " ";
    const changes = [];

    const phraseOverrides = Object.entries(this.typoOverrides)
      .filter(([k]) => k.includes(" "))
      .sort((a, b) => b[0].length - a[0].length);

    for (const [bad, good] of phraseOverrides) {
      const regex = new RegExp(this.escapeRegExp(bad), "g");
      if (regex.test(working)) {
        working = working.replace(regex, good);
        changes.push({ from: bad, to: good, method: "phraseOverride" });
      }
    }

    const synonymPhrases = Object.entries(this.synonyms)
      .filter(([k]) => k.includes(" "))
      .sort((a, b) => b[0].length - a[0].length);

    for (const [bad, good] of synonymPhrases) {
      const regex = new RegExp(this.escapeRegExp(bad), "g");
      if (regex.test(working)) {
        working = working.replace(regex, good);
        changes.push({ from: bad, to: good, method: "phraseSynonym" });
      }
    }

    let tokens = this.tokenize(working);

    tokens = tokens.map(token => {
      if (this.typoOverrides[token]) {
        changes.push({
          from: token,
          to: this.typoOverrides[token],
          method: "directOverride"
        });
        return this.typoOverrides[token];
      }

      if (this.isKnownWord(token)) {
        return token;
      }

      if (token.length <= 2) {
        return token;
      }

      const suggestion = this.findClosestKnownWord(token);

      if (
        suggestion &&
        suggestion.distance <= this.cfg.typoMaxDistance &&
        suggestion.confidence >= this.cfg.typoConfidenceThreshold
      ) {
        changes.push({
          from: token,
          to: suggestion.word,
          method: "editDistance",
          distance: suggestion.distance,
          confidence: suggestion.confidence
        });
        return suggestion.word;
      }

      return token;
    });

    return {
      output: tokens.join(" ").replace(/\s+/g, " ").trim(),
      changes
    };
  }

  applySynonyms(text) {
    let working = " " + String(text ?? "") + " ";

    const singleWordSynonyms = Object.entries(this.synonyms)
      .filter(([k]) => !k.includes(" "));

    for (const [bad, good] of singleWordSynonyms) {
      const regex = new RegExp("\\b" + this.escapeRegExp(bad) + "\\b", "g");
      working = working.replace(regex, good);
    }

    return working.replace(/\s+/g, " ").trim();
  }

  isKnownWord(word) {
    if (!word) return false;
    if (/^\d+$/.test(word)) return true;

    if (this.lexicon.intents.has(word)) return true;
    if (this.lexicon.subjects.has(word)) return true;
    if (this.lexicon.pageTypes[word]) return true;
    if (this.lexicon.components[word]) return true;
    if (this.lexicon.colors[word]) return true;
    if (this.lexicon.moods[word]) return true;
    if (this.lexicon.effects[word]) return true;

    return false;
  }

  allKnownWords() {
    return [
      ...this.lexicon.intents,
      ...this.lexicon.subjects,
      ...Object.keys(this.lexicon.pageTypes),
      ...Object.keys(this.lexicon.components),
      ...Object.keys(this.lexicon.colors),
      ...Object.keys(this.lexicon.moods),
      ...Object.keys(this.lexicon.effects),
      ...Object.keys(this.typoOverrides),
      ...Object.keys(this.synonyms)
    ];
  }

  findClosestKnownWord(token) {
    const candidates = this.allKnownWords();
    let bestWord = null;
    let bestDistance = Infinity;

    for (const candidate of candidates) {
      if (Math.abs(candidate.length - token.length) > this.cfg.typoMaxDistance) continue;

      const distance = this.levenshtein(token, candidate);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestWord = candidate;
      }
    }

    if (!bestWord) return null;

    const confidence = 1 - bestDistance / Math.max(token.length, bestWord.length);

    return {
      word: bestWord,
      distance: bestDistance,
      confidence
    };
  }

  levenshtein(a, b) {
    a = String(a ?? "");
    b = String(b ?? "");

    const rows = a.length + 1;
    const cols = b.length + 1;
    const dp = Array.from({ length: rows }, () => Array(cols).fill(0));

    for (let i = 0; i < rows; i++) dp[i][0] = i;
    for (let j = 0; j < cols; j++) dp[0][j] = j;

    for (let i = 1; i < rows; i++) {
      for (let j = 1; j < cols; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;

        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }

    return dp[a.length][b.length];
  }

  escapeRegExp(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // ===========================================================================
  // INTENT DETECTION
  // ===========================================================================

  detectIntent(text, tokens) {
    if (
      text.includes("search the internet") ||
      text.includes("search internet") ||
      text.includes("web search") ||
      text.includes("look up") ||
      text.startsWith("search ") ||
      text.includes("google ")
    ) {
      return "search";
    }

    if (
      text.includes("explain this code") ||
      text.includes("explain code") ||
      text.includes("what does this code do") ||
      text.includes("describe this code")
    ) {
      return "explainCode";
    }

    if (
      text.includes("fix this code") ||
      text.includes("debug this") ||
      text.includes("repair this code") ||
      text.includes("why is this code broken")
    ) {
      return "fixCode";
    }

    const codeTriggers = [
      "make html", "create html", "generate html", "write html", "build html",
      "make website", "make a website", "create website", "web app", "landing",
      "portfolio", "dashboard", "shop", "restaurant", "calculator", "todo",
      "chatbot", "canvas", "html", "css", "javascript", "page"
    ];


if (
  text.includes("explain this file") ||
  text.includes("explain file") ||
  text.includes("analyze this file") ||
  text.includes("what does this file do") ||
  text.includes("describe this file")
) {
  return "explainFile";
}

    if (codeTriggers.some(word => text.includes(word))) {
      return "code";
    }

    if (
      /\d+\s*[+\-*/x]\s*\d+/.test(text) ||
      text.includes("calculate") ||
      text.includes("math") ||
      text.includes("solve")
    ) {
      return "math";
    }

    if (text.includes("remember") || text.includes("forget")) {
      return "memory";
    }
    if (text.includes("spudzy how do you work") || text.includes("how do you work")) {
      return "aboutwork";
    }
    if (text.includes("vid") || text.includes("video") || text.includes("deovi") || text.includes("vdeoi") || text.includes("vdi")) {
      return "best-vid-gen";
    }

    if (
      text.includes("summarize") ||
      text.includes("summary") ||
      text.includes("tldr") ||
      text.includes("recap")
    ) {
      return "summarize";
    }

    if (text.includes("story")) {
      return "story";
    }

    if (text.includes("roast")) {
      return "roast";
    }

    if (
      text.includes("?") ||
      text.startsWith("what ") ||
      text.startsWith("why ") ||
      text.startsWith("how ") ||
      text.startsWith("when ") ||
      text.startsWith("where ") ||
      text.startsWith("who ")
    ) {
      return "question";
    }

    return "chat";
  }

  extractTopic(text) {
    let topic = String(text ?? "");

    const removals = [
      "search the internet for",
      "search internet for",
      "web search",
      "search for",
      "look up",
      "google",
      "make html for",
      "make html",
      "create html for",
      "create html",
      "generate html for",
      "generate html",
      "write html for",
      "write html",
      "build html for",
      "build html",
      "make website for",
      "create website for",
      "generate code for",
      "write code for",
      "make code for",
      "explain this code",
      "explain code",
      "fix this code",
      "debug this",
      "repair this code",
      "summarize",
      "summary",
      "tldr"
    ];

    for (const phrase of removals) {
      topic = topic.replace(new RegExp(this.escapeRegExp(phrase), "ig"), "");
    }

    return topic.replace(/\s+/g, " ").trim();
  }

  // ===========================================================================
  // PAGE PLANNING
  // ===========================================================================

extractFileText(text) {
  const raw = String(text ?? "");
  const match = raw.match(/explain\s+this\s+file\s*:\s*([\s\S]*)/i)
    || raw.match(/explain\s+file\s*:\s*([\s\S]*)/i);
  return match ? match[1].trim() : "";
}
  stripFileNoise(text) {
  return String(text ?? "")
    .split(/\r?\n/)
    .filter(line => !/^(status|last modified|created|saved|size|type|filename)\s*:/i.test(line.trim()))
    .join("\n")
    .trim();
}
  handleExplainFile(ctx) {
  const rawFileText = this.extractFileText(ctx.raw);
  if (!rawFileText) {
    return "Spudzy file explainer 📁 — Paste file content after `explain this file:`";
  }

  const cleaned = this.stripFileNoise(rawFileText);
  const kind = this.detectFileKind(cleaned);

  return [
    "Spudzy file explainer 📁",
    "",
    `Detected file type: ${kind}`,
    "",
    this.explainFileByKind(cleaned, kind)
  ].join("\n");
}
explainFileByKind(text, kind) {
  const t = String(text ?? "");
  const out = [];

  // --- WHAT IT LIKELY DOES ---

  if (kind === "html") {
    out.push("This looks like a webpage file that builds a UI in the browser.");

    if (/<form/i.test(t)) out.push("• It includes forms for user input.");
    if (/<script/i.test(t)) out.push("• It runs JavaScript inside the page.");
    if (/<style/i.test(t)) out.push("• It contains inline styling.");
    if (/<canvas/i.test(t)) out.push("• It uses a canvas for graphics or animation.");
  }

  else if (kind === "javascript") {
    out.push("This appears to be a JavaScript file that controls behavior or logic.");

    if (/addEventListener/.test(t)) out.push("• It listens for user interactions.");
    if (/localStorage/.test(t)) out.push("• It uses browser local storage.");
    if (/fetch\s*\(/.test(t)) out.push("• It makes network/API requests.");
    if (/class\s+\w+/.test(t)) out.push("• It defines reusable class logic.");
    if (/document\.|window\./.test(t)) out.push("• It interacts with the webpage.");
  }

  else if (kind === "css") {
    out.push("This is a stylesheet that controls layout and visual design.");

    if (/@media/.test(t)) out.push("• It supports responsive design.");
    if (/animation|transition/i.test(t)) out.push("• It includes animations or transitions.");
    if (/:root/.test(t)) out.push("• It defines global CSS variables.");
  }

  else if (kind === "json") {
    out.push("This is structured data, likely used for configuration or storage.");
  }

  else if (kind === "markdown") {
    out.push("This looks like a markdown file used for documentation or notes.");

    if (/```/.test(t)) out.push("• It includes code examples.");
    if (/^# /m.test(t)) out.push("• It uses headings for sections.");
  }

  else if (kind === "xml/svg") {
    out.push("This is XML-based content, likely structured data or graphics.");

    if (/<svg/i.test(t)) out.push("• It represents vector graphics.");
  }

  else if (kind === "config") {
    out.push("This appears to be a configuration-style file with key-value pairs.");
  }

  else if (kind === "log") {
    out.push("This looks like a log file showing events, errors, or system output.");
  }

  else if (kind === "file-tree") {
    out.push("This is a folder/file structure listing.");
    out.push("• It shows how files are organized in a directory.");
  }

  else {
    out.push("This appears to be general text.");
  }

  // --- SIMPLE SUMMARY ---

  const lines = t.split("\n").slice(0, 3).map(l => l.trim()).filter(Boolean);
  if (lines.length) {
    out.push("\nPreview:");
    lines.forEach(l => out.push("• " + l));
  }

  return out.join("\n");
}
  planHtmlPage(ctx) {
    const text = ctx.canonical;
    const tokens = ctx.tokens;

    const plan = {
      prompt: ctx.raw,
      correctedPrompt: ctx.corrected,
      canonicalPrompt: ctx.canonical,
      title: "Spudzy App",
      subtitle: "A polished page generated from your exact prompt words.",
      pageType: "landing",
      theme: "dark",
      mood: "modern",
      primary: "#8b5cf6",
      secondary: "#06b6d4",
      accent: "#22c55e",
      components: new Set(["navbar", "hero", "cards", "footer"]),
      effects: new Set(["gradient", "shadow", "hover", "responsive"]),
      subjectWords: [],
      special: {
        voxelLike: false,
        canvasType: null
      }
    };

    const foundColors = [];
    const foundSubjects = [];

    for (const token of tokens) {
      if (this.lexicon.pageTypes[token]) {
        plan.pageType = this.lexicon.pageTypes[token];
      }

      if (this.lexicon.components[token]) {
        plan.components.add(this.lexicon.components[token]);
      }

      if (this.lexicon.colors[token]) {
        foundColors.push(this.lexicon.colors[token]);
      }

      if (this.lexicon.moods[token]) {
        const moodValue = this.lexicon.moods[token];
        plan.mood = moodValue;
        if (moodValue === "dark") plan.theme = "dark";
        if (moodValue === "light") plan.theme = "light";
      }

      if (this.lexicon.effects[token]) {
        plan.effects.add(this.lexicon.effects[token]);
      }

      if (this.lexicon.subjects.has(token)) {
        foundSubjects.push(token);
      }
    }

    if (foundColors[0]) plan.primary = foundColors[0];
    if (foundColors[1]) plan.secondary = foundColors[1];
    if (foundColors[2]) plan.accent = foundColors[2];

    plan.subjectWords = foundSubjects;

    if (text.includes("dark")) plan.theme = "dark";
    if (text.includes("light")) plan.theme = "light";

    if (text.includes("neon")) {
      plan.effects.add("glow");
      if (!foundColors.length) {
        plan.primary = "#ec4899";
        plan.secondary = "#22d3ee";
      }
    }

    if (text.includes("glass")) {
      plan.mood = "glass";
      plan.effects.add("blur");
    }

    if (
      text.includes("minecraft") ||
      text.includes("voxel") ||
      text.includes("blocky") ||
      text.includes("sandbox")
    ) {
      plan.pageType = "voxel";
      plan.mood = "voxel";
      plan.theme = "dark";
      plan.primary = "#22c55e";
      plan.secondary = "#92400e";
      plan.accent = "#f59e0b";
      plan.components.add("gallery");
      plan.components.add("pricing");
      plan.components.add("form");
      plan.components.add("canvas");
      plan.components.add("animation");
      plan.special.voxelLike = true;
      plan.special.canvasType = "fallingBlocks";
      plan.title = "BlockWorld Adventure";
      plan.subtitle = "Mine, craft, build, and survive in your own voxel universe.";
    }

    if (text.includes("portfolio")) {
      plan.pageType = "portfolio";
      plan.components.add("gallery");
      plan.components.add("form");
      plan.components.add("testimonials");
      plan.title = this.smartTitle(ctx.topic || "Creative Portfolio");
    }

    if (text.includes("dashboard")) {
      plan.pageType = "dashboard";
      plan.components.add("sidebar");
      plan.components.add("stats");
      plan.components.add("chart");
      plan.components.add("table");
      plan.title = this.smartTitle(ctx.topic || "Analytics Dashboard");
    }

    if (text.includes("shop") || text.includes("store")) {
      plan.pageType = "shop";
      plan.components.add("gallery");
      plan.components.add("pricing");
      plan.components.add("form");
      plan.title = this.smartTitle(ctx.topic || "Online Store");
    }

    if (text.includes("restaurant") || text.includes("menu") || text.includes("cafe")) {
      plan.pageType = "restaurant";
      plan.components.add("menu");
      plan.components.add("gallery");
      plan.components.add("pricing");
      plan.components.add("form");
      plan.title = this.smartTitle(ctx.topic || "Restaurant");
    }

    if (text.includes("business") || text.includes("startup") || text.includes("company") || text.includes("agency")) {
      plan.pageType = "business";
      plan.components.add("pricing");
      plan.components.add("testimonials");
      plan.components.add("faq");
      plan.components.add("form");
      plan.title = this.smartTitle(ctx.topic || "Business Site");
    }

    if (text.includes("blog")) {
      plan.pageType = "blog";
      plan.components.add("searchBox");
      plan.components.add("cards");
      plan.title = this.smartTitle(ctx.topic || "Blog");
    }

    if (text.includes("weather")) {
      plan.pageType = "weather";
      plan.components.add("searchBox");
      plan.components.add("cards");
      plan.title = this.smartTitle(ctx.topic || "Weather App");
    }

    if (text.includes("chatbot")) {
      plan.pageType = "chatbot";
      plan.components.add("chatbot");
      plan.title = this.smartTitle(ctx.topic || "Mini Chatbot");
    }

    if (text.includes("calculator")) {
      plan.pageType = "calculator";
      plan.components.add("calculator");
      plan.title = this.smartTitle(ctx.topic || "Calculator");
    }

    if (text.includes("todo")) {
      plan.pageType = "todo";
      plan.components.add("todo");
      plan.title = this.smartTitle(ctx.topic || "Todo App");
    }

    if (text.includes("canvas")) {
      plan.components.add("canvas");
    }

    if (text.includes("particles")) {
      plan.components.add("canvas");
      plan.special.canvasType = "particles";
    }

    if (text.includes("snake")) {
      plan.components.add("canvas");
      plan.special.canvasType = "snake";
    }

    if (text.includes("bouncing ball")) {
      plan.components.add("canvas");
      plan.special.canvasType = "bouncingBall";
    }

    if (text.includes("falling block") || text.includes("falling blocks")) {
      plan.components.add("canvas");
      plan.special.canvasType = "fallingBlocks";
    }

    if (!plan.special.voxelLike) {
      if (!ctx.topic) {
        plan.title = this.smartTitle(plan.pageType + " page");
      } else {
        plan.title = this.smartTitle(ctx.topic);
      }
      plan.subtitle = this.subtitleFromPlan(plan);
    }

    return plan;
  }

  smartTitle(subject) {
    const cleaned = String(subject || "Spudzy App")
      .replace(/\b(make|create|generate|write|build|html|website|page|web|app|for|with|a|an|the)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    const text = cleaned || "Spudzy App";

    return text
      .split(/\s+/)
      .slice(0, 6)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  subtitleFromPlan(plan) {
    const map = {
      landing: "A modern landing page generated from your exact design words.",
      portfolio: "A polished portfolio page for projects, skills, and contact.",
      dashboard: "A clean dashboard interface with stats, cards, charts, and tables.",
      shop: "A stylish store page with products, pricing, and calls to action.",
      restaurant: "A polished restaurant page with menu sections and booking form.",
      business: "A professional business page with sections for trust and conversion.",
      blog: "A readable blog-style layout with featured content sections.",
      weather: "A weather-style interface generated in one HTML file.",
      voxel: "Mine, craft, build, and survive in your own voxel universe.",
      calculator: "A fully interactive calculator made in one HTML file.",
      todo: "A local todo app with browser storage.",
      chatbot: "A mini local chatbot interface with simple responses."
    };

    return map[plan.pageType] || "A polished page generated from your prompt.";
  }

  // ===========================================================================
  // CODE MODE ROUTING
  // ===========================================================================

  handleCode(ctx) {
    const plan = ctx.pagePlan;

    if (!plan) {
      return "Spudzy code mode could not build a page plan.";
    }

    if (plan.pageType === "calculator") {
      return this.generateCalculatorHTML(plan);
    }

    if (plan.pageType === "todo") {
      return this.generateTodoHTML(plan);
    }

    if (plan.pageType === "chatbot") {
      return this.generateChatbotHTML(plan);
    }

    return this.generateUniversalHTML(plan);
  }

detectFileKind(text) {
  const sample = String(text ?? "").trim();

  let type = "unknown";

  if (!sample) {
    type = "unknown";
  } else {

    // JSON
    if (/^\s*[{[][\s\S]*[}\]]\s*$/.test(sample)) {
      try {
        JSON.parse(sample);
        type = "json";
      } catch {}
    }

    // HTML
    else if (/<(!doctype html|html|head|body)\b/i.test(sample)) {
      type = "html";
    }

    // XML / SVG
    else if (/^<\?xml|<svg\b|<\/svg>/i.test(sample)) {
      type = "xml/svg";
    }

    // JavaScript
    else if (/\b(function|const|let|var|class|=>|import|export|module\.exports|require|document\.|window\.|addEventListener|fetch)\b/.test(sample)) {
      type = "javascript";
    }

    // CSS
    else if (
      /[a-z0-9_-]+\s*\{[^}]*\}/i.test(sample) &&
      /(color|background|display|position|margin|padding)\s*:/i.test(sample)
    ) {
      type = "css";
    }

    // Markdown
    else if (/^#{1,6}\s|\n[-*]\s|\n```/m.test(sample)) {
      type = "markdown";
    }

    // Config
    else if (/^[\w.-]+\s*[:=]\s*.+$/m.test(sample)) {
      type = "config";
    }

    // Log
    else if (/\b(error|warning|failed|exception|trace)\b/i.test(sample)) {
      type = "log";
    }

    // File tree
    else if (/(\|--|\+-|\\|\/)/.test(sample) && sample.split("\n").length > 2) {
      type = "file-tree";
    }

    // Fallback
    else {
      type = "plain-text";
    }
  }

  return type;
}
  // ===========================================================================
  // THEMES / HTML GENERATION
  // ===========================================================================

  getTheme(plan) {
    if (plan.theme === "light") {
      return {
        bg: "#f8fafc",
        bg2: "#e2e8f0",
        panel: "rgba(255,255,255,0.82)",
        panel2: "rgba(255,255,255,0.60)",
        text: "#020617",
        muted: "#475569",
        border: "rgba(15,23,42,0.14)",
        shadow: "0 24px 80px rgba(15,23,42,0.14)"
      };
    }

    return {
      bg: "#020617",
      bg2: "#0f172a",
      panel: "rgba(15,23,42,0.78)",
      panel2: "rgba(2,6,23,0.62)",
      text: "#f8fafc",
      muted: "#94a3b8",
      border: "rgba(148,163,184,0.18)",
      shadow: "0 24px 80px rgba(0,0,0,0.38)"
    };
  }

  pageFontCSS(plan) {
    if (plan.mood === "voxel" || plan.mood === "pixel" || plan.mood === "retro") {
      return `font-family: Impact, Haettenschweiler, "Arial Black", system-ui, sans-serif; letter-spacing: 0.02em;`;
    }

    return `font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;`;
  }

  generateUniversalHTML(plan) {
    const theme = this.getTheme(plan);

    const hasNavbar = plan.components.has("navbar");
    const hasHero = plan.components.has("hero");
    const hasCards = plan.components.has("cards");
    const hasGallery = plan.components.has("gallery");
    const hasPricing = plan.components.has("pricing");
    const hasForm = plan.components.has("form") || plan.components.has("login") || plan.components.has("signup");
    const hasTestimonials = plan.components.has("testimonials");
    const hasFAQ = plan.components.has("faq");
    const hasStats = plan.components.has("stats");
    const hasSearchBox = plan.components.has("searchBox");
    const hasMenu = plan.components.has("menu");
    const hasCanvas = plan.components.has("canvas");

    const isVoxel = plan.special.voxelLike;
    const cards = this.cardContent(plan);
    const gallery = this.galleryContent(plan);
    const menuItems = this.menuContent(plan);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${this.escapeHTML(plan.title)}</title>
  <style>
    :root {
      --bg: ${theme.bg};
      --bg2: ${theme.bg2};
      --panel: ${theme.panel};
      --panel2: ${theme.panel2};
      --text: ${theme.text};
      --muted: ${theme.muted};
      --border: ${theme.border};
      --primary: ${plan.primary};
      --secondary: ${plan.secondary};
      --accent: ${plan.accent};
      --shadow: ${theme.shadow};
      --radius: ${isVoxel ? "8px" : plan.effects.has("rounded") ? "30px" : "22px"};
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      min-height: 100vh;
      ${this.pageFontCSS(plan)}
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(255,255,255,0.04), transparent 30%),
        radial-gradient(circle at bottom right, rgba(255,255,255,0.03), transparent 30%),
        linear-gradient(135deg, var(--bg), var(--bg2));
      overflow-x: hidden;
    }

    ${isVoxel ? this.voxelCss() : ""}

    .page {
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
      padding: 24px 0 60px;
      position: relative;
      z-index: 1;
    }

    .nav {
      position: sticky;
      top: 16px;
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 14px 18px;
      border: 1px solid var(--border);
      background: var(--panel);
      backdrop-filter: blur(18px);
      border-radius: ${isVoxel ? "10px" : "999px"};
      box-shadow: var(--shadow);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 950;
      letter-spacing: -0.04em;
    }

    .logo {
      width: 36px;
      height: 36px;
      display: grid;
      place-items: center;
      border-radius: ${isVoxel ? "6px" : "14px"};
      color: white;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      box-shadow: 0 0 30px rgba(255,255,255,0.06);
    }

    .nav-links {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      color: var(--muted);
      font-size: 0.92rem;
    }

    .nav-links a {
      color: inherit;
      text-decoration: none;
    }

    .nav-links a:hover {
      color: var(--text);
    }

    .hero {
      min-height: 520px;
      display: grid;
      grid-template-columns: 1.05fr 0.95fr;
      align-items: center;
      gap: 32px;
      padding: 58px 0 34px;
    }

    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 12px;
      border-radius: ${isVoxel ? "6px" : "999px"};
      border: 1px solid var(--border);
      background: var(--panel);
      color: var(--muted);
      font-size: 0.86rem;
      margin-bottom: 16px;
    }

    h1 {
      font-size: clamp(3rem, 9vw, 6.8rem);
      line-height: 0.92;
      letter-spacing: ${isVoxel ? "0.01em" : "-0.09em"};
      text-transform: ${isVoxel ? "uppercase" : "none"};
      text-shadow: ${isVoxel ? "0 5px 0 rgba(0,0,0,0.35)" : "none"};
    }

    .gradient-text {
      background: linear-gradient(135deg, var(--primary), var(--secondary), var(--accent));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    .hero p {
      max-width: 650px;
      margin-top: 20px;
      color: var(--muted);
      font-size: clamp(1rem, 2vw, 1.2rem);
      line-height: 1.75;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 26px;
    }

    .btn {
      border: 0;
      border-radius: ${isVoxel ? "8px" : "999px"};
      padding: 14px 20px;
      color: white;
      font-weight: 900;
      cursor: pointer;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      box-shadow: 0 18px 45px rgba(0,0,0,0.25);
      transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
      text-transform: ${isVoxel ? "uppercase" : "none"};
    }

    .btn:hover {
      transform: translateY(-3px);
      filter: brightness(1.1);
      box-shadow: 0 24px 60px rgba(0,0,0,0.32);
    }

    .btn.secondary {
      background: var(--panel);
      color: var(--text);
      border: 1px solid var(--border);
      box-shadow: none;
    }

    .visual {
      min-height: 430px;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: linear-gradient(135deg, rgba(255,255,255,0.03), transparent), var(--panel);
      box-shadow: var(--shadow);
      position: relative;
      overflow: hidden;
      display: grid;
      place-items: center;
    }

    .orb {
      width: 210px;
      height: 210px;
      border-radius: ${isVoxel ? "18px" : "999px"};
      background: ${isVoxel
        ? "linear-gradient(135deg, #22c55e 0 33%, #92400e 33% 66%, #14532d 66%)"
        : "radial-gradient(circle at 30% 25%, white, var(--secondary) 18%, var(--primary) 68%, transparent 70%)"};
      filter: drop-shadow(0 0 50px rgba(255,255,255,0.06));
      animation: float 4s ease-in-out infinite;
    }

    .ring {
      position: absolute;
      width: 340px;
      height: 340px;
      border-radius: ${isVoxel ? "24px" : "999px"};
      border: 1px solid rgba(255,255,255,0.12);
      animation: spin 14s linear infinite;
    }

    .section {
      padding: 38px 0;
    }

    .section-title {
      font-size: clamp(2rem, 5vw, 3.4rem);
      letter-spacing: ${isVoxel ? "0" : "-0.06em"};
      margin-bottom: 16px;
      text-transform: ${isVoxel ? "uppercase" : "none"};
    }

    .section-lead {
      color: var(--muted);
      max-width: 760px;
      line-height: 1.7;
      margin-bottom: 22px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .card {
      padding: 22px;
      border-radius: var(--radius);
      background: var(--panel);
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
      min-height: 180px;
      transition: transform 0.2s ease, border-color 0.2s ease, filter 0.2s ease;
      position: relative;
      overflow: hidden;
    }

    .card:hover {
      transform: translateY(-6px);
      border-color: rgba(255,255,255,0.18);
      filter: brightness(1.06);
    }

    .card-icon {
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
      border-radius: ${isVoxel ? "6px" : "14px"};
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      margin-bottom: 14px;
      color: white;
      font-size: 1.25rem;
    }

    .card h3 {
      font-size: 1.2rem;
      margin-bottom: 10px;
    }

    .card p {
      color: var(--muted);
      line-height: 1.65;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
    }

    .stat {
      padding: 20px;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: var(--panel);
      box-shadow: var(--shadow);
    }

    .stat strong {
      display: block;
      font-size: 2rem;
      letter-spacing: -0.06em;
    }

    .gallery {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 16px;
    }

    .gallery-tile {
      min-height: 220px;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02)), var(--panel2);
      display: grid;
      place-items: center;
      font-size: 3rem;
      box-shadow: var(--shadow);
      position: relative;
      overflow: hidden;
    }

    .gallery-tile span {
      position: relative;
      z-index: 1;
      text-align: center;
      font-size: clamp(1.2rem, 4vw, 2.1rem);
      font-weight: 950;
    }

    .gallery-tile::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px);
      background-size: ${isVoxel ? "34px 34px" : "42px 42px"};
      opacity: 0.35;
    }

    .pricing {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .price {
      font-size: 2.3rem;
      font-weight: 950;
      letter-spacing: -0.06em;
      margin: 10px 0;
    }

    .form-box {
      max-width: 560px;
      padding: 24px;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: var(--panel);
      box-shadow: var(--shadow);
    }

    input,
    textarea {
      width: 100%;
      margin-top: 10px;
      border: 1px solid var(--border);
      background: var(--panel2);
      color: var(--text);
      border-radius: ${isVoxel ? "8px" : "16px"};
      padding: 13px 14px;
      outline: none;
      font: inherit;
    }

    textarea {
      min-height: 120px;
      resize: vertical;
    }

    .output {
      margin-top: 18px;
      color: var(--muted);
      min-height: 24px;
    }

    .menu-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .menu-item {
      padding: 18px;
      border-radius: var(--radius);
      background: var(--panel);
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
    }

    .menu-item strong {
      display: block;
      margin-bottom: 6px;
    }

    .search-box {
      max-width: 460px;
      padding: 18px;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: var(--panel);
      box-shadow: var(--shadow);
    }

    .canvas-wrap {
      border-radius: var(--radius);
      overflow: hidden;
      border: 1px solid var(--border);
      background: var(--panel);
      box-shadow: var(--shadow);
    }

    canvas {
      display: block;
      width: 100%;
      height: 360px;
      background: #020617;
    }

    .faq-item {
      padding: 18px;
      border-radius: var(--radius);
      background: var(--panel);
      border: 1px solid var(--border);
      margin-bottom: 10px;
    }

    .testimonial {
      padding: 18px;
      border-radius: var(--radius);
      background: var(--panel);
      border: 1px solid var(--border);
      min-height: 130px;
    }

    footer {
      color: var(--muted);
      border-top: 1px solid var(--border);
      padding-top: 24px;
      margin-top: 28px;
      font-size: 0.92rem;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-22px) rotate(8deg); }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 900px) {
      .hero {
        grid-template-columns: 1fr;
      }

      .grid,
      .gallery,
      .pricing,
      .menu-grid,
      .stats {
        grid-template-columns: 1fr;
      }

      .nav {
        flex-direction: column;
        align-items: flex-start;
        border-radius: 24px;
      }
    }
  </style>
</head>
<body>
  ${isVoxel ? `<div class="block-bg" aria-hidden="true"></div>` : ""}

  <div class="page">
    ${hasNavbar ? this.sectionNavbar(plan) : ""}
    ${hasHero ? this.sectionHero(plan) : ""}
    ${hasSearchBox ? this.sectionSearchBox(plan) : ""}
    ${hasStats ? this.sectionStats(plan) : ""}
    ${hasCards ? this.sectionCards(plan, cards) : ""}
    ${hasGallery ? this.sectionGallery(plan, gallery) : ""}
    ${hasMenu ? this.sectionMenu(plan, menuItems) : ""}
    ${hasCanvas ? this.sectionCanvas(plan) : ""}
    ${hasPricing ? this.sectionPricing(plan) : ""}
    ${hasTestimonials ? this.sectionTestimonials(plan) : ""}
    ${hasFAQ ? this.sectionFAQ(plan) : ""}
    ${hasForm ? this.sectionForm(plan) : ""}

    <footer>
      Built by Spudzy AI Engine v${this.version}. Generated from your prompt words.
    </footer>
  </div>

  <script>
    ${this.universalClientJS(plan)}
  </script>
</body>
</html>`;
  }

  voxelCss() {
    return `
    .block-bg {
      position: fixed;
      inset: 0;
      pointer-events: none;
      opacity: 0.18;
      background-image:
        linear-gradient(rgba(255,255,255,0.12) 2px, transparent 2px),
        linear-gradient(90deg, rgba(255,255,255,0.12) 2px, transparent 2px);
      background-size: 42px 42px;
      z-index: 0;
    }

    body::before {
      content: "";
      position: fixed;
      inset: auto 0 0 0;
      height: 26vh;
      background:
        linear-gradient(90deg, #14532d 0 20%, #166534 20% 40%, #92400e 40% 60%, #78350f 60% 80%, #14532d 80% 100%);
      clip-path: polygon(0 45%, 8% 45%, 8% 30%, 18% 30%, 18% 55%, 28% 55%, 28% 35%, 38% 35%, 38% 60%, 48% 60%, 48% 40%, 58% 40%, 58% 62%, 68% 62%, 68% 42%, 78% 42%, 78% 55%, 88% 55%, 88% 35%, 100% 35%, 100% 100%, 0 100%);
      opacity: 0.45;
      z-index: 0;
      pointer-events: none;
    }`;
  }

  sectionNavbar(plan) {
    const labels = plan.special.voxelLike
      ? ["Home", "Craft", "Explore", "Build", "Join"]
      : ["Home", "Features", "Gallery", "Pricing", "Contact"];

    return `
    <nav class="nav">
      <div class="brand">
        <div class="logo">${plan.special.voxelLike ? "▣" : "⚡"}</div>
        <span>${this.escapeHTML(plan.title)}</span>
      </div>
      <div class="nav-links">
        <a href="#home">${labels[0]}</a>
        <a href="#features">${labels[1]}</a>
        <a href="#gallery">${labels[2]}</a>
        <a href="#pricing">${labels[3]}</a>
        <a href="#contact">${labels[4]}</a>
      </div>
    </nav>`;
  }

  sectionHero(plan) {
    const primaryButton = plan.special.voxelLike ? "Start Building" : "Launch Demo";
    const secondaryButton = plan.special.voxelLike ? "Explore Biomes" : "Random Theme";

    return `
    <section class="hero" id="home">
      <div>
        <div class="eyebrow">${plan.special.voxelLike ? "🟩 Original voxel-inspired style" : "✨ Prompt-built UI"}</div>
        <h1>${this.escapeHTML(plan.title)} <span class="gradient-text">${plan.special.voxelLike ? "Block by Block." : "Built Better."}</span></h1>
        <p>${this.escapeHTML(plan.subtitle)}</p>
        <div class="actions">
          <button class="btn" id="mainBtn">${primaryButton}</button>
          <button class="btn secondary" id="themeBtn">${secondaryButton}</button>
        </div>
      </div>
      <div class="visual">
        <div class="ring"></div>
        <div class="orb"></div>
      </div>
    </section>`;
  }

  sectionSearchBox(plan) {
    return `
    <section class="section">
      <h2 class="section-title">Search</h2>
      <div class="search-box">
        <input id="searchInput" placeholder="Search this demo..." />
        <div class="output" id="searchOutput"></div>
      </div>
    </section>`;
  }

  sectionStats(plan) {
    const labels = plan.special.voxelLike
      ? [["128", "Blocks"], ["7", "Biomes"], ["42", "Crafts"], ["99%", "Survival"]]
      : [["98%", "Polish"], ["24k", "Interactions"], ["12", "Modules"], ["1", "HTML File"]];

    return `
    <section class="section">
      <h2 class="section-title">Stats</h2>
      <div class="stats">
        ${labels.map(item => `
        <div class="stat">
          <strong>${item[0]}</strong>
          <span>${item[1]}</span>
        </div>`).join("")}
      </div>
    </section>`;
  }

  sectionCards(plan, cards) {
    return `
    <section class="section" id="features">
      <h2 class="section-title">${plan.special.voxelLike ? "Craft Your World" : "Features"}</h2>
      <p class="section-lead">${plan.special.voxelLike
        ? "Explore original blocky systems inspired by voxel adventures, using no official assets."
        : "These sections were selected directly from your prompt words."}</p>
      <div class="grid">
        ${cards.map(card => `
        <article class="card">
          <div class="card-icon">${card.icon}</div>
          <h3>${this.escapeHTML(card.title)}</h3>
          <p>${this.escapeHTML(card.text)}</p>
        </article>`).join("")}
      </div>
    </section>`;
  }

  sectionGallery(plan, gallery) {
    return `
    <section class="section" id="gallery">
      <h2 class="section-title">${plan.special.voxelLike ? "Biomes" : "Gallery"}</h2>
      <p class="section-lead">${plan.special.voxelLike
        ? "Original generated biome cards with no external assets."
        : "A visual gallery created because your prompt asked for one."}</p>
      <div class="gallery">
        ${gallery.map(item => `<div class="gallery-tile"><span>${this.escapeHTML(item)}</span></div>`).join("")}
      </div>
    </section>`;
  }

  sectionMenu(plan, items) {
    return `
    <section class="section">
      <h2 class="section-title">Menu</h2>
      <div class="menu-grid">
        ${items.map(item => `
        <div class="menu-item">
          <strong>${this.escapeHTML(item.name)}</strong>
          <p>${this.escapeHTML(item.desc)}</p>
        </div>`).join("")}
      </div>
    </section>`;
  }

  sectionCanvas(plan) {
    return `
    <section class="section">
      <h2 class="section-title">${plan.special.voxelLike ? "Falling Blocks" : "Canvas Animation"}</h2>
      <p class="section-lead">A live canvas section generated from your prompt.</p>
      <div class="canvas-wrap">
        <canvas id="demoCanvas"></canvas>
      </div>
    </section>`;
  }

  sectionPricing(plan) {
    const titles = plan.special.voxelLike
      ? ["Starter Realm", "Builder Realm", "Legend Realm"]
      : ["Starter", "Pro", "Ultra"];

    return `
    <section class="section" id="pricing">
      <h2 class="section-title">${plan.special.voxelLike ? "Choose Your Realm" : "Pricing"}</h2>
      <div class="pricing">
        <div class="card">
          <h3>${titles[0]}</h3>
          <div class="price">$9</div>
          <p>Simple launch package with the essentials.</p>
        </div>
        <div class="card">
          <h3>${titles[1]}</h3>
          <div class="price">$29</div>
          <p>More power, more sections, more polish.</p>
        </div>
        <div class="card">
          <h3>${titles[2]}</h3>
          <div class="price">$99</div>
          <p>Full premium experience with extra visual energy.</p>
        </div>
      </div>
    </section>`;
  }

  sectionTestimonials(plan) {
    return `
    <section class="section">
      <h2 class="section-title">Testimonials</h2>
      <div class="grid">
        <div class="testimonial">“This generated page feels polished and fast.”</div>
        <div class="testimonial">“The design came together from one prompt.”</div>
        <div class="testimonial">“A clean single-file demo with real styling.”</div>
      </div>
    </section>`;
  }

  sectionFAQ(plan) {
    return `
    <section class="section">
      <h2 class="section-title">FAQ</h2>
      <div class="faq-item">
        <strong>Is this one file?</strong>
        <p class="section-lead">Yes. This demo keeps HTML, CSS, and JavaScript together.</p>
      </div>
      <div class="faq-item">
        <strong>Does it use external images?</strong>
        <p class="section-lead">No. It uses CSS shapes, gradients, text, and browser drawing.</p>
      </div>
    </section>`;
  }

  sectionForm(plan) {
    return `
    <section class="section" id="contact">
      <h2 class="section-title">${plan.special.voxelLike ? "Join The Realm" : "Contact"}</h2>
      <div class="form-box">
        <input id="nameInput" placeholder="Name" />
        <input id="emailInput" placeholder="Email" />
        <textarea id="messageInput" placeholder="${plan.special.voxelLike ? "Tell us what you want to build..." : "Message"}"></textarea>
        <button class="btn" id="formBtn" style="margin-top: 12px;">Submit</button>
        <div class="output" id="formOutput"></div>
      </div>
    </section>`;
  }

  cardContent(plan) {
    if (plan.special.voxelLike) {
      return [
        { icon: "⛏️", title: "Mining", text: "Break blocks, discover resources, and carve your path through caves." },
        { icon: "🧰", title: "Crafting", text: "Combine materials in a blocky crafting system built for imagination." },
        { icon: "🏗️", title: "Building", text: "Stack original voxel blocks into bases, towers, farms, and worlds." },
        { icon: "🔥", title: "Survival", text: "Face nightfall, glowing lava zones, and underground danger." },
        { icon: "🌲", title: "Biomes", text: "Explore forests, deserts, snowfields, caves, and strange realms." },
        { icon: "⚙️", title: "Logic Blocks", text: "Create simple machines with original block-based logic elements." }
      ];
    }

    if (plan.pageType === "portfolio") {
      return [
        { icon: "🧩", title: "Projects", text: "Showcase your strongest work with polished project cards." },
        { icon: "⚡", title: "Skills", text: "Highlight tools, languages, and creative strengths." },
        { icon: "📬", title: "Contact", text: "Make it easy for people to reach out." }
      ];
    }

    if (plan.pageType === "dashboard") {
      return [
        { icon: "📊", title: "Analytics", text: "Monitor metrics with cards, stats, and chart regions." },
        { icon: "📁", title: "Reports", text: "Organize views into neat management sections." },
        { icon: "⚡", title: "Performance", text: "Build a clean admin-style UI with strong contrast." }
      ];
    }

    if (plan.pageType === "shop") {
      return [
        { icon: "🛒", title: "Products", text: "Feature items in product cards with strong calls to action." },
        { icon: "⭐", title: "Best Sellers", text: "Highlight popular items with visual emphasis." },
        { icon: "🚚", title: "Fast Checkout", text: "Guide visitors through a conversion-friendly layout." }
      ];
    }

    if (plan.pageType === "restaurant") {
      return [
        { icon: "🍽️", title: "Fresh Menu", text: "Show dishes in a polished menu layout." },
        { icon: "🔥", title: "Chef Specials", text: "Feature seasonal and signature meals." },
        { icon: "📅", title: "Reservations", text: "Include quick booking and contact sections." }
      ];
    }

    return [
      { icon: "✨", title: "Smart Layout", text: "The page structure is chosen from your prompt words." },
      { icon: "🎨", title: "Prompt Styling", text: "Colors, mood, effects, and sections are generated automatically." },
      { icon: "⚙️", title: "Interactive JavaScript", text: "Buttons and small behaviors are included in the final HTML." }
    ];
  }

  galleryContent(plan) {
    if (plan.special.voxelLike) {
      return ["🌲 Forest", "🏜️ Desert", "❄️ Snow", "🕳️ Cave", "🌋 Lava Zone"];
    }

    if (plan.pageType === "portfolio") {
      return ["Project One", "Project Two", "Project Three"];
    }

    if (plan.pageType === "restaurant") {
      return ["🍜 Signature Dish", "🍔 House Favorite", "🍰 Dessert"];
    }

    if (plan.pageType === "shop") {
      return ["Featured Product", "Popular Product", "New Arrival"];
    }

    return ["Visual One", "Visual Two", "Visual Three"];
  }

  menuContent(plan) {
    return [
      { name: "House Special", desc: "A featured item for your generated restaurant page." },
      { name: "Seasonal Favorite", desc: "A second menu item with supporting description." },
      { name: "Chef’s Choice", desc: "A highlighted dish with polished presentation." }
    ];
  }

  universalClientJS(plan) {
    const canvasType = plan.special.canvasType || (plan.special.voxelLike ? "fallingBlocks" : "particles");

    return `
    const root = document.documentElement;
    const mainBtn = document.getElementById("mainBtn");
    const themeBtn = document.getElementById("themeBtn");
    const formBtn = document.getElementById("formBtn");
    const formOutput = document.getElementById("formOutput");
    const searchInput = document.getElementById("searchInput");
    const searchOutput = document.getElementById("searchOutput");

    if (mainBtn) {
      mainBtn.addEventListener("click", () => {
        mainBtn.textContent = "${plan.special.voxelLike ? "World Started ▣" : "Launched ✨"}";
        document.body.animate(
          [
            { filter: "brightness(1)" },
            { filter: "brightness(1.2)" },
            { filter: "brightness(1)" }
          ],
          { duration: 550 }
        );
      });
    }

    if (themeBtn) {
      const colors = ["#8b5cf6", "#06b6d4", "#ef4444", "#22c55e", "#f97316", "#ec4899", "#f59e0b"];
      themeBtn.addEventListener("click", () => {
        const one = colors[Math.floor(Math.random() * colors.length)];
        const two = colors[Math.floor(Math.random() * colors.length)];
        root.style.setProperty("--primary", one);
        root.style.setProperty("--secondary", two);
      });
    }

    if (formBtn && formOutput) {
      formBtn.addEventListener("click", () => {
        formOutput.textContent = "Submitted locally. Connect a backend to make this form real.";
      });
    }

    if (searchInput && searchOutput) {
      searchInput.addEventListener("input", () => {
        const value = searchInput.value.trim();
        searchOutput.textContent = value ? "Local demo search for: " + value : "";
      });
    }

    ${this.canvasClientJS(canvasType, plan)}
    `;
  }

  canvasClientJS(type, plan) {
    if (type === "fallingBlocks") {
      return `
      const canvas = document.getElementById("demoCanvas");
      if (canvas) {
        const ctx = canvas.getContext("2d");
        let w = 0;
        let h = 0;
        let dpr = Math.max(1, window.devicePixelRatio || 1);
        const blocks = [];

        function resizeCanvas() {
          const rect = canvas.getBoundingClientRect();
          w = rect.width;
          h = rect.height;
          canvas.width = Math.floor(w * dpr);
          canvas.height = Math.floor(h * dpr);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function spawnBlock() {
          const size = 24 + Math.random() * 24;
          blocks.push({
            x: Math.random() * w,
            y: -size,
            s: size,
            vy: 1.5 + Math.random() * 3,
            color: Math.random() > 0.5 ? "${plan.primary}" : "${plan.secondary}"
          });
        }

        function draw() {
          ctx.clearRect(0, 0, w, h);

          const gradient = ctx.createLinearGradient(0, 0, w, h);
          gradient.addColorStop(0, "#020617");
          gradient.addColorStop(1, "#0f172a");
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, w, h);

          if (Math.random() < 0.14) spawnBlock();

          for (let i = blocks.length - 1; i >= 0; i--) {
            const b = blocks[i];
            b.y += b.vy;

            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, b.s, b.s);
            ctx.strokeStyle = "rgba(255,255,255,0.22)";
            ctx.strokeRect(b.x, b.y, b.s, b.s);

            if (b.y > h + 60) {
              blocks.splice(i, 1);
            }
          }

          requestAnimationFrame(draw);
        }

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();
        draw();
      }`;
    }

    if (type === "bouncingBall") {
      return `
      const canvas = document.getElementById("demoCanvas");
      if (canvas) {
        const ctx = canvas.getContext("2d");
        let w = 0;
        let h = 0;
        let dpr = Math.max(1, window.devicePixelRatio || 1);

        const ball = { x: 120, y: 120, r: 28, vx: 4, vy: 3 };

        function resizeCanvas() {
          const rect = canvas.getBoundingClientRect();
          w = rect.width;
          h = rect.height;
          canvas.width = Math.floor(w * dpr);
          canvas.height = Math.floor(h * dpr);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function draw() {
          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = "#020617";
          ctx.fillRect(0, 0, w, h);

          ball.x += ball.vx;
          ball.y += ball.vy;

          if (ball.x + ball.r > w || ball.x - ball.r < 0) ball.vx *= -1;
          if (ball.y + ball.r > h || ball.y - ball.r < 0) ball.vy *= -1;

          const glow = ctx.createRadialGradient(ball.x - 10, ball.y - 12, 2, ball.x, ball.y, ball.r * 2.3);
          glow.addColorStop(0, "white");
          glow.addColorStop(0.3, "${plan.secondary}");
          glow.addColorStop(0.8, "${plan.primary}");
          glow.addColorStop(1, "transparent");

          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.r * 2.1, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "${plan.primary}";
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
          ctx.fill();

          requestAnimationFrame(draw);
        }

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();
        draw();
      }`;
    }

    if (type === "particles") {
      return `
      const canvas = document.getElementById("demoCanvas");
      if (canvas) {
        const ctx = canvas.getContext("2d");
        let w = 0;
        let h = 0;
        let dpr = Math.max(1, window.devicePixelRatio || 1);
        const particles = [];

        function resizeCanvas() {
          const rect = canvas.getBoundingClientRect();
          w = rect.width;
          h = rect.height;
          canvas.width = Math.floor(w * dpr);
          canvas.height = Math.floor(h * dpr);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function seed() {
          particles.length = 0;
          for (let i = 0; i < 90; i++) {
            particles.push({
              x: Math.random() * w,
              y: Math.random() * h,
              vx: (Math.random() - 0.5) * 1.4,
              vy: (Math.random() - 0.5) * 1.4,
              r: 1 + Math.random() * 3
            });
          }
        }

        function draw() {
          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = "#020617";
          ctx.fillRect(0, 0, w, h);

          for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > w) p.vx *= -1;
            if (p.y < 0 || p.y > h) p.vy *= -1;

            ctx.fillStyle = "${plan.primary}";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
          }

          requestAnimationFrame(draw);
        }

        window.addEventListener("resize", () => {
          resizeCanvas();
          seed();
        });

        resizeCanvas();
        seed();
        draw();
      }`;
    }

    if (type === "snake") {
      return `
      const canvas = document.getElementById("demoCanvas");
      if (canvas) {
        const ctx = canvas.getContext("2d");
        canvas.width = 480;
        canvas.height = 360;

        const size = 24;
        const cols = Math.floor(canvas.width / size);
        const rows = Math.floor(canvas.height / size);

        let snake = [{ x: 5, y: 5 }];
        let food = { x: 10, y: 8 };
        let dir = { x: 1, y: 0 };
        let nextDir = { x: 1, y: 0 };

        function randomFood() {
          food = {
            x: Math.floor(Math.random() * cols),
            y: Math.floor(Math.random() * rows)
          };
        }

        function tick() {
          dir = nextDir;

          const head = {
            x: snake[0].x + dir.x,
            y: snake[0].y + dir.y
          };

          if (
            head.x < 0 || head.y < 0 ||
            head.x >= cols || head.y >= rows ||
            snake.some(part => part.x === head.x && part.y === head.y)
          ) {
            snake = [{ x: 5, y: 5 }];
            dir = { x: 1, y: 0 };
            nextDir = { x: 1, y: 0 };
            randomFood();
            return;
          }

          snake.unshift(head);

          if (head.x === food.x && head.y === food.y) {
            randomFood();
          } else {
            snake.pop();
          }
        }

        function draw() {
          ctx.fillStyle = "#020617";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.fillStyle = "${plan.secondary}";
          ctx.fillRect(food.x * size + 4, food.y * size + 4, size - 8, size - 8);

          ctx.fillStyle = "${plan.primary}";
          for (const part of snake) {
            ctx.fillRect(part.x * size + 3, part.y * size + 3, size - 6, size - 6);
          }
        }

        addEventListener("keydown", event => {
          if (event.key === "ArrowUp" && dir.y !== 1) nextDir = { x: 0, y: -1 };
          if (event.key === "ArrowDown" && dir.y !== -1) nextDir = { x: 0, y: 1 };
          if (event.key === "ArrowLeft" && dir.x !== 1) nextDir = { x: -1, y: 0 };
          if (event.key === "ArrowRight" && dir.x !== -1) nextDir = { x: 1, y: 0 };
        });

        randomFood();
        setInterval(() => {
          tick();
          draw();
        }, 120);
      }`;
    }

    return "";
  }

  // ===========================================================================
  // SPECIAL APP GENERATORS
  // ===========================================================================

  generateCalculatorHTML(plan) {
    const theme = this.getTheme(plan);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${this.escapeHTML(plan.title || "Calculator")}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: radial-gradient(circle at top, ${plan.primary}44, transparent 35%), ${theme.bg};
      color: ${theme.text};
      font-family: system-ui, sans-serif;
      padding: 20px;
    }

    .calc {
      width: min(390px, 100%);
      padding: 18px;
      border-radius: 28px;
      background: ${theme.panel};
      border: 1px solid ${theme.border};
      box-shadow: ${theme.shadow};
      backdrop-filter: blur(16px);
    }

    .screen {
      min-height: 88px;
      padding: 18px;
      border-radius: 20px;
      background: ${theme.panel2};
      border: 1px solid ${theme.border};
      display: flex;
      align-items: end;
      justify-content: end;
      font-size: 2.2rem;
      font-weight: 900;
      overflow: hidden;
    }

    .keys {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-top: 12px;
    }

    button {
      min-height: 62px;
      border: 0;
      border-radius: 18px;
      background: ${theme.panel2};
      color: ${theme.text};
      font-weight: 900;
      font-size: 1.15rem;
      cursor: pointer;
      border: 1px solid ${theme.border};
    }

    .op,
    .equals {
      background: linear-gradient(135deg, ${plan.primary}, ${plan.secondary});
      color: white;
    }

    .wide {
      grid-column: span 2;
    }
  </style>
</head>
<body>
  <main class="calc">
    <div class="screen" id="screen">0</div>
    <div class="keys">
      <button data-key="C" class="wide">C</button>
      <button data-key="/" class="op">÷</button>
      <button data-key="*" class="op">×</button>
      <button data-key="7">7</button>
      <button data-key="8">8</button>
      <button data-key="9">9</button>
      <button data-key="-" class="op">−</button>
      <button data-key="4">4</button>
      <button data-key="5">5</button>
      <button data-key="6">6</button>
      <button data-key="+" class="op">+</button>
      <button data-key="1">1</button>
      <button data-key="2">2</button>
      <button data-key="3">3</button>
      <button data-key="=" class="equals">=</button>
      <button data-key="0" class="wide">0</button>
      <button data-key=".">.</button>
      <button data-key="Backspace">⌫</button>
    </div>
  </main>

  <script>
    const screen = document.getElementById("screen");
    const buttons = document.querySelectorAll("button");
    let expr = "";

    function safeEval(value) {
      if (!/^[0-9+\\-*/.() ]+$/.test(value)) return "Error";
      try {
        const result = Function('"use strict"; return (' + value + ')')();
        if (!Number.isFinite(result)) return "Error";
        return String(Number.isInteger(result) ? result : Number(result.toFixed(8)));
      } catch {
        return "Error";
      }
    }

    function update() {
      screen.textContent = expr || "0";
    }

    function press(key) {
      if (key === "C") expr = "";
      else if (key === "Backspace") expr = expr.slice(0, -1);
      else if (key === "=") expr = safeEval(expr);
      else expr += key;
      update();
    }

    buttons.forEach(button => button.addEventListener("click", () => press(button.dataset.key)));

    addEventListener("keydown", event => {
      if ("0123456789+-*/.".includes(event.key)) press(event.key);
      if (event.key === "Enter") press("=");
      if (event.key === "Backspace") press("Backspace");
      if (event.key === "Escape") press("C");
    });
  </script>
</body>
</html>`;
  }

  generateTodoHTML(plan) {
    const theme = this.getTheme(plan);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${this.escapeHTML(plan.title || "Todo App")}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: radial-gradient(circle at top left, ${plan.primary}55, transparent 32%), ${theme.bg};
      color: ${theme.text};
      font-family: system-ui, sans-serif;
      padding: 20px;
    }

    .todo {
      width: min(590px, 100%);
      padding: 24px;
      border-radius: 28px;
      background: ${theme.panel};
      border: 1px solid ${theme.border};
      box-shadow: ${theme.shadow};
      backdrop-filter: blur(16px);
    }

    h1 {
      font-size: clamp(2rem, 8vw, 4rem);
      letter-spacing: -0.08em;
      margin-bottom: 16px;
    }

    form {
      display: flex;
      gap: 10px;
    }

    input {
      flex: 1;
      border: 1px solid ${theme.border};
      background: ${theme.panel2};
      color: ${theme.text};
      border-radius: 999px;
      padding: 14px 16px;
      outline: none;
    }

    button {
      border: 0;
      border-radius: 999px;
      padding: 12px 16px;
      background: linear-gradient(135deg, ${plan.primary}, ${plan.secondary});
      color: white;
      font-weight: 800;
      cursor: pointer;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 18px 0 0;
      display: grid;
      gap: 10px;
    }

    li {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: center;
      border-radius: 18px;
      padding: 12px 14px;
      background: ${theme.panel2};
      border: 1px solid ${theme.border};
    }

    .done {
      text-decoration: line-through;
      color: ${theme.muted};
    }
  </style>
</head>
<body>
  <main class="todo">
    <h1>${this.escapeHTML(plan.title || "Todo App")}</h1>
    <form id="form">
      <input id="input" placeholder="Add a task..." />
      <button>Add</button>
    </form>
    <ul id="list"></ul>
  </main>

  <script>
    const form = document.getElementById("form");
    const input = document.getElementById("input");
    const list = document.getElementById("list");
    let tasks = JSON.parse(localStorage.getItem("spudzy_todos_v9") || "[]");

    function save() {
      localStorage.setItem("spudzy_todos_v9", JSON.stringify(tasks));
    }

    function render() {
      list.innerHTML = "";

      tasks.forEach((task, index) => {
        const li = document.createElement("li");

        const span = document.createElement("span");
        span.textContent = task.text;
        if (task.done) span.className = "done";

        const controls = document.createElement("div");

        const toggle = document.createElement("button");
        toggle.textContent = task.done ? "Undo" : "Done";
        toggle.addEventListener("click", () => {
          tasks[index].done = !tasks[index].done;
          save();
          render();
        });

        const remove = document.createElement("button");
        remove.textContent = "Remove";
        remove.addEventListener("click", () => {
          tasks.splice(index, 1);
          save();
          render();
        });

        controls.append(toggle, remove);
        li.append(span, controls);
        list.appendChild(li);
      });
    }

    form.addEventListener("submit", event => {
      event.preventDefault();
      const value = input.value.trim();
      if (!value) return;

      tasks.push({ text: value, done: false });
      input.value = "";
      save();
      render();
    });

    render();
  </script>
</body>
</html>`;
  }

  generateChatbotHTML(plan) {
    const theme = this.getTheme(plan);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${this.escapeHTML(plan.title || "Mini Chatbot")}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: radial-gradient(circle at top left, ${plan.primary}44, transparent 32%), ${theme.bg};
      color: ${theme.text};
      font-family: system-ui, sans-serif;
      padding: 20px;
    }

    .chat {
      width: min(760px, 100%);
      height: min(720px, 88vh);
      display: grid;
      grid-template-rows: auto 1fr auto;
      background: ${theme.panel};
      border: 1px solid ${theme.border};
      border-radius: 28px;
      overflow: hidden;
      box-shadow: ${theme.shadow};
      backdrop-filter: blur(16px);
    }

    header {
      padding: 16px;
      border-bottom: 1px solid ${theme.border};
      font-weight: 900;
    }

    .messages {
      padding: 16px;
      overflow: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .msg {
      max-width: 80%;
      padding: 12px 14px;
      border-radius: 18px;
      line-height: 1.45;
    }

    .bot {
      background: ${theme.panel2};
      border: 1px solid ${theme.border};
      align-self: flex-start;
    }

    .user {
      background: linear-gradient(135deg, ${plan.primary}, ${plan.secondary});
      color: white;
      align-self: flex-end;
    }

    form {
      display: flex;
      gap: 10px;
      padding: 14px;
      border-top: 1px solid ${theme.border};
    }

    input {
      flex: 1;
      border: 1px solid ${theme.border};
      background: ${theme.panel2};
      color: ${theme.text};
      border-radius: 999px;
      padding: 13px 14px;
      outline: none;
    }

    button {
      border: 0;
      border-radius: 999px;
      padding: 12px 18px;
      color: white;
      background: linear-gradient(135deg, ${plan.primary}, ${plan.secondary});
      font-weight: 800;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <main class="chat">
    <header>${this.escapeHTML(plan.title || "Mini Chatbot")}</header>
    <section class="messages" id="messages"></section>
    <form id="form">
      <input id="input" placeholder="Say something..." autocomplete="off" />
      <button>Send</button>
    </form>
  </main>

  <script>
    const messages = document.getElementById("messages");
    const form = document.getElementById("form");
    const input = document.getElementById("input");

    const replies = [
      "That is interesting.",
      "Tell me more.",
      "I am a local chatbot demo.",
      "No backend needed for this example.",
      "Spudzy generated this interface.",
      "Try asking me to build another section."
    ];

    function add(text, type) {
      const div = document.createElement("div");
      div.className = "msg " + type;
      div.textContent = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    form.addEventListener("submit", event => {
      event.preventDefault();
      const text = input.value.trim();
      if (!text) return;

      input.value = "";
      add(text, "user");

      const response = replies[Math.floor(Math.random() * replies.length)];
      setTimeout(() => add(response, "bot"), 250);
    });

    add("Hi. I am a local demo chatbot.", "bot");
  </script>
</body>
</html>`;
  }

  // ===========================================================================
  // CODE EXPLAIN / FIX
  // ===========================================================================

  handleExplainCode(ctx) {
    const code = this.extractCode(ctx.raw);

    if (!code) {
      return "Spudzy code explainer 💻 — Paste code after `explain this code`.";
    }

    const facts = [];
    const tips = [];

    if (/class\s+[A-Z_a-z]\w*/.test(code)) facts.push("It defines a JavaScript class.");
    if (/constructor\s*\(/.test(code)) facts.push("It has a constructor for initializing object state.");
    if (/async\s+/.test(code)) facts.push("It uses async functions.");
    if (/await\s+/.test(code)) facts.push("It waits for promises using await.");
    if (/fetch\s*\(/.test(code)) facts.push("It makes network requests with fetch.");
    if (/document\./.test(code)) facts.push("It interacts with the browser DOM.");
    if (/addEventListener\s*\(/.test(code)) facts.push("It listens for events.");
    if (/localStorage/.test(code)) facts.push("It saves or reads data from localStorage.");
    if (/canvas|getContext\s*\(/.test(code)) facts.push("It uses canvas drawing.");

    if (/innerHTML/.test(code)) {
      tips.push("If user input touches innerHTML, prefer textContent unless HTML is required.");
    }
    if (/fetch\s*\(/.test(code) && !/catch\s*\(/.test(code) && !/try\s*{/.test(code)) {
      tips.push("Add try/catch or .catch() around fetch.");
    }
    if (/document\.getElementById/.test(code) && !/DOMContentLoaded/.test(code)) {
      tips.push("Make sure DOM elements exist before selecting them.");
    }

    return [
      "Spudzy code explainer 💻",
      "",
      "Detected:",
      facts.length ? facts.map(x => "- " + x).join("\n") : "- I did not detect many recognizable structures.",
      "",
      "Improvement tips:",
      tips.length ? tips.map(x => "- " + x).join("\n") : "- The code looks structurally okay from quick static inspection.",
      "",
      "Plain English:",
      this.plainEnglishCodeSummary(code)
    ].join("\n");
  }

  handleFixCode(ctx) {
    const code = this.extractCode(ctx.raw);

    if (!code) {
      return "Spudzy debugger 🛠️ — Paste broken code after `fix this code`.";
    }

    const issues = [];

    this.checkPairs(code, "(", ")", "parentheses", issues);
    this.checkPairs(code, "{", "}", "curly braces", issues);
    this.checkPairs(code, "[", "]", "square brackets", issues);

    if (/fetch\s*\(/.test(code) && !/catch\s*\(/.test(code) && !/try\s*{/.test(code)) {
      issues.push("fetch is used without visible error handling.");
    }

    if (/innerHTML\s*=/.test(code)) {
      issues.push("innerHTML is used. If content comes from users, use textContent instead.");
    }

    if (/const\s+\w+\s*;/.test(code)) {
      issues.push("A const variable appears declared without a value.");
    }

    if (/function\s+\w*\s*\([^)]*$/.test(code)) {
      issues.push("A function declaration may be incomplete.");
    }

    if (!issues.length) {
      issues.push("No obvious pattern-based issue found. Check the browser console for the exact error line.");
    }

    return [
      "Spudzy debugger 🛠️",
      "",
      "Possible problems:",
      issues.map(x => "- " + x).join("\n"),
      "",
      "Debug checklist:",
      "1. Open DevTools Console.",
      "2. Read the first error, not the last.",
      "3. Check the exact file and line.",
      "4. Fix syntax errors before logic errors.",
      "5. Add console.log around suspicious values."
    ].join("\n");
  }

  extractCode(text) {
    const fenced = String(text).match(/```(?:js|javascript|html|css)?\s*([\s\S]*?)```/i);
    if (fenced) return fenced[1].trim();

    return String(text)
      .replace(/explain this code|explain code|fix this code|debug this|repair this code/gi, "")
      .trim();
  }

  checkPairs(code, open, close, name, issues) {
    const a = (code.match(new RegExp("\\" + open, "g")) || []).length;
    const b = (code.match(new RegExp("\\" + close, "g")) || []).length;

    if (a !== b) {
      issues.push(`Unbalanced ${name}: found ${a} opening and ${b} closing.`);
    }
  }

  plainEnglishCodeSummary(code) {
    const parts = [];

    if (/function|=>/.test(code)) parts.push("It contains functions that perform reusable actions.");
    if (/class\s+/.test(code)) parts.push("It organizes behavior into a class.");
    if (/document\./.test(code)) parts.push("It changes or reads elements on the webpage.");
    if (/fetch\s*\(/.test(code)) parts.push("It talks to an online API.");
    if (/localStorage/.test(code)) parts.push("It stores data in the browser.");
    if (/canvas|getContext/.test(code)) parts.push("It draws graphics.");
    if (/addEventListener/.test(code)) parts.push("It reacts to user actions.");

    return parts.length
      ? parts.join(" ")
      : "It appears to be code, but I need more context to explain it precisely.";
  }

  // ===========================================================================
  // SEARCH
  // ===========================================================================

  async handleSearch(ctx) {
    if (!this.cfg.enableSearch) {
      return "Spudzy search is disabled.";
    }

    const query = ctx.topic || ctx.corrected || ctx.raw;

    if (!query) {
      return "Spudzy search mode 🌐 — Tell me what to search for.";
    }

    const results = await this.searchInternet(query);

    if (!results.length) {
      return `Spudzy search mode 🌐 — I searched supported browser-friendly sources but found no useful results for "${query}".`;
    }

    return this.formatSearchResults(query, results);
  }

  async searchInternet(query) {
    const results = [];

    if (this.cfg.customSearchEndpoint) {
      results.push(...await this.searchCustomEndpoint(query));
    }

    results.push(...await this.searchWikipedia(query));
    results.push(...await this.searchGitHub(query));
    results.push(...await this.searchHackerNews(query));

    return results.filter(Boolean).slice(0, this.cfg.searchLimit);
  }

  async searchCustomEndpoint(query) {
    try {
      const res = await fetch(this.cfg.customSearchEndpoint + encodeURIComponent(query));
      if (!res.ok) return [];

      const data = await res.json();
      if (!Array.isArray(data.results)) return [];

      return data.results.map(item => ({
        source: item.source || "Custom Search",
        title: item.title || "Untitled",
        text: item.text || item.snippet || "",
        url: item.url || ""
      }));
    } catch {
      return [];
    }
  }

  async searchWikipedia(query) {
    try {
      const url =
        "https://en.wikipedia.org/w/api.php?action=query&origin=*&list=search&format=json&srlimit=3&srsearch=" +
        encodeURIComponent(query);

      const res = await fetch(url);
      if (!res.ok) return [];

      const data = await res.json();
      const hits = data?.query?.search || [];
      const out = [];

      for (const hit of hits) {
        const title = hit.title;
        const summaryUrl =
          "https://en.wikipedia.org/api/rest_v1/page/summary/" +
          encodeURIComponent(title);

        try {
          const summaryRes = await fetch(summaryUrl);
          if (!summaryRes.ok) throw new Error("summary failed");

          const summary = await summaryRes.json();

          out.push({
            source: "Wikipedia",
            title: summary.title || title,
            text: summary.extract || this.stripHTML(hit.snippet || ""),
            url: summary.content_urls?.desktop?.page || "https://en.wikipedia.org/wiki/" + encodeURIComponent(title)
          });
        } catch {
          out.push({
            source: "Wikipedia",
            title,
            text: this.stripHTML(hit.snippet || ""),
            url: "https://en.wikipedia.org/wiki/" + encodeURIComponent(title)
          });
        }
      }

      return out;
    } catch {
      return [];
    }
  }

  async searchGitHub(query) {
    try {
      const url =
        "https://api.github.com/search/repositories?q=" +
        encodeURIComponent(query) +
        "&sort=stars&order=desc&per_page=3";

      const res = await fetch(url);
      if (!res.ok) return [];

      const data = await res.json();

      return (data.items || []).map(repo => ({
        source: "GitHub",
        title: repo.full_name,
        text: repo.description || `Repository using ${repo.language || "unknown language"} with ${repo.stargazers_count || 0} stars.`,
        url: repo.html_url
      }));
    } catch {
      return [];
    }
  }

  async searchHackerNews(query) {
    try {
      const url =
        "https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=3&query=" +
        encodeURIComponent(query);

      const res = await fetch(url);
      if (!res.ok) return [];

      const data = await res.json();

      return (data.hits || []).map(hit => ({
        source: "Hacker News",
        title: hit.title || "Untitled HN Story",
        text: hit.story_text || hit.title || "",
        url: hit.url || "https://news.ycombinator.com/item?id=" + hit.objectID
      }));
    } catch {
      return [];
    }
  }

  formatSearchResults(query, results) {
    const combined = results.map(r => `${r.title}. ${r.text}`).join(" ");
    const summary = this.simpleSummary(combined, 4);

    let output = `Spudzy search mode 🌐 — I found ${results.length} result(s) for "${query}".\n\n`;
    output += `Summary:\n${summary}\n\n`;
    output += "Sources:\n";

    results.forEach((r, index) => {
      output += `\n${index + 1}. ${r.title}\n`;
      output += `   Source: ${r.source}\n`;
      output += `   Text: ${this.truncate(r.text, 260)}\n`;
      if (r.url) output += `   URL: ${r.url}\n`;
    });

    return output;
  }

  // ===========================================================================
  // MATH / MEMORY / OTHER MODES
  // ===========================================================================

  handleMath(ctx) {
    if (!this.cfg.enableMath) {
      return "Math is disabled.";
    }

    const matches = ctx.raw.match(/(?:\d+(?:\.\d+)?|\.\d+)(?:\s*[+\-*/x]\s*(?:\d+(?:\.\d+)?|\.\d+))+/g);

    if (!matches) {
      return "Spudzy math mode 🧮 — Give me an expression like 12 * 8 + 4.";
    }

    const results = matches.map(expr => `${expr} = ${this.safeMath(expr)}`);
    return "Spudzy math mode 🧮 — " + results.join("; ");
  }

  safeMath(expr) {
    const clean = String(expr).replace(/x/g, "*").replace(/\s+/g, "");

    if (!/^[0-9+\-*/().]+$/.test(clean)) {
      return "invalid";
    }

    try {
      const value = Function('"use strict"; return (' + clean + ')')();

      if (!Number.isFinite(value)) return "undefined";

      return Number.isInteger(value) ? value : Number(value.toFixed(8));
    } catch {
      return "invalid";
    }
  }

  handleMemory(ctx) {
    if (!this.cfg.enableMemory) {
      return "Memory is disabled.";
    }

    if (ctx.corrected.includes("remember")) {
      const text = ctx.raw.replace(/remember/ig, "").trim();

      if (!text) return "Tell Spudzy what to remember.";

      this.memory.push({
        text,
        time: new Date().toISOString()
      });

      while (this.memory.length > this.cfg.maxMemory) {
        this.memory.shift();
      }

      return `Spudzy remembered: ${text}`;
    }

    if (ctx.corrected.includes("forget")) {
      const text = ctx.raw.replace(/forget/ig, "").trim().toLowerCase();

      const before = this.memory.length;
      this.memory = this.memory.filter(item => !item.text.toLowerCase().includes(text));

      return `Spudzy forgot ${before - this.memory.length} matching item(s).`;
    }

    return "Memory mode ready. Say: remember I like purple dashboards.";
  }

  handleSummarize(ctx) {
    const text = ctx.raw.replace(/summarize|summary|tldr|recap/gi, "").trim();

    if (!text) {
      return "Spudzy summary mode — Paste text after `summarize`.";
    }

    return "Spudzy summary mode — " + this.simpleSummary(text, 3);
  }

  handleStory(ctx) {
    const subject = ctx.topic || "Spudzy";

    return [
      "Spudzy storyteller mode 📖",
      "",
      `Once upon a time, ${subject} became a tiny spark inside a JavaScript file.`,
      "Every function was a doorway. Every bug was a dragon. Every button was a portal.",
      "By the end, the little app learned that even browser code can feel magical when built with imagination."
    ].join("\n");
  }

  handleRoast(ctx) {
    const roasts = [
      "That prompt walked into the kitchen and forgot the recipe.",
      "Your idea has potential. It is currently hiding from it.",
      "Spudzy looked at that and almost opened DevTools out of concern.",
      "That sentence compiled, but emotionally it threw an error.",
      "You cooked. The smoke alarm disagreed."
    ];

    return "Spudzy roast mode 🥔🔥 — " + roasts[Math.floor(Math.random() * roasts.length)];
  }

  handleQuestion(ctx) {
    const kb = this.searchKB(ctx.corrected);

    if (kb) {
      return "Spudzy 🥔 — " + kb.a;
    }

    return [
      "Spudzy 🥔 — I can help with that.",
      "",
      "Try one of these:",
      "• make html for a dark neon portfolio with cards",
      "• create html for a minecraft like voxel sandbox page with falling blocks",
      "• make a calculator with luxury gold dark theme",
      "• fix this code: ...",
      "• explain this code: ...",
      "• search the internet for ..."
    ].join("\n");
  }

  handleChat(ctx) {
    const kb = this.searchKB(ctx.corrected);

    if (kb) {
      return "Spudzy 🥔 — " + kb.a;
    }

    const typoLine = ctx.typoChanges.length
      ? "\n\nTypo handling noticed: " + ctx.typoChanges.slice(0, 6).map(t => `${t.from}→${t.to}`).join(", ")
      : "";

    const remembered = this.memory
      .filter(item => this.similarity(ctx.corrected, item.text) > 0.15)
      .slice(0, 2);

    let reply = `Spudzy 🥔 — I processed your message. Main idea: ${this.keywords(ctx.tokens).join(", ") || "general chat"}.`;

    if (remembered.length) {
      reply += "\n\nRelevant memory:\n" + remembered.map(item => "- " + item.text).join("\n");
    }

    reply += typoLine;
    reply += "\n\nTry: `make html for a minecraft like voxel sandbox landing page with animated falling blocks`.";

    return reply;
  }

  // ===========================================================================
  // TEXT UTILITIES
  // ===========================================================================

  searchKB(text) {
    let best = null;

    for (const item of this.kb) {
      const score = this.similarity(text, item.q);

      if (!best || score > best.score) {
        best = { ...item, score };
      }
    }

    return best && best.score > 0.28 ? best : null;
  }

  simpleSummary(text, limit = 3) {
    const sentences = String(text)
      .replace(/\s+/g, " ")
      .split(/(?<=[.!?])\s+/)
      .map(x => x.trim())
      .filter(Boolean);

    if (sentences.length <= limit) {
      return sentences.join(" ");
    }

    return sentences
      .map(sentence => {
        const words = this.tokenize(sentence);
        const score = words.filter(w => w.length > 5).length + words.length * 0.05;
        return { sentence, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(x => x.sentence)
      .join(" ");
  }

  similarity(a, b) {
    const av = this.vectorize(a);
    const bv = this.vectorize(b);
    const keys = new Set([...Object.keys(av), ...Object.keys(bv)]);

    let dot = 0;
    let magA = 0;
    let magB = 0;

    for (const key of keys) {
      const x = av[key] || 0;
      const y = bv[key] || 0;

      dot += x * y;
      magA += x * x;
      magB += y * y;
    }

    if (!magA || !magB) return 0;

    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  vectorize(text) {
    const vector = {};
    const stop = this.stopWords();

    for (const token of this.tokenize(text)) {
      if (stop.has(token)) continue;
      vector[token] = (vector[token] || 0) + 1;
    }

    return vector;
  }

  keywords(tokens) {
    const stop = this.stopWords();
    const counts = {};

    for (const token of tokens) {
      if (stop.has(token)) continue;
      if (token.length < 3) continue;
      counts[token] = (counts[token] || 0) + 1;
    }

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  stopWords() {
    return new Set([
      "the", "a", "an", "and", "or", "but", "to", "of", "in", "on",
      "for", "with", "is", "are", "was", "were", "be", "been", "being",
      "i", "you", "me", "my", "your", "it", "that", "this", "as", "at",
      "so", "if", "then", "do", "does", "did", "can", "could", "would",
      "should", "will", "just", "like", "make", "create", "generate",
      "write", "html", "code", "page", "website", "web", "app"
    ]);
  }

  stripHTML(html) {
    return String(html || "").replace(/<[^>]+>/g, "");
  }

  truncate(text, max = 200) {
    text = String(text || "").trim();

    if (text.length <= max) return text;

    return text.slice(0, max).trim() + "...";
  }

  escapeHTML(text) {
    return String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

if (typeof window !== "undefined") {
  window.Spudzy = Spudzy;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = Spudzy;
}
