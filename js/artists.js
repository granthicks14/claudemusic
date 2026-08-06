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
  // ---- rage
  "playboi carti": {
    genre: "rage", tempo: [148, 162], keys: ["F", "C#", "G"], scale: "minor",
    complexity: 6, swing: 2, kits: {"kick": "808", "snare": "trapsnap", "hihat": "sizzle", "bass": "rage808"},
    solos: ["lead", "autolead"],
    notes: "Sparse to the point of empty, a distorted lead and an 808 that dominates everything.",
  },
  "ken carson": {
    genre: "rage", tempo: [150, 168], keys: ["G", "D#", "A#"], scale: "minor",
    complexity: 7, swing: 2, kits: {"kick": "808", "snare": "trapsnap", "hihat": "sizzle", "bass": "grimy808"},
    solos: ["lead"],
    notes: "Faster and denser than Carti, hats constantly rolling.",
  },
  "destroy lonely": {
    genre: "rage", tempo: [145, 160], keys: ["C#", "F#", "A"], scale: "minor",
    complexity: 6, swing: 3, kits: {"kick": "808", "snare": "clap", "hihat": "bright", "bass": "distort808"},
    solos: ["lead", "autolead"],
    notes: "Melodic rage - the lead is a hook rather than a texture.",
  },
  "f1lthy": {
    genre: "rage", tempo: [150, 165], keys: ["F", "A#", "D"], scale: "phrygian",
    complexity: 8, swing: 2, kits: {"kick": "808", "snare": "trapsnap", "hihat": "sizzle", "bass": "rage808"},
    solos: ["lead"],
    notes: "The producer who defined the sound: everything distorted, nothing pretty.",
  },

  // ---- pluggnb
  "summrs": {
    genre: "pluggnb", tempo: [130, 145], keys: ["D#", "G", "A#"], scale: "dorian",
    complexity: 5, swing: 7, kits: {"kick": "808", "snare": "clap", "hihat": "bright", "bass": "detuned808"},
    solos: ["lead", "piano"],
    notes: "Detuned bells, soft 808, dreamy and warm.",
  },
  "autumn!": {
    genre: "pluggnb", tempo: [128, 142], keys: ["F", "C", "G#"], scale: "dorian",
    complexity: 5, swing: 8, kits: {"kick": "808", "snare": "clap", "hihat": "tick", "bass": "glide808"},
    solos: ["lead", "marimba"],
    notes: "The originator of plugg's melodic side - bright plucks over almost no drums.",
  },
  "nettspend": {
    genre: "pluggnb", tempo: [135, 150], keys: ["A#", "D#", "F#"], scale: "minor",
    complexity: 6, swing: 5, kits: {"kick": "808", "snare": "trapsnap", "hihat": "bright", "bass": "true808"},
    solos: ["lead", "autolead"],
    notes: "Harder than most plugg, but the bells stay.",
  },
  "ka$hdami": {
    genre: "pluggnb", tempo: [132, 146], keys: ["C", "G", "D"], scale: "dorian",
    complexity: 6, swing: 6, kits: {"kick": "808", "snare": "clap", "hihat": "bright", "bass": "detuned808"},
    solos: ["autolead", "lead"],
    notes: "Melodic and fast, autotune carrying the hook.",
  },

  // ---- pop
  "max martin": {
    genre: "pop", tempo: [100, 128], keys: ["C", "G", "A"], scale: "major",
    complexity: 5, swing: 2, kits: {"kick": "punch", "snare": "clap", "hihat": "bright", "bass": "synth"},
    solos: ["lead", "piano"],
    notes: "The four-chord chorus, engineered to be inescapable.",
  },
  "jack antonoff": {
    genre: "pop", tempo: [100, 124], keys: ["D", "F", "C"], scale: "major",
    complexity: 5, swing: 3, kits: {"kick": "punch", "snare": "gated", "hihat": "bright", "bass": "synth"},
    solos: ["piano", "lead"],
    notes: "80s drums and a wide chorus, warmer and less clinical.",
  },
  "finneas": {
    genre: "pop", tempo: [90, 120], keys: ["G", "D#", "A#"], scale: "minor",
    complexity: 4, swing: 4, kits: {"kick": "deep", "snare": "snap", "hihat": "tick", "bass": "sub"},
    solos: ["piano", "lead"],
    notes: "Sparse, close, sub-heavy - a whisper with a huge bottom end.",
  },
  "ryan tedder": {
    genre: "pop", tempo: [100, 130], keys: ["C", "F", "A"], scale: "major",
    complexity: 6, swing: 2, kits: {"kick": "punch", "snare": "clap", "hihat": "bright", "bass": "synth"},
    solos: ["piano", "lead"],
    notes: "Builds and drops borrowed from dance music into a pop frame.",
  },

  // ---- metal
  "metallica": {
    genre: "metal", tempo: [140, 200], keys: ["E", "A", "D"], scale: "minor",
    complexity: 7, swing: 0, kits: {"kick": "punch", "snare": "crack", "hihat": "metallic", "bass": "distorted"},
    solos: ["leadguitar"],
    notes: "Downpicked riffs, galloping kick, long instrumental sections.",
  },
  "slipknot": {
    genre: "metal", tempo: [150, 190], keys: ["A", "D", "F#"], scale: "phrygian",
    complexity: 8, swing: 0, kits: {"kick": "punch", "snare": "crack", "hihat": "metallic", "bass": "distorted"},
    solos: ["leadguitar"],
    notes: "Double kick under a hard backbeat, percussion layered over everything.",
  },
  "meshuggah": {
    genre: "metal", tempo: [110, 160], keys: ["F", "C", "A#"], scale: "phrygian",
    complexity: 9, swing: 0, kits: {"kick": "punch", "snare": "crack", "hihat": "metallic", "bass": "distorted"},
    solos: ["leadguitar"],
    notes: "Polyrhythmic riffing against a steady backbeat.",
  },
  "pantera": {
    genre: "metal", tempo: [110, 170], keys: ["E", "G", "D"], scale: "minor",
    complexity: 7, swing: 0, kits: {"kick": "punch", "snare": "crack", "hihat": "metallic", "bass": "distorted"},
    solos: ["leadguitar"],
    notes: "Groove metal - the riff swings even at speed.",
  },

  // ---- jazz
  "miles davis": {
    genre: "jazz", tempo: [110, 160], keys: ["D", "F", "C"], scale: "dorian",
    complexity: 6, swing: 32, kits: {"kick": "jazzkick", "snare": "brush", "hihat": "ride", "bass": "upright"},
    solos: ["horn", "sax"],
    notes: "Modal rather than chordal - long stretches over one scale.",
  },
  "john coltrane": {
    genre: "jazz", tempo: [130, 180], keys: ["F", "C", "A#"], scale: "dorian",
    complexity: 8, swing: 30, kits: {"kick": "jazzkick", "snare": "brush", "hihat": "ride", "bass": "upright"},
    solos: ["sax"],
    notes: "Dense harmonic movement, sheets of sound over fast changes.",
  },
  "bill evans": {
    genre: "jazz", tempo: [100, 150], keys: ["G", "D", "F"], scale: "dorian",
    complexity: 6, swing: 33, kits: {"kick": "jazzkick", "snare": "brush", "hihat": "ride", "bass": "upright"},
    solos: ["piano"],
    notes: "Impressionistic voicings and an interactive trio.",
  },
  "herbie hancock": {
    genre: "jazz", tempo: [105, 150], keys: ["F", "C", "D"], scale: "mixolydian",
    complexity: 7, swing: 28, kits: {"kick": "jazzkick", "snare": "brush", "hihat": "ride", "bass": "upright"},
    solos: ["piano", "sax"],
    notes: "Funk-leaning jazz with vamps instead of changes.",
  },

  // ---- edm
  "avicii": {
    genre: "edm", tempo: [124, 130], keys: ["A", "F#", "C#"], scale: "minor",
    complexity: 5, swing: 0, kits: {"kick": "fourfloor", "snare": "clap", "hihat": "bright", "bass": "reese"},
    solos: ["lead", "arp"],
    notes: "Folk-tinged melodies over a festival drop.",
  },
  "martin garrix": {
    genre: "edm", tempo: [125, 132], keys: ["A", "E", "B"], scale: "minor",
    complexity: 6, swing: 0, kits: {"kick": "fourfloor", "snare": "clap", "hihat": "bright", "bass": "reese"},
    solos: ["lead"],
    notes: "Big-room: enormous lead, huge kick, minimal harmony.",
  },
  "zedd": {
    genre: "edm", tempo: [126, 132], keys: ["C", "G", "F"], scale: "minor",
    complexity: 6, swing: 0, kits: {"kick": "fourfloor", "snare": "clap", "hihat": "bright", "bass": "synth"},
    solos: ["lead", "arp"],
    notes: "Complextro - detailed, chopped, harmonically busier than most.",
  },
  "swedish house mafia": {
    genre: "edm", tempo: [126, 130], keys: ["F#", "A", "D"], scale: "minor",
    complexity: 5, swing: 0, kits: {"kick": "fourfloor", "snare": "clap", "hihat": "bright", "bass": "reese"},
    solos: ["lead", "arp"],
    notes: "Long builds, piano-led progressive house drops.",
  },

  // ---- country
  "chris stapleton": {
    genre: "country", tempo: [60, 110], keys: ["A", "E", "G"], scale: "mixolydian",
    complexity: 5, swing: 12, kits: {"kick": "acoustic", "snare": "acoustic", "hihat": "brushhat", "bass": "warm"},
    solos: ["leadguitar"],
    notes: "Blues-soaked country with a soul singer's phrasing.",
  },
  "kacey musgraves": {
    genre: "country", tempo: [90, 120], keys: ["G", "C", "D"], scale: "major",
    complexity: 4, swing: 10, kits: {"kick": "acoustic", "snare": "acoustic", "hihat": "brushhat", "bass": "warm"},
    solos: ["leadguitar", "piano"],
    notes: "Clean modern country with pedal steel and space.",
  },
  "johnny cash": {
    genre: "country", tempo: [95, 130], keys: ["G", "A", "E"], scale: "major",
    complexity: 4, swing: 8, kits: {"kick": "acoustic", "snare": "rimshot", "hihat": "brushhat", "bass": "upright"},
    solos: ["leadguitar"],
    notes: "Boom-chick rhythm guitar and a train-beat snare.",
  },
  "morgan wallen": {
    genre: "country", tempo: [95, 132], keys: ["D", "A", "B"], scale: "major",
    complexity: 5, swing: 10, kits: {"kick": "punch", "snare": "acoustic", "hihat": "bright", "bass": "warm"},
    solos: ["leadguitar", "piano"],
    notes: "Country with modern pop drums under it.",
  },

  // ---- orchestral
  "john williams": {
    genre: "orchestral", tempo: [70, 130], keys: ["D", "C", "G"], scale: "major",
    complexity: 7, swing: 0, kits: {"kick": "acoustic", "snare": "acoustic", "perc": "timpani", "bass": "upright"},
    solos: ["horn", "strings"],
    notes: "Leitmotif writing - brass carries the theme, strings the motion.",
  },
  "ludwig van beethoven": {
    genre: "orchestral", tempo: [66, 140], keys: ["C", "F", "A"], scale: "minor",
    complexity: 8, swing: 0, kits: {"kick": "acoustic", "snare": "acoustic", "perc": "timpani", "bass": "upright"},
    solos: ["strings", "woodwind"],
    notes: "Motivic development from the smallest possible cell.",
  },
  "wolfgang amadeus mozart": {
    genre: "orchestral", tempo: [80, 140], keys: ["G", "D", "F"], scale: "major",
    complexity: 6, swing: 0, kits: {"kick": "acoustic", "snare": "acoustic", "perc": "timpani", "bass": "upright"},
    solos: ["strings", "woodwind"],
    notes: "Balanced classical phrasing, clear cadences.",
  },
  "gustav holst": {
    genre: "orchestral", tempo: [70, 120], keys: ["C", "E", "A"], scale: "minor",
    complexity: 8, swing: 0, kits: {"kick": "acoustic", "snare": "acoustic", "perc": "timpani", "bass": "upright"},
    solos: ["horn", "strings"],
    notes: "Huge orchestration and ostinato-driven movement.",
  },

  // ---- cinematic
  "hans zimmer": {
    genre: "cinematic", tempo: [60, 110], keys: ["D", "C", "A"], scale: "minor",
    complexity: 6, swing: 0, kits: {"kick": "deep", "snare": "gated", "tom": "taiko", "perc": "timpani", "bass": "sub"},
    solos: ["strings", "horn"],
    notes: "Ostinato strings, low brass, and enormous simple harmony.",
  },
  "ludwig goransson": {
    genre: "cinematic", tempo: [70, 115], keys: ["F", "C", "G"], scale: "minor",
    complexity: 6, swing: 0, kits: {"kick": "deep", "snare": "gated", "tom": "taiko", "perc": "timpani", "bass": "sub"},
    solos: ["strings", "horn"],
    notes: "Hybrid orchestral and electronic, texture-led.",
  },
  "ramin djawadi": {
    genre: "cinematic", tempo: [70, 110], keys: ["A", "D", "E"], scale: "minor",
    complexity: 6, swing: 0, kits: {"kick": "deep", "snare": "gated", "tom": "taiko", "perc": "timpani", "bass": "sub"},
    solos: ["strings", "piano"],
    notes: "Cello ostinatos and a single memorable theme repeated.",
  },
  "two steps from hell": {
    genre: "cinematic", tempo: [85, 120], keys: ["C", "G", "D"], scale: "minor",
    complexity: 7, swing: 0, kits: {"kick": "deep", "snare": "gated", "tom": "taiko", "perc": "timpani", "bass": "sub"},
    solos: ["horn", "strings"],
    notes: "Trailer music at maximum - choir, brass, and relentless build.",
  },

  // ---- funk
  "james brown": {
    genre: "funk", tempo: [96, 120], keys: ["E", "D", "A"], scale: "mixolydian",
    complexity: 7, swing: 15, kits: {"kick": "punch", "snare": "crisp", "hihat": "tick", "bass": "slap"},
    solos: ["guitar", "horn"],
    notes: "Everything on the one, one chord, the band as a rhythm section.",
  },
  "parliament": {
    genre: "funk", tempo: [98, 115], keys: ["E", "G", "C"], scale: "mixolydian",
    complexity: 7, swing: 14, kits: {"kick": "punch", "snare": "crisp", "hihat": "tick", "bass": "slap"},
    solos: ["guitar", "organ"],
    notes: "P-Funk: synth bass, huge horns, deliberately absurd.",
  },
  "nile rodgers": {
    genre: "funk", tempo: [110, 124], keys: ["A", "E", "B"], scale: "mixolydian",
    complexity: 6, swing: 12, kits: {"kick": "punch", "snare": "crisp", "hihat": "tick", "bass": "slap"},
    solos: ["guitar"],
    notes: "Chic - the guitar IS the song, 16th-note chops.",
  },
  "vulfpeck": {
    genre: "funk", tempo: [95, 115], keys: ["D", "G", "A"], scale: "dorian",
    complexity: 6, swing: 16, kits: {"kick": "punch", "snare": "crisp", "hihat": "tick", "bass": "slap"},
    solos: ["guitar", "organ"],
    notes: "Minimalist modern funk built around bass and drums alone.",
  },

  // ---- soul
  "marvin gaye": {
    genre: "soul", tempo: [70, 105], keys: ["F", "C", "A#"], scale: "dorian",
    complexity: 6, swing: 18, kits: {"kick": "boombap", "snare": "fat", "hihat": "dark", "bass": "warm"},
    solos: ["sax", "organ"],
    notes: "Layered vocals over lush strings and a laid-back pocket.",
  },
  "al green": {
    genre: "soul", tempo: [75, 105], keys: ["A", "E", "D"], scale: "dorian",
    complexity: 5, swing: 20, kits: {"kick": "boombap", "snare": "fat", "hihat": "dark", "bass": "warm"},
    solos: ["organ", "horn"],
    notes: "Hi Records: tight horns, brushed feel, Hammond underneath.",
  },
  "aretha franklin": {
    genre: "soul", tempo: [80, 120], keys: ["C", "F", "G"], scale: "major",
    complexity: 6, swing: 16, kits: {"kick": "boombap", "snare": "fat", "hihat": "dark", "bass": "warm"},
    solos: ["piano", "horn"],
    notes: "Gospel piano and a full horn section behind a huge voice.",
  },
  "curtis mayfield": {
    genre: "soul", tempo: [85, 110], keys: ["F#", "B", "E"], scale: "dorian",
    complexity: 6, swing: 17, kits: {"kick": "boombap", "snare": "fat", "hihat": "dark", "bass": "warm"},
    solos: ["guitar", "strings"],
    notes: "Falsetto over wah guitar, congas and strings.",
  },

  // ---- ambient
  "brian eno": {
    genre: "ambient", tempo: [56, 80], keys: ["D", "C", "G"], scale: "lydian",
    complexity: 3, swing: 0, kits: {"kick": "softkick", "perc": "shaker", "bass": "sub", "pad": "airy"},
    solos: ["piano", "woodwind"],
    notes: "Systems music - loops of different lengths drifting apart.",
  },
  "aphex twin": {
    genre: "ambient", tempo: [60, 92], keys: ["A", "F", "C"], scale: "dorian",
    complexity: 4, swing: 0, kits: {"kick": "softkick", "perc": "shaker", "bass": "sub", "pad": "airy"},
    solos: ["piano", "strings"],
    notes: "Melodic ambient with detuned, slightly unsettling harmony.",
  },
  "stars of the lid": {
    genre: "ambient", tempo: [56, 72], keys: ["C", "G", "E"], scale: "lydian",
    complexity: 2, swing: 0, kits: {"kick": "softkick", "perc": "shaker", "bass": "sub", "pad": "warm"},
    solos: ["strings", "woodwind"],
    notes: "Drone and slow string swells, almost no rhythm at all.",
  },
  "biosphere": {
    genre: "ambient", tempo: [60, 88], keys: ["F", "A#", "D"], scale: "dorian",
    complexity: 3, swing: 0, kits: {"kick": "softkick", "perc": "shaker", "bass": "sub", "pad": "airy"},
    solos: ["pad", "piano"],
    notes: "Cold, wide, arctic-sounding textures over a distant pulse.",
  },
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

  // ---- round 12: filling the thin genres ---------------------------------
  // rap had ONE profile, jersey club and phonk two each, while trap had
  // twenty. A genre with one profile is a genre where "type beat" does
  // nothing, so the additions below are weighted hard toward what was empty.

  // ---- rap ---------------------------------------------------------------
  "dr dre": {
    genre: "rap", tempo: [90, 100], keys: ["F#", "C#", "G"], scale: "minor",
    complexity: 6, swing: 8, kits: { kick: "punch", snare: "crisp", hihat: "analog", bass: "moog", piano: "grand" },
    solos: ["lead", "strings"], notes: "G-funk lineage: live-feel bass, string stabs, immaculate space, nothing rushed.",
  },
  "eminem": {
    genre: "rap", tempo: [95, 110], keys: ["D", "A", "E"], scale: "minor",
    complexity: 7, swing: 4, kits: { kick: "punch", snare: "fat", hihat: "bright", bass: "warm", piano: "grand" },
    solos: ["strings", "lead"], notes: "Hard, driving, string-led menace with a relentless pocket.",
  },
  "just blaze": {
    genre: "rap", tempo: [90, 102], keys: ["C", "F", "Bb"], scale: "major",
    complexity: 8, swing: 8, kits: { kick: "punch", snare: "fat", hihat: "bright", bass: "warm", horn: "section" },
    solos: ["horn", "organ"], notes: "Maximal soul flip - horns, filtered loops, drums mixed to the ceiling.",
  },
  "swizz beatz": {
    genre: "rap", tempo: [95, 108], keys: ["F", "C", "G"], scale: "minor",
    complexity: 7, swing: 3, kits: { kick: "punch", snare: "clap", hihat: "metallic", bass: "synth", stab: "organ-chord" },
    solos: ["organ", "lead"], notes: "Loud, brash, organ-stab hooks and a shouted-chant energy.",
  },
  "hit-boy": {
    genre: "rap", tempo: [95, 115], keys: ["G#", "D#", "A#"], scale: "minor",
    complexity: 6, swing: 5, kits: { kick: "punch", snare: "trapsnap", hihat: "bright", bass: "true808", piano: "felt" },
    solos: ["lead", "woodwind"], notes: "Clean modern boom-bap hybrid, tight low end, restrained melodic hook.",
  },
  "havoc": {
    genre: "rap", tempo: [88, 96], keys: ["F#", "C#", "B"], scale: "minor",
    complexity: 6, swing: 6, kits: { kick: "boombap", snare: "rimshot", hihat: "dark", bass: "sub", piano: "electric" },
    solos: ["lead", "strings"], notes: "Cold, sparse Queensbridge menace - minor two-note motifs and empty space.",
  },

  // ---- jersey club --------------------------------------------------------
  "dj tameil": {
    genre: "jerseyclub", tempo: [138, 142], keys: ["C", "G", "F"], scale: "minor",
    complexity: 7, swing: 0, kits: { kick: "punch", snare: "clap", hihat: "bright", bass: "sub", vocal: "ay" },
    solos: ["vocal", "lead"], notes: "The originator's triplet kick bursts and chopped vocal stabs.",
  },
  "nadus": {
    genre: "jerseyclub", tempo: [138, 145], keys: ["A", "E", "D"], scale: "minor",
    complexity: 8, swing: 0, kits: { kick: "909", snare: "clap", hihat: "metallic", bass: "synth", perc: "cowbell" },
    solos: ["lead", "vocal"], notes: "Darker, harder club: heavier sub, industrial percussion, fewer vocal hooks.",
  },
  "unclegohan": {
    genre: "jerseyclub", tempo: [140, 148], keys: ["F", "C", "G#"], scale: "minor",
    complexity: 7, swing: 0, kits: { kick: "punch", snare: "clap", hihat: "sizzle", bass: "true808", vocal: "oh" },
    solos: ["vocal", "lead"], notes: "Modern viral club - bed-squeak kick pattern, big chopped hook, short loop.",
  },
  "mcvertt": {
    genre: "jerseyclub", tempo: [140, 150], keys: ["G#", "D#", "A#"], scale: "minor",
    complexity: 8, swing: 0, kits: { kick: "808", snare: "clap", hihat: "bright", bass: "hard808", stab: "bell-chord" },
    solos: ["lead", "vocal"], notes: "Jersey-drill crossover: club kick pattern under a drill melody and sliding 808.",
  },

  // ---- phonk --------------------------------------------------------------
  "soudiere": {
    genre: "phonk", tempo: [135, 150], keys: ["A#", "D#", "G#"], scale: "minor",
    complexity: 7, swing: 6, kits: { kick: "gritty", snare: "trapsnap", hihat: "sizzle", bass: "distorted", perc: "cowbell" },
    solos: ["lead"], notes: "Aggressive, distorted, fast hats and a wall of saturated 808.",
  },
  "dj yung vamp": {
    genre: "phonk", tempo: [128, 142], keys: ["C#", "F#", "B"], scale: "minor",
    complexity: 6, swing: 10, kits: { kick: "lofi", snare: "rimshot", hihat: "vinyl", bass: "sub", piano: "electric" },
    solos: ["vocal", "lead"], notes: "Dreamy, hazy phonk - slowed melodic loop over dusty Memphis drums.",
  },
  "playa phonk": {
    genre: "phonk", tempo: [140, 152], keys: ["D#", "A#", "F"], scale: "minor",
    complexity: 7, swing: 4, kits: { kick: "gritty", snare: "clap", hihat: "sizzle", bass: "hard808", perc: "cowbell" },
    solos: ["lead", "vocal"], notes: "Brazilian-leaning phonk with a driving cowbell riff and heavy saturation.",
  },

  // ---- amapiano -----------------------------------------------------------
  "de mthuda": {
    genre: "amapiano", tempo: [110, 115], keys: ["F", "C", "G"], scale: "minor",
    complexity: 7, swing: 12, kits: { kick: "deep", snare: "rimshot", hihat: "analog", bass: "logdrum", piano: "grand" },
    solos: ["piano", "pad"], notes: "Piano-forward amapiano, rolling log-drum, long hypnotic builds.",
  },
  "mfr souls": {
    genre: "amapiano", tempo: [110, 114], keys: ["A", "E", "D"], scale: "minor",
    complexity: 6, swing: 14, kits: { kick: "deep", snare: "brush", hihat: "tape", bass: "logdrum", piano: "rhodes" },
    solos: ["pad", "piano"], notes: "Soulful private-school piano: lush chords, gentle shakers, deep space.",
  },
  "focalistic": {
    genre: "amapiano", tempo: [110, 116], keys: ["G", "D", "C"], scale: "minor",
    complexity: 7, swing: 10, kits: { kick: "punch", snare: "clap", hihat: "bright", bass: "logdrum", perc: "shaker" },
    solos: ["lead", "piano"], notes: "Harder, chant-driven piano with a punchier kick and busier percussion.",
  },
  "young stunna": {
    genre: "amapiano", tempo: [110, 114], keys: ["D", "A", "E"], scale: "minor",
    complexity: 6, swing: 13, kits: { kick: "deep", snare: "rimshot", hihat: "analog", bass: "logdrum", organ: "drawbar" },
    solos: ["organ", "pad"], notes: "Vocal-led amapiano - warm organ pads, patient arrangement, church harmony.",
  },

  // ---- dubstep ------------------------------------------------------------
  "mala": {
    genre: "dubstep", tempo: [138, 142], keys: ["G", "D", "C"], scale: "minor",
    complexity: 5, swing: 6, kits: { kick: "deep", snare: "rimshot", hihat: "dark", bass: "sub", pad: "dark" },
    solos: ["pad"], notes: "Deep meditative dubstep: enormous sub, half-time space, almost no mid.",
  },
  "benga": {
    genre: "dubstep", tempo: [138, 142], keys: ["F", "C", "A#"], scale: "minor",
    complexity: 7, swing: 4, kits: { kick: "snappy", snare: "crisp", hihat: "metallic", bass: "wobble", lead: "square" },
    solos: ["lead"], notes: "Skippier, funkier early dubstep with a busy syncopated drum pattern.",
  },
  "flux pavilion": {
    genre: "dubstep", tempo: [138, 142], keys: ["C", "G", "D"], scale: "minor",
    complexity: 7, swing: 0, kits: { kick: "punch", snare: "gatedverb", hihat: "bright", bass: "wobble", lead: "supersaw" },
    solos: ["lead", "pad"], notes: "Melodic anthemic dubstep - big singable synth hook over the wobble.",
  },

  // ---- dnb ----------------------------------------------------------------
  "roni size": {
    genre: "dnb", tempo: [168, 174], keys: ["F", "C", "G"], scale: "minor",
    complexity: 8, swing: 6, kits: { kick: "punch", snare: "crisp", hihat: "ride", bass: "upright", piano: "rhodes" },
    solos: ["sax", "piano"], notes: "Jazz-step: double bass, live-feel breaks, real instruments over the drums.",
  },

  // ---- ukgarage -----------------------------------------------------------
  "wookie": {
    genre: "ukgarage", tempo: [130, 136], keys: ["A", "E", "D"], scale: "minor",
    complexity: 7, swing: 16, kits: { kick: "punch", snare: "rimshot", hihat: "tape", bass: "warm", piano: "rhodes" },
    solos: ["pad", "piano"], notes: "Soulful 2-step: swung shuffle, warm sub, jazzy Rhodes chords.",
  },
  "todd edwards": {
    genre: "ukgarage", tempo: [128, 134], keys: ["C", "G", "F"], scale: "major",
    complexity: 8, swing: 14, kits: { kick: "fourfloor", snare: "clap", hihat: "bright", bass: "pluck", vocal: "ooh" },
    solos: ["vocal", "piano"], notes: "Micro-chopped vocal collage - dozens of tiny pitched vocal fragments as the melody.",
  },
  "el-b": {
    genre: "ukgarage", tempo: [132, 138], keys: ["F#", "C#", "B"], scale: "minor",
    complexity: 7, swing: 12, kits: { kick: "punch", snare: "rimshot", hihat: "dark", bass: "sub", pad: "dark" },
    solos: ["pad"], notes: "Dark garage, the bridge to dubstep: sparse, sub-heavy, menacing.",
  },

  // ---- reggaeton ----------------------------------------------------------
  "luny tunes": {
    genre: "reggaeton", tempo: [92, 100], keys: ["A", "E", "D"], scale: "minor",
    complexity: 6, swing: 2, kits: { kick: "snappy", snare: "crisp", hihat: "metallic", bass: "synth", perc: "timbale" },
    solos: ["horn", "lead"], notes: "Classic dembow architecture: timbale fills, synth brass, relentless drive.",
  },
  "dj nelson": {
    genre: "reggaeton", tempo: [90, 98], keys: ["F", "C", "G"], scale: "minor",
    complexity: 6, swing: 3, kits: { kick: "punch", snare: "clap", hihat: "bright", bass: "sub", perc: "conga" },
    solos: ["lead", "horn"], notes: "Old-school underground reggaeton with heavy congas and a raw mix.",
  },

  // ---- afrobeats ----------------------------------------------------------
  "p priime": {
    genre: "afrobeats", tempo: [102, 110], keys: ["A", "E", "D"], scale: "minor",
    complexity: 6, swing: 12, kits: { kick: "punch", snare: "clap", hihat: "tape", bass: "warm", guitar: "clean" },
    solos: ["guitar", "lead"], notes: "Melodic guitar-led afrobeats, bright highlife arpeggios, gentle groove.",
  },
  "london": {
    genre: "afrobeats", tempo: [100, 108], keys: ["G", "D", "C"], scale: "minor",
    complexity: 7, swing: 11, kits: { kick: "deep", snare: "rimshot", hihat: "bright", bass: "logdrum", perc: "shekere" },
    solos: ["lead", "horn"], notes: "Percussion-rich street-pop with layered shakers and a chanting hook.",
  },

  // ---- house / techno -----------------------------------------------------
  "kerri chandler": {
    genre: "house", tempo: [120, 126], keys: ["A", "E", "D"], scale: "minor",
    complexity: 6, swing: 10, kits: { kick: "deep", snare: "clap", hihat: "analog", bass: "warm", organ: "drawbar" },
    solos: ["organ", "pad"], notes: "Deep house church: warm organ chords, live-feel swing, endless groove.",
  },
  "masters at work": {
    genre: "house", tempo: [122, 128], keys: ["C", "G", "F"], scale: "minor",
    complexity: 7, swing: 12, kits: { kick: "fourfloor", snare: "clap", hihat: "analog", bass: "warm", perc: "conga" },
    solos: ["piano", "horn"], notes: "Latin house: live congas, piano vamps, a full band feel over the four-four.",
  },
  "mr fingers": {
    genre: "house", tempo: [118, 124], keys: ["F", "C", "A#"], scale: "minor",
    complexity: 5, swing: 8, kits: { kick: "909", snare: "909snare", hihat: "909", bass: "303", pad: "juno" },
    solos: ["pad", "lead"], notes: "The original deep house blueprint - Juno pads, 303 bassline, patient build.",
  },
  "carl cox": {
    genre: "techno", tempo: [128, 136], keys: ["A", "D", "E"], scale: "minor",
    complexity: 7, swing: 0, kits: { kick: "909", snare: "909snare", hihat: "909", bass: "sub", stab: "square-chord" },
    solos: ["lead"], notes: "Driving peak-time techno: relentless 909, rolling bass, one idea done properly.",
  },
  "richie hawtin": {
    genre: "techno", tempo: [128, 134], keys: ["C", "G", "F"], scale: "minor",
    complexity: 8, swing: 0, kits: { kick: "909", snare: "rimclick", hihat: "606", bass: "303", lead: "ms20" },
    solos: ["lead"], notes: "Minimal: tiny changes over long stretches, 303 acid, almost nothing else.",
  },

  // ---- rock / synthwave ---------------------------------------------------
  "rick rubin": {
    genre: "rock", tempo: [90, 120], keys: ["E", "A", "D"], scale: "minor",
    complexity: 5, swing: 4, kits: { kick: "acoustic", snare: "acoustic", hihat: "analog", bass: "warm", guitar: "power" },
    solos: ["leadguitar", "guitar"], notes: "Strip it back: no reverb, no clutter, the performance carries everything.",
  },
  "butch vig": {
    genre: "rock", tempo: [110, 135], keys: ["F", "C", "G"], scale: "minor",
    complexity: 7, swing: 0, kits: { kick: "punch", snare: "gated", hihat: "bright", bass: "warm", guitar: "power" },
    solos: ["leadguitar"], notes: "Loud-quiet-loud: massive layered guitars in the chorus, restraint in the verse.",
  },
  "steve albini": {
    genre: "rock", tempo: [100, 140], keys: ["E", "A", "B"], scale: "minor",
    complexity: 6, swing: 0, kits: { kick: "roomy", snare: "acoustic", hihat: "analog", bass: "warm", guitar: "power" },
    solos: ["leadguitar"], notes: "Room mics and honesty - drums recorded live and loud, nothing sweetened.",
  },
  "perturbator": {
    genre: "synthwave", tempo: [120, 135], keys: ["D", "A", "E"], scale: "minor",
    complexity: 8, swing: 0, kits: { kick: "punch", snare: "gated", hihat: "metallic", bass: "distorted", lead: "hoover" },
    solos: ["lead"], notes: "Dark aggressive synthwave - horror arpeggios, distorted bass, relentless drive.",
  },
  "gunship": {
    genre: "synthwave", tempo: [105, 118], keys: ["F", "C", "G"], scale: "minor",
    complexity: 7, swing: 0, kits: { kick: "linn", snare: "gatedverb", hihat: "bright", bass: "synth", pad: "jupiter8" },
    solos: ["lead", "pad"], notes: "Cinematic retrowave with huge gated snares and a soaring vocal-style lead.",
  },

  // ---- lofi / neosoul / rnb ------------------------------------------------
  "tomppabeats": {
    genre: "lofi", tempo: [72, 86], keys: ["C", "G", "F"], scale: "major",
    complexity: 4, swing: 15, kits: { kick: "lofi", snare: "brush", hihat: "vinyl", bass: "warm", piano: "felt" },
    solos: ["piano"], notes: "Gentle study-beat lofi: felt piano, soft drums, nothing that demands attention.",
  },
  "steve lacy": {
    genre: "neosoul", tempo: [84, 100], keys: ["E", "A", "B"], scale: "minor",
    complexity: 6, swing: 10, kits: { kick: "lofi", snare: "crisp", hihat: "tape", bass: "warm", guitar: "clean" },
    solos: ["guitar", "leadguitar"], notes: "Bedroom funk: single clean guitar hook, tiny drums, huge amount of space.",
  },
  "jazmine sullivan": {
    genre: "rnb", tempo: [68, 84], keys: ["C", "G", "F"], scale: "minor",
    complexity: 7, swing: 12, kits: { kick: "punch", snare: "clap", hihat: "analog", bass: "warm", piano: "grand" },
    solos: ["piano", "strings"], notes: "Big vocal-first ballad architecture - gospel piano, patient dynamics.",
  },
  "dvsn": {
    genre: "rnb", tempo: [70, 88], keys: ["G#", "D#", "C#"], scale: "minor",
    complexity: 6, swing: 8, kits: { kick: "deep", snare: "rimshot", hihat: "dark", bass: "sub", pad: "airy" },
    solos: ["pad", "vocal"], notes: "Late-night alternative R&B: sub-heavy, reverb-drenched, minimal arrangement.",
  },
  "no id": {
    genre: "rnb", tempo: [80, 95], keys: ["Bb", "Eb", "F"], scale: "minor",
    complexity: 7, swing: 10, kits: { kick: "boombap", snare: "layered", hihat: "vinyl", bass: "warm", piano: "rhodes" },
    solos: ["strings", "vocal"], notes: "Soul-sample craftsmanship with live-feel drums and rich chord movement.",
  },

  // ---- hiphop / drill / trap ----------------------------------------------
  "large professor": {
    genre: "hiphop", tempo: [88, 96], keys: ["F", "C", "Bb"], scale: "minor",
    complexity: 6, swing: 12, kits: { kick: "sp1200", snare: "sp1200", hihat: "vinyl", bass: "upright", piano: "electric" },
    solos: ["sax", "vocal"], notes: "Golden-era SP-1200 crunch: filtered jazz loops, hard drums, no clutter.",
  },
  "diamond d": {
    genre: "hiphop", tempo: [90, 98], keys: ["Eb", "Ab", "C"], scale: "minor",
    complexity: 6, swing: 13, kits: { kick: "boombap", snare: "crisp", hihat: "vinyl", bass: "upright", horn: "muted" },
    solos: ["horn", "sax"], notes: "Dusty horn loops over a heavy swung kick - classic Diggin' in the Crates.",
  },
  "the neptunes": {
    genre: "hiphop", tempo: [95, 108], keys: ["C", "G", "D"], scale: "minor",
    complexity: 7, swing: 4, kits: { kick: "snappy", snare: "crisp", hihat: "metallic", bass: "synth", perc: "woodblock" },
    solos: ["lead", "vocal"], notes: "Skeletal funk: four sounds, enormous space, percussion doing the melody's job.",
  },
  "ghostface800": {
    genre: "drill", tempo: [140, 148], keys: ["F", "C", "G#"], scale: "minor",
    complexity: 7, swing: 4, kits: { kick: "808", snare: "trapsnap", hihat: "bright", bass: "drillslide", piano: "felt" },
    solos: ["lead", "woodwind"], notes: "Sliding drill 808 under a cold, sparse piano motif.",
  },
  "ab": {
    genre: "drill", tempo: [140, 145], keys: ["G#", "D#", "C#"], scale: "minor",
    complexity: 8, swing: 3, kits: { kick: "808", snare: "clap", hihat: "sizzle", bass: "drillslide", stab: "bell-chord" },
    solos: ["lead"], notes: "UK drill blueprint: slide bass on every bar, skippy hats, dark bell melody.",
  },
  "cashmoneyap": {
    genre: "trap", tempo: [130, 145], keys: ["C#", "F#", "A#"], scale: "minor",
    complexity: 6, swing: 5, kits: { kick: "808", snare: "trapsnap", hihat: "bright", bass: "true808", piano: "felt" },
    solos: ["lead", "kalimba"], notes: "Melodic trap with a soft piano or bell lead over a long-decay 808.",
  },
  "taz taylor": {
    genre: "trap", tempo: [130, 150], keys: ["F", "A#", "D#"], scale: "minor",
    complexity: 6, swing: 4, kits: { kick: "808", snare: "clap", hihat: "sizzle", bass: "true808", guitar: "clean" },
    solos: ["guitar", "lead"], notes: "Internet Money sound: clean guitar arpeggio hook, airy mix, emotional minor key.",
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
// The query and the keys have to be normalised the SAME way. They were not:
// the query had every hyphen stripped while the keys kept theirs, so a
// profile whose name contains a hyphen could never be found - not even by
// typing its name exactly. "hit-boy" became "hitboy", matched nothing, and
// fell through to the genre-keyword fallback. Any hyphenated or punctuated
// name was quietly unreachable.
function normaliseArtistKey(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9' ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Built once: normalised name -> real key. A second index drops separators
// entirely, because people type "metroboomin" and "hitboy" as one word.
const ARTIST_KEY_INDEX = (() => {
  const idx = new Map();
  for (const k of Object.keys(ARTIST_PROFILES)) idx.set(normaliseArtistKey(k), k);
  return idx;
})();
const ARTIST_SQUASHED_INDEX = (() => {
  const idx = new Map();
  for (const k of Object.keys(ARTIST_PROFILES)) {
    const squashed = normaliseArtistKey(k).replace(/[^a-z0-9]/g, "");
    if (!idx.has(squashed)) idx.set(squashed, k);
  }
  return idx;
})();

function findArtistProfile(query) {
  if (!query) return null;
  const q = normaliseArtistKey(query);
  if (!q) return null;

  const exact = ARTIST_KEY_INDEX.get(q);
  if (exact) return { key: exact, profile: ARTIST_PROFILES[exact], exact: true };

  const squashed = q.replace(/[^a-z0-9]/g, "");
  const squashedHit = ARTIST_SQUASHED_INDEX.get(squashed);
  if (squashedHit) return { key: squashedHit, profile: ARTIST_PROFILES[squashedHit], exact: true };

  // Substring either way, longest key first so "dj smokey" is not shadowed
  // by a shorter key that happens to be contained in it.
  const byLength = [...ARTIST_KEY_INDEX.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [norm, key] of byLength) {
    if (norm.includes(q) || q.includes(norm)) {
      return { key, profile: ARTIST_PROFILES[key], exact: false };
    }
  }
  const words = q.split(" ").filter((w) => w.length > 2);
  for (const [norm, key] of byLength) {
    if (words.some((w) => norm.includes(w))) {
      return { key, profile: ARTIST_PROFILES[key], exact: false };
    }
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



// ---------------------------------------------------------------------------
// Turning a profile into generation knobs
// ---------------------------------------------------------------------------
// Naming an artist used to set the genre, tempo, key, swing, complexity, drum
// kits and solo voices - and nothing else. Everything about how the beat is
// actually WRITTEN (how dense the drums are, how syncopated, how many parts
// play, how much space the melody leaves) still came from the genre and the
// complexity dial alone.
//
// That was measurable, and it measured badly. tools/measure-artist-match.js
// compares how far apart two different artists in a genre are against how far
// apart two runs of the SAME artist are. A ratio above 1 means the profile is
// steering the writing; near or below 1 means it is not. Before this table it
// was 0.68 - two different producers were CLOSER to each other than two runs
// of one producer, because the only thing separating them was noise.
//
// So the descriptive line every profile already carries is read for the words
// that describe how a beat is built. "Sparse arrangement, heavy space" and
// "aggressive, fast rolls, no space at all" are not decoration - they are the
// instructions, and they were sitting there unused.
//
// Each knob is an offset applied on top of the genre and complexity, in the
// same units and through the same path as the taste bias and the RL policy,
// and bounded the same way so the genre always stays recognisable.
const ARTIST_KEYWORD_KNOBS = [
  // [pattern, knob deltas, what the words mean musically]
  [/\b(sparse|spacious|space|minimal|restrained|patient|empty|room to breathe)\b/,
    { density: -0.045, layers: -0.13, rest: 0.07, sync: -1.2 }],
  [/\b(dense|busy|maximal|relentless|wall of|hyperactive|no space|frantic)\b/,
    { density: 0.05, layers: 0.14, rest: -0.06, sync: 1.6 }],
  [/\b(aggressive|hard|hard-hitting|brash|menace|menacing|punchy|driving|gut-punch)\b/,
    { density: 0.03, ghost: -0.03, sync: 0.8, roll: 0.05 }],
  [/\b(soft|gentle|warm|smooth|dreamy|hazy|woozy|lush|mellow)\b/,
    { density: -0.025, rest: 0.05, extension: 0.6, sync: -0.9 }],
  [/\b(swing|swung|loose|unquantised|drunken|behind|laid-back|pocket|dragging)\b/,
    { ghost: 0.09, sync: 1.4, variation: 0.05 }],
  [/\b(roll|rolls|rapid|fast hats|skippy|skittering|triplet)\b/,
    { roll: 0.09, density: 0.025, sync: 1.0 }],
  [/\b(jazz|jazzy|extended|9th|harmony|chord|harmonic|gospel|soul|soulful)\b/,
    { extension: 0.9, layers: 0.05, variation: 0.04 }],
  [/\b(hypnotic|repetiti|loop|one idea|locked|steady|hook)\b/,
    { variation: -0.07, sync: -0.7 }],
  [/\b(live|real|band|played|acoustic|human|performance|improvis)\b/,
    { ghost: 0.07, variation: 0.06, layers: 0.05 }],
  [/\b(dark|cold|moody|eerie|horror|murky|melancholy|sad|minor)\b/,
    { extension: 0.4, rest: 0.04, density: -0.015 }],
  [/\b(layered|stacked|big|huge|anthemic|cinematic|orchestral|epic|full)\b/,
    { layers: 0.13, density: 0.02 }],
  [/\b(chopped|chop|stab|stabs|micro|fragment)\b/,
    { variation: 0.07, rest: 0.04, sync: 0.9 }],
];

// The knob names the generator understands, and how far a profile may push
// each one. Bounded for the same reason the RL policy is: an artist profile
// should colour the genre, never overrule it. Someone asking for a Metro
// Boomin trap beat still wants a trap beat.
//
// The size of these bounds was measured rather than guessed. Sweeping a gain
// over the whole table and scoring both how far apart artists end up
// (tools/measure-artist-match.js) and how good the beats stay
// (ratePattern over every profile):
//
//     gain   separation   mean score   worst
//     0.0       0.680        88.8       63.6     no artist knobs at all
//     1.0       0.747        88.5       67.0
//     2.0       0.892        87.8       61.6
//     2.5       0.929        87.5       63.4     <- chosen
//     3.0       0.978        87.5       58.5
//     4.0       1.118        87.1       64.3
//     6.0        --          85.8       58.6     beats start falling apart
//
// 2.5 is where separation has risen by a third while the mean score has
// given up 1.3 points and the WORST case has not moved at all. Pushing to 4
// would buy separation above 1.0 - the point where two artists differ more
// than two runs of one artist - but it starts eating the worst case, and a
// type beat that is unmistakably Metro Boomin and also bad is not the trade
// anyone wants. This is a genre-colouring control, not a genre-replacing one.
const ARTIST_KNOB_RANGE = {
  density: 0.175, sync: 7.5, extension: 3.5, layers: 0.5,
  rest: 0.225, ghost: 0.3, roll: 0.35, variation: 0.3,
};

// The keyword deltas above are written at unit scale, so they are scaled
// here by the same 2.5 the sweep settled on before being clamped.
const ARTIST_KNOB_GAIN = 2.5;

function clampKnobs(k, scaled) {
  const out = {};
  for (const name of Object.keys(ARTIST_KNOB_RANGE)) {
    const lim = ARTIST_KNOB_RANGE[name];
    const v = (k[name] || 0) * (scaled ? 1 : ARTIST_KNOB_GAIN);
    out[name] = Math.max(-lim, Math.min(lim, v));
  }
  return out;
}

// Derive the knobs for one profile. An explicit `knobs` field on the profile
// wins outright, so a specific artist can always be hand-corrected without
// touching the keyword table.
function artistKnobs(profile) {
  if (!profile) return null;
  if (profile.knobs) return clampKnobs(profile.knobs, true);
  const text = String(profile.notes || "").toLowerCase();
  const acc = {};
  for (const [pattern, deltas] of ARTIST_KEYWORD_KNOBS) {
    if (!pattern.test(text)) continue;
    for (const [k, v] of Object.entries(deltas)) acc[k] = (acc[k] || 0) + v;
  }
  // Complexity is already applied by the dial, but an artist sitting at the
  // extremes of it should lean the knobs the same way, so that a complexity-9
  // producer and a complexity-4 one differ even when their words are similar.
  const tilt = ((profile.complexity || 5) - 5.5) / 4.5;
  acc.density = (acc.density || 0) + tilt * 0.02;
  acc.layers = (acc.layers || 0) + tilt * 0.05;
  acc.sync = (acc.sync || 0) + tilt * 0.8;
  return clampKnobs(acc);
}

// ---------------------------------------------------------------------------
// What each producer actually plays
// ---------------------------------------------------------------------------
// A profile named the genre, tempo, key, swing, complexity, drum kits and
// solo voices - but the solo voices were only a bias, and the genre's own
// pool still supplied everything else. So a Metro Boomin type beat could
// arrive with a saxophone on it, because R&B-adjacent genres field one and
// nothing said otherwise.
//
// This is the missing half: what a producer's records DO and DO NOT have on
// them. `only` replaces the genre's solo pool outright; `avoid` removes
// instruments from consideration entirely, including the chordal ones the
// solo pool never touched.
//
// The entries below cover the producers whose sound is most defined by a
// specific instrument. Anything not listed keeps the genre's own behaviour,
// which is the right default - most producers are not defined by refusing to
// use a piano.
const ARTIST_INSTRUMENTS = {
  // ---- trap / rap: the 808 is the instrument, the melody is bells or synth
  "metro boomin":  { only: ["lead", "woodwind", "kalimba"], avoid: ["sax", "leadguitar", "organ", "guitar", "strings", "talkbox"] },
  "southside":     { only: ["lead", "autolead"], avoid: ["sax", "woodwind", "leadguitar", "organ", "guitar", "strings", "piano"] },
  "wheezy":        { only: ["lead", "kalimba", "woodwind"], avoid: ["sax", "leadguitar", "organ", "guitar", "strings"] },
  "tay keith":     { only: ["lead", "autolead"], avoid: ["sax", "woodwind", "leadguitar", "organ", "guitar", "strings", "marimba"] },
  "pierre bourne": { only: ["lead", "marimba", "kalimba"], avoid: ["sax", "woodwind", "leadguitar", "organ", "guitar", "strings"] },
  "cashmoneyap":   { only: ["lead", "kalimba"], avoid: ["sax", "woodwind", "leadguitar", "organ", "strings"] },
  "taz taylor":    { only: ["guitar", "lead"], avoid: ["sax", "woodwind", "organ", "strings", "talkbox"] },
  "hit-boy":       { only: ["lead", "woodwind"], avoid: ["sax", "leadguitar", "organ", "guitar"] },
  "swizz beatz":   { only: ["organ", "lead"], avoid: ["sax", "woodwind", "leadguitar", "strings", "marimba", "kalimba"] },
  "just blaze":    { only: ["horn", "organ"], avoid: ["woodwind", "leadguitar", "kalimba", "marimba", "autolead"] },
  "dr dre":        { only: ["lead", "strings"], avoid: ["woodwind", "kalimba", "marimba", "autolead", "talkbox"] },
  "eminem":        { only: ["strings", "lead"], avoid: ["woodwind", "sax", "kalimba", "marimba", "talkbox"] },
  "kanye west":    { only: ["vocal", "strings"], avoid: ["woodwind", "kalimba", "marimba", "autolead"] },
  "havoc":         { only: ["lead", "piano"], avoid: ["woodwind", "sax", "kalimba", "marimba", "leadguitar", "talkbox"] },

  // ---- drill: a cold bell or dark wind, and nothing warm
  "pop smoke":     { only: ["lead", "woodwind"], avoid: ["sax", "leadguitar", "organ", "guitar", "strings", "marimba"] },
  "central cee":   { only: ["lead", "woodwind", "piano"], avoid: ["sax", "leadguitar", "organ", "guitar", "strings"] },
  "ab":            { only: ["lead"], avoid: ["sax", "woodwind", "leadguitar", "organ", "guitar", "strings", "marimba", "kalimba"] },
  "ghostface800":  { only: ["lead", "piano", "woodwind"], avoid: ["sax", "leadguitar", "organ", "guitar", "strings"] },

  // ---- phonk: cowbell lead and saturation, no orchestra
  "kordhell":      { only: ["lead"], avoid: ["sax", "woodwind", "organ", "strings", "marimba", "kalimba", "guitar"] },
  "dj smokey":     { only: ["lead", "vocal"], avoid: ["sax", "woodwind", "organ", "strings", "marimba"] },
  "soudiere":      { only: ["lead"], avoid: ["sax", "woodwind", "organ", "strings", "marimba", "kalimba", "guitar", "piano"] },

  // ---- boom bap and soul: horns, keys, and no synth leads
  "j dilla":       { only: ["sax", "vocal", "leadguitar"], avoid: ["autolead", "lead", "arp", "talkbox"] },
  "dj premier":    { only: ["sax", "vocal"], avoid: ["autolead", "lead", "arp", "kalimba", "marimba", "talkbox"] },
  "the alchemist": { only: ["sax", "woodwind", "vocal"], avoid: ["autolead", "lead", "arp", "talkbox"] },
  "madlib":        { only: ["sax", "woodwind", "vocal"], avoid: ["autolead", "arp", "talkbox"] },
  "9th wonder":    { only: ["sax", "vocal"], avoid: ["autolead", "lead", "arp", "kalimba", "talkbox"] },
  "large professor": { only: ["sax", "vocal"], avoid: ["autolead", "lead", "arp", "talkbox"] },
  "diamond d":     { only: ["horn", "sax"], avoid: ["autolead", "lead", "arp", "talkbox", "kalimba"] },
  "nujabes":       { only: ["sax", "woodwind", "piano"], avoid: ["autolead", "arp", "talkbox"] },
  "knxwledge":     { only: ["vocal", "sax"], avoid: ["autolead", "lead", "arp", "talkbox"] },

  // ---- neo-soul: real players
  "robert glasper": { only: ["piano", "sax"], avoid: ["autolead", "lead", "arp", "talkbox", "kalimba"] },
  "d'angelo":      { only: ["leadguitar", "sax", "organ"], avoid: ["autolead", "lead", "arp", "kalimba", "marimba"] },
  "erykah badu":   { only: ["sax", "woodwind", "organ"], avoid: ["autolead", "lead", "arp", "kalimba"] },
  "hiatus kaiyote": { only: ["guitar", "sax"], avoid: ["autolead", "arp", "talkbox"] },
  "steve lacy":    { only: ["guitar", "leadguitar"], avoid: ["autolead", "arp", "sax", "woodwind", "talkbox", "kalimba"] },

  // ---- dance: synths only
  "daft punk":     { only: ["lead", "talkbox", "arp"], avoid: ["sax", "woodwind", "leadguitar", "marimba", "kalimba"] },
  "carl cox":      { only: ["lead", "arp"], avoid: ["sax", "woodwind", "leadguitar", "guitar", "marimba", "kalimba", "piano"] },
  "richie hawtin": { only: ["lead", "arp"], avoid: ["sax", "woodwind", "leadguitar", "guitar", "marimba", "kalimba", "piano", "strings"] },
  "charlotte de witte": { only: ["lead"], avoid: ["sax", "woodwind", "leadguitar", "guitar", "marimba", "kalimba", "piano", "strings"] },
  "perturbator":   { only: ["lead", "arp"], avoid: ["sax", "woodwind", "guitar", "marimba", "kalimba", "piano"] },
  "kerri chandler": { only: ["organ", "piano"], avoid: ["autolead", "arp", "talkbox", "kalimba", "marimba"] },

  // ---- rock: guitars
  "rick rubin":    { only: ["leadguitar", "guitar"], avoid: ["lead", "autolead", "arp", "sax", "woodwind", "talkbox", "kalimba", "marimba"] },
  "steve albini":  { only: ["leadguitar"], avoid: ["lead", "autolead", "arp", "sax", "woodwind", "talkbox", "kalimba", "marimba", "strings"] },
  "butch vig":     { only: ["leadguitar"], avoid: ["lead", "autolead", "arp", "sax", "woodwind", "talkbox", "kalimba", "marimba"] },
};

// The solo voices a profile should be allowed to field, and the instruments
// it should never field. Returns nulls when a profile has no opinion, which
// is most of them.
function artistInstruments(artistKey, profile) {
  const spec = ARTIST_INSTRUMENTS[artistKey];
  if (!spec) return { only: (profile && profile.solos) ? profile.solos.slice() : null, avoid: null };
  return {
    only: spec.only ? spec.only.slice() : ((profile && profile.solos) ? profile.solos.slice() : null),
    avoid: spec.avoid ? spec.avoid.slice() : null,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ARTIST_PROFILES, findArtistProfile, artistFallbackGenre, artistProfileNames,
    creditLine, uploadText, artistKnobs, ARTIST_KNOB_RANGE, ARTIST_KEYWORD_KNOBS,
    ARTIST_INSTRUMENTS, artistInstruments,
  };
}
