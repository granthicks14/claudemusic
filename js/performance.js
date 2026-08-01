// ---------------------------------------------------------------------------
// How a chord is physically played
// ---------------------------------------------------------------------------
// Everything the program knew about chords up to now was WHICH notes are in
// them and WHERE the instrument can put them. What it did not model at all
// is how a human actually executes one - and that, far more than timbre, is
// what separates a piano or guitar track from a MIDI file.
//
// The tell was in one line of the scheduler: every note of a chord was
// started at exactly the same timestamp with exactly the same velocity. No
// pianist has ever done that - ten fingers cannot strike within a
// microsecond of each other - and a guitarist physically cannot, because a
// pick crosses six strings one at a time. Simultaneous, equal-velocity
// onsets are the single most recognisable "this is not a person" cue in
// programmed music.
//
// This file turns a set of pitches into a set of EVENTS: each note gets its
// own small time offset, its own velocity, and its own duration. The rules
// below are ordinary performance practice.

// Approximate spread, in seconds, from the lowest note of a chord to the
// highest. A pick crossing six strings takes noticeably longer than a hand
// dropping onto a keyboard, and an upstroke is faster than a downstroke
// because it travels with less of the player's arm behind it.
const SPREAD = {
  block: 0.012,      // "together" - but never actually together
  roll: 0.055,       // a deliberately rolled piano chord
  strumDown: 0.028,
  strumUp: 0.016,
  chuck: 0.008,      // a muted funk scratch is almost a single event
};

// Turn a voiced chord into individual note events.
//
//   midis   sorted ascending
//   opts    { artic, step, noteDur, vel, spreadScale }
//
// Returns [{ midi, delay, vel, dur }] with delay in seconds from the beat.
function performChord(midis, opts = {}) {
  const {
    artic = "block",
    step = 0,
    noteDur = 0.5,
    vel = 0.7,
    humanise = 1,
  } = opts;
  if (!midis || !midis.length) return [];
  const notes = midis.slice().sort((a, b) => a - b);
  const n = notes.length;
  const out = [];

  // --- Guitar strokes ------------------------------------------------
  // A strumming hand keeps moving in a constant down-up cycle whether or
  // not it hits the strings, so which stroke lands on a given step is not
  // a free choice: downbeats get downstrokes, the "and" gets upstrokes.
  // An upstroke starts at the thin strings and only catches the top few,
  // and it is quieter - that asymmetry is most of what a strummed part's
  // groove actually is.
  if (artic === "strum") {
    const isUp = step % 2 === 1;
    const stroke = isUp ? notes.slice(Math.max(0, n - 3)).reverse() : notes;
    const spread = (isUp ? SPREAD.strumUp : SPREAD.strumDown) * humanise;
    const gap = stroke.length > 1 ? spread / (stroke.length - 1) : 0;
    stroke.forEach((midi, i) => {
      out.push({
        midi,
        // Clamped at zero: a negative offset would schedule the note
        // before the beat, and Web Audio silently drops anything asked
        // for in the past.
        delay: Math.max(0, i * gap + (Math.random() - 0.5) * 0.004),
        // Strings the pick has already passed ring slightly longer, and
        // the first string struck is hit hardest.
        vel: vel * (isUp ? 0.62 : 1) * (1 - i * 0.045),
        dur: noteDur,
      });
    });
    return out;
  }

  if (artic === "chuck") {
    // The funk 16th-note "chuck": the fretting hand relaxes so the strings
    // are damped, and the pick scrapes across them. Pitched content barely
    // survives; what you hear is rhythm.
    const gap = (SPREAD.chuck * humanise) / Math.max(1, n - 1);
    notes.forEach((midi, i) => {
      out.push({ midi, delay: i * gap, vel: vel * 0.5, dur: Math.min(noteDur, 0.07) });
    });
    return out;
  }

  if (artic === "travis") {
    // Travis picking: the thumb keeps a steady alternating bass while the
    // fingers pick treble notes between those beats. It is two independent
    // rhythms from one hand, which is why fingerpicked parts sound nothing
    // like strummed ones even on the same chord.
    const bass = notes.slice(0, Math.min(2, n));
    const treble = notes.slice(Math.min(2, n));
    const q = noteDur / 4;
    bass.forEach((midi, i) => {
      out.push({ midi, delay: i * q * 2, vel: vel * 0.85, dur: noteDur });
    });
    treble.forEach((midi, i) => {
      // The fingers fall BETWEEN the thumb's beats - stepping by a whole
      // beat, not a half, or the treble collides with the alternating
      // bass instead of interlocking with it.
      out.push({ midi, delay: q + i * q * 2, vel: vel * 0.7, dur: noteDur * 0.7 });
    });
    return out;
  }

  // --- Keyboard articulations ----------------------------------------
  if (artic === "arpeggio") {
    // Rolling through the chord across the note's whole length, the way a
    // ballad or lo-fi piano part moves rather than sitting on a block.
    const span = Math.min(noteDur * 0.85, 1.2);
    const gap = n > 1 ? span / n : 0;
    notes.forEach((midi, i) => {
      out.push({
        midi,
        delay: Math.max(0, i * gap + (Math.random() - 0.5) * 0.008 * humanise),
        vel: vel * (0.8 + (i / Math.max(1, n - 1)) * 0.25),
        dur: noteDur - i * gap,
      });
    });
    return out;
  }

  if (artic === "broken") {
    // The classic ballad left hand: the bass note lands on the beat, the
    // rest of the voicing follows a moment later. Two gestures, not one.
    const gapT = Math.min(noteDur * 0.25, 0.16);
    out.push({ midi: notes[0], delay: 0, vel: vel * 0.95, dur: noteDur });
    notes.slice(1).forEach((midi, i) => {
      out.push({
        midi,
        delay: gapT + i * 0.009 * humanise,
        vel: vel * 0.72,
        dur: noteDur - gapT,
      });
    });
    return out;
  }

  if (artic === "stride") {
    // Stride: root (or root-fifth) on the beat, the upper voicing on the
    // offbeat. The left hand literally strides between two registers.
    const half = noteDur / 2;
    out.push({ midi: notes[0], delay: 0, vel: vel, dur: half * 0.9 });
    notes.slice(1).forEach((midi, i) => {
      out.push({ midi, delay: half + i * 0.008 * humanise, vel: vel * 0.7, dur: half * 0.9 });
    });
    return out;
  }

  if (artic === "roll") {
    const spread = SPREAD.roll * humanise;
    const gap = n > 1 ? spread / (n - 1) : 0;
    notes.forEach((midi, i) => {
      out.push({
        midi,
        delay: i * gap,
        vel: vel * (0.78 + (i / Math.max(1, n - 1)) * 0.3),
        dur: noteDur - i * gap,
      });
    });
    return out;
  }

  // --- Block, i.e. "all at once" --------------------------------------
  // Even a chord meant to sound simultaneous is not. Two things happen on
  // every real one:
  //
  //  * MELODY LEAD. The top voice is struck slightly AHEAD of the rest -
  //    a well-documented feature of expressive keyboard performance, and
  //    how a pianist makes a melody read as a melody rather than as the
  //    top of a chord. It is also played harder for the same reason.
  //  * The inner voices scatter by a few milliseconds because fingers are
  //    not a machine.
  const lead = 0.016 * humanise;
  notes.forEach((midi, i) => {
    const isTop = i === n - 1;
    out.push({
      midi,
      delay: (isTop ? 0 : lead) + Math.random() * SPREAD.block * humanise,
      // Top voice projected, bass supported, inner voices held back so the
      // chord has a shape instead of being a wall.
      vel: vel * (isTop ? 1.12 : i === 0 ? 0.95 : 0.72),
      dur: noteDur,
    });
  });
  return out;
}

// Which articulations make sense on which instrument. A pad cannot be
// strummed and a guitar cannot play stride.
const INSTRUMENT_ARTICULATIONS = {
  piano:  [["block", 4], ["broken", 3], ["arpeggio", 2], ["roll", 2], ["stride", 1]],
  stab:   [["block", 6], ["roll", 1]],
  organ:  [["block", 5], ["broken", 1]],
  guitar: [["strum", 5], ["chuck", 2], ["travis", 2], ["arpeggio", 1]],
  strings:[["block", 4], ["roll", 2]],
  horn:   [["block", 1]],
  vocal:  [["block", 3], ["roll", 1]],
  pad:    [["block", 1]],
};

function pickArticulation(inst) {
  const pool = INSTRUMENT_ARTICULATIONS[inst];
  if (!pool) return "block";
  const total = pool.reduce((a, [, w]) => a + w, 0);
  let r = Math.random() * total;
  for (const [name, w] of pool) {
    r -= w;
    if (r <= 0) return name;
  }
  return pool[0][0];
}

// The sustain pedal. A pianist holds it down through a chord and lifts it
// on the change, so notes ring well past their written length and blend
// into each other. Without this, every piano part sounds staccato and
// separated no matter how good the voicing is.
const PEDAL_MULTIPLIER = {
  piano: 1.9,
  stab: 1.0,
  organ: 1.0,     // an organ holds a note by definition; no pedal needed
  guitar: 1.35,   // open strings keep ringing after the hand moves on
  strings: 1.1,
  vocal: 1.15,
  pad: 1.0,
  horn: 1.0,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { performChord, pickArticulation, INSTRUMENT_ARTICULATIONS, PEDAL_MULTIPLIER, SPREAD };
}
