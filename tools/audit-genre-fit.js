// What does each genre ACTUALLY end up playing?
//
// A genre can list an instrument, allow a kit, and weight a solo pool, and
// the result of all three together is not obvious from reading any one of
// them. This generates many beats per genre and reports what really turned
// up - which instruments, which kits, how often.
//
// It exists because of a specific complaint that turned out to be exactly
// right: trap and rap were fielding clarinets, oboes and upright basses.
// Reading the tables did not make that obvious. Counting what came out did.
//
// It then MISSED the next complaint, for a duller reason: only four genres
// had any written-down expectation at all, and no genre anywhere forbade a
// kalimba. Trap could play a thumb piano in a fifth of its beats and this
// file would print "ok". An audit with no expectation is not an audit. Every
// genre now has one.
//
// Run: node tools/audit-genre-fit.js [runsPerGenre] [genre ...]
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
const api = vm.runInContext(src + `\n;({ STYLES, FLAVOR_POOLS, flavorFitsGenre, SOLO_POOLS,
  generateVariation, setBeatComplexity, planInstrumentation })`, sandbox, { filename: "bundle.js" });

const RUNS = Number(process.argv[2] || 60);
const ONLY = process.argv.slice(3);

// ---------------------------------------------------------------------------
// The editorial part, written down on purpose.
//
// Each genre says which melodic instruments have no business in it. The point
// is to have an expectation a program can check, instead of an opinion in
// someone's head that only surfaces when a listener complains.
//
// Two rules of thumb behind the lists:
//
//  * A genre's exclusions come from what its records actually contain, not
//    from what would be "interesting". A flute over trap is real and common;
//    a thumb piano over trap is a sample-library accident.
//  * Permissive genres get short lists. Lo-fi, afrobeats and amapiano really
//    do field kalimbas, marimbas, saxes and flutes, so almost nothing is
//    banned there. Being strict everywhere would be just as wrong as being
//    strict nowhere.
//
// Which woodwinds a genre may load is handled separately, by family, in
// WOODWIND_ALLOWED below - naming the whole track here bans it outright.
const FORBIDDEN_INSTRUMENTS = {
  // --- the hard genres -----------------------------------------------------
  // Trap's melodic palette is bells, plucks, dark synth leads, dark piano,
  // cinematic strings and choirs. A flute lead is genuinely part of it. A
  // kalimba, marimba, saxophone, church organ or electric guitar is not, and
  // a thumb piano in particular reads as a lo-fi/afrobeats sound the moment
  // it enters.
  trap:      ["kalimba", "marimba", "sax", "organ", "leadguitar", "guitar", "talkbox"],
  rap:       ["kalimba", "marimba", "organ"],
  drill:     ["kalimba", "marimba", "sax", "organ", "leadguitar", "guitar", "talkbox"],
  // Phonk keeps the guitar - Memphis and drift phonk are built on distorted
  // guitar samples - but nothing acoustic and pretty.
  phonk:     ["kalimba", "marimba", "sax", "organ", "talkbox"],
  // Jersey club is chopped vocals, a bed-squeak kick and a simple synth.
  // There is no room in it for an orchestra.
  jerseyclub:["kalimba", "marimba", "sax", "woodwind", "leadguitar", "guitar", "strings", "horn", "talkbox"],

  // --- electronic ----------------------------------------------------------
  // Techno is a synthesised genre by definition: any acoustic solo voice in
  // it is a sample-library intrusion.
  techno:    ["kalimba", "marimba", "sax", "woodwind", "leadguitar", "guitar", "horn", "talkbox"],
  dubstep:   ["kalimba", "marimba", "sax", "woodwind", "leadguitar", "guitar", "horn", "talkbox"],
  // Liquid drum & bass is full of saxophone and flute, so those stay. Reeds,
  // mallets and thumb pianos do not appear on those records.
  dnb:       ["kalimba", "marimba", "talkbox"],
  // Synthwave's one acoustic import is the 80s sax solo, which is a real and
  // beloved trope. Everything else is a keyboard.
  synthwave: ["kalimba", "marimba", "woodwind", "talkbox"],
  // UK garage: organ stabs and sax stabs are period-correct, mallets are not.
  ukgarage:  ["kalimba", "marimba", "leadguitar"],
  // House is the permissive one of this group - deep house really does field
  // mallets, flutes, sax, organ and disco guitar. Only reeds are excluded.
  house:     [],

  // --- band and song genres ------------------------------------------------
  // Rock is guitars. An autotuned lead or an arpeggiator belongs to another
  // century, and a flute recital over a rock beat was turning up in 43% of
  // them.
  rock:      ["kalimba", "marimba", "autolead", "arp", "talkbox", "woodwind"],
  // Neo-soul: Rhodes, guitar, sax, flute, organ. Not a thumb piano, and not
  // an autotune lead - the whole genre is a reaction against that.
  neosoul:   ["kalimba", "autolead", "arp"],
  rnb:       ["kalimba", "arp"],
  // Boom-bap hip hop samples soul records: organ, horns, guitar, sax and
  // vibes are all fair game. Thumb piano is not, and neither is an
  // arpeggiator.
  hiphop:    ["kalimba", "arp"],
  lofi:      ["autolead", "arp", "talkbox"],
  // Latin percussion genres field marimba freely; the kalimba is African,
  // not Caribbean, and reads wrong.
  reggaeton: ["kalimba", "talkbox"],
  // The two genuinely African/Afro-diasporic genres. Kalimba, marimba, sax
  // and flute all belong; only the orchestral reeds are excluded.
  afrobeats: [],
  amapiano:  [],
};

// A genre that plays NOTHING on top is as wrong as one playing the wrong
// thing. These are the voices each genre may use to carry its top line -
// checked as "at least one of these was CHOSEN as a solo, in at least this
// share of beats". It is the counterweight to the list above: without it, the
// cheapest way to pass a forbidden-instrument check is to ban everything and
// ship nineteen genres of drums.
//
// Measured on the solo picks rather than on what sounded, because those are
// different questions. Drill comps on a piano in 100% of its beats, so "did a
// piano play?" says nothing at all about whether the beat has a melody.
const REQUIRED_LEAD = {
  trap:      [["lead", "autolead", "woodwind", "piano", "strings"], 0.98],
  rap:       [["lead", "autolead", "piano", "woodwind", "sax", "talkbox"], 0.98],
  drill:     [["lead", "autolead", "woodwind", "piano", "strings"], 0.98],
  phonk:     [["lead", "autolead", "leadguitar", "woodwind"], 0.98],
  jerseyclub:[["lead", "autolead", "arp"], 0.98],
  rock:      [["leadguitar", "lead", "organ", "piano"], 0.98],
  techno:    [["arp", "lead"], 0.98],
  dnb:       [["arp", "lead", "woodwind"], 0.98],
  dubstep:   [["lead", "arp"], 0.98],
  synthwave: [["lead", "arp", "leadguitar"], 0.98],
  house:     [["lead", "arp", "sax", "woodwind", "marimba", "talkbox"], 0.98],
  ukgarage:  [["lead", "arp", "sax", "woodwind"], 0.98],
  hiphop:    [["lead", "sax", "leadguitar", "woodwind", "piano", "marimba", "horn", "talkbox"], 0.98],
  lofi:      [["lead", "sax", "woodwind", "marimba", "kalimba", "leadguitar"], 0.98],
  rnb:       [["sax", "woodwind", "leadguitar", "marimba", "lead", "talkbox"], 0.98],
  neosoul:   [["leadguitar", "sax", "woodwind", "lead", "marimba", "talkbox"], 0.98],
  reggaeton: [["lead", "woodwind", "marimba", "leadguitar"], 0.98],
  afrobeats: [["woodwind", "marimba", "kalimba", "sax", "leadguitar", "lead"], 0.98],
  amapiano:  [["woodwind", "sax", "lead", "marimba", "kalimba", "leadguitar"], 0.98],
};

// Woodwind is not one instrument, it is four families, and which of them a
// genre can field is a different question per genre. A flute over a trap beat
// is real and extremely common - it is most of the Metro Boomin catalogue. A
// clarinet over one is not. But a clarinet over a lo-fi or boom-bap beat is
// entirely at home, because those genres sample jazz records.
//
// The previous version of this file collapsed all of that into one
// "flute-like or not" set, which meant the only two settings available were
// "flute only" and "anything", and every genre that wanted a soprano sax had
// to be given an oboe as well.
const WOODWIND_FAMILIES = {
  // Flutes and the dark end-blown winds. Duduk and shakuhachi are reed and
  // end-blown rather than flutes, but they group here: a breathy ethnic wind
  // carrying a minor melody is a staple of drill and phonk, not an intruder.
  flute:      ["flute", "altoflute", "shakuhachi", "bansuri", "duduk", "piccolo",
               "panflute", "ocarina", "tinwhistle", "dizi", "ney", "bassflute",
               "overblown", "woodflute"],
  // The jazz reeds. These follow sampled jazz and soul into a beat.
  jazzreed:   ["clarinet", "bassclarinet", "sopranosax", "basset"],
  // Orchestral double reeds. These follow sampled classical records, which
  // is a much narrower doorway.
  doublereed: ["oboe", "englishhorn", "bassoon", "contrabassoon"],
  early:      ["recorder"],
};
const WOODWIND_FAMILY_OF = {};
for (const [fam, list] of Object.entries(WOODWIND_FAMILIES)) {
  for (const f of list) WOODWIND_FAMILY_OF[f] = fam;
}
// Which families each genre may draw on. An empty list means the woodwind
// track has no business in the genre at all.
const WOODWIND_ALLOWED = {
  trap: ["flute"], rap: ["flute"], drill: ["flute"], phonk: ["flute"],
  ukgarage: ["flute"], dnb: ["flute"],
  jerseyclub: [], techno: [], dubstep: [], synthwave: [], rock: [],
  hiphop: ["flute", "jazzreed"], house: ["flute", "jazzreed"],
  reggaeton: ["flute", "jazzreed"], afrobeats: ["flute", "jazzreed"],
  amapiano: ["flute", "jazzreed"], neosoul: ["flute", "jazzreed"],
  // Orchestral R&B is a real tradition, so the double reeds get in here.
  rnb: ["flute", "jazzreed", "doublereed"],
  // Lo-fi is the one genre that samples anything at all, classical included.
  lofi: ["flute", "jazzreed", "doublereed", "early"],
};

// Derived rather than listed. A hardcoded set went stale the moment eight new
// 808 kits were added, and reported every one of them as a violation - the
// third time in this project a measuring tool has been behind the code it
// measures. Anything whose name contains "808", plus the handful of
// sub-register kits that still read as one, counts.
const BASS_808_EXTRA = new Set(["sub", "drillslide", "distorted", "growl"]);
const is808 = (f) => /808/.test(f) || BASS_808_EXTRA.has(f);
// Genres whose bass IS an 808 and nothing else. An upright double bass in a
// trap beat is not a variation, it is a different genre.
const EIGHT_OH_EIGHT_GENRES = new Set(["trap", "rap", "drill", "phonk", "jerseyclub"]);

// Kits that carry a strong genre signature of their own, on tracks where the
// wrong one is as jarring as the wrong instrument. A brushed jazz kick under
// a drill beat is not subtle.
const FORBIDDEN_KITS = {
  trap:  { kick: ["brush", "jazz", "acoustic", "rock"], snare: ["brush", "jazz", "rock"] },
  drill: { kick: ["brush", "jazz", "acoustic", "rock"], snare: ["brush", "jazz", "rock"] },
  rap:   { kick: ["brush", "jazz"], snare: ["brush", "jazz"] },
  phonk: { kick: ["brush", "jazz", "acoustic"], snare: ["brush", "jazz"] },
  techno:{ kick: ["brush", "jazz", "acoustic"], snare: ["brush", "jazz"] },
};

const genres = ONLY.length ? ONLY : Object.keys(api.STYLES);
let problems = 0;

// A woodwind kit with no family is invisible to every per-genre check below,
// so a new one added without classifying it would silently be allowed
// everywhere - which is the exact shape of the bug this whole file exists to
// catch. Checked once, up front.
{
  const unclassified = (api.FLAVOR_POOLS.woodwind || []).filter((f) => !WOODWIND_FAMILY_OF[f]);
  if (unclassified.length) {
    problems += unclassified.length;
    console.log(`\nPROBLEM  woodwind kits with no family, so no genre check applies to ` +
                `them: ${unclassified.join(", ")}`);
  }
}

for (const g of genres) {
  const style = api.STYLES[g];
  if (!style) continue;
  const instCount = {};
  const soloCount = {};
  const soloPicks = [];
  const flavorCount = {};
  let made = 0;
  for (let i = 0; i < RUNS; i++) {
    api.setBeatComplexity(4 + Math.floor(Math.random() * 5));
    let v;
    try { v = api.generateVariation(style, 4); } catch (e) { continue; }
    made++;
    const gs = v.genStyle || style;
    for (const k of Object.keys(v.instruments || {})) {
      if (!Array.isArray(v.instruments[k]) || !v.instruments[k].some(Boolean)) continue;
      instCount[k] = (instCount[k] || 0) + 1;
    }
    // Which voices were CHOSEN to carry the top line, as opposed to merely
    // sounding. The two are not the same question: drill comps on a piano in
    // every single beat, so "does a piano play?" cannot tell you whether the
    // beat has a melody. planInstrumentation leaves its picks here, after the
    // bass and any rhythm guitar.
    const solos = ((gs.melodic && gs.melodic.monoInstruments) || [])
      .filter((i) => i !== "bass" && i !== "guitar");
    soloPicks.push(solos);
    for (const inst of solos) soloCount[inst] = (soloCount[inst] || 0) + 1;
    for (const [track, flavor] of Object.entries(gs.defaultFlavors || {})) {
      flavorCount[`${track}:${flavor}`] = (flavorCount[`${track}:${flavor}`] || 0) + 1;
    }
  }
  const total = made || 1;

  // What is this genre allowed to draw on at all?
  const allowedBass = api.FLAVOR_POOLS.bass.filter((f) => api.flavorFitsGenre("bass", f, g));
  const allowedWw = api.FLAVOR_POOLS.woodwind.filter((f) => api.flavorFitsGenre("woodwind", f, g));
  const soloPool = (api.SOLO_POOLS[g] || []).map(([n, w]) => `${n}x${w}`).join(" ");

  const issues = [];
  if (EIGHT_OH_EIGHT_GENRES.has(g)) {
    const wrong = allowedBass.filter((f) => !is808(f));
    if (wrong.length) issues.push(`bass allows non-808 kits: ${wrong.join(", ")}`);
  }
  const forbidden = FORBIDDEN_INSTRUMENTS[g] || [];
  if (!forbidden.length && !WOODWIND_ALLOWED[g]) {
    issues.push("no written-down expectation for this genre");
  }
  const wwFams = WOODWIND_ALLOWED[g];
  // An empty family list means the track never plays here at all, which the
  // "woodwind" entry in FORBIDDEN_INSTRUMENTS already checks against measured
  // output. What kits a silent track could theoretically have loaded is not a
  // real question, so it is not asked.
  if (wwFams && wwFams.length) {
    const wrong = allowedWw.filter((f) => !wwFams.includes(WOODWIND_FAMILY_OF[f]));
    if (wrong.length) {
      issues.push(`woodwind allows ${wrong.join(", ")} — only ` +
                  `${wwFams.length ? wwFams.join("/") : "nothing"} belongs here`);
    }
  }
  for (const inst of forbidden) {
    const pct = ((instCount[inst] || 0) / total) * 100;
    if (pct > 0) issues.push(`plays ${inst} in ${pct.toFixed(0)}% of beats`);
  }

  // The counterweight: something has to be carrying the top line.
  const req = REQUIRED_LEAD[g];
  if (req) {
    const [voices, floor] = req;
    // Per beat, not summed across picks: a generation can draw two solo
    // voices, and counting both would let a genre that fields the right voice
    // twice in half its beats and nothing at all in the other half pass.
    const share = soloPicks.filter((p) => p.some((i) => voices.includes(i))).length / total;
    if (share < floor) {
      issues.push(`only ${(share * 100).toFixed(0)}% of beats have a lead voice ` +
                  `(${voices.join("/")}), wanted ${floor * 100}%`);
    }
  }

  for (const [track, bad] of Object.entries(FORBIDDEN_KITS[g] || {})) {
    const wrong = (api.FLAVOR_POOLS[track] || [])
      .filter((f) => bad.includes(f) && api.flavorFitsGenre(track, f, g));
    if (wrong.length) issues.push(`${track} allows ${wrong.join(", ")}`);
  }

  const top = Object.entries(instCount).sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${k} ${Math.round((n / total) * 100)}%`).join("  ");
  console.log(`\n${g}`);
  console.log(`  plays: ${top}`);
  console.log(`  solo pool: ${soloPool}`);
  if (issues.length) {
    problems += issues.length;
    for (const i of issues) console.log(`  PROBLEM  ${i}`);
  } else {
    console.log("  ok");
  }
}

console.log(`\n${problems ? problems + " problem(s)" : "no genre-fit problems"}\n`);
process.exit(problems ? 1 : 0);
