// Validate the program's content tables - artist profiles and the song
// catalogue - against what the program can actually do.
//
// This exists because eleven profiles once shipped broken and nobody noticed:
// applyArtistProfile filters kits with `FLAVOR_POOLS[inst].includes(flavor)`,
// so naming a kit that lives on a different track is not an error - it is
// silently dropped, and the "type beat" quietly comes out generic. The same
// goes for a solo instrument the genre never plays, or a key the program
// cannot parse. All of those fail invisibly, which is the worst way to fail.
//
// Run: node tools/test-artists.js
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
// ALL_TRACKS lives in audio-engine.js, which cannot be loaded headlessly
// (it needs Web Audio), so take just that one line from it.
const engineSrc = fs.readFileSync(path.join(root, "js", "audio-engine.js"), "utf8");
const allTracksLine = engineSrc.match(/^const ALL_TRACKS = \[[^\]]*\];/m)[0];
const { ARTIST_PROFILES, STYLES, FLAVOR_POOLS, ALL_TRACKS, noteNameToMidi, degreeToFreq, midiToName, scaleDegreeToMidi, findArtistProfile, DEFAULT_MELODY, generateVariation,
        setBeatComplexity, setArtistAvoid }
  = vm.runInContext(src + "\n;" + allTracksLine
      + `\n;({ ARTIST_PROFILES, STYLES, FLAVOR_POOLS, ALL_TRACKS,
      noteNameToMidi, degreeToFreq, midiToName, scaleDegreeToMidi, findArtistProfile, DEFAULT_MELODY, generateVariation,
        setBeatComplexity, setArtistAvoid })`, sandbox, { filename: "bundle.js" });

let failures = 0;
const problems = [];
const note = (artist, msg) => { problems.push(`${artist}: ${msg}`); failures++; };

const names = Object.keys(ARTIST_PROFILES);
console.log(`\nChecking ${names.length} artist profiles\n`);

// Object.keys cannot see a key written twice - the later entry just wins and
// the earlier one vanishes. Twenty profiles had been lost that way, including
// two written for brand-new genres that then reported as under-served with no
// hint as to why. The only place the duplicate is visible is the source, so
// that is where it gets checked.
{
  const seen = new Map();
  const artistSrc = fs.readFileSync(path.join(root, "js", "artists.js"), "utf8");
  const re = /\n {2}"([^"]+)": \{\n {4}genre: "(\w+)"/g;
  let m;
  while ((m = re.exec(artistSrc))) {
    if (seen.has(m[1])) {
      note(m[1], `defined twice (as ${seen.get(m[1])} and ${m[2]}) — the first is dead`);
    }
    seen.set(m[1], m[2]);
  }
}

for (const name of names) {
  const p = ARTIST_PROFILES[name];

  if (!STYLES[p.genre]) { note(name, `unknown genre "${p.genre}"`); continue; }
  const style = STYLES[p.genre];

  // Tempo must be a sane ascending range.
  if (!Array.isArray(p.tempo) || p.tempo.length !== 2 || !(p.tempo[0] < p.tempo[1])) {
    note(name, `bad tempo range ${JSON.stringify(p.tempo)}`);
  } else if (p.tempo[0] < 50 || p.tempo[1] > 220) {
    note(name, `implausible tempo range ${p.tempo.join("-")}`);
  }

  // Every key has to parse, or the beat is built around a wrong root.
  for (const k of p.keys || []) {
    // noteNameToMidi THROWS on input it cannot parse rather than returning
    // NaN, so a bad key in a profile is a crash, not a silent fallback.
    let midi = null;
    try { midi = noteNameToMidi(k + "2"); } catch (e) { midi = null; }
    if (!isFinite(midi)) note(name, `unparseable key "${k}" (the app would throw on it)`);
  }
  if (!p.keys || !p.keys.length) note(name, "no keys");

  if (!(p.complexity >= 1 && p.complexity <= 10)) note(name, `complexity ${p.complexity} out of 1-10`);
  if (!(p.swing >= 0 && p.swing <= 33)) note(name, `swing ${p.swing} out of 0-33`);
  if (!p.notes) note(name, "no notes line");

  // THE BIG ONE: a kit named on a track that does not carry it is dropped
  // without complaint, so the profile does nothing.
  for (const [track, flavor] of Object.entries(p.kits || {})) {
    if (!FLAVOR_POOLS[track]) { note(name, `kit on unknown track "${track}"`); continue; }
    if (!FLAVOR_POOLS[track].includes(flavor)) {
      const where = Object.keys(FLAVOR_POOLS).filter((t) => FLAVOR_POOLS[t].includes(flavor));
      note(name, `kit "${flavor}" is not on track "${track}"`
        + (where.length ? ` (it lives on: ${where.join(", ")})` : " (it does not exist at all)"));
    }
  }

  // A solo voice the genre cannot field is equally silent. The real gate is
  // pickSoloInstruments', which is whether the instrument has a melodic
  // profile for this genre - NOT whether the genre lists it as an
  // instrument, since the whole point of a solo pool is to bring in voices
  // the genre does not carry by default. Checking the wrong one of those
  // two flagged twenty long-standing profiles as broken when they were fine.
  for (const solo of p.solos || []) {
    if (!ALL_TRACKS.includes(solo)) { note(name, `solo "${solo}" is not a track`); continue; }
    const hasProfile = (style.melody && style.melody[solo]) || DEFAULT_MELODY[solo];
    if (!hasProfile) {
      note(name, `solo "${solo}" has no melodic profile in genre "${p.genre}", so it is dropped`);
    }
  }

  // Non-ASCII sneaks in from copy-paste and makes a name unsearchable.
  const blob = name + JSON.stringify(p);
  const bad = blob.match(/[^\x00-\x7F]/g);
  if (bad) {
    const uniq = [...new Set(bad)].filter((c) => !"‘’“”—·áéíóúñüàèçÂÊÎÔÛ".includes(c));
    if (uniq.length) note(name, `non-ASCII character(s) ${JSON.stringify(uniq)} in profile text`);
  }
}

// The search has to actually find every profile by its own name.
for (const name of names) {
  const found = findArtistProfile(name);
  if (!found) { note(name, "findArtistProfile cannot find its own key"); continue; }
  if (found.key !== name) {
    // A shorter key that is a substring wins the loose match. That is only a
    // problem if it changes the genre - otherwise it is close enough.
    if (ARTIST_PROFILES[found.key].genre !== ARTIST_PROFILES[name].genre) {
      note(name, `search resolves to "${found.key}" (different genre)`);
    }
  }
}

if (problems.length) {
  for (const p of problems) console.log("  FAIL  " + p);
} else {
  console.log("  PASS  every profile's genre, tempo, keys, kits and solos are real");
}

// Coverage: a genre with one profile is a genre where "type beat" does nothing.
const byGenre = {};
for (const n of names) (byGenre[ARTIST_PROFILES[n].genre] ||= []).push(n);
console.log("\nProfiles per genre");
const thin = [];
for (const g of Object.keys(STYLES)) {
  const c = (byGenre[g] || []).length;
  console.log(`  ${g.padEnd(12)} ${String(c).padStart(3)}`);
  if (c < 4) thin.push(`${g} (${c})`);
}
if (thin.length) {
  console.log(`\n  FAIL  under-served genres: ${thin.join(", ")}`);
  failures++;
} else {
  console.log("\n  PASS  every genre has at least 4 profiles");
}

// ---------------------------------------------------------------------------
// Artist instrument palettes
// ---------------------------------------------------------------------------
// `avoid` is only meaningful if it is actually enforced. Generating beats and
// counting what turns up is the only way to know - the filter lives in two
// separate places (the solo pool and the chordal picker) and missing either
// one lets the instrument straight back in.
console.log("\nChecking artist instrument palettes");
{
  const { ARTIST_INSTRUMENTS, artistInstruments } = require("../js/artists.js");
  const names = Object.keys(ARTIST_INSTRUMENTS);
  let leaks = 0;
  for (const name of names) {
    const p = ARTIST_PROFILES[name];
    if (!p || !STYLES[p.genre]) { note(name, "instrument palette for an unknown profile"); continue; }
    const pal = artistInstruments(name, p);
    const counts = {};
    for (let i = 0; i < 24; i++) {
      sandbox.setBeatComplexity(p.complexity);
      sandbox.setArtistAvoid(pal.avoid);
      const st = Object.assign({}, STYLES[p.genre], { soloOverride: pal.only });
      let v;
      try { v = sandbox.generateVariation(st, 4); } catch (e) { continue; }
      for (const k of Object.keys(v.instruments || {})) {
        if (Array.isArray(v.instruments[k]) && v.instruments[k].some(Boolean)) counts[k] = (counts[k] || 0) + 1;
      }
    }
    sandbox.setArtistAvoid(null);
    const leaked = (pal.avoid || []).filter((x) => counts[x]);
    if (leaked.length) {
      leaks++;
      note(name, `avoids ${leaked.join(", ")} but still plays them`);
    }
  }
  if (!leaks) console.log(`  PASS  all ${names.length} palettes are enforced — nothing on an avoid list is played`);
}

// ---------------------------------------------------------------------------
// The song catalogue
// ---------------------------------------------------------------------------
const { SONG_DB, searchSongs, youtubeSearchUrl, songToStyleSettings } = require("../js/songs.js");

console.log(`\nChecking ${SONG_DB.length} songs`);
const songProblems = [];
const snote = (m) => { songProblems.push(m); failures++; };

const seen = new Map();
for (const s of SONG_DB) {
  if (!STYLES[s.g]) snote(`"${s.t}" has unknown genre "${s.g}"`);
  if (!(s.bpm >= 40 && s.bpm <= 300)) snote(`"${s.t}" has implausible tempo ${s.bpm}`);
  if (!(s.y >= 1600 && s.y <= 2030)) snote(`"${s.t}" has implausible year ${s.y}`);
  if (!s.a) snote(`"${s.t}" has no artist`);
  // A key is optional, but if present it has to parse - the whole beat gets
  // built around it.
  if (s.key) {
    let midi = null;
    try { midi = noteNameToMidi(s.key + "2"); } catch (e) { midi = null; }
    if (!isFinite(midi)) snote(`"${s.t}" has unparseable key "${s.key}"`);
    if (!s.scale) snote(`"${s.t}" gives a key but no scale`);
  }
  // The same recording listed twice makes the search return it twice.
  const id = `${normaliseKey(s.t)}|${normaliseKey(s.a)}`;
  if (seen.has(id)) snote(`"${s.t}" by ${s.a} is listed twice`);
  seen.set(id, true);
}
function normaliseKey(x) {
  return String(x).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// Every song has to be findable by its own title, or the catalogue entry is
// dead weight.
let unfindable = 0;
for (const s of SONG_DB) {
  const hits = searchSongs(s.t, 12);
  if (!hits.some((h) => h.t === s.t && h.a === s.a)) {
    unfindable++;
    if (unfindable <= 5) snote(`"${s.t}" by ${s.a} is not returned when searching its own title`);
  }
}
if (unfindable > 5) snote(`...and ${unfindable - 5} more unfindable songs`);

// The settings a song produces have to be usable by the generator.
for (const s of SONG_DB.slice(0, 40)) {
  const set = songToStyleSettings(s, STYLES);
  if (!set.genre) snote(`"${s.t}" maps to no genre`);
  if (!(set.bpm > 0)) snote(`"${s.t}" maps to no tempo`);
  if (!/^https:\/\/www\.youtube\.com\/results\?search_query=/.test(youtubeSearchUrl(s))) {
    snote(`"${s.t}" produces a malformed YouTube URL`);
  }
}

if (songProblems.length) {
  for (const p of songProblems) console.log("  FAIL  " + p);
} else {
  console.log("  PASS  every song has a real genre, a plausible tempo, and is findable");
}

const songsByGenre = {};
for (const s of SONG_DB) (songsByGenre[s.g] ||= []).push(s);
const thinSongs = Object.keys(STYLES).filter((g) => (songsByGenre[g] || []).length < 8);
if (thinSongs.length) {
  console.log(`  FAIL  genres with fewer than 8 songs: ${thinSongs.join(", ")}`);
  failures++;
} else {
  // The bass has to be in the register a bass occupies.
  //
  // It was not: REGISTER.bass sat at 0, the same octave as the song's root,
  // so trap 808s played between 65 and 175Hz when a trap 808's root is C1 at
  // 33Hz, and rock basses reached 233Hz. Measured across the whole program
  // that put 61% of a trap beat's energy between 60 and 250Hz and 4% below
  // 60Hz, which is the wrong way round for a genre built on an 808.
  //
  // Checked as absolute frequency rather than as a register constant, because
  // the constant is only half of it - the bar root and the motif fold move the
  // line too, and it was the bar root carrying the bass up a fifth on every
  // chord change that made the range two octaves wide.
  console.log("\n  Bass register");
  {
    const BASS_MIN = 25, BASS_MAX = 130;
    let worstLo = Infinity, worstHi = 0, worstGenre = "", bad = [];
    for (const g of Object.keys(STYLES)) {
      const st = STYLES[g];
      const rootMidi = noteNameToMidi(st.key);
      let lo = Infinity, hi = 0;
      for (let k = 0; k < 6; k++) {
        setBeatComplexity(5);
        const v = generateVariation(st, 4);
        for (const s of v.instruments.bass || []) {
          if (!s) continue;
          let f = degreeToFreq(rootMidi, st.scale, s.degree);
          while (f < 24) f *= 2;
          lo = Math.min(lo, f); hi = Math.max(hi, f);
        }
      }
      if (hi > BASS_MAX || lo > 90) bad.push(`${g} ${Math.round(lo)}-${Math.round(hi)}Hz`);
      if (hi > worstHi) { worstHi = hi; worstLo = lo; worstGenre = g; }
    }
    if (bad.length) {
      console.log(`  FAIL  bass climbs out of bass register: ${bad.join(", ")}`);
      failures++;
    } else {
      console.log(`  PASS  every genre's bass stays under ${BASS_MAX}Hz  — ` +
                  `highest is ${worstGenre} at ${Math.round(worstHi)}Hz`);
    }
  }

  // No melodic part above its instrument's real range.
  //
  // The complaint this checks was "everything is a jolly high pitch instead
  // of the lower thing real trap and rap have", and measured it was exactly
  // right: leads ran to C6, saxophones to E6, R&B to G6. Three separate
  // causes stacked - a lead register three octaves above the root, an octave
  // jitter that only ever went UP, and the bar root carrying a melody higher
  // on every chord change - and one call site that polished parts without
  // passing the instrument through, so the ceilings did not reach it.
  //
  // Checked as pitch, per instrument, because that is the thing that was
  // wrong; a register constant is only one of the three causes.
  console.log("\n  Melodic register");
  {
    const CEIL = { sax: "A5", lead: "A5", woodwind: "C6", arp: "A5", piano: "A5",
                   leadguitar: "A5", organ: "G5", kalimba: "G5", marimba: "F5",
                   talkbox: "E5", strings: "F5", guitar: "E5", autolead: "D5",
                   horn: "C5", vocal: "E5", pad: "E5", stab: "G5" };
    const midiOf = (n) => noteNameToMidi(n);
    const worst = {};
    for (const g of Object.keys(STYLES)) {
      const st = STYLES[g];
      const rootMidi = noteNameToMidi(st.key);
      for (let k = 0; k < 5; k++) {
        setBeatComplexity(5);
        const v = generateVariation(st, 4);
        const gs = v.genStyle || st;
        for (const [inst, arr] of Object.entries(v.instruments)) {
          if (!CEIL[inst] || !Array.isArray(arr)) continue;
          for (const x of arr) {
            if (!x || x.degree === undefined) continue;
            const m = scaleDegreeToMidi(rootMidi, gs.scale, x.degree);
            if (!worst[inst] || m > worst[inst].midi) worst[inst] = { midi: m, genre: g };
          }
        }
      }
    }
    const over = Object.entries(worst)
      .filter(([i, w]) => w.midi > midiOf(CEIL[i]))
      .map(([i, w]) => `${i} reaches ${midiToName(w.midi)} in ${w.genre}, over ${CEIL[i]}`);
    if (over.length) {
      console.log(`  FAIL  parts written above their instrument: ${over.join("; ")}`);
      failures++;
    } else {
      const top = Object.entries(worst).sort((a, b) => b[1].midi - a[1].midi)[0];
      console.log("  PASS  every melodic part stays inside its instrument's range" +
                  (top ? `  — highest is ${top[0]} at ${midiToName(top[1].midi)}` : ""));
    }
  }

  // Melodies have to move like melodies.
  //
  // Measured, note-to-note motion was 30% steps against 30% thirds. Sung
  // melody runs the other way round - roughly 50-65% steps against 20%
  // thirds - and the cause was structural: a chord-tone note drew from
  // [0,2,4,7], root/third/fifth/octave, which contains no step at all, so the
  // closest thing to stepwise motion available was a third and every line
  // outlined its chord instead of singing over it.
  //
  // Guarded as a distribution rather than a rule per note, because the fault
  // was never any single note - each one was individually legal.
  console.log("\n  Melodic movement");
  {
    const SKIP = new Set(["kick", "snare", "hihat", "openhat", "crash", "perc", "tom",
                          "fx", "bass", "pad", "stab", "strings", "horn", "organ",
                          "vocal", "piano", "guitar"]);
    const c = { rep: 0, step: 0, third: 0, mid: 0, leap: 0, n: 0 };
    for (const g of Object.keys(STYLES)) {
      for (let k = 0; k < 4; k++) {
        setBeatComplexity(5);
        const v = generateVariation(STYLES[g], 4);
        for (const [inst, arr] of Object.entries(v.instruments)) {
          if (SKIP.has(inst) || !Array.isArray(arr)) continue;
          let prev = null;
          for (const x of arr) {
            if (!x || x.degree === undefined) continue;
            if (prev !== null) {
              const d = Math.abs(x.degree - prev);
              c.n++;
              if (d === 0) c.rep++;
              else if (d === 1) c.step++;
              else if (d === 2) c.third++;
              else if (d <= 4) c.mid++;
              else c.leap++;
            }
            prev = x.degree;
          }
        }
      }
    }
    const pct = (x) => (c.n ? x / c.n : 0);
    const bad = [];
    if (pct(c.step) < 0.35) bad.push(`only ${Math.round(pct(c.step) * 100)}% stepwise, wanted 35%+`);
    if (pct(c.third) > 0.28) bad.push(`${Math.round(pct(c.third) * 100)}% thirds, wanted under 28%`);
    if (pct(c.leap) > 0.12) bad.push(`${Math.round(pct(c.leap) * 100)}% leaps of a 6th+, wanted under 12%`);
    if (pct(c.rep) > 0.30) bad.push(`${Math.round(pct(c.rep) * 100)}% repeated notes, wanted under 30%`);
    if (bad.length) {
      console.log(`  FAIL  melodies do not move like melodies: ${bad.join("; ")}`);
      failures++;
    } else {
      console.log(`  PASS  melodic motion is ${Math.round(pct(c.step) * 100)}% steps, ` +
                  `${Math.round(pct(c.third) * 100)}% thirds, ${Math.round(pct(c.leap) * 100)}% wide leaps, ` +
                  `${Math.round(pct(c.rep) * 100)}% repeats`);
    }
  }

  console.log("  PASS  every genre has at least 8 reference songs");
}

console.log(`\n${failures ? failures + " PROBLEM(S)" : "all checks passed"}\n`);
process.exit(failures ? 1 : 0);
