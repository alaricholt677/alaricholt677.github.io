// spudzy.js// spud Pages compatible assistant.
// Features:
// - Chat
// - Better code generation
// - Code explanation
// - Code repair suggestions
// - Math
// - Memory
// - Wikipedia search
// - GitHub repo/code-topic search
// - Hacker News search
// - Optional custom search API hook
//
// NOTE:
// Browser-only JavaScript cannot safely scrape Google/Bing directly.
// For real full-web search, connect customSearchEndpoint to your own backend.

class Spudzy {
  constructor(config = {}) {
    this.version = "3.0.0";

    this.cfg = {
      name: "Spudzy",
      defaultMode: "smart",
      maxHistory: 40,
      maxMemory: 50,

      enableMath: true,
      enableCode: true,
      enableSearch: true,
      enableMemory: true,

      searchLimit: 5,

      // Optional backend endpoint.
      // Example:
      // customSearchEndpoint: "https://your-api.com/search?q="
      customSearchEndpoint: null,

      ...config
    };

    this.history = [];
    this.memory = [];

    this.kb = [
      {
        q: "what is spudzy",
        a: "Spudzy is a browser-safe JavaScript assistant engine that can chat, generate code, explain code, do math, remember things, and search supported internet sources."
      },
      {
        q: "can spudzy search the internet",
        a: "Yes, Spudzy can search supported public APIs like Wikipedia, GitHub, and Hacker News. Full Google-style search needs a backend API because browsers cannot safely scrape search engines directly."
      },
      {
        q: "how do i make spudzy real ai",
        a: "To make Spudzy act like a real AI model, connect it to a backend that calls an LLM API. Keep API keys on the backend, never inside browser JavaScript."
      }
    ];
  }

  // ---------------------------------------------------------------------------
  // Main API
  // ---------------------------------------------------------------------------

  async respond(message, options = {}) {
    const input = String(message || "").trim();

    if (!input) {
      return this.saveAndReturn(input, "Spudzy 🥔 — Say something first.");
    }

    const ctx = this.analyze(input, options);
    let reply = "";

    try {
      if (ctx.intent === "search") {
        reply = await this.handleSearch(ctx);
      } else if (ctx.intent === "code") {
        reply = this.handleCode(ctx);
      } else if (ctx.intent === "explainCode") {
        reply = this.handleExplainCode(ctx);
      } else if (ctx.intent === "fixCode") {
        reply = this.handleFixCode(ctx);
      } else if (ctx.intent === "math") {
        reply = this.handleMath(ctx);
      } else if (ctx.intent === "memory") {
        reply = this.handleMemory(ctx);
      } else if (ctx.intent === "summarize") {
        reply = this.handleSummarize(ctx);
      } else {
        reply = this.handleChat(ctx);
      }
    } catch (err) {
      reply = `Spudzy hit an error: ${err.message}`;
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

  // ---------------------------------------------------------------------------
  // Analysis
  // ---------------------------------------------------------------------------

  analyze(input, options = {}) {
    const lower = input.toLowerCase();
    const tokens = this.tokenize(input);

    return {
      raw: input,
      lower,
      tokens,
      options,
      intent: this.detectIntent(lower, tokens),
      topic: this.extractTopic(input)
    };
  }

  tokenize(text) {
    return String(text)
      .toLowerCase()
      .replace(/[^a-z0-9_+\-*/=(){}[\].,!?'"<>:;/\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
  }

  detectIntent(lower, tokens) {
    if (
      lower.includes("search the internet") ||
      lower.includes("search internet") ||
      lower.includes("look up") ||
      lower.includes("google") ||
      lower.includes("web search") ||
      lower.startsWith("search ")
    ) {
      return "search";
    }

    if (
      lower.includes("explain this code") ||
      lower.includes("explain code") ||
      lower.includes("what does this code do")
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
      lower.includes("make code") ||
      lower.includes("generate code") ||
      lower.includes("write code") ||
      lower.includes("code me") ||
      lower.includes("html") ||
      lower.includes("css") ||
      lower.includes("javascript") ||
      lower.includes("js script") ||
      lower.includes("website") ||
      lower.includes("app")
    ) {
      return "code";
    }

    if (
      /\d+\s*[+\-*/x]\s*\d+/.test(lower) ||
      lower.includes("calculate") ||
      lower.includes("math")
    ) {
      return "math";
    }

    if (lower.includes("remember") || lower.includes("forget")) {
      return "memory";
    }

    if (
      lower.includes("summarize") ||
      lower.includes("summary") ||
      lower.includes("tldr")
    ) {
      return "summarize";
    }

    return "chat";
  }

  extractTopic(input) {
    let topic = input;

    const removals = [
      "search the internet for",
      "search internet for",
      "search for",
      "look up",
      "google",
      "web search",
      "make code for",
      "generate code for",
      "write code for",
      "explain this code",
      "fix this code",
      "debug this"
    ];

    for (const r of removals) {
      topic = topic.replace(new RegExp(r, "i"), "");
    }

    return topic.trim();
  }

  // ---------------------------------------------------------------------------
  // Search Engine
  // ---------------------------------------------------------------------------

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
      return `Spudzy search mode 🌐 — I searched supported sources, but I couldn't find useful results for "${query}".`;
    }

    const summary = this.summarizeSearchResults(query, results);

    return summary;
  }

  async searchInternet(query) {
    const all = [];

    if (this.cfg.customSearchEndpoint) {
      const custom = await this.searchCustomEndpoint(query);
      all.push(...custom);
    }

    const wiki = await this.searchWikipedia(query);
    all.push(...wiki);

    const github = await this.searchGitHub(query);
    all.push(...github);

    const hn = await this.searchHackerNews(query);
    all.push(...hn);

    return all
      .filter(Boolean)
      .slice(0, this.cfg.searchLimit);
  }

  async searchCustomEndpoint(query) {
    try {
      const url = this.cfg.customSearchEndpoint + encodeURIComponent(query);
      const res = await fetch(url);
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
      const searchUrl =
        "https://en.wikipedia.org/w/api.php?action=query&origin=*&list=search&format=json&srlimit=3&srsearch=" +
        encodeURIComponent(query);

      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) return [];

      const searchData = await searchRes.json();
      const hits = searchData?.query?.search || [];

      const results = [];

      for (const hit of hits) {
        const title = hit.title;

        const summaryUrl =
          "https://en.wikipedia.org/api/rest_v1/page/summary/" +
          encodeURIComponent(title);

        try {
          const summaryRes = await fetch(summaryUrl);
          if (!summaryRes.ok) continue;

          const summary = await summaryRes.json();

          results.push({
            source: "Wikipedia",
            title: summary.title || title,
            text: summary.extract || this.stripHTML(hit.snippet || ""),
            url: summary.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`
          });
        } catch {
          results.push({
            source: "Wikipedia",
            title,
            text: this.stripHTML(hit.snippet || ""),
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`
          });
        }
      }

      return results;
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
      const items = data.items || [];

      return items.map(repo => ({
        source: "GitHub",
        title: repo.full_name,
        text:
          repo.description ||
          `Repository with ${repo.stargazers_count} stars using ${repo.language || "unknown language"}.`,
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
      const hits = data.hits || [];

      return hits.map(hit => ({
        source: "Hacker News",
        title: hit.title || "Untitled HN Story",
        text: hit.story_text || hit.title || "",
        url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`
      }));
    } catch {
      return [];
    }
  }

  summarizeSearchResults(query, results) {
    let output = `Spudzy search mode 🌐 — I found ${results.length} result(s) for "${query}".\n\n`;

    const combinedText = results
      .map(r => `${r.title}. ${r.text}`)
      .join(" ");

    const shortSummary = this.simpleSummary(combinedText, 4);

    output += `Summary:\n${shortSummary}\n\n`;
    output += `Sources:\n`;

    results.forEach((r, i) => {
      output += `\n${i + 1}. ${r.title}\n`;
      output += `   Source: ${r.source}\n`;
      output += `   Text: ${this.truncate(r.text, 240)}\n`;
      if (r.url) output += `   URL: ${r.url}\n`;
    });

    return output;
  }

  stripHTML(html) {
    return String(html || "").replace(/<[^>]+>/g, "");
  }

  truncate(text, max = 200) {
    text = String(text || "").trim();
    if (text.length <= max) return text;
    return text.slice(0, max).trim() + "...";
  }

  // ---------------------------------------------------------------------------
  // Better Coding Engine
  // ---------------------------------------------------------------------------

  handleCode(ctx) {
    if (!this.cfg.enableCode) {
      return "Spudzy code mode is disabled.";
    }

    const lower = ctx.lower;

    if (lower.includes("chatbot") || lower.includes("chat bot")) {
      return this.generateChatbotApp();
    }

    if (lower.includes("todo") || lower.includes("to-do")) {
      return this.generateTodoApp();
    }

    if (lower.includes("website") || lower.includes("html") || lower.includes("page")) {
      return this.generateModernHTMLPage();
    }

    if (lower.includes("css")) {
      return this.generateModernCSS();
    }

    if (lower.includes("button")) {
      return this.generateButtonScript();
    }

    if (lower.includes("class")) {
      return this.generateJSClassExample();
    }

    return this.generateUsefulJSModule();
  }

  handleExplainCode(ctx) {
    const code = this.extractCodeBlock(ctx.raw);

    if (!code) {
      return "Spudzy code explainer 💻 — Paste code after saying `explain this code` and I’ll break it down.";
    }

    const lines = code.split("\n").filter(Boolean);
    const features = [];

    if (/class\s+\w+/.test(code)) features.push("It defines a JavaScript class.");
    if (/constructor\s*\(/.test(code)) features.push("It uses a constructor to set up object state.");
    if (/async\s+/.test(code)) features.push("It uses async functions for promise-based work.");
    if (/fetch\s*\(/.test(code)) features.push("It makes network requests with fetch.");
    if (/addEventListener\s*\(/.test(code)) features.push("It listens for browser events.");
    if (/document\./.test(code)) features.push("It interacts with the DOM.");
    if (/return\s+/.test(code)) features.push("It returns values from functions.");

    return [
      "Spudzy code explainer 💻",
      "",
      `Lines detected: ${lines.length}`,
      "",
      "What it seems to do:",
      features.length ? features.map(f => `- ${f}`).join("\n") : "- I need more recognizable code structure to explain it well.",
      "",
      "Quick improvement tips:",
      "- Use clear function names.",
      "- Keep repeated logic in helper functions.",
      "- Add error handling around risky operations.",
      "- Avoid putting secret API keys in frontend JavaScript."
    ].join("\n");
  }

  handleFixCode(ctx) {
    const code = this.extractCodeBlock(ctx.raw);

    if (!code) {
      return "Spudzy debugger 🛠️ — Paste the broken code after saying `fix this code`.";
    }

    const issues = [];

    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/\]/g) || []).length;

    if (openParens !== closeParens) issues.push("Parentheses may be unbalanced.");
    if (openBraces !== closeBraces) issues.push("Curly braces may be unbalanced.");
    if (openBrackets !== closeBrackets) issues.push("Square brackets may be unbalanced.");

    if (/fetch\s*\(/.test(code) && !/catch\s*\(/.test(code) && !/try\s*{/.test(code)) {
      issues.push("fetch is used without visible error handling.");
    }

    if (/document\.getElementById\(["'][^"']+["']\)/.test(code) && !/DOMContentLoaded/.test(code)) {
      issues.push("DOM elements may be accessed before the page finishes loading.");
    }

    if (/innerHTML\s*=/.test(code)) {
      issues.push("innerHTML can be risky with user input. Prefer textContent unless HTML is required.");
    }

    if (!issues.length) {
      issues.push("No obvious syntax pattern issues found. Check the browser console for the exact error message.");
    }

    return [
      "Spudzy debugger 🛠️",
      "",
      "Possible issues:",
      issues.map(i => `- ${i}`).join("\n"),
      "",
      "General fix strategy:",
      "1. Open DevTools Console.",
      "2. Read the first error line.",
      "3. Check the file and line number.",
      "4. Fix syntax first, then logic.",
      "5. Add console.log checks around suspicious values."
    ].join("\n");
  }

  extractCodeBlock(text) {
    const fenced = text.match(/```(?:js|javascript|html|css)?\s*([\s\S]*?)```/i);
    if (fenced) return fenced[1].trim();

    const markerList = [
      "explain this code",
      "fix this code",
      "debug this",
      "repair this code"
    ];

    let output = text;

    for (const marker of markerList) {
      output = output.replace(new RegExp(marker, "i"), "");
    }

    return output.trim();
  }

  generateModernHTMLPage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Spudzy App</title>
  <style>
    :root {
      --bg: #070717;
      --panel: rgba(255, 255, 255, 0.08);
      --border: rgba(255, 255, 255, 0.15);
      --text: #f8fafc;
      --muted: #a1a1aa;
      --accent: #7c3aed;
      --accent2: #06b6d4;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background:
        radial-gradient(circle at 20% 20%, rgba(124, 58, 237, 0.35), transparent 28%),
        radial-gradient(circle at 80% 70%, rgba(6, 182, 212, 0.25), transparent 28%),
        var(--bg);
      color: var(--text);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 24px;
    }

    .app {
      width: min(760px, 100%);
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 30px;
      padding: 32px;
      backdrop-filter: blur(18px);
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
    }

    h1 {
      margin: 0 0 10px;
      font-size: clamp(2.4rem, 8vw, 5rem);
      letter-spacing: -0.08em;
    }

    p {
      color: var(--muted);
      line-height: 1.7;
      font-size: 1.05rem;
    }

    .row {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      flex-wrap: wrap;
    }

    input {
      flex: 1;
      min-width: 220px;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: rgba(0, 0, 0, 0.25);
      color: var(--text);
      padding: 14px 18px;
      outline: none;
    }

    button {
      border: 0;
      border-radius: 999px;
      padding: 14px 22px;
      font-weight: 800;
      color: white;
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      cursor: pointer;
      box-shadow: 0 12px 30px rgba(124, 58, 237, 0.35);
    }

    .output {
      margin-top: 24px;
      padding: 18px;
      border-radius: 18px;
      background: rgba(0, 0, 0, 0.25);
      color: #dbeafe;
      min-height: 60px;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <main class="app">
    <h1>Spudzy</h1>
    <p>A modern browser app generated by Spudzy. Type something and click the button.</p>

    <div class="row">
      <input id="input" placeholder="Type something..." />
      <button id="button">Run</button>
    </div>

    <div id="output" class="output">Output will appear here.</div>
  </main>

  <script>
    const input = document.getElementById("input");
    const button = document.getElementById("button");
    const output = document.getElementById("output");

    button.addEventListener("click", () => {
      const value = input.value.trim();

      if (!value) {
        output.textContent = "Type something first.";
        return;
      }

      output.textContent = "🥔 Spudzy processed: " + value;
    });
  </script>
</body>
</html>`;
  }

  generateModernCSS() {
    return `:root {
  --bg: #070717;
  --panel: rgba(255, 255, 255, 0.08);
  --border: rgba(255, 255, 255, 0.15);
  --text: #f8fafc;
  --muted: #a1a1aa;
  --accent: #7c3aed;
  --accent2: #06b6d4;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(124, 58, 237, 0.3), transparent 30%),
    radial-gradient(circle at bottom right, rgba(6, 182, 212, 0.22), transparent 30%),
    var(--bg);
  color: var(--text);
  font-family: system-ui, sans-serif;
}

.card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 28px;
  padding: 28px;
  backdrop-filter: blur(18px);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
}

button {
  border: 0;
  border-radius: 999px;
  padding: 14px 22px;
  color: white;
  font-weight: 800;
  cursor: pointer;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
}`;
  }

  generateButtonScript() {
    return `document.addEventListener("DOMContentLoaded", () => {
  const button = document.createElement("button");

  button.textContent = "Click Spudzy";
  button.style.padding = "14px 22px";
  button.style.border = "0";
  button.style.borderRadius = "999px";
  button.style.background = "linear-gradient(135deg, #7c3aed, #06b6d4)";
  button.style.color = "white";
  button.style.fontWeight = "800";
  button.style.cursor = "pointer";

  button.addEventListener("click", () => {
    alert("🥔 Spudzy says hello!");
  });

  document.body.appendChild(button);
});`;
  }

  generateJSClassExample() {
    return `class ExampleApp {
  constructor(rootSelector) {
    this.root = document.querySelector(rootSelector);
    this.count = 0;
  }

  mount() {
    if (!this.root) {
      throw new Error("Root element not found.");
    }

    this.root.innerHTML = "";

    const button = document.createElement("button");
    button.textContent = "Clicked 0 times";

    button.addEventListener("click", () => {
      this.count++;
      button.textContent = "Clicked " + this.count + " times";
    });

    this.root.appendChild(button);
  }
}

const app = new ExampleApp("#app");
app.mount();`;
  }

  generateUsefulJSModule() {
    return `const SpudzyUtils = {
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },

  randomItem(items) {
    if (!Array.isArray(items) || items.length === 0) return null;
    return items[Math.floor(Math.random() * items.length)];
  },

  debounce(fn, delay = 250) {
    let timer;

    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  createElement(tag, props = {}, children = []) {
    const el = document.createElement(tag);

    for (const [key, value] of Object.entries(props)) {
      if (key === "className") el.className = value;
      else if (key.startsWith("on") && typeof value === "function") {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        el.setAttribute(key, value);
      }
    }

    for (const child of children) {
      el.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }

    return el;
  }
};`;
  }

  generateTodoApp() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Spudzy Todo App</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #09090b;
      color: white;
      font-family: system-ui, sans-serif;
      padding: 20px;
    }

    .todo {
      width: min(520px, 100%);
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 24px;
      padding: 24px;
    }

    form {
      display: flex;
      gap: 10px;
    }

    input {
      flex: 1;
      padding: 12px 14px;
      border-radius: 999px;
      border: 1px solid #3f3f46;
      background: #09090b;
      color: white;
    }

    button {
      border: 0;
      border-radius: 999px;
      padding: 12px 16px;
      background: #7c3aed;
      color: white;
      font-weight: 700;
      cursor: pointer;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 20px 0 0;
    }

    li {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 12px;
      border-radius: 14px;
      background: #27272a;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <main class="todo">
    <h1>Spudzy Todo</h1>
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

    const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");

    function save() {
      localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    function render() {
      list.innerHTML = "";

      tasks.forEach((task, index) => {
        const li = document.createElement("li");

        const span = document.createElement("span");
        span.textContent = task;

        const remove = document.createElement("button");
        remove.textContent = "Remove";
        remove.addEventListener("click", () => {
          tasks.splice(index, 1);
          save();
          render();
        });

        li.append(span, remove);
        list.appendChild(li);
      });
    }

    form.addEventListener("submit", event => {
      event.preventDefault();

      const value = input.value.trim();
      if (!value) return;

      tasks.push(value);
      input.value = "";
      save();
      render();
    });

    render();
  </script>
</body>
</html>`;
  }

  generateChatbotApp() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Spudzy Chatbot</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #09090b;
      color: white;
      font-family: system-ui, sans-serif;
      padding: 20px;
    }

    .chat {
      width: min(720px, 100%);
      height: 80vh;
      display: grid;
      grid-template-rows: 1fr auto;
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 24px;
      overflow: hidden;
    }

    .messages {
      padding: 20px;
      overflow: auto;
    }

    .msg {
      max-width: 80%;
      padding: 12px 14px;
      border-radius: 16px;
      margin-bottom: 10px;
      white-space: pre-wrap;
      line-height: 1.45;
    }

    .user {
      margin-left: auto;
      background: #7c3aed;
    }

    .bot {
      margin-right: auto;
      background: #27272a;
    }

    form {
      display: flex;
      gap: 10px;
      padding: 14px;
      border-top: 1px solid #27272a;
    }

    input {
      flex: 1;
      border: 1px solid #3f3f46;
      border-radius: 999px;
      padding: 12px 14px;
      background: #09090b;
      color: white;
    }

    button {
      border: 0;
      border-radius: 999px;
      padding: 12px 18px;
      background: #7c3aed;
      color: white;
      font-weight: 700;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <main class="chat">
    <section class="messages" id="messages"></section>

    <form id="form">
      <input id="input" placeholder="Ask Spudzy anything..." autocomplete="off" />
      <button>Send</button>
    </form>
  </main>

  <script src="spudzy.js"></script>
  <script>
    const ai = new Spudzy();
    const messages = document.getElementById("messages");
    const form = document.getElementById("form");
    const input = document.getElementById("input");

    function addMessage(text, type) {
      const div = document.createElement("div");
      div.className = "msg " + type;
      div.textContent = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    addMessage("🥔 Hi, I'm Spudzy. Try: search the internet for JavaScript, make a todo app, or calculate 9 * 9.", "bot");

    form.addEventListener("submit", async event => {
      event.preventDefault();

      const text = input.value.trim();
      if (!text) return;

      input.value = "";
      addMessage(text, "user");

      const reply = await ai.respond(text);
      addMessage(reply, "bot");
    });
  </script>
</body>
</html>`;
  }

  // ---------------------------------------------------------------------------
  // Math
  // ---------------------------------------------------------------------------

  handleMath(ctx) {
    const expressions = ctx.raw.match(/(?:\d+(?:\.\d+)?|\.\d+)(?:\s*[+\-*/x]\s*(?:\d+(?:\.\d+)?|\.\d+))+/g);

    if (!expressions) {
      return "Spudzy math mode 🧮 — Give me something like `12 * 8 + 4`.";
    }

    const answers = expressions.map(expr => {
      const value = this.safeMath(expr);
      return `${expr} = ${value}`;
    });

    return "Spudzy math mode 🧮 — " + answers.join("; ");
  }

  safeMath(expr) {
    const clean = String(expr).replace(/x/g, "*").replace(/\s+/g, "");

    if (!/^[0-9+\-*/().]+$/.test(clean)) {
      return "invalid";
    }

    try {
      return Function(`"use strict"; return (${clean})`)();
    } catch {
      return "invalid";
    }
  }

  // ---------------------------------------------------------------------------
  // Memory
  // ---------------------------------------------------------------------------

  handleMemory(ctx) {
    if (!this.cfg.enableMemory) {
      return "Memory is disabled.";
    }

    if (ctx.lower.includes("remember")) {
      const text = ctx.raw.replace(/remember/i, "").trim();

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
      const text = ctx.raw.replace(/forget/i, "").trim().toLowerCase();

      const before = this.memory.length;
      this.memory = this.memory.filter(m => !m.text.toLowerCase().includes(text));
      const removed = before - this.memory.length;

      return `Spudzy forgot ${removed} matching item(s).`;
    }

    return "Memory command ready. Say: remember I like JavaScript.";
  }

  // ---------------------------------------------------------------------------
  // Chat / Summary
  // ---------------------------------------------------------------------------

  handleChat(ctx) {
    const kb = this.searchKB(ctx.raw);

    if (kb) {
      return "Spudzy 🥔 — " + kb.a;
    }

    const remembered = this.memory
      .filter(m => this.similar(ctx.raw, m.text) > 0.1)
      .slice(0, 2);

    let reply = `Spudzy 🥔 — I processed your message. Main idea: ${this.keywords(ctx.tokens).join(", ") || "general chat"}.`;

    if (remembered.length) {
      reply += "\n\nRelevant memory:\n" + remembered.map(m => "- " + m.text).join("\n");
    }

    reply += "\n\nTry asking me to generate code, explain code, fix code, calculate math, or search the internet.";

    return reply;
  }

  handleSummarize(ctx) {
    const text = ctx.raw.replace(/summarize|summary|tldr/gi, "").trim();

    if (!text) {
      return "Spudzy summary mode — Paste text after `summarize`.";
    }

    return "Spudzy summary mode — " + this.simpleSummary(text, 3);
  }

  simpleSummary(text, sentenceLimit = 3) {
    const sentences = String(text)
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(Boolean);

    if (sentences.length <= sentenceLimit) return sentences.join(" ");

    const scored = sentences.map(sentence => {
      const words = this.tokenize(sentence);
      const score = words.filter(w => w.length > 5).length + words.length * 0.05;
      return { sentence, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, sentenceLimit)
      .map(x => x.sentence)
      .join(" ");
  }

  searchKB(text) {
    let best = null;

    for (const item of this.kb) {
      const score = this.similar(text, item.q);

      if (!best || score > best.score) {
        best = { ...item, score };
      }
    }

    return best && best.score > 0.25 ? best : null;
  }

  similar(a, b) {
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
    const vec = {};

    for (const token of this.tokenize(text)) {
      if (this.stopWords().has(token)) continue;
      vec[token] = (vec[token] || 0) + 1;
    }

    return vec;
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
      "for", "with", "is", "are", "was", "were", "be", "been",
      "i", "you", "me", "my", "your", "it", "that", "this", "as",
      "so", "if", "then", "do", "does", "did", "can", "could",
      "would", "should", "will", "just", "like"
    ]);
  }
}

// Browser global
if (typeof window !== "undefined") {
  window.Spudzy = Spudzy;
}

// Node/CommonJS support
if (typeof module !== "undefined" && module.exports) {
  module.exports = Spudzy;
}

// Spudzy AI Engine v3
