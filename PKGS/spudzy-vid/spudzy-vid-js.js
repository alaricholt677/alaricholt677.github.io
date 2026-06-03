/*
  Spudzy Vid / RealLifeVideo
  Browser-only procedural prompt(str) {  Browser-only procedural prompt-to-video generator.
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

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const dp = Array.from({ length: b.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= a.length; j++) dp[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        dp[i][j] =
          b[i - 1] === a[j - 1]
            ? dp[i - 1][j - 1]
            : Math.min(
                dp[i - 1][j - 1] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j] + 1
              );
      }
    }

    return dp[b.length][a.length];
  }

  function unique(arr) {
    return Array.from(new Set(arr));
  }

  function allKnownWords() {
    return unique(
      Object.keys(TYPO_MAP)
        .concat(Object.values(TYPO_MAP))
        .concat(Object.values(STYLE_ALIASES).flat())
        .concat(Object.values(SCENE_ALIASES).flat())
        .concat(Object.values(OBJECT_ALIASES).flat())
    )
      .filter(Boolean)
      .map((x) => String(x).toLowerCase())
      .filter((x) => !x.includes(" "));
  }

  const KNOWN_WORDS = allKnownWords();

  function normalizePrompt(prompt) {
    let text = String(prompt || "")
      .toLowerCase()
      .replace(/[^\w\s'-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const words = text.split(" ").filter(Boolean);

    const corrected = words.map((word) => {
      if (TYPO_MAP[word]) return TYPO_MAP[word];

      if (word.length >= 5) {
        let best = word;
        let bestDistance = Infinity;

        for (const candidate of KNOWN_WORDS) {
          const d = levenshtein(word, candidate);
          if (d < bestDistance) {
            bestDistance = d;
            best = candidate;
          }
        }

        if (bestDistance <= 1) return best;
      }

      return word;
    });

    return corrected.join(" ").replace(/\s+/g, " ").trim();
  }

  function includesAny(text, list) {
    return list.some((term) => text.includes(term));
  }

  function scoreAliases(text, aliases) {
    let score = 0;
    for (const term of aliases) {
      if (text.includes(term)) score += term.length + 1;
    }
    return score;
  }

  function parsePrompt(prompt) {
    const originalPrompt = String(prompt || "");
    const correctedPrompt = normalizePrompt(originalPrompt);
    const text = correctedPrompt;
    const words = unique(text.split(/\s+/).filter(Boolean));

    const styles = {};
    for (const key of Object.keys(STYLE_ALIASES)) {
      styles[key] = includesAny(text, STYLE_ALIASES[key]);
    }

    const sceneScores = {};
    for (const key of Object.keys(SCENE_ALIASES)) {
      sceneScores[key] = scoreAliases(text, SCENE_ALIASES[key]);
    }

    let scene = "abstract";
    let best = -1;
    for (const key of Object.keys(sceneScores)) {
      if (sceneScores[key] > best) {
        best = sceneScores[key];
        scene = key;
      }
    }

    if (best <= 0) scene = "abstract";

    const objects = {};
    for (const key of Object.keys(OBJECT_ALIASES)) {
      objects[key] = includesAny(text, OBJECT_ALIASES[key]);
    }

    if (scene === "city") {
      objects.cars = objects.cars || text.includes("street") || text.includes("traffic");
      objects.people = objects.people || text.includes("walking");
    }

    if (scene === "ocean") {
      objects.water = true;
      objects.birds = objects.birds || text.includes("beach") || text.includes("shore");
    }

    if (scene === "space") {
      objects.clouds = false;
    }

    const modifiers = {
      speed: 1,
      density: 1,
      scale: 1,
      glow: 0,
      chaos: 0,
      colors: []
    };

    for (const word of words) {
      const effect = WORD_EFFECTS[word];
      if (!effect) continue;

      if (effect.speed) modifiers.speed *= effect.speed;
      if (effect.density) modifiers.density *= effect.density;
      if (effect.scale) modifiers.scale *= effect.scale;
      if (effect.glow) modifiers.glow += effect.glow;
      if (effect.chaos) modifiers.chaos += effect.chaos;
      if (effect.color) modifiers.colors.push(effect.color);
    }

    const gameMode =
      styles.voxel ? "voxel-sandbox" :
      styles.pixel ? "pixel-arcade" :
      styles.racing ? "racing" :
      styles.platformer ? "platformer" :
      styles.rpg ? "rpg" :
      styles.shooter ? "shooter" :
      styles.arcade ? "arcade" :
      "cinematic-sim";

    return {
      originalPrompt,
      correctedPrompt,
      words,
      scene,
      sceneScores,
      styles,
      objects,
      modifiers,
      gameMode,
      referenceMode: {
        requested: text.includes("reference") || text.includes("style of") || text.includes("like"),
        note: "References are interpreted as broad procedural style hints, not exact copies."
      }
    };
  }

  function chooseMimeType(preferred) {
    if (typeof MediaRecorder === "undefined") return "";

    if (preferred && MediaRecorder.isTypeSupported(preferred)) return preferred;

    const candidates = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm"
    ];

    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }

    return "";
  }

  function colorWithAlpha(hex, alpha) {
    const clean = hex.replace("#", "");
    const n = parseInt(clean, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  class World {
    constructor(parsed, options) {
      this.parsed = parsed;
      this.options = options;
      this.width = options.width;
      this.height = options.height;
      this.seed = options.seed || hashString(parsed.correctedPrompt || "spudzy-vid");
      this.rng = makeRng(this.seed);
      this.palette = this.makePalette();
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
        blocks: [],
        platforms: [],
        coins: [],
        enemies: [],
        sprites: [],
        gridLines: [],
        roomObjects: [],
        rain: [],
        snow: [],
        wordObjects: []
      };
      this.generate();
    }

    rand(min = 0, max = 1) {
      return min + this.rng() * (max - min);
    }

    pick(arr) {
      return arr[Math.floor(this.rand(0, arr.length))];
    }

    makePalette() {
      const p = this.parsed;
      const custom = p.modifiers.colors;

      if (custom.length) {
        return {
          skyTop: custom[0],
          skyMid: custom[1] || "#111827",
          skyBottom: "#020617",
          ground: "#111827",
          dark: "#020617",
          light: "#f8fafc",
          accent: custom[0],
          accent2: custom[1] || "#06b6d4",
          sun: custom[2] || "#fde68a"
        };
      }

      if (p.styles.voxel) {
        return {
          skyTop: "#60a5fa",
          skyMid: "#93c5fd",
          skyBottom: "#dbeafe",
          ground: "#15803d",
          dark: "#3f2f1f",
          light: "#fefce8",
          accent: "#22c55e",
          accent2: "#a16207",
          sun: "#fde047"
        };
      }

      if (p.styles.pixel) {
        return {
          skyTop: "#111827",
          skyMid: "#312e81",
          skyBottom: "#020617",
          ground: "#171717",
          dark: "#000000",
          light: "#f8fafc",
          accent: "#22d3ee",
          accent2: "#f472b6",
          sun: "#facc15"
        };
      }

      if (p.styles.synthwave || p.styles.vapor) {
        return {
          skyTop: "#120024",
          skyMid: "#3b0764",
          skyBottom: "#020617",
          ground: "#050816",
          dark: "#020617",
          light: "#ffffff",
          accent: "#00f5ff",
          accent2: "#ff00e6",
          sun: "#fb7185"
        };
      }

      if (p.styles.horror || p.objects.night) {
        return {
          skyTop: "#020617",
          skyMid: "#111827",
          skyBottom: "#030712",
          ground: "#0a0a0a",
          dark: "#000000",
          light: "#d1d5db",
          accent: "#ef4444",
          accent2: "#7f1d1d",
          sun: "#9ca3af"
        };
      }

      if (p.objects.sunset) {
        return {
          skyTop: "#fb7185",
          skyMid: "#f97316",
          skyBottom: "#312e81",
          ground: "#1e1b4b",
          dark: "#111827",
          light: "#fff7ed",
          accent: "#facc15",
          accent2: "#ec4899",
          sun: "#fde68a"
        };
      }

      if (p.scene === "ocean") {
        return {
          skyTop: "#38bdf8",
          skyMid: "#7dd3fc",
          skyBottom: "#e0f2fe",
          ground: "#075985",
          dark: "#082f49",
          light: "#ecfeff",
          accent: "#0284c7",
          accent2: "#facc15",
          sun: "#fde68a"
        };
      }

      if (p.scene === "forest" || p.scene === "farm") {
        return {
          skyTop: "#93c5fd",
          skyMid: "#bfdbfe",
          skyBottom: "#dcfce7",
          ground: "#166534",
          dark: "#052e16",
          light: "#f0fdf4",
          accent: "#22c55e",
          accent2: "#84cc16",
          sun: "#fde68a"
        };
      }

      return {
        skyTop: "#60a5fa",
        skyMid: "#93c5fd",
        skyBottom: "#e0f2fe",
        ground: "#334155",
        dark: "#0f172a",
        light: "#f8fafc",
        accent: "#2563eb",
        accent2: "#f59e0b",
        sun: "#fde68a"
      };
    }

    density(base) {
      return Math.max(1, Math.floor(base * this.parsed.modifiers.density));
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
      this.generateBlocks();
      this.generatePlatforms();
      this.generateGameItems();
      this.generateRoomObjects();
      this.generateWeather();
      this.generateWordObjects();
    }

    generateStars() {
      for (let i = 0; i < this.density(220); i++) {
        this.items.stars.push({
          x: this.rand(0, this.width),
          y: this.rand(0, this.height * 0.72),
          r: this.rand(0.5, 2.4),
          a: this.rand(0.2, 1),
          tw: this.rand(0, Math.PI * 2)
        });
      }
    }

    generateClouds() {
      for (let i = 0; i < this.density(28); i++) {
        this.items.clouds.push({
          x: this.rand(-this.width, this.width),
          y: this.rand(30, this.height * 0.45),
          w: this.rand(90, 290),
          h: this.rand(22, 76),
          speed: this.rand(4, 24),
          alpha: this.rand(0.05, 0.25)
        });
      }
    }

    generateParticles() {
      for (let i = 0; i < this.density(180); i++) {
        this.items.particles.push({
          x: this.rand(0, this.width),
          y: this.rand(0, this.height),
          vx: this.rand(-0.8, 0.8),
          vy: this.rand(-0.6, 0.45),
          r: this.rand(0.6, 3.1),
          a: this.rand(0.08, 0.48),
          hue: this.rand(0, 360)
        });
      }
    }

    generateMountains() {
      for (let i = 0; i < 11; i++) {
        this.items.mountains.push({
          x: i * (this.width / 8) - this.rand(60, 140),
          base: this.rand(this.height * 0.55, this.height * 0.82),
          w: this.rand(170, 370),
          h: this.rand(120, 320),
          shade: this.rand(0.25, 0.78)
        });
      }
    }

    generateBuildings() {
      let x = -40;
      while (x < this.width + 120) {
        const w = this.rand(34, 92);
        const h = this.rand(this.height * 0.18, this.height * 0.6);
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
      for (let i = 0; i < this.density(20); i++) {
        this.items.cars.push({
          x: this.rand(-this.width, this.width),
          y: this.rand(this.height * 0.78, this.height * 0.93),
          speed: this.rand(35, 130) * (this.rng() > 0.5 ? 1 : -1),
          size: this.rand(0.65, 1.35) * this.parsed.modifiers.scale,
          color: this.pick(["#ef4444", "#3b82f6", "#eab308", "#f8fafc", "#22c55e", "#a855f7"])
        });
      }
    }

    generatePeople() {
      for (let i = 0; i < this.density(34); i++) {
        this.items.people.push({
          x: this.rand(0, this.width),
          y: this.rand(this.height * 0.7, this.height * 0.93),
          speed: this.rand(8, 40) * (this.rng() > 0.5 ? 1 : -1),
          scale: this.rand(0.55, 1.25) * this.parsed.modifiers.scale,
          phase: this.rand(0, Math.PI * 2),
          coat: this.pick(["#111827", "#1f2937", "#7f1d1d", "#172554", "#064e3b", "#581c87"])
        });
      }
    }

    generateBirds() {
      for (let i = 0; i < this.density(24); i++) {
        this.items.birds.push({
          x: this.rand(-100, this.width),
          y: this.rand(45, this.height * 0.42),
          speed: this.rand(20, 80),
          scale: this.rand(0.45, 1.35),
          phase: this.rand(0, Math.PI * 2)
        });
      }
    }

    generateTrees() {
      for (let i = 0; i < this.density(90); i++) {
        this.items.trees.push({
          x: this.rand(-60, this.width + 60),
          y: this.rand(this.height * 0.58, this.height),
          h: this.rand(55, 190),
          w: this.rand(18, 58),
          layer: this.rand(0, 1)
        });
      }
    }

    generateWaves() {
      for (let i = 0; i < 14; i++) {
        this.items.waves.push({
          y: this.height * (0.56 + i * 0.035),
          amp: this.rand(4, 18),
          freq: this.rand(0.006, 0.022),
          speed: this.rand(0.6, 2),
          alpha: this.rand(0.12, 0.36)
        });
      }
    }

    generateBlocks() {
      const block = Math.max(18, Math.floor(this.width / 48));
      for (let y = this.height * 0.54; y < this.height + block; y += block) {
        for (let x = -block; x < this.width + block; x += block) {
          const yy = y + Math.sin(x * 0.02 + this.seed) * block * 0.5;
          this.items.blocks.push({
            x,
            y: yy,
            s: block,
            type: y < this.height * 0.65 ? "grass" : this.rng() > 0.3 ? "dirt" : "stone",
            shade: this.rand(0.75, 1.15)
          });
        }
      }
    }

    generatePlatforms() {
      for (let i = 0; i < this.density(18); i++) {
        this.items.platforms.push({
          x: this.rand(0, this.width),
          y: this.rand(this.height * 0.35, this.height * 0.82),
          w: this.rand(70, 210),
          h: this.rand(12, 34),
          type: this.pick(["grass", "metal", "stone", "wood"])
        });
      }
    }

    generateGameItems() {
      for (let i = 0; i < this.density(30); i++) {
        this.items.coins.push({
          x: this.rand(30, this.width - 30),
          y: this.rand(this.height * 0.25, this.height * 0.78),
          r: this.rand(6, 14),
          phase: this.rand(0, Math.PI * 2)
        });
      }

      for (let i = 0; i < this.density(12); i++) {
        this.items.enemies.push({
          x: this.rand(0, this.width),
          y: this.rand(this.height * 0.68, this.height * 0.9),
          s: this.rand(18, 42),
          phase: this.rand(0, Math.PI * 2),
          color: this.pick(["#ef4444", "#7c2d12", "#581c87", "#0f766e"])
        });
      }

      for (let i = 0; i < this.density(16); i++) {
        this.items.sprites.push({
          x: this.rand(0, this.width),
          y: this.rand(this.height * 0.25, this.height * 0.75),
          s: this.rand(20, 60),
          color: this.pick(["#22d3ee", "#f472b6", "#a3e635", "#facc15"]),
          phase: this.rand(0, Math.PI * 2)
        });
      }
    }

    generateRoomObjects() {
      for (let i = 0; i < this.density(18); i++) {
        this.items.roomObjects.push({
          x: this.rand(this.width * 0.08, this.width * 0.92),
          y: this.rand(this.height * 0.45, this.height * 0.86),
          w: this.rand(35, 130),
          h: this.rand(28, 120),
          color: this.pick(["#78350f", "#334155", "#57534e", "#1e293b", "#7c2d12"])
        });
      }
    }

    generateWeather() {
      for (let i = 0; i < this.density(560); i++) {
        this.items.rain.push({
          x: this.rand(0, this.width),
          y: this.rand(0, this.height),
          len: this.rand(8, 25),
          speed: this.rand(360, 780),
          drift: this.rand(-100, -20),
          a: this.rand(0.16, 0.58)
        });
      }

      for (let i = 0; i < this.density(380); i++) {
        this.items.snow.push({
          x: this.rand(0, this.width),
          y: this.rand(0, this.height),
          r: this.rand(1, 3.8),
          speed: this.rand(18, 85),
          drift: this.rand(-24, 28),
          phase: this.rand(0, Math.PI * 2),
          a: this.rand(0.28, 0.92)
        });
      }
    }

    generateWordObjects() {
      const visualWords = this.parsed.words
        .filter((w) => w.length > 2)
        .slice(0, 80);

      for (const word of visualWords) {
        this.items.wordObjects.push({
          word,
          hash: hashString(word),
          x: this.rand(0, this.width),
          y: this.rand(0, this.height),
          size: this.rand(8, 32),
          speed: this.rand(4, 44),
          phase: this.rand(0, Math.PI * 2),
          color: this.pick([
            this.palette.accent,
            this.palette.accent2,
            "#f8fafc",
            "#facc15",
            "#fb7185",
            "#22d3ee"
          ])
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

      this.drawBackground(t);

      if (p.styles.voxel) this.drawVoxelWorld(t);
      else if (p.styles.pixel || p.gameMode === "pixel-arcade") this.drawPixelGame(t);
      else if (p.styles.platformer) this.drawPlatformer(t);
      else if (p.styles.racing) this.drawRacing(t);
      else if (p.scene === "space") this.drawSpace(t);
      else if (p.scene === "ocean") this.drawOcean(t);
      else if (p.scene === "forest" || p.scene === "farm") this.drawForest(t);
      else if (p.scene === "desert") this.drawDesert(t);
      else if (p.scene === "mountain") this.drawMountainScene(t);
      else if (p.scene === "room") this.drawRoom(t);
      else if (p.scene === "dungeon") this.drawDungeon(t);
      else if (p.scene === "city" || p.scene === "track") this.drawCity(t);
      else this.drawAbstract(t);

      if (p.objects.dragon || p.styles.fantasy) this.drawFantasyLayer(t);
      if (p.objects.robot || p.styles.scifi) this.drawSciFiLayer(t);
      if (p.objects.rain) this.drawRain(t);
      if (p.objects.snow) this.drawSnow(t);
      if (p.objects.fog) this.drawFog(t);

      this.drawPromptWordLayer(t);
      this.drawStyleOverlay(t);
      this.drawGrain(t);

      if (p.styles.cinematic) this.drawCinematicBars();

      ctx.restore();
      this.frame++;
    }

    camera(t) {
      const p = this.world.parsed;
      const speed = p.modifiers.speed;
      const chaos = p.modifiers.chaos;
      const cinematic = p.styles.cinematic ? 1 : 0.45;

      return {
        x: Math.sin(t * 0.55 * speed) * 8 * cinematic + Math.sin(t * 18) * chaos * 2,
        y: Math.cos(t * 0.4 * speed) * 4 * cinematic + Math.cos(t * 15) * chaos * 2,
        zoom: 1 + Math.sin(t * 0.18) * 0.014 * cinematic
      };
    }

    drawBackground(t) {
      const ctx = this.ctx;
      const pal = this.world.palette;

      const g = ctx.createLinearGradient(0, 0, 0, this.h);
      g.addColorStop(0, pal.skyTop);
      g.addColorStop(0.5, pal.skyMid);
      g.addColorStop(1, pal.skyBottom);
      ctx.fillStyle = g;
      ctx.fillRect(-30, -30, this.w + 60, this.h + 60);

      if (!this.world.parsed.objects.night && this.world.parsed.scene !== "space") {
        this.drawSun(this.w * 0.78, this.h * 0.22, 46, pal.sun);
      }

      if (this.world.parsed.objects.night || this.world.parsed.scene === "space") {
        this.drawStars(t);
      }

      if (this.world.parsed.objects.clouds || this.world.parsed.scene !== "space") {
        this.drawClouds(t);
      }
    }

    drawSun(x, y, r, color) {
      const ctx = this.ctx;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
      glow.addColorStop(0, color);
      glow.addColorStop(0.36, colorWithAlpha(color, 0.34));
      glow.addColorStop(1, "rgba(255,255,255,0)");
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
      const night = this.world.parsed.objects.night;
      const color = night ? "180,190,210" : "255,255,255";

      for (const c of this.world.items.clouds) {
        const x = ((c.x + t * c.speed) % (this.w + c.w * 2)) - c.w;
        const y = c.y + Math.sin(t * 0.4 + c.x) * 3;
        ctx.fillStyle = `rgba(${color},${c.alpha})`;
        ctx.beginPath();
        ctx.ellipse(x, y, c.w * 0.35, c.h * 0.72, 0, 0, Math.PI * 2);
        ctx.ellipse(x + c.w * 0.24, y - c.h * 0.35, c.w * 0.34, c.h, 0, 0, Math.PI * 2);
        ctx.ellipse(x + c.w * 0.56, y, c.w * 0.45, c.h * 0.82, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawCity(t) {
      this.drawBuildings(t);
      this.drawRoad(t);
      if (this.world.parsed.objects.cars) this.drawCars(t);
      if (this.world.parsed.objects.people) this.drawPeople(t);
      if (this.world.parsed.objects.birds) this.drawBirds(t);
    }

    drawBuildings(t) {
      const ctx = this.ctx;
      const p = this.world.parsed;
      const pal = this.world.palette;

      for (const b of this.world.items.buildings) {
        ctx.fillStyle = p.objects.night ? "#020617" : "#1e293b";
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = "rgba(255,255,255,0.07)";
        ctx.strokeRect(b.x, b.y, b.w, b.h);

        for (let iy = 0; iy < b.rows; iy++) {
          for (let ix = 0; ix < b.cols; ix++) {
            const flicker = Math.sin(ix * 7.13 + iy * 11.91 + b.phase + t * 1.8);
            if (flicker > -0.15) {
              ctx.fillStyle =
                p.styles.synthwave || p.styles.scifi
                  ? ix % 2
                    ? pal.accent
                    : pal.accent2
                  : "rgba(255,226,130,0.82)";
              ctx.fillRect(b.x + 7 + ix * 13, b.y + 8 + iy * 17, 5, 8);
            }
          }
        }
      }
    }

    drawRoad(t) {
      const ctx = this.ctx;
      ctx.fillStyle = this.world.parsed.objects.rain ? "#111827" : "#1f2937";
      ctx.fillRect(0, this.h * 0.78, this.w, this.h * 0.22);

      ctx.strokeStyle = this.world.parsed.styles.synthwave
        ? "rgba(0,245,255,0.8)"
        : "rgba(255,255,255,0.35)";
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
        const x = ((car.x + t * car.speed * this.world.parsed.modifiers.speed) % (this.w + 260)) - 130;
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
      this.roundRect(-w / 2, -h, w, h, 8 * scale);
      ctx.fill();

      ctx.fillStyle = "rgba(180,220,255,0.8)";
      this.roundRect(-w * 0.22, -h * 1.48, w * 0.42, h * 0.55, 6 * scale);
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
        const x =
          ((person.x + t * person.speed * this.world.parsed.modifiers.speed) %
            (this.w + 80)) -
          40;
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
      this.roundRect(x - s * 0.34, y - s * 2.35, s * 0.68, s * 1.1, 5 * scale);
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

    drawForest(t) {
      this.drawMountains(t);
      this.drawGround(this.world.palette.ground, 0.68);

      const trees = this.world.items.trees.slice().sort((a, b) => a.y - b.y);
      for (const tree of trees) {
        this.drawTree(tree.x, tree.y, tree.w, tree.h, tree.layer);
      }

      if (this.world.parsed.objects.animals) this.drawAnimals(t);
      if (this.world.parsed.objects.birds) this.drawBirds(t);
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
      ctx.fillStyle = "#075985";
      ctx.fillRect(0, this.h * 0.56, this.w, this.h * 0.5);

      const water = ctx.createLinearGradient(0, this.h * 0.56, 0, this.h);
      water.addColorStop(0, "rgba(14,165,233,0.76)");
      water.addColorStop(1, "rgba(3,7,18,0.62)");
      ctx.fillStyle = water;
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

      if (this.world.parsed.objects.birds) this.drawBirds(t);
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
        ctx.fillStyle = `rgba(180,83,9,${0.18 + i * 0.08})`;
        ctx.fill();
      }
    }

    drawMountainScene(t) {
      this.drawMountains(t);
      this.drawGround("#1f2937", 0.74);
      if (this.world.parsed.objects.birds) this.drawBirds(t);
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
      this.ctx.fillStyle = color;
      this.ctx.fillRect(0, this.h * start, this.w, this.h * (1 - start));
    }

    drawRoom(t) {
      const ctx = this.ctx;
      ctx.fillStyle = "#292524";
      ctx.fillRect(0, 0, this.w, this.h);

      const wall = ctx.createLinearGradient(0, 0, 0, this.h);
      wall.addColorStop(0, "#44403c");
      wall.addColorStop(1, "#1c1917");
      ctx.fillStyle = wall;
      ctx.fillRect(0, 0, this.w, this.h * 0.68);

      ctx.fillStyle = "#1f2937";
      ctx.fillRect(0, this.h * 0.68, this.w, this.h * 0.32);

      for (const o of this.world.items.roomObjects) {
        ctx.fillStyle = o.color;
        this.roundRect(o.x, o.y, o.w, o.h, 9);
        ctx.fill();
      }
    }

    drawDungeon(t) {
      const ctx = this.ctx;
      ctx.fillStyle = "#111827";
      ctx.fillRect(0, 0, this.w, this.h);

      const tile = Math.max(32, Math.floor(this.w / 24));
      for (let y = 0; y < this.h; y += tile) {
        for (let x = 0; x < this.w; x += tile) {
          ctx.fillStyle = (x / tile + y / tile) % 2 ? "#1f2937" : "#0f172a";
          ctx.fillRect(x, y, tile, tile);
          ctx.strokeStyle = "rgba(255,255,255,0.05)";
          ctx.strokeRect(x, y, tile, tile);
        }
      }

      this.drawGameItems(t);
    }

    drawSpace(t) {
      const ctx = this.ctx;
      const pal = this.world.palette;
      for (let i = 0; i < 8; i++) {
        const x = this.w * 0.2 + i * this.w * 0.08 + Math.sin(t * 0.4 + i) * 30;
        const y = this.h * 0.34 + Math.cos(t * 0.3 + i) * 25;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 170);
        g.addColorStop(0, i % 2 ? colorWithAlpha(pal.accent, 0.13) : colorWithAlpha(pal.accent2, 0.12));
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, this.w, this.h);
      }

      const px = this.w * 0.7 + Math.sin(t * 0.2) * 20;
      const py = this.h * 0.42 + Math.cos(t * 0.17) * 12;
      const planet = ctx.createRadialGradient(px - 35, py - 35, 4, px, py, 120);
      planet.addColorStop(0, pal.accent);
      planet.addColorStop(0.55, pal.accent2);
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

    drawVoxelWorld(t) {
      const ctx = this.ctx;
      const p = this.world.parsed;
      const pal = this.world.palette;

      this.drawVoxelSunAndClouds(t);

      for (const b of this.world.items.blocks) {
        this.drawBlock(b.x, b.y, b.s, b.type, b.shade);
      }

      if (p.objects.cubes || p.styles.voxel) {
        for (let i = 0; i < 18; i++) {
          const s = 30 + (i % 5) * 7;
          const x = (i * 89 + Math.sin(t + i) * 10) % this.w;
          const y = this.h * 0.46 + Math.sin(t * 0.7 + i) * 35;
          this.drawIsoCube(x, y, s, i % 2 ? pal.accent : pal.accent2);
        }
      }

      if (p.objects.people) this.drawBlockyPeople(t);
      if (p.objects.animals) this.drawBlockyAnimals(t);
    }

    drawVoxelSunAndClouds(t) {
      const ctx = this.ctx;
      ctx.fillStyle = this.world.palette.sun;
      ctx.fillRect(this.w * 0.78, this.h * 0.18, 58, 58);

      ctx.fillStyle = "rgba(255,255,255,0.5)";
      for (let i = 0; i < 8; i++) {
        const x = ((i * 180 + t * 20) % (this.w + 120)) - 80;
        const y = 70 + (i % 3) * 35;
        ctx.fillRect(x, y, 80, 24);
        ctx.fillRect(x + 22, y - 18, 50, 24);
      }
    }

    drawBlock(x, y, s, type, shade) {
      const ctx = this.ctx;
      const colors = {
        grass: ["#22c55e", "#15803d"],
        dirt: ["#92400e", "#78350f"],
        stone: ["#78716c", "#57534e"],
        sand: ["#facc15", "#ca8a04"],
        water: ["#0284c7", "#075985"]
      };
      const c = colors[type] || colors.dirt;
      ctx.fillStyle = c[0];
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = c[1];
      ctx.fillRect(x, y + s * 0.68, s, s * 0.32);
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.strokeRect(x, y, s, s);
    }

    drawIsoCube(x, y, s, color) {
      const ctx = this.ctx;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = colorWithAlpha("#000000", 0.18);
      ctx.fillRect(x, y + s * 0.7, s, s * 0.3);
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.strokeRect(x, y, s, s);
    }

    drawBlockyPeople(t) {
      const ctx = this.ctx;
      for (let i = 0; i < 12; i++) {
        const x = ((i * 100 + t * 25) % (this.w + 100)) - 50;
        const y = this.h * 0.68 + Math.sin(i) * 40;
        ctx.fillStyle = "#2563eb";
        ctx.fillRect(x, y, 20, 42);
        ctx.fillStyle = "#d6a77a";
        ctx.fillRect(x - 2, y - 22, 24, 22);
      }
    }

    drawBlockyAnimals(t) {
      const ctx = this.ctx;
      for (let i = 0; i < 8; i++) {
        const x = ((i * 140 + t * 18) % (this.w + 120)) - 60;
        const y = this.h * 0.72 + Math.sin(i) * 35;
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(x, y, 44, 24);
        ctx.fillRect(x + 34, y - 12, 18, 18);
        ctx.fillStyle = "#111827";
        ctx.fillRect(x + 39, y - 6, 4, 4);
      }
    }

    drawPixelGame(t) {
      const ctx = this.ctx;
      const pixel = Math.max(4, Math.floor(this.w / 180));
      ctx.imageSmoothingEnabled = false;

      this.drawPixelGrid(pixel);
      this.drawPlatforms(t);
      this.drawGameItems(t);
      this.drawPixelHero(t);

      ctx.imageSmoothingEnabled = true;
    }

    drawPixelGrid(pixel) {
      const ctx = this.ctx;
      ctx.strokeStyle = "rgba(255,255,255,0.045)";
      ctx.lineWidth = 1;

      for (let x = 0; x < this.w; x += pixel * 8) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.h);
        ctx.stroke();
      }

      for (let y = 0; y < this.h; y += pixel * 8) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.w, y);
        ctx.stroke();
      }
    }

    drawPlatforms(t) {
      const ctx = this.ctx;
      for (const pl of this.world.items.platforms) {
        ctx.fillStyle = pl.type === "metal" ? "#64748b" : pl.type === "wood" ? "#92400e" : "#22c55e";
        ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillRect(pl.x, pl.y + pl.h * 0.65, pl.w, pl.h * 0.35);
      }
    }

    drawGameItems(t) {
      const ctx = this.ctx;

      if (this.world.parsed.objects.coins || this.world.parsed.styles.arcade || this.world.parsed.styles.platformer) {
        for (const c of this.world.items.coins) {
          const wobble = Math.sin(t * 4 + c.phase);
          ctx.fillStyle = "#facc15";
          ctx.beginPath();
          ctx.ellipse(c.x, c.y, c.r * (0.35 + Math.abs(wobble) * 0.65), c.r, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#ca8a04";
          ctx.stroke();
        }
      }

      for (const e of this.world.items.enemies) {
        const x = e.x + Math.sin(t * 1.8 + e.phase) * 40;
        const y = e.y + Math.sin(t * 5 + e.phase) * 4;
        ctx.fillStyle = e.color;
        ctx.fillRect(x, y, e.s, e.s);
        ctx.fillStyle = "#fff";
        ctx.fillRect(x + e.s * 0.22, y + e.s * 0.25, e.s * 0.18, e.s * 0.18);
        ctx.fillRect(x + e.s * 0.62, y + e.s * 0.25, e.s * 0.18, e.s * 0.18);
      }
    }

    drawPixelHero(t) {
      const ctx = this.ctx;
      const x = this.w * 0.5 + Math.sin(t * 1.8) * 120;
      const y = this.h * 0.62 + Math.sin(t * 5) * 8;
      const s = 32;

      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(x - s / 2, y - s, s, s);
      ctx.fillStyle = "#d6a77a";
      ctx.fillRect(x - s * 0.35, y - s * 1.55, s * 0.7, s * 0.55);
      ctx.fillStyle = "#111827";
      ctx.fillRect(x - s * 0.2, y - s * 1.35, 5, 5);
      ctx.fillRect(x + s * 0.1, y - s * 1.35, 5, 5);
    }

    drawPlatformer(t) {
      this.drawPixelGame(t);
    }

    drawRacing(t) {
      const ctx = this.ctx;
      ctx.fillStyle = "#111827";
      ctx.fillRect(0, this.h * 0.45, this.w, this.h * 0.55);

      ctx.fillStyle = "#1f2937";
      ctx.beginPath();
      ctx.moveTo(this.w * 0.42, this.h * 0.45);
      ctx.lineTo(this.w * 0.58, this.h * 0.45);
      ctx.lineTo(this.w, this.h);
      ctx.lineTo(0, this.h);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 4;
      ctx.setLineDash([30, 30]);
      ctx.lineDashOffset = -t * 180;
      ctx.beginPath();
      ctx.moveTo(this.w * 0.5, this.h * 0.48);
      ctx.lineTo(this.w * 0.5, this.h);
      ctx.stroke();
      ctx.setLineDash([]);

      this.drawCars(t);
    }

    drawAbstract(t) {
      const ctx = this.ctx;
      const pal = this.world.palette;

      for (let i = 0; i < 40; i++) {
        const angle = t * 0.42 + i * 0.57;
        const radius = 40 + i * 9;
        const x = this.w / 2 + Math.cos(angle) * radius;
        const y = this.h / 2 + Math.sin(angle * 1.2) * radius * 0.55;
        const r = 22 + Math.sin(t + i) * 10 + i * 0.4;

        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
        g.addColorStop(0, i % 2 ? pal.accent : pal.accent2);
        g.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawAnimals(t) {
      const ctx = this.ctx;
      for (let i = 0; i < 7; i++) {
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

    drawFantasyLayer(t) {
      const ctx = this.ctx;
      const x = this.w * 0.7 + Math.sin(t) * 45;
      const y = this.h * 0.38 + Math.cos(t * 0.8) * 20;

      ctx.fillStyle = "rgba(124,58,237,0.45)";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 70, y + 45);
      ctx.lineTo(x - 15, y + 20);
      ctx.lineTo(x, y + 60);
      ctx.lineTo(x + 15, y + 20);
      ctx.lineTo(x + 70, y + 45);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(250,204,21,0.8)";
      ctx.beginPath();
      ctx.arc(x, y - 10, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    drawSciFiLayer(t) {
      const ctx = this.ctx;
      for (let i = 0; i < 5; i++) {
        const x = (i * 220 + t * 50) % (this.w + 120) - 60;
        const y = this.h * 0.22 + Math.sin(t + i) * 35;
        ctx.strokeStyle = "rgba(0,245,255,0.75)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 30, y);
        ctx.lineTo(x + 30, y);
        ctx.stroke();

        ctx.fillStyle = "rgba(0,245,255,0.25)";
        ctx.beginPath();
        ctx.ellipse(x, y, 44, 16, 0, 0, Math.PI * 2);
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
    }

    drawSnow(t) {
      const ctx = this.ctx;
      for (const s of this.world.items.snow) {
        const y = (s.y + t * s.speed) % (this.h + 30);
        const x = (s.x + Math.sin(t + s.phase) * 18 + t * s.drift + this.w) % this.w;
        ctx.fillStyle = `rgba(255,255,255,${s.a})`;
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
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

    drawPromptWordLayer(t) {
      const ctx = this.ctx;
      const p = this.world.parsed;

      for (const obj of this.world.items.wordObjects) {
        const h = obj.hash;
        const mode = h % 7;
        const x = (obj.x + Math.sin(t + obj.phase) * obj.speed) % this.w;
        const y = (obj.y + Math.cos(t * 0.7 + obj.phase) * obj.speed * 0.5 + this.h) % this.h;

        ctx.save();
        ctx.globalAlpha = 0.04 + ((h % 100) / 100) * 0.08;

        if (p.styles.pixel || p.styles.voxel) {
          ctx.fillStyle = obj.color;
          const s = obj.size;
          ctx.fillRect(x, y, s, s);
          if (mode % 2) ctx.fillRect(x + s * 0.4, y - s * 0.4, s, s);
        } else {
          ctx.fillStyle = obj.color;
          ctx.beginPath();
          if (mode === 0) ctx.arc(x, y, obj.size, 0, Math.PI * 2);
          else if (mode === 1) ctx.rect(x, y, obj.size * 1.5, obj.size);
          else {
            ctx.moveTo(x, y - obj.size);
            ctx.lineTo(x - obj.size, y + obj.size);
            ctx.lineTo(x + obj.size, y + obj.size);
            ctx.closePath();
          }
          ctx.fill();
        }

        ctx.restore();
      }
    }

    drawStyleOverlay(t) {
      const ctx = this.ctx;
      const p = this.world.parsed;

      if (p.styles.noir) {
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(0, 0, this.w, this.h);
        ctx.globalCompositeOperation = "saturation";
        ctx.fillStyle = "rgba(255,255,255,1)";
        ctx.fillRect(0, 0, this.w, this.h);
        ctx.globalCompositeOperation = "source-over";
      }

      if (p.styles.comic) {
        this.drawHalftone(t);
        ctx.strokeStyle = "rgba(0,0,0,0.28)";
        ctx.lineWidth = 5;
        ctx.strokeRect(8, 8, this.w - 16, this.h - 16);
      }

      if (p.styles.anime) {
        ctx.fillStyle = "rgba(255,255,255,0.035)";
        ctx.fillRect(0, 0, this.w, this.h);
        ctx.strokeStyle = "rgba(0,0,0,0.18)";
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, this.w, this.h);
      }

      if (p.styles.watercolor) {
        for (let i = 0; i < 12; i++) {
          ctx.fillStyle = `rgba(255,255,255,${0.018})`;
          ctx.beginPath();
          ctx.ellipse(
            (i * 97 + Math.sin(t + i) * 20) % this.w,
            (i * 53) % this.h,
            120,
            45,
            Math.sin(i),
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }

      if (p.styles.glitch) {
        for (let i = 0; i < 8; i++) {
          const y = Math.random() * this.h;
          const h = Math.random() * 8 + 2;
          ctx.fillStyle = i % 2 ? "rgba(0,255,255,0.08)" : "rgba(255,0,255,0.08)";
          ctx.fillRect(Math.random() * 20 - 10, y, this.w, h);
        }
      }

      const vignette = ctx.createRadialGradient(
        this.w * 0.5,
        this.h * 0.45,
        this.w * 0.1,
        this.w * 0.5,
        this.h * 0.5,
        this.w * 0.78
      );
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.36)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, this.w, this.h);
    }

    drawHalftone(t) {
      const ctx = this.ctx;
      ctx.fillStyle = "rgba(0,0,0,0.07)";
      const gap = 18;
      for (let y = 0; y < this.h; y += gap) {
        for (let x = 0; x < this.w; x += gap) {
          const r = 1.5 + Math.sin(x * 0.02 + y * 0.02 + t) * 1.2;
          ctx.beginPath();
          ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    drawGrain(t) {
      const ctx = this.ctx;
      const amount = Math.floor((this.w * this.h) / 1000);
      ctx.save();
      ctx.globalAlpha = this.world.parsed.styles.pixel ? 0.025 : 0.052;

      for (let i = 0; i < amount; i++) {
        const x = Math.random() * this.w;
        const y = Math.random() * this.h;
        const v = 130 + Math.random() * 125;
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

    roundRect(x, y, w, h, r) {
      const ctx = this.ctx;
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
      this.options.bitrate = Math.max(100000, Math.floor(Number(this.options.bitrate || DEFAULTS.bitrate)));

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
          frameCount: Math.floor(this.options.fps * this.options.seconds),
          mimeType: null,
          blob: null,
          url: null,
          frames,
          canvas: this.canvas
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

      const recorderOptions = {
        videoBitsPerSecond: this.options.bitrate
      };

      if (mimeType) recorderOptions.mimeType = mimeType;

      let recorder;
      try {
        recorder = new MediaRecorder(stream, recorderOptions);
      } catch (err) {
        recorder = new MediaRecorder(stream);
      }

      return new Promise((resolve, reject) => {
        const totalFrames = Math.floor(this.options.fps * this.options.seconds);
        const frameDuration = 1000 / this.options.fps;
        let start = performance.now();
        let stopped = false;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) chunks.push(event.data);
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

        const draw = () => {
          const now = performance.now();
          const elapsed = now - start;
          const currentFrame = Math.floor(elapsed / frameDuration);
          const t = currentFrame / this.options.fps;

          renderer.render(t);

          if (
            this.options.returnFrames &&
            currentFrame % Math.max(1, Math.floor(this.options.fps / 6)) === 0
          ) {
            frames.push(this.canvas.toDataURL("image/webp", this.options.quality));
          }

          if (currentFrame >= totalFrames) {
            try {
              recorder.stop();
            } catch (err) {
              reject(err);
            }

            for (const track of stream.getTracks()) track.stop();
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
    },

    version: "2.0.0-style-expanded"
  };

  global.RealLifeVideo = RealLifeVideo;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = RealLifeVideo;
  }
})(typeof window !== "undefined" ? window : globalThis);

  API:
    const data = await RealLifeVideo.generate(prompt, options)

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

  Notes:
  - No server.
  - No real AI model.
  - Uses Canvas + MediaRecorder.
  - Prompt words procedurally build visual parts.
*/

(function attachRealLifeVideo(global) {
  "use strict";

  const DEFAULTS = {
    width: 960,
    height: 540,
    fps: 30,
    seconds: 6,
    bitrate: 6000000,
    quality: 0.92,
    mimeType: "",
    appendCanvas: false,
    returnFrames: false,
    transparent: false,
    seed: null,
    debug: false
  };

  const TYPO_MAP = {
    teh: "the",
    tha: "that",
    tht: "that",
    dosent: "doesn't",
    doesnt: "doesn't",
    dont: "don't",
    cant: "can't",
    wont: "won't",
    opver: "over",
    ovre: "over",
    lfie: "life",
    lik: "like",
    lkot: "lot",
    alot: "a lot",
    genrator: "generator",
    genrate: "generate",
    genrated: "generated",
    refrence: "reference",
    refrences: "references",
    anyt: "any",
    bitrte: "bitrate",
    bitratee: "bitrate",
    realstic: "realistic",
    realistc: "realistic",
    realisticaly: "realistically",
    realstically: "realistically",
    cinamatic: "cinematic",
    cinamtic: "cinematic",
    nigth: "night",
    nite: "night",
    raing: "rain",
    rian: "rain",
    wather: "weather",
    pepole: "people",
    peaple: "people",
    ppl: "people",
    vehical: "vehicle",
    vehicals: "vehicles",
    carz: "cars",
    buildng: "building",
    buildingss: "buildings",
    forrest: "forest",
    mountian: "mountain",
    mountians: "mountains",
    ocen: "ocean",
    watter: "water",
    sunet: "sunset",
    sunris: "sunrise",
    camra: "camera",
    movment: "movement",
    movign: "moving",
    glwoing: "glowing",
    glowng: "glowing",
    foggyy: "foggy",
    blury: "blurry",
    smoothe: "smooth",
    pixle: "pixel",
    pixles: "pixels",
    voxle: "voxel",
    minecarft: "minecraft",
    minecrft: "minecraft",
    mnecraft: "minecraft"
  };

  const STYLE_ALIASES = {
    twoD: ["2d", "flat", "cartoon", "side scroller", "side-scroller", "vector"],
    threeD: ["3d", "depth", "volumetric", "perspective"],
    pixel: ["pixel", "pixelart", "pixel art", "8bit", "8-bit", "16bit", "16-bit", "retro game"],
    voxel: ["voxel", "blocky", "blocks", "cubes", "mc", "minecraft", "craft", "sandbox"],
    lowpoly: ["low poly", "low-poly", "polygon", "faceted"],
    realistic: ["realistic", "real life", "lifelike", "natural", "documentary", "photoreal"],
    cinematic: ["cinematic", "movie", "film", "epic", "anamorphic"],
    anime: ["anime", "manga", "cel shade", "cel-shaded", "cel shaded"],
    comic: ["comic", "ink", "halftone", "graphic novel"],
    watercolor: ["watercolor", "paint", "painterly", "brush"],
    clay: ["clay", "claymation", "stop motion", "toy"],
    noir: ["noir", "black and white", "monochrome", "detective"],
    synthwave: ["synthwave", "retrowave", "outrun", "neon"],
    horror: ["horror", "scary", "creepy", "haunted", "dark"],
    fantasy: ["fantasy", "magic", "dragon", "castle", "wizard"],
    scifi: ["sci-fi", "scifi", "science fiction", "future", "spaceship", "cyber"],
    arcade: ["arcade", "score", "coin", "boss", "powerup"],
    platformer: ["platformer", "jump", "platform", "side view"],
    racing: ["racing", "race", "speed", "drift", "cars", "track"],
    rpg: ["rpg", "quest", "village", "inventory", "hero"],
    shooter: ["shooter", "laser", "blaster", "battle"],
    cozy: ["cozy", "warm", "soft", "cute"],
    glitch: ["glitch", "corrupt", "datamosh", "static"],
    vapor: ["vaporwave", "pastel", "mallsoft"],
    chalk: ["chalk", "sketch", "pencil", "hand drawn", "hand-drawn"]
  };

  const SCENE_ALIASES = {
    city: ["city", "street", "downtown", "urban", "alley", "skyscraper", "buildings"],
    forest: ["forest", "woods", "trees", "jungle", "nature"],
    ocean: ["ocean", "sea", "beach", "shore", "waves", "island"],
    desert: ["desert", "sand", "dunes", "cactus"],
    mountain: ["mountain", "valley", "cliff", "hills"],
    space: ["space", "galaxy", "stars", "planet", "nebula", "moon"],
    room: ["room", "house", "apartment", "kitchen", "bedroom", "office", "indoor"],
    farm: ["farm", "field", "barn", "crops"],
    dungeon: ["dungeon", "cave", "ruins", "temple"],
    track: ["track", "road", "highway", "raceway"],
    village: ["village", "town", "market"],
    abstract: ["abstract", "dream", "surreal", "particles"]
  };

  const OBJECT_ALIASES = {
    people: ["people", "person", "human", "crowd", "walking"],
    cars: ["car", "cars", "traffic", "vehicle", "vehicles"],
    birds: ["bird", "birds", "seagull", "seagulls"],
    animals: ["animal", "animals", "dog", "cat", "deer", "horse"],
    rain: ["rain", "rainy", "storm", "wet"],
    snow: ["snow", "snowy", "winter", "ice"],
    fog: ["fog", "foggy", "mist", "misty"],
    fire: ["fire", "flame", "explosion", "lava"],
    water: ["water", "river", "lake", "pool"],
    clouds: ["cloud", "clouds", "cloudy"],
    sun: ["sun", "sunny", "bright"],
    sunset: ["sunset", "sunrise", "golden hour"],
    night: ["night", "midnight", "dark"],
    robot: ["robot", "android", "mech"],
    dragon: ["dragon"],
    castle: ["castle"],
    sword: ["sword"],
    coins: ["coin", "coins", "gold"],
    hearts: ["heart", "hearts", "health"],
    cubes: ["cube", "cubes", "block", "blocks"]
  };

  const WORD_EFFECTS = {
    blue: { color: "#3b82f6" },
    red: { color: "#ef4444" },
    green: { color: "#22c55e" },
    yellow: { color: "#eab308" },
    purple: { color: "#a855f7" },
    pink: { color: "#ec4899" },
    orange: { color: "#f97316" },
    gold: { color: "#facc15" },
    silver: { color: "#cbd5e1" },
    black: { color: "#020617" },
    white: { color: "#f8fafc" },
    fast: { speed: 1.8 },
    speedy: { speed: 1.8 },
    slow: { speed: 0.55 },
    calm: { speed: 0.65 },
    chaos: { chaos: 1 },
    chaotic: { chaos: 1 },
    glowing: { glow: 1 },
    glow: { glow: 1 },
    huge: { scale: 1.55 },
    giant: { scale: 1.75 },
    tiny: { scale: 0.65 },
    small: { scale: 0.75 },
    many: { density: 1.5 },
    lots: { density: 1.5 },
    minimal: { density: 0.55 },
    empty: { density: 0.35 }
  };

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

