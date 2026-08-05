// Does the theory engine actually do what it claims?
//
// Every item below is something the program has code for. Having code for a
// thing is not the same as the thing working - this project has found six
// separate cases where a feature existed, ran, and did nothing, or did the
// opposite of what its name said. A saxophone kit that was a bell. A
// distortion that was a sine. A velocity check that read a field which does
// not exist. So each claim here is measured against generated output rather
// than confirmed by reading the source.
//
// Run: node tools/audit-theory.js [runs]
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const FILES = ["js/theory.js", "js/instruments.js", "js/performance.js", "js/learning.js",
               "js/policy.js", "js/audio-analysis.js", "js/artists.js", "js/midi-export.js",
               "js/production.js", "js/patterns.js"];
const src = FILES.map((f) => fs.readFileSync(path.join(root, f), "utf8")).join("\n;\n");
const sandbox = { module: { exports: {} }, console, JSON };
vm.createContext(sandbox);
const api = vm.runInContext(src + `\n;({ STYLES, SCALES, generateVariation, generateSongVariation,
  setBeatComplexity, setFlavorsForValidation, noteNameToMidi, midiToName, scaleDegreeToMidi,
  degreeToFreq, GENRE_MODES, isPentatonicDegree, setCharacter, withSeed })`,
  sandbox, { filename: "bundle.js" });

const RUNS = Number(process.argv[2] || 6);
let failures = 0;
const check = (name, ok, detail) => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!ok) failures++;
};
const pct = (x) => `${Math.round(x * 100)}%`;

// Collect a corpus once; every check below reads from it.
const corpus = [];
api.setCharacter(null);
for (const g of Object.keys(api.STYLES)) {
  const style = api.STYLES[g];
  api.setFlavorsForValidation(style.defaultFlavors);
  for (let i = 0; i < RUNS; i++) {
    api.setBeatComplexity(4 + (i % 5));
    let v;
    try { v = api.generateVariation(style, 4); } catch (e) { continue; }
    corpus.push({ g, style, v, gs: v.genStyle || style, rootMidi: api.noteNameToMidi(style.key) });
  }
}
console.log(`\nAudited ${corpus.length} beats across ${Object.keys(api.STYLES).length} genres.\n`);

// ---------------------------------------------------------------------------
console.log("Harmony");
// ---------------------------------------------------------------------------

// 1. Voice leading. The claim is that chord voicings move as little as
// possible between changes - common tones held, the rest stepping. Measured
// as the average semitone distance the lowest voice travels between chords: a
// voice-led progression averages a few semitones, one that simply rebuilds
// each chord from its root averages far more.
{
  let sum = 0, n = 0, worst = 0;
  for (const { v, gs, rootMidi } of corpus) {
    for (const inst of ["piano", "pad", "strings", "organ", "stab", "horn", "guitar"]) {
      const arr = v.instruments[inst];
      if (!Array.isArray(arr)) continue;
      let prev = null;
      for (const step of arr) {
        if (!step || !step.degrees || !step.degrees.length) continue;
        const low = api.scaleDegreeToMidi(rootMidi, gs.scale, step.degrees[0]);
        if (prev !== null) { const d = Math.abs(low - prev); sum += d; n++; if (d > worst) worst = d; }
        prev = low;
      }
    }
  }
  const avg = n ? sum / n : 0;
  check("chord voicings are voice-led, not rebuilt each time",
    n > 0 && avg <= 4.5, `lowest voice moves ${avg.toFixed(2)} semitones on average (${n} changes)`);
}

// 2. Harmonic rhythm. Chords should change on a musical boundary and hold -
// a progression that changes every beat is not a progression, it is a run.
{
  let held = 0, total = 0;
  for (const { v } of corpus) {
    const roots = v.barRootDegrees || [];
    for (let i = 1; i < roots.length; i++) { total++; if (roots[i] !== roots[i - 1]) held++; }
  }
  const changeRate = total ? held / total : 0;
  // Below 1.0 because a chord has to be HELD sometimes. At 0.97 - which is
  // what this measured before harmonic rhythm existed - the progression is
  // just being indexed by bar number, which is a cycle rather than a
  // progression and one of the clearest tells of a generated beat.
  check("chords are held, not cycled every bar",
    changeRate <= 0.85 && changeRate >= 0.25,
    `the root changes on ${pct(changeRate)} of bar boundaries`);
}

// 3. Progressions resolve. Over a corpus, a tonal progression should return
// to the tonic far more often than chance, and should reach the tonic from
// the dominant or subdominant rather than arriving at random.
{
  let endsTonic = 0, total = 0, cadences = 0;
  for (const { v } of corpus) {
    const r = v.barRootDegrees || [];
    if (r.length < 2) continue;
    total++;
    if (r[r.length - 1] === 0 || r[0] === 0) endsTonic++;
    for (let i = 1; i < r.length; i++) {
      // V-i and iv-i are the two authentic-cadence shapes in a minor key;
      // bVII-i is the modal one every one of these genres actually uses.
      if (r[i] === 0 && (r[i - 1] === 4 || r[i - 1] === 3 || r[i - 1] === 6)) cadences++;
    }
  }
  check("progressions are anchored to the tonic",
    total > 0 && endsTonic / total > 0.8, `${pct(endsTonic / total)} start or end on i`);
  check("cadential motion into the tonic exists",
    cadences > 0, `${cadences} V-i / iv-i / bVII-i movements across the corpus`);
}

// 4. Chord extensions. The genres that are supposed to be extended (neo-soul,
// R&B, lo-fi, house, jazz-adjacent) should be voicing more than triads.
{
  const rich = ["neosoul", "rnb", "lofi", "house", "amapiano", "ukgarage"];
  let big = 0, n = 0;
  for (const { g, v } of corpus) {
    if (!rich.includes(g)) continue;
    for (const inst of ["piano", "pad", "strings", "organ"]) {
      for (const step of v.instruments[inst] || []) {
        if (!step || !step.degrees) continue;
        n++;
        if (step.degrees.length >= 4) big++;
      }
    }
  }
  check("the extended-harmony genres voice 7ths and beyond",
    n > 0 && big / n > 0.25, `${pct(n ? big / n : 0)} of their chords have four or more notes`);
}

// ---------------------------------------------------------------------------
console.log("\nMelody");
// ---------------------------------------------------------------------------

// 5. Motif development. A phrase should be restated, not replaced - the same
// rhythmic shape appearing in more than one bar.
{
  let restated = 0, comparable = 0;
  for (const { v } of corpus) {
    const roots = v.barRootDegrees || [];
    if (roots.length < 2) continue;
    for (const [inst, arr] of Object.entries(v.instruments)) {
      if (!Array.isArray(arr) || !arr.some((x) => x && x.degree !== undefined)) continue;
      const per = arr.length / roots.length;
      const shape = (b) => arr.slice(b * per, (b + 1) * per).map((x) => (x ? 1 : 0)).join("");
      const bars = roots.map((_, b) => shape(b)).filter((x) => /1/.test(x));
      for (let i = 0; i < bars.length; i++) {
        for (let j = i + 1; j < bars.length; j++) {
          comparable++;
          let same = 0;
          for (let k = 0; k < bars[i].length; k++) if (bars[i][k] === bars[j][k]) same++;
          if (same / bars[i].length >= 0.75) restated++;
        }
      }
    }
  }
  check("motifs are restated across bars",
    comparable > 0 && restated / comparable > 0.35,
    `${pct(restated / comparable)} of bar pairs share a rhythmic shape`);
}

// 6. Phrase arc. A written melody has a high point somewhere other than its
// first or last note - it goes somewhere. A melody whose peak is always at
// one end is a ramp, not a phrase.
{
  let interior = 0, n = 0;
  for (const { v } of corpus) {
    for (const [inst, arr] of Object.entries(v.instruments)) {
      if (!Array.isArray(arr)) continue;
      const notes = arr.map((x, i) => (x && x.degree !== undefined ? { d: x.degree, i } : null))
        .filter(Boolean);
      if (notes.length < 5) continue;
      n++;
      let peak = 0;
      for (let k = 1; k < notes.length; k++) if (notes[k].d > notes[peak].d) peak = k;
      if (peak > 0 && peak < notes.length - 1) interior++;
    }
  }
  check("phrases have an interior high point",
    n > 0 && interior / n > 0.7, `${pct(interior / n)} of phrases peak away from their ends`);
}

// 7. Every note is in the scale it claims to be in. A note outside the mode
// is not colour here - the generator has no chromatic mechanism, so one would
// be a bug.
{
  let outside = 0, n = 0;
  for (const { v, gs } of corpus) {
    const len = (api.SCALES[gs.scale] || api.SCALES.minor).length;
    for (const [inst, arr] of Object.entries(v.instruments)) {
      if (!Array.isArray(arr)) continue;
      for (const x of arr) {
        if (!x || x.degree === undefined) continue;
        n++;
        if (!Number.isInteger(x.degree)) outside++;
      }
    }
  }
  check("every melodic note is a real scale degree", outside === 0,
    `${n} notes checked, ${outside} not integral scale degrees`);
}

// ---------------------------------------------------------------------------
console.log("\nRhythm");
// ---------------------------------------------------------------------------

// 8. The downbeat is anchored. Every one of these genres puts something on
// beat 1 - it is the thing the ear counts from.
{
  let anchored = 0, n = 0;
  for (const { v } of corpus) {
    n++;
    const k = v.instruments.kick || [];
    if (k[0]) anchored++;
  }
  check("beat 1 carries a kick", n > 0 && anchored / n > 0.85, `${pct(anchored / n)} of beats`);
}

// 9. Syncopation exists but does not take over. Measured as the share of
// drum onsets landing off the quarter-note grid.
{
  let off = 0, total = 0;
  for (const { v } of corpus) {
    for (const t of ["kick", "snare", "perc"]) {
      (v.instruments[t] || []).forEach((x, i) => {
        if (!x) return;
        total++;
        if (i % 4 !== 0) off++;
      });
    }
  }
  const r = total ? off / total : 0;
  check("drums are syncopated without losing the grid",
    r > 0.15 && r < 0.75, `${pct(r)} of kick/snare/perc onsets are off the quarter note`);
}

// 10. Hi-hats subdivide. A genre with no subdivision has no motion.
{
  let n = 0, dense = 0;
  for (const { v } of corpus) {
    const h = (v.instruments.hihat || []).filter(Boolean).length;
    n++;
    if (h >= 8) dense++;
  }
  check("hi-hats carry the subdivision", n > 0 && dense / n > 0.6,
    `${pct(dense / n)} of beats have 8+ hat onsets per 4 bars`);
}

// ---------------------------------------------------------------------------
console.log("\nBass");
// ---------------------------------------------------------------------------

// 11. The bass locks with the kick. In these genres the low end and the kick
// are supposed to agree, not fight.
{
  let together = 0, bassHits = 0;
  for (const { v } of corpus) {
    const b = v.instruments.bass || [], k = v.instruments.kick || [];
    for (let i = 0; i < b.length; i++) {
      if (!b[i]) continue;
      bassHits++;
      if (k[i] || k[i - 1] || k[i + 1]) together++;
    }
  }
  check("the bass locks with the kick",
    bassHits > 0 && together / bassHits > 0.35,
    `${pct(together / bassHits)} of bass notes land on or beside a kick`);
}

// 12. The bass stays in bass register - already guarded in test-content, but
// re-checked here as pitch so the two cannot drift apart.
{
  let hi = 0, worst = "";
  for (const { g, v, gs, rootMidi } of corpus) {
    for (const x of v.instruments.bass || []) {
      if (!x || x.degree === undefined) continue;
      let f = api.degreeToFreq(rootMidi, gs.scale, x.degree);
      while (f < 24) f *= 2;
      if (f > hi) { hi = f; worst = g; }
    }
  }
  check("the bass never leaves bass register", hi <= 130,
    `highest bass note anywhere is ${Math.round(hi)}Hz (${worst})`);
}

// ---------------------------------------------------------------------------
console.log("\nArrangement");
// ---------------------------------------------------------------------------

// 13. A full song has real sections that differ in density, not just in name.
{
  api.setBeatComplexity(6);
  let checked = 0, differ = 0, hasAll = 0;
  for (const g of ["trap", "house", "rnb", "rock"]) {
    const style = api.STYLES[g];
    api.setFlavorsForValidation(style.defaultFlavors);
    let v;
    try { v = api.generateSongVariation(style); } catch (e) { continue; }
    checked++;
    const labels = v.structure.map((x) => String(x).toLowerCase());
    if (labels.some((x) => /intro/.test(x)) && labels.some((x) => /verse/.test(x))
     && labels.some((x) => /chorus/.test(x)) && labels.some((x) => /bridge/.test(x))
     && labels.some((x) => /outro/.test(x))) hasAll++;
    // Density per section type, across every track.
    const per = {};
    const bars = v.structure.length;
    const stepsPerBar = (v.instruments.kick || []).length / bars;
    v.structure.forEach((label, b) => {
      const key = String(label).replace(/\s*\d+$/, "").toLowerCase();
      let onsets = 0;
      for (const arr of Object.values(v.instruments)) {
        if (!Array.isArray(arr)) continue;
        for (let i = b * stepsPerBar; i < (b + 1) * stepsPerBar; i++) if (arr[i]) onsets++;
      }
      (per[key] = per[key] || []).push(onsets);
    });
    const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
    const verse = per["verse"] ? mean(per["verse"]) : null;
    const chorus = per["chorus"] || per["final chorus"] ? mean((per["chorus"] || []).concat(per["final chorus"] || [])) : null;
    if (verse !== null && chorus !== null && chorus > verse) differ++;
  }
  check("a full song has intro, verse, chorus, bridge and outro",
    checked > 0 && hasAll === checked, `${hasAll} of ${checked} genres`);
  check("the chorus is denser than the verse",
    checked > 0 && differ === checked, `${differ} of ${checked} genres`);
}

// 14. Key modulation. The final-chorus lift is the oldest device in popular
// songwriting for making the last chorus feel bigger without adding an
// instrument. Checked for existing at all, and for landing only where it is a
// device rather than a mistake - modulating a verse is just a wrong key.
{
  api.setBeatComplexity(6);
  let lifted = 0, songs = 0, misplaced = 0;
  const style = api.STYLES.trap;
  api.setFlavorsForValidation(style.defaultFlavors);
  for (let i = 0; i < 24; i++) {
    let v;
    try { v = api.generateSongVariation(style); } catch (e) { continue; }
    songs++;
    const off = v.barKeyOffset || [];
    if (!off.some((x) => x > 0)) continue;
    lifted++;
    v.structure.forEach((label, b) => {
      if ((off[b] || 0) > 0 && !/final chorus|outro/i.test(String(label))) misplaced++;
    });
  }
  check("songs sometimes modulate for the final chorus",
    songs > 0 && lifted > 0 && lifted < songs,
    `${lifted} of ${songs} songs lift, and it is not every one`);
  check("a modulation only ever lands on the final chorus", misplaced === 0,
    `${misplaced} bars lifted outside the final chorus or outro`);
}

// ---------------------------------------------------------------------------
console.log("\nDeterminism");
// ---------------------------------------------------------------------------
{
  api.setBeatComplexity(5);
  const style = api.STYLES.trap;
  api.setFlavorsForValidation(style.defaultFlavors);
  const a = api.withSeed(31337, () => JSON.stringify(api.generateVariation(style, 4).instruments));
  const b = api.withSeed(31337, () => JSON.stringify(api.generateVariation(style, 4).instruments));
  const c = api.withSeed(31338, () => JSON.stringify(api.generateVariation(style, 4).instruments));
  check("the same seed reproduces the beat exactly", a === b);
  check("a different seed gives a different beat", a !== c);
  // And the seeded generator must not leak: an unseeded generation after a
  // seeded one has to be free again.
  const d = JSON.stringify(api.generateVariation(style, 4).instruments);
  const e = JSON.stringify(api.generateVariation(style, 4).instruments);
  check("seeding does not leak into later generations", d !== e);
}

console.log(`\n${failures ? failures + " FAILURE(S)" : "the theory engine does what it claims"}\n`);
process.exit(failures ? 1 : 0);
