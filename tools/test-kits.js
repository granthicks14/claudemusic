// Every kit must actually make a sound, and a distinct one.
//
// A flavor is a string in a list plus a branch in the synthesis code. Adding
// the string without the branch is not an error - the voice falls through to
// its default and the "new kit" is silently the old one. Adding a branch that
// produces silence is worse: the track simply disappears and nothing says so.
// Both are invisible without rendering the audio and looking at it.
//
// Run: node tools/test-kits.js
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

// Optional track names on the command line let the run be split up; with
// none, everything is checked.
const ONLY = process.argv.slice(2);

(async () => {
  let failures = 0;
  const check = (name, ok, detail) => {
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
    if (!ok) failures++;
  };

  const browser = await chromium.launch({
    executablePath: candidates.find((p) => fs.existsSync(p)),
    args: ["--autoplay-policy=no-user-gesture-required", "--mute-audio"],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("file://" + path.join(__dirname, "..", "index.html"));
  await page.waitForTimeout(400);

  // Render one hit of a single voice in isolation, offline, and report its
  // energy plus a coarse spectral shape so two kits can be compared.
  const results = await page.evaluate(async ({ ONLY_TRACKS, RENDER_SEC }) => {
    const SR_TEST = 22050;   // half rate: this compares sounds, it does not master them
    const out = [];

    // A small deterministic PRNG standing in for Math.random during renders,
    // so that "play this kit" is a pure function of the flavor name. mulberry32
    // - 32-bit state, one multiply and a few shifts, good enough for this and
    // short enough to read.
    const seedRandom = (seed) => {
      let a = seed >>> 0;
      Math.random = () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), 1 | t);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };
    const VOICES = {
      tom: (e, t, v, f) => e.playTom(t, v, f),
      arp: (e, t, v, f) => e.playArpVoice(t, 440, 0.4, v, f),
      autolead: (e, t, v, f) => e.playAutoLeadVoice(t, 330, 0.5, v, f),
      kick: (e, t, v, f) => e.playKick(t, v, f),
      snare: (e, t, v, f) => e.playSnare(t, v, f),
      // playHihat takes (time, vel, OPEN, flavor) - open comes before
      // flavor. Passing them the other way round rendered every hi-hat
      // with flavor=false, which made all 21 of them look identical.
      hihat: (e, t, v, f) => e.playHihat(t, v, false, f),
      bass: (e, t, v, f) => e.playBass(t, 65, 0.5, v, f),
      lead: (e, t, v, f) => e.playLeadVoice(t, 440, 0.5, v, f),
      piano: (e, t, v, f) => e.playPianoVoice(t, 262, 0.6, v, f),
      perc: (e, t, v, f) => e.playPerc(t, v, f),
      marimba: (e, t, v, f) => e.playMarimbaVoice(t, 392, 0.5, v, f),
      kalimba: (e, t, v, f) => e.playKalimbaVoice(t, 523, 0.5, v, f),
      sax: (e, t, v, f) => e.playSaxVoice(t, 349, 0.6, v, f),
      woodwind: (e, t, v, f) => e.playWoodwindVoice(t, 523, 0.6, v, f),
      leadguitar: (e, t, v, f) => e.playLeadGuitarVoice(t, 330, 0.6, v, f),
      talkbox: (e, t, v, f) => e.playTalkboxVoice(t, 262, 0.6, v, f),
      vocal: (e, t, v, f) => e.playVocalVoice(t, 330, 0.6, v, f),
      organ: (e, t, v, f) => e.playOrganVoice(t, 262, 0.6, v, f),
      strings: (e, t, v, f) => e.playStringsVoice(t, 294, 1.2, v, f),
      horn: (e, t, v, f) => e.playHornVoice(t, 349, 0.8, v, f),
      pad: (e, t, v, f) => e.playPadVoice(t, 262, 1.4, v, f),
      stab: (e, t, v, f) => e.playStabVoice(t, 330, 0.4, v, f),
      guitar: (e, t, v, f) => e.playGuitarVoice(t, 196, 0.7, v, f),
    };
    // Render each kit TWICE. Many kits randomise pitch or noise per hit, so
    // two renders of one kit already differ; the only meaningful question is
    // whether two DIFFERENT kits differ by more than that. Comparing a single
    // render of each with a fixed threshold cannot answer it.
    for (const [track, play] of Object.entries(VOICES)) {
      if (ONLY_TRACKS.length && !ONLY_TRACKS.includes(track)) continue;
      const flavors = FLAVOR_POOLS[track] || [];
      for (const flavor of flavors) {
        const takes = [];
        let err = null;
        for (let take = 0; take < 2; take++) {
          // Both takes are rendered with the SAME seeded random sequence.
          //
          // Almost every voice randomises something per hit - a tom's
          // fundamental, a snare's noise, a guitar's pick position - which is
          // right for music and ruinous for a comparison: it put the distance
          // between two renders of one kit on the same scale as the distance
          // between two different kits, and no threshold can separate those
          // once they overlap. Six stab kits that shared a code path and were
          // literally one sound sat comfortably inside that noise and passed.
          //
          // With the randomness pinned, a second render of a kit is
          // bit-identical to the first, so self-distance is zero and any pair
          // that still measures zero apart is genuinely one sound.
          seedRandom(12345);
          const off = new OfflineAudioContext(2, SR_TEST * RENDER_SEC, SR_TEST);
          const clone = new BeatEngine();
          clone.ensureContext(off);
          try { play(clone, 0.05, 0.9, flavor); } catch (e) { err = String(e.message || e); }
          const buf = await off.startRendering();
          const d = buf.getChannelData(0);
          const d2 = buf.numberOfChannels > 1 ? buf.getChannelData(1) : d;
          // Band energies over time, using the SAME Butterworth filters the
          // rating engine uses. An earlier version of this test invented a
          // "successive differencing" band split, which is the exact broken
          // pattern already found and fixed in the onset detector - it does
          // not separate frequencies at all, and it duly reported 106 pairs
          // of kits as identical.
          const mono = new Float64Array(d.length);
          for (let i = 0; i < d.length; i++) mono[i] = (d[i] + d2[i]) * 0.5;
          const EDGES = [[0, 120], [120, 500], [500, 2000], [2000, 8000]];
          const SR = SR_TEST, FRAMES = 8;
          const hop = Math.floor(mono.length / FRAMES);
          const feat = [];
          for (const [lo, hi] of EDGES) {
            // Single sections rather than cascaded pairs. 12dB/octave leaks
            // more than the rating engine tolerates, but this is comparing
            // two sounds against each other rather than measuring an absolute
            // band share, and it halves a test that was timing out.
            let sig = mono;
            if (lo) sig = biquad(sig, hpfCoeffs(lo, SR));
            if (hi < SR * 0.44) sig = biquad(sig, lpfCoeffs(hi, SR));
            for (let f = 0; f < FRAMES; f++) {
              let e = 0;
              for (let i = f * hop; i < (f + 1) * hop; i++) e += sig[i] * sig[i];
              feat.push(Math.log(1e-9 + Math.sqrt(e / hop)));
            }
          }
          let sq = 0, peak = 0;
          for (let i = 0; i < d.length; i++) {
            const v = (d[i] + d2[i]) * 0.5;
            sq += v * v;
            if (Math.abs(v) > peak) peak = Math.abs(v);
          }
          takes.push({ feat, rms: Math.sqrt(sq / d.length), peak });
        }
        out.push({ track, flavor, err, takes, rms: takes[0].rms, peak: Math.max(takes[0].peak, takes[1].peak) });
      }
    }
    return out;
  }, { ONLY_TRACKS: ONLY, RENDER_SEC: 1.1 });

  console.log(`\nRendered ${results.length} kits across ${new Set(results.map((r) => r.track)).size} tracks\n`);

  const threw = results.filter((r) => r.err);
  check("no kit throws when played", threw.length === 0,
    threw.slice(0, 4).map((r) => `${r.track}/${r.flavor}: ${r.err}`).join(" | "));

  const silent = results.filter((r) => !r.err && r.peak < 0.002);
  check("no kit renders silence", silent.length === 0,
    silent.map((r) => `${r.track}/${r.flavor}`).join(", "));

  // Within a track, two kits are duplicates when they are no further apart
  // than one kit is from a second render of ITSELF.
  const mean = (r) => r.takes[0].feat.map((v, i) => (v + r.takes[1].feat[i]) / 2);
  const dist = (a, b) => {
    let s = 0;
    for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; }
    return Math.sqrt(s / a.length);
  };
  const byTrack = {};
  for (const r of results) (byTrack[r.track] ||= []).push(r);
  const clones = [];
  const separations = [];
  for (const [track, list] of Object.entries(byTrack)) {
    const usable = list.filter((r) => !r.err && r.takes.length === 2);
    if (usable.length < 2) continue;
    // How much does a kit differ from a second render of ITSELF? Most kits
    // randomise pitch and noise per hit, so this is never zero, and it is the
    // scale everything else has to be judged against.
    const selfs = usable.map((r) => dist(r.takes[0].feat, r.takes[1].feat)).sort((a, b) => a - b);
    const medSelf = selfs[Math.floor(selfs.length / 2)];
    const crosses = [];
    for (let i = 0; i < usable.length; i++) {
      for (let j = i + 1; j < usable.length; j++) {
        // Compare the MEAN of both takes rather than one take each. With a
        // single take the cross-distance carries the full per-hit randomness
        // of two kits, so which pair comes out closest changes between runs -
        // the test flagged a different pair each time it ran.
        const d = dist(mean(usable[i]), mean(usable[j]));
        crosses.push([d, usable[i].flavor, usable[j].flavor]);
      }
    }
    crosses.sort((a, b) => a[0] - b[0]);
    const medCross = crosses[Math.floor(crosses.length / 2)][0];
    separations.push([track, medCross / Math.max(medSelf, 1e-6), crosses[0]]);
    // What counts as a duplicate, and what does not.
    //
    // The thing worth catching is a flavor with no synthesis branch, which
    // falls through to the default and is another kit under a second name.
    // What is NOT worth failing on is two kits that merely sound similar: the
    // 31 hi-hats are all one recipe - filtered noise - with different corner
    // frequencies and decays, so some pairs are inevitably close, and failing
    // on those says nothing useful.
    //
    // Because renders are now seeded, a shared code path produces a distance
    // of exactly zero rather than "somewhere in the noise", so the two cases
    // genuinely separate and the threshold can sit very low without either
    // missing clones or flagging cousins. medSelf below should be 0 for the
    // same reason, and is checked rather than assumed - if a voice reaches
    // for entropy some other way, that assumption is silently wrong and the
    // clone check goes back to being unreliable.
    // Three scales, cleanly separated, which is why this number is not
    // fiddly: a true clone measures exactly 0; a kit re-rendered against
    // itself measures ~1e-6 (floating-point, not randomness - the renders are
    // seeded); and the closest genuinely-different pair on any track measures
    // ~0.03. Anything in between is a clone.
    const threshold = 1e-3;
    for (const [d, a, b] of crosses) {
      if (d < threshold) clones.push(`${track}: ${a} == ${b} (${d.toExponential(2)})`);
    }
    if (medSelf > threshold) {
      clones.push(`${track}: renders are not reproducible (a kit differs from ` +
                  `itself by ${medSelf.toExponential(2)}), so the clone check cannot be trusted`);
    }
  }
  check("no two kits on a track are the same sound", clones.length === 0,
    clones.slice(0, 6).join(", ") + (clones.length > 6 ? ` (+${clones.length - 6})` : ""));

  console.log("\n  how far apart kits are, per track (median between-kit / median same-kit)");
  for (const [track, ratio, closest] of separations.sort((a, b) => a[1] - b[1])) {
    const crowded = closest[0] < 0.05 ? "   <- closest pair is very close" : "";
    console.log(`    ${track.padEnd(12)} ${ratio.toFixed(1).padStart(7)}x   closest: ${closest[1]}/${closest[2]} (${closest[0].toFixed(3)})${crowded}`);
  }

  // Show what the newly added kits measure, so a human can sanity-check them.
  const NEW = new Set(["trance", "acid", "harp", "bellarp", "808tom", "floor", "gatedtom",
                       "bright", "wide", "gritty"]);
  console.log("\n  newly added kits");
  for (const r of results.filter((x) => NEW.has(x.flavor))) {
    console.log(`    ${(r.track + "/" + r.flavor).padEnd(20)} rms ${r.rms.toFixed(4)}  peak ${r.peak.toFixed(3)}`);
  }

  check("no page errors", errors.length === 0, errors.slice(0, 2).join(" | "));

  await browser.close();
  console.log(`\n${failures ? failures + " FAILURE(S)" : "all checks passed"}\n`);
  process.exit(failures ? 1 : 0);
})();
