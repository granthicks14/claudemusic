const ALL_TRACKS = ["kick", "snare", "hihat", "openhat", "tom", "perc", "crash", "bass", "piano", "lead", "pad", "stab", "guitar", "strings", "horn", "organ", "vocal", "kalimba", "marimba", "arp", "autolead", "sax", "fx"];

const DEFAULT_TRACK_VOLUME = {
  kick: 1, snare: 0.9, hihat: 0.6, openhat: 0.6, tom: 0.85, perc: 0.55, crash: 0.8,
  bass: 0.9, piano: 0.75, lead: 0.7, pad: 0.5, stab: 0.75, guitar: 0.8, strings: 0.55, horn: 0.7,
  organ: 0.6, vocal: 0.65, kalimba: 0.7, marimba: 0.65, arp: 0.55, autolead: 0.75, sax: 0.7, fx: 0.6,
};

const BASE_VELOCITY = {
  kick: 1, snare: 0.9, hihat: 0.7, openhat: 0.7, tom: 0.85, perc: 0.6, crash: 0.9,
  bass: 0.8, piano: 0.75, lead: 0.7, pad: 0.5, stab: 0.75, guitar: 0.8, strings: 0.6, horn: 0.75,
  organ: 0.65, vocal: 0.7, kalimba: 0.75, marimba: 0.7, arp: 0.65, autolead: 0.8, sax: 0.75, fx: 0.8,
};

const DRUM_TRACKS = ["kick", "snare", "hihat", "openhat", "tom", "perc", "crash", "fx"];

// Guitar flavors that strum chords (rhythm guitar) versus play single
// picked lines (lead guitar) - see playGuitarChord.
const GUITAR_STRUM_FLAVORS = new Set(["power", "muted", "acoustic", "twelvestring", "funk"]);

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
  horn: -0.22, organ: 0.2, kalimba: -0.24, marimba: 0.26, arp: -0.28, sax: -0.18,
};

const DEFAULT_REVERB_SEND = {
  kick: 0, bass: 0, snare: 0.22, hihat: 0.08, openhat: 0.15, tom: 0.2, perc: 0.15, crash: 0.35,
  piano: 0.22, lead: 0.28, pad: 0.4, stab: 0.22, guitar: 0.18, strings: 0.35, horn: 0.22,
  organ: 0.28, vocal: 0.32, kalimba: 0.25, marimba: 0.28, arp: 0.3, autolead: 0.24, sax: 0.3, fx: 0.45,
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

  ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();

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
        pan.connect(DRUM_TRACKS.includes(t) ? this.masterGain : this.duckBus);
        this.trackPanners[t] = pan;
        this.trackGains[t] = g;

        const send = this.ctx.createGain();
        send.gain.value = DEFAULT_REVERB_SEND[t] || 0;
        g.connect(send).connect(this.reverbBus);
        this.reverbSends[t] = send;
      }
    }
    if (this.ctx.state === "suspended") {
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

  setSwing(value) {
    this.swing = value;
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

  setTrackVolume(inst, value) {
    this.trackState[inst].volume = value;
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

    if (flavor === "roomy") {
      const send = this.ctx.createGain();
      send.gain.value = 0.35;
      gain.connect(send).connect(this.reverbBus);
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
    const ctx = this.ctx;
    const presets = {
      bright: { hp: 7500, lp: null },
      dark: { hp: 6000, lp: 11000 },
      vinyl: { hp: 5000, lp: 8500 },
      metallic: { hp: 8500, lp: null, peak: 9000 },
      analog: { hp: 6500, lp: 13000, peak: 7000 },
      tape: { hp: 5500, lp: 9500, peak: 6500 },
      sizzle: { hp: 9500, lp: null, peak: 11000 },
      lofi808: { hp: 7000, lp: 10500 },
      // TR-707: a clean PCM sample, tighter and less splashy than the
      // analog-noise hats above. TR-606: thin, papery, higher-pitched -
      // the 606's tiny analog circuit never had much hat body to begin
      // with, which is exactly its charm in early acid/techno.
      "707": { hp: 8000, lp: 12500, peak: 9500 },
      "606": { hp: 9800, lp: null },
    };
    const decay = open ? 0.32 + Math.random() * 0.1 : 0.05 + Math.random() * 0.02;

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

  playTom(time, vel, flavor) {
    const ctx = this.ctx;
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
    const ctx = this.ctx;
    // Bass lines could descend to ~23Hz, which is below what phones,
    // laptops, and most speakers reproduce at all - the note vanishes
    // while still eating headroom on the master. Anything under ~33Hz
    // (roughly C1) is lifted an octave so it stays audible; real
    // engineers do the same thing rather than let a sub note disappear.
    while (freq < 33) freq *= 2;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (flavor === "true808") {
      // The modern-rap 808 (Travis Scott/Lil Baby/Gunna-era production).
      // Three researched pieces beyond the basic "808" flavor below:
      // 1. THE SLIDE. The single most identifiable modern 808 technique -
      //    the bass glides smoothly from the previous note's pitch into
      //    the new one instead of re-attacking (producers do it with
      //    portamento/glide on the 808 channel). The engine schedules
      //    notes in time order, so tracking the last 808 note lets a note
      //    that follows closely glide in from the previous pitch.
      // 2. Warm constant saturation on the sine body (not the parallel-
      //    distortion "hard808" - this one is round and warm, the melodic
      //    808 sound rather than the aggressive one).
      // 3. A soft knock attack and a long ring that outlives short trigger
      //    notes, because a real 808 decays on its own terms.
      const ringTime = Math.max(durationSeconds, 1.5);
      const prev = this.lastTrue808;
      this.lastTrue808 = { freq, time };
      osc.type = "sine";
      if (prev && time - prev.time > 0 && time - prev.time < 0.5 && Math.abs(prev.freq - freq) > 0.5) {
        osc.frequency.setValueAtTime(prev.freq, time);
        osc.frequency.exponentialRampToValueAtTime(freq, time + 0.09);
      } else {
        osc.frequency.setValueAtTime(freq * 1.7, time);
        osc.frequency.exponentialRampToValueAtTime(freq, time + 0.08);
      }
      gain.gain.setValueAtTime(vel, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + ringTime);
      const shaper = ctx.createWaveShaper();
      shaper.curve = this.makeDistortionCurve(10);
      osc.connect(shaper).connect(gain).connect(this.dest("bass"));
      osc.start(time);
      osc.stop(time + ringTime + 0.05);

      const knock = ctx.createBufferSource();
      knock.buffer = this.makeNoiseBuffer(0.018);
      const knockFilter = ctx.createBiquadFilter();
      knockFilter.type = "highpass";
      knockFilter.frequency.value = 1800;
      const knockGain = ctx.createGain();
      knockGain.gain.setValueAtTime(vel * 0.3, time);
      knockGain.gain.exponentialRampToValueAtTime(0.001, time + 0.018);
      knock.connect(knockFilter).connect(knockGain).connect(this.dest("bass"));
      knock.start(time);
      knock.stop(time + 0.022);
      return;
    }

    if (flavor === "808") {
      // A real 808 rings out on its own decay, independent of how short the
      // trigger note is - that long, boomy, semi-percussive sustain is what
      // makes an 808 an 808 rather than just a filtered sine bass. A short
      // saturation stage and a soft knock transient round it out.
      const ringTime = Math.max(durationSeconds, 1.4);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq * 1.8, time);
      osc.frequency.exponentialRampToValueAtTime(freq, time + 0.09);
      gain.gain.setValueAtTime(vel, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + ringTime);
      const shaper = ctx.createWaveShaper();
      shaper.curve = this.makeDistortionCurve(6);
      osc.connect(shaper).connect(gain).connect(this.dest("bass"));
      osc.start(time);
      osc.stop(time + ringTime + 0.05);

      const knock = ctx.createBufferSource();
      knock.buffer = this.makeNoiseBuffer(0.015);
      const knockFilter = ctx.createBiquadFilter();
      knockFilter.type = "highpass";
      knockFilter.frequency.value = 2000;
      const knockGain = ctx.createGain();
      knockGain.gain.setValueAtTime(vel * 0.25, time);
      knockGain.gain.exponentialRampToValueAtTime(0.001, time + 0.015);
      knock.connect(knockFilter).connect(knockGain).connect(this.dest("bass"));
      knock.start(time);
      knock.stop(time + 0.02);
      return;
    } else if (flavor === "hard808") {
      // Modern hard-trap 808s use parallel distortion: a clean sub layer
      // keeps the low end powerful and undistorted (distorting the whole
      // signal loses low-frequency punch), while a second, heavily
      // saturated copy is blended in on top purely for harmonic "bite" -
      // the aggression that actually reads on phone/laptop speakers.
      const ringTime = Math.max(durationSeconds, 1.3);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq * 1.8, time);
      osc.frequency.exponentialRampToValueAtTime(freq, time + 0.07);
      gain.gain.setValueAtTime(vel, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + ringTime);
      osc.connect(gain).connect(this.dest("bass"));
      osc.start(time);
      osc.stop(time + ringTime + 0.05);

      const grit = ctx.createOscillator();
      grit.type = "sine";
      grit.frequency.setValueAtTime(freq * 1.8, time);
      grit.frequency.exponentialRampToValueAtTime(freq, time + 0.07);
      const gritShaper = ctx.createWaveShaper();
      gritShaper.curve = this.makeDistortionCurve(35);
      const gritGain = ctx.createGain();
      gritGain.gain.setValueAtTime(vel * 0.45, time);
      gritGain.gain.exponentialRampToValueAtTime(0.001, time + Math.min(ringTime, 0.9));
      grit.connect(gritShaper).connect(gritGain).connect(this.dest("bass"));
      grit.start(time);
      grit.stop(time + ringTime + 0.05);

      const knock = ctx.createBufferSource();
      knock.buffer = this.makeNoiseBuffer(0.02);
      const knockFilter = ctx.createBiquadFilter();
      knockFilter.type = "highpass";
      knockFilter.frequency.value = 1600;
      const knockGain = ctx.createGain();
      knockGain.gain.setValueAtTime(vel * 0.4, time);
      knockGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
      knock.connect(knockFilter).connect(knockGain).connect(this.dest("bass"));
      knock.start(time);
      knock.stop(time + 0.025);
      return;
    } else if (flavor === "synth") {
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
  pluckString(time, freq, durationSeconds, vel, dest, opts = {}) {
    const ctx = this.ctx;
    const {
      damp = 0.25,
      feedback = 0.988,
      pluckNoise = 0.008,
      brightness = 1,
      sustain = 1.3,
      outputLowpass = null,
    } = opts;

    const delay = ctx.createDelay(1);
    delay.delayTime.value = 1 / freq;
    const oneSample = ctx.createDelay(1);
    oneSample.delayTime.value = 1 / ctx.sampleRate;
    const gDirect = ctx.createGain();
    gDirect.gain.value = 1 - damp;
    const gDelayed = ctx.createGain();
    gDelayed.gain.value = damp;
    const fb = ctx.createGain();
    fb.gain.value = feedback;
    delay.connect(gDirect).connect(fb);
    delay.connect(oneSample).connect(gDelayed).connect(fb);
    fb.connect(delay);

    let outNode = delay;
    let body = null;
    if (outputLowpass) {
      body = ctx.createBiquadFilter();
      body.type = "lowpass";
      body.frequency.value = outputLowpass;
      outNode.connect(body);
      outNode = body;
    }
    const outGain = ctx.createGain();
    const ringTime = Math.max(durationSeconds, sustain);
    outGain.gain.setValueAtTime(vel, time);
    outGain.gain.exponentialRampToValueAtTime(0.0006, time + ringTime);
    outNode.connect(outGain).connect(dest);

    const exciter = ctx.createBufferSource();
    exciter.buffer = this.makeNoiseBuffer(pluckNoise);
    const exciterFilter = ctx.createBiquadFilter();
    exciterFilter.type = "lowpass";
    exciterFilter.frequency.value = Math.min(9000, freq * 6 * brightness);
    const exciterGain = ctx.createGain();
    exciterGain.gain.setValueAtTime(1, time);
    exciterGain.gain.linearRampToValueAtTime(0, time + pluckNoise);
    exciter.connect(exciterFilter).connect(exciterGain).connect(delay);
    exciter.start(time);
    exciter.stop(time + pluckNoise + 0.01);

    const cleanupMs = (ringTime + 0.3) * 1000;
    setTimeout(() => {
      delay.disconnect();
      oneSample.disconnect();
      gDirect.disconnect();
      gDelayed.disconnect();
      fb.disconnect();
      outGain.disconnect();
      if (body) body.disconnect();
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

  playStringsVoice(time, freq, durationSeconds, vel, flavor) {
    const ctx = this.ctx;
    const dest = this.dest("strings");

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

  playHornVoice(time, freq, durationSeconds, vel, flavor) {
    const ctx = this.ctx;
    const dest = this.dest("horn");

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
    const ctx = this.ctx;
    const dest = this.dest("organ");
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
    const ctx = this.ctx;
    const dest = this.dest("vocal");
    const dur = Math.min(durationSeconds, 0.6);

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
    const ctx = this.ctx;
    const dest = this.dest("kalimba");
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
    const ctx = this.ctx;
    const dest = this.dest("autolead");
    const dur = Math.min(durationSeconds, 0.55);

    const formants = flavor === "moody" ? [420, 1000, 2350] : [650, 1500, 2900];
    const levels = [1, 0.5, 0.28];

    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.linearRampToValueAtTime(vel, time + 0.008);
    envelope.gain.setValueAtTime(vel, time + Math.max(0.008, dur - 0.09));
    envelope.gain.exponentialRampToValueAtTime(0.001, time + dur);
    envelope.connect(dest);

    for (const detune of [-0.007, 0.007]) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq * (1 + detune), time);
      formants.forEach((freqCenter, i) => {
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = freqCenter;
        bp.Q.value = flavor === "moody" ? 9 : 14;
        const g = ctx.createGain();
        g.gain.value = (levels[i] / 2) * (flavor === "moody" ? 0.85 : 1);
        osc.connect(bp).connect(g).connect(envelope);
      });
      osc.start(time);
      osc.stop(time + dur + 0.05);
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
    const ctx = this.ctx;
    const dest = this.dest("sax");
    const breathy = flavor === "breathy";
    const dur = Math.min(durationSeconds, breathy ? 0.65 : 0.55);
    const attack = breathy ? 0.03 : 0.018;

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq * 0.89, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.05);

    const formant = ctx.createBiquadFilter();
    formant.type = "peaking";
    formant.frequency.value = 950;
    formant.Q.value = 2.2;
    formant.gain.value = 8;
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

  playMarimbaVoice(time, freq, durationSeconds, vel, flavor) {
    const ctx = this.ctx;
    const dest = this.dest("marimba");
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
    const ctx = this.ctx;
    const dest = this.dest("arp");
    const dur = Math.min(durationSeconds, 0.16);

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
    const ctx = this.ctx;
    const dest = this.dest("piano");
    const dur = Math.min(durationSeconds, 1.4);

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

  playLeadVoice(time, freq, durationSeconds, vel, flavor) {
    const ctx = this.ctx;
    const dest = this.dest("lead");
    const dur = Math.min(durationSeconds, 1);

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
    const ctx = this.ctx;
    const dest = this.dest("pad");
    const attack = 0.25;
    const dur = Math.max(durationSeconds, 0.6);

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
    const ctx = this.ctx;
    const dest = this.dest("stab");
    const dur = Math.min(durationSeconds, 0.5);

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

  playLeadVoiceTo(time, freq, dur, vel, flavor, dest) {
    const ctx = this.ctx;
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
    const contexts = this.pattern.barChordContexts;
    if (contexts && contexts.length) {
      const barIdx = Math.floor(step / STEPS_PER_BAR) % contexts.length;
      const ctx = contexts[barIdx];
      return degreeToFreq(ctx.rootMidi, ctx.scale, deg);
    }
    return degreeToFreq(this.rootMidi, this.style.scale, deg);
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
        for (const deg of val.degrees) {
          const freq = this.freqForDegree(deg, step);
          const vel = this.jitterVel(BASE_VELOCITY[inst] * 0.85 * (1 + (this.metricAccent(step) - 1) * 0.5)) * autoMul;
          if (inst === "piano") this.playPianoVoice(t, freq, noteDur, vel, flavors.piano);
          else if (inst === "pad") this.playPadVoice(t, freq, noteDur, vel, flavors.pad);
          else if (inst === "stab") this.playStabVoice(t, freq, noteDur, vel, flavors.stab);
          else if (inst === "strings") this.playStringsVoice(t, freq, noteDur, vel, flavors.strings);
          else if (inst === "horn") this.playHornVoice(t, freq, noteDur, vel, flavors.horn);
          else if (inst === "organ") this.playOrganVoice(t, freq, noteDur, vel, flavors.organ);
          else if (inst === "vocal") this.playVocalVoice(t, freq, noteDur, vel, flavors.vocal);
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
            const chordFreqs = shape.map((o) => this.freqForDegree(val.degree + o, step));
            if (GUITAR_DOUBLE_FLAVORS.has(flavors.guitar)) this.playGuitarDoubled(t, chordFreqs, noteDur, vel, flavors.guitar);
            else this.playGuitarChord(t, chordFreqs, noteDur, vel, flavors.guitar);
          } else {
            this.playGuitarVoice(t, freq, noteDur, vel, flavors.guitar);
          }
        }
        else if (inst === "kalimba") this.playKalimbaVoice(t, freq, noteDur, vel, flavors.kalimba);
        else if (inst === "marimba") this.playMarimbaVoice(t, freq, noteDur, vel, flavors.marimba);
        else if (inst === "arp") this.playArpVoice(t, freq, noteDur, vel, flavors.arp);
        else if (inst === "autolead") this.playAutoLeadVoice(t, freq, noteDur, vel, flavors.autolead);
        else if (inst === "sax") this.playSaxVoice(t, freq, noteDur, vel, flavors.sax);
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

      let duration = this.stepDuration();
      if (stepToSchedule % 2 === 1) {
        duration += this.swing * this.stepDuration();
      }

      this.nextNoteTime += duration;
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
}
