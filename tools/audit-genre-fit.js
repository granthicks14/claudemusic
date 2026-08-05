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
               "js/production.js", "js/patterns.js"];
const src = FILES.map((f) => fs.readFileSync(path.join(root, f), "utf8")).join("\n;\n");
const sandbox = { module: { exports: {} }, console, JSON };
vm.createContext(sandbox);
const api = vm.runInContext(src + `\n;({ STYLES, FLAVOR_POOLS, flavorFitsGenre, SOLO_POOLS,
  generateVariation, setBeatComplexity, planInstrumentation,
  GENRE_PLAN, WOODWIND_FAMILY_OF, WOODWIND_ALLOWED, setFlavorsForValidation })`, sandbox, { filename: "bundle.js" });

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
// The expectations themselves now live in js/production.js, next to the
// runtime gate that enforces them. They used to live here, which meant this
// audit could check the program but the PROGRAM could not check itself - and
// a rule that only exists in a tool nobody runs before shipping is a rule the
// generator is free to break. One source, read by both.
const FORBIDDEN_INSTRUMENTS = {};
for (const [g, plan] of Object.entries(api.GENRE_PLAN)) FORBIDDEN_INSTRUMENTS[g] = plan.forbidden;
const REQUIRED_LEAD = {};
for (const [g, plan] of Object.entries(api.GENRE_PLAN)) REQUIRED_LEAD[g] = [plan.lead, 0.98];
const WOODWIND_FAMILY_OF = api.WOODWIND_FAMILY_OF;
const WOODWIND_ALLOWED = api.WOODWIND_ALLOWED;

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
