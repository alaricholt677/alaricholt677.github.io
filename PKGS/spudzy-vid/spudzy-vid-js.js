/*
  RealLifeVideoLib.js
  Browser-only prompt-to-video procedural simulation library.

  What it does:
  - Takes a natural-language prompt.
  - Fixes many common typos.
  - Parses scene, mood, weather, camera, subject, style.
  - Generates an animated canvas scene.
  - Records the canvas using MediaRecorder.
  - Returns video data through a Promise:
      const data = await RealLifeVideo.generate(prompt, options)

  What it does NOT do:
  - It does not recreate Sora, Sora 2, or any real text-to-video model.
  - It does not use servers.
  - It does not secretly run in the background.
  - It does not train or run neural networks.
*/

(function attachRealLifeVideo(global) {
  "use strict";

  const DEFAULTS = {
    width: 960,
    height: 540,
    fps: 30,
    seconds: 5,
    quality: 0.92,
    mimeType: "",
    returnFrames: false,
    appendCanvas: false,
    transparent: false,
    seed: null,
    debug: false
  };

  const COMMON_TYPOS = {
    "tha": "that",
    "tht": "that",
    "teh": "the",
    "recieve": "receive",
    "recive": "receive",
    "dosent": "doesn't",
    "doesnt": "doesn't",
    "dont": "don't",
    "cant": "can't",
    "wont": "won't",
    "opver": "over",
    "ovre": "over",
    "lfie": "life",
    "lik": "like",
    "lkot": "lot",
    "alot": "a lot",
    "realstic": "realistic",
    "realsticaly": "realistically",
    "realisticaly": "realistically",
    "cinamatic": "cinematic",
    "cinamtic": "cinematic",
    "nigth": "night",
    "nite": "night",
    "raing": "rain",
    "rian": "rain",
    "wather": "weather",
    "pepole": "people",
    "ppl": "people",
    "vehical": "vehicle",
    "vehicals": "vehicles",
    "carz": "cars",
    "buildng": "building",
    "buildingss": "buildings",
    "forrest": "forest",
    "mountian": "mountain",
    "mountians": "mountains",
    "ocen": "ocean",
    "watter": "water",
    "sunet": "sunset",
    "sunris": "sunrise",
    "camra": "camera",
    "movment": "movement",
    "movign": "moving",
    "glwoing": "glowing",
    "glowng": "glowing",
    "foggyy": "foggy",
    "blury": "blurry",
    "dramaticly": "dramatically",
    "smoothe": "smooth",
    "hd": "high definition",
    "4k": "ultra detailed",
    "hyperreal": "hyper realistic",
    "hyperrealistic": "hyper realistic"
  };

  const KEYWORD_ALIASES = {
    city: ["city", "street", "downtown", "urban", "road", "alley", "buildings", "skyscraper"],
    forest: ["forest", "woods", "trees", "jungle", "nature"],
    ocean: ["ocean", "sea", "beach", "water", "waves", "shore"],
    desert: ["desert", "sand", "dunes"],
    mountain: ["mountain", "mountains", "valley", "cliff"],
    space: ["space", "galaxy", "stars", "planet", "nebula"],
    room: ["room", "house", "apartment", "kitchen", "bedroom", "office", "indoor"],
    abstract: ["abstract", "dream", "surreal", "particles"],

    rain: ["rain", "rainy", "storm", "wet"],
    snow: ["snow", "snowy", "winter", "ice"],
    fog: ["fog", "foggy", "mist", "misty"],
    sunny: ["sunny", "sun", "bright"],
    night: ["night", "midnight", "dark"],
    sunset: ["sunset", "sunrise", "golden hour"],
    neon: ["neon", "cyberpunk", "glowing", "synthwave"],
    cinematic: ["cinematic", "movie", "film", "epic"],
    realistic: ["realistic", "real life", "lifelike", "natural", "documentary"],
    fast: ["fast", "speed", "chase", "rapid"],
    slow: ["slow", "calm", "peaceful", "gentle"],

    people: ["people", "person", "walking", "crowd", "human"],
    cars: ["car", "cars", "traffic", "vehicle", "vehicles"],
    birds: ["birds", "bird", "seagulls"],
    animals: ["animal", "animals", "dog", "cat", "deer"],
    clouds: ["cloud", "clouds", "cloudy"]
  };

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function hashString(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function makeRng(seed) {
    let s = seed >>> 0;
    return function rand() {
      s += 0x6D2B79F5;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function distance(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  function normalizePrompt(prompt) {
    let text = String(prompt || "")
      .toLowerCase()
      .replace(/[^\w\s'-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const words = text.split(" ");
    const corrected = words.map((word) => {
      if (COMMON_TYPOS[word]) return COMMON_TYPOS[word];

      if (word.length >= 5) {
        let best = word;
        let bestScore = Infinity;

        const knownWords = Object.keys(COMMON_TYPOS)
          .concat(Object.values(COMMON_TYPOS))
          .concat(Object.values(KEYWORD_ALIASES).flat());

        for (const candidate of knownWords) {
          if (!candidate || candidate.includes(" ")) continue;
          const d = distance(word, candidate);
          if (d < bestScore) {
            bestScore = d;
            best = candidate;
          }
        }

        if (bestScore <= 1) return best;
      }

      return word;
    });

    return corrected.join(" ").replace(/\s+/g, " ").trim();
  }

  function hasAny(text, list) {
    return list.some((item) => text.includes(item));
  }

  function parsePrompt(prompt) {
    const correctedPrompt = normalizePrompt(prompt);
    const text = correctedPrompt;

    const sceneScores = {
      city: 0,
      forest: 0,
      ocean: 0,
      desert: 0,
      mountain: 0,
      space: 0,
      room: 0,
      abstract: 0
    };

    for (const sceneName of Object.keys(sceneScores)) {
      for (const alias of KEYWORD_ALIASES[sceneName]) {
        if (text.includes(alias)) sceneScores[sceneName] += alias.length;
      }
    }

    let scene = "city";
    let best = -1;
    for (const key of Object.keys(sceneScores)) {
      if (sceneScores[key] > best) {
        best = sceneScores[key];
        scene = key;
      }
    }

    if (best <= 0) scene = "abstract";

    const parsed = {
      originalPrompt: String(prompt || ""),
      correctedPrompt,
      scene,
      weather: {
        rain: hasAny(text, KEYWORD_ALIASES.rain),
        snow: hasAny(text, KEYWORD_ALIASES.snow),
        fog: hasAny(text, KEYWORD_ALIASES.fog),
        sunny: hasAny(text, KEYWORD_ALIASES.sunny),
        clouds: hasAny(text, KEYWORD_ALIASES.clouds)
      },
      time: {
        night: hasAny(text, KEYWORD_ALIASES.night),
        sunset: hasAny(text, KEYWORD_ALIASES.sunset)
      },
      style: {
        neon: hasAny(text, KEYWORD_ALIASES.neon),
        cinematic: hasAny(text, KEYWORD_ALIASES.cinematic),
        realistic: hasAny(text, KEYWORD_ALIASES.realistic),
        slow: hasAny(text, KEYWORD_ALIASES.slow),
        fast: hasAny(text, KEYWORD_ALIASES.fast)
      },
      subjects: {
        people: hasAny(text, KEYWORD_ALIASES.people),
        cars: hasAny(text, KEYWORD_ALIASES.cars),
        birds: hasAny(text, KEYWORD_ALIASES.birds),
        animals: hasAny(text, KEYWORD_ALIASES.animals)
      }
    };

    if (parsed.scene === "city") {
      parsed.subjects.cars = parsed.subjects.cars || text.includes("street") || text.includes("traffic");
      parsed.subjects.people = parsed.subjects.people || text.includes("walking");
    }

    if (parsed.scene === "ocean") {
      parsed.subjects.birds = parsed.subjects.birds || text.includes("beach") || text.includes("shore");
    }

    return parsed;
  }

  function chooseMimeType(preferred) {
    if (preferred && typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(preferred)) {
      return preferred;
    }

    const candidates = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm"
    ];

    if (typeof MediaRecorder === "undefined") return "";

    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }

    return "";
  }

  class World {
    constructor(parsed, options) {
      this.parsed = parsed;
      this.options = options;
      this.width = options.width;
      this.height = options.height;
      this.seed = options.seed || hashString(parsed.correctedPrompt || "real-life-video");
      this.rng = makeRng(this.seed);
      this.items = {
        stars: [],
        clouds: [],
        particles: [],
        buildings: [],
        cars: [],
        people: [],
        birds: [],
        trees: [],
        waves: [],
        mountains: [],
        roomObjects: [],
        rain: [],
        snow: []
      };

      this.palette = this.makePalette();
      this.generate();
    }

    rand(min = 0, max = 1) {
      return min + this.rng() * (max - min);
    }

    makePalette() {
      const p = this.parsed;

      if (p.style.neon) {
        return {
          skyTop: "#070015",
          skyMid: "#18003d",
          skyBottom: "#030712",
          sun: "#ff00e6",
          glow: "#00f5ff",
          glow2: "#ff2bd6",
          ground: "#050816",
          dark: "#020617",
          light: "#f8fafc"
        };
      }

      if (p.time.night || p.scene === "space") {
        return {
          skyTop: "#020617",
          skyMid: "#0f172a",
          skyBottom: "#111827",
          sun: "#dbeafe",
          glow: "#93c5fd",
          glow2: "#c084fc",
          ground: "#020617",
          dark: "#000000",
          light: "#e5e7eb"
        };
      }

      if (p.time.sunset) {
        return {
          skyTop: "#ff7e5f",
          skyMid: "#f97316",
          skyBottom: "#312e81",
          sun: "#fde68a",
          glow: "#fb7185",
          glow2: "#facc15",
          ground: "#1e1b4b",
          dark: "#111827",
          light: "#fff7ed"
        };
      }

      if (p.scene === "forest") {
        return {
          skyTop: "#93c5fd",
          skyMid: "#bfdbfe",
          skyBottom: "#dcfce7",
          sun: "#fde68a",
          glow: "#22c55e",
          glow2: "#84cc16",
          ground: "#052e16",
          dark: "#022c22",
          light: "#f0fdf4"
        };
      }

      if (p.scene === "ocean") {
        return {
          skyTop: "#38bdf8",
          skyMid: "#7dd3fc",
          skyBottom: "#e0f2fe",
          sun: "#fde68a",
          glow: "#0284c7",
          glow2: "#facc15",
          ground: "#075985",
          dark: "#082f49",
          light: "#ecfeff"
        };
      }

      if (p.scene === "desert") {
        return {
          skyTop: "#fbbf24",
          skyMid: "#fdba74",
          skyBottom: "#fed7aa",
          sun: "#fff7ad",
          glow: "#d97706",
          glow2: "#facc15",
          ground: "#92400e",
          dark: "#451a03",
          light: "#fff7ed"
        };
      }

      return {
        skyTop: "#60a5fa",
        skyMid: "#93c5fd",
        skyBottom: "#e0f2fe",
        sun: "#fde68a",
        glow: "#2563eb",
        glow2: "#f59e0b",
        ground: "#334155",
        dark: "#0f172a",
        light: "#f8fafc"
      };
    }

    generate() {
      this.generateStars();
      this.generateClouds();
      this.generateParticles();
      this.generateMountains();
      this.generateBuildings();
      this.generateCars();
      this.generatePeople();
      this.generateBirds();
      this.generateTrees();
      this.generateWaves();
      this.generateRoomObjects();
      this.generateWeatherParticles();
    }

    generateStars() {
      for (let i = 0; i < 220; i++) {
        this.items.stars.push({
          x: this.rand(0, this.width),
          y: this.rand(0, this.height * 0.72),
          r: this.rand(0.4, 2.2),
          a: this.rand(0.2, 1),
          tw: this.rand(0, Math.PI * 2)
        });
      }
    }

    generateClouds() {
      for (let i = 0; i < 28; i++) {
        this.items.clouds.push({
          x: this.rand(-this.width, this.width),
          y: this.rand(30, this.height * 0.45),
          w: this.rand(90, 280),
          h: this.rand(24, 74),
          speed: this.rand(4, 24),
          alpha: this.rand(0.06, 0.24)
        });
      }
    }

    generateParticles() {
      for (let i = 0; i < 160; i++) {
        this.items.particles.push({
          x: this.rand(0, this.width),
          y: this.rand(0, this.height),
          vx: this.rand(-0.6, 0.6),
          vy: this.rand(-0.5, 0.3),
          r: this.rand(0.6, 2.8),
          a: this.rand(0.1, 0.45),
          hue: this.rand(0, 360)
        });
      }
    }

    generateMountains() {
      for (let i = 0; i < 10; i++) {
        this.items.mountains.push({
          x: i * (this.width / 8) - this.rand(60, 140),
          base: this.rand(this.height * 0.55, this.height * 0.82),
          w: this.rand(170, 360),
          h: this.rand(120, 310),
          shade: this.rand(0.25, 0.75)
        });
      }
    }

    generateBuildings() {
      let x = -30;
      while (x < this.width + 100) {
        const w = this.rand(34, 88);
        const h = this.rand(this.height * 0.18, this.height * 0.58);
        this.items.buildings.push({
          x,
          y: this.height * 0.78 - h,
          w,
          h,
          rows: Math.floor(h / 18),
          cols: Math.floor(w / 13),
          phase: this.rand(0, 100)
        });
        x += w + this.rand(4, 14);
      }
    }

    generateCars() {
      for (let i = 0; i < 18; i++) {
        this.items.cars.push({
          x: this.rand(-this.width, this.width),
          y: this.rand(this.height * 0.78, this.height * 0.93),
          speed: this.rand(35, 120) * (this.rng() > 0.5 ? 1 : -1),
          size: this.rand(0.65, 1.35),
          color: ["#ef4444", "#3b82f6", "#eab308", "#f8fafc", "#22c55e"][Math.floor(this.rand(0, 5))]
        });
      }
    }

    generatePeople() {
      for (let i = 0; i < 32; i++) {
        this.items.people.push({
          x: this.rand(0, this.width),
          y: this.rand(this.height * 0.71, this.height * 0.93),
          speed: this.rand(8, 36) * (this.rng() > 0.5 ? 1 : -1),
          scale: this.rand(0.55, 1.25),
          phase: this.rand(0, Math.PI * 2),
          coat: ["#111827", "#1f2937", "#7f1d1d", "#172554", "#064e3b"][Math.floor(this.rand(0, 5))]
        });
      }
    }

    generateBirds() {
      for (let i = 0; i < 22; i++) {
        this.items.birds.push({
          x: this.rand(-100, this.width),
          y: this.rand(45, this.height * 0.42),
          speed: this.rand(20, 75),
          scale: this.rand(0.45, 1.3),
          phase: this.rand(0, Math.PI * 2)
        });
      }
    }

    generateTrees() {
      for (let i = 0; i < 80; i++) {
        this.items.trees.push({
          x: this.rand(-50, this.width + 50),
          y: this.rand(this.height * 0.58, this.height),
          h: this.rand(55, 190),
          w: this.rand(18, 55),
          layer: this.rand(0, 1)
        });
      }
    }

    generateWaves() {
      for (let i = 0; i < 12; i++) {
        this.items.waves.push({
          y: this.height * (0.58 + i * 0.035),
          amp: this.rand(4, 18),
          freq: this.rand(0.006, 0.022),
          speed: this.rand(0.6, 2.0),
          alpha: this.rand(0.12, 0.36)
        });
      }
    }

    generateRoomObjects() {
      for (let i = 0; i < 16; i++) {
        this.items.roomObjects.push({
          x: this.rand(this.width * 0.08, this.width * 0.92),
          y: this.rand(this.height * 0.45, this.height * 0.86),
          w: this.rand(35, 130),
          h: this.rand(28, 120),
          color: ["#78350f", "#334155", "#57534e", "#1e293b", "#7c2d12"][Math.floor(this.rand(0, 5))]
        });
      }
    }

    generateWeatherParticles() {
      for (let i = 0; i < 520; i++) {
        this.items.rain.push({
          x: this.rand(0, this.width),
          y: this.rand(0, this.height),
          len: this.rand(8, 24),
          speed: this.rand(360, 760),
          drift: this.rand(-90, -20),
          a: this.rand(0.18, 0.55)
        });
      }

      for (let i = 0; i < 360; i++) {
        this.items.snow.push({
          x: this.rand(0, this.width),
          y: this.rand(0, this.height),
          r: this.rand(1, 3.5),
          speed: this.rand(18, 80),
          drift: this.rand(-20, 25),
          phase: this.rand(0, Math.PI * 2),
          a: this.rand(0.3, 0.9)
        });
      }
    }
  }

  class Renderer {
    constructor(canvas, world, options) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { alpha: !!options.transparent });
      this.world = world;
      this.options = options;
      this.w = canvas.width;
      this.h = canvas.height;
      this.frame = 0;
    }

    render(t) {
      const ctx = this.ctx;
      const p = this.world.parsed;

      ctx.save();
      ctx.clearRect(0, 0, this.w, this.h);

      const cam = this.camera(t);
      ctx.translate(cam.x, cam.y);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-this.w * (cam.zoom - 1) / (2 * cam.zoom), -this.h * (cam.zoom - 1) / (2 * cam.zoom));

      this.drawSky(t);

      if (p.scene === "space") this.drawSpace(t);
      if (p.scene === "mountain") this.drawMountainScene(t);
      if (p.scene === "forest") this.drawForest(t);
      if (p.scene === "ocean") this.drawOcean(t);
      if (p.scene === "desert") this.drawDesert(t);
      if (p.scene === "city") this.drawCity(t);
      if (p.scene === "room") this.drawRoom(t);
      if (p.scene === "abstract") this.drawAbstract(t);

      if (p.weather.fog) this.drawFog(t);
      if (p.weather.rain) this.drawRain(t);
      if (p.weather.snow) this.drawSnow(t);

      this.drawAtmosphere(t);
      this.drawGrain(t);
      if (p.style.cinematic) this.drawCinematicBars();

      ctx.restore();

      this.frame++;
    }

    camera(t) {
      const p = this.world.parsed;
      const speed = p.style.fast ? 1.9 : p.style.slow ? 0.45 : 1;
      const cinematic = p.style.cinematic ? 1 : 0.45;

      return {
        x: Math.sin(t * 0.55 * speed) * 8 * cinematic,
        y: Math.cos(t * 0.4 * speed) * 4 * cinematic,
        zoom: 1 + Math.sin(t * 0.18) * 0.012 * cinematic
      };
    }

    drawSky(t) {
      const ctx = this.ctx;
      const p = this.world.parsed;
      const pal = this.world.palette;

      const g = ctx.createLinearGradient(0, 0, 0, this.h);
      g.addColorStop(0, pal.skyTop);
      g.addColorStop(0.48, pal.skyMid);
      g.addColorStop(1, pal.skyBottom);
      ctx.fillStyle = g;
      ctx.fillRect(-20, -20, this.w + 40, this.h + 40);

      const needsSun = !p.time.night && p.scene !== "space" && p.scene !== "room";
      if (needsSun) {
        const sx = p.time.sunset ? this.w * 0.72 : this.w * 0.78;
        const sy = p.time.sunset ? this.h * 0.38 : this.h * 0.22;
        this.drawSun(sx, sy, p.time.sunset ? 58 : 42, pal.sun);
      }

      if (p.time.night || p.scene === "space") {
        this.drawStars(t);
      }

      if (p.weather.clouds || p.weather.rain || p.weather.snow || p.scene !== "space") {
        this.drawClouds(t);
      }
    }

    drawSun(x, y, r, color) {
      const ctx = this.ctx;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
      glow.addColorStop(0, color);
      glow.addColorStop(0.35, "rgba(255, 231, 150, 0.45)");
      glow.addColorStop(1, "rgba(255, 231, 150, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, r * 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    drawStars(t) {
      const ctx = this.ctx;
      for (const s of this.world.items.stars) {
        const a = clamp(s.a + Math.sin(t * 2 + s.tw) * 0.25, 0, 1);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawClouds(t) {
      const ctx = this.ctx;
      const p = this.world.parsed;
      const cloudColor = p.time.night ? "180,190,210" : "255,255,255";

      for (const c of this.world.items.clouds) {
        const x = ((c.x + t * c.speed) % (this.w + c.w * 2)) - c.w;
        const y = c.y + Math.sin(t * 0.4 + c.x) * 3;

        ctx.fillStyle = `rgba(${cloudColor},${c.alpha})`;
        ctx.beginPath();
        ctx.ellipse(x, y, c.w * 0.35, c.h * 0.72, 0, 0, Math.PI * 2);
        ctx.ellipse(x + c.w * 0.23, y - c.h * 0.35, c.w * 0.34, c.h, 0, 0, Math.PI * 2);
        ctx.ellipse(x + c.w * 0.55, y, c.w * 0.45, c.h * 0.82, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawSpace(t) {
      const ctx = this.ctx;
      const pal = this.world.palette;

      for (let i = 0; i < 8; i++) {
        const x = this.w * 0.2 + i * this.w * 0.08 + Math.sin(t * 0.4 + i) * 30;
        const y = this.h * 0.34 + Math.cos(t * 0.3 + i) * 25;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 170);
        g.addColorStop(0, i % 2 ? "rgba(0,245,255,0.13)" : "rgba(255,0,230,0.12)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, this.w, this.h);
      }

      const px = this.w * 0.7 + Math.sin(t * 0.2) * 20;
      const py = this.h * 0.42 + Math.cos(t * 0.17) * 12;
      const planet = ctx.createRadialGradient(px - 35, py - 35, 4, px, py, 120);
      planet.addColorStop(0, pal.glow);
      planet.addColorStop(0.55, pal.glow2);
      planet.addColorStop(1, "#020617");

      ctx.fillStyle = planet;
      ctx.beginPath();
      ctx.arc(px, py, 96, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(px, py + 8, 165, 36, -0.16, 0, Math.PI * 2);
      ctx.stroke();
    }

    drawMountainScene(t) {
      this.drawMountains(t);
      this.drawGround("#1f2937", 0.74);
      this.drawBirds(t);
    }

    drawForest(t) {
      this.drawMountains(t);
      this.drawGround("#064e3b", 0.68);

      const ctx = this.ctx;
      const trees = this.world.items.trees.slice().sort((a, b) => a.y - b.y);

      for (const tree of trees) {
        this.drawTree(tree.x, tree.y, tree.w, tree.h, tree.layer);
      }

      if (this.world.parsed.subjects.animals) {
        this.drawAnimalSilhouettes(t);
      }
    }

    drawTree(x, y, w, h, layer) {
      const ctx = this.ctx;
      const dark = layer > 0.52 ? "#022c22" : "#065f46";
      const mid = layer > 0.52 ? "#064e3b" : "#047857";

      ctx.fillStyle = "#3f2f1f";
      ctx.fillRect(x - w * 0.12, y - h * 0.38, w * 0.24, h * 0.38);

      ctx.fillStyle = mid;
      ctx.beginPath();
      ctx.moveTo(x, y - h);
      ctx.lineTo(x - w, y - h * 0.2);
      ctx.lineTo(x + w, y - h * 0.2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.moveTo(x, y - h * 1.16);
      ctx.lineTo(x - w * 0.78, y - h * 0.48);
      ctx.lineTo(x + w * 0.78, y - h * 0.48);
      ctx.closePath();
      ctx.fill();
    }

    drawOcean(t) {
      const ctx = this.ctx;
      const pal = this.world.palette;

      ctx.fillStyle = "#075985";
      ctx.fillRect(0, this.h * 0.56, this.w, this.h * 0.5);

      const waterGrad = ctx.createLinearGradient(0, this.h * 0.56, 0, this.h);
      waterGrad.addColorStop(0, "rgba(14,165,233,0.76)");
      waterGrad.addColorStop(1, "rgba(3,7,18,0.62)");
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, this.h * 0.56, this.w, this.h * 0.5);

      for (const wave of this.world.items.waves) {
        ctx.beginPath();
        for (let x = -20; x <= this.w + 20; x += 8) {
          const y =
            wave.y +
            Math.sin(x * wave.freq + t * wave.speed * 2.2) * wave.amp +
            Math.cos(x * wave.freq * 0.47 + t * 0.9) * wave.amp * 0.42;

          if (x === -20) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(255,255,255,${wave.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      const shine = ctx.createLinearGradient(0, this.h * 0.56, 0, this.h);
      shine.addColorStop(0, "rgba(255,230,140,0.22)");
      shine.addColorStop(1, "rgba(255,230,140,0)");
      ctx.fillStyle = shine;
      ctx.fillRect(this.w * 0.56, this.h * 0.56, this.w * 0.22, this.h * 0.42);

      this.drawBirds(t);
    }

    drawDesert(t) {
      const ctx = this.ctx;

      for (let i = 0; i < 7; i++) {
        const yBase = this.h * (0.58 + i * 0.065);
        ctx.beginPath();
        ctx.moveTo(0, this.h);
        for (let x = 0; x <= this.w; x += 18) {
          const y = yBase + Math.sin(x * 0.006 + t * 0.24 + i) * (24 + i * 4);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(this.w, this.h);
        ctx.closePath();
        ctx.fillStyle = `rgba(180, 83, 9, ${0.18 + i * 0.08})`;
        ctx.fill();
      }
    }

    drawCity(t) {
      const p = this.world.parsed;
      this.drawBuildings(t);
      this.drawRoad(t);

      if (p.subjects.cars) this.drawCars(t);
      if (p.subjects.people) this.drawPeople(t);
      if (p.subjects.birds) this.drawBirds(t);
    }

    drawBuildings(t) {
      const ctx = this.ctx;
      const p = this.world.parsed;
      const pal = this.world.palette;

      for (const b of this.world.items.buildings) {
        ctx.fillStyle = p.time.night ? "#020617" : "#1e293b";
        ctx.fillRect(b.x, b.y, b.w, b.h);

        ctx.strokeStyle = "rgba(255,255,255,0.07)";
        ctx.strokeRect(b.x, b.y, b.w, b.h);

        for (let iy = 0; iy < b.rows; iy++) {
          for (let ix = 0; ix < b.cols; ix++) {
            const flicker = Math.sin(ix * 7.13 + iy * 11.91 + b.phase + t * 1.8);
            if (flicker > -0.15) {
              const wx = b.x + 7 + ix * 13;
              const wy = b.y + 8 + iy * 17;
              ctx.fillStyle = p.style.neon
                ? (ix % 2 ? pal.glow : pal.glow2)
                : "rgba(255, 226, 130, 0.82)";
              ctx.fillRect(wx, wy, 5, 8);
            }
          }
        }
      }
    }

    drawRoad(t) {
      const ctx = this.ctx;
      const p = this.world.parsed;

      ctx.fillStyle = p.weather.rain ? "#111827" : "#1f2937";
      ctx.fillRect(0, this.h * 0.78, this.w, this.h * 0.22);

      const roadGrad = ctx.createLinearGradient(0, this.h * 0.78, 0, this.h);
      roadGrad.addColorStop(0, "rgba(255,255,255,0.04)");
      roadGrad.addColorStop(1, "rgba(0,0,0,0.42)");
      ctx.fillStyle = roadGrad;
      ctx.fillRect(0, this.h * 0.78, this.w, this.h * 0.22);

      ctx.strokeStyle = p.style.neon ? "rgba(0,245,255,0.8)" : "rgba(255,255,255,0.35)";
      ctx.lineWidth = 3;
      ctx.setLineDash([34, 28]);
      ctx.lineDashOffset = -t * 70;
      ctx.beginPath();
      ctx.moveTo(0, this.h * 0.885);
      ctx.lineTo(this.w, this.h * 0.885);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    drawCars(t) {
      for (const car of this.world.items.cars) {
        const x = ((car.x + t * car.speed) % (this.w + 260)) - 130;
        this.drawCar(x, car.y, car.size, car.color, car.speed < 0);
      }
    }

    drawCar(x, y, scale, color, flip) {
      const ctx = this.ctx;
      const dir = flip ? -1 : 1;
      const w = 72 * scale;
      const h = 28 * scale;

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(dir, 1);

      ctx.fillStyle = color;
      this.roundRect(ctx, -w / 2, -h, w, h, 8 * scale);
      ctx.fill();

      ctx.fillStyle = "rgba(180,220,255,0.8)";
      this.roundRect(ctx, -w * 0.22, -h * 1.48, w * 0.42, h * 0.55, 6 * scale);
      ctx.fill();

      ctx.fillStyle = "#020617";
      ctx.beginPath();
      ctx.arc(-w * 0.28, 0, 8 * scale, 0, Math.PI * 2);
      ctx.arc(w * 0.28, 0, 8 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255,245,180,0.9)";
      ctx.fillRect(w * 0.44, -h * 0.65, 8 * scale, 6 * scale);

      ctx.restore();
    }

    drawPeople(t) {
      for (const person of this.world.items.people) {
        const x = ((person.x + t * person.speed) % (this.w + 80)) - 40;
        const bob = Math.sin(t * 6 + person.phase) * 2.2;
        this.drawPerson(x, person.y + bob, person.scale, person.coat, t + person.phase);
      }
    }

    drawPerson(x, y, scale, coat, phase) {
      const ctx = this.ctx;
      const s = 17 * scale;
      const walk = Math.sin(phase * 5) * 7 * scale;

      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 6 * scale;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(x, y - s * 1.6);
      ctx.lineTo(x - walk, y - s * 0.6);
      ctx.moveTo(x, y - s * 1.6);
      ctx.lineTo(x + walk, y - s * 0.6);
      ctx.stroke();

      ctx.fillStyle = coat;
      this.roundRect(ctx, x - s * 0.34, y - s * 2.35, s * 0.68, s * 1.1, 5 * scale);
      ctx.fill();

      ctx.fillStyle = "#d6a77a";
      ctx.beginPath();
      ctx.arc(x, y - s * 2.68, s * 0.34, 0, Math.PI * 2);
      ctx.fill();
    }

    drawBirds(t) {
      const ctx = this.ctx;
      ctx.strokeStyle = "rgba(15,23,42,0.78)";
      ctx.lineWidth = 2;

      for (const b of this.world.items.birds) {
        const x = ((b.x + t * b.speed) % (this.w + 100)) - 50;
        const y = b.y + Math.sin(t * 2 + b.phase) * 9;
        const flap = Math.sin(t * 12 + b.phase) * 8 * b.scale;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x - 13 * b.scale, y - flap, x - 25 * b.scale, y);
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + 13 * b.scale, y - flap, x + 25 * b.scale, y);
        ctx.stroke();
      }
    }

    drawRoom(t) {
      const ctx = this.ctx;
      const pal = this.world.palette;

      ctx.fillStyle = "#292524";
      ctx.fillRect(0, 0, this.w, this.h);

      const wall = ctx.createLinearGradient(0, 0, 0, this.h);
      wall.addColorStop(0, "#44403c");
      wall.addColorStop(1, "#1c1917");
      ctx.fillStyle = wall;
      ctx.fillRect(0, 0, this.w, this.h * 0.68);

      ctx.fillStyle = "#1f2937";
      ctx.fillRect(0, this.h * 0.68, this.w, this.h * 0.32);

      const lx = this.w * 0.74 + Math.sin(t * 0.4) * 20;
      const ly = this.h * 0.2;
      const light = ctx.createRadialGradient(lx, ly, 0, lx, ly, this.w * 0.55);
      light.addColorStop(0, "rgba(255,238,180,0.24)");
      light.addColorStop(1, "rgba(255,238,180,0)");
      ctx.fillStyle = light;
      ctx.fillRect(0, 0, this.w, this.h);

      for (const o of this.world.items.roomObjects) {
        ctx.fillStyle = o.color;
        this.roundRect(ctx, o.x, o.y, o.w, o.h, 9);
        ctx.fill();
      }

      ctx.fillStyle = pal.dark;
      this.roundRect(ctx, this.w * 0.08, this.h * 0.48, this.w * 0.35, this.h * 0.2, 18);
      ctx.fill();

      ctx.fillStyle = "#78350f";
      ctx.fillRect(this.w * 0.6, this.h * 0.45, this.w * 0.22, this.h * 0.25);
    }

    drawAbstract(t) {
      const ctx = this.ctx;
      const pal = this.world.palette;

      for (let i = 0; i < 38; i++) {
        const angle = t * 0.42 + i * 0.57;
        const radius = 40 + i * 9;
        const x = this.w / 2 + Math.cos(angle) * radius;
        const y = this.h / 2 + Math.sin(angle * 1.2) * radius * 0.55;
        const r = 22 + Math.sin(t + i) * 10 + i * 0.4;

        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
        g.addColorStop(0, i % 2 ? pal.glow : pal.glow2);
        g.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawMountains(t) {
      const ctx = this.ctx;

      for (const m of this.world.items.mountains) {
        ctx.fillStyle = `rgba(15,23,42,${m.shade})`;
        ctx.beginPath();
        ctx.moveTo(m.x, this.h);
        ctx.lineTo(m.x + m.w * 0.5, m.base - m.h);
        ctx.lineTo(m.x + m.w, this.h);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.beginPath();
        ctx.moveTo(m.x + m.w * 0.5, m.base - m.h);
        ctx.lineTo(m.x + m.w * 0.37, m.base - m.h * 0.62);
        ctx.lineTo(m.x + m.w * 0.63, m.base - m.h * 0.62);
        ctx.closePath();
        ctx.fill();
      }
    }

    drawGround(color, start) {
      const ctx = this.ctx;
      ctx.fillStyle = color;
      ctx.fillRect(0, this.h * start, this.w, this.h * (1 - start));
    }

    drawAnimalSilhouettes(t) {
      const ctx = this.ctx;
      for (let i = 0; i < 5; i++) {
        const x = ((i * 190 + t * 18) % (this.w + 120)) - 60;
        const y = this.h * 0.78 + Math.sin(i) * 28;
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.beginPath();
        ctx.ellipse(x, y, 24, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 24, y - 8, 9, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawRain(t) {
      const ctx = this.ctx;
      ctx.save();
      ctx.strokeStyle = "rgba(180,220,255,0.44)";
      ctx.lineWidth = 1;

      for (const r of this.world.items.rain) {
        const y = (r.y + t * r.speed) % (this.h + 80);
        const x = (r.x + t * r.drift + this.w) % this.w;

        ctx.globalAlpha = r.a;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - r.len * 0.45, y + r.len);
        ctx.stroke();
      }

      ctx.restore();

      if (this.world.parsed.scene === "city") {
        const g = ctx.createLinearGradient(0, this.h * 0.78, 0, this.h);
        g.addColorStop(0, "rgba(255,255,255,0.08)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, this.h * 0.78, this.w, this.h * 0.22);
      }
    }

    drawSnow(t) {
      const ctx = this.ctx;
      ctx.save();

      for (const s of this.world.items.snow) {
        const y = (s.y + t * s.speed) % (this.h + 30);
        const x = (s.x + Math.sin(t + s.phase) * 18 + t * s.drift + this.w) % this.w;

        ctx.fillStyle = `rgba(255,255,255,${s.a})`;
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    drawFog(t) {
      const ctx = this.ctx;

      for (let i = 0; i < 9; i++) {
        const y = this.h * (0.18 + i * 0.08);
        const x = Math.sin(t * 0.16 + i) * this.w * 0.08;
        const g = ctx.createLinearGradient(0, y - 60, 0, y + 60);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(0.5, "rgba(255,255,255,0.095)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - 120, y - 80, this.w + 240, 160);
      }
    }

    drawAtmosphere(t) {
      const ctx = this.ctx;
      const p = this.world.parsed;
      const pal = this.world.palette;

      const vignette = ctx.createRadialGradient(
        this.w * 0.5,
        this.h * 0.45,
        this.w * 0.1,
        this.w * 0.5,
        this.h * 0.5,
        this.w * 0.75
      );
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.42)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, this.w, this.h);

      if (p.style.neon) {
        const glow = ctx.createRadialGradient(this.w * 0.5, this.h * 0.45, 0, this.w * 0.5, this.h * 0.45, this.w);
        glow.addColorStop(0, "rgba(0,245,255,0.08)");
        glow.addColorStop(0.5, "rgba(255,0,230,0.05)");
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, this.w, this.h);
      }

      if (p.style.realistic) {
        ctx.fillStyle = "rgba(255,245,220,0.035)";
        ctx.fillRect(0, 0, this.w, this.h);
      }

      for (const part of this.world.items.particles) {
        const x = (part.x + part.vx * t * 60 + this.w) % this.w;
        const y = (part.y + part.vy * t * 60 + this.h) % this.h;
        ctx.fillStyle = p.style.neon
          ? `hsla(${part.hue}, 100%, 70%, ${part.a})`
          : `rgba(255,255,255,${part.a * 0.6})`;
        ctx.beginPath();
        ctx.arc(x, y, part.r, 0, Math.PI * 2);
        ctx.fill();
      }

      const scan = smoothstep(0, 1, Math.sin(t * 0.7) * 0.5 + 0.5);
      ctx.fillStyle = `rgba(255,255,255,${0.012 * scan})`;
      ctx.fillRect(0, 0, this.w, this.h);
    }

    drawGrain(t) {
      const ctx = this.ctx;
      const amount = Math.floor((this.w * this.h) / 900);
      ctx.save();
      ctx.globalAlpha = 0.055;

      for (let i = 0; i < amount; i++) {
        const x = Math.random() * this.w;
        const y = Math.random() * this.h;
        const v = 150 + Math.random() * 105;
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x, y, 1, 1);
      }

      ctx.restore();
    }

    drawCinematicBars() {
      const ctx = this.ctx;
      const bar = Math.floor(this.h * 0.09);
      ctx.fillStyle = "rgba(0,0,0,0.92)";
      ctx.fillRect(0, 0, this.w, bar);
      ctx.fillRect(0, this.h - bar, this.w, bar);
    }

    roundRect(ctx, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
  }

  class RealLifeVideoEngine {
    constructor(options = {}) {
      this.options = Object.assign({}, DEFAULTS, options);
      this.options.width = Math.max(160, Math.floor(this.options.width));
      this.options.height = Math.max(90, Math.floor(this.options.height));
      this.options.fps = clamp(Math.floor(this.options.fps), 1, 60);
      this.options.seconds = clamp(Number(this.options.seconds), 0.5, 60);

      this.canvas = this.options.canvas || document.createElement("canvas");
      this.canvas.width = this.options.width;
      this.canvas.height = this.options.height;

      if (this.options.appendCanvas && !this.canvas.parentNode) {
        document.body.appendChild(this.canvas);
      }
    }

    async generate(prompt) {
      const parsed = parsePrompt(prompt);
      const world = new World(parsed, this.options);
      const renderer = new Renderer(this.canvas, world, this.options);

      const canRecord =
        typeof MediaRecorder !== "undefined" &&
        typeof this.canvas.captureStream === "function";

      if (!canRecord) {
        const frames = this.renderFramesOnly(renderer);
        return {
          ok: false,
          reason: "MediaRecorder or canvas.captureStream is not supported in this browser.",
          originalPrompt: parsed.originalPrompt,
          correctedPrompt: parsed.correctedPrompt,
          parsed,
          width: this.options.width,
          height: this.options.height,
          fps: this.options.fps,
          seconds: this.options.seconds,
          mimeType: null,
          blob: null,
          url: null,
          frames
        };
      }

      return this.recordCanvas(renderer, parsed);
    }

    renderFramesOnly(renderer) {
      const frames = [];
      const totalFrames = Math.floor(this.options.fps * this.options.seconds);

      for (let i = 0; i < totalFrames; i++) {
        const t = i / this.options.fps;
        renderer.render(t);

        if (this.options.returnFrames) {
          frames.push(this.canvas.toDataURL("image/webp", this.options.quality));
        }
      }

      return frames;
    }

    recordCanvas(renderer, parsed) {
      const stream = this.canvas.captureStream(this.options.fps);
      const mimeType = chooseMimeType(this.options.mimeType);
      const chunks = [];
      const frames = [];

      const recorderOptions = {};
      if (mimeType) recorderOptions.mimeType = mimeType;

      let recorder;

      try {
        recorder = new MediaRecorder(stream, recorderOptions);
      } catch (err) {
        recorder = new MediaRecorder(stream);
      }

      return new Promise((resolve, reject) => {
        const totalFrames = Math.floor(this.options.fps * this.options.seconds);
        let currentFrame = 0;
        let stopped = false;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        recorder.onerror = (event) => {
          reject(event.error || new Error("MediaRecorder failed."));
        };

        recorder.onstop = () => {
          if (stopped) return;
          stopped = true;

          const finalMime = recorder.mimeType || mimeType || "video/webm";
          const blob = new Blob(chunks, { type: finalMime });
          const url = URL.createObjectURL(blob);

          resolve({
            ok: true,
            originalPrompt: parsed.originalPrompt,
            correctedPrompt: parsed.correctedPrompt,
            parsed,
            width: this.options.width,
            height: this.options.height,
            fps: this.options.fps,
            seconds: this.options.seconds,
            frameCount: totalFrames,
            mimeType: finalMime,
            blob,
            url,
            frames,
            canvas: this.canvas
          });
        };

        const frameDuration = 1000 / this.options.fps;
        let start = performance.now();

        const draw = () => {
          const now = performance.now();
          const elapsed = now - start;

          currentFrame = Math.floor(elapsed / frameDuration);
          const t = currentFrame / this.options.fps;

          renderer.render(t);

          if (this.options.returnFrames && currentFrame % Math.max(1, Math.floor(this.options.fps / 6)) === 0) {
            frames.push(this.canvas.toDataURL("image/webp", this.options.quality));
          }

          if (currentFrame >= totalFrames) {
            try {
              recorder.stop();
            } catch (err) {
              reject(err);
            }

            for (const track of stream.getTracks()) {
              track.stop();
            }

            return;
          }

          requestAnimationFrame(draw);
        };

        recorder.start();
        requestAnimationFrame(draw);
      });
    }

    destroy() {
      if (this.canvas && this.canvas.parentNode && this.options.appendCanvas) {
        this.canvas.parentNode.removeChild(this.canvas);
      }
    }
  }

  const RealLifeVideo = {
    async generate(prompt, options = {}) {
      const engine = new RealLifeVideoEngine(options);
      return engine.generate(prompt);
    },

    create(options = {}) {
      return new RealLifeVideoEngine(options);
    },

    correctPrompt(prompt) {
      return normalizePrompt(prompt);
    },

    parsePrompt(prompt) {
      return parsePrompt(prompt);
    }
  };

  global.RealLifeVideo = RealLifeVideo;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = RealLifeVideo;
  }
})(typeof window !== "undefined" ? window : globalThis);
