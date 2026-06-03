# 🎬 Spudzy Vid (RealLifeVideo)

A browser‑only procedural prompt‑to‑video generator powered by Canvas + MediaRecorder.

No servers. No AI model.
Everything runs locally in the browser.

---

## ✨ Features

- Prompt → video generation (client-side)
- Multiple visual styles (voxel, pixel, cinematic, etc.)
- Procedural scenes (city, forest, ocean, space, etc.)
- Real video export (.webm)
- Runs entirely offline
- No dependencies

---

## 🚀 Quick Start

1. Include the library:

https://your-username.github.io/PKGS/spudzy-vid/spudzy-vid-js.js?v=1script>

2. Generate a video:

const data = await RealLifeVideo.generate(
  "mc voxel forest with cubes sunset",
  {
    width: 1280,
    height: 720,
    seconds: 6,
    fps: 30,
    bitrate: 8000000
  }
);

document.querySelector("video").src = data.url;

---

## 📦 API

RealLifeVideo.generate(prompt, options)

Returns:

{
  ok,
  originalPrompt,
  correctedPrompt,
  parsed,
  width,
  height,
  fps,
  seconds,
  frameCount,
  mimeType,
  blob,
  url,
  frames,
  canvas
}

---

## ⚙️ Options

{
  width: 1280,
  height: 720,
  fps: 30,
  seconds: 6,
  bitrate: 8000000,
  returnFrames: false,
  appendCanvas: false,
  transparent: false,
  seed: null
}

---

## 🧠 Prompt System

Prompts are procedural, not AI-generated.

Examples:

mc voxel forest with cubes animals sunset cinematic

2d pixel arcade platformer with coins enemies neon sky

realistic rainy city street with cars people fog

sci-fi space galaxy robots lasers glitch

---

## 🎨 Supported Concepts

Styles:
voxel, minecraft
pixel, 8bit
cinematic
anime, comic
synthwave, vaporwave
horror, fantasy, scifi
platformer, racing, rpg, arcade, shooter

Scenes:
city, forest, ocean, desert
mountain, space, room
dungeon, track, village

Modifiers:
fast, slow
many, minimal
giant, tiny
chaotic, glowing

---

## 🔍 Prompt Parsing

The engine:
- fixes typos automatically
- detects styles, scenes, and objects
- applies modifiers to speed, density, scale, and colors

---

## 🧪 Utility Methods

RealLifeVideo.correctPrompt(prompt)
RealLifeVideo.parsePrompt(prompt)
RealLifeVideo.create(options)

---

## 🌐 Global Aliases

All of these work:

RealLifeVideo
SpudzyVid
SpudzyVideo
spudzyVid
spudzyVideo

---

## ⚠️ Browser Support

Requires:
- canvas.captureStream
- MediaRecorder

If unsupported:
- frames still render
- video export disabled

---

## 📁 Project Structure

PKGS/spudzy-vid/
  spudzy-vid-js.js   (library)
  index.html         (sample UI)

---

## 🛠️ Development Notes

- Pure JavaScript
- No backend
- Deterministic visuals
- GitHub Pages friendly

---

## 📜 License

Free to use and modify

---

## 💡 Philosophy

This is NOT AI video generation.

It is a procedural engine driven by text prompts.

Think:
Game engine + prompt parser
NOT machine learning
