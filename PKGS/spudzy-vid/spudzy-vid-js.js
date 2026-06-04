/*
  Spudzy Vid / RealLifeVideo
  v6.0.0-any-prompt-video-core

  Browser-only procedural prompt-to-video generator.
  No server. No real AI model. Canvas + MediaRecorder only.

  Main idea:
  - Any text prompt works.
  - Typos are corrected.
  - Unknown words still affect the video through hashed visual tokens.
  - Supports command-style prompts:
      make a dragon fly in the rain in an rpg game with the effect fire
      make robot dance with effect neon glitch in cyberpunk city
      make car drift fast with effect lightning
*/

(function attachSpudzyVid(global) {
  "use strict";

  const VERSION = "6.0.0-any-prompt-video-core";

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
    debug: false,
    canvas: null,
    typoDistance: 2,
    wordLayerLimit: 260,
    maxParticles: 900
  };

  const TYPO_MAP = {
    teh: "the",
    tha: "that",
    tht: "that",
    thsi: "this",
    tihs: "this",
    adn: "and",
    annd: "and",
    wiht: "with",
    wih: "with",
    wit: "with",
    whith: "with",
    mak: "make",
    maek: "make",
    mkae: "make",
    mke: "make",
    makee: "make",
    creat: "create",
    crate: "create",
    genrate: "generate",
    genrated: "generated",
    genrator: "generator",
    vidueo: "video",
    vidoe: "video",
    videeo: "video",
    poromp: "prompt",
    porompt: "prompt",
    promt: "prompt",
    promp: "prompt",
    worss: "words",
    wrods: "words",
    enything: "anything",
    anytyhing: "anything",
    yo: "you",
    wil: "will",
    wiht: "with",
    fukllly: "fully",
    fullyy: "fully",
    responces: "responses",
    responce: "response",
    focueses: "focuses",
    focuse: "focus",
    focues: "focus",
    mnore: "more",
    morew: "more",
    lfie: "life",
    lif: "life",
    wel: "well",
    takw: "take",
    lon: "long",
    gper: "per",
    styel: "style",
    stlye: "style",
    effct: "effect",
    efct: "effect",
    efect: "effect",
    effets: "effects",
    dosent: "doesn't",
    doesnt: "doesn't",
    dont: "don't",
    cant: "can't",
    wont: "won't",
    opver: "over",
    ovre: "over",
    lik: "like",
    lkot: "lot",
    alot: "a lot",
    refrence: "reference",
    refrences: "references",
    realstic: "realistic",
    realistc: "realistic",
    cinamatic: "cinematic",
    cinamtic: "cinematic",
    cineamtic: "cinematic",
    nigth: "night",
    nite: "night",
    raing: "rain",
    rian: "rain",
    wather: "weather",
    wether: "weather",
    pepole: "people",
    peaple: "people",
    ppl: "people",
    humen: "human",
    vehical: "vehicle",
    vehicals: "vehicles",
    carz: "cars",
    buildng: "building",
    buildingss: "buildings",
    forrest: "forest",
    mountian: "mountain",
    mountians: "mountains",
    ocen: "ocean",
    oecan: "ocean",
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
    mnecraft: "minecraft",
    mcraft: "minecraft",
    robo: "robot",
    roboot: "robot",
    dragin: "dragon",
    dragn: "dragon",
    dragun: "dragon",
    firre: "fire",
    firey: "fiery",
    explotion: "explosion",
    explod: "explode",
    snowwy: "snowy",
    dessert: "desert",
    spac: "space",
    galxy: "galaxy",
    nebla: "nebula",
    cyper: "cyber",
    cyberpuk: "cyberpunk",
    cyberpnk: "cyberpunk",
    neonn: "neon",
    gltich: "glitch",
    gltichy: "glitch",
    retrro: "retro",
    horor: "horror",
    fanasty: "fantasy",
    scifi: "sci-fi",
    syfy: "sci-fi",
    anim: "anime",
    cartton: "cartoon",
    runing: "running",
    flyng: "flying",
    jumpng: "jumping",
    dancng: "dancing",
    spining: "spinning"
  };

  const DICT = {
    styles: {
      realistic: ["realistic", "real life", "lifelike", "photoreal", "documentary"],
      cinematic: ["cinematic", "movie", "film", "trailer", "epic", "anamorphic"],
      rpg: ["rpg", "quest", "hero", "fantasy game", "inventory", "party"],
      pixel: ["pixel", "pixel art", "pixelart", "8bit", "8-bit", "16bit", "retro game"],
      voxel: ["voxel", "blocky", "minecraft", "blocks", "cubes", "sandbox"],
      anime: ["anime", "manga", "cel shaded", "cel-shaded"],
      comic: ["comic", "ink", "halftone", "graphic novel"],
      cyberpunk: ["cyberpunk", "cyber city", "neon city", "future city"],
      synthwave: ["synthwave", "retrowave", "outrun", "neon"],
      horror: ["horror", "scary", "creepy", "haunted", "dark"],
      fantasy: ["fantasy", "magic", "dragon", "wizard", "castle"],
      scifi: ["sci-fi", "scifi", "science fiction", "robot", "spaceship", "cyber"],
      racing: ["racing", "race", "drift", "track", "highway"],
      platformer: ["platformer", "side scroller", "side-scroller", "jump"],
      arcade: ["arcade", "score", "boss", "coin", "powerup"],
      watercolor: ["watercolor", "paint", "painterly", "brush"],
      sketch: ["sketch", "pencil", "chalk", "hand drawn", "hand-drawn"],
      noir: ["noir", "black and white", "monochrome"],
      clay: ["clay", "claymation", "stop motion"],
      blueprint: ["blueprint", "schematic", "technical drawing"],
      matrix: ["matrix", "code rain", "green code"],
      dream: ["dream", "dreamy", "surreal", "liminal"],
      underwater: ["underwater", "reef", "submarine"],
      western: ["western", "cowboy", "saloon"],
      steampunk: ["steampunk", "brass", "gear", "gears"],
      glitch: ["glitch", "static", "datamosh", "corrupt"],
      vlog: ["vlog", "handheld", "phone video"],
      drone: ["drone", "aerial", "overhead"],
      timelapse: ["timelapse", "time lapse"],
      slowmo: ["slowmo", "slow motion", "slow-mo"]
    },

    scenes: {
      city: ["city", "street", "downtown", "urban", "alley", "skyscraper"],
      forest: ["forest", "woods", "trees", "jungle", "nature"],
      ocean: ["ocean", "sea", "beach", "shore", "waves", "island"],
      desert: ["desert", "sand", "dunes", "cactus"],
      mountain: ["mountain", "mountains", "valley", "cliff", "hills"],
      space: ["space", "galaxy", "stars", "planet", "nebula", "moon"],
      room: ["room", "house", "apartment", "kitchen", "bedroom", "office"],
      farm: ["farm", "field", "barn", "crops"],
      dungeon: ["dungeon", "cave", "ruins", "temple"],
      track: ["track", "road", "highway", "raceway"],
      village: ["village", "town", "market"],
      castle: ["castle", "kingdom", "palace"],
      volcano: ["volcano", "lava", "magma"],
      underwater: ["underwater", "reef", "coral", "submarine"],
      concert: ["concert", "stage", "music", "dj"],
      lab: ["lab", "laboratory", "science"],
      cyberspace: ["cyberspace", "digital world", "matrix"],
      abstract: ["abstract", "dream", "surreal", "particles"]
    },

    objects: {
      dragon: ["dragon", "wyvern"],
      robot: ["robot", "android", "mech"],
      people: ["people", "person", "human", "crowd", "hero", "character"],
      cars: ["car", "cars", "vehicle", "truck", "bus", "traffic"],
      birds: ["bird", "birds", "eagle", "seagull"],
      animals: ["animal", "animals", "dog", "cat", "deer", "horse", "wolf"],
      rain: ["rain", "rainy", "storm", "wet"],
      snow: ["snow", "snowy", "winter", "ice"],
      fog: ["fog", "foggy", "mist"],
      fire: ["fire", "flame", "flames", "explosion", "lava"],
      water: ["water", "river", "lake", "pool"],
      clouds: ["cloud", "clouds", "cloudy"],
      sun: ["sun", "sunny", "bright"],
      sunset: ["sunset", "sunrise", "golden hour"],
      night: ["night", "midnight", "dark"],
      castle: ["castle"],
      sword: ["sword", "blade"],
      coins: ["coin", "coins", "gold"],
      hearts: ["heart", "hearts", "health"],
      cubes: ["cube", "cubes", "block", "blocks"],
      spaceship: ["spaceship", "rocket", "ufo"],
      train: ["train", "railway"],
      boat: ["boat", "ship"],
      plane: ["plane", "airplane", "jet"],
      zombie: ["zombie", "undead"],
      ghost: ["ghost", "spirit"],
      dinosaur: ["dinosaur", "trex", "t-rex"],
      fish: ["fish", "shark", "whale"],
      butterfly: ["butterfly", "butterflies"],
      flowers: ["flower", "flowers"],
      lightning: ["lightning", "thunder"],
      portal: ["portal", "vortex", "wormhole"],
      text: ["text", "letters", "words"],
      music: ["music", "notes", "song", "beat"]
    },

    actions: {
      idle: ["idle", "stand", "pose", "wait"],
      walk: ["walk", "walking", "stroll"],
      run: ["run", "running", "sprint"],
      fly: ["fly", "flying", "soar"],
      jump: ["jump", "jumping", "bounce"],
      dance: ["dance", "dancing", "groove"],
      spin: ["spin", "spinning", "rotate", "twirl"],
      explode: ["explode", "exploding", "burst"],
      glow: ["glow", "glowing", "shine"],
      fall: ["fall", "falling", "drop"],
      rise: ["rise", "rising", "ascend"],
      chase: ["chase", "pursue"],
      drift: ["drift", "sliding"],
      swim: ["swim", "swimming"],
      fight: ["fight", "battle", "attack"],
      shoot: ["shoot", "laser", "blast"],
      build: ["build", "construct"],
      transform: ["transform", "morph", "change"],
      pulse: ["pulse", "beat"],
      zoom: ["zoom", "camera zoom"],
      shake: ["shake", "quake"],
      wave: ["wave", "waving"]
    },

    effects: {
      fire: ["fire", "flame", "burning"],
      neon: ["neon", "glow", "glowing", "electric"],
      glitch: ["glitch", "static", "corrupt", "datamosh"],
      ice: ["ice", "frozen", "frost"],
      rainbow: ["rainbow", "colorful", "prismatic"],
      magic: ["magic", "sparkle", "spell"],
      smoke: ["smoke", "dust"],
      lightning: ["lightning", "electric", "storm"],
      blur: ["blur", "blurry", "motion blur"],
      slowmo: ["slowmo", "slow motion", "slow-mo"],
      fast: ["fast", "speedy", "quick"],
      zoom: ["zoom", "dolly"],
      vhs: ["vhs", "tape", "retro video"],
      grain: ["grain", "film grain"],
      scanlines: ["scanline", "scanlines", "crt"],
      bloom: ["bloom", "bright glow"],
      ripple: ["ripple", "wave distortion"],
      pixelate: ["pixelate", "pixelated"],
      chromatic: ["chromatic", "rgb split"],
      hologram: ["hologram", "holo"],
      matrix: ["matrix", "code rain"],
      hearts: ["hearts", "love"],
      coins: ["coins", "gold"],
      stars: ["stars", "sparkles"]
    },

    colors: {
      blue: "#3b82f6",
      red: "#ef4444",
      green: "#22c55e",
      yellow: "#eab308",
      purple: "#a855f7",
      pink: "#ec4899",
      orange: "#f97316",
      gold: "#facc15",
      silver: "#cbd5e1",
      black: "#020617",
      white: "#f8fafc",
      cyan: "#22d3ee",
      teal: "#14b8a6",
      lime: "#84cc16",
      violet: "#8b5cf6",
      crimson: "#dc2626"
    },

    modifiers: {
      fast: { speed: 1.8 },
      speedy: { speed: 1.8 },
      turbo: { speed: 2.3 },
      slow: { speed: 0.55 },
      calm: { speed: 0.65 },
      chaos: { chaos: 1 },
      chaotic: { chaos: 1 },
      huge: { scale: 1.6 },
      giant: { scale: 1.85 },
      massive: { scale: 2.1 },
      tiny: { scale: 0.65 },
      small: { scale: 0.75 },
      many: { density: 1.55 },
      lots: { density: 1.55 },
      crowded: { density: 1.85 },
      army: { density: 2.25 },
      minimal: { density: 0.55 },
      empty: { density: 0.35 },
      shaky: { shake: 1 },
      smooth: { smooth: 1 },
      dreamy: { dream: 1 },
      epic: { epic: 1 },
      scary: { fear: 1 },
      cute: { cute: 1 }
    }
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function unique(arr) {
    return Array.from(new Set(arr));
  }

  function flatValues(obj) {
    return Object.values(obj).reduce((a, b) => a.concat(b), []);
  }

  function escapeRegExp(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

  function colorWithAlpha(hex, alpha) {
    const clean = String(hex || "#ffffff").replace("#", "");
    const n = parseInt(
      clean.length === 3
        ? clean.split("").map((c) => c + c).join("")
        : clean,
      16
    );
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function levenshtein(a, b, max = 99) {
    if (a === b) return 0;
    if (!a) return b.length;
    if (!b) return a.length;
    if (Math.abs(a.length - b.length) > max) return max + 1;

    const prev = new Array(b.length + 1);
    const curr = new Array(b.length + 1);

    for (let j = 0; j <= b.length; j++) prev[j] = j;

    for (let i = 1; i <= a.length; i++) {
      curr[0] = i;
      let rowMin = curr[0];

      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min(
          prev[j] + 1,
          curr[j - 1] + 1,
          prev[j - 1] + cost
        );
        if (curr[j] < rowMin) rowMin = curr[j];
      }

      if (rowMin > max) return max + 1;

      for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
    }

    return prev[b.length];
  }

  function buildKnownWords() {
    return unique(
      Object.keys(TYPO_MAP)
        .concat(Object.values(TYPO_MAP))
        .concat(flatValues(DICT.styles))
        .concat(flatValues(DICT.scenes))
        .concat(flatValues(DICT.objects))
        .concat(flatValues(DICT.actions))
        .concat(flatValues(DICT.effects))
        .concat(Object.keys(DICT.colors))
        .concat(Object.keys(DICT.modifiers))
    )
      .filter(Boolean)
      .map((x) => String(x).toLowerCase())
      .filter((x) => !x.includes(" "));
  }

  const KNOWN_WORDS = buildKnownWords();

  function collapseRepeats(word) {
    return String(word).replace(/([a-z])\1{2,}/gi, "$1$1");
  }

  function normalizePrompt(prompt, options = {}) {
    let text = String(prompt || "")
      .toLowerCase()
      .replace(/[“”]/g, "\"")
      .replace(/[’]/g, "'")
      .replace(/[_-]+/g, " ")
      .replace(/[^a-z0-9\s'".,:;!?/]+/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    const phraseFixes = {
      "with the efect": "with effect",
      "with the effect": "with effect",
      "using effect": "with effect",
      "add effect": "with effect",
      "make it": "make",
      "real life": "realistic",
      "black white": "black and white",
      "side scroller": "side-scroller",
      "mine craft": "minecraft",
      "slow motion": "slow motion",
      "time lapse": "timelapse",
      "r p g": "rpg"
    };

    for (const bad of Object.keys(phraseFixes)) {
      text = text.replace(
        new RegExp("\\b" + escapeRegExp(bad) + "\\b", "g"),
        phraseFixes[bad]
      );
    }

    const maxDistance =
      options.typoDistance == null ? DEFAULTS.typoDistance : options.typoDistance;

    const corrected = text.split(" ").filter(Boolean).map((raw) => {
      const word = collapseRepeats(raw.replace(/^['"]+|['"]+$/g, ""));

      if (TYPO_MAP[word]) return TYPO_MAP[word];
      if (word.length < 4 || /\d/.test(word)) return word;

      let best = word;
      let bestDistance = Infinity;
      const allowed = word.length >= 8 ? Math.max(maxDistance, 2) : maxDistance;

      for (const candidate of KNOWN_WORDS) {
        const d = levenshtein(word, candidate, allowed);
        if (d < bestDistance) {
          bestDistance = d;
          best = candidate;
        }
      }

      return bestDistance <= allowed ? best : word;
    });

    return corrected.join(" ").replace(/\s+/g, " ").trim();
  }

  function hasTerm(text, term) {
    return new RegExp("(?:^|\\b)" + escapeRegExp(term) + "(?:\\b|$)", "i").test(text);
  }

  function includesAny(text, list) {
    return list.some((term) => hasTerm(text, term));
  }

  function scoreAliases(text, aliases) {
    let score = 0;
    for (const alias of aliases) {
      if (hasTerm(text, alias)) score += alias.length + 2;
    }
    return score;
  }

  function flagsFromAliases(text, aliases) {
    const out = {};
    for (const key of Object.keys(aliases)) {
      out[key] = includesAny(text, aliases[key]);
    }
    return out;
  }

  function bestKeyByAliases(text, aliases, fallback) {
    let best = fallback;
    let bestScore = -1;

    for (const key of Object.keys(aliases)) {
      const score = scoreAliases(text, aliases[key]);
      if (score > bestScore) {
        bestScore = score;
        best = key;
      }
    }

    return bestScore > 0 ? best : fallback;
  }

  function extractCommand(text) {
    const command = {
      requested: false,
      object: null,
      action: null,
      effect: null,
      raw: null
    };

    const match = text.match(
      /\b(?:make|create|generate|spawn|show)\s+(.+?)(?:\s+(?:with|using|add)\s+(?:the\s+)?effect\s+(.+)|$)/i
    );

    if (!match) return command;

    command.requested = true;
    command.raw = match[0];

    const core = match[1].trim();
    command.effect = match[2]
      ? match[2].trim().split(/\s+/).slice(0, 8).join(" ")
      : null;

    let foundObject = null;
    let foundAction = null;

    for (const key of Object.keys(DICT.objects)) {
      if (includesAny(core, DICT.objects[key].concat([key]))) {
        foundObject = key;
        break;
      }
    }

    for (const key of Object.keys(DICT.actions)) {
      if (includesAny(core, DICT.actions[key].concat([key]))) {
        foundAction = key;
        break;
      }
    }

    const parts = core.split(/\s+/).filter(Boolean);

    command.object = foundObject || parts[0] || null;
    command.action =
      foundAction ||
      parts.slice(1).find((w) => !["a", "an", "the", "it", "in", "with"].includes(w)) ||
      "idle";

    return command;
  }

  function parsePrompt(prompt, options = {}) {
    const originalPrompt = String(prompt || "");
    const correctedPrompt = normalizePrompt(originalPrompt, options);
    const text = correctedPrompt;
    const words = unique(text.split(/\s+/).filter(Boolean));

    const styles = flagsFromAliases(text, DICT.styles);
    const objects = flagsFromAliases(text, DICT.objects);
    const actions = flagsFromAliases(text, DICT.actions);
    const effects = flagsFromAliases(text, DICT.effects);

    const sceneScores = {};
    for (const key of Object.keys(DICT.scenes)) {
      sceneScores[key] = scoreAliases(text, DICT.scenes[key]);
    }

    const scene = bestKeyByAliases(text, DICT.scenes, "abstract");
    const command = extractCommand(text);

    if (scene === "city") {
      objects.cars = objects.cars || hasTerm(text, "street") || hasTerm(text, "traffic");
      objects.people = objects.people || hasTerm(text, "walking");
    }

    if (scene === "ocean" || scene === "underwater") {
      objects.water = true;
      objects.birds = objects.birds || hasTerm(text, "beach") || hasTerm(text, "shore");
    }

    if (scene === "space") {
      objects.clouds = false;
      objects.spaceship = objects.spaceship || styles.scifi;
    }

    if (styles.voxel) objects.cubes = true;
    if (styles.rpg) styles.fantasy = true;
    if (effects.fire) objects.fire = true;
    if (effects.lightning) objects.lightning = true;
    if (effects.hearts) objects.hearts = true;
    if (effects.coins) objects.coins = true;

    if (command.object && DICT.objects[command.object]) {
      objects[command.object] = true;
    }

    if (command.action && DICT.actions[command.action]) {
      actions[command.action] = true;
    }

    if (command.effect) {
      for (const key of Object.keys(DICT.effects)) {
        if (includesAny(command.effect, DICT.effects[key].concat([key]))) {
          effects[key] = true;
        }
      }
    }

    const modifiers = {
      speed: 1,
      density: 1,
      scale: 1,
      glow: 0,
      chaos: 0,
      shake: 0,
      zoom: 0,
      dream: 0,
      epic: 0,
      fear: 0,
      cute: 0,
      colors: []
    };

    for (const word of words) {
      if (DICT.colors[word]) {
        modifiers.colors.push(DICT.colors[word]);
      }

      const mod = DICT.modifiers[word];
      if (!mod) continue;

      if (mod.speed) modifiers.speed *= mod.speed;
      if (mod.density) modifiers.density *= mod.density;
      if (mod.scale) modifiers.scale *= mod.scale;
      if (mod.chaos) modifiers.chaos += mod.chaos;
      if (mod.shake) modifiers.shake += mod.shake;
      if (mod.dream) modifiers.dream += mod.dream;
      if (mod.epic) modifiers.epic += mod.epic;
      if (mod.fear) modifiers.fear += mod.fear;
      if (mod.cute) modifiers.cute += mod.cute;
    }

    if (effects.neon || effects.bloom) modifiers.glow += 1;
    if (effects.glitch) modifiers.chaos += 0.75;
    if (effects.fast) modifiers.speed *= 1.7;
    if (effects.slowmo || styles.slowmo) modifiers.speed *= 0.55;
    if (actions.run || actions.fly || actions.drift) modifiers.speed *= 1.25;
    if (actions.shake) modifiers.shake += 1;

    const gameMode =
      styles.voxel ? "voxel-sandbox" :
      styles.pixel ? "pixel-arcade" :
      styles.racing ? "racing" :
      styles.platformer ? "platformer" :
      styles.rpg ? "rpg" :
      styles.shooter ? "shooter" :
      styles.arcade ? "arcade" :
      "cinematic-sim";

    const promptSignature = words.map((word) => {
      const h = hashString(word);
      return {
        word,
        hash: h,
        influence: {
          hue: h % 360,
          shape: h % 7,
          motion: h % 5,
          size: 8 + (h % 34)
        }
      };
    });

    return {
      originalPrompt,
      correctedPrompt,
      words,
      promptSignature,
      scene,
      sceneScores,
      styles,
      objects,
      actions,
      effects,
      command,
      modifiers,
      gameMode,
      referenceMode: {
        requested:
          hasTerm(text, "reference") ||
          text.includes("style of") ||
          hasTerm(text, "like"),
        note: "Reference words are broad procedural hints, not exact copies."
      }
    };
  }

  function chooseMimeType(preferred) {
    if (typeof MediaRecorder === "undefined") return "";

    if (preferred && MediaRecorder.isTypeSupported(preferred)) {
      return preferred;
    }

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
        roomObjects: [],
        rain: [],
        snow: [],
        wordObjects: [],
        sparks: [],
        icons: []
      };

      this.generate();
    }

    rand(min = 0, max = 1) {
      return min + this.rng() * (max - min);
    }

    pick(arr) {
      return arr[Math.floor(this.rand(0, arr.length))];
    }

    density(base) {
      return Math.max(1, Math.floor(base * this.parsed.modifiers.density));
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

      if (p.styles.rpg || p.styles.fantasy || p.objects.dragon) {
        return {
          skyTop: "#312e81",
          skyMid: "#6d28d9",
          skyBottom: "#111827",
          ground: "#14532d",
          dark: "#020617",
          light: "#fef3c7",
          accent: "#f97316",
          accent2: "#a855f7",
          sun: "#fde68a"
        };
      }

      if (p.styles.cyberpunk || p.styles.synthwave || p.effects.neon) {
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

      if (p.styles.pixel || p.effects.matrix) {
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

      if (p.scene === "ocean" || p.scene === "underwater") {
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
      this.generateSparks();
      this.generateIcons();
    }

    generateStars() {
      for (let i = 0; i < this.density(260); i++) {
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
      for (let i = 0; i < this.density(34); i++) {
        this.items.clouds.push({
          x: this.rand(-this.width, this.width),
          y: this.rand(30, this.height * 0.45),
          w: this.rand(90, 320),
          h: this.rand(22, 80),
          speed: this.rand(4, 28),
          alpha: this.rand(0.05, 0.25)
        });
      }
    }

    generateParticles() {
      const count = Math.min(this.options.maxParticles, this.density(320));
      for (let i = 0; i < count; i++) {
        this.items.particles.push({
          x: this.rand(0, this.width),
          y: this.rand(0, this.height),
          vx: this.rand(-0.9, 0.9),
          vy: this.rand(-0.7, 0.5),
          r: this.rand(0.6, 3.4),
          a: this.rand(0.08, 0.52),
          hue: this.rand(0, 360)
        });
      }
    }

    generateMountains() {
      for (let i = 0; i < 12; i++) {
        this.items.mountains.push({
          x: i * (this.width / 8) - this.rand(60, 140),
          base: this.rand(this.height * 0.55, this.height * 0.82),
          w: this.rand(170, 390),
          h: this.rand(120, 330),
          shade: this.rand(0.25, 0.78)
        });
      }
    }

    generateBuildings() {
      let x = -40;
      while (x < this.width + 120) {
        const w = this.rand(34, 95);
        const h = this.rand(this.height * 0.18, this.height * 0.6);

        this.items.buildings.push({
          x,
          y: this.height * 0.78 - h,
          w,
          h,
          rows: Math.max(2, Math.floor(h / 18)),
          cols: Math.max(2, Math.floor(w / 13)),
          phase: this.rand(0, 100)
        });

        x += w + this.rand(4, 14);
      }
    }

    generateCars() {
      for (let i = 0; i < this.density(24); i++) {
        this.items.cars.push({
          x: this.rand(-this.width, this.width),
          y: this.rand(this.height * 0.78, this.height * 0.93),
          speed: this.rand(35, 150) * (this.rng() > 0.5 ? 1 : -1),
          size: this.rand(0.65, 1.45) * this.parsed.modifiers.scale,
          color: this.pick(["#ef4444", "#3b82f6", "#eab308", "#f8fafc", "#22c55e", "#a855f7"])
        });
      }
    }

    generatePeople() {
      for (let i = 0; i < this.density(42); i++) {
        this.items.people.push({
          x: this.rand(0, this.width),
          y: this.rand(this.height * 0.7, this.height * 0.93),
          speed: this.rand(8, 48) * (this.rng() > 0.5 ? 1 : -1),
          scale: this.rand(0.55, 1.3) * this.parsed.modifiers.scale,
          phase: this.rand(0, Math.PI * 2),
          coat: this.pick(["#111827", "#1f2937", "#7f1d1d", "#172554", "#064e3b", "#581c87"])
        });
      }
    }

    generateBirds() {
      for (let i = 0; i < this.density(30); i++) {
        this.items.birds.push({
          x: this.rand(-100, this.width),
          y: this.rand(45, this.height * 0.42),
          speed: this.rand(20, 90),
          scale: this.rand(0.45, 1.35),
          phase: this.rand(0, Math.PI * 2)
        });
      }
    }

    generateTrees() {
      for (let i = 0; i < this.density(100); i++) {
        this.items.trees.push({
          x: this.rand(-60, this.width + 60),
          y: this.rand(this.height * 0.58, this.height),
          h: this.rand(55, 200),
          w: this.rand(18, 60),
          layer: this.rand(0, 1)
        });
      }
    }

    generateWaves() {
      for (let i = 0; i < 16; i++) {
        this.items.waves.push({
          y: this.height * (0.56 + i * 0.035),
          amp: this.rand(4, 18),
          freq: this.rand(0.006, 0.022),
          speed: this.rand(0.6, 2.2),
          alpha: this.rand(0.12, 0.36)
        });
      }
    }

    generateBlocks() {
      const block = Math.max(18, Math.floor(this.width / 48));

      for (let y = this.height * 0.54; y < this.height + block; y += block) {
        for (let x = -block; x < this.width + block; x += block) {
          this.items.blocks.push({
            x,
            y: y + Math.sin(x * 0.02 + this.seed) * block * 0.5,
            s: block,
            type: y < this.height * 0.65 ? "grass" : this.rng() > 0.3 ? "dirt" : "stone"
          });
        }
      }
    }

    generatePlatforms() {
      for (let i = 0; i < this.density(20); i++) {
        this.items.platforms.push({
          x: this.rand(0, this.width),
          y: this.rand(this.height * 0.35, this.height * 0.82),
          w: this.rand(70, 220),
          h: this.rand(12, 34),
          type: this.pick(["grass", "metal", "stone", "wood"])
        });
      }
    }

    generateGameItems() {
      for (let i = 0; i < this.density(38); i++) {
        this.items.coins.push({
          x: this.rand(30, this.width - 30),
          y: this.rand(this.height * 0.25, this.height * 0.78),
          r: this.rand(6, 14),
          phase: this.rand(0, Math.PI * 2)
        });
      }

      for (let i = 0; i < this.density(15); i++) {
        this.items.enemies.push({
          x: this.rand(0, this.width),
          y: this.rand(this.height * 0.68, this.height * 0.9),
          s: this.rand(18, 45),
          phase: this.rand(0, Math.PI * 2),
          color: this.pick(["#ef4444", "#7c2d12", "#581c87", "#0f766e"])
        });
      }
    }

    generateRoomObjects() {
      for (let i = 0; i < this.density(20); i++) {
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
      for (let i = 0; i < this.density(600); i++) {
        this.items.rain.push({
          x: this.rand(0, this.width),
          y: this.rand(0, this.height),
          len: this.rand(8, 26),
          speed: this.rand(360, 800),
          drift: this.rand(-110, -20),
          a: this.rand(0.16, 0.58)
        });
      }

      for (let i = 0; i < this.density(420); i++) {
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
      const limit = this.options.wordLayerLimit || 260;
      const visualWords = this.parsed.words
        .filter((word) => word.length > 1)
        .slice(0, limit);

      for (const word of visualWords) {
        const h = hashString(word);
        this.items.wordObjects.push({
          word,
          hash: h,
          x: this.rand(0, this.width),
          y: this.rand(0, this.height),
          size: 8 + (h % 34),
          speed: 4 + (h % 52),
          phase: this.rand(0, Math.PI * 2),
          color: `hsl(${h % 360}, 90%, 65%)`
        });
      }
    }

    generateSparks() {
      for (let i = 0; i < this.density(150); i++) {
        this.items.sparks.push({
          x: this.rand(0, this.width),
          y: this.rand(0, this.height),
          r: this.rand(1, 5),
          h: this.rand(0, 360),
          phase: this.rand(0, Math.PI * 2),
          speed: this.rand(20, 120)
        });
      }
    }

    generateIcons() {
      for (let i = 0; i < this.density(60); i++) {
        this.items.icons.push({
          x: this.rand(0, this.width),
          y: this.rand(0, this.height),
          s: this.rand(8, 28),
          phase: this.rand(0, Math.PI * 2),
          speed: this.rand(15, 80)
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
      else if (p.styles.racing || p.scene === "track") this.drawRacing(t);
      else if (p.scene === "space") this.drawSpace(t);
      else if (p.scene === "ocean" || p.scene === "underwater") this.drawOcean(t);
      else if (p.scene === "forest" || p.scene === "farm") this.drawForest(t);
      else if (p.scene === "desert") this.drawDesert(t);
      else if (p.scene === "mountain") this.drawMountainScene(t);
      else if (p.scene === "dungeon" || p.scene === "castle") this.drawDungeon(t);
      else if (p.scene === "city" || p.scene === "factory") this.drawCity(t);
      else if (p.scene === "room" || p.scene === "lab") this.drawRoom(t);
      else this.drawAbstract(t);

      if (p.objects.dragon || p.styles.fantasy || p.styles.rpg) this.drawFantasyLayer(t);
      if (p.objects.robot || p.styles.scifi || p.objects.spaceship) this.drawSciFiLayer(t);
      if (p.objects.rain) this.drawRain(t);
      if (p.objects.snow) this.drawSnow(t);
      if (p.objects.fog) this.drawFog(t);
      if (p.objects.fire || p.effects.fire) this.drawFire(t);
      if (p.objects.lightning || p.effects.lightning) this.drawLightning(t);
      if (p.effects.matrix || p.styles.matrix) this.drawMatrix(t);
      if (p.effects.hearts || p.objects.hearts) this.drawFloatingHearts(t);
      if (p.effects.coins || p.objects.coins || p.styles.rpg) this.drawCoinBurst(t);
      if (p.effects.stars || p.effects.magic) this.drawSparkBurst(t);

      this.drawCommandSubject(t);
      this.drawPromptWordLayer(t);
      this.drawParticles(t);
      this.drawStyleOverlay(t);
      this.drawGrain();

      if (p.styles.cinematic || p.modifiers.epic) this.drawCinematicBars();

      ctx.restore();
      this.frame++;
    }

    camera(t) {
      const p = this.world.parsed;
      const speed = p.modifiers.speed;
      const chaos = p.modifiers.chaos + p.modifiers.shake;
      const cinematic = p.styles.cinematic ? 1 : 0.45;

      return {
        x: Math.sin(t * 0.55 * speed) * 8 * cinematic + Math.sin(t * 18) * chaos * 2,
        y: Math.cos(t * 0.4 * speed) * 4 * cinematic + Math.cos(t * 15) * chaos * 2,
        zoom: 1 + Math.sin(t * 0.18) * 0.014 * cinematic
      };
    }

    drawBackground(t) {
      const ctx = this.ctx;
      const p = this.world.parsed;
      const pal = this.world.palette;

      const g = ctx.createLinearGradient(0, 0, 0, this.h);
      g.addColorStop(0, pal.skyTop);
      g.addColorStop(0.5, pal.skyMid);
      g.addColorStop(1, pal.skyBottom);

      ctx.fillStyle = g;
      ctx.fillRect(-60, -60, this.w + 120, this.h + 120);

      if (!p.objects.night && p.scene !== "space") {
        this.drawSun(this.w * 0.78, this.h * 0.22, 46, pal.sun);
      }

      if (p.objects.night || p.scene === "space") this.drawStars(t);
      if (p.objects.clouds || p.scene !== "space") this.drawClouds(t);
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
                p.styles.synthwave || p.styles.scifi || p.styles.cyberpunk
                  ? ix % 2 ? pal.accent : pal.accent2
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

      ctx.strokeStyle =
        this.world.parsed.styles.synthwave || this.world.parsed.styles.cyberpunk
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
        const x =
          ((car.x + t * car.speed * this.world.parsed.modifiers.speed) %
            (this.w + 260)) -
          130;

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
      this.drawMountains();
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
      this.drawMountains();
      this.drawGround("#1f2937", 0.74);
      if (this.world.parsed.objects.birds) this.drawBirds(t);
    }

    drawMountains() {
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

    drawRoom() {
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
      const tile = Math.max(32, Math.floor(this.w / 24));

      ctx.fillStyle = "#111827";
      ctx.fillRect(0, 0, this.w, this.h);

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

      ctx.fillStyle = pal.sun;
      ctx.fillRect(this.w * 0.78, this.h * 0.18, 58, 58);

      ctx.fillStyle = "rgba(255,255,255,0.5)";
      for (let i = 0; i < 8; i++) {
        const x = ((i * 180 + t * 20) % (this.w + 120)) - 80;
        const y = 70 + (i % 3) * 35;
        ctx.fillRect(x, y, 80, 24);
        ctx.fillRect(x + 22, y - 18, 50, 24);
      }

      for (const b of this.world.items.blocks) {
        this.drawBlock(b.x, b.y, b.s, b.type);
      }

      for (let i = 0; i < 18; i++) {
        const s = 30 + (i % 5) * 7;
        const x = (i * 89 + Math.sin(t + i) * 10) % this.w;
        const y = this.h * 0.46 + Math.sin(t * 0.7 + i) * 35;
        this.drawCube(x, y, s, i % 2 ? pal.accent : pal.accent2);
      }

      if (p.objects.people) this.drawBlockyPeople(t);
      if (p.objects.animals) this.drawBlockyAnimals(t);
    }

    drawBlock(x, y, s, type) {
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

    drawCube(x, y, s, color) {
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

      this.drawPlatforms();
      this.drawGameItems(t);
      this.drawPixelHero(t);

      ctx.imageSmoothingEnabled = true;
    }

    drawPlatforms() {
      const ctx = this.ctx;

      for (const pl of this.world.items.platforms) {
        ctx.fillStyle =
          pl.type === "metal" ? "#64748b" :
          pl.type === "wood" ? "#92400e" :
          "#22c55e";

        ctx.fillRect(pl.x, pl.y, pl.w, pl.h);

        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillRect(pl.x, pl.y + pl.h * 0.65, pl.w, pl.h * 0.35);
      }
    }

    drawGameItems(t) {
      const ctx = this.ctx;
      const p = this.world.parsed;

      if (
        p.objects.coins ||
        p.styles.arcade ||
        p.styles.platformer ||
        p.styles.pixel ||
        p.styles.rpg ||
        p.effects.coins
      ) {
        for (const c of this.world.items.coins) {
          const wobble = Math.sin(t * 4 + c.phase);

          ctx.fillStyle = "#facc15";
          ctx.beginPath();
          ctx.ellipse(
            c.x,
            c.y,
            c.r * (0.35 + Math.abs(wobble) * 0.65),
            c.r,
            0,
            0,
            Math.PI * 2
          );
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

      for (let i = 0; i < 58; i++) {
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

    drawFire(t) {
      const ctx = this.ctx;

      for (let i = 0; i < 32; i++) {
        const x = (i * 47 + Math.sin(t + i) * 30) % this.w;
        const y = this.h * 0.75 + Math.sin(t * 3 + i) * 20;
        const r = 20 + Math.sin(t * 5 + i) * 10;

        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2);
        g.addColorStop(0, "rgba(250,204,21,0.75)");
        g.addColorStop(0.45, "rgba(249,115,22,0.38)");
        g.addColorStop(1, "rgba(239,68,68,0)");

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawLightning(t) {
      const ctx = this.ctx;
      if (Math.sin(t * 7) < 0.35) return;

      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = 3;

      for (let i = 0; i < 3; i++) {
        let x = this.w * (0.2 + i * 0.27);
        let y = 0;

        ctx.beginPath();
        ctx.moveTo(x, y);

        for (let k = 0; k < 8; k++) {
          x += Math.sin(t * 20 + i + k) * 25;
          y += this.h * 0.08;
          ctx.lineTo(x, y);
        }

        ctx.stroke();
      }
    }

    drawMatrix(t) {
      const ctx = this.ctx;
      ctx.fillStyle = "rgba(0,255,120,0.18)";
      ctx.font = "16px monospace";

      for (let x = 0; x < this.w; x += 20) {
        const y = (t * 80 + x * 7) % this.h;
        ctx.fillText(String.fromCharCode(0x30A0 + ((x + y) | 0) % 96), x, y);
      }
    }

    drawFloatingHearts(t) {
      const ctx = this.ctx;

      for (const icon of this.world.items.icons) {
        const x = (icon.x + Math.sin(t + icon.phase) * 35) % this.w;
        const y = this.h - ((t * icon.speed + icon.y) % this.h);
        const s = icon.s;

        ctx.fillStyle = "rgba(236,72,153,0.38)";
        ctx.beginPath();
        ctx.arc(x - s * 0.25, y, s * 0.35, 0, Math.PI * 2);
        ctx.arc(x + s * 0.25, y, s * 0.35, 0, Math.PI * 2);
        ctx.lineTo(x, y + s * 0.9);
        ctx.closePath();
        ctx.fill();
      }
    }

    drawCoinBurst(t) {
      const ctx = this.ctx;

      for (const icon of this.world.items.icons) {
        const x = (icon.x + Math.sin(t * 2 + icon.phase) * 60 + this.w) % this.w;
        const y = (icon.y + Math.cos(t + icon.phase) * 40 + this.h) % this.h;
        const s = icon.s * 0.45;

        ctx.fillStyle = "rgba(250,204,21,0.42)";
        ctx.beginPath();
        ctx.ellipse(x, y, s, s * 1.35, Math.sin(t + icon.phase), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawSparkBurst(t) {
      const ctx = this.ctx;

      for (const s of this.world.items.sparks) {
        const x = (s.x + Math.sin(t + s.phase) * s.speed + this.w) % this.w;
        const y = (s.y + Math.cos(t * 0.8 + s.phase) * s.speed + this.h) % this.h;

        ctx.fillStyle = `hsla(${s.h},100%,70%,0.35)`;
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawCommandSubject(t) {
      const ctx = this.ctx;
      const p = this.world.parsed;
      const hasSubject = p.command.requested || p.objects.dragon || p.objects.robot || p.objects.cars;

      if (!hasSubject) return;

      const obj =
        p.command.object ||
        (p.objects.dragon ? "dragon" : p.objects.robot ? "robot" : p.objects.cars ? "cars" : "object");

      const action = p.command.action || (p.actions.fly ? "fly" : p.actions.run ? "run" : "idle");

      const flyY = action === "fly" ? Math.sin(t * 2.4) * 70 - 70 : 0;
      const x = this.w * 0.5 + Math.sin(t * 1.5 * p.modifiers.speed) * 100;
      const y = this.h * 0.48 + Math.cos(t * 1.2) * 35 + flyY;
      const s = 48 * p.modifiers.scale;

      ctx.save();

      if (p.effects.neon || p.modifiers.glow || p.effects.fire) {
        ctx.shadowBlur = 28;
        ctx.shadowColor = p.effects.fire ? "#f97316" : this.world.palette.accent;
      }

      if (obj === "dragon") {
        ctx.fillStyle = p.effects.fire ? "rgba(239,68,68,0.78)" : "rgba(124,58,237,0.72)";
        ctx.beginPath();
        ctx.moveTo(x, y - s);
        ctx.lineTo(x - s * 1.8, y + s * 0.25);
        ctx.lineTo(x - s * 0.4, y + s * 0.12);
        ctx.lineTo(x, y + s);
        ctx.lineTo(x + s * 0.4, y + s * 0.12);
        ctx.lineTo(x + s * 1.8, y + s * 0.25);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "rgba(250,204,21,0.9)";
        ctx.beginPath();
        ctx.arc(x + s * 0.25, y - s * 0.35, s * 0.13, 0, Math.PI * 2);
        ctx.fill();

        if (p.effects.fire || p.objects.fire) {
          for (let i = 0; i < 7; i++) {
            const fx = x + s * 1.1 + i * 13;
            const fy = y - s * 0.25 + Math.sin(t * 8 + i) * 8;
            const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, 32);
            g.addColorStop(0, "rgba(250,204,21,0.9)");
            g.addColorStop(0.4, "rgba(249,115,22,0.55)");
            g.addColorStop(1, "rgba(239,68,68,0)");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(fx, fy, 32, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (obj === "robot") {
        ctx.fillStyle = "#64748b";
        this.roundRect(x - s * 0.5, y - s * 0.6, s, s * 1.1, 8);
        ctx.fill();

        ctx.fillStyle = "#22d3ee";
        ctx.fillRect(x - s * 0.25, y - s * 0.25, s * 0.18, s * 0.18);
        ctx.fillRect(x + s * 0.08, y - s * 0.25, s * 0.18, s * 0.18);
      } else if (obj === "cars" || obj === "car") {
        this.drawCar(x, y, 1.5 * p.modifiers.scale, this.world.palette.accent, false);
      } else {
        ctx.fillStyle = this.world.palette.accent;
        ctx.beginPath();
        ctx.arc(x, y, s * 0.75, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    drawPromptWordLayer(t) {
      const ctx = this.ctx;
      const p = this.world.parsed;

      for (const obj of this.world.items.wordObjects) {
        const mode = obj.hash % 7;
        const motion = obj.hash % 5;
        let x = obj.x;
        let y = obj.y;

        if (motion === 0) {
          x = (obj.x + Math.sin(t + obj.phase) * obj.speed + this.w) % this.w;
          y = (obj.y + Math.cos(t * 0.7 + obj.phase) * obj.speed * 0.5 + this.h) % this.h;
        } else if (motion === 1) {
          x = (obj.x + t * obj.speed + this.w) % this.w;
          y = obj.y;
        } else if (motion === 2) {
          x = obj.x;
          y = (obj.y + t * obj.speed + this.h) % this.h;
        } else if (motion === 3) {
          x = this.w * 0.5 + Math.cos(t + obj.phase) * obj.speed * 2;
          y = this.h * 0.5 + Math.sin(t + obj.phase) * obj.speed;
        } else {
          x = (obj.x + Math.sin(t * 2 + obj.phase) * obj.speed + this.w) % this.w;
          y = (obj.y + Math.sin(t * 3 + obj.phase) * obj.speed + this.h) % this.h;
        }

        ctx.save();
        ctx.globalAlpha = 0.045 + ((obj.hash % 100) / 100) * 0.09;
        ctx.fillStyle = obj.color;

        if (p.styles.pixel || p.styles.voxel) {
          const s = obj.size;
          ctx.fillRect(x, y, s, s);
          if (mode % 2) ctx.fillRect(x + s * 0.4, y - s * 0.4, s, s);
        } else {
          ctx.beginPath();

          if (mode === 0) {
            ctx.arc(x, y, obj.size, 0, Math.PI * 2);
          } else if (mode === 1) {
            ctx.rect(x, y, obj.size * 1.5, obj.size);
          } else if (mode === 2) {
            ctx.ellipse(x, y, obj.size * 1.4, obj.size * 0.7, t, 0, Math.PI * 2);
          } else {
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

    drawParticles(t) {
      const ctx = this.ctx;
      const p = this.world.parsed;

      for (const part of this.world.items.particles) {
        const x = (part.x + part.vx * t * 60 + this.w) % this.w;
        const y = (part.y + part.vy * t * 60 + this.h) % this.h;

        ctx.fillStyle =
          p.styles.synthwave || p.modifiers.glow || p.effects.neon
            ? `hsla(${part.hue},100%,70%,${part.a})`
            : `rgba(255,255,255,${part.a * 0.6})`;

        ctx.beginPath();
        ctx.arc(x, y, part.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawStyleOverlay(t) {
      const ctx = this.ctx;
      const p = this.world.parsed;

      if (p.styles.noir) {
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.fillRect(0, 0, this.w, this.h);
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

      if (p.styles.watercolor || p.modifiers.dream || p.styles.dream) {
        for (let i = 0; i < 14; i++) {
          ctx.fillStyle = "rgba(255,255,255,0.018)";
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

      if (p.styles.glitch || p.effects.glitch) {
        for (let i = 0; i < 10; i++) {
          const y = Math.random() * this.h;
          const h = Math.random() * 8 + 2;

          ctx.fillStyle = i % 2
            ? "rgba(0,255,255,0.08)"
            : "rgba(255,0,255,0.08)";

          ctx.fillRect(Math.random() * 20 - 10, y, this.w, h);
        }
      }

      if (p.effects.scanlines || p.effects.vhs) {
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        for (let y = 0; y < this.h; y += 4) {
          ctx.fillRect(0, y, this.w, 1);
        }
      }

      if (p.styles.blueprint) {
        ctx.strokeStyle = "rgba(147,197,253,0.14)";
        for (let x = 0; x < this.w; x += 32) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, this.h);
          ctx.stroke();
        }
        for (let y = 0; y < this.h; y += 32) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(this.w, y);
          ctx.stroke();
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
      const gap = 18;

      ctx.fillStyle = "rgba(0,0,0,0.07)";

      for (let y = 0; y < this.h; y += gap) {
        for (let x = 0; x < this.w; x += gap) {
          const r = 1.5 + Math.sin(x * 0.02 + y * 0.02 + t) * 1.2;

          ctx.beginPath();
          ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    drawGrain() {
      const ctx = this.ctx;
      const p = this.world.parsed;
      const amount = Math.floor((this.w * this.h) / 1100);

      ctx.save();
      ctx.globalAlpha =
        p.styles.pixel ? 0.025 :
        p.effects.grain || p.effects.vhs ? 0.09 :
        0.052;

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

      this.options.width = Math.max(
        160,
        Math.floor(Number(this.options.width) || DEFAULTS.width)
      );

      this.options.height = Math.max(
        90,
        Math.floor(Number(this.options.height) || DEFAULTS.height)
      );

      this.options.fps = clamp(
        Math.floor(Number(this.options.fps) || DEFAULTS.fps),
        1,
        60
      );

      this.options.seconds = clamp(
        Number(this.options.seconds) || DEFAULTS.seconds,
        0.5,
        60
      );

      this.options.bitrate = Math.max(
        100000,
        Math.floor(Number(this.options.bitrate || DEFAULTS.bitrate))
      );

      this.canvas = this.options.canvas || document.createElement("canvas");
      this.canvas.width = this.options.width;
      this.canvas.height = this.options.height;

      if (this.options.appendCanvas && !this.canvas.parentNode) {
        document.body.appendChild(this.canvas);
      }
    }

    async generate(prompt) {
      const parsed = parsePrompt(prompt, this.options);
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
      } catch (error) {
        recorder = new MediaRecorder(stream);
      }

      return new Promise((resolve, reject) => {
        const totalFrames = Math.floor(this.options.fps * this.options.seconds);
        const frameDuration = 1000 / this.options.fps;
        const start = performance.now();

        let stopped = false;
        let lastCapturedFrame = -1;

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
            currentFrame !== lastCapturedFrame &&
            currentFrame % Math.max(1, Math.floor(this.options.fps / 6)) === 0
          ) {
            frames.push(this.canvas.toDataURL("image/webp", this.options.quality));
            lastCapturedFrame = currentFrame;
          }

          if (currentFrame >= totalFrames) {
            try {
              recorder.stop();
            } catch (error) {
              reject(error);
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

    correctPrompt(prompt, options = {}) {
      return normalizePrompt(prompt, options);
    },

    parsePrompt(prompt, options = {}) {
      return parsePrompt(prompt, options);
    },

    dictionaries: DICT,
    typos: TYPO_MAP,
    version: VERSION
  };

  global.RealLifeVideo = RealLifeVideo;
  global.SpudzyVid = RealLifeVideo;
  global.SpudzyVideo = RealLifeVideo;
  global.spudzyVid = RealLifeVideo;
  global.spudzyVideo = RealLifeVideo;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = RealLifeVideo;
  }
})(typeof window !== "undefined" ? window : globalThis);
