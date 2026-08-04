// Point the rating at the program's own output, genre by genre.
//
// This is what the offline render buys: the mix terms can now be measured on
// the real signal rather than guessed at from the pattern. Run it after any
// change to the synthesis or the mix bus to see what moved.
//
// Run: node tools/audit-mix.js [genre ...]
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

(async () => {
  const browser = await chromium.launch({
    executablePath: candidates.find((p) => fs.existsSync(p)),
    args: ["--autoplay-policy=no-user-gesture-required", "--mute-audio"],
  });
  const page = await browser.newPage();
  await page.goto("file://" + path.join(__dirname, "..", "index.html"));
  await page.waitForTimeout(400);

  const genres = process.argv.slice(2).length
    ? process.argv.slice(2)
    : await page.evaluate(() => Object.keys(STYLES));

  const rows = [];
  for (const g of genres) {
    const r = await page.evaluate(async (genre) => {
      selectStyle(genre);
      generatePattern();
      engine.ensureContext();
      engine.updatePattern(currentPattern);
      const buf = await engine.renderOffline({ loops: 2 });
      if (!buf) return null;
      const chans = [];
      for (let c = 0; c < buf.numberOfChannels; c++) chans.push(buf.getChannelData(c));
      const acoustic = rateAudio(chans, buf.sampleRate, { genre, mastered: false, isLoop: true });
      const symbolic = ratePattern(activeStyle, currentPattern);
      const get = (k) => {
        const t = acoustic.terms.find((x) => x.key === k);
        return t ? t.score : null;
      };
      return {
        genre,
        acoustic: acoustic.score,
        symbolic: symbolic.score,
        lufs: acoustic.measurements.lufs,
        crest: acoustic.measurements.crestDb,
        peak: acoustic.measurements.truePeakDb,
        corr: acoustic.measurements.correlation,
        pulse: acoustic.measurements.pulseSalience,
        bands: acoustic.measurements.bands.map((b) => +(b * 100).toFixed(0)),
        weakest: acoustic.terms.slice().sort((a, b) => a.score - b.score)
          .filter((t) => t.score < 0.6).slice(0, 3).map((t) => t.key),
        target: acoustic.target,
        _g: get,
      };
    }, g);
    if (r) rows.push(r);
  }

  console.log("\ngenre         acoustic symbolic    LUFS (target)  crest   peak   corr  pulse   sub/low/mid/hi      weakest");
  for (const r of rows) {
    console.log(
      r.genre.padEnd(13)
      + String(r.acoustic).padStart(7)
      + String(r.symbolic).padStart(9)
      + `   ${r.lufs.toFixed(1)} (${r.target})`.padEnd(17)
      + `${r.crest.toFixed(1)}dB`.padStart(8)
      + `${r.peak.toFixed(1)}`.padStart(7)
      + `${r.corr === null ? "  -  " : r.corr.toFixed(2)}`.padStart(7)
      + `${r.pulse === null ? " - " : r.pulse.toFixed(2)}`.padStart(7)
      + "   " + r.bands.slice(0, 3).concat(r.bands[3] + r.bands[4]).join("/").padEnd(18)
      + (r.weakest.join(",") || "-"));
  }
  const avg = (f) => (rows.reduce((s, r) => s + f(r), 0) / rows.length).toFixed(1);
  console.log(`\nmean acoustic ${avg((r) => r.acoustic)}   mean symbolic ${avg((r) => r.symbolic)}   mean LUFS ${avg((r) => r.lufs)}`);

  // Which mix problems are systemic rather than one-off?
  const tally = {};
  for (const r of rows) for (const k of r.weakest) tally[k] = (tally[k] || 0) + 1;
  const ranked = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  console.log("weak terms across genres: " + (ranked.map(([k, n]) => `${k}=${n}`).join("  ") || "none"));

  await browser.close();
})();
