// Does naming an artist actually change the beat?
//
// The type-beat feature sets genre, tempo, key, swing, complexity, kits and
// solo voices. Everything else - how dense the drums are, how syncopated,
// how many parts play, how much space the melody leaves - comes from the
// genre and the complexity dial alone. So two artists in the same genre at
// the same complexity get structurally identical beats with different
// drum sounds on top.
//
// This measures that, so any claim about "sounding more like the artist"
// has a number behind it rather than an assertion.
//
// Run: node tools/measure-artist-match.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const FILES = ["js/theory.js", "js/instruments.js", "js/performance.js", "js/learning.js",
               "js/policy.js", "js/audio-analysis.js", "js/artists.js", "js/midi-export.js",
               "js/production.js", "js/patterns.js", "js/rating.js"];
const src = FILES.map((f) => fs.readFileSync(path.join(root, f), "utf8")).join("\n;\n");
const sandbox = { module: { exports: {} }, console, JSON };
vm.createContext(sandbox);
const api = vm.runInContext(src + `\n;({ ARTIST_PROFILES, STYLES, generateVariation,
  setBeatComplexity, patternSyncopation, setArtistKnobs, artistKnobs })`, sandbox, { filename: "bundle.js" });
const { ARTIST_PROFILES, STYLES, generateVariation, setBeatComplexity } = api;

// The measurable traits of a generated beat. Deliberately the same family of
// quantities the generation knobs control, so a difference here means the
// beat really is built differently rather than merely sounding different.
function fingerprint(style, v) {
  const inst = v.instruments || {};
  const percussion = style.drums.instruments || [];
  const groove = percussion.filter((d) => d !== "crash" && d !== "fx");

  let on = 0, slots = 0;
  for (const d of groove) {
    const t = inst[d];
    if (!Array.isArray(t)) continue;
    for (const x of t) { slots++; if (x) on++; }
  }
  const melodic = Object.keys(inst).filter((k) => !percussion.includes(k) && Array.isArray(inst[k]));
  let notes = 0, mSlots = 0, lo = Infinity, hi = -Infinity;
  for (const k of melodic) {
    mSlots += inst[k].length;
    for (const x of inst[k]) {
      if (!x || typeof x !== "object") continue;
      notes++;
      for (const d of (x.degrees || (x.degree !== undefined ? [x.degree] : []))) {
        lo = Math.min(lo, d); hi = Math.max(hi, d);
      }
    }
  }
  const layers = Object.keys(inst).filter((k) => Array.isArray(inst[k]) && inst[k].some(Boolean)).length;
  return {
    density: slots ? on / slots : 0,
    fill: mSlots ? notes / mSlots : 0,
    layers,
    range: lo === Infinity ? 0 : hi - lo,
    sync: api.patternSyncopation(inst, groove),
  };
}

const KEYS = ["density", "fill", "layers", "range", "sync"];
// Spread of each trait across everything generated, used to put the traits
// on a common scale before any distance is computed. Without this, "layers"
// (which ranges over ~10) would drown "density" (which ranges over ~0.3).
function distance(a, b, scale) {
  let s = 0;
  for (const k of KEYS) {
    const d = (a[k] - b[k]) / (scale[k] || 1);
    s += d * d;
  }
  return Math.sqrt(s / KEYS.length);
}

function meanOf(list) {
  const m = {};
  for (const k of KEYS) m[k] = list.reduce((s, x) => s + x[k], 0) / list.length;
  return m;
}

// Sample each artist several times so the comparison is between averages
// rather than between single random draws.
const N = 12;
const byArtist = new Map();
const all = [];
for (const name of Object.keys(ARTIST_PROFILES)) {
  const p = ARTIST_PROFILES[name];
  const style = STYLES[p.genre];
  if (!style) continue;
  const samples = [];
  for (let i = 0; i < N; i++) {
    setBeatComplexity(p.complexity);
    // Off unless the run is exercising them, so the before/after comparison
    // is between the same code with one thing changed.
    let knobs = process.env.NO_ARTIST_KNOBS ? null : api.artistKnobs(p);
    const gain = Number(process.env.KNOB_GAIN || 1);
    if (knobs && gain !== 1) {
      knobs = Object.fromEntries(Object.entries(knobs).map(([k, v]) => [k, v * gain]));
    }
    api.setArtistKnobs(knobs);
    const s = Object.assign({}, style, { soloOverride: (p.solos || []).slice() });
    let v;
    try { v = generateVariation(s, 4); } catch (e) { continue; }
    const f = fingerprint(s.genStyle || style, v);
    samples.push(f);
    all.push(f);
  }
  if (samples.length) byArtist.set(name, samples);
}

const scale = {};
for (const k of KEYS) {
  const vals = all.map((x) => x[k]);
  const mu = vals.reduce((a, b) => a + b, 0) / vals.length;
  scale[k] = Math.sqrt(vals.reduce((a, b) => a + (b - mu) * (b - mu), 0) / vals.length) || 1;
}

// The question: within a genre, are two different artists further apart than
// two runs of the SAME artist? If not, the profile is not shaping the beat.
const genres = {};
for (const [name, samples] of byArtist) {
  const g = ARTIST_PROFILES[name].genre;
  (genres[g] ||= []).push([name, meanOf(samples), samples]);
}

let withinSum = 0, withinN = 0, betweenSum = 0, betweenN = 0;
console.log("\nPer genre: how far apart are two artists, vs two runs of one artist?\n");
console.log("genre         artists   within-artist   between-artist   ratio");
for (const g of Object.keys(genres)) {
  const list = genres[g];
  if (list.length < 2) continue;
  let w = 0, wn = 0, b = 0, bn = 0;
  for (const [, mean, samples] of list) {
    for (const s of samples) { w += distance(s, mean, scale); wn++; }
  }
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      b += distance(list[i][1], list[j][1], scale); bn++;
    }
  }
  withinSum += w; withinN += wn; betweenSum += b; betweenN += bn;
  const wm = w / wn, bm = b / bn;
  console.log(`${g.padEnd(13)} ${String(list.length).padStart(4)}      ${wm.toFixed(3).padStart(9)}       ${bm.toFixed(3).padStart(9)}     ${(bm / wm).toFixed(2)}`);
}
const W = withinSum / withinN, B = betweenSum / betweenN;
console.log(`\noverall       within ${W.toFixed(3)}   between ${B.toFixed(3)}   ratio ${(B / W).toFixed(3)}`);
console.log(`
A ratio near 1.0 means two DIFFERENT artists in a genre differ no more than
two runs of the SAME artist - i.e. the profile is not shaping the structure
of the beat at all, only its drum sounds. Above 1 means the profile is
genuinely steering what gets written.`);
