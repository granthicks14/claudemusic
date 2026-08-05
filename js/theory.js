const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  // Natural minor with the 7th raised a semitone. The augmented second it
  // opens up between the 6th and the raised 7th is the interval that makes it
  // sound tense rather than merely sad, and it is one of the three scales
  // every guide to trap melody names - natural minor as the default, harmonic
  // minor and Phrygian for the darker and more aggressive end.
  harmonicminor: [0, 2, 3, 5, 7, 8, 11],
  // Phrygian with a major third. The most aggressive of the set: the b2
  // against a major 3rd is the sound of the hardest drill and rage beats.
  phrygiandominant: [0, 1, 4, 5, 7, 8, 10],
  // Major with a flat 7. The mode of funk, of a lot of rock, and of every
  // dominant-7th vamp that never resolves.
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  // Major with a raised 4. Bright without being plain - the dreamy one.
  lydian: [0, 2, 4, 6, 7, 9, 11],
  // Minor with both the 6th and 7th raised. The jazz minor: it lets a minor
  // chord carry a leading tone without the augmented second harmonic minor
  // opens up.
  melodicminor: [0, 2, 3, 5, 7, 9, 11],
};

// The pentatonic subset of each mode, as indices into the seven degrees above.
//
// This is the single most useful fact in melodic writing and the program did
// not know it. A seven-note scale contains two "avoid" notes against its own
// tonic chord - in minor that is the 2nd and the 6th, in major the 4th and the
// 7th - and a melody that lands on one by accident is the thing that makes a
// tune sound arbitrary rather than written. The pentatonic is exactly the
// scale with those notes removed, which is why it is what blues, soul, hip
// hop, rock and most folk music the world over actually sing.
//
// Kept as a subset rather than as its own five-note scale on purpose: chords
// still need all seven degrees to stack thirds, and the two omitted notes are
// still wanted as passing tones. What changes is where a melody RESTS.
const PENTATONIC_DEGREES = {
  major:            [0, 1, 2, 4, 5],   // 1 2 3 5 6
  lydian:           [0, 1, 2, 4, 5],
  mixolydian:       [0, 1, 2, 4, 5],
  minor:            [0, 2, 3, 4, 6],   // 1 b3 4 5 b7
  dorian:           [0, 2, 3, 4, 6],
  phrygian:         [0, 2, 3, 4, 6],
  harmonicminor:    [0, 2, 3, 4, 6],
  melodicminor:     [0, 2, 3, 4, 6],
  phrygiandominant: [0, 2, 3, 4, 6],
};

// The blue note: the flat 5 sitting between the 4th and the 5th. Added to a
// minor pentatonic it is the blues scale, and it is a passing tone rather
// than a resting place - which is exactly how it is written here.
function isPentatonicDegree(scaleName, degreeIndex) {
  const set = PENTATONIC_DEGREES[scaleName];
  if (!set) return true;
  const len = (SCALES[scaleName] || SCALES.minor).length;
  return set.includes(((degreeIndex % len) + len) % len);
}

const ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii"];

function noteNameToMidi(name) {
  const m = name.match(/^([A-G]#?)(-?\d+)$/);
  const idx = NOTE_NAMES.indexOf(m[1]);
  const octave = parseInt(m[2], 10);
  return (octave + 1) * 12 + idx;
}

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function midiToName(midi) {
  const idx = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return NOTE_NAMES[idx] + octave;
}

function scaleDegreeToMidi(rootMidi, scaleName, degreeIndex) {
  // scaleName is usually one of the SCALES keys, but the custom-chords
  // feature below needs a one-off 7-note "chord-scale" per user chord
  // that isn't one of the four named modes - passing the array straight
  // through instead of a name lets every existing consumer of this
  // function (melody generation, chord voicing, playback) work completely
  // unchanged in that mode too.
  const scale = Array.isArray(scaleName) ? scaleName : SCALES[scaleName];
  const len = scale.length;
  const octaveShift = Math.floor(degreeIndex / len);
  const idx = ((degreeIndex % len) + len) % len;
  return rootMidi + octaveShift * 12 + scale[idx];
}

function degreeToFreq(rootMidi, scaleName, degreeIndex) {
  return midiToFreq(scaleDegreeToMidi(rootMidi, scaleName, degreeIndex));
}

function degreeToLabel(rootMidi, scaleName, degreeIndex) {
  return midiToName(scaleDegreeToMidi(rootMidi, scaleName, degreeIndex));
}

function chordDegrees(rootDegree, size) {
  const out = [];
  for (let i = 0; i < size; i++) out.push(rootDegree + i * 2);
  return out;
}

function romanForDegree(degreeIndex) {
  const idx = ((degreeIndex % 7) + 7) % 7;
  return ROMAN[idx];
}

// ---- Custom chord input ----
// Everything in this file up to here treats harmony as an abstract 7-note
// scale plus an integer "degree index" into it (root=0, third=+2, fifth=+4,
// seventh=+6, since chords are built by stacking thirds - see chordDegrees).
// That's genuinely genre-agnostic: it doesn't care *which* 7-note scale is
// plugged in, only that index 0/2/4/6 land on sensible chord tones and
// 1/3/5 on sensible passing tones. So instead of teaching the whole
// generator a second, parallel harmony system for user-typed chords, each
// parsed chord just gets its own tiny 7-note "chord-scale" built from real
// chord-scale theory (the same root/mode pairing a jazz player would reach
// for over that chord - Dorian under a m7, Mixolydian under a dominant
// 7th, and so on) and gets dropped into the exact same machinery.
const PITCH_CLASS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// [0]=root [2]=third-equivalent [4]=fifth-equivalent [6]=seventh-equivalent,
// with 1/3/5 filled by the chord-scale's other real scale tones so passing
// notes still sound like they belong to the chord, not just "diatonic-ish."
const QUALITY_SCALES = {
  maj:   [0, 2, 4, 5, 7, 9, 11],  // Ionian
  maj7:  [0, 2, 4, 5, 7, 9, 11],  // Ionian
  six:   [0, 2, 4, 5, 7, 9, 11],  // Ionian (6th at index 5)
  add9:  [0, 2, 4, 5, 7, 9, 11],  // Ionian (9th at index 1)
  m:     [0, 2, 3, 5, 7, 9, 10],  // Dorian
  m7:    [0, 2, 3, 5, 7, 9, 10],  // Dorian
  m6:    [0, 2, 3, 5, 7, 9, 10],  // Dorian (6th at index 5)
  mMaj7: [0, 2, 3, 5, 7, 9, 11],  // Melodic minor
  dom7:  [0, 2, 4, 5, 7, 9, 10],  // Mixolydian
  nine:  [0, 2, 4, 5, 7, 9, 10],  // Mixolydian
  dim:   [0, 2, 3, 5, 6, 8, 10],  // Locrian nat2
  m7b5:  [0, 1, 3, 5, 6, 8, 10],  // Locrian
  dim7:  [0, 2, 3, 5, 6, 8, 9],   // whole-half diminished (7-note approx.)
  aug:   [0, 2, 4, 6, 8, 9, 11],  // whole-tone-leaning
  sus2:  [0, 4, 2, 5, 7, 9, 10],
  sus4:  [0, 2, 5, 4, 7, 9, 10],
  five:  [0, 2, 7, 9, 12, 14, 19],
};

// Case matters here in a way it doesn't for most parsing: "m7" (minor 7)
// and "M7" (major 7) are different chords that differ only in the case of
// one letter, so the bare m/M forms have to be checked case-sensitively
// before anything gets lowercased - a blanket case-insensitive match would
// silently treat every minor chord typed with a lowercase "m" as major.
const M_SUFFIX_SCALE = { "": "maj", "6": "six", "7": "maj7", "9": "maj7" };
const MIN_SUFFIX_SCALE = { "": "m", "6": "m6", "7": "m7", "9": "m7" };

// Case-insensitive fallback table for every multi-letter/numeral-only
// spelling, which has no m/M ambiguity to worry about.
const QUALITY_PATTERNS_CI = [
  [/^(maj7|δ7?|maj9|δ9)$/, "maj7", "maj7"],
  [/^(m7b5|m7-5|[oø]7?|min7b5)$/, "m7b5", "m7♭5"],
  [/^(dim7|°7)$/, "dim7", "dim7"],
  [/^(dim|°)$/, "dim", "dim"],
  [/^(m\(maj7\)|minmaj7)$/, "mMaj7", "m(maj7)"],
  [/^(min6)$/, "m6", "m6"],
  [/^(min9)$/, "m7", "m9"],
  [/^(min7)$/, "m7", "m7"],
  [/^(add9)$/, "add9", "add9"],
  [/^(sus2)$/, "sus2", "sus2"],
  [/^(sus4|sus)$/, "sus4", "sus4"],
  [/^(aug|\+)$/, "aug", "aug"],
  [/^(6)$/, "six", "6"],
  [/^(9)$/, "nine", "9"],
  [/^(7)$/, "dom7", "7"],
  [/^(5)$/, "five", "5"],
  [/^(min|-)$/, "m", "m"],
  [/^$/, "maj", ""],
];

function matchChordQuality(suffix) {
  if (/^M(6|7|9)?$/.test(suffix)) {
    const rest = suffix.slice(1);
    return { scale: QUALITY_SCALES[M_SUFFIX_SCALE[rest]], suffixLabel: rest ? "maj" + rest : "" };
  }
  if (/^m(6|7|9)?$/.test(suffix)) {
    const rest = suffix.slice(1);
    return { scale: QUALITY_SCALES[MIN_SUFFIX_SCALE[rest]], suffixLabel: "m" + rest };
  }
  const lower = suffix.toLowerCase();
  for (const [re, key, label] of QUALITY_PATTERNS_CI) {
    if (re.test(lower)) return { scale: QUALITY_SCALES[key], suffixLabel: label };
  }
  return null;
}

// Parses one chord symbol ("Cm7", "F#maj7", "Bb", "G7", "A/E"...) into a
// pitch class + a chord-scale. A slash bass note (the "/E" in "C/E") is
// accepted but its bass note isn't tracked separately yet - the chord's own
// root still drives the bass line, which is the right call the vast
// majority of the time and never crashes on the input either way.
function parseChordSymbol(token) {
  const raw = (token || "").trim().split("/")[0];
  if (!raw) return null;
  const m = raw.match(/^([A-Ga-g])([#♯ b♭]?)(.*)$/);
  if (!m) return null;
  const letter = m[1].toUpperCase();
  const accidental = (m[2] || "").trim();
  let pc = PITCH_CLASS[letter];
  if (accidental === "#" || accidental === "♯") pc += 1;
  else if (accidental === "b" || accidental === "♭") pc -= 1;
  pc = ((pc % 12) + 12) % 12;

  const quality = matchChordQuality(m[3].trim());
  if (!quality) return null;

  return {
    label: NOTE_NAMES[pc] + quality.suffixLabel,
    rootPitchClass: pc,
    scale: quality.scale,
  };
}

// Splits a whole typed progression ("Cm7 Fm7 Bb7 Ebmaj7", "Am, F, C, G",
// "C -> G -> Am -> F") into individual parsed chords, reporting anything
// that didn't parse so the UI can point it out instead of silently
// dropping it.
function parseChordProgression(text) {
  const cleaned = (text || "").replace(/->|→/g, " ");
  const tokens = cleaned.trim().split(/[\s,|]+/).filter(Boolean);
  const chords = [];
  const invalid = [];
  for (const tok of tokens) {
    const parsed = parseChordSymbol(tok);
    if (parsed) chords.push(parsed);
    else invalid.push(tok);
  }
  return { chords, invalid };
}

// Resolves each chord's root to an actual MIDI note, picking whichever
// octave (same/-12/+12 relative to the previous chord) keeps consecutive
// roots closest together - the same "closest voicing" logic a real
// arranger uses so the bass/chords don't leap an octave for no reason
// just because the roots happen to be C then B.
function resolveChordRootMidis(chords, baseOctave) {
  let prevMidi = null;
  return chords.map((c) => {
    let midi = noteNameToMidi(NOTE_NAMES[c.rootPitchClass] + baseOctave);
    if (prevMidi !== null) {
      let best = midi;
      let bestDist = Math.abs(midi - prevMidi);
      for (const alt of [midi - 12, midi + 12]) {
        const d = Math.abs(alt - prevMidi);
        if (d < bestDist) { best = alt; bestDist = d; }
      }
      midi = best;
    }
    prevMidi = midi;
    return midi;
  });
}
