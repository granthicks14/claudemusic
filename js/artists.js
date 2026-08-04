// ---------------------------------------------------------------------------
// "Type beats"
// ---------------------------------------------------------------------------
// A "type beat" is an established, legitimate thing producers make: a beat in
// the STYLE of an artist, not a copy of any of their work. What is being
// reproduced is a production approach - tempo range, key preference, drum kit
// choice, instrument palette, how busy the arrangement is - all of which are
// facts about a genre and an era rather than anything anyone owns.
//
// So this file is a table of production characteristics, and typing an artist
// name configures the generator the way a producer would set up a session
// before writing anything. No audio, melody, or chord sequence of anyone's is
// stored, referenced, or reproduced - the beat is still composed from scratch
// by the same engine as always.
//
// Each profile sets:
//   genre       which style's grooves and progressions to build on
//   tempo       [min, max] BPM the artist's records typically sit in
//   keys        preferred tonics (a lot of producers have a home key)
//   scale       major / minor / dorian / phrygian
//   complexity  where on the 1-10 dial this style lives
//   swing       how far off the grid
//   kits        specific flavors that define the sound
//   solos       which lead voices belong
//   notes       what actually characterises it, in one line

const ARTIST_PROFILES = {
  // ---- trap / modern rap ------------------------------------------------
  "metro boomin": {
    genre: "trap", tempo: [130, 145], keys: ["C#", "F", "G#"], scale: "minor",
    complexity: 6, swing: 6, kits: { kick: "808", snare: "trapsnap", hihat: "bright", bass: "true808", stab: "bell-chord" },
    solos: ["woodwind", "lead"],
    notes: "Dark minor melodies over a long-decay 808, sparse arrangement, heavy space around the hook.",
  },
  "southside": {
    genre: "trap", tempo: [135, 150], keys: ["F", "A#", "D#"], scale: "minor",
    complexity: 7, swing: 4, kits: { kick: "808", snare: "trapsnap", hihat: "sizzle", bass: "hard808" },
    solos: ["lead", "kalimba"], notes: "Aggressive, bright hats, fast rolls, distorted low end.",
  },
  "pierre bourne": {
    genre: "trap", tempo: [125, 140], keys: ["D", "G", "A"], scale: "major",
    complexity: 5, swing: 10, kits: { kick: "808", snare: "clap", hihat: "analog", bass: "true808", lead: "square" },
    solos: ["lead", "marimba"], notes: "Bright, playful, almost cartoonish major-key synth leads over a bouncy 808.",
  },
  "wheezy": {
    genre: "trap", tempo: [130, 148], keys: ["G#", "C#", "F"], scale: "minor",
    complexity: 6, swing: 5, kits: { kick: "808", snare: "trapsnap", hihat: "bright", bass: "true808", stab: "pluck-chord" },
    solos: ["woodwind", "kalimba"], notes: "Melodic plucks, wide reverb, mid-tempo bounce.",
  },
  "tay keith": {
    genre: "trap", tempo: [138, 152], keys: ["F", "A#", "C"], scale: "minor",
    complexity: 7, swing: 3, kits: { kick: "punch", snare: "trapsnap", hihat: "metallic", bass: "hard808" },
    solos: ["lead"], notes: "Hard, minimal, heavy on the drums with very little melodic content.",
  },

  // ---- drill -------------------------------------------------------------
  "pop smoke": {
    genre: "drill", tempo: [138, 145], keys: ["F", "G", "C"], scale: "minor",
    complexity: 6, swing: 4, kits: { kick: "808", snare: "trapsnap", hihat: "dark", bass: "drillslide" },
    solos: ["woodwind"], notes: "Sliding 808s, dark orchestral or flute melody, UK drill drum pattern.",
  },
  "central cee": {
    genre: "drill", tempo: [140, 150], keys: ["D#", "G#", "A#"], scale: "minor",
    complexity: 6, swing: 5, kits: { kick: "808", snare: "rimshot", hihat: "dark", bass: "drillslide", piano: "grand" },
    solos: ["woodwind", "lead"], notes: "Melodic UK drill - piano or guitar loop over sliding sub bass.",
  },

  // ---- boom bap / classic hip-hop ---------------------------------------
  "j dilla": {
    genre: "hiphop", tempo: [88, 98], keys: ["D", "F", "A#"], scale: "dorian",
    complexity: 5, swing: 22, kits: { kick: "boombap", snare: "fat", hihat: "vinyl", bass: "upright", piano: "rhodes" },
    solos: ["sax", "leadguitar"], notes: "Deliberately loose, unquantised feel; warm dusty samples, soulful chords.",
  },
  "dj premier": {
    genre: "hiphop", tempo: [88, 96], keys: ["C", "G", "A"], scale: "minor",
    complexity: 5, swing: 14, kits: { kick: "sp1200", snare: "sp1200", hihat: "vinyl", bass: "upright" },
    solos: ["sax"], notes: "Hard boom-bap drums, chopped jazz loops, scratched hooks.",
  },
  "madlib": {
    genre: "lofi", tempo: [82, 94], keys: ["D", "F", "A#"], scale: "dorian",
    complexity: 6, swing: 20, kits: { kick: "boombap", snare: "brush", hihat: "tape", piano: "rhodes", bass: "upright" },
    solos: ["sax", "woodwind"], notes: "Dusty, off-kilter, unexpected sample sources and loose timing.",
  },
  "9th wonder": {
    genre: "hiphop", tempo: [90, 100], keys: ["F", "A#", "C"], scale: "minor",
    complexity: 5, swing: 16, kits: { kick: "boombap", snare: "fat", hihat: "vinyl", piano: "rhodes" },
    solos: ["sax"], notes: "Soul chops, warm filtered low end, steady head-nod tempo.",
  },

  // ---- lo-fi -------------------------------------------------------------
  "nujabes": {
    genre: "lofi", tempo: [82, 92], keys: ["D", "A", "F"], scale: "dorian",
    complexity: 5, swing: 18, kits: { kick: "boombap", snare: "brush", hihat: "tape", piano: "rhodes", bass: "upright" },
    solos: ["sax", "woodwind"], notes: "Jazzy, melancholy, live-feeling drums under lush piano.",
  },

  // ---- R&B / neo-soul ----------------------------------------------------
  "the neptunes": {
    genre: "rnb", tempo: [96, 110], keys: ["F#", "B", "E"], scale: "minor",
    complexity: 6, swing: 8, kits: { kick: "punch", snare: "rimshot", perc: "shaker", piano: "clav", bass: "synth" },
    solos: ["lead", "talkbox"], notes: "Sparse, percussive, off-kilter syncopation with almost no low mid.",
  },
  "timbaland": {
    genre: "rnb", tempo: [92, 108], keys: ["G", "C", "D"], scale: "minor",
    complexity: 7, swing: 12, kits: { kick: "punch", snare: "layered", perc: "tabla", bass: "sub" },
    solos: ["woodwind", "lead"], notes: "Intricate stuttering percussion, world-instrument hooks, heavy space.",
  },
  "d'angelo": {
    genre: "neosoul", tempo: [72, 88], keys: ["E", "A", "B"], scale: "dorian",
    complexity: 6, swing: 24, kits: { kick: "acoustic", snare: "fat", hihat: "dark", piano: "rhodes", bass: "fretless" },
    solos: ["leadguitar", "sax"], notes: "Extremely behind-the-beat drums, thick 9th and 11th chords.",
  },
  "erykah badu": {
    genre: "neosoul", tempo: [76, 92], keys: ["D", "G", "A#"], scale: "dorian",
    complexity: 6, swing: 20, kits: { kick: "boombap", snare: "brush", piano: "rhodes", bass: "upright" },
    solos: ["sax", "woodwind"], notes: "Loose live feel, warm Rhodes, jazz voicings, unhurried.",
  },

  // ---- house / electronic ------------------------------------------------
  "disclosure": {
    genre: "ukgarage", tempo: [120, 128], keys: ["A", "D", "F#"], scale: "minor",
    complexity: 6, swing: 14, kits: { kick: "fourfloor", snare: "clap", hihat: "bright", bass: "m1organbass", piano: "m1piano" },
    solos: ["lead", "sax"], notes: "Garage shuffle, chopped vocals, warm sub, M1-style organ bass.",
  },
  "kaytranada": {
    genre: "house", tempo: [98, 115], keys: ["F", "A#", "C"], scale: "dorian",
    complexity: 7, swing: 18, kits: { kick: "punch", snare: "clap", perc: "shaker", bass: "synth", piano: "rhodes" },
    solos: ["lead", "leadguitar"], notes: "Swung house drums, funk bass, filtered soul chords.",
  },
  "daft punk": {
    genre: "house", tempo: [110, 126], keys: ["A", "D", "E"], scale: "minor",
    complexity: 5, swing: 6, kits: { kick: "fourfloor", snare: "clap", hihat: "analog", bass: "moog", stab: "brass-chord" },
    solos: ["lead", "talkbox"], notes: "Filtered disco loops, talkbox hooks, relentless four-to-the-floor.",
  },
  "fred again": {
    genre: "house", tempo: [126, 136], keys: ["G", "C", "D"], scale: "minor",
    complexity: 6, swing: 10, kits: { kick: "fourfloor", snare: "clap", hihat: "bright", piano: "grand", bass: "sub" },
    solos: ["lead"], notes: "Felt piano and chopped voice memos over a driving, emotional house beat.",
  },

  // ---- rock / other ------------------------------------------------------
  "tame impala": {
    genre: "synthwave", tempo: [100, 118], keys: ["F", "A#", "C"], scale: "minor",
    complexity: 5, swing: 8, kits: { kick: "roomy", snare: "gatedverb", bass: "moog", pad: "solina", lead: "supersaw" },
    solos: ["leadguitar", "lead"], notes: "Washed-out psychedelic reverb, vintage synths, fat drums.",
  },
  "the weeknd": {
    genre: "synthwave", tempo: [110, 122], keys: ["C#", "F#", "B"], scale: "minor",
    complexity: 5, swing: 4, kits: { kick: "punch", snare: "gatedverb", hihat: "bright", bass: "synth", pad: "juno" },
    solos: ["lead"], notes: "80s-facing synth pop with a dark modern low end.",
  },
};

// Free-text search. Producers do not type canonical names, so match
// generously: exact, then substring either way, then per-word.
function findArtistProfile(query) {
  if (!query) return null;
  const q = String(query).toLowerCase().trim().replace(/[^a-z0-9' ]/g, "");
  if (!q) return null;
  if (ARTIST_PROFILES[q]) return { key: q, profile: ARTIST_PROFILES[q], exact: true };
  for (const k of Object.keys(ARTIST_PROFILES)) {
    if (k.includes(q) || q.includes(k)) return { key: k, profile: ARTIST_PROFILES[k], exact: false };
  }
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  for (const k of Object.keys(ARTIST_PROFILES)) {
    if (words.some((w) => k.includes(w))) return { key: k, profile: ARTIST_PROFILES[k], exact: false };
  }
  return null;
}

// An unknown name is the normal case - there are millions of artists and
// two dozen profiles. Rather than failing, fall back to the genre keyword
// parser the "describe your beat" box already uses, so "some drill guy I
// like" still produces a drill beat.
function artistFallbackGenre(query, genreKeywords) {
  const q = String(query || "").toLowerCase();
  for (const [genre, words] of Object.entries(genreKeywords || {})) {
    if (words.some((w) => q.includes(w))) return genre;
  }
  return null;
}

function artistProfileNames() {
  return Object.keys(ARTIST_PROFILES).sort();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { ARTIST_PROFILES, findArtistProfile, artistFallbackGenre, artistProfileNames };
}
