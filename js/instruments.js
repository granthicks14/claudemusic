// ---------------------------------------------------------------------------
// What the program knows about each instrument
// ---------------------------------------------------------------------------
// Until now every melodic part was treated as an abstract stream of scale
// degrees: a stack of thirds, transposed by a register offset, played by
// whichever synth voice the track happened to be. That is not how any of
// these instruments actually work. A tenor saxophone cannot play a chord.
// A guitar cannot play the close, stacked-third voicing a pianist's right
// hand plays, because six strings tuned in fourths and a third physically
// cannot reach those notes. A string section doubles its bottom voice an
// octave down; a horn section does not. And every one of them has a range
// outside which it either does not exist or sounds wrong.
//
// This file is that knowledge, written down. It is consumed in two places:
//
//   * patterns.js, in the scale-degree domain, decides WHICH chord tones an
//     instrument plays and how they are spaced (voicing character, voice
//     count).
//   * audio-engine.js, in the MIDI domain (where the key is finally known),
//     clamps the result into the instrument's real range and applies the
//     low interval limit.
//
// Sources for the musical claims are cited inline at each rule.

// MIDI reference: C4 = 60, so C2 = 36, C3 = 48, C5 = 72.
//
// `range`  - the notes the instrument physically has.
// `sweet`  - the register arrangers actually write in. Standard advice for
//            horn writing is to "keep each instrument in a warm register,
//            usually on the staff" rather than at the extremes, and the
//            same is true of every other instrument here; the extremes
//            exist but are special effects, not defaults.
// `voices` - real simultaneous-note capacity. A wind instrument is 1. A
//            guitar is 6 strings but 4-5 in practice. A four-piece horn
//            section is 4 because it is four players.
// `voicing`- how this instrument spaces a chord (see shapeVoicing below).
// `sustain`- true for bowed/blown/drawbar instruments that hold a note at
//            constant level, false for plucked/struck ones that decay. This
//            is what decides whether long note values make sense.
const INSTRUMENT_PROFILE = {
  // Electric bass: low E1 to about G4, but the register that reads as
  // "bass" rather than "low guitar" is the bottom two octaves.
  bass:     { range: [28, 67],  sweet: [28, 55], voices: 2, voicing: "root",    sustain: false, role: "foundation" },
  // Piano: full 88 keys exist, but comping lives between C3 and C6 -
  // below that, close voicings turn to mud (see LOW_INTERVAL_LIMIT).
  piano:    { range: [21, 108], sweet: [48, 84], voices: 6, voicing: "close",   sustain: false, role: "comp" },
  lead:     { range: [55, 96],  sweet: [60, 88], voices: 1, voicing: "mono",    sustain: true,  role: "melody" },
  // Synth pad: no physical limit, so the constraint is purely musical -
  // spread wide, stay out of the bass, and never crowd the vocal range.
  pad:      { range: [36, 96],  sweet: [48, 84], voices: 6, voicing: "spread",  sustain: true,  role: "bed" },
  stab:     { range: [40, 96],  sweet: [55, 84], voices: 4, voicing: "close",   sustain: false, role: "punctuation" },
  // Guitar sounds an octave below written: the open low string is E2, the
  // top of the neck about E6. It cannot play close stacked thirds down
  // low - the shapes do not exist on the fretboard.
  guitar:   { range: [40, 88],  sweet: [40, 76], voices: 5, voicing: "guitar",  sustain: false, role: "rhythm" },
  // Pop string section: cellos at the bottom (C2), violins at the top.
  // Basses "work best in their traditional role of doubling the cello
  // part an octave down", which is why this profile carries doubleLow.
  strings:  { range: [36, 93],  sweet: [48, 84], voices: 5, voicing: "section", sustain: true,  role: "bed", doubleLow: true },
  // A funk/soul horn section is trumpet + alto/tenor + trombone (+ bari).
  // Combined that is roughly E2 to C6, and it is four players, so four
  // notes maximum, voiced drop-2.
  horn:     { range: [40, 84],  sweet: [52, 79], voices: 4, voicing: "drop2",   sustain: true,  role: "punctuation" },
  // Hammond drawbar manual is 61 keys, C2 to C7. Drawbar registration is
  // itself an octave-doubling voicing, so the organ profile adds the
  // octave rather than more thirds.
  organ:    { range: [36, 96],  sweet: [48, 84], voices: 5, voicing: "drawbar", sustain: true,  role: "comp" },
  // Vocal stacks are SATB-shaped: four parts, close, inside one octave
  // and change, sitting where people actually sing.
  vocal:    { range: [43, 81],  sweet: [50, 76], voices: 4, voicing: "close",   sustain: true,  role: "texture" },
  kalimba:  { range: [60, 88],  sweet: [60, 84], voices: 2, voicing: "mono",    sustain: false, role: "melody" },
  marimba:  { range: [36, 96],  sweet: [48, 84], voices: 4, voicing: "spread",  sustain: false, role: "melody" },
  arp:      { range: [48, 96],  sweet: [55, 88], voices: 1, voicing: "mono",    sustain: false, role: "motion" },
  autolead: { range: [50, 79],  sweet: [55, 74], voices: 1, voicing: "mono",    sustain: true,  role: "hook" },
  // Tenor sax concert range is roughly Ab2 to E5, and it is a wind
  // instrument: exactly one note at a time, always.
  sax:      { range: [44, 79],  sweet: [48, 74], voices: 1, voicing: "mono",    sustain: true,  role: "melody" },
  // The rest of the woodwind family, as one track. The pool spans a
  // concert flute at the top (C4 up) down to a bassoon and a bass
  // clarinet, so the track's range is the union; each individual flavor
  // then sets its own character. Like the sax, all of them are wind
  // instruments - strictly one note at a time.
  woodwind: { range: [46, 91],  sweet: [55, 84], voices: 1, voicing: "mono",    sustain: true,  role: "melody" },
  // Lead guitar sits an octave up from where rhythm guitar is voiced -
  // solos live on the top strings and up the neck, not in open position.
  leadguitar: { range: [52, 88], sweet: [59, 84], voices: 1, voicing: "mono",  sustain: true,  role: "melody" },
  // A talkbox is limited by the player's mouth, which is a small, fixed
  // resonator - push far outside a singing range and the vowels stop
  // reading as vowels. So it lives where a voice lives.
  talkbox:  { range: [45, 76],  sweet: [50, 72], voices: 1, voicing: "mono",    sustain: true,  role: "hook" },
};

// ---------------------------------------------------------------------------
// Low interval limit
// ---------------------------------------------------------------------------
// Two notes close together in a low register stop being heard as an
// interval and start being heard as mud: below a certain pitch "there is a
// real risk that the resulting sound will not work well within a normal
// harmonic context", because the partials of the two notes beat against
// each other faster than the ear can separate them. Arrangers work from a
// chart of the lowest pitch at which each interval stays clear.
//
// Indexed by interval size in semitones; the value is the lowest MIDI note
// the BOTTOM voice may sit at for that interval to still read clearly.
// Intervals of a 9th or wider are always fine, which is exactly why open
// and drop-2 voicings exist.
const LOW_INTERVAL_LIMIT = [
  0,   // unison - always fine
  52,  // m2  - E3
  51,  // M2  - Eb3
  48,  // m3  - C3
  46,  // M3  - Bb2
  46,  // P4  - Bb2
  41,  // TT  - F2
  34,  // P5  - Bb1
  43,  // m6  - G2
  41,  // M6  - F2
  41,  // m7  - F2
  41,  // M7  - F2
  28,  // P8  - E1
];

function intervalIsClear(lowMidi, semitones) {
  if (semitones >= 13) return true; // wider than an octave: always clear
  const limit = LOW_INTERVAL_LIMIT[semitones];
  return limit === undefined || lowMidi >= limit;
}

// ---------------------------------------------------------------------------
// Voicing character, in the scale-degree domain
// ---------------------------------------------------------------------------
// Input is a plain stack of thirds ([0,2,4,6] = root/3rd/5th/7th in scale
// degrees, 7 degrees to the octave). Output is the same chord respaced the
// way this instrument's players would actually voice it.
function shapeVoicing(degrees, inst) {
  const profile = INSTRUMENT_PROFILE[inst];
  if (!profile || degrees.length < 2) return degrees;
  const style = profile.voicing;
  let out = degrees.slice();

  if (style === "mono" || style === "root") {
    // Nothing to space - these are single-line instruments.
    return out.slice(0, profile.voices);
  }

  if (style === "spread") {
    // Open position: lift the second-lowest voice an octave. This is the
    // standard way to convert a close voicing to an open one, and it is
    // what stops a synth pad or a mallet part sounding like a block.
    if (out.length >= 3) out[1] += 7;
    out.sort((a, b) => a - b);
  } else if (style === "drop2") {
    // Drop-2: voice the chord close, then drop the second voice from the
    // top down an octave. It is the default four-part horn-section
    // voicing precisely because it opens the chord without any voice
    // having to leave its warm register.
    if (out.length >= 4) {
      const i = out.length - 2;
      out[i] -= 7;
      out.sort((a, b) => a - b);
    }
  } else if (style === "guitar") {
    // Guitar shapes are built on strings tuned in fourths, so the lower
    // voices sit a fifth and an octave apart, not a third - the close
    // stacked-third shape a pianist uses does not exist on the neck.
    // Root - 5th - octave - 10th is the shape almost every rock, funk and
    // pop rhythm guitar part is some subset of.
    const root = out[0];
    out = [root, root + 4, root + 7];
    if (degrees.length >= 3) out.push(root + 9);       // the 3rd, up an octave (a 10th)
    if (degrees.length >= 4) out.push(root + 13);      // the 7th, higher still
  } else if (style === "section") {
    // String section: spread the chord evenly, and double the bottom voice
    // an octave down for the basses. "Notes which are spread evenly across
    // the section will yield a more pleasant-sounding result", and the
    // basses doubling the cellos an octave down is their traditional role.
    if (out.length >= 3) out[1] += 7;
    out.sort((a, b) => a - b);
    if (profile.doubleLow) out.unshift(out[0] - 7);
  } else if (style === "drawbar") {
    // Hammond drawbars are literally an octave-doubling device - the 16'
    // and 4' bars add the octave below and above whatever you play. So
    // the organ voicing adds an octave rather than another third.
    out.push(out[0] + 7);
    out.sort((a, b) => a - b);
  }

  // Physical voice count. Keep the bottom (which defines the harmony) and
  // the top (which carries the line), thin from the middle.
  if (out.length > profile.voices) {
    const keep = [out[0], out[out.length - 1]];
    for (let i = out.length - 2; i > 0 && keep.length < profile.voices; i--) keep.push(out[i]);
    out = keep.sort((a, b) => a - b);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Range and clarity fitting, in the MIDI domain
// ---------------------------------------------------------------------------
// Called at playback, once the key is known and scale degrees have become
// real pitches. Two jobs: put the chord where the instrument lives, and
// remove intervals that would be mud down there.
function fitChordToInstrument(midis, inst) {
  const profile = INSTRUMENT_PROFILE[inst];
  if (!profile || !midis.length) return midis;
  let out = midis.slice().sort((a, b) => a - b);

  // 1. Octave-shift the whole chord into range. Shifting the chord as a
  //    unit preserves the voicing; clamping each note individually would
  //    collapse it into a cluster.
  const [lo, hi] = profile.range;
  let guard = 0;
  while (out[0] < lo && guard++ < 6) out = out.map((m) => m + 12);
  guard = 0;
  while (out[out.length - 1] > hi && guard++ < 6) out = out.map((m) => m - 12);

  // 2. Any voice still outside the range after that is simply not playable
  //    on this instrument - drop it rather than move it, which would
  //    change the voicing.
  out = out.filter((m) => m >= lo && m <= hi);
  if (out.length < 2) return out;

  // 3. Low interval limit, from the bottom up. If the bottom two voices
  //    are too close for that pitch, lift the upper one an octave; if that
  //    puts it out of range, drop it entirely.
  const fixed = [out[0]];
  for (let i = 1; i < out.length; i++) {
    let m = out[i];
    const below = fixed[fixed.length - 1];
    if (!intervalIsClear(below, m - below)) {
      const lifted = m + 12;
      if (lifted <= hi && !fixed.includes(lifted)) m = lifted;
      else continue;
    }
    if (!fixed.includes(m)) fixed.push(m);
  }
  return fixed;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { INSTRUMENT_PROFILE, LOW_INTERVAL_LIMIT, intervalIsClear, shapeVoicing, fitChordToInstrument };
}
