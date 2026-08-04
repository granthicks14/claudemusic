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

  // ---- more trap / modern rap -------------------------------------------
  "drake": {
    genre: "rap", tempo: [130, 145], keys: ["A#", "C#", "F"], scale: "minor",
    complexity: 5, swing: 6, kits: { kick: "808", snare: "trapsnap", hihat: "dark", bass: "true808", piano: "grand" },
    solos: ["autolead", "lead"], notes: "Cavernous reverb, sparse minor piano or pad, half-sung hooks over a restrained 808.",
  },
  "travis scott": {
    genre: "trap", tempo: [130, 155], keys: ["C#", "F#", "B"], scale: "minor",
    complexity: 6, swing: 5, kits: { kick: "808", snare: "trapsnap", hihat: "dark", bass: "hard808", pad: "dark" },
    solos: ["autolead", "lead"], notes: "Psychedelic, heavily reverbed and pitched-down, huge distorted low end.",
  },
  "future": {
    genre: "trap", tempo: [125, 145], keys: ["C#", "F", "G#"], scale: "minor",
    complexity: 6, swing: 6, kits: { kick: "808", snare: "trapsnap", hihat: "bright", bass: "true808", stab: "bell-chord" },
    solos: ["autolead"], notes: "Bleak minor bells over a slurred 808, auto-tuned hook carrying the melody.",
  },
  "young thug": {
    genre: "trap", tempo: [135, 150], keys: ["D#", "G#", "C#"], scale: "minor",
    complexity: 6, swing: 7, kits: { kick: "808", snare: "clap", hihat: "bright", bass: "true808", stab: "pluck-chord" },
    solos: ["autolead", "kalimba"], notes: "Bright plucked melodies, elastic vocal-led phrasing, plenty of space.",
  },
  "lil baby": {
    genre: "trap", tempo: [138, 150], keys: ["F", "A#", "C#"], scale: "minor",
    complexity: 6, swing: 4, kits: { kick: "808", snare: "trapsnap", hihat: "sizzle", bass: "true808", piano: "grand" },
    solos: ["lead", "woodwind"], notes: "Piano-driven melodic trap, rolling hats, clean punchy 808.",
  },
  "gunna": {
    genre: "trap", tempo: [130, 145], keys: ["G#", "C#", "D#"], scale: "minor",
    complexity: 5, swing: 8, kits: { kick: "808", snare: "clap", hihat: "analog", bass: "true808", stab: "pluck-chord" },
    solos: ["autolead", "kalimba"], notes: "Smooth, glossy, mid-tempo; soft plucks and a laid-back bounce.",
  },
  "21 savage": {
    genre: "trap", tempo: [128, 142], keys: ["F", "A#", "D#"], scale: "minor",
    complexity: 4, swing: 3, kits: { kick: "808", snare: "trapsnap", hihat: "dark", bass: "hard808" },
    solos: ["lead"], notes: "Minimal and menacing - almost nothing but drums, 808 and one dark motif.",
  },
  "playboi carti": {
    genre: "trap", tempo: [130, 155], keys: ["D", "G", "A"], scale: "minor",
    complexity: 5, swing: 6, kits: { kick: "808", snare: "clap", hihat: "sizzle", bass: "hard808", lead: "square" },
    solos: ["lead"], notes: "Extremely sparse, bright synth stabs, everything built around negative space.",
  },
  "lil uzi vert": {
    genre: "trap", tempo: [145, 165], keys: ["D", "F#", "A"], scale: "major",
    complexity: 6, swing: 5, kits: { kick: "808", snare: "clap", hihat: "bright", bass: "true808", stab: "bell-chord" },
    solos: ["lead", "kalimba"], notes: "Fast, bright, major-key melodic trap with a hyper, glittery top end.",
  },
  "juice wrld": {
    genre: "trap", tempo: [150, 165], keys: ["F", "A#", "C"], scale: "minor",
    complexity: 5, swing: 4, kits: { kick: "808", snare: "clap", hihat: "bright", bass: "true808", guitar: "clean" },
    solos: ["leadguitar", "autolead"], notes: "Emo-rap: clean guitar loop and melancholy minor melody over double-time hats.",
  },
  "asap rocky": {
    genre: "trap", tempo: [128, 145], keys: ["C#", "F#", "A#"], scale: "minor",
    complexity: 6, swing: 8, kits: { kick: "808", snare: "trapsnap", hihat: "dark", bass: "hard808", pad: "dark" },
    solos: ["lead", "woodwind"], notes: "Woozy, screwed-down textures with a NY edge and heavy reverb.",
  },
  "migos": {
    genre: "trap", tempo: [140, 152], keys: ["F", "G#", "C#"], scale: "minor",
    complexity: 7, swing: 4, kits: { kick: "808", snare: "trapsnap", hihat: "sizzle", bass: "true808", stab: "bell-chord" },
    solos: ["lead"], notes: "Triplet-driven hats and rolls, bright bells, relentless forward motion.",
  },
  "megan thee stallion": {
    genre: "trap", tempo: [138, 152], keys: ["F", "A#", "D#"], scale: "minor",
    complexity: 6, swing: 5, kits: { kick: "808", snare: "clap", hihat: "bright", bass: "hard808", horn: "brass" },
    solos: ["lead"], notes: "Southern bounce with horn stabs and a hard, forward 808.",
  },
  "zaytoven": {
    genre: "trap", tempo: [138, 150], keys: ["C", "F", "G"], scale: "minor",
    complexity: 6, swing: 4, kits: { kick: "808", snare: "trapsnap", hihat: "bright", bass: "true808", piano: "grand", organ: "gospel" },
    solos: ["lead", "kalimba"], notes: "Church-organ and fast piano runs over trap drums - gospel harmony in a street context.",
  },
  "mike will made it": {
    genre: "trap", tempo: [130, 148], keys: ["G#", "C#", "F"], scale: "minor",
    complexity: 6, swing: 5, kits: { kick: "808", snare: "trapsnap", hihat: "metallic", bass: "hard808", stab: "bell-chord" },
    solos: ["lead"], notes: "Wide, cinematic, hard-hitting; big empty spaces between the hits.",
  },
  "murda beatz": {
    genre: "trap", tempo: [132, 148], keys: ["A#", "D#", "G#"], scale: "minor",
    complexity: 6, swing: 5, kits: { kick: "808", snare: "clap", hihat: "bright", bass: "true808", marimba: "marimba" },
    solos: ["marimba", "lead"], notes: "Bright mallet and pluck hooks, glossy modern mixdown.",
  },

  // ---- more classic hip-hop / rap ---------------------------------------
  "kanye west": {
    genre: "hiphop", tempo: [84, 102], keys: ["C", "F", "A#"], scale: "minor",
    complexity: 6, swing: 12, kits: { kick: "boombap", snare: "fat", hihat: "vinyl", bass: "upright", strings: "soul" },
    solos: ["sax", "woodwind"], notes: "Pitched-up soul chops, big filtered strings, drums right up front.",
  },
  "kendrick lamar": {
    genre: "hiphop", tempo: [84, 100], keys: ["D", "G", "A#"], scale: "dorian",
    complexity: 7, swing: 16, kits: { kick: "boombap", snare: "fat", hihat: "vinyl", bass: "upright", piano: "rhodes" },
    solos: ["sax", "leadguitar"], notes: "Live jazz-funk players, shifting sections, restless bass.",
  },
  "j cole": {
    genre: "hiphop", tempo: [82, 96], keys: ["F", "A#", "C"], scale: "minor",
    complexity: 5, swing: 14, kits: { kick: "boombap", snare: "fat", hihat: "vinyl", piano: "rhodes", bass: "upright" },
    solos: ["sax"], notes: "Warm soul loops, understated drums, nothing flashy in the arrangement.",
  },
  "tyler the creator": {
    genre: "neosoul", tempo: [88, 112], keys: ["E", "A", "B"], scale: "dorian",
    complexity: 7, swing: 10, kits: { kick: "punch", snare: "clap", piano: "rhodes", bass: "synth", pad: "juno" },
    solos: ["lead", "woodwind"], notes: "Lush unusual chord colours, synth bass, abrupt section changes.",
  },
  "mf doom": {
    genre: "hiphop", tempo: [86, 96], keys: ["D", "F", "A#"], scale: "dorian",
    complexity: 5, swing: 18, kits: { kick: "sp1200", snare: "sp1200", hihat: "vinyl", bass: "upright", horn: "muted" },
    solos: ["sax", "woodwind"], notes: "Dusty obscure loops, no hooks, drums slightly loose and low-fi.",
  },
  "rza": {
    genre: "hiphop", tempo: [88, 96], keys: ["C", "F", "G"], scale: "minor",
    complexity: 5, swing: 15, kits: { kick: "sp1200", snare: "sp1200", hihat: "vinyl", bass: "upright", piano: "grand" },
    solos: ["sax"], notes: "Grimy, off-key soul samples, hard unquantised drums, cinematic menace.",
  },
  "pete rock": {
    genre: "hiphop", tempo: [90, 100], keys: ["F", "A#", "D"], scale: "dorian",
    complexity: 5, swing: 16, kits: { kick: "boombap", snare: "fat", hihat: "vinyl", bass: "upright", horn: "muted" },
    solos: ["sax", "woodwind"], notes: "Warm horn loops, thick filtered drums, deep swing.",
  },
  "the alchemist": {
    genre: "lofi", tempo: [82, 94], keys: ["D", "G", "A#"], scale: "dorian",
    complexity: 5, swing: 18, kits: { kick: "boombap", snare: "brush", hihat: "tape", bass: "upright", piano: "rhodes" },
    solos: ["sax", "woodwind"], notes: "Hazy, hypnotic loops with almost no drum variation - the loop is the point.",
  },
  "nas": {
    genre: "hiphop", tempo: [86, 96], keys: ["C", "G", "A"], scale: "minor",
    complexity: 5, swing: 14, kits: { kick: "boombap", snare: "fat", hihat: "vinyl", bass: "upright", piano: "grand" },
    solos: ["sax"], notes: "New York boom bap: piano loop, hard drums, no ornament.",
  },

  // ---- drill ------------------------------------------------------------
  "chief keef": {
    genre: "drill", tempo: [138, 150], keys: ["F", "A#", "D#"], scale: "minor",
    complexity: 5, swing: 3, kits: { kick: "808", snare: "trapsnap", hihat: "dark", bass: "hard808", stab: "bell-chord" },
    solos: ["lead"], notes: "Chicago drill: bleak bell motif, hard 808, almost no chord movement.",
  },
  "fivio foreign": {
    genre: "drill", tempo: [140, 150], keys: ["G", "C", "D#"], scale: "minor",
    complexity: 6, swing: 4, kits: { kick: "808", snare: "rimshot", hihat: "dark", bass: "drillslide" },
    solos: ["woodwind", "lead"], notes: "Brooklyn drill: sliding 808 and a dark, insistent top line.",
  },
  "headie one": {
    genre: "drill", tempo: [140, 148], keys: ["D#", "G#", "A#"], scale: "minor",
    complexity: 6, swing: 5, kits: { kick: "808", snare: "rimshot", hihat: "dark", bass: "drillslide", strings: "cello" },
    solos: ["woodwind"], notes: "UK drill with orchestral strings - cello and low woodwind carrying the menace.",
  },
  "digga d": {
    genre: "drill", tempo: [142, 152], keys: ["F", "A#", "C"], scale: "minor",
    complexity: 6, swing: 4, kits: { kick: "808", snare: "rimshot", hihat: "metallic", bass: "drillslide" },
    solos: ["woodwind", "lead"], notes: "Sharp, fast, sparse; the slide is the whole bassline.",
  },

  // ---- lo-fi -------------------------------------------------------------
  "knxwledge": {
    genre: "lofi", tempo: [80, 92], keys: ["D", "F", "A#"], scale: "dorian",
    complexity: 5, swing: 22, kits: { kick: "boombap", snare: "brush", hihat: "tape", piano: "rhodes", bass: "upright" },
    solos: ["sax"], notes: "Very short, unpolished loops, deliberately rough edges left in.",
  },
  "mndsgn": {
    genre: "lofi", tempo: [78, 92], keys: ["E", "A", "C"], scale: "dorian",
    complexity: 5, swing: 20, kits: { kick: "boombap", snare: "brush", piano: "rhodes", bass: "fretless", pad: "solina" },
    solos: ["sax", "woodwind"], notes: "Warm 70s soul palette, soft drums, gentle synth haze.",
  },
  "jinsang": {
    genre: "lofi", tempo: [76, 88], keys: ["D", "G", "A#"], scale: "dorian",
    complexity: 4, swing: 20, kits: { kick: "boombap", snare: "brush", hihat: "tape", piano: "felt", bass: "upright" },
    solos: ["woodwind", "sax"], notes: "Very soft and slow, felt piano, tape hiss and vinyl texture.",
  },

  // ---- R&B / neo-soul ----------------------------------------------------
  "frank ocean": {
    genre: "rnb", tempo: [76, 100], keys: ["E", "A", "B"], scale: "major",
    complexity: 5, swing: 10, kits: { kick: "punch", snare: "rimshot", piano: "rhodes", bass: "sub", pad: "juno" },
    solos: ["leadguitar", "lead"], notes: "Spacious and unhurried, unusual chord turns, minimal percussion.",
  },
  "sza": {
    genre: "rnb", tempo: [80, 102], keys: ["F#", "B", "C#"], scale: "minor",
    complexity: 5, swing: 12, kits: { kick: "punch", snare: "clap", hihat: "dark", bass: "sub", piano: "rhodes" },
    solos: ["leadguitar", "woodwind"], notes: "Hazy, guitar-tinged alt-R&B with a soft low end.",
  },
  "brent faiyaz": {
    genre: "rnb", tempo: [78, 96], keys: ["G", "C", "D#"], scale: "minor",
    complexity: 5, swing: 14, kits: { kick: "punch", snare: "rimshot", piano: "rhodes", bass: "fretless", pad: "juno" },
    solos: ["leadguitar", "sax"], notes: "Late-night, sparse, heavy on space and reverb tails.",
  },
  "daniel caesar": {
    genre: "neosoul", tempo: [72, 90], keys: ["E", "A", "D"], scale: "major",
    complexity: 5, swing: 16, kits: { kick: "acoustic", snare: "brush", piano: "rhodes", bass: "upright", organ: "drawbar" },
    solos: ["leadguitar", "sax"], notes: "Gospel-tinged, warm and slow, clean guitar and Rhodes.",
  },
  "anderson paak": {
    genre: "neosoul", tempo: [88, 108], keys: ["D", "G", "A#"], scale: "dorian",
    complexity: 7, swing: 18, kits: { kick: "acoustic", snare: "fat", hihat: "dark", piano: "rhodes", bass: "slap" },
    solos: ["leadguitar", "sax"], notes: "Live drummer energy, funk bass, busy but pocketed.",
  },
  "robert glasper": {
    genre: "neosoul", tempo: [70, 92], keys: ["E", "A", "B"], scale: "dorian",
    complexity: 8, swing: 22, kits: { kick: "acoustic", snare: "brush", hihat: "dark", piano: "jazzgrand", bass: "upright" },
    solos: ["sax", "woodwind"], notes: "Jazz harmony proper - extended voicings, loose time, improvised feel.",
  },
  "hiatus kaiyote": {
    genre: "neosoul", tempo: [84, 108], keys: ["F#", "B", "D"], scale: "dorian",
    complexity: 9, swing: 16, kits: { kick: "acoustic", snare: "rimshot", perc: "shaker", piano: "rhodes", bass: "fretless" },
    solos: ["leadguitar", "sax"], notes: "Rhythmically knotted, dense chords, constant metric surprise.",
  },
  "the internet": {
    genre: "neosoul", tempo: [80, 100], keys: ["E", "A", "C#"], scale: "dorian",
    complexity: 6, swing: 18, kits: { kick: "punch", snare: "rimshot", piano: "rhodes", bass: "fretless", guitar: "clean" },
    solos: ["leadguitar"], notes: "Bedroom-funk: clean guitar, round bass, understated groove.",
  },

  // ---- house / electronic ------------------------------------------------
  "calvin harris": {
    genre: "house", tempo: [122, 128], keys: ["A", "D", "F#"], scale: "minor",
    complexity: 5, swing: 2, kits: { kick: "fourfloor", snare: "clap", hihat: "bright", bass: "synth", stab: "brass-chord" },
    solos: ["lead"], notes: "Big, clean, festival-scaled; simple hooks and enormous drops.",
  },
  "avicii": {
    genre: "house", tempo: [124, 130], keys: ["G", "C", "D"], scale: "major",
    complexity: 5, swing: 2, kits: { kick: "fourfloor", snare: "clap", hihat: "bright", piano: "m1piano", bass: "synth" },
    solos: ["lead", "woodwind"], notes: "Major-key folk melodies over four-to-the-floor - piano house with a sing-along top.",
  },
  "deadmau5": {
    genre: "techno", tempo: [122, 128], keys: ["A", "D", "F"], scale: "minor",
    complexity: 6, swing: 0, kits: { kick: "fourfloor", snare: "clap", hihat: "analog", bass: "sh101", pad: "juno" },
    solos: ["arp", "lead"], notes: "Long evolving arpeggios, patient builds, very clean and precise.",
  },
  "moodymann": {
    genre: "house", tempo: [118, 126], keys: ["F", "A#", "C"], scale: "dorian",
    complexity: 6, swing: 16, kits: { kick: "fourfloor", snare: "clap", perc: "shaker", piano: "rhodes", bass: "upright" },
    solos: ["sax", "leadguitar"], notes: "Detroit deep house - dusty soul loops, live-feeling swing, warm filtering.",
  },
  "larry heard": {
    genre: "house", tempo: [118, 124], keys: ["A", "D", "E"], scale: "minor",
    complexity: 5, swing: 8, kits: { kick: "909", snare: "909snare", hihat: "909", bass: "sh101", pad: "juno" },
    solos: ["lead", "arp"], notes: "Deep house origin point: lush pads, gentle 909, melancholy chords.",
  },
  "duke dumont": {
    genre: "ukgarage", tempo: [120, 126], keys: ["G", "C", "A"], scale: "minor",
    complexity: 6, swing: 14, kits: { kick: "fourfloor", snare: "clap", hihat: "bright", bass: "m1organbass", piano: "m1piano" },
    solos: ["lead", "sax"], notes: "House-garage crossover with an organ bass and a bright piano hook.",
  },
  "flume": {
    genre: "dubstep", tempo: [90, 110], keys: ["F#", "B", "C#"], scale: "minor",
    complexity: 7, swing: 12, kits: { kick: "punch", snare: "layered", bass: "reese", pad: "ppgwave" },
    solos: ["lead"], notes: "Half-time future bass - pitch-bent chord stabs and heavy sound design.",
  },
  "odesza": {
    genre: "synthwave", tempo: [98, 118], keys: ["D", "G", "A"], scale: "major",
    complexity: 5, swing: 6, kits: { kick: "punch", snare: "clap", perc: "shaker", pad: "solina", bass: "sub" },
    solos: ["lead", "woodwind"], notes: "Widescreen and euphoric: layered vocal chops, big reverb, marching percussion.",
  },

  // ---- techno ------------------------------------------------------------
  "jeff mills": {
    genre: "techno", tempo: [132, 145], keys: ["A", "D", "F"], scale: "minor",
    complexity: 6, swing: 0, kits: { kick: "909", snare: "909snare", hihat: "909", bass: "sh101" },
    solos: ["arp"], notes: "Detroit techno: relentless 909, minimal material, hypnotic repetition.",
  },
  "charlotte de witte": {
    genre: "techno", tempo: [135, 148], keys: ["F", "A#", "C"], scale: "minor",
    complexity: 6, swing: 0, kits: { kick: "fourfloor", snare: "909snare", hihat: "606", bass: "sh101" },
    solos: ["arp", "lead"], notes: "Hard, dark, driving - acid lines and an unyielding kick.",
  },
  "ben klock": {
    genre: "techno", tempo: [128, 138], keys: ["A", "D", "G" ], scale: "minor",
    complexity: 5, swing: 0, kits: { kick: "fourfloor", snare: "clap", hihat: "analog", bass: "sub", pad: "dark" },
    solos: ["arp"], notes: "Berlin warehouse: dubby, spacious, built on subtraction.",
  },
  "nina kraviz": {
    genre: "techno", tempo: [130, 142], keys: ["C", "F", "G#"], scale: "minor",
    complexity: 7, swing: 4, kits: { kick: "909", snare: "909snare", hihat: "606", bass: "303" },
    solos: ["arp", "lead"], notes: "Raw and acid-leaning, 303 lines, deliberately lo-fi edges.",
  },

  // ---- drum & bass -------------------------------------------------------
  "goldie": {
    genre: "dnb", tempo: [165, 176], keys: ["D", "G", "A#"], scale: "minor",
    complexity: 8, swing: 8, kits: { kick: "punch", snare: "crisp", hihat: "bright", bass: "reese", pad: "solina" },
    solos: ["arp", "lead"], notes: "Chopped amen breaks, huge reese bass, cinematic pads over it all.",
  },
  "sub focus": {
    genre: "dnb", tempo: [172, 176], keys: ["F", "A#", "C"], scale: "minor",
    complexity: 7, swing: 4, kits: { kick: "punch", snare: "crisp", hihat: "bright", bass: "reese", lead: "supersaw" },
    solos: ["lead", "arp"], notes: "Clean, melodic, festival-facing D&B with big synth hooks.",
  },
  "chase and status": {
    genre: "dnb", tempo: [170, 176], keys: ["G", "C", "D#"], scale: "minor",
    complexity: 7, swing: 4, kits: { kick: "punch", snare: "layered", bass: "growl", lead: "hoover" },
    solos: ["lead"], notes: "Aggressive, rave-referencing, hoover stabs and heavy mid bass.",
  },
  "netsky": {
    genre: "dnb", tempo: [172, 176], keys: ["D", "G", "A"], scale: "major",
    complexity: 6, swing: 6, kits: { kick: "punch", snare: "crisp", piano: "m1piano", bass: "sub", strings: "soul" },
    solos: ["lead", "sax"], notes: "Liquid D&B: warm major chords, rolling breaks, melodic rather than heavy.",
  },

  // ---- dubstep -----------------------------------------------------------
  "skrillex": {
    genre: "dubstep", tempo: [138, 150], keys: ["F", "A#", "D#"], scale: "minor",
    complexity: 8, swing: 2, kits: { kick: "punch", snare: "layered", bass: "growl", lead: "ms20" },
    solos: ["lead"], notes: "Violent modulated bass, constant timbral change, everything at maximum.",
  },
  "excision": {
    genre: "dubstep", tempo: [140, 150], keys: ["F", "G#", "C"], scale: "minor",
    complexity: 7, swing: 0, kits: { kick: "subkick", snare: "layered", bass: "growl", tom: "taiko" },
    solos: ["lead"], notes: "Pure weight - sub-heavy riddim with almost no melodic content.",
  },
  "burial": {
    genre: "ukgarage", tempo: [128, 140], keys: ["C#", "F#", "A"], scale: "minor",
    complexity: 6, swing: 20, kits: { kick: "lofi", snare: "rimclick", hihat: "vinyl", bass: "sub", pad: "solina" },
    solos: ["lead"], notes: "Rain-soaked, degraded 2-step; clipped vocal fragments and vinyl crackle.",
  },

  // ---- UK garage ---------------------------------------------------------
  "mj cole": {
    genre: "ukgarage", tempo: [128, 136], keys: ["G", "C", "D"], scale: "minor",
    complexity: 7, swing: 18, kits: { kick: "fourfloor", snare: "rimshot", hihat: "bright", piano: "grand", bass: "sub" },
    solos: ["sax", "lead"], notes: "Classic 2-step: shuffled hats, live piano, soulful vocal chops.",
  },
  "sammy virji": {
    genre: "ukgarage", tempo: [130, 138], keys: ["F", "A#", "C"], scale: "minor",
    complexity: 6, swing: 16, kits: { kick: "fourfloor", snare: "clap", hihat: "bright", bass: "m1organbass", piano: "m1piano" },
    solos: ["lead", "sax"], notes: "Modern bassline-garage - bouncy organ bass and chopped vocals.",
  },

  // ---- amapiano ----------------------------------------------------------
  "kabza de small": {
    genre: "amapiano", tempo: [110, 118], keys: ["F", "A#", "C"], scale: "minor",
    complexity: 6, swing: 12, kits: { kick: "fourfloor", perc: "shekere", hihat: "bright", bass: "logdrum", piano: "grand" },
    solos: ["woodwind", "sax"], notes: "Log drum and shaker foundation, jazzy piano chords, patient builds.",
  },
  "dj maphorisa": {
    genre: "amapiano", tempo: [112, 120], keys: ["G", "C", "D#"], scale: "minor",
    complexity: 6, swing: 10, kits: { kick: "fourfloor", perc: "shaker", bass: "logdrum", piano: "m1piano" },
    solos: ["sax", "lead"], notes: "Bigger and more vocal-led, heavy log drum, festival energy.",
  },
  "tyler icu": {
    genre: "amapiano", tempo: [110, 116], keys: ["A#", "D#", "F"], scale: "minor",
    complexity: 7, swing: 12, kits: { kick: "fourfloor", perc: "shekere", bass: "logdrum", piano: "grand" },
    solos: ["woodwind", "marimba"], notes: "Deep private-school piano - intricate percussion, restrained melody.",
  },

  // ---- afrobeats ---------------------------------------------------------
  "burna boy": {
    genre: "afrobeats", tempo: [98, 112], keys: ["F", "A#", "C"], scale: "minor",
    complexity: 6, swing: 14, kits: { kick: "punch", perc: "shekere", hihat: "bright", bass: "sub", guitar: "clean" },
    solos: ["woodwind", "sax"], notes: "Afro-fusion: dancehall-tinged groove, live guitar, warm low end.",
  },
  "wizkid": {
    genre: "afrobeats", tempo: [100, 112], keys: ["G", "C", "D"], scale: "major",
    complexity: 5, swing: 16, kits: { kick: "punch", perc: "shaker", hihat: "bright", bass: "sub", guitar: "clean" },
    solos: ["woodwind", "kalimba"], notes: "Smooth and airy, gentle guitar, laid-back mid-tempo bounce.",
  },
  "rema": {
    genre: "afrobeats", tempo: [104, 118], keys: ["F", "A#", "D"], scale: "minor",
    complexity: 6, swing: 12, kits: { kick: "punch", perc: "agogo", hihat: "bright", bass: "sub", marimba: "marimba" },
    solos: ["marimba", "woodwind"], notes: "Afro-rave: bright mallet hooks, Indian-tinged melody, energetic percussion.",
  },
  "asake": {
    genre: "afrobeats", tempo: [104, 114], keys: ["G", "C", "A#"], scale: "minor",
    complexity: 7, swing: 14, kits: { kick: "punch", perc: "djembe", bass: "sub", organ: "gospel" },
    solos: ["sax", "woodwind"], notes: "Amapiano-influenced with big choral stacks and log-drum weight.",
  },
  "fela kuti": {
    genre: "afrobeats", tempo: [104, 120], keys: ["F", "A#", "C"], scale: "dorian",
    complexity: 8, swing: 16, kits: { kick: "acoustic", snare: "fat", perc: "shekere", bass: "pluck", organ: "combo", guitar: "funk" },
    solos: ["sax", "leadguitar"], notes: "Afrobeat proper: interlocking guitar and percussion, horn sections, long vamps.",
  },
  "sarz": {
    genre: "afrobeats", tempo: [100, 112], keys: ["F", "G#", "C"], scale: "minor",
    complexity: 6, swing: 12, kits: { kick: "punch", perc: "talkingdrum", hihat: "bright", bass: "sub" },
    solos: ["woodwind", "lead"], notes: "Sparse and percussive, talking drum accents, heavy space.",
  },

  // ---- reggaeton ---------------------------------------------------------
  "bad bunny": {
    genre: "reggaeton", tempo: [88, 100], keys: ["F", "A#", "D#"], scale: "minor",
    complexity: 6, swing: 8, kits: { kick: "punch", snare: "clap", perc: "guiro", bass: "sub", piano: "grand" },
    solos: ["lead", "woodwind"], notes: "Dembow with a moody minor top line and a very deep sub.",
  },
  "j balvin": {
    genre: "reggaeton", tempo: [90, 100], keys: ["G", "C", "A#"], scale: "minor",
    complexity: 5, swing: 6, kits: { kick: "punch", snare: "clap", perc: "guiro", bass: "sub", marimba: "marimba" },
    solos: ["marimba", "lead"], notes: "Bright, poppy, minimal - a hook and a dembow, nothing extra.",
  },
  "tainy": {
    genre: "reggaeton", tempo: [88, 98], keys: ["F#", "B", "C#"], scale: "minor",
    complexity: 7, swing: 8, kits: { kick: "punch", snare: "clap", perc: "timbale", bass: "sub", pad: "juno" },
    solos: ["lead", "woodwind"], notes: "Cinematic modern reggaeton - lush synths over a hard dembow.",
  },
  "daddy yankee": {
    genre: "reggaeton", tempo: [92, 102], keys: ["A", "D", "E"], scale: "minor",
    complexity: 6, swing: 4, kits: { kick: "punch", snare: "clap", perc: "timbale", bass: "synth", horn: "brass" },
    solos: ["lead"], notes: "Classic reggaeton: driving dembow, horn stabs, high energy.",
  },

  // ---- phonk / jersey club ----------------------------------------------
  "dj smokey": {
    genre: "phonk", tempo: [130, 145], keys: ["F", "A#", "D#"], scale: "minor",
    complexity: 5, swing: 6, kits: { kick: "lofi", snare: "rz1", hihat: "lofi808", bass: "hard808", perc: "cowbell" },
    solos: ["lead"], notes: "Memphis phonk: cowbell, distorted 808, degraded tape texture.",
  },
  "kordhell": {
    genre: "phonk", tempo: [140, 155], keys: ["F", "G#", "C"], scale: "minor",
    complexity: 6, swing: 2, kits: { kick: "gritty", snare: "trapsnap", perc: "cowbell", bass: "distorted" },
    solos: ["lead", "leadguitar"], notes: "Drift phonk - aggressive cowbell riffs and saturated distortion.",
  },
  "dj sliink": {
    genre: "jerseyclub", tempo: [130, 140], keys: ["F", "A#", "C"], scale: "minor",
    complexity: 7, swing: 4, kits: { kick: "punch", snare: "clap", hihat: "bright", bass: "sub" },
    solos: ["lead", "autolead"], notes: "Jersey club: triplet kick pattern, chopped vocal stabs, relentless.",
  },
  "cookiee kawaii": {
    genre: "jerseyclub", tempo: [132, 142], keys: ["G", "C", "D#"], scale: "minor",
    complexity: 6, swing: 4, kits: { kick: "punch", snare: "clap", hihat: "bright", bass: "sub", piano: "m1piano" },
    solos: ["lead"], notes: "Melodic club - bright piano and vocal chops over the bed-squeak bounce.",
  },

  // ---- synthwave ---------------------------------------------------------
  "kavinsky": {
    genre: "synthwave", tempo: [110, 122], keys: ["A", "D", "F"], scale: "minor",
    complexity: 5, swing: 2, kits: { kick: "linn", snare: "gatedverb", bass: "moog", pad: "juno", lead: "supersaw" },
    solos: ["lead"], notes: "Nocturnal 80s: gated snare, analog bass, cold neon melody.",
  },
  "com truise": {
    genre: "synthwave", tempo: [96, 112], keys: ["F", "A#", "C"], scale: "minor",
    complexity: 6, swing: 8, kits: { kick: "linn", snare: "linn", bass: "moog", pad: "ppgwave" },
    solos: ["arp", "lead"], notes: "Slow-motion synth funk, detuned everything, tape-warped pitch.",
  },
  "carpenter brut": {
    genre: "synthwave", tempo: [124, 140], keys: ["E", "A", "C"], scale: "minor",
    complexity: 7, swing: 0, kits: { kick: "fourfloor", snare: "gatedverb", bass: "distorted", lead: "hoover" },
    solos: ["lead", "leadguitar"], notes: "Darksynth: distorted, metal-adjacent, aggressive arpeggios.",
  },
  "m83": {
    genre: "synthwave", tempo: [108, 126], keys: ["D", "G", "A"], scale: "major",
    complexity: 6, swing: 2, kits: { kick: "roomy", snare: "gatedverb", pad: "solina", bass: "moog" },
    solos: ["lead", "woodwind"], notes: "Enormous, reverb-drenched, euphoric - shoegaze scale on synths.",
  },
  "the midnight": {
    genre: "synthwave", tempo: [104, 118], keys: ["F", "A#", "C"], scale: "major",
    complexity: 5, swing: 4, kits: { kick: "linn", snare: "gatedverb", bass: "moog", pad: "juno" },
    solos: ["sax", "lead"], notes: "Nostalgic and warm - a sax lead over shimmering 80s pads.",
  },

  // ---- rock --------------------------------------------------------------
  "arctic monkeys": {
    genre: "rock", tempo: [100, 140], keys: ["F", "A#", "C"], scale: "minor",
    complexity: 6, swing: 8, kits: { kick: "acoustic", snare: "acoustic", hihat: "dark", bass: "pluck", guitar: "clean" },
    solos: ["leadguitar"], notes: "Tight, wiry guitar riffs; later work slower and more lounge-inflected.",
  },
  "radiohead": {
    genre: "rock", tempo: [76, 130], keys: ["F", "A", "D"], scale: "minor",
    complexity: 8, swing: 6, kits: { kick: "roomy", snare: "acoustic", hihat: "dark", guitar: "clean", pad: "ppgwave" },
    solos: ["leadguitar", "lead"], notes: "Odd meters, unstable harmony, guitar textures rather than riffs.",
  },
  "queens of the stone age": {
    genre: "rock", tempo: [110, 145], keys: ["C", "F", "G"], scale: "minor",
    complexity: 6, swing: 4, kits: { kick: "punch", snare: "acoustic", hihat: "metallic", guitar: "power", bass: "distorted" },
    solos: ["leadguitar"], notes: "Hypnotic repeated riffs, fuzzy tone, robotic precision.",
  },
  "the black keys": {
    genre: "rock", tempo: [96, 130], keys: ["E", "A", "G"], scale: "minor",
    complexity: 5, swing: 12, kits: { kick: "roomy", snare: "fat", hihat: "dark", guitar: "resonator", bass: "pluck" },
    solos: ["leadguitar"], notes: "Blues-rock: fuzzy resonator guitar, big room drums, two-piece simplicity.",
  },
  "rage against the machine": {
    genre: "rock", tempo: [88, 130], keys: ["E", "A", "D"], scale: "minor",
    complexity: 7, swing: 10, kits: { kick: "punch", snare: "acoustic", hihat: "metallic", guitar: "funk", bass: "slap" },
    solos: ["leadguitar"], notes: "Funk-metal: syncopated riffs, hip-hop drum feel, wah-heavy leads.",
  },
  "led zeppelin": {
    genre: "rock", tempo: [92, 140], keys: ["E", "A", "D"], scale: "minor",
    complexity: 7, swing: 14, kits: { kick: "roomy", snare: "acoustic", hihat: "dark", guitar: "power", bass: "pluck" },
    solos: ["leadguitar"], notes: "Enormous room drums, blues-derived riffs, dynamic swing.",
  },
  "nirvana": {
    genre: "rock", tempo: [110, 145], keys: ["F", "A#", "C"], scale: "minor",
    complexity: 5, swing: 2, kits: { kick: "punch", snare: "acoustic", hihat: "metallic", guitar: "power", bass: "pluck" },
    solos: ["leadguitar"], notes: "Quiet-loud dynamics, three chords, fuzz on the chorus.",
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

// ---------------------------------------------------------------------------
// Credit and attribution
// ---------------------------------------------------------------------------
// Worth being precise about what naming an artist does and does not do,
// because the two get conflated constantly.
//
// WHAT IT DOES: using an artist's name to DESCRIBE a style is ordinary
// descriptive use, and it is the established convention of the whole type-
// beat scene - "Drake Type Beat" tells a buyer what the instrumental sounds
// like, and does not claim endorsement, affiliation or involvement. That is
// exactly how the naming is used here, and the panel below states it
// explicitly so a listener is never misled about who made what.
//
// WHAT IT DOES NOT DO: credit is not a licence. Naming a rights holder does
// not grant permission to reproduce their recording, and it never has -
// attribution and permission are separate things. So crediting an artist
// could not make it lawful to take their song's audio, strip the vocal and
// republish it, and no amount of on-screen credit changes that.
//
// The distinction matters for this program: everything it produces is
// composed from scratch by its own engine, so there is nothing of anyone
// else's in the output to need a licence for. The credit text below exists
// because being clear about influence is good practice and because the
// type-beat convention requires the name in the title - not as a shield.

function creditLine(artistKey, profile) {
  if (!artistKey || !profile) return "";
  const name = artistKey.replace(/\b\w/g, (ch) => ch.toUpperCase());
  return `Originally composed in the style of ${name}. Not affiliated with, endorsed by, or containing any recording by ${name}.`;
}

// The upload text a producer actually needs. The type-beat naming
// convention exists because it is how buyers search, so the title follows
// it, and the description carries the influence credit and a plain
// statement that the music is original.
function uploadText(artistKey, profile, opts = {}) {
  if (!artistKey || !profile) return null;
  const name = artistKey.replace(/\b\w/g, (ch) => ch.toUpperCase());
  const key = opts.key || "";
  const bpm = opts.bpm || "";
  const producer = opts.producer || "Beat Studio";
  const title = `[FREE] ${name} Type Beat - "${opts.beatName || "Untitled"}"${bpm ? ` | ${bpm} BPM` : ""}`;
  const description = [
    `${name} type beat, produced with ${producer}.`,
    bpm && key ? `${bpm} BPM · ${key}` : (bpm ? `${bpm} BPM` : ""),
    profile.notes ? `Style: ${profile.notes}` : "",
    "",
    creditLine(artistKey, profile),
    "This instrumental is an original composition generated by Beat Studio. It contains no samples of, and no audio from, any existing recording.",
  ].filter(Boolean).join("\n");
  return { title, description };
}

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
  module.exports = { ARTIST_PROFILES, findArtistProfile, artistFallbackGenre, artistProfileNames, creditLine, uploadText };
}
