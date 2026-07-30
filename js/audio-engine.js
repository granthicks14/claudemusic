class BeatEngine {
  constructor() {
    this.ctx = null;
    this.pattern = null;
    this.tempo = 100;
    this.swing = 0;
    this.stepCount = 16;
    this.currentStep = 0;
    this.nextNoteTime = 0;
    this.lookahead = 25;
    this.scheduleAheadTime = 0.1;
    this.timerId = null;
    this.isPlaying = false;
    this.onStep = null;
  }

  ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playKick(time) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.15);
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.4);
  }

  playSnare(time) {
    const ctx = this.ctx;
    const noiseBuffer = this.makeNoiseBuffer();
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.value = 1000;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(1, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
    noise.start(time);
    noise.stop(time + 0.2);

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(180, time);
    oscGain.gain.setValueAtTime(0.7, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);
    osc.connect(oscGain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.12);
  }

  playHihat(time, open) {
    const ctx = this.ctx;
    const noiseBuffer = this.makeNoiseBuffer();
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 7000;
    const gain = ctx.createGain();
    const decay = open ? 0.35 : 0.06;
    gain.gain.setValueAtTime(0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + decay);
    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(time);
    noise.stop(time + decay);
  }

  makeNoiseBuffer() {
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  stepDuration() {
    return 60 / this.tempo / 4;
  }

  scheduleStep(step, time) {
    const p = this.pattern;
    if (!p) return;
    if (p.kick[step]) this.playKick(time);
    if (p.snare[step]) this.playSnare(time);
    if (p.hihat[step]) this.playHihat(time, false);
    if (p.openhat[step]) this.playHihat(time, true);
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

  start(pattern, tempo, swing) {
    this.ensureContext();
    this.pattern = pattern;
    this.tempo = tempo;
    this.swing = swing || 0;
    this.stepCount = pattern.kick.length;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.isPlaying = true;
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
  }
}
