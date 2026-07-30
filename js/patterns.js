const STEPS_PER_BAR = 16;

const REGISTER = { bass: 0, piano: 14, pad: 7, lead: 21, stab: 14, guitar: 7, strings: 14, horn: 14, organ: 7, vocal: 14, kalimba: 14, marimba: 14, arp: 18 };

const FLAVOR_POOLS = {
  kick: ["boombap", "808", "fourfloor", "acoustic", "lofi", "deep", "snappy", "click", "punch", "subkick", "gritty", "roomy"],
  snare: ["crisp", "clap", "fat", "rimshot", "trapsnap", "brush", "gated", "acoustic", "ghost", "layered"],
  hihat: ["bright", "dark", "vinyl", "metallic", "analog", "tape", "sizzle", "lofi808"],
  perc: ["shaker", "conga", "cowbell", "clave", "tambourine", "bongo", "triangle"],
  bass: ["warm", "synth", "808", "hard808", "sub", "pluck", "logdrum", "wobble", "drillslide", "distorted", "reese", "growl", "upright"],
  piano: ["electric", "pluck", "grand", "rhodes", "wurlitzer", "upright", "celesta", "toy", "harpsichord"],
  lead: ["square", "saw", "bell", "flute", "supersaw", "pluck", "sine", "chip", "brasslead", "fm"],
  pad: ["warm", "ensemble", "airy", "glass", "choir", "dark"],
  stab: ["pluck-chord", "square-chord", "bell-chord", "brass-chord", "organ-chord", "string-chord"],
  guitar: ["clean", "power", "muted", "nylon", "acoustic", "jazz", "funk", "twelvestring"],
  strings: ["soul", "orchestral", "staccato", "synth", "pizzicato", "tremolo"],
  horn: ["brass", "soft", "muted", "sax", "trumpetstab", "section"],
  organ: ["drawbar", "gospel", "church", "combo"],
  vocal: ["ooh", "ahh", "ay", "oh", "choir"],
  kalimba: ["kalimba", "musicbox", "steeldrum"],
  marimba: ["marimba", "vibraphone"],
  arp: ["arp", "pulse"],
  fx: ["riser", "siren", "impact"],
};

// Tags each flavor by sonic character (warm/bright/dark) so a shuffle can
// pick one character and apply it across every instrument at once, instead
// of rolling each instrument's flavor fully independently. Real producers
// build a kit from one coherent sample pack or one console's character
// rather than grabbing random one-off samples - this is the same idea
// applied to a shuffle, so "Generate Beat" lands on a beat that sounds like
// one production instead of several unrelated instruments stacked together.
const FLAVOR_TAGS = {
  kick: { boombap: "warm", "808": "dark", fourfloor: "bright", acoustic: "warm", lofi: "warm", deep: "dark", snappy: "bright", click: "bright", punch: "bright", subkick: "dark", gritty: "dark", roomy: "warm" },
  snare: { crisp: "bright", clap: "bright", fat: "warm", rimshot: "bright", trapsnap: "bright", brush: "warm", gated: "dark", acoustic: "warm", ghost: "dark", layered: "dark" },
  hihat: { bright: "bright", dark: "dark", vinyl: "warm", metallic: "bright", analog: "warm", tape: "warm", sizzle: "bright", lofi808: "dark" },
  perc: { shaker: "warm", conga: "warm", cowbell: "bright", clave: "bright", tambourine: "bright", bongo: "warm", triangle: "bright" },
  bass: { warm: "warm", synth: "bright", "808": "dark", hard808: "dark", sub: "dark", pluck: "warm", logdrum: "dark", wobble: "dark", drillslide: "dark", distorted: "dark", reese: "dark", growl: "dark", upright: "warm" },
  piano: { electric: "bright", pluck: "bright", grand: "warm", rhodes: "warm", wurlitzer: "warm", upright: "warm", celesta: "bright", toy: "bright", harpsichord: "bright" },
  lead: { square: "bright", saw: "bright", bell: "bright", flute: "warm", supersaw: "bright", pluck: "bright", sine: "warm", chip: "bright", brasslead: "warm", fm: "bright" },
  pad: { warm: "warm", ensemble: "warm", airy: "bright", glass: "bright", choir: "warm", dark: "dark" },
  stab: { "pluck-chord": "bright", "square-chord": "bright", "bell-chord": "bright", "brass-chord": "warm", "organ-chord": "warm", "string-chord": "warm" },
  guitar: { clean: "bright", power: "dark", muted: "dark", nylon: "warm", acoustic: "warm", jazz: "warm", funk: "bright", twelvestring: "bright" },
  strings: { soul: "warm", orchestral: "warm", staccato: "bright", synth: "bright", pizzicato: "bright", tremolo: "dark" },
  horn: { brass: "bright", soft: "warm", muted: "dark", sax: "warm", trumpetstab: "bright", section: "bright" },
  organ: { drawbar: "warm", gospel: "dark", church: "dark", combo: "bright" },
  vocal: { ooh: "warm", ahh: "warm", ay: "bright", oh: "warm", choir: "warm" },
  kalimba: { kalimba: "warm", musicbox: "bright", steeldrum: "bright" },
  marimba: { marimba: "warm", vibraphone: "bright" },
  arp: { arp: "bright", pulse: "warm" },
  fx: { riser: "bright", siren: "dark", impact: "dark" },
};

const FLAVOR_PALETTES = ["warm", "bright", "dark"];

function M(degreeOffset, len) {
  return { type: "mono", degreeOffset, len };
}
function C(degreeOffset, size, len) {
  return { type: "chord", degreeOffset, size, len };
}

// ---- Motif-based melody generation ----
// Grounded in real songwriting practice: a short motif is stated, then
// repeated with small variations (transposition, inversion, truncation) so
// the ear recognizes it as a hook rather than random notes (motivic
// sequence / repetition-with-variation). Notes mostly land on chord tones
// (root/3rd/5th, the "safe" landing notes) with occasional passing tones.

function pickWeighted(pool) {
  const total = pool.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [v, w] of pool) {
    r -= w;
    if (r < 0) return v;
  }
  return pool[0][0];
}

// Real hooks lean on a small, reused set of pitches (most pop hooks use only
// 3-4 distinct notes) shaped into a "leap up, then step back down" arc rather
// than a fresh random pitch on every note - that's what makes a phrase read
// as a tune instead of noodling.
function buildPitchPool(params) {
  const pool = [0];
  for (let i = 0; i < 2; i++) {
    const useChordTone = Math.random() < params.chordToneProbability;
    const val = pickWeighted(useChordTone ? params.chordTonePool : params.passingTonePool);
    if (!pool.includes(val)) pool.push(val);
  }
  return pool.sort((a, b) => a - b);
}

function generateMotif(lengthSteps, params) {
  const pitchPool = buildPitchPool(params);
  const events = [];
  let pos = 0;
  while (pos < lengthSteps) {
    const dur = Math.min(pickWeighted(params.noteLengths), lengthSteps - pos);
    if (Math.random() < params.restProbability) {
      events.push({ offset: pos, duration: dur, degreeOffset: null });
    } else {
      const progress = pos / lengthSteps;
      const arc = Math.sin(progress * Math.PI); // 0 at the edges, 1 in the middle
      let idx = Math.round(arc * (pitchPool.length - 1));
      if (Math.random() < 0.25) {
        idx = Math.max(0, Math.min(pitchPool.length - 1, idx + (Math.random() < 0.5 ? -1 : 1)));
      }
      events.push({ offset: pos, duration: dur, degreeOffset: pitchPool[idx] });
    }
    pos += dur;
  }
  return events;
}

function transformMotif(motif, mode) {
  if (mode === "transposeUp") return motif.map((e) => (e.degreeOffset === null ? e : { ...e, degreeOffset: e.degreeOffset + 2 }));
  if (mode === "transposeDown") return motif.map((e) => (e.degreeOffset === null ? e : { ...e, degreeOffset: e.degreeOffset - 2 }));
  if (mode === "invert") {
    const reversed = [...motif].reverse();
    let pos = 0;
    return reversed.map((e) => {
      const ev = { ...e, offset: pos };
      pos += e.duration;
      return ev;
    });
  }
  if (mode === "truncate") return motif.slice(0, Math.max(1, motif.length - 1));
  return motif;
}

function thinRange(arr, start, end, keepProbability) {
  for (let i = start; i < end; i++) {
    if (arr[i] && Math.random() > keepProbability) arr[i] = null;
  }
}

// Real melodies don't sit in the exact same register every time, and a
// call-and-response pair usually contrasts by dropping the "answer" an
// octave (both are standard melody-writing techniques). registerJitter
// picks a whole octave up/down/same once per generation so repeated
// "Generate Beat" clicks land the melody somewhere different, instead of
// the same high pitch every time; the per-phrase octave drop below gives
// the call/response pairing an audible register contrast too.
function generateMonoMelody(register, structure, barRootDegrees, params, totalSteps) {
  const registerJitter = pickWeighted([[-7, 1], [0, 3], [7, 1]]);
  const effectiveRegister = register + registerJitter;

  const arr = new Array(totalSteps).fill(null);
  const motifLen = params.motifBars * STEPS_PER_BAR;
  const motif = generateMotif(motifLen, params);
  let chunkStart = 0;
  let chunkIndex = 0;

  while (chunkStart < totalSteps) {
    let motifToUse = motif;
    if (chunkIndex > 0 && Math.random() < params.variationProbability) {
      const modes = ["transposeUp", "transposeDown", "invert", "truncate"];
      motifToUse = transformMotif(motif, modes[Math.floor(Math.random() * modes.length)]);
    }
    // Question-and-answer phrasing: every other repeat is the "answer,"
    // sometimes dropped an octave for contrast, and always resolves its
    // final note back to the tonic - the classic call-response pairing
    // that makes a phrase feel finished rather than just looping.
    if (chunkIndex % 2 === 1) {
      if (Math.random() < 0.5) {
        motifToUse = motifToUse.map((e) => (e.degreeOffset === null ? e : { ...e, degreeOffset: e.degreeOffset - 7 }));
      }
      for (let i = motifToUse.length - 1; i >= 0; i--) {
        if (motifToUse[i].degreeOffset !== null) {
          motifToUse = motifToUse.map((e, idx) => (idx === i ? { ...e, degreeOffset: 0 } : e));
          break;
        }
      }
    }
    for (const ev of motifToUse) {
      if (ev.degreeOffset === null) continue;
      const stepPos = chunkStart + ev.offset;
      if (stepPos >= totalSteps) continue;
      const barIdx = Math.floor(stepPos / STEPS_PER_BAR);
      const barRoot = barRootDegrees[barIdx];
      const dur = Math.min(ev.duration, totalSteps - stepPos);
      arr[stepPos] = { degree: barRoot + effectiveRegister + ev.degreeOffset, len: dur };
    }
    chunkStart += motifLen;
    chunkIndex++;
  }

  if (structure[0] === "intro") thinRange(arr, 0, STEPS_PER_BAR, 0.3);
  return arr;
}

const STYLES = {
  hiphop: {
    name: "Hip-Hop",
    description: "Boom bap with a soulful, sample-style melody and moody minor chords.",
    tempo: { min: 82, max: 96, default: 90 },
    swing: 0.15,
    humanize: { timingMs: 6, velocityJitter: 0.18 },
    key: "C2",
    scale: "minor",
    progressions: [[0, 3, 4, 3], [0, 5, 3, 4], [0, 6, 3, 4], [0, 3, 6, 2]],
    defaultFlavors: { kick: "boombap", snare: "crisp", hihat: "dark", perc: "shaker", bass: "warm", piano: "electric", lead: "flute", strings: "soul", stab: "pluck-chord", organ: "gospel" },
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "perc"],
      main: {
        core: {
          kick:    [1,0,0,0, 0,0,1,0, 0,0,0,1, 0,0,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          perc:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,1,0, 0,1,0,0, 1,0,0,0, 0,1,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
          openhat: [0,0,0,1, 0,0,0,0, 0,0,0,1, 0,0,0,0],
          perc:    [0,1,0,0, 0,0,1,0, 0,1,0,0, 0,0,1,0],
        },
        optionalProbability: 0.35,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,0,1, 0,0,0,0, 1,0,1,0, 0,0,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          perc:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,1,0, 0,1,0,0, 0,0,0,1, 0,1,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
          openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
          perc:    [0,1,0,0, 0,0,1,0, 0,1,0,0, 0,0,1,0],
        },
        optionalProbability: 0.3,
      }],
    },
    melodic: { monoInstruments: ["bass", "lead"], chordInstruments: ["piano", "strings", "organ", "stab"] },
    melody: {
      bass: { motifBars: 2, noteLengths: [[4,3],[6,2],[8,1]], restProbability: 0.25, chordToneProbability: 0.85, chordTonePool: [[0,5],[4,2],[7,1]], passingTonePool: [[-1,1],[1,1],[3,1]], variationProbability: 0.3 },
      lead: { motifBars: 2, noteLengths: [[4,2],[6,2],[8,1],[3,1]], restProbability: 0.4, chordToneProbability: 0.65, chordTonePool: [[0,2],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1],[-1,1],[6,1]], variationProbability: 0.5 },
    },
    chords: {
      piano: {
        core:     [C(0,4,6),0,0,0, 0,0,0,0, C(0,4,6),0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,C(0,3,2),0],
        optionalProbability: 0.25,
      },
      strings: {
        core:     [C(0,3,8),0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, C(2,3,4),0,0,0],
        optionalProbability: 0.25,
      },
      organ: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, C(0,3,4),0,0,0, 0,0,0,0],
        optionalProbability: 0.2,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,C(2,3,1), 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.2,
      },
    },
  },

  trap: {
    name: "Trap",
    description: "Sparse hard kick, sliding 808s, rapid hi-hat rolls, a hypnotic bell hook.",
    tempo: { min: 132, max: 150, default: 140 },
    swing: 0.04,
    humanize: { timingMs: 2, velocityJitter: 0.12 },
    key: "C2",
    scale: "minor",
    progressions: [[0, 5], [0, 3], [0, 4], [0, 5, 3, 4]],
    defaultFlavors: { kick: "808", snare: "clap", hihat: "bright", bass: "808", lead: "bell", stab: "bell-chord", vocal: "ooh", fx: "riser" },
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "crash", "fx"],
      main: {
        core: {
          kick:    [1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          hihat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
        },
        optional: {
          kick:    [0,0,1,0, 0,1,0,0, 0,0,0,1, 1,0,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
          openhat: [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0],
        },
        optionalProbability: 0.4,
        hihatRollSteps: [7, 15],
        hihatRollProbability: 0.45,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,0,0, 0,0,0,1, 0,0,1,0, 0,0,1,0],
          snare:   [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          hihat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,1,0],
        },
        optional: {
          kick:    [0,1,0,0, 0,0,1,0, 0,0,0,0, 0,1,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
          openhat: [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0],
        },
        optionalProbability: 0.4,
        hihatRollSteps: [3, 11],
        hihatRollProbability: 0.45,
      }],
    },
    melodic: { monoInstruments: ["bass", "lead"], chordInstruments: ["stab", "vocal"] },
    melody: {
      bass: { motifBars: 1, noteLengths: [[3,2],[4,3],[2,1]], restProbability: 0.3, chordToneProbability: 0.9, chordTonePool: [[0,6],[4,1]], passingTonePool: [[-2,1],[3,1]], variationProbability: 0.3 },
      lead: { motifBars: 1, noteLengths: [[2,3],[3,2],[4,1]], restProbability: 0.55, chordToneProbability: 0.6, chordTonePool: [[0,2],[2,2],[4,2]], passingTonePool: [[-1,1],[1,1],[6,1]], variationProbability: 0.4 },
    },
    chords: {
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,C(0,3,1),0, 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.2,
      },
      vocal: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,C(0,1,1),0],
        optionalProbability: 0.2,
      },
    },
  },

  house: {
    name: "House",
    description: "Four-on-the-floor kick, offbeat open hats, a looping arp riff and piano stabs.",
    tempo: { min: 122, max: 128, default: 124 },
    swing: 0.03,
    humanize: { timingMs: 2, velocityJitter: 0.08 },
    key: "C2",
    scale: "dorian",
    progressions: [[0, 3, 4, 0], [0, 3], [0, 6, 3, 0], [0, 4, 3, 0]],
    defaultFlavors: { kick: "fourfloor", snare: "clap", hihat: "bright", perc: "conga", bass: "synth", piano: "pluck", pad: "ensemble", lead: "saw", stab: "square-chord", vocal: "ahh", fx: "riser" },
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "perc", "crash", "fx"],
      main: {
        core: {
          kick:    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          openhat: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
          perc:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          hihat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          perc:    [0,0,1,0, 0,1,0,0, 0,0,1,0, 0,1,0,0],
        },
        optionalProbability: 0.3,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,1,0, 1,0,0,0],
          hihat:   [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
          openhat: [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          perc:    [0,0,0,1, 0,0,0,1, 0,0,0,1, 0,0,0,1],
        },
        optional: {
          hihat:   [1,0,0,1, 1,0,0,1, 1,0,0,1, 1,0,0,1],
          perc:    [1,0,1,0, 0,1,0,0, 1,0,1,0, 0,1,0,0],
        },
        optionalProbability: 0.3,
      }],
    },
    melodic: { monoInstruments: ["bass", "lead"], chordInstruments: ["piano", "pad", "stab", "vocal"] },
    melody: {
      bass: { motifBars: 1, noteLengths: [[2,4],[4,2]], restProbability: 0.15, chordToneProbability: 0.85, chordTonePool: [[0,4],[4,2],[7,1]], passingTonePool: [[2,1],[-1,1]], variationProbability: 0.15 },
      lead: { motifBars: 1, noteLengths: [[2,5],[1,2]], restProbability: 0.1, chordToneProbability: 0.9, chordTonePool: [[0,3],[2,2],[4,2],[7,2]], passingTonePool: [[1,1],[6,1]], variationProbability: 0.2 },
    },
    chords: {
      piano: {
        core:     [0,0,C(0,4,1),0, 0,0,C(0,4,1),0, 0,0,C(0,4,1),0, 0,0,C(0,4,1),0],
        optional: [0,0,0,0, 0,0,0,C(0,3,1), 0,0,0,0, 0,0,0,C(0,3,1)],
        optionalProbability: 0.3,
      },
      pad: {
        core:     [C(0,4,16),0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: new Array(STEPS_PER_BAR).fill(0),
        optionalProbability: 0,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,C(0,3,1)],
        optionalProbability: 0.2,
      },
      vocal: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,C(0,1,1), 0,0,0,0, 0,0,0,C(0,1,1), 0,0,0,0],
        optionalProbability: 0.25,
      },
    },
  },

  rock: {
    name: "Rock",
    description: "Backbeat snare, driving eighths, a real guitar riff, crash-out fills.",
    tempo: { min: 100, max: 130, default: 116 },
    swing: 0,
    humanize: { timingMs: 12, velocityJitter: 0.25 },
    key: "E2",
    scale: "major",
    progressions: [[0, 4, 5, 3], [0, 3, 4, 0], [5, 3, 0, 4], [0, 5, 3, 4]],
    defaultFlavors: { kick: "acoustic", snare: "acoustic", hihat: "bright", bass: "pluck", guitar: "power" },
    drums: {
      instruments: ["kick", "snare", "hihat", "tom", "crash"],
      main: {
        core: {
          kick:  [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,1,0],
          snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          tom:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:  [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,1],
          snare: [0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
          hihat: [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
        },
        optionalProbability: 0.3,
      },
      mainVariants: [{
        core: {
          kick:  [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0],
          snare: [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          hihat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
          tom:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:  [0,0,1,0, 0,1,0,0, 0,0,1,0, 0,0,0,1],
          snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optionalProbability: 0.3,
      }],
    },
    melodic: { monoInstruments: ["bass", "guitar"], chordInstruments: [] },
    melody: {
      bass: { motifBars: 2, noteLengths: [[2,4],[4,2]], restProbability: 0.2, chordToneProbability: 0.9, chordTonePool: [[0,5],[4,2],[7,1]], passingTonePool: [[2,1],[-1,1]], variationProbability: 0.3 },
      guitar: { motifBars: 2, noteLengths: [[2,4],[4,2],[1,2]], restProbability: 0.25, chordToneProbability: 0.75, chordTonePool: [[0,4],[4,3],[7,2]], passingTonePool: [[1,1],[3,1],[-1,1],[6,1]], variationProbability: 0.4 },
    },
    chords: {},
  },

  reggaeton: {
    name: "Reggaeton",
    description: "Dembow tresillo kick pattern, rimshot answers, a synth hook and horn stabs.",
    tempo: { min: 90, max: 100, default: 95 },
    swing: 0.05,
    humanize: { timingMs: 5, velocityJitter: 0.15 },
    key: "A1",
    scale: "minor",
    progressions: [[0, 3], [0, 4], [0, 5], [0, 3, 4, 0]],
    defaultFlavors: { kick: "snappy", snare: "rimshot", hihat: "bright", perc: "conga", bass: "warm", lead: "saw", horn: "brass", stab: "pluck-chord", vocal: "ooh" },
    drums: {
      instruments: ["kick", "snare", "hihat", "tom", "perc", "crash"],
      main: {
        core: {
          kick:  [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0],
          snare: [0,0,1,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          hihat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
          perc:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0],
          snare: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,1,0],
          perc:  [0,1,0,1, 0,1,0,0, 0,1,0,1, 0,1,0,0],
        },
        optionalProbability: 0.35,
      },
      mainVariants: [{
        core: {
          kick:  [1,0,0,0, 0,0,0,0, 1,0,0,1, 0,0,0,0],
          snare: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,0,0],
          hihat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
          perc:  [0,0,0,1, 0,1,0,0, 0,0,0,1, 0,1,0,0],
        },
        optional: {
          kick:  [0,0,0,0, 1,0,0,0, 0,0,0,0, 0,0,1,0],
          snare: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,1,0],
          perc:  [0,1,0,0, 0,0,0,1, 0,1,0,0, 0,0,0,1],
        },
        optionalProbability: 0.35,
      }],
    },
    melodic: { monoInstruments: ["bass", "lead"], chordInstruments: ["horn", "stab", "vocal"] },
    melody: {
      bass: { motifBars: 1, noteLengths: [[2,3],[3,2],[4,1]], restProbability: 0.3, chordToneProbability: 0.85, chordTonePool: [[0,5],[4,2]], passingTonePool: [[-2,1],[4,1]], variationProbability: 0.25 },
      lead: { motifBars: 1, noteLengths: [[2,3],[3,2]], restProbability: 0.4, chordToneProbability: 0.65, chordTonePool: [[0,2],[2,2],[4,2]], passingTonePool: [[1,1],[-1,1]], variationProbability: 0.35 },
    },
    chords: {
      horn: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,C(0,3,1),0, 0,0,0,C(2,3,1), 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.3,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.15,
      },
      vocal: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,C(0,1,1),0],
        optionalProbability: 0.2,
      },
    },
  },

  lofi: {
    name: "Lo-Fi Chill",
    description: "Softened boom bap, jazzy extended chords, a gentle wandering melody, vinyl crackle.",
    tempo: { min: 68, max: 84, default: 76 },
    swing: 0.18,
    humanize: { timingMs: 10, velocityJitter: 0.2 },
    key: "D2",
    scale: "dorian",
    progressions: [[0, 3, 4, 0], [0, 2, 3, 0], [0, 4, 3, 0], [0, 3]],
    ambience: "vinyl",
    defaultFlavors: { kick: "lofi", snare: "fat", hihat: "vinyl", perc: "shaker", bass: "warm", piano: "electric", pad: "airy", lead: "flute", strings: "soul", stab: "pluck-chord", marimba: "marimba" },
    drums: {
      instruments: ["kick", "snare", "hihat", "perc"],
      main: {
        core: {
          kick:  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat: [1,0,1,0, 1,0,0,1, 1,0,1,0, 1,0,0,0],
          perc:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:  [0,0,1,0, 0,0,1,0, 0,0,0,0, 0,0,1,0],
          hihat: [0,1,0,1, 0,1,0,0, 0,1,0,1, 0,1,0,1],
          snare: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
          perc:  [0,0,1,0, 0,0,0,1, 0,0,1,0, 0,0,0,0],
        },
        optionalProbability: 0.25,
      },
      mainVariants: [{
        core: {
          kick:  [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0],
          snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat: [1,0,0,1, 0,1,0,0, 1,0,0,1, 0,1,0,0],
          perc:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:  [0,0,1,0, 0,0,0,1, 0,0,1,0, 0,0,0,0],
          hihat: [0,1,0,0, 1,0,1,0, 0,1,0,0, 1,0,1,0],
          snare: [0,0,0,0, 0,0,0,0, 0,0,0,1, 0,0,0,0],
          perc:  [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,1],
        },
        optionalProbability: 0.28,
      }],
    },
    melodic: { monoInstruments: ["bass", "lead", "marimba"], chordInstruments: ["piano", "pad", "strings", "stab"] },
    melody: {
      bass: { motifBars: 2, noteLengths: [[4,3],[6,2],[8,1]], restProbability: 0.35, chordToneProbability: 0.8, chordTonePool: [[0,5],[4,2],[7,1]], passingTonePool: [[2,1],[-1,1]], variationProbability: 0.35 },
      lead: { motifBars: 2, noteLengths: [[4,2],[6,2],[8,2],[3,1]], restProbability: 0.5, chordToneProbability: 0.7, chordTonePool: [[0,2],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1],[-2,1]], variationProbability: 0.45 },
      marimba: { motifBars: 2, noteLengths: [[4,2],[6,2],[8,1]], restProbability: 0.62, chordToneProbability: 0.75, chordTonePool: [[0,3],[4,2],[7,1]], passingTonePool: [[2,1],[-2,1]], variationProbability: 0.3 },
    },
    chords: {
      piano: {
        core:     [C(0,4,7),0,0,0, 0,0,0,0, 0,0,C(2,3,4),0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,C(0,3,1), 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.2,
      },
      pad: {
        core:     [C(0,4,16),0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: new Array(STEPS_PER_BAR).fill(0),
        optionalProbability: 0,
      },
      strings: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,C(0,3,4),0, 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.2,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,C(0,3,1),0],
        optionalProbability: 0.15,
      },
    },
  },

  drill: {
    name: "Drill",
    description: "Sparse, spacious kick, snare locked on beat 3, sliding 808, a single moody piano line.",
    tempo: { min: 138, max: 145, default: 141 },
    swing: 0.03,
    humanize: { timingMs: 2, velocityJitter: 0.12 },
    key: "C2",
    scale: "phrygian",
    progressions: [[0, 3], [0, 1, 0], [0, 1, 3, 0], [0, 3, 1, 0]],
    defaultFlavors: { kick: "808", snare: "trapsnap", hihat: "dark", bass: "drillslide", piano: "electric", stab: "pluck-chord" },
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "crash"],
      main: {
        core: {
          kick:    [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          hihat:   [1,1,0,1, 1,0,1,1, 1,0,1,1, 1,1,0,1],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,1],
          openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,0],
        },
        optionalProbability: 0.3,
        hihatRollSteps: [5, 13],
        hihatRollProbability: 0.4,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,1,0],
          snare:   [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          hihat:   [1,1,0,1, 0,1,1,0, 1,0,1,1, 0,1,1,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,1, 0,0,0,0],
        },
        optionalProbability: 0.3,
        hihatRollSteps: [3, 9],
        hihatRollProbability: 0.4,
      }],
    },
    melodic: { monoInstruments: ["bass"], chordInstruments: ["piano", "stab"] },
    melody: {
      bass: { motifBars: 1, noteLengths: [[3,2],[4,3],[6,1]], restProbability: 0.35, chordToneProbability: 0.85, chordTonePool: [[0,5],[4,2]], passingTonePool: [[-2,1],[3,1]], variationProbability: 0.3 },
    },
    chords: {
      piano: {
        core:     [C(0,3,6),0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,C(0,3,2),0],
        optionalProbability: 0.2,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,C(0,3,1),0, 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.15,
      },
    },
  },

  afrobeats: {
    name: "Afrobeats",
    description: "Syncopated kick, continuous shakers, a log-drum bass and a highlife guitar hook.",
    tempo: { min: 100, max: 112, default: 106 },
    swing: 0.08,
    humanize: { timingMs: 5, velocityJitter: 0.15 },
    key: "C2",
    scale: "major",
    progressions: [[0, 3, 4, 0], [0, 4, 5, 3], [0, 5, 3, 4], [0, 1, 3, 4]],
    defaultFlavors: { kick: "acoustic", snare: "clap", hihat: "bright", perc: "shaker", bass: "logdrum", guitar: "nylon", pad: "warm", stab: "pluck-chord", organ: "drawbar", marimba: "marimba" },
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "perc"],
      main: {
        core: {
          kick:    [1,0,0,1, 0,0,1,0, 0,1,0,0, 1,0,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          perc:    [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
        },
        optional: {
          hihat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
        },
        optionalProbability: 0.3,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,1,0, 0,0,1,0, 1,0,0,1, 0,0,1,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          perc:    [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
        },
        optional: {
          hihat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          openhat: [0,0,0,1, 0,0,0,0, 0,0,0,1, 0,0,0,0],
        },
        optionalProbability: 0.3,
      }],
    },
    melodic: { monoInstruments: ["bass", "guitar", "marimba"], chordInstruments: ["pad", "organ", "stab"] },
    melody: {
      bass: { motifBars: 1, noteLengths: [[4,3],[3,2],[6,1]], restProbability: 0.25, chordToneProbability: 0.85, chordTonePool: [[0,5],[4,2],[7,1]], passingTonePool: [[2,1],[-1,1]], variationProbability: 0.25 },
      guitar: { motifBars: 2, noteLengths: [[2,4],[1,3],[4,1]], restProbability: 0.3, chordToneProbability: 0.7, chordTonePool: [[0,3],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1],[6,1]], variationProbability: 0.4 },
      marimba: { motifBars: 1, noteLengths: [[1,3],[2,3],[3,1]], restProbability: 0.4, chordToneProbability: 0.8, chordTonePool: [[0,3],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[-1,1]], variationProbability: 0.3 },
    },
    chords: {
      pad: {
        core:     [C(0,4,16),0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: new Array(STEPS_PER_BAR).fill(0),
        optionalProbability: 0,
      },
      organ: {
        core:     [C(0,3,8),0,0,0, 0,0,0,0, C(0,3,8),0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.15,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,C(0,3,1), 0,0,0,0],
        optionalProbability: 0.2,
      },
    },
  },

  dubstep: {
    name: "Dubstep",
    description: "Half-time drums (kick on 1, snare on 3), a growling LFO wobble bass.",
    tempo: { min: 138, max: 142, default: 140 },
    swing: 0.02,
    humanize: { timingMs: 2, velocityJitter: 0.1 },
    key: "E1",
    scale: "minor",
    progressions: [[0, 4], [0, 3], [0, 5], [0, 6, 3, 4]],
    defaultFlavors: { kick: "gritty", snare: "fat", hihat: "metallic", bass: "wobble", stab: "square-chord", vocal: "ahh", fx: "impact" },
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "crash", "fx"],
      main: {
        core: {
          kick:    [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          hihat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,0,0, 0,0,0,1, 0,0,1,0, 0,0,0,0],
          hihat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
        },
        optionalProbability: 0.3,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          hihat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,1,0],
          hihat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,0],
        },
        optionalProbability: 0.3,
      }],
    },
    melodic: { monoInstruments: ["bass"], chordInstruments: ["stab", "vocal"] },
    melody: {
      bass: { motifBars: 1, noteLengths: [[4,3],[8,2],[16,1]], restProbability: 0.3, chordToneProbability: 0.9, chordTonePool: [[0,6],[4,1]], passingTonePool: [[-2,1]], variationProbability: 0.2 },
    },
    chords: {
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,C(0,3,1)],
        optionalProbability: 0.2,
      },
      vocal: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,C(0,1,1)],
        optionalProbability: 0.15,
      },
    },
  },

  rnb: {
    name: "R&B / Soul",
    description: "Laid-back live-feel groove, lush 7th-chord Rhodes, a smooth vocal-style top line.",
    tempo: { min: 68, max: 88, default: 76 },
    swing: 0.13,
    humanize: { timingMs: 8, velocityJitter: 0.16 },
    key: "F2",
    scale: "major",
    progressions: [[0, 5, 1, 4], [0, 3, 5, 4], [0, 2, 3, 4], [5, 3, 0, 4]],
    defaultFlavors: { kick: "acoustic", snare: "fat", hihat: "dark", perc: "shaker", bass: "pluck", piano: "rhodes", pad: "choir", lead: "flute", strings: "orchestral", organ: "drawbar" },
    drums: {
      instruments: ["kick", "snare", "hihat", "perc"],
      main: {
        core: {
          kick:  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          perc:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:  [0,0,0,1, 0,0,1,0, 0,0,0,0, 0,0,1,0],
          hihat: [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          perc:  [0,0,1,0, 0,0,0,1, 0,0,1,0, 0,0,0,0],
        },
        optionalProbability: 0.3,
      },
      mainVariants: [{
        core: {
          kick:  [1,0,0,1, 0,0,0,0, 1,0,0,0, 0,0,1,0],
          snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          perc:  [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
        },
        optional: {
          kick:  [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0],
          hihat: [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          perc:  [0,1,0,0, 1,0,0,1, 0,1,0,0, 1,0,0,1],
        },
        optionalProbability: 0.3,
      }],
    },
    melodic: { monoInstruments: ["bass", "lead"], chordInstruments: ["piano", "pad", "strings", "organ"] },
    melody: {
      bass: { motifBars: 2, noteLengths: [[4,3],[3,2],[6,2]], restProbability: 0.3, chordToneProbability: 0.85, chordTonePool: [[0,5],[4,2],[7,1]], passingTonePool: [[2,1],[-1,1]], variationProbability: 0.3 },
      lead: { motifBars: 2, noteLengths: [[4,2],[6,3],[8,2],[3,1]], restProbability: 0.45, chordToneProbability: 0.7, chordTonePool: [[0,2],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1],[-1,1]], variationProbability: 0.4 },
    },
    chords: {
      piano: {
        core:     [C(0,4,7),0,0,0, 0,0,0,0, 0,0,C(2,4,4),0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,C(0,4,1), 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.2,
      },
      pad: {
        core:     [C(0,4,16),0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: new Array(STEPS_PER_BAR).fill(0),
        optionalProbability: 0,
      },
      strings: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,C(0,3,4),0, 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.2,
      },
      organ: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, C(0,3,4),0,0,0, 0,0,0,0],
        optionalProbability: 0.2,
      },
    },
  },

  phonk: {
    name: "Phonk",
    description: "Distorted 808 kick doubling as the bassline, hypnotic cowbell, an eerie bell hook.",
    tempo: { min: 130, max: 145, default: 138 },
    swing: 0.05,
    humanize: { timingMs: 3, velocityJitter: 0.14 },
    key: "C2",
    scale: "minor",
    progressions: [[0, 4], [0, 3], [0, 5], [0, 6, 3, 4]],
    defaultFlavors: { kick: "gritty", snare: "trapsnap", hihat: "metallic", perc: "cowbell", bass: "distorted", lead: "bell", vocal: "ahh", stab: "bell-chord" },
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "perc", "crash"],
      main: {
        core: {
          kick:    [1,0,0,0, 0,0,0,1, 0,0,1,0, 0,0,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          hihat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
          perc:    [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0],
        },
        optional: {
          kick:    [0,0,1,0, 0,1,0,0, 0,0,0,0, 1,0,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
          perc:    [0,1,0,0, 1,0,0,1, 0,1,0,0, 1,0,0,1],
        },
        optionalProbability: 0.35,
        hihatRollSteps: [7, 15],
        hihatRollProbability: 0.4,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,0,1],
          snare:   [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          hihat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
          perc:    [1,0,1,0, 0,1,0,0, 1,0,1,0, 0,1,0,0],
        },
        optional: {
          kick:    [0,0,1,0, 0,0,0,0, 0,1,0,0, 0,0,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
          perc:    [0,1,0,1, 0,0,1,0, 0,1,0,1, 0,0,1,0],
        },
        optionalProbability: 0.35,
        hihatRollSteps: [3, 11],
        hihatRollProbability: 0.4,
      }],
    },
    melodic: { monoInstruments: ["bass", "lead"], chordInstruments: ["vocal", "stab"] },
    melody: {
      bass: { motifBars: 1, noteLengths: [[3,2],[4,3],[2,1]], restProbability: 0.3, chordToneProbability: 0.9, chordTonePool: [[0,6],[4,1]], passingTonePool: [[-2,1],[3,1]], variationProbability: 0.25 },
      lead: { motifBars: 1, noteLengths: [[2,3],[3,2],[6,1]], restProbability: 0.5, chordToneProbability: 0.6, chordTonePool: [[0,2],[2,2],[4,2]], passingTonePool: [[-1,1],[1,1],[6,1]], variationProbability: 0.4 },
    },
    chords: {
      vocal: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,C(0,1,1),0],
        optionalProbability: 0.2,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,C(0,3,1),0, 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.15,
      },
    },
  },

  jerseyclub: {
    name: "Jersey Club",
    description: "Bouncy triplet-feel kick pattern, chopped vocal hooks, dry and punchy.",
    tempo: { min: 130, max: 140, default: 136 },
    swing: 0.02,
    humanize: { timingMs: 2, velocityJitter: 0.1 },
    key: "C2",
    scale: "minor",
    progressions: [[0, 3], [0, 5], [0, 4], [0, 5, 3, 4]],
    defaultFlavors: { kick: "snappy", snare: "clap", hihat: "bright", bass: "sub", vocal: "ooh", stab: "square-chord" },
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat"],
      main: {
        core: {
          kick:    [1,0,0,1, 0,0,1,0, 0,1,0,0, 1,0,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,1,0,0, 0,1,0,1, 0,0,1,0, 0,1,0,1],
          hihat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
        },
        optionalProbability: 0.3,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,1,0, 0,1,0,0, 1,0,0,1, 0,0,1,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,1,0,0, 0,0,1,0, 0,1,0,0, 0,1,0,1],
          hihat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          openhat: [0,0,0,1, 0,0,0,0, 0,0,0,1, 0,0,0,0],
        },
        optionalProbability: 0.3,
      }],
    },
    melodic: { monoInstruments: ["bass"], chordInstruments: ["vocal", "stab"] },
    melody: {
      bass: { motifBars: 1, noteLengths: [[4,3],[8,2]], restProbability: 0.3, chordToneProbability: 0.9, chordTonePool: [[0,6],[4,1]], passingTonePool: [[-2,1]], variationProbability: 0.2 },
    },
    chords: {
      vocal: {
        core:     [0,0,C(0,1,1),0, 0,0,0,0, 0,0,C(0,1,1),0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,C(2,1,1),0, 0,0,0,0, 0,0,C(2,1,1),0],
        optionalProbability: 0.35,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,C(0,3,1)],
        optionalProbability: 0.2,
      },
    },
  },

  dnb: {
    name: "Drum & Bass",
    description: "Fast syncopated breakbeat drums at ~172 BPM, a growling Reese bass.",
    tempo: { min: 160, max: 176, default: 172 },
    swing: 0.02,
    humanize: { timingMs: 3, velocityJitter: 0.15 },
    key: "E1",
    scale: "minor",
    progressions: [[0, 3, 4, 0], [0, 5, 3, 4], [0, 4], [0, 6, 3, 4]],
    defaultFlavors: { kick: "acoustic", snare: "crisp", hihat: "bright", bass: "reese", pad: "airy", stab: "square-chord", arp: "pulse" },
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "crash"],
      main: {
        core: {
          kick:    [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,1,0,0],
          snare:   [0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,0],
          hihat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,1,0],
          snare:   [0,0,0,0, 0,0,0,0, 0,0,0,1, 0,0,0,0],
          openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
        },
        optionalProbability: 0.35,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,0,0, 0,0,0,1, 0,0,1,0, 0,0,0,0],
          snare:   [0,0,0,1, 1,0,0,0, 0,0,0,1, 1,0,0,0],
          hihat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,1,0, 0,0,0,0, 0,1,0,0, 0,0,1,0],
          snare:   [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0],
          openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
        },
        optionalProbability: 0.35,
      }],
    },
    melodic: { monoInstruments: ["bass", "arp"], chordInstruments: ["pad", "stab"] },
    melody: {
      bass: { motifBars: 1, noteLengths: [[4,3],[8,2],[16,1]], restProbability: 0.25, chordToneProbability: 0.85, chordTonePool: [[0,6],[4,1]], passingTonePool: [[-2,1],[3,1]], variationProbability: 0.25 },
      arp: { motifBars: 1, noteLengths: [[1,6],[2,2]], restProbability: 0.4, chordToneProbability: 0.9, chordTonePool: [[0,3],[2,2],[4,2],[7,2]], passingTonePool: [[1,1]], variationProbability: 0.15 },
    },
    chords: {
      pad: {
        core:     [C(0,4,16),0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: new Array(STEPS_PER_BAR).fill(0),
        optionalProbability: 0,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, C(0,3,1),0,0,0],
        optionalProbability: 0.2,
      },
    },
  },

  synthwave: {
    name: "Synthwave",
    description: "80s gated drums, an analog synth bass, a soaring lead, lush arpeggiated pads.",
    tempo: { min: 84, max: 116, default: 100 },
    swing: 0,
    humanize: { timingMs: 4, velocityJitter: 0.12 },
    key: "A1",
    scale: "minor",
    progressions: [[0, 5, 3, 4], [0, 3, 4, 0], [0, 6, 3, 4], [0, 3]],
    defaultFlavors: { kick: "fourfloor", snare: "fat", hihat: "bright", bass: "synth", lead: "brasslead", pad: "warm", stab: "square-chord", arp: "arp" },
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "crash"],
      main: {
        core: {
          kick:    [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0],
          hihat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
        },
        optionalProbability: 0.3,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
          hihat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
        },
        optionalProbability: 0.3,
      }],
    },
    melodic: { monoInstruments: ["bass", "lead", "arp"], chordInstruments: ["pad", "stab"] },
    melody: {
      bass: { motifBars: 2, noteLengths: [[4,3],[8,2]], restProbability: 0.2, chordToneProbability: 0.9, chordTonePool: [[0,5],[4,2],[7,1]], passingTonePool: [[2,1],[-1,1]], variationProbability: 0.25 },
      lead: { motifBars: 2, noteLengths: [[4,2],[6,3],[8,2]], restProbability: 0.3, chordToneProbability: 0.75, chordTonePool: [[0,2],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1],[-1,1]], variationProbability: 0.35 },
      arp: { motifBars: 1, noteLengths: [[1,6],[2,2]], restProbability: 0.05, chordToneProbability: 0.95, chordTonePool: [[0,3],[2,2],[4,2],[7,2]], passingTonePool: [[1,1]], variationProbability: 0.1 },
    },
    chords: {
      pad: {
        core:     [C(0,4,16),0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: new Array(STEPS_PER_BAR).fill(0),
        optionalProbability: 0,
      },
      stab: {
        core:     [C(0,2,1),0,C(2,2,1),0, C(0,2,1),0,C(2,2,1),0, C(0,2,1),0,C(2,2,1),0, C(0,2,1),0,C(2,2,1),0],
        optional: new Array(STEPS_PER_BAR).fill(0),
        optionalProbability: 0,
      },
    },
  },

  rap: {
    name: "Rap",
    description: "Hard-hitting distorted 808, aggressive hi-hat rolls, a driven master bus, an Auto-Tune-style hook and kalimba melody.",
    tempo: { min: 132, max: 152, default: 142 },
    swing: 0.15,
    humanize: { timingMs: 3, velocityJitter: 0.13 },
    key: "C2",
    scale: "minor",
    // A little master-bus saturation on top of everything else below - the
    // "driven warm on purpose" character modern hard trap/rap masters lean
    // on for extra harmonic bite, researched from how current hard-rap
    // records (Travis Scott/Future/Playboi Carti-adjacent production) are
    // actually mixed, not just "louder."
    grit: 0.3,
    progressions: [[0, 5, 3, 4], [0, 3, 4, 0], [0, 4], [0, 6, 3, 4]],
    defaultFlavors: { kick: "gritty", snare: "trapsnap", hihat: "metallic", bass: "hard808", kalimba: "kalimba", vocal: "ahh", stab: "bell-chord", fx: "siren" },
    drums: {
      // Modeled on the Kanye West "808s & Heartbreak" legacy (TR-808,
      // minor-key minimalism, Auto-Tuned melodic hooks) and Lil Baby-style
      // modern melodic trap, plus current hard-trap/rage production
      // (Travis Scott, Future, Playboi Carti-adjacent): the drums stay
      // sparse so the hook carries the record, but the hi-hats roll harder
      // and more often, and the 808/kick hit with real distortion instead
      // of staying clean - "less is more" on arrangement, not on impact.
      instruments: ["kick", "snare", "hihat", "openhat", "fx"],
      main: {
        core: {
          kick:    [1,0,0,1, 0,0,0,0, 0,0,1,0, 0,0,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          hihat:   [1,0,0,1, 0,0,1,0, 0,1,0,0, 1,0,0,1],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,0,0, 0,1,0,0, 0,0,0,0, 0,0,1,0],
          snare:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
          openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,0],
        },
        optionalProbability: 0.25,
        hihatRollSteps: [3, 7, 11, 15],
        hihatRollProbability: 0.5,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,0,0, 0,0,1,0, 0,1,0,0, 0,0,0,1],
          snare:   [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          hihat:   [1,0,1,0, 0,1,0,0, 1,0,0,1, 0,1,0,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,1,0, 0,0,0,0, 0,0,0,0, 0,1,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
          openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,0],
        },
        optionalProbability: 0.25,
        hihatRollSteps: [1, 5, 9, 13],
        hihatRollProbability: 0.5,
      }],
    },
    melodic: { monoInstruments: ["bass", "kalimba"], chordInstruments: ["vocal", "stab"] },
    melody: {
      bass: { motifBars: 1, noteLengths: [[3,3],[4,2],[6,1]], restProbability: 0.3, chordToneProbability: 0.9, chordTonePool: [[0,6],[4,1]], passingTonePool: [[-2,1],[3,1]], variationProbability: 0.2 },
      kalimba: { motifBars: 1, noteLengths: [[1,3],[2,3],[3,1]], restProbability: 0.2, chordToneProbability: 0.8, chordTonePool: [[0,3],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[-1,1]], variationProbability: 0.12 },
    },
    chords: {
      vocal: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, C(0,1,2),0,0,0],
        optionalProbability: 0.3,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,C(2,3,1),0, 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.15,
      },
    },
  },
};

function rollTrack(core, optional, probability) {
  const base = core || new Array(STEPS_PER_BAR).fill(0);
  const opt = optional || new Array(STEPS_PER_BAR).fill(0);
  return base.map((hit, i) => {
    if (hit) return true;
    if (opt[i] && Math.random() < probability) return true;
    return false;
  });
}

function rollNoteTrack(core, optional, probability) {
  const base = core || new Array(STEPS_PER_BAR).fill(0);
  const opt = optional || new Array(STEPS_PER_BAR).fill(0);
  return base.map((spec, i) => {
    if (spec) return spec;
    if (opt[i] && Math.random() < probability) return opt[i];
    return null;
  });
}

// Chordal instruments (piano, pad, stab, strings, organ, vocal) used to
// resolve to the exact same register and the exact same voicing shape on
// every single generation - a pad in particular is typically one whole-bar
// chord with a flat-out 0% optional-hit probability, meaning it was
// mathematically guaranteed to sound identical forever. Three independent,
// per-generation variations now apply generically to every chordal
// instrument in every genre (no per-genre content authoring needed):
// register jitter (same +/- one octave idea already used for melodies),
// a voicing-richness bonus (occasionally stacks an extra third on top for
// a lusher chord), and - for any chord that happens to be a single
// whole-bar sustain, which is exactly what every pad in this app is -
// an optional split into two half-bar chords with real harmonic motion
// between them instead of one static block of sound.
function resolveChordBarTrack(instKey, cfg, barRootDegree, opts = {}) {
  const { registerOffset = 0, voicingBonus = 0, splitMotion = null } = opts;
  const raw = rollNoteTrack(cfg.core, cfg.optional, cfg.optionalProbability);
  const register = REGISTER[instKey] + registerOffset;
  const resolved = raw.map((spec) => {
    if (!spec) return null;
    const root = barRootDegree + register + spec.degreeOffset;
    const size = Math.max(2, spec.size + voicingBonus);
    return { degrees: chordDegrees(root, size), len: spec.len };
  });

  if (splitMotion !== null) {
    for (let i = 0; i < resolved.length; i++) {
      const note = resolved[i];
      if (note && note.len === STEPS_PER_BAR && i + STEPS_PER_BAR <= resolved.length) {
        const half = STEPS_PER_BAR / 2;
        const secondRoot = barRootDegree + register + splitMotion;
        resolved[i] = { degrees: note.degrees, len: half };
        resolved[i + half] = { degrees: chordDegrees(secondRoot, note.degrees.length), len: half };
        break;
      }
    }
  }
  return resolved;
}

function pickChordVariety(style) {
  const variety = {};
  for (const inst of style.melodic.chordInstruments || []) {
    variety[inst] = {
      registerOffset: pickWeighted([[-7, 1], [0, 3], [7, 1]]),
      voicingBonus: pickWeighted([[0, 3], [1, 2], [2, 1]]),
      splitMotion: Math.random() < 0.45 ? pickWeighted([[4, 1], [-3, 1], [3, 1], [-4, 1]]) : null,
    };
  }
  return variety;
}

function buildStructure(bars) {
  const seq = [];
  for (let i = 0; i < bars; i++) {
    if (i === 0 && bars >= 4) seq.push("intro");
    else if ((i + 1) % 4 === 0) seq.push("fill");
    else seq.push("main");
  }
  return seq;
}

function buildDrumBar(style, variant) {
  const m = style.drums.main;
  const bar = {};
  for (const inst of style.drums.instruments) {
    bar[inst] = rollTrack(m.core[inst], m.optional[inst], m.optionalProbability);
  }
  if (style.drums.instruments.includes("crash")) bar.crash = new Array(STEPS_PER_BAR).fill(false);

  if (variant === "intro") {
    for (const inst of style.drums.instruments) {
      if (inst !== "kick" && inst !== "snare" && inst !== "hihat") {
        bar[inst] = new Array(STEPS_PER_BAR).fill(false);
      } else {
        bar[inst] = m.core[inst] ? [...m.core[inst]].map(Boolean) : new Array(STEPS_PER_BAR).fill(false);
      }
    }
  }

  if (m.hihatRollSteps && bar.hihat && variant !== "intro") {
    for (const step of m.hihatRollSteps) {
      if (Math.random() < m.hihatRollProbability) bar.hihat[step] = "roll";
    }
  }

  if (variant === "fill") {
    if (bar.tom) {
      bar.tom[12] = true;
      bar.tom[13] = Math.random() < 0.5;
      bar.tom[14] = true;
    } else if (bar.snare) {
      bar.snare[12] = true;
      bar.snare[14] = true;
    }
    if (bar.hihat) {
      bar.hihat[14] = "roll";
      bar.hihat[15] = "roll";
    }
    if (bar.openhat) bar.openhat[15] = true;
  }

  return bar;
}

function buildChordBar(style, variant, barRootDegree, chordVariety) {
  const bar = {};
  const chordInstruments = style.melodic.chordInstruments || [];
  for (const inst of chordInstruments) {
    if (variant === "intro") {
      bar[inst] = new Array(STEPS_PER_BAR).fill(null);
      continue;
    }
    const v = (chordVariety && chordVariety[inst]) || {};
    bar[inst] = resolveChordBarTrack(inst, style.chords[inst], barRootDegree, v);
    if (variant === "fill" && inst === "stab") {
      bar[inst][0] = { degrees: chordDegrees(barRootDegree + REGISTER.stab + (v.registerOffset || 0), 3 + (v.voicingBonus || 0)), len: 2 };
    }
  }
  return bar;
}

// A genre's chord progression and core drum groove used to be a single
// hardcoded constant, which meant every generated beat in that genre had
// the exact same harmonic shape and the exact same rhythmic backbone
// forever - only the melody notes and instrument timbres ever varied. Both
// now pick randomly from a small pool of genuinely different, genre-
// appropriate options every time a beat is generated.
function pickProgression(style) {
  const options = style.progressions || [style.progression];
  return options[Math.floor(Math.random() * options.length)];
}

function pickDrumMain(style) {
  const variants = style.drums.mainVariants;
  if (!variants || !variants.length) return style.drums.main;
  const pool = [style.drums.main, ...variants];
  return pool[Math.floor(Math.random() * pool.length)];
}

function resolveGenerationStyle(style) {
  return { ...style, drums: { ...style.drums, main: pickDrumMain(style) }, progression: pickProgression(style) };
}

function generateVariation(rawStyle, bars) {
  const style = resolveGenerationStyle(rawStyle);
  const structure = buildStructure(bars);
  const totalSteps = bars * STEPS_PER_BAR;
  const barRootDegrees = structure.map((_, i) => style.progression[i % style.progression.length]);

  const drumBars = structure.map((variant) => buildDrumBar(style, variant));
  for (let i = 1; i < structure.length; i++) {
    if (structure[i - 1] === "fill" && drumBars[i].crash !== undefined) drumBars[i].crash[0] = true;
  }

  const instruments = {};
  for (const inst of style.drums.instruments) {
    instruments[inst] = [].concat(...drumBars.map((b) => b[inst] || new Array(STEPS_PER_BAR).fill(false)));
  }

  const chordVariety = pickChordVariety(style);
  const chordBars = structure.map((variant, i) => buildChordBar(style, variant, barRootDegrees[i], chordVariety));
  for (const inst of style.melodic.chordInstruments) {
    instruments[inst] = [].concat(...chordBars.map((b) => b[inst] || new Array(STEPS_PER_BAR).fill(null)));
  }

  for (const inst of style.melodic.monoInstruments) {
    instruments[inst] = generateMonoMelody(REGISTER[inst], structure, barRootDegrees, style.melody[inst], totalSteps);
  }

  return { instruments, structure, barRootDegrees, automation: {} };
}

// ---- Full-song arrangement ----
// Real tracks build energy over a whole song, not just one repeating bar:
// an intro that layers instruments in one at a time, a verse that's less
// intense than the chorus, a chorus that pulls out every layer, a bridge
// that strips back for contrast before the final chorus, and an outro that
// unwinds the intro in reverse. This mirrors the "gradual layering / boost
// energy in the chorus / strip back for the bridge" arrangement techniques
// producers actually use.

const SONG_SECTIONS = [
  { type: "intro", label: "Intro", bars: 4 },
  { type: "verse", label: "Verse 1", bars: 8 },
  { type: "chorus", label: "Chorus 1", bars: 8 },
  { type: "verse", label: "Verse 2", bars: 8 },
  { type: "chorus", label: "Chorus 2", bars: 8 },
  { type: "bridge", label: "Bridge", bars: 4 },
  { type: "chorus", label: "Final Chorus", bars: 8 },
  { type: "outro", label: "Outro", bars: 4 },
];

const INSTRUMENT_PRIORITY = [
  "kick", "hihat", "snare", "bass", "piano", "organ", "pad", "lead", "kalimba", "marimba",
  "guitar", "arp", "openhat", "perc", "stab", "strings", "horn", "vocal", "crash", "tom", "fx",
];

// Volume automation: rather than leaving a track's fader flat for the
// whole song, atmospheric/feature instruments swell into choruses, dip
// for the bridge breakdown, and fade in/out over the intro and outro -
// the same "automate a level over the arrangement" move a real mix uses.
const AUTOMATION_INSTRUMENTS = ["pad", "strings", "organ", "lead", "vocal", "kalimba", "marimba", "arp"];

function generateAutomationCurve(barMetas) {
  const points = [];
  let lastValue = null;
  for (let i = 0; i < barMetas.length; i++) {
    const b = barMetas[i];
    const step = i * STEPS_PER_BAR;
    const span = Math.max(b.len - 1, 1);
    let value;
    if (b.type === "intro") value = 0.3 + 0.5 * (b.pos / span);
    else if (b.type === "verse") value = 0.65;
    else if (b.type === "chorus") value = 1;
    else if (b.type === "bridge") value = b.pos < b.len / 2 ? 0.35 : 0.6;
    else if (b.type === "outro") value = 0.7 - 0.55 * (b.pos / span);
    else value = 0.7;

    if (points.length === 0 || Math.abs(value - lastValue) > 0.05 || i === barMetas.length - 1) {
      points.push({ step, value: Math.max(0, Math.min(1, value)) });
      lastValue = value;
    }
  }
  return points;
}

function generateAutomation(style, barMetas) {
  const automation = {};
  for (const inst of AUTOMATION_INSTRUMENTS) {
    if (style.melodic.chordInstruments.includes(inst) || style.melodic.monoInstruments.includes(inst)) {
      automation[inst] = generateAutomationCurve(barMetas);
    }
  }
  return automation;
}

function priorityInstrumentList(style) {
  const have = new Set([...style.drums.instruments, ...style.melodic.monoInstruments, ...style.melodic.chordInstruments]);
  return INSTRUMENT_PRIORITY.filter((i) => have.has(i));
}

function expandSongSections() {
  const bars = [];
  for (const section of SONG_SECTIONS) {
    for (let i = 0; i < section.bars; i++) {
      bars.push({ type: section.type, label: section.label, pos: i, len: section.bars });
    }
  }
  return bars;
}

function layerFractionForBar(barMeta) {
  const { type, pos, len } = barMeta;
  const span = Math.max(len - 1, 1);
  if (type === "intro") return 0.2 + 0.6 * (pos / span);
  if (type === "verse") return 0.7;
  if (type === "chorus") return 1;
  if (type === "bridge") return pos < len / 2 ? 0.25 : 0.55;
  if (type === "outro") return 0.85 - 0.65 * (pos / span);
  return 0.7;
}

function totalSongBars() {
  return SONG_SECTIONS.reduce((s, sec) => s + sec.bars, 0);
}

function generateSongVariation(rawStyle) {
  const style = resolveGenerationStyle(rawStyle);
  const barMetas = expandSongSections();
  const bars = barMetas.length;
  const totalSteps = bars * STEPS_PER_BAR;
  const barRootDegrees = barMetas.map((_, i) => style.progression[i % style.progression.length]);
  const priorityList = priorityInstrumentList(style);
  const totalInstruments = priorityList.length;

  const drumVariant = barMetas.map((b) => (b.pos === b.len - 1 ? "fill" : "main"));

  const drumBars = barMetas.map((_, i) => buildDrumBar(style, drumVariant[i]));
  const chordVariety = pickChordVariety(style);
  const chordBars = barMetas.map((_, i) => buildChordBar(style, drumVariant[i], barRootDegrees[i], chordVariety));

  const activeSets = barMetas.map((b) => {
    const count = Math.max(2, Math.round(layerFractionForBar(b) * totalInstruments));
    return new Set(priorityList.slice(0, count));
  });

  // Mask out instruments this bar hasn't "entered" yet, and mark a crash
  // right on the downbeat of every chorus - the classic arrangement hit
  // that announces a section has kicked into a higher gear.
  for (let i = 0; i < bars; i++) {
    for (const inst of style.drums.instruments) {
      if (!activeSets[i].has(inst)) drumBars[i][inst] = new Array(STEPS_PER_BAR).fill(false);
    }
    for (const inst of style.melodic.chordInstruments) {
      if (!activeSets[i].has(inst)) chordBars[i][inst] = new Array(STEPS_PER_BAR).fill(null);
    }
    if (barMetas[i].type === "chorus" && barMetas[i].pos === 0 && drumBars[i].crash !== undefined && activeSets[i].has("crash")) {
      drumBars[i].crash[0] = true;
    }
  }

  const instruments = {};
  for (const inst of style.drums.instruments) {
    instruments[inst] = [].concat(...drumBars.map((b) => b[inst] || new Array(STEPS_PER_BAR).fill(false)));
  }
  for (const inst of style.melodic.chordInstruments) {
    instruments[inst] = [].concat(...chordBars.map((b) => b[inst] || new Array(STEPS_PER_BAR).fill(null)));
  }
  for (const inst of style.melodic.monoInstruments) {
    const melody = generateMonoMelody(REGISTER[inst], [], barRootDegrees, style.melody[inst], totalSteps);
    for (let i = 0; i < bars; i++) {
      if (activeSets[i].has(inst)) continue;
      const start = i * STEPS_PER_BAR;
      for (let s = start; s < start + STEPS_PER_BAR; s++) melody[s] = null;
    }
    instruments[inst] = melody;
  }

  // Drop a riser into the bar right before every chorus - the classic
  // pre-drop build that announces a section change is coming, regardless
  // of whether "fx" happened to be in that bar's active instrument layer.
  if (instruments.fx) {
    for (let i = 1; i < bars; i++) {
      if (barMetas[i].type === "chorus" && barMetas[i].pos === 0) {
        instruments.fx[(i - 1) * STEPS_PER_BAR] = true;
      }
    }
  }

  const structure = barMetas.map((b) => b.label);
  const automation = generateAutomation(style, barMetas);
  return { instruments, structure, barRootDegrees, automation };
}
