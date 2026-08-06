// Verify the rating equation before trusting anything it says.
//
// Three questions, in order of how badly a wrong answer would matter:
//   1. Is integratedLoudness actually LUFS? Checked against a sine wave whose
//      loudness can be worked out on paper, and against the EBU Tech 3341
//      reference case (-23 LUFS for a 1kHz sine at 0.1 amplitude, mono).
//   2. Does the spectral band split actually separate bands? Checked with
//      pure tones, which must land in the band that contains them.
//   3. Does rateAudio discriminate, and does it BLAME THE RIGHT TERM?
//      Checked by building mixes broken in known, specific ways.
//   4. Does ratePattern run on every genre and produce a spread?
//
// Run: node tools/test-rating.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
// The sources are concatenated into one script rather than run one at a
// time, because a top-level `const` in vm.runInContext is scoped to that
// single script and would not be visible to the next one.
const FILES = ["js/theory.js", "js/instruments.js", "js/performance.js", "js/learning.js",
               "js/policy.js", "js/audio-analysis.js", "js/artists.js", "js/midi-export.js",
               "js/production.js", "js/patterns.js", "js/rating.js"];
const src = FILES.map((f) => fs.readFileSync(path.join(root, f), "utf8")).join("\n;\n");
const sandbox = { module: { exports: {} }, console, JSON };
vm.createContext(sandbox);
const api = vm.runInContext(
  src + `\n;({ integratedLoudness, rateAudio, ratePattern, measureAudio, ratingVerdict,
    ratingWeaknesses, STYLES, generateVariation, K_SHELF, K_HPF, LOUDNESS_TARGET,
    biquad, lpfCoeffs, hpfCoeffs })`,
  sandbox, { filename: "bundle.js" });

const { integratedLoudness, rateAudio, ratePattern, measureAudio,
        ratingVerdict, ratingWeaknesses, STYLES, generateVariation,
        biquad, lpfCoeffs, hpfCoeffs } = api;

const SR = 48000;
let failures = 0;
function check(name, ok, detail) {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!ok) failures++;
}

// --- 1. Loudness ------------------------------------------------------------
// The K filter's gain at a frequency follows from its coefficients, so the
// expected LUFS of a sine is arithmetic rather than a guess.
function kGainDb(freq) {
  const w = (2 * Math.PI * freq) / SR;
  const H = (c) => {
    const [b0, b1, b2] = c.b, a1 = c.a[1], a2 = c.a[2];
    const cw = Math.cos(w), sw = Math.sin(w), c2 = Math.cos(2 * w), s2 = Math.sin(2 * w);
    const nr = b0 + b1 * cw + b2 * c2, ni = -(b1 * sw + b2 * s2);
    const dr = 1 + a1 * cw + a2 * c2, di = -(a1 * sw + a2 * s2);
    return Math.sqrt((nr * nr + ni * ni) / (dr * dr + di * di));
  };
  return 20 * Math.log10(H(api.K_SHELF) * H(api.K_HPF));
}

function sine(freq, amp, seconds, nCh = 1) {
  const chans = [];
  for (let c = 0; c < nCh; c++) {
    const ch = new Float32Array(Math.floor(SR * seconds));
    for (let i = 0; i < ch.length; i++) ch[i] = amp * Math.sin((2 * Math.PI * freq * i) / SR);
    chans.push(ch);
  }
  return chans;
}

console.log("\n1. Integrated loudness against arithmetic");
for (const [amp, nCh] of [[1.0, 2], [0.1, 2], [0.1, 1], [0.5, 2]]) {
  const expect = -0.691 + 10 * Math.log10((nCh * amp * amp) / 2) + kGainDb(1000);
  const got = integratedLoudness(sine(1000, amp, 5, nCh), SR);
  check(`1kHz sine amp=${amp} ${nCh}ch`, Math.abs(got - expect) < 0.15,
    `got ${got.toFixed(2)} LUFS, expected ${expect.toFixed(2)}`);
}
{
  const a = integratedLoudness(sine(1000, 0.4, 5, 2), SR);
  const b = integratedLoudness(sine(1000, 0.2, 5, 2), SR);
  check("halving amplitude = -6.02 LU", Math.abs((a - b) - 6.0206) < 0.02, `${(a - b).toFixed(3)} LU`);
}
{
  const [l, r] = sine(1000, 0.3, 5, 2);
  const pad = (ch) => { const o = new Float32Array(ch.length * 2); o.set(ch); return o; };
  const plain = integratedLoudness([l, r], SR);
  const padded = integratedLoudness([pad(l), pad(r)], SR);
  check("gating ignores appended silence", Math.abs(plain - padded) < 0.2,
    `${plain.toFixed(2)} vs ${padded.toFixed(2)} LUFS`);
}

// --- 2. Band split ----------------------------------------------------------
console.log("\n2. Spectral bands separate a pure tone");
const BAND_OF = { 40: 0, 120: 1, 800: 2, 3000: 3, 10000: 4 };
for (const f of Object.keys(BAND_OF).map(Number)) {
  const t = sine(f, 0.5, 4, 2);
  const m = measureAudio(t, SR);
  const share = m.bands[BAND_OF[f]];
  check(`${f}Hz lands in band ${BAND_OF[f]}`, share > 0.9,
    `${(share * 100).toFixed(1)}% (all: ${m.bands.map((b) => (b * 100).toFixed(0)).join("/")})`);
}

// --- 3. Does the score discriminate, and blame the right thing? -------------
function rand(seed) { let s = seed >>> 0; return () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff); }

// A fixture that is provably shaped like a mix.
//
// Hand-tuning oscillator gains until the spectrum "looks right" does not
// work - a first attempt that sounded reasonable on paper measured 0.2%
// of its energy above 2kHz, because short noise bursts carry almost none.
// So each band is generated separately, measured, and then scaled to hit an
// EXACT energy share. The fixture is therefore known to be what it claims,
// and a defect is injected by asking for a wrong share rather than by
// guessing at a gain.
function buildMix(opts = {}) {
  const { seconds = 20, bpm = 90, crush = 0, targetLufs = -9, width = 0.5,
          sections = true, pulse = true,
          // Shares that a competent mix actually has, and the rater's targets.
          shares = { sub: 0.16, low: 0.30, mid: 0.34, high: 0.20 } } = opts;
  const n = SR * seconds;
  const spb = (60 / bpm) * SR;
  const rnd = rand(7);
  const chord = [261.63, 329.63, 392.0, 523.25];   // C-E-G-C, sits in the mids

  const sub = new Float64Array(n), low = new Float64Array(n);
  const mid = new Float64Array(n), high = new Float64Array(n);
  // A decorrelated partner for the mid/high content, used to make width.
  const side = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    const t = i / SR;
    sub[i] = Math.sin(2 * Math.PI * 48 * t);
    low[i] = Math.sin(2 * Math.PI * 110 * t) + 0.4 * Math.sin(2 * Math.PI * 165 * t);
    let m = 0, sd = 0;
    for (let k = 0; k < chord.length; k++) {
      m  += (1 / (1 + k * 0.4)) * Math.sin(2 * Math.PI * chord[k] * t + k);
      sd += (1 / (1 + k * 0.4)) * Math.sin(2 * Math.PI * chord[k] * t + k + 1.7);
    }
    mid[i] = m;
    const w0 = rnd() * 2 - 1, w1 = rnd() * 2 - 1;
    high[i] = w0 * 0.8 + 0.5 * Math.sin(2 * Math.PI * 9000 * t);
    side[i] = sd * 0.7 + w1 * 0.5;
    if (pulse) {
      const kt = (i % spb) / SR;
      sub[i] += 2.2 * Math.exp(-kt * 15) * Math.sin(2 * Math.PI * (45 + 80 * Math.exp(-kt * 45)) * kt);
      const ht = (i % (spb / 2)) / SR;
      high[i] += 6 * Math.exp(-ht * 120) * (rnd() * 2 - 1);
      const st = (i % (spb * 2)) / SR;
      mid[i] += 4 * Math.exp(-st * 24) * Math.sin(2 * Math.PI * 420 * st);
    }
  }

  // Confine each component to its own band before scaling. Without this the
  // "exact share" claim would be false: the bright component is noise, which
  // is broadband, so normalising its TOTAL energy would spray a good deal of
  // it into the low and mid bands and the fixture would not be what it says.
  const bandLimit = (a, lo, hi) => {
    let sig = a;
    if (lo) sig = biquad(biquad(sig, hpfCoeffs(lo, SR)), hpfCoeffs(lo, SR));
    if (hi < SR * 0.44) sig = biquad(biquad(sig, lpfCoeffs(hi, SR)), lpfCoeffs(hi, SR));
    return sig;
  };
  const parts = [
    [bandLimit(sub, 0, 60), shares.sub],
    [bandLimit(low, 60, 250), shares.low],
    [bandLimit(mid, 250, 2000), shares.mid],
    [bandLimit(high, 2000, 16000), shares.high],
  ];
  // Scale each band so its share of total energy is exactly as requested.
  const norm = (a, share) => {
    let e = 0;
    for (let i = 0; i < n; i++) e += a[i] * a[i];
    const g = e > 0 ? Math.sqrt(share / (e / n)) : 0;
    for (let i = 0; i < n; i++) a[i] *= g;
    return a;
  };
  for (const [a, share] of parts) norm(a, share);
  const [subB, lowB, midB, highB] = parts.map((p) => p[0]);
  // The width signal has to carry the SAME spectral balance as the mix.
  // A first version used broadband noise, which added mid and top on its own
  // and pulled the measured shares to 7/28/50/14 when the fixture claimed
  // 16/30/34/20 - so the band terms were testing something other than what
  // the case set. Band-limiting it the same way keeps width orthogonal to
  // spectral balance, which is the point of injecting one defect at a time.
  const sideParts = [
    [bandLimit(side, 250, 2000), shares.mid],
    [bandLimit(side, 2000, 16000), shares.high],
  ];
  for (const [a, share] of sideParts) norm(a, share);
  const sideSig = new Float64Array(n);
  for (let i = 0; i < n; i++) sideSig[i] = sideParts[0][0][i] + sideParts[1][0][i];

  const L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let m = subB[i] + lowB[i] + midB[i] + highB[i];
    // Section-to-section level movement, applied to both channels equally so
    // it changes the dynamics reading without touching the band shares.
    const env = sections ? 0.55 + 0.55 * (Math.floor(i / SR / 4) % 2) : 1;
    m *= env;
    // 1.23 rather than an arbitrary constant: with L = m + s and R = m - s
    // the correlation is (1 - k)/(1 + k) for k = E[s^2]/E[m^2], so k = 0.379
    // gives the 0.45 that a wide-but-mono-safe mix sits at, and sqrt(0.379)
    // = 0.616 = 0.5 * 1.23 at the default width.
    const s = sideSig[i] * width * 1.23 * env;
    L[i] = m + s;
    R[i] = m - s;
  }
  // Normalise to a LOUDNESS target rather than a peak level. Peak
  // normalisation is not what anyone does to a mix, and it left the "good"
  // fixture at -13 LUFS against a -9 target, so its own weakest term was
  // loudness and several broken mixes outranked it.
  let pk = 0;
  for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
  const pre = 0.6 / (pk || 1);
  for (let i = 0; i < n; i++) {
    L[i] *= pre; R[i] *= pre;
    if (crush) {
      L[i] = Math.tanh(L[i] * (1 + crush * 14)) / (1 + crush * 2.2);
      R[i] = Math.tanh(R[i] * (1 + crush * 14)) / (1 + crush * 2.2);
    }
  }
  const now = integratedLoudness([L, R], SR);
  let g = Math.pow(10, (targetLufs - now) / 20);
  // Never let the fixture clip - that would inject a headroom defect on top
  // of whatever the case was actually meant to test.
  let pk2 = 0;
  for (let i = 0; i < n; i++) pk2 = Math.max(pk2, Math.abs(L[i]), Math.abs(R[i]));
  g = Math.min(g, 0.85 / (pk2 || 1));
  for (let i = 0; i < n; i++) { L[i] *= g; R[i] *= g; }
  return [L, R];
}

console.log("\n3. Discrimination between deliberately good and broken mixes");
// Each case is the good mix with exactly ONE thing wrong, so an attribution
// failure cannot be blamed on the fixture being broken in several ways.
// crush 0.3 is what a mastered hip-hop mix actually looks like: it lands at
// -9.5 LUFS with 11.3dB of crest. Less drive and the fixture cannot reach
// the loudness target at all without clipping, which was injecting a
// loudness defect into the reference mix and letting broken cases outrank it.
const GOOD = { crush: 0.3, targetLufs: -9 };
const cases = {
  good:    { ...GOOD },
  quiet:   { ...GOOD, targetLufs: -32, crush: 0 },
  crushed: { ...GOOD, crush: 2.4 },
  allSub:  { ...GOOD, shares: { sub: 0.62, low: 0.26, mid: 0.10, high: 0.02 } },
  harsh:   { ...GOOD, shares: { sub: 0.08, low: 0.16, mid: 0.22, high: 0.54 } },
  mono:    { ...GOOD, width: 0 },
  noPulse: { ...GOOD, pulse: false },
  flat:    { ...GOOD, sections: false },
};
const rated = {};
for (const [name, o] of Object.entries(cases)) {
  const r = rateAudio(buildMix(o), SR, { genre: "hiphop" });
  rated[name] = r;
  const weak = ratingWeaknesses(r, 2).map((t) => t.key).join(",") || "-";
  console.log(`    ${name.padEnd(8)} ${String(r.score).padStart(5)}  ${ratingVerdict(r.score).padEnd(26)} weakest: ${weak}`);
}
if (process.env.RATING_DEBUG) {
  for (const [name, r] of Object.entries(rated)) {
    console.log("\n  == " + name + "  " + r.score);
    for (const t of r.terms) console.log("     " + t.key.padEnd(10) + t.score.toFixed(3).padStart(6) + "  w=" + t.weight + "  " + t.detail);
  }
}
const S = (k) => rated[k].score;
check("good scores well in absolute terms", S("good") >= 72, `${S("good")}`);
for (const bad of ["quiet", "crushed", "allSub", "harsh", "mono", "noPulse", "flat"]) {
  check(`good beats ${bad}`, S("good") > S(bad) + 2, `${S("good")} vs ${S(bad)}`);
}

// The weakest term must name the defect that was actually injected. This is
// the check that matters most: a score that moves for the wrong reason is
// worse than no score at all.
console.log("\n   Attribution — the weakest term must name the injected defect");
const blames = { quiet: "loudness", crushed: "crest", allSub: "sub", harsh: "high",
                 mono: "stereo", noPulse: "pulse", flat: "dynamics" };
for (const [name, key] of Object.entries(blames)) {
  const weak = ratingWeaknesses(rated[name], 2).map((t) => t.key);
  check(`"${name}" is blamed on ${key}`, weak.includes(key), `weakest: ${weak.join(",") || "none"}`);
}

// --- 4. Symbolic rating across every genre ---------------------------------
console.log("\n4. ratePattern over every genre");
const rows = [];
for (const id of Object.keys(STYLES)) {
  try {
    const v = generateVariation(STYLES[id], 4);
    const r = ratePattern(v.genStyle || STYLES[id], v);
    rows.push([id, r]);
  } catch (e) {
    check(`${id} generates and rates`, false, e.message);
  }
}
for (const [id, r] of rows) {
  const weak = ratingWeaknesses(r, 2).map((t) => t.key).join(",") || "-";
  console.log(`    ${id.padEnd(12)} ${String(r.score).padStart(5)}  ${ratingVerdict(r.score).padEnd(26)} weakest: ${weak}`);
}
const vals = rows.map(([, r]) => r.score);
check("every genre rated", rows.length >= 15, `${rows.length} genres`);
check("all 7 symbolic terms present", rows.every(([, r]) => r.terms.length === 7),
  `min ${Math.min(...rows.map(([, r]) => r.terms.length))} terms`);
check("generated beats score respectably", Math.min(...vals) > 50,
  `range ${Math.min(...vals)}–${Math.max(...vals)}`);
check("scores vary between genres", Math.max(...vals) - Math.min(...vals) > 3,
  `spread ${(Math.max(...vals) - Math.min(...vals)).toFixed(1)}`);

// --- 5. Symbolic negative controls -----------------------------------------
// Every genre scoring well is not evidence that ratePattern works - the
// generator and the rater were built from the same theory, so a high score
// could just be the program marking its own homework. These are patterns
// broken on purpose. If they score as well as a real one, the symbolic side
// is measuring nothing.
console.log("\n5. ratePattern must reject deliberately broken patterns");
const refStyle = STYLES.hiphop;
const refPattern = generateVariation(refStyle, 4);
const refScore = ratePattern(refPattern.genStyle || refStyle, refPattern).score;

const grid = (fn, len = 64) => Array.from({ length: len }, (_, i) => fn(i));
const brokenCases = {
  "empty":        { instruments: { kick: grid(() => 0) }, barRootDegrees: [0, 0, 0, 0] },
  "no downbeat":  { instruments: {
                      kick: grid((i) => (i % 16 === 7 ? 1 : 0)),
                      snare: grid((i) => (i % 16 === 5 ? 1 : 0)),
                      hihat: grid((i) => (i % 3 === 1 ? 1 : 0)),
                      bass: grid((i) => (i % 4 === 2 ? { degrees: [0] } : null)),
                    }, barRootDegrees: [0, 3, 4, 0] },
  "every slot on": { instruments: {
                      kick: grid(() => 1), snare: grid(() => 1), hihat: grid(() => 1),
                      lead: grid((i) => ({ degrees: [i % 30] })),
                    }, barRootDegrees: [0, 3, 4, 0] },
  "one chord, one note": { instruments: {
                      kick: grid((i) => (i % 16 === 0 ? 1 : 0)),
                      snare: grid((i) => (i % 16 === 8 ? 1 : 0)),
                      hihat: grid((i) => (i % 4 === 0 ? 1 : 0)),
                      lead: grid((i) => (i % 16 === 0 ? { degrees: [0] } : null)),
                    }, barRootDegrees: [0, 0, 0, 0] },
};
console.log(`    ${"(real generated beat)".padEnd(22)} ${String(refScore).padStart(5)}`);
for (const [name, p] of Object.entries(brokenCases)) {
  const r = ratePattern(refStyle, p);
  console.log(`    ${name.padEnd(22)} ${String(r.score).padStart(5)}  weakest: ${ratingWeaknesses(r, 2).map((t) => t.key).join(",") || "-"}`);
  check(`"${name}" scores below a real beat`, r.score < refScore - 10,
    `${r.score} vs ${refScore}`);
}

console.log(`\n${failures ? failures + " FAILURE(S)" : "all checks passed"}\n`);
process.exit(failures ? 1 : 0);
