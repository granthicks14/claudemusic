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

// Instruments that do not belong in a genre, and kits that do not belong on a
// track in a genre. This is the editorial part and it is deliberately
// explicit: the point is to have a written-down expectation that the audit
// can check, rather than an opinion in someone's head.
//
// "Hard" here means the genres whose whole identity is weight and menace -
// trap, drill, phonk, rap. An orchestral double reed in one of those is not
// an interesting choice, it is a mistake.
const FORBIDDEN_INSTRUMENTS = {
  trap: ["sax", "woodwind_nonflute", "leadguitar", "organ", "strings"],
  rap: ["woodwind_nonflute", "organ"],
  drill: ["sax", "woodwind_nonflute", "leadguitar", "organ", "guitar"],
  phonk: ["sax", "woodwind_nonflute", "organ", "strings"],
};
// Woodwind is a special case: a FLUTE over a trap beat is a real and
// extremely common sound (it is most of the Metro Boomin catalogue). A
// clarinet, oboe, bassoon or English horn over one is not.
// Duduk and shakuhachi are double-reed and end-blown rather than flutes, but
// they belong here: a dark breathy ethnic wind carrying a minor melody is a
// staple of UK drill and phonk, not an intruder. Clarinet, oboe, bassoon,
// English horn and recorder are the ones that do not belong.
const FLUTE_LIKE = new Set(["flute", "altoflute", "piccolo", "bansuri", "shakuhachi",
                            "duduk", "panflute", "ocarina", "whistle"]);

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

const genres = ONLY.length ? ONLY : Object.keys(api.STYLES);
let problems = 0;

for (const g of genres) {
  const style = api.STYLES[g];
  if (!style) continue;
  const instCount = {};
  const flavorCount = {};
  for (let i = 0; i < RUNS; i++) {
    api.setBeatComplexity(4 + Math.floor(Math.random() * 5));
    let v;
    try { v = api.generateVariation(style, 4); } catch (e) { continue; }
    const gs = v.genStyle || style;
    for (const k of Object.keys(v.instruments || {})) {
      if (!Array.isArray(v.instruments[k]) || !v.instruments[k].some(Boolean)) continue;
      instCount[k] = (instCount[k] || 0) + 1;
    }
    for (const [track, flavor] of Object.entries(gs.defaultFlavors || {})) {
      flavorCount[`${track}:${flavor}`] = (flavorCount[`${track}:${flavor}`] || 0) + 1;
    }
  }

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
  if (forbidden.includes("woodwind_nonflute")) {
    const wrong = allowedWw.filter((f) => !FLUTE_LIKE.has(f));
    if (wrong.length) issues.push(`woodwind allows non-flute: ${wrong.join(", ")}`);
  }
  for (const inst of forbidden) {
    if (inst === "woodwind_nonflute") continue;
    const pct = ((instCount[inst] || 0) / RUNS) * 100;
    if (pct > 0) issues.push(`plays ${inst} in ${pct.toFixed(0)}% of beats`);
  }

  const top = Object.entries(instCount).sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${k} ${Math.round((n / RUNS) * 100)}%`).join("  ");
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
