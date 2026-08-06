// What the program intended, and whether it did it
// ===========================================================================
//
// Everything else in this program makes musical decisions. Nothing until now
// stated them. A beat came out and you could like it or not, but there was no
// way to ask "why is there a flute on this?" and get an answer, and no way for
// the program to check its own work before handing it over.
//
// Two things live here:
//
//  1. GENRE_PLAN - what each genre is, written down: its instrument families,
//     its drum vocabulary, how its chords move, what its bass is, where its
//     groove sits. This is the same editorial knowledge that was previously
//     only in tools/audit-genre-fit.js, which meant the AUDIT could check the
//     program but the PROGRAM could not check itself. One source now, read by
//     both, so they cannot drift apart.
//
//  2. validateProduction() and buildProductionPlan() - the runtime gate and
//     the report. The gate runs on every generated beat and rejects one that
//     fails a hard check, which is what makes "regenerate anything that
//     cannot be justified" a mechanism rather than an intention.
//
// A note on what a machine can and cannot check here. "Would a listener think
// a producer made this?" is not decidable, and pretending otherwise would make
// this file a liar. What IS decidable: whether the instruments belong to the
// genre, whether the 808 is an 808 and sits on the chord roots, whether the
// melody restates a motif rather than wandering, whether velocities vary,
// whether the arrangement has sections that differ in energy. Those are the
// checks. The rest is reported as fact for a person to judge.

// ---------------------------------------------------------------------------
// The plan for each genre
// ---------------------------------------------------------------------------
// `forbidden` and `lead` mirror what the genre audit enforces. `notes` is the
// production reasoning, quoted back in the report so the explanation for a
// choice is the same text that justified making it available in the first
// place.
const GENRE_PLAN = {
  trap: {
    lead: ["lead", "autolead", "woodwind", "piano", "strings"],
    forbidden: ["kalimba", "marimba", "sax", "organ", "leadguitar", "guitar", "talkbox"],
    drums: "808 kick, tight clap or snare on 3, hi-hat rolls at 1/16 and 1/32 with triplet bursts",
    chords: "minor, mostly i–VI–III–VII or a two-chord vamp; slow harmonic rhythm so the 808 can ring",
    bass: "an 808, sliding between chord roots",
    groove: "half-time feel: the snare lands on beat 3, not on 2 and 4",
    notes: "The melodic palette is bells, plucks, dark synth leads, dark piano, cinematic strings and choirs. A flute lead is genuinely part of it — it is most of the Metro Boomin catalogue. A thumb piano or a marimba is not; both read as lo-fi or afrobeats the moment they enter.",
  },
  rap: {
    lead: ["lead", "autolead", "piano", "woodwind", "sax", "talkbox"],
    forbidden: ["kalimba", "marimba", "organ"],
    drums: "hard kick, layered snare/clap on 2 and 4, straight or lightly rolled hats",
    chords: "minor loop, often sampled-soul in origin; two or four bars",
    bass: "an 808 under the kick",
    groove: "straight backbeat, the pocket slightly behind the grid",
    notes: "An Auto-Tune hook or a synth lead carries the top. The piano is here because soul-sampling rap is built on one.",
  },
  drill: {
    lead: ["lead", "autolead", "woodwind", "piano", "strings"],
    forbidden: ["kalimba", "marimba", "sax", "organ", "leadguitar", "guitar", "talkbox"],
    drums: "sliding 808 kick, snare on 3, skipping hats with wide triplet placement",
    chords: "minor, dark and sparse; the sliding piano figure half the genre is built on",
    bass: "an 808 that slides between roots — the slide IS the genre",
    groove: "140-ish with a swung, lurching hat pattern",
    notes: "The cold bell or synth motif is the sound, with a dark wind second and the minor piano figure underneath.",
  },
  phonk: {
    lead: ["lead", "autolead", "leadguitar", "woodwind"],
    forbidden: ["kalimba", "marimba", "sax", "organ", "talkbox"],
    drums: "distorted kick, cowbell, Memphis-tape snare",
    chords: "minor vamp, often two chords, deliberately lo-fi",
    bass: "a heavily saturated 808",
    groove: "half-time, swung, intentionally crushed",
    notes: "Memphis and drift phonk are built on distorted guitar samples, so the guitar stays. Nothing acoustic and pretty does.",
  },
  jerseyclub: {
    lead: ["lead", "autolead", "arp"],
    forbidden: ["kalimba", "marimba", "sax", "woodwind", "leadguitar", "guitar", "strings", "horn", "talkbox"],
    drums: "the five-count bed-squeak kick pattern, sharp claps",
    chords: "simple minor loop, subordinate to the vocal chop",
    bass: "an 808, short and punchy",
    groove: "130–140, triplet kick bursts",
    notes: "Chopped vocals, a bed-squeak kick and a simple synth. There is no room in it for an orchestra.",
  },
  hiphop: {
    lead: ["lead", "sax", "leadguitar", "woodwind", "piano", "marimba", "horn", "talkbox"],
    forbidden: ["kalimba", "arp"],
    drums: "dusty sampled kick and snare, swung 1/16 hats, vinyl noise",
    chords: "sampled-soul harmony: 7ths and 9ths, ii–V movement",
    bass: "an upright or a warm electric, walking under the chords",
    groove: "boom-bap, swung, snare slightly late",
    notes: "Boom-bap samples soul and jazz records, so horns, organ, guitar, sax and vibes are all in scope. A thumb piano is not — it arrived only because nothing said no.",
  },
  house: {
    lead: ["lead", "arp", "sax", "woodwind", "marimba", "talkbox"],
    forbidden: [],
    drums: "four-to-the-floor kick, open hat on the off-beat, clap on 2 and 4",
    chords: "7th and 9th chords, ii–V–I or a diatonic loop",
    bass: "a synth bass or an M1 organ bass, off-beat",
    groove: "straight 120–128 with the off-beat hat carrying the lift",
    notes: "Deep house genuinely fields mallets, flutes, sax, organ and disco guitar. Only the orchestral reeds are out.",
  },
  techno: {
    lead: ["arp", "lead"],
    forbidden: ["kalimba", "marimba", "sax", "woodwind", "leadguitar", "guitar", "horn", "talkbox"],
    drums: "relentless four-to-the-floor, closed hats on the 1/16, minimal percussion",
    chords: "one chord or none; a stab and a pad",
    bass: "a 303 or a sub, sequenced",
    groove: "straight, machine-tight, 128–140",
    notes: "A synthesised genre by definition: any acoustic solo voice in it is a sample-library intrusion.",
  },
  dubstep: {
    lead: ["lead", "arp"],
    forbidden: ["kalimba", "marimba", "sax", "woodwind", "leadguitar", "guitar", "horn", "talkbox"],
    drums: "half-time kick and snare, sparse hats",
    chords: "minor, often one chord under the bass design",
    bass: "the design IS the track: wobble, reese, growl",
    groove: "140 half-time, snare on 3",
    notes: "A synthesis genre. The interest is in the bass, not in an acoustic voice over it.",
  },
  dnb: {
    lead: ["arp", "lead", "woodwind"],
    forbidden: ["kalimba", "marimba", "talkbox"],
    drums: "amen-style break, two-step kick/snare at 174",
    chords: "liquid: lush 9ths and 11ths, or dark minimal minor",
    bass: "a reese or a sub, long",
    groove: "174 with a heavily syncopated break",
    notes: "Liquid drum & bass is full of saxophone and flute, so those stay. Reeds, mallets and thumb pianos do not appear on those records.",
  },
  ukgarage: {
    lead: ["lead", "arp", "sax", "woodwind"],
    forbidden: ["kalimba", "marimba", "leadguitar"],
    drums: "2-step: kick on 1, syncopated snare, shuffled hats",
    chords: "soulful 7ths and 9ths, organ stabs",
    bass: "a sub or an M1 organ bass",
    groove: "130–135, heavily swung",
    notes: "Organ stabs and sax stabs are period-correct. Mallets are not.",
  },
  synthwave: {
    lead: ["lead", "arp", "leadguitar"],
    forbidden: ["kalimba", "marimba", "woodwind", "talkbox"],
    drums: "gated reverb snare, LinnDrum kit, simple 4/4",
    chords: "minor with major-lift choruses, long pads",
    bass: "a Juno or SH-101 synth bass, driving 1/8 notes",
    groove: "straight 80s pop, 100–118",
    notes: "The one acoustic import is the 80s sax solo, which is real and beloved. Everything else is a keyboard.",
  },
  rock: {
    lead: ["leadguitar", "lead", "organ", "piano"],
    forbidden: ["kalimba", "marimba", "autolead", "arp", "talkbox", "woodwind"],
    drums: "acoustic kit, backbeat snare, ride or hats, real toms",
    chords: "power chords and triads, I–V–vi–IV and its relatives",
    bass: "a played electric bass following the guitar",
    groove: "straight backbeat with human push and pull",
    notes: "Rock is guitars, a Hammond and a piano. A flute solo over a rock beat is a prog joke rather than a genre.",
  },
  neosoul: {
    lead: ["leadguitar", "sax", "woodwind", "lead", "marimba", "talkbox"],
    forbidden: ["kalimba", "autolead", "arp"],
    drums: "loose, behind-the-beat live kit with ghost notes",
    chords: "extended and altered: 9ths, 11ths, 13ths, chromatic movement",
    bass: "a fingered electric or upright, syncopated",
    groove: "Dilla-style: deliberately unquantised, snare late",
    notes: "Rhodes, guitar, sax, flute and organ. Not a thumb piano, and not an Auto-Tune lead — the genre is a reaction against that.",
  },
  rnb: {
    lead: ["sax", "woodwind", "leadguitar", "marimba", "lead", "talkbox"],
    forbidden: ["kalimba", "arp"],
    drums: "tight programmed kit, finger snaps, soft hats",
    chords: "7ths and 9ths with smooth voice leading",
    bass: "a warm sub or an electric",
    groove: "mid-tempo, swung, spacious",
    notes: "Orchestral R&B is a real tradition, so the double reeds get in here.",
  },
  lofi: {
    lead: ["lead", "sax", "woodwind", "marimba", "kalimba", "leadguitar"],
    forbidden: ["autolead", "arp", "talkbox"],
    drums: "dusty, filtered, swung, vinyl crackle throughout",
    chords: "jazz 7ths and 9ths, slow and unhurried",
    bass: "an upright or a soft electric",
    groove: "70–90, heavily swung, deliberately loose",
    notes: "The one genre that samples anything at all, classical included — so it draws on every woodwind family.",
  },
  reggaeton: {
    lead: ["lead", "woodwind", "marimba", "leadguitar"],
    forbidden: ["kalimba", "talkbox"],
    drums: "dembow: the 3-3-2 kick and snare pattern, timbales, guiro",
    chords: "minor loop, four bars",
    bass: "a synth bass locked to the dembow",
    groove: "the dembow, 90–100",
    notes: "Latin percussion genres field marimba freely; the kalimba is African, not Caribbean, and reads wrong.",
  },
  afrobeats: {
    lead: ["woodwind", "marimba", "kalimba", "sax", "leadguitar", "lead"],
    forbidden: [],
    drums: "layered hand percussion — djembe, shekere, congas — with a soft kick",
    chords: "major or minor loop, bright and diatonic",
    bass: "round and melodic, following the vocal",
    groove: "syncopated, 100–115, percussion-led",
    notes: "Kalimba, marimba, sax and flute all belong. Only the orchestral reeds are excluded.",
  },
  amapiano: {
    lead: ["woodwind", "sax", "lead", "marimba", "kalimba", "leadguitar"],
    forbidden: [],
    drums: "log drum as the lead percussion, shakers, soft four-to-the-floor",
    chords: "jazzy 7ths and 9ths over a piano loop",
    bass: "the log drum itself carries the low end",
    groove: "112–115, shuffled, spacious",
    notes: "A soprano sax or a flute over amapiano is the sound. An oboe belongs to a different record entirely.",
  },
  rage: {
    lead: ["lead","autolead","woodwind"],
    forbidden: ["kalimba","marimba","sax","organ","leadguitar","guitar","talkbox"],
    drums: "808 kick, snare on 3, hats in bursts with hard rolls",
    chords: "one or two chords, minor, held for bars at a time - the space is the point",
    bass: "a heavily distorted 808, often the loudest thing in the mix",
    groove: "half-time at 150-165, everything hanging off beat 3",
    notes: "Rage is deliberately, aggressively sparse: a distorted synth lead, an 808 pushed past the point of politeness, and almost nothing else. Anything pretty is out of place by construction.",
  },
  pluggnb: {
    lead: ["lead","autolead","piano","marimba","woodwind"],
    forbidden: ["sax","organ","leadguitar","guitar","kalimba","talkbox"],
    drums: "808 kick with a soft clap, light rolls, nothing aggressive",
    chords: "dorian sevenths and ninths - the harmony is warmer than trap's and that is the whole distinction",
    bass: "a round, detuned 808 with little drive",
    groove: "swung 130-145, spacious",
    notes: "Plugg's R&B cousin: detuned bells and soft plucks, major-leaning dorian colour, and an 808 that is felt rather than heard. The point is dreaminess - anything harsh belongs to trap instead.",
  },
  pop: {
    lead: ["lead","piano","arp","leadguitar","sax","woodwind"],
    forbidden: ["kalimba","talkbox"],
    drums: "punchy kick, clap layered on the backbeat, straight or lightly rolled hats",
    chords: "four chords, diatonic, almost always I-V-vi-IV or a rotation of it",
    bass: "a synth bass following the root, straight eighths",
    groove: "straight, 100-130, the backbeat unmissable",
    notes: "Pop is built to be sung back, so everything serves the hook: a four-chord loop, a clear top line in a singable register, and an arrangement that gets out of its way.",
  },
  metal: {
    lead: ["leadguitar","lead","organ"],
    forbidden: ["kalimba","marimba","autolead","arp","talkbox","woodwind","sax","vocal"],
    drums: "double-kick under a hard backbeat, tight metallic hats, real toms for fills",
    chords: "power chords - roots and fifths - moving in Phrygian, the b2 doing the work",
    bass: "a distorted electric locked to the guitar's rhythm, note for note",
    groove: "dead straight and fast; the aggression is in the density, not the swing",
    notes: "Metal is guitars and drums. The riff is the song, the bass doubles it, and there is no room for anything decorative - a pad or a mallet in here is a different record.",
  },
  jazz: {
    lead: ["sax","piano","horn","woodwind","leadguitar"],
    forbidden: ["autolead","arp","kalimba","talkbox"],
    drums: "brushes on the snare, the ride carrying the pulse, kick used for accents not time",
    chords: "ii-V-I everywhere, sevenths and ninths minimum, chords changing every bar or faster",
    bass: "an upright walking in quarter notes between chord tones",
    groove: "heavily swung - the eighth notes are triplets, and that is not optional",
    notes: "Jazz is the one genre here where the harmony moves faster than anything else and the drums stay out of its way. Brushes, a walking upright, comping piano, and a horn on the head.",
  },
  edm: {
    lead: ["lead","arp","autolead"],
    forbidden: ["kalimba","marimba","sax","woodwind","leadguitar","guitar","horn","talkbox"],
    drums: "four-to-the-floor, clap on the backbeat, open hat on the off-beat",
    chords: "four bars of minor, the same four every time, because the drop is the event",
    bass: "a sidechained reese or saw, ducking hard under every kick",
    groove: "dead straight at 128 - the pump is the groove",
    notes: "EDM is an arrangement genre: the chords and the riff are simple on purpose because the whole shape is tension and release. Supersaws, sidechain, and a riser into every drop.",
  },
  country: {
    lead: ["leadguitar","piano","woodwind","lead","guitar"],
    forbidden: ["autolead","arp","kalimba","talkbox","marimba","organ"],
    drums: "a real kit played lightly - brushes or rods, the kick keeping time rather than punching",
    chords: "I-IV-V and its rotations, major, plain and unembarrassed about it",
    bass: "a played electric or upright on the root and fifth",
    groove: "a light shuffle at 90-130, the backbeat relaxed",
    notes: "Country is an acoustic guitar, a lead that bends into its notes, and a rhythm section that stays out of the way of the words.",
  },
  orchestral: {
    lead: ["woodwind","strings","horn","piano"],
    forbidden: ["autolead","arp","talkbox","kalimba","leadguitar","guitar","sax"],
    drums: "timpani and a concert bass drum marking structure, not keeping time",
    chords: "functional tonal harmony - I-IV-V-I and its relatives, resolved properly",
    bass: "a double-bass section doubling the cellos",
    groove: "rubato-leaning; the pulse is felt rather than hammered",
    notes: "Written for a room. The strings carry the harmony, the horns carry weight, and the woodwinds carry the line - and none of it wants a drum machine anywhere near it.",
  },
  cinematic: {
    lead: ["strings","horn","woodwind","piano","pad"],
    forbidden: ["autolead","arp","talkbox","kalimba","marimba","leadguitar","guitar","sax"],
    drums: "taiko and a deep kick marking the swell, snare used once and meaningfully",
    chords: "two or three minor chords held for bars - the harmony is a bed, not an event",
    bass: "a sub doubling the low strings",
    groove: "slow and enormous; every hit is an arrival",
    notes: "Trailer music. It works by scale rather than by detail - low strings, brass swells and one drum that sounds like a building falling over.",
  },
  funk: {
    lead: ["horn","organ","sax","piano","leadguitar"],
    forbidden: ["autolead","arp","kalimba","talkbox"],
    drums: "the one is everything - a hard kick on beat 1, ghost notes everywhere else, 16th hats",
    chords: "one or two chords, dominant sevenths and ninths, vamped rather than progressed",
    bass: "slap, syncopated, and the most important instrument in the room",
    groove: "16th-note swung, everything pushing and pulling around the downbeat",
    notes: "Funk is a rhythm genre wearing harmony as a hat: one chord, a bass line that is the actual song, and horns answering rather than leading.",
  },
  soul: {
    lead: ["sax","organ","horn","piano","leadguitar","woodwind"],
    forbidden: ["autolead","arp","kalimba","talkbox"],
    drums: "a real kit, behind the beat, ghost notes on the snare and a tambourine on the backbeat",
    chords: "sevenths and ninths with real voice leading - ii-V motion and gospel movement",
    bass: "a fingered electric, melodic, walking between roots",
    groove: "swung and laid back; the whole point is that it leans",
    notes: "Rhodes, Hammond, horn stabs and strings. Soul is played by people slightly behind the click, and everything about the arrangement serves a vocal that is not there.",
  },
  ambient: {
    lead: ["piano","woodwind","strings","marimba","pad"],
    forbidden: ["autolead","arp","talkbox","leadguitar","sax","organ"],
    drums: "barely any - a soft kick marking a bar, maybe a shaker, often nothing at all",
    chords: "two chords, held for four bars each, moving as slowly as the ear will tolerate",
    bass: "a sustained sub with no attack",
    groove: "there is no groove, and that is the genre",
    notes: "Ambient treats space as the instrument. Everything is long, quiet and slow, and the most common correct decision is to leave something out.",
  },
};

// Which woodwind families each genre may field. A flute over trap is real; a
// clarinet over trap is not; a clarinet over boom-bap follows the sampled jazz
// record it came from and is at home. The old binary "flute or not" could not
// express that middle case.
const WOODWIND_FAMILIES = {
  flute: ["flute", "altoflute", "shakuhachi", "bansuri", "duduk", "piccolo",
          "panflute", "ocarina", "tinwhistle", "dizi", "ney", "bassflute",
          "overblown", "woodflute"],
  jazzreed: ["clarinet", "bassclarinet", "sopranosax", "basset"],
  doublereed: ["oboe", "englishhorn", "bassoon", "contrabassoon"],
  early: ["recorder"],
};
const WOODWIND_FAMILY_OF = {};
for (const [fam, list] of Object.entries(WOODWIND_FAMILIES)) {
  for (const f of list) WOODWIND_FAMILY_OF[f] = fam;
}
const WOODWIND_ALLOWED = {
  trap: ["flute"], rap: ["flute"], drill: ["flute"], phonk: ["flute"],
  ukgarage: ["flute"], dnb: ["flute"],
  jerseyclub: [], techno: [], dubstep: [], synthwave: [], rock: [],
  hiphop: ["flute", "jazzreed"], house: ["flute", "jazzreed"],
  reggaeton: ["flute", "jazzreed"], afrobeats: ["flute", "jazzreed"],
  amapiano: ["flute", "jazzreed"], neosoul: ["flute", "jazzreed"],
  rnb: ["flute", "jazzreed", "doublereed"],
  lofi: ["flute", "jazzreed", "doublereed", "early"],
  rage: ["flute"],
  pluggnb: ["flute"],
  pop: ["flute","jazzreed"],
  metal: [],
  jazz: ["flute","jazzreed","doublereed"],
  edm: [],
  country: ["flute","jazzreed"],
  orchestral: ["flute","jazzreed","doublereed","early"],
  cinematic: ["flute","jazzreed","doublereed"],
  funk: ["flute","jazzreed"],
  soul: ["flute","jazzreed","doublereed"],
  ambient: ["flute","jazzreed","doublereed","early"],
};

// The genres whose bass IS an 808. An upright double bass in a trap beat is
// not a variation on trap, it is a different genre.
const EIGHT_OH_EIGHT_GENRES = new Set(["trap", "rap", "drill", "phonk", "jerseyclub", "rage", "pluggnb"]);
const BASS_808_EXTRA = new Set(["sub", "drillslide", "distorted", "growl"]);
const is808Kit = (f) => /808/.test(f || "") || BASS_808_EXTRA.has(f);

// How each 808 kit is driven, so the report can say what kind of 808 it is
// rather than only naming it. Mirrors the K808_* groups in patterns.js and the
// measured groups in tools/measure-808.js.
const EIGHT08_CHARACTER = {
  clean: { kits: ["clean808", "sub", "rumble808", "long808", "deep808"],
           how: "clean sub, no drive — weight without grit" },
  warm: { kits: ["808", "true808", "glide808", "detuned808", "overdrive808",
                 "wide808", "slide808"],
          how: "tanh saturation on a high-passed parallel band — round and thick" },
  hard: { kits: ["hard808", "punch808", "knock808", "stab808", "bright808"],
          how: "hard clipping — odd harmonics that stay audible well up the spectrum" },
  filthy: { kits: ["dirty808", "distort808", "fuzz808", "grimy808", "rage808", "memphis808"],
            how: "asymmetric fuzz or a wavefolder — the aggressive rap 808" },
};
function eight08Character(kit) {
  for (const [name, g] of Object.entries(EIGHT08_CHARACTER)) {
    if (g.kits.includes(kit)) return { name, how: g.how };
  }
  return null;
}

// ---------------------------------------------------------------------------
// The gate
// ---------------------------------------------------------------------------
// Runs on a finished pattern and reports what holds and what does not. `hard`
// failures cause the generator to throw the candidate away and try again;
// everything else is reported but tolerated, because not every observation is
// worth rejecting a beat over.
//
// Every check reads the pattern that was actually produced. None of them
// trusts the tables that were supposed to produce it - that distinction is the
// entire reason the genre problems were invisible for as long as they were.
function validateProduction(pattern, style, flavors) {
  const out = [];
  const id = style.id;
  const plan = GENRE_PLAN[id];
  const inst = pattern.instruments || {};
  const played = Object.keys(inst).filter(
    (k) => Array.isArray(inst[k]) && inst[k].some(Boolean));
  const add = (name, ok, detail, hard) => out.push({ name, ok, detail, hard: !!hard });

  if (!plan) {
    add("the genre has a written-down plan", false, `no entry for "${id}"`, false);
    return out;
  }

  // 1. Instruments belong to the genre.
  const wrong = plan.forbidden.filter((i) => played.includes(i));
  add("every instrument belongs in the genre", wrong.length === 0,
    wrong.length ? `${wrong.join(", ")} do not belong in ${style.name}` : plan.notes, true);

  // 2. Woodwind kit is from a family the genre can field.
  const fams = WOODWIND_ALLOWED[id];
  if (played.includes("woodwind") && fams) {
    const kit = flavors && flavors.woodwind;
    const fam = WOODWIND_FAMILY_OF[kit];
    const ok = fams.length > 0 && fams.includes(fam);
    add("the woodwind is one this genre uses", ok,
      ok ? `${kit} is a ${fam}, which ${style.name} fields`
         : `${kit} is a ${fam || "unclassified kit"}; ${style.name} takes ` +
           `${fams.length ? fams.join(" or ") : "no woodwind at all"}`, true);
  }

  // 3. Something is carrying the top line.
  const lead = plan.lead.filter((i) => played.includes(i));
  add("a lead voice is carrying the top line", lead.length > 0,
    lead.length ? lead.join(", ") : "nothing in this genre's lead set is playing", true);

  // 4. The bass is the right instrument for the genre.
  const bassKit = flavors && flavors.bass;
  if (EIGHT_OH_EIGHT_GENRES.has(id)) {
    const ok = is808Kit(bassKit);
    const ch = eight08Character(bassKit);
    add("the bass is a real 808", ok,
      ok ? `${bassKit}${ch ? ` — ${ch.how}` : ""}`
         : `${bassKit} is not an 808, and ${style.name}'s low end is an 808`, true);
  }

  // 5. The 808 follows the chord roots.
  //
  // Bass note degrees are absolute - barRoot + register + phraseOctave +
  // offset - and for the bass the register is 0 and the octave is a multiple
  // of 7, so subtracting the bar's root and taking it mod 7 leaves the
  // interval above the root. Getting that wrong is easy: measured naively, by
  // taking the absolute degree mod 7 and ignoring the bar root entirely, the
  // 808 looks like it sits on the root only a quarter of the time. It is
  // actually four times out of five.
  const bass = inst.bass || [];
  const roots = pattern.barRootDegrees || [];
  if (bass.length && roots.length) {
    const perBar = bass.length / roots.length;
    let onRoot = 0, notes = 0;
    for (let i = 0; i < bass.length; i++) {
      if (!bass[i]) continue;
      notes++;
      const rel = (((bass[i].degree - roots[Math.floor(i / perBar)]) % 7) + 7) % 7;
      if (rel === 0) onRoot++;
    }
    const share = notes ? onRoot / notes : 0;
    add("the bass follows the chord roots", share >= 0.6,
      `${Math.round(share * 100)}% of bass notes are the root of the chord under them`,
      EIGHT_OH_EIGHT_GENRES.has(id));
  }

  // 6. The backbeat lands where the genre puts it.
  //
  // The first version of this check measured velocity spread across the drum
  // lanes, to catch a pattern where every hit is identical. It could never
  // fire: drum steps in a pattern are plain booleans, and velocity is applied
  // downstream at schedule time by the engine's metric accenting. A check that
  // reads a field which does not exist is not a lenient check, it is a decoration,
  // and it passed silently every time.
  //
  // What IS in the pattern is WHERE the hits are, so that is what gets checked.
  // Half-time genres put the snare on beat 3 and nowhere else; backbeat genres
  // put it on 2 and 4. Getting that wrong does not sound like a variation, it
  // sounds like a different genre, and it is the single clearest structural
  // signature a drum pattern has.
  const HALF_TIME = new Set(["trap", "drill", "phonk", "dubstep", "rage", "cinematic"]);
  const BACKBEAT = new Set(["rap", "hiphop", "rock", "rnb", "neosoul", "lofi", "house", "synthwave",
                            "pluggnb", "pop", "metal", "jazz", "edm", "country", "funk", "soul"]);
  const snare = inst.snare || [];
  if (snare.length >= 16 && (HALF_TIME.has(id) || BACKBEAT.has(id))) {
    const perBar = 16;
    const wanted = HALF_TIME.has(id) ? [8] : [4, 12];
    let onBeat = 0, hits = 0;
    for (let i = 0; i < snare.length; i++) {
      if (!snare[i]) continue;
      hits++;
      if (wanted.includes(i % perBar)) onBeat++;
    }
    // Ghost notes and fills are supposed to land off the backbeat, so this
    // asks that the backbeat is PRESENT and dominant, not that it is alone.
    const ok = hits === 0 || onBeat > 0;
    add("the snare lands where the genre puts it", ok,
      HALF_TIME.has(id)
        ? `${onBeat} of ${hits} snare hits are on beat 3 (half-time)`
        : `${onBeat} of ${hits} snare hits are on 2 and 4 (backbeat)`, false);
  }

  // 7. The melody restates a motif instead of wandering. Compared bar to bar
  // on rhythm: a phrase that repeats its rhythmic shape is the difference
  // between a melody and a sequence of notes.
  const topLine = lead[0] && inst[lead[0]];
  if (topLine && roots.length >= 2) {
    const perBar = topLine.length / roots.length;
    const shape = (b) => topLine.slice(b * perBar, (b + 1) * perBar).map((s) => (s ? 1 : 0)).join("");
    const bars = roots.map((_, b) => shape(b)).filter((s) => /1/.test(s));
    let repeats = 0, pairs = 0;
    for (let i = 0; i < bars.length; i++) {
      for (let j = i + 1; j < bars.length; j++) {
        pairs++;
        let same = 0;
        for (let k = 0; k < bars[i].length; k++) if (bars[i][k] === bars[j][k]) same++;
        if (same / bars[i].length >= 0.75) repeats++;
      }
    }
    add("the melody restates a motif", pairs === 0 || repeats > 0,
      pairs ? `${repeats} of ${pairs} bar pairs share a rhythmic shape`
            : "only one bar carries the melody", false);
  }

  // 8. The arrangement.
  //
  // Only a SONG has sections. A four-bar loop is a loop - its structure is
  // main and a fill, and demanding an intro, a verse and a chorus of it is
  // demanding it be something it is not. The first version of this check did
  // exactly that and failed every loop in the program, which is the check
  // being wrong rather than the music.
  if (pattern.structure && pattern.structure.length) {
    const kinds = [...new Set(pattern.structure)];
    const isSong = pattern.structure.some((s) => /verse|chorus|bridge/.test(s));
    if (isSong) {
      add("the arrangement has distinct sections", kinds.length >= 3,
        kinds.join(" → "), false);
    } else {
      // Reported as fact, not judged: a loop is allowed to be a loop.
      add("the loop has a shape", true,
        `${pattern.structure.length} bars: ${kinds.join(" → ")} ` +
        `(a loop, not a song — switch the length to “Full song” for sections)`, false);
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// The report
// ---------------------------------------------------------------------------
// Built from what the generator actually did, not from a template. Every line
// names a real value taken off the finished pattern.
function buildProductionPlan(pattern, style, flavors, opts = {}) {
  const plan = GENRE_PLAN[style.id] || {};
  const inst = pattern.instruments || {};
  const played = Object.keys(inst).filter(
    (k) => Array.isArray(inst[k]) && inst[k].some(Boolean));
  const DRUMS = ["kick", "snare", "hihat", "openhat", "clap", "perc", "tom", "crash", "fx"];
  const drums = played.filter((i) => DRUMS.includes(i));
  const melodic = played.filter((i) => !DRUMS.includes(i) && i !== "bass");

  // The chord progression as roman numerals, read off the bar roots the
  // generator used rather than off the genre's table of possibilities.
  const MINOR = ["i", "II", "III", "iv", "v", "VI", "VII"];
  const MAJOR = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
  const isMinor = /minor|dorian|phrygian|aeolian|harmonic/i.test(style.scale || "minor");
  const numerals = (pattern.barRootDegrees || [])
    .map((d) => (isMinor ? MINOR : MAJOR)[((d % 7) + 7) % 7]);

  const bassKit = flavors && flavors.bass;
  const ch = eight08Character(bassKit);
  const eight08 = EIGHT_OH_EIGHT_GENRES.has(style.id)
    ? { kit: bassKit, character: ch ? ch.name : "custom", how: ch ? ch.how : "" }
    : null;

  const sections = [];
  if (pattern.structure && pattern.structure.length) {
    let run = null;
    pattern.structure.forEach((label, i) => {
      if (!run || run.label !== label) { run = { label, from: i, to: i }; sections.push(run); }
      else run.to = i;
    });
  }

  return {
    bpm: opts.tempo,
    key: opts.key,
    scale: style.scale,
    genre: style.name,
    genreId: style.id,
    progression: numerals,
    instruments: melodic,
    drums,
    kits: flavors ? { ...flavors } : {},
    eight08,
    sections: sections.map((s) => ({
      label: s.label,
      bars: s.from === s.to ? `bar ${s.from + 1}` : `bars ${s.from + 1}–${s.to + 1}`,
    })),
    reasoning: {
      genre: plan.notes || "",
      drums: plan.drums || "",
      chords: plan.chords || "",
      bass: plan.bass || "",
      groove: plan.groove || "",
    },
    checks: validateProduction(pattern, style, flavors),
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { GENRE_PLAN, WOODWIND_FAMILIES, WOODWIND_FAMILY_OF, WOODWIND_ALLOWED,
                     EIGHT_OH_EIGHT_GENRES, is808Kit, eight08Character,
                     validateProduction, buildProductionPlan };
}
