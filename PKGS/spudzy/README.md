# 🥔 Spudzy AI Engine

Spudzy is a browser-safe JavaScript assistant engine.

It can:
- generate HTML pages from prompts
- explain code
- fix code issues
- perform math
- search safe sources
- remember notes

Runs fully in the browser.

---

## ✨ Features

- Prompt → HTML generation
- Strong typo correction system
- Intent detection (code, search, math, etc.)
- Code analyzer and debugger
- Local memory system
- Browser-safe search
- Async response system

---

## 🚀 Quick Start

const spudzy = new Spudzy();

const reply = await spudzy.respond(
  "make html for a neon portfolio with cards and contact form"
);

console.log(reply);

---

## 💬 How messages flow

1. Get user input
const text = inputEl.value.trim();

2. Get mode
const mode = modeEl.value;

3. Send to Spudzy
const reply = await spudzy.respond(text, {
  mode,
  persona: mode
});

4. Show reply
addMessage(reply, "bot");

---

## 📦 API

spudzy.respond(message, options)

Returns:
string (AI response)

---

## 🧠 Intents

Spudzy automatically detects what the user wants:

make / create html → code
explain code → explainCode
fix code → fixCode
search internet → search
calculate → math
remember / forget → memory
summarize → summary
story → story mode
roast → roast mode

---

## 🎨 HTML Generator

Example:

make html for a voxel minecraft landing page with blocks

Spudzy will:
- detect page type
- pick components (navbar, cards, etc.)
- apply style (dark, neon, etc.)
- build full HTML output

---

## 🔤 Typo Handling

Automatic correction:

mkae → make
htlm → html
pixle → pixel
minecarft → minecraft

Also uses edit-distance matching.

---

## 🔍 Search

Spudzy can search:
- Wikipedia
- GitHub
- Hacker News

Example:
search internet for javascript canvas animation

Note:
No Google scraping. No backend required.

---

## 📐 Math

Example:

calculate 12 * 8 + 4

Output:
12 * 8 + 4 = 100

Safe evaluator only.

---

## 💾 Memory

remember I like dark dashboards

forget dark dashboards

Stored locally.

---

## 🧪 Code Tools

Explain:

explain this code:
<your code>

Fix:

fix this code:
<your code>

Checks:
- syntax errors
- missing brackets
- common bugs
- unsafe patterns

---

## 🎮 Special Behavior

If user mentions video / vid / vdeoi

Spudzy returns your video generator link.

---

## ⚙️ Config

const spudzy = new Spudzy({
  enableSearch: true,
  enableCode: true,
  enableMath: true,
  enableMemory: true,
  typoCorrection: true
});

---

## 📁 Environment

- works on GitHub Pages
- no backend needed
- no dependencies
- pure JS

---

## 🧠 Philosophy

Spudzy is NOT a real AI model.

It is:
- a rule-based assistant
- a parser
- a generator

Think:
chat engine + prompt system

---

## 📜 License

Free to use and modify

---

## 🥔 Credits

Spudzy AI Engine v9
