/*!
 * Spudzy Music AI
 * Browser-only procedural music + TTS lyric performer.
 * No backend. No dependencies. Works on GitHub Pages.
 *
 * Features:
 * - Prompt shapes tempo, key, scale, energy, drums, instruments, mood
 * - Lyrics shape melody rhythm
 * - Web Audio API music generation
 * - speechSynthesis TTS lyric vocals
 * - Custom music signatures
 *
 * Example:
 * SpudzyMusicAI.play({
 *   prompt: "fast happy chiptune boss fight in space",
 *   signature: "chiptune",
 *   lyrics: `
 *     Spudzy flies across the stars
 *     Building worlds from glowing sparks
 *     Beat is fast and blocks ignite
 *     Potato power wins tonight
 *   `
 * });
 */

(function () {
  "use strict";

  const SpudzyMusicAI = {};

  let ctx = null;
  let master = null;
  let activeNodes = [];
  let activeTimers = [];
  let playing = false;
  let currentSong = null;

  const NOTE_INDEX = {
    C: 0,
    "C#": 1,
    Db: 1,
    D: 2,
    "D#": 3,
    Eb: 3,
    E: 4,
    F: 5,
    "F#": 6,
    Gb: 6,
    G: 7,
    "G#": 8,
    Ab: 8,
    A: 9,
    "A#": 10,
    Bb: 10,
    B: 11,
  };

  const SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    pentatonic: [0, 2, 4, 7, 9],
    blues: [0, 3, 5, 6, 7, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  };

  const SIGNATURES = {
    spudzy: {
      bpm: 116,
      key: "C",
      scale: "major",
      energy: 0.72,
      swing: 0.05,
      drumStyle: "pop",
      bassStyle: "bounce",
      leadWave: "square",
      padWave: "triangle",
      chordMode: "bright",
      ttsRate: 1.0,
      ttsPitch: 1.15,
      ttsVolume: 0.9,
    },

    chiptune: {
      bpm: 138,
      key: "C",
      scale: "major",
      energy: 0.9,
      swing: 0.01,
      drumStyle: "chip",
      bassStyle: "pulse",
      leadWave: "square",
      padWave: "square",
      chordMode: "arcade",
      ttsRate: 1.08,
      ttsPitch: 1.35,
      ttsVolume: 0.9,
    },

    lofi: {
      bpm: 76,
      key: "A",
      scale: "minor",
      energy: 0.42,
      swing: 0.16,
      drumStyle: "lofi",
      bassStyle: "soft",
      leadWave: "sine",
      padWave: "triangle",
      chordMode: "soft",
      ttsRate: 0.86,
      ttsPitch: 0.88,
      ttsVolume: 0.82,
    },

    trap: {
      bpm: 144,
      key: "F#",
      scale: "minor",
      energy: 0.88,
      swing: 0.04,
      drumStyle: "trap",
      bassStyle: "808",
      leadWave: "sawtooth",
      padWave: "sawtooth",
      chordMode: "dark",
      ttsRate: 1.03,
      ttsPitch: 0.82,
      ttsVolume: 0.88,
    },

    edm: {
      bpm: 128,
      key: "G",
      scale: "minor",
      energy: 0.95,
      swing: 0.01,
      drumStyle: "edm",
      bassStyle: "drive",
      leadWave: "sawtooth",
      padWave: "sawtooth",
      chordMode: "huge",
      ttsRate: 1.05,
      ttsPitch: 1.05,
      ttsVolume: 0.9,
    },

    ambient: {
      bpm: 62,
      key: "D",
      scale: "lydian",
      energy: 0.25,
      swing: 0,
      drumStyle: "none",
      bassStyle: "soft",
      leadWave: "sine",
      padWave: "triangle",
      chordMode: "float",
      ttsRate: 0.72,
      ttsPitch: 1.05,
      ttsVolume: 0.65,
    },

    rock: {
      bpm: 124,
      key: "E",
      scale: "minor",
      energy: 0.86,
      swing: 0.02,
      drumStyle: "rock",
      bassStyle: "drive",
      leadWave: "sawtooth",
      padWave: "sawtooth",
      chordMode: "power",
      ttsRate: 1.0,
      ttsPitch: 0.9,
      ttsVolume: 0.9,
    },
  };

  const PROMPT_RULES = [
    {
      words: ["fast", "speed", "hype", "race", "battle", "boss", "fight", "run"],
      apply: s => {
        s.bpm += 22;
        s.energy += 0.2;
        s.drumStyle = s.drumStyle === "none" ? "pop" : s.drumStyle;
        s.ttsRate += 0.12;
      },
    },
    {
      words: ["slow", "calm", "sleep", "soft", "peace", "gentle", "relax"],
      apply: s => {
        s.bpm -= 24;
        s.energy -= 0.25;
        s.drumStyle = s.drumStyle === "edm" ? "lofi" : s.drumStyle;
        s.ttsRate -= 0.15;
      },
    },
    {
      words: ["happy", "cute", "fun", "sunny", "bright", "party", "victory"],
      apply: s => {
        s.scale = "major";
        s.chordMode = "bright";
        s.ttsPitch += 0.18;
        s.energy += 0.08;
      },
    },
    {
      words: ["sad", "rain", "lonely", "lost", "dark", "night"],
      apply: s => {
        s.scale = "minor";
        s.chordMode = "soft";
        s.bpm -= 8;
        s.ttsPitch -= 0.12;
      },
    },
    {
      words: ["scary", "evil", "haunted", "monster", "shadow", "creepy"],
      apply: s => {
        s.scale = "phrygian";
        s.chordMode = "dark";
        s.leadWave = "sawtooth";
        s.padWave = "sawtooth";
        s.ttsPitch -= 0.25;
      },
    },
    {
      words: ["space", "stars", "galaxy", "dream", "float", "magic"],
      apply: s => {
        s.scale = "lydian";
        s.chordMode = "float";
        s.padWave = "triangle";
        s.swing += 0.02;
      },
    },
    {
      words: ["minecraft", "block", "blocks", "pixel", "retro", "arcade", "game"],
      apply: s => {
        s.leadWave = "square";
        s.padWave = "square";
        s.drumStyle = "chip";
        s.bassStyle = "pulse";
        s.chordMode = "arcade";
      },
    },
    {
      words: ["trap", "808", "rap"],
      apply: s => {
        s.drumStyle = "trap";
        s.bassStyle = "808";
        s.scale = "minor";
        s.ttsPitch -= 0.1;
      },
    },
    {
      words: ["edm", "dance", "club", "drop"],
      apply: s => {
        s.drumStyle = "edm";
        s.bassStyle = "drive";
        s.leadWave = "sawtooth";
        s.energy += 0.18;
        s.bpm = Math.max(s.bpm, 126);
      },
    },
    {
      words: ["lofi", "chill", "study"],
      apply: s => {
        s.drumStyle = "lofi";
        s.bassStyle = "soft";
        s.leadWave = "sine";
        s.swing += 0.12;
        s.bpm = Math.min(s.bpm, 86);
      },
    },
    {
      words: ["rock", "guitar", "metal"],
      apply: s => {
        s.drumStyle = "rock";
        s.bassStyle = "drive";
        s.leadWave = "sawtooth";
        s.chordMode = "power";
        s.energy += 0.16;
      },
    },
  ];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function copy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function hashString(text) {
    let h = 2166136261;
    text = String(text || "");
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function rngFromSeed(seed) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function choose(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
  }

  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function noteToMidi(note, octave) {
    return 12 * (octave + 1) + NOTE_INDEX[note];
  }

  function degreeToMidi(key, scaleName, degree, octave) {
    const scale = SCALES[scaleName] || SCALES.major;
    const root = noteToMidi(key, octave);
    const wrapped = ((degree % scale.length) + scale.length) % scale.length;
    const octaveShift = Math.floor(degree / scale.length) * 12;
    return root + scale[wrapped] + octaveShift;
  }

  function addNode(node) {
    activeNodes.push(node);
    return node;
  }

  function timer(id) {
    activeTimers.push(id);
    return id;
  }

  function connect(...nodes) {
    for (let i = 0; i < nodes.length - 1; i++) {
      nodes[i].connect(nodes[i + 1]);
    }
  }

  function env(gain, time, duration, attack, decay, sustain, release, volume) {
    const g = gain.gain;
    const end = time + duration;

    g.cancelScheduledValues(time);
    g.setValueAtTime(0.0001, time);
    g.exponentialRampToValueAtTime(Math.max(0.0001, volume), time + attack);
    g.exponentialRampToValueAtTime(
      Math.max(0.0001, volume * sustain),
      time + attack + decay
    );
    g.setValueAtTime(
      Math.max(0.0001, volume * sustain),
      Math.max(time + attack + decay, end - release)
    );
    g.exponentialRampToValueAtTime(0.0001, end);
  }

  function playTone(options) {
    const {
      time,
      freq,
      duration,
      wave = "sine",
      volume = 0.2,
      attack = 0.01,
      decay = 0.06,
      sustain = 0.45,
      release = 0.1,
      filter = 8000,
      detune = 0,
      pan = 0,
    } = options;

    const osc = addNode(ctx.createOscillator());
    const gain = addNode(ctx.createGain());
    const biquad = addNode(ctx.createBiquadFilter());
    const panner = addNode(ctx.createStereoPanner());

    osc.type = wave;
    osc.frequency.setValueAtTime(freq, time);
    osc.detune.setValueAtTime(detune, time);

    biquad.type = "lowpass";
    biquad.frequency.setValueAtTime(filter, time);

    panner.pan.setValueAtTime(pan, time);

    env(gain, time, duration, attack, decay, sustain, release, volume);

    connect(osc, biquad, gain, panner, master);

    osc.start(time);
    osc.stop(time + duration + release + 0.05);
  }

  function makeNoiseBuffer() {
    const length = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  function playNoise(time, duration, volume, type, frequency) {
    const source = addNode(ctx.createBufferSource());
    const gain = addNode(ctx.createGain());
    const filter = addNode(ctx.createBiquadFilter());

    source.buffer = makeNoiseBuffer();

    filter.type = type || "bandpass";
    filter.frequency.setValueAtTime(frequency || 2000, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    connect(source, filter, gain, master);

    source.start(time);
    source.stop(time + duration + 0.03);
  }

  function playKick(time, style, energy) {
    const osc = addNode(ctx.createOscillator());
    const gain = addNode(ctx.createGain());

    osc.type = "sine";

    const start = style === "trap" ? 95 : 135;
    const end = style === "edm" ? 45 : 52;

    osc.frequency.setValueAtTime(start, time);
    osc.frequency.exponentialRampToValueAtTime(end, time + 0.13);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.22 + energy * 0.16, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);

    connect(osc, gain, master);

    osc.start(time);
    osc.stop(time + 0.34);
  }

  function playSnare(time, style, energy) {
    const freq = style === "lofi" ? 1200 : style === "rock" ? 1800 : 2400;
    playNoise(time, 0.16, 0.11 + energy * 0.12, "bandpass", freq);

    if (style === "rock") {
      playTone({
        time,
        freq: 170,
        duration: 0.09,
        wave: "triangle",
        volume: 0.08,
        attack: 0.002,
        decay: 0.03,
        sustain: 0.1,
        release: 0.06,
        filter: 1600,
      });
    }
  }

  function playHat(time, open, energy) {
    playNoise(time, open ? 0.18 : 0.05, 0.018 + energy * 0.04, "highpass", 6500);
  }

  function playChipClick(time, energy) {
    playTone({
      time,
      freq: 1200,
      duration: 0.04,
      wave: "square",
      volume: 0.025 + energy * 0.03,
      attack: 0.001,
      decay: 0.01,
      sustain: 0.1,
      release: 0.02,
      filter: 9000,
    });
  }

  function normalizeLyrics(lyrics) {
    const lines = String(lyrics || "")
      .split(/\n+/)
      .map(line => line.trim())
      .filter(Boolean);

    if (lines.length) return lines;

    return [
      "Spudzy music starts to glow",
      "Type the words and shape the flow",
      "Beats and voices come alive",
      "Browser songs begin to fly",
    ];
  }

  function syllables(word) {
    word = String(word || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    if (!word) return 1;

    const groups = word.match(/[aeiouy]+/g);
    let count = groups ? groups.length : 1;

    if (word.endsWith("e") && count > 1) count--;

    return clamp(count, 1, 4);
  }

  function lyricUnits(line) {
    const words = String(line || "").split(/\s+/).filter(Boolean);
    const units = [];

    for (const word of words) {
      const count = syllables(word);

      for (let i = 0; i < count; i++) {
        units.push({
          word,
          accent: i === 0,
          length: count >= 3 ? 0.5 : 1,
        });
      }
    }

    return units.length ? units : [{ word: "", accent: true, length: 1 }];
  }

  function wordsInPrompt(prompt) {
    return String(prompt || "")
      .toLowerCase()
      .replace(/[^a-z0-9# ]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
  }

  function promptHas(promptWords, terms) {
    return terms.some(term => promptWords.includes(term));
  }

  function shapeSignatureFromPrompt(base, prompt) {
    const shaped = copy(base);
    const promptWords = wordsInPrompt(prompt);

    for (const rule of PROMPT_RULES) {
      if (promptHas(promptWords, rule.words)) {
        rule.apply(shaped);
      }
    }

    if (promptWords.includes("major")) shaped.scale = "major";
    if (promptWords.includes("minor")) shaped.scale = "minor";
    if (promptWords.includes("blues")) shaped.scale = "blues";
    if (promptWords.includes("pentatonic")) shaped.scale = "pentatonic";

    const keyMatch = String(prompt || "").match(/\bkey\s*[:=]?\s*([A-G](?:#|b)?)\b/i);
    if (keyMatch && NOTE_INDEX[keyMatch[1]] !== undefined) {
      shaped.key = keyMatch[1];
    }

    const bpmMatch = String(prompt || "").match(/\b(\d{2,3})\s*bpm\b/i);
    if (bpmMatch) {
      shaped.bpm = Number(bpmMatch[1]);
    }

    shaped.bpm = clamp(Math.round(shaped.bpm), 45, 210);
    shaped.energy = clamp(shaped.energy, 0.05, 1);
    shaped.swing = clamp(shaped.swing, 0, 0.28);
    shaped.ttsRate = clamp(shaped.ttsRate, 0.45, 1.55);
    shaped.ttsPitch = clamp(shaped.ttsPitch, 0.45, 1.8);
    shaped.ttsVolume = clamp(shaped.ttsVolume, 0, 1);

    return shaped;
  }

  function chordProgressions(mode) {
    if (mode === "dark") {
      return [
        [0, 5, 3, 4],
        [0, 6, 5, 4],
        [0, 2, 1, 4],
      ];
    }

    if (mode === "soft") {
      return [
        [0, 5, 3, 4],
        [0, 2, 5, 4],
        [0, 6, 3, 4],
      ];
    }

    if (mode === "float") {
      return [
        [0, 3, 5, 4],
        [0, 4, 2, 5],
        [0, 5, 6, 4],
      ];
    }

    if (mode === "power") {
      return [
        [0, 5, 3, 4],
        [0, 3, 5, 4],
        [0, 4, 5, 3],
      ];
    }

    if (mode === "arcade") {
      return [
        [0, 4, 5, 4],
        [0, 5, 3, 4],
        [0, 3, 4, 0],
      ];
    }

    if (mode === "huge") {
      return [
        [0, 5, 3, 4],
        [5, 3, 0, 4],
        [0, 4, 5, 3],
      ];
    }

    return [
      [0, 4, 5, 3],
      [0, 5, 3, 4],
      [0, 3, 4, 5],
    ];
  }

  function createSong(options) {
    const signatureName = String(options.signature || "spudzy").toLowerCase();
    const base = SIGNATURES[signatureName] || SIGNATURES.spudzy;
    const prompt = String(options.prompt || "");
    const lyrics = normalizeLyrics(options.lyrics || "");

    const shaped = shapeSignatureFromPrompt(base, prompt);

    if (options.bpm) shaped.bpm = clamp(Number(options.bpm), 45, 210);
    if (options.key && NOTE_INDEX[options.key] !== undefined) shaped.key = options.key;
    if (options.scale && SCALES[options.scale]) shaped.scale = options.scale;

    const seed = Number.isFinite(options.seed)
      ? options.seed
      : hashString(prompt + "|" + lyrics.join("|") + "|" + signatureName);

    const rng = rngFromSeed(seed);
    const progressions = chordProgressions(shaped.chordMode);
    const progression = options.chords || choose(rng, progressions);

    const beatsPerBar = 4;
    const beatSeconds = 60 / shaped.bpm;
    const barSeconds = beatSeconds * beatsPerBar;
    const bars = clamp(Number(options.bars || Math.max(8, lyrics.length * 2)), 4, 64);

    return {
      seed,
      rng,
      prompt,
      lyrics,
      signatureName,
      signature: shaped,
      progression,
      beatsPerBar,
      beatSeconds,
      barSeconds,
      bars,
      tts: options.tts !== false,
      vocals: options.vocals !== false,
    };
  }

  function makeMaster() {
    const out = addNode(ctx.createGain());
    const compressor = addNode(ctx.createDynamicsCompressor());
    const highpass = addNode(ctx.createBiquadFilter());

    out.gain.value = 0.78;

    highpass.type = "highpass";
    highpass.frequency.value = 24;

    compressor.threshold.value = -16;
    compressor.knee.value = 24;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.005;
    compressor.release.value = 0.22;

    connect(out, highpass, compressor, ctx.destination);

    return out;
  }

  function schedulePad(song, bar, time) {
    const sig = song.signature;
    const degree = song.progression[bar % song.progression.length];

    let chord = [degree, degree + 2, degree + 4];

    if (sig.chordMode === "power") chord = [degree, degree + 4, degree + 7];
    if (sig.chordMode === "float") chord = [degree, degree + 2, degree + 5];

    for (let i = 0; i < chord.length; i++) {
      const midi = degreeToMidi(sig.key, sig.scale, chord[i], 3);
      const pan = i === 0 ? -0.22 : i === 1 ? 0.18 : 0.05;

      playTone({
        time,
        freq: midiToFreq(midi),
        duration: song.barSeconds * 0.92,
        wave: sig.padWave,
        volume: 0.035 + sig.energy * 0.035,
        attack: 0.08,
        decay: 0.22,
        sustain: 0.65,
        release: 0.48,
        filter:
          sig.chordMode === "dark"
            ? 1200
            : sig.chordMode === "float"
            ? 2600
            : 4200,
        detune: i === 1 ? 4 : i === 2 ? -4 : 0,
        pan,
      });
    }
  }

  function scheduleBass(song, bar, time, rng) {
    const sig = song.signature;
    const rootDegree = song.progression[bar % song.progression.length];
    const rootMidi = degreeToMidi(sig.key, sig.scale, rootDegree, 2);
    const beat = song.beatSeconds;

    if (sig.bassStyle === "808") {
      playTone({
        time,
        freq: midiToFreq(rootMidi),
        duration: beat * 1.85,
        wave: "sine",
        volume: 0.22 + sig.energy * 0.18,
        attack: 0.004,
        decay: 0.08,
        sustain: 0.78,
        release: 0.4,
        filter: 700,
      });

      if (rng() > 0.35) {
        playTone({
          time: time + beat * 2.5,
          freq: midiToFreq(rootMidi + 7),
          duration: beat * 0.8,
          wave: "sine",
          volume: 0.14 + sig.energy * 0.12,
          attack: 0.004,
          decay: 0.06,
          sustain: 0.7,
          release: 0.18,
          filter: 700,
        });
      }

      return;
    }

    const patterns = {
      bounce: [0, null, 7, 0, 5, null, 7, 5],
      pulse: [0, 0, 7, 0, 5, 0, 7, 0],
      drive: [0, 0, 0, 0, 7, 7, 5, 5],
      soft: [0, null, 7, null],
    };

    const pattern = patterns[sig.bassStyle] || patterns.bounce;
    const step = song.barSeconds / pattern.length;

    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === null) continue;

      playTone({
        time: time + i * step,
        freq: midiToFreq(rootMidi + pattern[i]),
        duration: step * 0.82,
        wave:
          sig.bassStyle === "pulse"
            ? "square"
            : sig.bassStyle === "soft"
            ? "triangle"
            : "sawtooth",
        volume: 0.08 + sig.energy * 0.14,
        attack: 0.004,
        decay: 0.05,
        sustain: 0.48,
        release: 0.08,
        filter: sig.bassStyle === "soft" ? 900 : 1900,
      });
    }
  }

  function scheduleDrums(song, bar, time, rng) {
    const sig = song.signature;
    const style = sig.drumStyle;
    const beat = song.beatSeconds;
    const energy = sig.energy;

    if (style === "none") return;

    if (style === "chip") {
      playKick(time, style, energy);
      playSnare(time + beat, style, energy);
      playKick(time + beat * 2, style, energy);
      playSnare(time + beat * 3, style, energy);

      for (let i = 0; i < 8; i++) {
        if (i % 2 === 0 || rng() > 0.5) {
          playChipClick(time + i * beat * 0.5, energy);
        }
      }

      return;
    }

    if (style === "trap") {
      playKick(time, style, energy);
      if (rng() > 0.35) playKick(time + beat * 1.5, style, energy);
      playSnare(time + beat * 2, style, energy);
      playKick(time + beat * 2.75, style, energy);

      for (let i = 0; i < 16; i++) {
        playHat(time + i * beat * 0.25, false, energy);
      }

      return;
    }

    if (style === "edm") {
      for (let i = 0; i < 4; i++) playKick(time + i * beat, style, energy);
      playSnare(time + beat, style, energy);
      playSnare(time + beat * 3, style, energy);

      for (let i = 0; i < 8; i++) {
        playHat(time + i * beat * 0.5, i % 4 === 3, energy);
      }

      return;
    }

    if (style === "rock") {
      playKick(time, style, energy);
      playSnare(time + beat, style, energy);
      playKick(time + beat * 2, style, energy);
      if (rng() > 0.45) playKick(time + beat * 2.5, style, energy);
      playSnare(time + beat * 3, style, energy);

      for (let i = 0; i < 8; i++) {
        playHat(time + i * beat * 0.5, i % 4 === 3, energy);
      }

      return;
    }

    if (style === "lofi") {
      playKick(time, style, energy);
      if (rng() > 0.45) playKick(time + beat * 2.5, style, energy);
      playSnare(time + beat * 2, style, energy);

      for (let i = 0; i < 8; i++) {
        if (rng() > 0.18) {
          playHat(time + i * beat * 0.5 + sig.swing * beat, false, energy);
        }
      }

      return;
    }

    playKick(time, style, energy);
    playSnare(time + beat, style, energy);
    playKick(time + beat * 2, style, energy);
    playSnare(time + beat * 3, style, energy);

    for (let i = 0; i < 8; i++) {
      playHat(time + i * beat * 0.5, i % 4 === 3, energy);
    }
  }

  function scheduleLeadFromLyrics(song, bar, time, rng) {
    const sig = song.signature;
    const line = song.lyrics[bar % song.lyrics.length];
    const units = lyricUnits(line);
    const root = song.progression[bar % song.progression.length];

    let cursor = 0;
    const maxNotes = Math.min(units.length, 14);

    for (let i = 0; i < maxNotes; i++) {
      const unit = units[i];
      const length = unit.length * song.beatSeconds * 0.5;

      if (cursor >= song.barSeconds - song.beatSeconds * 0.25) break;

      const phraseLift = bar % 4 === 3 ? 2 : 0;
      const movement = unit.accent
        ? choose(rng, [0, 2, 4, 7])
        : choose(rng, [1, 2, 3, 4, 5, 6]);

      const midi = degreeToMidi(sig.key, sig.scale, root + movement + phraseLift, 5);

      playTone({
        time: time + cursor + (i % 2 ? sig.swing * song.beatSeconds : 0),
        freq: midiToFreq(midi),
        duration: length * 0.82,
        wave: sig.leadWave,
        volume: unit.accent ? 0.08 + sig.energy * 0.07 : 0.055 + sig.energy * 0.04,
        attack: 0.004,
        decay: 0.06,
        sustain: 0.34,
        release: 0.08,
        filter: sig.leadWave === "sawtooth" ? 3200 : 6200,
        pan: i % 2 ? 0.18 : -0.12,
      });

      cursor += length;
    }
  }

  function scheduleArp(song, bar, time, rng) {
    const sig = song.signature;
    if (sig.energy < 0.55 && sig.chordMode !== "float") return;

    const root = song.progression[bar % song.progression.length];
    const pattern = [0, 2, 4, 7, 4, 2, 0, 2];
    const step = song.beatSeconds * 0.5;

    for (let i = 0; i < pattern.length; i++) {
      if (rng() < 0.08) continue;

      const midi = degreeToMidi(sig.key, sig.scale, root + pattern[i], 5);

      playTone({
        time: time + i * step + (i % 2 ? sig.swing * song.beatSeconds : 0),
        freq: midiToFreq(midi),
        duration: step * 0.7,
        wave: sig.leadWave === "square" ? "square" : "triangle",
        volume: 0.025 + sig.energy * 0.03,
        attack: 0.003,
        decay: 0.04,
        sustain: 0.25,
        release: 0.05,
        filter: 5200,
        pan: i % 2 ? 0.25 : -0.25,
      });
    }
  }

  function scheduleMusic(song, startTime) {
    const rng = rngFromSeed(song.seed + 999);

    for (let bar = 0; bar < song.bars; bar++) {
      const time = startTime + bar * song.barSeconds;

      schedulePad(song, bar, time);
      scheduleBass(song, bar, time, rng);
      scheduleDrums(song, bar, time, rng);
      scheduleLeadFromLyrics(song, bar, time, rng);

      if (bar % 2 === 1 || song.signatureName === "chiptune" || song.signature.drumStyle === "edm") {
        scheduleArp(song, bar, time, rng);
      }
    }

    const end = startTime + song.bars * song.barSeconds;
    const finalMidi = degreeToMidi(
      song.signature.key,
      song.signature.scale,
      song.progression[0],
      4
    );

    playTone({
      time: end,
      freq: midiToFreq(finalMidi),
      duration: song.barSeconds,
      wave: song.signature.padWave,
      volume: 0.12,
      attack: 0.06,
      decay: 0.18,
      sustain: 0.6,
      release: 0.8,
      filter: 2500,
    });
  }

  function pickVoice(options) {
    if (!("speechSynthesis" in window)) return null;

    const voices = window.speechSynthesis.getVoices();
    if (!voices || !voices.length) return null;

    if (options.voiceName) {
      const exact = voices.find(v =>
        v.name.toLowerCase().includes(String(options.voiceName).toLowerCase())
      );
      if (exact) return exact;
    }

    const english = voices.find(v => /^en/i.test(v.lang));
    return english || voices[0];
  }

  function speakLine(line, song, delayMs, options) {
    if (!song.tts || !("speechSynthesis" in window)) return;

    timer(
      setTimeout(() => {
        if (!playing) return;

        const utterance = new SpeechSynthesisUtterance(line);
        const voice = pickVoice(options || {});
        const sig = song.signature;

        if (voice) utterance.voice = voice;

        utterance.rate = clamp(Number(options.ttsRate || sig.ttsRate), 0.45, 1.55);
        utterance.pitch = clamp(Number(options.ttsPitch || sig.ttsPitch), 0.45, 1.8);
        utterance.volume = clamp(Number(options.ttsVolume || sig.ttsVolume), 0, 1);

        window.speechSynthesis.speak(utterance);
      }, delayMs)
    );
  }

  function scheduleTTS(song, startTime, options) {
    if (!song.tts) return;
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const startDelay = Math.max(0, (startTime - ctx.currentTime) * 1000);

    for (let bar = 0; bar < song.bars; bar++) {
      const line = song.lyrics[bar % song.lyrics.length];
      const delay = startDelay + bar * song.barSeconds * 1000;

      speakLine(line, song, delay, options);
    }
  }

  function bootAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      throw new Error("This browser does not support the Web Audio API.");
    }

    ctx = new AudioContextClass();
    activeNodes = [];
    activeTimers = [];
    master = makeMaster();

    return ctx;
  }

  SpudzyMusicAI.generate = function generate(options = {}) {
    return createSong(options);
  };

  SpudzyMusicAI.play = async function play(options = {}) {
    SpudzyMusicAI.stop();

    bootAudio();

    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    playing = true;

    const song = createSong(options);
    currentSong = song;

    const startTime = ctx.currentTime + 0.12;

    scheduleMusic(song, startTime);
    scheduleTTS(song, startTime, options);

    const totalMs = (song.bars * song.barSeconds + song.barSeconds * 1.4) * 1000;

    timer(
      setTimeout(() => {
        SpudzyMusicAI.stop();
      }, totalMs)
    );

    return {
      seed: song.seed,
      prompt: song.prompt,
      signature: song.signatureName,
      shapedSignature: song.signature,
      lyrics: song.lyrics,
      bars: song.bars,
      bpm: song.signature.bpm,
      key: song.signature.key,
      scale: song.signature.scale,
    };
  };

  SpudzyMusicAI.stop = function stop() {
    playing = false;

    for (const id of activeTimers) {
      clearTimeout(id);
    }

    activeTimers = [];

    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }

    for (const node of activeNodes) {
      try {
        if (node.stop) node.stop(0);
      } catch (_) {}

      try {
        if (node.disconnect) node.disconnect();
      } catch (_) {}
    }

    activeNodes = [];

    if (ctx) {
      try {
        ctx.close();
      } catch (_) {}
    }

    ctx = null;
    master = null;
    currentSong = null;
  };

  SpudzyMusicAI.pauseTTS = function pauseTTS() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.pause();
    }
  };

  SpudzyMusicAI.resumeTTS = function resumeTTS() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.resume();
    }
  };

  SpudzyMusicAI.isPlaying = function isPlaying() {
    return playing;
  };

  SpudzyMusicAI.currentSong = function getCurrentSong() {
    return currentSong;
  };

  SpudzyMusicAI.signatures = function signatures() {
    return Object.keys(SIGNATURES);
  };

  SpudzyMusicAI.addSignature = function addSignature(name, config) {
    if (!name || typeof name !== "string") {
      throw new Error("Signature name must be a string.");
    }

    SIGNATURES[name.toLowerCase()] = Object.assign(copy(SIGNATURES.spudzy), config || {});
  };

  SpudzyMusicAI.getVoices = function getVoices() {
    if (!("speechSynthesis" in window)) return [];
    return window.speechSynthesis.getVoices();
  };

  SpudzyMusicAI.version = "2.0.0";

  window.SpudzyMusicAI = SpudzyMusicAI;
})();
