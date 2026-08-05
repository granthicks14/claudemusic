const STEPS_PER_BAR = 16;

const REGISTER = { bass: 0, piano: 14, pad: 7, lead: 21, stab: 14, guitar: 7, strings: 14, horn: 14, organ: 7, vocal: 14, kalimba: 14, marimba: 14, arp: 18, autolead: 14, sax: 14, woodwind: 17, leadguitar: 14, talkbox: 14 };

const FLAVOR_POOLS = {
  kick: ["boombap", "808", "fourfloor", "acoustic", "lofi", "deep", "snappy", "click", "punch", "subkick", "gritty", "roomy", "knock", "thump", "distorted", "tight", "woofer", "vinyl", "house909", "trapkick", "jazzkick", "breakkick", "softkick", "hardstyle", "909", "linn", "707", "606", "dmx", "sp1200", "lm1", "rz1", "hr16", "r8", "drumulator", "drumtraks", "rx5", "cr8000", "kr55", "dr110", "mpc60"],
  snare: ["crisp", "clap", "fat", "rimshot", "trapsnap", "brush", "gated", "acoustic", "ghost", "layered", "909snare", "linn", "707", "dmx", "sp1200", "rimclick", "gatedverb", "lm1", "rz1", "hr16", "r8", "drumulator", "drumtraks", "rx5", "cr8000", "kr55", "dr110", "mpc60", "piccolo", "deepsnare", "crack", "roomsnare", "snap", "thicksnare", "brushswirl", "sidestick", "drillsnare", "housesnare", "dnbsnare", "lofisnare"],
  hihat: ["bright", "dark", "vinyl", "metallic", "analog", "tape", "sizzle", "lofi808", "909", "707", "606", "ride", "lm1", "rz1", "r8", "drumulator", "rx5", "cr8000", "kr55", "dr110", "mpc60", "trapclosed", "washy", "foot", "tick", "halfopen", "brushhat", "glassy", "dirty", "clave606", "shimmer"],
  perc: ["shaker", "conga", "cowbell", "clave", "tambourine", "bongo", "triangle", "timpani", "cr78", "talkingdrum", "woodblock", "tabla", "cabasa", "guiro", "agogo", "vibraslap", "cajon", "djembe", "timbale", "shekere", "ganza", "caxixi", "udu", "pandeiro", "tamborim", "repinique", "surdo", "bata", "cuica"],
  tom: ["acoustic", "simmons", "roto", "taiko", "808tom", "floor", "gatedtom", "linn", "909tom", "electro", "deeptom", "concert", "damped", "hybridtom"],
  bass: ["warm", "synth", "808", "true808", "hard808", "sub", "pluck", "logdrum", "wobble", "drillslide", "distorted", "reese", "growl", "upright", "moog", "303", "slap", "sh101", "fretless", "m1organbass", "glide808", "punch808", "long808", "clean808", "dirty808", "knock808", "rumble808", "detuned808", "distort808", "fuzz808", "overdrive808", "grimy808", "rage808", "deep808", "memphis808", "stab808", "wide808", "slide808", "bright808"],
  piano: ["electric", "pluck", "grand", "rhodes", "wurlitzer", "upright", "celesta", "toy", "harpsichord", "dx7ep", "clav", "m1piano", "cp70", "honkytonk", "felt", "tack", "jazzgrand"],
  lead: ["square", "saw", "bell", "flute", "supersaw", "pluck", "sine", "chip", "brasslead", "fm", "whistle", "theremin", "panflute", "harmonica", "ocarina", "hoover", "ms20", "d50", "prophet", "obxa", "phasedist"],
  pad: ["warm", "ensemble", "airy", "glass", "choir", "dark", "juno", "solina", "cs80", "voxhumana", "jupiter8", "polysix", "ppgwave", "strings2", "brassy", "breath", "crystal", "analogwarm", "sweep", "wash", "lowpad", "shimmer", "hollow", "evolving", "tight"],
  stab: ["pluck-chord", "square-chord", "bell-chord", "brass-chord", "organ-chord", "string-chord", "orchhit", "saw-chord", "supersaw-chord", "fm-chord", "sine-chord", "pluck-stab", "hoover-chord", "vox-chord", "piano-chord", "ms20-chord", "d50-chord", "prophet-chord", "obxa-chord", "chip-chord", "phase-chord", "square-lead-chord", "brass-lead-chord"],
  guitar: ["clean", "power", "muted", "nylon", "acoustic", "jazz", "funk", "twelvestring", "sitar", "banjo", "mandolin", "ukulele", "slide", "openchord", "resonator", "baritone"],
  strings: ["soul", "orchestral", "staccato", "synth", "pizzicato", "tremolo", "mellotron", "solina", "cello", "spiccato", "harp", "solocello", "chamber", "cinematic", "marcato", "sulponte"],
  horn: ["brass", "soft", "muted", "sax", "trumpetstab", "section", "clarinet", "frenchhorn", "oboe", "trombone", "tuba", "flugelhorn", "piccolo", "hornsection", "solotrumpet", "mellow", "stabbrass", "lowbrass"],
  organ: ["drawbar", "gospel", "church", "combo", "farfisa", "accordion", "harmonium", "m1organ", "jazzorgan", "fullorgan", "flute8", "reedy", "bright16", "rockorgan", "perc3", "mellowbars", "wail", "quintonly", "theatre"],
  vocal: ["ooh", "ahh", "ay", "oh", "choir", "vocoder", "eee", "ohh", "mmm", "aww", "yeah", "ih", "uh", "er", "oo", "aa"],
  kalimba: ["kalimba", "musicbox", "steeldrum", "glock", "hangdrum", "balafon", "kora", "thumbpiano", "mbira", "handpan", "gamelan", "musicboxhi", "sansula", "karimba", "likembe", "celestetine", "toybox", "tinebell"],
  marimba: ["marimba", "vibraphone", "xylophone", "tubularbell", "bassmarimba", "crotales", "glassbar", "tonguedrum", "celestebar", "steelpan", "bowedvibes", "bellplate", "almglocken", "slitdrum", "hardmallet", "softmallet", "glockbar"],
  arp: ["arp", "pulse", "trance", "acid", "harp", "bellarp", "saw", "square", "wide", "dark", "glass", "subarp", "needle", "swellarp"],
  // A real mono hook instrument for the "Auto-Tune hook" modern rap/trap
  // production leans on - distinct from the existing "vocal" chordal
  // vowel-chop instrument (see playAutoLeadVoice for why: no vibrato at
  // all, which is what actually reads as hard-pitch-corrected rather than
  // sung).
  autolead: ["hard", "moody", "bright", "wide", "gritty", "soft", "nasal", "wail", "robotic", "airy", "deep", "modern"],
  // A real mono solo-line instrument - saxophone melodies are played one
  // note at a time, a different musical role from Horn's chord stabs.
  sax: ["smooth", "breathy", "alto", "bari", "tenor", "soprano", "basssax", "subtone", "growl", "altissimo", "smoky", "cutting", "vintage", "cmelody"],
  // The rest of the woodwind family - the sax's siblings. Every one of
  // these is a single-line solo instrument, and the family splits on one
  // acoustic fact (see playWoodwindVoice): a CONICAL bore (sax, oboe,
  // bassoon) produces the complete harmonic series, while a CYLINDRICAL
  // one (clarinet) produces essentially only the ODD harmonics - which
  // is exactly why a clarinet sounds hollow next to an oboe.
  woodwind: ["flute", "altoflute", "clarinet", "bassclarinet", "oboe", "englishhorn", "bassoon", "sopranosax", "shakuhachi", "bansuri", "duduk", "recorder", "piccolo", "panflute", "ocarina", "tinwhistle", "dizi", "ney", "bassflute", "overblown", "woodflute", "basset", "contrabassoon"],
  // A dedicated solo/lead guitar track, separate from the rhythm guitar.
  // Six genres had no solo voice at all; rock in particular had a rhythm
  // guitar and nothing to play over it.
  leadguitar: ["overdrive", "fuzz", "wah", "sustain", "octave", "cleantone", "harmonics", "crunch", "metal", "tremolo", "surf", "jazzlead", "blues", "chorus", "ebow", "twang"],
  // A talkbox is an INSTRUMENT shaped by a mouth, which is the opposite
  // of a vocoder (a voice shaped by an instrument) - see playTalkboxVoice.
  talkbox: ["roger", "gfunk", "robot", "bright", "deep", "nasal", "drawl", "vintage", "chatter", "rise"],
  fx: ["riser", "siren", "impact", "downlifter", "uplifter", "reverse", "wind", "whistle", "sweepdown", "subdrop", "vinylstop", "zap", "airhorn"],
};

// Which genres each kit actually belongs to.
//
// Adding fifty highly characterful instruments to the shared pools without
// this map would be actively harmful: the shuffle picks from the whole
// pool, so a techno track would sooner or later be handed a banjo. Timbre
// alone is not enough knowledge about an instrument - WHERE it is used is
// part of what the instrument is. A sitar belongs in psychedelic-leaning
// hip-hop and lo-fi, not in UK garage; a Korg M1 organ is the sound of
// house specifically; spiccato strings and tubular bells are drill and
// trap devices; a kora and a balafon are West African and belong with
// Afrobeats and Amapiano.
//
// Any flavor NOT listed here is treated as universal - that covers every
// generic flavor the program already had ("warm", "bright", "grand"...).
const FLAVOR_GENRES = {
  // --- kits whose own character decides where they can go
  // A brushed or jazz-kit drum is a room, a wire brush and a player. Under a
  // trap, drill, phonk or techno beat it does not read as a variation, it
  // reads as the wrong record. These were reachable everywhere because
  // nothing had ever said otherwise.
  "kick:acoustic": ["rock", "lofi", "neosoul", "rnb", "hiphop", "afrobeats", "amapiano", "reggaeton", "house"],
  "kick:jazzkick": ["lofi", "neosoul", "rnb", "hiphop", "house", "dnb"],
  "snare:brush": ["lofi", "neosoul", "rnb", "hiphop", "afrobeats", "amapiano", "rock"],
  "snare:brushswirl": ["lofi", "neosoul", "rnb", "hiphop", "afrobeats", "amapiano", "rock"],
  "snare:acoustic": ["rock", "lofi", "neosoul", "rnb", "hiphop", "afrobeats", "amapiano", "reggaeton", "dnb", "house"],
  // --- round 12 additions, each placed where the sound actually comes from
  "arp:trance": ["synthwave", "techno", "house", "dnb", "dubstep", "ukgarage"],
  "arp:acid": ["techno", "house", "dnb", "synthwave"],
  "arp:harp": ["lofi", "neosoul", "rnb", "amapiano", "afrobeats", "hiphop"],
  "arp:bellarp": ["synthwave", "lofi", "house", "ukgarage", "rnb", "amapiano"],
  "tom:808tom": ["trap", "drill", "phonk", "rap", "hiphop", "jerseyclub"],
  "tom:floor": ["rock", "neosoul", "rnb", "dnb", "afrobeats"],
  "tom:gatedtom": ["synthwave", "rock", "phonk", "dubstep"],
  "autolead:bright": ["rap", "trap", "jerseyclub", "reggaeton", "afrobeats"],
  "autolead:wide": ["rnb", "trap", "drill", "synthwave"],
  "autolead:gritty": ["drill", "phonk", "rap", "dubstep"],
  // --- drum machines, placed by the era and scene that actually used them
  lm1: ["synthwave", "rnb", "rock", "lofi", "hiphop", "rap"],
  rz1: ["lofi", "hiphop", "house", "phonk", "jerseyclub"],
  hr16: ["rock", "rnb", "neosoul", "lofi"],
  r8: ["rock", "dnb", "techno", "house"],
  // --- world percussion
  tabla: ["afrobeats", "lofi", "rnb", "amapiano"],
  cabasa: ["afrobeats", "house", "reggaeton", "amapiano", "neosoul"],
  guiro: ["reggaeton", "afrobeats", "house"],
  agogo: ["afrobeats", "amapiano", "house", "reggaeton", "jerseyclub"],
  vibraslap: ["rock", "lofi", "neosoul"],
  cajon: ["lofi", "neosoul", "rnb", "afrobeats"],
  djembe: ["afrobeats", "amapiano", "house"],
  timbale: ["reggaeton", "house", "afrobeats", "jerseyclub"],
  roto: ["rock", "synthwave", "dnb"],
  taiko: ["dubstep", "drill", "trap", "dnb", "rap"],
  // --- synths and keyboards
  sh101: ["house", "techno", "ukgarage", "synthwave", "dnb", "jerseyclub"],
  fretless: ["neosoul", "rnb", "lofi"],
  m1organbass: ["house", "ukgarage", "amapiano", "techno", "jerseyclub"],
  m1piano: ["house", "ukgarage", "amapiano", "jerseyclub", "dnb"],
  m1organ: ["house", "ukgarage", "amapiano", "techno", "jerseyclub"],
  cp70: ["synthwave", "rnb", "neosoul", "rock"],
  honkytonk: ["lofi", "hiphop"],
  solina: ["synthwave", "lofi", "neosoul", "rnb", "house", "dnb", "ukgarage"],
  cs80: ["synthwave", "dubstep", "techno", "dnb"],
  voxhumana: ["synthwave", "lofi", "house"],
  farfisa: ["rock", "lofi", "house"],
  accordion: ["afrobeats", "lofi", "reggaeton"],
  harmonium: ["lofi", "neosoul", "afrobeats"],
  // --- winds
  theremin: ["synthwave", "lofi", "dubstep"],
  panflute: ["afrobeats", "lofi", "amapiano"],
  harmonica: ["rock", "lofi", "hiphop", "rnb"],
  ocarina: ["lofi", "synthwave", "afrobeats"],
  trombone: ["afrobeats", "neosoul", "rnb", "house", "rock"],
  tuba: ["rock", "hiphop", "afrobeats"],
  flugelhorn: ["neosoul", "rnb", "lofi", "amapiano"],
  // The high flute/piccolo lead over a dark 808 is a trap and drill
  // signature, not an orchestral gesture.
  piccolo: ["drill", "trap", "dubstep", "rap"],
  alto: ["neosoul", "rnb", "house", "afrobeats"],
  bari: ["neosoul", "rnb", "rock", "hiphop", "rap"],
  // --- plucked and bowed strings
  sitar: ["lofi", "hiphop", "trap", "afrobeats", "phonk", "rap"],
  banjo: ["rock", "lofi", "hiphop"],
  mandolin: ["rock", "lofi", "afrobeats"],
  ukulele: ["lofi", "afrobeats", "amapiano"],
  slide: ["rock", "lofi", "hiphop", "phonk", "rap"],
  // Dark, sustained low strings are central to UK drill and to the
  // orchestral side of trap.
  cello: ["rnb", "neosoul", "drill", "trap", "dnb", "rap"],
  spiccato: ["drill", "trap", "dubstep", "dnb", "rap"],
  harp: ["rnb", "neosoul", "lofi", "trap", "rap"],
  // --- tuned percussion
  hangdrum: ["lofi", "amapiano", "afrobeats", "neosoul"],
  balafon: ["afrobeats", "amapiano", "house"],
  kora: ["afrobeats", "amapiano", "lofi"],
  xylophone: ["afrobeats", "amapiano", "house", "lofi"],
  tubularbell: ["drill", "trap", "phonk", "dubstep", "rap"],

  // --- synths, placed by the scene that actually made them famous
  hoover: ["dnb", "dubstep", "techno", "jerseyclub", "phonk", "synthwave"],
  ms20: ["techno", "dnb", "dubstep", "phonk", "drill"],
  d50: ["synthwave", "house", "rnb", "ukgarage", "amapiano"],
  prophet: ["synthwave", "house", "rock", "techno"],
  obxa: ["synthwave", "rock", "house"],
  phasedist: ["synthwave", "techno", "ukgarage", "dnb"],
  jupiter8: ["synthwave", "house", "techno", "lofi", "rnb"],
  polysix: ["synthwave", "lofi", "house", "neosoul"],
  ppgwave: ["synthwave", "techno", "dnb", "dubstep", "rock"],
  // --- woodwinds. Amapiano in particular is built on live sax and flute
  // over the log drum, and dark flute lines are a UK drill signature.
  // The concert flute on the woodwind track, NOT the lead synth's
  // flute-ish preset, which has always been available everywhere.
  "woodwind:flute": ["trap", "drill", "rap", "lofi", "afrobeats", "amapiano", "rnb", "neosoul", "hiphop"],
  altoflute: ["lofi", "neosoul", "rnb", "amapiano"],
  bassclarinet: ["drill", "neosoul", "lofi", "dnb"],
  englishhorn: ["neosoul", "lofi", "rnb"],
  bassoon: ["drill", "dubstep", "neosoul", "rock"],
  sopranosax: ["amapiano", "neosoul", "rnb", "house", "afrobeats"],
  shakuhachi: ["lofi", "trap", "drill", "phonk"],
  bansuri: ["lofi", "afrobeats", "amapiano", "hiphop"],
  duduk: ["drill", "lofi", "trap", "phonk", "neosoul"],
  recorder: ["lofi", "afrobeats"],
  // --- lead guitar
  overdrive: ["rock", "phonk", "synthwave", "dnb", "neosoul"],
  fuzz: ["rock", "phonk", "dubstep"],
  wah: ["neosoul", "rnb", "rock", "afrobeats", "amapiano"],
  sustain: ["rock", "synthwave", "dubstep", "phonk"],
  octave: ["neosoul", "rnb", "lofi", "amapiano"],
  cleantone: ["neosoul", "rnb", "lofi", "amapiano", "afrobeats"],
  harmonics: ["rock", "phonk", "dubstep"],
  roger: ["rnb", "neosoul", "hiphop", "house", "rap"],
  gfunk: ["hiphop", "rnb", "phonk", "rap"],
  robot: ["house", "techno", "rnb", "jerseyclub"],
  // The talkbox vowel path, NOT the plain bright hi-hat.
  "talkbox:bright": ["house", "rnb", "neosoul", "ukgarage"],
  // --- more documented drum machines
  drumulator: ["hiphop", "lofi", "rap", "phonk", "house"],
  drumtraks: ["synthwave", "rnb", "rock", "hiphop"],
  rx5: ["synthwave", "house", "rnb", "techno", "dnb"],
  cr8000: ["lofi", "house", "synthwave", "afrobeats"],
  kr55: ["lofi", "rnb", "neosoul", "hiphop"],
  dr110: ["techno", "house", "phonk", "lofi"],
  mpc60: ["hiphop", "rap", "lofi", "rnb", "neosoul", "drill"],
  // --- layering percussion, for the denser end of the complexity dial
  shekere: ["afrobeats", "amapiano", "house", "neosoul"],
  ganza: ["afrobeats", "house", "reggaeton", "amapiano"],
  caxixi: ["afrobeats", "lofi", "neosoul", "amapiano"],
  udu: ["afrobeats", "amapiano", "lofi", "neosoul"],
  pandeiro: ["afrobeats", "house", "reggaeton", "neosoul"],
  tamborim: ["afrobeats", "house", "reggaeton", "amapiano"],
  repinique: ["afrobeats", "reggaeton", "house"],
  surdo: ["afrobeats", "reggaeton", "amapiano", "dnb"],
  bata: ["afrobeats", "amapiano", "house"],
  cuica: ["afrobeats", "house", "reggaeton"],
  // --- piano and guitar voices
  felt: ["lofi", "neosoul", "rnb", "amapiano", "synthwave"],
  tack: ["lofi", "hiphop", "phonk", "rap"],
  jazzgrand: ["neosoul", "rnb", "house", "lofi", "amapiano"],
  openchord: ["rock", "lofi", "afrobeats", "neosoul"],
  resonator: ["rock", "lofi", "phonk", "hiphop"],
  baritone: ["rock", "phonk", "synthwave", "drill"],
};

// A flavor is available to a genre if it is universal, or if that genre is
// in its list.
//
// Flavor names are namespaced PER TRACK in FLAVOR_POOLS - the hi-hat's
// "bright" and the talkbox's "bright" are unrelated sounds that merely
// share a word. This map was keyed by the bare name, so a restriction
// written for one instrument silently applied to every other instrument
// with the same flavor name: the talkbox's "bright" vowel path is
// house/R&B-only, which quietly made the plain bright hi-hat - one of the
// most common hat sounds there is - unavailable in fifteen of nineteen
// genres. Keys may now be written "track:flavor" to disambiguate, and an
// instrument-specific entry always wins over the bare name.
// ---------------------------------------------------------------------------
// Genres with a STRICT palette on a track
// ---------------------------------------------------------------------------
// FLAVOR_GENRES is opt-out: a kit is allowed everywhere unless it is
// individually restricted. That is the right default for 380 kits - listing
// every genre for every kit would be unmaintainable and would drift - but it
// is the wrong default for the handful of tracks where a genre's identity IS
// the sound choice.
//
// Measured before this existed: trap, rap, drill and phonk all allowed an
// upright double bass, a slap bass, a Moog, a 303 and a Reese on the bass
// track. Any shuffle could therefore put a jazz double bass under a trap
// beat, which is not a variation on trap - it is a different genre, and it
// is why the 808 kept disappearing from beats that are supposed to be built
// on one. Woodwind was worse: trap fielded a woodwind lead in 58% of beats
// and drill in 68%, and the allowed kits included clarinet, oboe, bassoon
// and duduk. A FLUTE over a trap beat is real and common; a bassoon is not.
//
// So where a genre has a palette rather than a preference, it is written
// down here and it wins outright.
//
// The woodwind track is really four families - flutes and dark end-blown
// winds, jazz reeds, orchestral double reeds, and recorders - and which of
// them a genre may field is a different answer per genre. A clarinet over a
// boom-bap beat follows the sampled jazz record it came from and is entirely
// at home; the same clarinet over trap is not. These two lists are the
// shapes almost every genre wants, named so they are not retyped nineteen
// times and quietly diverged.
const WW_FLUTE = ["flute", "altoflute", "bansuri", "shakuhachi", "duduk", "piccolo",
                  "panflute", "ocarina", "tinwhistle", "dizi", "ney", "bassflute",
                  "overblown", "woodflute"];
const WW_FLUTE_JAZZ = [...WW_FLUTE, "clarinet", "bassclarinet", "sopranosax", "basset"];

// The 808 family, in one place. It was written out per genre before, which
// is how trap ended up listing eight of them TWICE - harmless, but a sign
// that the list had stopped being read and started being copied. Grouped by
// how hard each one is driven, because that is the choice a producer is
// actually making when they pick between them.
// tools/measure-808.js holds each of these groups to a different amount of
// measured harmonic distortion, so a kit listed in the wrong one gets caught
// rather than just sounding off.
const K808_CLEAN = ["clean808", "sub", "rumble808", "long808", "deep808"];
const K808_WARM  = ["808", "true808", "glide808", "detuned808", "overdrive808",
                    "wide808", "slide808"];
const K808_HARD  = ["hard808", "punch808", "knock808", "stab808", "bright808"];
const K808_FILTHY = ["dirty808", "distort808", "fuzz808", "grimy808", "rage808",
                     "memphis808"];
const K808_ALL = [...K808_CLEAN, ...K808_WARM, ...K808_HARD, ...K808_FILTHY];
// Synth basses that are not 808s but do the same job in the same genres - a
// distorted saw, a growling reese, the drill slide. Kept separate from the
// groups above so "808 family" keeps meaning the 808 family.
const K_HARD_SYNTH_BASS = ["distorted", "growl", "drillslide"];
const GENRE_TRACK_KITS = {
  // The 808 genres. The bass is an 808 - that is the entire point - so the
  // list is the 808 family plus the two sub variants that still read as one.
  trap:       { bass: [...K808_ALL, ...K_HARD_SYNTH_BASS], woodwind: WW_FLUTE },
  rap:        { bass: [...K808_ALL, ...K_HARD_SYNTH_BASS], woodwind: WW_FLUTE },
  // Drill leads with the slide, which is the genre's signature 808 move.
  drill:      { bass: ["slide808", ...K808_ALL, ...K_HARD_SYNTH_BASS],
                woodwind: WW_FLUTE },
  // Phonk is the dirty end of the family and has no use for a polite one.
  phonk:      { bass: [...K808_FILTHY, ...K808_HARD, ...K808_WARM, ...K_HARD_SYNTH_BASS],
                woodwind: WW_FLUTE },
  jerseyclub: { bass: [...K808_HARD, ...K808_WARM, ...K808_CLEAN], woodwind: WW_FLUTE },
  hiphop:     { woodwind: WW_FLUTE_JAZZ },
  // Dance genres: the bass is a synth, never an acoustic one.
  house:      { bass: ["warm", "synth", "sub", "pluck", "moog", "303", "sh101", "m1organbass", "reese"],
                woodwind: WW_FLUTE_JAZZ },
  techno:     { bass: ["303", "sub", "distorted", "reese", "moog", "sh101", "synth", "pluck"] },
  dnb:        { bass: ["reese", "sub", "growl", "wobble", "distorted", "synth", "moog", "upright"],
                woodwind: WW_FLUTE },
  dubstep:    { bass: ["wobble", "growl", "reese", "sub", "distorted", "hard808"] },
  ukgarage:   { bass: ["sub", "warm", "synth", "pluck", "moog", "sh101", "reese", "m1organbass"],
                woodwind: WW_FLUTE },
  // Live-band genres: the bass is played by a person.
  rock:       { bass: ["warm", "upright", "slap", "fretless", "distorted", "moog"] },
  neosoul:    { bass: ["upright", "warm", "fretless", "slap", "moog", "sub"],
                woodwind: WW_FLUTE_JAZZ },
  // The Afro-diasporic and Latin genres take flutes and jazz reeds freely -
  // a soprano sax over amapiano or a flute over afrobeats is the sound - but
  // an oboe or a bassoon still belongs to a different record entirely.
  afrobeats:  { woodwind: WW_FLUTE_JAZZ },
  amapiano:   { woodwind: WW_FLUTE_JAZZ },
  reggaeton:  { woodwind: WW_FLUTE_JAZZ },
};

function flavorFitsGenre(inst, flavor, styleId) {
  // Called as (flavor, styleId) in older code paths; detect and shift.
  if (arguments.length === 2) { styleId = flavor; flavor = inst; inst = null; }
  // A strict palette wins over everything else, including a kit that carries
  // no restriction of its own.
  const strict = inst && GENRE_TRACK_KITS[styleId] && GENRE_TRACK_KITS[styleId][inst];
  if (strict) return strict.includes(flavor);
  const allowed = (inst && FLAVOR_GENRES[inst + ":" + flavor]) || FLAVOR_GENRES[flavor];
  return !allowed || allowed.includes(styleId);
}

function poolForGenre(inst, styleId) {
  const pool = FLAVOR_POOLS[inst] || [];
  const fitted = pool.filter((f) => flavorFitsGenre(inst, f, styleId));
  // Never hand back an empty pool - if a genre somehow excludes
  // everything, fall back to the full list rather than break the shuffle.
  return fitted.length ? fitted : pool;
}

// Tags each flavor by sonic character (warm/bright/dark) so a shuffle can
// pick one character and apply it across every instrument at once, instead
// of rolling each instrument's flavor fully independently. Real producers
// build a kit from one coherent sample pack or one console's character
// rather than grabbing random one-off samples - this is the same idea
// applied to a shuffle, so "Generate Beat" lands on a beat that sounds like
// one production instead of several unrelated instruments stacked together.
const FLAVOR_TAGS = {
  kick: { boombap: "warm", "808": "dark", fourfloor: "bright", acoustic: "warm", lofi: "warm", deep: "dark", snappy: "bright", click: "bright", punch: "bright", subkick: "dark", gritty: "dark", roomy: "warm", "909": "bright", linn: "warm", "707": "bright", "606": "dark", dmx: "dark", sp1200: "warm", rimclick: "warm" , lm1: "warm", rz1: "dark", hr16: "warm", r8: "warm", drumulator: "dark", drumtraks: "warm", rx5: "bright", cr8000: "warm", kr55: "warm", dr110: "bright", mpc60: "warm"},
  snare: { crisp: "bright", clap: "bright", fat: "warm", rimshot: "bright", trapsnap: "bright", brush: "warm", gated: "dark", acoustic: "warm", ghost: "dark", layered: "dark", "909snare": "bright", linn: "warm", "707": "bright", dmx: "dark", sp1200: "warm", rimclick: "warm", gatedverb: "bright" , lm1: "warm", rz1: "bright", hr16: "warm", r8: "warm", drumulator: "dark", drumtraks: "bright", rx5: "bright", cr8000: "bright", kr55: "warm", dr110: "bright", mpc60: "warm"},
  hihat: { bright: "bright", dark: "dark", vinyl: "warm", metallic: "bright", analog: "warm", tape: "warm", sizzle: "bright", lofi808: "dark", "909": "bright", "707": "bright", "606": "dark", ride: "bright" , lm1: "warm", rz1: "bright", r8: "bright", drumulator: "dark", rx5: "bright", cr8000: "bright", kr55: "warm", dr110: "bright", mpc60: "warm"},
  perc: { shaker: "warm", conga: "warm", cowbell: "bright", clave: "bright", tambourine: "bright", bongo: "warm", triangle: "bright", timpani: "dark", cr78: "warm", talkingdrum: "warm", woodblock: "bright" , tabla: "warm", cabasa: "bright", guiro: "bright", agogo: "bright", vibraslap: "bright", cajon: "warm", djembe: "warm", timbale: "bright", shekere: "warm", ganza: "bright", caxixi: "warm", udu: "dark", pandeiro: "bright", tamborim: "bright", repinique: "bright", surdo: "dark", bata: "warm", cuica: "bright"},
  tom: { acoustic: "warm", simmons: "bright" , roto: "bright", taiko: "dark"},
  bass: { warm: "warm", synth: "bright", "808": "dark", true808: "dark", hard808: "dark", sub: "dark", pluck: "warm", logdrum: "dark", wobble: "dark", drillslide: "dark", distorted: "dark", reese: "dark", growl: "dark", upright: "warm", moog: "warm", "303": "bright", slap: "bright" , sh101: "bright", fretless: "warm", m1organbass: "bright"},
  piano: { electric: "bright", pluck: "bright", grand: "warm", rhodes: "warm", wurlitzer: "warm", upright: "warm", celesta: "bright", toy: "bright", harpsichord: "bright", dx7ep: "bright", clav: "bright" , m1piano: "bright", cp70: "bright", honkytonk: "warm", felt: "warm", tack: "bright", jazzgrand: "warm"},
  lead: { square: "bright", saw: "bright", bell: "bright", flute: "warm", supersaw: "bright", pluck: "bright", sine: "warm", chip: "bright", brasslead: "warm", fm: "bright", whistle: "bright" , theremin: "warm", panflute: "warm", harmonica: "bright", ocarina: "warm", hoover: "dark", ms20: "bright", d50: "bright", prophet: "bright", obxa: "warm", phasedist: "bright"},
  pad: { warm: "warm", ensemble: "warm", airy: "bright", glass: "bright", choir: "warm", dark: "dark", juno: "warm" , solina: "warm", cs80: "warm", voxhumana: "warm", jupiter8: "warm", polysix: "warm", ppgwave: "bright"},
  stab: { "pluck-chord": "bright", "square-chord": "bright", "bell-chord": "bright", "brass-chord": "warm", "organ-chord": "warm", "string-chord": "warm", orchhit: "dark" },
  guitar: { clean: "bright", power: "dark", muted: "dark", nylon: "warm", acoustic: "warm", jazz: "warm", funk: "bright", twelvestring: "bright" , sitar: "bright", banjo: "bright", mandolin: "bright", ukulele: "warm", slide: "warm", openchord: "bright", resonator: "bright", baritone: "dark"},
  strings: { soul: "warm", orchestral: "warm", staccato: "bright", synth: "bright", pizzicato: "bright", tremolo: "dark", mellotron: "warm" , solina: "warm", cello: "dark", spiccato: "bright", harp: "warm"},
  horn: { brass: "bright", soft: "warm", muted: "dark", sax: "warm", trumpetstab: "bright", section: "bright", clarinet: "warm", frenchhorn: "warm", oboe: "bright" , trombone: "warm", tuba: "dark", flugelhorn: "warm", piccolo: "bright"},
  organ: { drawbar: "warm", gospel: "dark", church: "dark", combo: "bright" , farfisa: "bright", accordion: "warm", harmonium: "warm", m1organ: "bright"},
  vocal: { ooh: "warm", ahh: "warm", ay: "bright", oh: "warm", choir: "warm", vocoder: "bright" },
  kalimba: { kalimba: "warm", musicbox: "bright", steeldrum: "bright", glock: "bright" , hangdrum: "warm", balafon: "warm", kora: "warm"},
  marimba: { marimba: "warm", vibraphone: "bright" , xylophone: "bright", tubularbell: "bright"},
  arp: { arp: "bright", pulse: "warm" },
  autolead: { hard: "bright", moody: "dark" },
  sax: { smooth: "warm", breathy: "dark" , alto: "bright", bari: "dark"},
  woodwind: { flute: "bright", altoflute: "warm", clarinet: "warm", bassclarinet: "dark", oboe: "bright", englishhorn: "warm", bassoon: "dark", sopranosax: "bright", shakuhachi: "warm", bansuri: "warm", duduk: "dark", recorder: "bright" },
  leadguitar: { overdrive: "warm", fuzz: "dark", wah: "bright", sustain: "warm", octave: "bright", cleantone: "bright", harmonics: "bright" },
  talkbox: { roger: "warm", gfunk: "warm", robot: "dark", bright: "bright" },
  fx: { riser: "bright", siren: "dark", impact: "dark" },
};

// Genres whose drum language actually uses ghost notes - a live-kit
// idiom, not something an 808 pattern does.
// Genres built on the 3+3+2 tresillo cell.
// Genres where a filter sweep is a primary arrangement device.
const FILTER_SWEEP_GENRES = new Set(["house", "techno", "dubstep", "dnb", "ukgarage", "synthwave"]);

const DRUMS_SET = new Set(["kick", "snare", "hihat", "openhat", "tom", "perc", "crash", "fx"]);

const TRESILLO_GENRES = new Set(["reggaeton", "afrobeats", "amapiano"]);

const GHOST_GENRES = new Set(["rock", "rnb", "neosoul", "hiphop", "lofi", "dnb", "ukgarage"]);

const FLAVOR_PALETTES = ["warm", "bright", "dark"];

function M(degreeOffset, len) {
  return { type: "mono", degreeOffset, len };
}
function C(degreeOffset, size, len) {
  return { type: "chord", degreeOffset, size, len };
}

// ---- Motif-based melody generation ----
// Grounded in real songwriting practice: a short motif is stated, then
// repeated with small variations (transposition, inversion, truncation) so
// the ear recognizes it as a hook rather than random notes (motivic
// sequence / repetition-with-variation). Notes mostly land on chord tones
// (root/3rd/5th, the "safe" landing notes) with occasional passing tones.

function pickWeighted(pool) {
  const total = pool.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [v, w] of pool) {
    r -= w;
    if (r < 0) return v;
  }
  return pool[0][0];
}

// ---- Note-to-note melodic composition ----
// The previous approach picked 2-3 pitches up front and mechanically
// arc-indexed into them - fine for "the same few notes recur," but it
// never actually reasoned about how one note leads to the next, which is
// most of what separates a considered melodic line from a shuffled bag of
// acceptable pitches. Two of the most robust, well-replicated findings in
// melodic corpus research now drive that note-to-note choice directly:
//
// - Pitch proximity: melodies overwhelmingly move by step: real-melody
//   corpus studies consistently find small intervals dominate note-to-note
//   motion (Huron, "Sweet Anticipation", 2006, ch. 4 - the "pitch proximity"
//   principle, one of the oldest and best-replicated findings in melodic
//   analysis, tracing back to Carl Stumpf and von Hornbostel a century ago).
// - Post-skip reversal: on the rarer occasion a melody does leap, that leap
//   is disproportionately likely to be followed by motion back the other
//   way (Von Hippel & Huron, "Why Do Skips Precede Reversals?", Music
//   Perception, 2000) - exactly what Narmour's implication-realization
//   model predicts a leap "implies" (his gap-fill principle, 1990).
//
// A gentle pull toward an overall rise-then-fall arc shape across the whole
// phrase is layered on top (Meyer, "Emotion and Meaning in Music", 1956) so
// the result has both local coherence (each note relates sensibly to the
// last) and a global shape (the phrase reads as one arc, not a random walk).
function pickNextDegree(prevOffset, lastLeapDirection, candidates, arcTarget, repeatStreak) {
  let best = candidates[0].value;
  let bestScore = -Infinity;
  for (const { value: c, weight } of candidates) {
    const delta = c - prevOffset;
    const dist = Math.abs(delta);
    // Pitch proximity biases toward small steps *statistically* rather
    // than forbidding leaps outright - real melodies are dominated by
    // steps but still leap regularly (roughly a quarter to a third of
    // note-to-note motion in corpus studies); coefficients tuned so
    // random tie-breaking can still let a leap win a meaningful share of
    // the time instead of steps mechanically sweeping every choice.
    let score = -dist * 0.55;
    if (dist === 0) score -= 0.4; // some motion is more interesting than none
    // Repeated notes are a legitimate hook device (a trap 808 line
    // hammering its root is authentic), but past a few repeats a line
    // reads as a drone rather than a phrase - so the penalty *scales*
    // with the running streak instead of being flat, letting short
    // repetitions through while making long drones progressively lose
    // to any candidate that moves.
    if (dist === 0 && repeatStreak >= 2) score -= (repeatStreak - 1) * 1.1;
    if (lastLeapDirection !== 0 && dist > 0) {
      // post-skip reversal: after a leap, favor snapping back the other way
      const dir = delta > 0 ? 1 : -1;
      score += dir === -lastLeapDirection ? 1.5 : -1.5;
    }
    score -= Math.abs(c - arcTarget) * 0.18; // gentle pull toward the phrase's overall arc
    score += (weight || 1) * 0.25; // still honors each genre's authored chord-tone preferences
    score += Math.random() * 1.6; // keeps it from being fully deterministic
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

// Rhythm "feels" give each generation a genuinely different rhythmic
// personality on top of the pitch logic, instead of every melody rendering
// its durations from the same weighted pool in the same way forever:
// - "authored": the genre's own tuned duration pool (most common).
// - "tresillo": durations locked to the 3-3-2 cycle - the single most
//   widespread rhythmic cell in popular music (the Cuban tresillo,
//   backbone of reggaeton's dembow, trap hi-hat phrasing, and countless
//   pop toplines).
// - "offbeat": the phrase starts with a short rest so the line enters
//   after the downbeat - a standard groove-displacement device.
// - "halftime": durations doubled, a sparser line at half the density.
const TRESILLO = [3, 3, 2];

function generateMotif(lengthSteps, params, feel = "authored") {
  const events = [];
  let pos = 0;
  let prevOffset = 0;
  let lastLeapDirection = 0;
  let repeatStreak = 0;
  let tresilloIdx = 0;

  if (feel === "offbeat") {
    const off = Math.random() < 0.5 ? 1 : 2;
    events.push({ offset: 0, duration: off, degreeOffset: null });
    pos = off;
  }

  while (pos < lengthSteps) {
    let dur;
    if (feel === "tresillo") {
      dur = TRESILLO[tresilloIdx % TRESILLO.length];
      tresilloIdx++;
    } else {
      dur = pickWeighted(params.noteLengths);
      if (feel === "halftime") dur = Math.min(dur * 2, 8);
    }
    dur = Math.min(dur, lengthSteps - pos);

    if (Math.random() < params.restProbability) {
      events.push({ offset: pos, duration: dur, degreeOffset: null });
    } else {
      // Chord tones are more likely right on a quarter-note beat (metric
      // accent correlating with consonance is standard tonal-harmony
      // practice - strong beats get the "safe" landing notes, weak beats
      // can carry more passing-tone color).
      const isStrongBeat = pos % 4 === 0;
      const chordToneChance = isStrongBeat ? Math.min(0.95, params.chordToneProbability + 0.15) : params.chordToneProbability;
      const useChordTone = Math.random() < chordToneChance;
      const rawPool = (useChordTone ? params.chordTonePool : params.passingTonePool) || [];
      const candidates = rawPool.map(([value, weight]) => ({ value, weight }));
      if (!candidates.some((c) => c.value === 0)) candidates.push({ value: 0, weight: 0.5 });

      const arcTarget = Math.sin((pos / lengthSteps) * Math.PI) * 3;
      const next = pickNextDegree(prevOffset, lastLeapDirection, candidates, arcTarget, repeatStreak);
      const delta = next - prevOffset;
      repeatStreak = delta === 0 ? repeatStreak + 1 : 0;
      lastLeapDirection = Math.abs(delta) >= 2 ? Math.sign(delta) : 0;
      prevOffset = next;
      events.push({ offset: pos, duration: dur, degreeOffset: next });
    }
    pos += dur;
  }
  return events;
}

function transformMotif(motif, mode) {
  if (mode === "transposeUp") return motif.map((e) => (e.degreeOffset === null ? e : { ...e, degreeOffset: e.degreeOffset + 2 }));
  if (mode === "transposeDown") return motif.map((e) => (e.degreeOffset === null ? e : { ...e, degreeOffset: e.degreeOffset - 2 }));
  // Two of the four original transforms only moved pitch, so a loop's
  // rhythmic surface almost never changed bar to bar (measured 86-100%
  // onset similarity). These two vary the rhythm instead: "thin" drops a
  // note to open up space, "displace" nudges the phrase off its grid
  // position - both standard ways a player varies a repeated figure.
  if (mode === "thin") {
    const sounding = motif.filter((e) => e.degreeOffset !== null);
    if (sounding.length < 3) return motif;
    const victim = sounding[1 + Math.floor(Math.random() * (sounding.length - 2))];
    return motif.map((e) => (e === victim ? { ...e, degreeOffset: null } : e));
  }
  if (mode === "displace") {
    const shift = Math.random() < 0.5 ? 1 : 2;
    return motif.map((e) => ({ ...e, offset: e.offset + shift }));
  }
  if (mode === "invert") {
    const reversed = [...motif].reverse();
    let pos = 0;
    return reversed.map((e) => {
      const ev = { ...e, offset: pos };
      pos += e.duration;
      return ev;
    });
  }
  if (mode === "truncate") return motif.slice(0, Math.max(1, motif.length - 1));
  return motif;
}

function thinRange(arr, start, end, keepProbability) {
  for (let i = start; i < end; i++) {
    if (arr[i] && Math.random() > keepProbability) arr[i] = null;
  }
}

// Real melodies don't sit in the exact same register every time, and a
// call-and-response pair usually contrasts by dropping the "answer" an
// octave (both are standard melody-writing techniques). But rolling that
// octave jitter *independently per instrument* was a real source of "the
// instruments don't sound like they're working together": the bass could
// jump UP an octave into the chords' territory (an 808 an octave high is
// exactly the thin, goofy bass that got reported), and two melodic lines
// could land in the same register and fight. planRegisterJitters instead
// assigns registers the way an arranger voices an ensemble: bass never
// leaves the bass lane, the first melodic voice sits at-or-above its home
// register, and every additional voice sits at-or-below its own - so
// voices spread apart instead of piling up.
function planRegisterJitters(monoInstruments) {
  const plan = {};
  let melodicIdx = 0;
  for (const inst of monoInstruments) {
    if (inst === "bass") {
      plan[inst] = 0;
      continue;
    }
    // Jitter direction is home-register aware. Instruments that already
    // live high (lead at 21, arp at 18) must never be pushed higher -
    // that was sending leads to ~2.5-2.8kHz, well above where any real
    // hook sits - while low-homed voices must not sink toward the bass.
    const home = REGISTER[inst] || 14;
    if (home >= 18) plan[inst] = pickWeighted([[0, 4], [-7, 1]]);
    else if (home <= 7) plan[inst] = pickWeighted([[0, 4], [7, 1]]);
    else plan[inst] = melodicIdx === 0 ? pickWeighted([[0, 4], [7, 1]]) : pickWeighted([[0, 4], [-7, 1]]);
    melodicIdx++;
  }
  return plan;
}

// Real hooks are singable because they stay inside roughly one octave -
// corpus-wide, vocal and instrumental hooks span about 12-19 semitones.
// Independently reasonable systems here (register jitter, the answer-
// phrase octave drop, motif transposition) stacked multiplicatively and
// scattered melodies across 26-38 semitones, so no phrase read as a
// single idea. Folding by whole octaves keeps each note's scale identity
// (and therefore the harmony) exactly intact while pulling outliers back
// into a singable window.
function foldIntoSpan(offset, halfSpan) {
  let o = offset;
  while (o > halfSpan) o -= 7;
  while (o < -halfSpan) o += 7;
  return o;
}

// ---- Chords on every instrument, not just the "chord" instruments ----
// The engine used to split instruments into two fixed camps: chordal
// parts that always played block chords, and melodic parts that could
// only ever play one note at a time. Real arrangements don't work that
// way - a rhythm guitar strums full triads, a lead is harmonised in
// 3rds and 6ths, a sax section plays block harmony, a mallet part plays
// dyads. Any melodic line can now carry a stack of scale-degree offsets
// alongside its root note, so the same motif logic produces either a
// single line or a chord depending on what the part calls for.
//
// Harmony is applied to *sustained/structural* notes rather than to
// every passing 16th, which is how real players voice it: you strum the
// chord on the strong beat and single-note the runs in between.
const HARMONY_SHAPES = {
  triad: [0, 2, 4],
  seventh: [0, 2, 4, 6],
  third: [0, 2],
  sixth: [0, -3],
  octave: [0, 7],
  fifth: [0, 4],
};

function harmonyForNote(cfg, stepInBar, noteLen) {
  if (!cfg) return null;
  const shape = HARMONY_SHAPES[cfg.shape];
  if (!shape) return null;
  // Strong beats and longer notes get the full voicing; short passing
  // notes stay single so runs don't turn into chord soup.
  const strong = stepInBar % 4 === 0;
  const longEnough = noteLen >= (cfg.minLen || 2);
  const chance = (cfg.probability || 0) * (strong ? 1 : 0.35) * (longEnough ? 1 : 0.3);
  return Math.random() < chance ? shape : null;
}

function generateMonoMelody(register, structure, barRootDegrees, rawParams, totalSteps, registerJitter = 0, isBass = false) {
  const effectiveRegister = register + registerJitter;
  // Complexity shapes the LINE too, not just the drums: a simple setting
  // rests more, repeats more and stays on chord tones; a complex one
  // moves more, varies its motif more, and uses more passing tones. The
  // bass is deliberately left alone - a bassline that will not hold still
  // stops being a foundation, at any complexity.
  const cx = complexityProfile();
  const params = isBass ? rawParams : {
    ...rawParams,
    restProbability: Math.max(0.05, Math.min(0.85, rawParams.restProbability + cx.restBias)),
    variationProbability: Math.max(0, Math.min(0.9, rawParams.variationProbability + cx.variationBoost)),
    chordToneProbability: Math.max(0.35, Math.min(0.98, rawParams.chordToneProbability - cx.passingToneBoost)),
  };

  const arr = new Array(totalSteps).fill(null);
  const motifLen = params.motifBars * STEPS_PER_BAR;
  // Each generation rolls a rhythmic personality for this instrument's
  // line (see the feel definitions above generateMotif) so two beats in
  // the same genre can differ in rhythmic phrasing, not just in pitches.
  const rhythmFeel = pickWeighted([["authored", 4], ["tresillo", 1.3], ["offbeat", 1.3], ["halftime", 0.9]]);
  const motif = generateMotif(motifLen, params, rhythmFeel);
  const totalChunks = Math.ceil(totalSteps / motifLen);
  let chunkStart = 0;
  let chunkIndex = 0;

  while (chunkStart < totalSteps) {
    let motifToUse = motif;
    if (chunkIndex > 0 && Math.random() < params.variationProbability) {
      const modes = ["transposeUp", "transposeDown", "invert", "truncate", "thin", "displace"];
      motifToUse = transformMotif(motif, modes[Math.floor(Math.random() * modes.length)]);
    }
    // Antecedent-consequent phrasing (standard "period" form in tonal
    // harmony - see e.g. Kostka & Payne, "Tonal Harmony"): a "question"
    // phrase conventionally lands on an open, unresolved half-cadence (the
    // 5th scale degree) while its "answer" resolves all the way home to
    // the tonic - the harmonic version of the call-and-response pairing
    // below, not just a pitch-contour echo.
    if (chunkIndex % 2 === 0 && chunkIndex + 1 < totalChunks) {
      for (let i = motifToUse.length - 1; i >= 0; i--) {
        if (motifToUse[i].degreeOffset !== null) {
          motifToUse = motifToUse.map((e, idx) => (idx === i ? { ...e, degreeOffset: 4 } : e));
          break;
        }
      }
    }
    // Question-and-answer phrasing: every other repeat is the "answer,"
    // sometimes dropped an octave for contrast, and always resolves its
    // final note back to the tonic - the classic call-response pairing
    // that makes a phrase feel finished rather than just looping.
    // The octave drop is a real call/response device, but at 50% it was
    // one of three systems all widening the range at once - kept as a
    // deliberate occasional contrast instead of a coin flip.
    let phraseOctave = 0;
    if (chunkIndex % 2 === 1) {
      if (Math.random() < 0.28) phraseOctave = -7;
      for (let i = motifToUse.length - 1; i >= 0; i--) {
        if (motifToUse[i].degreeOffset !== null) {
          motifToUse = motifToUse.map((e, idx) => (idx === i ? { ...e, degreeOffset: 0 } : e));
          break;
        }
      }
    }
    // A bass line can roam a little wider than a hook and still read as
    // one part; a melody is held to about an octave and a bit.
    const halfSpan = isBass ? 5 : 4;
    for (const ev of motifToUse) {
      if (ev.degreeOffset === null) continue;
      const stepPos = chunkStart + ev.offset;
      if (stepPos >= totalSteps) continue;
      const barIdx = Math.floor(stepPos / STEPS_PER_BAR);
      const barRoot = barRootDegrees[barIdx];
      const dur = Math.min(ev.duration, totalSteps - stepPos);
      const folded = foldIntoSpan(ev.degreeOffset, halfSpan);
      const note = { degree: barRoot + effectiveRegister + phraseOctave + folded, len: dur };
      const shape = harmonyForNote(params.harmony, stepPos % STEPS_PER_BAR, dur);
      if (shape) note.harmony = shape;
      arr[stepPos] = note;
    }
    chunkStart += motifLen;
    chunkIndex++;
  }

  // A real intro layers in across the bar rather than being almost
  // silent throughout - notes get progressively more likely to survive
  // as the bar approaches the downbeat of bar 2.
  if (structure[0] === "intro") {
    for (let i = 0; i < STEPS_PER_BAR; i++) {
      const keep = 0.2 + 0.55 * (i / (STEPS_PER_BAR - 1));
      if (arr[i] && Math.random() > keep) arr[i] = null;
    }
  }
  return arr;
}

// A chorus needs one strong, instantly-recognizable hook rather than the
// verse's more loosely-evolving motif - real songwriting almost always
// repeats the *exact same* short idea every time the chorus comes back
// (that repetition is most of what makes a hook a hook), so this generates
// one fixed motif per instrument and stamps it into every chorus bar
// verbatim - transposed to each bar's chord, never varied or transformed -
// instead of letting the verse's own motif-with-variation logic keep
// evolving straight through the chorus sections too. Only runs in full-song
// mode, since a short loop has no chorus/verse distinction to make.
function applyChorusHook(melody, inst, style, barMetas, barRootDegrees) {
  const params = style.melody[inst];
  if (!params || !barMetas.some((b) => b.type === "chorus")) return;

  const register = REGISTER[inst];
  // Same ensemble discipline as the verse material: the bass hook stays in
  // the bass lane, everything else can sit at or above home register.
  const registerJitter = inst === "bass" ? 0 : pickWeighted([[0, 3], [7, 1]]);
  const effectiveRegister = register + registerJitter;
  const hookParams = {
    ...params,
    motifBars: 1,
    restProbability: Math.max(0.1, params.restProbability * 0.75),
    chordToneProbability: Math.min(0.95, params.chordToneProbability + 0.15),
  };
  const hookLen = hookParams.motifBars * STEPS_PER_BAR;
  const hook = generateMotif(hookLen, hookParams);
  const hookByOffset = new Map(hook.filter((e) => e.degreeOffset !== null).map((e) => [e.offset, e]));

  for (let i = 0; i < barMetas.length; i++) {
    if (barMetas[i].type !== "chorus") continue;
    const barStart = i * STEPS_PER_BAR;
    const sectionBarPos = barMetas[i].pos;
    const barRoot = barRootDegrees[i];
    for (let s = 0; s < STEPS_PER_BAR; s++) {
      const globalStep = barStart + s;
      const hookStep = (sectionBarPos * STEPS_PER_BAR + s) % hookLen;
      const ev = hookByOffset.get(hookStep);
      if (!ev) {
        melody[globalStep] = null;
        continue;
      }
      const dur = Math.min(ev.duration, hookLen - hookStep, melody.length - globalStep);
      const folded = foldIntoSpan(ev.degreeOffset, inst === "bass" ? 5 : 4);
      const hookNote = { degree: barRoot + effectiveRegister + folded, len: dur };
      const hookShape = harmonyForNote(params.harmony, globalStep % STEPS_PER_BAR, dur);
      if (hookShape) hookNote.harmony = hookShape;
      melody[globalStep] = hookNote;
    }
  }
}

// Two independently-generated mono melodies can land dense onsets on the
// exact same step purely by chance, which reads as cluttered rather than
// arranged - real call-and-response arrangement leaves room for each
// voice rather than having both talk at once. This only ever *removes* a
// colliding note (never adds one or changes a pitch), and only when the
// instrument being thinned has another note within a couple of steps
// either side, so a genuinely sparse part never gets silenced outright.
function declutterMonoCollisions(instruments, monoInstruments) {
  if (!monoInstruments || monoInstruments.length < 2) return;
  const primary = instruments[monoInstruments[0]];
  const secondary = instruments[monoInstruments[1]];
  if (!primary || !secondary) return;
  for (let i = 0; i < secondary.length; i++) {
    if (!secondary[i] || !primary[i]) continue;
    const hasNearby = [-2, -1, 1, 2].some((d) => secondary[i + d]);
    if (hasNearby && Math.random() < 0.6) secondary[i] = null;
  }
}

const STYLES = {
  hiphop: {
    name: "Hip-Hop",
    description: "Boom bap with a soulful, sample-style melody and moody minor chords.",
    tempo: { min: 82, max: 96, default: 90 },
    swing: 0.15,
    humanize: { timingMs: 6, velocityJitter: 0.18 },
    pockets: { snare: 8, hihat: 5 },
    key: "C2",
    scale: "minor",
    progressions: [[0,3,4,3],[0,5,3,4],[0,6,3,4],[0,3,6,2],[0,5,2,6],[0,3,6,5],[0,6,5,6]],
    // The E-mu SP-1200's bit-crushed kick/snare - the actual sampler
    // golden-era boom bap was built on - now the default for the genre
    // its research writeup was literally named after.
    defaultFlavors: { kick: "sp1200", snare: "sp1200", hihat: "dark", perc: "shaker", bass: "warm", piano: "electric", lead: "flute", strings: "soul", stab: "pluck-chord", organ: "gospel", horn: "muted" },
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "perc"],
      main: {
        core: {
          kick:    [1,0,0,0, 0,0,1,0, 0,0,0,1, 0,0,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          perc:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,1,0, 0,1,0,0, 1,0,0,0, 0,1,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
          openhat: [0,0,0,1, 0,0,0,0, 0,0,0,1, 0,0,0,0],
          perc:    [0,1,0,0, 0,0,1,0, 0,1,0,0, 0,0,1,0],
        },
        optionalProbability: 0.35,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,0,1, 0,0,0,0, 1,0,1,0, 0,0,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          perc:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,1,0, 0,1,0,0, 0,0,0,1, 0,1,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
          openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
          perc:    [0,1,0,0, 0,0,1,0, 0,1,0,0, 0,0,1,0],
        },
        optionalProbability: 0.3,
      }],
    },
    melodic: { monoInstruments: ["bass", "lead"], chordInstruments: ["piano", "strings", "organ", "stab", "horn"] },
    melody: {
      bass: { motifBars: 2, noteLengths: [[4,3],[6,2],[8,1]], restProbability: 0.25, chordToneProbability: 0.85, chordTonePool: [[0,5],[4,2],[7,1]], passingTonePool: [[-1,1],[1,1],[3,1]], variationProbability: 0.3 },
      lead: { motifBars: 2, noteLengths: [[4,2],[6,2],[8,1],[3,1]], restProbability: 0.4, chordToneProbability: 0.65, chordTonePool: [[0,2],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1],[-1,1],[6,1]], variationProbability: 0.5 , harmony: { shape: "third", probability: 0.3, minLen: 3 } },
    },
    chords: {
      piano: {
        core:     [C(0,4,6),0,0,0, 0,0,0,0, C(0,4,6),0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,C(0,3,2),0],
        optionalProbability: 0.25,
      },
      strings: {
        core:     [C(0,3,8),0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, C(2,3,4),0,0,0],
        optionalProbability: 0.25,
      },
      organ: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, C(0,3,4),0,0,0, 0,0,0,0],
        optionalProbability: 0.2,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,C(2,3,1), 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.2,
      },
      // Classic boom-bap sample-horn stab (think DJ Premier / Wu-Tang era
      // chopped soul horns) - a short muted-trumpet accent placed on the
      // "and" of beat 4, sparse enough to stay a garnish, not a lead voice.
      horn: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,C(0,3,1), 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.25,
      },
    },
  },

  trap: {
    name: "Trap",
    description: "Sparse hard kick, sliding 808s, rapid hi-hat rolls, a hypnotic bell hook.",
    tempo: { min: 132, max: 150, default: 140 },
    swing: 0.04,
    humanize: { timingMs: 2, velocityJitter: 0.12 },
    key: "C2",
    scale: "minor",
    progressions: [[0,5],[0,3],[0,4],[0,5,3,4],[0,6,5,6],[0,5,2,6]],
    // "true808" - the sliding, warm-saturated modern-rap 808 (see
    // playBass) - is the bass sound today's trap actually runs on.
    defaultFlavors: { kick: "808", snare: "clap", hihat: "bright", bass: "true808", lead: "bell", stab: "bell-chord", vocal: "ooh", fx: "riser" , woodwind: "flute"},
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "crash", "fx"],
      main: {
        core: {
          kick:    [1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          hihat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
        },
        optional: {
          kick:    [0,0,1,0, 0,1,0,0, 0,0,0,1, 1,0,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
          openhat: [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0],
        },
        optionalProbability: 0.4,
        hihatRollSteps: [7, 15],
        hihatRollProbability: 0.45,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,0,0, 0,0,0,1, 0,0,1,0, 0,0,1,0],
          snare:   [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          hihat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,1,0],
        },
        optional: {
          kick:    [0,1,0,0, 0,0,1,0, 0,0,0,0, 0,1,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
          openhat: [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0],
        },
        optionalProbability: 0.4,
        hihatRollSteps: [3, 11],
        hihatRollProbability: 0.45,
      }],
    },
    melodic: { monoInstruments: ["bass", "lead", "woodwind"], chordInstruments: ["stab", "vocal"] },
    melody: {
      woodwind: { motifBars: 2, noteLengths: [[4,3],[6,3],[8,2],[3,1]], restProbability: 0.52, chordToneProbability: 0.78, chordTonePool: [[0,2],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1],[-1,1],[5,1]], variationProbability: 0.35 },
      bass: { motifBars: 1, noteLengths: [[3,2],[4,3],[2,1]], restProbability: 0.3, chordToneProbability: 0.9, chordTonePool: [[0,6],[4,1]], passingTonePool: [[-2,1],[3,1]], variationProbability: 0.3 },
      lead: { motifBars: 1, noteLengths: [[2,3],[3,2],[4,1]], restProbability: 0.55, chordToneProbability: 0.6, chordTonePool: [[0,2],[2,2],[4,2]], passingTonePool: [[-1,1],[1,1],[6,1]], variationProbability: 0.4 , harmony: { shape: "fifth", probability: 0.3, minLen: 2 } },
    },
    chords: {
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,C(0,3,1),0, 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.32,
      },
      vocal: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,C(0,1,1),0],
        optionalProbability: 0.32,
      },
    },
  },

  house: {
    name: "House",
    description: "Four-on-the-floor kick, offbeat open hats, a looping arp riff and piano stabs.",
    tempo: { min: 122, max: 128, default: 124 },
    swing: 0.03,
    humanize: { timingMs: 2, velocityJitter: 0.08 },
    key: "C2",
    scale: "dorian",
    progressions: [[0,3,4,0],[0,3],[0,6,3,0],[0,4,3,0],[0,3,6,3],[0,1,3,0]],
    // A Moog-style filter-swept bass instead of a flat, static-cutoff
    // synth bass - deep/classic house basslines lean on exactly this kind
    // of analog ladder-filter movement for their warmth.
    defaultFlavors: { kick: "909", snare: "909snare", hihat: "909", perc: "conga", bass: "moog", piano: "pluck", pad: "ensemble", lead: "saw", stab: "square-chord", vocal: "ahh", fx: "riser" },
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "perc", "crash", "fx"],
      main: {
        core: {
          kick:    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          openhat: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
          perc:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          hihat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          perc:    [0,0,1,0, 0,1,0,0, 0,0,1,0, 0,1,0,0],
        },
        optionalProbability: 0.3,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,1,0, 1,0,0,0],
          hihat:   [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
          openhat: [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          perc:    [0,0,0,1, 0,0,0,1, 0,0,0,1, 0,0,0,1],
        },
        optional: {
          hihat:   [1,0,0,1, 1,0,0,1, 1,0,0,1, 1,0,0,1],
          perc:    [1,0,1,0, 0,1,0,0, 1,0,1,0, 0,1,0,0],
        },
        optionalProbability: 0.3,
      }],
    },
    melodic: { monoInstruments: ["bass", "lead"], chordInstruments: ["piano", "pad", "stab", "vocal"] },
    melody: {
      bass: { motifBars: 1, noteLengths: [[2,4],[4,2]], restProbability: 0.15, chordToneProbability: 0.85, chordTonePool: [[0,4],[4,2],[7,1]], passingTonePool: [[2,1],[-1,1]], variationProbability: 0.15 , harmony: { shape: "octave", probability: 0.22, minLen: 2 } },
      lead: { motifBars: 1, noteLengths: [[2,5],[1,2]], restProbability: 0.1, chordToneProbability: 0.9, chordTonePool: [[0,3],[2,2],[4,2],[7,2]], passingTonePool: [[1,1],[6,1]], variationProbability: 0.2 , harmony: { shape: "triad", probability: 0.35, minLen: 2 } },
    },
    chords: {
      piano: {
        core:     [0,0,C(0,4,1),0, 0,0,C(0,4,1),0, 0,0,C(0,4,1),0, 0,0,C(0,4,1),0],
        optional: [0,0,0,0, 0,0,0,C(0,3,1), 0,0,0,0, 0,0,0,C(0,3,1)],
        optionalProbability: 0.3,
      },
      pad: {
        core:     [C(0,4,16),0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: new Array(STEPS_PER_BAR).fill(0),
        optionalProbability: 0,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,C(0,3,1)],
        optionalProbability: 0.3,
      },
      vocal: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,C(0,1,1), 0,0,0,0, 0,0,0,C(0,1,1), 0,0,0,0],
        optionalProbability: 0.32,
      },
    },
  },

  rock: {
    name: "Rock",
    description: "Backbeat snare, driving eighths, a real guitar riff, crash-out fills.",
    tempo: { min: 100, max: 130, default: 116 },
    swing: 0,
    humanize: { timingMs: 12, velocityJitter: 0.25 },
    key: "E2",
    scale: "major",
    progressions: [[0,4,5,3],[0,3,4,0],[5,3,0,4],[0,5,3,4],[0,3,4,3],[0,4,3,4],[0,5,2,3]],
    defaultFlavors: { kick: "acoustic", snare: "acoustic", hihat: "bright", bass: "pluck", guitar: "power", perc: "timpani", tom: "acoustic" , leadguitar: "overdrive"},
    drums: {
      // "perc" is a sparse orchestral timpani hit, not a percussion groove -
      // the same big low arena-rock boom bands like Queen/Muse reach for
      // under a huge downbeat. It's genuinely new sonic ground for this
      // genre's kit rather than a re-skinned existing sound.
      instruments: ["kick", "snare", "hihat", "tom", "perc", "crash"],
      main: {
        core: {
          kick:  [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,1,0],
          snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          tom:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          perc:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:  [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,1],
          snare: [0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
          hihat: [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          perc:  [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optionalProbability: 0.3,
      },
      // The 2-and-4 backbeat is close to inviolable in rock, so both
      // grooves keep it; the variation lives in the kick pattern, the
      // straight-16th hats, and optional ghost-note snares instead.
      mainVariants: [{
        core: {
          kick:  [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0],
          snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
          tom:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          perc:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:  [0,0,1,0, 0,1,0,0, 0,0,1,0, 0,0,0,1],
          snare: [0,0,0,0, 0,0,0,1, 0,0,1,0, 0,0,0,0],
          perc:  [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
        },
        optionalProbability: 0.3,
      }],
    },
    melodic: { monoInstruments: ["bass", "guitar", "leadguitar"], chordInstruments: [] },
    melody: {
      leadguitar: { motifBars: 2, noteLengths: [[2,3],[3,3],[4,2],[6,1]], restProbability: 0.42, chordToneProbability: 0.7, chordTonePool: [[0,3],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1],[-1,1],[6,1]], variationProbability: 0.4 },
      bass: { motifBars: 2, noteLengths: [[2,4],[4,2]], restProbability: 0.2, chordToneProbability: 0.9, chordTonePool: [[0,5],[4,2],[7,1]], passingTonePool: [[2,1],[-1,1]], variationProbability: 0.3 },
      guitar: { motifBars: 2, noteLengths: [[2,4],[4,2],[1,2]], restProbability: 0.25, chordToneProbability: 0.75, chordTonePool: [[0,4],[4,3],[7,2]], passingTonePool: [[1,1],[3,1],[-1,1],[6,1]], variationProbability: 0.4 , harmony: { shape: "triad", probability: 0.85, minLen: 1 } },
    },
    chords: {},
  },

  reggaeton: {
    name: "Reggaeton",
    description: "Dembow tresillo kick pattern, rimshot answers, a synth hook and horn stabs.",
    tempo: { min: 90, max: 100, default: 95 },
    swing: 0.05,
    humanize: { timingMs: 5, velocityJitter: 0.15 },
    key: "A1",
    scale: "minor",
    progressions: [[0,3],[0,4],[0,5],[0,3,4,0],[0,5,2,6],[0,6,5,4]],
    // "pluck" over a plain saw for the lead hook - real reggaeton synth
    // hooks are almost always short and staccato/plucky (they have to cut
    // through the dembow pattern's own busy syncopation), not a sustained
    // saw tone.
    defaultFlavors: { kick: "snappy", snare: "rimshot", hihat: "bright", perc: "conga", bass: "warm", lead: "pluck", horn: "brass", stab: "pluck-chord", vocal: "ooh", tom: "acoustic" },
    drums: {
      instruments: ["kick", "snare", "hihat", "tom", "perc", "crash"],
      main: {
        core: {
          kick:  [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0],
          snare: [0,0,1,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          hihat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
          perc:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0],
          snare: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,1,0],
          perc:  [0,1,0,1, 0,1,0,0, 0,1,0,1, 0,1,0,0],
        },
        optionalProbability: 0.35,
      },
      mainVariants: [{
        core: {
          kick:  [1,0,0,0, 0,0,0,0, 1,0,0,1, 0,0,0,0],
          snare: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,0,0],
          hihat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
          perc:  [0,0,0,1, 0,1,0,0, 0,0,0,1, 0,1,0,0],
        },
        optional: {
          kick:  [0,0,0,0, 1,0,0,0, 0,0,0,0, 0,0,1,0],
          snare: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,1,0],
          perc:  [0,1,0,0, 0,0,0,1, 0,1,0,0, 0,0,0,1],
        },
        optionalProbability: 0.35,
      }],
    },
    melodic: { monoInstruments: ["bass", "lead"], chordInstruments: ["horn", "stab", "vocal"] },
    melody: {
      bass: { motifBars: 1, noteLengths: [[2,3],[3,2],[4,1]], restProbability: 0.3, chordToneProbability: 0.85, chordTonePool: [[0,5],[4,2]], passingTonePool: [[-2,1],[4,1]], variationProbability: 0.25 },
      lead: { motifBars: 1, noteLengths: [[2,3],[3,2]], restProbability: 0.4, chordToneProbability: 0.65, chordTonePool: [[0,2],[2,2],[4,2]], passingTonePool: [[1,1],[-1,1]], variationProbability: 0.35 , harmony: { shape: "third", probability: 0.3, minLen: 2 } },
    },
    chords: {
      horn: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,C(0,3,1),0, 0,0,0,C(2,3,1), 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.3,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,C(0,3,1), 0,0,0,0, 0,0,0,C(2,3,1), 0,0,0,0],
        optionalProbability: 0.3,
      },
      vocal: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,C(0,1,1),0],
        optionalProbability: 0.2,
      },
    },
  },

  lofi: {
    name: "Lo-Fi Chill",
    description: "Softened boom bap, jazzy extended chords, a gentle wandering melody, vinyl crackle.",
    tempo: { min: 68, max: 84, default: 76 },
    swing: 0.18,
    humanize: { timingMs: 10, velocityJitter: 0.2 },
    pockets: { snare: 12, hihat: 8, bass: -2 },
    key: "D2",
    scale: "dorian",
    progressions: [[0,3,4,0],[0,2,3,0],[0,4,3,0],[0,3],[0,1,4,0],[3,2,1,0]],
    ambience: "vinyl",
    // Mellotron strings for the default kit - a tape-warbled, band-limited
    // string machine is about as on-brand as lo-fi texture gets, far more
    // so than a clean "soul" string patch.
    defaultFlavors: { kick: "lofi", snare: "fat", hihat: "vinyl", perc: "shaker", bass: "warm", piano: "electric", pad: "airy", lead: "flute", strings: "mellotron", stab: "pluck-chord", marimba: "marimba", horn: "clarinet" , woodwind: "flute"},
    drums: {
      instruments: ["kick", "snare", "hihat", "perc"],
      main: {
        core: {
          kick:  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat: [1,0,1,0, 1,0,0,1, 1,0,1,0, 1,0,0,0],
          perc:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:  [0,0,1,0, 0,0,1,0, 0,0,0,0, 0,0,1,0],
          hihat: [0,1,0,1, 0,1,0,0, 0,1,0,1, 0,1,0,1],
          snare: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
          perc:  [0,0,1,0, 0,0,0,1, 0,0,1,0, 0,0,0,0],
        },
        optionalProbability: 0.25,
      },
      mainVariants: [{
        core: {
          kick:  [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0],
          snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat: [1,0,0,1, 0,1,0,0, 1,0,0,1, 0,1,0,0],
          perc:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:  [0,0,1,0, 0,0,0,1, 0,0,1,0, 0,0,0,0],
          hihat: [0,1,0,0, 1,0,1,0, 0,1,0,0, 1,0,1,0],
          snare: [0,0,0,0, 0,0,0,0, 0,0,0,1, 0,0,0,0],
          perc:  [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,1],
        },
        optionalProbability: 0.28,
      }],
    },
    melodic: { monoInstruments: ["bass", "lead", "marimba", "woodwind"], chordInstruments: ["piano", "pad", "strings", "stab", "horn"] },
    melody: {
      woodwind: { motifBars: 2, noteLengths: [[4,3],[6,3],[8,2],[3,1]], restProbability: 0.52, chordToneProbability: 0.78, chordTonePool: [[0,2],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1],[-1,1],[5,1]], variationProbability: 0.35 },
      bass: { motifBars: 2, noteLengths: [[4,3],[6,2],[8,1]], restProbability: 0.35, chordToneProbability: 0.8, chordTonePool: [[0,5],[4,2],[7,1]], passingTonePool: [[2,1],[-1,1]], variationProbability: 0.35 },
      lead: { motifBars: 2, noteLengths: [[4,2],[6,2],[8,2],[3,1]], restProbability: 0.5, chordToneProbability: 0.7, chordTonePool: [[0,2],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1],[-2,1]], variationProbability: 0.45 , harmony: { shape: "third", probability: 0.35, minLen: 3 } },
      marimba: { motifBars: 2, noteLengths: [[4,2],[6,2],[8,1]], restProbability: 0.62, chordToneProbability: 0.75, chordTonePool: [[0,3],[4,2],[7,1]], passingTonePool: [[2,1],[-2,1]], variationProbability: 0.3 , harmony: { shape: "third", probability: 0.4, minLen: 2 } },
    },
    chords: {
      piano: {
        core:     [C(0,4,7),0,0,0, 0,0,0,0, 0,0,C(2,3,4),0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,C(0,3,1), 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.2,
      },
      pad: {
        core:     [C(0,4,16),0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: new Array(STEPS_PER_BAR).fill(0),
        optionalProbability: 0,
      },
      strings: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,C(0,3,4),0, 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.2,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,C(0,3,1),0],
        optionalProbability: 0.15,
      },
      // A mellow woodwind color for the jazz-cafe side of lo-fi - long,
      // soft-landing legato notes rather than stabs, since a clarinet
      // doesn't punch the way a horn section or synth stab does.
      horn: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,C(0,3,2),0, 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.22,
      },
    },
  },

  drill: {
    name: "Drill",
    description: "Sparse, spacious kick, snare locked on beat 3, sliding 808, a single moody piano line.",
    tempo: { min: 138, max: 145, default: 141 },
    swing: 0.03,
    humanize: { timingMs: 2, velocityJitter: 0.12 },
    key: "C2",
    scale: "phrygian",
    progressions: [[0,3],[0,1,0],[0,1,3,0],[0,3,1,0],[0,6,5,4],[0,1,5,4]],
    defaultFlavors: { kick: "808", snare: "trapsnap", hihat: "dark", bass: "drillslide", piano: "electric", stab: "pluck-chord" , woodwind: "duduk"},
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "crash"],
      main: {
        core: {
          kick:    [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          hihat:   [1,1,0,1, 1,0,1,1, 1,0,1,1, 1,1,0,1],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,1],
          openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,0],
        },
        optionalProbability: 0.3,
        hihatRollSteps: [5, 13],
        hihatRollProbability: 0.4,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,1,0],
          snare:   [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          hihat:   [1,1,0,1, 0,1,1,0, 1,0,1,1, 0,1,1,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,1, 0,0,0,0],
        },
        optionalProbability: 0.3,
        hihatRollSteps: [3, 9],
        hihatRollProbability: 0.4,
      }],
    },
    melodic: { monoInstruments: ["bass", "woodwind"], chordInstruments: ["piano", "stab"] },
    melody: {
      woodwind: { motifBars: 2, noteLengths: [[4,3],[6,3],[8,2],[3,1]], restProbability: 0.52, chordToneProbability: 0.78, chordTonePool: [[0,2],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1],[-1,1],[5,1]], variationProbability: 0.35 },
      bass: { motifBars: 1, noteLengths: [[3,2],[4,3],[6,1]], restProbability: 0.35, chordToneProbability: 0.85, chordTonePool: [[0,5],[4,2]], passingTonePool: [[-2,1],[3,1]], variationProbability: 0.3 },
    },
    chords: {
      piano: {
        core:     [C(0,3,6),0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,C(0,3,2),0],
        optionalProbability: 0.2,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,C(0,3,1),0, 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.28,
      },
    },
  },

  afrobeats: {
    name: "Afrobeats",
    description: "Syncopated kick, continuous shakers, a log-drum bass and a highlife guitar hook.",
    tempo: { min: 100, max: 112, default: 106 },
    swing: 0.08,
    humanize: { timingMs: 5, velocityJitter: 0.15 },
    key: "C2",
    scale: "major",
    progressions: [[0,3,4,0],[0,4,5,3],[0,5,3,4],[0,1,3,4],[0,4,5,4],[3,4,0,0]],
    defaultFlavors: { kick: "acoustic", snare: "clap", hihat: "bright", perc: "shaker", bass: "logdrum", guitar: "nylon", pad: "warm", stab: "pluck-chord", organ: "drawbar", marimba: "marimba", horn: "brass" , woodwind: "bansuri"},
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "perc"],
      main: {
        core: {
          kick:    [1,0,0,1, 0,0,1,0, 0,1,0,0, 1,0,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          perc:    [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
        },
        optional: {
          hihat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
          perc:    [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
        },
        optionalProbability: 0.3,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,1,0, 0,0,1,0, 1,0,0,1, 0,0,1,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          perc:    [1,0,1,1, 0,1,1,0, 1,0,1,1, 0,1,1,0],
        },
        optional: {
          hihat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          openhat: [0,0,0,1, 0,0,0,0, 0,0,0,1, 0,0,0,0],
          perc:    [0,1,0,0, 1,0,0,1, 0,1,0,0, 1,0,0,1],
        },
        optionalProbability: 0.3,
      }],
    },
    melodic: { monoInstruments: ["bass", "guitar", "marimba", "woodwind"], chordInstruments: ["pad", "organ", "stab", "horn"] },
    melody: {
      woodwind: { motifBars: 2, noteLengths: [[4,3],[6,3],[8,2],[3,1]], restProbability: 0.52, chordToneProbability: 0.78, chordTonePool: [[0,2],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1],[-1,1],[5,1]], variationProbability: 0.35 },
      bass: { motifBars: 1, noteLengths: [[4,3],[3,2],[6,1]], restProbability: 0.25, chordToneProbability: 0.85, chordTonePool: [[0,5],[4,2],[7,1]], passingTonePool: [[2,1],[-1,1]], variationProbability: 0.25 },
      guitar: { motifBars: 2, noteLengths: [[2,4],[1,3],[4,1]], restProbability: 0.3, chordToneProbability: 0.7, chordTonePool: [[0,3],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1],[6,1]], variationProbability: 0.4 , harmony: { shape: "third", probability: 0.3, minLen: 2 } },
      marimba: { motifBars: 1, noteLengths: [[1,3],[2,3],[3,1]], restProbability: 0.4, chordToneProbability: 0.8, chordTonePool: [[0,3],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[-1,1]], variationProbability: 0.3 , harmony: { shape: "third", probability: 0.3, minLen: 2 } },
    },
    chords: {
      pad: {
        core:     [C(0,4,16),0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: new Array(STEPS_PER_BAR).fill(0),
        optionalProbability: 0,
      },
      organ: {
        core:     [C(0,3,8),0,0,0, 0,0,0,0, C(0,3,8),0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.15,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,C(0,3,1), 0,0,0,0],
        optionalProbability: 0.3,
      },
      // Highlife/afrobeats horn stabs - short punctuating brass hits on
      // the offbeats, the same call that answers the guitar hook in a lot
      // of real Afrobeats and highlife records.
      horn: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,C(0,3,1), 0,0,0,0, 0,0,0,C(2,3,1), 0,0,0,0],
        optionalProbability: 0.3,
      },
    },
  },

  dubstep: {
    name: "Dubstep",
    description: "Half-time drums (kick on 1, snare on 3), a growling LFO wobble bass.",
    tempo: { min: 138, max: 142, default: 140 },
    swing: 0.02,
    humanize: { timingMs: 2, velocityJitter: 0.1 },
    key: "E1",
    scale: "minor",
    progressions: [[0,4],[0,3],[0,5],[0,6,3,4],[0,6,5,6],[0,5,6,0]],
    defaultFlavors: { kick: "gritty", snare: "fat", hihat: "metallic", bass: "wobble", stab: "square-chord", vocal: "ahh", fx: "impact" , lead: "hoover"},
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "crash", "fx"],
      main: {
        core: {
          kick:    [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          hihat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,0,0, 0,0,0,1, 0,0,1,0, 0,0,0,0],
          hihat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
        },
        optionalProbability: 0.3,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          hihat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,1,0],
          hihat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,0],
        },
        optionalProbability: 0.3,
      }],
    },
    melodic: { monoInstruments: ["bass", "lead"], chordInstruments: ["stab", "vocal"] },
    melody: {
      lead: { motifBars: 2, noteLengths: [[2,3],[4,3],[1,2]], restProbability: 0.45, chordToneProbability: 0.8, chordTonePool: [[0,3],[4,2],[2,2],[7,1]], passingTonePool: [[1,1],[-1,1]], variationProbability: 0.4 },
      bass: { motifBars: 1, noteLengths: [[4,3],[8,2],[16,1]], restProbability: 0.3, chordToneProbability: 0.9, chordTonePool: [[0,6],[4,1]], passingTonePool: [[-2,1]], variationProbability: 0.2 },
    },
    chords: {
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,C(0,3,1)],
        optionalProbability: 0.3,
      },
      vocal: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,C(0,1,1)],
        optionalProbability: 0.26,
      },
    },
  },

  rnb: {
    name: "R&B / Soul",
    description: "Laid-back live-feel groove, lush 7th-chord Rhodes, a smooth solo saxophone top line.",
    tempo: { min: 68, max: 88, default: 76 },
    swing: 0.13,
    humanize: { timingMs: 8, velocityJitter: 0.16 },
    key: "F2",
    scale: "major",
    progressions: [[0,5,1,4],[0,3,5,4],[0,2,3,4],[5,3,0,4],[1,4,0,0],[3,2,1,0],[0,1,4,0]],
    // A real mono solo-line saxophone instead of a generic flute lead - a
    // sax solo is about as canonical a "smooth vocal-style top line" as
    // soul/R&B production actually has.
    defaultFlavors: { kick: "acoustic", snare: "fat", hihat: "dark", perc: "shaker", bass: "pluck", piano: "rhodes", pad: "choir", sax: "smooth", strings: "orchestral", organ: "drawbar", horn: "section" },
    drums: {
      instruments: ["kick", "snare", "hihat", "perc"],
      main: {
        core: {
          kick:  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          perc:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:  [0,0,0,1, 0,0,1,0, 0,0,0,0, 0,0,1,0],
          hihat: [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          perc:  [0,0,1,0, 0,0,0,1, 0,0,1,0, 0,0,0,0],
        },
        optionalProbability: 0.3,
      },
      mainVariants: [{
        core: {
          kick:  [1,0,0,1, 0,0,0,0, 1,0,0,0, 0,0,1,0],
          snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          perc:  [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
        },
        optional: {
          kick:  [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0],
          hihat: [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          perc:  [0,1,0,0, 1,0,0,1, 0,1,0,0, 1,0,0,1],
        },
        optionalProbability: 0.3,
      }],
    },
    melodic: { monoInstruments: ["bass", "sax"], chordInstruments: ["piano", "pad", "strings", "organ", "horn"] },
    melody: {
      bass: { motifBars: 2, noteLengths: [[4,3],[3,2],[6,2]], restProbability: 0.3, chordToneProbability: 0.85, chordTonePool: [[0,5],[4,2],[7,1]], passingTonePool: [[2,1],[-1,1]], variationProbability: 0.3 },
      // A soloist breathes and phrases in long lines rather than firing
      // off short notes - more rest, longer note lengths, and less
      // constant variation than a typical mono lead config, so it reads
      // as one expressive solo idea instead of a busy instrumental run.
      sax: { motifBars: 2, noteLengths: [[4,3],[6,3],[8,2]], restProbability: 0.5, chordToneProbability: 0.75, chordTonePool: [[0,2],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1],[-1,1]], variationProbability: 0.35 , harmony: { shape: "third", probability: 0.45, minLen: 3 } },
    },
    chords: {
      piano: {
        core:     [C(0,4,7),0,0,0, 0,0,0,0, 0,0,C(2,4,4),0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,C(0,4,1), 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.2,
      },
      pad: {
        core:     [C(0,4,16),0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: new Array(STEPS_PER_BAR).fill(0),
        optionalProbability: 0,
      },
      strings: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,C(0,3,4),0, 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.2,
      },
      organ: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, C(0,3,4),0,0,0, 0,0,0,0],
        optionalProbability: 0.2,
      },
      // Motown/Stax-style soul horn section stabs answering the vocal
      // line on the offbeats - a defining texture of classic soul that
      // was completely missing from this genre's palette before.
      horn: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,C(0,3,1),0, 0,0,0,0, 0,0,C(2,3,1),0, 0,0,0,0],
        optionalProbability: 0.3,
      },
    },
  },

  phonk: {
    name: "Phonk",
    description: "Distorted 808 kick doubling as the bassline, hypnotic cowbell, an eerie bell hook.",
    tempo: { min: 130, max: 145, default: 138 },
    swing: 0.05,
    humanize: { timingMs: 3, velocityJitter: 0.14 },
    key: "C2",
    scale: "minor",
    progressions: [[0,4],[0,3],[0,5],[0,6,3,4],[0,6,5,4],[0,5,6,4]],
    defaultFlavors: { kick: "gritty", snare: "trapsnap", hihat: "metallic", perc: "cowbell", bass: "distorted", lead: "bell", vocal: "ahh", stab: "bell-chord" , leadguitar: "fuzz"},
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "perc", "crash"],
      main: {
        core: {
          kick:    [1,0,0,0, 0,0,0,1, 0,0,1,0, 0,0,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          hihat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
          perc:    [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0],
        },
        optional: {
          kick:    [0,0,1,0, 0,1,0,0, 0,0,0,0, 1,0,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
          perc:    [0,1,0,0, 1,0,0,1, 0,1,0,0, 1,0,0,1],
        },
        optionalProbability: 0.35,
        hihatRollSteps: [7, 15],
        hihatRollProbability: 0.4,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,0,1],
          snare:   [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          hihat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
          perc:    [1,0,1,0, 0,1,0,0, 1,0,1,0, 0,1,0,0],
        },
        optional: {
          kick:    [0,0,1,0, 0,0,0,0, 0,1,0,0, 0,0,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
          perc:    [0,1,0,1, 0,0,1,0, 0,1,0,1, 0,0,1,0],
        },
        optionalProbability: 0.35,
        hihatRollSteps: [3, 11],
        hihatRollProbability: 0.4,
      }],
    },
    melodic: { monoInstruments: ["bass", "lead", "leadguitar"], chordInstruments: ["vocal", "stab"] },
    melody: {
      leadguitar: { motifBars: 2, noteLengths: [[2,3],[3,3],[4,2],[6,1]], restProbability: 0.42, chordToneProbability: 0.7, chordTonePool: [[0,3],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1],[-1,1],[6,1]], variationProbability: 0.4 },
      bass: { motifBars: 1, noteLengths: [[3,2],[4,3],[2,1]], restProbability: 0.3, chordToneProbability: 0.9, chordTonePool: [[0,6],[4,1]], passingTonePool: [[-2,1],[3,1]], variationProbability: 0.25 },
      lead: { motifBars: 1, noteLengths: [[2,3],[3,2],[6,1]], restProbability: 0.5, chordToneProbability: 0.6, chordTonePool: [[0,2],[2,2],[4,2]], passingTonePool: [[-1,1],[1,1],[6,1]], variationProbability: 0.4 , harmony: { shape: "fifth", probability: 0.35, minLen: 2 } },
    },
    chords: {
      vocal: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,C(0,1,1),0],
        optionalProbability: 0.32,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,C(0,3,1),0, 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.28,
      },
    },
  },

  jerseyclub: {
    name: "Jersey Club",
    description: "Bouncy syncopated kick bursts, chopped vocal hooks, dry and punchy.",
    tempo: { min: 130, max: 140, default: 136 },
    swing: 0.02,
    humanize: { timingMs: 2, velocityJitter: 0.1 },
    key: "C2",
    scale: "minor",
    progressions: [[0,3],[0,5],[0,4],[0,5,3,4],[0,5,2,6],[0,6,5,6]],
    defaultFlavors: { kick: "snappy", snare: "clap", hihat: "bright", bass: "sub", vocal: "ooh", stab: "square-chord" , lead: "hoover"},
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat"],
      main: {
        core: {
          kick:    [1,0,0,1, 0,0,1,0, 0,1,0,0, 1,0,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,1,0,0, 0,1,0,1, 0,0,1,0, 0,1,0,1],
          hihat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
        },
        optionalProbability: 0.3,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,1,0, 0,1,0,0, 1,0,0,1, 0,0,1,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,1,0,0, 0,0,1,0, 0,1,0,0, 0,1,0,1],
          hihat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          openhat: [0,0,0,1, 0,0,0,0, 0,0,0,1, 0,0,0,0],
        },
        optionalProbability: 0.3,
      }],
    },
    melodic: { monoInstruments: ["bass", "lead"], chordInstruments: ["vocal", "stab"] },
    melody: {
      lead: { motifBars: 2, noteLengths: [[2,3],[4,3],[1,2]], restProbability: 0.45, chordToneProbability: 0.8, chordTonePool: [[0,3],[4,2],[2,2],[7,1]], passingTonePool: [[1,1],[-1,1]], variationProbability: 0.4 },
      bass: { motifBars: 1, noteLengths: [[4,3],[8,2]], restProbability: 0.3, chordToneProbability: 0.9, chordTonePool: [[0,6],[4,1]], passingTonePool: [[-2,1]], variationProbability: 0.2 },
    },
    chords: {
      vocal: {
        core:     [0,0,C(0,1,1),0, 0,0,0,0, 0,0,C(0,1,1),0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,C(2,1,1),0, 0,0,0,0, 0,0,C(2,1,1),0],
        optionalProbability: 0.35,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,C(0,3,1)],
        optionalProbability: 0.3,
      },
    },
  },

  dnb: {
    name: "Drum & Bass",
    description: "Fast syncopated breakbeat drums at ~172 BPM, a growling Reese bass.",
    tempo: { min: 165, max: 178, default: 174 },
    swing: 0.02,
    humanize: { timingMs: 3, velocityJitter: 0.15 },
    key: "E1",
    scale: "minor",
    progressions: [[0,3,4,0],[0,5,3,4],[0,4],[0,6,3,4],[0,5,2,6],[0,6,5,6]],
    defaultFlavors: { kick: "acoustic", snare: "crisp", hihat: "bright", bass: "reese", pad: "airy", stab: "square-chord", arp: "pulse" },
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "crash"],
      main: {
        core: {
          kick:    [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,1,0,0],
          snare:   [0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,0],
          hihat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,1,0],
          snare:   [0,0,0,0, 0,0,0,0, 0,0,0,1, 0,0,0,0],
          openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
        },
        optionalProbability: 0.35,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,0,0, 0,0,0,1, 0,0,1,0, 0,0,0,0],
          snare:   [0,0,0,1, 1,0,0,0, 0,0,0,1, 1,0,0,0],
          hihat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,1,0, 0,0,0,0, 0,1,0,0, 0,0,1,0],
          snare:   [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0],
          openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
        },
        optionalProbability: 0.35,
      }],
    },
    melodic: { monoInstruments: ["bass", "arp"], chordInstruments: ["pad", "stab"] },
    melody: {
      bass: { motifBars: 1, noteLengths: [[4,3],[8,2],[16,1]], restProbability: 0.25, chordToneProbability: 0.85, chordTonePool: [[0,6],[4,1]], passingTonePool: [[-2,1],[3,1]], variationProbability: 0.25 , harmony: { shape: "octave", probability: 0.18, minLen: 4 } },
      arp: { motifBars: 1, noteLengths: [[1,6],[2,2]], restProbability: 0.4, chordToneProbability: 0.9, chordTonePool: [[0,3],[2,2],[4,2],[7,2]], passingTonePool: [[1,1]], variationProbability: 0.15 },
    },
    chords: {
      pad: {
        core:     [C(0,4,16),0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: new Array(STEPS_PER_BAR).fill(0),
        optionalProbability: 0,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, C(0,3,1),0,0,0],
        optionalProbability: 0.3,
      },
    },
  },

  synthwave: {
    name: "Synthwave",
    description: "80s gated drums, an analog synth bass, a soaring lead, lush arpeggiated pads.",
    tempo: { min: 84, max: 116, default: 100 },
    swing: 0,
    humanize: { timingMs: 4, velocityJitter: 0.12 },
    key: "A1",
    scale: "minor",
    progressions: [[0,5,3,4],[0,3,4,0],[0,6,3,4],[0,3],[0,5,2,6],[0,6,5,6],[5,3,0,6]],
    // A Juno-106 chorus pad instead of a plain "warm" patch - that lush,
    // BBD-chorused analog pad is about as quintessentially 80s-synthwave
    // a texture as exists.
    defaultFlavors: { kick: "linn", snare: "gatedverb", hihat: "bright", bass: "synth", lead: "brasslead", pad: "juno", stab: "square-chord", arp: "arp" },
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "crash"],
      main: {
        core: {
          kick:    [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0],
          hihat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
        },
        optionalProbability: 0.3,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
          hihat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
        },
        optionalProbability: 0.3,
      }],
    },
    melodic: { monoInstruments: ["bass", "lead", "arp"], chordInstruments: ["pad", "stab"] },
    melody: {
      bass: { motifBars: 2, noteLengths: [[4,3],[8,2]], restProbability: 0.2, chordToneProbability: 0.9, chordTonePool: [[0,5],[4,2],[7,1]], passingTonePool: [[2,1],[-1,1]], variationProbability: 0.25 },
      lead: { motifBars: 2, noteLengths: [[4,2],[6,3],[8,2]], restProbability: 0.3, chordToneProbability: 0.75, chordTonePool: [[0,2],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1],[-1,1]], variationProbability: 0.35 , harmony: { shape: "third", probability: 0.5, minLen: 2 } },
      arp: { motifBars: 1, noteLengths: [[1,6],[2,2]], restProbability: 0.05, chordToneProbability: 0.95, chordTonePool: [[0,3],[2,2],[4,2],[7,2]], passingTonePool: [[1,1]], variationProbability: 0.1 },
    },
    chords: {
      pad: {
        core:     [C(0,4,16),0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: new Array(STEPS_PER_BAR).fill(0),
        optionalProbability: 0,
      },
      stab: {
        core:     [C(0,2,1),0,C(2,2,1),0, C(0,2,1),0,C(2,2,1),0, C(0,2,1),0,C(2,2,1),0, C(0,2,1),0,C(2,2,1),0],
        optional: new Array(STEPS_PER_BAR).fill(0),
        optionalProbability: 0,
      },
    },
  },

  rap: {
    name: "Rap",
    description: "Hard-hitting distorted 808, aggressive hi-hat rolls, a driven master bus, a hard-edged Auto-Tune hook.",
    tempo: { min: 132, max: 152, default: 142 },
    // Tightened from 0.15 (Hip-Hop's loose boom-bap swing) down close to
    // Trap's near-straight feel - a loose, laid-back swing reads as
    // groovy/relaxed, which works against "hard-hitting" no matter how
    // distorted the drums are. Modern hard trap/rage records are almost
    // always tightly quantized, not swung.
    swing: 0.06,
    humanize: { timingMs: 3, velocityJitter: 0.13 },
    key: "C2",
    scale: "minor",
    // A little master-bus saturation on top of everything else below - the
    // "driven warm on purpose" character modern hard trap/rap masters lean
    // on for extra harmonic bite, researched from how current hard-rap
    // records (Travis Scott/Future/Playboi Carti-adjacent production) are
    // actually mixed, not just "louder."
    grit: 0.3,
    progressions: [[0,5,3,4],[0,3,4,0],[0,4],[0,6,3,4],[0,6,5,6],[0,5,2,6]],
    defaultFlavors: { kick: "gritty", snare: "trapsnap", hihat: "metallic", bass: "hard808", autolead: "hard", vocal: "ahh", stab: "bell-chord", fx: "siren" },
    drums: {
      // Modeled on the Kanye West "808s & Heartbreak" legacy (TR-808,
      // minor-key minimalism, Auto-Tuned melodic hooks) and Lil Baby-style
      // modern melodic trap, plus current hard-trap/rage production
      // (Travis Scott, Future, Playboi Carti-adjacent): the drums stay
      // sparse so the hook carries the record, but the hi-hats roll harder
      // and more often, and the 808/kick hit with real distortion instead
      // of staying clean - "less is more" on arrangement, not on impact.
      instruments: ["kick", "snare", "hihat", "openhat", "fx"],
      main: {
        core: {
          kick:    [1,0,0,1, 0,0,0,0, 0,0,1,0, 0,0,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          hihat:   [1,0,0,1, 0,0,1,0, 0,1,0,0, 1,0,0,1],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,0,0, 0,1,0,0, 0,0,0,0, 0,0,1,0],
          snare:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
          openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,0],
        },
        optionalProbability: 0.25,
        hihatRollSteps: [3, 7, 11, 15],
        hihatRollProbability: 0.5,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,0,0, 0,0,1,0, 0,1,0,0, 0,0,0,1],
          snare:   [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          hihat:   [1,0,1,0, 0,1,0,0, 1,0,0,1, 0,1,0,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,1,0, 0,0,0,0, 0,0,0,0, 0,1,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
          openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,0],
        },
        optionalProbability: 0.25,
        hihatRollSteps: [1, 5, 9, 13],
        hihatRollProbability: 0.5,
      }],
    },
    melodic: { monoInstruments: ["bass", "autolead"], chordInstruments: ["vocal", "stab"] },
    melody: {
      bass: { motifBars: 1, noteLengths: [[3,3],[4,2],[6,1]], restProbability: 0.3, chordToneProbability: 0.9, chordTonePool: [[0,6],[4,1]], passingTonePool: [[-2,1],[3,1]], variationProbability: 0.2 },
      // A real hook breathes - it's a sung phrase, not an instrumental
      // run - so this leans on more space and longer notes than a
      // typical mono lead config, and stays close to its core idea
      // instead of constantly varying, the way a rap hook is repeated
      // almost like a mantra rather than reinvented every bar.
      autolead: { motifBars: 2, noteLengths: [[3,3],[4,3],[6,1]], restProbability: 0.45, chordToneProbability: 0.85, chordTonePool: [[0,4],[4,2],[7,1]], passingTonePool: [[-1,1],[2,1]], variationProbability: 0.15 , harmony: { shape: "third", probability: 0.45, minLen: 2 } },
    },
    chords: {
      vocal: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, C(0,1,2),0,0,0],
        optionalProbability: 0.3,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,C(2,3,1),0, 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.28,
      },
    },
  },

  amapiano: {
    name: "Amapiano",
    // South Africa's house offshoot, distinct from Afrobeats: slower and
    // sparser, with the log drum carrying the groove as a melodic bass
    // instrument rather than the kick, jazzy piano chords, and lots of
    // space - "private school" amapiano leans clean and soulful.
    description: "Sparse deep kick, a melodic log-drum bassline carrying the groove, jazzy piano, airy space.",
    tempo: { min: 108, max: 118, default: 113 },
    swing: 0.07,
    humanize: { timingMs: 6, velocityJitter: 0.15 },
    key: "C2",
    scale: "minor",
    progressions: [[0,3,4,0],[0,5,3,4],[0,3],[0,4,3,0],[0,5,2,6],[3,6,0,0]],
    defaultFlavors: { kick: "deep", snare: "rimshot", hihat: "dark", perc: "shaker", bass: "logdrum", piano: "rhodes", pad: "warm", vocal: "ooh", stab: "organ-chord" , woodwind: "sopranosax"},
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "perc"],
      main: {
        core: {
          kick:    [1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          perc:    [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
        },
        optional: {
          kick:    [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0],
          hihat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
          perc:    [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
        },
        optionalProbability: 0.3,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,0,0, 0,0,1,0, 0,0,0,0, 1,0,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          perc:    [1,0,1,1, 0,1,1,0, 1,0,1,1, 0,1,1,0],
        },
        optional: {
          kick:    [0,0,1,0, 0,0,0,0, 0,1,0,0, 0,0,0,0],
          openhat: [0,0,0,1, 0,0,0,0, 0,0,0,1, 0,0,0,0],
        },
        optionalProbability: 0.3,
      }],
    },
    melodic: { monoInstruments: ["bass", "woodwind"], chordInstruments: ["piano", "pad", "vocal", "stab"] },
    melody: {
      woodwind: { motifBars: 2, noteLengths: [[4,3],[6,3],[8,2],[3,1]], restProbability: 0.52, chordToneProbability: 0.78, chordTonePool: [[0,2],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1],[-1,1],[5,1]], variationProbability: 0.35 },
      // The log drum IS the lead voice in amapiano - more active and
      // syncopated than a typical bassline, it fills the space the sparse
      // kick leaves open.
      bass: { motifBars: 1, noteLengths: [[2,3],[3,3],[4,1]], restProbability: 0.3, chordToneProbability: 0.85, chordTonePool: [[0,5],[4,2],[7,1]], passingTonePool: [[-2,1],[2,1]], variationProbability: 0.3 },
    },
    chords: {
      piano: {
        core:     [C(0,4,4),0,0,0, 0,0,0,0, 0,0,C(2,3,4),0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,C(0,3,2),0, 0,0,0,0, 0,0,C(3,3,2),0],
        optionalProbability: 0.3,
      },
      pad: {
        core:     [C(0,4,16),0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: new Array(STEPS_PER_BAR).fill(0),
        optionalProbability: 0,
      },
      vocal: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,C(0,1,1), 0,0,0,0, 0,0,0,C(0,1,1), 0,0,0,0],
        optionalProbability: 0.28,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,C(0,3,1), 0,0,0,0],
        optionalProbability: 0.28,
      },
    },
  },

  ukgarage: {
    name: "UK Garage",
    // The 2-step signature: NO kick on beat 3. That missing kick is what
    // gives garage its skippy, off-balance bounce, along with a heavy
    // shuffle and chopped-up vocal stabs.
    description: "Skippy 2-step drums (no kick on beat 3), heavy shuffle, chopped vocal stabs, a warm sub.",
    tempo: { min: 128, max: 136, default: 132 },
    swing: 0.22,
    humanize: { timingMs: 5, velocityJitter: 0.18 },
    key: "G2",
    scale: "dorian",
    progressions: [[0,3,4,0],[0,2,3,4],[0,4],[0,3],[0,1,4,0],[0,6,3,0]],
    defaultFlavors: { kick: "punch", snare: "crisp", hihat: "bright", perc: "shaker", bass: "sub", lead: "pluck", organ: "combo", vocal: "ay", stab: "organ-chord" },
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "perc"],
      main: {
        core: {
          kick:    [1,0,0,0, 0,0,0,1, 0,0,0,0, 0,1,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [1,0,1,1, 0,1,1,0, 1,0,1,1, 0,1,1,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          perc:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,0,0],
          snare:   [0,0,0,1, 0,0,0,0, 0,0,1,0, 0,0,0,0],
          openhat: [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0],
          perc:    [0,1,0,0, 0,0,1,0, 0,1,0,0, 0,0,1,0],
        },
        optionalProbability: 0.32,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,0,0, 0,0,1,0, 0,0,0,0, 1,0,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [1,1,0,1, 0,1,1,0, 1,1,0,1, 0,1,1,0],
          openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          perc:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:    [0,0,0,1, 0,0,0,0, 0,1,0,0, 0,0,0,0],
          snare:   [0,0,1,0, 0,0,0,0, 0,0,0,1, 0,0,0,0],
          openhat: [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
        },
        optionalProbability: 0.32,
      }],
    },
    melodic: { monoInstruments: ["bass", "lead"], chordInstruments: ["organ", "vocal", "stab"] },
    melody: {
      bass: { motifBars: 1, noteLengths: [[2,2],[3,3],[4,2]], restProbability: 0.35, chordToneProbability: 0.85, chordTonePool: [[0,5],[4,2],[7,1]], passingTonePool: [[-2,1],[2,1]], variationProbability: 0.3 },
      lead: { motifBars: 1, noteLengths: [[1,2],[2,3],[3,1]], restProbability: 0.5, chordToneProbability: 0.7, chordTonePool: [[0,2],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1]], variationProbability: 0.4 , harmony: { shape: "third", probability: 0.3, minLen: 2 } },
    },
    chords: {
      organ: {
        core:     [0,0,C(0,3,1),0, 0,0,0,0, 0,0,C(0,3,1),0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,C(2,3,1), 0,0,0,0, 0,0,0,C(2,3,1)],
        optionalProbability: 0.32,
      },
      vocal: {
        core:     [0,0,0,0, 0,0,C(0,1,1),0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,C(2,1,1), 0,0,0,0, 0,0,0,C(2,1,1), 0,0,0,0],
        optionalProbability: 0.35,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,C(0,3,1),0],
        optionalProbability: 0.3,
      },
    },
  },

  techno: {
    name: "Techno",
    // Distinct from House: darker, harder, more hypnotic and minimal -
    // near-static harmony (the groove and timbre carry the track, not
    // chord changes), a relentless 909 four-on-the-floor, offbeat open
    // hats, and an acid 303 line.
    description: "Relentless 909 four-on-the-floor, offbeat open hats, an acid 303 line, dark minimal harmony.",
    tempo: { min: 126, max: 138, default: 130 },
    swing: 0,
    humanize: { timingMs: 2, velocityJitter: 0.08 },
    key: "A1",
    scale: "minor",
    progressions: [[0],[0,3],[0,1],[0,4],[0,5],[0,6]],
    defaultFlavors: { kick: "909", snare: "909snare", hihat: "909", perc: "clave", bass: "303", pad: "dark", stab: "square-chord", arp: "pulse", fx: "riser" },
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "perc", "crash", "fx"],
      main: {
        core: {
          kick:    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
          openhat: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
          perc:    [0,0,0,1, 0,0,0,0, 0,1,0,0, 0,0,0,0],
        },
        optional: {
          hihat:   [1,1,0,1, 1,1,0,1, 1,1,0,1, 1,1,0,1],
          perc:    [0,1,0,0, 0,0,1,0, 0,0,0,1, 0,1,0,0],
        },
        optionalProbability: 0.3,
      },
      mainVariants: [{
        core: {
          kick:    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
          openhat: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
          perc:    [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,1,0,0],
        },
        optional: {
          perc:    [0,1,0,1, 0,0,0,0, 0,1,0,1, 0,0,0,0],
        },
        optionalProbability: 0.3,
      }],
    },
    melodic: { monoInstruments: ["bass", "arp"], chordInstruments: ["pad", "stab"] },
    melody: {
      // A driving 16th-note acid line - short repeated notes with small
      // moves, built for the 303's squelch to do the talking.
      bass: { motifBars: 1, noteLengths: [[1,3],[2,4]], restProbability: 0.25, chordToneProbability: 0.9, chordTonePool: [[0,5],[7,2]], passingTonePool: [[-2,1],[1,1]], variationProbability: 0.25 , harmony: { shape: "octave", probability: 0.2, minLen: 2 } },
      arp: { motifBars: 1, noteLengths: [[1,6],[2,2]], restProbability: 0.35, chordToneProbability: 0.9, chordTonePool: [[0,3],[2,2],[4,2],[7,2]], passingTonePool: [[1,1]], variationProbability: 0.15 },
    },
    chords: {
      pad: {
        core:     [C(0,4,16),0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: new Array(STEPS_PER_BAR).fill(0),
        optionalProbability: 0,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,C(0,3,1),0, 0,0,0,0, 0,0,C(0,3,1),0],
        optionalProbability: 0.3,
      },
    },
  },

  neosoul: {
    name: "Neo-Soul",
    // Distinct from R&B/Soul: the D'Angelo/Erykah Badu school - the
    // "drunk" behind-the-beat drum feel (the highest timing humanization
    // in the app, the J Dilla drag), richer extended chords (9ths via
    // 5-note voicings), and a jazz guitar as a second melodic voice.
    description: "Drunk, dragging drum feel, rich 9th-chord Rhodes, jazz guitar lines, deep pocket.",
    tempo: { min: 80, max: 96, default: 88 },
    swing: 0.16,
    humanize: { timingMs: 14, velocityJitter: 0.2 },
    // Drums drag behind while the bass stays forward - the "drunk"
    // neo-soul pocket is this relationship between parts, not overall
    // sloppiness.
    pockets: { snare: 16, hihat: 10, kick: 4, bass: -3 },
    key: "F2",
    scale: "major",
    progressions: [[0,2,5,4],[3,2,0,4],[0,5,1,4],[2,5,0,3],[1,4,0,3],[3,2,1,0],[5,1,4,0]],
    // Cross-stick, not a full snare: neo-soul's backbeat is almost always
    // the stick laid across the head tapping the rim - the dry woody
    // "tock" that leaves room for the Rhodes and keeps the pocket soft.
    defaultFlavors: { kick: "lofi", snare: "rimclick", hihat: "analog", perc: "shaker", bass: "pluck", piano: "rhodes", pad: "choir", guitar: "jazz", organ: "drawbar", vocal: "ooh" , leadguitar: "cleantone"},
    drums: {
      instruments: ["kick", "snare", "hihat", "perc"],
      main: {
        core: {
          kick:  [1,0,0,0, 0,0,0,1, 0,0,1,0, 0,0,0,0],
          snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          perc:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:  [0,0,1,0, 0,0,0,0, 0,0,0,1, 0,0,1,0],
          hihat: [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          perc:  [0,0,1,0, 0,0,0,1, 0,0,1,0, 0,0,0,0],
        },
        optionalProbability: 0.3,
      },
      mainVariants: [{
        core: {
          kick:  [1,0,0,1, 0,0,0,0, 1,0,0,0, 0,0,1,0],
          snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          hihat: [1,0,1,1, 0,1,1,0, 1,0,1,1, 0,1,1,0],
          perc:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        optional: {
          kick:  [0,0,1,0, 0,0,1,0, 0,0,0,0, 0,1,0,0],
          perc:  [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,1],
        },
        optionalProbability: 0.3,
      }],
    },
    melodic: { monoInstruments: ["bass", "guitar", "leadguitar"], chordInstruments: ["piano", "pad", "organ", "vocal"] },
    melody: {
      leadguitar: { motifBars: 2, noteLengths: [[2,3],[3,3],[4,2],[6,1]], restProbability: 0.42, chordToneProbability: 0.7, chordTonePool: [[0,3],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1],[-1,1],[6,1]], variationProbability: 0.4 },
      bass: { motifBars: 2, noteLengths: [[3,2],[4,3],[6,2]], restProbability: 0.35, chordToneProbability: 0.85, chordTonePool: [[0,5],[4,2],[7,1]], passingTonePool: [[2,1],[-1,1]], variationProbability: 0.3 },
      guitar: { motifBars: 2, noteLengths: [[2,3],[3,2],[4,2]], restProbability: 0.45, chordToneProbability: 0.7, chordTonePool: [[0,2],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1],[-1,1]], variationProbability: 0.4 , harmony: { shape: "seventh", probability: 0.55, minLen: 2 } },
    },
    chords: {
      // Size-5 voicings = stacked-thirds 9th chords, the neo-soul harmony
      // signature that plain triads and 7ths don't reach.
      piano: {
        core:     [C(0,5,6),0,0,0, 0,0,0,0, 0,0,C(1,4,4),0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,C(0,4,1), 0,0,0,0, 0,0,C(2,4,2),0],
        optionalProbability: 0.25,
      },
      pad: {
        core:     [C(0,4,16),0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: new Array(STEPS_PER_BAR).fill(0),
        optionalProbability: 0,
      },
      organ: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, C(0,3,4),0,0,0, 0,0,0,0],
        optionalProbability: 0.22,
      },
      vocal: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,C(0,1,1),0],
        optionalProbability: 0.28,
      },
    },
  },
};

// Each style carries its own key so downstream logic (ghost-note
// idiom, filter sweeps, DJ-length intros) can ask which genre it is
// without every call site having to thread the id through.
for (const styleId of Object.keys(STYLES)) STYLES[styleId].id = styleId;

function rollTrack(core, optional, probability) {
  const base = core || new Array(STEPS_PER_BAR).fill(0);
  const opt = optional || new Array(STEPS_PER_BAR).fill(0);
  return base.map((hit, i) => {
    if (hit) return true;
    if (opt[i] && Math.random() < probability) return true;
    return false;
  });
}

function rollNoteTrack(core, optional, probability) {
  const base = core || new Array(STEPS_PER_BAR).fill(0);
  const opt = optional || new Array(STEPS_PER_BAR).fill(0);
  return base.map((spec, i) => {
    if (spec) return spec;
    if (opt[i] && Math.random() < probability) return opt[i];
    return null;
  });
}

// Chordal instruments (piano, pad, stab, strings, organ, vocal) used to
// resolve to the exact same register and the exact same voicing shape on
// every single generation - a pad in particular is typically one whole-bar
// chord with a flat-out 0% optional-hit probability, meaning it was
// mathematically guaranteed to sound identical forever. Three independent,
// per-generation variations now apply generically to every chordal
// instrument in every genre (no per-genre content authoring needed):
// register jitter (same +/- one octave idea already used for melodies),
// a voicing-richness bonus (occasionally stacks an extra third on top for
// a lusher chord), and - for any chord that happens to be a single
// whole-bar sustain, which is exactly what every pad in this app is -
// an optional split into two half-bar chords with real harmonic motion
// between them instead of one static block of sound.
// Voice leading. Chords used to resolve to root position every single
// time (always a plain stack of thirds), so a progression read as a
// series of unrelated blocks being stamped down rather than one part
// moving. Real keyboard and guitar players invert each chord so it sits
// as close as possible to the previous one - common tones stay put and
// the rest step by a note or two. Rotating the voicing (lifting the
// lowest tones up an octave) and keeping whichever rotation moves least
// is exactly that, and it never alters which notes are in the chord.
function voiceLeadDegrees(degrees, prevLowest) {
  if (prevLowest === null || prevLowest === undefined || degrees.length < 2) return degrees;
  let best = degrees;
  let bestCost = Infinity;
  for (let rot = 0; rot < Math.min(degrees.length, 3); rot++) {
    const cand = degrees.slice(rot).concat(degrees.slice(0, rot).map((d) => d + 7));
    const cost = Math.abs(cand[0] - prevLowest);
    if (cost < bestCost) { bestCost = cost; best = cand; }
  }
  return best;
}

function resolveChordBarTrack(instKey, cfg, barRootDegree, opts = {}) {
  const { registerOffset = 0, voicingBonus = 0, splitMotion = null, anticipate = false, prevLowest = null, sus = false } = opts;
  const raw = rollNoteTrack(cfg.core, cfg.optional, cfg.optionalProbability);
  const register = REGISTER[instKey] + registerOffset;
  let running = prevLowest;
  const resolved = raw.map((spec) => {
    if (!spec) return null;
    const root = barRootDegree + register + spec.degreeOffset;
    const size = Math.max(2, spec.size + voicingBonus);
    let degs = chordDegrees(root, size);
    // A suspended chord replaces the third with the fourth, withholding
    // the major/minor quality - the open, unresolved sound house and
    // techno lean on.
    if (sus) degs = degs.map((d, i) => (i === 1 ? d + 1 : d));
    // Respace the stack of thirds the way this instrument's players
    // actually voice a chord - see INSTRUMENT_PROFILE in instruments.js.
    degs = shapeVoicing(degs, instKey);
    const led = voiceLeadDegrees(degs, running);
    running = led[0];
    return { degrees: led, len: spec.len };
  });

  if (splitMotion !== null) {
    for (let i = 0; i < resolved.length; i++) {
      const note = resolved[i];
      if (note && note.len === STEPS_PER_BAR && i + STEPS_PER_BAR <= resolved.length) {
        const half = STEPS_PER_BAR / 2;
        const secondRoot = barRootDegree + register + splitMotion;
        resolved[i] = { degrees: note.degrees, len: half };
        resolved[i + half] = { degrees: chordDegrees(secondRoot, note.degrees.length), len: half };
        break;
      }
    }
  }

  // The "push": all of this instrument's hits anticipate the beat by an
  // 8th note (2 steps), the standard funk/R&B/gospel comping move where
  // the chords land on the "and" just ahead of the beat instead of on it.
  // Rotation wraps the bar, which in looped playback reads exactly like
  // anticipating the next bar's downbeat. Skipped whenever the pattern
  // holds any long sustain (a pushed whole-bar pad makes no sense).
  if (anticipate) {
    const lens = resolved.filter(Boolean).map((n) => n.len);
    if (lens.length && Math.max(...lens) <= 8) {
      const pushed = new Array(resolved.length).fill(null);
      for (let i = 0; i < resolved.length; i++) {
        if (resolved[i]) pushed[(i - 2 + resolved.length) % resolved.length] = resolved[i];
      }
      return pushed;
    }
  }
  return resolved;
}

// ---- Chord colour ----
// Every chord in the app resolved to a plain stack of thirds from the
// scale, which produces correct but generic triads. Real genres have
// characteristic chord *qualities*, and that colour is a large part of
// what identifies a style: neo-soul and jazz-leaning R&B are built on
// 7ths and 9ths (plain triads sound wrong there), house and techno lean
// on suspended voicings that withhold the third, and rock/trap
// deliberately stay bare so the harmony doesn't get in the way.
// voicingBonus adds stacked thirds (3 -> 7th -> 9th); sus replaces the
// third with the fourth, removing the major/minor quality entirely.
const CHORD_COLOR = {
  neosoul:  { extend: [[0, 1], [1, 3], [2, 3]], sus: 0.05 },
  rnb:      { extend: [[0, 2], [1, 3], [2, 1]], sus: 0.05 },
  lofi:     { extend: [[0, 2], [1, 3], [2, 1]], sus: 0.08 },
  jazzish:  { extend: [[0, 1], [1, 3], [2, 2]], sus: 0.05 },
  house:    { extend: [[0, 3], [1, 2]], sus: 0.22 },
  ukgarage: { extend: [[0, 3], [1, 2]], sus: 0.2 },
  techno:   { extend: [[0, 4], [1, 1]], sus: 0.3 },
  amapiano: { extend: [[0, 2], [1, 3], [2, 1]], sus: 0.1 },
  synthwave:{ extend: [[0, 3], [1, 2]], sus: 0.15 },
  hiphop:   { extend: [[0, 3], [1, 2]], sus: 0.05 },
  afrobeats:{ extend: [[0, 3], [1, 2]], sus: 0.08 },
  drill:    { extend: [[0, 4], [1, 1]], sus: 0.04 },
  dnb:      { extend: [[0, 3], [1, 2]], sus: 0.12 },
};
const DEFAULT_CHORD_COLOR = { extend: [[0, 5], [1, 1]], sus: 0.03 };

function pickChordVariety(style) {
  const cx = complexityProfile();
  const variety = {};
  for (const inst of style.melodic.chordInstruments || []) {
    // Low-homed chordal instruments (pad/organ/guitar sit at register 7)
    // must never jitter a further octave down - that lands them squarely
    // in the bass's lane and turns the low end to mud, another piece of
    // the "instruments fighting each other" problem.
    const lowHomed = REGISTER[inst] <= 7;
    variety[inst] = {
      registerOffset: lowHomed ? pickWeighted([[0, 3], [7, 1]]) : pickWeighted([[-7, 1], [0, 3], [7, 1]]),
      // Complexity adds chord extensions on top of the genre's own
      // profile: triads at the bottom of the dial, 7ths in the middle,
      // 9ths and 11ths at the top.
      voicingBonus: pickWeighted((CHORD_COLOR[style.id] || DEFAULT_CHORD_COLOR).extend) + cx.extensionBonus,
      sus: Math.random() < (CHORD_COLOR[style.id] || DEFAULT_CHORD_COLOR).sus,
      splitMotion: Math.random() < cx.splitMotionProbability ? pickWeighted([[4, 1], [-3, 1], [3, 1], [-4, 1]]) : null,
      anticipate: Math.random() < cx.anticipateProbability,
    };
  }
  return variety;
}

function buildStructure(bars) {
  // The thinned-out intro bar used to appear on literally every 4-bar-plus
  // generation, which made bar 1 feel identical across generations even
  // when everything else changed - now it's a coin-flip production choice,
  // like a real producer sometimes opening cold on the full groove.
  const useIntro = bars >= 4 && Math.random() < 0.6;
  const seq = [];
  for (let i = 0; i < bars; i++) {
    if (i === 0 && useIntro) seq.push("intro");
    else if ((i + 1) % 4 === 0) seq.push("fill");
    else seq.push("main");
  }
  return seq;
}

// densityBoost shifts how many of the authored optional hits actually
// land, so a chorus can genuinely be busier than its verse rather than
// differing only in which instruments are switched on.
// ---------------------------------------------------------------------------
// Beat complexity, 1-10
// ---------------------------------------------------------------------------
// "Complexity" is easy to fake badly - just add more notes - and that
// produces clutter, not sophistication. What actually separates a simple
// beat from an intricate one is measurable, and it is mostly SYNCOPATION:
// where onsets sit relative to the metric grid, not how many there are.
//
// The measure used here is Longuet-Higgins & Lee (1984), the standard
// formal model of rhythmic syncopation. It works from the metric weight
// hierarchy every listener implicitly carries for a 4/4 bar: the downbeat
// is the strongest position, the half-bar next, then the remaining
// quarters, then the 8ths, and the 16ths weakest. A syncopation is a
// note-then-rest pair where the NOTE lands on a weak position and the
// following REST sits on a STRONGER one - the listener expected the
// strong position to be marked, and it was not. Each such pair scores the
// difference between the two weights, and the bar's syncopation is the
// sum.
//
// (The published weight tables sit behind servers that refuse automated
// fetches, so the values below are the standard binary-subdivision
// hierarchy the accessible literature describes rather than a table
// transcribed from a page I could read: level 0 for the downbeat, then
// one level down per binary subdivision.)
const METRIC_WEIGHT = (() => {
  // 16 pulses: 0 -> 0, 8 -> -1, 4/12 -> -2, even -> -3, odd -> -4.
  const w = new Array(STEPS_PER_BAR);
  for (let i = 0; i < STEPS_PER_BAR; i++) {
    if (i % 16 === 0) w[i] = 0;
    else if (i % 8 === 0) w[i] = -1;
    else if (i % 4 === 0) w[i] = -2;
    else if (i % 2 === 0) w[i] = -3;
    else w[i] = -4;
  }
  return w;
})();

// LHL syncopation score for one lane over any number of bars.
function syncopationScore(track) {
  if (!track || !track.length) return 0;
  let total = 0;
  for (let i = 0; i < track.length; i++) {
    if (!track[i]) continue;
    // Find the rest that follows this onset, and compare metric weights.
    const wNote = METRIC_WEIGHT[i % STEPS_PER_BAR];
    for (let k = 1; k <= 8; k++) {
      const j = i + k;
      if (j >= track.length) break;
      if (track[j]) break;                       // not a rest - no pair
      const wRest = METRIC_WEIGHT[j % STEPS_PER_BAR];
      if (wRest > wNote) { total += wRest - wNote; break; }
    }
  }
  return total;
}

function patternSyncopation(instruments, lanes) {
  let total = 0, bars = 0;
  for (const lane of lanes) {
    const t = instruments[lane];
    if (!Array.isArray(t)) continue;
    total += syncopationScore(t);
    bars = Math.max(bars, t.length / STEPS_PER_BAR);
  }
  return bars ? total / bars : 0;
}

// The single knob, 1 (nursery-rhyme simple) to 10 (dense and intricate).
// Everything below is derived from it, so the setting moves the whole
// arrangement coherently instead of just turning up one parameter.
let BEAT_COMPLEXITY = 5;
// The policy conditions on context, so the current genre and swing have to
// be visible to complexityProfile. Set by resolveGenerationStyle.
let CURRENT_STYLE_ID = null;
// The knobs of the artist being imitated, if any. A third source leaning the
// same controls the complexity dial moves, alongside the user's taste bias
// and the RL policy. Null whenever no artist is named, in which case
// everything behaves exactly as it did before.
let CURRENT_ARTIST_KNOBS = null;
function setArtistKnobs(k) { CURRENT_ARTIST_KNOBS = k || null; }
let CURRENT_SWING = 10;
let CURRENT_TEMPO = 110;
function setGenerationContext(styleId, swing, tempo) {
  CURRENT_STYLE_ID = styleId || null;
  if (swing !== undefined && swing !== null) CURRENT_SWING = swing;
  if (tempo !== undefined && tempo !== null) CURRENT_TEMPO = tempo;
}
function setBeatComplexity(n) {
  BEAT_COMPLEXITY = Math.max(1, Math.min(10, Math.round(n)));
}

function complexityProfile(c = BEAT_COMPLEXITY) {
  const t = (c - 1) / 9;   // 0 at simplest, 1 at most complex
  // Two learned sources lean the same knobs the dial moves, and both are
  // zero unless something has actually been learned:
  //   * Taste.generationBias  - what THIS user has rated up
  //   * policyAction          - the offline-trained RL policy (policy.js)
  let b = null;
  try { b = typeof Taste !== "undefined" ? Taste.generationBias() : null; } catch (_) { b = null; }
  const bias = b || { syncopation: 0, density: 0, extension: 0, layers: 0, melodic: 0 };
  let pol = null;
  try {
    pol = typeof policyAction === "function"
      ? policyAction(CURRENT_STYLE_ID, c, CURRENT_SWING, CURRENT_TEMPO, CURRENT_ARTIST_KNOBS) : null;
  } catch (_) { pol = null; }
  const P = pol || { density: 0, syncopation: 0, extension: 0, layers: 0, rest: 0, ghost: 0, roll: 0, variation: 0, pair: 0 };
  // The named artist's own knobs, derived from their profile. Measured
  // before this existed, two different producers in a genre came out CLOSER
  // to each other than two runs of one producer - the profile was setting
  // sounds but not writing.
  const A = CURRENT_ARTIST_KNOBS
    || { density: 0, sync: 0, extension: 0, layers: 0, rest: 0, ghost: 0, roll: 0, variation: 0 };
  return {
    level: c,
    t,
    // Target LHL syncopation per bar, summed across the drum lanes. At 1
    // the beat should sit almost entirely on the grid; at 10 it should
    // be pushing against it constantly.
    syncTarget: Math.max(0.5, 1 + t * 16 + bias.syncopation + P.syncopation + A.sync),
    // Fraction of the grid that carries an onset, across all drums.
    densityTarget: Math.max(0.06, Math.min(0.55, 0.13 + t * 0.26 + bias.density + P.density + A.density)),
    // The finest subdivision allowed to carry an onset. Simple beats are
    // simple partly because they do not use 16ths at all. A hard bucket
    // per subdivision made whole pairs of levels identical (1 and 2 were
    // indistinguishable, so were 3 and 4), so the coarsening is graded:
    // each level also has a probability that an off-grid hit survives,
    // which fills in the steps between subdivisions.
    minStep: c <= 2 ? 4 : c <= 4 ? 2 : 1,
    offGridKeep: c === 1 ? 0 : c === 2 ? 0.3 : c === 3 ? 0.12 : c === 4 ? 0.45 : 1,
    ghostProbability: Math.max(0, Math.min(0.7, 0.04 + t * 0.34 + P.ghost + A.ghost)),
    rollBoost: (t - 0.4) * 0.5 + P.roll + A.roll,
    // Harmony: triads at the bottom, 7ths in the middle, 9ths and 11ths
    // at the top. This is the same axis jazz uses to describe harmonic
    // sophistication, so it belongs on a complexity control.
    extensionBonus: Math.max(0, Math.round((t < 0.25 ? 0 : t < 0.5 ? 1 : t < 0.75 ? 2 : 3) + bias.extension + P.extension + A.extension)),
    // Chords per bar. Faster harmonic rhythm is one of the clearest
    // markers of a more worked-out arrangement.
    splitMotionProbability: 0.1 + t * 0.65,
    anticipateProbability: 0.05 + t * 0.45,
    // Melody
    restBias: 0.22 - t * 0.34 - bias.melodic + P.rest + A.rest,        // more complex = fewer rests
    variationBoost: -0.1 + t * 0.35 + P.variation + A.variation,
    passingToneBoost: t * 0.22,
    // How many voices are in play at once.
    soloPairProbability: Math.max(0, Math.min(0.95, 0.12 + t * 0.6 + bias.layers + P.pair + A.layers)),
    chordKeepProbability: Math.max(0.1, Math.min(0.98, 0.3 + t * 0.5 + bias.layers + P.layers + A.layers)),
    percLayerProbability: t * 0.75,
  };
}

// Quantise a drum lane up to the coarsest subdivision this complexity
// allows. At complexity 1-2 that removes every 8th and 16th offbeat,
// which is what actually makes a beat read as simple - not fewer hits,
// but hits only in obvious places.
function applyComplexityGrid(track, minStep, keep = 0) {
  if (minStep <= 1 || !Array.isArray(track)) return track;
  for (let i = 0; i < track.length; i++) {
    if (track[i] && i % minStep !== 0 && Math.random() >= keep) track[i] = false;
  }
  return track;
}

// Push an onset off a strong position onto the weak one just before it.
// This is the actual mechanism by which syncopation is created, and doing
// it deliberately is very different from randomly adding notes: the total
// number of onsets does not change at all, only where they sit.
function syncopateTrack(track, amount) {
  if (!Array.isArray(track) || amount <= 0) return track;
  for (let i = track.length - 1; i >= 1; i--) {
    if (!track[i] || track[i] === "ghost") continue;
    const w = METRIC_WEIGHT[i % STEPS_PER_BAR];
    // Only strong positions are worth displacing - moving a 16th offbeat
    // achieves nothing.
    if (w > -3 && !track[i - 1] && Math.random() < amount) {
      track[i - 1] = track[i];
      track[i] = false;
    }
  }
  return track;
}

function buildDrumBar(style, variant, densityBoost = 0) {
  const cx = complexityProfile();
  const m = style.drums.main;
  const bar = {};
  const prob = Math.max(0, Math.min(0.95, m.optionalProbability + densityBoost + (cx.t - 0.5) * 0.45));
  for (const inst of style.drums.instruments) {
    bar[inst] = rollTrack(m.core[inst], m.optional[inst], prob);
  }
  if (style.drums.instruments.includes("crash")) bar.crash = new Array(STEPS_PER_BAR).fill(false);

  if (variant === "intro") {
    for (const inst of style.drums.instruments) {
      if (inst !== "kick" && inst !== "snare" && inst !== "hihat") {
        bar[inst] = new Array(STEPS_PER_BAR).fill(false);
      } else {
        bar[inst] = m.core[inst] ? [...m.core[inst]].map(Boolean) : new Array(STEPS_PER_BAR).fill(false);
      }
    }
  }

  if (m.hihatRollSteps && bar.hihat && variant !== "intro") {
    // Sparse trap-family genres have few optional hits to add, so their
    // chorus energy comes the way it does on real records: more hi-hat
    // rolls, not more instruments.
    const rollProb = Math.max(0, Math.min(0.95, m.hihatRollProbability + densityBoost * 1.5 + cx.rollBoost));
    for (const step of m.hihatRollSteps) {
      if (Math.random() < rollProb) bar.hihat[step] = "roll";
    }
  }

  // Ghost notes: quiet snare taps between the backbeats. Real drummers
  // fill the space between 2 and 4 with these almost constantly; on a
  // grid their absence is a big part of why programmed drums sound
  // stiff. Placed only on weak 16ths, and never on top of a real hit.
  if (bar.snare && variant !== "intro" && GHOST_GENRES.has(style.id)) {
    for (const g of [2, 6, 10, 14, 7, 15]) {
      if (!bar.snare[g] && Math.random() < cx.ghostProbability) bar.snare[g] = "ghost";
    }
  }

  // ---- Complexity shaping -------------------------------------------
  // Order matters. Coarsen to the allowed grid FIRST, so that a simple
  // setting really has nothing on the offbeats; then displace onsets to
  // create syncopation, which is what makes a complex setting complex.
  // The kick and snare keep their downbeat and backbeat anchors at every
  // level - a beat whose pulse cannot be found is not complex, it is
  // just broken.
  if (variant !== "intro") {
    for (const inst of Object.keys(bar)) {
      if (inst === "crash") continue;
      applyComplexityGrid(bar[inst], cx.minStep, cx.offGridKeep);
    }
    if (cx.minStep > 1) {
      // Coarsening can strip the backbeat if it sat on an odd step; put
      // the genre's anchors back.
      if (bar.kick && m.core.kick) for (let i = 0; i < STEPS_PER_BAR; i += 4) if (m.core.kick[i]) bar.kick[i] = true;
      if (bar.snare && m.core.snare) for (let i = 0; i < STEPS_PER_BAR; i += 4) if (m.core.snare[i]) bar.snare[i] = true;
    }
    const syncAmount = Math.max(0, (cx.t - 0.45) * 0.55);
    if (syncAmount > 0) {
      for (const inst of Object.keys(bar)) {
        if (inst === "kick" || inst === "crash") continue;   // keep the pulse findable
        syncopateTrack(bar[inst], syncAmount);
      }
    }
  }

  if (variant === "fill") {
    const type = style.fillType || "tomRun";
    if (type === "cut") {
      // Dropout fill: everything cuts for the last beat so the next
      // downbeat lands harder - the modern trap/EDM "pull the floor out"
      // move, and the exact opposite gesture from adding hits.
      for (const inst of Object.keys(bar)) {
        for (let s = 12; s < STEPS_PER_BAR; s++) bar[inst][s] = false;
      }
    } else if (type === "snareRush") {
      if (bar.snare) {
        bar.snare[12] = true;
        bar.snare[13] = true;
        bar.snare[14] = true;
        bar.snare[15] = true;
      }
      if (bar.hihat) bar.hihat[15] = "roll";
    } else if (type === "hatLift") {
      if (bar.hihat) {
        for (let s = 12; s < STEPS_PER_BAR; s++) bar.hihat[s] = "roll";
      }
      if (bar.openhat) bar.openhat[15] = true;
    } else {
      if (bar.tom) {
        bar.tom[12] = true;
        bar.tom[13] = Math.random() < 0.5;
        bar.tom[14] = true;
      } else if (bar.snare) {
        bar.snare[12] = true;
        bar.snare[14] = true;
      }
      if (bar.hihat) {
        bar.hihat[14] = "roll";
        bar.hihat[15] = "roll";
      }
      if (bar.openhat) bar.openhat[15] = true;
    }
  }

  return bar;
}

function buildChordBar(style, variant, barRootDegree, chordVariety, prevLowest = {}) {
  const bar = {};
  const chordInstruments = style.melodic.chordInstruments || [];
  for (const inst of chordInstruments) {
    if (variant === "intro") {
      bar[inst] = new Array(STEPS_PER_BAR).fill(null);
      continue;
    }
    const v = (chordVariety && chordVariety[inst]) || {};
    bar[inst] = resolveChordBarTrack(inst, style.chords[inst], barRootDegree, { ...v, prevLowest: prevLowest[inst] });
    for (let i = bar[inst].length - 1; i >= 0; i--) {
      if (bar[inst][i]) { prevLowest[inst] = bar[inst][i].degrees[0]; break; }
    }
    if (variant === "fill" && inst === "stab") {
      // Goes through shapeVoicing like every other chord - otherwise a
      // big voicingBonus builds an eight-note stab no four-piece section
      // could ever play.
      const fillDegs = chordDegrees(barRootDegree + REGISTER.stab + (v.registerOffset || 0), 3 + (v.voicingBonus || 0));
      bar[inst][0] = { degrees: shapeVoicing(fillDegs, "stab"), len: 2 };
    }
  }
  return bar;
}

// A genre's chord progression and core drum groove used to be a single
// hardcoded constant, which meant every generated beat in that genre had
// the exact same harmonic shape and the exact same rhythmic backbone
// forever - only the melody notes and instrument timbres ever varied. Both
// now pick randomly from a small pool of genuinely different, genre-
// appropriate options every time a beat is generated.
// ---- Progression quality, from functional harmony ----
// Not all chord successions are equally strong, and the reasons are
// well established rather than matters of taste:
//
// - ROOT MOTION. Descending-fifth motion (vi->ii->V->I, the circle of
//   fifths) is the strongest progression in tonal music; descending
//   thirds and ascending steps are next; ascending fifths are the
//   weakest and can sound like the harmony is sliding backwards.
// - FUNCTION. Western harmony moves Tonic -> Predominant -> Dominant ->
//   Tonic. A progression that walks that arc feels purposeful; one that
//   wanders between functions feels aimless.
// - CADENCE. Ending on the dominant leaves the loop hanging and pulling
//   back to the top, which is exactly what a repeating loop wants.
const FUNCTION_MAJOR = ["T", "PD", "T", "PD", "D", "T", "D"];
const FUNCTION_MINOR = ["T", "D", "T", "PD", "D", "PD", "D"];

function rootMotionScore(from, to) {
  const step = ((to - from) % 7 + 7) % 7;
  if (step === 3) return 1.0;   // down a fifth (up a fourth) - strongest
  if (step === 5) return 0.75;  // down a third
  if (step === 1) return 0.7;   // up a step
  if (step === 6) return 0.6;   // down a step
  if (step === 2) return 0.5;   // up a third
  if (step === 4) return 0.3;   // up a fifth - weakest
  return 0.35;                  // static
}

function scoreProgression(prog, scaleName) {
  if (!prog || prog.length < 2) return 0.5;
  const fn = scaleName === "major" ? FUNCTION_MAJOR : FUNCTION_MINOR;
  let motion = 0;
  for (let i = 0; i < prog.length; i++) {
    motion += rootMotionScore(prog[i], prog[(i + 1) % prog.length]);
  }
  motion /= prog.length;

  // Reward a real functional arc appearing somewhere in the loop.
  let arc = 0;
  for (let i = 0; i < prog.length - 1; i++) {
    const a = fn[((prog[i] % 7) + 7) % 7];
    const b = fn[((prog[i + 1] % 7) + 7) % 7];
    if (a === "T" && b === "PD") arc += 0.3;
    if (a === "PD" && b === "D") arc += 0.45;
    if (a === "D" && b === "T") arc += 0.4;
  }
  arc = Math.min(1, arc);

  // A loop that starts on the tonic states its key immediately.
  const tonicStart = prog[0] % 7 === 0 ? 0.2 : 0;
  return motion * 0.5 + arc * 0.3 + tonicStart;
}

// Progressions are still chosen at random - variety matters - but the
// draw is weighted toward the stronger ones, so a generation is more
// likely to land on harmony that actually goes somewhere while every
// authored option stays reachable.
function pickProgression(style) {
  const options = style.progressions || [style.progression];
  if (options.length === 1) return options[0];
  const weighted = options.map((p) => [p, 0.25 + scoreProgression(p, style.scale)]);
  return pickWeighted(weighted);
}

function pickDrumMain(style) {
  const variants = style.drums.mainVariants;
  if (!variants || !variants.length) return style.drums.main;
  const pool = [style.drums.main, ...variants];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ---- Groove mutation ----
// Even with two authored groove variants per genre, measurement showed 15%
// of generation pairs shared a byte-identical kick+snare skeleton and the
// rest differed by only ~3 steps out of 32 - the rhythmic backbone barely
// moved between generations, which is exactly what "different sounds but
// the same order" describes. Instead of hand-authoring dozens more
// variants, each generation now algorithmically mutates the picked groove
// while protecting what makes the genre that genre:
//
// - Kick displacement never touches quarter-note positions (steps 0/4/8/12),
//   so House's four-on-the-floor and every genre's downbeat stay intact;
//   only syncopated kicks roam, and only by one step.
// - The snare backbeat is never moved at all - it's the single strongest
//   genre anchor in the whole kit.
// - Percussion patterns re-roll through a Euclidean rhythm generator
//   (Bjorklund's algorithm - Toussaint, "The Euclidean Algorithm Generates
//   Traditional Musical Rhythms", 2005, showed evenly-distributed onset
//   patterns underlie a huge share of the world's traditional rhythms,
//   which is why a rotated Euclidean pattern sounds like a groove and not
//   like noise), at a density near the authored one.
// - Dense 16th-note hat lines get occasional "hiccup" gaps dropped in, a
//   standard trap/house hat trick that changes the perceived groove a lot
//   for a tiny edit.
function euclideanPattern(hits, steps) {
  const out = [];
  let bucket = 0;
  for (let i = 0; i < steps; i++) {
    bucket += hits;
    if (bucket >= steps) {
      bucket -= steps;
      out.push(1);
    } else out.push(0);
  }
  return out;
}

function rotatePattern(arr, offset) {
  const n = arr.length;
  return arr.map((_, i) => arr[(i - offset + n) % n]);
}

function cloneGroove(m) {
  const g = {
    core: {}, optional: {},
    optionalProbability: m.optionalProbability,
    hihatRollProbability: m.hihatRollProbability,
  };
  if (m.hihatRollSteps) g.hihatRollSteps = [...m.hihatRollSteps];
  for (const k of Object.keys(m.core)) g.core[k] = [...m.core[k]];
  for (const k of Object.keys(m.optional || {})) g.optional[k] = [...m.optional[k]];
  return g;
}

function mutateGroove(m, tresilloAware = false) {
  const g = cloneGroove(m);

  // In Afro-Latin genres the kick doesn't just syncopate freely - it
  // articulates the tresillo (3+3+2), the cell underlying dembow,
  // habanera, and most Afro-diasporic dance rhythm. Mutating those
  // kicks generically smears the very figure that defines the groove,
  // so here mutation is constrained to positions inside the cell.
  if (g.core.kick && tresilloAware) {
    const kick = g.core.kick;
    const cell = [0, 3, 6, 8, 11, 14];
    if (Math.random() < 0.55) {
      const present = cell.filter((i) => kick[i]);
      const absent = cell.filter((i) => !kick[i] && i !== 0);
      if (absent.length && Math.random() < 0.6) kick[absent[Math.floor(Math.random() * absent.length)]] = 1;
      else if (present.length > 2) {
        const drop = present.filter((i) => i !== 0);
        if (drop.length) kick[drop[Math.floor(Math.random() * drop.length)]] = 0;
      }
    }
  } else if (g.core.kick) {
    const kick = g.core.kick;
    // 1-2 kick edits per generation from {displace, add, remove}, all
    // restricted to syncopated (off-quarter) positions and guarded so the
    // groove never collapses below its authored on-the-beat backbone.
    const ops = 1 + (Math.random() < 0.4 ? 1 : 0);
    for (let op = 0; op < ops; op++) {
      const roll = Math.random();
      const offQuarter = [];
      const emptyOffQuarter = [];
      for (let i = 1; i < STEPS_PER_BAR; i++) {
        if (i % 4 === 0) continue;
        if (kick[i]) offQuarter.push(i);
        else emptyOffQuarter.push(i);
      }
      if (roll < 0.5 && offQuarter.length) {
        const idx = offQuarter[Math.floor(Math.random() * offQuarter.length)];
        const dir = Math.random() < 0.5 ? -1 : 1;
        const target = idx + dir;
        if (target > 0 && target < STEPS_PER_BAR && !kick[target]) {
          kick[idx] = 0;
          kick[target] = 1;
        }
      } else if (roll < 0.8 && emptyOffQuarter.length) {
        kick[emptyOffQuarter[Math.floor(Math.random() * emptyOffQuarter.length)]] = 1;
      } else if (offQuarter.length && kick.filter(Boolean).length > 2) {
        kick[offQuarter[Math.floor(Math.random() * offQuarter.length)]] = 0;
      }
    }
  }

  if (g.core.hihat) {
    const hat = g.core.hihat;
    const density = hat.filter(Boolean).length;
    if (density >= 12 && Math.random() < 0.45) {
      const drops = 1 + (Math.random() < 0.4 ? 1 : 0);
      for (let d = 0; d < drops; d++) {
        const filled = [];
        for (let i = 0; i < STEPS_PER_BAR; i++) if (hat[i] && i % 4 !== 0) filled.push(i);
        if (filled.length) hat[filled[Math.floor(Math.random() * filled.length)]] = 0;
      }
    }
  }

  if (g.core.perc) {
    const density = g.core.perc.filter(Boolean).length;
    if (density >= 2 && density <= 8 && Math.random() < 0.5) {
      const k = Math.max(2, Math.min(9, density + (Math.random() < 0.4 ? (Math.random() < 0.5 ? -1 : 1) : 0)));
      g.core.perc = rotatePattern(euclideanPattern(k, STEPS_PER_BAR), Math.floor(Math.random() * 4));
    }
  }

  if (g.optional.hihat && Math.random() < 0.5) {
    g.optional.hihat = rotatePattern(g.optional.hihat, [2, 4, 6][Math.floor(Math.random() * 3)]);
  }

  return g;
}

// The fill bar was also identical in shape every generation (always the
// same tom run into the downbeat). Four genuinely different fill idioms,
// one picked per generation, all standard production moves:
// a tom run, a snare rush build, a hat lift, and the modern "cut" where
// everything drops out for the last beat so the downbeat lands harder.
function pickFillType() {
  return pickWeighted([["tomRun", 3], ["snareRush", 2], ["hatLift", 1.2], ["cut", 1]]);
}

// ---------------------------------------------------------------------------
// Which instruments play, decided per generation
// ---------------------------------------------------------------------------
// Until now a genre's instrumentation was FIXED. R&B had a saxophone on
// every single beat it ever produced; drill always had a woodwind; techno
// always had an arp. Only the *timbre* shuffled - the kit changed, the
// instrument never did. Measured across 30 generations of each of the 19
// genres, every genre played exactly the same solo instrument 100% of the
// time, and twelve of them had only one solo instrument in existence.
//
// That is why beats in a genre started sounding like each other: the ear
// latches onto whatever is carrying the top line, and it was always the
// same thing. Changing the saxophone's reed does not fix that. Replacing
// the saxophone with a Rhodes solo, a flute, a lead guitar or a talkbox
// does.
//
// Each genre now declares a POOL of solo voices that genuinely belong in
// it, and each generation draws one or two. Weights keep the genre's
// signature voice most likely without making it inevitable.
const SOLO_POOLS = {
  // Boom-bap samples soul and jazz records, so horns, organ, guitar, sax,
  // vibes and piano are all in scope. A thumb piano is not: it is an African
  // and lo-fi sound that arrived here only because nothing said no.
  hiphop:    [["lead", 3], ["sax", 2], ["woodwind", 2], ["leadguitar", 2], ["piano", 2], ["marimba", 1], ["horn", 1], ["talkbox", 1]],
  // Rebalanced twice, both times because of what came out rather than what
  // the table looked like.
  //
  // First a flute lead was turning up in 58% of trap beats - real sound, far
  // too often - so it came down to weight 2. That left the kalimba and the
  // marimba, which were never questioned and which between them still put a
  // mallet or a thumb piano on top of a third of all trap beats. Neither
  // belongs anywhere near the genre; they read as lo-fi and afrobeats
  // instantly, and they are exactly what a listener means by an instrument
  // that throws off the flow.
  //
  // What replaces them is what trap records actually put on top: bell and
  // synth leads, an autotuned hook, a dark piano figure, and cinematic
  // strings. The flute stays, because it earns its place.
  trap:      [["lead", 5], ["autolead", 3], ["woodwind", 2], ["piano", 2], ["strings", 1]],
  house:     [["lead", 3], ["sax", 2], ["woodwind", 2], ["arp", 2], ["marimba", 1], ["talkbox", 1]],
  // Rock is guitars, a Hammond and a piano. A flute solo was arriving in 42%
  // of rock beats, which is a prog-rock joke rather than a genre.
  rock:      [["leadguitar", 5], ["lead", 1], ["organ", 1], ["piano", 1]],
  reggaeton: [["lead", 3], ["woodwind", 2], ["marimba", 2], ["leadguitar", 1]],
  lofi:      [["lead", 2], ["sax", 2], ["woodwind", 3], ["marimba", 2], ["kalimba", 2], ["leadguitar", 2]],
  // Drill: the cold bell/synth motif is the sound, with a dark wind second
  // and the sliding minor piano figure that half the genre is built on.
  drill:     [["lead", 4], ["woodwind", 2], ["autolead", 2], ["piano", 2], ["strings", 1]],
  afrobeats: [["woodwind", 3], ["marimba", 2], ["kalimba", 2], ["sax", 2], ["leadguitar", 2], ["lead", 1]],
  // Dubstep is a synthesis genre: the interest is in the bass design, not in
  // an acoustic solo voice sitting over it.
  dubstep:   [["lead", 5], ["arp", 2]],
  // The genre this was reported on. A saxophone is one of R&B's voices,
  // not its only one - vibraphone, flute, clean lead guitar and talkbox
  // all carry top lines on real records.
  rnb:       [["sax", 3], ["woodwind", 3], ["leadguitar", 2], ["marimba", 2], ["lead", 2], ["talkbox", 2]],
  phonk:     [["lead", 4], ["autolead", 2], ["leadguitar", 2], ["woodwind", 1]],
  jerseyclub:[["lead", 3], ["arp", 2], ["autolead", 2]],
  dnb:       [["arp", 3], ["lead", 3], ["woodwind", 1]],
  synthwave: [["lead", 3], ["arp", 3], ["leadguitar", 2]],
  // Rap: an Auto-Tune hook or a synth lead, not a woodwind recital. The piano
  // is here because soul-sampling rap is built on one.
  rap:       [["autolead", 4], ["lead", 3], ["piano", 2], ["woodwind", 1], ["sax", 1], ["talkbox", 1]],
  amapiano:  [["woodwind", 3], ["sax", 3], ["lead", 2], ["marimba", 2], ["kalimba", 1], ["leadguitar", 2]],
  ukgarage:  [["lead", 3], ["arp", 2], ["sax", 2], ["woodwind", 2]],
  techno:    [["arp", 3], ["lead", 3]],
  neosoul:   [["leadguitar", 3], ["sax", 3], ["woodwind", 2], ["lead", 1], ["marimba", 2], ["talkbox", 1]],
};

// Any instrument can now be drawn into any genre's solo slot, so every one
// of them needs a sensible melodic profile even where the genre never
// wrote one. These are written from how each instrument is actually
// played: wind players breathe (long notes, lots of rest), mallet and
// plucked instruments cannot sustain so they move (short notes, little
// rest), an arp is continuous motion by definition.
const DEFAULT_MELODY = {
  lead:      { motifBars: 2, noteLengths: [[2,3],[4,3],[3,1]], restProbability: 0.42, chordToneProbability: 0.78, chordTonePool: [[0,3],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1],[-1,1]], variationProbability: 0.38 },
  sax:       { motifBars: 2, noteLengths: [[4,3],[6,3],[8,2]], restProbability: 0.5, chordToneProbability: 0.75, chordTonePool: [[0,2],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1],[-1,1]], variationProbability: 0.35, harmony: { shape: "third", probability: 0.4, minLen: 3 } },
  woodwind:  { motifBars: 2, noteLengths: [[4,3],[6,3],[8,2],[3,1]], restProbability: 0.52, chordToneProbability: 0.78, chordTonePool: [[0,2],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1],[-1,1],[5,1]], variationProbability: 0.35 },
  leadguitar:{ motifBars: 2, noteLengths: [[2,3],[3,3],[4,2],[6,1]], restProbability: 0.42, chordToneProbability: 0.7, chordTonePool: [[0,3],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1],[-1,1],[6,1]], variationProbability: 0.4 },
  autolead:  { motifBars: 2, noteLengths: [[3,3],[4,3],[6,2]], restProbability: 0.5, chordToneProbability: 0.82, chordTonePool: [[0,3],[2,2],[4,2]], passingTonePool: [[1,1],[-1,1]], variationProbability: 0.3 },
  arp:       { motifBars: 1, noteLengths: [[1,4],[2,3]], restProbability: 0.15, chordToneProbability: 0.9, chordTonePool: [[0,3],[2,3],[4,3],[7,2]], passingTonePool: [[1,1]], variationProbability: 0.45 },
  kalimba:   { motifBars: 2, noteLengths: [[2,3],[1,2],[4,2]], restProbability: 0.4, chordToneProbability: 0.85, chordTonePool: [[0,3],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1]], variationProbability: 0.4 },
  marimba:   { motifBars: 2, noteLengths: [[2,3],[1,2],[4,2]], restProbability: 0.38, chordToneProbability: 0.82, chordTonePool: [[0,3],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[3,1],[-1,1]], variationProbability: 0.4 },
  // A talkbox line is a HOOK - short, repeated, heavily rest-separated,
  // and almost entirely chord tones, because it is standing in for a
  // sung phrase rather than for an instrumental solo.
  talkbox:   { motifBars: 2, noteLengths: [[3,3],[4,3],[6,2],[2,1]], restProbability: 0.52, chordToneProbability: 0.88, chordTonePool: [[0,4],[2,2],[4,2]], passingTonePool: [[1,1],[-1,1]], variationProbability: 0.28 },
  guitar:    { motifBars: 2, noteLengths: [[2,3],[4,3],[3,1]], restProbability: 0.45, chordToneProbability: 0.75, chordTonePool: [[0,3],[2,2],[4,2]], passingTonePool: [[1,1],[-1,1]], variationProbability: 0.35 },

  // Four instruments that were only ever allowed to play chords, even
  // though on real records they routinely carry the top line. Without these
  // a Robert Glasper profile could not name the piano and a Just Blaze
  // profile could not name horns - the two things that most define them -
  // and the request was silently dropped, leaving a generic beat.
  //
  // A piano solo runs faster and uses more passing tones than a horn line,
  // because a pianist is not breathing; a horn or string line is long,
  // rest-separated and mostly chord tones for the same reason in reverse.
  piano:     { motifBars: 2, noteLengths: [[1,2],[2,4],[3,2],[4,2]], restProbability: 0.34, chordToneProbability: 0.68, chordTonePool: [[0,3],[2,2],[4,2],[7,2],[9,1]], passingTonePool: [[1,2],[3,2],[-1,2],[5,1],[6,1]], variationProbability: 0.45 },
  organ:     { motifBars: 2, noteLengths: [[2,3],[3,2],[4,3],[6,1]], restProbability: 0.38, chordToneProbability: 0.72, chordTonePool: [[0,3],[2,2],[4,2],[7,1]], passingTonePool: [[1,2],[3,1],[-1,2],[6,1]], variationProbability: 0.4 },
  strings:   { motifBars: 4, noteLengths: [[6,3],[8,3],[12,2],[4,1]], restProbability: 0.48, chordToneProbability: 0.8, chordTonePool: [[0,3],[2,2],[4,2],[7,2]], passingTonePool: [[1,1],[3,1],[-1,1]], variationProbability: 0.28, harmony: { shape: "third", probability: 0.5, minLen: 4 } },
  horn:      { motifBars: 2, noteLengths: [[3,3],[4,3],[6,2],[2,1]], restProbability: 0.52, chordToneProbability: 0.82, chordTonePool: [[0,3],[2,2],[4,2],[7,1]], passingTonePool: [[1,1],[-1,1]], variationProbability: 0.32, harmony: { shape: "third", probability: 0.45, minLen: 3 } },

  // On a Kanye or Kaytranada record - and on essentially every jersey club
  // record - the chopped vocal IS the top line, not a background texture.
  // A vocal chop is the most repetitive hook there is: short notes, almost
  // entirely chord tones, and it repeats nearly unchanged, because the
  // whole effect depends on recognising it instantly.
  vocal:     { motifBars: 2, noteLengths: [[1,3],[2,4],[3,1]], restProbability: 0.46, chordToneProbability: 0.92, chordTonePool: [[0,4],[2,2],[4,2],[7,1]], passingTonePool: [[1,1]], variationProbability: 0.18 },
  // A pad carrying the melody is the opposite extreme: a handful of very
  // long notes. This is what a Goldie or a Tainy record puts on top.
  pad:       { motifBars: 4, noteLengths: [[8,3],[12,3],[16,2]], restProbability: 0.5, chordToneProbability: 0.88, chordTonePool: [[0,3],[2,2],[4,2],[7,2]], passingTonePool: [[1,1],[3,1]], variationProbability: 0.22 },
};

// Draw this generation's solo voices. One most of the time, two often
// enough that beats have a call-and-response pair - but never so many
// that the top of the mix turns into a crowd.
function pickSoloInstruments(style) {
  // A type-beat profile can name the solo voices that define an artist's
  // sound; when it does, they replace the genre's own pool rather than
  // merely being added to it.
  const source = (style.soloOverride && style.soloOverride.length)
    ? style.soloOverride.map((i) => [i, 1])
    : (SOLO_POOLS[style.id] || []);
  const pool = source.filter(([inst]) => {
    // A named producer's records simply do not have certain instruments on
    // them. Without this a Metro Boomin type beat could arrive with a
    // saxophone, because the genre pool offered one and nothing said no.
    if (artistAvoids(inst)) return false;
    // A genre can only field an instrument it has a melodic profile for,
    // either its own or the shared default.
    return (style.melody && style.melody[inst]) || DEFAULT_MELODY[inst];
  });
  if (!pool.length) return (style.melodic.monoInstruments || []).filter((i) => i !== "bass");
  const picked = [];
  const remaining = pool.slice();
  const cx = complexityProfile();
  const count = Math.random() < cx.soloPairProbability && remaining.length > 1 ? 2 : 1;
  for (let n = 0; n < count && remaining.length; n++) {
    const total = remaining.reduce((a, [, w]) => a + w, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (let i = 0; i < remaining.length; i++) {
      r -= remaining[i][1];
      if (r <= 0) { idx = i; break; }
    }
    picked.push(remaining[idx][0]);
    remaining.splice(idx, 1);
  }
  return picked;
}

// Chordal parts vary too, for the same reason: a genre that always fields
// piano AND pad AND strings AND organ AND horn sounds like one arrangement
// every time. The first two are kept (they carry the harmony) and the
// rest are each rolled for, so the supporting cast changes shape.
function pickChordInstruments(style) {
  // The chordal parts were never filtered by the artist's palette - only the
  // solo pool was - so a producer who never uses an organ could still get one
  // comping underneath. Two are always kept so the beat cannot end up with no
  // harmony at all, even if the artist avoids most of what this genre offers.
  let all = (style.melodic.chordInstruments || []).filter((i) => !artistAvoids(i));
  if (!all.length) all = (style.melodic.chordInstruments || []).slice(0, 1);
  if (all.length <= 2) return all.slice();
  const cx = complexityProfile();
  const kept = all.slice(0, 2);
  for (const inst of all.slice(2)) {
    if (Math.random() < cx.chordKeepProbability) kept.push(inst);
  }
  return kept;
}

// Instrumentation is a creative decision, not something to optimise.
// It is planned ONCE per "Generate", above the best-of-N candidate search,
// and every candidate then shares it. Planning it per candidate instead
// let the scorer choose the line-up - and because the scorer rewards
// interplay it simply always picked the busiest option, which quietly
// undid most of the variety this is here to create.
// Instruments the named artist never uses. Set alongside the artist knobs and
// cleared whenever the beat is made any other way.
let CURRENT_ARTIST_AVOID = null;
function setArtistAvoid(list) {
  CURRENT_ARTIST_AVOID = (list && list.length) ? new Set(list) : null;
}
function artistAvoids(inst) {
  return !!(CURRENT_ARTIST_AVOID && CURRENT_ARTIST_AVOID.has(inst));
}

function planInstrumentation(style) {
  // How each part is physically played is chosen per generation too - a
  // strummed guitar and a fingerpicked one are different performances of
  // the same chords, and that difference is bigger than any kit change.
  const articulation = {};
  for (const inst of [...(style.melodic.chordInstruments || []), ...(style.melodic.monoInstruments || [])]) {
    // Guarded: patterns.js is loaded independently of performance.js, and
    // a beat with no articulation plan still plays (everything falls back
    // to "block"), so a missing performance layer must not be fatal.
    if (typeof INSTRUMENT_ARTICULATIONS !== "undefined" && INSTRUMENT_ARTICULATIONS[inst]) {
      articulation[inst] = pickArticulation(inst);
    }
  }
  const solos = pickSoloInstruments(style);
  const melody = { ...style.melody };
  for (const inst of solos) {
    if (!melody[inst]) melody[inst] = DEFAULT_MELODY[inst];
  }
  // The rhythm guitar is a chordal/riff role, not a solo one, so it stays
  // wherever the genre put it rather than competing for the solo slot.
  const keptMono = (style.melodic.monoInstruments || []).filter((i) => i === "bass" || i === "guitar");
  return {
    melody,
    articulation,
    melodic: {
      ...style.melodic,
      monoInstruments: [...keptMono, ...solos.filter((i) => !keptMono.includes(i))],
      chordInstruments: pickChordInstruments(style),
    },
  };
}

function resolveGenerationStyle(style, plan) {
  // style.tempo is a {min,max,default} range object, not a number. Passing
  // the object straight through made the policy's tempo input NaN, which
  // turned every policy output into NaN, which turned every complexity
  // target into NaN - and the generator carried on regardless, producing
  // beats that scored NaN. Nothing threw.
  const tempoNum = typeof style.tempo === "number" ? style.tempo
    : (style.tempo && (style.tempo.current || style.tempo.default)) || undefined;
  setGenerationContext(style.id, style.swing !== undefined ? style.swing * 100 : undefined, tempoNum);
  const p = plan || planInstrumentation(style);
  return {
    ...style,
    melody: p.melody,
    articulation: p.articulation,
    melodic: p.melodic,
    drums: { ...style.drums, main: mutateGroove(pickDrumMain(style), TRESILLO_GENRES.has(style.id)) },
    progression: pickProgression(style),
    fillType: pickFillType(),
  };
}

// User-typed chords ("Cm7 Fm7 Ab Bb7") replace the genre's own progression
// pool for harmony, one chord per bar cycling round-robin (same convention
// a genre's own `progressions` arrays already use) - but everything else
// about the genre (drum groove, swing, melody rhythm feel, chord-stab
// pattern) is untouched, so it still sounds like that genre, just built
// around the chords the user actually asked for instead of a random
// genre-appropriate progression.
function buildBarContextsFromChords(chords, barCount, baseOctave = 2) {
  const rootMidis = resolveChordRootMidis(chords, baseOctave);
  const contexts = [];
  for (let i = 0; i < barCount; i++) {
    const idx = i % chords.length;
    contexts.push({ rootMidi: rootMidis[idx], scale: chords[idx].scale });
  }
  return contexts;
}

function generateVariationOnce(rawStyle, bars, plan) {
  const style = resolveGenerationStyle(rawStyle, plan);
  const structure = buildStructure(bars);
  const totalSteps = bars * STEPS_PER_BAR;
  const customChords = rawStyle.customChords;
  let barRootDegrees, barChordContexts;
  if (customChords && customChords.length) {
    barRootDegrees = structure.map(() => 0);
    barChordContexts = buildBarContextsFromChords(customChords, structure.length);
  } else {
    barRootDegrees = structure.map((_, i) => style.progression[i % style.progression.length]);
  }

  const drumBars = structure.map((variant) => buildDrumBar(style, variant));
  for (let i = 1; i < structure.length; i++) {
    if (structure[i - 1] === "fill" && drumBars[i].crash !== undefined) drumBars[i].crash[0] = true;
  }
  // A loop always ends on its fill bar, so there is never a "next bar"
  // inside the array for that fill to resolve onto - which meant the
  // crash silently never fired in loop mode at all. Playback wraps, so
  // the fill resolves onto bar 1's downbeat: put the crash there.
  if (structure[structure.length - 1] === "fill" && drumBars[0].crash !== undefined) {
    drumBars[0].crash[0] = true;
  }

  const instruments = {};
  for (const inst of style.drums.instruments) {
    instruments[inst] = [].concat(...drumBars.map((b) => b[inst] || new Array(STEPS_PER_BAR).fill(false)));
  }

  const chordVariety = pickChordVariety(style);
  const voiceState = {};
  const chordBars = structure.map((variant, i) => buildChordBar(style, variant, barRootDegrees[i], chordVariety, voiceState));
  for (const inst of style.melodic.chordInstruments) {
    instruments[inst] = [].concat(...chordBars.map((b) => b[inst] || new Array(STEPS_PER_BAR).fill(null)));
  }

  const registerPlan = planRegisterJitters(style.melodic.monoInstruments);
  for (const inst of style.melodic.monoInstruments) {
    instruments[inst] = generateMonoMelody(REGISTER[inst], structure, barRootDegrees, style.melody[inst], totalSteps, registerPlan[inst], inst === "bass");
  }
  declutterMonoCollisions(instruments, style.melodic.monoInstruments);

  // Mix hierarchy: real productions have one clear featured voice per
  // section, with the other melodic parts sitting behind it - the absence
  // of that hierarchy is a big part of "the instruments aren't working
  // together." Each generation picks one non-bass melodic line as the
  // feature and gently ducks the rest via the same per-track automation
  // path the full-song arrangement already uses (the user can still see
  // and edit these levels in the automation lane).
  const automation = {};
  const supporting = style.melodic.monoInstruments.filter((i) => i !== "bass");
  if (supporting.length > 1) {
    const feature = supporting[Math.floor(Math.random() * supporting.length)];
    for (const inst of supporting) {
      if (inst !== feature) automation[inst] = [{ step: 0, value: 0.75 }];
    }
  }

  return { instruments, structure, barRootDegrees, barChordContexts, automation, articulation: style.articulation, genStyle: style };
}

// ---- Full-song arrangement ----
// Real tracks build energy over a whole song, not just one repeating bar:
// an intro that layers instruments in one at a time, a verse that's less
// intense than the chorus, a chorus that pulls out every layer, a bridge
// that strips back for contrast before the final chorus, and an outro that
// unwinds the intro in reverse. This mirrors the "gradual layering / boost
// energy in the chorus / strip back for the bridge" arrangement techniques
// producers actually use.

const SONG_SECTIONS = [
  { type: "intro", label: "Intro", bars: 4 },
  { type: "verse", label: "Verse 1", bars: 8 },
  { type: "chorus", label: "Chorus 1", bars: 8 },
  { type: "verse", label: "Verse 2", bars: 8 },
  { type: "chorus", label: "Chorus 2", bars: 8 },
  { type: "bridge", label: "Bridge", bars: 4 },
  { type: "chorus", label: "Final Chorus", bars: 8 },
  { type: "outro", label: "Outro", bars: 4 },
];

const INSTRUMENT_PRIORITY = [
  "kick", "hihat", "snare", "bass", "piano", "organ", "pad", "lead", "autolead", "kalimba", "marimba",
  "guitar", "arp", "openhat", "perc", "stab", "strings", "horn", "sax", "vocal", "crash", "tom", "fx",
];

// Volume automation: rather than leaving a track's fader flat for the
// whole song, atmospheric/feature instruments swell into choruses, dip
// for the bridge breakdown, and fade in/out over the intro and outro -
// the same "automate a level over the arrangement" move a real mix uses.
const AUTOMATION_INSTRUMENTS = ["pad", "strings", "organ", "lead", "vocal", "kalimba", "marimba", "arp", "autolead", "sax"];

// intensity scales how far a track pulls back in quiet sections - 1 is
// the full atmospheric swing (down to ~30% in an intro/bridge), while a
// lower intensity blends the curve back toward a constant 1. Bass needed
// its own, much gentler version of this: without any automation at all it
// was one of the only instruments still hammering at full, unchanging
// velocity straight through a hushed bridge or intro while everything
// else (pads, strings, lead) tastefully dipped - reported as "the bass
// sounds too aggressive in parts it's not supposed to." Bass is still
// foundational and shouldn't vanish the way an atmospheric pad does, but
// it does deserve *some* pullback so a quiet section actually reads as
// quiet instead of just missing its other instruments.
function generateAutomationCurve(barMetas, intensity = 1) {
  const points = [];
  let lastValue = null;
  for (let i = 0; i < barMetas.length; i++) {
    const b = barMetas[i];
    const step = i * STEPS_PER_BAR;
    const span = Math.max(b.len - 1, 1);
    let value;
    if (b.type === "intro") value = 0.3 + 0.5 * (b.pos / span);
    else if (b.type === "verse") value = 0.65;
    else if (b.type === "chorus") value = 1;
    else if (b.type === "bridge") value = b.pos < b.len / 2 ? 0.35 : 0.6;
    else if (b.type === "outro") value = 0.7 - 0.55 * (b.pos / span);
    else value = 0.7;

    value = 1 - (1 - value) * intensity;

    if (points.length === 0 || Math.abs(value - lastValue) > 0.05 || i === barMetas.length - 1) {
      points.push({ step, value: Math.max(0, Math.min(1, value)) });
      lastValue = value;
    }
  }
  return points;
}

function generateAutomation(style, barMetas) {
  const automation = {};
  for (const inst of AUTOMATION_INSTRUMENTS) {
    if (style.melodic.chordInstruments.includes(inst) || style.melodic.monoInstruments.includes(inst)) {
      automation[inst] = generateAutomationCurve(barMetas, 1);
    }
  }
  if (style.melodic.monoInstruments.includes("bass")) {
    automation.bass = generateAutomationCurve(barMetas, 0.45);
  }
  return automation;
}

function priorityInstrumentList(style) {
  const have = new Set([...style.drums.instruments, ...style.melodic.monoInstruments, ...style.melodic.chordInstruments]);
  return INSTRUMENT_PRIORITY.filter((i) => have.has(i));
}

// House and techno are functional DJ music: the arrangement exists to
// be mixed. Long drum-only intros and outros are what let another
// record be beatmatched over the top, which is why club tracks are
// built that way rather than opening on the hook.
const DJ_GENRES = new Set(["house", "techno", "ukgarage"]);

function sectionsForStyle(style) {
  if (!DJ_GENRES.has(style.id)) return SONG_SECTIONS;
  return [
    { type: "intro", label: "DJ Intro", bars: 8 },
    { type: "intro", label: "Intro", bars: 4 },
    ...SONG_SECTIONS.filter((x) => x.type !== "intro" && x.type !== "outro"),
    { type: "outro", label: "Outro", bars: 4 },
    { type: "outro", label: "DJ Outro", bars: 8 },
  ];
}

function expandSongSections(sections = SONG_SECTIONS) {
  const bars = [];
  for (const section of sections) {
    for (let i = 0; i < section.bars; i++) {
      bars.push({ type: section.type, label: section.label, pos: i, len: section.bars });
    }
  }
  return bars;
}

function layerFractionForBar(barMeta) {
  const { type, pos, len } = barMeta;
  const span = Math.max(len - 1, 1);
  if (type === "intro") return 0.2 + 0.6 * (pos / span);
  // Widened the verse/chorus gap: holding a couple of layers back in the
  // verse is what makes the chorus feel like it opens up.
  if (type === "verse") return 0.62;
  if (type === "chorus") return 1;
  if (type === "bridge") return pos < len / 2 ? 0.25 : 0.55;
  if (type === "outro") return 0.85 - 0.65 * (pos / span);
  return 0.7;
}

function totalSongBars(style) {
  return (style ? sectionsForStyle(style) : SONG_SECTIONS).reduce((s, sec) => s + sec.bars, 0);
}

function generateSongVariationOnce(rawStyle, plan) {
  const style = resolveGenerationStyle(rawStyle, plan);
  const barMetas = expandSongSections(sectionsForStyle(style));
  const bars = barMetas.length;
  const totalSteps = bars * STEPS_PER_BAR;
  const customChords = rawStyle.customChords;
  let barRootDegrees, barChordContexts;
  if (customChords && customChords.length) {
    barRootDegrees = barMetas.map(() => 0);
    barChordContexts = buildBarContextsFromChords(customChords, bars);
  } else {
    barRootDegrees = barMetas.map((_, i) => style.progression[i % style.progression.length]);
  }
  const priorityList = priorityInstrumentList(style);
  const totalInstruments = priorityList.length;

  const drumVariant = barMetas.map((b) => (b.pos === b.len - 1 ? "fill" : "main"));

  // Section energy: a chorus should be audibly bigger than its verse -
  // measurement showed most genres lifting under 15%, and one where the
  // chorus was actually quieter. Choruses now fire more of the authored
  // optional hits and verses hold back, which is what a real arrangement
  // does on top of simply switching layers in and out.
  const sectionDensity = { intro: -0.12, verse: -0.08, chorus: 0.28, bridge: -0.14, outro: -0.1 };
  const drumBars = barMetas.map((b, i) => buildDrumBar(style, drumVariant[i], sectionDensity[b.type] || 0));
  const chordVariety = pickChordVariety(style);
  const voiceState = {};
  const chordBars = barMetas.map((_, i) => buildChordBar(style, drumVariant[i], barRootDegrees[i], chordVariety, voiceState));

  const activeSets = barMetas.map((b) => {
    const count = Math.max(2, Math.round(layerFractionForBar(b) * totalInstruments));
    return new Set(priorityList.slice(0, count));
  });

  // Mask out instruments this bar hasn't "entered" yet, and mark a crash
  // right on the downbeat of every chorus - the classic arrangement hit
  // that announces a section has kicked into a higher gear.
  for (let i = 0; i < bars; i++) {
    for (const inst of style.drums.instruments) {
      if (!activeSets[i].has(inst)) drumBars[i][inst] = new Array(STEPS_PER_BAR).fill(false);
    }
    for (const inst of style.melodic.chordInstruments) {
      if (!activeSets[i].has(inst)) chordBars[i][inst] = new Array(STEPS_PER_BAR).fill(null);
    }
    if (barMetas[i].type === "chorus" && barMetas[i].pos === 0 && drumBars[i].crash !== undefined && activeSets[i].has("crash")) {
      drumBars[i].crash[0] = true;
    }
  }

  const instruments = {};
  for (const inst of style.drums.instruments) {
    instruments[inst] = [].concat(...drumBars.map((b) => b[inst] || new Array(STEPS_PER_BAR).fill(false)));
  }
  for (const inst of style.melodic.chordInstruments) {
    instruments[inst] = [].concat(...chordBars.map((b) => b[inst] || new Array(STEPS_PER_BAR).fill(null)));
  }
  const registerPlan = planRegisterJitters(style.melodic.monoInstruments);
  for (const inst of style.melodic.monoInstruments) {
    const melody = generateMonoMelody(REGISTER[inst], [], barRootDegrees, style.melody[inst], totalSteps, registerPlan[inst], inst === "bass");
    applyChorusHook(melody, inst, style, barMetas, barRootDegrees);
    for (let i = 0; i < bars; i++) {
      if (activeSets[i].has(inst)) continue;
      const start = i * STEPS_PER_BAR;
      for (let s = start; s < start + STEPS_PER_BAR; s++) melody[s] = null;
    }
    instruments[inst] = melody;
  }
  declutterMonoCollisions(instruments, style.melodic.monoInstruments);

  // Drop a riser into the bar right before every chorus - the classic
  // pre-drop build that announces a section change is coming, regardless
  // of whether "fx" happened to be in that bar's active instrument layer.
  if (instruments.fx) {
    for (let i = 1; i < bars; i++) {
      if (barMetas[i].type === "chorus" && barMetas[i].pos === 0) {
        instruments.fx[(i - 1) * STEPS_PER_BAR] = true;
      }
    }
  }

  // PRE-CHORUS DROP-OUT. One beat of near-silence immediately before the
  // chorus makes the return feel far bigger than it measures - the
  // cheapest and most reliable arrangement trick there is. Everything
  // cuts for the last beat of the bar before each chorus, leaving only
  // whatever riser is building underneath.
  for (let i = 1; i < bars; i++) {
    if (barMetas[i].type !== "chorus" || barMetas[i].pos !== 0) continue;
    const cutStart = (i - 1) * STEPS_PER_BAR + 12;
    for (const inst of Object.keys(instruments)) {
      if (inst === "fx") continue;
      for (let st = cutStart; st < i * STEPS_PER_BAR; st++) {
        instruments[inst][st] = DRUMS_SET.has(inst) ? false : null;
      }
    }
  }

  const structure = barMetas.map((b) => b.label);
  const automation = generateAutomation(style, barMetas);

  // FILTER SWEEPS. In club genres a resonant lowpass opening across a
  // section does the work that adding instruments does elsewhere - it is
  // the primary arrangement device, not an effect. Curves are shaped per
  // section: closed and rising through intros and builds, wide open in
  // choruses, pulled back for the bridge.
  const filterAutomation = {};
  if (FILTER_SWEEP_GENRES.has(style.id)) {
    const targets = [...(style.melodic.chordInstruments || []), ...(style.melodic.monoInstruments || [])]
      .filter((i) => i !== "bass");
    for (const inst of targets) {
      const pts = [];
      let last = null;
      barMetas.forEach((b, i) => {
        const span = Math.max(b.len - 1, 1);
        let v;
        if (b.type === "intro") v = 0.25 + 0.5 * (b.pos / span);
        else if (b.type === "verse") v = 0.55 + 0.3 * (b.pos / span);
        else if (b.type === "chorus") v = 1;
        else if (b.type === "bridge") v = 0.3 + 0.35 * (b.pos / span);
        else v = 0.75 - 0.5 * (b.pos / span);
        if (last === null || Math.abs(v - last) > 0.04 || i === barMetas.length - 1) {
          pts.push({ step: i * STEPS_PER_BAR, value: Math.max(0, Math.min(1, v)) });
          last = v;
        }
      });
      filterAutomation[inst] = pts;
    }
  }

  // The same mix hierarchy loop mode uses - one clear featured melodic
  // voice with the rest sitting behind it - applied on top of the
  // arrangement curves instead of being overwritten by them, since a
  // full song is exactly where an intentional lead matters most.
  const supporting = style.melodic.monoInstruments.filter((i) => i !== "bass");
  if (supporting.length > 1) {
    const feature = supporting[Math.floor(Math.random() * supporting.length)];
    for (const inst of supporting) {
      if (inst === feature) continue;
      if (automation[inst]) automation[inst] = automation[inst].map((pt) => ({ ...pt, value: pt.value * 0.78 }));
      else automation[inst] = [{ step: 0, value: 0.78 }];
    }
  }
  return { instruments, structure, barRootDegrees, automation, filterAutomation, articulation: style.articulation, genStyle: style };
}

// ---- Intentionality: compose several candidates, keep the best one ----
// Generating one random pattern and shipping it means the program never
// actually *tries* to make a good beat - it just accepts whatever the
// dice produced. Real producers write several versions of an idea and
// keep the one that works. This does the same thing: each request
// composes a handful of complete candidate beats, judges each one
// against criteria drawn from how music is actually evaluated, and
// returns the strongest. Everything scored here is a real musical
// property, not a proxy for novelty.

function isChordTone(relDegree) {
  const r = ((relDegree % 7) + 7) % 7;
  return r === 0 || r === 2 || r === 4;
}

function scoreVariation(style, v) {
  const inst = v.instruments;
  const bars = v.structure.length;
  const mono = style.melodic.monoInstruments || [];
  const chordal = style.melodic.chordInstruments || [];
  let score = 0;

  // 0. COMPLEXITY TARGET. The best-of-N search is the program's one real
  // chance to be deliberate, so the complexity setting is not just a set
  // of generation probabilities - it is something the search actively
  // aims at. Candidates are measured with the Longuet-Higgins & Lee
  // syncopation model and by onset density, and scored on how close they
  // land to what was asked for. Without this the dial would only nudge
  // the odds; with it, the program keeps looking until it finds a beat
  // that actually is that complex.
  {
    const cx = complexityProfile();
    const drumLanes = (style.drums.instruments || []).filter((d) => d !== "crash" && d !== "fx");
    const sync = patternSyncopation(inst, drumLanes);
    // Normalised distance from target, scored on a curve so near misses
    // are cheap and being wildly off is expensive.
    const syncErr = Math.abs(sync - cx.syncTarget) / 14;
    score += 26 * Math.max(0, 1 - syncErr * syncErr);

    let onsets = 0, slots = 0;
    for (const d of drumLanes) {
      const t = inst[d];
      if (!Array.isArray(t)) continue;
      for (const x of t) { slots++; if (x) onsets++; }
    }
    if (slots) {
      const density = onsets / slots;
      const densErr = Math.abs(density - cx.densityTarget) / 0.22;
      score += 18 * Math.max(0, 1 - densErr * densErr);
    }
  }

  // 1. HARMONIC COHERENCE - the single most important criterion. A note
  // sounding on a strong beat should belong to the chord underneath it;
  // dissonance on a weak beat is passing colour, dissonance on a
  // downbeat is a wrong note. Weighted so on-beat consonance dominates.
  let strongTotal = 0, strongConsonant = 0, weakTotal = 0, weakConsonant = 0;
  for (const i of mono) {
    const arr = inst[i] || [];
    for (let s2 = 0; s2 < arr.length; s2++) {
      const n = arr[s2];
      if (!n) continue;
      const bar = Math.floor(s2 / STEPS_PER_BAR);
      const rel = n.degree - (v.barRootDegrees[bar] || 0);
      const strong = s2 % 4 === 0;
      if (strong) { strongTotal++; if (isChordTone(rel)) strongConsonant++; }
      else { weakTotal++; if (isChordTone(rel)) weakConsonant++; }
    }
  }
  if (strongTotal) score += 34 * (strongConsonant / strongTotal);
  // Weak beats want *some* colour - all-chord-tone melodies are bland,
  // so the ideal sits near 65% rather than at 100%.
  if (weakTotal) score += 10 * (1 - Math.abs(weakConsonant / weakTotal - 0.65) / 0.65);

  // 2. BASS ANCHORS THE HARMONY. The bass note under a bar's downbeat
  // should be that chord's root - that is what makes a progression read
  // as the progression rather than as vague noise.
  if (inst.bass) {
    let downbeats = 0, onRoot = 0;
    for (let b = 0; b < bars; b++) {
      const n = inst.bass[b * STEPS_PER_BAR];
      if (!n) continue;
      downbeats++;
      if (((n.degree - (v.barRootDegrees[b] || 0)) % 7 + 7) % 7 === 0) onRoot++;
    }
    if (downbeats) score += 14 * (onRoot / downbeats);
    score += 6 * Math.min(1, downbeats / bars);
  }

  // 3. REGISTER SEPARATION. Two melodic voices occupying the same octave
  // fight each other; an arranger spreads them apart.
  const leads = mono.filter((i) => i !== "bass");
  if (leads.length > 1) {
    const means = leads.map((i) => {
      const ns = (inst[i] || []).filter(Boolean);
      return ns.length ? ns.reduce((a, n) => a + n.degree, 0) / ns.length : null;
    }).filter((x) => x !== null);
    if (means.length > 1) {
      let minGap = Infinity;
      for (let a = 0; a < means.length; a++)
        for (let b = a + 1; b < means.length; b++)
          minGap = Math.min(minGap, Math.abs(means[a] - means[b]));
      score += 8 * Math.min(1, minGap / 4);
    }
  }

  // 4. THE PARTS SHOULD INTERLOCK, NOT COLLIDE. Melodic voices landing on
  // the same step constantly is clutter; never overlapping at all is
  // incoherent. A modest overlap is what real ensemble playing produces.
  if (leads.length > 1) {
    const a = inst[leads[0]] || [], b = inst[leads[1]] || [];
    let both = 0, either = 0;
    for (let i = 0; i < a.length; i++) {
      const x = !!a[i], y = !!b[i];
      if (x || y) either++;
      if (x && y) both++;
    }
    if (either) score += 8 * (1 - Math.abs(both / either - 0.2) / 0.8);
  }

  // 5. DENSITY SWEET SPOT. Wall-to-wall onsets exhaust the ear; an empty
  // grid is not a beat. Target a moderate fill with real space in it.
  let onsets = 0, slots = 0;
  for (const k of Object.keys(inst)) {
    if (!Array.isArray(inst[k])) continue;
    for (const x of inst[k]) { slots++; if (x) onsets++; }
  }
  if (slots) {
    const fill = onsets / slots;
    score += 10 * Math.max(0, 1 - Math.abs(fill - 0.22) / 0.22);
  }

  // 6. SINGABLE RANGE + 7. CONTOUR. A hook stays inside about an octave
  // and moves mostly by step, leaping only occasionally.
  for (const i of leads) {
    const ns = (inst[i] || []).filter(Boolean).map((n) => n.degree);
    if (ns.length < 3) continue;
    const span = Math.max(...ns) - Math.min(...ns);
    score += 6 * Math.max(0, 1 - Math.abs(span - 7) / 9);
    let steps = 0, leapsBig = 0;
    for (let k = 1; k < ns.length; k++) {
      const d = Math.abs(ns[k] - ns[k - 1]);
      if (d > 0 && d <= 2) steps++;
      if (d >= 5) leapsBig++;
    }
    score += 6 * (steps / Math.max(1, ns.length - 1));
    score -= 5 * (leapsBig / Math.max(1, ns.length - 1));
  }

  // 8. THE HOOK SHOULD RECUR. A figure the ear can recognise on its
  // return is the difference between a hook and noodling.
  if (bars >= 3) {
    for (const i of leads.slice(0, 1)) {
      const arr = inst[i] || [];
      let same = 0;
      for (let k = 0; k < STEPS_PER_BAR; k++) {
        if (!!arr[STEPS_PER_BAR + k] === !!arr[3 * STEPS_PER_BAR + k]) same++;
      }
      score += 6 * (same / STEPS_PER_BAR);
    }
  }

  // 9. CHORDS SHOULD ACTUALLY SOUND. A chordal instrument that rolled
  // its way into near-silence leaves the harmony unstated.
  for (const i of chordal) {
    const c = (inst[i] || []).filter(Boolean).length;
    if (c > 0) score += 2;
  }

  // 10. THE CHORDAL PARTS MUST AGREE WITH THE PROGRESSION. Scoring only
  // the melody left the actual harmony unjudged - a comping part landing
  // on the wrong chord is far more damaging than a melody note doing it,
  // because the chord *is* the harmony rather than a line over it.
  let chTot = 0, chGood = 0;
  for (const i of chordal) {
    const arr = inst[i] || [];
    for (let s2 = 0; s2 < arr.length; s2++) {
      const n = arr[s2];
      if (!n || !n.degrees) continue;
      const bar = Math.floor(s2 / STEPS_PER_BAR);
      const root = v.barRootDegrees[bar] || 0;
      for (const d of n.degrees) { chTot++; if (isChordTone(d - root)) chGood++; }
    }
  }
  if (chTot) score += 16 * (chGood / chTot);

  // 11. LOW-END MUD. More than one voice sounding simultaneously down in
  // the bass register is the most common way an arrangement turns to
  // soup - real engineers keep exactly one instrument in that octave.
  let mudSteps = 0, lowSteps = 0;
  const allMelodic = [...mono, ...chordal];
  const stepCount = (inst[Object.keys(inst)[0]] || []).length;
  for (let s2 = 0; s2 < stepCount; s2++) {
    let lows = 0;
    for (const i of allMelodic) {
      const n = (inst[i] || [])[s2];
      if (!n) continue;
      const lo = n.degrees ? Math.min(...n.degrees) : n.degree;
      if (lo <= 7) lows++;
    }
    if (lows > 0) lowSteps++;
    if (lows > 1) mudSteps++;
  }
  if (lowSteps) score += 12 * (1 - mudSteps / lowSteps);

  // 12. HARMONY SHOULD BE VOICED, NOT CONSTANT. Some chord-voiced notes
  // give an arrangement body; every note voiced as a chord is a wall.
  let voiced = 0, monoNotes = 0;
  for (const i of mono) {
    for (const n of inst[i] || []) {
      if (!n) continue;
      monoNotes++;
      if (n.harmony) voiced++;
    }
  }
  if (monoNotes) {
    const ratio = voiced / monoNotes;
    score += 8 * Math.max(0, 1 - Math.abs(ratio - 0.3) / 0.45);
  }

  return score;
}

// ---- Refinement: rework one part at a time, keep what helps ----
// Choosing the best of several complete candidates is only half of how
// music actually gets made. The other half is iteration: a producer
// keeps the take, then reworks the bassline, then the hook, auditioning
// each change against everything else already in place. This does the
// same - it re-composes a single instrument's part several times and
// keeps the version that makes the WHOLE arrangement score best, then
// moves to the next instrument. Because every trial is judged in
// context, parts end up fitting each other rather than merely being
// individually acceptable.
function refineVariation(style, v, barRootDegrees, totalSteps, passes = 2) {
  const mono = (style.melodic.monoInstruments || []).filter((i) => style.melody[i] && Array.isArray(v.instruments[i]));
  if (!mono.length) return v;
  let bestScore = scoreVariation(style, v);
  const registerPlan = planRegisterJitters(mono);

  for (let pass = 0; pass < passes; pass++) {
    for (const inst of mono) {
      const original = v.instruments[inst];
      let bestPart = original;
      for (let attempt = 0; attempt < 4; attempt++) {
        const candidate = generateMonoMelody(
          REGISTER[inst], v.structure, barRootDegrees, style.melody[inst],
          totalSteps, registerPlan[inst], inst === "bass"
        );
        v.instruments[inst] = candidate;
        const sc = scoreVariation(style, v);
        if (sc > bestScore) { bestScore = sc; bestPart = candidate; }
      }
      v.instruments[inst] = bestPart;
    }
  }
  return v;
}

// learning.js is loaded separately, so a missing taste model must never
// break generation - it just means nothing has been learned yet.
function learnedBonus(style, v) {
  try {
    return typeof Taste !== "undefined" ? Taste.bonus(style, v) : 0;
  } catch (_) {
    return 0;
  }
}

// Candidate counts are tuned so selection is meaningful without making
// "Generate" feel slow - a full beat is only array math, so this stays
// well inside a single frame.
function generateVariation(rawStyle, bars) {
  const plan = planInstrumentation(rawStyle);
  let best = null, bestScore = -Infinity;
  for (let i = 0; i < 12; i++) {
    const cand = generateVariationOnce(rawStyle, bars, plan);
    // Each candidate now picks its own instrumentation, so it must be
    // scored and refined against the instruments it actually used - not
    // against the genre's nominal list, which may name parts this
    // candidate does not have.
    // The musical score, plus whatever the user's own ratings have taught
    // the program to prefer. With no ratings the learned term is exactly
    // zero, so behaviour is identical to before any feedback exists.
    const sc = scoreVariation(cand.genStyle || rawStyle, cand) + learnedBonus(cand.genStyle || rawStyle, cand);
    if (sc > bestScore) { bestScore = sc; best = cand; }
  }
  return refineVariation(best.genStyle || rawStyle, best, best.barRootDegrees, bars * STEPS_PER_BAR, 2);
}

function generateSongVariation(rawStyle) {
  const plan = planInstrumentation(rawStyle);
  let best = null, bestScore = -Infinity;
  for (let i = 0; i < 6; i++) {
    const cand = generateSongVariationOnce(rawStyle, plan);
    const sc = scoreVariation(cand.genStyle || rawStyle, cand) + learnedBonus(cand.genStyle || rawStyle, cand);
    if (sc > bestScore) { bestScore = sc; best = cand; }
  }
  return refineVariation(best.genStyle || rawStyle, best, best.barRootDegrees, best.structure.length * STEPS_PER_BAR, 1);
}
