// Imagener_everything_ultra.js
// Image-Spud Everything Ultra — giant all-in-one procedural image engine.
// Same API preserved:
//   const priest = new ImageSpudHighPriest();
//   const output = await priest.generate("anything");
//   output.dataUri -> PNG data URI
//
// Includes:
// - No external imports
// - 200+ prompt modes
// - Auto mode chooser
// - WebGL GLSL raymarch renderer
// - Canvas 2D post-processing overlays
// - Optional mounted UI
// - Batch generation
// - Download helper
// - Debug/spec helpers

export const IMAGENER_VERSION = "Image-Spud Everything Ultra v5.0";
export const IMAGE_SPUD_MODES = [
  "cinematic portrait",
  "architectural cathedral",
  "ancient temple",
  "gothic castle",
  "futuristic city",
  "cyberpunk alley",
  "neon marketplace",
  "space planet",
  "galaxy nebula",
  "asteroid field",
  "alien desert",
  "lush forest",
  "misty jungle",
  "snow mountain",
  "volcanic wasteland",
  "ocean island",
  "underwater reef",
  "stormy coast",
  "golden desert",
  "crystal cave",
  "robot workshop",
  "mecha hangar",
  "fantasy village",
  "floating islands",
  "sky palace",
  "steampunk factory",
  "clockwork tower",
  "bioluminescent swamp",
  "arctic station",
  "mars colony",
  "moon base",
  "orbital ring",
  "black hole",
  "aurora field",
  "rainy street",
  "sunset highway",
  "retro diner",
  "film noir room",
  "luxury interior",
  "minimal studio",
  "macro flower",
  "insect world",
  "dragon lair",
  "wizard library",
  "ancient ruins",
  "lost city",
  "sacred altar",
  "royal throne",
  "samurai dojo",
  "ninja rooftop",
  "pirate harbor",
  "ship at sea",
  "submarine dock",
  "train station",
  "airship deck",
  "race track",
  "sports arena",
  "concert stage",
  "museum hall",
  "school lab",
  "medical lab",
  "data center",
  "server cathedral",
  "hologram chamber",
  "quantum tunnel",
  "portal room",
  "dream landscape",
  "surreal desert",
  "abstract sculpture",
  "glass garden",
  "paper diorama",
  "clay world",
  "toy city",
  "pixel fantasy",
  "voxel landscape",
  "low poly island",
  "oil painting scene",
  "watercolor valley",
  "comic panel",
  "anime city",
  "realistic animal",
  "mythic beast",
  "giant creature",
  "friendly mascot",
  "food photography",
  "product shot",
  "fashion runway",
  "sneaker display",
  "vehicle showroom",
  "spaceship cockpit",
  "cozy bedroom",
  "modern kitchen",
  "haunted hallway",
  "underground bunker",
  "treasure vault",
  "lava forge",
  "ice palace",
  "solar farm",
  "windy plains",
  "rainforest river",
  "canyon bridge",
  "desert oasis",
  "monolith field",
  "garden courtyard",
  "observatory dome",
  "planetarium",
  "ancient arena",
  "military base",
  "rescue scene",
  "festival night",
  "lantern street",
  "cherry blossom park",
  "autumn forest",
  "spring meadow",
  "winter cabin",
  "tropical resort",
  "office tower",
  "shopping mall",
  "arcade room",
  "VR grid",
  "mathematical mandala",
  "sacred geometry",
  "liquid metal",
  "smoke sculpture",
  "fire elemental",
  "water elemental",
  "earth elemental",
  "air elemental",
  "light temple",
  "shadow realm",
  "phoenix citadel",
  "phoenix sanctuary",
  "phoenix harbor",
  "phoenix canyon",
  "phoenix metropolis",
  "tiger citadel",
  "tiger sanctuary",
  "tiger harbor",
  "tiger canyon",
  "tiger metropolis",
  "wolf citadel",
  "wolf sanctuary",
  "wolf harbor",
  "wolf canyon",
  "wolf metropolis",
  "eagle citadel",
  "eagle sanctuary",
  "eagle harbor",
  "eagle canyon",
  "eagle metropolis",
  "whale citadel",
  "whale sanctuary",
  "whale harbor",
  "whale canyon",
  "whale metropolis",
  "android citadel",
  "android sanctuary",
  "android harbor",
  "android canyon",
  "android metropolis",
  "astronaut citadel",
  "astronaut sanctuary",
  "astronaut harbor",
  "astronaut canyon",
  "astronaut metropolis",
  "knight citadel",
  "knight sanctuary",
  "knight harbor",
  "knight canyon",
  "knight metropolis",
  "mage citadel",
  "mage sanctuary",
  "mage harbor",
  "mage canyon",
  "mage metropolis",
  "pilot citadel",
  "pilot sanctuary",
  "pilot harbor",
  "pilot canyon",
  "pilot metropolis",
  "explorer citadel",
  "explorer sanctuary",
  "explorer harbor",
  "explorer canyon",
  "explorer metropolis",
  "guardian citadel",
  "guardian sanctuary",
  "guardian harbor",
  "guardian canyon",
  "guardian metropolis",
  "dragon citadel",
  "dragon sanctuary",
  "dragon harbor",
  "dragon canyon",
  "dragon metropolis",
  "leviathan citadel",
  "leviathan sanctuary",
  "leviathan harbor",
  "leviathan canyon",
  "leviathan metropolis",
  "colossus citadel",
  "colossus sanctuary",
  "colossus harbor",
  "colossus canyon",
  "colossus metropolis",
  "butterfly citadel",
  "butterfly sanctuary",
  "butterfly harbor",
  "butterfly canyon",
  "butterfly metropolis",
  "owl citadel",
  "owl sanctuary",
  "owl harbor",
  "owl canyon",
  "owl metropolis",
  "fox citadel",
  "fox sanctuary",
  "fox harbor",
  "fox canyon",
  "fox metropolis",
  "lion citadel",
  "lion sanctuary",
  "lion harbor",
  "lion canyon",
  "lion metropolis",
  "raven citadel",
  "raven sanctuary",
  "raven harbor",
  "raven canyon",
  "raven metropolis",
  "photoreal garden",
  "photoreal labyrinth",
  "photoreal observatory",
  "photoreal archive",
  "photoreal bazaar",
  "photoreal workshop",
  "photoreal tower",
  "photoreal valley",
  "photoreal reef",
  "photoreal station",
  "cinematic garden",
  "cinematic labyrinth",
  "cinematic observatory",
  "cinematic archive",
  "cinematic bazaar",
  "cinematic workshop",
  "cinematic tower",
  "cinematic valley",
  "cinematic reef",
  "cinematic station",
  "ultra detailed garden",
  "ultra detailed labyrinth",
  "ultra detailed observatory",
  "ultra detailed archive",
  "ultra detailed bazaar",
  "ultra detailed workshop",
  "ultra detailed tower",
  "ultra detailed valley",
  "ultra detailed reef",
  "ultra detailed station",
  "volumetric garden",
  "volumetric labyrinth",
  "volumetric observatory",
  "volumetric archive",
  "volumetric bazaar",
  "volumetric workshop",
  "volumetric tower",
  "volumetric valley",
  "volumetric reef",
  "volumetric station",
  "macro garden",
  "macro labyrinth",
  "macro observatory",
  "macro archive",
  "macro bazaar",
  "macro workshop",
  "macro tower",
  "macro valley",
  "macro reef",
  "macro station",
  "wide angle garden",
  "wide angle labyrinth",
  "wide angle observatory",
  "wide angle archive",
  "wide angle bazaar",
  "wide angle workshop",
  "wide angle tower",
  "wide angle valley",
  "wide angle reef",
  "wide angle station",
  "noir garden",
  "noir labyrinth",
  "noir observatory",
  "noir archive",
  "noir bazaar",
  "noir workshop",
  "noir tower",
  "noir valley",
  "noir reef",
  "noir station",
  "pastel garden",
  "pastel labyrinth",
  "pastel observatory",
  "pastel archive",
  "pastel bazaar",
  "pastel workshop",
  "pastel tower",
  "pastel valley",
  "pastel reef",
  "pastel station",
  "holographic garden",
  "holographic labyrinth",
  "holographic observatory",
  "holographic archive",
  "holographic bazaar",
  "holographic workshop",
  "holographic tower",
  "holographic valley",
  "holographic reef",
  "holographic station",
  "brutalist garden",
  "brutalist labyrinth",
  "brutalist observatory",
  "brutalist archive",
  "brutalist bazaar",
  "brutalist workshop",
  "brutalist tower",
  "brutalist valley",
  "brutalist reef",
  "brutalist station"
];

const DEFAULT_WIDTH = 1024;
const DEFAULT_HEIGHT = 1024;
const TAU = Math.PI * 2;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a + (b - a) * t;
const normalizePrompt = p => String(p ?? "hi").trim() || "hi";
const safeNumber = (v, fallback) => Number.isFinite(Number(v)) ? Number(v) : fallback;

function hashString(text) {
  let h = 2166136261 >>> 0;
  text = String(text ?? "");
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function rand() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hasAny(text, words) { return words.some(w => text.includes(w)); }
function wordsOf(s) { return String(s).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean); }
function scoreMode(prompt, mode) {
  const p = prompt.toLowerCase();
  let score = 0;
  for (const w of wordsOf(mode)) {
    if (p.includes(w)) score += 5 + w.length;
    if (p === w) score += 20;
  }
  return score;
}

function hslToRgb(h, s, l) {
  h = ((h % 1) + 1) % 1;
  const f = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [f(p, q, h + 1 / 3), f(p, q, h), f(p, q, h - 1 / 3)];
}

function rgbCss(c, a = 1) {
  const r = Math.round(clamp(c[0], 0, 1) * 255);
  const g = Math.round(clamp(c[1], 0, 1) * 255);
  const b = Math.round(clamp(c[2], 0, 1) * 255);
  return `rgba(${r},${g},${b},${a})`;
}

export function chooseMode(prompt = "hi") {
  const text = normalizePrompt(prompt).toLowerCase();
  let bestIndex = hashString(text) % IMAGE_SPUD_MODES.length;
  let bestScore = -1;
  IMAGE_SPUD_MODES.forEach((mode, i) => {
    const score = scoreMode(text, mode);
    if (score > bestScore) { bestScore = score; bestIndex = i; }
  });
  if (bestScore <= 0) bestIndex = hashString(text) % IMAGE_SPUD_MODES.length;
  return { index: bestIndex, name: IMAGE_SPUD_MODES[bestIndex], score: bestScore };
}

function inferFamily(text, modeName) {
  const t = `${text} ${modeName}`.toLowerCase();
  if (hasAny(t, ["ui", "interface", "dashboard", "app", "website", "hud", "vr grid"])) return 5;
  if (hasAny(t, ["city", "cyber", "neon", "street", "metropolis", "mall", "arcade", "office", "tower"])) return 2;
  if (hasAny(t, ["space", "galaxy", "planet", "cosmic", "moon", "mars", "orbital", "black hole", "spaceship"])) return 3;
  if (hasAny(t, ["forest", "jungle", "river", "meadow", "tree", "garden", "swamp", "nature", "animal", "wolf", "fox", "tiger", "lion"])) return 4;
  if (hasAny(t, ["cathedral", "temple", "castle", "palace", "altar", "throne", "sanctuary", "citadel", "dojo"])) return 1;
  if (hasAny(t, ["ocean", "water", "reef", "harbor", "island", "submarine", "ship", "beach"])) return 7;
  if (hasAny(t, ["fire", "lava", "forge", "volcanic", "phoenix"])) return 8;
  if (hasAny(t, ["ice", "snow", "arctic", "winter"])) return 9;
  if (hasAny(t, ["abstract", "mandala", "geometry", "liquid", "smoke", "elemental"])) return 10;
  return 0;
}

export function expandPromptToImageSpec(prompt = "hi", options = {}) {
  const originalPrompt = normalizePrompt(prompt);
  const text = originalPrompt.toLowerCase();
  const seed = hashString(originalPrompt + JSON.stringify(options || {}));
  let selected = options.mode ? { index: IMAGE_SPUD_MODES.indexOf(options.mode), name: options.mode } : chooseMode(originalPrompt);
  if (selected.index < 0) selected = { index: seed % IMAGE_SPUD_MODES.length, name: IMAGE_SPUD_MODES[seed % IMAGE_SPUD_MODES.length] };
  const family = inferFamily(text, selected.name);
  const intent = family === 5 ? "2D interface design" : "realistic 3D image";
  const hue = (seed % 360) / 360;
  const palette = {
    primary: hslToRgb(hue, .76, .54),
    secondary: hslToRgb(hue + .31, .68, .48),
    accent: hslToRgb(hue + .62, .88, .62),
    shadow: hslToRgb(hue + .75, .42, .11),
    warm: hslToRgb(hue + .08, .70, .58),
    cool: hslToRgb(hue + .55, .70, .52)
  };
  const camera = [
    "wide cinematic lens with foreground, subject, background, atmospheric depth",
    "natural 50mm perspective with strong material detail and balanced framing",
    "low angle hero shot with dramatic silhouettes and long shadows",
    "macro close framing with tactile surface detail and shallow depth impression"
  ][seed % 4];
  const lighting = [
    "golden rim light, soft haze, contact shadows, glossy highlights",
    "cool moonlight, bounced fill, reflective edges, fog layers",
    "dramatic side key light, deep occlusion, high contrast",
    "clean studio key light, smooth reflections, realistic material response"
  ][(seed >> 4) % 4];
  return {
    version: IMAGENER_VERSION,
    originalPrompt,
    seed,
    modeIndex: selected.index,
    modeName: selected.name,
    family,
    intent,
    width: safeNumber(options.width, DEFAULT_WIDTH),
    height: safeNumber(options.height, DEFAULT_HEIGHT),
    realism: clamp(safeNumber(options.realism, .94), 0, 1),
    detail: clamp(safeNumber(options.detail, .92), 0, 1),
    post: options.post ?? true,
    palette,
    camera,
    lighting,
    expandedPrompt: `Create a complete ${intent} from "${originalPrompt}" using mode "${selected.name}". Define foreground, midground, subject, secondary objects, background world, material texture, lighting, contact shadows, reflection, haze, palette, and final composition.`,
    outputContract: "generate(prompt, options) returns { type, dataUri, width, height, promptSpec, renderer, version }"
  };
}

const vertexShader = `
attribute vec2 a_position;
varying vec2 v_uv;
void main(){
  v_uv=a_position*.5+.5;
  gl_Position=vec4(a_position,0.,1.);
}
`;

const fragmentShader = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_seed,u_mode,u_family,u_realism,u_detail;
uniform vec3 u_primary,u_secondary,u_accent,u_shadow,u_warm,u_cool;
varying vec2 v_uv;
#define MAX_STEPS 126
#define MAX_DIST 95.0
#define SURF_DIST .00115
mat2 rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
float h11(float p){return fract(sin(p*127.1+u_seed*913.7)*43758.5453);}
float h31(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7))+u_seed*41.13)*43758.5453);}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float n=dot(i,vec3(1,57,113));return mix(mix(mix(h11(n),h11(n+1.),f.x),mix(h11(n+57.),h11(n+58.),f.x),f.y),mix(mix(h11(n+113.),h11(n+114.),f.x),mix(h11(n+170.),h11(n+171.),f.x),f.y),f.z);}
float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<7;i++){v+=a*noise(p);p=p*2.03+.17;a*=.5;}return v;}
float sph(vec3 p,float r){return length(p)-r;}
float box(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float cyl(vec3 p,float h,float r){vec2 d=abs(vec2(length(p.xz),p.y))-vec2(r,h);return min(max(d.x,d.y),0.)+length(max(d,0.));}
float tor(vec3 p,vec2 t){vec2 q=vec2(length(p.xz)-t.x,p.y);return length(q)-t.y;}
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
float terrain(vec3 p){float water=(u_family==7.)?0.12:1.;float h=fbm(vec3(p.xz*.18,0.)+u_seed*3.)*3.*water+fbm(vec3(p.xz*.62,2.))*0.55; if(u_family==9.) h*=.65; return p.y+1.35-h;}
float architecture(vec3 p){vec3 q=p;q.z+=1.1;float base=box(q-vec3(0,.25,0),vec3(1.75,1.25,.7));float t1=box(q-vec3(-1.25,1,0),vec3(.35,2.2,.4));float t2=box(q-vec3(1.25,1,0),vec3(.35,2.2,.4));float dome=sph((q-vec3(0,1.75,0))*vec3(1,.65,1),.9);float arch=max(tor((q-vec3(0,.15,-.62)).xzy,vec2(.56,.08)),-box(q-vec3(0,.1,-.72),vec3(.48,.85,.2)));return min(min(min(base,t1),t2),min(dome,arch));}
float city(vec3 p){vec2 id=floor((p.xz+30.)/1.55),gv=mod(p.xz+30.,1.55)-.775;float hh=.8+h11(dot(id,vec2(7.7,19.1))+floor(u_mode))*4.8;return box(vec3(gv.x,p.y-hh*.5+1.,gv.y),vec3(.32+h11(id.x)*.2,hh*.5,.32+h11(id.y)*.2));}
float forest(vec3 p){vec3 cell=floor(p/2.),local=mod(p,2.)-1.;float r=h31(cell+floor(u_mode));local.xz+=vec2(r-.5,h11(r*9.3)-.5)*.75;return min(cyl(local-vec3(0,.2,0),.65,.07),sph(local-vec3(0,1,0),.48+r*.28));}
float cosmic(vec3 p){float planet=sph(p-vec3(0,.2,0),1.3+.2*sin(u_mode));float ring=tor((p-vec3(0,.2,0)).xzy*vec3(1,.38,1),vec2(2,.035));float moon=sph(p-vec3(2.1,.7,-.6),.28);return min(min(planet,ring),moon);}
float subject(vec3 p){float body=sph(p-vec3(0,.45,0),.72);float head=sph(p-vec3(0,1.27,0),.31);float base=cyl(p-vec3(0,-.6,0),.24,.84);float halo=tor((p-vec3(0,1.35,0)).xzy,vec2(.48,.025));return smin(smin(smin(body,head,.18),base,.12),halo,.08);}
float uiPanel(vec3 p){vec3 q=p;q.z+=.25;float panel=box(q-vec3(0,.55,0),vec3(1.9,1.2,.08));float card1=box(q-vec3(-.75,.75,-.12),vec3(.55,.32,.06));float card2=box(q-vec3(.65,.35,-.12),vec3(.7,.5,.06));float orb=sph(q-vec3(.85,1.12,-.2),.18);return min(min(panel,card1),min(card2,orb));}
float abstractShape(vec3 p){p.xz*=rot(u_mode*.13);float a=tor(p-vec3(0,.55,0),vec2(1.,.18));float b=sph(p-vec3(sin(u_mode)*.35,.6,cos(u_mode)*.35),.7);float c=box((p-vec3(0,.7,0))*vec3(1,.65,1),vec3(1.1));return smin(smin(a,b,.35),c,.25);}
float map(vec3 p){float d=terrain(p); if(u_family==1.)d=min(d,architecture(p)); else if(u_family==2.)d=min(d,city(p)); else if(u_family==3.)d=min(d,cosmic(p)); else if(u_family==4.)d=min(d,forest(p)); else if(u_family==5.)d=min(d,uiPanel(p)); else if(u_family==7.)d=min(d,sph((p-vec3(0,-.7,0))*vec3(1,.24,1),1.8)); else if(u_family==8.)d=min(d,subject(p)); else if(u_family==9.)d=min(d,architecture(p*.85)); else if(u_family==10.)d=min(d,abstractShape(p)); else d=min(d,subject(p)); return d;}
vec3 normal(vec3 p){vec2 e=vec2(.0015,0);return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));}
float march(vec3 ro,vec3 rd){float t=0.;for(int i=0;i<MAX_STEPS;i++){float d=map(ro+rd*t);t+=d;if(abs(d)<SURF_DIST||t>MAX_DIST)break;}return t;}
float shadow(vec3 ro,vec3 rd){float res=1.,t=.05;for(int i=0;i<58;i++){float h=map(ro+rd*t);res=min(res,12.*h/t);t+=clamp(h,.035,.38);if(res<.02||t>22.)break;}return clamp(res,0.,1.);}
vec3 matCol(vec3 p,vec3 n){float tex=fbm(p*(5.+u_detail*14.)+n*2.);vec3 stone=mix(vec3(.38,.34,.29),u_accent,.12+tex*.24);vec3 metal=mix(vec3(.04,.05,.07),u_secondary,.35+tex*.35);vec3 organic=mix(vec3(.05,.18,.10),u_primary,.35+tex*.3);vec3 water=mix(vec3(.02,.12,.20),u_cool,.45+tex*.25); if(u_family==1.)return stone;if(u_family==2.)return metal;if(u_family==4.)return organic;if(u_family==7.)return water;if(u_family==8.)return mix(u_warm,u_accent,tex);if(u_family==9.)return mix(vec3(.75,.9,1.),u_cool,tex*.35);return mix(u_primary,u_secondary,tex);}
vec3 sky(vec3 rd){float t=max(rd.y*.5+.5,0.);vec3 col=mix(u_shadow,mix(u_primary,u_secondary,.45),t);float sun=pow(max(dot(rd,normalize(vec3(-.4,.65,.55))),0.),280.);col+=u_accent*sun*2.7;float stars=step(.9965,noise(rd*90.+u_seed*6.));if(u_family==3.)col+=stars*u_accent;return col;}
void main(){vec2 uv=(gl_FragCoord.xy*2.-u_resolution.xy)/u_resolution.y;vec3 ro=vec3(0,1.25,5.8);ro.xz*=rot((u_seed-.5)*.75+sin(u_mode)*.08);vec3 target=vec3(0,.55,0);vec3 ww=normalize(target-ro),uu=normalize(cross(vec3(0,1,0),ww)),vv=cross(ww,uu);vec3 rd=normalize(uv.x*uu+uv.y*vv+1.62*ww);vec3 col=sky(rd);float t=march(ro,rd);if(t<MAX_DIST){vec3 p=ro+rd*t,n=normal(p),l=normalize(vec3(-.45,.78,.55));float diff=max(dot(n,l),0.),sh=shadow(p+n*.025,l),spec=pow(max(dot(reflect(-l,n),-rd),0.),mix(18.,72.,u_realism)),rim=pow(1.-max(dot(n,-rd),0.),2.2),ao=clamp(.38+.62*n.y,0.,1.);vec3 base=matCol(p,n);col=base*(.16+diff*sh*.92)*ao+u_accent*spec*.8+u_accent*rim*.2;col*=.86+fbm(p*20.)*.25*u_detail;}float vign=1.-smoothstep(.55,1.65,length(uv));col=mix(col*.42,col,vign);col=pow(col,vec3(.4545));gl_FragColor=vec4(col,1.);}
`;

function compileShader(gl,type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const info=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw new Error("GLSL compile failed: "+info);}return shader;}
function createProgram(gl,vsSource,fsSource){const vs=compileShader(gl,gl.VERTEX_SHADER,vsSource),fs=compileShader(gl,gl.FRAGMENT_SHADER,fsSource);const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS)){const info=gl.getProgramInfoLog(program);gl.deleteProgram(program);throw new Error("WebGL program link failed: "+info);}return program;}

function canvasPostProcess(canvas, spec){
  if(!spec.post) return;
  const ctx=canvas.getContext("2d"); if(!ctx) return;
  const rand=mulberry32(spec.seed); const w=canvas.width,h=canvas.height;
  ctx.save();
  ctx.globalCompositeOperation="screen";
  for(let i=0;i<36;i++){
    const x=rand()*w,y=rand()*h,r=(8+rand()*90)*(spec.detail+.2);
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,rgbCss(spec.palette.accent,.08)); g.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill();
  }
  ctx.globalCompositeOperation="overlay";
  ctx.fillStyle="rgba(255,255,255,0.018)";
  for(let i=0;i<900;i++) ctx.fillRect(rand()*w,rand()*h,1,1);
  if(spec.intent.includes("2D")){
    ctx.globalCompositeOperation="source-over";
    ctx.strokeStyle=rgbCss(spec.palette.accent,.35); ctx.lineWidth=2;
    for(let i=0;i<7;i++){const x=40+i*w/8;ctx.strokeRect(x,80+rand()*80,w/9,80+rand()*160);}
  }
  ctx.restore();
}

export class ImageSpudHighPriest {
  constructor(options={}){this.options=options;this._lastSpec=null;}
  describe(prompt="hi",options={}){return expandPromptToImageSpec(prompt,options);}
  listModes(){return [...IMAGE_SPUD_MODES];}
  async generate(prompt="hi",options={}){
    if(typeof document==="undefined") throw new Error("ImageSpudHighPriest.generate() requires a browser document/WebGL environment.");
    const spec=expandPromptToImageSpec(prompt,{...this.options,...options});this._lastSpec=spec;
    const width=clamp(safeNumber(options.width,spec.width||DEFAULT_WIDTH),128,2048),height=clamp(safeNumber(options.height,spec.height||DEFAULT_HEIGHT),128,2048);
    const canvas=options.canvas||document.createElement("canvas");canvas.width=width;canvas.height=height;
    const gl=canvas.getContext("webgl",{preserveDrawingBuffer:true,antialias:true})||canvas.getContext("experimental-webgl",{preserveDrawingBuffer:true,antialias:true});
    if(!gl) throw new Error("WebGL is not available in this browser.");
    gl.viewport(0,0,width,height);const program=createProgram(gl,vertexShader,fragmentShader);gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const pos=gl.getAttribLocation(program,"a_position");gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    const set1=(n,v)=>gl.uniform1f(gl.getUniformLocation(program,n),v),set2=(n,a,b)=>gl.uniform2f(gl.getUniformLocation(program,n),a,b),set3=(n,c)=>gl.uniform3f(gl.getUniformLocation(program,n),c[0],c[1],c[2]);
    set2("u_resolution",width,height);set1("u_seed",(spec.seed%100000)/100000);set1("u_mode",spec.modeIndex);set1("u_family",spec.family);set1("u_realism",spec.realism);set1("u_detail",spec.detail);set3("u_primary",spec.palette.primary);set3("u_secondary",spec.palette.secondary);set3("u_accent",spec.palette.accent);set3("u_shadow",spec.palette.shadow);set3("u_warm",spec.palette.warm);set3("u_cool",spec.palette.cool);
    gl.drawArrays(gl.TRIANGLES,0,6);gl.deleteBuffer(buffer);gl.deleteProgram(program);
    canvasPostProcess(canvas,spec);
    const dataUri=canvas.toDataURL(options.mimeType||"image/png",options.quality||0.96);
    return {type:"image/png",dataUri,width,height,promptSpec:spec,renderer:"Everything Ultra WebGL GLSL + Canvas post-process",version:IMAGENER_VERSION};
  }
  async generateBatch(prompts=[],options={}){const out=[];for(const p of prompts) out.push(await this.generate(p,options));return out;}
  download(result,filename="image-spud-ultra.png"){const a=document.createElement("a");a.href=result.dataUri||result;a.download=filename;document.body.appendChild(a);a.click();a.remove();}
  mountUI(container,options={}){
    const root=typeof container==="string"?document.querySelector(container):container;if(!root)throw new Error("mountUI(container): container not found.");
    root.innerHTML=`<div style="font-family:system-ui;background:#101114;color:#eef;padding:16px;border-radius:18px;max-width:760px;border:1px solid #2d3340"><div style="display:flex;gap:8px;align-items:center;margin-bottom:12px"><strong style="font-size:18px">Image-Spud Everything Ultra</strong><span style="opacity:.6;font-size:12px">200+ modes • WebGL GLSL • 2D UI helper</span></div><textarea data-spud-prompt style="width:100%;min-height:76px;border-radius:12px;background:#181b22;color:#fff;border:1px solid #3a4354;padding:12px" placeholder="Describe any image..."></textarea><div style="display:flex;gap:8px;margin:10px 0;flex-wrap:wrap"><select data-spud-mode style="flex:1;min-width:240px;background:#181b22;color:#fff;border:1px solid #3a4354;border-radius:10px;padding:8px"><option value="">Auto choose mode</option>${IMAGE_SPUD_MODES.map(m=>`<option value="${m}">${m}</option>`).join("")}</select><button data-spud-generate style="background:#2563eb;color:white;border:0;border-radius:10px;padding:9px 14px;font-weight:700">Generate</button><button data-spud-download style="background:#374151;color:white;border:0;border-radius:10px;padding:9px 14px;font-weight:700">Download</button></div><div data-spud-status style="font-size:12px;opacity:.7;margin-bottom:8px">Ready.</div><img data-spud-img style="width:100%;border-radius:14px;background:#000;display:none" /></div>`;
    const promptEl=root.querySelector("[data-spud-prompt]"),modeEl=root.querySelector("[data-spud-mode]"),button=root.querySelector("[data-spud-generate]"),download=root.querySelector("[data-spud-download]"),img=root.querySelector("[data-spud-img]"),status=root.querySelector("[data-spud-status]");let last=null;
    button.onclick=async()=>{status.textContent="Rendering Everything Ultra scene...";button.disabled=true;try{last=await this.generate(promptEl.value||"hi",{mode:modeEl.value||undefined,...options});img.src=last.dataUri;img.style.display="block";status.textContent=`Done: ${last.promptSpec.modeName}`;}catch(err){status.textContent="Error: "+err.message;}finally{button.disabled=false;}};
    download.onclick=()=>{if(last)this.download(last,`image-spud-${Date.now()}.png`);};return root;
  }
}
export default ImageSpudHighPriest;
