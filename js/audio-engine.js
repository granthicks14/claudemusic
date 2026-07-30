const ALL_TRACKS = ["kick", "snare", "hihat", "openhat", "tom", "perc", "crash", "bass", "piano", "lead", "pad", "stab", "guitar", "strings", "horn"];

const DEFAULT_TRACK_VOLUME = {
  kick: 1, snare: 0.9, hihat: 0.6, openhat: 0.6, tom: 0.85, perc: 0.55, crash: 0.8,
  bass: 0.9, piano: 0.75, lead: 0.7, pad: 0.5, stab: 0.75, guitar: 0.8, strings: 0.55, horn: 0.7,
};

const BASE_VELOCITY = {
  kick: 1, snare: 0.9, hihat: 0.7, openhat: 0.7, tom: 0.85, perc: 0.6, crash: 0.9,
  bass: 0.8, piano: 0.75, lead: 0.7, pad: 0.5, stab: 0.75, guitar: 0.8, strings: 0.6, horn: 0.75,
};

const DRUM_TRACKS = ["kick", "snare", "hihat", "openhat", "tom", "perc", "crash"];

const DEFAULT_REVERB_SEND = {
  kick: 0, bass: 0, snare: 0.22, hihat: 0.08, openhat: 0.15, tom: 0.2, perc: 0.15, crash: 0.35,
  piano: 0.22, lead: 0.28, pad: 0.4, stab: 0.22, guitar: 0.18, strings: 0.35, horn: 0.22,
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
    this.trackGains = {};
    this.trackState = {};
    for (const t of ALL_TRACKS) {
      this.trackState[t] = { volume: DEFAULT_TRACK_VOLUME[t], muted: false, solo: false };
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.9;
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -12;
      this.compressor.knee.value = 6;
      this.compressor.ratio.value = 4;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;
      this.masterGain.connect(this.compressor).connect(this.ctx.destination);

      this.duckBus = this.ctx.createGain();
      this.duckBus.gain.value = 1;
      this.duckBus.connect(this.masterGain);

      this.reverbBus = this.ctx.createGain();
      const convolver = this.ctx.createConvolver();
      convolver.buffer = this.makeImpulseResponse(2.2, 2.5);
      const reverbReturn = this.ctx.createGain();
      reverbReturn.gain.value = 0.9;
      this.reverbBus.connect(convolver).connect(reverbReturn).connect(this.masterGain);

      for (const t of ALL_TRACKS) {
        const g = this.ctx.createGain();
        g.gain.value = this.trackState[t].volume;
        g.connect(DRUM_TRACKS.includes(t) ? this.masterGain : this.duckBus);
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

  jitterTime(time) {
    const h = this.style.humanize;
    return time + (Math.random() * 2 - 1) * (h.timingMs / 1000);
  }

  jitterVel(base) {
    const h = this.style.humanize;
    const v = base + (Math.random() * 2 - 1) * h.velocityJitter;
    return Math.max(0.35, Math.min(1.3, v));
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
      "808": { startFreq: 90, endFreq: 32, decay: 0.65 },
      fourfloor: { startFreq: 145, endFreq: 55, decay: 0.28 },
      acoustic: { startFreq: 120, endFreq: 60, decay: 0.22 },
      lofi: { startFreq: 100, endFreq: 45, decay: 0.3 },
      deep: { startFreq: 80, endFreq: 30, decay: 0.55 },
      snappy: { startFreq: 160, endFreq: 70, decay: 0.15 },
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
    osc.connect(gain).connect(this.dest("kick"));
    osc.start(time);
    osc.stop(time + p.decay + 0.05);

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
  }

  playSnare(time, vel, flavor) {
    const ctx = this.ctx;
    const presets = {
      crisp: { noiseHp: 1200, noiseDecay: 0.18, toneFreq: 190, toneDecay: 0.12 },
      clap: { noiseHp: 1000, noiseDecay: 0.22, toneFreq: 0, toneDecay: 0 },
      fat: { noiseHp: 500, noiseDecay: 0.2, toneFreq: 150, toneDecay: 0.15 },
      rimshot: { noiseHp: 2500, noiseDecay: 0.06, toneFreq: 420, toneDecay: 0.05 },
      trapsnap: { noiseHp: 3500, noiseDecay: 0.09, toneFreq: 300, toneDecay: 0.06 },
    };
    const p = presets[flavor] || presets.crisp;

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
    noise.connect(filter).connect(noiseGain).connect(this.dest("snare"));
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
    };
    const p = presets[flavor] || presets.bright;
    const decay = open ? 0.32 + Math.random() * 0.1 : 0.05 + Math.random() * 0.02;

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

  playTom(time, vel) {
    const ctx = this.ctx;
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

  playBass(time, freq, durationSeconds, vel, flavor) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (flavor === "808") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq * 1.8, time);
      osc.frequency.exponentialRampToValueAtTime(freq, time + 0.09);
      gain.gain.setValueAtTime(vel, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + durationSeconds);
      osc.connect(gain).connect(this.dest("bass"));
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
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, time);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2000, time);
      filter.frequency.exponentialRampToValueAtTime(300, time + 0.2);
      gain.gain.setValueAtTime(vel, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + Math.min(durationSeconds, 0.3));
      osc.connect(filter).connect(gain).connect(this.dest("bass"));
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
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(vel * 0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + durationSeconds);
      osc.connect(gain).connect(this.dest("bass"));
    }
    osc.start(time);
    osc.stop(time + durationSeconds + 0.05);
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

  playGuitarVoice(time, freq, durationSeconds, vel, flavor) {
    const ctx = this.ctx;
    const dest = this.dest("guitar");
    const dur = Math.min(durationSeconds, flavor === "muted" ? 0.18 : 1.2);

    if (flavor === "power") {
      const shaper = ctx.createWaveShaper();
      shaper.curve = this.makeDistortionCurve(35);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 3200;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      shaper.connect(filter).connect(gain).connect(dest);
      for (const ratio of [1, 1.5]) {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq * ratio, time);
        osc.connect(shaper);
        osc.start(time);
        osc.stop(time + dur + 0.05);
      }
      return;
    }

    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, time);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(flavor === "nylon" ? 2200 : 3000, time);
    filter.frequency.exponentialRampToValueAtTime(500, time + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vel, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(filter).connect(gain).connect(dest);
    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  playStringsVoice(time, freq, durationSeconds, vel, flavor) {
    const ctx = this.ctx;
    const dest = this.dest("strings");
    const attack = flavor === "staccato" ? 0.02 : 0.15;
    const dur = flavor === "staccato" ? Math.min(durationSeconds, 0.35) : Math.max(durationSeconds, 0.5);
    const detunes = flavor === "orchestral" ? [0, 0.008, -0.008, 0.014] : [0, 0.005, -0.005];

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
    const dur = Math.min(durationSeconds, flavor === "muted" ? 0.3 : 0.5);

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, time);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = flavor === "soft" ? 1200 : flavor === "muted" ? 900 : 1800;
    bp.Q.value = flavor === "muted" ? 3 : 1.2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(vel, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(bp).connect(gain).connect(dest);
    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  // ---- Melodic voices ----

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

    let node2 = osc2;
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
    const detunes = flavor === "ensemble" ? [0, 0.006, -0.006] : flavor === "airy" ? [0] : [0, 0.004];
    const type = flavor === "airy" ? "sine" : "sawtooth";

    for (const d of detunes) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq * (1 + d), time);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = flavor === "airy" ? 2200 : 1500;
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

  scheduleStep(step, time) {
    const p = this.pattern;
    const flavors = this.flavors;
    const dur = this.stepDuration();

    for (const inst of Object.keys(p.instruments)) {
      const val = p.instruments[inst][step];
      if (!val) continue;

      if (inst === "kick" || inst === "snare" || inst === "tom" || inst === "crash" || inst === "perc") {
        const t = this.jitterTime(time);
        const vel = this.jitterVel(BASE_VELOCITY[inst]);
        if (inst === "kick") this.playKick(t, vel, flavors.kick);
        else if (inst === "snare") this.playSnare(t, vel, flavors.snare);
        else if (inst === "tom") this.playTom(t, vel);
        else if (inst === "crash") this.playCrash(t, vel);
        else if (inst === "perc") this.playPerc(t, vel, flavors.perc);
        continue;
      }

      if (inst === "hihat" || inst === "openhat") {
        const open = inst === "openhat";
        if (val === "roll") this.playHihatRoll(time, dur, open, flavors.hihat, inst);
        else this.playHihat(this.jitterTime(time), this.jitterVel(BASE_VELOCITY[inst]), open, flavors.hihat, inst);
        continue;
      }

      // melodic
      const t = this.jitterTime(time);
      const noteDur = val.len * dur;
      if (val.degrees) {
        for (const deg of val.degrees) {
          const freq = degreeToFreq(this.rootMidi, this.style.scale, deg);
          const vel = this.jitterVel(BASE_VELOCITY[inst] * 0.85);
          if (inst === "piano") this.playPianoVoice(t, freq, noteDur, vel, flavors.piano);
          else if (inst === "pad") this.playPadVoice(t, freq, noteDur, vel, flavors.pad);
          else if (inst === "stab") this.playStabVoice(t, freq, noteDur, vel, flavors.stab);
          else if (inst === "strings") this.playStringsVoice(t, freq, noteDur, vel, flavors.strings);
          else if (inst === "horn") this.playHornVoice(t, freq, noteDur, vel, flavors.horn);
        }
      } else if (val.degree !== undefined) {
        const freq = degreeToFreq(this.rootMidi, this.style.scale, val.degree);
        const vel = this.jitterVel(BASE_VELOCITY[inst]);
        if (inst === "bass") this.playBass(t, freq, noteDur, vel, flavors.bass);
        else if (inst === "lead") this.playLeadVoice(t, freq, noteDur, vel, flavors.lead);
        else if (inst === "guitar") this.playGuitarVoice(t, freq, noteDur, vel, flavors.guitar);
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
