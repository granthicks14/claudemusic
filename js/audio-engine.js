const ALL_TRACKS = ["kick", "snare", "hihat", "openhat", "tom", "perc", "crash", "bass", "piano", "lead", "pad", "stab", "guitar", "strings", "horn", "organ", "vocal", "kalimba", "marimba", "arp", "autolead", "sax", "woodwind", "leadguitar", "talkbox", "fx"];

// Per-genre level overrides, applied on top of DEFAULT_TRACK_VOLUME when a
// style is selected. See applyGenreLevels for why these three exist and the
// other twenty-eight genres do not.
const GENRE_TRACK_VOLUME = {
  // A double bass section sits under the orchestra, not on top of it.
  orchestral: { bass: 0.6, strings: 0.85, horn: 0.8, woodwind: 0.8, piano: 0.8 },
  // Trailer music is bass-heavy on purpose, so the pedal keeps more of its
  // weight than the orchestral one - but not enough to bury the brass.
  cinematic:  { bass: 0.72, strings: 0.85, horn: 0.85, pad: 0.65, stab: 0.85 },
  // The drone is a bed, not the piece.
  ambient:    { bass: 0.6, pad: 0.7, strings: 0.75, piano: 0.85 },
};

const DEFAULT_TRACK_VOLUME = {
  kick: 1, snare: 0.9, hihat: 0.6, openhat: 0.6, tom: 0.85, perc: 0.55, crash: 0.8,
  // The bass is up from 0.9. It is the one level here changed on evidence:
  // with the bass an octave lower it carries real sub energy, and the sub-band
  // share measured across 57 beats moved from 0.35 to 0.58 with this and the
  // octave fix together.
  //
  // The melodic levels were briefly cut here too and are back where they were.
  // That cut came from a single soloed render showing a saxophone 9dB above
  // the bass - and the solo-render method turned out to be unreliable, since
  // it reported several parts as silent that a call-count check proved were
  // playing. A level table tuned on a measurement that was wrong is worse
  // than one left alone, so it was reverted rather than kept because the
  // total score happened to go up.
  bass: 1.0, piano: 0.75, lead: 0.7, pad: 0.5, stab: 0.75, guitar: 0.8, strings: 0.55, horn: 0.7,
  organ: 0.6, vocal: 0.65, kalimba: 0.7, marimba: 0.65, arp: 0.55, autolead: 0.75, sax: 0.7, woodwind: 0.7, leadguitar: 0.7, talkbox: 0.72, fx: 0.6,
};

const BASE_VELOCITY = {
  kick: 1, snare: 0.9, hihat: 0.7, openhat: 0.7, tom: 0.85, perc: 0.6, crash: 0.9,
  bass: 0.8, piano: 0.75, lead: 0.7, pad: 0.5, stab: 0.75, guitar: 0.8, strings: 0.6, horn: 0.75,
  organ: 0.65, vocal: 0.7, kalimba: 0.75, marimba: 0.7, arp: 0.65, autolead: 0.8, sax: 0.75, woodwind: 0.72, leadguitar: 0.78, talkbox: 0.8, fx: 0.8,
};

const DRUM_TRACKS = ["kick", "snare", "hihat", "openhat", "tom", "perc", "crash", "fx"];

// Which tracks get a genuine stereo spread, how far apart, and how much of it.
// Sustained and textural parts take the most, because that is where width
// lives on a real record; short percussive parts take a little; and the
// centre of the mix - kick, snare, bass, and the lead vocal-register parts -
// takes none at all.
const STEREO_SPREAD = {
  pad: { ms: 22, level: 0.55 }, strings: { ms: 19, level: 0.5 },
  organ: { ms: 16, level: 0.42 }, guitar: { ms: 15, level: 0.45 },
  stab: { ms: 12, level: 0.4 }, arp: { ms: 14, level: 0.45 },
  piano: { ms: 13, level: 0.35 }, horn: { ms: 12, level: 0.34 },
  kalimba: { ms: 12, level: 0.35 }, marimba: { ms: 12, level: 0.35 },
  woodwind: { ms: 14, level: 0.3 }, sax: { ms: 13, level: 0.28 },
  leadguitar: { ms: 14, level: 0.34 }, vocal: { ms: 16, level: 0.4 },
  perc: { ms: 11, level: 0.3 }, openhat: { ms: 9, level: 0.22 },
  crash: { ms: 14, level: 0.4 }, hihat: { ms: 7, level: 0.18 },
};

// Guitar flavors that strum chords (rhythm guitar) versus play single
// picked lines (lead guitar) - see playGuitarChord.
// Chordal (rhythm) guitar tones. These get a real voicing strummed
// through the performance layer; everything else stays a single line, the
// way picked highlife parts and jazz solos actually are.
const GUITAR_STRUM_FLAVORS = new Set([
  "power", "muted", "acoustic", "twelvestring", "funk",
  "openchord", "resonator", "baritone",
]);

// Distorted rock rhythm parts get double-tracked and hard-panned; an
// acoustic strum or funk comp is normally a single centred performance.
const GUITAR_DOUBLE_FLAVORS = new Set(["power", "muted"]);

// Stereo placement. Everything used to sum dead-center mono, which makes
// even a well-arranged mix sound crowded because every part competes for
// the same spot in the image. Standard practice keeps the elements that
// carry weight and identity up the middle - kick, snare, bass, lead vocal
// - and spreads the supporting parts outward so each one has its own
// space. Values are gentle; hard-panning would sound lopsided on
// headphones.
const DEFAULT_PAN = {
  kick: 0, snare: 0, bass: 0, lead: 0, autolead: 0, vocal: 0, fx: 0,
  hihat: 0.18, openhat: 0.22, perc: -0.26, tom: -0.14, crash: 0.3,
  piano: -0.2, pad: 0.12, stab: 0.28, guitar: -0.3, strings: 0.24,
  horn: -0.22, organ: 0.2, kalimba: -0.24, marimba: 0.26, arp: -0.28, sax: -0.18, woodwind: 0.16, leadguitar: 0.26, talkbox: 0,
};

const DEFAULT_REVERB_SEND = {
  kick: 0, bass: 0, snare: 0.22, hihat: 0.08, openhat: 0.15, tom: 0.2, perc: 0.15, crash: 0.35,
  piano: 0.22, lead: 0.28, pad: 0.4, stab: 0.22, guitar: 0.18, strings: 0.35, horn: 0.22,
  organ: 0.28, vocal: 0.32, kalimba: 0.25, marimba: 0.28, arp: 0.3, autolead: 0.24, sax: 0.3, woodwind: 0.32, leadguitar: 0.26, talkbox: 0.2, fx: 0.45,
};

class BeatEngine {
  constructor() {
    this.ctx = null;
    this.pattern = null;
    this.style = null;
    this.rootMidi = 48;
    this.tempo = 100;
    this.swing = 0.1;
    this.stepCount = 16;
    this.currentStep = 0;
    this.nextNoteTime = 0;
    this.lookahead = 25;
    this.scheduleAheadTime = 0.1;
    this.timerId = null;
    this.isPlaying = false;
    this.onStep = null;
    this.ambienceSource = null;
    this.flavors = {};
    this.masterGain = null;
    this.compressor = null;
    this.duckBus = null;
    this.sidechainEnabled = false;
    this.reverbBus = null;
    this.reverbSends = {};
    this.trackPanners = {};
    this.trackFilters = {};
    this.filterAutomation = {};
    this.trackGains = {};
    this.trackState = {};
    this.automation = {};
    for (const t of ALL_TRACKS) {
      this.trackState[t] = { volume: DEFAULT_TRACK_VOLUME[t], muted: false, solo: false };
    }
  }

  // An external context can be injected so the same graph can be built
  // inside an OfflineAudioContext - that is what makes it possible to
  // MEASURE the program's own output rather than only listen to it.
  ensureContext(externalCtx) {
    if (!this.ctx) {
      this.ctx = externalCtx || new (window.AudioContext || window.webkitAudioContext)();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.9;
      // A master-bus "grit" stage - a mild waveshaper genres can dial in to
      // taste (0 = bypassed/identity curve). Modern hard trap/rap masters
      // are driven a little warm/saturated on purpose for extra harmonic
      // bite that reads on small speakers, not just cranked louder.
      this.gritShaper = this.ctx.createWaveShaper();
      this.gritShaper.curve = this.makeIdentityCurve();
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -12;
      this.compressor.knee.value = 6;
      this.compressor.ratio.value = 4;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      // NOTE: a makeup-gain-plus-limiter stage was tried here and removed.
      //
      // The diagnosis behind it is real and still stands: this compressor has
      // no makeup after it, so it only ever pulls loud mixes down and never
      // lifts quiet ones, and the program's output measured a 10.6dB swing
      // between beats (-20.1 to -9.5 LUFS across 38 renders) purely on how
      // many parts happened to be playing.
      //
      // But +4dB of makeup into a compressor-as-limiter closed the spread by
      // barely a decibel (10.6 to 9.5) while pushing the mean to -11.8, which
      // is hotter than the unmastered targets want, and letting true peaks
      // reach +0.55 dBTP - actual clipping, in a term that had been perfect.
      // A DynamicsCompressor has no lookahead and is not a true-peak limiter.
      //
      // The spread does not come from the bus at all: it comes from a sparse
      // arrangement being genuinely quieter than a dense one, which no
      // downstream gain fixes without either heavy compression that would
      // cost the dynamics terms, or per-track gain staging that makes each
      // part's contribution predictable. That is the real fix and it needs
      // reliable per-track level measurement first.
      this.compressor.connect(this.analyser);
      this.masterGain.connect(this.gritShaper).connect(this.compressor).connect(this.ctx.destination);

      // A parallel tap of the fully-mixed signal (post grit/compressor, the
      // same processing the speakers get) as a MediaStream, so the video
      // export feature can record real audio straight out of the engine
      // instead of needing a second, separate render pass.
      if (this.ctx.createMediaStreamDestination) {
        this.mediaStreamDest = this.ctx.createMediaStreamDestination();
        this.compressor.connect(this.mediaStreamDest);
      }

      this.duckBus = this.ctx.createGain();
      this.duckBus.gain.value = 1;
      this.duckBus.connect(this.masterGain);

      this.reverbBus = this.ctx.createGain();
      const convolver = this.ctx.createConvolver();
      convolver.buffer = this.makeImpulseResponse(2.2, 2.5);
      const reverbReturn = this.ctx.createGain();
      reverbReturn.gain.value = 0.9;
      this.reverbBus.connect(convolver).connect(reverbReturn).connect(this.masterGain);

      // Kick/bass EQ carving: real mixes cut each one gently around where
      // the other one's dominant energy sits (kick ~80-100Hz, bass/808
      // ~150Hz) so they don't fight for the same low-end space, plus a
      // gentle high-pass on everything else to keep sub-40Hz rumble out of
      // non-bass elements - both standard "clean up the low end" moves.
      for (const t of ALL_TRACKS) {
        const g = this.ctx.createGain();
        g.gain.value = this.trackState[t].volume;

        let node = g;
        if (t === "kick") {
          const carve = this.ctx.createBiquadFilter();
          carve.type = "peaking";
          carve.frequency.value = 150;
          carve.Q.value = 1;
          carve.gain.value = -3;
          g.connect(carve);
          node = carve;
        } else if (t === "bass") {
          const carve = this.ctx.createBiquadFilter();
          carve.type = "peaking";
          carve.frequency.value = 90;
          carve.Q.value = 1;
          carve.gain.value = -2.5;
          g.connect(carve);
          node = carve;
        } else if (t !== "fx" && t !== "crash") {
          const hp = this.ctx.createBiquadFilter();
          hp.type = "highpass";
          hp.frequency.value = 40;
          g.connect(hp);
          node = hp;
        }

        // A per-track lowpass, wide open by default. In dance genres the
        // filter sweep IS the arrangement - a resonant cutoff opening
        // across 16 bars does the work that adding instruments does
        // elsewhere - so tracks need a filter that automation can move.
        const filt = this.ctx.createBiquadFilter();
        filt.type = "lowpass";
        filt.frequency.value = 20000;
        filt.Q.value = 1.2;
        node.connect(filt);
        this.trackFilters[t] = filt;

        const pan = this.ctx.createStereoPanner();
        pan.pan.value = DEFAULT_PAN[t] || 0;
        filt.connect(pan);
        const busFor = DRUM_TRACKS.includes(t) ? this.masterGain : this.duckBus;
        pan.connect(busFor);
        this.trackPanners[t] = pan;
        this.trackGains[t] = g;

        // Real stereo width, for the tracks that are supposed to have it.
        //
        // The mix measured a channel correlation of 0.94-0.99 - effectively
        // mono - despite every textural track being panned. The reason is that
        // PANNING A MONO SOURCE DOES NOT DECORRELATE IT: both channels carry
        // the same waveform at different gains, so the correlation stays at 1
        // no matter how far the panner is pushed. Width needs *different
        // signal* in each channel, which is why real records get it from
        // double-tracking, chorus, delay and stereo reverb rather than from
        // the pan pot.
        //
        // So each wide track also feeds a short delayed copy panned to the
        // opposite side - the Haas trick, and the cheapest honest way to turn
        // one mono part into a stereo image. Kept under 25ms so it reads as
        // width rather than as an echo, and at partial level so the mono sum
        // stays usable. Kick, snare and bass are deliberately NOT in the list:
        // the low end and the backbeat belong dead centre, and smearing them
        // is how a mix loses its punch.
        if (STEREO_SPREAD[t]) {
          const { ms, level } = STEREO_SPREAD[t];
          const dl = this.ctx.createDelay(0.05);
          dl.delayTime.value = ms / 1000;
          const dg = this.ctx.createGain();
          dg.gain.value = level;
          const dp = this.ctx.createStereoPanner();
          // Opposite side to the dry signal, so the two together span the image.
          dp.pan.value = (DEFAULT_PAN[t] || 0) >= 0 ? -0.75 : 0.75;
          filt.connect(dl).connect(dg).connect(dp).connect(busFor);
        }

        const send = this.ctx.createGain();
        send.gain.value = DEFAULT_REVERB_SEND[t] || 0;
        g.connect(send).connect(this.reverbBus);
        this.reverbSends[t] = send;
      }
    }
    // An OfflineAudioContext also reports "suspended" before rendering
    // starts, but resuming one throws - it has no clock to resume. Only a
    // live context needs waking from the browser's autoplay suspension.
    if (this.ctx.state === "suspended" && typeof this.ctx.resume === "function"
        && typeof this.ctx.startRendering !== "function") {
      this.ctx.resume();
    }
  }

  makeImpulseResponse(duration, decay) {
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * duration);
    const impulse = this.ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }

  dest(inst) {
    return this.trackGains[inst] || this.masterGain;
  }

  // A stack of detuned oscillators around a center frequency - the standard
  // "unison/supersaw" trick for a thick, wide synth tone instead of one
  // thin oscillator. voices 5-8 with a modest spread is the usual sweet spot.
  addUnisonVoices(freq, voices, spreadCents, type, destNode, time, stopTime) {
    const ctx = this.ctx;
    for (let i = 0; i < voices; i++) {
      const spread = voices === 1 ? 0 : (i / (voices - 1) - 0.5) * 2 * spreadCents;
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq * Math.pow(2, spread / 1200), time);
      osc.connect(destNode);
      osc.start(time);
      osc.stop(stopTime);
    }
  }

  setReverbSend(inst, value) {
    if (this.reverbSends[inst]) this.reverbSends[inst].gain.value = value;
  }

  setSidechain(enabled) {
    this.sidechainEnabled = enabled;
    if (this.duckBus) this.duckBus.gain.value = 1;
  }

  triggerSidechainDuck(time) {
    if (!this.sidechainEnabled || !this.duckBus) return;
    const g = this.duckBus.gain;
    g.cancelScheduledValues(time);
    g.setValueAtTime(1, time);
    g.linearRampToValueAtTime(0.28, time + 0.008);
    g.setTargetAtTime(1, time + 0.03, 0.12);
  }

  // Clamped: at 0.5 the off-beat would land exactly on the next down-beat,
  // and past that it would land BEFORE it.
  setSwing(value) {
    this.swing = Math.max(0, Math.min(0.45, Number(value) || 0));
  }

  // How long step `i` lasts, swing included.
  //
  // Swing delays the OFF-beat and leaves the DOWN-beat where it is. The old
  // formula only ever ADDED time, to odd steps, which got both halves of
  // that wrong: every down-beat after the first drifted late (at swing 0.15
  // a bar ran 7% longer than the tempo said, so the whole beat played slow),
  // and because the pair got longer while the off-beat stayed at one step,
  // the off-beat sat EARLY inside its own pair - a rush, the exact opposite
  // of swing. A pair now always spans two steps: the down-beat is stretched
  // by s and the off-beat shortened by the same amount. The grid survives,
  // and s = 1/3 is exactly triplet swing, which is what the word means.
  swungStepDuration(i, base) {
    const d = base === undefined ? this.stepDuration() : base;
    return d * (i % 2 === 1 ? 1 - this.swing : 1 + this.swing);
  }

  setAutomation(inst, points) {
    this.automation[inst] = points && points.length ? [...points].sort((a, b) => a.step - b.step) : null;
  }

  getAutomationMultiplier(inst, step) {
    const points = this.automation[inst];
    if (!points || !points.length) return 1;
    if (step <= points[0].step) return points[0].value;
    if (step >= points[points.length - 1].step) return points[points.length - 1].value;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      if (step >= a.step && step <= b.step) {
        const t = b.step === a.step ? 0 : (step - a.step) / (b.step - a.step);
        return a.value + (b.value - a.value) * t;
      }
    }
    return 1;
  }

  recomputeGains() {
    const anySolo = ALL_TRACKS.some((t) => this.trackState[t].solo);
    for (const t of ALL_TRACKS) {
      const s = this.trackState[t];
      let level = s.volume;
      if (s.muted) level = 0;
      if (anySolo && !s.solo) level = 0;
      if (this.trackGains[t]) this.trackGains[t].gain.value = level;
    }
  }

  // A level the user moved by hand is theirs; a genre change must not quietly
  // take it back.
  setTrackVolume(inst, value) {
    this.trackState[inst].volume = value;
    (this.userSetVolume || (this.userSetVolume = {}))[inst] = true;
    this.recomputeGains();
  }

  toggleMute(inst) {
    this.trackState[inst].muted = !this.trackState[inst].muted;
    this.recomputeGains();
    return this.trackState[inst].muted;
  }

  toggleSolo(inst) {
    this.trackState[inst].solo = !this.trackState[inst].solo;
    this.recomputeGains();
    return this.trackState[inst].solo;
  }

  setMasterVolume(value) {
    if (this.masterGain) this.masterGain.gain.value = value;
  }

  jitterTime(time, inst) {
    const h = this.style.humanize;
    // Per-instrument pocket. A single global humanize value can only
    // make everything equally sloppy; real ensembles sit in different
    // pockets at once - the Dilla/Questlove feel is drums dragging
    // behind while the bass stays forward, which is a relationship
    // between parts, not overall looseness.
    const pocket = (this.style.pockets && inst && this.style.pockets[inst]) || 0;
    return time + pocket / 1000 + (Math.random() * 2 - 1) * (h.timingMs / 1000);
  }

  jitterVel(base) {
    const h = this.style.humanize;
    const v = base + (Math.random() * 2 - 1) * h.velocityJitter;
    return Math.max(0.35, Math.min(1.3, v));
  }

  setFilterAutomation(track, points) {
    this.filterAutomation[track] = points && points.length ? points : null;
  }

  // Reads the same kind of breakpoint curve the volume automation uses,
  // but maps it exponentially onto cutoff frequency, because pitch and
  // filter cutoff are both perceived logarithmically - a linear sweep
  // sounds like it does nothing and then lurches.
  applyFilterAutomation(track, step, time) {
    const pts = this.filterAutomation[track];
    const filt = this.trackFilters[track];
    if (!pts || !filt) return;
    let v = pts[0].value;
    for (let i = 0; i < pts.length; i++) {
      if (pts[i].step <= step) {
        const nxt = pts[i + 1];
        if (!nxt || nxt.step > step) {
          v = nxt ? pts[i].value + (nxt.value - pts[i].value) * ((step - pts[i].step) / (nxt.step - pts[i].step)) : pts[i].value;
          break;
        }
      }
    }
    const hz = 220 * Math.pow(90, Math.max(0, Math.min(1, v)));
    filt.frequency.setTargetAtTime(hz, time, 0.02);
  }

  // Metric accent. Velocity used to be pure random jitter with no idea
  // where in the bar a hit landed, so a downbeat was no more likely to be
  // loud than a passing 16th - which is most of why programmed drums read
  // as machine-like. Real players (and any competent drum programmer)
  // accent the metric hierarchy: the downbeat is strongest, the backbeat
  // next, then the remaining quarters, with 8th- and 16th-note offbeats
  // progressively softer. On a 16th-note hi-hat line that loud/soft
  // alternation is essentially the entire difference between "grooving"
  // and "buzzing."
  metricAccent(step) {
    const i = ((step % STEPS_PER_BAR) + STEPS_PER_BAR) % STEPS_PER_BAR;
    if (i === 0) return 1.14;
    if (i === 4 || i === 12) return 1.06;
    if (i % 4 === 0) return 1.0;
    if (i % 2 === 0) return 0.88;
    return 0.78;
  }

  makeNoiseBuffer(seconds) {
    const bufferSize = Math.floor(this.ctx.sampleRate * seconds);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  // ---- Drums ----

  playKick(time, vel, flavor) {
    if (this.playSampleFlavor("kick", flavor, time, vel)) return;
    const ctx = this.ctx;
    const presets = {
      boombap: { startFreq: 130, endFreq: 48, decay: 0.32 },
      "808": { startFreq: 100, endFreq: 55, decay: 1.1 },
      fourfloor: { startFreq: 145, endFreq: 55, decay: 0.28 },
      acoustic: { startFreq: 120, endFreq: 60, decay: 0.22 },
      lofi: { startFreq: 100, endFreq: 45, decay: 0.3 },
      deep: { startFreq: 80, endFreq: 30, decay: 0.55 },
      snappy: { startFreq: 160, endFreq: 70, decay: 0.15 },
      click: { startFreq: 200, endFreq: 90, decay: 0.12 },
      punch: { startFreq: 175, endFreq: 78, decay: 0.17 },
      subkick: { startFreq: 68, endFreq: 26, decay: 0.75 },
      gritty: { startFreq: 110, endFreq: 50, decay: 0.4 },
      roomy: { startFreq: 115, endFreq: 42, decay: 0.5 },
      // --- round 13 -------------------------------------------------------
      // A kick is a pitch envelope plus a decay, and those two numbers are
      // most of what separates one style's kick from another's. A long fall
      // from high reads as "acoustic beater"; a short fall from low reads as
      // "sub". Everything below is a real point in that space rather than a
      // relabelling of an existing one.
      knock: { startFreq: 190, endFreq: 85, decay: 0.13 },     // tight modern rap knock
      thump: { startFreq: 95, endFreq: 38, decay: 0.62 },      // soft, round, long
      distorted: { startFreq: 150, endFreq: 58, decay: 0.35 }, // hard techno, driven
      tight: { startFreq: 165, endFreq: 74, decay: 0.11 },     // gated, very short
      woofer: { startFreq: 72, endFreq: 29, decay: 0.9 },      // festival sub kick
      vinyl: { startFreq: 108, endFreq: 47, decay: 0.36 },     // sampled off a record
      house909: { startFreq: 155, endFreq: 60, decay: 0.3 },   // classic house thump
      trapkick: { startFreq: 118, endFreq: 44, decay: 0.85 },  // long 808-adjacent tail
      jazzkick: { startFreq: 128, endFreq: 68, decay: 0.18 },  // small, brushed bop kit
      breakkick: { startFreq: 140, endFreq: 62, decay: 0.24 }, // funk break, mid-forward
      softkick: { startFreq: 92, endFreq: 44, decay: 0.42 },   // lofi/bedroom, no click
      hardstyle: { startFreq: 210, endFreq: 48, decay: 0.55 }, // huge pitched drop
      // Researched from two of the most-documented, most-imitated drum
      // machines ever built (their circuit behavior is public knowledge,
      // reverse-engineered and modeled endlessly in free/open synthesis
      // projects) rather than any copyrighted recording: the Roland TR-909
      // kick is punchier and more mid-range than an 808, with a distinct
      // audible click from its separate attack circuit; the LinnDrum kick
      // is a deep, round 80s thud with more body and less low-click than
      // either the 909 or the 808.
      "909": { startFreq: 150, endFreq: 58, decay: 0.22 },
      linn: { startFreq: 105, endFreq: 42, decay: 0.4 },
      // Three more free/documented machines researched the same way -
      // circuit behavior, not a copyrighted sample. The TR-707 (1985) was
      // Roland's first 12-bit PCM sample-based machine rather than analog
      // synthesis, so it reads tighter and more mid-focused with a shorter
      // decay than the analog 808/909 - the freestyle/early-house sound.
      // The TR-606 "Drumatix" (1981) is a tiny, thin analog companion to
      // the TB-303 with almost no low-end weight and a fast, clicky decay -
      // the acid-house/early-techno sound. The Oberheim DMX (1980) is one
      // of the first sampling drum machines and basically defined the
      // sound of early-80s hip-hop (Run-DMC, Whodini) - a hard, gated,
      // compressed-sounding punch with more midrange snap than an 808.
      "707": { startFreq: 155, endFreq: 68, decay: 0.19 },
      "606": { startFreq: 190, endFreq: 95, decay: 0.1 },
      dmx: { startFreq: 135, endFreq: 62, decay: 0.16 },
      // The E-mu SP-1200 (1987) - arguably the single most important
      // machine in hip-hop history, the sampler golden-era boom bap
      // (Pete Rock, DJ Premier, Marley Marl) was built on. Its low, fixed
      // sample rate and 12-bit converters are exactly what a real
      // bit-crush WaveShaper models below - this preset just sets a punchy
      // boom-bap-appropriate body for that processing to color.
      sp1200: { startFreq: 128, endFreq: 50, decay: 0.28 },
      // Four more documented machines. The Linn LM-1 (1980) was the first
      // drum machine to use samples of real acoustic drums rather than
      // analog synthesis - the point of it was realism, so its kick is a
      // dry, tight, un-effected acoustic thump with none of the long tail
      // an 808 has. The Casio RZ-1 (1986) sampled at 12-bit/~32kHz, which
      // is genuinely lo-fi: it doesn't sound like a real drum, it sounds
      // electronic and slightly broken, which is exactly why hip-hop and
      // house producers kept using it. The Alesis HR-16 (1987) went the
      // other way with 16-bit acoustic samples and is unmistakably
      // natural-sounding. The Roland R-8 (1989) "Human Rhythm Composer"
      // was a PCM machine aimed at rock and big-room kits.
      lm1: { startFreq: 118, endFreq: 52, decay: 0.24 },
      rz1: { startFreq: 108, endFreq: 46, decay: 0.26 },
      hr16: { startFreq: 126, endFreq: 56, decay: 0.31 },
      r8: { startFreq: 138, endFreq: 50, decay: 0.44 },
      // Seven more documented machines. The E-mu Drumulator (1983) was
      // the SP-12's direct ancestor - cheap 8-bit samples, and the reason
      // early E-mu gear sounds crunchy. Sequential's DrumTraks (1984) was
      // its tunable rival with a notably deep kick. The Yamaha RX5 (1986)
      // was a clean 12-bit PCM machine aimed at studios. Roland's CR-8000
      // (1981) is pure analog CompuRhythm, closer to a CR-78 than a 909.
      // The Korg KR-55 (1979) is a preset analog box with a soft, round
      // kick. The Boss DR-110 (1983) is a tiny analog machine with almost
      // no low end at all. The Akai MPC60 (1988) - Roger Linn's design
      // after the LinnDrum - is the 12-bit machine golden-era hip-hop was
      // built on, punchier and cleaner than an SP-1200.
      drumulator: { startFreq: 112, endFreq: 44, decay: 0.27 },
      drumtraks: { startFreq: 120, endFreq: 40, decay: 0.38 },
      rx5: { startFreq: 132, endFreq: 58, decay: 0.25 },
      cr8000: { startFreq: 96, endFreq: 42, decay: 0.35 },
      kr55: { startFreq: 92, endFreq: 46, decay: 0.3 },
      dr110: { startFreq: 150, endFreq: 82, decay: 0.13 },
      mpc60: { startFreq: 124, endFreq: 48, decay: 0.3 },
    };
    const p = presets[flavor] || presets.boombap;
    const jitter = 0.92 + Math.random() * 0.16;
    this.triggerSidechainDuck(time);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(p.startFreq * jitter, time);
    osc.frequency.exponentialRampToValueAtTime(p.endFreq, time + p.decay * 0.4);
    gain.gain.setValueAtTime(vel, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + p.decay);

    if (flavor === "808" || flavor === "gritty") {
      // A real 808 module's tone is a clean sine ringing out from a
      // bridged-T oscillator, almost always run a little warm/saturated
      // on record - a gentle waveshaper instead of a bare sine gets much
      // closer to that "true 808" character than pure sine ever does.
      // "gritty" pushes the same idea harder for a dirtier, distorted kick.
      const shaper = ctx.createWaveShaper();
      shaper.curve = this.makeDistortionCurve(flavor === "gritty" ? 22 : 6);
      osc.connect(shaper).connect(gain).connect(this.dest("kick"));
    } else if (flavor === "drumulator" || flavor === "mpc60") {
      // Both are 12-bit-era samplers; the Drumulator is the grittier of
      // the two, the MPC60 the cleaner and punchier.
      const crush = ctx.createWaveShaper();
      crush.curve = this.makeBitcrushCurve(flavor === "drumulator" ? 28 : 44);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = flavor === "drumulator" ? 7500 : 11000;
      osc.connect(crush).connect(lp).connect(gain).connect(this.dest("kick"));
    } else if (flavor === "rz1") {
      // The RZ-1's charm is its converters, not its samples: 12-bit
      // quantisation and a low sample rate. Same crush + band-limit pair
      // as the SP-1200, pushed harder and cut lower.
      const crush = ctx.createWaveShaper();
      crush.curve = this.makeBitcrushCurve(22);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 6500;
      osc.connect(crush).connect(lp).connect(gain).connect(this.dest("kick"));
    } else if (flavor === "sp1200") {
      // The bit-crush curve, plus a lowpass sitting roughly at the
      // SP-1200's real ~26kHz sample rate's Nyquist ceiling - the actual
      // "sampler crunch" is this band-limiting plus quantization together,
      // not either alone.
      const crush = ctx.createWaveShaper();
      crush.curve = this.makeBitcrushCurve(38);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 9000;
      osc.connect(crush).connect(lp).connect(gain).connect(this.dest("kick"));
    } else {
      osc.connect(gain).connect(this.dest("kick"));
    }
    osc.start(time);
    osc.stop(time + p.decay + 0.05);

    if (flavor === "roomy" || flavor === "r8") {
      // The R-8's calling card was its big PCM room kits, so it gets a
      // heavier send than the plain "roomy" preset.
      const send = this.ctx.createGain();
      send.gain.value = flavor === "r8" ? 0.5 : 0.35;
      gain.connect(send).connect(this.reverbBus);
    }

    if (flavor === "lm1" || flavor === "hr16") {
      // Sampled acoustic kicks have a beater click that synthesised ones
      // don't - a short, mid-focused knock rather than the 808's bright
      // top-end tick.
      const beater = ctx.createBufferSource();
      beater.buffer = this.makeNoiseBuffer(0.02);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = flavor === "hr16" ? 1800 : 1300;
      bp.Q.value = 1.2;
      const bg = ctx.createGain();
      bg.gain.setValueAtTime(vel * 0.4, time);
      bg.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
      beater.connect(bp).connect(bg).connect(this.dest("kick"));
      beater.start(time);
      beater.stop(time + 0.025);
    }

    if (flavor === "808") {
      const click = ctx.createBufferSource();
      click.buffer = this.makeNoiseBuffer(0.012);
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 2500;
      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(vel * 0.35, time);
      clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.012);
      click.connect(hp).connect(clickGain).connect(this.dest("kick"));
      click.start(time);
      click.stop(time + 0.015);
    }

    if (flavor === "lofi") {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.frequency.setValueAtTime(p.startFreq * 1.4, time);
      osc2.frequency.exponentialRampToValueAtTime(p.endFreq * 1.3, time + 0.08);
      gain2.gain.setValueAtTime(vel * 0.4, time);
      gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      osc2.connect(gain2).connect(this.dest("kick"));
      osc2.start(time);
      osc2.stop(time + 0.12);
    }

    if (flavor === "click") {
      const click = ctx.createBufferSource();
      click.buffer = this.makeNoiseBuffer(0.02);
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 4000;
      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(vel * 0.5, time);
      clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.015);
      click.connect(hp).connect(clickGain).connect(this.dest("kick"));
      click.start(time);
      click.stop(time + 0.02);
    }

    if (flavor === "909") {
      // The 909's kick circuit layers a distinct high-passed click from a
      // separate attack path on top of the pitched body - that click is
      // most of what makes it read as "909" rather than a generic kick.
      const click = ctx.createBufferSource();
      click.buffer = this.makeNoiseBuffer(0.015);
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 3200;
      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(vel * 0.4, time);
      clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.015);
      click.connect(hp).connect(clickGain).connect(this.dest("kick"));
      click.start(time);
      click.stop(time + 0.018);
    }

    if (flavor === "707") {
      // A PCM sample's transient is a clean, fast broadband tick rather
      // than the analog machines' resonant click circuits - shorter and
      // less filtered than the 808/909 click above.
      const click = ctx.createBufferSource();
      click.buffer = this.makeNoiseBuffer(0.008);
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 2800;
      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(vel * 0.3, time);
      clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.008);
      click.connect(hp).connect(clickGain).connect(this.dest("kick"));
      click.start(time);
      click.stop(time + 0.01);
    }

    if (flavor === "dmx") {
      // The DMX's reputation for a hard, "gated" punch comes from its
      // sample being run through a fast analog compressor on the way out -
      // approximated here with a touch of waveshaper saturation on top of
      // the pitched body, the same "drive it a little for extra bite"
      // trick the true-808 bass/kick already leans on elsewhere.
      const shaper = ctx.createWaveShaper();
      shaper.curve = this.makeDistortionCurve(14);
      const driveGain = ctx.createGain();
      driveGain.gain.setValueAtTime(vel * 0.5, time);
      driveGain.gain.exponentialRampToValueAtTime(0.001, time + p.decay * 0.6);
      osc.connect(shaper).connect(driveGain).connect(this.dest("kick"));
    }
  }

  playSnare(time, vel, flavor) {
    if (this.playSampleFlavor("snare", flavor, time, vel)) return;
    const ctx = this.ctx;
    const presets = {
      crisp: { noiseHp: 1200, noiseDecay: 0.18, toneFreq: 190, toneDecay: 0.12 },
      clap: { noiseHp: 1000, noiseDecay: 0.22, toneFreq: 0, toneDecay: 0 },
      fat: { noiseHp: 500, noiseDecay: 0.2, toneFreq: 150, toneDecay: 0.15 },
      rimshot: { noiseHp: 2500, noiseDecay: 0.06, toneFreq: 420, toneDecay: 0.05 },
      trapsnap: { noiseHp: 3500, noiseDecay: 0.09, toneFreq: 300, toneDecay: 0.06 },
      brush: { noiseHp: 2000, noiseDecay: 0.4, toneFreq: 0, toneDecay: 0 },
      gated: { noiseHp: 1800, noiseDecay: 0.09, toneFreq: 220, toneDecay: 0.08 },
      acoustic: { noiseHp: 900, noiseDecay: 0.28, toneFreq: 180, toneDecay: 0.18 },
      ghost: { noiseHp: 2200, noiseDecay: 0.05, toneFreq: 0, toneDecay: 0 },
      layered: { noiseHp: 2600, noiseDecay: 0.16, toneFreq: 165, toneDecay: 0.22 },
      // TR-909: bright, snappy, slightly metallic - the crisp techno/house
      // snare character. LinnDrum: a cleaner, more mid-focused 80s pop
      // snare with a touch more tail than the 909's short snap.
      "909snare": { noiseHp: 2200, noiseDecay: 0.16, toneFreq: 205, toneDecay: 0.1 },
      linn: { noiseHp: 1500, noiseDecay: 0.24, toneFreq: 195, toneDecay: 0.16 },
      // TR-707: clean PCM-sample snap, tight and bright with very little
      // low-mid body - the freestyle/early-house snare. DMX: a hard,
      // bright, slightly metallic "clang" with a short, compressed-sounding
      // tail - the early-hip-hop snare, distinct from the 909's rounder
      // metallic ring by having more upper-mid bite and less low tone.
      "707": { noiseHp: 2600, noiseDecay: 0.13, toneFreq: 240, toneDecay: 0.08 },
      dmx: { noiseHp: 3000, noiseDecay: 0.1, toneFreq: 340, toneDecay: 0.07 },
      // The E-mu SP-1200's snare sample, low sample rate and all - a
      // fairly full-bodied noise burst (real 80s/90s samples weren't thin)
      // with the bit-crush/band-limit processing below doing the real work
      // of making it read as "vintage sampler" rather than clean synthesis.
      sp1200: { noiseHp: 1000, noiseDecay: 0.21, toneFreq: 175, toneDecay: 0.15 },
      // LM-1: the first sampled-acoustic snare, and the reason 80s pop
      // suddenly had "real" drums on a machine - full-bodied, natural,
      // longer tail than any analog machine. RZ-1: 12-bit, thin and
      // electronic. HR-16: 16-bit acoustic, natural, notably its
      // handclaps. R-8: PCM rock snare with real body.
      lm1: { noiseHp: 1200, noiseDecay: 0.26, toneFreq: 185, toneDecay: 0.18 },
      rz1: { noiseHp: 2400, noiseDecay: 0.14, toneFreq: 260, toneDecay: 0.09 },
      hr16: { noiseHp: 1100, noiseDecay: 0.29, toneFreq: 178, toneDecay: 0.2 },
      r8: { noiseHp: 1300, noiseDecay: 0.3, toneFreq: 190, toneDecay: 0.22 },
      drumulator: { noiseHp: 1400, noiseDecay: 0.19, toneFreq: 200, toneDecay: 0.12 },
      // --- round 13 -------------------------------------------------------
      // A snare is a noise burst (the wires) over a tuned burst (the head).
      // How high the noise is filtered sets how "crisp" versus "thick" it
      // reads; how long it rings sets how big the room sounds.
      piccolo: { noiseHp: 2800, noiseDecay: 0.11, toneFreq: 330, toneDecay: 0.06 },
      deepsnare: { noiseHp: 900, noiseDecay: 0.32, toneFreq: 150, toneDecay: 0.24 },
      crack: { noiseHp: 2200, noiseDecay: 0.09, toneFreq: 290, toneDecay: 0.05 },
      roomsnare: { noiseHp: 1000, noiseDecay: 0.45, toneFreq: 180, toneDecay: 0.3 },
      snap: { noiseHp: 3400, noiseDecay: 0.07, toneFreq: 380, toneDecay: 0.04 },
      thicksnare: { noiseHp: 800, noiseDecay: 0.26, toneFreq: 160, toneDecay: 0.2 },
      brushswirl: { noiseHp: 1500, noiseDecay: 0.38, toneFreq: 210, toneDecay: 0.05 },
      sidestick: { noiseHp: 2600, noiseDecay: 0.05, toneFreq: 420, toneDecay: 0.09 },
      drillsnare: { noiseHp: 2900, noiseDecay: 0.12, toneFreq: 310, toneDecay: 0.06 },
      housesnare: { noiseHp: 1800, noiseDecay: 0.17, toneFreq: 245, toneDecay: 0.1 },
      dnbsnare: { noiseHp: 1600, noiseDecay: 0.23, toneFreq: 225, toneDecay: 0.14 },
      lofisnare: { noiseHp: 1150, noiseDecay: 0.24, toneFreq: 195, toneDecay: 0.17 },
      drumtraks: { noiseHp: 1600, noiseDecay: 0.22, toneFreq: 215, toneDecay: 0.14 },
      rx5: { noiseHp: 1900, noiseDecay: 0.2, toneFreq: 230, toneDecay: 0.12 },
      cr8000: { noiseHp: 2100, noiseDecay: 0.11, toneFreq: 280, toneDecay: 0.07 },
      kr55: { noiseHp: 1700, noiseDecay: 0.15, toneFreq: 250, toneDecay: 0.09 },
      dr110: { noiseHp: 2800, noiseDecay: 0.09, toneFreq: 320, toneDecay: 0.05 },
      mpc60: { noiseHp: 1150, noiseDecay: 0.25, toneFreq: 186, toneDecay: 0.17 },
    };
    const p = presets[flavor] || presets.crisp;

    if (flavor === "gatedverb") {
      // Gated reverb: a big bright reverb slammed shut by a noise gate
      // before it can decay - discovered by accident at Townhouse
      // Studios and immediately became THE 80s drum sound. The gate is
      // the point: the tail must stop abruptly, not fade.
      const noise = ctx.createBufferSource();
      noise.buffer = this.makeNoiseBuffer(0.3);
      const hp2 = ctx.createBiquadFilter();
      hp2.type = "highpass";
      hp2.frequency.value = 1400;
      const g1 = ctx.createGain();
      g1.gain.setValueAtTime(vel, time);
      g1.gain.exponentialRampToValueAtTime(0.01, time + 0.14);
      noise.connect(hp2).connect(g1).connect(this.dest("snare"));
      noise.start(time);
      noise.stop(time + 0.16);

      const tone = ctx.createOscillator();
      tone.type = "triangle";
      tone.frequency.setValueAtTime(210, time);
      const tg = ctx.createGain();
      tg.gain.setValueAtTime(vel * 0.6, time);
      tg.gain.exponentialRampToValueAtTime(0.01, time + 0.09);
      tone.connect(tg).connect(this.dest("snare"));
      tone.start(time);
      tone.stop(time + 0.1);

      // The gated tail: a dense burst held flat, then cut dead.
      const tail = ctx.createBufferSource();
      tail.buffer = this.makeNoiseBuffer(0.4);
      const tailBp = ctx.createBiquadFilter();
      tailBp.type = "bandpass";
      tailBp.frequency.value = 1800;
      tailBp.Q.value = 0.6;
      const tailGain = ctx.createGain();
      const gateLen = 0.19;
      tailGain.gain.setValueAtTime(0.0001, time);
      tailGain.gain.linearRampToValueAtTime(vel * 0.5, time + 0.012);
      tailGain.gain.setValueAtTime(vel * 0.42, time + gateLen);
      tailGain.gain.linearRampToValueAtTime(0.0001, time + gateLen + 0.008);
      tail.connect(tailBp).connect(tailGain).connect(this.dest("snare"));
      tail.start(time);
      tail.stop(time + gateLen + 0.03);
      return;
    }

    if (flavor === "rimclick") {
      // Cross-stick (rim click): the stick lies across the head and taps
      // the rim - a dry, woody "tock" with almost no snare-wire noise.
      // The ballad/neo-soul/bossa backbeat staple, and nothing like a
      // full snare hit: two short tones (a bright rim click plus a lower
      // wood body) and only a whisper of noise.
      const click = ctx.createOscillator();
      click.type = "triangle";
      click.frequency.setValueAtTime(1700, time);
      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(vel * 0.7, time);
      clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
      click.connect(clickGain).connect(this.dest("snare"));
      click.start(time);
      click.stop(time + 0.035);

      const body = ctx.createOscillator();
      body.type = "sine";
      body.frequency.setValueAtTime(760, time);
      body.frequency.exponentialRampToValueAtTime(520, time + 0.05);
      const bodyGain = ctx.createGain();
      bodyGain.gain.setValueAtTime(vel * 0.5, time);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
      body.connect(bodyGain).connect(this.dest("snare"));
      body.start(time);
      body.stop(time + 0.07);

      const wisp = ctx.createBufferSource();
      wisp.buffer = this.makeNoiseBuffer(0.04);
      const wispHp = ctx.createBiquadFilter();
      wispHp.type = "highpass";
      wispHp.frequency.value = 4000;
      const wispGain = ctx.createGain();
      wispGain.gain.setValueAtTime(vel * 0.12, time);
      wispGain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
      wisp.connect(wispHp).connect(wispGain).connect(this.dest("snare"));
      wisp.start(time);
      wisp.stop(time + 0.045);
      return;
    }

    if (flavor === "clap") {
      const offsets = [0, 0.012, 0.026];
      for (const off of offsets) {
        const noise = ctx.createBufferSource();
        noise.buffer = this.makeNoiseBuffer(0.3);
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 1100 + Math.random() * 300;
        const g = ctx.createGain();
        g.gain.setValueAtTime(vel * 0.8, time + off);
        g.gain.exponentialRampToValueAtTime(0.01, time + off + p.noiseDecay);
        noise.connect(bp).connect(g).connect(this.dest("snare"));
        noise.start(time + off);
        noise.stop(time + off + p.noiseDecay);
      }
      return;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = this.makeNoiseBuffer(0.3);
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = p.noiseHp * (0.85 + Math.random() * 0.3);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(vel, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + p.noiseDecay);
    if (flavor === "sp1200") {
      const crush = ctx.createWaveShaper();
      crush.curve = this.makeBitcrushCurve(30);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 9000;
      noise.connect(filter).connect(crush).connect(lp).connect(noiseGain).connect(this.dest("snare"));
    } else {
      noise.connect(filter).connect(noiseGain).connect(this.dest("snare"));
    }
    noise.start(time);
    noise.stop(time + p.noiseDecay);

    if (p.toneFreq) {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(p.toneFreq, time);
      oscGain.gain.setValueAtTime(vel * 0.7, time);
      oscGain.gain.exponentialRampToValueAtTime(0.01, time + p.toneDecay);
      osc.connect(oscGain).connect(this.dest("snare"));
      osc.start(time);
      osc.stop(time + p.toneDecay);
    }
  }

  playHihat(time, vel, open, flavor, trackKey) {
    if (this.playSampleFlavor(trackKey || "hihat", flavor, time, vel)) return;
    const ctx = this.ctx;
    const presets = {
      bright: { hp: 7500, lp: null },
      dark: { hp: 6000, lp: 11000 },
      vinyl: { hp: 5000, lp: 8500 },
      metallic: { hp: 8500, lp: null, peak: 9000 },
      analog: { hp: 7100, lp: 12000, peak: 7000, decay: 0.85 },
      tape: { hp: 5500, lp: 9500, peak: 6500 },
      sizzle: { hp: 9500, lp: null, peak: 11000 },
      lofi808: { hp: 7000, lp: 10500 },
      // TR-707: a clean PCM sample, tighter and less splashy than the
      // analog-noise hats above. TR-606: thin, papery, higher-pitched -
      // the 606's tiny analog circuit never had much hat body to begin
      // with, which is exactly its charm in early acid/techno.
      "707": { hp: 8000, lp: 12500, peak: 9500 },
      "606": { hp: 9800, lp: null },
      // LM-1: a sampled real hi-hat, so it has more body and a lower
      // centre than any analog machine's filtered hiss. RZ-1: 12-bit,
      // band-limited by its own converters - bright but capped. R-8: a
      // clean, full PCM hat with a wide spectrum.
      // The LM-1 sampled at 8 bits and 28kHz, so its hat is short, gritty
      // and band-limited - nothing like the MPC60's 12-bit 40kHz hat, which
      // is the fullest and longest of the sampled machines here.
      lm1: { hp: 7400, lp: 10000, peak: 8200, decay: 0.78 },
      // RZ-1 and Drumulator were 300Hz and 500Hz apart, which is to say they
      // were the same sound with two names - a rendering comparison put them
      // closer to each other than either was to a second render of itself.
      // They are not remotely the same machine: the RZ-1 is a 1986 Casio with
      // 12-bit samples, thin and short and digital-bright; the Drumulator is
      // a 1983 E-mu running 8-bit samples at 27kHz, which is dark, gritty and
      // noticeably longer. DECAY is the thing that separates hi-hats to the
      // ear more than filter corners do, and every preset here was using the
      // identical decay.
      rz1: { hp: 8200, lp: 9500, decay: 0.72 },
      r8: { hp: 6800, lp: 14000, peak: 8500, decay: 1.0 },
      drumulator: { hp: 5600, lp: 8200, peak: 6200, decay: 1.45 },
      rx5: { hp: 7800, lp: 13500, peak: 9000, decay: 0.95 },
      cr8000: { hp: 8600, lp: 12000, decay: 0.8 },
      kr55: { hp: 7000, lp: 11000, peak: 8000, decay: 1.1 },
      dr110: { hp: 9200, lp: null, decay: 0.65 },
      // Same problem with analog vs MPC60 - 100Hz apart on every corner. The
      // MPC60 is a 12-bit sampler at 40kHz playing a real recorded hat, so it
      // has body and length; "analog" is filtered noise from a drum machine
      // that never sampled anything, which is drier and tighter.
      mpc60: { hp: 5800, lp: 14500, peak: 7200, decay: 1.5 },
      // --- round 13 -------------------------------------------------------
      // Round 12 established that DECAY separates hi-hats to the ear far more
      // than filter corners do, after two pairs shipped that were the same
      // sound under different names. Every one of these moves both.
      trapclosed: { hp: 8800, lp: 15000, peak: 10500, decay: 0.55 },
      washy: { hp: 5200, lp: 12000, peak: 6800, decay: 2.1 },
      foot: { hp: 4200, lp: 9000, decay: 0.45 },
      tick: { hp: 11000, lp: null, decay: 0.35 },
      halfopen: { hp: 6200, lp: 13500, peak: 8000, decay: 1.8 },
      brushhat: { hp: 3800, lp: 8500, decay: 1.35 },
      glassy: { hp: 9600, lp: null, peak: 12500, decay: 0.9 },
      dirty: { hp: 4600, lp: 10500, peak: 5800, decay: 1.25 },
      clave606: { hp: 10400, lp: 14000, decay: 0.5 },
      shimmer: { hp: 7600, lp: null, peak: 9800, decay: 1.65 },
    };
    const base = open ? 0.32 + Math.random() * 0.1 : 0.05 + Math.random() * 0.02;
    const decay = base * ((presets[flavor] && presets[flavor].decay) || 1);

    if (flavor === "909") {
      // The real TR-909 hat isn't noise at all - it's six square-wave
      // oscillators at specific inharmonic frequency ratios, summed and
      // high-passed. That oscillator cluster (rather than filtered noise)
      // is exactly what gives it that recognizable metallic, slightly
      // ringing character instead of a plain hiss.
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 0.5, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + decay);
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 8000;
      hp.connect(gain).connect(this.dest(trackKey));
      for (const ratio of [1, 1.48, 1.8, 2.55, 3.9, 5.43]) {
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.value = 205 * ratio;
        osc.connect(hp);
        osc.start(time);
        osc.stop(time + decay + 0.02);
      }
      return;
    }

    if (flavor === "ride") {
      // A ride cymbal is the one cymbal the app never had: unlike a hat's
      // short hiss, a ride SUSTAINS - a strong strike "ping" (inharmonic
      // partial cluster) rides on top of a long shimmering wash, which is
      // why jazz and rock drummers can play time on it continuously.
      const decay = open ? 2.2 : 1.3;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 0.35, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + decay);
      const hp2 = ctx.createBiquadFilter();
      hp2.type = "highpass";
      hp2.frequency.value = 2800;
      hp2.connect(gain).connect(this.dest(trackKey));
      for (const ratio of [1, 1.34, 1.94, 2.61, 3.42]) {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = 840 * ratio;
        osc.connect(hp2);
        osc.start(time);
        osc.stop(time + decay + 0.05);
      }
      const wash = ctx.createBufferSource();
      wash.buffer = this.makeNoiseBuffer(1.8);
      const washHp = ctx.createBiquadFilter();
      washHp.type = "highpass";
      washHp.frequency.value = 6500;
      const washGain = ctx.createGain();
      washGain.gain.setValueAtTime(vel * 0.15, time);
      washGain.gain.exponentialRampToValueAtTime(0.01, time + decay * 0.7);
      wash.connect(washHp).connect(washGain).connect(this.dest(trackKey));
      wash.start(time);
      wash.stop(time + decay * 0.7);
      return;
    }

    const p = presets[flavor] || presets.bright;

    const noise = ctx.createBufferSource();
    noise.buffer = this.makeNoiseBuffer(0.5);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = p.hp;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vel * 0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + decay);

    let node = noise.connect(hp);
    if (p.lp) {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = p.lp;
      node = node.connect(lp);
    }
    if (p.peak) {
      const peak = ctx.createBiquadFilter();
      peak.type = "peaking";
      peak.frequency.value = p.peak;
      peak.Q.value = 6;
      peak.gain.value = 10;
      node = node.connect(peak);
    }
    node.connect(gain).connect(this.dest(trackKey));
    noise.start(time);
    noise.stop(time + decay);
  }

  playHihatRoll(time, stepDuration, open, flavor, trackKey) {
    const hits = 3;
    for (let i = 0; i < hits; i++) {
      const t = time + (i * stepDuration) / hits;
      const vel = 0.5 + (i / hits) * 0.5;
      this.playHihat(t, this.jitterVel(vel), open && i === hits - 1, flavor, trackKey);
    }
  }


  // A generic struck/plucked tuned voice. Almost every mallet, bell, plucked
  // and struck instrument is the same thing with different numbers: a set of
  // partials at particular RATIOS, each with its own level and its own decay,
  // over an optional strike transient. Writing that once rather than fifteen
  // times is the difference between adding an instrument and copying one.
  playStruckVoice(time, freq, vel, dest, spec) {
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.gain.value = vel * (spec.gain || 0.5);
    out.connect(dest);
    for (const [ratio, lvl, decay] of spec.partials) {
      const f = freq * ratio;
      if (f > 15000 || f < 20) continue;
      const o = ctx.createOscillator();
      o.type = spec.type || "sine";
      o.frequency.setValueAtTime(f, time);
      const g = ctx.createGain();
      g.gain.setValueAtTime(lvl, time);
      g.gain.exponentialRampToValueAtTime(0.0001, time + decay);
      o.connect(g).connect(out);
      o.start(time);
      o.stop(time + decay + 0.05);
    }
    if (spec.strike) {
      const n = ctx.createBufferSource();
      n.buffer = this.makeNoiseBuffer(spec.strike.len);
      const bp = ctx.createBiquadFilter();
      bp.type = spec.strike.type || "bandpass";
      bp.frequency.value = spec.strike.freq;
      bp.Q.value = spec.strike.q || 1;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vel * spec.strike.level, time);
      g.gain.exponentialRampToValueAtTime(0.0001, time + spec.strike.len);
      n.connect(bp).connect(g).connect(dest);
      n.start(time);
      n.stop(time + spec.strike.len + 0.01);
    }
  }


  // -------------------------------------------------------------------------
  // Playing a loaded sample instead of synthesizing
  // -------------------------------------------------------------------------
  // A sample is offered as a KIT rather than as a new kind of track: the
  // flavor string "sample:<id>" on any track means "play this recording here".
  // That is what makes it work everywhere flavors already work - the per-track
  // picker, the offline render, artist profiles - instead of needing a
  // parallel path through the whole engine.
  //
  // Returns true when it handled the note, so each voice can simply start
  // with `if (this.playSampleFlavor(...)) return;`.
  playSampleFlavor(track, flavor, time, vel, freq, durationSeconds, step) {
    if (typeof SampleBank === "undefined") return false;
    const item = SampleBank.resolve(flavor);
    if (!item || !item.buffer) return false;
    const ctx = this.ctx;

    // Which slice? A sliced loop walks its slices in step order, so a chopped
    // break re-sequences across the grid rather than replaying as one lump.
    let slice = item.slices[0];
    if (item.mode === "sliced" && item.slices.length > 1) {
      // With a step number, the slice follows the position in the bar, so a
      // chopped break re-sequences across the grid. Without one - which is
      // every drum lane, since those voices are not given the step - walk the
      // slices in turn instead. That is what a sampler does when a chopped
      // loop is triggered repeatedly, and it beats playing slice 0 forever.
      let idx;
      if (step === undefined || step === null) {
        item._cursor = ((item._cursor || 0) + 1) % item.slices.length;
        idx = item._cursor;
      } else {
        idx = ((step | 0) % item.slices.length + item.slices.length) % item.slices.length;
      }
      slice = item.slices[idx];
    }

    const src = ctx.createBufferSource();
    src.buffer = item.buffer;

    // A pitched sample transposes by playback rate. Everything else plays at
    // its recorded speed.
    if (item.mode === "pitched" && freq) {
      const rootFreq = 440 * Math.pow(2, (item.rootMidi - 69) / 12);
      src.playbackRate.value = Math.max(0.06, Math.min(16, freq / rootFreq));
    }

    const g = ctx.createGain();
    const level = vel * (item.gain === undefined ? 1 : item.gain);
    g.gain.setValueAtTime(level, time);

    // How long to let it run. A one-shot rings out; a slice is cut at its own
    // end; a pitched note follows the note length. The short fade is not
    // decoration - cutting a waveform mid-cycle is a click, and a sliced loop
    // would click on every single slice without it.
    const rate = src.playbackRate.value || 1;
    const sliceLen = (slice.end - slice.start) / rate;
    let playFor = sliceLen;
    if (item.mode === "pitched" && durationSeconds) playFor = Math.min(sliceLen, durationSeconds);
    const fade = Math.min(0.006, playFor * 0.25);
    g.gain.setValueAtTime(level, time + Math.max(0, playFor - fade));
    g.gain.linearRampToValueAtTime(0.0001, time + playFor);

    src.connect(g).connect(this.dest(track));
    src.start(time, slice.start, playFor * rate + 0.02);
    src.stop(time + playFor + 0.02);
    return true;
  }

  playTom(time, vel, flavor) {
    if (this.playSampleFlavor("tom", flavor, time, vel)) return;
    const ctx = this.ctx;

    // A drum tom is a pitched membrane: a fundamental that drops as the head
    // relaxes, a couple of inharmonic modes above it, and a stick transient.
    // Those four numbers are all that separates most toms from each other, so
    // the newer ones are a table.
    //
    //   base    fundamental in Hz, plus a little randomness per hit so a fill
    //           does not sound like the same sample five times
    //   bend    how far above the fundamental the attack starts
    //   decay   length of the body
    //   modes   [ratio, level] for the inharmonic partials
    //   stick   [level, highpass Hz, length]
    const TOMS = {
      // The LinnDrum's toms, which are short, dry and slightly boxy.
      linn:     { base: 150, spread: 20, bend: 1.5, decay: 0.3, modes: [[1, 1], [1.58, 0.24]], stick: [0.24, 2600, 0.01] },
      // The 909's tom: more noise in the shell than the 808's, still analog.
      "909tom": { base: 128, spread: 24, bend: 1.7, decay: 0.36, modes: [[1, 1], [1.72, 0.2]], stick: [0.3, 1400, 0.02], noise: 0.14 },
      // Deliberately synthetic, tuned high and short - the electro tom.
      electro:  { base: 210, spread: 40, bend: 2.4, decay: 0.2, modes: [[1, 1], [2.4, 0.3], [3.9, 0.12]], stick: [0.35, 3000, 0.008] },
      // Very low and long, for the tom that lands under a whole bar.
      deeptom:  { base: 62, spread: 6, bend: 1.28, decay: 0.85, modes: [[1, 1], [1.5, 0.3], [2.05, 0.12]], stick: [0.2, 1500, 0.02] },
      // A concert tom: tuned, resonant, almost melodic, with little bend.
      concert:  { base: 118, spread: 12, bend: 1.12, decay: 0.7, modes: [[1, 1], [1.59, 0.4], [2.14, 0.18], [2.92, 0.07]], stick: [0.26, 2200, 0.014] },
      // A tight rack tom with heavy damping - the muffled 70s sound.
      damped:   { base: 165, spread: 15, bend: 1.35, decay: 0.16, modes: [[1, 1], [1.6, 0.18]], stick: [0.3, 2400, 0.012] },
      // Hard, bright and hybrid: an acoustic tom layered with a synth blip.
      hybridtom:{ base: 140, spread: 22, bend: 2.0, decay: 0.34, modes: [[1, 1], [1.55, 0.3], [4.2, 0.14]], stick: [0.42, 3400, 0.01], noise: 0.1 },
    };
    if (TOMS[flavor]) {
      const p = TOMS[flavor];
      const base = p.base + Math.random() * p.spread;
      const dest = this.dest("tom");
      const g = ctx.createGain();
      g.gain.setValueAtTime(vel, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + p.decay);
      g.connect(dest);
      for (const [ratio, lvl] of p.modes) {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(base * ratio * p.bend, time);
        o.frequency.exponentialRampToValueAtTime(base * ratio, time + p.decay * 0.35);
        const pg = ctx.createGain();
        pg.gain.value = lvl;
        o.connect(pg).connect(g);
        o.start(time);
        o.stop(time + p.decay + 0.05);
      }
      if (p.noise) {
        const n = ctx.createBufferSource();
        n.buffer = this.makeNoiseBuffer(p.decay);
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = base * 3;
        bp.Q.value = 0.7;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(vel * p.noise, time);
        ng.gain.exponentialRampToValueAtTime(0.0001, time + p.decay * 0.5);
        n.connect(bp).connect(ng).connect(dest);
        n.start(time);
        n.stop(time + p.decay);
      }
      const [slv, shp, slen] = p.stick;
      const stick = ctx.createBufferSource();
      stick.buffer = this.makeNoiseBuffer(slen);
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = shp;
      const sg = ctx.createGain();
      sg.gain.setValueAtTime(vel * slv, time);
      sg.gain.exponentialRampToValueAtTime(0.0001, time + slen);
      stick.connect(hp).connect(sg).connect(dest);
      stick.start(time);
      stick.stop(time + slen + 0.005);
      return;
    }

    if (flavor === "808tom") {
      // The 808's tom is the same circuit as its kick with the decay shortened
      // and the pitch raised - a pure sine with an exponential pitch drop and
      // no noise component whatsoever.
      const o = ctx.createOscillator();
      o.type = "sine";
      const base = 120 + Math.random() * 40;
      o.frequency.setValueAtTime(base * 1.9, time);
      o.frequency.exponentialRampToValueAtTime(base, time + 0.09);
      const g = ctx.createGain();
      g.gain.setValueAtTime(vel * 0.95, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.42);
      o.connect(g).connect(this.dest("tom"));
      o.start(time);
      o.stop(time + 0.45);
      return;
    }

    if (flavor === "floor") {
      // A big floor tom: low fundamental, a strong second mode, and a short
      // burst of stick noise on the head at the very start.
      const base = 78 + Math.random() * 10;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vel, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
      g.connect(this.dest("tom"));
      for (const [ratio, lvl] of [[1, 1], [1.5, 0.34], [2.1, 0.15]]) {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(base * ratio * 1.25, time);
        o.frequency.exponentialRampToValueAtTime(base * ratio, time + 0.12);
        const pg = ctx.createGain();
        pg.gain.value = lvl;
        o.connect(pg).connect(g);
        o.start(time);
        o.stop(time + 0.65);
      }
      const stick = ctx.createBufferSource();
      stick.buffer = this.makeNoiseBuffer(0.016);
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 1800;
      const sg = ctx.createGain();
      sg.gain.setValueAtTime(vel * 0.3, time);
      sg.gain.exponentialRampToValueAtTime(0.001, time + 0.016);
      stick.connect(hp).connect(sg).connect(this.dest("tom"));
      stick.start(time);
      stick.stop(time + 0.02);
      return;
    }

    if (flavor === "gatedtom") {
      // The 80s sound: a tom into a big reverb with the tail cut off dead by
      // a gate. What makes it work is the ABRUPTNESS - a long swell of noise
      // that stops instantly rather than fading.
      const base = 100 + Math.random() * 30;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vel, time);
      g.gain.setValueAtTime(vel * 0.85, time + 0.16);
      g.gain.linearRampToValueAtTime(0.0001, time + 0.19);   // the gate slams
      g.connect(this.dest("tom"));
      for (const [ratio, lvl] of [[1, 1], [1.6, 0.3]]) {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(base * ratio * 1.3, time);
        o.frequency.exponentialRampToValueAtTime(base * ratio, time + 0.1);
        const pg = ctx.createGain();
        pg.gain.value = lvl;
        o.connect(pg).connect(g);
        o.start(time);
        o.stop(time + 0.22);
      }
      const wash = ctx.createBufferSource();
      wash.buffer = this.makeNoiseBuffer(0.2);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass"; bp.frequency.value = 900; bp.Q.value = 0.7;
      const wg = ctx.createGain();
      wg.gain.value = vel * 0.42;
      wash.connect(bp).connect(wg).connect(g);
      wash.start(time);
      wash.stop(time + 0.2);
      return;
    }
    if (flavor === "taiko") {
      // A large Japanese barrel drum: a very heavy, low, slowly-decaying
      // fundamental with a thick wooden body and almost no attack noise,
      // played with heavy bachi sticks. The weight is the instrument.
      const base = 62 + Math.random() * 12;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 1.1, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.95);
      gain.connect(this.dest("tom"));
      for (const [ratio, lvl] of [[1, 1], [1.62, 0.3], [2.4, 0.14]]) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(base * ratio, time);
        osc.frequency.exponentialRampToValueAtTime(base * ratio * 0.8, time + 0.5);
        const g = ctx.createGain();
        g.gain.setValueAtTime(lvl, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.95 / (ratio * 0.8));
        osc.connect(g).connect(gain);
        osc.start(time);
        osc.stop(time + 1.0);
      }
      const wood = ctx.createBufferSource();
      wood.buffer = this.makeNoiseBuffer(0.04);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1400;
      const wg = ctx.createGain();
      wg.gain.setValueAtTime(vel * 0.45, time);
      wg.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
      wood.connect(lp).connect(wg).connect(this.dest("tom"));
      wood.start(time);
      wood.stop(time + 0.05);
      return;
    }
    if (flavor === "roto") {
      // Roto-toms have no shell at all - just a head on a tunable frame -
      // so they are bright, dry, and very pitched, with the fast downward
      // glissando 80s records used them for.
      const base = 240 + Math.random() * 120;
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(base, time);
      osc.frequency.exponentialRampToValueAtTime(base * 0.55, time + 0.28);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 0.85, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
      osc.connect(gain).connect(this.dest("tom"));
      osc.start(time);
      osc.stop(time + 0.32);
      const head = ctx.createBufferSource();
      head.buffer = this.makeNoiseBuffer(0.02);
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 2200;
      const hg = ctx.createGain();
      hg.gain.setValueAtTime(vel * 0.35, time);
      hg.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
      head.connect(hp).connect(hg).connect(this.dest("tom"));
      head.start(time);
      head.stop(time + 0.03);
      return;
    }
    if (flavor === "simmons") {
      // The Simmons SDS-V (1981) is the definitive 80s "electronic tom" -
      // not a drum sound at all really, but a pure sine with a fast,
      // dramatic downward pitch sweep and a much longer ring than any
      // acoustic tom (Duran Duran, Phil Collins-era pop). The sweep here
      // is roughly triple the acoustic tom's pitch drop and stretched
      // over a longer decay to get that unmistakable electronic "pew."
      const osc = ctx.createOscillator();
      osc.type = "sine";
      const gain = ctx.createGain();
      const startFreq = 340 + Math.random() * 30;
      osc.frequency.setValueAtTime(startFreq, time);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 0.18, time + 0.35);
      gain.gain.setValueAtTime(vel, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);
      osc.connect(gain).connect(this.dest("tom"));
      osc.start(time);
      osc.stop(time + 0.48);
      return;
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startFreq = 160 + Math.random() * 20;
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.55, time + 0.22);
    gain.gain.setValueAtTime(vel, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);
    osc.connect(gain).connect(this.dest("tom"));
    osc.start(time);
    osc.stop(time + 0.3);
  }

  playPerc(time, vel, flavor) {
    if (this.playSampleFlavor("perc", flavor, time, vel)) return;
    const ctx = this.ctx;
    if (flavor === "cowbell") {
      // Classic 808-style cowbell: two detuned square oscillators through a
      // resonant bandpass filter, the same trick real cowbell circuits use.
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 800;
      bp.Q.value = 2.5;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 0.7, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);
      gain.connect(this.dest("perc"));
      bp.connect(gain);
      for (const freq of [540, 800]) {
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, time);
        osc.connect(bp);
        osc.start(time);
        osc.stop(time + 0.3);
      }
      return;
    }
    if (flavor === "conga") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const freq = 220 + Math.random() * 40;
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, time + 0.12);
      gain.gain.setValueAtTime(vel * 0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
      osc.connect(gain).connect(this.dest("perc"));
      osc.start(time);
      osc.stop(time + 0.16);
      return;
    }
    if (flavor === "clave") {
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(2500, time);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 0.6, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      osc.connect(gain).connect(this.dest("perc"));
      osc.start(time);
      osc.stop(time + 0.06);
      return;
    }
    if (flavor === "tambourine") {
      // A cluster of short jangling high-passed noise bursts approximates
      // the metal jingles rattling against the tambourine head.
      for (let i = 0; i < 4; i++) {
        const off = i * 0.012 + Math.random() * 0.006;
        const noise = ctx.createBufferSource();
        noise.buffer = this.makeNoiseBuffer(0.08);
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 6000 + Math.random() * 3000;
        const g = ctx.createGain();
        g.gain.setValueAtTime(vel * 0.35, time + off);
        g.gain.exponentialRampToValueAtTime(0.001, time + off + 0.09);
        noise.connect(hp).connect(g).connect(this.dest("perc"));
        noise.start(time + off);
        noise.stop(time + off + 0.1);
      }
      return;
    }
    if (flavor === "bongo") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const freq = 340 + Math.random() * 60;
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.75, time + 0.08);
      gain.gain.setValueAtTime(vel * 0.75, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      osc.connect(gain).connect(this.dest("perc"));
      osc.start(time);
      osc.stop(time + 0.12);
      return;
    }
    if (flavor === "woodblock") {
      // A struck hollow wood block: a very short, dry, pitched "tok" with
      // no sustain and no metallic ring. The Latin/orchestral percussion
      // staple (and the classic drum-machine woodblock). Distinct from the
      // clave here by being lower, rounder, and rendered as a filtered
      // pitched body rather than a bare square wave - a real block has a
      // strong fundamental plus one inharmonic overtone.
      const strike = ctx.createBufferSource();
      strike.buffer = this.makeNoiseBuffer(0.006);
      const strikeBp = ctx.createBiquadFilter();
      strikeBp.type = "bandpass";
      strikeBp.frequency.value = 3200;
      const strikeGain = ctx.createGain();
      strikeGain.gain.setValueAtTime(vel * 0.35, time);
      strikeGain.gain.exponentialRampToValueAtTime(0.001, time + 0.007);
      strike.connect(strikeBp).connect(strikeGain).connect(this.dest("perc"));
      strike.start(time);
      strike.stop(time + 0.01);

      const base = 1150 + Math.random() * 90;
      for (const [ratio, level, decay] of [[1, 1, 0.055], [2.7, 0.3, 0.03]]) {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(base * ratio, time);
        const g = ctx.createGain();
        g.gain.setValueAtTime(vel * 0.6 * level, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + decay);
        osc.connect(g).connect(this.dest("perc"));
        osc.start(time);
        osc.stop(time + decay + 0.01);
      }
      return;
    }

    if (flavor === "triangle") {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(4200, time);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 4200;
      bp.Q.value = 20;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 0.5, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.9);
      osc.connect(bp).connect(gain).connect(this.dest("perc"));
      osc.start(time);
      osc.stop(time + 0.9);
      return;
    }
    if (flavor === "timpani") {
      // An orchestral tuned drum: a low fundamental with the characteristic
      // slight downward pitch glide right at the strike (the head briefly
      // reads sharp under mallet impact), plus a soft lowpassed mallet
      // attack transient - part of researching a free, well-documented
      // General MIDI-style orchestral kit for genuinely new percussion.
      const osc = ctx.createOscillator();
      osc.type = "sine";
      const freq = 110;
      osc.frequency.setValueAtTime(freq * 1.08, time);
      osc.frequency.exponentialRampToValueAtTime(freq, time + 0.1);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 0.9, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
      osc.connect(gain).connect(this.dest("perc"));
      osc.start(time);
      osc.stop(time + 0.85);

      const strike = ctx.createBufferSource();
      strike.buffer = this.makeNoiseBuffer(0.03);
      const strikeFilter = ctx.createBiquadFilter();
      strikeFilter.type = "lowpass";
      strikeFilter.frequency.value = 900;
      const strikeGain = ctx.createGain();
      strikeGain.gain.setValueAtTime(vel * 0.3, time);
      strikeGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
      strike.connect(strikeFilter).connect(strikeGain).connect(this.dest("perc"));
      strike.start(time);
      strike.stop(time + 0.035);
      return;
    }
    if (flavor === "cr78") {
      // The Roland CR-78 (1978) was the first microprocessor drum machine,
      // and its bongo-ish percussion is built from simple RC-triggered
      // analog oscillators with a fast decay - a boxier, more synthetic
      // "plasticky" resonance than the smoother sine-based conga/bongo
      // already in this engine (Phil Collins' "In the Air Tonight" and the
      // Human League both leaned on this exact machine). A resonant
      // bandpass on a triangle wave, decaying much faster than the cowbell
      // above, gets that dry boxiness right.
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      const freq = 480 + Math.random() * 60;
      osc.frequency.setValueAtTime(freq, time);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = freq;
      bp.Q.value = 8;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 0.65, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
      osc.connect(bp).connect(gain).connect(this.dest("perc"));
      osc.start(time);
      osc.stop(time + 0.1);
      return;
    }
    if (flavor === "talkingdrum") {
      // A West African talking drum's whole character comes from the
      // player squeezing the leather tension cords under their arm right
      // after striking it, bending the pitch upward mid-note to mimic
      // speech inflection - that's a real, deliberate pitch-bend
      // technique, not a decay artifact the way every other tuned
      // percussion voice's downward glide is. Modeled as a bend sharply
      // UP after the strike, then settling - the "doi-oi-oing" of a real
      // squeeze.
      const strike = ctx.createBufferSource();
      strike.buffer = this.makeNoiseBuffer(0.02);
      const strikeFilter = ctx.createBiquadFilter();
      strikeFilter.type = "bandpass";
      strikeFilter.frequency.value = 900;
      const strikeGain = ctx.createGain();
      strikeGain.gain.setValueAtTime(vel * 0.35, time);
      strikeGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
      strike.connect(strikeFilter).connect(strikeGain).connect(this.dest("perc"));
      strike.start(time);
      strike.stop(time + 0.025);

      const osc = ctx.createOscillator();
      osc.type = "triangle";
      const freq = 180 + Math.random() * 35;
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.65, time + 0.12);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.2, time + 0.32);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.36);
      osc.connect(gain).connect(this.dest("perc"));
      osc.start(time);
      osc.stop(time + 0.4);
      return;
    }
    // ---- World percussion -------------------------------------------
    // Each of these is built from what physically makes the sound, not
    // from a generic noise burst with a different filter setting.
    if (flavor === "tabla") {
      // The tabla's defining feature is that its head is deliberately
      // loaded with a tuning paste (the syahi), which makes the drum
      // strongly HARMONIC - unlike almost every other drum, it has a
      // clear pitch with near-integer overtones, which is why tabla
      // "speaks" in pitched syllables. Bending the pitch down with heel
      // pressure is the "ge" stroke.
      const bend = Math.random() < 0.4;
      const base = 290 + Math.random() * 30;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 0.75, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.42);
      gain.connect(this.dest("perc"));
      [1, 2.0, 3.0, 4.0].forEach((ratio, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(base * ratio, time);
        if (bend) osc.frequency.exponentialRampToValueAtTime(base * ratio * 0.72, time + 0.3);
        const g = ctx.createGain();
        g.gain.setValueAtTime(1 / (i + 1.6), time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.42 / (i * 0.5 + 1));
        osc.connect(g).connect(gain);
        osc.start(time);
        osc.stop(time + 0.45);
      });
      const slap = ctx.createBufferSource();
      slap.buffer = this.makeNoiseBuffer(0.02);
      const sf = ctx.createBiquadFilter();
      sf.type = "bandpass";
      sf.frequency.value = 2400;
      const sg = ctx.createGain();
      sg.gain.setValueAtTime(vel * 0.3, time);
      sg.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
      slap.connect(sf).connect(sg).connect(this.dest("perc"));
      slap.start(time);
      slap.stop(time + 0.025);
      return;
    }
    if (flavor === "cabasa" || flavor === "guiro") {
      // Both are scraped, not struck: many small impacts in sequence
      // rather than one transient. A cabasa is steel beads dragged over a
      // cylinder (fast, dense, bright); a guiro is a stick dragged over
      // notches (slower, discrete, you can hear individual teeth).
      const teeth = flavor === "cabasa" ? 14 : 7;
      const span = flavor === "cabasa" ? 0.09 : 0.17;
      for (let i = 0; i < teeth; i++) {
        const t = time + (i / teeth) * span;
        const n = ctx.createBufferSource();
        n.buffer = this.makeNoiseBuffer(0.02);
        const bp2 = ctx.createBiquadFilter();
        bp2.type = "bandpass";
        bp2.frequency.value = flavor === "cabasa" ? 7000 + Math.random() * 2500 : 2600 + i * 180;
        bp2.Q.value = flavor === "cabasa" ? 1.2 : 3;
        const g = ctx.createGain();
        g.gain.setValueAtTime(vel * (flavor === "cabasa" ? 0.16 : 0.24) * (1 - i / (teeth * 1.6)), t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        n.connect(bp2).connect(g).connect(this.dest("perc"));
        n.start(t);
        n.stop(t + 0.035);
      }
      return;
    }
    if (flavor === "agogo") {
      // Two pitched iron bells a fourth or so apart, alternating - the
      // timeline instrument of samba and of West African bell patterns.
      const hi = Math.random() < 0.5;
      const base = hi ? 900 : 660;
      const bp2 = ctx.createBiquadFilter();
      bp2.type = "bandpass";
      bp2.frequency.value = base * 1.5;
      bp2.Q.value = 3;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 0.6, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.26);
      bp2.connect(gain).connect(this.dest("perc"));
      // Iron bells are strongly inharmonic - that clangy ratio set is the
      // whole character.
      for (const ratio of [1, 1.51, 2.37]) {
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.value = base * ratio;
        osc.connect(bp2);
        osc.start(time);
        osc.stop(time + 0.28);
      }
      return;
    }
    if (flavor === "vibraslap") {
      // A rattle: a wooden block struck, setting loose pins buzzing for a
      // long, irregular decay. The buzz is the instrument.
      const strike = ctx.createOscillator();
      strike.type = "triangle";
      strike.frequency.setValueAtTime(360, time);
      const sg = ctx.createGain();
      sg.gain.setValueAtTime(vel * 0.5, time);
      sg.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
      strike.connect(sg).connect(this.dest("perc"));
      strike.start(time);
      strike.stop(time + 0.07);
      const rattle = ctx.createBufferSource();
      rattle.buffer = this.makeNoiseBuffer(0.9);
      const bp2 = ctx.createBiquadFilter();
      bp2.type = "bandpass";
      bp2.frequency.value = 3200;
      bp2.Q.value = 2;
      const rg = ctx.createGain();
      // Irregular, stuttering decay rather than a smooth one.
      rg.gain.setValueAtTime(vel * 0.42, time);
      for (let i = 1; i <= 7; i++) {
        rg.gain.linearRampToValueAtTime(vel * 0.42 * (1 - i / 7) * (0.6 + Math.random() * 0.6), time + i * 0.11);
      }
      rg.gain.exponentialRampToValueAtTime(0.001, time + 0.85);
      rattle.connect(bp2).connect(rg).connect(this.dest("perc"));
      rattle.start(time);
      rattle.stop(time + 0.9);
      return;
    }
    if (flavor === "cajon") {
      // A plywood box: a bass port note when struck in the centre, a
      // sharp corner slap with snare wires behind the top edge.
      const slapHit = Math.random() < 0.5;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(slapHit ? 190 : 95, time);
      osc.frequency.exponentialRampToValueAtTime(slapHit ? 140 : 62, time + 0.1);
      const g = ctx.createGain();
      g.gain.setValueAtTime(vel * (slapHit ? 0.45 : 0.9), time);
      g.gain.exponentialRampToValueAtTime(0.001, time + (slapHit ? 0.1 : 0.2));
      osc.connect(g).connect(this.dest("perc"));
      osc.start(time);
      osc.stop(time + 0.22);
      const wood = ctx.createBufferSource();
      wood.buffer = this.makeNoiseBuffer(slapHit ? 0.12 : 0.04);
      const hp2 = ctx.createBiquadFilter();
      hp2.type = "highpass";
      hp2.frequency.value = slapHit ? 2600 : 1500;
      const wg = ctx.createGain();
      wg.gain.setValueAtTime(vel * (slapHit ? 0.5 : 0.2), time);
      wg.gain.exponentialRampToValueAtTime(0.001, time + (slapHit ? 0.12 : 0.04));
      wood.connect(hp2).connect(wg).connect(this.dest("perc"));
      wood.start(time);
      wood.stop(time + 0.14);
      return;
    }
    if (flavor === "djembe") {
      // A goatskin head on a wooden shell, played with three canonical
      // tones: bass (centre), tone (edge), slap (rim). Wide pitch spread
      // between them is the point - a djembe part is a melody of timbres.
      const kind = Math.random();
      const base = kind < 0.3 ? 90 : kind < 0.7 ? 210 : 330;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(base, time);
      osc.frequency.exponentialRampToValueAtTime(base * 0.75, time + 0.13);
      const g = ctx.createGain();
      g.gain.setValueAtTime(vel * (kind < 0.3 ? 0.95 : 0.6), time);
      g.gain.exponentialRampToValueAtTime(0.001, time + (kind < 0.3 ? 0.3 : 0.16));
      osc.connect(g).connect(this.dest("perc"));
      osc.start(time);
      osc.stop(time + 0.32);
      if (kind >= 0.7) {
        const slap = ctx.createBufferSource();
        slap.buffer = this.makeNoiseBuffer(0.07);
        const hp2 = ctx.createBiquadFilter();
        hp2.type = "highpass";
        hp2.frequency.value = 3400;
        const sg2 = ctx.createGain();
        sg2.gain.setValueAtTime(vel * 0.5, time);
        sg2.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
        slap.connect(hp2).connect(sg2).connect(this.dest("perc"));
        slap.start(time);
        slap.stop(time + 0.08);
      }
      return;
    }
    if (flavor === "timbale") {
      // Shallow metal-shelled drums, played with sticks, no snares - so
      // they ring metallically and much longer than a conga, and the rim
      // (cascara) click is half the instrument.
      const rim = Math.random() < 0.35;
      if (rim) {
        const n = ctx.createBufferSource();
        n.buffer = this.makeNoiseBuffer(0.05);
        const bp2 = ctx.createBiquadFilter();
        bp2.type = "bandpass";
        bp2.frequency.value = 2800;
        bp2.Q.value = 4;
        const g = ctx.createGain();
        g.gain.setValueAtTime(vel * 0.55, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        n.connect(bp2).connect(g).connect(this.dest("perc"));
        n.start(time);
        n.stop(time + 0.06);
        return;
      }
      const base = 300 + Math.random() * 90;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 0.7, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
      gain.connect(this.dest("perc"));
      for (const ratio of [1, 1.59, 2.14]) {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(base * ratio, time);
        osc.frequency.exponentialRampToValueAtTime(base * ratio * 0.86, time + 0.2);
        const g = ctx.createGain();
        g.gain.value = ratio === 1 ? 1 : 0.3;
        osc.connect(g).connect(gain);
        osc.start(time);
        osc.stop(time + 0.32);
      }
      const stick = ctx.createBufferSource();
      stick.buffer = this.makeNoiseBuffer(0.015);
      const hp3 = ctx.createBiquadFilter();
      hp3.type = "highpass";
      hp3.frequency.value = 4000;
      const stg = ctx.createGain();
      stg.gain.setValueAtTime(vel * 0.35, time);
      stg.gain.exponentialRampToValueAtTime(0.001, time + 0.015);
      stick.connect(hp3).connect(stg).connect(this.dest("perc"));
      stick.start(time);
      stick.stop(time + 0.02);
      return;
    }

    // ---- Layering percussion ------------------------------------------
    // These exist mainly to serve the complexity dial: a genuinely
    // intricate beat is built from several interlocking parts at
    // different densities, and that needs instruments that can carry a
    // fast subdivision without fighting the kit for the same frequencies.
    if (flavor === "shekere" || flavor === "ganza" || flavor === "caxixi") {
      // Three shaken vessels, distinguished by what is rattling and
      // against what. A shekere is a beaded net around a dried gourd -
      // hard beads on a hard shell, so it is loud and low-mid heavy with
      // a real thump when it is struck rather than shaken. A ganzá is
      // metal shot in a metal tube - bright and continuous. A caxixi is
      // seeds in a woven basket with a hard gourd bottom - dry and dark.
      const bands = flavor === "shekere" ? [1400, 3200] : flavor === "ganza" ? [5200, 8500] : [2600, 4200];
      const dur = flavor === "ganza" ? 0.1 : 0.075;
      const n = ctx.createBufferSource();
      n.buffer = this.makeNoiseBuffer(dur + 0.03);
      const bp2 = ctx.createBiquadFilter();
      bp2.type = "bandpass";
      bp2.frequency.value = bands[0] + Math.random() * (bands[1] - bands[0]);
      bp2.Q.value = 0.9;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vel * 0.45, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + dur);
      n.connect(bp2).connect(g).connect(this.dest("perc"));
      n.start(time);
      n.stop(time + dur + 0.02);
      if (flavor === "shekere") {
        // The gourd body being struck by the beads.
        const body = ctx.createOscillator();
        body.type = "sine";
        body.frequency.setValueAtTime(190, time);
        body.frequency.exponentialRampToValueAtTime(130, time + 0.06);
        const bg = ctx.createGain();
        bg.gain.setValueAtTime(vel * 0.35, time);
        bg.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
        body.connect(bg).connect(this.dest("perc"));
        body.start(time);
        body.stop(time + 0.08);
      }
      return;
    }
    if (flavor === "udu") {
      // A clay pot with a side hole: a Helmholtz resonator. Striking the
      // hole changes the effective volume of air and therefore the pitch,
      // which is why an udu can play a two-note bass melody with a hand.
      const open = Math.random() < 0.45;
      const base = open ? 78 : 128;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(base * 1.4, time);
      osc.frequency.exponentialRampToValueAtTime(base, time + 0.05);
      const g = ctx.createGain();
      g.gain.setValueAtTime(vel * 0.9, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
      osc.connect(g).connect(this.dest("perc"));
      osc.start(time);
      osc.stop(time + 0.32);
      const slap = ctx.createBufferSource();
      slap.buffer = this.makeNoiseBuffer(0.02);
      const lp2 = ctx.createBiquadFilter();
      lp2.type = "lowpass";
      lp2.frequency.value = 2200;
      const sg = ctx.createGain();
      sg.gain.setValueAtTime(vel * 0.3, time);
      sg.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
      slap.connect(lp2).connect(sg).connect(this.dest("perc"));
      slap.start(time);
      slap.stop(time + 0.025);
      return;
    }
    if (flavor === "pandeiro" || flavor === "tamborim") {
      // Both Brazilian, both played with a fast wrist, and both essential
      // to samba's interlocking layers. A pandeiro is a tambourine with a
      // tunable head and dry jingles - head tone plus a short jingle
      // rattle. A tamborim is a tiny 6" frame drum hit with a plastic
      // stick: extremely high, extremely dry, no jingles at all.
      const isPandeiro = flavor === "pandeiro";
      const head = ctx.createOscillator();
      head.type = "sine";
      const hz = isPandeiro ? 300 : 620;
      head.frequency.setValueAtTime(hz, time);
      head.frequency.exponentialRampToValueAtTime(hz * 0.7, time + 0.05);
      const hg = ctx.createGain();
      hg.gain.setValueAtTime(vel * (isPandeiro ? 0.5 : 0.7), time);
      hg.gain.exponentialRampToValueAtTime(0.001, time + (isPandeiro ? 0.08 : 0.05));
      head.connect(hg).connect(this.dest("perc"));
      head.start(time);
      head.stop(time + 0.1);
      const rattle = ctx.createBufferSource();
      rattle.buffer = this.makeNoiseBuffer(isPandeiro ? 0.09 : 0.02);
      const hp2 = ctx.createBiquadFilter();
      hp2.type = "highpass";
      hp2.frequency.value = isPandeiro ? 5000 : 6500;
      const rg = ctx.createGain();
      rg.gain.setValueAtTime(vel * (isPandeiro ? 0.4 : 0.22), time);
      rg.gain.exponentialRampToValueAtTime(0.001, time + (isPandeiro ? 0.09 : 0.025));
      rattle.connect(hp2).connect(rg).connect(this.dest("perc"));
      rattle.start(time);
      rattle.stop(time + 0.1);
      return;
    }
    if (flavor === "repinique" || flavor === "surdo") {
      // The two ends of a samba bateria. A surdo is the huge low drum
      // that carries the pulse - almost pure low fundamental with a long
      // decay. A repinique is a high tuned metal-shelled drum that cuts
      // through everything and calls the changes.
      const isSurdo = flavor === "surdo";
      const base = isSurdo ? 68 : 340;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * (isSurdo ? 1.05 : 0.7), time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + (isSurdo ? 0.55 : 0.18));
      gain.connect(this.dest("perc"));
      for (const [ratio, lvl] of isSurdo ? [[1, 1], [1.7, 0.2]] : [[1, 1], [1.6, 0.45], [2.3, 0.2]]) {
        const osc = ctx.createOscillator();
        osc.type = isSurdo ? "sine" : "triangle";
        osc.frequency.setValueAtTime(base * ratio, time);
        osc.frequency.exponentialRampToValueAtTime(base * ratio * 0.82, time + (isSurdo ? 0.3 : 0.1));
        const g = ctx.createGain();
        g.gain.value = lvl;
        osc.connect(g).connect(gain);
        osc.start(time);
        osc.stop(time + (isSurdo ? 0.6 : 0.2));
      }
      const stick = ctx.createBufferSource();
      stick.buffer = this.makeNoiseBuffer(0.015);
      const f = ctx.createBiquadFilter();
      f.type = isSurdo ? "lowpass" : "highpass";
      f.frequency.value = isSurdo ? 1200 : 3800;
      const sg2 = ctx.createGain();
      sg2.gain.setValueAtTime(vel * (isSurdo ? 0.3 : 0.4), time);
      sg2.gain.exponentialRampToValueAtTime(0.001, time + 0.015);
      stick.connect(f).connect(sg2).connect(this.dest("perc"));
      stick.start(time);
      stick.stop(time + 0.02);
      return;
    }
    if (flavor === "bata") {
      // A batá is a double-headed hourglass drum played on both ends at
      // once, so a single stroke is genuinely two pitches - which is why
      // batá patterns sound like conversation rather than like a beat.
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
      gain.connect(this.dest("perc"));
      for (const [hz, lvl, off] of [[160, 1, 0], [420, 0.55, 0.006]]) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(hz * 1.25, time + off);
        osc.frequency.exponentialRampToValueAtTime(hz, time + off + 0.06);
        const g = ctx.createGain();
        g.gain.setValueAtTime(lvl, time + off);
        g.gain.exponentialRampToValueAtTime(0.001, time + off + 0.22);
        osc.connect(g).connect(gain);
        osc.start(time + off);
        osc.stop(time + 0.28);
      }
      return;
    }
    if (flavor === "cuica") {
      // A friction drum: a stick inside the shell is rubbed, dragging the
      // head with it, and the player changes pitch by pressing the head
      // from outside. It squeaks and slides, which is unlike anything
      // else in a percussion rack.
      const up = Math.random() < 0.5;
      const base = 300 + Math.random() * 120;
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(up ? base : base * 1.8, time);
      osc.frequency.exponentialRampToValueAtTime(up ? base * 1.8 : base, time + 0.16);
      const bp2 = ctx.createBiquadFilter();
      bp2.type = "bandpass";
      bp2.frequency.value = 900;
      bp2.Q.value = 3;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, time);
      g.gain.linearRampToValueAtTime(vel * 0.5, time + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
      osc.connect(bp2).connect(g).connect(this.dest("perc"));
      osc.start(time);
      osc.stop(time + 0.22);
      return;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = this.makeNoiseBuffer(0.2);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 6000 + Math.random() * 2000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vel * 0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
    noise.connect(bp).connect(gain).connect(this.dest("perc"));
    noise.start(time);
    noise.stop(time + 0.08);
  }

  playCrash(time, vel) {
    const ctx = this.ctx;
    const noise = ctx.createBufferSource();
    noise.buffer = this.makeNoiseBuffer(1.6);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 5000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vel * 0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.4);
    noise.connect(hp).connect(gain).connect(this.dest("crash"));
    noise.start(time);
    noise.stop(time + 1.4);
  }

  // Transition/impact FX - riser is the classic pre-drop/pre-chorus sweep;
  // siren and impact are newer additions researched from modern hard-trap
  // production (the "police siren" ad-lib stab and the cinematic "trailer
  // hit" that Travis Scott/Playboi Carti-adjacent producers drop on a beat
  // switch or a hard downbeat).
  playFxRiser(time, vel, flavor) {
    const ctx = this.ctx;
    const fxDest = this.dest("fx");

    // Noise-based transitions. A riser, a downlifter and a reverse swell are
    // the same object - filtered noise with a moving cutoff and a moving
    // level - so they share one implementation and differ only in which way
    // the two curves run.
    //
    //   from/to   bandpass centre in Hz, start and end
    //   swell     true = level rises into the hit, false = it falls away
    //   q         narrow reads as a whistle, wide as wind
    const NOISE_FX = {
      downlifter: { dur: 1.8, from: 6000, to: 260,  swell: false, q: 2.2, level: 0.42 },
      uplifter:   { dur: 2.0, from: 300,  to: 9000, swell: true,  q: 2.6, level: 0.4 },
      reverse:    { dur: 1.4, from: 1200, to: 5200, swell: true,  q: 1.1, level: 0.45 },
      wind:       { dur: 2.6, from: 500,  to: 1800, swell: true,  q: 0.8, level: 0.3 },
      // A very narrow band sweeping up: the whistle riser under a drop.
      whistle:    { dur: 1.6, from: 900,  to: 7000, swell: true,  q: 12,  level: 0.3 },
      // Broadband white noise straight down, the "vinyl brake" texture.
      sweepdown:  { dur: 1.0, from: 8000, to: 400,  swell: false, q: 0.7, level: 0.4 },
    };
    if (NOISE_FX[flavor]) {
      const p = NOISE_FX[flavor];
      const n = ctx.createBufferSource();
      n.buffer = this.makeNoiseBuffer(p.dur);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = p.q;
      bp.frequency.setValueAtTime(p.from, time);
      bp.frequency.exponentialRampToValueAtTime(p.to, time + p.dur);
      const g = ctx.createGain();
      if (p.swell) {
        g.gain.setValueAtTime(0.0001, time);
        g.gain.exponentialRampToValueAtTime(vel * p.level, time + p.dur * 0.92);
        g.gain.linearRampToValueAtTime(0.0001, time + p.dur);
      } else {
        g.gain.setValueAtTime(vel * p.level, time);
        g.gain.exponentialRampToValueAtTime(0.0001, time + p.dur);
      }
      n.connect(bp).connect(g).connect(fxDest);
      n.start(time);
      n.stop(time + p.dur + 0.02);
      return;
    }

    if (flavor === "subdrop") {
      // The sub drop: a sine falling off the bottom of the register. It is
      // the simplest effect here and one of the most used, because it marks a
      // section change with nothing but weight.
      const dur = 1.6;
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(180, time);
      o.frequency.exponentialRampToValueAtTime(24, time + dur * 0.8);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, time);
      g.gain.linearRampToValueAtTime(vel * 0.85, time + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, time + dur);
      o.connect(g).connect(fxDest);
      o.start(time);
      o.stop(time + dur + 0.05);
      return;
    }

    if (flavor === "vinylstop") {
      // A record being stopped by hand: everything slows and drops in pitch
      // together over about half a second, with surface noise underneath.
      const dur = 0.75;
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(220, time);
      o.frequency.exponentialRampToValueAtTime(28, time + dur);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(4000, time);
      lp.frequency.exponentialRampToValueAtTime(300, time + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(vel * 0.5, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + dur);
      o.connect(lp).connect(g).connect(fxDest);
      o.start(time);
      o.stop(time + dur + 0.03);

      const n = ctx.createBufferSource();
      n.buffer = this.makeNoiseBuffer(dur);
      const nlp = ctx.createBiquadFilter();
      nlp.type = "lowpass";
      nlp.frequency.setValueAtTime(3000, time);
      nlp.frequency.exponentialRampToValueAtTime(200, time + dur);
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(vel * 0.2, time);
      ng.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      n.connect(nlp).connect(ng).connect(fxDest);
      n.start(time);
      n.stop(time + dur);
      return;
    }

    if (flavor === "zap") {
      // A short descending laser blip - the punctuation mark of jersey club
      // and of a lot of plugg.
      const dur = 0.22;
      const o = ctx.createOscillator();
      o.type = "square";
      o.frequency.setValueAtTime(2600, time);
      o.frequency.exponentialRampToValueAtTime(180, time + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(vel * 0.35, time);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      o.connect(g).connect(fxDest);
      o.start(time);
      o.stop(time + dur + 0.02);
      return;
    }

    if (flavor === "airhorn") {
      // Three stacked detuned saws through a resonant bandpass, held flat
      // and cut off hard. Unmistakable, and a genuine fixture of the genre.
      const dur = 1.1;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 900;
      bp.Q.value = 1.6;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, time);
      g.gain.linearRampToValueAtTime(vel * 0.4, time + 0.04);
      g.gain.setValueAtTime(vel * 0.4, time + dur - 0.06);
      g.gain.linearRampToValueAtTime(0.0001, time + dur);
      bp.connect(g).connect(fxDest);
      for (const f of [233, 311, 466, 622]) {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = f;
        o.detune.value = (Math.random() - 0.5) * 14;
        const og = ctx.createGain();
        og.gain.value = 0.3;
        o.connect(og).connect(bp);
        o.start(time);
        o.stop(time + dur + 0.05);
      }
      return;
    }

    if (flavor === "siren") {
      // A classic trap "police siren": a sawtooth sweeping up and back
      // down in pitch a couple of times, run through a bandpass to keep
      // it from sounding like a bare oscillator.
      const dur = 1.4;
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(400, time);
      osc.frequency.linearRampToValueAtTime(1400, time + dur * 0.4);
      osc.frequency.linearRampToValueAtTime(500, time + dur * 0.75);
      osc.frequency.linearRampToValueAtTime(1600, time + dur);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1500;
      bp.Q.value = 2.5;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.4, time + 0.08);
      gain.gain.linearRampToValueAtTime(vel * 0.4, time + dur - 0.1);
      gain.gain.linearRampToValueAtTime(0.0001, time + dur);
      osc.connect(bp).connect(gain).connect(this.dest("fx"));
      osc.start(time);
      osc.stop(time + dur + 0.05);
      return;
    }

    if (flavor === "impact") {
      // A cinematic "trailer hit": a low sub thump, a bright noise crash,
      // and a slow-swelling reversed-sounding tail - the kind of huge,
      // ominous downbeat stab used to punctuate a hard beat switch.
      const dur = 2.2;
      const sub = ctx.createOscillator();
      sub.type = "sine";
      sub.frequency.setValueAtTime(90, time);
      sub.frequency.exponentialRampToValueAtTime(35, time + 0.5);
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(vel * 0.9, time);
      subGain.gain.exponentialRampToValueAtTime(0.001, time + 1.2);
      sub.connect(subGain).connect(this.dest("fx"));
      sub.start(time);
      sub.stop(time + 1.3);

      const crash = ctx.createBufferSource();
      crash.buffer = this.makeNoiseBuffer(0.4);
      const crashFilter = ctx.createBiquadFilter();
      crashFilter.type = "highpass";
      crashFilter.frequency.value = 3000;
      const crashGain = ctx.createGain();
      crashGain.gain.setValueAtTime(vel * 0.5, time);
      crashGain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
      crash.connect(crashFilter).connect(crashGain).connect(this.dest("fx"));
      crash.start(time);
      crash.stop(time + 0.4);

      const swell = ctx.createBufferSource();
      swell.buffer = this.makeNoiseBuffer(dur);
      const swellFilter = ctx.createBiquadFilter();
      swellFilter.type = "bandpass";
      swellFilter.Q.value = 0.8;
      swellFilter.frequency.setValueAtTime(150, time);
      swellFilter.frequency.exponentialRampToValueAtTime(2500, time + dur);
      const swellGain = ctx.createGain();
      swellGain.gain.setValueAtTime(0.0001, time);
      swellGain.gain.linearRampToValueAtTime(vel * 0.35, time + dur * 0.9);
      swellGain.gain.linearRampToValueAtTime(0.0001, time + dur);
      swell.connect(swellFilter).connect(swellGain).connect(this.dest("fx"));
      swell.start(time);
      swell.stop(time + dur + 0.1);
      return;
    }

    // "riser" (default): a rising filtered-noise sweep, the classic
    // pre-drop/pre-chorus transition FX producers use to build anticipation.
    const dur = 1.8;
    const noise = ctx.createBufferSource();
    noise.buffer = this.makeNoiseBuffer(dur + 0.2);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(250, time);
    bp.frequency.exponentialRampToValueAtTime(9000, time + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(vel * 0.5, time + dur * 0.85);
    gain.gain.linearRampToValueAtTime(0.0001, time + dur);
    noise.connect(bp).connect(gain).connect(this.dest("fx"));
    noise.start(time);
    noise.stop(time + dur + 0.1);
  }

  // A clean sine an octave down under a mangled mid-bass - standard
  // bass-music layering so the sub stays solid no matter what the
  // character layer is doing.
  addSubLayer(time, freq, durationSeconds, vel) {
    const ctx = this.ctx;
    let f = freq / 2;
    while (f < 33) f *= 2;
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.setValueAtTime(f, time);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + Math.max(durationSeconds, 0.2));
    sub.connect(g).connect(this.dest("bass"));
    sub.start(time);
    sub.stop(time + Math.max(durationSeconds, 0.2) + 0.05);
  }

  playBass(time, freq, durationSeconds, vel, flavor) {
    if (this.playSampleFlavor("bass", flavor, time, vel, freq, durationSeconds)) return;
    const ctx = this.ctx;
    // Bass lines could descend to ~23Hz, which is below what phones,
    // laptops, and most speakers reproduce at all - the note vanishes
    // while still eating headroom on the master. Anything under ~33Hz
    // (roughly C1) is lifted an octave so it stays audible; real
    // engineers do the same thing rather than let a sub note disappear.
    //
    // The 808 family is the exception, and it is allowed almost an octave
    // lower. The reason the lift exists is that a note nobody's speakers can
    // reproduce is a wasted note - but an 808's grit path deliberately puts
    // most of its audible energy in the harmonics, well above where any
    // speaker gives up, so the ear infers a fundamental it never actually
    // hears. That is the entire trick, and lifting a low C an octave threw it
    // away: rap 808s live at C1 and below, and moving them to C2 is exactly
    // what makes an 808 stop sounding like one.
    const floorHz = /808$/.test(flavor || "") ? 24 : 33;
    while (freq < floorHz) freq *= 2;

    if (flavor === "sh101") {
      // Roland SH-101: one oscillator, one filter, and that is the whole
      // instrument - which is exactly why it became the acid/house bass.
      // Its character is the SQUARE-plus-SUB pairing and a snappy
      // envelope on a 24dB lowpass with real resonance, all of which
      // happens in the first 80ms of the note.
      const dur = Math.max(durationSeconds, 0.18);
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.Q.value = 7;
      filt.frequency.setValueAtTime(Math.min(6000, freq * 14), time);
      filt.frequency.exponentialRampToValueAtTime(Math.max(90, freq * 2.2), time + 0.12);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      filt.connect(gain).connect(this.dest("bass"));
      const sq = ctx.createOscillator();
      sq.type = "square";
      sq.frequency.value = freq;
      sq.connect(filt);
      sq.start(time);
      sq.stop(time + dur + 0.05);
      const sub = ctx.createOscillator();
      sub.type = "square";
      sub.frequency.value = freq / 2;
      const sg = ctx.createGain();
      sg.gain.value = 0.5;
      sub.connect(sg).connect(filt);
      sub.start(time);
      sub.stop(time + dur + 0.05);
      return;
    }

    if (flavor === "fretless") {
      // No frets means no fixed stopping point, so every note is slid
      // into and every note has a slow finger vibrato - a fretless bass
      // is identified almost entirely by those two things plus the
      // "mwah": the string buzzing briefly against the bare fingerboard
      // right at the attack.
      const dur = Math.max(durationSeconds, 0.3);
      const mwah = ctx.createBiquadFilter();
      mwah.type = "lowpass";
      mwah.frequency.setValueAtTime(Math.min(3400, freq * 12), time);
      mwah.frequency.exponentialRampToValueAtTime(Math.max(120, freq * 3), time + 0.18);
      mwah.Q.value = 3.5;
      mwah.connect(this.dest("bass"));
      this.pluckString(time, freq, dur, vel * 0.95, mwah,
        { damp: 0.3, feedback: 0.985, pluckNoise: 0.012, brightness: 0.95, sustain: 1.1 });
      return;
    }

    if (flavor === "m1organbass") {
      // The Korg M1 "Organ 2" bass - the single most-used bass sound in
      // 90s house, and the low half of the Robin S "Show Me Love" patch.
      // It is an organ, not a bass synth: a stack of pure octaves and a
      // fifth with a hard attack and no filter movement at all, which is
      // why it stays perfectly defined under a four-to-the-floor kick.
      const dur = Math.max(durationSeconds, 0.2);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel, time + 0.006);
      gain.gain.setValueAtTime(vel * 0.85, time + Math.max(0.05, dur - 0.05));
      gain.gain.linearRampToValueAtTime(0.0001, time + dur + 0.02);
      const tone = ctx.createBiquadFilter();
      tone.type = "lowpass";
      tone.frequency.value = 2400;
      gain.connect(tone).connect(this.dest("bass"));
      for (const [ratio, lvl] of [[1, 1], [2, 0.4], [3, 0.16]]) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq * ratio;
        const g = ctx.createGain();
        g.gain.value = lvl;
        osc.connect(g).connect(gain);
        osc.start(time);
        osc.stop(time + dur + 0.08);
      }
      return;
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // ---- more 808s ------------------------------------------------------
    // The whole family, because in trap and rap the 808 is not the bass
    // instrument - it IS the low end, the bassline and half the drum kit at
    // once, and producers pick between them the way a rock band picks an amp.
    //
    // Every one is a sine fundamental (that is what an 808 is) plus three
    // choices: how far it glides in, how long it rings, and how much
    // saturation sits on top. Saturation is what makes an 808 audible on a
    // phone speaker that cannot reproduce 40Hz at all - the harmonics it adds
    // are heard and the ear infers the missing fundamental.
    // Rebuilt, because measurement said the previous version was a sine wave
    // wearing a distortion's name. tools/measure-808.js renders each kit and
    // reports what share of its energy sits above 100Hz: the kit literally
    // called "dirty808" scored 0.043, i.e. it was 96% pure fundamental, and
    // every one of the fifteen 808-family kits came in under the bar.
    //
    // The reason is worth writing down, because it is not obvious and it is
    // why the round before this one did not fix it either. That version put
    // a waveshaper in PARALLEL with the clean sine and mixed it back in at
    // 60%, which sounds like the textbook answer. But clipping a sine does
    // not mostly produce harmonics - it mostly produces MORE SINE. A square
    // wave is 4/pi of fundamental against 1/3, 1/5, 1/7 for its harmonics,
    // so only about a tenth of its energy is the part you can actually hear
    // as distortion. Blending that against a clean copy buries the tenth
    // under two servings of the thing it was meant to add character to.
    //
    // What producers actually do - and what every "distort your 808" guide
    // describes - is a MULTIBAND split: keep the sub clean below ~90Hz, and
    // drive a copy that has been high-passed so its own fundamental is gone
    // before it is mixed back. Then the only thing the wet path contributes
    // is harmonics, which is the entire point.
    //
    //   sub path   osc -> env -> lowpass 90Hz  -> level
    //   grit path  osc -> env -> pre-gain -> shaper -> highpass -> tone -> level
    //
    // The pre-gain matters as much as the curve: without it the grit fades
    // out of clipping as the note decays and the tail goes clean, which is
    // the opposite of how an 808 into a clipper behaves.
    const EIGHT08 = {
      // --- the originals, now with a real grit stage ------------------------
      "808":       { ring: 1.4, glide: 0.04, drive: 24,  grit: 0.85,  mode: "soft", click: 0.25, sweep: 1.8, hp: 130, tone: 4200 },
      true808:     { ring: 1.9, glide: 0.09, drive: 30,  grit: 0.9, mode: "soft", click: 0.22, sweep: 1.7, hp: 120, tone: 3600 },
      hard808:     { ring: 1.5, glide: 0.03, drive: 45,  grit: 0.95, mode: "hard", click: 0.4,  sweep: 1.9, hp: 140, tone: 5200 },
      glide808:    { ring: 2.2, glide: 0.16, drive: 26,  grit: 0.85,  mode: "soft", click: 0.10, sweep: 1.35, hp: 120, tone: 3800 },
      punch808:    { ring: 1.1, glide: 0.02, drive: 40,  grit: 1.05,  mode: "hard", click: 0.45, sweep: 2.1, hp: 150, tone: 5000 },
      long808:     { ring: 3.2, glide: 0.05, drive: 10,  grit: 0.42, mode: "soft", click: 0.16, sweep: 1.5, hp: 115, tone: 3400 },
      // Deliberately the clean one. Every lineup needs a contrast, and a
      // pure sub 808 under a busy mix is a real choice.
      clean808:    { ring: 1.8, glide: 0.03, drive: 0,   grit: 0,    mode: "soft", click: 0.12, sweep: 1.4, hp: 120, tone: 3000 },
      dirty808:    { ring: 1.6, glide: 0.04, drive: 60,  grit: 1.15, mode: "fuzz", click: 0.3,  sweep: 1.8, hp: 130, tone: 5600 },
      knock808:    { ring: 0.85, glide: 0.01, drive: 44, grit: 1.05, mode: "hard", click: 0.6, sweep: 2.6, hp: 170, tone: 5400 },
      rumble808:   { ring: 4.0, glide: 0.09, drive: 8,   grit: 0.3,  mode: "soft", click: 0.06, sweep: 1.25, hp: 105, tone: 2600 },
      detuned808:  { ring: 2.0, glide: 0.06, drive: 30,  grit: 0.9, mode: "soft", click: 0.18, sweep: 1.45, hp: 125, tone: 4000, detune: 12 },

      // --- the distortion the complaint was actually about ------------------
      // Named for the technique rather than for a producer, so it is obvious
      // from the kit list which one is which.
      // A straight clipper, hit hard. Odd harmonics all the way up: this is
      // the sound of an 808 pushed into a limiter until it buzzes.
      distort808:  { ring: 1.7, glide: 0.05, drive: 90,  grit: 1.3,  mode: "hard", click: 0.35, sweep: 1.85, hp: 135, tone: 6000 },
      // Asymmetric, so the octave comes up with the odd harmonics and the
      // note reads as growling rather than merely loud.
      fuzz808:     { ring: 1.6, glide: 0.05, drive: 70,  grit: 1.25, mode: "fuzz", click: 0.3, sweep: 1.8, hp: 140, tone: 6500 },
      // Tube-style: driven hard but rounded, with the top rolled off. Warm
      // and thick instead of sharp.
      overdrive808:{ ring: 2.0, glide: 0.07, drive: 34,  grit: 0.9,  mode: "soft", click: 0.2, sweep: 1.7, hp: 110, tone: 2800 },
      // Everything at once. The dirtiest kit in the list on purpose.
      grimy808:    { ring: 1.5, glide: 0.04, drive: 110, grit: 1.45, mode: "fold", click: 0.4, sweep: 1.9, hp: 150, tone: 7000 },
      // The wavefolder, which keeps changing timbre as the note decays -
      // the closest thing here to the rage/plugg 808.
      rage808:     { ring: 1.3, glide: 0.03, drive: 130, grit: 1.5,  mode: "fold", click: 0.5, sweep: 2.2, hp: 160, tone: 7500 },
      // Long, deep, heavily slid, moderate grit: the cinematic trap 808 that
      // sits under a whole bar.
      deep808:     { ring: 3.6, glide: 0.14, drive: 20,  grit: 0.6,  mode: "soft", click: 0.12, sweep: 1.3, hp: 108, tone: 3000 },
      // Memphis/phonk: short, cheap, thoroughly cooked.
      memphis808:  { ring: 1.0, glide: 0.02, drive: 75,  grit: 1.2,  mode: "fuzz", click: 0.45, sweep: 2.0, hp: 165, tone: 6200 },
      // Short and hard-hitting with almost no tail - the 808 as a drum.
      stab808:     { ring: 0.6, glide: 0.01, drive: 52,  grit: 1.0, mode: "hard", click: 0.55, sweep: 2.4, hp: 180, tone: 5800 },
      // Two detuned copies plus grit, which spreads it wide without losing
      // the mono centre the sub path keeps.
      wide808:     { ring: 2.4, glide: 0.08, drive: 36,  grit: 0.95,  mode: "soft", click: 0.2, sweep: 1.5, hp: 125, tone: 4400, detune: 22 },
      // Drill: the long downward slide is the whole identity, so the glide
      // is far longer than anything else here.
      slide808:    { ring: 2.6, glide: 0.3,  drive: 34,  grit: 0.9, mode: "soft", click: 0.14, sweep: 1.4, hp: 118, tone: 3600 },
      // Bright and cutting - drives the harmonics well up so it survives a
      // phone speaker with no low end at all.
      bright808:   { ring: 1.8, glide: 0.05, drive: 55,  grit: 1.1,  mode: "hard", click: 0.4, sweep: 1.8, hp: 200, tone: 8000 },
    };
    if (EIGHT08[flavor]) {
      const p = EIGHT08[flavor];
      const dest808 = this.dest("bass");
      const ring = Math.max(durationSeconds, p.ring);

      // Glide from the previous note, the defining modern-808 move. Tracked
      // per flavor so two 808 kits never fight over one "last note".
      this._last808 = this._last808 || {};
      const prev = this._last808[flavor];
      this._last808[flavor] = { freq, time };

      // One amplitude envelope, shared by both paths so they decay together.
      const body = ctx.createGain();
      body.gain.setValueAtTime(0.0001, time);
      body.gain.linearRampToValueAtTime(vel * 0.9, time + 0.006);
      body.gain.exponentialRampToValueAtTime(0.001, time + ring);

      // SUB PATH. Lowpassed so it contributes weight and nothing else, which
      // leaves the region above it entirely to the grit path instead of the
      // two fighting over the same octave.
      const subLp = ctx.createBiquadFilter();
      subLp.type = "lowpass";
      subLp.frequency.value = 90;
      // Web Audio takes lowpass/highpass Q in decibels, not as a linear Q.
      // 0dB here is a plain Butterworth; asking for 0.707 would ask for
      // resonance at the corner and put a hump right where the kick lives.
      subLp.Q.value = 0;
      const subGain = ctx.createGain();
      subGain.gain.value = 1;
      body.connect(subLp).connect(subGain).connect(dest808);

      // GRIT PATH. The high-pass AFTER the shaper is the part that matters:
      // it throws away the fundamental the shaper just regenerated, so what
      // reaches the mix is harmonics only.
      if (p.grit > 0 && p.drive > 0) {
        const pre = ctx.createGain();
        pre.gain.value = p.drive;
        const shaper = ctx.createWaveShaper();
        shaper.curve = this.make808Curve(p.mode, 1);
        shaper.oversample = "4x";
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = p.hp;
        hp.Q.value = 0;
        const hp2 = ctx.createBiquadFilter();
        hp2.type = "highpass";
        hp2.frequency.value = p.hp;
        hp2.Q.value = 0;
        // Rolling the top off keeps hard clipping from turning into fizz.
        // Every guide on this says the same thing and it is audibly true.
        const tone = ctx.createBiquadFilter();
        tone.type = "lowpass";
        tone.frequency.value = p.tone;
        tone.Q.value = 0;
        const gritGain = ctx.createGain();
        gritGain.gain.value = vel * p.grit * 0.5;
        body.connect(pre).connect(shaper).connect(hp).connect(hp2)
            .connect(tone).connect(gritGain).connect(dest808);
      }

      for (const cents of (p.detune ? [-p.detune, p.detune] : [0])) {
        const o = ctx.createOscillator();
        o.type = "sine";
        const f = freq * Math.pow(2, cents / 1200);
        const canGlide = prev && time - prev.time > 0 && time - prev.time < 0.55
          && Math.abs(prev.freq - freq) > 0.5;
        if (canGlide) {
          o.frequency.setValueAtTime(prev.freq, time);
          o.frequency.exponentialRampToValueAtTime(f, time + p.glide + 0.03);
        } else {
          // No previous note: the pitch still sweeps down into the note,
          // which is the 808's own attack rather than a slide.
          o.frequency.setValueAtTime(f * p.sweep, time);
          o.frequency.exponentialRampToValueAtTime(f, time + 0.045 + p.glide);
        }
        const og = ctx.createGain();
        og.gain.value = p.detune ? 0.6 : 1;
        o.connect(og).connect(body);
        o.start(time);
        o.stop(time + ring + 0.05);
      }

      // The click. An 808 with no attack transient vanishes on small
      // speakers even with saturation, because there is nothing above 200Hz
      // for them to reproduce at all.
      if (p.click > 0) {
        const cl = ctx.createBufferSource();
        cl.buffer = this.makeNoiseBuffer(0.014);
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 1400;
        bp.Q.value = 0.8;
        const cg = ctx.createGain();
        cg.gain.setValueAtTime(vel * p.click * 0.5, time);
        cg.gain.exponentialRampToValueAtTime(0.0001, time + 0.014);
        cl.connect(bp).connect(cg).connect(dest808);
        cl.start(time);
        cl.stop(time + 0.02);
      }
      return;
    }

    if (flavor === "synth") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, time);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 900;
      gain.gain.setValueAtTime(vel * 0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + durationSeconds);
      osc.connect(filter).connect(gain).connect(this.dest("bass"));
    } else if (flavor === "sub") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(vel * 0.9, time);
      gain.gain.setValueAtTime(vel * 0.9, time + Math.max(0, durationSeconds - 0.05));
      gain.gain.linearRampToValueAtTime(0.0001, time + durationSeconds + 0.05);
      osc.connect(gain).connect(this.dest("bass"));
    } else if (flavor === "pluck") {
      // A physically-modeled plucked string down in bass register - the
      // same Karplus-Strong technique the guitar voices use, tuned dark
      // and fast-damped for a picked/upright-adjacent bass pluck.
      this.pluckString(time, freq, durationSeconds, vel, this.dest("bass"), { damp: 0.35, feedback: 0.97, pluckNoise: 0.01, brightness: 0.8, sustain: 0.4 });
      return;
    } else if (flavor === "drillslide") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq * 2.4, time);
      osc.frequency.exponentialRampToValueAtTime(freq, time + 0.045);
      gain.gain.setValueAtTime(vel, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + durationSeconds);
      osc.connect(gain).connect(this.dest("bass"));
    } else if (flavor === "logdrum") {
      const click = ctx.createBufferSource();
      click.buffer = this.makeNoiseBuffer(0.05);
      const clickFilter = ctx.createBiquadFilter();
      clickFilter.type = "highpass";
      clickFilter.frequency.value = 2000;
      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(vel * 0.5, time);
      clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
      click.connect(clickFilter).connect(clickGain).connect(this.dest("bass"));
      click.start(time);
      click.stop(time + 0.05);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq * 2.5, time);
      osc.frequency.exponentialRampToValueAtTime(freq, time + 0.09);
      const bodyDur = Math.max(durationSeconds, 0.3);
      gain.gain.setValueAtTime(vel, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + bodyDur);
      osc.connect(gain).connect(this.dest("bass"));
    } else if (flavor === "wobble") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, time);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 9;
      filter.frequency.setValueAtTime(450, time);
      const lfo = ctx.createOscillator();
      lfo.frequency.value = Math.max(2, Math.min(8, 4 / durationSeconds));
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 850;
      lfo.connect(lfoGain).connect(filter.frequency);
      gain.gain.setValueAtTime(vel * 0.85, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + durationSeconds);
      osc.connect(filter).connect(gain).connect(this.dest("bass"));

      const sub = ctx.createOscillator();
      sub.type = "sine";
      sub.frequency.setValueAtTime(freq, time);
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(vel * 0.5, time);
      subGain.gain.exponentialRampToValueAtTime(0.001, time + durationSeconds);
      sub.connect(subGain).connect(this.dest("bass"));
      sub.start(time);
      sub.stop(time + durationSeconds + 0.05);
      lfo.start(time);
      lfo.stop(time + durationSeconds + 0.05);
    } else if (flavor === "distorted") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, time);
      const shaper = ctx.createWaveShaper();
      shaper.curve = this.makeDistortionCurve(28);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1400;
      gain.gain.setValueAtTime(vel, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + durationSeconds);
      osc.connect(shaper).connect(filter).connect(gain).connect(this.dest("bass"));
    } else if (flavor === "reese") {
      // Classic drum & bass "Reese" bass: a stack of detuned sawtooths
      // beating against each other for a growling, dissonant texture.
      // Real bass-music production splits this into two layers: a clean
      // sine sub carries the low end while the mangled mid-bass carries
      // the character, and the mid layer is high-passed so the two never
      // share the same octave. Without that split, the detuning
      // phase-cancels in the sub and the low end goes soft.
      gain.gain.setValueAtTime(vel * 0.55, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + durationSeconds);
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 150;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1100;
      filter.connect(hp).connect(gain).connect(this.dest("bass"));
      this.addSubLayer(time, freq, durationSeconds, vel * 0.62);
      for (const detune of [-0.02, -0.007, 0.007, 0.02]) {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(freq * (1 + detune), time);
        o.connect(filter);
        o.start(time);
        o.stop(time + durationSeconds + 0.05);
      }
    } else if (flavor === "growl") {
      // Faster, harder-resonant relative of "wobble" - a growling
      // aggressive filtered saw favored in dubstep/drill-adjacent bass work.
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, time);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 14;
      filter.frequency.setValueAtTime(600, time);
      const lfo = ctx.createOscillator();
      lfo.frequency.value = Math.max(6, Math.min(16, 8 / durationSeconds));
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 1400;
      lfo.connect(lfoGain).connect(filter.frequency);
      gain.gain.setValueAtTime(vel * 0.7, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + durationSeconds);
      const growlHp = ctx.createBiquadFilter();
      growlHp.type = "highpass";
      growlHp.frequency.value = 140;
      osc.connect(filter).connect(growlHp).connect(gain).connect(this.dest("bass"));
      this.addSubLayer(time, freq, durationSeconds, vel * 0.6);
      lfo.start(time);
      lfo.stop(time + durationSeconds + 0.05);
    } else if (flavor === "upright") {
      // Warmer and shorter than "pluck" - a fast pitch-drop thump layered
      // under a heavily damped string for the woody body-thump of a real
      // upright/double bass pluck.
      const thump = ctx.createOscillator();
      thump.type = "triangle";
      thump.frequency.setValueAtTime(freq * 1.3, time);
      thump.frequency.exponentialRampToValueAtTime(freq, time + 0.05);
      const thumpFilter = ctx.createBiquadFilter();
      thumpFilter.type = "lowpass";
      thumpFilter.frequency.setValueAtTime(900, time);
      thumpFilter.frequency.exponentialRampToValueAtTime(250, time + 0.3);
      const thumpGain = ctx.createGain();
      thumpGain.gain.setValueAtTime(vel * 0.5, time);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, time + Math.min(durationSeconds, 0.35));
      thump.connect(thumpFilter).connect(thumpGain).connect(this.dest("bass"));
      thump.start(time);
      thump.stop(time + 0.4);

      this.pluckString(time, freq, durationSeconds, vel * 0.85, this.dest("bass"), { damp: 0.42, feedback: 0.965, pluckNoise: 0.015, brightness: 0.7, sustain: 0.45 });
      return;
    } else if (flavor === "slap") {
      // Slap bass (Larry Graham's invention, the funk signature): the
      // thumb knocks the string against the frets, so the note leads with
      // a hard percussive metallic "thwack" before the string speaks -
      // modeled as a bright high-passed knock transient over a bright,
      // lightly-damped physical string.
      const knock = ctx.createBufferSource();
      knock.buffer = this.makeNoiseBuffer(0.012);
      const knockHp = ctx.createBiquadFilter();
      knockHp.type = "highpass";
      knockHp.frequency.value = 3200;
      const knockGain = ctx.createGain();
      knockGain.gain.setValueAtTime(vel * 0.5, time);
      knockGain.gain.exponentialRampToValueAtTime(0.001, time + 0.012);
      knock.connect(knockHp).connect(knockGain).connect(this.dest("bass"));
      knock.start(time);
      knock.stop(time + 0.015);
      this.pluckString(time, freq, durationSeconds, vel, this.dest("bass"), { damp: 0.1, feedback: 0.978, pluckNoise: 0.018, brightness: 1.6, sustain: 0.5 });
      return;
    } else if (flavor === "303") {
      // Roland TB-303 "Bassline" (1981) - the acid house machine, one of
      // the most-cloned circuits in electronic music. Its identity is a
      // bare sawtooth into a very resonant lowpass whose cutoff envelope
      // snaps shut fast (that squelch IS the 303), plus the sequencer's
      // signature slide - approximated per-note as a quick upward glide
      // into pitch, since the engine is stateless between notes.
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq * 0.94, time);
      osc.frequency.exponentialRampToValueAtTime(freq, time + 0.05);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 12;
      filter.frequency.setValueAtTime(2400, time);
      filter.frequency.exponentialRampToValueAtTime(Math.max(180, freq * 1.5), time + 0.2);
      gain.gain.setValueAtTime(vel * 0.85, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + Math.max(durationSeconds, 0.18));
      osc.connect(filter).connect(gain).connect(this.dest("bass"));
    } else if (flavor === "moog") {
      // A classic Minimoog-style bass patch. Web Audio has no true ladder-
      // filter model, but the thing that actually makes a Moog bass sound
      // fat and alive rather than static is the filter *envelope* - the
      // cutoff sweeping down from bright and open at the attack to a dark
      // sustain is the "pluck" - so a high-Q biquad lowpass with that
      // sweep gets close, backed by a sub oscillator an octave down for
      // the real low-end weight a single filtered saw can't deliver alone.
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, time);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 8;
      filter.frequency.setValueAtTime(Math.min(3200, freq * 10), time);
      filter.frequency.exponentialRampToValueAtTime(Math.max(200, freq * 1.6), time + 0.18);
      gain.gain.setValueAtTime(vel * 0.85, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + durationSeconds);
      osc.connect(filter).connect(gain).connect(this.dest("bass"));

      const sub = ctx.createOscillator();
      sub.type = "sine";
      sub.frequency.setValueAtTime(freq / 2, time);
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(vel * 0.5, time);
      subGain.gain.exponentialRampToValueAtTime(0.001, time + durationSeconds);
      sub.connect(subGain).connect(this.dest("bass"));
      sub.start(time);
      sub.stop(time + durationSeconds + 0.05);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(vel * 0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + durationSeconds);
      osc.connect(gain).connect(this.dest("bass"));
    }
    if (flavor !== "reese") {
      osc.start(time);
      osc.stop(time + durationSeconds + 0.05);
    }
  }

  // Transfer curves for the 808 grit stage, one per family of distortion,
  // because they do audibly different things and rap records use all of them.
  //
  //   soft  tanh. Symmetric and gentle at the knee, so it rounds the peaks
  //         and builds mostly ODD harmonics that fall away quickly. This is
  //         "warm", the melodic-808 sound.
  //   hard  a straight clip at +/-1. The corner is a discontinuity, so the
  //         odd harmonic series falls away slowly and stays audible a long
  //         way up. This is the aggressive one - the sound of an 808 slammed
  //         into a clipper, which is most of modern rap.
  //   fuzz  asymmetric: the negative half is squashed harder than the
  //         positive one. Asymmetry is what generates EVEN harmonics
  //         (notably the octave), which reads as buzzy and vocal rather than
  //         simply loud.
  //   fold  a wavefolder. Past full scale the curve turns back on itself
  //         instead of flattening, so the harmonic content keeps changing as
  //         the note decays. The most extreme option here, and the closest
  //         thing to the "rage"/plugg 808 sound.
  make808Curve(mode, k) {
    const n = 2048;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      const d = x * k;
      let y;
      if (mode === "hard") {
        y = Math.max(-1, Math.min(1, d));
      } else if (mode === "fuzz") {
        y = d >= 0 ? Math.tanh(d) : Math.tanh(d * 1.9) * 0.72;
      } else if (mode === "fold") {
        // Fold back at the rails rather than clipping. sin() is the
        // classic cheap folder and stays continuous, which keeps it musical
        // instead of merely noisy.
        y = Math.sin(d * 1.4) * (1 - Math.exp(-Math.abs(d) * 2));
      } else {
        y = Math.tanh(d);
      }
      curve[i] = y;
    }
    // Normalise so the "drive" knob changes CHARACTER and not level. Without
    // this every kit with a higher drive is also simply louder, and the two
    // are impossible to tell apart by ear.
    let peak = 0;
    for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(curve[i]));
    if (peak > 0) for (let i = 0; i < n; i++) curve[i] /= peak;
    return curve;
  }

  makeDistortionCurve(amount) {
    const samples = 256;
    const curve = new Float32Array(samples);
    const k = amount;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  // A genuine bit-depth-reduction transfer curve (quantizing the signal to
  // a small number of discrete steps) rather than a filter/saturation
  // trick - a WaveShaperNode applies its curve per-sample, which is
  // exactly what amplitude quantization is. Used well above what a literal
  // 12-bit calculation would need to actually be audible: modern "vintage
  // sampler" emulation almost always pushes the crunch further than the
  // original hardware's real spec, because that exaggerated crunch is what
  // reads as "that sound" after decades of homage production leaning on it.
  makeBitcrushCurve(levels) {
    const samples = 256;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = Math.round(x * levels) / levels;
    }
    return curve;
  }

  makeIdentityCurve() {
    const samples = 256;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) curve[i] = (i * 2) / samples - 1;
    return curve;
  }

  // A dry/wet-blended saturation curve for the master bus - amount 0 is a
  // true bypass (identity curve), higher amounts blend in more of a
  // waveshaped signal for the "driven a little warm" master-bus character
  // modern hard trap/rap mixes lean on for extra harmonic bite.
  setGrit(amount) {
    if (!this.gritShaper) return;
    const clamped = Math.max(0, Math.min(1, amount || 0));
    if (clamped <= 0) {
      this.gritShaper.curve = this.makeIdentityCurve();
      return;
    }
    const samples = 256;
    const curve = new Float32Array(samples);
    const k = 18;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      const driven = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
      curve[i] = (1 - clamped) * x + clamped * driven;
    }
    this.gritShaper.curve = curve;
  }

  // Karplus-Strong plucked-string synthesis: a short filtered noise burst
  // excites a delay-line loop (delay -> damping filter -> feedback gain ->
  // back into the delay), and the loop rings out on its own like a real
  // vibrating string. This is the standard physical-modeling technique for
  // plucked strings (Karplus & Strong, 1983 - the same core idea behind
  // hardware physical-modeling synths), which is what actually gives a
  // string its pluck transient and natural inharmonic decay - a bare
  // oscillator can only ever approximate the sustained portion of that.
  //
  // The damping stage is the original algorithm's simple two-tap average,
  // y[n] = (1-damp)*x[n] + damp*x[n-1], not a general biquad lowpass: its
  // magnitude response is exactly |( 1-damp) + damp*e^-jw| <= 1 for every
  // frequency and every damp in [0,1], so the loop is mathematically
  // guaranteed stable for any feedback < 1. A BiquadFilterNode was tried
  // first and measured (via OfflineAudioContext RMS analysis) to blow up
  // into runaway noise at these very short in-loop delay times even at low
  // Q, so this simpler, provably-bounded filter is used instead.
// Above roughly 344Hz a feedback delay loop cannot be made short enough
  // in Web Audio (see the render-quantum note in pluckString), so high
  // notes are synthesised additively instead. The point is to match the
  // delay-line model's CHARACTER, not to be a generic bell: the partials
  // are stretched by the same stiffness law a real string follows,
  //
  //     f(n) = n * f0 * sqrt(1 + B*n^2)
  //
  // each partial decays faster than the one below it (which is what a
  // lossy string does), and the two vibration planes are present as a
  // slight detune so the note beats and has the same two-stage decay.
  pluckAdditive(time, freq, durationSeconds, vel, dest, opts = {}) {
    const ctx = this.ctx;
    const {
      brightness = 1,
      sustain = 1.3,
      pluckNoise = 0.008,
      outputLowpass = null,
      stiff = true,
    } = opts;
    const ring = Math.max(durationSeconds, sustain);
    // Thin, high strings are much less stiff than wound low ones.
    const B = stiff ? 0.00008 : 0.00001;

    let tail = dest;
    if (outputLowpass) {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = outputLowpass;
      lp.connect(dest);
      tail = lp;
    }
    const bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(tail);

    const nyq = ctx.sampleRate / 2;
    for (let n = 1; n <= 10; n++) {
      const fn = n * freq * Math.sqrt(1 + B * n * n);
      if (fn >= nyq * 0.92) break;
      const lvl = (1 / Math.pow(n, 1.35)) * (n === 1 ? 1 : brightness);
      // Higher partials die first - the string's losses rise with
      // frequency, which is why a plucked note darkens as it rings.
      const dec = ring / (1 + (n - 1) * 0.55);
      for (const [detune, amp] of [[1, 1], [1.0009, 0.6]]) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = fn * detune;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, time);
        g.gain.linearRampToValueAtTime(vel * 0.5 * lvl * amp, time + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0004, time + dec);
        osc.connect(g).connect(bus);
        osc.start(time);
        osc.stop(time + dec + 0.05);
      }
    }
    // The pick itself.
    const click = ctx.createBufferSource();
    click.buffer = this.makeNoiseBuffer(Math.max(0.004, pluckNoise));
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = Math.min(nyq * 0.8, freq * 4);
    bp.Q.value = 0.9;
    const cg = ctx.createGain();
    cg.gain.setValueAtTime(vel * 0.35, time);
    cg.gain.exponentialRampToValueAtTime(0.001, time + Math.max(0.004, pluckNoise));
    click.connect(bp).connect(cg).connect(tail);
    click.start(time);
    click.stop(time + 0.03);

    setTimeout(() => { try { bus.disconnect(); } catch (_) {} }, (ring + 0.3) * 1000);
  }

  pluckString(time, freq, durationSeconds, vel, dest, opts = {}) {
    const ctx = this.ctx;
    const {
      damp = 0.25,
      feedback = 0.988,
      pluckNoise = 0.008,
      brightness = 1,
      sustain = 1.3,
      outputLowpass = null,
      // Set false for instruments that are not stiff steel strings - a
      // harp or a nylon string is far closer to an ideal flexible string.
      stiff = true,
    } = opts;

    // ---- Why a plain Karplus-Strong loop still sounds synthetic -------
    // Two physical facts about a real steel string are missing from the
    // textbook algorithm, and between them they are most of the remaining
    // gap:
    //
    //  1. INHARMONICITY. An ideal string's partials sit at exact integer
    //     multiples of the fundamental. A real one has bending STIFFNESS,
    //     which raises the higher partials progressively - they are
    //     "stretched" upward, following f(n) = n*f0*sqrt(1 + B*n^2).
    //     Thicker and wound strings are markedly more inharmonic than thin
    //     plain ones, which is a large part of why a low E does not sound
    //     like a transposed high E. A single delay line produces perfectly
    //     harmonic partials by construction, i.e. exactly the thing real
    //     strings are not.
    //
    //  2. TWO POLARISATIONS. A plucked string vibrates in two planes at
    //     once - parallel and perpendicular to the soundboard - and the
    //     two couple to the bridge differently, so they decay at different
    //     rates and are very slightly detuned from each other. That is
    //     what produces the characteristic two-stage decay (a fast initial
    //     fall, then a long quiet tail) and the gentle beating in a held
    //     note. One delay line gives a single clean exponential decay,
    //     which the ear reads immediately as electronic.
    //
    // Both are modelled below: two loops rather than one, and a cascade of
    // allpass filters in each loop. An allpass has flat magnitude but a
    // frequency-dependent DELAY, so it makes high partials travel round
    // the loop faster than low ones - which is precisely the dispersion
    // that stretches them sharp. That is the standard way to get
    // inharmonicity out of a delay-line string without a full waveguide.
    //
    // Stiffness rises steeply as strings get thicker, so the amount of
    // dispersion is scaled by register: low, wound strings get much more
    // of it than the plain treble strings.
    // ---- The render-quantum tax ---------------------------------------
    // A DelayNode that sits inside a FEEDBACK CYCLE is required by the Web
    // Audio spec to impose at least one render quantum of delay - 128
    // samples, about 2.9ms at 44.1kHz. That delay is ADDED to whatever
    // delayTime is asked for, so the loop period is
    //
    //     1/freq + 128/sampleRate
    //
    // rather than 1/freq, and every plucked note comes out FLAT. Measured:
    // asking for E2 (82.41Hz) produced a harmonic series built on 66.5Hz,
    // which is exactly 1/(1/82.41 + 128/44100) - about a minor third flat.
    // High notes are far worse, because the fixed 2.9ms error is a much
    // larger fraction of a short period; a requested E4 came out over an
    // octave low.
    //
    // This was in the string model from the day it was written, which
    // means every guitar, bass pluck, harp, kora and electric-piano note
    // the program has ever played has been at the wrong pitch. It is very
    // likely the single biggest reason the guitars never sounded right:
    // they were not playing the notes they were given.
    //
    // The compensation is simply to subtract the quantum back out. The
    // consequence is a hard ceiling - once 1/freq drops below one render
    // quantum the loop cannot be made short enough at all, so anything
    // above about 344Hz needs a different model entirely (see below).
    const QUANTUM = 128 / ctx.sampleRate;
    const period = 1 / freq;
    if (period <= QUANTUM * 1.05) {
      return this.pluckAdditive(time, freq, durationSeconds, vel, dest, opts);
    }

    const nodes = [];
    const ringTime = Math.max(durationSeconds, sustain);
    const outGain = ctx.createGain();
    outGain.gain.setValueAtTime(vel, time);
    outGain.gain.exponentialRampToValueAtTime(0.0006, time + ringTime);

    let tail = outGain;
    if (outputLowpass) {
      const body = ctx.createBiquadFilter();
      body.type = "lowpass";
      body.frequency.value = outputLowpass;
      body.connect(outGain);
      tail = body;
      nodes.push(body);
    }
    outGain.connect(dest);
    nodes.push(outGain);

    // Allpass dispersion was tried here to get inharmonicity into the
    // loop, and measurement killed it: an allpass has flat magnitude but a
    // frequency-dependent GROUP DELAY, and that delay lands inside the
    // feedback path, lengthening the loop and dragging the pitch flat by
    // several hundred cents. Compensating for it exactly is not possible
    // from the outside, because the whole point of the filter is that its
    // delay varies with frequency.
    //
    // Correct pitch is not negotiable and inharmonicity is a refinement,
    // so the loop stays dispersion-free and exactly in tune. The stiffness
    // stretching is modelled in pluckAdditive instead, where every partial
    // is placed individually and its frequency is known exactly.
    const dispersion = 0;

    // The two polarisations. The vertical one couples strongly to the
    // bridge so it is louder and dies fast; the horizontal one couples
    // weakly, so it is quieter and rings on - that ordering is what makes
    // the decay two-stage rather than a single exponential.
    const planes = [
      { detune: 1, gain: 1, fbScale: 1, dampScale: 1 },
      { detune: 1.0009, gain: 0.62, fbScale: 1.0035, dampScale: 0.82 },
    ];

    const excite = [];
    for (const pl of planes) {
      const d = ctx.createDelay(1);
      // Subtract the render quantum the cycle will add back.
      d.delayTime.value = Math.max(1 / ctx.sampleRate, 1 / (freq * pl.detune) - QUANTUM);
      const oneSample = ctx.createDelay(1);
      oneSample.delayTime.value = 1 / ctx.sampleRate;
      const pDamp = Math.min(0.95, damp * pl.dampScale);
      const gDirect = ctx.createGain();
      gDirect.gain.value = 1 - pDamp;
      const gDelayed = ctx.createGain();
      gDelayed.gain.value = pDamp;
      // Feedback stays strictly below 1 - the two-tap damping filter has
      // magnitude <= 1 at every frequency, so the loop is provably stable
      // for any feedback < 1, and the allpasses below are unity-gain, so
      // they cannot destabilise it either.
      const fb = ctx.createGain();
      fb.gain.value = Math.min(0.9995, feedback * pl.fbScale);

      let loopHead = d;
      const aps = [];
      for (let k = 0; k < dispersion; k++) {
        const ap = ctx.createBiquadFilter();
        ap.type = "allpass";
        // Spread the allpass corners across the string's own partial
        // range so the stretching accumulates smoothly with frequency
        // rather than kinking at one point.
        ap.frequency.value = Math.min(ctx.sampleRate / 2 - 100, freq * (2 + k * 3));
        ap.Q.value = 0.7;
        loopHead.connect(ap);
        loopHead = ap;
        aps.push(ap);
      }
      loopHead.connect(gDirect).connect(fb);
      loopHead.connect(oneSample).connect(gDelayed).connect(fb);
      fb.connect(d);

      const pg = ctx.createGain();
      pg.gain.value = pl.gain;
      loopHead.connect(pg).connect(tail);

      nodes.push(d, oneSample, gDirect, gDelayed, fb, pg, ...aps);
      excite.push(d);
    }

    // The pluck. A real pick does not excite both planes equally or at the
    // same instant - it displaces the string mostly in one direction and
    // the other plane is set going by coupling a moment later.
    excite.forEach((target, idx) => {
      const exciter = ctx.createBufferSource();
      exciter.buffer = this.makeNoiseBuffer(pluckNoise);
      const exciterFilter = ctx.createBiquadFilter();
      exciterFilter.type = "lowpass";
      exciterFilter.frequency.value = Math.min(9000, freq * 6 * brightness);
      const exciterGain = ctx.createGain();
      const lvl = idx === 0 ? 1 : 0.45;
      const t0 = time + (idx === 0 ? 0 : 0.0012);
      exciterGain.gain.setValueAtTime(lvl, t0);
      exciterGain.gain.linearRampToValueAtTime(0, t0 + pluckNoise);
      exciter.connect(exciterFilter).connect(exciterGain).connect(target);
      exciter.start(t0);
      exciter.stop(t0 + pluckNoise + 0.01);
      nodes.push(exciterFilter, exciterGain);
    });

    const cleanupMs = (ringTime + 0.3) * 1000;
    setTimeout(() => {
      for (const n of nodes) {
        try { n.disconnect(); } catch (_) { /* already gone */ }
      }
    }, cleanupMs);
  }

  // Real rhythm guitar on records is strummed CHORDS, not a single string
  // per note - that mismatch ("one string that lasts a second") was the
  // whole reason generated guitars read as fake. Two research-grounded
  // details make a strum read as a strum:
  // - The strings don't sound simultaneously: a pick sweeps across them,
  //   so each string starts ~8-16ms after the previous one (a full strum
  //   spreads ~30-60ms), with a slight velocity taper - and most strums
  //   in a groove are downstrums, with occasional upstrums (reversed
  //   string order) mixed in.
  // - Voicing depends on style: rock power chords are root/fifth/octave
  //   (deliberately third-free, which is why they work over anything and
  //   survive heavy distortion), while acoustic/funk strums voice the
  //   actual diatonic triad handed in from the scale.
  // Double-tracking is the foundation of a modern rock guitar sound:
  // the player performs the same part twice and the two takes are panned
  // hard left and right. The width comes from the small, unavoidable
  // timing and pitch differences between two human performances - which
  // is exactly why copying one track to both sides does NOT work. Two
  // genuinely separate passes are rendered here, each with its own
  // strum timing and detune, into opposite sides of the image.
  playGuitarDoubled(time, freqs, durationSeconds, vel, flavor) {
    const ctx = this.ctx;
    for (const side of [-0.72, 0.72]) {
      const pan = ctx.createStereoPanner();
      pan.pan.value = side;
      pan.connect(this.dest("guitar"));
      const detune = 1 + (Math.random() * 2 - 1) * 0.0035;
      const offset = Math.random() * 0.011;
      this.playGuitarChord(time + offset, freqs.map((f) => f * detune), durationSeconds, vel * 0.72, flavor, pan);
    }
  }

  playGuitarChord(time, freqs, durationSeconds, vel, flavor, destOverride) {
    let strings;
    if (flavor === "power") {
      // Each power-flavored string already adds its own fifth internally,
      // so striking root + octave yields the classic f/1.5f/2f/3f stack.
      strings = [freqs[0], freqs[0] * 2];
    } else if (flavor === "muted") {
      strings = [freqs[0], freqs[0] * 1.4983, freqs[0] * 2];
    } else {
      strings = freqs;
    }
    const gap = flavor === "funk" ? 0.007 : 0.013;
    const order = Math.random() < 0.8 ? strings : [...strings].reverse();
    order.forEach((f, i) => {
      const t = time + i * gap * (0.9 + Math.random() * 0.2);
      this.playGuitarVoice(t, f, durationSeconds, vel * 0.85 * (1 - i * 0.09), flavor, destOverride);
    });
  }

  // A GUITAR SPEAKER CABINET. This was the single biggest thing missing
  // from the guitar sound, and it is not a subtle refinement: a real
  // guitar speaker produces essentially nothing below ~80Hz or above
  // ~5kHz, and that steep top-end rolloff is precisely what makes a
  // distorted guitar sound like a guitar instead of like fizzy noise.
  // Feeding raw distortion straight to the output - which is what was
  // happening - keeps all the harsh harmonics above 5kHz that a real rig
  // physically cannot reproduce. Two cascaded lowpasses approximate the
  // steep acoustic rolloff, a presence peak gives the upper-mid bite
  // every speaker has, and a low-mid bump stands in for cabinet
  // resonance.
  makeGuitarCab(dest, opts = {}) {
    const { bright = 1, body = 1, presence = 5 } = opts;
    const ctx = this.ctx;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 85;
    hp.Q.value = 0.7;
    const bodyF = ctx.createBiquadFilter();
    bodyF.type = "peaking";
    bodyF.frequency.value = 180;
    bodyF.Q.value = 1.1;
    bodyF.gain.value = 4 * body;
    const pres = ctx.createBiquadFilter();
    pres.type = "peaking";
    pres.frequency.value = 2600;
    pres.Q.value = 1.1;
    pres.gain.value = presence;
    const lp1 = ctx.createBiquadFilter();
    lp1.type = "lowpass";
    lp1.frequency.value = 5000 * bright;
    lp1.Q.value = 0.9;
    const lp2 = ctx.createBiquadFilter();
    lp2.type = "lowpass";
    lp2.frequency.value = 6400 * bright;
    lp2.Q.value = 0.6;
    hp.connect(bodyF).connect(pres).connect(lp1).connect(lp2).connect(dest);
    return hp;
  }

  // An acoustic guitar's tone is dominated by its body: the Helmholtz air
  // resonance around 100Hz and the top-plate resonance around 200Hz are
  // most of what separates a real acoustic from a bare plucked string.
  makeAcousticBody(dest) {
    const ctx = this.ctx;
    const air = ctx.createBiquadFilter();
    air.type = "peaking";
    air.frequency.value = 104;
    air.Q.value = 2.2;
    air.gain.value = 6;
    const top = ctx.createBiquadFilter();
    top.type = "peaking";
    top.frequency.value = 205;
    top.Q.value = 1.8;
    top.gain.value = 4;
    const sheen = ctx.createBiquadFilter();
    sheen.type = "highshelf";
    sheen.frequency.value = 4000;
    sheen.gain.value = 3;
    air.connect(top).connect(sheen).connect(dest);
    return air;
  }

  // Pick noise: the plectrum scraping the wound string before the note
  // speaks. Short, bright, and present on every real picked note.
  addPickNoise(time, vel, dest, amount = 1) {
    const ctx = this.ctx;
    const n = ctx.createBufferSource();
    n.buffer = this.makeNoiseBuffer(0.012);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2800;
    bp.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel * 0.16 * amount, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.012);
    n.connect(bp).connect(g).connect(dest);
    n.start(time);
    n.stop(time + 0.016);
  }

  playGuitarVoice(time, freq, durationSeconds, vel, flavor, destOverride) {
    const ctx = this.ctx;
    const dest = destOverride || this.dest("guitar");
    // Held chords should ring like a real strummed guitar does, not get
    // clipped at ~1 second regardless of the note length.
    const dur = Math.min(durationSeconds, flavor === "muted" ? 0.18 : 2.2);

    if (flavor === "power") {
      // A real high-gain rig is a chain, and the order matters:
      //   string -> tight-EQ -> distortion -> speaker cabinet
      // The pre-distortion highpass is standard high-gain practice: low
      // frequencies hitting a distortion stage intermodulate into mud, so
      // engineers tighten the low end BEFORE the gain, not after. The cab
      // then removes the harsh fizz above 5kHz that a speaker physically
      // cannot reproduce.
      const cab = this.makeGuitarCab(dest, { bright: 1, body: 1, presence: 6 });
      const post = ctx.createGain();
      post.gain.value = 0.5;
      post.connect(cab);
      const shaper = ctx.createWaveShaper();
      shaper.curve = this.makeDistortionCurve(30);
      shaper.connect(post);
      const tight = ctx.createBiquadFilter();
      tight.type = "highpass";
      tight.frequency.value = 150;
      tight.Q.value = 0.7;
      tight.connect(shaper);
      this.addPickNoise(time, vel, cab, 1.2);
      this.pluckString(time, freq, dur, vel, tight, { damp: 0.28, feedback: 0.985, pluckNoise: 0.01, brightness: 1.1, sustain: 0.9 });
      this.pluckString(time, freq * 1.5, dur, vel * 0.75, tight, { damp: 0.28, feedback: 0.985, pluckNoise: 0.01, brightness: 1.1, sustain: 0.9 });
      return;
    }

    if (flavor === "openchord") {
      // Open-position chords let unfretted strings ring on. Those open
      // strings are all E, A, D, G, B and E - fixed pitches that do not
      // move with the chord - so an open-chord part has a drone running
      // under the harmony, which is exactly why open-position guitar
      // sounds so much bigger and more resonant than the same chord
      // played as a barre further up the neck.
      const body = this.makeAcousticBody(dest);
      this.addPickNoise(time, vel, body, 1);
      this.pluckString(time, freq, dur, vel, body, { damp: 0.22, feedback: 0.992, pluckNoise: 0.01, brightness: 1.1, sustain: 1.8 });
      // A ringing open string underneath, quietly.
      if (Math.random() < 0.6) {
        const openHz = [82.41, 110, 146.83, 196][Math.floor(Math.random() * 4)];
        this.pluckString(time + 0.01, openHz, dur * 1.4, vel * 0.28, body,
          { damp: 0.2, feedback: 0.994, pluckNoise: 0.004, brightness: 0.9, sustain: 2.2 });
      }
      return;
    }

    if (flavor === "resonator") {
      // A resonator guitar has no wooden soundboard at all - a spun metal
      // cone does the radiating. That cone has a strong, narrow resonance
      // and a metallic ring, which is the whole blues/bluegrass dobro
      // character, and it is why a resonator cuts through an acoustic
      // band the way a wooden guitar cannot.
      const cone = ctx.createBiquadFilter();
      cone.type = "peaking";
      cone.frequency.value = 1250;
      cone.Q.value = 3.2;
      cone.gain.value = 11;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 190;    // metal cone: no deep body
      cone.connect(hp).connect(dest);
      this.addPickNoise(time, vel, dest, 1.2);
      this.pluckString(time, freq, dur, vel, cone, { damp: 0.14, feedback: 0.988, pluckNoise: 0.008, brightness: 1.4, sustain: 1.1 });
      return;
    }

    if (flavor === "baritone") {
      // A baritone guitar is tuned a fourth or fifth below standard, with
      // a longer scale so the strings stay tight rather than floppy. It
      // occupies the gap between guitar and bass - the surf/Western and
      // modern cinematic-rock voice.
      const cab = this.makeGuitarCab(dest, { bright: 0.8, body: 1.5, presence: 2 });
      this.addPickNoise(time, vel, cab, 1.1);
      this.pluckString(time, freq / 2, dur, vel, cab, { damp: 0.24, feedback: 0.991, pluckNoise: 0.012, brightness: 0.9, sustain: 1.5 });
      return;
    }

    if (flavor === "sitar") {
      // Two features make a sitar a sitar, and neither is the scale it's
      // played in:
      //  1. The JAWARI - a wide, curved, flat-topped bridge the string
      //     grazes as it vibrates. That repeated contact re-excites the
      //     string's upper partials continuously instead of letting them
      //     decay, which is the famous buzz. Modelled here as a bright,
      //     lightly-damped string driven into a waveshaper, so the high
      //     harmonics keep being regenerated rather than dying away.
      //  2. The SYMPATHETIC STRINGS (taraf) - eleven to thirteen strings
      //     under the frets that are never plucked at all and just ring
      //     in response, tuned to the raga. They are what gives a sitar
      //     its halo of pitched resonance around every note.
      const body = this.makeAcousticBody(dest);
      const buzz = ctx.createWaveShaper();
      buzz.curve = this.makeDistortionCurve(14);
      const buzzTone = ctx.createBiquadFilter();
      buzzTone.type = "peaking";
      buzzTone.frequency.value = 3000;
      buzzTone.Q.value = 1.1;
      buzzTone.gain.value = 8;
      buzz.connect(buzzTone).connect(body);
      this.addPickNoise(time, vel, body, 0.9);
      this.pluckString(time, freq, dur, vel, buzz, { damp: 0.08, feedback: 0.995, pluckNoise: 0.006, brightness: 1.6, sustain: 2.2 });
      // The sympathetic strings: quiet, undamped, and deliberately NOT
      // struck at the same instant - they respond to the note, they don't
      // share its attack.
      for (const ratio of [0.5, 1.5, 2, 3]) {
        this.pluckString(time + 0.02, freq * ratio, dur * 1.6, vel * 0.14, body,
          { damp: 0.05, feedback: 0.996, pluckNoise: 0.002, brightness: 1.4, sustain: 3 });
      }
      return;
    }

    if (flavor === "banjo") {
      // A five-string banjo is a drum with strings on it: the head is a
      // membrane, not a wooden soundboard, so there is almost no low end
      // and an extremely fast, bright, percussive decay. Played with
      // fingerpicks, which is a harder attack than flesh.
      const head = ctx.createBiquadFilter();
      head.type = "highpass";
      head.frequency.value = 220;   // membrane: no body resonance down low
      const ring = ctx.createBiquadFilter();
      ring.type = "peaking";
      ring.frequency.value = 1900;
      ring.Q.value = 1.4;
      ring.gain.value = 6;
      head.connect(ring).connect(dest);
      this.addPickNoise(time, vel, dest, 1.3);
      this.pluckString(time, freq, Math.min(dur, 0.7), vel, head, { damp: 0.16, feedback: 0.972, pluckNoise: 0.005, brightness: 1.5, sustain: 0.45 });
      return;
    }

    if (flavor === "mandolin") {
      // Courses of PAIRED strings, tuned very slightly apart - that pair
      // beating against itself is the mandolin's shimmer, and it is also
      // why mandolin parts are so often tremolo-picked: the instrument
      // decays too fast to sustain any other way.
      const body = this.makeAcousticBody(dest);
      const strokes = dur > 0.35 ? Math.max(2, Math.round(dur / 0.075)) : 1;
      for (let s = 0; s < strokes; s++) {
        const t = time + s * 0.075;
        const amp = vel * (s === 0 ? 1 : 0.6);
        for (const detune of [0.997, 1.003]) {
          this.pluckString(t, freq * detune, 0.25, amp * 0.6, body,
            { damp: 0.2, feedback: 0.975, pluckNoise: 0.004, brightness: 1.35, sustain: 0.35 });
        }
      }
      return;
    }

    if (flavor === "ukulele") {
      // Nylon strings on a very small box: no sustain, no low end, and a
      // soft fingertip attack rather than a pick.
      const body = this.makeAcousticBody(dest);
      const small = ctx.createBiquadFilter();
      small.type = "highpass";
      small.frequency.value = 260;
      small.connect(body);
      this.pluckString(time, freq, Math.min(dur, 0.55), vel * 0.9, small, { damp: 0.34, feedback: 0.968, pluckNoise: 0.012, brightness: 0.85, sustain: 0.4 });
      return;
    }

    if (flavor === "slide") {
      // Bottleneck slide: no frets involved, so the note ARRIVES from
      // somewhere else - a continuous glide into pitch - and it carries a
      // slow, wide vibrato from the player rocking the slide. That
      // approach glide is the entire identity of the sound.
      const cab = this.makeGuitarCab(dest, { bright: 0.85, body: 1.2, presence: 3 });
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      const from = freq * (Math.random() < 0.5 ? 0.84 : 1.19);
      osc.frequency.setValueAtTime(from, time);
      osc.frequency.exponentialRampToValueAtTime(freq, time + Math.min(0.16, dur * 0.4));
      const vib = ctx.createOscillator();
      vib.frequency.value = 5.2;
      const vibAmt = ctx.createGain();
      vibAmt.gain.value = freq * 0.012;
      vib.connect(vibAmt).connect(osc.frequency);
      vib.start(time);
      vib.stop(time + dur + 0.1);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 2600;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.7, time + 0.03);
      gain.gain.setValueAtTime(vel * 0.7, time + dur * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc.connect(lp).connect(gain).connect(cab);
      osc.start(time);
      osc.stop(time + dur + 0.05);
      return;
    }

    if (flavor === "jazz") {
      // Dark, round, heavily-damped string - the hollow-body archtop tone.
      const jazzCab = this.makeGuitarCab(dest, { bright: 0.55, body: 1.4, presence: 1 });
      this.pluckString(time, freq, dur, vel * 0.9, jazzCab, { damp: 0.45, feedback: 0.99, pluckNoise: 0.012, brightness: 0.5, sustain: 1.2, outputLowpass: 2200 });
      return;
    }

    if (flavor === "acoustic") {
      // Steel-string through a real body resonance, plus pick noise and a
      // slightly detuned second string for the natural doubling of a
      // strummed acoustic.
      const body = this.makeAcousticBody(dest);
      this.addPickNoise(time, vel, body, 1.1);
      this.pluckString(time, freq, dur, vel, body, { damp: 0.18, feedback: 0.99, pluckNoise: 0.012, brightness: 1.1, sustain: 1.3 });
      this.pluckString(time, freq * 1.004, dur, vel * 0.4, body, { damp: 0.18, feedback: 0.99, pluckNoise: 0.012, brightness: 1.1, sustain: 1.3 });
      return;
    }

    if (flavor === "muted") {
      // Palm muting damps the string with the picking hand: a percussive
      // thud with a hard attack and almost no ring. Runs through the same
      // amp and cab as the power chord, because it is the same rig.
      const cab = this.makeGuitarCab(dest, { bright: 0.85, body: 1.2, presence: 4 });
      const post = ctx.createGain();
      post.gain.value = 0.6;
      post.connect(cab);
      const shaper = ctx.createWaveShaper();
      shaper.curve = this.makeDistortionCurve(22);
      shaper.connect(post);
      const tight = ctx.createBiquadFilter();
      tight.type = "highpass";
      tight.frequency.value = 140;
      tight.connect(shaper);
      this.addPickNoise(time, vel, cab, 1.4);
      this.pluckString(time, freq, Math.min(dur, 0.16), vel, tight, { damp: 0.4, feedback: 0.93, pluckNoise: 0.014, brightness: 0.8, sustain: 0.16 });
      return;
    }

    if (flavor === "nylon") {
      // Classical guitar: fingerstyle, so no pick noise at all - the
      // flesh-on-string attack is soft and that absence is audible. Same
      // body resonance, warmer and rounder.
      const body = this.makeAcousticBody(dest);
      this.pluckString(time, freq, dur, vel, body, { damp: 0.32, feedback: 0.992, pluckNoise: 0.02, brightness: 0.65, sustain: 1.4 });
      return;
    }

    if (flavor === "funk") {
      // Short, choppy, wah-like bandpass stab - the percussive muted
      // sixteenth-note comping heard in funk/disco rhythm guitar.
      const shortDur = Math.min(dur, 0.12);
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, time);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.setValueAtTime(900, time);
      bp.frequency.exponentialRampToValueAtTime(2200, time + shortDur);
      bp.Q.value = 3;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + shortDur);
      osc.connect(bp).connect(gain).connect(dest);
      osc.start(time);
      osc.stop(time + shortDur + 0.05);
      return;
    }

    if (flavor === "twelvestring") {
      // Doubled, slightly detuned+octave-up string pair for the shimmering
      // chorus-like ring of a 12-string.
      // Doubled unison plus an octave-up pair, each its own physically
      // modeled string - the shimmering chorus-like ring of a real
      // 12-string comes from actual doubled strings beating together,
      // not a single oscillator with a chorus effect bolted on.
      const body12 = this.makeAcousticBody(dest);
      this.addPickNoise(time, vel, body12, 1.2);
      for (const [ratio, level] of [[1, 1], [1.003, 1], [2, 0.35], [2.006, 0.35]]) {
        this.pluckString(time, freq * ratio, dur, vel * level, body12, { damp: 0.12, feedback: 0.988, pluckNoise: 0.008, brightness: 1.2, sustain: 1.2 });
      }
      return;
    }

    // Clean electric is still an amplifier and speaker - a clean tone
    // played direct with no cab sounds thin and clinical, which is why
    // even "clean" guitar tracks are mic'd cabs.
    const cleanCab = this.makeGuitarCab(dest, { bright: 1.25, body: 0.7, presence: 3 });
    this.addPickNoise(time, vel, cleanCab, 0.9);
    this.pluckString(time, freq, dur, vel, cleanCab, { damp: 0.08, feedback: 0.99, pluckNoise: 0.006, brightness: 1.3, sustain: 1.0 });
  }

  // The ARP Solina / String Ensemble chorus, built to its actual circuit
  // rather than as "a chorus effect". Three bucket-brigade delay lines are
  // modulated by two three-phase generators - one slow ("chorus"), one
  // fast ("vibrato") - with BBD1 fed the 0-degree outputs, BBD2 the
  // 120-degree outputs and BBD3 the 240-degree outputs. Crucially the dry
  // signal is NOT heard at all: only the summed output of the three
  // delays. That is what makes a Solina sound like a swirling ensemble
  // rather than like a synth with chorus on it, and it is why every
  // 70s string machine sounds the way it does.
  makeSolinaEnsemble(dest, depthScale = 1) {
    const ctx = this.ctx;
    const input = ctx.createGain();
    const chorusLfo = ctx.createOscillator();
    chorusLfo.frequency.value = 0.6;
    const vibratoLfo = ctx.createOscillator();
    vibratoLfo.frequency.value = 6.1;
    const now = ctx.currentTime;
    chorusLfo.start(now);
    vibratoLfo.start(now);

    for (let i = 0; i < 3; i++) {
      const phase = (i * 2 * Math.PI) / 3;
      const delay = ctx.createDelay(0.05);
      delay.delayTime.value = 0.012 + i * 0.001;
      // A DelayNode has no phase control, so each tap's phase offset is
      // realised as a fixed delay on the modulation signal itself -
      // 120 degrees of the LFO period.
      for (const [lfo, depth] of [[chorusLfo, 0.0035], [vibratoLfo, 0.0008]]) {
        const amt = ctx.createGain();
        amt.gain.value = depth * depthScale;
        const phaseDelay = ctx.createDelay(1);
        phaseDelay.delayTime.value = phase / (2 * Math.PI * lfo.frequency.value);
        lfo.connect(phaseDelay).connect(amt).connect(delay.delayTime);
      }
      const tap = ctx.createGain();
      tap.gain.value = 1 / 3;
      input.connect(delay).connect(tap).connect(dest);
    }
    return input;
  }

  playStringsVoice(time, freq, durationSeconds, vel, flavor) {
    if (this.playSampleFlavor("strings", flavor, time, vel, freq, durationSeconds)) return;
    const ctx = this.ctx;
    const dest = this.dest("strings");

    // A string section is many players slightly out of tune with each other -
    // that spread IS the sound, and it is why one violin and sixteen violins
    // are different instruments rather than one instrument at two volumes.
    const SECTIONS = {
      solocello: { voices: 1, spreadCents: 0, cutoff: 2600, attack: 0.09, oct: 0.5, sawMix: 0.6 },
      chamber:   { voices: 4, spreadCents: 7, cutoff: 3400, attack: 0.13, oct: 1, sawMix: 0.7 },
      cinematic: { voices: 12, spreadCents: 19, cutoff: 4200, attack: 0.3, oct: 1, sawMix: 0.85 },
      marcato:   { voices: 6, spreadCents: 11, cutoff: 3800, attack: 0.025, oct: 1, sawMix: 0.9 },
      sulponte:  { voices: 5, spreadCents: 14, cutoff: 7200, attack: 0.16, oct: 1, sawMix: 1 },
    };
    if (SECTIONS[flavor]) {
      const p = SECTIONS[flavor];
      const d2 = Math.min(durationSeconds, 3);
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.value = p.cutoff;
      filt.Q.value = 0.8;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, time);
      g.gain.linearRampToValueAtTime(vel * 0.34, time + Math.min(p.attack, d2 * 0.5));
      g.gain.setValueAtTime(vel * 0.34, time + Math.max(0.05, d2 - 0.18));
      g.gain.exponentialRampToValueAtTime(0.001, time + d2);
      filt.connect(g).connect(dest);
      for (let i = 0; i < p.voices; i++) {
        const o = ctx.createOscillator();
        o.type = Math.random() < p.sawMix ? "sawtooth" : "triangle";
        const cents = p.voices === 1 ? 0 : (Math.random() * 2 - 1) * p.spreadCents;
        o.frequency.setValueAtTime(freq * p.oct * Math.pow(2, cents / 1200), time);
        const og = ctx.createGain();
        og.gain.value = 1 / Math.sqrt(p.voices);
        o.connect(og).connect(filt);
        o.start(time); o.stop(time + d2 + 0.08);
      }
      return;
    }

    if (flavor === "solina") {
      // Divide-down organ tone (a single master oscillator divided for
      // every note, so all notes are phase-locked and perfectly in tune -
      // sterile on its own) run entirely through the ensemble above.
      const dur = Math.max(durationSeconds, 0.7);
      const ens = this.makeSolinaEnsemble(dest);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.5, time + 0.12);
      gain.gain.setValueAtTime(vel * 0.5, time + dur * 0.75);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur + 0.25);
      const tone = ctx.createBiquadFilter();
      tone.type = "lowpass";
      tone.frequency.value = 4200;
      gain.connect(tone).connect(ens);
      // Divide-down keyboards produce square/pulse waves, plus the octave
      // above from the next divider stage.
      for (const [ratio, lvl] of [[1, 1], [2, 0.45]]) {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = freq * ratio;
        const g = ctx.createGain();
        g.gain.value = lvl;
        osc.connect(g).connect(gain);
        osc.start(time);
        osc.stop(time + dur + 0.35);
      }
      return;
    }

    if (flavor === "cello") {
      // Cello section: the bottom of the string family. Bowed, so it
      // starts slowly (rosin has to grab the string) and has a strong
      // even-harmonic body; the register is what does the work, so this
      // voice deliberately emphasises the low partials.
      const dur = Math.max(durationSeconds, 0.5);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.6, time + 0.14);
      gain.gain.setValueAtTime(vel * 0.6, time + dur * 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur + 0.2);
      const body = ctx.createBiquadFilter();
      body.type = "peaking";
      body.frequency.value = 230;   // the cello's main air resonance
      body.Q.value = 1.1;
      body.gain.value = 6;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 3000;
      gain.connect(body).connect(lp).connect(dest);
      // Three players never bow in exact unison - the spread is the
      // section sound.
      for (const detune of [-6, 0, 5]) {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = freq;
        osc.detune.value = detune;
        const g = ctx.createGain();
        g.gain.value = 0.4;
        osc.connect(g).connect(gain);
        osc.start(time);
        osc.stop(time + dur + 0.3);
      }
      return;
    }

    if (flavor === "spiccato") {
      // Spiccato: the bow is bounced off the string, so every note is a
      // short, dry, articulated dot with a hard attack and no tail. It is
      // the standard "driving strings" articulation in film and trailer
      // writing, and it is rhythmic rather than sustaining.
      const dur = Math.min(durationSeconds, 0.16);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.8, time + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 4500;
      gain.connect(lp).connect(dest);
      for (const detune of [-8, 0, 7]) {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = freq;
        osc.detune.value = detune;
        const g = ctx.createGain();
        g.gain.value = 0.35;
        osc.connect(g).connect(gain);
        osc.start(time);
        osc.stop(time + dur + 0.05);
      }
      // Bow bite - the scrape of hair grabbing the string.
      const bite = ctx.createBufferSource();
      bite.buffer = this.makeNoiseBuffer(0.02);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 2800;
      const bg = ctx.createGain();
      bg.gain.setValueAtTime(vel * 0.18, time);
      bg.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
      bite.connect(bp).connect(bg).connect(dest);
      bite.start(time);
      bite.stop(time + 0.025);
      return;
    }

    if (flavor === "harp") {
      // A concert harp is plucked with the flesh of the finger, not a
      // pick or nail, so it has almost no attack noise - just a pure,
      // long, evenly-decaying tone with a lot of soundboard resonance.
      const dur = Math.min(Math.max(durationSeconds, 1.2), 3);
      const board = ctx.createBiquadFilter();
      board.type = "peaking";
      board.frequency.value = 400;
      board.Q.value = 0.8;
      board.gain.value = 4;
      board.connect(dest);
      this.pluckString(time, freq, dur, vel * 0.85, board,
        { damp: 0.2, feedback: 0.9935, pluckNoise: 0.001, brightness: 0.9, sustain: 2.4 });
      return;
    }

    if (flavor === "mellotron") {
      // The Mellotron (1963) - the tape-replay "strings in a box" behind
      // "Strawberry Fields Forever" and most of early prog. Each key
      // pulled a strip of magnetic tape across a head, so its character
      // is really three tape artifacts stacked: wow/flutter (slow random
      // pitch instability from imperfect tape transport - modeled as a
      // sub-Hz LFO wobbling every oscillator's pitch), a hard band-limit
      // (the tapes simply had no top end), and a faint constant hiss
      // under the note. None of the other string flavors have any of
      // those - they're all "perfect" oscillators.
      const dur = Math.max(durationSeconds, 0.8);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.7, time + 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 2700;
      lp.connect(gain).connect(dest);

      const wow = ctx.createOscillator();
      wow.frequency.value = 0.8 + Math.random() * 0.5;
      const wowGain = ctx.createGain();
      wowGain.gain.value = freq * 0.006;
      wow.connect(wowGain);
      for (const det of [0, 0.005, -0.006]) {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq * (1 + det), time);
        wowGain.connect(osc.frequency);
        osc.connect(lp);
        osc.start(time);
        osc.stop(time + dur + 0.1);
      }
      wow.start(time);
      wow.stop(time + dur + 0.1);

      const hiss = ctx.createBufferSource();
      hiss.buffer = this.makeNoiseBuffer(dur + 0.05);
      const hissBp = ctx.createBiquadFilter();
      hissBp.type = "bandpass";
      hissBp.frequency.value = 5000;
      const hissGain = ctx.createGain();
      hissGain.gain.setValueAtTime(vel * 0.025, time);
      hissGain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      hiss.connect(hissBp).connect(hissGain).connect(dest);
      hiss.start(time);
      hiss.stop(time + dur + 0.05);
      return;
    }

    if (flavor === "pizzicato") {
      // Plucked strings: near-instant attack, fast triangle-body decay,
      // no vibrato - the opposite articulation from a bowed sustain.
      const dur = Math.min(durationSeconds, 0.22);
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, time);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2600, time);
      filter.frequency.exponentialRampToValueAtTime(400, time + dur);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc.connect(filter).connect(gain).connect(dest);
      osc.start(time);
      osc.stop(time + dur + 0.05);
      return;
    }

    if (flavor === "tremolo") {
      // Sustained bowed tone with fast amplitude modulation - the
      // classic tense "tremolo strings" texture.
      const dur = Math.max(durationSeconds, 0.6);
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, time);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 2000;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.75, time + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      const trem = ctx.createOscillator();
      trem.frequency.value = 11;
      const tremGain = ctx.createGain();
      tremGain.gain.value = vel * 0.35;
      trem.connect(tremGain).connect(gain.gain);
      osc.connect(filter).connect(gain).connect(dest);
      osc.start(time);
      osc.stop(time + dur + 0.1);
      trem.start(time);
      trem.stop(time + dur + 0.1);
      return;
    }

    const attack = flavor === "staccato" ? 0.02 : 0.15;
    const dur = flavor === "staccato" ? Math.min(durationSeconds, 0.35) : Math.max(durationSeconds, 0.5);
    const detunes = flavor === "orchestral" ? [0, 0.008, -0.008, 0.014] : flavor === "synth" ? [0, 0.012, -0.012, 0.022, -0.022] : [0, 0.005, -0.005];

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 5.5;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = freq * 0.008;

    for (const d of detunes) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq * (1 + d), time);
      lfo.connect(lfoGain).connect(osc.frequency);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 2000;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime((vel * 0.8) / detunes.length, time + attack);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc.connect(filter).connect(gain).connect(dest);
      osc.start(time);
      osc.stop(time + dur + 0.1);
    }
    lfo.start(time);
    lfo.stop(time + dur + 0.1);
  }

  // A brass instrument is a long tube plus a player's lips. Two things
  // follow, and they are what all four flavors below share:
  //  * The bore shape decides the harmonic content. A CYLINDRICAL bore
  //    (trumpet, trombone) reflects high harmonics strongly and sounds
  //    bright and edgy; a CONICAL bore (flugelhorn, tuba, French horn)
  //    spreads out and sounds dark and round. This is why a flugelhorn
  //    and a trumpet in the same register sound nothing alike.
  //  * Brass gets brighter as it gets louder, because harder blowing
  //    drives the air column nonlinearly. A brass patch with a fixed
  //    filter always sounds like a synth; the filter has to open with
  //    velocity and over the attack.
  playBrassVoice(time, freq, dur, vel, dest, opts) {
    const ctx = this.ctx;
    const { bright, bodyHz, bodyGain, rasp, attack } = opts;
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.setValueAtTime(bright * 0.45, time);
    filt.frequency.linearRampToValueAtTime(bright * (0.7 + vel * 0.5), time + attack * 2.5);
    filt.frequency.linearRampToValueAtTime(bright * 0.6, time + dur);
    filt.Q.value = 1.1;
    const body = ctx.createBiquadFilter();
    body.type = "peaking";
    body.frequency.value = bodyHz;
    body.Q.value = 1.1;
    body.gain.value = bodyGain;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(vel * 0.55, time + attack);
    gain.gain.setValueAtTime(vel * 0.55, time + Math.max(attack, dur * 0.8));
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur + 0.08);
    filt.connect(body).connect(gain).connect(dest);
    // Lip attack: real brass notes start slightly flat and settle.
    const osc = ctx.createOscillator();
    osc.type = rasp ? "sawtooth" : "square";
    osc.frequency.setValueAtTime(freq * 0.985, time);
    osc.frequency.linearRampToValueAtTime(freq, time + attack * 1.4);
    osc.connect(filt);
    osc.start(time);
    osc.stop(time + dur + 0.15);
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = freq;
    const sg = ctx.createGain();
    sg.gain.value = 0.35;
    sub.connect(sg).connect(filt);
    sub.start(time);
    sub.stop(time + dur + 0.15);
    // Air through the mouthpiece.
    const air = ctx.createBufferSource();
    air.buffer = this.makeNoiseBuffer(Math.min(dur + 0.2, 1.5));
    const ahp = ctx.createBiquadFilter();
    ahp.type = "highpass";
    ahp.frequency.value = 2500;
    const ag = ctx.createGain();
    ag.gain.setValueAtTime(vel * 0.12, time);
    ag.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);
    air.connect(ahp).connect(ag).connect(dest);
    air.start(time);
    air.stop(time + dur + 0.1);
  }

  playHornVoice(time, freq, durationSeconds, vel, flavor) {
    const ctx = this.ctx;
    const dest = this.dest("horn");

    const BRASS = {
      hornsection: { oct: 1, bright: 0.8, attack: 0.04, voices: 4, spread: 9 },
      solotrumpet: { oct: 2, bright: 0.95, attack: 0.03, voices: 1, spread: 0 },
      mellow:      { oct: 1, bright: 0.45, attack: 0.07, voices: 2, spread: 5 },
      stabbrass:   { oct: 1, bright: 0.88, attack: 0.012, voices: 5, spread: 12 },
      lowbrass:    { oct: 0.5, bright: 0.5, attack: 0.06, voices: 3, spread: 7 },
    };
    if (BRASS[flavor]) {
      const p = BRASS[flavor];
      const d2 = Math.min(durationSeconds, 1.8);
      const f0 = freq * p.oct;
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      // Brass gets BRIGHTER as it gets louder - the bell opens up. A static
      // filter is the thing that makes synthesized brass sound like a pad.
      filt.frequency.setValueAtTime(700, time);
      filt.frequency.linearRampToValueAtTime(900 + p.bright * 5200, time + p.attack * 2.5);
      filt.frequency.linearRampToValueAtTime(700 + p.bright * 2200, time + d2);
      filt.Q.value = 1.2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, time);
      g.gain.linearRampToValueAtTime(vel * 0.38, time + p.attack);
      g.gain.setValueAtTime(vel * 0.38, time + Math.max(0.04, d2 - 0.1));
      g.gain.exponentialRampToValueAtTime(0.001, time + d2);
      filt.connect(g).connect(dest);
      for (let i = 0; i < p.voices; i++) {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        const cents = p.voices === 1 ? 0 : (i - (p.voices - 1) / 2) * p.spread;
        o.frequency.setValueAtTime(f0 * Math.pow(2, cents / 1200), time);
        const og = ctx.createGain();
        og.gain.value = 1 / Math.sqrt(p.voices);
        o.connect(og).connect(filt);
        o.start(time); o.stop(time + d2 + 0.06);
      }
      return;
    }

    // Cylindrical bore, so bright and edgy, but a much larger one than a
    // trumpet: the trombone is the tenor voice of the section and the
    // only brass instrument with continuous pitch (the slide), which is
    // why glissandi and fall-offs are its signature.
    if (flavor === "trombone") {
      this.playBrassVoice(time, freq, Math.max(durationSeconds, 0.25), vel, dest,
        { bright: 3400, bodyHz: 520, bodyGain: 5, rasp: true, attack: 0.035 });
      return;
    }
    // Conical bore and a huge one: almost no upper harmonics survive, so
    // a tuba is essentially a very loud fundamental. It is a bass
    // instrument and belongs under the section, not in it.
    if (flavor === "tuba") {
      this.playBrassVoice(time, freq, Math.max(durationSeconds, 0.3), vel * 1.15, dest,
        { bright: 1300, bodyHz: 180, bodyGain: 7, rasp: false, attack: 0.06 });
      return;
    }
    // A flugelhorn is a trumpet's conical cousin - same range, completely
    // different colour: dark, velvety, no edge. The classic warm solo
    // voice on ballads and on Brazilian/soul records.
    if (flavor === "flugelhorn") {
      this.playBrassVoice(time, freq, Math.max(durationSeconds, 0.25), vel, dest,
        { bright: 2200, bodyHz: 700, bodyGain: 4, rasp: false, attack: 0.05 });
      return;
    }
    // Piccolo is not brass at all, but it lives in the same "top line of
    // the wind section" role: a tiny stopped-free pipe sounding an octave
    // above written, so bright it cuts through an entire orchestra.
    if (flavor === "piccolo") {
      const dur = Math.max(durationSeconds, 0.2);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.42, time + 0.03);
      gain.gain.setValueAtTime(vel * 0.42, time + dur * 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur + 0.08);
      gain.connect(dest);
      for (const [ratio, lvl] of [[2, 1], [4, 0.18], [6, 0.06]]) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq * ratio;
        const g = ctx.createGain();
        g.gain.value = lvl;
        osc.connect(g).connect(gain);
        osc.start(time);
        osc.stop(time + dur + 0.12);
      }
      const breath = ctx.createBufferSource();
      breath.buffer = this.makeNoiseBuffer(Math.min(dur + 0.1, 1.2));
      const bhp = ctx.createBiquadFilter();
      bhp.type = "highpass";
      bhp.frequency.value = 5000;
      const bg = ctx.createGain();
      bg.gain.setValueAtTime(vel * 0.14, time);
      bg.gain.linearRampToValueAtTime(vel * 0.05, time + 0.08);
      bg.gain.linearRampToValueAtTime(0.0001, time + dur);
      breath.connect(bhp).connect(bg).connect(dest);
      breath.start(time);
      breath.stop(time + dur + 0.1);
      return;
    }

    if (flavor === "trumpetstab") {
      const dur = Math.min(durationSeconds, 0.22);
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, time);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 2100;
      bp.Q.value = 2;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 1.1, time + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc.connect(bp).connect(gain).connect(dest);
      osc.start(time);
      osc.stop(time + dur + 0.05);
      return;
    }

    if (flavor === "section") {
      // A thicker detuned ensemble of horns rather than one solo voice -
      // the sound of a stacked horn section hit.
      const dur = Math.min(durationSeconds, 0.55);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.85, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1700;
      bp.Q.value = 1.4;
      bp.connect(gain).connect(dest);
      for (const detune of [0, 0.008, -0.006, 0.014]) {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq * (1 + detune), time);
        osc.connect(bp);
        osc.start(time);
        osc.stop(time + dur + 0.05);
      }
      return;
    }

    if (flavor === "clarinet") {
      // A clarinet's cylindrical bore (closed at the reed end) acoustically
      // suppresses even harmonics, leaving only the odd ones - a square
      // wave is exactly that: odd harmonics only, none of the even ones a
      // sawtooth (used for the brass flavors) has. That's the real acoustic
      // reason a clarinet reads as hollow/woody rather than brassy, and
      // it's a genuinely different synthesis path, not just a filter swap.
      const dur = Math.min(durationSeconds, 0.55);
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, time);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1100;
      bp.Q.value = 2.2;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.75, time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc.connect(bp).connect(gain).connect(dest);
      osc.start(time);
      osc.stop(time + dur + 0.05);
      return;
    }

    if (flavor === "frenchhorn") {
      // A French horn's long, tightly-coiled conical bore and the
      // player's hand damping the bell heavily roll off the upper
      // harmonics compared to a trumpet's bright, open cylindrical bore -
      // a lowpass (rounding everything above the cutoff) is the right
      // shape for that, not the narrow resonant bandpass every other horn
      // flavor here uses. The attack is also noticeably slower: a horn
      // genuinely speaks more slowly than a trumpet does.
      const dur = Math.min(durationSeconds, 0.6);
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, time);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1100;
      lp.Q.value = 0.7;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.8, time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc.connect(lp).connect(gain).connect(dest);
      osc.start(time);
      osc.stop(time + dur + 0.05);
      return;
    }

    if (flavor === "oboe") {
      // A double reed (two reeds buzzing against each other, versus the
      // clarinet's single reed against a fixed mouthpiece) produces a much
      // richer spectrum with strong even harmonics too, plus a pronounced
      // resonant "nasal" formant around 1.2kHz - a narrow high-Q peaking
      // filter on a full sawtooth gets both of those right where the
      // clarinet's odd-harmonics-only square wave deliberately can't.
      const dur = Math.min(durationSeconds, 0.5);
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, time);
      const peak = ctx.createBiquadFilter();
      peak.type = "peaking";
      peak.frequency.value = 1200;
      peak.Q.value = 5;
      peak.gain.value = 11;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 3200;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.8, time + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc.connect(peak).connect(lp).connect(gain).connect(dest);
      osc.start(time);
      osc.stop(time + dur + 0.05);
      return;
    }

    const dur = Math.min(durationSeconds, flavor === "muted" ? 0.3 : 0.5);

    // A brief breath "chiff" of noise right at the attack - the airy
    // consonant-like transient a real brass/reed embouchure produces
    // before the tone settles, missing from a bare oscillator attack.
    const chiff = ctx.createBufferSource();
    chiff.buffer = this.makeNoiseBuffer(0.02);
    const chiffFilter = ctx.createBiquadFilter();
    chiffFilter.type = "bandpass";
    chiffFilter.frequency.value = flavor === "sax" ? 1600 : 2200;
    const chiffGain = ctx.createGain();
    chiffGain.gain.setValueAtTime(vel * 0.2, time);
    chiffGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
    chiff.connect(chiffFilter).connect(chiffGain).connect(dest);
    chiff.start(time);
    chiff.stop(time + 0.025);

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, time);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = flavor === "soft" ? 1200 : flavor === "muted" ? 900 : flavor === "sax" ? 1400 : 1800;
    bp.Q.value = flavor === "muted" ? 3 : flavor === "sax" ? 4.5 : 1.2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(vel, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(bp).connect(gain).connect(dest);
    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  playOrganVoice(time, freq, durationSeconds, vel, flavor) {
    if (this.playSampleFlavor("organ", flavor, time, vel, freq, durationSeconds)) return;
    const ctx = this.ctx;
    const dest = this.dest("organ");

    // A tonewheel organ is additive by construction: nine drawbars, each one
    // a fixed harmonic of the note, each pulled out to a level 0-8. So a new
    // organ sound is literally a new set of nine numbers - which is what a
    // registration IS, and why organists write them down as digit strings.
    const DRAWBARS = {
      jazzorgan:  [8, 8, 8, 0, 0, 0, 0, 0, 0],   // 888000000, the Jimmy Smith
      fullorgan:  [8, 8, 8, 8, 8, 8, 8, 8, 8],   // everything out, gospel finale
      flute8:     [0, 0, 8, 0, 0, 0, 0, 0, 0],   // a single pure flute stop
      reedy:      [8, 0, 8, 0, 8, 0, 6, 0, 4],   // odd bars only, hollow and nasal
      bright16:   [8, 6, 8, 6, 4, 4, 2, 2, 6],   // bright, upper-work heavy
      // 888800000 - the rock registration: the Jimmy Smith setting with the
      // fourth bar added, which is what fills it out under a band.
      rockorgan:  [8, 8, 8, 8, 0, 0, 0, 0, 0],
      // 800808000 - the "percussion" sound: fundamental plus two spaced
      // upper bars and nothing between them, so it reads as bell-like.
      perc3:      [8, 0, 0, 8, 0, 8, 0, 0, 0],
      // 006876540 - a tapered registration, warm through the middle.
      mellowbars: [0, 0, 6, 8, 7, 6, 5, 4, 0],
      // 888000008 - the classic "gospel wail": the bottom three plus the
      // very top bar, which screams without being bright all the way down.
      wail:       [8, 8, 8, 0, 0, 0, 0, 0, 8],
      // 088000000 - no fundamental at all, so the pitch is implied by the
      // quint and the octave. Thin and nasal on purpose.
      quintonly:  [0, 8, 8, 0, 0, 0, 0, 0, 0],
      // 858528600 - a theatre-organ style tapered set with a dip in it.
      theatre:    [8, 5, 8, 5, 2, 8, 6, 0, 0],
    };
    if (DRAWBARS[flavor]) {
      // Own duration - this branch sits above the function's own `const dur`,
      // and reading a const before its initialiser throws rather than
      // yielding undefined.
      const dur = Math.min(durationSeconds, 2.2);
      const RATIOS = [0.5, 1.5, 1, 2, 3, 4, 5, 6, 8];   // sub, quint, unison, ...
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, time);
      g.gain.linearRampToValueAtTime(vel * 0.32, time + 0.012);
      g.gain.setValueAtTime(vel * 0.32, time + Math.max(0.02, dur - 0.05));
      g.gain.exponentialRampToValueAtTime(0.001, time + dur);
      g.connect(dest);
      DRAWBARS[flavor].forEach((level, i) => {
        if (!level) return;
        const f = freq * RATIOS[i];
        if (f > 14000) return;
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(f, time);
        const og = ctx.createGain();
        og.gain.value = (level / 8) * (1 / (1 + i * 0.35));
        o.connect(og).connect(g);
        o.start(time); o.stop(time + dur + 0.06);
      });
      return;
    }

    if (flavor === "accordion" || flavor === "harmonium") {
      // Both are free-reed instruments: air is pushed past a metal tongue
      // that vibrates at its own fixed pitch. Two consequences define the
      // sound. First, a free reed produces a bright, buzzy, odd-harmonic-
      // rich waveform much closer to a square than to a sine. Second, an
      // accordion has multiple reed banks per note tuned slightly apart
      // ("musette" / celeste tuning) and the beating between them IS the
      // instrument's voice - this is the same detuned-pair principle a
      // tremolo harmonica uses. A harmonium has no musette detune and is
      // pumped by a bellows the player works by hand, so it breathes.
      const dur = Math.max(durationSeconds, 0.35);
      const isAccordion = flavor === "accordion";
      const gain = ctx.createGain();
      // Bellows: pressure builds, it does not switch on.
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.55, time + (isAccordion ? 0.05 : 0.13));
      gain.gain.setValueAtTime(vel * 0.55, time + Math.max(0.15, dur - 0.1));
      gain.gain.linearRampToValueAtTime(0.0001, time + dur + (isAccordion ? 0.04 : 0.12));
      const reedTone = ctx.createBiquadFilter();
      reedTone.type = "peaking";
      reedTone.frequency.value = 1500;
      reedTone.Q.value = 0.9;
      reedTone.gain.value = 5;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 5200;
      gain.connect(reedTone).connect(lp).connect(dest);
      // The reed banks. Musette detune on the accordion; the harmonium
      // gets a 16'/8'/4' style stack instead, no detune.
      const banks = isAccordion
        ? [[1, 0, 0.5], [1, 14, 0.42], [1, -13, 0.42], [2, 0, 0.18]]
        : [[0.5, 0, 0.35], [1, 0, 0.55], [2, 0, 0.22]];
      for (const [ratio, detune, lvl] of banks) {
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.value = freq * ratio;
        osc.detune.value = detune;
        const g = ctx.createGain();
        g.gain.value = lvl;
        osc.connect(g).connect(gain);
        osc.start(time);
        osc.stop(time + dur + 0.25);
      }
      // Air rushing past the reeds - quiet, but its absence is why
      // synthesised accordions sound like organs.
      const air = ctx.createBufferSource();
      air.buffer = this.makeNoiseBuffer(Math.min(dur + 0.2, 2));
      const airBp = ctx.createBiquadFilter();
      airBp.type = "bandpass";
      airBp.frequency.value = 2600;
      airBp.Q.value = 0.8;
      const airGain = ctx.createGain();
      airGain.gain.setValueAtTime(0.0001, time);
      airGain.gain.linearRampToValueAtTime(vel * 0.05, time + 0.06);
      airGain.gain.linearRampToValueAtTime(0.0001, time + dur);
      air.connect(airBp).connect(airGain).connect(dest);
      air.start(time);
      air.stop(time + dur + 0.1);
      return;
    }

    if (flavor === "farfisa") {
      // A Farfisa is a transistor combo organ, not a tonewheel one: the
      // tone is generated by square-wave dividers with no sine content at
      // all, which is why it sounds thin, reedy and nasal next to a
      // Hammond - and exactly why 60s garage and ska records used it.
      const dur2 = Math.max(durationSeconds, 0.3);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.5, time + 0.008);
      gain.gain.setValueAtTime(vel * 0.5, time + Math.max(0.05, dur2 - 0.05));
      gain.gain.linearRampToValueAtTime(0.0001, time + dur2 + 0.02);
      const nasal = ctx.createBiquadFilter();
      nasal.type = "peaking";
      nasal.frequency.value = 2200;
      nasal.Q.value = 1.6;
      nasal.gain.value = 9;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 300;   // no low-end weight at all
      gain.connect(nasal).connect(hp).connect(dest);
      for (const [ratio, lvl] of [[1, 0.55], [2, 0.35], [4, 0.14]]) {
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.value = freq * ratio;
        const g = ctx.createGain();
        g.gain.value = lvl;
        osc.connect(g).connect(gain);
        osc.start(time);
        osc.stop(time + dur2 + 0.1);
      }
      return;
    }

    if (flavor === "m1organ") {
      // The Korg M1's "Organ 2" preset is, by common consensus, the
      // original house organ - the sound of Robin S's "Show Me Love" and
      // most of what "deep house organ" means. It is not a Hammond
      // emulation: it is a bright digital stack with a hard attack, a
      // fast percussive click on top, and very little of the drawbar
      // organ's warmth, which is precisely why it cuts through a club mix.
      const dur3 = Math.max(durationSeconds, 0.25);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.62, time + 0.006);
      gain.gain.exponentialRampToValueAtTime(vel * 0.42, time + 0.12);
      gain.gain.setValueAtTime(vel * 0.42, time + Math.max(0.13, dur3 - 0.04));
      gain.gain.linearRampToValueAtTime(0.0001, time + dur3 + 0.03);
      const shine = ctx.createBiquadFilter();
      shine.type = "peaking";
      shine.frequency.value = 3400;
      shine.Q.value = 0.9;
      shine.gain.value = 6;
      gain.connect(shine).connect(dest);
      for (const [ratio, lvl] of [[1, 0.6], [2, 0.4], [3, 0.18], [4, 0.14], [6, 0.08]]) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq * ratio;
        const g = ctx.createGain();
        g.gain.value = lvl;
        osc.connect(g).connect(gain);
        osc.start(time);
        osc.stop(time + dur3 + 0.1);
      }
      // The percussive digital click on the attack.
      const click = ctx.createBufferSource();
      click.buffer = this.makeNoiseBuffer(0.012);
      const chp = ctx.createBiquadFilter();
      chp.type = "highpass";
      chp.frequency.value = 4000;
      const cg = ctx.createGain();
      cg.gain.setValueAtTime(vel * 0.18, time);
      cg.gain.exponentialRampToValueAtTime(0.001, time + 0.012);
      click.connect(chp).connect(cg).connect(dest);
      click.start(time);
      click.stop(time + 0.015);
      return;
    }

    const attack = flavor === "church" ? 0.09 : 0.015;
    const dur = flavor === "church" ? Math.max(durationSeconds, 1.4) : Math.max(durationSeconds, 0.3);

    // Drawbar-organ approximation: stack sine partials at the classic
    // fundamental / octave / octave+fifth ratios and sum them.
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(vel, time + attack);
    gain.gain.setValueAtTime(vel, time + Math.max(attack, dur - 0.15));
    gain.gain.linearRampToValueAtTime(0.0001, time + dur);

    let node = gain;
    if (flavor === "gospel") {
      const shaper = ctx.createWaveShaper();
      shaper.curve = this.makeDistortionCurve(8);
      gain.connect(shaper);
      node = shaper;
    }
    node.connect(dest);

    const partials = [
      { ratio: 1, level: 1 },
      { ratio: 2, level: 0.6 },
      { ratio: 3, level: 0.35 },
      { ratio: 4, level: 0.2 },
    ];
    for (const p of partials) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq * p.ratio, time);
      const pGain = ctx.createGain();
      pGain.gain.value = p.level;
      osc.connect(pGain).connect(gain);
      osc.start(time);
      osc.stop(time + dur + 0.1);
    }

    if (flavor === "gospel") {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 6;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = vel * 0.15;
      lfo.connect(lfoGain).connect(gain.gain);
      lfo.start(time);
      lfo.stop(time + dur + 0.1);
    }

    if (flavor === "combo") {
      // 60s combo organ (Vox/Farfisa style): a fast percussive click on
      // top of the sustained tone, plus a shallow pitch vibrato.
      const click = ctx.createBufferSource();
      click.buffer = this.makeNoiseBuffer(0.02);
      const clickHp = ctx.createBiquadFilter();
      clickHp.type = "highpass";
      clickHp.frequency.value = 3500;
      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(vel * 0.3, time);
      clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
      click.connect(clickHp).connect(clickGain).connect(dest);
      click.start(time);
      click.stop(time + 0.025);

      const vibrato = ctx.createOscillator();
      vibrato.frequency.value = 6.5;
      const vibratoGain = ctx.createGain();
      vibratoGain.gain.value = vel * 0.08;
      vibrato.connect(vibratoGain).connect(gain.gain);
      vibrato.start(time);
      vibrato.stop(time + dur + 0.1);
    }
  }

  playVocalVoice(time, freq, durationSeconds, vel, flavor) {
    if (this.playSampleFlavor("vocal", flavor, time, vel, freq, durationSeconds)) return;
    const ctx = this.ctx;
    const dest = this.dest("vocal");
    const dur = Math.min(durationSeconds, 0.6);

    // A sung vowel is defined by its first three formants. These are the
    // standard measured values for each vowel, which is why swapping them
    // genuinely changes the word being sung rather than just the tone.
    const VOWELS = {
      eee: [270, 2290, 3010],
      ohh: [500, 700, 2400],
      mmm: [280, 1150, 2300],
      // Was an exact copy of "ohh" - same three formants, so the two kits
      // were literally the same sound. /o/ as in "boat" is a closer, rounder
      // vowel than /aw/ as in "thought"; these are the measured values for
      // each, which is what makes them different words rather than two names.
      aww: [570, 840, 2410],
      yeah: [660, 1720, 2410],
      // More of the vowel space, measured values throughout. Each of these is
      // a different word being sung, not a different filter setting.
      ih:   [400, 1920, 2560],   // "bit"
      uh:   [640, 1190, 2390],   // "but"
      er:   [490, 1350, 1690],   // "bird" - the low third formant is the r
      oo:   [300, 870, 2240],    // "boot"
      aa:   [730, 1090, 2440],   // "father"
      // "bait". This one gives the long-standing "ay" kit a real vowel;
      // it had no entry here at all and was falling through to the default.
      ay:   [530, 1840, 2480],
    };
    if (VOWELS[flavor]) {
      const dur = Math.min(durationSeconds, 1.6);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, time);
      g.gain.linearRampToValueAtTime(vel * 0.5, time + 0.05);
      g.gain.setValueAtTime(vel * 0.5, time + Math.max(0.06, dur - 0.12));
      g.gain.exponentialRampToValueAtTime(0.001, time + dur);
      g.connect(dest);
      // A little vibrato, because a held sung note without any is instantly
      // recognisable as a machine.
      const vib = ctx.createOscillator();
      vib.frequency.value = 5.2;
      const vibAmt = ctx.createGain();
      vibAmt.gain.value = freq * 0.008;
      vib.connect(vibAmt);
      vib.start(time); vib.stop(time + dur + 0.05);
      VOWELS[flavor].forEach((fc, i) => {
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = fc;
        bp.Q.value = 9 + i * 3;
        const bg = ctx.createGain();
        bg.gain.value = [1, 0.5, 0.22][i];
        bp.connect(bg).connect(g);
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(freq, time);
        vibAmt.connect(o.frequency);
        o.connect(bp);
        o.start(time); o.stop(time + dur + 0.05);
      });
      return;
    }

    if (flavor === "vocoder") {
      // A real vocoder imposes a filter bank derived from a spoken
      // "modulator" signal onto a synthesized "carrier" tone - without an
      // actual speech input to analyze, the classic synthesized vocoder
      // hit (Herbie Hancock, Zapp, Daft Punk-adjacent) is approximated by
      // running a buzzy square-wave carrier (harmonically richer and more
      // mechanical than the vocal instrument's sawtooth) through a coarser
      // bank of more, narrower fixed-frequency bandpass bands than the
      // formant synthesis below uses - and, like Auto Lead, deliberately
      // no vibrato at all, which is exactly what reads as "talking
      // machine" rather than "sung."
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, time);
      const envelope = ctx.createGain();
      envelope.gain.setValueAtTime(0.0001, time);
      envelope.gain.linearRampToValueAtTime(vel * 0.8, time + 0.012);
      envelope.gain.exponentialRampToValueAtTime(0.001, time + dur);
      envelope.connect(dest);
      for (const freqCenter of [280, 600, 1100, 1900, 2900, 4200]) {
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = freqCenter;
        bp.Q.value = 18;
        const g = ctx.createGain();
        g.gain.value = 1 / 6;
        osc.connect(bp).connect(g).connect(envelope);
      }
      osc.start(time);
      osc.stop(time + dur + 0.05);
      return;
    }

    // Formant synthesis: a harmonically-rich source through a few parallel
    // bandpass filters tuned to vowel formant frequencies approximates a
    // sung vowel far better than a single filtered oscillator.
    const formants =
      flavor === "ahh" ? [700, 1220, 2600] :
      flavor === "ay" ? [530, 1840, 2480] :
      flavor === "oh" ? [450, 800, 2830] :
      flavor === "choir" ? [400, 1000, 2450] :
      [300, 870, 2240];
    const voiceCount = flavor === "choir" ? 3 : 1;

    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.linearRampToValueAtTime(vel, time + 0.02);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + dur);
    envelope.connect(dest);

    // Vocal stacking. A solo synthesized vowel sounds thin because real
    // records almost never use one: a lead is doubled, then stacked with
    // harmony parts and often an octave. Adding a quiet doubled voice
    // (slightly detuned and delayed, the way a second take differs) and
    // an octave-up whisper is what turns one voice into a section.
    if (voiceCount === 1) {
      const dbl = ctx.createOscillator();
      dbl.type = "sawtooth";
      dbl.frequency.setValueAtTime(freq * 1.006, time + 0.008);
      const dblEnv = ctx.createGain();
      dblEnv.gain.setValueAtTime(0.0001, time);
      dblEnv.gain.linearRampToValueAtTime(vel * 0.4, time + 0.03);
      dblEnv.gain.exponentialRampToValueAtTime(0.001, time + dur);
      dblEnv.connect(dest);
      for (const fc of formants) {
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = fc * 1.02;
        bp.Q.value = 11;
        const g = ctx.createGain();
        g.gain.value = 0.3;
        dbl.connect(bp).connect(g).connect(dblEnv);
      }
      dbl.start(time);
      dbl.stop(time + dur + 0.05);
    }

    const levels = [1, 0.55, 0.3];
    for (let v = 0; v < voiceCount; v++) {
      const detune = voiceCount === 1 ? 0 : (v / (voiceCount - 1) - 0.5) * 0.016;
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq * (1 + detune), time);

      const vibrato = ctx.createOscillator();
      vibrato.frequency.value = 5.5 + v * 0.3;
      const vibratoGain = ctx.createGain();
      vibratoGain.gain.value = freq * 0.01;
      vibrato.connect(vibratoGain).connect(osc.frequency);

      formants.forEach((freqCenter, i) => {
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = freqCenter;
        bp.Q.value = 12;
        const g = ctx.createGain();
        g.gain.value = levels[i] / voiceCount;
        osc.connect(bp).connect(g).connect(envelope);
      });

      osc.start(time);
      osc.stop(time + dur + 0.05);
      vibrato.start(time);
      vibrato.stop(time + dur + 0.05);
    }
  }

  // ---- Melodic voices ----

  playKalimbaVoice(time, freq, durationSeconds, vel, flavor) {
    if (this.playSampleFlavor("kalimba", flavor, time, vel, freq, durationSeconds)) return;
    const ctx = this.ctx;
    const dest = this.dest("kalimba");

    const TINES = {
      thumbpiano: { gain: 0.5, partials: [[1, 1, 1.2], [3.9, 0.22, 0.4], [8.8, 0.07, 0.18]],
        strike: { freq: 2400, len: 0.012, level: 0.22 } },
      mbira:      { gain: 0.48, partials: [[1, 1, 1.6], [2.8, 0.3, 0.6], [5.1, 0.12, 0.3], [7.9, 0.05, 0.15]],
        strike: { freq: 1800, len: 0.014, level: 0.26 } },
      handpan:    { gain: 0.6, partials: [[1, 1, 2.2], [2, 0.45, 1.4], [3, 0.2, 0.8]],
        strike: { freq: 700, len: 0.02, level: 0.18 } },
      gamelan:    { gain: 0.52, partials: [[1, 1, 2.0], [2.37, 0.6, 1.2], [3.61, 0.3, 0.7], [5.2, 0.14, 0.35]],
        strike: { freq: 1500, len: 0.016, level: 0.3 } },
      musicboxhi: { gain: 0.34, partials: [[1, 1, 0.9], [4.2, 0.25, 0.4], [9.1, 0.09, 0.16]],
        strike: { freq: 5200, len: 0.007, level: 0.2, type: "highpass" } },
      // A sansula: a kalimba mounted on a drum head, so the shell resonates
      // under every note and gives it a soft bloom the bare tines lack.
      sansula:    { gain: 0.55, partials: [[1, 1, 2.0], [2, 0.3, 1.2], [3.9, 0.16, 0.5], [8.6, 0.05, 0.2]],
        strike: { freq: 1200, len: 0.018, level: 0.16 } },
      // A karimba - the small, high, bright board lamellophone.
      karimba:    { gain: 0.42, partials: [[1, 1, 0.9], [4.1, 0.34, 0.35], [9.3, 0.12, 0.14]],
        strike: { freq: 3400, len: 0.009, level: 0.3 } },
      // A likembe, whose buzzing bottlecaps are the point: a noisy rattle
      // rides on top of every note.
      likembe:    { gain: 0.5, partials: [[1, 1, 1.3], [3.8, 0.28, 0.45], [7.2, 0.14, 0.25]],
        strike: { freq: 2000, len: 0.05, level: 0.34, q: 0.6 } },
      // A celeste: felt hammers on steel bars over resonators. Softer than a
      // glockenspiel and much rounder than a music box.
      celestetine:{ gain: 0.34, partials: [[1, 1, 1.6], [4.02, 0.28, 0.8], [8.1, 0.09, 0.3]],
        strike: { freq: 2600, len: 0.01, level: 0.12 } },
      // A toy piano: short, hard, slightly out of tune with itself.
      toybox:     { gain: 0.4, partials: [[1, 1, 0.7], [3.6, 0.4, 0.28], [7.1, 0.2, 0.12]],
        strike: { freq: 4200, len: 0.008, level: 0.36, type: "highpass" } },
      // A small tuned bell, for a bright counter-line over a dark beat.
      tinebell:   { gain: 0.32, partials: [[1, 1, 2.2], [2.76, 0.5, 1.3], [5.4, 0.22, 0.6], [8.9, 0.08, 0.28]],
        strike: { freq: 6000, len: 0.008, level: 0.26, type: "highpass" } },
    };
    if (TINES[flavor]) { this.playStruckVoice(time, freq, vel, dest, TINES[flavor]); return; }

    if (flavor === "hangdrum") {
      // A hang (handpan) is a steel shell with tuned dimples, and each
      // note field is deliberately tuned so its overtones are the OCTAVE
      // and the TWELFTH above - exact harmonic ratios, unlike a bell or a
      // gong. That harmonicity is why a handpan sounds serene rather than
      // clangy, and the shell's Helmholtz cavity adds a soft low bloom.
      const dur = Math.min(Math.max(durationSeconds, 1.2), 2.6);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      gain.connect(dest);
      for (const [ratio, lvl] of [[1, 1], [2, 0.5], [3, 0.32], [4, 0.12]]) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq * ratio;
        const g = ctx.createGain();
        g.gain.setValueAtTime(lvl, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + dur / (ratio * 0.35 + 0.7));
        osc.connect(g).connect(gain);
        osc.start(time);
        osc.stop(time + dur + 0.15);
      }
      // Fingertip on steel: soft, low, no snap.
      const touch = ctx.createBufferSource();
      touch.buffer = this.makeNoiseBuffer(0.02);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1800;
      const tg = ctx.createGain();
      tg.gain.setValueAtTime(vel * 0.2, time);
      tg.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
      touch.connect(lp).connect(tg).connect(dest);
      touch.start(time);
      touch.stop(time + 0.025);
      return;
    }

    if (flavor === "balafon") {
      // A West African gourd-resonated xylophone. Its signature is not
      // the bar at all - it is the RESONATOR: each gourd has a hole
      // covered with a thin membrane (traditionally spider-egg sac) that
      // buzzes when the note sounds. That deliberate buzz is considered
      // essential to the instrument's voice, not a defect.
      const dur = Math.min(durationSeconds, 0.6);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 0.85, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      gain.connect(dest);
      for (const [ratio, lvl] of [[1, 1], [4, 0.3], [9.2, 0.1]]) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq * ratio;
        const g = ctx.createGain();
        g.gain.setValueAtTime(lvl, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + dur / (ratio * 0.3 + 0.8));
        osc.connect(g).connect(gain);
        osc.start(time);
        osc.stop(time + dur + 0.1);
      }
      // The membrane buzz - band-limited noise gated by the note itself.
      const buzz = ctx.createBufferSource();
      buzz.buffer = this.makeNoiseBuffer(Math.min(dur, 0.5));
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = Math.min(6000, freq * 6);
      bp.Q.value = 2.5;
      const bg = ctx.createGain();
      bg.gain.setValueAtTime(vel * 0.22, time);
      bg.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.7);
      buzz.connect(bp).connect(bg).connect(dest);
      buzz.start(time);
      buzz.stop(time + dur);
      return;
    }

    if (flavor === "kora") {
      // A 21-string West African harp-lute with a calabash body and a
      // skin soundboard. Plucked with thumbs and forefingers only, it is
      // closer to a harp than to a guitar: a clean, ringing, long-
      // sustaining nylon string over a drum-like resonator.
      const dur = Math.min(Math.max(durationSeconds, 0.9), 2.2);
      const skin = ctx.createBiquadFilter();
      skin.type = "peaking";
      skin.frequency.value = 320;
      skin.Q.value = 0.9;
      skin.gain.value = 5;
      skin.connect(dest);
      this.pluckString(time, freq, dur, vel * 0.85, skin,
        { damp: 0.24, feedback: 0.9925, pluckNoise: 0.003, brightness: 1.1, sustain: 2 });
      return;
    }
    const dur = Math.min(durationSeconds, flavor === "musicbox" ? 0.9 : flavor === "steeldrum" ? 1.1 : flavor === "glock" ? 1.6 : 0.6);

    // A short noise "pluck" transient for the thumb-against-tine attack -
    // for the glockenspiel it's a harder, brighter metal-mallet strike.
    const click = ctx.createBufferSource();
    click.buffer = this.makeNoiseBuffer(0.015);
    const clickFilter = ctx.createBiquadFilter();
    clickFilter.type = "highpass";
    clickFilter.frequency.value = flavor === "glock" ? 6000 : 3000;
    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(vel * (flavor === "glock" ? 0.45 : 0.3), time);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.015);
    click.connect(clickFilter).connect(clickGain).connect(dest);
    click.start(time);
    click.stop(time + 0.02);

    const partials =
      flavor === "musicbox"
        ? [{ ratio: 1, level: 1 }, { ratio: 2.76, level: 0.35 }, { ratio: 5.4, level: 0.15 }]
        : flavor === "steeldrum"
        ? [{ ratio: 1, level: 1 }, { ratio: 2.01, level: 0.5 }, { ratio: 3.01, level: 0.3 }, { ratio: 4.16, level: 0.18 }]
        // Glockenspiel: struck metal bars, sounding an octave up with a
        // very strong inharmonic partial near the 3rd mode - that high
        // sparkle over a long ring is why it cuts through a full mix in
        // pop/orchestral arrangements ("Sgt. Pepper", Springsteen's
        // "Born to Run") without adding any weight.
        : flavor === "glock"
        ? [{ ratio: 2, level: 1 }, { ratio: 5.4, level: 0.45 }, { ratio: 8.9, level: 0.2 }]
        : [{ ratio: 1, level: 1 }, { ratio: 3.4, level: 0.4 }];

    for (const p of partials) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq * p.ratio, time);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * p.level, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur * (p.ratio === 1 ? 1 : 0.5));
      osc.connect(gain).connect(dest);
      osc.start(time);
      osc.stop(time + dur + 0.1);
    }
  }

  // A real mono melodic hook instrument for the "Auto-Tune hook" modern
  // rap/trap production leans on (Future, early Kanye "808s & Heartbreak",
  // Travis Scott), distinct from the existing "vocal" chord instrument's
  // sung-vowel chops. The thing that actually reads as "hard-tuned" rather
  // than "sung" is an absence: a real voice always has some natural pitch
  // wobble and glide, and hard pitch-correction strips that out entirely,
  // leaving a flat, static, faintly robotic tone - so unlike every other
  // vocal-ish voice in this engine, this one deliberately has NO vibrato
  // LFO at all. What replaces it is a tight unison detune (the doubled/
  // stacked-vocal layering hard-tune hooks are almost always mixed with)
  // and a fast, percussive attack so it hits like a hook, not a hum.
  playAutoLeadVoice(time, freq, durationSeconds, vel, flavor) {
    if (this.playSampleFlavor("autolead", flavor, time, vel, freq, durationSeconds)) return;
    const ctx = this.ctx;
    const dest = this.dest("autolead");
    const dur = Math.min(durationSeconds, 0.55);

    // Different vowel shapes. Auto-tuned singing reads as a vowel plus a
    // pitch, and the vowel is entirely in where the formants sit - so the
    // kits here are a table of real vowel formant frequencies rather than a
    // set of filter tweaks. F1/F2/F3 values follow the standard measured
    // positions for each vowel; the rest of each row is how the voice is
    // driven, which is what separates a soft croon from a full-throated wail.
    //
    //   q       formant sharpness. Higher reads as more nasal and synthetic.
    //   det     chorus width in cents between the two saw layers.
    //   snap    how fast the pitch locks onto the note. This is the Auto-Tune
    //           artefact itself: at 0 the pitch simply arrives, and the
    //           shorter the ramp the harder the correction sounds.
    //   drive   saturation on the way out.
    //   sub     level of an octave-below sine, which thickens a low hook.
    //   air     level of a breath layer over the top.
    const AUTOLEAD = {
      moody:   { f: [420, 1000, 2350], lv: [1, 0.5, 0.28], q: 9,  det: 7,  snap: 0.03,  drive: 0,   sub: 0,    air: 0 },
      bright:  { f: [720, 1720, 3100], lv: [1, 0.62, 0.4], q: 14, det: 7,  snap: 0.02,  drive: 0,   sub: 0,    air: 0.05 },
      wide:    { f: [500, 1350, 2700], lv: [1, 0.5, 0.28], q: 14, det: 22, snap: 0.03,  drive: 0,   sub: 0.18, air: 0.04 },
      gritty:  { f: [600, 1450, 2800], lv: [1, 0.5, 0.28], q: 14, det: 9,  snap: 0.015, drive: 12,  sub: 0.1,  air: 0 },
      hard:    { f: [660, 1580, 2900], lv: [1, 0.58, 0.34], q: 16, det: 5, snap: 0.008, drive: 20,  sub: 0.14, air: 0 },
      // "oo" - the closed, dark croon that sits under a busy trap mix.
      soft:    { f: [330, 800, 2200],  lv: [1, 0.4, 0.18], q: 8,  det: 12, snap: 0.05,  drive: 0,   sub: 0.22, air: 0.08 },
      // "ee" - forward and nasal, the sound of a hook pushed up in register.
      nasal:   { f: [280, 2250, 2900], lv: [1, 0.7, 0.45], q: 18, det: 6,  snap: 0.012, drive: 6,   sub: 0,    air: 0.03 },
      // "aa" fully open, wide and long: the big melodic hook.
      wail:    { f: [800, 1200, 2600], lv: [1, 0.66, 0.36], q: 11, det: 26, snap: 0.04, drive: 4,   sub: 0.12, air: 0.1 },
      // Almost no ramp at all, high formant Q: the deliberately robotic
      // setting, where the correction IS the effect.
      robotic: { f: [540, 1700, 2600], lv: [1, 0.75, 0.5], q: 24, det: 0,  snap: 0.001, drive: 10,  sub: 0,    air: 0 },
      // Breath over tone, barely driven - the whispered ad-lib.
      airy:    { f: [480, 1150, 2500], lv: [1, 0.42, 0.3],  q: 7,  det: 16, snap: 0.06, drive: 0,   sub: 0,    air: 0.3 },
      // Low and thick, for a hook doubled down an octave.
      deep:    { f: [360, 900, 2100],  lv: [1, 0.45, 0.2],  q: 10, det: 10, snap: 0.03, drive: 5,   sub: 0.34, air: 0 },
      // The full modern preset: hard snap, wide chorus, saturated.
      modern:  { f: [620, 1500, 2850], lv: [1, 0.6, 0.38],  q: 15, det: 18, snap: 0.006, drive: 15, sub: 0.2,  air: 0.06 },
    };
    const p = AUTOLEAD[flavor] || AUTOLEAD.moody;

    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.linearRampToValueAtTime(vel, time + 0.008);
    envelope.gain.setValueAtTime(vel, time + Math.max(0.008, dur - 0.09));
    envelope.gain.exponentialRampToValueAtTime(0.001, time + dur);

    let out = envelope;
    if (p.drive > 0) {
      const shaper = ctx.createWaveShaper();
      shaper.curve = this.makeDistortionCurve(p.drive);
      shaper.oversample = "2x";
      envelope.connect(shaper).connect(dest);
    } else {
      envelope.connect(dest);
    }

    // The pitch snap. A real Auto-Tune at maximum retune speed still takes a
    // few milliseconds to pull a note into place, and starting slightly flat
    // is what makes that audible instead of merely correct.
    const startF = freq * (p.snap > 0.002 ? 0.985 : 0.97);
    for (const cents of (p.det ? [-p.det, p.det] : [0])) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      const f = freq * Math.pow(2, cents / 1200);
      osc.frequency.setValueAtTime(startF * Math.pow(2, cents / 1200), time);
      osc.frequency.exponentialRampToValueAtTime(f, time + Math.max(0.001, p.snap));
      p.f.forEach((freqCenter, i) => {
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = freqCenter;
        bp.Q.value = p.q;
        const g = ctx.createGain();
        g.gain.value = (p.lv[i] / (p.det ? 2 : 1)) * 0.9;
        osc.connect(bp).connect(g).connect(envelope);
      });
      osc.start(time);
      osc.stop(time + dur + 0.05);
    }

    if (p.sub > 0) {
      const s = ctx.createOscillator();
      s.type = "sine";
      s.frequency.setValueAtTime(freq / 2, time);
      const g = ctx.createGain();
      g.gain.value = p.sub;
      s.connect(g).connect(envelope);
      s.start(time);
      s.stop(time + dur + 0.05);
    }
    if (p.air > 0) {
      const n = ctx.createBufferSource();
      n.buffer = this.makeNoiseBuffer(dur + 0.05);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = p.f[1] * 1.6;
      bp.Q.value = 1.2;
      const g = ctx.createGain();
      g.gain.value = p.air;
      n.connect(bp).connect(g).connect(envelope);
      n.start(time);
      n.stop(time + dur + 0.05);
    }
  }

  // A real mono solo-line instrument, not a chord-stab like the existing
  // Horn - saxophone melodies are played one note at a time, which is a
  // genuinely different musical role from a horn section hitting stabs.
  // Acoustically a sax's conical bore (versus the clarinet's cylindrical
  // bore) does NOT cancel out even harmonics, so it gets a full-spectrum
  // sawtooth like the brass flavors rather than the clarinet's square wave
  // - the things that actually make it read as "sax" instead of "trumpet"
  // are a continuous breath-noise layer under the tone (a reed hisses the
  // whole note, not just at the attack), a resonant body formant around
  // 950Hz, and a real player's idiomatic pitch scoop up into a note.
  playSaxVoice(time, freq, durationSeconds, vel, flavor) {
    if (this.playSampleFlavor("sax", flavor, time, vel, freq, durationSeconds)) return;
    const ctx = this.ctx;
    const dest = this.dest("sax");

    // The saxophones differ by BORE SIZE, which sets both the register and
    // how much of the sound is upper harmonics versus fundamental. A soprano
    // is bright and reedy; a bass sax is almost all fundamental and air.
    const HORNS = {
      tenor:   { oct: 0.5, bright: 0.62, breath: 0.3, vib: 4.8 },
      soprano: { oct: 2, bright: 0.85, breath: 0.22, vib: 5.6 },
      basssax: { oct: 0.25, bright: 0.35, breath: 0.42, vib: 4.0 },
      subtone: { oct: 0.5, bright: 0.28, breath: 0.55, vib: 3.6 },
      // Overblown to the point of buzzing: the growl a player gets by
      // humming through the horn while playing it. Far more upper harmonics
      // and far more air than a clean tone.
      growl:   { oct: 0.5, bright: 0.95, breath: 0.62, vib: 6.2 },
      // The altissimo register - above the horn's normal range, thin and
      // piercing, which is what a solo climbs to at its peak.
      altissimo:{ oct: 2, bright: 0.92, breath: 0.3, vib: 6.6 },
      // Played very softly and close: almost no harmonics, mostly breath.
      // The late-night ballad sound.
      smoky:   { oct: 0.5, bright: 0.2, breath: 0.7, vib: 3.2 },
      // A bright, forward, pushed alto - the pop-record sax hook.
      cutting: { oct: 1, bright: 0.88, breath: 0.24, vib: 5.8 },
      // Wide slow vibrato and a mid-heavy body: the vintage swing tone.
      vintage: { oct: 0.5, bright: 0.5, breath: 0.34, vib: 3.0 },
      // A C-melody sax, between alto and tenor, mellow and centred.
      cmelody: { oct: 0.75, bright: 0.45, breath: 0.3, vib: 4.4 },
    };
    if (HORNS[flavor]) {
      const h = HORNS[flavor];
      const f0 = freq * h.oct;
      // Its own duration: this branch sits above the function's `const dur`,
      // and reading a const before its initialiser is a TemporalDeadZone
      // error rather than an undefined - it throws.
      const dur = Math.min(durationSeconds, 1.4);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, time);
      g.gain.linearRampToValueAtTime(vel * 0.42, time + 0.045);
      g.gain.setValueAtTime(vel * 0.42, time + Math.max(0.06, dur - 0.1));
      g.gain.exponentialRampToValueAtTime(0.001, time + dur);
      const body = ctx.createBiquadFilter();
      body.type = "lowpass";
      body.frequency.value = 700 + h.bright * 4200;
      body.Q.value = 1.4;
      body.connect(g).connect(dest);
      const vib = ctx.createOscillator();
      vib.frequency.value = h.vib;
      const vibAmt = ctx.createGain();
      vibAmt.gain.value = f0 * 0.006;
      vib.connect(vibAmt);
      vib.start(time); vib.stop(time + dur + 0.05);
      for (const [mult, lvl] of [[1, 1], [2, 0.5 * h.bright], [3, 0.34 * h.bright], [4, 0.18 * h.bright], [5, 0.1 * h.bright]]) {
        if (f0 * mult > 12000) break;
        const o = ctx.createOscillator();
        o.type = mult === 1 ? "sawtooth" : "sine";
        o.frequency.setValueAtTime(f0 * mult, time);
        vibAmt.connect(o.frequency);
        const og = ctx.createGain();
        og.gain.value = lvl;
        o.connect(og).connect(body);
        o.start(time); o.stop(time + dur + 0.05);
      }
      // Breath noise is what makes a reed sound blown rather than bowed.
      const air = ctx.createBufferSource();
      air.buffer = this.makeNoiseBuffer(Math.max(0.05, dur));
      const ahp = ctx.createBiquadFilter();
      ahp.type = "highpass"; ahp.frequency.value = 1600;
      const ag = ctx.createGain();
      ag.gain.setValueAtTime(vel * h.breath * 0.16, time);
      ag.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      air.connect(ahp).connect(ag).connect(dest);
      air.start(time); air.stop(time + dur);
      return;
    }
    const breathy = flavor === "breathy";
    const dur = Math.min(durationSeconds, breathy ? 0.65 : 0.55);
    const attack = breathy ? 0.03 : 0.018;

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq * 0.89, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.05);

    // A saxophone is a conical bore with a single reed, and the size of
    // the cone is what separates the members of the family. The formant
    // peak - the resonance the body imposes on the reed's buzz - sits
    // lower on a bigger horn, and that formant is what the ear uses to
    // tell an alto from a baritone even when they play the same note.
    // Alto is bright and vocal; baritone is broad and throaty.
    const formantHz = flavor === "alto" ? 1250 : flavor === "bari" ? 620 : 950;
    const formant = ctx.createBiquadFilter();
    formant.type = "peaking";
    formant.frequency.value = formantHz;
    formant.Q.value = 2.2;
    formant.gain.value = flavor === "bari" ? 10 : 8;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = breathy ? 2600 : 3400;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(vel * 0.85, time + attack);
    gain.gain.setValueAtTime(vel * 0.85, time + Math.max(attack, dur - 0.1));
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(formant).connect(lp).connect(gain).connect(dest);
    osc.start(time);
    osc.stop(time + dur + 0.05);

    const breath = ctx.createBufferSource();
    breath.buffer = this.makeNoiseBuffer(dur + 0.05);
    const breathFilter = ctx.createBiquadFilter();
    breathFilter.type = "bandpass";
    breathFilter.frequency.value = 2200;
    breathFilter.Q.value = 0.8;
    const breathGain = ctx.createGain();
    breathGain.gain.setValueAtTime(0.0001, time);
    breathGain.gain.linearRampToValueAtTime(vel * (breathy ? 0.22 : 0.11), time + attack + 0.01);
    breathGain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    breath.connect(breathFilter).connect(breathGain).connect(dest);
    breath.start(time);
    breath.stop(time + dur + 0.05);
  }

  // ---- The woodwind family ------------------------------------------
  // Every instrument here is a tube with something vibrating at one end,
  // and ONE acoustic fact separates them into two camps:
  //
  //   * A CONICAL bore (saxophone, oboe, bassoon, English horn) supports
  //     the complete harmonic series - every integer multiple is present,
  //     which is why these instruments sound rich, reedy and full.
  //   * A CYLINDRICAL bore closed at one end (the clarinet) only supports
  //     the ODD harmonics. The even ones are physically absent. That
  //     missing half of the spectrum is exactly why a clarinet sounds
  //     hollow and woody next to an oboe, and why it over-blows to a
  //     twelfth instead of an octave.
  //
  // Flutes are open at both ends and edge-blown rather than reed-driven,
  // so they get the full series but with very weak upper partials and a
  // much louder proportion of breath noise - the air jet splitting on the
  // edge is a large part of what you actually hear.
  playWoodwindVoice(time, freq, durationSeconds, vel, flavor) {
    if (this.playSampleFlavor("woodwind", flavor, time, vel, freq, durationSeconds)) return;
    const ctx = this.ctx;
    const dest = this.dest("woodwind");

    // bore: "cyl" = odd harmonics only, "con" = full series, "edge" = flute
    // formant: the body resonance that identifies the instrument
    // breath: how much of the sound is air rather than tone
    const P = {
      flute:       { bore: "edge", oct: 1,   formant: 1900, breath: 0.42, vib: 5.0, attack: 0.055, bright: 0.30 },
      altoflute:   { bore: "edge", oct: 0.5, formant: 1100, breath: 0.5,  vib: 4.6, attack: 0.075, bright: 0.24 },
      recorder:    { bore: "edge", oct: 1,   formant: 2400, breath: 0.3,  vib: 0,   attack: 0.03,  bright: 0.22 },
      shakuhachi:  { bore: "edge", oct: 0.5, formant: 1400, breath: 0.85, vib: 4.2, attack: 0.09,  bright: 0.35 },
      bansuri:     { bore: "edge", oct: 1,   formant: 1600, breath: 0.55, vib: 5.6, attack: 0.06,  bright: 0.30 },
      clarinet:    { bore: "cyl",  oct: 0.5, formant: 1500, breath: 0.14, vib: 0,   attack: 0.04,  bright: 0.55 },
      bassclarinet:{ bore: "cyl",  oct: 0.25,formant: 700,  breath: 0.16, vib: 0,   attack: 0.055, bright: 0.5 },
      oboe:        { bore: "con",  oct: 1,   formant: 1450, breath: 0.12, vib: 5.4, attack: 0.03,  bright: 0.9 },
      englishhorn: { bore: "con",  oct: 0.5, formant: 1000, breath: 0.13, vib: 4.8, attack: 0.04,  bright: 0.8 },
      bassoon:     { bore: "con",  oct: 0.25,formant: 480,  breath: 0.15, vib: 4.4, attack: 0.05,  bright: 0.7 },
      sopranosax:  { bore: "con",  oct: 1,   formant: 1700, breath: 0.22, vib: 5.2, attack: 0.028, bright: 0.85 },
      // The duduk is an Armenian double-reed with an exceptionally large
      // reed for its bore, which is why it is so breathy, so dark, and
      // has almost no upper harmonics at all despite being a double reed.
      duduk:       { bore: "con",  oct: 0.5, formant: 800,  breath: 0.4,  vib: 4.0, attack: 0.07,  bright: 0.32 },

      // --- more of the flute family ----------------------------------------
      // Worth having a lot of: the hard genres are restricted to flutes and
      // dark end-blown winds, so this family is the only woodwind variety
      // trap, drill, rap and phonk can ever draw on. One flute for four
      // genres is how a signature sound becomes a rut.
      // A piccolo is a flute an octave up with almost no body resonance,
      // which is why it cuts through anything.
      piccolo:     { bore: "edge", oct: 2,   formant: 3200, breath: 0.34, vib: 5.4, attack: 0.035, bright: 0.4 },
      // Stopped pipes with no fingerholes: very pure, very breathy, and the
      // note has to be re-attacked every time.
      panflute:    { bore: "edge", oct: 1,   formant: 1750, breath: 0.62, vib: 3.4, attack: 0.045, bright: 0.2 },
      // A vessel flute. Almost no overtones at all - close to a sine with
      // breath on it, which is exactly why it sounds so soft.
      ocarina:     { bore: "edge", oct: 1,   formant: 1250, breath: 0.36, vib: 4.2, attack: 0.05, bright: 0.12 },
      // A tin whistle: bright, hard-edged and pushed.
      tinwhistle:  { bore: "edge", oct: 2,   formant: 2800, breath: 0.28, vib: 4.8, attack: 0.025, bright: 0.42 },
      // The dizi's buzzing membrane over a side hole is its whole identity,
      // so it carries far more breath noise than its brightness suggests.
      dizi:        { bore: "edge", oct: 1,   formant: 2100, breath: 0.72, vib: 5.2, attack: 0.04, bright: 0.38 },
      // A Middle Eastern end-blown reed flute, played at an angle: the
      // breathiest instrument in this table by a distance.
      ney:         { bore: "edge", oct: 0.5, formant: 1150, breath: 0.95, vib: 4.4, attack: 0.1, bright: 0.28 },
      // A bass flute: low, wide and slow to speak.
      bassflute:   { bore: "edge", oct: 0.25, formant: 750, breath: 0.66, vib: 4.0, attack: 0.11, bright: 0.18 },
      // Overblown flute - pushed hard enough that the harmonics dominate.
      // The aggressive flute sound, for when the genre is not a pretty one.
      overblown:   { bore: "edge", oct: 1,   formant: 2300, breath: 0.8,  vib: 6.2, attack: 0.03, bright: 0.6 },
      // A wooden transverse flute: darker and woodier than the silver one.
      woodflute:   { bore: "edge", oct: 1,   formant: 1350, breath: 0.5,  vib: 4.4, attack: 0.065, bright: 0.2 },

      // --- two more reeds, for the genres that can take them ----------------
      // An alto flute's reed-instrument counterpart in register and mood.
      basset:      { bore: "cyl",  oct: 0.5, formant: 1150, breath: 0.16, vib: 3.6, attack: 0.05, bright: 0.45 },
      // A contrabassoon: the floor of the woodwind section.
      contrabassoon:{ bore: "con", oct: 0.125, formant: 320, breath: 0.18, vib: 3.8, attack: 0.07, bright: 0.6 },
    };
    const p = P[flavor] || P.flute;
    const f0 = freq * p.oct;
    const dur = Math.max(durationSeconds, 0.22);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(vel * 0.55, time + p.attack);
    gain.gain.setValueAtTime(vel * 0.55, time + Math.max(p.attack, dur * 0.78));
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur + 0.1);

    const formant = ctx.createBiquadFilter();
    formant.type = "peaking";
    formant.frequency.value = p.formant;
    formant.Q.value = 1.5;
    formant.gain.value = 8;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1200 + p.bright * 6000;
    gain.connect(formant).connect(lp).connect(dest);

    // Breath vibrato, delayed - a player does not start a note with
    // vibrato already running, it grows in as the note is sustained.
    let vibTarget = null;
    if (p.vib) {
      const vib = ctx.createOscillator();
      vib.frequency.value = p.vib;
      vibTarget = ctx.createGain();
      vibTarget.gain.setValueAtTime(0.0001, time);
      vibTarget.gain.linearRampToValueAtTime(f0 * 0.008, time + Math.min(0.3, dur * 0.5));
      vib.connect(vibTarget);
      vib.start(time);
      vib.stop(time + dur + 0.15);
    }

    // The harmonic series this bore actually supports.
    const partials = [];
    if (p.bore === "cyl") {
      // Odd harmonics only. The even ones are physically not there.
      for (const [n, lvl] of [[1, 1], [3, 0.42], [5, 0.2], [7, 0.09], [9, 0.04]]) partials.push([n, lvl]);
    } else if (p.bore === "con") {
      for (const [n, lvl] of [[1, 1], [2, 0.6], [3, 0.42], [4, 0.28], [5, 0.18], [6, 0.1], [7, 0.06]]) partials.push([n, lvl]);
    } else {
      // Edge-blown: full series but the upper partials fall away fast.
      for (const [n, lvl] of [[1, 1], [2, 0.22], [3, 0.09], [4, 0.04]]) partials.push([n, lvl]);
    }
    for (const [n, lvl] of partials) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f0 * n * 0.994, time);
      osc.frequency.linearRampToValueAtTime(f0 * n, time + p.attack * 1.5);
      if (vibTarget) {
        const scale = ctx.createGain();
        scale.gain.value = n;
        vibTarget.connect(scale).connect(osc.frequency);
      }
      const g = ctx.createGain();
      g.gain.value = lvl;
      osc.connect(g).connect(gain);
      osc.start(time);
      osc.stop(time + dur + 0.2);
    }

    // Breath. On a flute this is a major component of the sound, not a
    // decoration - leaving it out is most of why synthesised flutes
    // sound like sine waves.
    const air = ctx.createBufferSource();
    air.buffer = this.makeNoiseBuffer(Math.min(dur + 0.3, 2.5));
    const airBp = ctx.createBiquadFilter();
    airBp.type = "bandpass";
    airBp.frequency.value = Math.min(9000, f0 * 3);
    airBp.Q.value = 0.7;
    const airGain = ctx.createGain();
    airGain.gain.setValueAtTime(0.0001, time);
    airGain.gain.linearRampToValueAtTime(vel * 0.22 * p.breath, time + p.attack * 0.6);
    airGain.gain.linearRampToValueAtTime(vel * 0.1 * p.breath, time + dur * 0.7);
    airGain.gain.linearRampToValueAtTime(0.0001, time + dur + 0.08);
    air.connect(airBp).connect(airGain).connect(dest);
    air.start(time);
    air.stop(time + dur + 0.15);
  }

  // ---- Lead guitar --------------------------------------------------
  // A separate track from the rhythm guitar, because on real records they
  // are separate performances: rhythm sits in open position holding the
  // harmony, the lead plays single notes up the neck through a hotter
  // amp. What identifies a lead tone is sustain and expression, not
  // chords - so every flavor here is a single string plus a specific
  // amp/pedal treatment.
  playLeadGuitarVoice(time, freq, durationSeconds, vel, flavor) {
    if (this.playSampleFlavor("leadguitar", flavor, time, vel, freq, durationSeconds)) return;
    const ctx = this.ctx;
    const dest = this.dest("leadguitar");
    const dur = Math.max(Math.min(durationSeconds, 2.4), 0.25);

    if (flavor === "octave") {
      // The octave lead: the note doubled an octave below, the Wes
      // Montgomery / octave-pedal sound that makes a single-note line
      // read as a hook rather than as a solo.
      const cab = this.makeGuitarCab(dest, { bright: 0.9, body: 1.2, presence: 3 });
      this.addPickNoise(time, vel, cab, 0.8);
      this.pluckString(time, freq, dur, vel * 0.85, cab, { damp: 0.26, feedback: 0.99, pluckNoise: 0.008, brightness: 1.05, sustain: 1.3 });
      this.pluckString(time + 0.004, freq / 2, dur, vel * 0.6, cab, { damp: 0.3, feedback: 0.988, pluckNoise: 0.008, brightness: 0.85, sustain: 1.2 });
      return;
    }

    if (flavor === "cleantone") {
      const cab = this.makeGuitarCab(dest, { bright: 1.05, body: 1, presence: 2.5 });
      this.addPickNoise(time, vel, cab, 1);
      this.pluckString(time, freq, dur, vel, cab, { damp: 0.3, feedback: 0.99, pluckNoise: 0.01, brightness: 1, sustain: 1.4 });
      return;
    }

    // Amp and pickup character as a table. A lead guitar tone is a string
    // into a gain stage into a speaker, and what separates most of them is
    // just how much gain, how bright the cabinet is, and how long the string
    // is allowed to ring - so those are parameters rather than branches.
    //
    //   gain      waveshaper drive; 0 means a clean amp
    //   bright    cabinet top end
    //   damp      how fast the string dies (low = long sustain)
    //   fb        string feedback coefficient; near 1 sings, lower plucks
    //   trem/dep  amplitude tremolo rate in Hz and its depth
    const LEADS = {
      // A cranked but not saturated amp: the classic rock rhythm-lead tone.
      crunch:    { gain: 20, bright: 1.0,  damp: 0.2,  fb: 0.993, sus: 1.8, presence: 4 },
      // High gain, tight low end, scooped mids.
      metal:     { gain: 46, bright: 0.85, damp: 0.16, fb: 0.995, sus: 2.2, presence: 6 },
      // A clean amp with its tremolo circuit on - the surf/spaghetti sound.
      tremolo:   { gain: 0,  bright: 1.1,  damp: 0.26, fb: 0.991, sus: 1.6, presence: 3, trem: 5.5, dep: 0.55 },
      // Slow tremolo and a lot of top: the reverb-drenched surf lead.
      surf:      { gain: 6,  bright: 1.25, damp: 0.3,  fb: 0.99,  sus: 1.4, presence: 5, trem: 4.2, dep: 0.4 },
      // A hollow-body through a clean amp, rolled off: the jazz box.
      jazzlead:  { gain: 0,  bright: 0.55, damp: 0.34, fb: 0.988, sus: 1.2, presence: 1.2 },
      // Just breaking up, mid-forward, long sustain: the blues lead.
      blues:     { gain: 14, bright: 0.95, damp: 0.18, fb: 0.9945, sus: 2.4, presence: 3.5 },
      // Chorus on a clean amp - two slightly detuned copies.
      chorus:    { gain: 0,  bright: 1.15, damp: 0.28, fb: 0.99,  sus: 1.5, presence: 3, detune: 9 },
      // An EBow: infinite sustain, no pick attack at all, so it swells.
      ebow:      { gain: 8,  bright: 0.9,  damp: 0.06, fb: 0.9995, sus: 5, presence: 3, swell: 0.35 },
      // A thin, bright single-coil played hard: the funk/disco lead line.
      twang:     { gain: 4,  bright: 1.3,  damp: 0.4,  fb: 0.985, sus: 0.9, presence: 6 },
    };
    if (LEADS[flavor]) {
      const p = LEADS[flavor];
      const cab = this.makeGuitarCab(dest, { bright: p.bright, body: 1, presence: p.presence });
      let node = cab;
      if (p.trem) {
        // The tremolo circuit: the amp's output level swings, so it is an
        // amplitude modulation on the whole signal rather than on one string.
        const t = ctx.createGain();
        t.gain.value = 1 - p.dep / 2;
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = p.trem;
        const amt = ctx.createGain();
        amt.gain.value = p.dep / 2;
        lfo.connect(amt).connect(t.gain);
        lfo.start(time);
        lfo.stop(time + dur + 0.1);
        t.connect(cab);
        node = t;
      }
      if (p.gain > 0) {
        const sh = ctx.createWaveShaper();
        sh.curve = this.makeDistortionCurve(p.gain);
        sh.oversample = "4x";
        const post = ctx.createGain();
        post.gain.value = 0.5;
        sh.connect(post).connect(node);
        node = sh;
      }
      if (!p.swell) this.addPickNoise(time, vel, node, p.bright);
      const strings = p.detune ? [-p.detune, p.detune] : [0];
      for (const cents of strings) {
        this.pluckString(time, freq * Math.pow(2, cents / 1200), dur,
          vel / strings.length, node,
          { damp: p.damp, feedback: p.fb, pluckNoise: p.swell ? 0.001 : 0.008,
            brightness: p.bright, sustain: p.sus });
      }
      return;
    }

    if (flavor === "harmonics") {
      // Pinch/artificial harmonics: the picking hand damps the string at
      // a node so the fundamental is cancelled and a high partial speaks
      // instead - a squeal, not a note. The fundamental really is absent.
      const cab = this.makeGuitarCab(dest, { bright: 1.2, body: 0.7, presence: 8 });
      const post = ctx.createGain();
      post.gain.value = 0.45;
      post.connect(cab);
      const shaper = ctx.createWaveShaper();
      shaper.curve = this.makeDistortionCurve(26);
      shaper.connect(post);
      this.pluckString(time, freq * 3, dur * 0.8, vel * 0.8, shaper, { damp: 0.12, feedback: 0.99, pluckNoise: 0.006, brightness: 1.5, sustain: 1.1 });
      this.pluckString(time, freq * 4, dur * 0.6, vel * 0.4, shaper, { damp: 0.14, feedback: 0.986, pluckNoise: 0.004, brightness: 1.5, sustain: 0.9 });
      return;
    }

    // The gain flavors share a chain: string -> tightening EQ -> gain
    // stage -> cabinet, exactly as a real rig is ordered.
    const gainAmount = flavor === "fuzz" ? 55 : 34;
    const cab = this.makeGuitarCab(dest, {
      bright: flavor === "fuzz" ? 0.8 : 1,
      body: flavor === "fuzz" ? 1.4 : 1.1,
      presence: flavor === "wah" ? 4 : 7,
    });
    const post = ctx.createGain();
    post.gain.value = flavor === "fuzz" ? 0.34 : 0.42;
    let head = post;
    post.connect(cab);

    if (flavor === "wah") {
      // A wah pedal is a resonant bandpass swept by the player's foot.
      // The sweep is the instrument - a static wah is just a honk.
      const wah = ctx.createBiquadFilter();
      wah.type = "bandpass";
      wah.Q.value = 4.5;
      wah.frequency.setValueAtTime(450, time);
      wah.frequency.linearRampToValueAtTime(2100, time + Math.min(0.35, dur * 0.5));
      wah.frequency.linearRampToValueAtTime(600, time + dur);
      wah.connect(post);
      head = wah;
    }

    const shaper = ctx.createWaveShaper();
    shaper.curve = this.makeDistortionCurve(gainAmount);
    shaper.connect(head);
    const tight = ctx.createBiquadFilter();
    tight.type = "highpass";
    tight.frequency.value = flavor === "fuzz" ? 110 : 160;
    tight.Q.value = 0.7;
    tight.connect(shaper);

    this.addPickNoise(time, vel, cab, flavor === "fuzz" ? 0.6 : 1);
    // "sustain" is the feedback-into-the-amp lead tone: the string is fed
    // enough energy that it does not decay at all for the length of the
    // note, which is why it can be held forever on a record.
    const sustainy = flavor === "sustain";
    this.pluckString(time, freq, dur, vel, tight, {
      damp: sustainy ? 0.1 : 0.22,
      feedback: sustainy ? 0.9985 : 0.992,
      pluckNoise: 0.008,
      brightness: 1.15,
      sustain: sustainy ? 3.5 : 1.6,
    });
    // Finger vibrato on the sustained lead - a held lead note without it
    // sounds synthetic, because no guitarist holds a note dead still.
    if (sustainy || flavor === "overdrive") {
      const shimmer = ctx.createOscillator();
      shimmer.type = "sine";
      shimmer.frequency.value = freq;
      const sv = ctx.createOscillator();
      sv.frequency.value = 5.4;
      const svAmt = ctx.createGain();
      svAmt.gain.setValueAtTime(0.0001, time);
      svAmt.gain.linearRampToValueAtTime(freq * 0.012, time + Math.min(0.4, dur * 0.6));
      sv.connect(svAmt).connect(shimmer.frequency);
      sv.start(time);
      sv.stop(time + dur + 0.1);
      const sg = ctx.createGain();
      sg.gain.setValueAtTime(0.0001, time);
      sg.gain.linearRampToValueAtTime(vel * 0.18, time + 0.12);
      sg.gain.exponentialRampToValueAtTime(0.001, time + dur);
      shimmer.connect(sg).connect(tight);
      shimmer.start(time);
      shimmer.stop(time + dur + 0.1);
    }
  }

  // ---- Talk box -----------------------------------------------------
  // The talkbox and the vocoder are constantly confused, and they are
  // opposites. A vocoder makes a VOICE sound like an instrument, by
  // analysing the voice and reimposing its spectrum on a synth. A talkbox
  // makes an INSTRUMENT sound like a voice, mechanically: a horn driver
  // sends the synth's audio up a plastic tube into the player's mouth,
  // the player silently shapes vowels, and a microphone in front of their
  // mouth picks up the result. There is no analysis and no carrier/
  // modulator pair - just an instrument being filtered by a real mouth.
  //
  // So the right model is not a vocoder bank: it is a synth tone through
  // two or three resonant bandpass formants that MOVE, because a player
  // is continuously changing vowel while the note sustains. Roger
  // Troutman of Zapp - the definitive user - fed his through a Minimoog
  // and later a DX100, which is why the underlying tone is a fat,
  // slightly buzzy analog lead rather than anything vocal.
  playTalkboxVoice(time, freq, durationSeconds, vel, flavor) {
    if (this.playSampleFlavor("talkbox", flavor, time, vel, freq, durationSeconds)) return;
    const ctx = this.ctx;
    const dest = this.dest("talkbox");
    const dur = Math.max(Math.min(durationSeconds, 1.6), 0.2);

    // Formant pairs (F1, F2) for real vowels, in Hz. The word the
    // "talking" seems to say is entirely which vowels get swept between.
    const VOWELS = {
      // "ee" -> "oh", the classic Zapp phrase shape
      roger:  [[300, 2300], [450, 1000], [400, 800]],
      // "aw" -> "ee", the wider G-funk drawl
      gfunk:  [[600, 1000], [500, 1700], [320, 2200]],
      // narrow and static-ish, so it reads mechanical rather than sung
      robot:  [[400, 1300], [420, 1350], [400, 1300]],
      // "ah" -> "ee" up high, cutting
      bright: [[700, 1200], [400, 2400], [300, 2600]],
      // "oo" throughout, barely moving: dark and closed, sits under a mix.
      deep:   [[350, 800], [330, 760], [300, 700]],
      // "ee" held, the most nasal and most obviously synthetic vowel.
      nasal:  [[280, 2250], [300, 2400], [280, 2250]],
      // "oh" -> "ah" -> "oo", a full round phrase rather than a single word.
      drawl:  [[450, 900], [700, 1150], [400, 850]],
      // The 70s vocoder shape: mid vowels, wide sweep, ends open.
      vintage:[[520, 1100], [600, 1550], [700, 1900]],
      // "ah" -> "oh" fast and back, which reads as a short spoken word.
      chatter:[[720, 1250], [420, 950], [700, 1220]],
      // A long rise into "ee" - the talkbox lick that climbs.
      rise:   [[400, 850], [500, 1500], [300, 2450]],
    };
    const path = VOWELS[flavor] || VOWELS.roger;

    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, time);
    out.gain.linearRampToValueAtTime(vel * 0.75, time + 0.02);
    out.gain.setValueAtTime(vel * 0.75, time + dur * 0.82);
    out.gain.exponentialRampToValueAtTime(0.001, time + dur + 0.05);
    out.connect(dest);

    // The synth being spoken through: a fat detuned analog lead.
    const source = ctx.createGain();
    source.gain.value = 0.5;
    for (const [type, detune, lvl] of [["sawtooth", -7, 0.5], ["sawtooth", 6, 0.5], ["square", 0, 0.3]]) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = detune;
      const g = ctx.createGain();
      g.gain.value = lvl;
      osc.connect(g).connect(source);
      osc.start(time);
      osc.stop(time + dur + 0.1);
    }
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = freq / 2;
    const subG = ctx.createGain();
    subG.gain.value = 0.25;
    sub.connect(subG).connect(source);
    sub.start(time);
    sub.stop(time + dur + 0.1);

    // The mouth. Two moving formants, swept across the vowel path over
    // the length of the note - a static formant filter sounds like a
    // wah pedal left in one position, which is exactly the mistake that
    // makes fake talkboxes sound wrong.
    [0, 1].forEach((band) => {
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = band === 0 ? 9 : 12;
      bp.frequency.setValueAtTime(path[0][band], time);
      const mid = time + dur * 0.45;
      bp.frequency.linearRampToValueAtTime(path[1][band], mid);
      bp.frequency.linearRampToValueAtTime(path[2][band], time + dur);
      const bg = ctx.createGain();
      bg.gain.value = band === 0 ? 1 : 0.72;
      source.connect(bp).connect(bg).connect(out);
    });
    // A third, fixed high formant keeps consonant-like brightness so the
    // result reads as speech rather than as a filtered synth pad.
    const bp3 = ctx.createBiquadFilter();
    bp3.type = "bandpass";
    bp3.frequency.value = 2900;
    bp3.Q.value = 7;
    const g3 = ctx.createGain();
    g3.gain.value = 0.3;
    source.connect(bp3).connect(g3).connect(out);

    // A real talkbox is a horn driver being pushed hard up a tube, and it
    // distorts. Clean talkbox does not exist.
    const drive = ctx.createWaveShaper();
    drive.curve = this.makeDistortionCurve(flavor === "robot" ? 16 : 9);
    const tube = ctx.createBiquadFilter();
    tube.type = "bandpass";
    tube.frequency.value = 1500;
    tube.Q.value = 0.6;   // the plastic tube's own narrow response
    out.disconnect();
    out.connect(drive).connect(tube).connect(dest);
  }

  playMarimbaVoice(time, freq, durationSeconds, vel, flavor) {
    if (this.playSampleFlavor("marimba", flavor, time, vel, freq, durationSeconds)) return;
    const ctx = this.ctx;
    const dest = this.dest("marimba");

    // Tuned bars and plates differ in which overtones their shape tunes to.
    // A vibraphone's aluminium bar is nearly harmonic (4:1); a bell plate is
    // deliberately inharmonic; a steel tongue drum is somewhere between.
    const BARS = {
      bassmarimba: { gain: 0.62, partials: [[1, 1, 1.5], [4, 0.16, 0.5], [9.2, 0.05, 0.25]],
        strike: { freq: 400, len: 0.02, level: 0.2 } },
      crotales:    { gain: 0.4, partials: [[1, 1, 2.4], [2.76, 0.55, 1.6], [5.4, 0.3, 0.9], [8.9, 0.12, 0.5]],
        strike: { freq: 6000, len: 0.008, level: 0.25, type: "highpass" } },
      glassbar:    { gain: 0.42, partials: [[1, 1, 1.1], [3.1, 0.4, 0.6], [6.3, 0.18, 0.3]],
        strike: { freq: 4200, len: 0.01, level: 0.18 } },
      tonguedrum:  { gain: 0.55, partials: [[1, 1, 1.8], [2.4, 0.3, 0.9], [4.1, 0.1, 0.4]],
        strike: { freq: 900, len: 0.015, level: 0.16 } },
      celestebar:  { gain: 0.36, partials: [[1, 1, 1.3], [4.05, 0.3, 0.7], [8.1, 0.1, 0.35], [12, 0.04, 0.2]],
        strike: { freq: 3000, len: 0.009, level: 0.14 } },
      // A steel pan: a hammered dish whose note areas are tuned to the
      // octave and twelfth, which is why it sounds bright but still pitched.
      steelpan:    { gain: 0.5, partials: [[1, 1, 1.4], [2, 0.6, 1.0], [3, 0.34, 0.6], [4.9, 0.12, 0.3]],
        strike: { freq: 2400, len: 0.012, level: 0.28 } },
      // Bowed vibraphone: no strike at all, so it swells instead of being
      // hit, and the partials last far longer.
      bowedvibes:  { gain: 0.4, partials: [[1, 1, 3.4], [4, 0.3, 2.2], [10.7, 0.08, 1.1]] },
      // A tuned bell plate, deliberately inharmonic and metallic.
      bellplate:   { gain: 0.38, partials: [[1, 1, 2.6], [2.34, 0.6, 1.8], [3.91, 0.32, 1.1], [6.2, 0.15, 0.6]],
        strike: { freq: 5200, len: 0.01, level: 0.3, type: "highpass" } },
      // Almglocken - tuned cowbells. Short, hard and very inharmonic.
      almglocken:  { gain: 0.44, partials: [[1, 1, 0.9], [1.52, 0.5, 0.6], [2.61, 0.28, 0.35], [3.8, 0.12, 0.2]],
        strike: { freq: 3600, len: 0.008, level: 0.34 } },
      // A wooden slit drum: the fundamental plus one weak, low overtone.
      slitdrum:    { gain: 0.58, partials: [[1, 1, 0.8], [1.9, 0.18, 0.4]],
        strike: { freq: 700, len: 0.014, level: 0.24 } },
      // Marimba struck with hard rubber rather than yarn: the same bar with
      // far more attack and a shorter body.
      hardmallet:  { gain: 0.55, partials: [[1, 1, 0.75], [4, 0.34, 0.3], [9.2, 0.14, 0.14]],
        strike: { freq: 2800, len: 0.01, level: 0.4 } },
      // Very soft yarn mallets on a low marimba - almost no attack at all.
      softmallet:  { gain: 0.6, partials: [[1, 1, 1.9], [4, 0.1, 0.6]],
        strike: { freq: 500, len: 0.03, level: 0.06 } },
      // Glockenspiel: small steel bars, extremely bright, long ring.
      glockbar:    { gain: 0.3, partials: [[1, 1, 1.8], [3, 0.5, 1.0], [6.1, 0.2, 0.5], [10.4, 0.07, 0.25]],
        strike: { freq: 7000, len: 0.007, level: 0.3, type: "highpass" } },
    };
    if (BARS[flavor]) { this.playStruckVoice(time, freq, vel, dest, BARS[flavor]); return; }

    if (flavor === "xylophone") {
      // A xylophone and a marimba are both tuned wooden bars, and the
      // difference between them is entirely in how the bar is UNDERCUT.
      // A marimba bar is arched so the first overtone tunes to two
      // octaves above the fundamental (a 4:1 ratio), which sounds round
      // and warm. A xylophone bar is cut so it tunes to a twelfth (a 3:1
      // ratio) instead, which is what makes a xylophone sound hard,
      // hollow and bright. Same material, different tuning of one
      // partial, completely different instrument.
      const dur = Math.min(durationSeconds, 0.35);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 0.9, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      gain.connect(dest);
      for (const [ratio, lvl, decay] of [[1, 1, 1], [3, 0.55, 0.45], [6, 0.18, 0.25]]) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq * ratio;
        const g = ctx.createGain();
        g.gain.setValueAtTime(lvl, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + dur * decay);
        osc.connect(g).connect(gain);
        osc.start(time);
        osc.stop(time + dur + 0.05);
      }
      const strike = ctx.createBufferSource();
      strike.buffer = this.makeNoiseBuffer(0.012);
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 3500;
      const sg = ctx.createGain();
      sg.gain.setValueAtTime(vel * 0.4, time);
      sg.gain.exponentialRampToValueAtTime(0.001, time + 0.012);
      strike.connect(hp).connect(sg).connect(dest);
      strike.start(time);
      strike.stop(time + 0.015);
      return;
    }

    if (flavor === "tubularbell") {
      // Orchestral chimes: long hanging brass tubes. Their partials are
      // strongly inharmonic and - famously - the pitch you hear is not
      // actually present in the sound. The ear infers a missing
      // fundamental from partials near the 2:3:4 ratios, which is why
      // tubular bells sound simultaneously enormous and slightly
      // ambiguous in pitch.
      const dur = Math.min(Math.max(durationSeconds, 2), 4);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 0.75, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      gain.connect(dest);
      for (const [ratio, lvl] of [[2, 1], [3, 0.75], [4, 0.6], [5.4, 0.3], [6.8, 0.2], [8.2, 0.12]]) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq * ratio;
        const g = ctx.createGain();
        g.gain.setValueAtTime(lvl, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + dur / (ratio * 0.22 + 0.6));
        osc.connect(g).connect(gain);
        osc.start(time);
        osc.stop(time + dur + 0.2);
      }
      const clang = ctx.createBufferSource();
      clang.buffer = this.makeNoiseBuffer(0.03);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 3800;
      bp.Q.value = 1.5;
      const cg = ctx.createGain();
      cg.gain.setValueAtTime(vel * 0.35, time);
      cg.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
      clang.connect(bp).connect(cg).connect(dest);
      clang.start(time);
      clang.stop(time + 0.04);
      return;
    }

    const dur = Math.min(durationSeconds, flavor === "vibraphone" ? 1.4 : 0.8);

    // A soft mallet-strike noise transient - lower and rounder than the
    // kalimba's thumb-pluck click, since a felt/rubber mallet compresses
    // against a wooden bar rather than snapping a metal tine.
    const strike = ctx.createBufferSource();
    strike.buffer = this.makeNoiseBuffer(0.025);
    const strikeFilter = ctx.createBiquadFilter();
    strikeFilter.type = "lowpass";
    strikeFilter.frequency.value = 2200;
    const strikeGain = ctx.createGain();
    strikeGain.gain.setValueAtTime(vel * 0.25, time);
    strikeGain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);
    strike.connect(strikeFilter).connect(strikeGain).connect(dest);
    strike.start(time);
    strike.stop(time + 0.03);

    // Real marimba bars are tuned/undercut to emphasize roughly the fourth
    // harmonic alongside the fundamental - a fixed pair of sine partials at
    // that ratio approximates the bar's characteristic woody timbre.
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vel, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    gain.connect(dest);

    if (flavor === "vibraphone") {
      // A rotating fan inside a vibraphone's resonator tubes creates a
      // slow pulsating tremolo - the clearest audible difference from a
      // marimba's dry, un-modulated wooden tone.
      const trem = ctx.createOscillator();
      trem.frequency.value = 5;
      const tremGain = ctx.createGain();
      tremGain.gain.value = vel * 0.35;
      trem.connect(tremGain).connect(gain.gain);
      trem.start(time);
      trem.stop(time + dur + 0.1);
    }

    const partials = [{ ratio: 1, level: 1 }, { ratio: 3.99, level: 0.22 }];
    for (const p of partials) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq * p.ratio, time);
      const pGain = ctx.createGain();
      pGain.gain.value = p.level;
      osc.connect(pGain).connect(gain);
      osc.start(time);
      osc.stop(time + dur + 0.1);
    }
  }

  // A dedicated arpeggiator voice: short, plucky, and bright rather than a
  // sustained lead - real arps are built from fast, staccato note runs, so
  // the synthesis needs a fast decay baked in even when the sequencer feeds
  // it a longer note value, the same way a real arpeggiator plugin retriggers
  // on every step regardless of the underlying chord's length.
  playArpVoice(time, freq, durationSeconds, vel, flavor) {
    if (this.playSampleFlavor("arp", flavor, time, vel, freq, durationSeconds)) return;
    const ctx = this.ctx;
    const dest = this.dest("arp");
    const dur = Math.min(durationSeconds, 0.16);

    // Most arpeggiator sounds are the same three decisions - waveform, how
    // far the filter sweeps, how long the tail is - so they are a table
    // rather than a branch each. The hand-written ones below are the ones
    // that need something a table cannot express.
    //
    //   uni/det  unison voices and their spread in cents
    //   cut      filter sweep, as multiples of the note's own frequency, so
    //            the brightness tracks the pitch instead of every high note
    //            turning to glass
    //   tail     decay as a multiple of the step length
    const ARPS = {
      saw:     { wave: "sawtooth", uni: 1, det: 0,  q: 3,  cut: [14, 2.5], tail: 1.2, gain: 0.6 },
      square:  { wave: "square",   uni: 1, det: 0,  q: 4,  cut: [10, 2],   tail: 1.1, gain: 0.5 },
      wide:    { wave: "sawtooth", uni: 5, det: 20, q: 5,  cut: [12, 3],   tail: 1.8, gain: 0.42 },
      dark:    { wave: "triangle", uni: 3, det: 8,  q: 2,  cut: [5, 1.6],  tail: 1.5, gain: 0.62 },
      glass:   { wave: "sine",     uni: 3, det: 5,  q: 1,  cut: [24, 10],  tail: 2.4, gain: 0.5 },
      // A pure sub-octave arp, for when the arpeggio is the bassline.
      subarp:  { wave: "triangle", uni: 1, det: 0,  q: 1,  cut: [4, 1.2],  tail: 1.3, gain: 0.7, oct: -1 },
      // Very short and very bright: the "plucked" arp that sits on top of a
      // busy mix without competing with anything.
      needle:  { wave: "sawtooth", uni: 2, det: 4,  q: 9,  cut: [30, 6],   tail: 0.7, gain: 0.45 },
      // Filter opening upward instead of closing, so each note swells.
      swellarp:{ wave: "sawtooth", uni: 3, det: 12, q: 6,  cut: [2, 16],   tail: 2.6, gain: 0.4 },
    };
    if (ARPS[flavor]) {
      const p = ARPS[flavor];
      const f0 = freq * (p.oct ? Math.pow(2, p.oct) : 1);
      const tail = dur * p.tail;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = p.q;
      filter.frequency.setValueAtTime(Math.min(16000, Math.max(120, f0 * p.cut[0])), time);
      filter.frequency.exponentialRampToValueAtTime(
        Math.min(16000, Math.max(120, f0 * p.cut[1])), time + tail);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * p.gain, time + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, time + tail);
      filter.connect(gain).connect(dest);
      if (p.uni > 1) {
        this.addUnisonVoices(f0, p.uni, p.det, p.wave, filter, time, time + tail + 0.03);
      } else {
        const o = ctx.createOscillator();
        o.type = p.wave;
        o.frequency.setValueAtTime(f0, time);
        o.connect(filter);
        o.start(time);
        o.stop(time + tail + 0.03);
      }
      return;
    }

    if (flavor === "trance") {
      // The supersaw arp of late-90s trance: several detuned saws, a filter
      // that opens on every note, and just enough of a release tail that the
      // notes overlap into a continuous ribbon rather than separate blips.
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 7;
      filter.frequency.setValueAtTime(900, time);
      filter.frequency.exponentialRampToValueAtTime(5200, time + 0.02);
      filter.frequency.exponentialRampToValueAtTime(1100, time + dur * 1.6);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(vel * 0.5, time + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur * 1.8);
      filter.connect(gain).connect(dest);
      for (const cents of [-14, -5, 0, 5, 14]) {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(freq * Math.pow(2, cents / 1200), time);
        o.connect(filter);
        o.start(time);
        o.stop(time + dur * 1.9);
      }
      return;
    }

    if (flavor === "acid") {
      // A 303 played as an arpeggio: one saw through a resonant lowpass with
      // a fast envelope on the cutoff. The squelch is entirely the filter -
      // high Q plus a sharp sweep is the whole sound.
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(freq, time);
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.Q.value = 16;
      f.frequency.setValueAtTime(freq * 9, time);
      f.frequency.exponentialRampToValueAtTime(Math.max(180, freq * 1.4), time + dur * 1.3);
      const g = ctx.createGain();
      g.gain.setValueAtTime(vel * 0.62, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + dur * 1.4);
      o.connect(f).connect(g).connect(dest);
      o.start(time);
      o.stop(time + dur * 1.5);
      return;
    }

    if (flavor === "harp") {
      // A plucked-string arp. Inharmonic partials would ruin it - a harp is
      // one of the most nearly-harmonic instruments there is - so the
      // partials are exact multiples and the top ones simply die first.
      const g = ctx.createGain();
      g.gain.setValueAtTime(vel * 0.5, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.7);
      g.connect(dest);
      for (const [mult, lvl, decay] of [[1, 1, 0.7], [2, 0.4, 0.42], [3, 0.18, 0.3], [4, 0.09, 0.22], [5, 0.05, 0.16]]) {
        if (freq * mult > 12000) continue;
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(freq * mult, time);
        const pg = ctx.createGain();
        pg.gain.setValueAtTime(lvl, time);
        pg.gain.exponentialRampToValueAtTime(0.0001, time + decay);
        o.connect(pg).connect(g);
        o.start(time);
        o.stop(time + decay + 0.05);
      }
      return;
    }

    if (flavor === "bellarp") {
      // A struck-bell arp: two sines a slightly-sharp octave apart, which is
      // the interval that makes a bell read as a bell rather than a flute.
      const g = ctx.createGain();
      g.gain.setValueAtTime(vel * 0.42, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.55);
      g.connect(dest);
      for (const [mult, lvl] of [[1, 1], [2.02, 0.5], [3.01, 0.2], [4.2, 0.09]]) {
        if (freq * mult > 13000) continue;
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(freq * mult, time);
        const pg = ctx.createGain();
        pg.gain.setValueAtTime(lvl, time);
        pg.gain.exponentialRampToValueAtTime(0.0001, time + 0.55 / (1 + mult * 0.35));
        o.connect(pg).connect(g);
        o.start(time);
        o.stop(time + 0.6);
      }
      return;
    }

    if (flavor === "pulse") {
      // A duller, warmer square-wave arp - classic 8-bit/chiptune-adjacent
      // arpeggio character instead of a bright trance pluck.
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, time);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2600, time);
      filter.frequency.exponentialRampToValueAtTime(500, time + dur);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc.connect(filter).connect(gain).connect(dest);
      osc.start(time);
      osc.stop(time + dur + 0.03);
      return;
    }

    // "arp" (default): a bright, thin unison-saw pluck - the classic
    // trance/house arpeggio timbre, deliberately much shorter and brighter
    // than the "supersaw" lead flavor.
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(6000, time);
    filter.frequency.exponentialRampToValueAtTime(1200, time + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vel * 0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    filter.connect(gain).connect(dest);
    this.addUnisonVoices(freq, 3, 8, "sawtooth", filter, time, time + dur + 0.03);
  }

  playPianoVoice(time, freq, durationSeconds, vel, flavor) {
    if (this.playSampleFlavor("piano", flavor, time, vel, freq, durationSeconds)) return;
    const ctx = this.ctx;
    const dest = this.dest("piano");
    const dur = Math.min(durationSeconds, 1.4);

    if (flavor === "m1piano") {
      // The Korg M1's "Piano 16" - the sound that got its own subgenre
      // (piano house) and is all over early-90s dance and pop. It is not
      // an acoustic piano emulation and never was: a bright, hard,
      // percussive attack with a strong mid presence and a fast decay,
      // built to punch through a club system rather than to sound real.
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 1.05, time);
      gain.gain.exponentialRampToValueAtTime(vel * 0.3, time + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, time + Math.max(dur, 0.5));
      const presence = ctx.createBiquadFilter();
      presence.type = "peaking";
      presence.frequency.value = 2600;
      presence.Q.value = 0.9;
      presence.gain.value = 7;
      gain.connect(presence).connect(dest);
      for (const [ratio, lvl] of [[1, 1], [2, 0.5], [3, 0.22], [4.02, 0.14], [6.1, 0.07]]) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq * ratio;
        const g = ctx.createGain();
        g.gain.setValueAtTime(lvl, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + Math.max(dur, 0.5) / (ratio * 0.5 + 0.7));
        osc.connect(g).connect(gain);
        osc.start(time);
        osc.stop(time + Math.max(dur, 0.5) + 0.1);
      }
      // The hard digital attack tick that makes it cut.
      const tick = ctx.createBufferSource();
      tick.buffer = this.makeNoiseBuffer(0.01);
      const thp = ctx.createBiquadFilter();
      thp.type = "highpass";
      thp.frequency.value = 5000;
      const tg = ctx.createGain();
      tg.gain.setValueAtTime(vel * 0.3, time);
      tg.gain.exponentialRampToValueAtTime(0.001, time + 0.01);
      tick.connect(thp).connect(tg).connect(dest);
      tick.start(time);
      tick.stop(time + 0.014);
      return;
    }

    if (flavor === "cp70") {
      // Yamaha CP-70 electric grand: real strings and real hammers, but
      // no soundboard at all - piezo pickups under the bridge instead.
      // That is why it sounds like a piano that has been through a guitar
      // amp: hard, mid-forward, slightly metallic, with a long clean
      // sustain and none of an acoustic piano's air. Peter Gabriel,
      // Genesis, Toto, and a great deal of 80s pop.
      const board = ctx.createBiquadFilter();
      board.type = "peaking";
      board.frequency.value = 1200;
      board.Q.value = 0.8;
      board.gain.value = 6;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 90;   // no soundboard = no low air
      board.connect(hp).connect(dest);
      // Pickups sense the string directly, so a physical string model is
      // literally the right model here.
      this.pluckString(time, freq, Math.max(dur, 0.9), vel * 0.9, board,
        { damp: 0.22, feedback: 0.992, pluckNoise: 0.004, brightness: 1.25, sustain: 1.6 });
      return;
    }

    if (flavor === "felt") {
      // Felt piano: a strip of felt is laid between the hammers and the
      // strings. It kills the attack transient almost entirely and rolls
      // the top off hard, leaving mostly body and the mechanical noise of
      // the action - which is why it sounds intimate and close-miked
      // rather than like a piano in a room. The defining detail is that
      // the KEY NOISE becomes proportionally loud, because the note it
      // sits under is now so quiet.
      const dur2 = Math.max(dur, 0.8);
      const muffle = ctx.createBiquadFilter();
      muffle.type = "lowpass";
      muffle.frequency.setValueAtTime(1500, time);
      muffle.frequency.exponentialRampToValueAtTime(600, time + dur2);
      muffle.connect(dest);
      for (const [ratio, lvl] of [[1, 1], [2, 0.24], [3, 0.08]]) {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = freq * ratio;
        const g = ctx.createGain();
        // Slow attack: felt absorbs the hammer strike.
        g.gain.setValueAtTime(0.0001, time);
        g.gain.linearRampToValueAtTime(vel * 0.5 * lvl, time + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, time + dur2 / (ratio * 0.5 + 0.6));
        osc.connect(g).connect(muffle);
        osc.start(time);
        osc.stop(time + dur2 + 0.15);
      }
      // The action: felt-piano recordings are full of it.
      const key = ctx.createBufferSource();
      key.buffer = this.makeNoiseBuffer(0.03);
      const kbp = ctx.createBiquadFilter();
      kbp.type = "bandpass";
      kbp.frequency.value = 1100;
      kbp.Q.value = 0.8;
      const kg = ctx.createGain();
      kg.gain.setValueAtTime(vel * 0.16, time);
      kg.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
      key.connect(kbp).connect(kg).connect(dest);
      key.start(time);
      key.stop(time + 0.04);
      return;
    }

    if (flavor === "tack") {
      // Tack piano: drawing pins pushed into the hammer felts, so metal
      // hits the string instead of wool. Enormous high-frequency attack,
      // very little sustain - the saloon/vaudeville sound, and a staple
      // of lo-fi and library music.
      const dur2 = Math.min(dur, 0.55);
      for (const [ratio, lvl] of [[1, 0.7], [2, 0.4], [3, 0.25], [5.1, 0.14]]) {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = freq * ratio;
        const g = ctx.createGain();
        g.gain.setValueAtTime(vel * lvl, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + dur2 / (ratio * 0.4 + 0.7));
        osc.connect(g).connect(dest);
        osc.start(time);
        osc.stop(time + dur2 + 0.1);
      }
      const tack = ctx.createBufferSource();
      tack.buffer = this.makeNoiseBuffer(0.012);
      const thp = ctx.createBiquadFilter();
      thp.type = "highpass";
      thp.frequency.value = 5500;
      const tg = ctx.createGain();
      tg.gain.setValueAtTime(vel * 0.6, time);
      tg.gain.exponentialRampToValueAtTime(0.001, time + 0.012);
      tack.connect(thp).connect(tg).connect(dest);
      tack.start(time);
      tack.stop(time + 0.016);
      return;
    }

    if (flavor === "jazzgrand") {
      // A jazz grand recorded close with the lid up: bright, woody, with
      // a long clean sustain and a strong second partial. Modelled with a
      // real string model into a soundboard resonance rather than an
      // oscillator stack, because what a jazz pianist is listening for is
      // the string itself.
      const board = ctx.createBiquadFilter();
      board.type = "peaking";
      board.frequency.value = 550;
      board.Q.value = 0.7;
      board.gain.value = 5;
      board.connect(dest);
      this.pluckString(time, freq, Math.max(dur, 1.1), vel * 0.9, board,
        { damp: 0.18, feedback: 0.9945, pluckNoise: 0.005, brightness: 1.15, sustain: 2 });
      return;
    }

    if (flavor === "honkytonk") {
      // A honky-tonk piano is an ordinary upright that has gone badly out
      // of tune - and specifically out of tune WITH ITSELF, because each
      // note has two or three strings that have drifted apart. The beating
      // between those unison strings is the entire effect.
      for (const detune of [-18, 0, 15]) {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = freq;
        osc.detune.value = detune;
        const g = ctx.createGain();
        g.gain.setValueAtTime(vel * 0.4, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + Math.max(dur, 0.6));
        const tone = ctx.createBiquadFilter();
        tone.type = "lowpass";
        tone.frequency.setValueAtTime(4200, time);
        tone.frequency.exponentialRampToValueAtTime(900, time + Math.max(dur, 0.6));
        osc.connect(tone).connect(g).connect(dest);
        osc.start(time);
        osc.stop(time + Math.max(dur, 0.6) + 0.1);
      }
      const hammer = ctx.createBufferSource();
      hammer.buffer = this.makeNoiseBuffer(0.015);
      const hbp = ctx.createBiquadFilter();
      hbp.type = "bandpass";
      hbp.frequency.value = 2600;
      const hg = ctx.createGain();
      hg.gain.setValueAtTime(vel * 0.28, time);
      hg.gain.exponentialRampToValueAtTime(0.001, time + 0.015);
      hammer.connect(hbp).connect(hg).connect(dest);
      hammer.start(time);
      hammer.stop(time + 0.02);
      return;
    }

    if (flavor === "pluck") {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(3200, time);
      filter.frequency.exponentialRampToValueAtTime(400, time + 0.35);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + Math.max(dur, 0.4));
      osc.frequency.setValueAtTime(freq, time);
      osc.connect(filter).connect(gain).connect(dest);
      osc.start(time);
      osc.stop(time + Math.max(dur, 0.4) + 0.05);
      return;
    }

    if (flavor === "celesta") {
      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(freq * 2, time);
      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(freq * 4.02, time);
      const gain1 = ctx.createGain();
      gain1.gain.setValueAtTime(vel, time);
      gain1.gain.exponentialRampToValueAtTime(0.001, time + Math.min(dur, 0.8));
      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(vel * 0.25, time);
      gain2.gain.exponentialRampToValueAtTime(0.001, time + Math.min(dur, 0.3));
      osc1.connect(gain1).connect(dest);
      osc2.connect(gain2).connect(dest);
      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + Math.min(dur, 0.8) + 0.1);
      osc2.stop(time + Math.min(dur, 0.3) + 0.1);
      return;
    }

    if (flavor === "wurlitzer") {
      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(freq, time);
      const osc2 = ctx.createOscillator();
      osc2.type = "square";
      osc2.frequency.setValueAtTime(freq * 2, time);
      const gain1 = ctx.createGain();
      gain1.gain.setValueAtTime(0.0001, time);
      gain1.gain.exponentialRampToValueAtTime(vel, time + 0.004);
      gain1.gain.exponentialRampToValueAtTime(0.001, time + dur);
      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(vel * 0.25, time);
      gain2.gain.exponentialRampToValueAtTime(0.001, time + Math.min(dur, 0.3));
      osc1.connect(gain1).connect(dest);
      osc2.connect(gain2).connect(dest);
      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + dur + 0.1);
      osc2.stop(time + dur + 0.15);
      return;
    }

    if (flavor === "clav") {
      // Hohner Clavinet D6 - the funk keyboard (Stevie Wonder's
      // "Superstition"). Mechanically it IS a plucked string instrument:
      // each key slaps a rubber pad against a real string, so the honest
      // synthesis route is the same Karplus-Strong physical model the
      // guitars use, tuned tight and percussive, then pushed through a
      // bright peaking EQ for the D6's characteristic nasal bite.
      const peak = ctx.createBiquadFilter();
      peak.type = "peaking";
      peak.frequency.value = 2200;
      peak.Q.value = 2;
      peak.gain.value = 9;
      peak.connect(dest);
      this.pluckString(time, freq, Math.min(dur, 0.45), vel, peak, { damp: 0.12, feedback: 0.972, pluckNoise: 0.02, brightness: 1.5, sustain: 0.3 });
      return;
    }

    if (flavor === "dx7ep") {
      // True FM synthesis - a carrier sine whose frequency is modulated by
      // a second sine - rather than the additive detuned-oscillator trick
      // every other piano flavor here uses. The Yamaha DX7's "E.PIANO 1"
      // patch (probably the single most-used FM sound in 80s pop) gets its
      // bright, bell-like attack settling into a near-pure sustain from a
      // modulator ratio around 14:1 whose OWN amplitude (the "modulation
      // index") decays much faster than the carrier's - deep modulation
      // for an instant, then almost none as the modulator dies away.
      const carrier = ctx.createOscillator();
      carrier.type = "sine";
      carrier.frequency.setValueAtTime(freq, time);
      const modulator = ctx.createOscillator();
      modulator.type = "sine";
      modulator.frequency.setValueAtTime(freq * 14, time);
      const modGain = ctx.createGain();
      modGain.gain.setValueAtTime(freq * 2.2, time);
      modGain.gain.exponentialRampToValueAtTime(Math.max(1, freq * 0.02), time + 0.35);
      modulator.connect(modGain).connect(carrier.frequency);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(vel, time + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      carrier.connect(gain).connect(dest);
      carrier.start(time);
      modulator.start(time);
      carrier.stop(time + dur + 0.1);
      modulator.stop(time + dur + 0.1);
      return;
    }

    if (flavor === "toy") {
      // Bright, thin, slightly detuned square+sine pair with a fast decay -
      // a cheap toy/kids-piano upright character.
      const shortDur = Math.min(dur, 0.5);
      const osc1 = ctx.createOscillator();
      osc1.type = "square";
      osc1.frequency.setValueAtTime(freq * 2, time);
      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(freq * 2.01, time);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 0.55, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + shortDur);
      osc1.connect(gain).connect(dest);
      osc2.connect(gain);
      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + shortDur + 0.05);
      osc2.stop(time + shortDur + 0.05);
      return;
    }

    if (flavor === "harpsichord") {
      // Plucked, harmonic-rich, fast-decaying - a square-ish oscillator
      // stack through a bright peaking filter for that jangly pluck.
      const shortDur = Math.min(dur, 0.7);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 0.7, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + shortDur);
      const peak = ctx.createBiquadFilter();
      peak.type = "peaking";
      peak.frequency.value = 2800;
      peak.Q.value = 1.5;
      peak.gain.value = 6;
      peak.connect(gain).connect(dest);
      for (const ratio of [1, 2, 3]) {
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq * ratio, time);
        const g = ctx.createGain();
        g.gain.value = 1 / ratio;
        osc.connect(g).connect(peak);
        osc.start(time);
        osc.stop(time + shortDur + 0.05);
      }
      return;
    }

    if (flavor === "upright") {
      const osc1 = ctx.createOscillator();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(freq, time);
      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(freq * 0.997, time);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 2600;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(vel * 0.9, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc1.connect(filter).connect(gain).connect(dest);
      osc2.connect(filter);
      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + dur + 0.1);
      osc2.stop(time + dur + 0.1);
      return;
    }

    // A short high-passed noise click on every attack approximates the
    // hammer striking the string/tine - without it a synthesized piano
    // reads as a smooth pad instead of a struck instrument.
    const hammer = ctx.createBufferSource();
    hammer.buffer = this.makeNoiseBuffer(0.01);
    const hammerFilter = ctx.createBiquadFilter();
    hammerFilter.type = "highpass";
    hammerFilter.frequency.value = 4000;
    const hammerGain = ctx.createGain();
    hammerGain.gain.setValueAtTime(vel * 0.15, time);
    hammerGain.gain.exponentialRampToValueAtTime(0.001, time + 0.01);
    hammer.connect(hammerFilter).connect(hammerGain).connect(dest);
    hammer.start(time);
    hammer.stop(time + 0.015);

    if (flavor === "rhodes" || flavor === "electric") {
      // Both of these had no branch at all: they fell through to the generic
      // sine-plus-triangle below and were byte-for-byte the same sound. That
      // matters more than most duplicates would, because the Rhodes is the
      // single most-used keyboard in four of this program's genres - neo-soul,
      // R&B, lo-fi and boom-bap all lean on it - and it was a plain sine.
      //
      // A Rhodes is a struck TINE: a steel rod hit by a hammer, with a
      // pickup next to it. Three things make the sound, and none of them is
      // a filter:
      //  1. the strike, which is a short burst of very high inharmonic
      //     partials - the "bark" - and it dies away in under 200ms;
      //  2. a nearly pure sine body underneath it, because a tine vibrating
      //     in free air has almost no overtones of its own;
      //  3. the pickup, which is nonlinear and adds a little asymmetric
      //     grit that grows with how hard the note is played.
      // The bark is what says "electric piano" instead of "sine", and it is
      // velocity-dependent, which is why a Rhodes goes from mellow to
      // aggressive with nothing but the player's hands.
      const tine = flavor === "rhodes";
      const body = ctx.createGain();
      body.gain.setValueAtTime(0.0001, time);
      body.gain.linearRampToValueAtTime(vel * 0.85, time + 0.004);
      body.gain.exponentialRampToValueAtTime(0.001, time + dur);

      // The pickup nonlinearity, harder on the Rhodes than on the generic
      // amped electric.
      const pickup = ctx.createWaveShaper();
      pickup.curve = this.makeDistortionCurve(tine ? 3 + vel * 6 : 2);
      pickup.oversample = "2x";
      const post = ctx.createGain();
      post.gain.value = 0.85;
      body.connect(pickup).connect(post).connect(dest);

      const fundamental = ctx.createOscillator();
      fundamental.type = "sine";
      fundamental.frequency.setValueAtTime(freq, time);
      fundamental.connect(body);
      fundamental.start(time);
      fundamental.stop(time + dur + 0.1);

      // A second, very slightly detuned voice: the Rhodes has two tines per
      // note over most of its range and they are never perfectly in tune.
      const pair = ctx.createOscillator();
      pair.type = "sine";
      pair.frequency.setValueAtTime(freq * (tine ? 1.0015 : 1.004), time);
      const pg = ctx.createGain();
      pg.gain.value = 0.5;
      pair.connect(pg).connect(body);
      pair.start(time);
      pair.stop(time + dur + 0.1);

      // The bark: high inharmonic partials that decay far faster than the
      // body, scaled by velocity.
      const barkPartials = tine ? [[4.1, 0.5], [6.9, 0.34], [10.2, 0.16]]
                                : [[3.0, 0.28], [5.1, 0.12]];
      for (const [ratio, lvl] of barkPartials) {
        if (freq * ratio > 14000) continue;
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(freq * ratio, time);
        const g = ctx.createGain();
        const decay = tine ? 0.18 : 0.3;
        g.gain.setValueAtTime(lvl * vel * vel, time);
        g.gain.exponentialRampToValueAtTime(0.0001, time + decay);
        o.connect(g).connect(body);
        o.start(time);
        o.stop(time + decay + 0.05);
      }

      // The hammer hitting the tine.
      const knock = ctx.createBufferSource();
      knock.buffer = this.makeNoiseBuffer(0.012);
      const kf = ctx.createBiquadFilter();
      kf.type = "bandpass";
      kf.frequency.value = tine ? 2600 : 1800;
      kf.Q.value = 0.9;
      const kg = ctx.createGain();
      kg.gain.setValueAtTime(vel * (tine ? 0.2 : 0.12), time);
      kg.gain.exponentialRampToValueAtTime(0.0001, time + 0.012);
      knock.connect(kf).connect(kg).connect(dest);
      knock.start(time);
      knock.stop(time + 0.016);
      return;
    }

    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(freq, time);
    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq * 1.004, time);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(vel, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    if (flavor === "grand") {
      const osc3 = ctx.createOscillator();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(freq * 2.01, time);
      const g3 = ctx.createGain();
      g3.gain.setValueAtTime(vel * 0.15, time);
      g3.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.5);
      osc3.connect(g3).connect(dest);
      osc3.start(time);
      osc3.stop(time + dur + 0.1);
    }

    osc1.connect(gain).connect(dest);
    osc2.connect(gain);
    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + dur + 0.1);
    osc2.stop(time + dur + 0.1);
  }

  // destOverride lets another track borrow a lead timbre - the stab voice is
  // built almost entirely out of "a lead sound through a short envelope", and
  // it needs the result on the stab bus rather than the lead one.
  playLeadVoice(time, freq, durationSeconds, vel, flavor, destOverride) {
    if (!destOverride && this.playSampleFlavor("lead", flavor, time, vel, freq, durationSeconds)) return;
    const ctx = this.ctx;
    const dest = destOverride || this.dest("lead");
    const dur = Math.min(durationSeconds, 1);

    if (flavor === "hoover") {
      // The rave hoover - originally a preset called "What The" on the
      // Roland Alpha Juno, written by Eric Persing as a joke and then
      // used on Human Resource's "Dominator", The Prodigy's "Charly" and
      // most of early-90s hardcore, jungle and D&B. Four things make it:
      //   1. a PWM SAWTOOTH - a saw with flat segments of varying width
      //      cut into it, which is the Alpha Juno's unusual oscillator
      //      and not a shape any other synth of the era had;
      //   2. that PWM run at a high rate, giving the rasping detune;
      //   3. a sub-oscillator underneath;
      //   4. a fast up-then-down PITCH envelope, which is the discordant
      //      swoop everyone actually recognises.
      const dur2 = Math.max(dur, 0.35);
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.setValueAtTime(5200, time);
      filt.frequency.exponentialRampToValueAtTime(2200, time + dur2);
      filt.Q.value = 2;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.5, time + 0.02);
      gain.gain.setValueAtTime(vel * 0.5, time + dur2 * 0.85);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur2 + 0.08);
      filt.connect(gain).connect(dest);
      // The pitch envelope: up fast, then down past the target.
      const pitchOf = (osc, mult) => {
        osc.frequency.setValueAtTime(freq * mult * 1.16, time);
        osc.frequency.exponentialRampToValueAtTime(freq * mult * 0.965, time + 0.10);
        osc.frequency.exponentialRampToValueAtTime(freq * mult, time + 0.28);
      };
      // A PWM saw approximated the way it physically is: a sawtooth with
      // a pulse of modulated width summed against it, several voices wide
      // so the widths differ and the stack rasps.
      for (const [mult, detune, lvl] of [[1, -14, 0.34], [1, 0, 0.34], [1, 15, 0.34], [0.5, 0, 0.3]]) {
        const saw = ctx.createOscillator();
        saw.type = "sawtooth";
        saw.detune.value = detune;
        pitchOf(saw, mult);
        const sg = ctx.createGain();
        sg.gain.value = lvl;
        saw.connect(sg).connect(filt);
        saw.start(time);
        saw.stop(time + dur2 + 0.15);

        if (mult === 1) {
          const pulse = ctx.createOscillator();
          pulse.type = "square";
          pulse.detune.value = detune;
          pitchOf(pulse, mult);
          const pg = ctx.createGain();
          pg.gain.value = lvl * 0.55;
          // Modulating this gain at audio-adjacent rate against the saw
          // is what carves the flat, width-varying segments.
          const pwm = ctx.createOscillator();
          pwm.frequency.value = 7.5 + Math.random() * 3;
          const pwmAmt = ctx.createGain();
          pwmAmt.gain.value = lvl * 0.35;
          pwm.connect(pwmAmt).connect(pg.gain);
          pwm.start(time);
          pwm.stop(time + dur2 + 0.15);
          pulse.connect(pg).connect(filt);
          pulse.start(time);
          pulse.stop(time + dur2 + 0.15);
        }
      }
      return;
    }

    if (flavor === "ms20") {
      // The Korg MS-20's filter is a Sallen-Key design rather than a
      // Moog-style transistor ladder, and it is famously aggressive: it
      // self-oscillates in both lowpass and highpass, and it avoids the
      // volume drop the ladder suffers when resonance is pushed. The
      // sound is the filter screaming, not the oscillator.
      const dur2 = Math.max(dur, 0.25);
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = Math.max(80, freq * 0.7);
      hp.Q.value = 6;
      const lpf = ctx.createBiquadFilter();
      lpf.type = "lowpass";
      lpf.Q.value = 18;   // right at the edge of self-oscillation
      lpf.frequency.setValueAtTime(Math.min(9000, freq * 9), time);
      lpf.frequency.exponentialRampToValueAtTime(Math.max(160, freq * 1.6), time + dur2 * 0.7);
      // Sallen-Key resonance overdrives rather than thinning out.
      const drive = ctx.createWaveShaper();
      drive.curve = this.makeDistortionCurve(12);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.42, time + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur2);
      hp.connect(lpf).connect(drive).connect(gain).connect(dest);
      for (const [type, detune] of [["sawtooth", 0], ["square", -8]]) {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        osc.detune.value = detune;
        osc.connect(hp);
        osc.start(time);
        osc.stop(time + dur2 + 0.1);
      }
      return;
    }

    if (flavor === "d50") {
      // Roland D-50 "LA synthesis": memory was expensive in 1987, so
      // rather than sample a whole instrument Roland sampled only the
      // ATTACK TRANSIENT - the hardest part of a sound to program - and
      // let ordinary subtractive synthesis carry the sustain. A short,
      // bright, 8-bit-ish burst spliced onto a synth body is literally
      // the architecture, and it is why D-50 patches sound simultaneously
      // synthetic and oddly real.
      const dur2 = Math.max(dur, 0.4);
      // The "PCM" attack: a very short bright inharmonic transient.
      const trans = ctx.createBufferSource();
      trans.buffer = this.makeNoiseBuffer(0.06);
      const tBp = ctx.createBiquadFilter();
      tBp.type = "bandpass";
      tBp.frequency.value = Math.min(7000, freq * 6);
      tBp.Q.value = 1.2;
      const crush = ctx.createWaveShaper();
      crush.curve = this.makeBitcrushCurve(26);   // 8-bit-era transients
      const tg = ctx.createGain();
      tg.gain.setValueAtTime(vel * 0.55, time);
      tg.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
      trans.connect(tBp).connect(crush).connect(tg).connect(dest);
      trans.start(time);
      trans.stop(time + 0.07);
      // The subtractive body that takes over.
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(4200, time);
      lp.frequency.exponentialRampToValueAtTime(1600, time + dur2);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.4, time + 0.05);
      gain.gain.setValueAtTime(vel * 0.4, time + dur2 * 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur2 + 0.15);
      lp.connect(gain).connect(dest);
      for (const [ratio, type, lvl] of [[1, "sawtooth", 0.5], [2, "sine", 0.22], [3.01, "sine", 0.1]]) {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq * ratio;
        const g = ctx.createGain();
        g.gain.value = lvl;
        osc.connect(g).connect(lp);
        osc.start(time);
        osc.stop(time + dur2 + 0.2);
      }
      return;
    }

    if (flavor === "prophet" || flavor === "obxa") {
      // Two American poly-synth lead voices. The Prophet-5's signature is
      // POLY-MOD - routing oscillator B and the filter envelope into
      // oscillator A's frequency, which gives that hard, brassy, slightly
      // unstable sweep no simple saw stack has. The Oberheim OB-Xa is
      // thicker and blunter: two discrete voice boards per key in unison,
      // which is the "Jump" brass sound.
      const isProphet = flavor === "prophet";
      const dur2 = Math.max(dur, 0.3);
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.Q.value = isProphet ? 4 : 2;
      filt.frequency.setValueAtTime(Math.min(8000, freq * 10), time);
      filt.frequency.exponentialRampToValueAtTime(Math.max(320, freq * 3), time + (isProphet ? 0.35 : 0.55));
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.45, time + (isProphet ? 0.014 : 0.03));
      gain.gain.setValueAtTime(vel * 0.45, time + dur2 * 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur2 + 0.1);
      filt.connect(gain).connect(dest);
      const spread = isProphet ? [0, -7] : [-16, -5, 6, 17];
      for (const detune of spread) {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = freq;
        osc.detune.value = detune;
        const g = ctx.createGain();
        g.gain.value = isProphet ? 0.42 : 0.28;
        osc.connect(g).connect(filt);
        osc.start(time);
        osc.stop(time + dur2 + 0.15);
      }
      if (isProphet) {
        // Poly-mod: oscillator B modulating oscillator A's pitch.
        const modOsc = ctx.createOscillator();
        modOsc.type = "sine";
        modOsc.frequency.value = freq * 0.5;
        const modAmt = ctx.createGain();
        modAmt.gain.setValueAtTime(freq * 0.07, time);
        modAmt.gain.exponentialRampToValueAtTime(freq * 0.004, time + 0.3);
        modOsc.connect(modAmt).connect(filt.frequency);
        modOsc.start(time);
        modOsc.stop(time + dur2 + 0.1);
      }
      return;
    }

    if (flavor === "phasedist") {
      // Casio CZ phase distortion: instead of filtering a rich wave, the
      // oscillator's own READ RATE through the wavetable is warped -
      // sped up early in the cycle and slowed later - which produces a
      // filter-like sweep with no filter at all. The giveaway is that the
      // brightness sweeps while the level stays completely flat, which no
      // analog filter does.
      const dur2 = Math.max(dur, 0.3);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.45, time + 0.01);
      gain.gain.setValueAtTime(vel * 0.45, time + dur2 * 0.85);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur2 + 0.06);
      gain.connect(dest);
      // Warping the read rate shows up as a harmonic whose level sweeps
      // independently of the fundamental - modelled directly.
      const base = ctx.createOscillator();
      base.type = "sine";
      base.frequency.value = freq;
      const bg = ctx.createGain();
      bg.gain.value = 0.6;
      base.connect(bg).connect(gain);
      base.start(time);
      base.stop(time + dur2 + 0.1);
      for (const [ratio, peak] of [[2, 0.45], [3, 0.34], [4, 0.22], [5, 0.14], [6, 0.08]]) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq * ratio;
        const g = ctx.createGain();
        g.gain.setValueAtTime(peak, time);
        g.gain.exponentialRampToValueAtTime(0.0008, time + dur2 * (0.9 / (ratio * 0.35)));
        osc.connect(g).connect(gain);
        osc.start(time);
        osc.stop(time + dur2 + 0.1);
      }
      return;
    }

    if (flavor === "theremin") {
      // The only instrument played without being touched. Because there
      // are no frets, keys or holes, pitch is CONTINUOUS: every note is
      // arrived at by sliding, and the player's hand is never perfectly
      // still, so there is always vibrato. The waveform itself is close
      // to a pure sine (it's a heterodyne oscillator), which means the
      // portamento and the vibrato are essentially the entire sound.
      const osc = ctx.createOscillator();
      osc.type = "sine";
      const from = freq * (Math.random() < 0.5 ? 0.78 : 1.26);
      osc.frequency.setValueAtTime(from, time);
      osc.frequency.exponentialRampToValueAtTime(freq, time + Math.min(0.22, dur * 0.5));
      const vib = ctx.createOscillator();
      vib.frequency.value = 5.5;
      const vibAmt = ctx.createGain();
      vibAmt.gain.setValueAtTime(0.0001, time);
      vibAmt.gain.linearRampToValueAtTime(freq * 0.022, time + 0.2);
      vib.connect(vibAmt).connect(osc.frequency);
      vib.start(time);
      vib.stop(time + dur + 0.2);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.55, time + 0.09);
      gain.gain.setValueAtTime(vel * 0.55, time + dur * 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur + 0.15);
      // A touch of second harmonic - a real theremin is not a lab sine.
      const h2 = ctx.createOscillator();
      h2.type = "sine";
      h2.frequency.value = freq * 2;
      const h2g = ctx.createGain();
      h2g.gain.value = 0.12;
      h2.connect(h2g).connect(gain);
      h2.start(time);
      h2.stop(time + dur + 0.2);
      osc.connect(gain).connect(dest);
      osc.start(time);
      osc.stop(time + dur + 0.2);
      return;
    }

    if (flavor === "panflute") {
      // An end-blown stopped pipe. A stopped pipe suppresses even
      // harmonics, so the tone is hollow and dominated by odd partials,
      // and the chiff - the burst of turbulent air noise before the pipe
      // speaks - is proportionally much louder than on a concert flute.
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.6, time + 0.05);
      gain.gain.setValueAtTime(vel * 0.6, time + dur * 0.75);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur + 0.1);
      gain.connect(dest);
      for (const [ratio, lvl] of [[1, 1], [3, 0.16], [5, 0.05]]) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq * ratio;
        const g = ctx.createGain();
        g.gain.value = lvl;
        osc.connect(g).connect(gain);
        osc.start(time);
        osc.stop(time + dur + 0.15);
      }
      const chiff = ctx.createBufferSource();
      chiff.buffer = this.makeNoiseBuffer(0.12);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = freq * 2.2;
      bp.Q.value = 1.4;
      const cg = ctx.createGain();
      cg.gain.setValueAtTime(vel * 0.4, time);
      cg.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      chiff.connect(bp).connect(cg).connect(dest);
      chiff.start(time);
      chiff.stop(time + 0.12);
      return;
    }

    if (flavor === "harmonica") {
      // A free-reed instrument played by breath, in both directions -
      // blow and draw. Its two defining qualities are a bright, buzzy,
      // odd-harmonic reed tone and the fact that most harmonica notes
      // are BENT into place, since bending is how a diatonic harp reaches
      // the notes it does not have.
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq * 0.965, time);
      osc.frequency.linearRampToValueAtTime(freq, time + 0.07);
      const vib = ctx.createOscillator();
      vib.frequency.value = 6.4;
      const vibAmt = ctx.createGain();
      vibAmt.gain.setValueAtTime(0.0001, time);
      vibAmt.gain.linearRampToValueAtTime(freq * 0.011, time + 0.18);
      vib.connect(vibAmt).connect(osc.frequency);
      vib.start(time);
      vib.stop(time + dur + 0.15);
      const reed = ctx.createBiquadFilter();
      reed.type = "peaking";
      reed.frequency.value = 1700;
      reed.Q.value = 1.2;
      reed.gain.value = 8;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 4200;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.42, time + 0.04);
      gain.gain.setValueAtTime(vel * 0.42, time + dur * 0.75);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur + 0.1);
      osc.connect(reed).connect(lp).connect(gain).connect(dest);
      osc.start(time);
      osc.stop(time + dur + 0.15);
      // Breath around the reed.
      const breath = ctx.createBufferSource();
      breath.buffer = this.makeNoiseBuffer(Math.min(dur + 0.2, 1.5));
      const bhp = ctx.createBiquadFilter();
      bhp.type = "highpass";
      bhp.frequency.value = 3000;
      const bg = ctx.createGain();
      bg.gain.setValueAtTime(0.0001, time);
      bg.gain.linearRampToValueAtTime(vel * 0.06, time + 0.05);
      bg.gain.linearRampToValueAtTime(0.0001, time + dur);
      breath.connect(bhp).connect(bg).connect(dest);
      breath.start(time);
      breath.stop(time + dur + 0.1);
      return;
    }

    if (flavor === "ocarina") {
      // A vessel flute: the whole enclosed cavity resonates as a
      // Helmholtz resonator rather than as a pipe, so it has essentially
      // NO overtones at all - close to a pure sine, which is why an
      // ocarina sounds so simple and so instantly recognisable.
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const vib = ctx.createOscillator();
      vib.frequency.value = 4.8;
      const vibAmt = ctx.createGain();
      vibAmt.gain.setValueAtTime(0.0001, time);
      vibAmt.gain.linearRampToValueAtTime(freq * 0.009, time + 0.25);
      vib.connect(vibAmt).connect(osc.frequency);
      vib.start(time);
      vib.stop(time + dur + 0.15);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.6, time + 0.045);
      gain.gain.setValueAtTime(vel * 0.6, time + dur * 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur + 0.1);
      osc.connect(gain).connect(dest);
      osc.start(time);
      osc.stop(time + dur + 0.15);
      const chiff = ctx.createBufferSource();
      chiff.buffer = this.makeNoiseBuffer(0.05);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = freq * 3;
      const cg = ctx.createGain();
      cg.gain.setValueAtTime(vel * 0.16, time);
      cg.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      chiff.connect(bp).connect(cg).connect(dest);
      chiff.start(time);
      chiff.stop(time + 0.06);
      return;
    }

    if (flavor === "flute") {
      // A flute's tone is almost a pure fundamental with very few upper
      // harmonics, colored throughout by breath noise (not just an attack
      // transient) - continuous filtered noise mixed under a sine, a slow
      // attack, and vibrato that only kicks in once the note has settled,
      // the way real breath support and embouchure actually behave.
      const noteDur = Math.max(dur, 0.35);
      const envelope = ctx.createGain();
      envelope.gain.setValueAtTime(0.0001, time);
      envelope.gain.linearRampToValueAtTime(vel * 0.8, time + 0.09);
      envelope.gain.exponentialRampToValueAtTime(0.001, time + noteDur);
      envelope.connect(dest);

      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);
      const vibrato = ctx.createOscillator();
      vibrato.frequency.value = 5;
      const vibratoGain = ctx.createGain();
      vibratoGain.gain.setValueAtTime(0, time);
      vibratoGain.gain.linearRampToValueAtTime(freq * 0.006, time + 0.25);
      vibrato.connect(vibratoGain).connect(osc.frequency);
      osc.connect(envelope);

      const breath = ctx.createBufferSource();
      breath.buffer = this.makeNoiseBuffer(noteDur + 0.1);
      const breathFilter = ctx.createBiquadFilter();
      breathFilter.type = "bandpass";
      breathFilter.frequency.value = freq * 2;
      breathFilter.Q.value = 0.7;
      const breathGain = ctx.createGain();
      breathGain.gain.value = vel * 0.12;
      breath.connect(breathFilter).connect(breathGain).connect(envelope);

      osc.start(time);
      vibrato.start(time);
      breath.start(time);
      osc.stop(time + noteDur + 0.1);
      vibrato.stop(time + noteDur + 0.1);
      breath.stop(time + noteDur + 0.1);
      return;
    }

    if (flavor === "bell") {
      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(freq, time);
      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(freq * 2.76, time);
      const gain1 = ctx.createGain();
      gain1.gain.setValueAtTime(vel, time);
      gain1.gain.exponentialRampToValueAtTime(0.001, time + dur);
      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(vel * 0.3, time);
      gain2.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.4);
      osc1.connect(gain1).connect(dest);
      osc2.connect(gain2).connect(dest);
      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + dur + 0.1);
      osc2.stop(time + dur + 0.1);
      return;
    }

    if (flavor === "supersaw") {
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(5000, time);
      filter.frequency.exponentialRampToValueAtTime(900, time + dur);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 0.55, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      filter.connect(gain).connect(dest);
      this.addUnisonVoices(freq, 7, 16, "sawtooth", filter, time, time + dur + 0.05);
      return;
    }

    if (flavor === "pluck") {
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, time);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(4500, time);
      filter.frequency.exponentialRampToValueAtTime(500, time + 0.18);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + Math.min(dur, 0.22));
      osc.connect(filter).connect(gain).connect(dest);
      osc.start(time);
      osc.stop(time + Math.min(dur, 0.22) + 0.05);
      return;
    }

    if (flavor === "sine") {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.9, time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc.connect(gain).connect(dest);
      osc.start(time);
      osc.stop(time + dur + 0.05);
      return;
    }

    if (flavor === "brasslead") {
      // Saw through a resonant bandpass emphasis for a brassy synth-lead -
      // sits between "supersaw" and a real horn tonally.
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, time);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1900;
      bp.Q.value = 1.8;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc.connect(bp).connect(gain).connect(dest);
      osc.start(time);
      osc.stop(time + dur + 0.05);
      return;
    }

    if (flavor === "fm") {
      // Simple two-operator FM: a modulator oscillator drives the carrier's
      // frequency for the metallic/bell-ish timbres classic FM synths make.
      const carrier = ctx.createOscillator();
      carrier.type = "sine";
      carrier.frequency.setValueAtTime(freq, time);
      const modulator = ctx.createOscillator();
      modulator.type = "sine";
      modulator.frequency.setValueAtTime(freq * 2.01, time);
      const modGain = ctx.createGain();
      modGain.gain.setValueAtTime(freq * 1.5, time);
      modGain.gain.exponentialRampToValueAtTime(freq * 0.1, time + dur);
      modulator.connect(modGain).connect(carrier.frequency);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      carrier.connect(gain).connect(dest);
      carrier.start(time);
      modulator.start(time);
      carrier.stop(time + dur + 0.05);
      modulator.stop(time + dur + 0.05);
      return;
    }

    if (flavor === "whistle") {
      // A whistled melody is almost a pure sine - a human whistle has
      // barely any harmonics at all, which is why it reads as so "clean"
      // next to any synth lead. What sells it as a person rather than a
      // test tone is the performance: a small pitch scoop up into each
      // note, and vibrato that FADES IN as the note is held (a whistler
      // can't apply vibrato instantly). The pop-whistle-hook sound of
      // "Young Folks," "Moves Like Jagger," or "Wind of Change."
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq * 0.94, time);
      osc.frequency.exponentialRampToValueAtTime(freq, time + 0.07);
      const vibrato = ctx.createOscillator();
      vibrato.frequency.value = 5.2;
      const vibratoGain = ctx.createGain();
      vibratoGain.gain.setValueAtTime(0.0001, time);
      vibratoGain.gain.linearRampToValueAtTime(freq * 0.011, time + Math.min(dur, 0.3));
      vibrato.connect(vibratoGain).connect(osc.frequency);
      // A trace of breath noise under the tone - the air actually moving.
      const breath = ctx.createBufferSource();
      breath.buffer = this.makeNoiseBuffer(dur + 0.05);
      const breathBp = ctx.createBiquadFilter();
      breathBp.type = "bandpass";
      breathBp.frequency.value = freq * 2;
      breathBp.Q.value = 1.5;
      const breathGain = ctx.createGain();
      breathGain.gain.setValueAtTime(0.0001, time);
      breathGain.gain.linearRampToValueAtTime(vel * 0.05, time + 0.05);
      breathGain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      breath.connect(breathBp).connect(breathGain).connect(dest);
      breath.start(time);
      breath.stop(time + dur + 0.05);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.75, time + 0.04);
      gain.gain.setValueAtTime(vel * 0.75, time + Math.max(0.04, dur - 0.06));
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc.connect(gain).connect(dest);
      osc.start(time);
      osc.stop(time + dur + 0.05);
      vibrato.start(time);
      vibrato.stop(time + dur + 0.05);
      return;
    }

    if (flavor === "chip") {
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, time);
      const vibrato = ctx.createOscillator();
      vibrato.frequency.value = 9;
      const vibratoGain = ctx.createGain();
      vibratoGain.gain.value = freq * 0.015;
      vibrato.connect(vibratoGain).connect(osc.frequency);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 0.7, time);
      gain.gain.setValueAtTime(vel * 0.7, time + Math.max(0, dur - 0.04));
      gain.gain.linearRampToValueAtTime(0.0001, time + dur);
      osc.connect(gain).connect(dest);
      osc.start(time);
      osc.stop(time + dur + 0.05);
      vibrato.start(time);
      vibrato.stop(time + dur + 0.05);
      return;
    }

    const osc = ctx.createOscillator();
    osc.type = flavor === "square" ? "square" : "sawtooth";
    osc.frequency.setValueAtTime(freq, time);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(flavor === "square" ? 2400 : 4000, time);
    filter.frequency.exponentialRampToValueAtTime(600, time + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vel, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(filter).connect(gain).connect(dest);
    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  playPadVoice(time, freq, durationSeconds, vel, flavor) {
    if (this.playSampleFlavor("pad", flavor, time, vel, freq, durationSeconds)) return;
    const ctx = this.ctx;
    const dest = this.dest("pad");

    // Pads differ mostly in how many detuned voices there are, how fast they
    // fade in, and how the filter sits - so these are that space, sampled at
    // six real points rather than six names for one sound.
    const PAD_SHAPES = {
      strings2: { voices: 7, detune: 11, type: "sawtooth", cutoff: 3200, attack: 0.55, q: 0.7 },
      brassy: { voices: 4, detune: 7, type: "sawtooth", cutoff: 2400, attack: 0.12, q: 2.2 },
      breath: { voices: 5, detune: 16, type: "triangle", cutoff: 1800, attack: 0.75, q: 0.6 },
      crystal: { voices: 3, detune: 4, type: "sine", cutoff: 9000, attack: 0.25, q: 0.8 },
      analogwarm: { voices: 4, detune: 9, type: "sawtooth", cutoff: 1500, attack: 0.35, q: 1.4 },
      sweep: { voices: 6, detune: 13, type: "sawtooth", cutoff: 600, attack: 0.2, q: 6, open: 5200 },
      // A very wide, very slow string wash - the biggest pad here.
      wash: { voices: 9, detune: 24, type: "sawtooth", cutoff: 2600, attack: 1.2, q: 0.5 },
      // Low and dark, sitting under everything rather than over it.
      lowpad: { voices: 4, detune: 6, type: "triangle", cutoff: 900, attack: 0.6, q: 1.1 },
      // Bright, thin and glassy, an octave-ish above where a pad usually sits.
      shimmer: { voices: 5, detune: 9, type: "sine", cutoff: 12000, attack: 0.4, q: 0.6 },
      // Square waves detuned wide: the hollow, slightly cold 80s pad.
      hollow: { voices: 5, detune: 18, type: "square", cutoff: 2200, attack: 0.5, q: 1.6 },
      // Opens slowly across the whole note, so it evolves rather than sits.
      evolving: { voices: 6, detune: 14, type: "sawtooth", cutoff: 400, attack: 0.9, q: 3.5, open: 6500 },
      // Almost no detune and a fast attack: closer to an organ than a pad,
      // which is what a lot of house records actually use.
      tight: { voices: 2, detune: 3, type: "sawtooth", cutoff: 3400, attack: 0.06, q: 1 },
    };
    if (PAD_SHAPES[flavor]) {
      const p = PAD_SHAPES[flavor];
      // Own duration: this branch sits above the function's own `const dur`.
      const dur = Math.min(durationSeconds, 3.5);
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.Q.value = p.q;
      filt.frequency.setValueAtTime(p.cutoff, time);
      // A "sweep" pad is defined by the filter opening across the note.
      if (p.open) filt.frequency.linearRampToValueAtTime(p.open, time + dur * 0.85);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, time);
      g.gain.linearRampToValueAtTime(vel * 0.5, time + Math.min(p.attack, dur * 0.5));
      g.gain.setValueAtTime(vel * 0.5, time + Math.max(0.05, dur - 0.25));
      g.gain.exponentialRampToValueAtTime(0.001, time + dur);
      filt.connect(g).connect(dest);
      for (let i = 0; i < p.voices; i++) {
        const o = ctx.createOscillator();
        o.type = p.type;
        const spread = (i - (p.voices - 1) / 2) * p.detune;
        o.frequency.setValueAtTime(freq * Math.pow(2, spread / 1200), time);
        o.connect(filt);
        o.start(time); o.stop(time + dur + 0.1);
      }
      return;
    }
    const attack = 0.25;
    const dur = Math.max(durationSeconds, 0.6);

    if (flavor === "solina") {
      // The same string-machine ensemble as the strings track, voiced as
      // a pad: slower attack, longer tail.
      const ens = this.makeSolinaEnsemble(dest);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.45, time + 0.35);
      gain.gain.setValueAtTime(vel * 0.45, time + dur * 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur + 0.5);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 3600;
      gain.connect(lp).connect(ens);
      for (const [ratio, lvl] of [[1, 1], [2, 0.4], [0.5, 0.3]]) {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = freq * ratio;
        const g = ctx.createGain();
        g.gain.value = lvl;
        osc.connect(g).connect(gain);
        osc.start(time);
        osc.stop(time + dur + 0.6);
      }
      return;
    }

    if (flavor === "jupiter8" || flavor === "polysix") {
      // Two lush analog polys. The Jupiter-8's signature is that it can
      // stack every voice in UNISON with per-voice detune, so a single
      // key is eight oscillators spread apart - enormous and slightly
      // seasick. The Korg Polysix is smaller and softer, and its
      // character comes mostly from its onboard ensemble chorus rather
      // than from oscillator count.
      const big = flavor === "jupiter8";
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.Q.value = big ? 2.5 : 1.4;
      filt.frequency.setValueAtTime(700, time);
      filt.frequency.linearRampToValueAtTime(big ? 4200 : 3000, time + 0.6);
      filt.frequency.linearRampToValueAtTime(big ? 2000 : 1600, time + dur);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.4, time + (big ? 0.2 : 0.3));
      gain.gain.setValueAtTime(vel * 0.4, time + dur * 0.82);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur + 0.45);
      // The Polysix ran everything through its own chorus - reuse the
      // three-tap ensemble, at lower depth than a full string machine.
      const out = big ? dest : this.makeSolinaEnsemble(dest, 0.55);
      filt.connect(gain).connect(out);
      const spread = big ? [-24, -14, -5, 4, 13, 23] : [-8, 0, 7];
      for (const detune of spread) {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = freq;
        osc.detune.value = detune;
        const g = ctx.createGain();
        g.gain.value = big ? 0.22 : 0.4;
        osc.connect(g).connect(filt);
        osc.start(time);
        osc.stop(time + dur + 0.5);
      }
      const sub = ctx.createOscillator();
      sub.type = "square";
      sub.frequency.value = freq / 2;
      const sg = ctx.createGain();
      sg.gain.value = big ? 0.18 : 0.12;
      sub.connect(sg).connect(filt);
      sub.start(time);
      sub.stop(time + dur + 0.5);
      return;
    }

    if (flavor === "ppgwave") {
      // PPG Wave: a WAVETABLE synth, not an analog one. Its oscillator
      // scans through a table of very different single-cycle waveforms,
      // so the timbre morphs continuously in a way no filter sweep can
      // imitate - the harmonics do not just roll off, they rearrange.
      // That digital, glassy, slightly gritty movement is the sound of
      // mid-80s Depeche Mode and Tangerine Dream.
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.4, time + 0.18);
      gain.gain.setValueAtTime(vel * 0.4, time + dur * 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur + 0.35);
      // 8-bit wavetable ROMs - the grit is part of the instrument.
      const crush = ctx.createWaveShaper();
      crush.curve = this.makeBitcrushCurve(30);
      gain.connect(crush).connect(dest);
      // Scanning the table = each harmonic's level moving independently
      // on its own slow path, which is exactly what is modelled here.
      const partials = [[1, 1], [2, 0.5], [3, 0.35], [4, 0.28], [5, 0.2], [6, 0.15], [7, 0.12], [8, 0.1]];
      partials.forEach(([ratio, lvl], i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq * ratio;
        const g = ctx.createGain();
        const phase = (i / partials.length) * Math.PI * 2;
        g.gain.setValueAtTime(lvl * (0.35 + 0.65 * Math.abs(Math.sin(phase))), time);
        // Each partial crosses the table at a slightly different rate.
        g.gain.linearRampToValueAtTime(lvl * (0.35 + 0.65 * Math.abs(Math.cos(phase))), time + dur * 0.5);
        g.gain.linearRampToValueAtTime(lvl * (0.3 + 0.5 * Math.abs(Math.sin(phase * 1.7))), time + dur);
        osc.connect(g).connect(gain);
        osc.start(time);
        osc.stop(time + dur + 0.4);
      });
      return;
    }

    if (flavor === "cs80") {
      // The Yamaha CS-80's signature is that it is genuinely two complete
      // synthesizers stacked per key, detuned against each other, with a
      // slow "sub-oscillator" style beating and a very characteristic
      // resonant lowpass that opens over the note. Vangelis's "Blade
      // Runner" sound is essentially that plus the CS-80's ring modulator
      // -like brightness, and the slow filter opening is what makes it
      // feel like the sound is inhaling.
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.setValueAtTime(500, time);
      filt.frequency.linearRampToValueAtTime(3200, time + Math.min(1.4, dur * 0.7));
      filt.frequency.linearRampToValueAtTime(1400, time + dur);
      filt.Q.value = 3.5;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.4, time + 0.3);
      gain.gain.setValueAtTime(vel * 0.4, time + dur * 0.85);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur + 0.4);
      filt.connect(gain).connect(dest);
      // Two layers, each with its own detune - the "two synths per key".
      for (const [type, detune, lvl] of [["sawtooth", -9, 0.5], ["sawtooth", 8, 0.5], ["square", -4, 0.25]]) {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        osc.detune.value = detune;
        const g = ctx.createGain();
        g.gain.value = lvl;
        osc.connect(g).connect(filt);
        osc.start(time);
        osc.stop(time + dur + 0.5);
      }
      return;
    }

    if (flavor === "voxhumana") {
      // "Vox Humana" - the breathy choir-ish preset every 70s/80s string
      // machine and combo organ had. It is not a real voice model: it is a
      // narrow formant-ish bandpass over detuned saws plus a slow tremolo,
      // and that specific fakeness is the sound people actually want.
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.42, time + 0.22);
      gain.gain.setValueAtTime(vel * 0.42, time + dur * 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur + 0.35);
      const formant = ctx.createBiquadFilter();
      formant.type = "bandpass";
      formant.frequency.value = 780;
      formant.Q.value = 1.6;
      const trem = ctx.createOscillator();
      trem.frequency.value = 5.6;
      const tremAmt = ctx.createGain();
      tremAmt.gain.value = 0.12;
      const tremGain = ctx.createGain();
      tremGain.gain.value = 0.88;
      trem.connect(tremAmt).connect(tremGain.gain);
      trem.start(time);
      trem.stop(time + dur + 0.4);
      gain.connect(formant).connect(tremGain).connect(dest);
      for (const detune of [-11, 0, 10]) {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = freq;
        osc.detune.value = detune;
        const g = ctx.createGain();
        g.gain.value = 0.4;
        osc.connect(g).connect(gain);
        osc.start(time);
        osc.stop(time + dur + 0.45);
      }
      return;
    }

    if (flavor === "glass") {
      for (const ratio of [1, 2, 4.02]) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq * ratio, time);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime((vel * (ratio === 1 ? 0.7 : 0.2)) / 1, time + attack);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
        osc.connect(gain).connect(dest);
        osc.start(time);
        osc.stop(time + dur + 0.1);
      }
      return;
    }

    if (flavor === "juno") {
      // The Roland Juno-106's signature isn't really its oscillator (a
      // plain analog saw) - it's the built-in BBD (bucket-brigade device)
      // chorus circuit almost every classic Juno pad patch runs through,
      // which is what actually gives it that lush, wide, shimmering
      // character. Modeled as the real DSP a chorus circuit uses: a short
      // delay line whose delay time is itself slowly modulated by an LFO,
      // mixed back in with the dry signal - not just a second detuned
      // oscillator the way every other pad flavor here fakes "width."
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, time);
      const envelope = ctx.createGain();
      envelope.gain.setValueAtTime(0.0001, time);
      envelope.gain.linearRampToValueAtTime(vel * 0.6, time + attack);
      envelope.gain.setValueAtTime(vel * 0.6, time + Math.max(attack, dur - 0.2));
      envelope.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc.connect(envelope).connect(dest);

      const delay = ctx.createDelay(0.05);
      delay.delayTime.value = 0.018;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.6;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.006;
      lfo.connect(lfoGain).connect(delay.delayTime);
      const chorusGain = ctx.createGain();
      chorusGain.gain.value = 0.8;
      envelope.connect(delay).connect(chorusGain).connect(dest);

      osc.start(time);
      lfo.start(time);
      osc.stop(time + dur + 0.1);
      lfo.stop(time + dur + 0.1);
      return;
    }

    if (flavor === "choir") {
      // Sawtooth ensemble through vowel-formant bandpasses, like the vocal
      // synth but slower-attack and stacked for a pad-length "aah" choir.
      const voices = 3;
      const envelope = ctx.createGain();
      envelope.gain.setValueAtTime(0.0001, time);
      envelope.gain.linearRampToValueAtTime(vel * 0.8, time + 0.35);
      envelope.gain.exponentialRampToValueAtTime(0.001, time + dur);
      envelope.connect(dest);
      for (let v = 0; v < voices; v++) {
        const detune = (v / (voices - 1) - 0.5) * 0.02;
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq * (1 + detune), time);
        for (const [freqCenter, level] of [[700, 1], [1200, 0.4]]) {
          const bp = ctx.createBiquadFilter();
          bp.type = "bandpass";
          bp.frequency.value = freqCenter;
          bp.Q.value = 8;
          const g = ctx.createGain();
          g.gain.value = level / voices;
          osc.connect(bp).connect(g).connect(envelope);
        }
        osc.start(time);
        osc.stop(time + dur + 0.1);
      }
      return;
    }

    const detunes = flavor === "ensemble" ? [0, 0.006, -0.006] : flavor === "airy" ? [0] : flavor === "dark" ? [0, 0.005] : [0, 0.004];
    const type = flavor === "airy" ? "sine" : "sawtooth";

    for (const d of detunes) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq * (1 + d), time);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(flavor === "airy" ? 2200 : flavor === "dark" ? 900 : 1500, time);
      if (flavor === "dark") filter.frequency.exponentialRampToValueAtTime(280, time + dur);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel / detunes.length, time + attack);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc.connect(filter).connect(gain).connect(dest);
      osc.start(time);
      osc.stop(time + dur + 0.1);
    }
  }

  playStabVoice(time, freq, durationSeconds, vel, flavor) {
    if (this.playSampleFlavor("stab", flavor, time, vel, freq, durationSeconds)) return;
    const ctx = this.ctx;
    const dest = this.dest("stab");
    const dur = Math.min(durationSeconds, 0.5);

    // A stab is a chord played as one short percussive event, so most of
    // these are an existing lead timbre pushed through the stab envelope
    // rather than a new oscillator design - which is exactly how a producer
    // makes one on hardware.
    const STAB_AS_LEAD = {
      "saw-chord": "saw", "supersaw-chord": "supersaw", "fm-chord": "fm",
      "sine-chord": "sine", "pluck-stab": "pluck", "hoover-chord": "hoover",
      // These became possible only once playLeadVoiceTo stopped ignoring the
      // flavor it was handed - before that every entry in this table produced
      // one identical bell, so adding more would have added more of nothing.
      "ms20-chord": "ms20", "d50-chord": "d50", "prophet-chord": "prophet",
      "obxa-chord": "obxa", "chip-chord": "chip", "phase-chord": "phasedist",
      "square-lead-chord": "square", "brass-lead-chord": "brasslead",
    };
    if (STAB_AS_LEAD[flavor]) {
      this.playLeadVoiceTo(time, freq, dur, vel, STAB_AS_LEAD[flavor], dest);
      return;
    }
    if (flavor === "vox-chord") {
      // The house "vocal stab": a sung chord chopped to a hit. Formants make
      // it read as a voice; the very fast attack and hard cut make it a stab
      // rather than a pad.
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, time);
      g.gain.linearRampToValueAtTime(vel * 0.8, time + 0.012);
      g.gain.exponentialRampToValueAtTime(0.001, time + Math.min(dur, 0.34));
      g.connect(dest);
      for (const [f, q, lvl] of [[520, 8, 1], [1180, 10, 0.55], [2600, 12, 0.25]]) {
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = q;
        const bg = ctx.createGain(); bg.gain.value = lvl;
        bp.connect(bg).connect(g);
        for (const mult of [1, 2, 3, 4]) {
          const o = ctx.createOscillator();
          o.type = "sawtooth";
          o.frequency.setValueAtTime(freq * mult * 0.5, time);
          o.connect(bp);
          o.start(time); o.stop(time + dur + 0.05);
        }
      }
      return;
    }
    if (flavor === "piano-chord") {
      // A piano chord clipped short - the boom-bap loop staple.
      this.playPianoVoice(time, freq, Math.min(dur, 0.4), vel, "grand");
      return;
    }

    if (flavor === "bell-chord") {
      this.playLeadVoiceTo(time, freq, dur, vel, "bell", dest);
      return;
    }
    if (flavor === "orchhit") {
      // The Fairlight CMI's "ORCH5" sample - a full orchestra hitting one
      // unison note, lifted from Stravinsky's Firebird - launched by
      // "Planet Rock" (1982) into decades of hip-hop/pop use; easily the
      // most famous single sample preset ever shipped. Synthesized as what
      // the sample actually is: a broadband multi-octave unison stack
      // (strings+brass character from detuned saws across three octaves)
      // with a fast percussive decay and a closing lowpass sweep standing
      // in for the abrupt room-truncated sample tail.
      const hitDur = Math.min(dur, 0.4);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 1.1, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + hitDur);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(5200, time);
      lp.frequency.exponentialRampToValueAtTime(500, time + hitDur);
      lp.connect(gain).connect(dest);
      for (const [ratio, level] of [[0.5, 0.6], [1, 1], [1.007, 0.7], [2, 0.5], [2.01, 0.35]]) {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq * ratio, time);
        const g = ctx.createGain();
        g.gain.value = level / 3;
        osc.connect(g).connect(lp);
        osc.start(time);
        osc.stop(time + hitDur + 0.05);
      }
      return;
    }
    if (flavor === "brass-chord") {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, time);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1600;
      bp.Q.value = 1.5;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc.connect(bp).connect(gain).connect(dest);
      osc.start(time);
      osc.stop(time + dur + 0.05);
      return;
    }
    if (flavor === "organ-chord") {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.75, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      gain.connect(dest);
      for (const [ratio, level] of [[1, 1], [2, 0.5], [3, 0.3]]) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq * ratio, time);
        const g = ctx.createGain();
        g.gain.value = level;
        osc.connect(g).connect(gain);
        osc.start(time);
        osc.stop(time + dur + 0.05);
      }
      return;
    }
    if (flavor === "string-chord") {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vel * 0.7, time + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 2200;
      filter.connect(gain).connect(dest);
      for (const detune of [0, 0.008, -0.008]) {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq * (1 + detune), time);
        osc.connect(filter);
        osc.start(time);
        osc.stop(time + dur + 0.05);
      }
      return;
    }
    if (flavor === "pluck-chord") {
      // A genuinely plucked chord stab, rather than what this was: the name
      // had no branch at all, so it fell through to the sawtooth default
      // below and was the same sound as saw-chord. Measured at a third the
      // distance of any other pair on this track, which is what gave it away.
      //
      // A plucked string is a physical model, not a filtered oscillator, so
      // this uses the same Karplus-Strong routine the guitars do - short
      // decay, bright pick, no sustain.
      const body = ctx.createBiquadFilter();
      body.type = "lowpass";
      body.frequency.value = 4200;
      body.connect(dest);
      this.pluckString(time, freq, dur, vel * 0.9, body,
        { damp: 0.42, feedback: 0.975, pluckNoise: 0.012, brightness: 1.1, sustain: 0.5 });
      return;
    }
    const osc = ctx.createOscillator();
    osc.type = flavor === "square-chord" ? "square" : "sawtooth";
    osc.frequency.setValueAtTime(freq, time);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(3500, time);
    filter.frequency.exponentialRampToValueAtTime(500, time + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vel, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(filter).connect(gain).connect(dest);
    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  // Play a lead timbre onto some other track's bus.
  //
  // This used to take a `flavor` argument and ignore it completely, synthesising
  // one fixed two-operator bell no matter what was asked for. Six of the stab
  // kits route through here - saw-chord, supersaw-chord, fm-chord, sine-chord,
  // pluck-stab and hoover-chord - so all six were the same sound with six
  // names on it, which is the exact failure the kit tests exist to catch and
  // which they missed: rendered twice, two of these differ by about as much as
  // either differs from a genuinely different kit, so a threshold generous
  // enough to tolerate the per-render randomness waved them through.
  //
  // Caught by comparing them against organ-chord, which has its own real
  // implementation and sits at twice the distance from all of them.
  playLeadVoiceTo(time, freq, dur, vel, flavor, dest) {
    this.playLeadVoice(time, freq, dur, vel, flavor, dest);
  }

  startAmbience(kind) {
    if (kind !== "vinyl") return;
    const ctx = this.ctx;
    const buffer = this.makeNoiseBuffer(2);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] *= Math.random() < 0.002 ? 1.5 : 0.15;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 3000;
    const gain = ctx.createGain();
    gain.gain.value = 0.05;
    source.connect(filter).connect(gain).connect(this.masterGain);
    source.start();
    this.ambienceSource = source;
  }

  stopAmbience() {
    if (this.ambienceSource) {
      this.ambienceSource.stop();
      this.ambienceSource = null;
    }
  }

  stepDuration() {
    return 60 / this.tempo / 4;
  }

  // Custom-chord patterns carry a per-bar {rootMidi, scale} in
  // pattern.barChordContexts (see buildBarContextsFromChords in
  // patterns.js) instead of relying on the single genre-wide rootMidi/scale
  // every other pattern uses - this is the one place playback needs to
  // know the difference.
  freqForDegree(deg, step) {
    return midiToFreq(this.midiForDegree(deg, step));
  }

  midiForDegree(deg, step) {
    // Key modulation, applied here because this is the single funnel every
    // pitched note in the program passes through - melodies, chords, bass and
    // stabs all resolve their degree to a MIDI note in this one method. Adding
    // it anywhere else would modulate some parts and not others, which is not
    // a key change, it is a wrong note in every bar of it.
    const lift = (this.pattern.barKeyOffset && this.pattern.barKeyOffset.length)
      ? (this.pattern.barKeyOffset[
          Math.floor(step / STEPS_PER_BAR) % this.pattern.barKeyOffset.length] || 0)
      : 0;
    const contexts = this.pattern.barChordContexts;
    if (contexts && contexts.length) {
      const barIdx = Math.floor(step / STEPS_PER_BAR) % contexts.length;
      const ctx = contexts[barIdx];
      return scaleDegreeToMidi(ctx.rootMidi + lift, ctx.scale, deg);
    }
    return scaleDegreeToMidi(this.rootMidi + lift, this.style.scale, deg);
  }

  scheduleStep(step, time) {
    const p = this.pattern;
    const flavors = this.flavors;
    const dur = this.stepDuration();

    for (const inst of Object.keys(p.instruments)) {
      const val = p.instruments[inst][step];
      if (!val) continue;
      const autoMul = this.getAutomationMultiplier(inst, step);

      if (inst === "kick" || inst === "snare" || inst === "tom" || inst === "crash" || inst === "perc" || inst === "fx") {
        const t = this.jitterTime(time, inst);
        // Crashes and risers are deliberate one-off accents; they keep
        // their own level rather than being scaled by bar position.
        const accent = inst === "crash" || inst === "fx" ? 1 : this.metricAccent(step);
        const vel = this.jitterVel(BASE_VELOCITY[inst] * accent) * autoMul;
        if (inst === "kick") this.playKick(t, vel, flavors.kick);
        // Ghost notes - the quiet snare taps between the backbeats are
        // most of what separates a real drummer from a grid pattern.
        else if (inst === "snare") this.playSnare(t, val === "ghost" ? vel * 0.32 : vel, flavors.snare);
        else if (inst === "tom") this.playTom(t, vel, flavors.tom);
        else if (inst === "crash") this.playCrash(t, vel);
        else if (inst === "perc") this.playPerc(t, vel, flavors.perc);
        else if (inst === "fx") this.playFxRiser(t, vel, flavors.fx);
        continue;
      }

      if (inst === "hihat" || inst === "openhat") {
        const open = inst === "openhat";
        if (val === "roll") this.playHihatRoll(time, dur, open, flavors.hihat, inst);
        else this.playHihat(this.jitterTime(time, inst), this.jitterVel(BASE_VELOCITY[inst] * this.metricAccent(step)) * autoMul, open, flavors.hihat, inst);
        continue;
      }

      // melodic
      const t = this.jitterTime(time, inst);
      const noteDur = val.len * dur;
      this.applyFilterAutomation(inst, step, time);
      if (val.degrees) {
        // The key is only known here, so this is where scale degrees turn
        // into real pitches - and therefore the only place the chord can
        // be checked against the instrument's actual range and against the
        // low interval limit. See fitChordToInstrument in instruments.js.
        const voiced = fitChordToInstrument(val.degrees.map((d) => this.midiForDegree(d, step)), inst);
        const baseVel = this.jitterVel(BASE_VELOCITY[inst] * 0.85 * (1 + (this.metricAccent(step) - 1) * 0.5)) * autoMul;
        // A chord is not an event, it is a gesture. performChord turns the
        // pitches into individual notes with their own timing, velocity and
        // length - see performance.js for why every one of those has to
        // differ per note.
        const pedal = PEDAL_MULTIPLIER[inst] || 1;
        const events = performChord(voiced, {
          artic: (this.pattern.articulation && this.pattern.articulation[inst]) || "block",
          step,
          noteDur,
          vel: baseVel,
        });
        for (const e of events) {
          const et = t + e.delay;
          const freq = midiToFreq(e.midi);
          // The sustain pedal: notes ring past their written length and
          // blur into the next chord, which is most of what makes a real
          // piano part sound connected rather than typed in.
          const ed = Math.max(0.05, e.dur) * pedal;
          if (inst === "piano") this.playPianoVoice(et, freq, ed, e.vel, flavors.piano);
          else if (inst === "pad") this.playPadVoice(et, freq, ed, e.vel, flavors.pad);
          else if (inst === "stab") this.playStabVoice(et, freq, ed, e.vel, flavors.stab);
          else if (inst === "strings") this.playStringsVoice(et, freq, ed, e.vel, flavors.strings);
          else if (inst === "horn") this.playHornVoice(et, freq, ed, e.vel, flavors.horn);
          else if (inst === "organ") this.playOrganVoice(et, freq, ed, e.vel, flavors.organ);
          else if (inst === "vocal") this.playVocalVoice(et, freq, ed, e.vel, flavors.vocal);
        }
      } else if (val.degree !== undefined) {
        // Any melodic part can now carry a harmony stack (see
        // HARMONY_SHAPES in patterns.js) - a strummed guitar triad, a
        // harmonised lead in 3rds, a sax section, a bass octave. Voices
        // above the root are played a little softer so the melody note
        // still leads rather than being buried in its own harmony.
        if (val.harmony && val.harmony.length > 1 && inst !== "guitar") {
          const hv = this.jitterVel(BASE_VELOCITY[inst] * (1 + (this.metricAccent(step) - 1) * 0.5)) * autoMul;
          val.harmony.forEach((off, hi) => {
            const hf = this.freqForDegree(val.degree + off, step);
            const lvl = hv * (hi === 0 ? 1 : 0.55);
            if (inst === "bass") this.playBass(t, hf, noteDur, lvl, flavors.bass);
            else if (inst === "lead") this.playLeadVoice(t, hf, noteDur, lvl, flavors.lead);
            else if (inst === "kalimba") this.playKalimbaVoice(t, hf, noteDur, lvl, flavors.kalimba);
            else if (inst === "marimba") this.playMarimbaVoice(t, hf, noteDur, lvl, flavors.marimba);
            else if (inst === "arp") this.playArpVoice(t, hf, noteDur, lvl, flavors.arp);
            else if (inst === "autolead") this.playAutoLeadVoice(t, hf, noteDur, lvl, flavors.autolead);
            else if (inst === "sax") this.playSaxVoice(t, hf, noteDur, lvl, flavors.sax);
            else if (inst === "woodwind") this.playWoodwindVoice(t, hf, noteDur, lvl, flavors.woodwind);
            else if (inst === "leadguitar") this.playLeadGuitarVoice(t, hf, noteDur, lvl, flavors.leadguitar);
            else if (inst === "talkbox") this.playTalkboxVoice(t, hf, noteDur, lvl, flavors.talkbox);
          });
          continue;
        }
        const freq = this.freqForDegree(val.degree, step);
        const vel = this.jitterVel(BASE_VELOCITY[inst] * (1 + (this.metricAccent(step) - 1) * 0.5)) * autoMul;
        if (inst === "bass") this.playBass(t, freq, noteDur, vel, flavors.bass);
        else if (inst === "lead") this.playLeadVoice(t, freq, noteDur, vel, flavors.lead);
        else if (inst === "guitar") {
          // Rhythm-guitar flavors strum a real voicing built from the
          // scale (diatonic triad above the melody degree); lead-style
          // flavors (clean/jazz/nylon) stay single-line, the way picked
          // highlife lines and jazz solos actually are.
          if (GUITAR_STRUM_FLAVORS.has(flavors.guitar)) {
            const shape = val.harmony && val.harmony.length > 1 ? val.harmony : [0, 2, 4];
            const chordMidis = fitChordToInstrument(shape.map((o) => this.midiForDegree(val.degree + o, step)), "guitar");
            // Real strumming: alternating down/up strokes, upstrokes
            // lighter and catching only the top strings, the whole thing
            // spread over the time a pick actually needs to cross six
            // strings. See performChord.
            const gEvents = performChord(chordMidis, {
              artic: (this.pattern.articulation && this.pattern.articulation.guitar) || "strum",
              step, noteDur, vel,
            });
            const gPedal = PEDAL_MULTIPLIER.guitar;
            for (const e of gEvents) {
              const et = t + e.delay;
              const ef = midiToFreq(e.midi);
              const ed = Math.max(0.05, e.dur) * gPedal;
              if (GUITAR_DOUBLE_FLAVORS.has(flavors.guitar)) this.playGuitarDoubled(et, [ef], ed, e.vel, flavors.guitar);
              else this.playGuitarChord(et, [ef], ed, e.vel, flavors.guitar);
            }
          } else {
            this.playGuitarVoice(t, freq, noteDur, vel, flavors.guitar);
          }
        }
        else if (inst === "kalimba") this.playKalimbaVoice(t, freq, noteDur, vel, flavors.kalimba);
        else if (inst === "marimba") this.playMarimbaVoice(t, freq, noteDur, vel, flavors.marimba);
        else if (inst === "arp") this.playArpVoice(t, freq, noteDur, vel, flavors.arp);
        else if (inst === "autolead") this.playAutoLeadVoice(t, freq, noteDur, vel, flavors.autolead);
        else if (inst === "sax") this.playSaxVoice(t, freq, noteDur, vel, flavors.sax);
        else if (inst === "woodwind") this.playWoodwindVoice(t, freq, noteDur, vel, flavors.woodwind);
        else if (inst === "leadguitar") this.playLeadGuitarVoice(t, freq, noteDur, vel, flavors.leadguitar);
        else if (inst === "talkbox") this.playTalkboxVoice(t, freq, noteDur, vel, flavors.talkbox);
      }
    }
  }

  scheduler() {
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      const stepToSchedule = this.currentStep;
      const timeToSchedule = this.nextNoteTime;
      this.scheduleStep(stepToSchedule, timeToSchedule);
      if (this.onStep) {
        const delayMs = (timeToSchedule - this.ctx.currentTime) * 1000;
        setTimeout(() => this.onStep(stepToSchedule), Math.max(0, delayMs));
      }

      this.nextNoteTime += this.swungStepDuration(stepToSchedule);
      this.currentStep = (this.currentStep + 1) % this.stepCount;
    }
    this.timerId = setTimeout(() => this.scheduler(), this.lookahead);
  }

  start(pattern, style, flavors, tempo) {
    this.ensureContext();
    this.pattern = pattern;
    this.style = style;
    this.flavors = flavors;
    this.rootMidi = noteNameToMidi(style.key);
    this.tempo = tempo;
    const anyTrack = Object.values(pattern.instruments)[0];
    this.stepCount = anyTrack ? anyTrack.length : STEPS_PER_BAR;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.isPlaying = true;
    this.startAmbience(style.ambience);
    this.scheduler();
  }

  updatePattern(pattern) {
    this.pattern = pattern;
  }

  updateKey(style) {
    this.style = style;
    this.rootMidi = noteNameToMidi(style.key);
    this.applyGenreLevels(style && style.id);
  }

  // The default level table is built for a record whose bass IS the record -
  // an 808 at 1.0, the loudest thing in the mix. That is right for trap and
  // wrong for an orchestra.
  //
  // Measured on the orchestral family: the sub/low bands held 96%+ of the
  // energy and the midrange - where strings, horns and woodwinds actually
  // live - came out at 2-4%, roughly 17dB down. The parts were being written
  // in the right register; they were simply buried under a whole-note sub
  // pedal running at full level. Only genres that measurably need a different
  // balance carry an entry; every other genre keeps the default table.
  applyGenreLevels(styleId) {
    const over = GENRE_TRACK_VOLUME[styleId] || null;
    for (const t of ALL_TRACKS) {
      if (!this.trackState[t]) continue;
      if (this.userSetVolume && this.userSetVolume[t]) continue;
      const want = (over && over[t] !== undefined) ? over[t] : DEFAULT_TRACK_VOLUME[t];
      this.trackState[t].volume = want;
    }
    this.recomputeGains();
  }

  updateTempo(tempo) {
    this.tempo = tempo;
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.stopAmbience();
  }

  // -------------------------------------------------------------------------
  // Render the current beat offline, faster than real time
  // -------------------------------------------------------------------------
  // Playback is driven by a lookahead scheduler on a wall clock, which an
  // OfflineAudioContext has no use for - there, time is whatever we say it
  // is. So this bypasses the scheduler entirely and walks every step,
  // computing each one's absolute time directly, including the same swing
  // offset the live path applies. The result is a buffer of exactly the
  // audio the speakers would have produced, available in a fraction of the
  // beat's own length.
  //
  // A separate engine instance is used rather than this one so that
  // rendering never disturbs playback: the two have completely independent
  // audio graphs, and only the settings that shape the sound are copied.
  async renderOffline(opts = {}) {
    if (!this.pattern || !this.style) return null;
    if (typeof OfflineAudioContext === "undefined") return null;
    const sampleRate = opts.sampleRate || 44100;
    const loops = Math.max(1, opts.loops || 1);

    const stepDur = 60 / this.tempo / 4;
    // Swing borrows from the off-beat exactly what it lends to the down-beat,
    // so a whole number of pairs takes precisely stepCount * stepDuration.
    const total = stepDur * this.stepCount;
    // A tail so the last hit's release is captured rather than chopped.
    const seconds = total * loops + 2.5;

    const offline = new OfflineAudioContext(2, Math.ceil(seconds * sampleRate), sampleRate);
    const clone = new BeatEngine();
    clone.ensureContext(offline);
    clone.pattern = this.pattern;
    clone.style = this.style;
    clone.flavors = this.flavors;
    clone.rootMidi = this.rootMidi;
    clone.tempo = this.tempo;
    clone.swing = this.swing;
    clone.stepCount = this.stepCount;
    clone.automation = this.automation;
    clone.sidechainEnabled = this.sidechainEnabled;
    for (const t of ALL_TRACKS) {
      if (this.trackState[t]) clone.trackState[t] = Object.assign({}, this.trackState[t]);
      if (clone.trackGains[t]) clone.trackGains[t].gain.value = this.trackState[t].volume;
    }

    let t = 0.05;
    for (let loop = 0; loop < loops; loop++) {
      for (let step = 0; step < this.stepCount; step++) {
        clone.scheduleStep(step, t);
        t += clone.swungStepDuration(step, stepDur);
      }
    }
    const buffer = await offline.startRendering();
    return buffer;
  }
}
