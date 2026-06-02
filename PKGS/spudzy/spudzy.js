// spudzy.js
// Spudzy AI Engine v4
// Browser-safe GitHub Pages AI-style assistant.
// Built for coding, HTML generation, canvas demos, search, code explain/fix, and chat.
//
// Important:
// This is not a neural network. A true LLM requires a backend/API.
// This file is a powerful browser-side AI-like coding engine.
// It is designed to work with your Spudzy Chef HTML UI.

class Spudzy {
  constructor(config = {}) {
    this.version = "4.0.0";

    this.cfg = {
      name: "Spudzy",
      defaultMode: "neutral",
      defaultPersona: "neutral",
      maxHistory: 80,
      maxMemory: 80,
      enableSearch: true,
      enableCode: true,
      enableMath: true,
      enableMemory: true,
      searchLimit: 6,
      customSearchEndpoint: null,
      ...config
    };

    this.history = [];
    this.memory = [];

    this.kb = [
      {
        q: "what is spudzy",
        a: "Spudzy is a browser-safe JavaScript AI-style coding assistant that can generate HTML, CSS, JavaScript, canvas demos, explain code, fix common code issues, do math, remember local notes, and search supported public sources."
      },
      {
        q: "can spudzy search the internet",
        a: "Spudzy can search browser-friendly public APIs such as Wikipedia, GitHub repositories, and Hacker News. Full Google/Bing scraping needs a backend because browsers cannot safely scrape search engines directly."
      },
      {
        q: "how do i make spudzy a real ai",
        a: "To connect Spudzy to a real AI model, use a backend server that calls an LLM API. Never put private API keys directly in frontend JavaScript."
      }
    ];

    this.designWords = {
      colors: {
        red: "#ef4444",
        orange: "#f97316",
        yellow: "#eab308",
        green: "#22c55e",
        blue: "#3b82f6",
        purple: "#8b5cf6",
        pink: "#ec4899",
        cyan: "#06b6d4",
        black: "#020617",
        white: "#f8fafc",
        gray: "#64748b",
        grey: "#64748b",
        gold: "#f59e0b",
        neon: "#22d3ee",
        lava: "#f97316",
        ocean: "#06b6d4",
        forest: "#22c55e",
        royal: "#7c3aed"
      },

      moods: {
        dark: "dark",
        light: "light",
        futuristic: "futuristic",
        modern: "modern",
        glass: "glass",
        glassy: "glass",
        neon: "neon",
        clean: "clean",
        minimal: "minimal",
        luxury: "luxury",
        cyberpunk: "cyberpunk",
        playful: "playful",
        cartoon: "playful",
        professional: "professional"
      },

      layouts: {
        landing: "landing",
        homepage: "landing",
        portfolio: "portfolio",
        dashboard: "dashboard",
        cards: "cards",
        grid: "grid",
        blog: "blog",
        shop: "shop",
        store: "shop",
        game: "game",
        calculator: "calculator",
        todo: "todo",
        chatbot: "chatbot",
        canvas: "canvas",
        animation: "canvas",
        navbar: "navbar",
        hero: "hero",
        gallery: "gallery",
        pricing: "pricing",
        form: "form"
      },

      effects: {
        glow: "glow",
        shadow: "shadow",
        animated: "animated",
        animation: "animated",
        bounce: "bounce",
        floating: "floating",
        gradient: "gradient",
        rounded: "rounded",
        blur: "blur",
        glassmorphism: "glass",
        responsive: "responsive"
      }
    };
  }

  async respond(message, options = {}) {
    const input = String(message ?? "").trim();

    if (!input) {
      return this.saveAndReturn(input, "Spudzy 🥔 — Say something first.", { intent: "empty" });
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

        case "fixCode":
          reply = this.handleFixCode(ctx);
          break;

        case "math":
          reply = this.handleMath(ctx);
          break;

        case "memory":
          reply = this.handleMemory(ctx);
          break;

        case "story":
          reply = this.handleStory(ctx);
          break;

        case "roast":
          reply = this.handleRoast(ctx);
          break;

        case "summarize":
          reply = this.handleSummarize(ctx);
          break;

        case "question":
          reply = this.handleQuestion(ctx);
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

  analyze(input, options = {}) {
    const lower = input.toLowerCase();
    const tokens = this.tokenize(input);

    return {
      raw: input,
      lower,
      tokens,
      options,
      mode: options.mode || options.persona || this.cfg.defaultMode,
      intent: this.detectIntent(lower, tokens),
      topic: this.extractTopic(input),
      design: this.parseDesignPrompt(input)
    };
  }

  tokenize(text) {
    return String(text)
      .toLowerCase()
      .replace(/[^a-z0-9_+\-*/=(){}[\].,!?'"<>:;/#\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
  }

  detectIntent(lower, tokens) {
    if (
      lower.includes("search the internet") ||
      lower.includes("search internet") ||
      lower.includes("look up") ||
      lower.includes("web search") ||
      lower.startsWith("search ") ||
      lower.includes("google ")
    ) {
      return "search";
    }

    if (
      lower.includes("explain this code") ||
      lower.includes("explain code") ||
      lower.includes("what does this code do") ||
      lower.includes("describe this code")
    ) {
      return "explainCode";
    }

    if (
      lower.includes("fix this code") ||
      lower.includes("debug this") ||
      lower.includes("repair this code") ||
      lower.includes("why is this code broken")
    ) {
      return "fixCode";
    }

    if (
      lower.includes("make html") ||
      lower.includes("generate html") ||
      lower.includes("write html") ||
      lower.includes("create html") ||
      lower.includes("canvas") ||
      lower.includes("website") ||
      lower.includes("web app") ||
      lower.includes("landing page") ||
      lower.includes("portfolio") ||
      lower.includes("dashboard") ||
      lower.includes("todo app") ||
      lower.includes("calculator") ||
      lower.includes("chatbot") ||
      lower.includes("generate code") ||
      lower.includes("write code") ||
      lower.includes("make code") ||
      lower.includes("javascript") ||
      lower.includes("css") ||
      lower.includes("js script") ||
      lower.includes("code me")
    ) {
      return "code";
    }

    if (
      /\d+\s*[+\-*/x]\s*\d+/.test(lower) ||
      lower.includes("calculate") ||
      lower.includes("math") ||
      lower.includes("solve")
    ) {
      return "math";
    }

    if (lower.includes("remember") || lower.includes("forget")) {
      return "memory";
    }

    if (
      lower.includes("summarize") ||
      lower.includes("summary") ||
      lower.includes("tldr") ||
      lower.includes("recap")
    ) {
      return "summarize";
    }

    if (lower.includes("story") || lower.includes("once upon")) {
      return "story";
    }

    if (lower.includes("roast")) {
      return "roast";
    }

    if (
      lower.includes("?") ||
      lower.startsWith("what ") ||
      lower.startsWith("why ") ||
      lower.startsWith("how ") ||
      lower.startsWith("who ") ||
      lower.startsWith("where ") ||
      lower.startsWith("when ")
    ) {
      return "question";
    }

    return "chat";
  }

  extractTopic(input) {
    let topic = String(input);

    const removals = [
      "search the internet for",
      "search internet for",
      "web search",
      "search for",
      "look up",
      "google",
      "make html",
      "generate html",
      "write html",
      "create html",
      "make code for",
      "generate code for",
      "write code for",
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
      topic = topic.replace(new RegExp(phrase, "ig"), "");
    }

    return topic.trim();
  }

  parseDesignPrompt(input) {
    const lower = input.toLowerCase();
    const tokens = this.tokenize(input);

    const found = {
      raw: input,
      tokens,
      colors: [],
      moods: [],
      layouts: [],
      effects: [],
      subject: "",
      title: "",
      primaryColor: "#8b5cf6",
      secondaryColor: "#06b6d4",
      background: "dark",
      components: new Set()
    };

    for (const token of tokens) {
      if (this.designWords.colors[token]) {
        found.colors.push(this.designWords.colors[token]);
      }

      if (this.designWords.moods[token]) {
        found.moods.push(this.designWords.moods[token]);
      }

      if (this.designWords.layouts[token]) {
        found.layouts.push(this.designWords.layouts[token]);
        found.components.add(this.designWords.layouts[token]);
      }

      if (this.designWords.effects[token]) {
        found.effects.push(this.designWords.effects[token]);
      }
    }

    if (found.colors.length > 0) {
      found.primaryColor = found.colors[0];
    }

    if (found.colors.length > 1) {
      found.secondaryColor = found.colors[1];
    }

    if (found.moods.includes("light")) {
      found.background = "light";
    }

    if (found.moods.includes("dark")) {
      found.background = "dark";
    }

    if (found.moods.includes("cyberpunk")) {
      found.primaryColor = "#ec4899";
      found.secondaryColor = "#22d3ee";
      found.background = "dark";
    }

    if (found.moods.includes("luxury")) {
      found.primaryColor = "#f59e0b";
      found.secondaryColor = "#f8fafc";
      found.background = "dark";
    }

    if (lower.includes("bouncing ball") || lower.includes("bounce ball")) {
      found.components.add("bouncingBall");
      found.components.add("canvas");
    }

    if (lower.includes("snake game")) {
      found.components.add("snake");
      found.components.add("canvas");
    }

    if (lower.includes("particle") || lower.includes("particles")) {
      found.components.add("particles");
      found.components.add("canvas");
    }

    if (lower.includes("clock")) {
      found.components.add("clock");
    }

    if (lower.includes("weather")) {
      found.components.add("weather");
    }

    if (lower.includes("login")) {
      found.components.add("login");
      found.components.add("form");
    }

    if (lower.includes("signup") || lower.includes("sign up")) {
      found.components.add("signup");
      found.components.add("form");
    }

    if (lower.includes("button")) {
      found.components.add("button");
    }

    if (lower.includes("card")) {
      found.components.add("cards");
    }

    if (lower.includes("pricing")) {
      found.components.add("pricing");
    }

    found.subject = this.extractSubject(input);
    found.title = this.titleFromPrompt(input);

    return found;
  }

  extractSubject(input) {
    const cleaned = String(input)
      .replace(/make|create|generate|write|html|website|web app|page|with|using|for|a|an|the/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    return cleaned || "Spudzy App";
  }

  titleFromPrompt(input) {
    const subject = this.extractSubject(input);
    const words = subject.split(/\s+/).filter(Boolean).slice(0, 5);

    if (!words.length) return "Spudzy App";

    return words
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  handleCode(ctx) {
    if (!this.cfg.enableCode) {
      return "Spudzy code mode is disabled.";
    }

    const lower = ctx.lower;
    const design = ctx.design;

    if (design.components.has("canvas") || lower.includes("canvas")) {
      return this.generateCanvasHTML(design);
    }

    if (design.components.has("todo") || lower.includes("todo")) {
      return this.generateTodoHTML(design);
    }

    if (design.components.has("calculator") || lower.includes("calculator")) {
      return this.generateCalculatorHTML(design);
    }

    if (design.components.has("chatbot") || lower.includes("chatbot")) {
      return this.generateChatbotHTML(design);
    }

    if (lower.includes("css only") || lower.includes("just css")) {
      return this.generateCSSTheme(design);
    }

    if (lower.includes("button") && !lower.includes("html")) {
      return this.generateButtonJS(design);
    }

    return this.generateSmartHTML(design);
  }

  generateSmartHTML(design) {
    const hasNavbar = design.components.has("navbar") || design.layouts.includes("landing") || design.layouts.includes("portfolio");
    const hasHero = design.components.has("hero") || design.layouts.includes("landing") || design.layouts.length === 0;
    const hasCards = design.components.has("cards") || design.components.has("grid") || design.layouts.includes("dashboard");
    const hasGallery = design.components.has("gallery");
    const hasPricing = design.components.has("pricing");
    const hasForm = design.components.has("form") || design.components.has("login") || design.components.has("signup");
    const hasButton = design.components.has("button") || hasHero;
    const theme = this.themeFromDesign(design);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${this.escapeHTML(design.title)}</title>
  <style>
    :root {
      --bg: ${theme.bg};
      --panel: ${theme.panel};
      --panel2: ${theme.panel2};
      --text: ${theme.text};
      --muted: ${theme.muted};
      --border: ${theme.border};
      --primary: ${design.primaryColor};
      --secondary: ${design.secondaryColor};
      --shadow: ${theme.shadow};
      --radius: ${design.effects.includes("rounded") ? "30px" : "22px"};
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
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at top left, color-mix(in srgb, var(--primary) 35%, transparent), transparent 30%),
        radial-gradient(circle at bottom right, color-mix(in srgb, var(--secondary) 30%, transparent), transparent 30%),
        var(--bg);
      color: var(--text);
      overflow-x: hidden;
    }

    .page {
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
      padding: 24px 0 56px;
    }

    .nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 14px 18px;
      border: 1px solid var(--border);
      background: var(--panel);
      backdrop-filter: blur(18px);
      border-radius: 999px;
      box-shadow: var(--shadow);
      position: sticky;
      top: 16px;
      z-index: 10;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 900;
      letter-spacing: -0.04em;
    }

    .logo {
      width: 34px;
      height: 34px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      box-shadow: 0 0 30px color-mix(in srgb, var(--primary) 45%, transparent);
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--muted);
      font-size: 0.92rem;
    }

    .nav-links a {
      color: inherit;
      text-decoration: none;
    }

    .hero {
      min-height: 520px;
      display: grid;
      grid-template-columns: 1.05fr 0.95fr;
      align-items: center;
      gap: 32px;
      padding: 56px 0 34px;
    }

    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 12px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: var(--panel);
      color: var(--muted);
      font-size: 0.86rem;
      margin-bottom: 16px;
    }

    h1 {
      font-size: clamp(3rem, 9vw, 6.8rem);
      line-height: 0.92;
      letter-spacing: -0.09em;
      max-width: 760px;
    }

    .gradient-text {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    .hero p {
      max-width: 620px;
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
      border-radius: 999px;
      padding: 14px 20px;
      color: white;
      font-weight: 850;
      cursor: pointer;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      box-shadow: 0 18px 45px color-mix(in srgb, var(--primary) 38%, transparent);
      transition: transform 0.18s ease, box-shadow 0.18s ease;
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 24px 60px color-mix(in srgb, var(--primary) 50%, transparent);
    }

    .btn.secondary {
      background: var(--panel);
      color: var(--text);
      border: 1px solid var(--border);
      box-shadow: none;
    }

    .visual {
      min-height: 420px;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background:
        linear-gradient(135deg, color-mix(in srgb, var(--primary) 22%, transparent), transparent),
        var(--panel);
      box-shadow: var(--shadow);
      position: relative;
      overflow: hidden;
      display: grid;
      place-items: center;
    }

    .orb {
      width: 210px;
      height: 210px;
      border-radius: 999px;
      background: radial-gradient(circle at 30% 25%, white, var(--secondary) 18%, var(--primary) 68%, transparent 70%);
      filter: drop-shadow(0 0 50px color-mix(in srgb, var(--primary) 50%, transparent));
      animation: float 4s ease-in-out infinite;
    }

    .ring {
      position: absolute;
      width: 340px;
      height: 340px;
      border-radius: 999px;
      border: 1px solid color-mix(in srgb, var(--secondary) 40%, transparent);
      animation: spin 14s linear infinite;
    }

    .ring::before {
      content: "";
      position: absolute;
      width: 18px;
      height: 18px;
      border-radius: 999px;
      background: var(--secondary);
      top: 50px;
      right: 52px;
      box-shadow: 0 0 28px var(--secondary);
    }

    .section {
      padding: 34px 0;
    }

    .section-title {
      font-size: clamp(2rem, 5vw, 3.4rem);
      letter-spacing: -0.06em;
      margin-bottom: 16px;
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
    }

    .card h3 {
      font-size: 1.2rem;
      margin-bottom: 10px;
    }

    .card p {
      color: var(--muted);
      line-height: 1.65;
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
      background:
        linear-gradient(135deg, color-mix(in srgb, var(--primary) 30%, transparent), color-mix(in srgb, var(--secondary) 18%, transparent)),
        var(--panel2);
      display: grid;
      place-items: center;
      font-size: 3rem;
      box-shadow: var(--shadow);
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
      max-width: 520px;
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
      border-radius: 16px;
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

    ${design.effects.includes("animated") || design.effects.includes("bounce") ? `
    .card {
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .card:hover {
      transform: translateY(-6px);
      border-color: color-mix(in srgb, var(--primary) 60%, var(--border));
    }
    ` : ""}

    @media (max-width: 860px) {
      .hero {
        grid-template-columns: 1fr;
      }

      .grid,
      .pricing,
      .gallery {
        grid-template-columns: 1fr;
      }

      .nav {
        align-items: flex-start;
        border-radius: 24px;
        flex-direction: column;
      }

      .nav-links {
        flex-wrap: wrap;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    ${hasNavbar ? `
    <nav class="nav">
      <div class="brand">
        <div class="logo">⚡</div>
        <span>${this.escapeHTML(design.title)}</span>
      </div>
      <div class="nav-links">
        <a href="#features">Features</a>
        ${hasGallery ? `<a href="#gallery">Gallery</a>` : ""}
        ${hasPricing ? `<a href="#pricing">Pricing</a>` : ""}
        ${hasForm ? `<a href="#contact">Contact</a>` : ""}
      </div>
    </nav>
    ` : ""}

    ${hasHero ? `
    <section class="hero">
      <div>
        <div class="eyebrow">✨ Generated from your words by Spudzy</div>
        <h1>${this.escapeHTML(design.title)} <span class="gradient-text">built different.</span></h1>
        <p>
          This page was generated from your prompt. Spudzy reads design words like color,
          style, layout, animation, cards, gallery, pricing, forms, and buttons, then turns
          them into a full responsive HTML experience.
        </p>
        ${hasButton ? `
        <div class="actions">
          <button class="btn" id="mainBtn">Launch demo</button>
          <button class="btn secondary" id="secondaryBtn">Random accent</button>
        </div>
        ` : ""}
      </div>

      <div class="visual">
        <div class="ring"></div>
        <div class="orb"></div>
      </div>
    </section>
    ` : ""}

    ${hasCards ? `
    <section class="section" id="features">
      <h2 class="section-title">Feature cards</h2>
      <p class="section-lead">
        These cards were added because your prompt asked for layout, cards, dashboard,
        grid, or a modern app-style interface.
      </p>

      <div class="grid">
        <article class="card">
          <h3>Smart layout</h3>
          <p>Responsive sections, flexible grids, and polished spacing are generated automatically.</p>
        </article>
        <article class="card">
          <h3>Prompt styling</h3>
          <p>Words like dark, neon, luxury, blue, red, glass, and modern change the theme.</p>
        </article>
        <article class="card">
          <h3>Interactive code</h3>
          <p>Buttons, animations, and small JavaScript behaviors are included when useful.</p>
        </article>
      </div>
    </section>
    ` : ""}

    ${hasGallery ? `
    <section class="section" id="gallery">
      <h2 class="section-title">Gallery</h2>
      <p class="section-lead">A visual gallery generated because your prompt included gallery or visual-style words.</p>
      <div class="gallery">
        <div class="gallery-tile">🎨</div>
        <div class="gallery-tile">🚀</div>
      </div>
    </section>
    ` : ""}

    ${hasPricing ? `
    <section class="section" id="pricing">
      <h2 class="section-title">Pricing</h2>
      <p class="section-lead">Pricing cards are included because your prompt asked for pricing.</p>
      <div class="pricing">
        <div class="card">
          <h3>Starter</h3>
          <div class="price">$9</div>
          <p>Simple launch package.</p>
        </div>
        <div class="card">
          <h3>Pro</h3>
          <div class="price">$29</div>
          <p>More power, more polish.</p>
        </div>
        <div class="card">
          <h3>Ultra</h3>
          <div class="price">$99</div>
          <p>Full premium experience.</p>
        </div>
      </div>
    </section>
    ` : ""}

    ${hasForm ? `
    <section class="section" id="contact">
      <h2 class="section-title">${design.components.has("login") ? "Login" : design.components.has("signup") ? "Sign up" : "Contact form"}</h2>
      <div class="form-box">
        <input id="nameInput" placeholder="Name" />
        <input id="emailInput" placeholder="Email" />
        <textarea id="messageInput" placeholder="Message"></textarea>
        <button class="btn" id="formBtn" style="margin-top: 12px;">Submit</button>
        <div class="output" id="formOutput"></div>
      </div>
    </section>
    ` : ""}

    <footer>
      Built by Spudzy AI Engine v${this.version}. Prompt subject: ${this.escapeHTML(design.subject)}.
    </footer>
  </div>

  <script>
    const root = document.documentElement;

    const mainBtn = document.getElementById("mainBtn");
    const secondaryBtn = document.getElementById("secondaryBtn");
    const formBtn = document.getElementById("formBtn");
    const formOutput = document.getElementById("formOutput");

    if (mainBtn) {
      mainBtn.addEventListener("click", () => {
        mainBtn.textContent = "Launched ✨";
        document.body.animate(
          [
            { filter: "brightness(1)" },
            { filter: "brightness(1.25)" },
            { filter: "brightness(1)" }
          ],
          { duration: 550 }
        );
      });
    }

    if (secondaryBtn) {
      const colors = ["#8b5cf6", "#06b6d4", "#ef4444", "#22c55e", "#f97316", "#ec4899"];

      secondaryBtn.addEventListener("click", () => {
        const one = colors[Math.floor(Math.random() * colors.length)];
        const two = colors[Math.floor(Math.random() * colors.length)];
        root.style.setProperty("--primary", one);
        root.style.setProperty("--secondary", two);
      });
    }

    if (formBtn && formOutput) {
      formBtn.addEventListener("click", () => {
        formOutput.textContent = "Submitted locally. This demo has no backend yet.";
      });
    }
  </script>
</body>
</html>`;
  }

  themeFromDesign(design) {
    if (design.background === "light") {
      return {
        bg: "#f8fafc",
        panel: "rgba(255, 255, 255, 0.75)",
        panel2: "rgba(255, 255, 255, 0.55)",
        text: "#020617",
        muted: "#475569",
        border: "rgba(15, 23, 42, 0.12)",
        shadow: "0 24px 80px rgba(15, 23, 42, 0.12)"
      };
    }

    return {
      bg: "#020617",
      panel: "rgba(15, 23, 42, 0.72)",
      panel2: "rgba(2, 6, 23, 0.58)",
      text: "#f8fafc",
      muted: "#94a3b8",
      border: "rgba(148, 163, 184, 0.18)",
      shadow: "0 24px 80px rgba(0, 0, 0, 0.35)"
    };
  }

  generateCanvasHTML(design) {
    const theme = this.themeFromDesign(design);
    const type = design.components.has("particles")
      ? "particles"
      : design.components.has("snake")
      ? "snake"
      : "ball";

    if (type === "particles") {
      return this.generateParticlesCanvasHTML(design, theme);
    }

    if (type === "snake") {
      return this.generateSnakeCanvasHTML(design, theme);
    }

    return this.generateBouncingBallHTML(design, theme);
  }

  generateBouncingBallHTML(design, theme) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${this.escapeHTML(design.title)} Canvas</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      min-height: 100vh;
      display: grid;
      place-items: center;
      background:
        radial-gradient(circle at top left, ${design.primaryColor}55, transparent 30%),
        radial-gradient(circle at bottom right, ${design.secondaryColor}44, transparent 30%),
        ${theme.bg};
      color: ${theme.text};
      font-family: system-ui, sans-serif;
      padding: 20px;
    }

    .app {
      width: min(900px, 100%);
      border: 1px solid ${theme.border};
      border-radius: 28px;
      overflow: hidden;
      background: ${theme.panel};
      box-shadow: ${theme.shadow};
      backdrop-filter: blur(16px);
    }

    header {
      padding: 18px 20px;
      border-bottom: 1px solid ${theme.border};
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
    }

    h1 {
      font-size: clamp(1.6rem, 5vw, 3rem);
      letter-spacing: -0.06em;
    }

    button {
      border: 0;
      border-radius: 999px;
      padding: 10px 14px;
      color: white;
      font-weight: 800;
      background: linear-gradient(135deg, ${design.primaryColor}, ${design.secondaryColor});
      cursor: pointer;
    }

    canvas {
      width: 100%;
      height: 480px;
      display: block;
      background: #020617;
    }
  </style>
</head>
<body>
  <main class="app">
    <header>
      <h1>${this.escapeHTML(design.title || "Bouncing Ball")}</h1>
      <button id="boost">Boost</button>
    </header>
    <canvas id="canvas"></canvas>
  </main>

  <script>
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const boost = document.getElementById("boost");

    let w = 0;
    let h = 0;
    let dpr = Math.max(1, window.devicePixelRatio || 1);

    const ball = {
      x: 120,
      y: 120,
      r: 28,
      vx: 4,
      vy: 3.2,
      hue: 0
    };

    function resize() {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawBackground() {
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, "#020617");
      gradient.addColorStop(1, "#111827");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
      for (let x = 0; x < w; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      for (let y = 0; y < h; y += 36) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }

    function drawBall() {
      const glow = ctx.createRadialGradient(ball.x - 10, ball.y - 12, 2, ball.x, ball.y, ball.r * 2.4);
      glow.addColorStop(0, "white");
      glow.addColorStop(0.25, "${design.secondaryColor}");
      glow.addColorStop(0.75, "${design.primaryColor}");
      glow.addColorStop(1, "transparent");

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r * 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "${design.primaryColor}";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.beginPath();
      ctx.arc(ball.x - 9, ball.y - 10, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    function update() {
      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.x + ball.r > w || ball.x - ball.r < 0) {
        ball.vx *= -1;
      }

      if (ball.y + ball.r > h || ball.y - ball.r < 0) {
        ball.vy *= -1;
      }
    }

    function loop() {
      drawBackground();
      update();
      drawBall();
      requestAnimationFrame(loop);
    }

    boost.addEventListener("click", () => {
      ball.vx *= 1.18;
      ball.vy *= 1.18;
      boost.textContent = "Boosted";
      setTimeout(() => boost.textContent = "Boost", 700);
    });

    window.addEventListener("resize", resize);
    resize();
    loop();
  </script>
</body>
</html>`;
  }

  generateParticlesCanvasHTML(design, theme) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${this.escapeHTML(design.title)} Particles</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      min-height: 100vh;
      background: #020617;
      color: #f8fafc;
      font-family: system-ui, sans-serif;
      overflow: hidden;
    }

    canvas {
      width: 100vw;
      height: 100vh;
      display: block;
    }

    .label {
      position: fixed;
      top: 24px;
      left: 24px;
      padding: 14px 16px;
      border-radius: 18px;
      background: rgba(15, 23, 42, 0.72);
      border: 1px solid rgba(148, 163, 184, 0.18);
      backdrop-filter: blur(16px);
    }

    h1 {
      font-size: clamp(1.4rem, 5vw, 3rem);
      letter-spacing: -0.06em;
    }

    p {
      color: #94a3b8;
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <div class="label">
    <h1>${this.escapeHTML(design.title)}</h1>
    <p>Move your mouse. Particles follow.</p>
  </div>

  <script>
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    let w = 0;
    let h = 0;
    let dpr = Math.max(1, window.devicePixelRatio || 1);

    const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
    const particles = [];

    function resize() {
      w = innerWidth;
      h = innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function createParticles() {
      particles.length = 0;
      const count = Math.min(160, Math.floor((w * h) / 9000));

      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 1.4,
          vy: (Math.random() - 0.5) * 1.4,
          r: Math.random() * 2.2 + 1
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, "#020617");
      gradient.addColorStop(1, "#0f172a");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      for (const p of particles) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        if (dist < 180) {
          p.vx += dx / dist * 0.025;
          p.vy += dy / dist * 0.025;
        }

        p.x += p.vx;
        p.y += p.vy;

        p.vx *= 0.985;
        p.vy *= 0.985;

        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx.fillStyle = "${design.primaryColor}";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = "rgba(148, 163, 184, 0.13)";

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 95) {
            ctx.globalAlpha = 1 - dist / 95;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      requestAnimationFrame(draw);
    }

    addEventListener("mousemove", event => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    });

    addEventListener("resize", () => {
      resize();
      createParticles();
    });

    resize();
    createParticles();
    draw();
  </script>
</body>
</html>`;
  }

  generateSnakeCanvasHTML(design, theme) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${this.escapeHTML(design.title)} Snake</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #020617;
      color: #f8fafc;
      font-family: system-ui, sans-serif;
      padding: 20px;
    }

    .app {
      width: min(560px, 100%);
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 26px;
      overflow: hidden;
      box-shadow: 0 24px 80px rgba(0,0,0,0.4);
    }

    header {
      padding: 16px;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid rgba(148, 163, 184, 0.2);
    }

    canvas {
      width: 100%;
      aspect-ratio: 1;
      background: #020617;
      display: block;
    }

    button {
      border: 0;
      border-radius: 999px;
      padding: 8px 12px;
      color: white;
      font-weight: 800;
      background: linear-gradient(135deg, ${design.primaryColor}, ${design.secondaryColor});
      cursor: pointer;
    }
  </style>
</head>
<body>
  <main class="app">
    <header>
      <strong>${this.escapeHTML(design.title || "Snake Game")}</strong>
      <span>Score: <span id="score">0</span></span>
      <button id="restart">Restart</button>
    </header>
    <canvas id="canvas" width="480" height="480"></canvas>
  </main>

  <script>
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const scoreEl = document.getElementById("score");
    const restart = document.getElementById("restart");

    const size = 24;
    const cells = canvas.width / size;

    let snake;
    let food;
    let dir;
    let nextDir;
    let score;
    let alive;

    function reset() {
      snake = [{ x: 10, y: 10 }];
      food = randomFood();
      dir = { x: 1, y: 0 };
      nextDir = { x: 1, y: 0 };
      score = 0;
      alive = true;
      scoreEl.textContent = score;
    }

    function randomFood() {
      return {
        x: Math.floor(Math.random() * cells),
        y: Math.floor(Math.random() * cells)
      };
    }

    function tick() {
      if (!alive) return;

      dir = nextDir;

      const head = {
        x: snake[0].x + dir.x,
        y: snake[0].y + dir.y
      };

      if (
        head.x < 0 ||
        head.y < 0 ||
        head.x >= cells ||
        head.y >= cells ||
        snake.some(part => part.x === head.x && part.y === head.y)
      ) {
        alive = false;
        draw();
        return;
      }

      snake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        score++;
        scoreEl.textContent = score;
        food = randomFood();
      } else {
        snake.pop();
      }

      draw();
    }

    function draw() {
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "rgba(148,163,184,0.08)";
      for (let i = 0; i <= cells; i++) {
        ctx.beginPath();
        ctx.moveTo(i * size, 0);
        ctx.lineTo(i * size, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * size);
        ctx.lineTo(canvas.width, i * size);
        ctx.stroke();
      }

      ctx.fillStyle = "${design.secondaryColor}";
      ctx.fillRect(food.x * size + 4, food.y * size + 4, size - 8, size - 8);

      ctx.fillStyle = "${design.primaryColor}";
      for (const part of snake) {
        ctx.fillRect(part.x * size + 3, part.y * size + 3, size - 6, size - 6);
      }

      if (!alive) {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "bold 42px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
      }
    }

    addEventListener("keydown", event => {
      if (event.key === "ArrowUp" && dir.y !== 1) nextDir = { x: 0, y: -1 };
      if (event.key === "ArrowDown" && dir.y !== -1) nextDir = { x: 0, y: 1 };
      if (event.key === "ArrowLeft" && dir.x !== 1) nextDir = { x: -1, y: 0 };
      if (event.key === "ArrowRight" && dir.x !== -1) nextDir = { x: 1, y: 0 };
    });

    restart.addEventListener("click", reset);

    reset();
    draw();
    setInterval(tick, 120);
  </script>
</body>
</html>`;
  }

  generateTodoHTML(design) {
    const theme = this.themeFromDesign(design);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${this.escapeHTML(design.title || "Todo App")}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background:
        radial-gradient(circle at top left, ${design.primaryColor}55, transparent 32%),
        ${theme.bg};
      color: ${theme.text};
      font-family: system-ui, sans-serif;
      padding: 20px;
    }

    .todo {
      width: min(560px, 100%);
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
      margin: 0 0 16px;
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
      background: linear-gradient(135deg, ${design.primaryColor}, ${design.secondaryColor});
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
    <h1>${this.escapeHTML(design.title || "Todo App")}</h1>
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

    let tasks = JSON.parse(localStorage.getItem("spudzy_todos") || "[]");

    function save() {
      localStorage.setItem("spudzy_todos", JSON.stringify(tasks));
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

  generateCalculatorHTML(design) {
    const theme = this.themeFromDesign(design);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${this.escapeHTML(design.title || "Calculator")}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background:
        radial-gradient(circle at top, ${design.primaryColor}44, transparent 35%),
        ${theme.bg};
      color: ${theme.text};
      font-family: system-ui, sans-serif;
      padding: 20px;
    }

    .calc {
      width: min(380px, 100%);
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
      background: linear-gradient(135deg, ${design.primaryColor}, ${design.secondaryColor});
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
      if (key === "C") {
        expr = "";
      } else if (key === "Backspace") {
        expr = expr.slice(0, -1);
      } else if (key === "=") {
        expr = safeEval(expr);
      } else {
        expr += key;
      }

      update();
    }

    buttons.forEach(button => {
      button.addEventListener("click", () => press(button.dataset.key));
    });

    addEventListener("keydown", event => {
      const allowed = "0123456789+-*/.=";

      if (allowed.includes(event.key)) {
        press(event.key === "Enter" ? "=" : event.key);
      }

      if (event.key === "Backspace") {
        press("Backspace");
      }

      if (event.key === "Escape") {
        press("C");
      }
    });
  </script>
</body>
</html>`;
  }

  generateChatbotHTML(design) {
    const theme = this.themeFromDesign(design);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${this.escapeHTML(design.title || "Mini Chatbot")}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background:
        radial-gradient(circle at top left, ${design.primaryColor}44, transparent 32%),
        ${theme.bg};
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
      background: linear-gradient(135deg, ${design.primaryColor}, ${design.secondaryColor});
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
      background: linear-gradient(135deg, ${design.primaryColor}, ${design.secondaryColor});
      font-weight: 800;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <main class="chat">
    <header>${this.escapeHTML(design.title || "Mini Chatbot")}</header>
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
      "I am a small local chatbot demo.",
      "No backend needed for this example.",
      "Spudzy generated this interface."
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

  generateCSSTheme(design) {
    const theme = this.themeFromDesign(design);

    return `:root {
  --bg: ${theme.bg};
  --panel: ${theme.panel};
  --panel2: ${theme.panel2};
  --text: ${theme.text};
  --muted: ${theme.muted};
  --border: ${theme.border};
  --primary: ${design.primaryColor};
  --secondary: ${design.secondaryColor};
  --radius: 24px;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--primary) 35%, transparent), transparent 32%),
    radial-gradient(circle at bottom right, color-mix(in srgb, var(--secondary) 30%, transparent), transparent 32%),
    var(--bg);
  color: var(--text);
  font-family: system-ui, sans-serif;
}

.card {
  background: var(--panel);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  backdrop-filter: blur(16px);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.25);
}

button {
  border: 0;
  border-radius: 999px;
  padding: 12px 18px;
  color: white;
  font-weight: 800;
  cursor: pointer;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
}`;
  }

  generateButtonJS(design) {
    return `document.addEventListener("DOMContentLoaded", () => {
  const button = document.createElement("button");

  button.textContent = "Spudzy Button";
  button.style.border = "0";
  button.style.borderRadius = "999px";
  button.style.padding = "14px 22px";
  button.style.color = "white";
  button.style.fontWeight = "800";
  button.style.cursor = "pointer";
  button.style.background = "linear-gradient(135deg, ${design.primaryColor}, ${design.secondaryColor})";
  button.style.boxShadow = "0 18px 45px rgba(0,0,0,0.25)";

  button.addEventListener("click", () => {
    alert("🥔 Spudzy says hi!");
  });

  document.body.appendChild(button);
});`;
  }

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
    if (/innerHTML/.test(code)) tips.push("If user input touches innerHTML, prefer textContent to reduce injection risk.");
    if (/fetch\s*\(/.test(code) && !/catch\s*\(/.test(code) && !/try\s*{/.test(code)) tips.push("Add try/catch or .catch() around fetch.");
    if (/document\.getElementById/.test(code) && !/DOMContentLoaded/.test(code)) tips.push("Make sure DOM elements exist before selecting them.");

    return [
      "Spudzy code explainer 💻",
      "",
      "Detected:",
      facts.length ? facts.map(x => "- " + x).join("\n") : "- I did not detect many recognizable structures.",
      "",
      "What to improve:",
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

    const pairs = [
      ["(", ")"],
      ["{", "}"],
      ["[", "]"]
    ];

    for (const [open, close] of pairs) {
      const a = (code.match(new RegExp("\\" + open, "g")) || []).length;
      const b = (code.match(new RegExp("\\" + close, "g")) || []).length;

      if (a !== b) {
        issues.push(`Unbalanced ${open}${close}: found ${a} opening and ${b} closing.`);
      }
    }

    if (/fetch\s*\(/.test(code) && !/catch\s*\(/.test(code) && !/try\s*{/.test(code)) {
      issues.push("fetch is used without visible error handling.");
    }

    if (/innerHTML\s*=/.test(code)) {
      issues.push("innerHTML is used. If content comes from users, use textContent instead.");
    }

    if (/document\.getElementById\s*\(["'][^"']+["']\)/.test(code) && !/DOMContentLoaded/.test(code) && !/<script[\s\S]*<\/script>/i.test(code)) {
      issues.push("DOM elements may be selected before the page loads.");
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

  plainEnglishCodeSummary(code) {
    const parts = [];

    if (/function|=>/.test(code)) parts.push("It contains functions that perform reusable actions.");
    if (/class\s+/.test(code)) parts.push("It organizes behavior into a class.");
    if (/document\./.test(code)) parts.push("It changes or reads elements on the webpage.");
    if (/fetch\s*\(/.test(code)) parts.push("It talks to an online API.");
    if (/localStorage/.test(code)) parts.push("It stores data in the browser.");
    if (/canvas|getContext/.test(code)) parts.push("It draws graphics.");
    if (/addEventListener/.test(code)) parts.push("It reacts to user actions.");

    return parts.length ? parts.join(" ") : "It appears to be code, but I need more context to explain it precisely.";
  }

  async handleSearch(ctx) {
    if (!this.cfg.enableSearch) {
      return "Spudzy search is disabled.";
    }

    const query = ctx.topic || ctx.raw;

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

    return results
      .filter(Boolean)
      .slice(0, this.cfg.searchLimit);
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

    if (ctx.lower.includes("remember")) {
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

    if (ctx.lower.includes("forget")) {
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
      "By the end, the little app learned that even browser code can feel magical when it is built with imagination."
    ].join("\n");
  }

  handleRoast(ctx) {
    const roasts = [
      "That idea walked into the kitchen and forgot the recipe.",
      "Your prompt has potential. It is currently hiding from it.",
      "Spudzy looked at that and almost opened DevTools out of concern.",
      "That sentence compiled, but emotionally it threw an error.",
      "You cooked. The smoke alarm disagreed."
    ];

    return "Spudzy roast mode 🥔🔥 — " + roasts[Math.floor(Math.random() * roasts.length)];
  }

  handleQuestion(ctx) {
    const kb = this.searchKB(ctx.raw);

    if (kb) {
      return "Spudzy 🥔 — " + kb.a;
    }

    return [
      "Spudzy 🥔 — I can help with that.",
      "",
      "If you want the strongest result, ask me in one of these forms:",
      "• make html for a dark neon portfolio with cards",
      "• create a canvas bouncing ball animation",
      "• fix this code: ...",
      "• explain this code: ...",
      "• search the internet for ..."
    ].join("\n");
  }

  handleChat(ctx) {
    const kb = this.searchKB(ctx.raw);

    if (kb) {
      return "Spudzy 🥔 — " + kb.a;
    }

    const remembered = this.memory
      .filter(item => this.similarity(ctx.raw, item.text) > 0.15)
      .slice(0, 2);

    let reply = `Spudzy 🥔 — I processed your message. Main idea: ${this.keywords(ctx.tokens).join(", ") || "general chat"}.`;

    if (remembered.length) {
      reply += "\n\nRelevant memory:\n" + remembered.map(item => "- " + item.text).join("\n");
    }

    reply += "\n\nTry: `make html for a dark neon landing page with cards and a form`.";

    return reply;
  }

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
      .slice(0, 8)
      .map(([word]) => word);
  }

  stopWords() {
    return new Set([
      "the", "a", "an", "and", "or", "but", "to", "of", "in", "on",
      "for", "with", "is", "are", "was", "were", "be", "been", "being",
      "i", "you", "me", "my", "your", "it", "that", "this", "as", "at",
      "so", "if", "then", "do", "does", "did", "can", "could", "would",
      "should", "will", "just", "like", "make", "create", "generate",
      "write", "html", "code", "page", "website"
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
}

if (typeof window !== "undefined") {
  window.Spudzy = Spudzy;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = Spudzy;
}
