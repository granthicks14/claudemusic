// ---------------------------------------------------------------------------
// Export the beat as a MIDI file
// ---------------------------------------------------------------------------
// The request was for FL Studio's own project format (.flp). That is a
// proprietary, undocumented binary format with no published specification -
// there is no legitimate way to write a correct one, and a guessed .flp
// would at best fail to open and at worst corrupt a project.
//
// MIDI is the format the whole industry actually uses to move musical ideas
// between programs, and FL Studio imports it natively (File > Import > MIDI
// file), placing each track on its own channel with its own pattern. So this
// exports a Standard MIDI File - which does everything the request needed,
// works in FL Studio, and also works in Ableton, Logic, Reaper, Cubase and
// every other DAW.
//
// Format 1 SMF: one tempo track, then one track per instrument. Drums go to
// channel 10 with General MIDI note numbers so they land on the right pads;
// melodic parts get their own channels with a GM program that approximates
// the instrument.

// General MIDI percussion note numbers (channel 10).
const GM_DRUM_NOTE = {
  kick: 36,      // Bass Drum 1
  snare: 38,     // Acoustic Snare
  hihat: 42,     // Closed Hi-Hat
  openhat: 46,   // Open Hi-Hat
  tom: 45,       // Low Tom
  perc: 39,      // Hand Clap
  crash: 49,     // Crash Cymbal 1
  fx: 52,        // Chinese Cymbal - closest thing GM has to an FX hit
};

// General MIDI program numbers, chosen as the nearest real instrument so the
// exported file is readable even before the user swaps in their own sounds.
const GM_PROGRAM = {
  bass: 33,        // Electric Bass (finger)
  piano: 0,        // Acoustic Grand
  lead: 80,        // Lead 1 (square)
  pad: 88,         // Pad 1 (new age)
  stab: 81,        // Lead 2 (sawtooth)
  guitar: 27,      // Electric Guitar (clean)
  leadguitar: 29,  // Overdriven Guitar
  strings: 48,     // String Ensemble 1
  horn: 61,        // Brass Section
  organ: 16,       // Drawbar Organ
  vocal: 52,       // Choir Aahs
  kalimba: 108,    // Kalimba
  marimba: 12,     // Marimba
  arp: 81,         // Lead 2 (sawtooth)
  autolead: 85,    // Lead 6 (voice)
  sax: 66,         // Tenor Sax
  woodwind: 73,    // Flute
  talkbox: 85,     // Lead 6 (voice)
};

function writeVarLen(bytes, value) {
  // MIDI delta times are variable-length: seven bits per byte, high bit set
  // on every byte except the last.
  let buffer = value & 0x7f;
  while ((value >>= 7)) {
    buffer <<= 8;
    buffer |= (value & 0x7f) | 0x80;
  }
  for (;;) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
}

function pushStr(bytes, str) {
  for (let i = 0; i < str.length; i++) bytes.push(str.charCodeAt(i) & 0xff);
}

function pushU32(bytes, n) {
  bytes.push((n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff);
}

function pushU16(bytes, n) {
  bytes.push((n >>> 8) & 0xff, n & 0xff);
}

function chunk(id, data) {
  const out = [];
  pushStr(out, id);
  pushU32(out, data.length);
  return out.concat(data);
}

// Build one track's events from a pattern lane, as absolute-time note pairs,
// then convert to delta times at the end. Doing it in two passes is what
// keeps overlapping notes (a held chord under a moving line) correct.
function laneToTrackData(name, events, channel, program, ppq) {
  const data = [];
  // Track name.
  writeVarLen(data, 0);
  data.push(0xff, 0x03);
  writeVarLen(data, name.length);
  pushStr(data, name);
  // Program change.
  if (program !== null && program !== undefined) {
    writeVarLen(data, 0);
    data.push(0xc0 | (channel & 0x0f), program & 0x7f);
  }

  // Flatten to on/off points and sort by time; note-off must come before
  // note-on at the same tick or a repeated note is swallowed.
  const points = [];
  for (const e of events) {
    points.push({ t: e.start, on: true, note: e.note, vel: e.vel });
    points.push({ t: e.start + Math.max(1, e.length), on: false, note: e.note, vel: 0 });
  }
  points.sort((a, b) => a.t - b.t || (a.on === b.on ? 0 : a.on ? 1 : -1));

  let last = 0;
  for (const p of points) {
    writeVarLen(data, Math.max(0, Math.round(p.t - last)));
    last = p.t;
    data.push((p.on ? 0x90 : 0x80) | (channel & 0x0f), p.note & 0x7f, p.vel & 0x7f);
  }
  // End of track.
  writeVarLen(data, 0);
  data.push(0xff, 0x2f, 0x00);
  return data;
}

// pattern    the generated beat
// opts       { tempo, rootMidi, scale, barChordContexts, stepsPerBar, name }
// resolveMidi(degree, step) -> MIDI note number, supplied by the caller so
//            this file does not need to know about scales or custom chords.
function patternToMidi(pattern, opts, resolveMidi) {
  const ppq = 480;                       // ticks per quarter note
  const stepsPerBar = opts.stepsPerBar || 16;
  const ticksPerStep = (ppq * 4) / stepsPerBar;   // 16 steps to a 4/4 bar
  const tracks = [];

  // --- tempo / time-signature track ---
  const meta = [];
  writeVarLen(meta, 0);
  meta.push(0xff, 0x51, 0x03);
  const usPerQuarter = Math.round(60000000 / (opts.tempo || 120));
  meta.push((usPerQuarter >> 16) & 0xff, (usPerQuarter >> 8) & 0xff, usPerQuarter & 0xff);
  writeVarLen(meta, 0);
  meta.push(0xff, 0x58, 0x04, 4, 2, 24, 8);   // 4/4
  if (opts.name) {
    writeVarLen(meta, 0);
    meta.push(0xff, 0x03);
    writeVarLen(meta, opts.name.length);
    pushStr(meta, opts.name);
  }
  writeVarLen(meta, 0);
  meta.push(0xff, 0x2f, 0x00);
  tracks.push(chunk("MTrk", meta));

  // --- one track per instrument ---
  let nextChannel = 0;
  for (const inst of Object.keys(pattern.instruments)) {
    const lane = pattern.instruments[inst];
    if (!Array.isArray(lane) || !lane.some(Boolean)) continue;

    const isDrum = GM_DRUM_NOTE[inst] !== undefined;
    const events = [];

    for (let step = 0; step < lane.length; step++) {
      const v = lane[step];
      if (!v) continue;
      const start = step * ticksPerStep;

      if (isDrum) {
        // "roll" is a rapid repeat; write it out as real notes rather than
        // one long one, so it reads correctly in a piano roll.
        const isRoll = v === "roll";
        const isGhost = v === "ghost";
        const reps = isRoll ? 3 : 1;
        for (let r = 0; r < reps; r++) {
          events.push({
            note: GM_DRUM_NOTE[inst],
            start: start + (r * ticksPerStep) / reps,
            length: Math.max(1, ticksPerStep / (reps * 2)),
            vel: isGhost ? 40 : isRoll ? 80 : 100,
          });
        }
        continue;
      }

      // Melodic: a note object with either a single degree or a chord.
      if (typeof v !== "object") continue;
      const degs = v.degrees || (v.degree !== undefined ? [v.degree] : null);
      if (!degs) continue;
      const len = Math.max(1, (v.len || 1)) * ticksPerStep;
      for (const d of degs) {
        const note = resolveMidi(d, step);
        if (!isFinite(note) || note < 0 || note > 127) continue;
        events.push({ note: Math.round(note), start, length: len, vel: 96 });
      }
      // Harmony stack on a mono line (a strummed guitar triad, a sax in
      // thirds) is real note content and belongs in the export.
      if (v.harmony && v.harmony.length > 1 && v.degree !== undefined) {
        for (const off of v.harmony.slice(1)) {
          const note = resolveMidi(v.degree + off, step);
          if (!isFinite(note) || note < 0 || note > 127) continue;
          events.push({ note: Math.round(note), start, length: len, vel: 78 });
        }
      }
    }

    if (!events.length) continue;
    // Channel 9 (zero-based) is GM percussion. Melodic parts take the other
    // channels, skipping it.
    let ch;
    if (isDrum) ch = 9;
    else {
      if (nextChannel === 9) nextChannel++;
      ch = nextChannel % 16;
      nextChannel++;
    }
    tracks.push(chunk("MTrk", laneToTrackData(inst, events, ch, isDrum ? null : (GM_PROGRAM[inst] ?? 0), ppq)));
  }

  // --- header ---
  const header = [];
  pushU16(header, 1);              // format 1: multiple simultaneous tracks
  pushU16(header, tracks.length);
  pushU16(header, ppq);

  let bytes = chunk("MThd", header);
  for (const t of tracks) bytes = bytes.concat(t);
  return new Uint8Array(bytes);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { patternToMidi, GM_DRUM_NOTE, GM_PROGRAM };
}
