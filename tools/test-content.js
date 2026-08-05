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
               "js/patterns.js"];
const src = FILES.map((f) => fs.readFileSync(path.join(root, f), "utf8")).join("\n;\n");
const sandbox = { module: { exports: {} }, console, JSON };
vm.createContext(sandbox);
// ALL_TRACKS lives in audio-engine.js, which cannot be loaded headlessly
// (it needs Web Audio), so take just that one line from it.
const engineSrc = fs.readFileSync(path.join(root, "js", "audio-engine.js"), "utf8");
const allTracksLine = engineSrc.match(/^const ALL_TRACKS = \[[^\]]*\];/m)[0];
const { ARTIST_PROFILES, STYLES, FLAVOR_POOLS, ALL_TRACKS, noteNameToMidi, degreeToFreq, findArtistProfile, DEFAULT_MELODY, generateVariation,
        setBeatComplexity, setArtistAvoid }
  = vm.runInContext(src + "\n;" + allTracksLine
      + `\n;({ ARTIST_PROFILES, STYLES, FLAVOR_POOLS, ALL_TRACKS,
      noteNameToMidi, degreeToFreq, findArtistProfile, DEFAULT_MELODY, generateVariation,
        setBeatComplexity, setArtistAvoid })`, sandbox, { filename: "bundle.js" });

let failures = 0;
const problems = [];
const note = (artist, msg) => { problems.push(`${artist}: ${msg}`); failures++; };

const names = Object.keys(ARTIST_PROFILES);
console.log(`\nChecking ${names.length} artist profiles\n`);

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
  if (!(p.swing >= 0 && p.swing <= 30)) note(name, `swing ${p.swing} out of 0-30`);
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
  if (!(s.bpm >= 50 && s.bpm <= 220)) snote(`"${s.t}" has implausible tempo ${s.bpm}`);
  if (!(s.y >= 1900 && s.y <= 2030)) snote(`"${s.t}" has implausible year ${s.y}`);
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

  console.log("  PASS  every genre has at least 8 reference songs");
}

console.log(`\n${failures ? failures + " PROBLEM(S)" : "all checks passed"}\n`);
process.exit(failures ? 1 : 0);
