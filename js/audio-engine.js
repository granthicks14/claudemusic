class BeatEngine {
  constructor() {
    this.ctx = null;
    this.pattern = null;
    this.style = null;
    this.tempo = 100;
    this.stepCount = 16;
    this.currentStep = 0;
    this.nextNoteTime = 0;
    this.lookahead = 25;
    this.scheduleAheadTime = 0.1;
    this.timerId = null;
    this.isPlaying = false;
    this.onStep = null;
    this.ambienceSource = null;
  }

  ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
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

  playKick(time, vel, flavor) {
    const ctx = this.ctx;
    const presets = {
      boombap: { startFreq: 130, endFreq: 48, decay: 0.32 },
      "808": { startFreq: 90, endFreq: 32, decay: 0.65 },
      fourfloor: { startFreq: 145, endFreq: 55, decay: 0.28 },
      acoustic: { startFreq: 120, endFreq: 60, decay: 0.22 },
      lofi: { startFreq: 100, endFreq: 45, decay: 0.3 },
    };
    const p = presets[flavor] || presets.boombap;
    const jitter = 0.92 + Math.random() * 0.16;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(p.startFreq * jitter, time);
    osc.frequency.exponentialRampToValueAtTime(p.endFreq, time + p.decay * 0.4);
    gain.gain.setValueAtTime(vel, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + p.decay);
    osc.connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + p.decay + 0.05);

    if (flavor === "lofi") {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.frequency.setValueAtTime(p.startFreq * 1.4, time);
      osc2.frequency.exponentialRampToValueAtTime(p.endFreq * 1.3, time + 0.08);
      gain2.gain.setValueAtTime(vel * 0.4, time);
      gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      osc2.connect(gain2).connect(ctx.destination);
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
        noise.connect(bp).connect(g).connect(ctx.destination);
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
    noise.connect(filter).connect(noiseGain).connect(ctx.destination);
    noise.start(time);
    noise.stop(time + p.noiseDecay);

    if (p.toneFreq) {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(p.toneFreq, time);
      oscGain.gain.setValueAtTime(vel * 0.7, time);
      oscGain.gain.exponentialRampToValueAtTime(0.01, time + p.toneDecay);
      osc.connect(oscGain).connect(ctx.destination);
      osc.start(time);
      osc.stop(time + p.toneDecay);
    }
  }

  playHihat(time, vel, open, flavor) {
    const ctx = this.ctx;
    const presets = {
      bright: { hp: 7500, lp: null },
      dark: { hp: 6000, lp: 11000 },
      vinyl: { hp: 5000, lp: 8500 },
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
    node.connect(gain).connect(ctx.destination);
    noise.start(time);
    noise.stop(time + decay);
  }

  playHihatRoll(time, stepDuration, open, flavor) {
    const hits = 3;
    for (let i = 0; i < hits; i++) {
      const t = time + (i * stepDuration) / hits;
      const vel = 0.5 + (i / hits) * 0.5;
      this.playHihat(t, this.jitterVel(vel), open && i === hits - 1, flavor);
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
    osc.connect(gain).connect(ctx.destination);
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
      osc.connect(gain).connect(ctx.destination);
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
    noise.connect(bp).connect(gain).connect(ctx.destination);
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
    noise.connect(hp).connect(gain).connect(ctx.destination);
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
    } else if (flavor === "synth") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, time);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 900;
      gain.gain.setValueAtTime(vel * 0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + durationSeconds);
      osc.connect(filter).connect(gain).connect(ctx.destination);
      osc.start(time);
      osc.stop(time + durationSeconds + 0.05);
      return;
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(vel * 0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + durationSeconds);
    }

    osc.connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + durationSeconds + 0.05);
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
    source.connect(filter).connect(gain).connect(ctx.destination);
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
    const flavors = this.style.flavors;
    const dur = this.stepDuration();

    for (const inst of Object.keys(p.instruments)) {
      const val = p.instruments[inst][step];
      if (!val) continue;
      const t = this.jitterTime(time);

      if (inst === "kick") this.playKick(t, this.jitterVel(1), flavors.kick);
      else if (inst === "snare") this.playSnare(t, this.jitterVel(0.9), flavors.snare);
      else if (inst === "hihat") {
        if (val === "roll") this.playHihatRoll(time, dur, false, flavors.hihat);
        else this.playHihat(t, this.jitterVel(0.7), false, flavors.hihat);
      } else if (inst === "openhat") {
        if (val === "roll") this.playHihatRoll(time, dur, true, flavors.hihat);
        else this.playHihat(t, this.jitterVel(0.7), true, flavors.hihat);
      } else if (inst === "tom") this.playTom(t, this.jitterVel(0.85));
      else if (inst === "perc") this.playPerc(t, this.jitterVel(0.6), flavors.perc);
      else if (inst === "crash") this.playCrash(t, this.jitterVel(0.9));
    }

    const note = p.bass[step];
    if (note) {
      const t = this.jitterTime(time);
      this.playBass(t, note.freq, note.len * dur, this.jitterVel(0.8), flavors.bass);
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
        duration += this.style.swing * this.stepDuration();
      }

      this.nextNoteTime += duration;
      this.currentStep = (this.currentStep + 1) % this.stepCount;
    }
    this.timerId = setTimeout(() => this.scheduler(), this.lookahead);
  }

  start(pattern, style, tempo) {
    this.ensureContext();
    this.pattern = pattern;
    this.style = style;
    this.tempo = tempo;
    this.stepCount = pattern.instruments.kick ? pattern.instruments.kick.length : pattern.bass.length;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.isPlaying = true;
    this.startAmbience(style.ambience);
    this.scheduler();
  }

  updatePattern(pattern) {
    this.pattern = pattern;
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
