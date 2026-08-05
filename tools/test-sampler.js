// The sampler must actually play the audio it was given.
//
// Every other voice in the program is synthesized, so "does it make a sound"
// is answered by the synthesis code. A sample is different: the audio comes
// from outside, travels through decode -> slice -> flavor lookup -> playback,
// and any one of those links can break silently. In particular, a flavor
// string that does not resolve falls straight through to the synth, which
// still makes a sound - so "I hear something" is NOT evidence the sample
// played. The checks below compare against the synth's own output to tell
// the difference.
//
// The test audio is generated here rather than shipped, because no sample
// pack ships with the program.
//
// Run: node tools/test-sampler.js
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

  const r = await page.evaluate(async () => {
    const SR = 44100;
    const out = {};

    // ---- Build a test "loop": four clearly separated bursts at four
    // distinct pitches, so both the slicer and the playback are checkable
    // against something whose right answer is known by construction.
    const ctx = new OfflineAudioContext(1, SR * 2, SR);
    const buf = ctx.createBuffer(1, SR * 2, SR);
    const d = buf.getChannelData(0);
    const HITS = [0.05, 0.55, 1.05, 1.55];
    const FREQS = [220, 330, 440, 550];
    HITS.forEach((t0, i) => {
      const start = Math.floor(t0 * SR);
      for (let i2 = 0; i2 < SR * 0.22; i2++) {
        const t = i2 / SR;
        d[start + i2] = Math.exp(-t * 14) * Math.sin(2 * Math.PI * FREQS[i] * t) * 0.8;
      }
    });

    // ---- Slicing --------------------------------------------------------
    const slices = sliceOnTransients(buf);
    out.sliceCount = slices.length;
    out.sliceStarts = slices.map((s) => +s.start.toFixed(3));

    // ---- Registration ---------------------------------------------------
    const item = SampleBank.add("test-loop.wav", buf, { slices, mode: "sliced" });
    out.flavor = item.flavor;
    out.resolves = !!SampleBank.resolve(item.flavor);
    out.resolvesGarbage = !!SampleBank.resolve("sample:nope");
    out.resolvesSynth = !!SampleBank.resolve("boombap");

    // ---- Playback, rendered offline -------------------------------------
    async function render(fn) {
      const off = new OfflineAudioContext(2, SR * 1, SR);
      const e = new BeatEngine();
      e.ensureContext(off);
      fn(e);
      const b = await off.startRendering();
      const c = b.getChannelData(0);
      let sq = 0, peak = 0;
      for (let i = 0; i < c.length; i++) { sq += c[i] * c[i]; if (Math.abs(c[i]) > peak) peak = Math.abs(c[i]); }
      // Dominant frequency by counting zero crossings over the loud part.
      //
      // The obvious way to write this is wrong, and it reported 0Hz for every
      // signal including a plain sine: skipping samples whose magnitude is
      // below a threshold skips exactly the samples NEAR ZERO, which are the
      // ones where crossings happen. So find the loud REGION first, then
      // count every crossing inside it.
      let lo = -1, hi = -1;
      for (let i = 0; i < c.length; i++) {
        if (Math.abs(c[i]) > peak * 0.15) { if (lo < 0) lo = i; hi = i; }
      }
      let zc = 0;
      for (let i = lo + 1; i <= hi && hi > lo; i++) {
        if ((c[i] >= 0) !== (c[i - 1] >= 0)) zc++;
      }
      const span = hi > lo ? (hi - lo) / SR : 0;
      return { rms: Math.sqrt(sq / c.length), peak, hz: span > 0 ? zc / 2 / span : 0 };
    }

    // A sample on the kick track must NOT sound like the kick synth.
    out.sampleOnKick = await render((e) => e.playKick(0.02, 0.9, item.flavor));
    out.synthKick = await render((e) => e.playKick(0.02, 0.9, "boombap"));

    // Each slice must play its own pitch: step 0 -> 220Hz, step 2 -> 440Hz.
    out.slice0 = await render((e) => e.playSampleFlavor("perc", item.flavor, 0.02, 0.9, 440, 1, 0));
    out.slice2 = await render((e) => e.playSampleFlavor("perc", item.flavor, 0.02, 0.9, 440, 1, 2));

    // Pitched mode must transpose: same slice, an octave apart.
    item.mode = "pitched";
    item.rootMidi = 69;                     // call the recording an A4
    out.pitchLow = await render((e) => e.playSampleFlavor("bass", item.flavor, 0.02, 0.9, 220, 0.8, 0));
    out.pitchHigh = await render((e) => e.playSampleFlavor("bass", item.flavor, 0.02, 0.9, 440, 0.8, 0));

    // An unknown sample id must fall through to the synth rather than
    // throwing or going silent.
    out.unknownFalls = await render((e) => e.playKick(0.02, 0.9, "sample:doesnotexist"));

    SampleBank.clear();
    out.clearedEmpty = SampleBank.list().length === 0;
    return out;
  });

  console.log("\n1. Slicing a loop at its transients");
  console.log(`    found ${r.sliceCount} slices at ${r.sliceStarts.join(", ")}s`);
  check("finds the four hits", r.sliceCount === 4, `${r.sliceCount} slices`);
  // Built at 0.05 / 0.55 / 1.05 / 1.55, so each detected onset should be
  // within a frame or two of those.
  const want = [0.05, 0.55, 1.05, 1.55];
  const close = r.sliceStarts.every((s, i) => want[i] !== undefined && Math.abs(s - want[i]) < 0.03);
  check("slice points land on the actual hits", r.sliceCount === 4 && close, r.sliceStarts.join(", "));

  console.log("\n2. Registering and resolving");
  check("a loaded sample resolves from its flavor", r.resolves);
  check("an unknown sample id resolves to nothing", r.resolvesGarbage === false);
  check("a synth flavor is not mistaken for a sample", r.resolvesSynth === false);
  check("clearing empties the bank", r.clearedEmpty);

  console.log("\n3. Playback");
  check("a sample on the kick track makes sound",
    r.sampleOnKick.peak > 0.02, `peak ${r.sampleOnKick.peak.toFixed(3)}`);
  // The decisive one: if the flavor did not resolve, playKick would have
  // synthesized and this would match the synth.
  const distinct = Math.abs(r.sampleOnKick.hz - r.synthKick.hz) > 40;
  check("it plays the SAMPLE, not the kick synth", distinct,
    `sample ${r.sampleOnKick.hz.toFixed(0)}Hz vs synth ${r.synthKick.hz.toFixed(0)}Hz`);

  console.log("\n4. Slices are addressable");
  console.log(`    step 0 -> ${r.slice0.hz.toFixed(0)}Hz (built at 220), step 2 -> ${r.slice2.hz.toFixed(0)}Hz (built at 440)`);
  check("step 0 plays the first slice", Math.abs(r.slice0.hz - 220) < 60, `${r.slice0.hz.toFixed(0)}Hz`);
  check("step 2 plays the third slice", Math.abs(r.slice2.hz - 440) < 90, `${r.slice2.hz.toFixed(0)}Hz`);

  console.log("\n5. Pitched playback transposes");
  const ratio = r.pitchHigh.hz / (r.pitchLow.hz || 1);
  check("an octave up doubles the frequency", ratio > 1.7 && ratio < 2.3,
    `${r.pitchLow.hz.toFixed(0)}Hz -> ${r.pitchHigh.hz.toFixed(0)}Hz (ratio ${ratio.toFixed(2)})`);

  console.log("\n6. Failure is graceful");
  check("an unknown sample id still makes a sound (falls back to the synth)",
    r.unknownFalls.peak > 0.02, `peak ${r.unknownFalls.peak.toFixed(3)}`);
  check("no page errors", errors.length === 0, errors.slice(0, 2).join(" | "));

  await browser.close();
  console.log(`\n${failures ? failures + " FAILURE(S)" : "all checks passed"}\n`);
  process.exit(failures ? 1 : 0);
})();
