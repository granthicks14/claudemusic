const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
};

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
  const scale = SCALES[scaleName];
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
