// Which kits actually work together?
//
// With 370 kits, "these go well together" is easy to assert and hard to
// justify. This does not assert it. For each genre it assembles random kit
// combinations, renders each one offline through the real audio graph, and
// scores it with the same rating engine used everywhere else - the BS.1770
// loudness, spectral balance, stereo and crest measurements, plus the
// structural terms. The combinations that score highest are written out.
//
// The honest limits, stated up front:
//
//   * The reward is the rating equation. It measures balance, headroom,
//     dynamics and structure. It does not measure taste, and a combination
//     that scores well is "well balanced", not "beautiful".
//   * The search is random, not exhaustive. Exhaustive is not available:
//     a genre with eight tracks and twenty candidate kits each is 2.5e10
//     combinations. Random sampling with enough draws finds good regions,
//     not the global optimum, and this does not claim otherwise.
//   * Every combination is generated with a fresh random pattern, so a
//     combination is judged across several patterns rather than lucking into
//     one good one.
//
// Run: node tools/research-kits.js [samplesPerGenre] [genre ...]
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const candidates = [
  "/opt/pw-browsers/chromium/chrome-linux/chrome",
  ...fs.existsSync("/opt/pw-browsers")
    ? fs.readdirSync("/opt/pw-browsers").filter((d) => d.startsWith("chromium-"))
        .map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)
    : [],
];

const SAMPLES = Number(process.argv[2] || 40);
const ONLY = process.argv.slice(3);

(async () => {
  const browser = await chromium.launch({
    executablePath: candidates.find((p) => fs.existsSync(p)),
    args: ["--autoplay-policy=no-user-gesture-required", "--mute-audio"],
  });
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error("PAGE ERROR:", String(e)));
  await page.goto("file://" + path.join(__dirname, "..", "index.html"));
  await page.waitForTimeout(400);

  const genres = ONLY.length ? ONLY : await page.evaluate(() => Object.keys(STYLES));
  const all = {};

  for (const genre of genres) {
    const res = await page.evaluate(async ({ genre, SAMPLES }) => {
      selectStyle(genre);
      const style = STYLES[genre];
      // Only the tracks this genre actually plays, and only kits the genre
      // is allowed to use - otherwise the search spends its budget on
      // combinations the program would never assemble anyway.
      const tracks = Object.keys(style.defaultFlavors || {}).filter((t) => FLAVOR_POOLS[t]);
      const options = {};
      for (const t of tracks) {
        options[t] = FLAVOR_POOLS[t].filter((f) => {
          try { return flavorFitsGenre(t, f, genre); } catch (e) { return true; }
        });
        if (!options[t].length) options[t] = FLAVOR_POOLS[t].slice();
      }

      const trials = [];
      for (let i = 0; i < SAMPLES; i++) {
        const combo = {};
        for (const t of tracks) {
          combo[t] = options[t][Math.floor(Math.random() * options[t].length)];
        }
        // Two patterns per combination, so a combination is not credited or
        // blamed for one lucky draw of the generator.
        let total = 0, n = 0, det = null;
        for (let rep = 0; rep < 2; rep++) {
          currentFlavors = Object.assign({}, currentFlavors, combo);
          generatePattern();
          engine.ensureContext();
          engine.updatePattern(currentPattern);
          const buf = await engine.renderOffline({ loops: 1 });
          if (!buf) continue;
          const chans = [];
          for (let c = 0; c < buf.numberOfChannels; c++) chans.push(buf.getChannelData(c));
          const acoustic = rateAudio(chans, buf.sampleRate,
            { genre, mastered: false, isLoop: true });
          const symbolic = ratePattern(activeStyle, currentPattern);
          // Weight the mix side higher: the structural side barely moves when
          // only the kits change, so including it at equal weight would just
          // add noise to the comparison.
          total += acoustic.score * 0.75 + symbolic.score * 0.25;
          n++;
          if (!det) {
            det = {};
            for (const term of acoustic.terms) det[term.key] = +term.score.toFixed(2);
          }
        }
        if (n) trials.push({ combo, score: +(total / n).toFixed(2), terms: det });
      }
      trials.sort((a, b) => b.score - a.score);
      return {
        tracks,
        best: trials.slice(0, 3),
        worst: trials.slice(-2),
        mean: +(trials.reduce((s, t) => s + t.score, 0) / trials.length).toFixed(2),
        spread: +(trials[0].score - trials[trials.length - 1].score).toFixed(2),
        n: trials.length,
      };
    }, { genre, SAMPLES });

    all[genre] = res;
    const b = res.best[0];
    console.log(`\n${genre}  (${res.n} combinations, mean ${res.mean}, best-to-worst spread ${res.spread})`);
    console.log(`  BEST  ${b.score}  ${Object.entries(b.combo).map(([t, f]) => `${t}:${f}`).join("  ")}`);
    const w = res.worst[res.worst.length - 1];
    console.log(`  worst ${w.score}  ${Object.entries(w.combo).map(([t, f]) => `${t}:${f}`).join("  ")}`);
  }

  // Does the choice of kits move the score at all? If the spread between the
  // best and worst combination is inside the noise, then "which kits work
  // together" is not a question this reward can answer, and saying so is more
  // useful than shipping a table that means nothing.
  const spreads = Object.values(all).map((r) => r.spread);
  const meanSpread = spreads.reduce((a, b) => a + b, 0) / spreads.length;
  console.log(`\nmean best-to-worst spread across genres: ${meanSpread.toFixed(2)} points`);

  const out = {};
  for (const [g, r] of Object.entries(all)) {
    out[g] = { score: r.best[0].score, kits: r.best[0].combo };
  }
  fs.writeFileSync(path.join(__dirname, "kit-presets.json"),
    JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), samplesPerGenre: SAMPLES, presets: out }, null, 1));
  console.log("written to tools/kit-presets.json");

  await browser.close();
})();
