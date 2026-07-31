const STEPS_PER_BAR = 16;

const REGISTER = { bass: 0, piano: 14, pad: 7, lead: 21, stab: 14, guitar: 7, strings: 14, horn: 14, organ: 7, vocal: 14, kalimba: 14, marimba: 14, arp: 18, autolead: 14, sax: 14 };

const FLAVOR_POOLS = {
  kick: ["boombap", "808", "fourfloor", "acoustic", "lofi", "deep", "snappy", "click", "punch", "subkick", "gritty", "roomy", "909", "linn", "707", "606", "dmx", "sp1200"],
  snare: ["crisp", "clap", "fat", "rimshot", "trapsnap", "brush", "gated", "acoustic", "ghost", "layered", "909snare", "linn", "707", "dmx", "sp1200", "rimclick", "gatedverb"],
  hihat: ["bright", "dark", "vinyl", "metallic", "analog", "tape", "sizzle", "lofi808", "909", "707", "606", "ride"],
  perc: ["shaker", "conga", "cowbell", "clave", "tambourine", "bongo", "triangle", "timpani", "cr78", "talkingdrum", "woodblock"],
  tom: ["acoustic", "simmons"],
  bass: ["warm", "synth", "808", "true808", "hard808", "sub", "pluck", "logdrum", "wobble", "drillslide", "distorted", "reese", "growl", "upright", "moog", "303", "slap"],
  piano: ["electric", "pluck", "grand", "rhodes", "wurlitzer", "upright", "celesta", "toy", "harpsichord", "dx7ep", "clav"],
  lead: ["square", "saw", "bell", "flute", "supersaw", "pluck", "sine", "chip", "brasslead", "fm", "whistle"],
  pad: ["warm", "ensemble", "airy", "glass", "choir", "dark", "juno"],
  stab: ["pluck-chord", "square-chord", "bell-chord", "brass-chord", "organ-chord", "string-chord", "orchhit"],
  guitar: ["clean", "power", "muted", "nylon", "acoustic", "jazz", "funk", "twelvestring"],
  strings: ["soul", "orchestral", "staccato", "synth", "pizzicato", "tremolo", "mellotron"],
  horn: ["brass", "soft", "muted", "sax", "trumpetstab", "section", "clarinet", "frenchhorn", "oboe"],
  organ: ["drawbar", "gospel", "church", "combo"],
  vocal: ["ooh", "ahh", "ay", "oh", "choir", "vocoder"],
  kalimba: ["kalimba", "musicbox", "steeldrum", "glock"],
  marimba: ["marimba", "vibraphone"],
  arp: ["arp", "pulse"],
  // A real mono hook instrument for the "Auto-Tune hook" modern rap/trap
  // production leans on - distinct from the existing "vocal" chordal
  // vowel-chop instrument (see playAutoLeadVoice for why: no vibrato at
  // all, which is what actually reads as hard-pitch-corrected rather than
  // sung).
  autolead: ["hard", "moody"],
  // A real mono solo-line instrument - saxophone melodies are played one
  // note at a time, a different musical role from Horn's chord stabs.
  sax: ["smooth", "breathy"],
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
  kick: { boombap: "warm", "808": "dark", fourfloor: "bright", acoustic: "warm", lofi: "warm", deep: "dark", snappy: "bright", click: "bright", punch: "bright", subkick: "dark", gritty: "dark", roomy: "warm", "909": "bright", linn: "warm", "707": "bright", "606": "dark", dmx: "dark", sp1200: "warm", rimclick: "warm" },
  snare: { crisp: "bright", clap: "bright", fat: "warm", rimshot: "bright", trapsnap: "bright", brush: "warm", gated: "dark", acoustic: "warm", ghost: "dark", layered: "dark", "909snare": "bright", linn: "warm", "707": "bright", dmx: "dark", sp1200: "warm", rimclick: "warm", gatedverb: "bright" },
  hihat: { bright: "bright", dark: "dark", vinyl: "warm", metallic: "bright", analog: "warm", tape: "warm", sizzle: "bright", lofi808: "dark", "909": "bright", "707": "bright", "606": "dark", ride: "bright" },
  perc: { shaker: "warm", conga: "warm", cowbell: "bright", clave: "bright", tambourine: "bright", bongo: "warm", triangle: "bright", timpani: "dark", cr78: "warm", talkingdrum: "warm", woodblock: "bright" },
  tom: { acoustic: "warm", simmons: "bright" },
  bass: { warm: "warm", synth: "bright", "808": "dark", true808: "dark", hard808: "dark", sub: "dark", pluck: "warm", logdrum: "dark", wobble: "dark", drillslide: "dark", distorted: "dark", reese: "dark", growl: "dark", upright: "warm", moog: "warm", "303": "bright", slap: "bright" },
  piano: { electric: "bright", pluck: "bright", grand: "warm", rhodes: "warm", wurlitzer: "warm", upright: "warm", celesta: "bright", toy: "bright", harpsichord: "bright", dx7ep: "bright", clav: "bright" },
  lead: { square: "bright", saw: "bright", bell: "bright", flute: "warm", supersaw: "bright", pluck: "bright", sine: "warm", chip: "bright", brasslead: "warm", fm: "bright", whistle: "bright" },
  pad: { warm: "warm", ensemble: "warm", airy: "bright", glass: "bright", choir: "warm", dark: "dark", juno: "warm" },
  stab: { "pluck-chord": "bright", "square-chord": "bright", "bell-chord": "bright", "brass-chord": "warm", "organ-chord": "warm", "string-chord": "warm", orchhit: "dark" },
  guitar: { clean: "bright", power: "dark", muted: "dark", nylon: "warm", acoustic: "warm", jazz: "warm", funk: "bright", twelvestring: "bright" },
  strings: { soul: "warm", orchestral: "warm", staccato: "bright", synth: "bright", pizzicato: "bright", tremolo: "dark", mellotron: "warm" },
  horn: { brass: "bright", soft: "warm", muted: "dark", sax: "warm", trumpetstab: "bright", section: "bright", clarinet: "warm", frenchhorn: "warm", oboe: "bright" },
  organ: { drawbar: "warm", gospel: "dark", church: "dark", combo: "bright" },
  vocal: { ooh: "warm", ahh: "warm", ay: "bright", oh: "warm", choir: "warm", vocoder: "bright" },
  kalimba: { kalimba: "warm", musicbox: "bright", steeldrum: "bright", glock: "bright" },
  marimba: { marimba: "warm", vibraphone: "bright" },
  arp: { arp: "bright", pulse: "warm" },
  autolead: { hard: "bright", moody: "dark" },
  sax: { smooth: "warm", breathy: "dark" },
  fx: { riser: "bright", siren: "dark", impact: "dark" },
};

// Genres whose drum language actually uses ghost notes - a live-kit
// idiom, not something an 808 pattern does.
// Genres built on the 3+3+2 tresillo cell.
// Genres where a filter sweep is a primary arrangement device.
const FILTER_SWEEP_GENRES = new Set(["house", "techno", "dubstep", "dnb", "ukgarage", "synthwave"]);

const DRUMS_SET = new Set(["kick", "snare", "hihat", "openhat", "tom", "perc", "crash", "fx"]);

const TRESILLO_GENRES = new Set(["reggaeton", "afrobeats", "amapiano"]);

const GHOST_GENRES = new Set(["rock", "rnb", "neosoul", "hiphop", "lofi", "dnb", "ukgarage"]);

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

// ---- Note-to-note melodic composition ----
// The previous approach picked 2-3 pitches up front and mechanically
// arc-indexed into them - fine for "the same few notes recur," but it
// never actually reasoned about how one note leads to the next, which is
// most of what separates a considered melodic line from a shuffled bag of
// acceptable pitches. Two of the most robust, well-replicated findings in
// melodic corpus research now drive that note-to-note choice directly:
//
// - Pitch proximity: melodies overwhelmingly move by step: real-melody
//   corpus studies consistently find small intervals dominate note-to-note
//   motion (Huron, "Sweet Anticipation", 2006, ch. 4 - the "pitch proximity"
//   principle, one of the oldest and best-replicated findings in melodic
//   analysis, tracing back to Carl Stumpf and von Hornbostel a century ago).
// - Post-skip reversal: on the rarer occasion a melody does leap, that leap
//   is disproportionately likely to be followed by motion back the other
//   way (Von Hippel & Huron, "Why Do Skips Precede Reversals?", Music
//   Perception, 2000) - exactly what Narmour's implication-realization
//   model predicts a leap "implies" (his gap-fill principle, 1990).
//
// A gentle pull toward an overall rise-then-fall arc shape across the whole
// phrase is layered on top (Meyer, "Emotion and Meaning in Music", 1956) so
// the result has both local coherence (each note relates sensibly to the
// last) and a global shape (the phrase reads as one arc, not a random walk).
function pickNextDegree(prevOffset, lastLeapDirection, candidates, arcTarget, repeatStreak) {
  let best = candidates[0].value;
  let bestScore = -Infinity;
  for (const { value: c, weight } of candidates) {
    const delta = c - prevOffset;
    const dist = Math.abs(delta);
    // Pitch proximity biases toward small steps *statistically* rather
    // than forbidding leaps outright - real melodies are dominated by
    // steps but still leap regularly (roughly a quarter to a third of
    // note-to-note motion in corpus studies); coefficients tuned so
    // random tie-breaking can still let a leap win a meaningful share of
    // the time instead of steps mechanically sweeping every choice.
    let score = -dist * 0.55;
    if (dist === 0) score -= 0.4; // some motion is more interesting than none
    // Repeated notes are a legitimate hook device (a trap 808 line
    // hammering its root is authentic), but past a few repeats a line
    // reads as a drone rather than a phrase - so the penalty *scales*
    // with the running streak instead of being flat, letting short
    // repetitions through while making long drones progressively lose
    // to any candidate that moves.
    if (dist === 0 && repeatStreak >= 2) score -= (repeatStreak - 1) * 1.1;
    if (lastLeapDirection !== 0 && dist > 0) {
      // post-skip reversal: after a leap, favor snapping back the other way
      const dir = delta > 0 ? 1 : -1;
      score += dir === -lastLeapDirection ? 1.5 : -1.5;
    }
    score -= Math.abs(c - arcTarget) * 0.18; // gentle pull toward the phrase's overall arc
    score += (weight || 1) * 0.25; // still honors each genre's authored chord-tone preferences
    score += Math.random() * 1.6; // keeps it from being fully deterministic
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

// Rhythm "feels" give each generation a genuinely different rhythmic
// personality on top of the pitch logic, instead of every melody rendering
// its durations from the same weighted pool in the same way forever:
// - "authored": the genre's own tuned duration pool (most common).
// - "tresillo": durations locked to the 3-3-2 cycle - the single most
//   widespread rhythmic cell in popular music (the Cuban tresillo,
//   backbone of reggaeton's dembow, trap hi-hat phrasing, and countless
//   pop toplines).
// - "offbeat": the phrase starts with a short rest so the line enters
//   after the downbeat - a standard groove-displacement device.
// - "halftime": durations doubled, a sparser line at half the density.
const TRESILLO = [3, 3, 2];

function generateMotif(lengthSteps, params, feel = "authored") {
  const events = [];
  let pos = 0;
  let prevOffset = 0;
  let lastLeapDirection = 0;
  let repeatStreak = 0;
  let tresilloIdx = 0;

  if (feel === "offbeat") {
    const off = Math.random() < 0.5 ? 1 : 2;
    events.push({ offset: 0, duration: off, degreeOffset: null });
    pos = off;
  }

  while (pos < lengthSteps) {
    let dur;
    if (feel === "tresillo") {
      dur = TRESILLO[tresilloIdx % TRESILLO.length];
      tresilloIdx++;
    } else {
      dur = pickWeighted(params.noteLengths);
      if (feel === "halftime") dur = Math.min(dur * 2, 8);
    }
    dur = Math.min(dur, lengthSteps - pos);

    if (Math.random() < params.restProbability) {
      events.push({ offset: pos, duration: dur, degreeOffset: null });
    } else {
      // Chord tones are more likely right on a quarter-note beat (metric
      // accent correlating with consonance is standard tonal-harmony
      // practice - strong beats get the "safe" landing notes, weak beats
      // can carry more passing-tone color).
      const isStrongBeat = pos % 4 === 0;
      const chordToneChance = isStrongBeat ? Math.min(0.95, params.chordToneProbability + 0.15) : params.chordToneProbability;
      const useChordTone = Math.random() < chordToneChance;
      const rawPool = (useChordTone ? params.chordTonePool : params.passingTonePool) || [];
      const candidates = rawPool.map(([value, weight]) => ({ value, weight }));
      if (!candidates.some((c) => c.value === 0)) candidates.push({ value: 0, weight: 0.5 });

      const arcTarget = Math.sin((pos / lengthSteps) * Math.PI) * 3;
      const next = pickNextDegree(prevOffset, lastLeapDirection, candidates, arcTarget, repeatStreak);
      const delta = next - prevOffset;
      repeatStreak = delta === 0 ? repeatStreak + 1 : 0;
      lastLeapDirection = Math.abs(delta) >= 2 ? Math.sign(delta) : 0;
      prevOffset = next;
      events.push({ offset: pos, duration: dur, degreeOffset: next });
    }
    pos += dur;
  }
  return events;
}

function transformMotif(motif, mode) {
  if (mode === "transposeUp") return motif.map((e) => (e.degreeOffset === null ? e : { ...e, degreeOffset: e.degreeOffset + 2 }));
  if (mode === "transposeDown") return motif.map((e) => (e.degreeOffset === null ? e : { ...e, degreeOffset: e.degreeOffset - 2 }));
  // Two of the four original transforms only moved pitch, so a loop's
  // rhythmic surface almost never changed bar to bar (measured 86-100%
  // onset similarity). These two vary the rhythm instead: "thin" drops a
  // note to open up space, "displace" nudges the phrase off its grid
  // position - both standard ways a player varies a repeated figure.
  if (mode === "thin") {
    const sounding = motif.filter((e) => e.degreeOffset !== null);
    if (sounding.length < 3) return motif;
    const victim = sounding[1 + Math.floor(Math.random() * (sounding.length - 2))];
    return motif.map((e) => (e === victim ? { ...e, degreeOffset: null } : e));
  }
  if (mode === "displace") {
    const shift = Math.random() < 0.5 ? 1 : 2;
    return motif.map((e) => ({ ...e, offset: e.offset + shift }));
  }
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
// octave (both are standard melody-writing techniques). But rolling that
// octave jitter *independently per instrument* was a real source of "the
// instruments don't sound like they're working together": the bass could
// jump UP an octave into the chords' territory (an 808 an octave high is
// exactly the thin, goofy bass that got reported), and two melodic lines
// could land in the same register and fight. planRegisterJitters instead
// assigns registers the way an arranger voices an ensemble: bass never
// leaves the bass lane, the first melodic voice sits at-or-above its home
// register, and every additional voice sits at-or-below its own - so
// voices spread apart instead of piling up.
function planRegisterJitters(monoInstruments) {
  const plan = {};
  let melodicIdx = 0;
  for (const inst of monoInstruments) {
    if (inst === "bass") {
      plan[inst] = 0;
      continue;
    }
    // Jitter direction is home-register aware. Instruments that already
    // live high (lead at 21, arp at 18) must never be pushed higher -
    // that was sending leads to ~2.5-2.8kHz, well above where any real
    // hook sits - while low-homed voices must not sink toward the bass.
    const home = REGISTER[inst] || 14;
    if (home >= 18) plan[inst] = pickWeighted([[0, 4], [-7, 1]]);
    else if (home <= 7) plan[inst] = pickWeighted([[0, 4], [7, 1]]);
    else plan[inst] = melodicIdx === 0 ? pickWeighted([[0, 4], [7, 1]]) : pickWeighted([[0, 4], [-7, 1]]);
    melodicIdx++;
  }
  return plan;
}

// Real hooks are singable because they stay inside roughly one octave -
// corpus-wide, vocal and instrumental hooks span about 12-19 semitones.
// Independently reasonable systems here (register jitter, the answer-
// phrase octave drop, motif transposition) stacked multiplicatively and
// scattered melodies across 26-38 semitones, so no phrase read as a
// single idea. Folding by whole octaves keeps each note's scale identity
// (and therefore the harmony) exactly intact while pulling outliers back
// into a singable window.
function foldIntoSpan(offset, halfSpan) {
  let o = offset;
  while (o > halfSpan) o -= 7;
  while (o < -halfSpan) o += 7;
  return o;
}

function generateMonoMelody(register, structure, barRootDegrees, params, totalSteps, registerJitter = 0, isBass = false) {
  const effectiveRegister = register + registerJitter;

  const arr = new Array(totalSteps).fill(null);
  const motifLen = params.motifBars * STEPS_PER_BAR;
  // Each generation rolls a rhythmic personality for this instrument's
  // line (see the feel definitions above generateMotif) so two beats in
  // the same genre can differ in rhythmic phrasing, not just in pitches.
  const rhythmFeel = pickWeighted([["authored", 4], ["tresillo", 1.3], ["offbeat", 1.3], ["halftime", 0.9]]);
  const motif = generateMotif(motifLen, params, rhythmFeel);
  const totalChunks = Math.ceil(totalSteps / motifLen);
  let chunkStart = 0;
  let chunkIndex = 0;

  while (chunkStart < totalSteps) {
    let motifToUse = motif;
    if (chunkIndex > 0 && Math.random() < params.variationProbability) {
      const modes = ["transposeUp", "transposeDown", "invert", "truncate", "thin", "displace"];
      motifToUse = transformMotif(motif, modes[Math.floor(Math.random() * modes.length)]);
    }
    // Antecedent-consequent phrasing (standard "period" form in tonal
    // harmony - see e.g. Kostka & Payne, "Tonal Harmony"): a "question"
    // phrase conventionally lands on an open, unresolved half-cadence (the
    // 5th scale degree) while its "answer" resolves all the way home to
    // the tonic - the harmonic version of the call-and-response pairing
    // below, not just a pitch-contour echo.
    if (chunkIndex % 2 === 0 && chunkIndex + 1 < totalChunks) {
      for (let i = motifToUse.length - 1; i >= 0; i--) {
        if (motifToUse[i].degreeOffset !== null) {
          motifToUse = motifToUse.map((e, idx) => (idx === i ? { ...e, degreeOffset: 4 } : e));
          break;
        }
      }
    }
    // Question-and-answer phrasing: every other repeat is the "answer,"
    // sometimes dropped an octave for contrast, and always resolves its
    // final note back to the tonic - the classic call-response pairing
    // that makes a phrase feel finished rather than just looping.
    // The octave drop is a real call/response device, but at 50% it was
    // one of three systems all widening the range at once - kept as a
    // deliberate occasional contrast instead of a coin flip.
    let phraseOctave = 0;
    if (chunkIndex % 2 === 1) {
      if (Math.random() < 0.28) phraseOctave = -7;
      for (let i = motifToUse.length - 1; i >= 0; i--) {
        if (motifToUse[i].degreeOffset !== null) {
          motifToUse = motifToUse.map((e, idx) => (idx === i ? { ...e, degreeOffset: 0 } : e));
          break;
        }
      }
    }
    // A bass line can roam a little wider than a hook and still read as
    // one part; a melody is held to about an octave and a bit.
    const halfSpan = isBass ? 5 : 4;
    for (const ev of motifToUse) {
      if (ev.degreeOffset === null) continue;
      const stepPos = chunkStart + ev.offset;
      if (stepPos >= totalSteps) continue;
      const barIdx = Math.floor(stepPos / STEPS_PER_BAR);
      const barRoot = barRootDegrees[barIdx];
      const dur = Math.min(ev.duration, totalSteps - stepPos);
      const folded = foldIntoSpan(ev.degreeOffset, halfSpan);
      arr[stepPos] = { degree: barRoot + effectiveRegister + phraseOctave + folded, len: dur };
    }
    chunkStart += motifLen;
    chunkIndex++;
  }

  // A real intro layers in across the bar rather than being almost
  // silent throughout - notes get progressively more likely to survive
  // as the bar approaches the downbeat of bar 2.
  if (structure[0] === "intro") {
    for (let i = 0; i < STEPS_PER_BAR; i++) {
      const keep = 0.2 + 0.55 * (i / (STEPS_PER_BAR - 1));
      if (arr[i] && Math.random() > keep) arr[i] = null;
    }
  }
  return arr;
}

// A chorus needs one strong, instantly-recognizable hook rather than the
// verse's more loosely-evolving motif - real songwriting almost always
// repeats the *exact same* short idea every time the chorus comes back
// (that repetition is most of what makes a hook a hook), so this generates
// one fixed motif per instrument and stamps it into every chorus bar
// verbatim - transposed to each bar's chord, never varied or transformed -
// instead of letting the verse's own motif-with-variation logic keep
// evolving straight through the chorus sections too. Only runs in full-song
// mode, since a short loop has no chorus/verse distinction to make.
function applyChorusHook(melody, inst, style, barMetas, barRootDegrees) {
  const params = style.melody[inst];
  if (!params || !barMetas.some((b) => b.type === "chorus")) return;

  const register = REGISTER[inst];
  // Same ensemble discipline as the verse material: the bass hook stays in
  // the bass lane, everything else can sit at or above home register.
  const registerJitter = inst === "bass" ? 0 : pickWeighted([[0, 3], [7, 1]]);
  const effectiveRegister = register + registerJitter;
  const hookParams = {
    ...params,
    motifBars: 1,
    restProbability: Math.max(0.1, params.restProbability * 0.75),
    chordToneProbability: Math.min(0.95, params.chordToneProbability + 0.15),
  };
  const hookLen = hookParams.motifBars * STEPS_PER_BAR;
  const hook = generateMotif(hookLen, hookParams);
  const hookByOffset = new Map(hook.filter((e) => e.degreeOffset !== null).map((e) => [e.offset, e]));

  for (let i = 0; i < barMetas.length; i++) {
    if (barMetas[i].type !== "chorus") continue;
    const barStart = i * STEPS_PER_BAR;
    const sectionBarPos = barMetas[i].pos;
    const barRoot = barRootDegrees[i];
    for (let s = 0; s < STEPS_PER_BAR; s++) {
      const globalStep = barStart + s;
      const hookStep = (sectionBarPos * STEPS_PER_BAR + s) % hookLen;
      const ev = hookByOffset.get(hookStep);
      if (!ev) {
        melody[globalStep] = null;
        continue;
      }
      const dur = Math.min(ev.duration, hookLen - hookStep, melody.length - globalStep);
      const folded = foldIntoSpan(ev.degreeOffset, inst === "bass" ? 5 : 4);
      melody[globalStep] = { degree: barRoot + effectiveRegister + folded, len: dur };
    }
  }
}

// Two independently-generated mono melodies can land dense onsets on the
// exact same step purely by chance, which reads as cluttered rather than
// arranged - real call-and-response arrangement leaves room for each
// voice rather than having both talk at once. This only ever *removes* a
// colliding note (never adds one or changes a pitch), and only when the
// instrument being thinned has another note within a couple of steps
// either side, so a genuinely sparse part never gets silenced outright.
function declutterMonoCollisions(instruments, monoInstruments) {
  if (!monoInstruments || monoInstruments.length < 2) return;
  const primary = instruments[monoInstruments[0]];
  const secondary = instruments[monoInstruments[1]];
  if (!primary || !secondary) return;
  for (let i = 0; i < secondary.length; i++) {
    if (!secondary[i] || !primary[i]) continue;
    const hasNearby = [-2, -1, 1, 2].some((d) => secondary[i + d]);
    if (hasNearby && Math.random() < 0.6) secondary[i] = null;
  }
}

const STYLES = {
  hiphop: {
    name: "Hip-Hop",
    description: "Boom bap with a soulful, sample-style melody and moody minor chords.",
    tempo: { min: 82, max: 96, default: 90 },
    swing: 0.15,
    humanize: { timingMs: 6, velocityJitter: 0.18 },
    pockets: { snare: 8, hihat: 5 },
    key: "C2",
    scale: "minor",
    progressions: [[0, 3, 4, 3], [0, 5, 3, 4], [0, 6, 3, 4], [0, 3, 6, 2]],
    // The E-mu SP-1200's bit-crushed kick/snare - the actual sampler
    // golden-era boom bap was built on - now the default for the genre
    // its research writeup was literally named after.
    defaultFlavors: { kick: "sp1200", snare: "sp1200", hihat: "dark", perc: "shaker", bass: "warm", piano: "electric", lead: "flute", strings: "soul", stab: "pluck-chord", organ: "gospel", horn: "muted" },
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
    melodic: { monoInstruments: ["bass", "lead"], chordInstruments: ["piano", "strings", "organ", "stab", "horn"] },
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
      // Classic boom-bap sample-horn stab (think DJ Premier / Wu-Tang era
      // chopped soul horns) - a short muted-trumpet accent placed on the
      // "and" of beat 4, sparse enough to stay a garnish, not a lead voice.
      horn: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,C(0,3,1), 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.25,
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
    // "true808" - the sliding, warm-saturated modern-rap 808 (see
    // playBass) - is the bass sound today's trap actually runs on.
    defaultFlavors: { kick: "808", snare: "clap", hihat: "bright", bass: "true808", lead: "bell", stab: "bell-chord", vocal: "ooh", fx: "riser" },
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
        optionalProbability: 0.32,
      },
      vocal: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,C(0,1,1),0],
        optionalProbability: 0.32,
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
    // A Moog-style filter-swept bass instead of a flat, static-cutoff
    // synth bass - deep/classic house basslines lean on exactly this kind
    // of analog ladder-filter movement for their warmth.
    defaultFlavors: { kick: "909", snare: "909snare", hihat: "909", perc: "conga", bass: "moog", piano: "pluck", pad: "ensemble", lead: "saw", stab: "square-chord", vocal: "ahh", fx: "riser" },
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
        optionalProbability: 0.3,
      },
      vocal: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,C(0,1,1), 0,0,0,0, 0,0,0,C(0,1,1), 0,0,0,0],
        optionalProbability: 0.32,
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
    defaultFlavors: { kick: "acoustic", snare: "acoustic", hihat: "bright", bass: "pluck", guitar: "power", perc: "timpani", tom: "acoustic" },
    drums: {
      // "perc" is a sparse orchestral timpani hit, not a percussion groove -
      // the same big low arena-rock boom bands like Queen/Muse reach for
      // under a huge downbeat. It's genuinely new sonic ground for this
      // genre's kit rather than a re-skinned existing sound.
      instruments: ["kick", "snare", "hihat", "tom", "perc", "crash"],
      main: {
        core: {
          kick:  [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,1,0],
          snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          tom:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          perc:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:  [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,1],
          snare: [0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
          hihat: [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          perc:  [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optionalProbability: 0.3,
      },
      // The 2-and-4 backbeat is close to inviolable in rock, so both
      // grooves keep it; the variation lives in the kick pattern, the
      // straight-16th hats, and optional ghost-note snares instead.
      mainVariants: [{
        core: {
          kick:  [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0],
          snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
          tom:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          perc:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:  [0,0,1,0, 0,1,0,0, 0,0,1,0, 0,0,0,1],
          snare: [0,0,0,0, 0,0,0,1, 0,0,1,0, 0,0,0,0],
          perc:  [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
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
    // "pluck" over a plain saw for the lead hook - real reggaeton synth
    // hooks are almost always short and staccato/plucky (they have to cut
    // through the dembow pattern's own busy syncopation), not a sustained
    // saw tone.
    defaultFlavors: { kick: "snappy", snare: "rimshot", hihat: "bright", perc: "conga", bass: "warm", lead: "pluck", horn: "brass", stab: "pluck-chord", vocal: "ooh", tom: "acoustic" },
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
        optional: [0,0,0,C(0,3,1), 0,0,0,0, 0,0,0,C(2,3,1), 0,0,0,0],
        optionalProbability: 0.3,
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
    pockets: { snare: 12, hihat: 8, bass: -2 },
    key: "D2",
    scale: "dorian",
    progressions: [[0, 3, 4, 0], [0, 2, 3, 0], [0, 4, 3, 0], [0, 3]],
    ambience: "vinyl",
    // Mellotron strings for the default kit - a tape-warbled, band-limited
    // string machine is about as on-brand as lo-fi texture gets, far more
    // so than a clean "soul" string patch.
    defaultFlavors: { kick: "lofi", snare: "fat", hihat: "vinyl", perc: "shaker", bass: "warm", piano: "electric", pad: "airy", lead: "flute", strings: "mellotron", stab: "pluck-chord", marimba: "marimba", horn: "clarinet" },
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
    melodic: { monoInstruments: ["bass", "lead", "marimba"], chordInstruments: ["piano", "pad", "strings", "stab", "horn"] },
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
      // A mellow woodwind color for the jazz-cafe side of lo-fi - long,
      // soft-landing legato notes rather than stabs, since a clarinet
      // doesn't punch the way a horn section or synth stab does.
      horn: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,C(0,3,2),0, 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.22,
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
        optionalProbability: 0.28,
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
    defaultFlavors: { kick: "acoustic", snare: "clap", hihat: "bright", perc: "shaker", bass: "logdrum", guitar: "nylon", pad: "warm", stab: "pluck-chord", organ: "drawbar", marimba: "marimba", horn: "brass" },
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "perc"],
      main: {
        core: {
          kick:    [1,0,0,1, 0,0,1,0, 0,1,0,0, 1,0,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          perc:    [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
        },
        optional: {
          hihat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
          perc:    [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
        },
        optionalProbability: 0.3,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,1,0, 0,0,1,0, 1,0,0,1, 0,0,1,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          perc:    [1,0,1,1, 0,1,1,0, 1,0,1,1, 0,1,1,0],
        },
        optional: {
          hihat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          openhat: [0,0,0,1, 0,0,0,0, 0,0,0,1, 0,0,0,0],
          perc:    [0,1,0,0, 1,0,0,1, 0,1,0,0, 1,0,0,1],
        },
        optionalProbability: 0.3,
      }],
    },
    melodic: { monoInstruments: ["bass", "guitar", "marimba"], chordInstruments: ["pad", "organ", "stab", "horn"] },
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
        optionalProbability: 0.3,
      },
      // Highlife/afrobeats horn stabs - short punctuating brass hits on
      // the offbeats, the same call that answers the guitar hook in a lot
      // of real Afrobeats and highlife records.
      horn: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,C(0,3,1), 0,0,0,0, 0,0,0,C(2,3,1), 0,0,0,0],
        optionalProbability: 0.3,
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
        optionalProbability: 0.3,
      },
      vocal: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,C(0,1,1)],
        optionalProbability: 0.26,
      },
    },
  },

  rnb: {
    name: "R&B / Soul",
    description: "Laid-back live-feel groove, lush 7th-chord Rhodes, a smooth solo saxophone top line.",
    tempo: { min: 68, max: 88, default: 76 },
    swing: 0.13,
    humanize: { timingMs: 8, velocityJitter: 0.16 },
    key: "F2",
    scale: "major",
    progressions: [[0, 5, 1, 4], [0, 3, 5, 4], [0, 2, 3, 4], [5, 3, 0, 4]],
    // A real mono solo-line saxophone instead of a generic flute lead - a
    // sax solo is about as canonical a "smooth vocal-style top line" as
    // soul/R&B production actually has.
    defaultFlavors: { kick: "acoustic", snare: "fat", hihat: "dark", perc: "shaker", bass: "pluck", piano: "rhodes", pad: "choir", sax: "smooth", strings: "orchestral", organ: "drawbar", horn: "section" },
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
    melodic: { monoInstruments: ["bass", "sax"], chordInstruments: ["piano", "pad", "strings", "organ", "horn"] },
    melody: {
      bass: { motifBars: 2, noteLengths: [[4,3],[3,2],[6,2]], restProbability: 0.3, chordToneProbability: 0.85, chordTonePool: [[0,5],[4,2],[7,1]], passingTonePool: [[2,1],[-1,1]], variationProbability: 0.3 },
      // A soloist breathes and phrases in long lines rather than firing
      // off short notes - more rest, longer note lengths, and less
      // constant variation than a typical mono lead config, so it reads
      // as one expressive solo idea instead of a busy instrumental run.
      sax: { motifBars: 2, noteLengths: [[4,3],[6,3],[8,2]], restProbability: 0.5, chordToneProbability: 0.75, chordTonePool: [[0,2],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1],[-1,1]], variationProbability: 0.35 },
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
      // Motown/Stax-style soul horn section stabs answering the vocal
      // line on the offbeats - a defining texture of classic soul that
      // was completely missing from this genre's palette before.
      horn: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,C(0,3,1),0, 0,0,0,0, 0,0,C(2,3,1),0, 0,0,0,0],
        optionalProbability: 0.3,
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
        optionalProbability: 0.32,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,C(0,3,1),0, 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.28,
      },
    },
  },

  jerseyclub: {
    name: "Jersey Club",
    description: "Bouncy syncopated kick bursts, chopped vocal hooks, dry and punchy.",
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
        optionalProbability: 0.3,
      },
    },
  },

  dnb: {
    name: "Drum & Bass",
    description: "Fast syncopated breakbeat drums at ~172 BPM, a growling Reese bass.",
    tempo: { min: 165, max: 178, default: 174 },
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
        optionalProbability: 0.3,
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
    // A Juno-106 chorus pad instead of a plain "warm" patch - that lush,
    // BBD-chorused analog pad is about as quintessentially 80s-synthwave
    // a texture as exists.
    defaultFlavors: { kick: "linn", snare: "gatedverb", hihat: "bright", bass: "synth", lead: "brasslead", pad: "juno", stab: "square-chord", arp: "arp" },
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
    description: "Hard-hitting distorted 808, aggressive hi-hat rolls, a driven master bus, a hard-edged Auto-Tune hook.",
    tempo: { min: 132, max: 152, default: 142 },
    // Tightened from 0.15 (Hip-Hop's loose boom-bap swing) down close to
    // Trap's near-straight feel - a loose, laid-back swing reads as
    // groovy/relaxed, which works against "hard-hitting" no matter how
    // distorted the drums are. Modern hard trap/rage records are almost
    // always tightly quantized, not swung.
    swing: 0.06,
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
    defaultFlavors: { kick: "gritty", snare: "trapsnap", hihat: "metallic", bass: "hard808", autolead: "hard", vocal: "ahh", stab: "bell-chord", fx: "siren" },
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
    melodic: { monoInstruments: ["bass", "autolead"], chordInstruments: ["vocal", "stab"] },
    melody: {
      bass: { motifBars: 1, noteLengths: [[3,3],[4,2],[6,1]], restProbability: 0.3, chordToneProbability: 0.9, chordTonePool: [[0,6],[4,1]], passingTonePool: [[-2,1],[3,1]], variationProbability: 0.2 },
      // A real hook breathes - it's a sung phrase, not an instrumental
      // run - so this leans on more space and longer notes than a
      // typical mono lead config, and stays close to its core idea
      // instead of constantly varying, the way a rap hook is repeated
      // almost like a mantra rather than reinvented every bar.
      autolead: { motifBars: 2, noteLengths: [[3,3],[4,3],[6,1]], restProbability: 0.45, chordToneProbability: 0.85, chordTonePool: [[0,4],[4,2],[7,1]], passingTonePool: [[-1,1],[2,1]], variationProbability: 0.15 },
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
        optionalProbability: 0.28,
      },
    },
  },

  amapiano: {
    name: "Amapiano",
    // South Africa's house offshoot, distinct from Afrobeats: slower and
    // sparser, with the log drum carrying the groove as a melodic bass
    // instrument rather than the kick, jazzy piano chords, and lots of
    // space - "private school" amapiano leans clean and soulful.
    description: "Sparse deep kick, a melodic log-drum bassline carrying the groove, jazzy piano, airy space.",
    tempo: { min: 108, max: 118, default: 113 },
    swing: 0.07,
    humanize: { timingMs: 6, velocityJitter: 0.15 },
    key: "C2",
    scale: "minor",
    progressions: [[0, 3, 4, 0], [0, 5, 3, 4], [0, 3], [0, 4, 3, 0]],
    defaultFlavors: { kick: "deep", snare: "rimshot", hihat: "dark", perc: "shaker", bass: "logdrum", piano: "rhodes", pad: "warm", vocal: "ooh", stab: "organ-chord" },
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "perc"],
      main: {
        core: {
          kick:    [1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          perc:    [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
        },
        optional: {
          kick:    [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0],
          hihat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
          perc:    [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
        },
        optionalProbability: 0.3,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,0,0, 0,0,1,0, 0,0,0,0, 1,0,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          perc:    [1,0,1,1, 0,1,1,0, 1,0,1,1, 0,1,1,0],
        },
        optional: {
          kick:    [0,0,1,0, 0,0,0,0, 0,1,0,0, 0,0,0,0],
          openhat: [0,0,0,1, 0,0,0,0, 0,0,0,1, 0,0,0,0],
        },
        optionalProbability: 0.3,
      }],
    },
    melodic: { monoInstruments: ["bass"], chordInstruments: ["piano", "pad", "vocal", "stab"] },
    melody: {
      // The log drum IS the lead voice in amapiano - more active and
      // syncopated than a typical bassline, it fills the space the sparse
      // kick leaves open.
      bass: { motifBars: 1, noteLengths: [[2,3],[3,3],[4,1]], restProbability: 0.3, chordToneProbability: 0.85, chordTonePool: [[0,5],[4,2],[7,1]], passingTonePool: [[-2,1],[2,1]], variationProbability: 0.3 },
    },
    chords: {
      piano: {
        core:     [C(0,4,4),0,0,0, 0,0,0,0, 0,0,C(2,3,4),0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,C(0,3,2),0, 0,0,0,0, 0,0,C(3,3,2),0],
        optionalProbability: 0.3,
      },
      pad: {
        core:     [C(0,4,16),0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: new Array(STEPS_PER_BAR).fill(0),
        optionalProbability: 0,
      },
      vocal: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,C(0,1,1), 0,0,0,0, 0,0,0,C(0,1,1), 0,0,0,0],
        optionalProbability: 0.28,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,C(0,3,1), 0,0,0,0],
        optionalProbability: 0.28,
      },
    },
  },

  ukgarage: {
    name: "UK Garage",
    // The 2-step signature: NO kick on beat 3. That missing kick is what
    // gives garage its skippy, off-balance bounce, along with a heavy
    // shuffle and chopped-up vocal stabs.
    description: "Skippy 2-step drums (no kick on beat 3), heavy shuffle, chopped vocal stabs, a warm sub.",
    tempo: { min: 128, max: 136, default: 132 },
    swing: 0.22,
    humanize: { timingMs: 5, velocityJitter: 0.18 },
    key: "G2",
    scale: "dorian",
    progressions: [[0, 3, 4, 0], [0, 2, 3, 4], [0, 4], [0, 3]],
    defaultFlavors: { kick: "punch", snare: "crisp", hihat: "bright", perc: "shaker", bass: "sub", lead: "pluck", organ: "combo", vocal: "ay", stab: "organ-chord" },
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "perc"],
      main: {
        core: {
          kick:    [1,0,0,0, 0,0,0,1, 0,0,0,0, 0,1,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [1,0,1,1, 0,1,1,0, 1,0,1,1, 0,1,1,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          perc:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,0,0],
          snare:   [0,0,0,1, 0,0,0,0, 0,0,1,0, 0,0,0,0],
          openhat: [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0],
          perc:    [0,1,0,0, 0,0,1,0, 0,1,0,0, 0,0,1,0],
        },
        optionalProbability: 0.32,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,0,0, 0,0,1,0, 0,0,0,0, 1,0,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [1,1,0,1, 0,1,1,0, 1,1,0,1, 0,1,1,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          perc:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,0,1, 0,0,0,0, 0,1,0,0, 0,0,0,0],
          snare:   [0,0,1,0, 0,0,0,0, 0,0,0,1, 0,0,0,0],
          openhat: [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
        },
        optionalProbability: 0.32,
      }],
    },
    melodic: { monoInstruments: ["bass", "lead"], chordInstruments: ["organ", "vocal", "stab"] },
    melody: {
      bass: { motifBars: 1, noteLengths: [[2,2],[3,3],[4,2]], restProbability: 0.35, chordToneProbability: 0.85, chordTonePool: [[0,5],[4,2],[7,1]], passingTonePool: [[-2,1],[2,1]], variationProbability: 0.3 },
      lead: { motifBars: 1, noteLengths: [[1,2],[2,3],[3,1]], restProbability: 0.5, chordToneProbability: 0.7, chordTonePool: [[0,2],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1]], variationProbability: 0.4 },
    },
    chords: {
      organ: {
        core:     [0,0,C(0,3,1),0, 0,0,0,0, 0,0,C(0,3,1),0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,C(2,3,1), 0,0,0,0, 0,0,0,C(2,3,1)],
        optionalProbability: 0.32,
      },
      vocal: {
        core:     [0,0,0,0, 0,0,C(0,1,1),0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,C(2,1,1), 0,0,0,0, 0,0,0,C(2,1,1), 0,0,0,0],
        optionalProbability: 0.35,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,C(0,3,1),0],
        optionalProbability: 0.3,
      },
    },
  },

  techno: {
    name: "Techno",
    // Distinct from House: darker, harder, more hypnotic and minimal -
    // near-static harmony (the groove and timbre carry the track, not
    // chord changes), a relentless 909 four-on-the-floor, offbeat open
    // hats, and an acid 303 line.
    description: "Relentless 909 four-on-the-floor, offbeat open hats, an acid 303 line, dark minimal harmony.",
    tempo: { min: 126, max: 138, default: 130 },
    swing: 0,
    humanize: { timingMs: 2, velocityJitter: 0.08 },
    key: "A1",
    scale: "minor",
    progressions: [[0], [0, 3], [0, 1], [0, 4]],
    defaultFlavors: { kick: "909", snare: "909snare", hihat: "909", perc: "clave", bass: "303", pad: "dark", stab: "square-chord", arp: "pulse", fx: "riser" },
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "perc", "crash", "fx"],
      main: {
        core: {
          kick:    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
          openhat: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
          perc:    [0,0,0,1, 0,0,0,0, 0,1,0,0, 0,0,0,0],
        },
        optional: {
          hihat:   [1,1,0,1, 1,1,0,1, 1,1,0,1, 1,1,0,1],
          perc:    [0,1,0,0, 0,0,1,0, 0,0,0,1, 0,1,0,0],
        },
        optionalProbability: 0.3,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
          openhat: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
          perc:    [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,1,0,0],
        },
        optional: {
          perc:    [0,1,0,1, 0,0,0,0, 0,1,0,1, 0,0,0,0],
        },
        optionalProbability: 0.3,
      }],
    },
    melodic: { monoInstruments: ["bass", "arp"], chordInstruments: ["pad", "stab"] },
    melody: {
      // A driving 16th-note acid line - short repeated notes with small
      // moves, built for the 303's squelch to do the talking.
      bass: { motifBars: 1, noteLengths: [[1,3],[2,4]], restProbability: 0.25, chordToneProbability: 0.9, chordTonePool: [[0,5],[7,2]], passingTonePool: [[-2,1],[1,1]], variationProbability: 0.25 },
      arp: { motifBars: 1, noteLengths: [[1,6],[2,2]], restProbability: 0.35, chordToneProbability: 0.9, chordTonePool: [[0,3],[2,2],[4,2],[7,2]], passingTonePool: [[1,1]], variationProbability: 0.15 },
    },
    chords: {
      pad: {
        core:     [C(0,4,16),0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: new Array(STEPS_PER_BAR).fill(0),
        optionalProbability: 0,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,C(0,3,1),0, 0,0,0,0, 0,0,C(0,3,1),0],
        optionalProbability: 0.3,
      },
    },
  },

  neosoul: {
    name: "Neo-Soul",
    // Distinct from R&B/Soul: the D'Angelo/Erykah Badu school - the
    // "drunk" behind-the-beat drum feel (the highest timing humanization
    // in the app, the J Dilla drag), richer extended chords (9ths via
    // 5-note voicings), and a jazz guitar as a second melodic voice.
    description: "Drunk, dragging drum feel, rich 9th-chord Rhodes, jazz guitar lines, deep pocket.",
    tempo: { min: 80, max: 96, default: 88 },
    swing: 0.16,
    humanize: { timingMs: 14, velocityJitter: 0.2 },
    // Drums drag behind while the bass stays forward - the "drunk"
    // neo-soul pocket is this relationship between parts, not overall
    // sloppiness.
    pockets: { snare: 16, hihat: 10, kick: 4, bass: -3 },
    key: "F2",
    scale: "major",
    progressions: [[0, 2, 5, 4], [3, 2, 0, 4], [0, 5, 1, 4], [2, 5, 0, 3]],
    // Cross-stick, not a full snare: neo-soul's backbeat is almost always
    // the stick laid across the head tapping the rim - the dry woody
    // "tock" that leaves room for the Rhodes and keeps the pocket soft.
    defaultFlavors: { kick: "lofi", snare: "rimclick", hihat: "analog", perc: "shaker", bass: "pluck", piano: "rhodes", pad: "choir", guitar: "jazz", organ: "drawbar", vocal: "ooh" },
    drums: {
      instruments: ["kick", "snare", "hihat", "perc"],
      main: {
        core: {
          kick:  [1,0,0,0, 0,0,0,1, 0,0,1,0, 0,0,0,0],
          snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          perc:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:  [0,0,1,0, 0,0,0,0, 0,0,0,1, 0,0,1,0],
          hihat: [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          perc:  [0,0,1,0, 0,0,0,1, 0,0,1,0, 0,0,0,0],
        },
        optionalProbability: 0.3,
      },
      mainVariants: [{
        core: {
          kick:  [1,0,0,1, 0,0,0,0, 1,0,0,0, 0,0,1,0],
          snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat: [1,0,1,1, 0,1,1,0, 1,0,1,1, 0,1,1,0],
          perc:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:  [0,0,1,0, 0,0,1,0, 0,0,0,0, 0,1,0,0],
          perc:  [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,1],
        },
        optionalProbability: 0.3,
      }],
    },
    melodic: { monoInstruments: ["bass", "guitar"], chordInstruments: ["piano", "pad", "organ", "vocal"] },
    melody: {
      bass: { motifBars: 2, noteLengths: [[3,2],[4,3],[6,2]], restProbability: 0.35, chordToneProbability: 0.85, chordTonePool: [[0,5],[4,2],[7,1]], passingTonePool: [[2,1],[-1,1]], variationProbability: 0.3 },
      guitar: { motifBars: 2, noteLengths: [[2,3],[3,2],[4,2]], restProbability: 0.45, chordToneProbability: 0.7, chordTonePool: [[0,2],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1],[-1,1]], variationProbability: 0.4 },
    },
    chords: {
      // Size-5 voicings = stacked-thirds 9th chords, the neo-soul harmony
      // signature that plain triads and 7ths don't reach.
      piano: {
        core:     [C(0,5,6),0,0,0, 0,0,0,0, 0,0,C(1,4,4),0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,C(0,4,1), 0,0,0,0, 0,0,C(2,4,2),0],
        optionalProbability: 0.25,
      },
      pad: {
        core:     [C(0,4,16),0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: new Array(STEPS_PER_BAR).fill(0),
        optionalProbability: 0,
      },
      organ: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, C(0,3,4),0,0,0, 0,0,0,0],
        optionalProbability: 0.22,
      },
      vocal: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,C(0,1,1),0],
        optionalProbability: 0.28,
      },
    },
  },
};

// Each style carries its own key so downstream logic (ghost-note
// idiom, filter sweeps, DJ-length intros) can ask which genre it is
// without every call site having to thread the id through.
for (const styleId of Object.keys(STYLES)) STYLES[styleId].id = styleId;

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
// Voice leading. Chords used to resolve to root position every single
// time (always a plain stack of thirds), so a progression read as a
// series of unrelated blocks being stamped down rather than one part
// moving. Real keyboard and guitar players invert each chord so it sits
// as close as possible to the previous one - common tones stay put and
// the rest step by a note or two. Rotating the voicing (lifting the
// lowest tones up an octave) and keeping whichever rotation moves least
// is exactly that, and it never alters which notes are in the chord.
function voiceLeadDegrees(degrees, prevLowest) {
  if (prevLowest === null || prevLowest === undefined || degrees.length < 2) return degrees;
  let best = degrees;
  let bestCost = Infinity;
  for (let rot = 0; rot < Math.min(degrees.length, 3); rot++) {
    const cand = degrees.slice(rot).concat(degrees.slice(0, rot).map((d) => d + 7));
    const cost = Math.abs(cand[0] - prevLowest);
    if (cost < bestCost) { bestCost = cost; best = cand; }
  }
  return best;
}

function resolveChordBarTrack(instKey, cfg, barRootDegree, opts = {}) {
  const { registerOffset = 0, voicingBonus = 0, splitMotion = null, anticipate = false, prevLowest = null } = opts;
  const raw = rollNoteTrack(cfg.core, cfg.optional, cfg.optionalProbability);
  const register = REGISTER[instKey] + registerOffset;
  let running = prevLowest;
  const resolved = raw.map((spec) => {
    if (!spec) return null;
    const root = barRootDegree + register + spec.degreeOffset;
    const size = Math.max(2, spec.size + voicingBonus);
    const led = voiceLeadDegrees(chordDegrees(root, size), running);
    running = led[0];
    return { degrees: led, len: spec.len };
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

  // The "push": all of this instrument's hits anticipate the beat by an
  // 8th note (2 steps), the standard funk/R&B/gospel comping move where
  // the chords land on the "and" just ahead of the beat instead of on it.
  // Rotation wraps the bar, which in looped playback reads exactly like
  // anticipating the next bar's downbeat. Skipped whenever the pattern
  // holds any long sustain (a pushed whole-bar pad makes no sense).
  if (anticipate) {
    const lens = resolved.filter(Boolean).map((n) => n.len);
    if (lens.length && Math.max(...lens) <= 8) {
      const pushed = new Array(resolved.length).fill(null);
      for (let i = 0; i < resolved.length; i++) {
        if (resolved[i]) pushed[(i - 2 + resolved.length) % resolved.length] = resolved[i];
      }
      return pushed;
    }
  }
  return resolved;
}

function pickChordVariety(style) {
  const variety = {};
  for (const inst of style.melodic.chordInstruments || []) {
    // Low-homed chordal instruments (pad/organ/guitar sit at register 7)
    // must never jitter a further octave down - that lands them squarely
    // in the bass's lane and turns the low end to mud, another piece of
    // the "instruments fighting each other" problem.
    const lowHomed = REGISTER[inst] <= 7;
    variety[inst] = {
      registerOffset: lowHomed ? pickWeighted([[0, 3], [7, 1]]) : pickWeighted([[-7, 1], [0, 3], [7, 1]]),
      voicingBonus: pickWeighted([[0, 3], [1, 2], [2, 1]]),
      splitMotion: Math.random() < 0.45 ? pickWeighted([[4, 1], [-3, 1], [3, 1], [-4, 1]]) : null,
      anticipate: Math.random() < 0.22,
    };
  }
  return variety;
}

function buildStructure(bars) {
  // The thinned-out intro bar used to appear on literally every 4-bar-plus
  // generation, which made bar 1 feel identical across generations even
  // when everything else changed - now it's a coin-flip production choice,
  // like a real producer sometimes opening cold on the full groove.
  const useIntro = bars >= 4 && Math.random() < 0.6;
  const seq = [];
  for (let i = 0; i < bars; i++) {
    if (i === 0 && useIntro) seq.push("intro");
    else if ((i + 1) % 4 === 0) seq.push("fill");
    else seq.push("main");
  }
  return seq;
}

// densityBoost shifts how many of the authored optional hits actually
// land, so a chorus can genuinely be busier than its verse rather than
// differing only in which instruments are switched on.
function buildDrumBar(style, variant, densityBoost = 0) {
  const m = style.drums.main;
  const bar = {};
  const prob = Math.max(0, Math.min(0.95, m.optionalProbability + densityBoost));
  for (const inst of style.drums.instruments) {
    bar[inst] = rollTrack(m.core[inst], m.optional[inst], prob);
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
    // Sparse trap-family genres have few optional hits to add, so their
    // chorus energy comes the way it does on real records: more hi-hat
    // rolls, not more instruments.
    const rollProb = Math.max(0, Math.min(0.95, m.hihatRollProbability + densityBoost * 1.5));
    for (const step of m.hihatRollSteps) {
      if (Math.random() < rollProb) bar.hihat[step] = "roll";
    }
  }

  // Ghost notes: quiet snare taps between the backbeats. Real drummers
  // fill the space between 2 and 4 with these almost constantly; on a
  // grid their absence is a big part of why programmed drums sound
  // stiff. Placed only on weak 16ths, and never on top of a real hit.
  if (bar.snare && variant !== "intro" && GHOST_GENRES.has(style.id)) {
    for (const g of [2, 6, 10, 14, 7, 15]) {
      if (!bar.snare[g] && Math.random() < 0.2) bar.snare[g] = "ghost";
    }
  }

  if (variant === "fill") {
    const type = style.fillType || "tomRun";
    if (type === "cut") {
      // Dropout fill: everything cuts for the last beat so the next
      // downbeat lands harder - the modern trap/EDM "pull the floor out"
      // move, and the exact opposite gesture from adding hits.
      for (const inst of Object.keys(bar)) {
        for (let s = 12; s < STEPS_PER_BAR; s++) bar[inst][s] = false;
      }
    } else if (type === "snareRush") {
      if (bar.snare) {
        bar.snare[12] = true;
        bar.snare[13] = true;
        bar.snare[14] = true;
        bar.snare[15] = true;
      }
      if (bar.hihat) bar.hihat[15] = "roll";
    } else if (type === "hatLift") {
      if (bar.hihat) {
        for (let s = 12; s < STEPS_PER_BAR; s++) bar.hihat[s] = "roll";
      }
      if (bar.openhat) bar.openhat[15] = true;
    } else {
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
  }

  return bar;
}

function buildChordBar(style, variant, barRootDegree, chordVariety, prevLowest = {}) {
  const bar = {};
  const chordInstruments = style.melodic.chordInstruments || [];
  for (const inst of chordInstruments) {
    if (variant === "intro") {
      bar[inst] = new Array(STEPS_PER_BAR).fill(null);
      continue;
    }
    const v = (chordVariety && chordVariety[inst]) || {};
    bar[inst] = resolveChordBarTrack(inst, style.chords[inst], barRootDegree, { ...v, prevLowest: prevLowest[inst] });
    for (let i = bar[inst].length - 1; i >= 0; i--) {
      if (bar[inst][i]) { prevLowest[inst] = bar[inst][i].degrees[0]; break; }
    }
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

// ---- Groove mutation ----
// Even with two authored groove variants per genre, measurement showed 15%
// of generation pairs shared a byte-identical kick+snare skeleton and the
// rest differed by only ~3 steps out of 32 - the rhythmic backbone barely
// moved between generations, which is exactly what "different sounds but
// the same order" describes. Instead of hand-authoring dozens more
// variants, each generation now algorithmically mutates the picked groove
// while protecting what makes the genre that genre:
//
// - Kick displacement never touches quarter-note positions (steps 0/4/8/12),
//   so House's four-on-the-floor and every genre's downbeat stay intact;
//   only syncopated kicks roam, and only by one step.
// - The snare backbeat is never moved at all - it's the single strongest
//   genre anchor in the whole kit.
// - Percussion patterns re-roll through a Euclidean rhythm generator
//   (Bjorklund's algorithm - Toussaint, "The Euclidean Algorithm Generates
//   Traditional Musical Rhythms", 2005, showed evenly-distributed onset
//   patterns underlie a huge share of the world's traditional rhythms,
//   which is why a rotated Euclidean pattern sounds like a groove and not
//   like noise), at a density near the authored one.
// - Dense 16th-note hat lines get occasional "hiccup" gaps dropped in, a
//   standard trap/house hat trick that changes the perceived groove a lot
//   for a tiny edit.
function euclideanPattern(hits, steps) {
  const out = [];
  let bucket = 0;
  for (let i = 0; i < steps; i++) {
    bucket += hits;
    if (bucket >= steps) {
      bucket -= steps;
      out.push(1);
    } else out.push(0);
  }
  return out;
}

function rotatePattern(arr, offset) {
  const n = arr.length;
  return arr.map((_, i) => arr[(i - offset + n) % n]);
}

function cloneGroove(m) {
  const g = {
    core: {}, optional: {},
    optionalProbability: m.optionalProbability,
    hihatRollProbability: m.hihatRollProbability,
  };
  if (m.hihatRollSteps) g.hihatRollSteps = [...m.hihatRollSteps];
  for (const k of Object.keys(m.core)) g.core[k] = [...m.core[k]];
  for (const k of Object.keys(m.optional || {})) g.optional[k] = [...m.optional[k]];
  return g;
}

function mutateGroove(m, tresilloAware = false) {
  const g = cloneGroove(m);

  // In Afro-Latin genres the kick doesn't just syncopate freely - it
  // articulates the tresillo (3+3+2), the cell underlying dembow,
  // habanera, and most Afro-diasporic dance rhythm. Mutating those
  // kicks generically smears the very figure that defines the groove,
  // so here mutation is constrained to positions inside the cell.
  if (g.core.kick && tresilloAware) {
    const kick = g.core.kick;
    const cell = [0, 3, 6, 8, 11, 14];
    if (Math.random() < 0.55) {
      const present = cell.filter((i) => kick[i]);
      const absent = cell.filter((i) => !kick[i] && i !== 0);
      if (absent.length && Math.random() < 0.6) kick[absent[Math.floor(Math.random() * absent.length)]] = 1;
      else if (present.length > 2) {
        const drop = present.filter((i) => i !== 0);
        if (drop.length) kick[drop[Math.floor(Math.random() * drop.length)]] = 0;
      }
    }
  } else if (g.core.kick) {
    const kick = g.core.kick;
    // 1-2 kick edits per generation from {displace, add, remove}, all
    // restricted to syncopated (off-quarter) positions and guarded so the
    // groove never collapses below its authored on-the-beat backbone.
    const ops = 1 + (Math.random() < 0.4 ? 1 : 0);
    for (let op = 0; op < ops; op++) {
      const roll = Math.random();
      const offQuarter = [];
      const emptyOffQuarter = [];
      for (let i = 1; i < STEPS_PER_BAR; i++) {
        if (i % 4 === 0) continue;
        if (kick[i]) offQuarter.push(i);
        else emptyOffQuarter.push(i);
      }
      if (roll < 0.5 && offQuarter.length) {
        const idx = offQuarter[Math.floor(Math.random() * offQuarter.length)];
        const dir = Math.random() < 0.5 ? -1 : 1;
        const target = idx + dir;
        if (target > 0 && target < STEPS_PER_BAR && !kick[target]) {
          kick[idx] = 0;
          kick[target] = 1;
        }
      } else if (roll < 0.8 && emptyOffQuarter.length) {
        kick[emptyOffQuarter[Math.floor(Math.random() * emptyOffQuarter.length)]] = 1;
      } else if (offQuarter.length && kick.filter(Boolean).length > 2) {
        kick[offQuarter[Math.floor(Math.random() * offQuarter.length)]] = 0;
      }
    }
  }

  if (g.core.hihat) {
    const hat = g.core.hihat;
    const density = hat.filter(Boolean).length;
    if (density >= 12 && Math.random() < 0.45) {
      const drops = 1 + (Math.random() < 0.4 ? 1 : 0);
      for (let d = 0; d < drops; d++) {
        const filled = [];
        for (let i = 0; i < STEPS_PER_BAR; i++) if (hat[i] && i % 4 !== 0) filled.push(i);
        if (filled.length) hat[filled[Math.floor(Math.random() * filled.length)]] = 0;
      }
    }
  }

  if (g.core.perc) {
    const density = g.core.perc.filter(Boolean).length;
    if (density >= 2 && density <= 8 && Math.random() < 0.5) {
      const k = Math.max(2, Math.min(9, density + (Math.random() < 0.4 ? (Math.random() < 0.5 ? -1 : 1) : 0)));
      g.core.perc = rotatePattern(euclideanPattern(k, STEPS_PER_BAR), Math.floor(Math.random() * 4));
    }
  }

  if (g.optional.hihat && Math.random() < 0.5) {
    g.optional.hihat = rotatePattern(g.optional.hihat, [2, 4, 6][Math.floor(Math.random() * 3)]);
  }

  return g;
}

// The fill bar was also identical in shape every generation (always the
// same tom run into the downbeat). Four genuinely different fill idioms,
// one picked per generation, all standard production moves:
// a tom run, a snare rush build, a hat lift, and the modern "cut" where
// everything drops out for the last beat so the downbeat lands harder.
function pickFillType() {
  return pickWeighted([["tomRun", 3], ["snareRush", 2], ["hatLift", 1.2], ["cut", 1]]);
}

function resolveGenerationStyle(style) {
  return {
    ...style,
    drums: { ...style.drums, main: mutateGroove(pickDrumMain(style), TRESILLO_GENRES.has(style.id)) },
    progression: pickProgression(style),
    fillType: pickFillType(),
  };
}

// User-typed chords ("Cm7 Fm7 Ab Bb7") replace the genre's own progression
// pool for harmony, one chord per bar cycling round-robin (same convention
// a genre's own `progressions` arrays already use) - but everything else
// about the genre (drum groove, swing, melody rhythm feel, chord-stab
// pattern) is untouched, so it still sounds like that genre, just built
// around the chords the user actually asked for instead of a random
// genre-appropriate progression.
function buildBarContextsFromChords(chords, barCount, baseOctave = 2) {
  const rootMidis = resolveChordRootMidis(chords, baseOctave);
  const contexts = [];
  for (let i = 0; i < barCount; i++) {
    const idx = i % chords.length;
    contexts.push({ rootMidi: rootMidis[idx], scale: chords[idx].scale });
  }
  return contexts;
}

function generateVariationOnce(rawStyle, bars) {
  const style = resolveGenerationStyle(rawStyle);
  const structure = buildStructure(bars);
  const totalSteps = bars * STEPS_PER_BAR;
  const customChords = rawStyle.customChords;
  let barRootDegrees, barChordContexts;
  if (customChords && customChords.length) {
    barRootDegrees = structure.map(() => 0);
    barChordContexts = buildBarContextsFromChords(customChords, structure.length);
  } else {
    barRootDegrees = structure.map((_, i) => style.progression[i % style.progression.length]);
  }

  const drumBars = structure.map((variant) => buildDrumBar(style, variant));
  for (let i = 1; i < structure.length; i++) {
    if (structure[i - 1] === "fill" && drumBars[i].crash !== undefined) drumBars[i].crash[0] = true;
  }
  // A loop always ends on its fill bar, so there is never a "next bar"
  // inside the array for that fill to resolve onto - which meant the
  // crash silently never fired in loop mode at all. Playback wraps, so
  // the fill resolves onto bar 1's downbeat: put the crash there.
  if (structure[structure.length - 1] === "fill" && drumBars[0].crash !== undefined) {
    drumBars[0].crash[0] = true;
  }

  const instruments = {};
  for (const inst of style.drums.instruments) {
    instruments[inst] = [].concat(...drumBars.map((b) => b[inst] || new Array(STEPS_PER_BAR).fill(false)));
  }

  const chordVariety = pickChordVariety(style);
  const voiceState = {};
  const chordBars = structure.map((variant, i) => buildChordBar(style, variant, barRootDegrees[i], chordVariety, voiceState));
  for (const inst of style.melodic.chordInstruments) {
    instruments[inst] = [].concat(...chordBars.map((b) => b[inst] || new Array(STEPS_PER_BAR).fill(null)));
  }

  const registerPlan = planRegisterJitters(style.melodic.monoInstruments);
  for (const inst of style.melodic.monoInstruments) {
    instruments[inst] = generateMonoMelody(REGISTER[inst], structure, barRootDegrees, style.melody[inst], totalSteps, registerPlan[inst], inst === "bass");
  }
  declutterMonoCollisions(instruments, style.melodic.monoInstruments);

  // Mix hierarchy: real productions have one clear featured voice per
  // section, with the other melodic parts sitting behind it - the absence
  // of that hierarchy is a big part of "the instruments aren't working
  // together." Each generation picks one non-bass melodic line as the
  // feature and gently ducks the rest via the same per-track automation
  // path the full-song arrangement already uses (the user can still see
  // and edit these levels in the automation lane).
  const automation = {};
  const supporting = style.melodic.monoInstruments.filter((i) => i !== "bass");
  if (supporting.length > 1) {
    const feature = supporting[Math.floor(Math.random() * supporting.length)];
    for (const inst of supporting) {
      if (inst !== feature) automation[inst] = [{ step: 0, value: 0.75 }];
    }
  }

  return { instruments, structure, barRootDegrees, barChordContexts, automation };
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
  "kick", "hihat", "snare", "bass", "piano", "organ", "pad", "lead", "autolead", "kalimba", "marimba",
  "guitar", "arp", "openhat", "perc", "stab", "strings", "horn", "sax", "vocal", "crash", "tom", "fx",
];

// Volume automation: rather than leaving a track's fader flat for the
// whole song, atmospheric/feature instruments swell into choruses, dip
// for the bridge breakdown, and fade in/out over the intro and outro -
// the same "automate a level over the arrangement" move a real mix uses.
const AUTOMATION_INSTRUMENTS = ["pad", "strings", "organ", "lead", "vocal", "kalimba", "marimba", "arp", "autolead", "sax"];

// intensity scales how far a track pulls back in quiet sections - 1 is
// the full atmospheric swing (down to ~30% in an intro/bridge), while a
// lower intensity blends the curve back toward a constant 1. Bass needed
// its own, much gentler version of this: without any automation at all it
// was one of the only instruments still hammering at full, unchanging
// velocity straight through a hushed bridge or intro while everything
// else (pads, strings, lead) tastefully dipped - reported as "the bass
// sounds too aggressive in parts it's not supposed to." Bass is still
// foundational and shouldn't vanish the way an atmospheric pad does, but
// it does deserve *some* pullback so a quiet section actually reads as
// quiet instead of just missing its other instruments.
function generateAutomationCurve(barMetas, intensity = 1) {
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

    value = 1 - (1 - value) * intensity;

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
      automation[inst] = generateAutomationCurve(barMetas, 1);
    }
  }
  if (style.melodic.monoInstruments.includes("bass")) {
    automation.bass = generateAutomationCurve(barMetas, 0.45);
  }
  return automation;
}

function priorityInstrumentList(style) {
  const have = new Set([...style.drums.instruments, ...style.melodic.monoInstruments, ...style.melodic.chordInstruments]);
  return INSTRUMENT_PRIORITY.filter((i) => have.has(i));
}

// House and techno are functional DJ music: the arrangement exists to
// be mixed. Long drum-only intros and outros are what let another
// record be beatmatched over the top, which is why club tracks are
// built that way rather than opening on the hook.
const DJ_GENRES = new Set(["house", "techno", "ukgarage"]);

function sectionsForStyle(style) {
  if (!DJ_GENRES.has(style.id)) return SONG_SECTIONS;
  return [
    { type: "intro", label: "DJ Intro", bars: 8 },
    { type: "intro", label: "Intro", bars: 4 },
    ...SONG_SECTIONS.filter((x) => x.type !== "intro" && x.type !== "outro"),
    { type: "outro", label: "Outro", bars: 4 },
    { type: "outro", label: "DJ Outro", bars: 8 },
  ];
}

function expandSongSections(sections = SONG_SECTIONS) {
  const bars = [];
  for (const section of sections) {
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
  // Widened the verse/chorus gap: holding a couple of layers back in the
  // verse is what makes the chorus feel like it opens up.
  if (type === "verse") return 0.62;
  if (type === "chorus") return 1;
  if (type === "bridge") return pos < len / 2 ? 0.25 : 0.55;
  if (type === "outro") return 0.85 - 0.65 * (pos / span);
  return 0.7;
}

function totalSongBars(style) {
  return (style ? sectionsForStyle(style) : SONG_SECTIONS).reduce((s, sec) => s + sec.bars, 0);
}

function generateSongVariationOnce(rawStyle) {
  const style = resolveGenerationStyle(rawStyle);
  const barMetas = expandSongSections(sectionsForStyle(style));
  const bars = barMetas.length;
  const totalSteps = bars * STEPS_PER_BAR;
  const customChords = rawStyle.customChords;
  let barRootDegrees, barChordContexts;
  if (customChords && customChords.length) {
    barRootDegrees = barMetas.map(() => 0);
    barChordContexts = buildBarContextsFromChords(customChords, bars);
  } else {
    barRootDegrees = barMetas.map((_, i) => style.progression[i % style.progression.length]);
  }
  const priorityList = priorityInstrumentList(style);
  const totalInstruments = priorityList.length;

  const drumVariant = barMetas.map((b) => (b.pos === b.len - 1 ? "fill" : "main"));

  // Section energy: a chorus should be audibly bigger than its verse -
  // measurement showed most genres lifting under 15%, and one where the
  // chorus was actually quieter. Choruses now fire more of the authored
  // optional hits and verses hold back, which is what a real arrangement
  // does on top of simply switching layers in and out.
  const sectionDensity = { intro: -0.12, verse: -0.08, chorus: 0.28, bridge: -0.14, outro: -0.1 };
  const drumBars = barMetas.map((b, i) => buildDrumBar(style, drumVariant[i], sectionDensity[b.type] || 0));
  const chordVariety = pickChordVariety(style);
  const voiceState = {};
  const chordBars = barMetas.map((_, i) => buildChordBar(style, drumVariant[i], barRootDegrees[i], chordVariety, voiceState));

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
  const registerPlan = planRegisterJitters(style.melodic.monoInstruments);
  for (const inst of style.melodic.monoInstruments) {
    const melody = generateMonoMelody(REGISTER[inst], [], barRootDegrees, style.melody[inst], totalSteps, registerPlan[inst], inst === "bass");
    applyChorusHook(melody, inst, style, barMetas, barRootDegrees);
    for (let i = 0; i < bars; i++) {
      if (activeSets[i].has(inst)) continue;
      const start = i * STEPS_PER_BAR;
      for (let s = start; s < start + STEPS_PER_BAR; s++) melody[s] = null;
    }
    instruments[inst] = melody;
  }
  declutterMonoCollisions(instruments, style.melodic.monoInstruments);

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

  // PRE-CHORUS DROP-OUT. One beat of near-silence immediately before the
  // chorus makes the return feel far bigger than it measures - the
  // cheapest and most reliable arrangement trick there is. Everything
  // cuts for the last beat of the bar before each chorus, leaving only
  // whatever riser is building underneath.
  for (let i = 1; i < bars; i++) {
    if (barMetas[i].type !== "chorus" || barMetas[i].pos !== 0) continue;
    const cutStart = (i - 1) * STEPS_PER_BAR + 12;
    for (const inst of Object.keys(instruments)) {
      if (inst === "fx") continue;
      for (let st = cutStart; st < i * STEPS_PER_BAR; st++) {
        instruments[inst][st] = DRUMS_SET.has(inst) ? false : null;
      }
    }
  }

  const structure = barMetas.map((b) => b.label);
  const automation = generateAutomation(style, barMetas);

  // FILTER SWEEPS. In club genres a resonant lowpass opening across a
  // section does the work that adding instruments does elsewhere - it is
  // the primary arrangement device, not an effect. Curves are shaped per
  // section: closed and rising through intros and builds, wide open in
  // choruses, pulled back for the bridge.
  const filterAutomation = {};
  if (FILTER_SWEEP_GENRES.has(style.id)) {
    const targets = [...(style.melodic.chordInstruments || []), ...(style.melodic.monoInstruments || [])]
      .filter((i) => i !== "bass");
    for (const inst of targets) {
      const pts = [];
      let last = null;
      barMetas.forEach((b, i) => {
        const span = Math.max(b.len - 1, 1);
        let v;
        if (b.type === "intro") v = 0.25 + 0.5 * (b.pos / span);
        else if (b.type === "verse") v = 0.55 + 0.3 * (b.pos / span);
        else if (b.type === "chorus") v = 1;
        else if (b.type === "bridge") v = 0.3 + 0.35 * (b.pos / span);
        else v = 0.75 - 0.5 * (b.pos / span);
        if (last === null || Math.abs(v - last) > 0.04 || i === barMetas.length - 1) {
          pts.push({ step: i * STEPS_PER_BAR, value: Math.max(0, Math.min(1, v)) });
          last = v;
        }
      });
      filterAutomation[inst] = pts;
    }
  }

  // The same mix hierarchy loop mode uses - one clear featured melodic
  // voice with the rest sitting behind it - applied on top of the
  // arrangement curves instead of being overwritten by them, since a
  // full song is exactly where an intentional lead matters most.
  const supporting = style.melodic.monoInstruments.filter((i) => i !== "bass");
  if (supporting.length > 1) {
    const feature = supporting[Math.floor(Math.random() * supporting.length)];
    for (const inst of supporting) {
      if (inst === feature) continue;
      if (automation[inst]) automation[inst] = automation[inst].map((pt) => ({ ...pt, value: pt.value * 0.78 }));
      else automation[inst] = [{ step: 0, value: 0.78 }];
    }
  }
  return { instruments, structure, barRootDegrees, automation, filterAutomation };
}

// ---- Intentionality: compose several candidates, keep the best one ----
// Generating one random pattern and shipping it means the program never
// actually *tries* to make a good beat - it just accepts whatever the
// dice produced. Real producers write several versions of an idea and
// keep the one that works. This does the same thing: each request
// composes a handful of complete candidate beats, judges each one
// against criteria drawn from how music is actually evaluated, and
// returns the strongest. Everything scored here is a real musical
// property, not a proxy for novelty.

function isChordTone(relDegree) {
  const r = ((relDegree % 7) + 7) % 7;
  return r === 0 || r === 2 || r === 4;
}

function scoreVariation(style, v) {
  const inst = v.instruments;
  const bars = v.structure.length;
  const mono = style.melodic.monoInstruments || [];
  const chordal = style.melodic.chordInstruments || [];
  let score = 0;

  // 1. HARMONIC COHERENCE - the single most important criterion. A note
  // sounding on a strong beat should belong to the chord underneath it;
  // dissonance on a weak beat is passing colour, dissonance on a
  // downbeat is a wrong note. Weighted so on-beat consonance dominates.
  let strongTotal = 0, strongConsonant = 0, weakTotal = 0, weakConsonant = 0;
  for (const i of mono) {
    const arr = inst[i] || [];
    for (let s2 = 0; s2 < arr.length; s2++) {
      const n = arr[s2];
      if (!n) continue;
      const bar = Math.floor(s2 / STEPS_PER_BAR);
      const rel = n.degree - (v.barRootDegrees[bar] || 0);
      const strong = s2 % 4 === 0;
      if (strong) { strongTotal++; if (isChordTone(rel)) strongConsonant++; }
      else { weakTotal++; if (isChordTone(rel)) weakConsonant++; }
    }
  }
  if (strongTotal) score += 34 * (strongConsonant / strongTotal);
  // Weak beats want *some* colour - all-chord-tone melodies are bland,
  // so the ideal sits near 65% rather than at 100%.
  if (weakTotal) score += 10 * (1 - Math.abs(weakConsonant / weakTotal - 0.65) / 0.65);

  // 2. BASS ANCHORS THE HARMONY. The bass note under a bar's downbeat
  // should be that chord's root - that is what makes a progression read
  // as the progression rather than as vague noise.
  if (inst.bass) {
    let downbeats = 0, onRoot = 0;
    for (let b = 0; b < bars; b++) {
      const n = inst.bass[b * STEPS_PER_BAR];
      if (!n) continue;
      downbeats++;
      if (((n.degree - (v.barRootDegrees[b] || 0)) % 7 + 7) % 7 === 0) onRoot++;
    }
    if (downbeats) score += 14 * (onRoot / downbeats);
    score += 6 * Math.min(1, downbeats / bars);
  }

  // 3. REGISTER SEPARATION. Two melodic voices occupying the same octave
  // fight each other; an arranger spreads them apart.
  const leads = mono.filter((i) => i !== "bass");
  if (leads.length > 1) {
    const means = leads.map((i) => {
      const ns = (inst[i] || []).filter(Boolean);
      return ns.length ? ns.reduce((a, n) => a + n.degree, 0) / ns.length : null;
    }).filter((x) => x !== null);
    if (means.length > 1) {
      let minGap = Infinity;
      for (let a = 0; a < means.length; a++)
        for (let b = a + 1; b < means.length; b++)
          minGap = Math.min(minGap, Math.abs(means[a] - means[b]));
      score += 8 * Math.min(1, minGap / 4);
    }
  }

  // 4. THE PARTS SHOULD INTERLOCK, NOT COLLIDE. Melodic voices landing on
  // the same step constantly is clutter; never overlapping at all is
  // incoherent. A modest overlap is what real ensemble playing produces.
  if (leads.length > 1) {
    const a = inst[leads[0]] || [], b = inst[leads[1]] || [];
    let both = 0, either = 0;
    for (let i = 0; i < a.length; i++) {
      const x = !!a[i], y = !!b[i];
      if (x || y) either++;
      if (x && y) both++;
    }
    if (either) score += 8 * (1 - Math.abs(both / either - 0.2) / 0.8);
  }

  // 5. DENSITY SWEET SPOT. Wall-to-wall onsets exhaust the ear; an empty
  // grid is not a beat. Target a moderate fill with real space in it.
  let onsets = 0, slots = 0;
  for (const k of Object.keys(inst)) {
    for (const x of inst[k]) { slots++; if (x) onsets++; }
  }
  if (slots) {
    const fill = onsets / slots;
    score += 10 * Math.max(0, 1 - Math.abs(fill - 0.22) / 0.22);
  }

  // 6. SINGABLE RANGE + 7. CONTOUR. A hook stays inside about an octave
  // and moves mostly by step, leaping only occasionally.
  for (const i of leads) {
    const ns = (inst[i] || []).filter(Boolean).map((n) => n.degree);
    if (ns.length < 3) continue;
    const span = Math.max(...ns) - Math.min(...ns);
    score += 6 * Math.max(0, 1 - Math.abs(span - 7) / 9);
    let steps = 0, leapsBig = 0;
    for (let k = 1; k < ns.length; k++) {
      const d = Math.abs(ns[k] - ns[k - 1]);
      if (d > 0 && d <= 2) steps++;
      if (d >= 5) leapsBig++;
    }
    score += 6 * (steps / Math.max(1, ns.length - 1));
    score -= 5 * (leapsBig / Math.max(1, ns.length - 1));
  }

  // 8. THE HOOK SHOULD RECUR. A figure the ear can recognise on its
  // return is the difference between a hook and noodling.
  if (bars >= 3) {
    for (const i of leads.slice(0, 1)) {
      const arr = inst[i] || [];
      let same = 0;
      for (let k = 0; k < STEPS_PER_BAR; k++) {
        if (!!arr[STEPS_PER_BAR + k] === !!arr[3 * STEPS_PER_BAR + k]) same++;
      }
      score += 6 * (same / STEPS_PER_BAR);
    }
  }

  // 9. CHORDS SHOULD ACTUALLY SOUND. A chordal instrument that rolled
  // its way into near-silence leaves the harmony unstated.
  for (const i of chordal) {
    const c = (inst[i] || []).filter(Boolean).length;
    if (c > 0) score += 2;
  }

  return score;
}

// Candidate counts are tuned so selection is meaningful without making
// "Generate" feel slow - a full beat is only array math, so this stays
// well inside a single frame.
function generateVariation(rawStyle, bars) {
  let best = null, bestScore = -Infinity;
  for (let i = 0; i < 9; i++) {
    const cand = generateVariationOnce(rawStyle, bars);
    const sc = scoreVariation(rawStyle, cand);
    if (sc > bestScore) { bestScore = sc; best = cand; }
  }
  return best;
}

function generateSongVariation(rawStyle) {
  let best = null, bestScore = -Infinity;
  for (let i = 0; i < 5; i++) {
    const cand = generateSongVariationOnce(rawStyle);
    const sc = scoreVariation(rawStyle, cand);
    if (sc > bestScore) { bestScore = sc; best = cand; }
  }
  return best;
}
