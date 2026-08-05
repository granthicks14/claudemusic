// ---------------------------------------------------------------------------
// Samples
// ---------------------------------------------------------------------------
// Everything else in this program is synthesized from nothing. This is the
// part that plays actual recorded audio - and it plays YOUR audio, because
// that is the only kind it can honestly offer.
//
// WHY NO SAMPLE LIBRARY SHIPS WITH IT
// A drum sample is a recording, and recordings are owned. Bundling a pack of
// them would mean either shipping something I have no right to distribute, or
// shipping something so restrictively licensed that the beats made with it
// could not be used. There are genuinely free (CC0) sample sets, but a static
// page cannot fetch them at runtime from most hosts, and committing tens of
// megabytes of binary audio into a source repository to dodge that is a bad
// trade for everyone who clones it.
//
// So: you bring the samples. Your own recordings, a pack you bought, a CC0
// set you downloaded - anything. They are decoded in your browser, they never
// leave your machine, and nothing is uploaded anywhere.
//
// WHAT IT DOES WITH THEM
//   ONE-SHOT   a single hit (a kick, a snare, a vocal stab) assigned to a
//              track, played at the velocity the pattern asks for.
//   SLICED     a loop cut at its transients into numbered slices, so a
//              breakbeat can be re-sequenced across the grid rather than
//              played back as one lump. This is the chop that made most of
//              hip-hop, and it is the thing a sampler is FOR.
//   PITCHED    a melodic sample played back at whatever rate puts it at the
//              note the pattern wants, so it can carry a bassline or a hook.
//
// A sample participates as a KIT, not as a new track type. Selecting the
// flavor "sample:<id>" on any track makes that track play the sample instead
// of synthesizing - which means it works everywhere flavors already work:
// the per-track picker, the offline render, the artist profiles, all of it.

const SAMPLE_PREFIX = "sample:";

// The loaded samples, keyed by a short id. Session-only: an AudioBuffer
// cannot be put in localStorage, and re-encoding megabytes of audio to base64
// on every change would be worse than asking for the file again.
const SampleBank = {
  items: new Map(),
  nextId: 1,

  clear() { this.items.clear(); this.nextId = 1; },

  get(id) { return this.items.get(id) || null; },

  list() { return Array.from(this.items.values()); },

  // Is this flavor string asking for a sample, and if so which one?
  resolve(flavor) {
    if (typeof flavor !== "string" || !flavor.startsWith(SAMPLE_PREFIX)) return null;
    return this.get(flavor.slice(SAMPLE_PREFIX.length));
  },

  add(name, buffer, opts = {}) {
    const id = "s" + (this.nextId++);
    const item = {
      id,
      flavor: SAMPLE_PREFIX + id,
      name: name.replace(/\.[^.]+$/, "").slice(0, 40),
      buffer,
      duration: buffer.duration,
      // Slices are offsets in seconds; a one-shot is simply a single slice
      // covering the whole file.
      slices: opts.slices || [{ start: 0, end: buffer.duration }],
      mode: opts.mode || "oneshot",     // oneshot | sliced | pitched
      // For a pitched sample, which note the recording is actually AT. Play
      // it back at a different rate and it transposes; getting this wrong
      // makes every note wrong by the same interval, which is why it is
      // exposed rather than assumed.
      rootMidi: opts.rootMidi || 60,
      gain: opts.gain === undefined ? 1 : opts.gain,
    };
    this.items.set(id, item);
    return item;
  },

  remove(id) { this.items.delete(id); },
};

// ---------------------------------------------------------------------------
// Slicing a loop at its transients
// ---------------------------------------------------------------------------
// The same onset-detection idea the tempo detector uses, applied to one file
// and asked a different question: not "how often do onsets repeat" but "where
// exactly are they". Energy rises are found on a smoothed envelope, then
// thinned so two detections a few milliseconds apart - the attack and the
// body of one hit - do not become two slices.
function sliceOnTransients(buffer, opts = {}) {
  const { maxSlices = 32, minGapSec = 0.045, sensitivity = 1.4 } = opts;
  const sr = buffer.sampleRate;
  const ch = buffer.getChannelData(0);
  const win = Math.max(64, Math.floor(sr * 0.005));    // 5ms frames
  const frames = Math.floor(ch.length / win);
  if (frames < 4) return [{ start: 0, end: buffer.duration }];

  // Frame energy, in the log domain so a quiet hit counts as much as a loud
  // one - the same reason the onset detector compresses.
  const env = new Float64Array(frames);
  for (let f = 0; f < frames; f++) {
    let e = 0;
    for (let i = f * win; i < (f + 1) * win; i++) e += ch[i] * ch[i];
    env[f] = Math.log(1 + 900 * Math.sqrt(e / win));
  }

  // Rise over a short lookback, which is what a transient is.
  const rise = new Float64Array(frames);
  for (let f = 2; f < frames; f++) rise[f] = Math.max(0, env[f] - Math.max(env[f - 1], env[f - 2]));

  let mean = 0;
  for (let f = 0; f < frames; f++) mean += rise[f];
  mean /= frames;
  let sd = 0;
  for (let f = 0; f < frames; f++) sd += (rise[f] - mean) * (rise[f] - mean);
  sd = Math.sqrt(sd / frames);
  const threshold = mean + sd * sensitivity;

  const minGapFrames = Math.max(1, Math.floor((minGapSec * sr) / win));
  // Deliberately NOT seeded with 0. Almost every recording has some silence
  // before the first hit, and a slice covering it is a slice that plays
  // nothing - which is worse than useless, because slice 0 is the one a
  // sequencer reaches for first. Measured on a test loop with hits at
  // 0.05/0.55/1.05/1.55s, seeding zero produced five slices where the first
  // was 50ms of silence, and every step-0 trigger was inaudible.
  const onsets = [];
  let last = -minGapFrames;
  for (let f = 2; f < frames; f++) {
    if (rise[f] < threshold) continue;
    if (f - last < minGapFrames) continue;
    // Only a local maximum - otherwise one attack fires on several frames.
    if (rise[f] < rise[f - 1] || rise[f] < (rise[f + 1] || 0)) continue;
    onsets.push((f * win) / sr);
    last = f;
    if (onsets.length >= maxSlices) break;
  }

  // If there IS real audio before the first detected onset - a fade-in, a
  // sustained note that never re-attacks - then it needs a slice of its own,
  // otherwise it can never be played. Only add one when it is not silence.
  if (!onsets.length || onsets[0] > 0.01) {
    const upTo = onsets.length ? Math.floor((onsets[0] * sr) / win) : frames;
    let head = 0;
    for (let f = 0; f < upTo; f++) head = Math.max(head, env[f]);
    let overall = 0;
    for (let f = 0; f < frames; f++) overall = Math.max(overall, env[f]);
    if (head > overall * 0.12) onsets.unshift(0);
  }
  if (!onsets.length) onsets.push(0);

  const slices = [];
  for (let i = 0; i < onsets.length; i++) {
    const start = onsets[i];
    const end = i + 1 < onsets.length ? onsets[i + 1] : buffer.duration;
    if (end - start > 0.01) slices.push({ start, end });
  }
  return slices.length ? slices : [{ start: 0, end: buffer.duration }];
}

// Peak-normalise a decoded buffer in place, so a quiet recording and a loud
// one sit at the same level once they are in the kit. Without this every
// loaded sample needs its track gain adjusted by hand before it is usable.
function normaliseBuffer(buffer, target = 0.89) {
  let peak = 0;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const d = buffer.getChannelData(c);
    for (let i = 0; i < d.length; i++) {
      const v = Math.abs(d[i]);
      if (v > peak) peak = v;
    }
  }
  if (peak < 1e-5) return 0;
  const g = target / peak;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const d = buffer.getChannelData(c);
    for (let i = 0; i < d.length; i++) d[i] *= g;
  }
  return g;
}

// Guess whether a file is one hit or a loop worth chopping. A short file is
// a one-shot; a longer one with several transients is a loop. Guessing wrong
// is not costly - the mode is a control the user can flip - but guessing
// right means most files are usable without touching anything.
function guessMode(buffer, sliceCount) {
  if (buffer.duration < 1.2) return "oneshot";
  return sliceCount >= 4 ? "sliced" : "oneshot";
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { SampleBank, sliceOnTransients, normaliseBuffer, guessMode, SAMPLE_PREFIX };
}
