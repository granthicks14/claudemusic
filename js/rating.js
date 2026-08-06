// ---------------------------------------------------------------------------
// Rating a beat
// ---------------------------------------------------------------------------
// A single number for "how good is this", built so that every term is
// measurable, every weight is written down, and the result can explain
// itself. It works on two kinds of input:
//
//   ACOUSTIC   any audio - a file the user brings, or the program's own
//              output rendered offline. Judged on the things a mastering
//              engineer actually measures.
//   SYMBOLIC   a generated pattern, where the notes themselves are
//              available. Judged on musical structure.
//
// ---------------------------------------------------------------------------
// THE EQUATION
// ---------------------------------------------------------------------------
//
//     Rating = 100 * ( Σ wᵢ · gᵢ(xᵢ) ) / ( Σ wᵢ )
//
// where xᵢ is a measured quantity, wᵢ is its weight, and gᵢ maps the
// measurement to [0,1].
//
// The important design decision is the shape of gᵢ. Almost nothing in music
// production is "more is better" - loudness, dynamic range, brightness and
// stereo width all have a BAND that sounds right and get worse in both
// directions. So band-limited terms use a Gaussian tolerance curve
//
//     g(x) = exp( -((x - μ)/σ)² )
//
// which is 1.0 exactly on target, ~0.37 one tolerance away, and decays
// smoothly rather than falling off a cliff. μ is the target and σ is how
// much deviation still counts as fine. Genuinely monotone terms (a beat
// being clearly present, a key being clearly established) use a saturating
// ramp instead:
//
//     g(x) = clamp( (x - lo) / (hi - lo), 0, 1 )
//
// Every μ, σ, lo and hi below is a number from production practice, and each
// one carries the reason it has that value.
//
// A weighted mean is used rather than a sum so the scale is stable when a
// term cannot be measured - a mono file has no stereo width, so that term is
// dropped from both numerator and denominator instead of scoring zero and
// dragging an otherwise good mix down.

function gaussianTerm(x, mu, sigma) {
  if (!isFinite(x)) return null;
  const z = (x - mu) / sigma;
  return Math.exp(-z * z);
}

function rampTerm(x, lo, hi) {
  if (!isFinite(x)) return null;
  return Math.max(0, Math.min(1, (x - lo) / (hi - lo)));
}

// ---------------------------------------------------------------------------
// Loudness: ITU-R BS.1770 K-weighting
// ---------------------------------------------------------------------------
// LUFS is the broadcast and streaming standard for loudness, and it is not
// plain RMS: the signal is first passed through a two-stage "K" filter that
// approximates how the head and ear weight frequency - a high shelf standing
// in for the acoustic effect of a head in a soundfield, then a high-pass
// that discounts the very low frequencies the ear is insensitive to. Only
// then is mean square taken.
//
// The coefficients below are the ones published in BS.1770 for 48kHz. They
// are used directly, so the measurement is exact at 48k and drifts slightly
// at other rates; for a quality score, where the target has a tolerance of
// several LU anyway, that is well inside the noise. It is flagged rather
// than hidden.
const K_SHELF = { b: [1.53512485958697, -2.69169618940638, 1.19839281085285],
                  a: [1, -1.69065929318241, 0.73248077421585] };
const K_HPF   = { b: [1.0, -2.0, 1.0],
                  a: [1, -1.99004745483398, 0.99007225036621] };

// biquad, lpfCoeffs and hpfCoeffs live in audio-analysis.js, which loads
// first - they are DSP primitives that the onset detector needs too, and
// having one copy means the band splits here and there cannot drift apart.

// Integrated loudness in LUFS, with BS.1770's absolute gate at -70 LUFS and
// the relative gate 10 LU below the ungated mean - the gating is what stops
// silence between sections from dragging the reading down.
function integratedLoudness(channels, sampleRate) {
  const blockLen = Math.floor(sampleRate * 0.4);      // 400ms blocks
  const step = Math.floor(blockLen * 0.25);           // 75% overlap
  if (!channels.length || channels[0].length < blockLen) return null;

  const filtered = channels.map((ch) => biquad(biquad(ch, K_SHELF), K_HPF));
  const n = filtered[0].length;
  const blocks = [];
  for (let start = 0; start + blockLen <= n; start += step) {
    let sum = 0;
    for (const ch of filtered) {
      for (let i = 0; i < blockLen; i++) sum += ch[start + i] * ch[start + i];
    }
    const meanSq = sum / blockLen;
    blocks.push(-0.691 + 10 * Math.log10(meanSq + 1e-12));
  }
  if (!blocks.length) return null;

  const absGated = blocks.filter((l) => l > -70);
  if (!absGated.length) return null;
  // Relative gate: mean of the absolutely-gated blocks, minus 10 LU.
  const meanPow = absGated.reduce((a, l) => a + Math.pow(10, (l + 0.691) / 10), 0) / absGated.length;
  const relGate = -0.691 + 10 * Math.log10(meanPow) - 10;
  const gated = blocks.filter((l) => l > -70 && l > relGate);
  if (!gated.length) return null;
  const finalPow = gated.reduce((a, l) => a + Math.pow(10, (l + 0.691) / 10), 0) / gated.length;
  return -0.691 + 10 * Math.log10(finalPow);
}

// ---------------------------------------------------------------------------
// Acoustic measurements
// ---------------------------------------------------------------------------
function measureAudio(channels, sampleRate) {
  const m = {};
  const L = channels[0];
  const Rch = channels[1] || null;
  const n = L.length;

  // Spectral balance, arrangement dynamics, tempo and key are all measured
  // on the MONO SUM, not on the left channel. Judging the balance of a mix
  // from one side of it is simply wrong: anything panned counts once instead
  // of twice, so widening a mix appeared to change its tonal balance. On the
  // sum, the side content cancels exactly and width stops leaking into the
  // frequency terms - which is also how a mix is checked in practice.
  let mono = L;
  if (Rch) {
    mono = new Float64Array(n);
    for (let i = 0; i < n; i++) mono[i] = (L[i] + Rch[i]) * 0.5;
  }

  m.lufs = integratedLoudness(channels, sampleRate);

  // True peak, approximated by 4x linear interpolation between samples -
  // an inter-sample peak can sit meaningfully above any actual sample,
  // which is why the standard measures it oversampled.
  let peak = 0;
  for (const ch of channels) {
    for (let i = 1; i < ch.length; i++) {
      const a = ch[i - 1], b = ch[i];
      peak = Math.max(peak, Math.abs(a), Math.abs(b));
      for (let k = 1; k < 4; k++) peak = Math.max(peak, Math.abs(a + ((b - a) * k) / 4));
    }
  }
  m.truePeakDb = 20 * Math.log10(peak + 1e-12);

  // Crest factor: peak over RMS, in dB. The gap between the transients and
  // the body of the mix. Too small and the track is crushed and fatiguing;
  // too large and nothing is glued together.
  let sq = 0;
  for (const ch of channels) for (let i = 0; i < ch.length; i++) sq += ch[i] * ch[i];
  const rms = Math.sqrt(sq / (n * channels.length));
  m.crestDb = 20 * Math.log10((peak + 1e-12) / (rms + 1e-12));

  // Spectral balance: five bands, as a share of total energy.
  //
  // The filters have to be steep enough to actually separate the bands. A
  // one-pole difference rolls off at 6dB/octave, and measured with pure
  // tones that leaks badly - a 120Hz tone put 28% of its energy in the
  // "below 60Hz" band, so the sub reading was dominated by bass notes that
  // are not sub at all. These are cascaded Butterworth sections: two
  // biquads per edge, 24dB/octave, which puts a tone where it belongs.
  const bands = [[0, 60], [60, 250], [250, 2000], [2000, 6000], [6000, 20000]];
  const energies = bands.map((edges) => {
    const [lo, hi] = edges;
    let sig = mono;
    if (lo) { sig = biquad(biquad(sig, hpfCoeffs(lo, sampleRate)), hpfCoeffs(lo, sampleRate)); }
    const top = Math.min(hi, sampleRate * 0.45);
    if (top < sampleRate * 0.44) {
      sig = biquad(biquad(sig, lpfCoeffs(top, sampleRate)), lpfCoeffs(top, sampleRate));
    }
    let e = 0;
    for (let i = 0; i < sig.length; i++) e += sig[i] * sig[i];
    return e;
  });
  const totalE = energies.reduce((a, b) => a + b, 0) || 1;
  m.bands = energies.map((e) => e / totalE);
  m.subShare = m.bands[0];
  m.lowShare = m.bands[1];
  m.midShare = m.bands[2];
  m.highShare = m.bands[3] + m.bands[4];

  // Stereo: correlation between channels. +1 is mono, 0 is wide and safe,
  // negative means the two channels are fighting and the mix will partly
  // vanish when summed to mono.
  if (Rch) {
    let sLR = 0, sLL = 0, sRR = 0;
    for (let i = 0; i < n; i++) { sLR += L[i] * Rch[i]; sLL += L[i] * L[i]; sRR += Rch[i] * Rch[i]; }
    m.correlation = sLL && sRR ? sLR / Math.sqrt(sLL * sRR) : 1;
  } else {
    m.correlation = null;
  }

  // Arrangement dynamics: how much the short-term loudness moves over the
  // track. A record that never changes level has no sections.
  const winLen = Math.floor(sampleRate * 1.5);
  const shorts = [];
  for (let s = 0; s + winLen <= n; s += winLen) {
    let e = 0;
    for (let i = 0; i < winLen; i++) e += mono[s + i] * mono[s + i];
    shorts.push(10 * Math.log10(e / winLen + 1e-12));
  }
  // Eight windows, not three. This measures whether a track has SECTIONS,
  // and a four-bar loop does not have sections - it has one idea repeated.
  // Measured over a six-second render the reading was just noise, and it
  // was being reported as the single most common fault across the genres.
  // Below twelve seconds the honest answer is that the question does not
  // apply, so the term is dropped from the average entirely rather than
  // scored on nothing.
  if (shorts.length >= 8) {
    const mu = shorts.reduce((a, b) => a + b, 0) / shorts.length;
    m.dynamicSpreadDb = Math.sqrt(shorts.reduce((a, b) => a + (b - mu) * (b - mu), 0) / shorts.length);
  } else {
    m.dynamicSpreadDb = null;
  }

  // Beat salience: not merely whether a tempo estimate came back - one
  // always does - but how strongly the onset envelope actually repeats at
  // that period. A track with a hard, regular kick scores high; a wash of
  // pad with no rhythm scores low.
  if (typeof detectPulse === "function") {
    const p = detectPulse(mono, sampleRate);
    m.bpm = p.bpm;
    m.pulseSalience = p.salience;
  } else if (typeof detectTempo === "function") {
    m.bpm = detectTempo(mono, sampleRate);
    m.pulseSalience = null;
  }
  if (typeof detectKey === "function") {
    const k = detectKey(mono, sampleRate);
    m.key = k;
    m.keyConfidence = k ? k.correlation : null;
  }
  return m;
}

// Genre loudness targets. Streaming platforms normalise to about -14 LUFS,
// but the level a mix is BUILT at differs by genre: hip-hop and electronic
// records are made hot and dense, acoustic and jazz records are not.
// What "correct" looks like structurally, per genre.
//
// The density, pulse and harmonic-movement targets below started as one set
// of numbers aimed at a dense, drum-led, chord-changing record. That is the
// right default - most of what this program makes is one of those - but it
// is measurably the wrong yardstick for the genres whose identity IS the
// absence of those things. Ambient scored 48/100 while doing exactly what
// ambient does: marked down for a drum grid it is not supposed to fill, a
// pulse it is not supposed to have, and a chord progression it is not
// supposed to move through. Those are the genre, not faults in it - the same
// argument LOUDNESS_TARGET already makes about level.
//
// The bar for adding an entry here is that the genre's records genuinely
// measure differently, not that the program scores badly in it. Only four
// qualify; the other twenty-seven keep the defaults.
const SHAPE_DEFAULT = {
  density: [0.26, 0.13],   // share of the drum grid filled: centre, tolerance
  layers: [9, 4],          // active parts
  pulse: [0.10, 0.55],     // salience ramp: floor, full marks
  harmony: [0, 0.6],       // share of bar lines that change chord: ramp
};
const GENRE_SHAPE = {
  // Ambient has no backbeat and often no drums at all, and a two-chord drift
  // held for eight bars is the form, not a failure to write a progression.
  ambient:    { density: [0.06, 0.07], layers: [6, 3], pulse: [0.02, 0.30], harmony: [0, 0.25] },
  // An orchestra keeps time with a conductor, not a kick drum. Timpani and a
  // bass drum on structural downbeats is the whole percussion part.
  orchestral: { density: [0.12, 0.09], layers: [8, 4], pulse: [0.05, 0.40], harmony: [0, 0.5] },
  // Trailer music is built on long swells over a slow harmonic floor.
  cinematic:  { density: [0.14, 0.10], layers: [8, 4], pulse: [0.06, 0.42], harmony: [0, 0.4] },
  // Jazz keeps time on a ride cymbal and brushes. There is a pulse, but it
  // is nothing like the machine pulse a four-on-the-floor record has.
  jazz:       { pulse: [0.08, 0.48] },
};
function shapeFor(genre, key) {
  const g = GENRE_SHAPE[genre];
  return (g && g[key]) || SHAPE_DEFAULT[key];
}

const LOUDNESS_TARGET = {
  hiphop: -9, trap: -8, drill: -8, rap: -8.5, phonk: -8, jerseyclub: -8,
  house: -9, techno: -8.5, dnb: -8, dubstep: -7.5, ukgarage: -9, amapiano: -9,
  rock: -10, reggaeton: -8.5, afrobeats: -9.5, synthwave: -10,
  lofi: -13, rnb: -11, neosoul: -12,
  _default: -10,
  rage: -8,
  pluggnb: -9,
  pop: -9.5,
  metal: -9,
  jazz: -14,
  edm: -8,
  country: -11,
  orchestral: -16,
  cinematic: -13,
  funk: -11,
  soul: -12,
  ambient: -18,
};

// Mastered or not?
//
// The loudness figures above are what a RELEASED record measures, after
// mastering. A raw bounce out of a DAW is not that and is not meant to be:
// it typically sits 4 to 6 LU quieter with several dB more crest, because
// the limiting that closes that gap has not happened yet. Judging a raw mix
// against release loudness therefore marks it down for a step it has not
// reached, which is not useful feedback.
//
// Measured on this program's own output across all 19 genres, the render
// averaged -15.3 LUFS with around 19dB of crest against release targets near
// -9 and 11.5 - so loudness, crest and dynamics were flagged as the top
// three faults in nearly every genre, when in fact they describe an
// unmastered mix behaving exactly as an unmastered mix should.
//
// So the caller says which it is. Anything the user brings is assumed to be
// a finished record, because it usually is; the program's own renders
// declare themselves unmastered.
const UNMASTERED_LOUDNESS_OFFSET = -5;   // LU quieter than a release
const UNMASTERED_CREST = 17.5;           // dB, vs 11.5 for a master

function rateAudio(channels, sampleRate, opts = {}) {
  const genre = opts.genre || "_default";
  const mastered = opts.mastered !== false;
  const m = measureAudio(channels, sampleRate);
  const base = LOUDNESS_TARGET[genre] ?? LOUDNESS_TARGET._default;
  const target = mastered ? base : base + UNMASTERED_LOUDNESS_OFFSET;

  // Every term: [label, weight, value, why]
  const terms = [];
  const add = (key, label, weight, g, detail) => {
    if (g === null || g === undefined || !isFinite(g)) return;
    terms.push({ key, label, weight, score: Math.max(0, Math.min(1, g)), detail });
  };

  // Loudness: on target for the genre, +/- 3 LU still fine.
  add("loudness", "Loudness", 1.4, gaussianTerm(m.lufs, target, 3.5),
    m.lufs === null ? "" : `${m.lufs.toFixed(1)} LUFS (target ${target}${mastered ? "" : ", unmastered"})`);

  // Crest factor ~11dB is the middle of the range mixed music sits in.
  // Below ~7 is crushed; above ~18 nothing is glued.
  add("crest", "Dynamics (crest factor)", 1.2,
    gaussianTerm(m.crestDb, mastered ? 11.5 : UNMASTERED_CREST, 4.5),
    `${m.crestDb.toFixed(1)} dB peak-to-RMS`);

  // True peak: the standard ceiling is -1 dBTP with -0.1 the absolute
  // minimum margin, because lossy codecs overshoot. Anything at or above
  // 0 will clip somewhere downstream.
  add("headroom", "True-peak headroom", 0.9,
    m.truePeakDb <= -1 ? 1 : rampTerm(m.truePeakDb, 0.5, -1),
    `${m.truePeakDb.toFixed(2)} dBTP`);

  // Low end. Sub below 60Hz should be present but not dominant; the
  // 60-250Hz band carries the weight of most records.
  add("sub", "Sub-bass balance", 0.8, gaussianTerm(m.subShare, 0.16, 0.11),
    `${(m.subShare * 100).toFixed(0)}% of energy below 60Hz`);
  add("low", "Low-end weight", 0.8, gaussianTerm(m.lowShare, 0.30, 0.15),
    `${(m.lowShare * 100).toFixed(0)}% in 60-250Hz`);
  // Mids carry everything the ear reads as detail and intelligibility.
  add("mid", "Midrange presence", 0.9, gaussianTerm(m.midShare, 0.34, 0.17),
    `${(m.midShare * 100).toFixed(0)}% in 250Hz-2kHz`);
  // Top end: enough to be open, not so much that it is harsh.
  add("high", "Top end", 0.7, gaussianTerm(m.highShare, 0.16, 0.11),
    `${(m.highShare * 100).toFixed(0)}% above 2kHz`);

  // Stereo. Correlation near 0.3-0.6 is a wide but mono-safe mix. Near 1 is
  // mono; below 0 means real cancellation.
  if (m.correlation !== null) {
    // A correlation of 1.0 is mono and 0 is as wide as a mix can safely go.
    // Real records sit between about 0.4 and 0.9 - wide enough to have an
    // image, correlated enough to survive a mono playback system. 0.65 is
    // the middle of that. Below zero the channels are actively cancelling,
    // which is a fault rather than a width, so that side falls away fast.
    add("stereo", "Stereo image", 0.7,
      m.correlation < 0 ? Math.max(0, 1 + m.correlation * 2) : gaussianTerm(m.correlation, 0.65, 0.32),
      `correlation ${m.correlation.toFixed(2)}`);
  }

  // Arrangement movement - but only if there is an arrangement to measure.
  //
  // A four-bar loop played twice has no sections by construction: it is one
  // idea repeated, and the level is meant to be identical each time round.
  // Scoring that as "no dynamics" penalised a loop for being a loop, and it
  // came out as the most common fault across all 19 genres for exactly that
  // reason. So the caller says whether the audio is a loop or a whole
  // arrangement, and for a loop the term is dropped rather than failed.
  if (!opts.isLoop) {
    add("dynamics", "Arrangement dynamics", 0.8, gaussianTerm(m.dynamicSpreadDb, 3.5, 3.0),
      m.dynamicSpreadDb === null ? "" : `${m.dynamicSpreadDb.toFixed(1)} dB section-to-section spread`);
  }

  // A beat should have a findable tempo and a findable key.
  const pTarget = shapeFor(genre, "pulse");
  add("pulse", "Rhythmic clarity", 1.3,
    m.bpm === null ? 0 : rampTerm(m.pulseSalience, pTarget[0], pTarget[1]),
    m.bpm ? `${m.bpm} BPM, pulse strength ${m.pulseSalience.toFixed(2)}` : "no clear pulse");
  add("tonal", "Tonal clarity", 0.9, rampTerm(m.keyConfidence, 0.25, 0.75),
    m.key ? `${m.key.tonic} ${m.key.mode} (r=${m.keyConfidence.toFixed(2)})` : "no clear key");

  const wSum = terms.reduce((a, t) => a + t.weight, 0) || 1;
  const score = (terms.reduce((a, t) => a + t.weight * t.score, 0) / wSum) * 100;
  return { score: Math.round(score * 10) / 10, terms, measurements: m, target, genre };
}

// ---------------------------------------------------------------------------
// Symbolic rating - a generated pattern, where the notes are known
// ---------------------------------------------------------------------------
// Same equation, different measurements. This complements rather than
// replaces the acoustic side: audio can tell you a mix is balanced but not
// whether the harmony makes sense, and a pattern can tell you the harmony
// makes sense but nothing about how it will sound once rendered.
function ratePattern(style, pattern) {
  const genreId = (style && (style.id || style.genre)) || null;
  const terms = [];
  const add = (key, label, weight, g, detail) => {
    if (g === null || g === undefined || !isFinite(g)) return;
    terms.push({ key, label, weight, score: Math.max(0, Math.min(1, g)), detail });
  };
  const inst = pattern.instruments || {};
  // Two different lists, because they answer two different questions.
  // GROOVE lanes are what carries the rhythm, so crash and fx are left out -
  // a cymbal on bar one is not part of the pattern's density. PERCUSSION is
  // every drum lane, and is what "not melodic" means. Using the groove list
  // for both, as this did at first, quietly classified crash and fx as
  // melodic parts and let their slots inflate the denominator of the space
  // measurement.
  const percussion = style.drums.instruments || [];
  const grooveLanes = percussion.filter((d) => d !== "crash" && d !== "fx");
  const isMelodic = (k) => !percussion.includes(k) && Array.isArray(inst[k]);

  // Syncopation, measured with Longuet-Higgins & Lee. Some is essential;
  // too much and the pulse disappears.
  let sync = 0;
  if (typeof patternSyncopation === "function") sync = patternSyncopation(inst, grooveLanes);
  add("sync", "Syncopation", 1.2, gaussianTerm(sync, 8, 7), `${sync.toFixed(1)} per bar (LHL)`);

  // Density.
  let on = 0, slots = 0;
  for (const d of grooveLanes) {
    const t = inst[d];
    if (!Array.isArray(t)) continue;
    for (const x of t) { slots++; if (x) on++; }
  }
  const density = slots ? on / slots : 0;
  const dTarget = shapeFor(genreId, "density");
  add("density", "Drum density", 1.0, gaussianTerm(density, dTarget[0], dTarget[1]), `${(density * 100).toFixed(0)}% of the grid`);

  // Downbeat anchoring - a beat whose pulse cannot be found is not
  // sophisticated, it is broken.
  const kick = inst.kick;
  let anchored = 0, bars = 0;
  if (Array.isArray(kick)) {
    bars = Math.floor(kick.length / 16);
    for (let b = 0; b < bars; b++) if (kick[b * 16]) anchored++;
  }
  add("anchor", "Downbeat anchoring", 1.1, bars ? rampTerm(anchored / bars, 0.2, 0.75) : null,
    bars ? `${anchored}/${bars} bars start on the kick` : "");

  // How many parts are playing. Too few is thin, too many is mud.
  const layers = Object.keys(inst).filter((k) => Array.isArray(inst[k]) && inst[k].some(Boolean)).length;
  const lTarget = shapeFor(genreId, "layers");
  add("layers", "Arrangement size", 0.9, gaussianTerm(layers, lTarget[0], lTarget[1]), `${layers} active parts`);

  // Harmonic movement.
  const roots = pattern.barRootDegrees || [];
  let changes = 0;
  for (let i = 1; i < roots.length; i++) if (roots[i] !== roots[i - 1]) changes++;
  const hr = roots.length > 1 ? changes / (roots.length - 1) : 0;
  // A ramp, not a tolerance band. This was a Gaussian centred on 0.65, which
  // assumed that changing chord every bar was too much of a good thing -
  // but measured across 95 generations, 92 changed every bar, because a
  // four-chord progression over a four-bar loop is simply what these genres
  // do. The Gaussian scored that norm at 0.465, making harmonic movement the
  // weakest term in almost every genre for no musical reason. Movement has
  // no upper limit at this resolution: one chord per bar is the ceiling the
  // measurement can even see, so anything from 60% of bars upward is full
  // marks and a static loop is what actually scores low.
  const hTarget = shapeFor(genreId, "harmony");
  add("harmony", "Harmonic movement", 0.9, rampTerm(hr, hTarget[0], hTarget[1]),
    `${(hr * 100).toFixed(0)}% of bars change chord`);

  // Melodic range - enough to be a line, not so much it stops being singable.
  //
  // Measured PER PART and then averaged, not across the whole arrangement
  // pooled together. Pooling measured the ensemble's total span instead: a
  // bass sitting at degree -8 under a lead at +31 read as a 39-degree
  // "melody", so every properly arranged beat was marked down for the crime
  // of having both a bass and a lead. Individually those lines span 7 to 15
  // degrees, which is exactly right. The average is weighted by note count
  // so a two-note horn stab does not carry the same say as a full line.
  let notes = 0, spanWeighted = 0, spanWeight = 0;
  const spans = [];
  for (const k of Object.keys(inst)) {
    if (!isMelodic(k)) continue;
    let lo = Infinity, hi = -Infinity, cnt = 0;
    for (const v of inst[k]) {
      if (!v || typeof v !== "object") continue;
      cnt++;
      const ds = v.degrees || (v.degree !== undefined ? [v.degree] : []);
      for (const d of ds) { lo = Math.min(lo, d); hi = Math.max(hi, d); }
    }
    notes += cnt;
    // One note has no span to speak of, so it says nothing about range.
    if (cnt < 2 || lo === Infinity) continue;
    spanWeighted += (hi - lo) * cnt;
    spanWeight += cnt;
    spans.push(hi - lo);
  }
  const avgSpan = spanWeight ? spanWeighted / spanWeight : null;
  // A singable line covers about an octave to a twelfth - 7 to 11 scale
  // degrees - so 10 is the middle of that with room either side.
  add("range", "Melodic range", 0.8, avgSpan === null ? null : gaussianTerm(avgSpan, 10, 7),
    avgSpan === null ? "" : `${avgSpan.toFixed(1)} scale degrees per part (${spans.length} parts)`);

  // Space. Wall-to-wall notes exhaust the ear.
  let mSlots = 0;
  for (const k of Object.keys(inst)) {
    if (!isMelodic(k)) continue;
    mSlots += inst[k].length;
  }
  const fill = mSlots ? notes / mSlots : 0;
  add("space", "Space", 0.9, gaussianTerm(fill, 0.22, 0.16), `${(fill * 100).toFixed(0)}% of melodic slots filled`);

  const wSum = terms.reduce((a, t) => a + t.weight, 0) || 1;
  const score = (terms.reduce((a, t) => a + t.weight * t.score, 0) / wSum) * 100;
  return { score: Math.round(score * 10) / 10, terms };
}

// A one-line verdict, so the number means something.
function ratingVerdict(score) {
  if (score >= 85) return "Release-ready";
  if (score >= 72) return "Strong";
  if (score >= 60) return "Solid, with things to fix";
  if (score >= 45) return "Rough — several problems";
  return "Needs work";
}

// The weakest terms, which is the actually useful output - a score tells you
// where you are, the weak terms tell you what to do.
function ratingWeaknesses(result, n = 3) {
  return result.terms
    .slice()
    .sort((a, b) => (a.score - b.score) || (b.weight - a.weight))
    .slice(0, n)
    .filter((t) => t.score < 0.7);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    rateAudio, ratePattern, measureAudio, integratedLoudness,
    gaussianTerm, rampTerm, ratingVerdict, ratingWeaknesses, LOUDNESS_TARGET,
  };
}
