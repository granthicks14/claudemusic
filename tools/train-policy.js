// ---------------------------------------------------------------------------
// Offline policy training (cross-entropy method)
// ---------------------------------------------------------------------------
// Run with:  node tools/train-policy.js [generations] [population]
//
// Samples a population of neural policies, evaluates each by generating real
// beats and scoring them with scoreVariation, keeps the best fraction, refits
// the sampling distribution, repeats. This is the cross-entropy method - a
// standard derivative-free policy-search algorithm for exactly this setting,
// where the reward can only be sampled, not differentiated.
//
// Prints the trained weights as a JSON blob to paste into js/policy.js, and
// reports the measured improvement over the un-policied generator.
const fs = require("fs"), vm = require("vm"), path = require("path");

const ROOT = path.join(__dirname, "..");
const ctx = { Math, console, Date, JSON, localStorage: null };
vm.createContext(ctx);
for (const f of ["theory.js", "instruments.js", "performance.js", "learning.js", "artists.js", "policy.js", "production.js", "patterns.js"]) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, "js", f), "utf8"), ctx);
}
const R = (code) => vm.runInContext(code, ctx);

const OUT = R("POLICY_OUTPUTS");
const IN = R("POLICY_INPUTS");
// Wider than the original 8. The input vector doubled (tempo, half-time and
// four artist-context features were added), so the hidden layer needs room to
// mix them; at 8 it was a bottleneck rather than a representation.
const HIDDEN = 16;
const nIn = IN.length, nOut = OUT.length;
const DIM = nIn * HIDDEN + HIDDEN + HIDDEN * nOut + nOut;

const GENRES = R("Object.keys(STYLES)");

function unpack(v) {
  let p = 0;
  const w1 = [];
  for (let i = 0; i < nIn; i++) { w1.push(v.slice(p, p + HIDDEN)); p += HIDDEN; }
  const b1 = v.slice(p, p + HIDDEN); p += HIDDEN;
  const w2 = [];
  for (let j = 0; j < HIDDEN; j++) { w2.push(v.slice(p, p + nOut)); p += nOut; }
  const b2 = v.slice(p, p + nOut);
  return { w1, b1, w2, b2 };
}

const ARTISTS = R("Object.keys(ARTIST_PROFILES)");

// One episode: set a policy, generate a beat in a random genre at a random
// complexity - sometimes while imitating an artist - and return its musical
// score. Training WITH artist contexts present is the point: the policy has
// to learn to complement the artist knobs rather than fight them, and it can
// only learn that if it sees them.
function episode(weights, styleId, complexity, artist) {
  R(`setPolicyWeights(${weights ? JSON.stringify(weights) : "null"})`);
  R(`setBeatComplexity(${complexity})`);
  R(`setArtistKnobs(${artist ? `artistKnobs(ARTIST_PROFILES[${JSON.stringify(artist)}])` : "null"})`);
  const s = JSON.stringify(styleId);
  const pat = R(`generateVariationOnce(STYLES[${s}], 4)`);
  return R(`scoreVariation(${JSON.stringify(pat.genStyle ? { melodic: pat.genStyle.melodic, drums: pat.genStyle.drums, id: pat.genStyle.id } : null)} || STYLES[${s}], ${JSON.stringify({ instruments: pat.instruments, structure: pat.structure, barRootDegrees: pat.barRootDegrees })})`);
}

function evaluate(weights, episodes, seedList) {
  let total = 0;
  for (const [g, c, a] of seedList) total += episode(weights, g, c, a);
  return total / seedList.length;
}

function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const GENERATIONS = Number(process.argv[2] || 24);
const POP = Number(process.argv[3] || 40);
const ELITE = Math.max(3, Math.round(POP * 0.25));
const EPISODES = 40;

// A fixed evaluation set, so every candidate in a generation is judged on
// the same problems and the comparison is not just noise.
function makeSeeds(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    // Two in five episodes imitate a named artist, so the policy is trained
    // on both situations it will actually meet rather than only the plain one.
    const withArtist = Math.random() < 0.4;
    const artist = withArtist ? ARTISTS[Math.floor(Math.random() * ARTISTS.length)] : null;
    const genre = artist
      ? R(`ARTIST_PROFILES[${JSON.stringify(artist)}].genre`)
      : GENRES[Math.floor(Math.random() * GENRES.length)];
    const complexity = artist
      ? R(`ARTIST_PROFILES[${JSON.stringify(artist)}].complexity`)
      : 1 + Math.floor(Math.random() * 10);
    out.push([genre, complexity, artist]);
  }
  return out;
}

let mean = new Array(DIM).fill(0);
let std = new Array(DIM).fill(0.7);

const baselineSeeds = makeSeeds(220);
const baseline = evaluate(null, EPISODES, baselineSeeds);
console.log(`baseline (no policy), ${baselineSeeds.length} episodes: ${baseline.toFixed(2)}`);
console.log(`training: ${GENERATIONS} generations x ${POP} population, ${EPISODES} episodes each, elite ${ELITE}`);

let best = null, bestScore = -Infinity;
for (let gen = 0; gen < GENERATIONS; gen++) {
  const seeds = makeSeeds(EPISODES);
  const pop = [];
  for (let i = 0; i < POP; i++) {
    const v = mean.map((m, k) => m + std[k] * randn());
    pop.push({ v, score: evaluate(unpack(v), EPISODES, seeds) });
  }
  pop.sort((a, b) => b.score - a.score);
  const elite = pop.slice(0, ELITE);
  for (let k = 0; k < DIM; k++) {
    const vals = elite.map((e) => e.v[k]);
    const m = vals.reduce((a, b) => a + b, 0) / vals.length;
    const varr = vals.reduce((a, b) => a + (b - m) * (b - m), 0) / vals.length;
    mean[k] = m;
    // Extra noise keeps the search from collapsing too early.
    std[k] = Math.sqrt(varr) + 0.06;
  }
  // Judge the current mean policy on the held-out baseline set.
  const meanScore = evaluate(unpack(mean), EPISODES, baselineSeeds);
  if (meanScore > bestScore) { bestScore = meanScore; best = mean.slice(); }
  console.log(`  gen ${String(gen + 1).padStart(2)}  elite best ${elite[0].score.toFixed(2)}  mean-policy on held-out ${meanScore.toFixed(2)}`);
}

const finalW = unpack(best);
const finalScore = evaluate(finalW, EPISODES, baselineSeeds);
console.log("");
console.log(`baseline           ${baseline.toFixed(2)}`);
console.log(`trained policy     ${finalScore.toFixed(2)}`);
console.log(`improvement        ${(finalScore - baseline).toFixed(2)} (${((finalScore - baseline) / Math.abs(baseline) * 100).toFixed(1)}%)`);

finalW.meta = {
  trainedAt: new Date().toISOString().slice(0, 10),
  method: "cross-entropy method",
  generations: GENERATIONS, population: POP, episodesPerEval: EPISODES,
  totalEpisodes: GENERATIONS * POP * EPISODES,
  hidden: HIDDEN,
  inputs: IN.length,
  artistAware: true,
  baseline: +baseline.toFixed(2), trained: +finalScore.toFixed(2),
};
fs.writeFileSync(path.join(ROOT, "tools", "policy-weights.json"), JSON.stringify(finalW));
console.log("");
console.log("weights written to tools/policy-weights.json");
