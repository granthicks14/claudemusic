// ---------------------------------------------------------------------------
// Learning what THIS user likes
// ---------------------------------------------------------------------------
// The program already chooses between candidates: every "Generate" composes
// twelve beats and keeps the best one according to scoreVariation. But that
// scorer's opinions are hand-written by me. It encodes what I think a good
// beat is, and it is identical for every person who ever uses the program.
//
// This file closes the loop. The user rates beats; the program measures what
// the liked ones have in common that the disliked ones do not; and that
// difference becomes an extra term in the candidate search. Over time the
// generator drifts toward the kind of beat this particular person keeps
// choosing.
//
// WHAT THIS IS, PRECISELY: online preference learning with a linear model
// over hand-designed features - a Rocchio-style classifier, weights being
// the difference between the liked and disliked centroids, with a
// confidence term that grows as ratings accumulate.
//
// WHAT IT IS NOT: deep reinforcement learning. A deep RL agent needs either
// a simulator with a programmatic reward or a large offline dataset of
// rated examples, and neither exists here - the only reward signal is a
// human pressing a button, which arrives a few dozen times, not a few
// million. A deep network trained on thirty examples would do nothing but
// memorise them. A linear model over meaningful features is the honest
// choice at this data volume: it learns from the very first rating, it
// cannot overfit into nonsense, and you can read off exactly what it has
// concluded (see describeTaste below), which a neural net would not let
// you do.

const LEARN_STORAGE_KEY = "beatstudio.taste.v1";

// The features the model reasons about. Each is normalised to roughly 0..1
// so no single one dominates by unit alone, and each is something a person
// could actually have an opinion about.
const TASTE_FEATURES = [
  "syncopation",      // how far off the grid the drums sit
  "drumDensity",      // how full the kit pattern is
  "melodicDensity",   // how many notes the melodic parts play
  "chordSize",        // triads vs 7ths vs 9ths and 11ths
  "layers",           // how many parts are playing at once
  "registerSpread",   // how far apart the highest and lowest parts sit
  "brightness",       // where the centre of mass of the pitch content is
  "ghostiness",       // quiet in-between drum detail
  "harmonicRhythm",   // how often the chord changes
  "bassActivity",     // how busy the low end is
  "topActivity",      // how busy the lead voice is
  "restfulness",      // how much silence there is
];

function emptyVector() {
  const v = {};
  for (const k of TASTE_FEATURES) v[k] = 0;
  return v;
}

// Measure a generated beat. Everything here is read straight off the
// pattern, so it describes what was actually produced rather than what was
// requested.
function tasteFeatures(style, v) {
  const f = emptyVector();
  const inst = v.instruments || {};
  const bars = Math.max(1, (v.structure || []).length);
  const drumLanes = (style.drums.instruments || []).filter((d) => d !== "crash" && d !== "fx");

  // Rhythm.
  if (typeof patternSyncopation === "function") {
    f.syncopation = Math.min(1, patternSyncopation(inst, drumLanes) / 20);
  }
  let dOn = 0, dSlots = 0, ghosts = 0;
  for (const d of drumLanes) {
    const t = inst[d];
    if (!Array.isArray(t)) continue;
    for (const x of t) {
      dSlots++;
      if (x) dOn++;
      if (x === "ghost") ghosts++;
    }
  }
  f.drumDensity = dSlots ? Math.min(1, dOn / dSlots / 0.45) : 0;
  f.ghostiness = dOn ? Math.min(1, ghosts / dOn / 0.3) : 0;

  // Pitch content.
  let mNotes = 0, mSlots = 0, chordTones = 0, chords = 0;
  let lo = Infinity, hi = -Infinity, degSum = 0, degN = 0;
  let bassOn = 0, topOn = 0, topSlots = 0;
  for (const k of Object.keys(inst)) {
    const t = inst[k];
    if (!Array.isArray(t) || drumLanes.includes(k) || k === "crash" || k === "fx") continue;
    for (const x of t) {
      mSlots++;
      if (!x || typeof x !== "object") continue;
      mNotes++;
      if (k === "bass") bassOn++;
      const degs = x.degrees || (x.degree !== undefined ? [x.degree] : null);
      if (!degs) continue;
      if (x.degrees) { chordTones += x.degrees.length; chords++; }
      for (const d of degs) {
        lo = Math.min(lo, d); hi = Math.max(hi, d);
        degSum += d; degN++;
      }
    }
  }
  f.melodicDensity = mSlots ? Math.min(1, mNotes / mSlots / 0.35) : 0;
  f.chordSize = chords ? Math.min(1, (chordTones / chords) / 6) : 0;
  f.layers = Math.min(1, Object.keys(inst).length / 14);
  f.registerSpread = lo === Infinity ? 0 : Math.min(1, (hi - lo) / 35);
  f.brightness = degN ? Math.min(1, Math.max(0, (degSum / degN + 7) / 40)) : 0;
  f.bassActivity = Math.min(1, bassOn / (bars * 8));
  f.restfulness = mSlots ? 1 - Math.min(1, mNotes / mSlots / 0.5) : 1;

  // The featured top line - whichever solo voice is present.
  for (const k of ["lead", "sax", "woodwind", "leadguitar", "autolead", "arp", "talkbox", "kalimba", "marimba"]) {
    const t = inst[k];
    if (!Array.isArray(t)) continue;
    topSlots += t.length;
    for (const x of t) if (x) topOn++;
  }
  f.topActivity = topSlots ? Math.min(1, topOn / topSlots / 0.4) : 0;

  // Harmonic rhythm: how many distinct chord roots per bar.
  const roots = v.barRootDegrees || [];
  let changes = 0;
  for (let i = 1; i < roots.length; i++) if (roots[i] !== roots[i - 1]) changes++;
  f.harmonicRhythm = roots.length ? Math.min(1, changes / roots.length / 0.8) : 0;

  return f;
}

// ---------------------------------------------------------------------------
// The model
// ---------------------------------------------------------------------------
const Taste = {
  likedSum: emptyVector(),
  likedN: 0,
  dislikedSum: emptyVector(),
  dislikedN: 0,
  // Sum of squares across ALL rated beats, so the model knows how much
  // each feature actually varies. Without this, a feature that is nearly
  // constant across every beat the program makes (harmonic rhythm, say)
  // still contributes its tiny mean difference to the weight vector, and
  // pure noise on a low-variance feature can outrank a real preference on
  // a high-variance one. Dividing by the standard deviation turns each
  // weight into "how many standard deviations apart are the liked and
  // disliked groups on this feature" - a discriminative signal rather
  // than a raw difference.
  sumSq: emptyVector(),
  totalN: 0,
  weights: emptyVector(),
  history: [],   // recent ratings, for the "what have you learned" readout

  load() {
    try {
      const raw = typeof localStorage !== "undefined" && localStorage.getItem(LEARN_STORAGE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      // Defensive: an older or corrupted blob must not break generation.
      if (!d || typeof d !== "object") return;
      for (const k of TASTE_FEATURES) {
        this.likedSum[k] = Number(d.likedSum && d.likedSum[k]) || 0;
        this.dislikedSum[k] = Number(d.dislikedSum && d.dislikedSum[k]) || 0;
      }
      for (const k of TASTE_FEATURES) this.sumSq[k] = Number(d.sumSq && d.sumSq[k]) || 0;
      this.likedN = Number(d.likedN) || 0;
      this.dislikedN = Number(d.dislikedN) || 0;
      this.totalN = Number(d.totalN) || (this.likedN + this.dislikedN);
      this.history = Array.isArray(d.history) ? d.history.slice(-40) : [];
      this.recompute();
    } catch (_) { /* corrupt storage is not worth crashing over */ }
  },

  save() {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(LEARN_STORAGE_KEY, JSON.stringify({
        likedSum: this.likedSum, likedN: this.likedN,
        dislikedSum: this.dislikedSum, dislikedN: this.dislikedN,
        sumSq: this.sumSq, totalN: this.totalN,
        history: this.history.slice(-40),
      }));
    } catch (_) { /* private mode, quota, etc. */ }
  },

  // Weights are the difference between what liked beats look like and what
  // disliked ones look like. A feature only earns weight if the two groups
  // genuinely differ on it - features both groups share cancel to zero,
  // which is exactly the behaviour you want.
  recompute() {
    const w = emptyVector();
    if (!this.likedN && !this.dislikedN) { this.weights = w; return; }
    for (const k of TASTE_FEATURES) {
      const l = this.likedN ? this.likedSum[k] / this.likedN : 0;
      const d = this.dislikedN ? this.dislikedSum[k] / this.dislikedN : 0;
      // With only likes and no dislikes, 0.5 stands in for "an average
      // beat" so the model still has a direction to move in.
      const diff = l - (this.dislikedN ? d : 0.5);
      // Standard deviation of this feature over everything rated so far.
      const mean = this.totalN ? (this.likedSum[k] + this.dislikedSum[k]) / this.totalN : 0;
      const varr = this.totalN ? Math.max(0, this.sumSq[k] / this.totalN - mean * mean) : 0;
      const sd = Math.sqrt(varr);
      // The floor stops a feature that never varies from producing an
      // enormous weight by dividing by almost nothing.
      w[k] = diff / (sd + 0.05);
    }
    // Normalise so the learned term cannot outgrow the musical scorer no
    // matter how lopsided the ratings get.
    let mag = 0;
    for (const k of TASTE_FEATURES) mag += w[k] * w[k];
    mag = Math.sqrt(mag) || 1;
    for (const k of TASTE_FEATURES) w[k] /= mag;
    this.weights = w;
  },

  // Confidence ramps with the number of ratings, so one stray thumbs-down
  // cannot hijack the generator, and a user who never rates anything gets
  // exactly the behaviour they had before this file existed.
  confidence() {
    const n = this.likedN + this.dislikedN;
    return Math.min(1, n / 10);
  },

  rate(style, v, liked) {
    const f = tasteFeatures(style, v);
    const target = liked ? this.likedSum : this.dislikedSum;
    for (const k of TASTE_FEATURES) { target[k] += f[k]; this.sumSq[k] += f[k] * f[k]; }
    this.totalN++;
    if (liked) this.likedN++; else this.dislikedN++;
    this.history.push({ liked, styleId: style.id, at: Date.now() });
    this.recompute();
    this.save();
    return this.describeTaste();
  },

  // The learned bonus added to a candidate's musical score. Capped so it
  // can steer the search without ever overruling the musical criteria -
  // the program should learn your taste, not forget how music works.
  bonus(style, v) {
    const c = this.confidence();
    if (c <= 0) return 0;
    const f = tasteFeatures(style, v);
    let dot = 0;
    for (const k of TASTE_FEATURES) dot += this.weights[k] * f[k];
    return dot * 30 * c;
  },

  // Selection alone is not enough. The candidate search can only choose
  // between the twelve beats it was handed, so if none of them lean the
  // way the user prefers, re-weighting the scorer changes nothing. These
  // are small nudges to the same generation knobs the complexity dial
  // uses, so the candidates themselves start arriving closer to taste.
  // Deliberately gentle: the genre and the complexity setting must stay
  // in charge, with taste as a lean rather than an override.
  generationBias() {
    const c = this.confidence();
    if (c <= 0) return null;
    const g = (k) => (this.weights[k] || 0) * c;
    return {
      syncopation: g("syncopation") * 3.0,
      density: g("drumDensity") * 0.05,
      extension: g("chordSize") * 0.8,
      layers: g("layers") * 0.15,
      melodic: g("melodicDensity") * 0.06,
    };
  },

  reset() {
    this.likedSum = emptyVector();
    this.dislikedSum = emptyVector();
    this.likedN = 0;
    this.dislikedN = 0;
    this.sumSq = emptyVector();
    this.totalN = 0;
    this.history = [];
    this.weights = emptyVector();
    this.save();
  },

  // Readable account of what the model currently believes. A linear model
  // over named features can explain itself; that is a large part of why it
  // is the right tool here.
  describeTaste() {
    const n = this.likedN + this.dislikedN;
    if (n < 2) return { n, text: `${n} rating${n === 1 ? "" : "s"} so far — keep rating and it will start steering.` };
    const ranked = TASTE_FEATURES
      .map((k) => ({ k, w: this.weights[k] }))
      .sort((a, b) => Math.abs(b.w) - Math.abs(a.w))
      .slice(0, 3)
      .filter((x) => Math.abs(x.w) > 0.08);
    if (!ranked.length) return { n, text: `${n} ratings — no clear pattern yet.` };
    const label = {
      syncopation: ["more syncopated", "straighter"],
      drumDensity: ["busier drums", "sparser drums"],
      melodicDensity: ["more notes", "fewer notes"],
      chordSize: ["richer chords", "simpler chords"],
      layers: ["more layers", "fewer layers"],
      registerSpread: ["wider register", "tighter register"],
      brightness: ["brighter", "darker"],
      ghostiness: ["more ghost notes", "cleaner drums"],
      harmonicRhythm: ["faster chord changes", "slower chord changes"],
      bassActivity: ["busier bass", "simpler bass"],
      topActivity: ["busier lead", "sparser lead"],
      restfulness: ["more space", "less space"],
    };
    const parts = ranked.map((x) => (label[x.k] || [x.k, x.k])[x.w > 0 ? 0 : 1]);
    return { n, text: `${n} ratings — you seem to prefer ${parts.join(", ")}.`, ranked };
  },
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { Taste, tasteFeatures, TASTE_FEATURES };
}
