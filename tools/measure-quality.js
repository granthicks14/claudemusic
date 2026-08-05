// Where are the program's own beats actually losing points?
//
// "The rate-this-beat feature scores the generated beats poorly" is a claim
// with a number attached, so this finds the number. It generates beats across
// every genre, renders each one offline through the real audio graph, scores
// it with the same engine the app uses, and reports the per-TERM average.
//
// The per-term breakdown is the whole point. A single average score says the
// beats are weak; the term table says WHICH part is weak, and those lead to
// completely different work. A low "sub" term is a synthesis problem, a low
// "harmony" term is a composition problem, and a low "loudness" term is a
// gain-staging problem that has nothing to do with the music at all.
//
// Run: node tools/measure-quality.js [beatsPerGenre] [genre ...]
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
const PER_GENRE = Number(process.argv[2] || 3);
const ONLY = process.argv.slice(3);

(async () => {
  const browser = await chromium.launch({
    executablePath: candidates.find((p) => fs.existsSync(p)),
    args: ["--autoplay-policy=no-user-gesture-required", "--mute-audio"],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("file://" + path.join(__dirname, "..", "index.html"));
  await page.waitForTimeout(400);

  const rows = await page.evaluate(async ({ n, only }) => {
    const genres = only.length ? only : Object.keys(STYLES);
    const out = [];
    for (const g of genres) {
      for (let i = 0; i < n; i++) {
        selectStyle(g);
        // Scored exactly the way the app's own "Rate this beat" button does -
        // the symbolic pass over the pattern, combined with the acoustic pass
        // over a real offline render - so the number here is the number a user
        // sees rather than a proxy for it.
        const symbolic = ratePattern(activeStyle, currentPattern);
        engine.ensureContext();
        engine.updatePattern(currentPattern);
        const buf = await engine.renderOffline({ loops: 2 });
        if (!buf) continue;
        const chans = [];
        for (let c = 0; c < buf.numberOfChannels; c++) chans.push(buf.getChannelData(c));
        const acoustic = rateAudio(chans, buf.sampleRate, {
          genre: activeStyle.id || activeStyle.genre,
          mastered: false,
          isLoop: arrangementMode !== "song",
        });
        const r = combineRatings(symbolic, acoustic);
        out.push({
          genre: g,
          score: r.score,
          terms: r.terms.map((t) => ({ key: t.key, label: t.label, w: t.weight, s: t.score })),
        });
      }
    }
    return out;
  }, { n: PER_GENRE, only: ONLY });

  if (!rows.length) {
    console.log("no beats scored");
    if (errors.length) console.log(errors.slice(0, 3).join("\n"));
    await browser.close();
    process.exit(1);
  }

  // Per genre.
  const byGenre = {};
  for (const r of rows) (byGenre[r.genre] ||= []).push(r.score);
  console.log("\nscore by genre");
  console.log("".padEnd(46, "-"));
  const genreAvgs = Object.entries(byGenre)
    .map(([g, ss]) => [g, ss.reduce((a, b) => a + b, 0) / ss.length])
    .sort((a, b) => a[1] - b[1]);
  for (const [g, avg] of genreAvgs) {
    const bar = "#".repeat(Math.round(avg / 3));
    console.log(`${g.padEnd(12)} ${avg.toFixed(1).padStart(5)}  ${bar}`);
  }
  const all = rows.map((r) => r.score);
  const overall = all.reduce((a, b) => a + b, 0) / all.length;
  // Every beat is a fresh random generation - different key, tempo, line-up -
  // so the spread between beats is large and the mean is an ESTIMATE. Without
  // the standard error printed next to it, two runs that differ by a point
  // look like a change when they are the same number measured twice; that is
  // how you end up tuning a mix against noise.
  const sd = Math.sqrt(all.reduce((a, b) => a + (b - overall) ** 2, 0) / Math.max(1, all.length - 1));
  const se = sd / Math.sqrt(all.length);
  console.log(`\noverall ${overall.toFixed(1)} +/- ${(se * 1.96).toFixed(1)} (95% CI) ` +
              `across ${rows.length} beats, sd ${sd.toFixed(1)} ` +
              `(worst ${Math.min(...all).toFixed(1)}, best ${Math.max(...all).toFixed(1)})`);
  console.log(`a change smaller than about ${(se * 2.8).toFixed(1)} points is not ` +
              `distinguishable from noise at this sample size.`);

  // Per term - the useful part.
  const byTerm = {};
  for (const r of rows) {
    for (const t of r.terms) {
      const e = (byTerm[t.key] ||= { label: t.label, w: t.w, scores: [] });
      e.scores.push(t.s);
    }
  }
  console.log("\nwhere the points are going, worst first");
  console.log("term                       weight   avg    lost");
  console.log("".padEnd(58, "-"));
  const termRows = Object.entries(byTerm).map(([k, e]) => {
    const avg = e.scores.reduce((a, b) => a + b, 0) / e.scores.length;
    return { k, label: e.label, w: e.w, avg, lost: (1 - avg) * e.w };
  }).sort((a, b) => b.lost - a.lost);
  const totalW = termRows.reduce((a, t) => a + t.w, 0);
  for (const t of termRows) {
    console.log(`${t.label.padEnd(26)} ${t.w.toFixed(2)}   ${t.avg.toFixed(3)}  ` +
                `${((t.lost / totalW) * 100).toFixed(1)} pts`);
  }
  console.log(`\n"lost" is weight x (1 - score) as a share of the total weight: ` +
              `the points each term is actually costing, which is not the same ` +
              `as the lowest score.`);

  // Per genre x term, so a term that is only bad in two genres is not hidden
  // behind an average that looks merely mediocre everywhere.
  console.log("\nworst term in each genre");
  console.log("".padEnd(58, "-"));
  for (const [g] of genreAvgs) {
    const gr = rows.filter((r) => r.genre === g);
    const t = {};
    for (const r of gr) for (const x of r.terms) (t[x.key] ||= { label: x.label, w: x.w, s: [] }).s.push(x.s);
    const worst = Object.values(t)
      .map((e) => ({ label: e.label, lost: (1 - e.s.reduce((a, b) => a + b, 0) / e.s.length) * e.w }))
      .sort((a, b) => b.lost - a.lost).slice(0, 3);
    console.log(`${g.padEnd(12)} ${worst.map((w) => `${w.label} (${w.lost.toFixed(2)})`).join("  ")}`);
  }

  if (errors.length) console.log("\npage errors: " + errors.slice(0, 3).join(" | "));
  await browser.close();
})();
