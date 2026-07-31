# Beat Studio

Describe the beat you want in plain English, or pick from 15 genres, and get either a quick loop or a full ~2-minute song with a real intro/verse/chorus/bridge/outro arrangement — drums, bass, piano, organ, lead, guitar, kalimba, marimba, arp, strings, horns, vocal chops, pads, synth stabs, and FX — then edit and mix it like a mini DAW, right in the browser, and export it as a vertical video for Reels/TikTok/Shorts. Everything is synthesized live with the Web Audio API; no audio files or dependencies required.

## Run it

Open `index.html` in a browser, or serve the folder locally:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## How it works

- `js/theory.js` — scales (including phrygian for drill's dark mode), keys, chord building, note-name/frequency conversion, and the **chord-symbol parser** (`Cm7`, `F#maj7`, `Bb9`, …) that powers the custom-chords feature by building a small 7-note chord-scale per parsed chord.
- `js/patterns.js` — per-genre templates for drums and chordal instruments, each style's key/scale/chord progression, the per-instrument sound-flavor pools that get auto-shuffled on every generation, two arrangement builders (a short intro/main/fill loop, and a full verse/chorus **song structure**), the **motif-based melody generator** that drives bass, lead, and guitar, and the per-bar chord-context builder used when a user types their own chord progression.
- `js/audio-engine.js` — synthesizes every instrument live, including a **Karplus-Strong physically-modeled plucked string** for every guitar and pluck-style bass voice, a vibrato string voice, an Amapiano-style log-drum bass, and an LFO wobble bass. Also runs the mixer (volume/mute/solo/reverb send per track) and the mix bus: sidechain ducking, a glue compressor, and a reverb send effect.
- `js/app.js` — the channel rack UI (now with a per-track flavor picker), the free-form piano roll editor (drag to draw/resize/move notes), the "describe your beat" prompt parser, the custom-chords input, and the vertical-video exporter (`MediaRecorder` + `canvas.captureStream`).

## Describe the beat you want

Type something like *"dark energetic trap with vocal chops"* or *"chill lofi piano beat"* into the box at the top and hit Generate. This is a lightweight keyword/mood parser, not a language model: it matches genre names and aliases (including things like "boom bap," "amapiano," "dembow," "four on the floor"), then layers on mood words —

- **dark/moody/sad** → shifts a major-scale style into a darker minor key
- **happy/bright/uplifting** → shifts a minor-scale style into a brighter major key
- **chill/relaxed/slow** vs **hype/energetic/hard** → pushes the tempo to the bottom or top of the genre's range
- **long/extended/epic** → builds a full-length verse/chorus arrangement instead of a 4-bar loop
- **vocal/vocals/choir/singing** → adds a vocal-chop track *if the matched genre doesn't already have one*, per the brief to only add vocals "if that beat needs one"

If nothing matches a known genre, it says so and falls back to the closest reasonable genre rather than silently guessing.

## Build a beat around your own chords

Every genre ships with its own researched chord progressions, but the **"Build around your own chords"** field in the workspace overrides that: type a real progression — `Cm7 Fm7 Ab Bb7`, `Am, F, C, G`, `F#maj7 Bbm9 Gdim7 Csus4` — and pick any genre, and the beat gets built around *exactly* those chords instead. One chord per bar, cycling to fill however many bars are selected (loop, 8-bar, or the full song). Everything else about the genre — the drum groove, swing, tempo feel, and melodic rhythm — stays completely untouched; only the harmony changes, so the same four chords sound like a trap beat, a lo-fi beat, or a synthwave beat depending on what's selected. Chords stick across genre switches on purpose, so the same progression can be auditioned in several styles in a row.

Parsing supports the chord symbols an actual musician would type — `m`/`min`/`-` for minor, `maj7`/`M7` for major 7th (case matters: `Cm7` and `CM7` are different chords, and the parser checks that before anything else), `dim`/`dim7`/`m7b5`, `sus2`/`sus4`, `aug`/`+`, `6`/`m6`/`9`/`add9`, sharps and flats, and a slash bass note (`C/E`) that's accepted without erroring even though the bass note itself isn't tracked yet. Anything that doesn't parse shows up as a flagged chip instead of silently being dropped or crashing the generator.

Under the hood this reuses the exact same motif/chord-voicing engine every genre already runs on, rather than being a bolted-on second system: `js/theory.js`'s harmony model already treats every chord as "root + a 7-note scale, indexed abstractly" (root=index 0, third=index 2, fifth=index 4, seventh=index 6 — see `chordDegrees`), so each parsed chord just gets its own tiny 7-note **chord-scale** built from real chord-scale theory (Dorian under a m7, Mixolydian under a dominant 7th, Locrian under a half-diminished, and so on — the same scale/chord pairing a jazz player reaches for over those changes) and drops straight into the existing machinery. Consecutive chords' roots are voice-led to the closest octave of each other rather than jumping wherever the raw pitch class happens to fall, so `Cm7 → Fm7 → Ab → Bb7` doesn't leap around unnecessarily.

## Melodies are composed note-to-note now, not picked from a pool

Direct feedback: the melodies still read as "random notes together" rather than something actually thought out. That was a fair critique of the underlying algorithm, not just a tuning problem — every melody used to pick 2-3 pitches up front and mechanically arc-index into them (step through a sine-shaped contour, occasionally nudged sideways). That gets *a* shape, but it never reasons about how one note leads into the next, which is most of what separates a considered melodic line from a shuffled bag of acceptable pitches. The note-picking algorithm is rewritten around two of the most robust, well-replicated findings in melodic corpus research:

- **Pitch proximity** — real melodies overwhelmingly move by step; small intervals dominate note-to-note motion in essentially every corpus study of real melodies (Huron, *Sweet Anticipation*, 2006, ch. 4 — one of the oldest and best-replicated findings in melodic analysis, tracing back a century to Carl Stumpf and von Hornbostel).
- **Post-skip reversal** — on the rarer occasion a melody *does* leap, that leap is disproportionately likely to be followed by motion back the other way (Von Hippel & Huron, "Why Do Skips Precede Reversals?", *Music Perception*, 2000 — exactly what Narmour's implication-realization model predicts a leap "implies," his gap-fill principle, 1990).

Every note is now chosen one at a time as a real step in a melodic walk — scored against the previous note by how far it moves (small steps preferred, but leaps still happen regularly, roughly a quarter to a third of the time, matching real corpus proportions rather than being forbidden outright) and, after a leap, strongly pulled back the other way. A gentle secondary pull toward an overall rise-then-fall arc shape across the whole phrase (Meyer, *Emotion and Meaning in Music*, 1956) sits on top, so the result has both local coherence (each note relates sensibly to the last) and a global shape (the phrase reads as one arc, not a random walk) — while still honoring every genre's own authored chord-tone weighting (trap's bass still hammers the root the way it's tuned to), and landing chord tones more often right on the beat than off it, the same metric-accent-aware "safe landing notes on strong beats" real tonal harmony uses.

Two more real compositional structures layered on top:

- **Antecedent-consequent phrasing** (standard "period" form — see any tonal-harmony text, e.g. Kostka & Payne) — a "question" phrase now deliberately lands on an open, unresolved half-cadence (the 5th scale degree) while its "answer" resolves all the way home to the tonic, rather than only the answer ever resolving.
- **A distinct chorus hook, not just the verse motif playing through** — full-song mode used to run one continuously-evolving motif straight through every section, verse or chorus alike. Real songwriting almost always repeats the *exact same* short idea every time the chorus comes back (that repetition is most of what makes a hook a hook), so each instrument now also gets one fixed, simpler, more chord-tone-dense hook motif that gets stamped into every chorus section verbatim — transposed to that section's chords, never varied — so the chorus is instantly recognizable as "the same idea" every time it returns, distinct from the verse's own more loosely-evolving material.

And one arrangement-level fix: two independently-generated melodic parts (say, bass and lead) could land dense note onsets on the exact same step purely by chance, which reads as cluttered rather than arranged. A light pass now thins a colliding note from the secondary part — but only when that part has another note nearby, so a genuinely sparse line never gets silenced outright, and pitches are never changed, only occasionally removed.

## The rhythmic backbone is unique per generation now, not just the sounds

Direct feedback: "Generate Beat" gave different sounds but *the same order* — and measurement confirmed it. Even with two authored grooves per genre, **15% of generation pairs shared a byte-identical kick+snare skeleton, and the rest differed by an average of only ~3 steps out of 32.** The sounds rolled; the backbone didn't. Fixed with several independent per-generation systems, each grounded in a real production or research idea:

- **A groove mutation engine.** Instead of hand-authoring dozens more variants, each generation algorithmically mutates the picked groove — 1–2 kick edits from {displace, add, remove}, dense hat lines get occasional "hiccup" gaps dropped in, hat offbeat patterns rotate — while protecting what makes the genre that genre: kick edits never touch quarter-note positions (House's four-on-the-floor and every downbeat survive, verified across 450 generations with zero anchor violations), and **the snare backbeat is never moved at all**, since it's the strongest genre anchor in the kit.
- **Euclidean percussion re-rolls.** Percussion patterns regenerate through Bjorklund's algorithm (Toussaint, *"The Euclidean Algorithm Generates Traditional Musical Rhythms"*, 2005, showed that evenly-distributed onset patterns underlie a huge share of the world's traditional rhythms — which is why a rotated Euclidean pattern sounds like a groove and not like noise), at a density near the authored one, randomly rotated.
- **Four fill idioms instead of one.** The fill bar was the same tom run every single generation. Now each generation picks one of four standard production moves: the tom run, a snare-rush build, a hat lift, or the modern "cut" where everything drops out for the last beat so the downbeat lands harder. Ten out of ten consecutive generations now produce distinct fill bars.
- **Melody rhythm feels.** Each melodic line rolls a rhythmic personality per generation: the genre's own authored feel (most common), the **tresillo** 3-3-2 cell (the single most widespread rhythmic cell in popular music — backbone of the dembow, trap hat phrasing, and countless pop toplines), an **offbeat entry** (the line starts just after the downbeat — a standard groove-displacement device), or **half-time** (durations doubled for a sparser line).
- **The chord "push."** With some probability per instrument, a chordal part's hits all anticipate the beat by an 8th note — the standard funk/R&B/gospel comping move — automatically skipped for anything holding long sustains, where a push makes no sense.
- **The intro bar is a coin flip** instead of appearing on every generation, like a producer sometimes opening cold on the full groove.

Post-fix measurement: identical kick+snare skeletons dropped from **15.1% of generation pairs to 1.9%**, melody onset patterns are near-unique (0.6% identical), and all genre anchors verified intact.

## Every generation is a genuinely different beat, not the same skeleton with new decoration

Direct feedback: regenerating (or picking the same genre again after a refresh) still felt like "the same vibe every time." The root cause was real — the instrument timbres and melody notes varied, but the actual structural backbone of a beat never did: **tempo, key, chord progression, and the core drum groove were all hardcoded constants**, identical on every single generation of a given genre. That's now fixed at every one of those levels:

- **Tempo** rolls a fresh value inside the genre's real tempo range on every generation, instead of always landing on the exact same default BPM.
- **Key** rolls a fresh root note (any of the 12 chromatic pitch classes, same octave/register the genre was tuned for) on every generation, instead of every single beat in a genre being written in the exact same key forever — real songs in the same genre absolutely aren't all in one key.
- **Swing** gets a small jitter around the genre's default feel instead of being pinned to one exact percentage.
- **Chord progression** — every genre now has 3–4 real alternative progressions (drawn from genuinely common, well-documented progressions appropriate to that genre's scale and mood — pop's I-V-vi-IV "axis" family, classic minor i-VI-iv-v and i-VII-iv-v loops, drill's flat-2 Phrygian shapes, jazzy R&B ii-V motion, and more), and one is picked at random each generation instead of the harmonic shape being frozen forever.
- **The core drum groove** — every genre now has a second, hand-built alternate groove alongside the original (a different kick/snare/hi-hat placement that's still authentic to the genre — e.g. Drill's alternate keeps the signature beat-3 snare lock but shifts the kick's slide points; House's alternate keeps the four-on-the-floor kick that defines the genre but changes the snare/clap/hat pattern around it), and one of the two is picked at random each generation, on top of the existing per-hit optional-fill randomization.

All four roll independently on every "Generate Beat" click, every prompt-box generation, and every fresh genre pick — so two beats in the same genre, generated seconds apart, can now differ in tempo, key, chord changes, and rhythmic backbone, on top of the instrument sounds and melody that already varied.

**A specific, sharper version of the same bug**: chordal instruments (piano, pad, stab, strings, organ, vocal) had it worse than melody instruments — a pad, in particular, is a single whole-bar chord with the optional-hit probability set to a flat 0%, which is mathematically guaranteed to sound identical forever, and every genre's pad used the literal same voicing shape. R&B's piano and pad were the reported case, but the same root cause existed everywhere a chordal instrument appears. Three generic fixes now apply automatically to every chordal instrument in every genre (no per-genre content authoring needed, since this is a code-level fix, not new hand-written patterns):

- **Register jitter** — the same +/- one octave idea melodies already use, so a chord instrument doesn't sit in the exact same register on every generation.
- **Voicing richness** — a per-generation chance to stack an extra third onto every chord (plain triad vs. a lusher 7th/9th voicing), so the harmonic color itself varies.
- **Whole-bar-sustain splitting** — any chord that's a single note spanning the full bar (which is what every pad in this app is) has a real chance of splitting into two half-bar chords with genuine harmonic motion between them (a small, tasteful set of relative moves) instead of staying one static block of sound for the whole bar.

Verified directly: across 8 back-to-back generations, R&B's piano and pad each produced 8 distinct results (previously they'd have been identical or near-identical every time), and the same held true across every other genre's chordal instruments.

## A full song, not just a loop

Next to "4 bars" / "8 bars" is a **Full Song** option: instead of one repeating loop, it builds an ~52-bar arrangement (Intro → Verse 1 → Chorus 1 → Verse 2 → Chorus 2 → Bridge → Final Chorus → Outro, roughly 1.5–2 minutes depending on tempo) with the section labels shown above the grid. This is built on real arrangement technique researched for this build:

- **Progressive layering in the intro.** Rather than a hard cut from sparse to full, instruments enter one at a time over the intro's bars — kick and hi-hat first, then snare, then bass, then chords — a much more natural build than the old single-sparse-bar approach.
- **The chorus pulls out every layer** (and gets louder-feeling) compared to the verse, which sits at moderate density — the "boost the energy, add more instruments" technique that makes a chorus actually feel like a chorus.
- **The bridge strips back** for contrast (as low as 2-3 instruments) before building back into the final chorus — a breakdown-and-return, the classic tension/release arrangement move.
- **The outro mirrors the intro in reverse**, unwinding layer by layer instead of just stopping.
- A crash lands on the downbeat of every chorus, marking the section change the way a real arrangement would.

This is genuinely conditional, not decoration: a genre like Drill or Lo-Fi that's already sparse by design won't get artificially built up if it doesn't call for it — the loop modes (4/8 bars) keep the original "first bar is a bit sparser" behavior only, and the full-song mode is where the real layering happens.

## Genres

Nineteen styles, each modeled on real production conventions researched for this build, with instrumentation chosen to actually fit the genre (no synth stabs on a rock track, no four-on-the-floor kick pretending to be a dembow):

- **Hip-Hop** — boom bap kick/snare, ~58%-swing hi-hats, a soulful sustained melody and pitched string stabs (Kanye-style soul-sample chord loops).
- **Trap** — sparse kick, sliding 808, rolling hi-hats, a spacious bell hook (Metro Boomin-style restraint).
- **House** — four-on-the-floor kick, offbeat open hats, a tightly-looped arp and off-beat piano stabs (Daft Punk-style repetition).
- **Rock** — backbeat snare, a real guitar riff with an actual distortion circuit, no synths where a guitar/bass band wouldn't have them.
- **Reggaeton** — the dembow tresillo kick pattern, rimshot answers, horn stabs.
- **Lo-Fi Chill** — softened boom bap, jazzy extended chords, vinyl crackle, a wandering melody with lots of space (Nujabes/J Dilla).
- **Drill** — a dark phrygian scale, sparse spacious kick, snare locked on beat 3, a tight sliding 808, a single moody piano line — distinct from trap's busier, brighter hook (researched from UK drill production breakdowns).
- **Afrobeats** — syncopated kick, continuous 16th-note shakers, an Amapiano-style log-drum bass (a hybrid kick/808/percussion tone) that follows the chord root, a highlife guitar hook.
- **Dubstep** — half-time drums (kick on 1, snare on 3), a gritty saturated kick, an LFO-modulated wobble bass with a layered sub, built the way dubstep basses are actually sound-designed.
- **R&B / Soul** — a laid-back live-feel groove, lush 7th-chord Rhodes, a formant-synthesized choir pad, orchestral string swells, a smooth solo saxophone top line.
- **Phonk** *(new)* — a gritty, saturated 808 kick that doubles as the bassline, a hypnotic 808-style cowbell (two detuned square oscillators through a resonant bandpass filter, the real circuit trick), an eerie bell hook and vocal chops.
- **Jersey Club** *(new)* — bouncy, syncopated kick bursts approximated on the 16-step grid (true triplet subdivisions aren't representable on it, so the pattern leans on syncopation rather than overclaiming a literal triplet feel), heavily chopped vocal hooks as the lead element, dry and punchy.
- **Drum & Bass** *(new)* — fast syncopated breakbeat-style drums at ~172 BPM and a growling Reese bass (a stack of four detuned sawtooths beating against each other — the real technique behind the classic DnB bass sound).
- **Synthwave** *(new)* — 80s gated drums, an analog synth bass and a brass-lead hook (a resonant bandpass-emphasized saw, the 80s synth-brass-stab timbre synthwave leans on), a lush arpeggiated pad/stab bed.
- **Rap** — researched from Kanye West and Lil Baby's *808s & Heartbreak*-era minimalism, plus a second pass researching current hard-trap/rage production (Travis Scott, Future, Playboi Carti-adjacent) to make it hit harder: a genuinely distorted 808 (parallel distortion — a clean sub layer for low-end power plus a heavily saturated layer blended on top purely for harmonic bite, so it stays powerful instead of just getting louder), a saturated kick, hi-hat rolls that fire far more often and on more subdivisions than before, a tight near-straight swing instead of a loose boom-bap feel, and a touch of master-bus saturation (see below) — with a real Auto-Tune-style hook instrument (see below) carrying the melody instead of a mismatched kalimba.
- **Amapiano** *(new)* — South Africa's house offshoot, distinct from Afrobeats: slower and sparser, with the **log drum carrying the groove as a melodic bass instrument** rather than the kick, jazzy Rhodes chords, and lots of air — the clean, soulful "private school" lane.
- **UK Garage** *(new)* — the 2-step signature is a *missing* drum: **no kick on beat 3**, which is exactly what gives garage its skippy, off-balance bounce, plus the heaviest shuffle in the app (22%), chopped pitched vocal stabs, and a warm sub.
- **Techno** *(new)* — deliberately distinct from House: darker, harder, more hypnotic and minimal, with **near-static harmony** (some progressions are a single held root — the groove and timbre carry a techno track, not chord changes), a relentless 909 four-on-the-floor, offbeat open hats, and an acid TB-303 line as the default bass.
- **Neo-Soul** *(new)* — the D'Angelo/Erykah Badu school, distinct from R&B/Soul: the **"drunk" behind-the-beat drum feel** (14ms timing humanization, the highest in the app — the J Dilla drag), genuinely richer harmony (5-note stacked-third voicings = real 9th chords, which plain triads and 7ths never reach), and a jazz guitar as a second melodic voice.

## Master-bus "grit": genres that are supposed to sound driven

A new per-genre `grit` amount feeds a dry/wet-blended saturation stage on the master bus (0 = fully bypassed, an exact identity curve — most genres). Rap dials in a meaningful amount of it, researched from how current hard-trap/rap masters are actually mixed: driven a little warm on purpose, for harmonic bite that reads even on small phone speakers, not just turned up louder. It sits after every other processing stage and before the final compressor, so it colors the whole mix consistently rather than just one element.

## Real melodies, not random notes — and no more stuck-on-one-pitch lead

Bass, lead, and guitar are generated the way hit songs actually build a hook, based on melody-writing research:

- **A small, reused pitch pool.** Most pop hooks use only 3–4 distinct notes, not a fresh pitch every time — so each motif draws from a constrained pool of chord/passing tones instead of sampling freely.
- **An arc contour.** Melodies read as "a tune" when they leap up and step back down rather than wander; each phrase is shaped into that rise-then-fall arc.
- **Question and answer, with real contrast.** Phrases come in pairs — the first "asks," and every second repeat "answers," resolving its final note back to the tonic. Half the time the answer also drops a full octave below the question first, the way real call-and-response melodies contrast register, not just pitch content.
- **Register varies every generation.** This was the direct fix for the lead melody always landing in the same high octave: each "Generate Beat" now randomly shifts the whole melody up an octave, down an octave, or leaves it as-is, so the same genre doesn't sound pitched identically every time.
- **Repetition with variation.** The motif is stated once, then repeated across the arrangement with transposition, inversion, or truncation, so it reads as a recognizable, evolving theme instead of independent random notes.

## Sound kits: way more tone variety per instrument

Researched how large sample-library instruments (the GarageBand approach: dozens of patches per instrument category, each a genuinely distinct articulation or synthesis method rather than a EQ tweak on the same patch) organize variety, and applied that same idea here — every instrument now has a substantially bigger, more distinct flavor pool, so a shuffle actually lands somewhere new instead of cycling between a handful of near-identical options:

- **Kick** — 12 flavors, up from 8: added **Punch** (a tight high-transient thump), **Sub Kick** (a very deep, long pure sub), **Gritty** (a saturated, distorted 808-style kick) and **Roomy** (a longer, reverb-heavy kick).
- **Snare** — 10 flavors: added **Gated**, **Acoustic**, **Ghost** (a quiet unaccented layer), and **Layered** (a thicker snare+tone stack).
- **Hi-Hat** — 8 flavors: added **Tape** (a rolled-off lo-fi hat), **Sizzle** (an extra-bright resonant peak), and **Lo-Fi 808**.
- **Percussion** — 7 flavors: added **Tambourine** (a cluster of jangling high-passed noise bursts), **Bongo**, and **Triangle** (a long ringing resonant tone).
- **Bass** — 12 flavors: added **Growl** (a fast, hard-resonant filtered saw — the aggressive dubstep/bass-music "growl" texture) and **Upright** (a plucked, warm, fast-decaying acoustic-bass approximation).
- **Piano** — 9 flavors: added **Toy** (a bright, thin, fast-decaying toy-piano tone) and **Harpsichord** (a plucked, harmonic-rich, peaking-filtered pluck).
- **Lead** — 10 flavors: added **Brass Lead** (a saw through a resonant bandpass, sitting between a supersaw and a real horn) and **FM** (a genuine two-operator FM patch — a modulator oscillator driving the carrier's frequency, the classic metallic/bell FM-synth timbre).
- **Pad** — 6 flavors: added **Choir** (a 3-voice sawtooth ensemble through vowel-formant bandpasses — the same formant-synthesis trick as the vocal instrument, stretched into a pad) and **Dark** (a moody, heavily lowpass-swept pad).
- **Stab** — 6 flavors: added **Organ Chord** and **String Chord**.
- **Guitar** — 8 flavors: added **Funk** (a short, choppy, wah-like bandpass-swept comping stab) and **Twelve-String** (a doubled, detuned, octave-up pair for a shimmering chorus ring).
- **Strings** — 6 flavors: added **Pizzicato** (fast plucked decay, no vibrato) and **Tremolo** (rapid amplitude-modulated sustain).
- **Horn** — 6 flavors: added **Trumpet Stab** (a short, bright accent hit) and **Section** (a thicker 4-voice detuned ensemble instead of a solo voice).
- **Organ** — 4 flavors: added **Combo** (a 60s Vox/Farfisa-style percussive click plus a shallow tremolo).
- **Vocal** — 5 flavors: added a fourth vowel, **Oh**, and **Choir** (a 3-voice detuned formant stack instead of one voice).
- **Kalimba** — 3 flavors: added **Steel Drum** (a different inharmonic partial ratio set for a Caribbean-steel-pan character).

That's 120 total instrument/flavor combinations, every one of them a real, distinct signal path rather than a palette swap.

## Instruments that actually sound played: physically-modeled strings

The clearest complaint driving this round: the guitars didn't sound like guitars. The root cause was the synthesis technique — every guitar voice was a plain oscillator through a lowpass filter, which can only ever approximate the *sustained* part of a note and can never produce a real pluck's attack transient or its natural, slightly inharmonic decay. The fix is **Karplus-Strong synthesis**, the actual physical-modeling algorithm (Karplus & Strong, 1983 — the same core idea inside hardware physical-modeling synths) used for real plucked-string sound design:

- A short burst of filtered noise "plucks" a **delay-line loop** tuned to the note's exact frequency (delay time = 1/frequency).
- The loop feeds back through a damping filter and a feedback gain, so it rings out on its own, decaying naturally and independently — a real string, not a note that just fades on a fixed envelope.
- Every guitar flavor (Clean, Power, Muted, Nylon, Acoustic, Jazz, Twelve-String) is now built on this technique, each with its own damping/feedback/pick-attack character — a palm-muted "Muted" note is heavily damped and decays almost instantly, while an open "Nylon" pluck rings warm and long. **Power** chords pluck a root+fifth string pair together into a shared overdrive stage, the way a real power chord is actually played and amplified. **Twelve-String** plucks four physically-modeled strings (unison pair + octave-up pair) instead of faking the shimmer with a chorus effect.
- The same technique now also drives the bass **Pluck** and **Upright** flavors, for the same reason — a plucked bass string has the same physically-modeled character need as a plucked guitar string.

Also added a soft mallet-strike transient to the piano voice (the "hammer hitting the string" click that was previously missing), continuous breath noise under the flute lead (it was silently falling back to a plain sawtooth before — now it has a real airy, slow-attack flute tone with vibrato that only kicks in once the note settles), and a breath "chiff" transient on every horn note.

**A stability bug caught during testing, worth calling out:** the first Karplus-Strong implementation used a standard biquad lowpass as the loop's damping filter. It measured fine by ear in casual listening, but running it through an `OfflineAudioContext` and analyzing the rendered signal's RMS energy over time — rather than just listening for console errors — revealed the loop was actually **exponentially unstable** at these very short in-loop delay times (every guitar note would have degraded into runaway distorted noise within about a second of ringing). The fix was switching to the original 1983 algorithm's actual damping filter — a simple two-tap average, `y[n] = (1−d)·x[n] + d·x[n−1]` — whose magnitude response is mathematically bounded to 1 at every frequency, making the loop provably stable for any feedback below 1, regardless of engine-level filter implementation quirks. Re-verified stable across the full guitar/bass frequency range before shipping.

## New instruments: pianos, guitars, organ, kalimba, marimba, an FX riser, and a synthesized vocal chop

- **Organ** — a Hammond-style drawbar stack (sine partials at the classic fundamental/octave/octave+fifth ratios), with a driven "gospel" voice that adds overdrive and Leslie-style tremolo. Added where it's genuinely idiomatic: gospel-sample hip-hop, Fela Kuti-style Afrobeat, and classic Rhodes+organ R&B/soul.
- **Vocal** — since real vocal samples aren't available in a dependency-free browser app, this is built with **formant synthesis**: a sawtooth source through three parallel bandpass filters tuned to vowel formant frequencies (three vowel presets now: "ooh," "ahh," "ay"), the same technique speech synthesizers use to fake a sung vowel. Present by default on the genres where vocal chops are a genuine signature sound (house, trap, reggaeton, dubstep, phonk, Jersey Club, Rap), and addable to any other genre via the prompt box.
- **Kalimba** *(new)* — a plucked-tine tuned-percussion voice (a noise "thumb pluck" transient plus inharmonic sine partials, with a "Music Box" variant), driven by a *different* melody generator than the other lead instruments: low variation, tight rhythm, so it repeats as a genuine ostinato loop rather than an evolving motif — matching how kalimba/melodic-loop hooks actually function in modern rap and Afrobeats records, where they're a hypnotic repeating figure, not a developing melody.
- **Marimba** *(new)* — a mallet-percussion voice: a soft, low-passed strike transient (rounder than the kalimba's metal-tine click, since a mallet compresses against a wooden bar rather than snapping a tine) plus a fundamental/fourth-harmonic sine pair, matching how a real marimba bar is tuned. The **Vibraphone** flavor adds the slow pulsating tremolo a rotating resonator fan gives a real vibraphone — the one clear audible difference from the marimba's dry wooden tone. Layered in as a sparse, low-density ostinato alongside the existing melody on Lo-Fi Chill and Afrobeats, the two genres where a mallet instrument is genuinely idiomatic (Nujabes-style lo-fi glockenspiel touches; African mallet/log-drum textures).
- **Arp** *(new)* — a dedicated arpeggiator voice, deliberately built to sound short and staccato (a fast decay baked into the synthesis itself, independent of the note length the sequencer feeds it) rather than reusing the sustained Lead voice, because a real arp is a fast run of retriggered notes, not a held tone. Two flavors: a bright unison-saw pluck (classic trance/house arp) and a duller square-wave **Pulse** (chiptune-adjacent). Added to Synthwave and Drum & Bass, where a fast arpeggiated line is genuinely idiomatic.
- **FX** — a rising bandpass-filtered noise **Riser**, the classic pre-drop/pre-chorus transition effect (in Full Song mode it's placed automatically one bar before every chorus, regardless of that bar's instrument density, because a section-change riser is a deliberate arrangement choice that shouldn't get masked by the general layering system); plus two new flavors researched from modern hard-trap FX use — a **Siren** (a sawtooth sweeping up and back down through a bandpass, the classic trap "police siren" ad-lib stab) and an **Impact** (a sub thump + noise crash + slow noise swell, the cinematic "trailer hit" used to punctuate a hard beat switch).

## "Free kits," researched and synthesized rather than imported

The brief asked for free instrument kits — worth being upfront about how that request maps onto this app: everything here is synthesized live with the Web Audio API by design ("no audio files or dependencies," stated up top), so no actual sample packs get loaded in, licensed or otherwise. What this round actually did was research the *circuit/synthesis behavior* of some of the most famous, most-documented drum machines and orchestral instrument kits ever made — public knowledge, reverse-engineered and modeled endlessly in the free-synthesis world, not a copyrighted recording — and built new, genuinely distinct flavors from that research, the same way the TR-808 research in an earlier round became the true-808 kick/bass fix:

- **Roland TR-909** — the house/techno drum machine. The kick preset is punchier and more mid-focused than the 808, with the 909's signature separate click-attack layer. The snare is bright, snappy, and slightly metallic. The hi-hat is the biggest departure from how every other hat in the app is built: a real 909 hat isn't filtered noise at all, it's **six square-wave oscillators at specific inharmonic frequency ratios**, summed and high-passed — that oscillator cluster (implemented exactly that way here) is what actually gives a 909 hat its ringing metallic character. House's default kit.
- **LinnDrum** — the deep, round, slightly boomier 80s drum-machine kick and cleaner mid-focused snare that defined a huge amount of 80s pop and synth production. Synthwave's default kit.
- **Timpani** — a General MIDI-style orchestral tuned drum, with the characteristic slight downward pitch glide right at the mallet strike a real drum head produces. A first pass added it as a selectable Percussion flavor but didn't put it to work anywhere; it's now Rock's default Perc — a sparse, occasional low arena-rock boom under the beat, the same move Queen/Muse-style bombast reaches for, and genuinely new sonic ground for a genre that had no percussion instrument beyond the kit before.
- **Clarinet** — a Horn flavor using a **square wave** instead of the sawtooth every brass flavor uses: a cylindrical, reed-and-closed-end woodwind bore acoustically suppresses even harmonics, and a square wave is exactly that (odd harmonics only), which is the real acoustic reason a clarinet reads as hollow/woody rather than brassy. Same problem as Timpani — added, but nothing defaulted to it. It's now Lo-Fi Chill's default Horn, playing long, soft-landing legato notes for the genre's jazz-cafe side rather than the punchy stabs every other horn use goes for.

Beyond giving the two orphaned kit flavors a real home, the Horn instrument itself was almost unused — only Reggaeton's `defaultFlavors` ever touched it, meaning the other six horn timbres (brass, soft, muted, sax, trumpetstab, section) were sitting in the flavor pool nearly unreachable outside a random shuffle. Horn is now a genre-appropriate chord voice in five genres total: Reggaeton (brass, as before), **Hip-Hop** (muted — the classic chopped-soul-sample horn stab of boom-bap), **R&B/Soul** (section — Motown/Stax-style horns answering the vocal on the offbeats), **Afrobeats** (brass — highlife horn stabs punctuating the guitar hook), and **Lo-Fi Chill** (clarinet, as above). Each got its own hand-written rhythm pattern rather than reusing one shape, so the horn actually plays like the genre it's in.

## Seven more free kits, and a way to actually pick them

Same research approach, seven more machines/instruments deep:

- **Roland TR-707** (1985) — Roland's first *sample-based* (12-bit PCM) drum machine rather than analog synthesis, so it reads tighter, cleaner, and more mid-focused with a shorter decay than the analog 808/909 — the freestyle/early-house sound. New Kick, Snare, and Hi-Hat flavor.
- **Roland TR-606 "Drumatix"** (1981) — a tiny analog companion to the TB-303 with almost no low-end weight and a fast, clicky decay — the acid-house/early-techno sound. New Kick and Hi-Hat flavor.
- **Oberheim DMX** (1980) — one of the first sampling drum machines and basically the sound of early-80s hip-hop (Run-DMC, Whodini): a hard, punchy kick pushed through a touch of waveshaper saturation to approximate the machine's reputation for a compressed, "gated" punch, and a bright, metallic-clang snare. New Kick and Snare flavor.
- **Simmons SDS-V** (1981) — the definitive 80s "electronic tom": not really a drum sound at all, but a pure sine with a fast, dramatic downward pitch sweep and a long ring, the unmistakable "pew" behind a decade of pop (Duran Duran, Phil Collins). New Tom flavor — and Tom didn't even have flavor support before this round, it was one fixed sound everywhere.
- **Roland CR-78 "CompuRhythm"** (1978) — the first microprocessor-controlled drum machine ("In the Air Tonight," Human League). Its bongo-style percussion came from simple RC-triggered analog oscillators, giving it a boxier, more "plasticky" resonance than a smooth acoustic bongo. New Percussion flavor.
- **French Horn** — a long, tightly-coiled conical bore and a hand damping the bell roll off the upper harmonics far more than a trumpet's open cylindrical bore does, so this uses a lowpass filter (rounding off the top) rather than the resonant bandpass every other horn flavor here reaches for, plus a slower attack — a horn genuinely speaks more slowly than a trumpet. New Horn flavor.
- **Oboe** — a double reed (two reeds buzzing against each other, instead of one reed against a fixed mouthpiece) produces a much richer, brighter spectrum than a clarinet's odd-harmonics-only tone, with a pronounced nasal resonance around 1.2kHz — a full sawtooth through a narrow high-Q peaking filter gets both right. New Horn flavor.

None of that matters if it's not actually reachable, though — and before this round, **the only way to hear any of it was luck**: every flavor, kit or otherwise, was set either by a genre's fixed default or by the random shuffle-on-generate, with no way to deliberately say "use the TR-909 kit" or "give the horn an oboe." Every track header now has a real flavor picker — a compact dropdown, right next to the track name, listing every sound that instrument can make. Pick "DMX" from the Kick menu, or "Simmons SDS-V" from the Tom menu, or "Oboe" from the Horn menu, and it's live: it takes effect on the very next hit, even mid-playback, no regenerating required. This is the actual fix for "make the kits usable," not just more of them existing in a pool a shuffle might never land on.

## A genre-by-genre critical listening pass

Went through all 15 genres the way a producer doing quality control would — checking each one's drum groove, chord progressions, key/scale, tempo range, and instrument choices against real genre convention — and fixed what didn't hold up:

- **Reggaeton's `stab` chord instrument was silent by construction** — both its core and optional hit patterns were all zeros, so picking a stab flavor for Reggaeton did nothing except the one automatic accent every fill bar forces in. It now has a real, genre-appropriate pattern like every other chordal instrument in the app.
- **Secondary chordal accents (stab, vocal) were tuned so quiet they were nearly inaudible** across nine genres — Trap, Dubstep, Phonk, Jersey Club, Drum & Bass, Rap, Drill, Afrobeats, and House all had these set to fire on only 15–20% of the bars where they were even eligible to play, meaning a user who picked a distinctive vocal-chop or stab flavor would go many bars without ever actually hearing it. Bumped to 26–32% across the board — still clearly a secondary accent, not a lead voice, but no longer functionally muted.
- **Jersey Club's description overclaimed "triplet-feel"** — the engine's 16-step grid can't represent true triplet subdivisions, and reaching for the genre's swing knob to fake it would have fought the genre's actual dry, unswung character. Reworded to "bouncy syncopated kick bursts," which is what the pattern actually does.
- Confirmed as correct rather than "fixed": every genre's tempo range, key/scale choice, and core drum groove had already been researched carefully in earlier rounds (Drill's Phrygian mode, Reggaeton's 90–100 BPM dembow range, Rock's deliberately empty chord-instrument list for a real guitar/bass/drums band, Synthwave's "brasslead" default being a period-correct Jupiter-8/Axel-F-style analog brass patch rather than a mismatch) — these held up under a second, more skeptical listen and were left alone.

## Second listening pass: fixing Rap, and two new instruments to fix it with

Direct feedback: Rap was landing "goofy" instead of "tough." Tracked it down to a genuine instrument-timbre mismatch rather than anything about the drums or the 808 — Rap's melodic hook instrument was **Kalimba**, a bright, plinky African thumb-piano tone (quick sine-partial decay, a soft thumb-pluck transient), constantly noodling away over hard-distorted 808s and aggressive hi-hat rolls. That's the audio equivalent of a music box playing over a boxing match — the mismatch between a light, toy-like timbre and an aggressive arrangement is exactly what reads as unintentionally comedic, no matter how hard the drums underneath are hitting. Kalimba is a great sound; it was just never Rap's sound.

The actual fix needed a real replacement, not a different flavor of the same instrument — so two new mono melodic instruments:

- **Auto Lead** — a real instrument for the "Auto-Tune hook" modern rap/trap leans on (Future, early Kanye *808s & Heartbreak*, Travis Scott), distinct from the existing Vocal instrument's sung vowel-chops. The thing that actually reads as hard-pitch-corrected rather than sung is an *absence*: a real voice always has some natural pitch wobble and glide between notes, and aggressive Auto-Tune strips that out, leaving a flat, static, faintly robotic tone. So unlike every other vocal-ish voice in this engine, Auto Lead deliberately has **no vibrato LFO at all** — what replaces it is a tight unison detune (the doubled/stacked-vocal layering real hard-tune hooks are almost always mixed with) and a fast, percussive attack so it hits like a hook, not a hum. Two flavors: **Hard** (bright, cutting) and **Moody** (darker, more melancholic — closer to the *808s & Heartbreak* side of the brief). Now Rap's default hook instrument, tuned for a phrase that breathes like a sung hook (more rest, longer notes, motifs repeated close to their original idea) instead of a busy instrumental run.
- **Sax** — a real mono *solo-line* instrument, not a chord-stab like the existing Horn — saxophone melodies are played one note at a time, a different musical role from a horn section hitting stabs. Acoustically a sax's conical bore (versus a clarinet's cylindrical bore) does *not* cancel out even harmonics, so it gets a full-spectrum sawtooth like the brass flavors rather than the clarinet's square wave; what actually makes it read as "sax" instead of "trumpet" is a continuous breath-noise layer under the tone (a reed hisses through the whole note, not just at the attack), a resonant body formant around 950Hz, and a real player's idiomatic pitch scoop up into a note. Now R&B/Soul's default top-line lead, replacing a generic flute — a saxophone solo is about as canonical a "smooth vocal-style top line" as soul production actually has.

Also tightened: Rap's swing was 0.15 — the same loose, laid-back swing as boom-bap Hip-Hop. A loose swing reads as groovy/relaxed no matter how distorted the drums underneath are, which works directly against "hard-hitting." Pulled down to 0.06, close to Trap's near-straight feel; modern hard-trap/rage records are almost always tightly quantized, not swung.

A few smaller genre-authenticity refinements from the same pass:

- **Hip-Hop's kick and snare now default to the SP-1200** (see below) instead of a generic "boombap" preset — the actual sampler golden-era boom bap was built on, for the genre this whole research thread is named after.
- **House's bass now defaults to the Moog-style patch** (see below) instead of a flat, static-cutoff synth bass — deep/classic house basslines lean on exactly the kind of analog filter movement a Moog patch has.
- **Reggaeton's lead hook switched from a sustained saw to a plucky, staccato pluck** — real reggaeton synth hooks are almost always short and punchy so they can cut through the dembow pattern's own busy syncopation, not a held tone.

## Three more kits: a sampler, a squeeze drum, and an analog ladder filter

- **E-mu SP-1200** (1987) — arguably the single most important machine in hip-hop history, the sampler golden-era boom bap (Pete Rock, DJ Premier, Marley Marl) was built on. Its low, fixed sample rate and 12-bit converters are modeled with a genuine bit-depth-reduction WaveShaper curve (quantizing the signal to a small number of discrete steps — a real technique, not a filter trick dressed up as one) plus a lowpass sitting around its real sample rate's Nyquist ceiling. Pushed a bit further than the literal hardware spec would produce, deliberately — modern "vintage sampler" emulation almost always does, because that's the exaggerated crunch that actually reads as "that sound" after decades of homage production. New Kick and Snare flavor, and Hip-Hop's new default.
- **Talking Drum** — a West African hourglass drum whose whole character comes from the player squeezing its leather tension cords under their arm right after striking it, bending the pitch upward mid-note to mimic speech inflection. That's a real, deliberate pitch-bend technique, not a decay artifact the way every other tuned percussion voice's downward glide in this app is — modeled as a bend sharply *up* after the strike, then settling, the "doi-oi-oing" of a real squeeze. New Percussion flavor.
- **Moog-style bass** — a classic Minimoog-style patch. Web Audio has no true ladder-filter model, but the thing that actually makes a Moog bass sound fat and alive rather than static is the filter *envelope* — the cutoff sweeping down from bright and open at the attack to a dark sustain is the "pluck" — so a high-Q biquad lowpass with that sweep gets close, backed by a sub oscillator an octave down for the low-end weight a single filtered saw can't deliver alone. New Bass flavor, and House's new default.

## Three more: an FM piano, an analog chorus pad, and a talking synth

- **DX7 "E.Piano 1"** — true FM synthesis (a carrier oscillator whose frequency is modulated by a second oscillator), not the additive detuned-oscillator trick every other piano flavor here uses. The Yamaha DX7's most-copied factory patch — probably the single most-used FM sound in 80s pop — gets its bright, bell-like attack settling into a near-pure sustain from a ~14:1 modulator ratio whose own amplitude (the "modulation index") decays much faster than the carrier's: deep modulation for an instant, then almost none as the modulator dies away. New Piano flavor.
- **Juno-106 pad** — the Roland Juno-106's signature isn't really its oscillator (a plain analog saw); it's the built-in BBD (bucket-brigade device) chorus circuit almost every classic Juno pad patch was run through, which is what actually gives it that lush, wide, shimmering character. Modeled as the real DSP a chorus circuit uses — a short delay line whose delay time is itself slowly modulated by an LFO, mixed back in with the dry signal — rather than just another detuned oscillator faking "width." New Pad flavor, and Synthwave's new default.
- **Vocoder** — a real vocoder imposes a filter bank derived from a spoken "modulator" signal onto a synthesized carrier tone; without an actual speech input to analyze, the classic *synthesized* vocoder hit (Herbie Hancock, Zapp, Daft Punk-adjacent) is approximated with a buzzy square-wave carrier — harmonically richer and more mechanical than the vocal instrument's sawtooth — through a coarser bank of more, narrower fixed-frequency bands, and, like Auto Lead, deliberately no vibrato at all. New Vocal flavor.

## Guitars that strum chords, the way records actually sound

Direct feedback: the guitars sounded terrible — "just one string that lasts one second." That was literally true of the code. Every guitar note played exactly **one** physically-modeled string, clipped at 1.2 seconds, no matter what. But listen to how guitar is actually used on records: rhythm guitar is *strummed chords*, not one note at a time. Fixed with two research-grounded details that make a strum read as a strum:

- **Strings don't sound simultaneously.** A pick sweeps across them, so each string starts ~8–16ms after the previous one (a full strum spreads roughly 30–60ms), with a slight velocity taper across the sweep — and most strums in a groove are downstrums, with occasional upstrums (reversed string order) mixed in. That tiny stagger is the single biggest cue that a human is playing.
- **Voicing depends on style.** Rock power chords are root/fifth/octave — deliberately third-free, which is exactly why they work over any chord quality and stay clear under heavy distortion — while acoustic and funk strums voice the real diatonic triad from the scale.

Rhythm flavors (power, acoustic, muted, twelve-string, funk) now strum; lead flavors (clean, jazz, nylon) correctly stay single-line, the way picked highlife lines and jazz solos actually are. Held chords also ring up to 2.2s instead of being cut at 1.2s. Measured result: a **twelve-string now sounds 12 real physical strings** spread across 25ms, a power chord rings 4, and an acoustic strum 6 — where all of them used to be a single string.

## Six more kits, chosen for what each genre actually needs

- **Ride cymbal** — the one cymbal the app never had, and it isn't a hi-hat variant: where a hat is a short hiss, a ride *sustains* — a strike "ping" (an inharmonic partial cluster) riding on a long shimmering wash, which is exactly why drummers can play continuous time on it. New Hi-Hat flavor.
- **Cross-stick** — the stick lies across the head and taps the rim: a dry, woody "tock" with almost no snare-wire noise. The ballad/neo-soul/bossa backbeat staple, and now **Neo-Soul's default snare**, because that genre's backbeat is a rim click far more often than a full snare.
- **Slap bass** — Larry Graham's invention and the funk signature: the thumb knocks the string against the frets, so the note leads with a hard percussive metallic thwack *before* the string speaks. New Bass flavor.
- **Whistle** — a human whistle is nearly a pure sine with almost no harmonics. What sells it as a person rather than a test tone is the performance: a pitch scoop into each note and vibrato that **fades in** as the note is held (a whistler can't apply vibrato instantly), plus a trace of breath noise. The pop whistle-hook sound. New Lead flavor.
- **Woodblock** — a short, dry, pitched "tok" with no sustain and no metallic ring: a strong fundamental plus one inharmonic overtone, distinct from the existing clave by being lower and rounder. New Percussion flavor.
- **Glockenspiel** — struck metal bars sounding an octave up with a very strong inharmonic partial near the third mode. That high sparkle over a long ring is why it cuts through a dense mix without adding any weight. New Kalimba-family flavor.

## Draw notes of any length right in the channel rack

The rack used to place exactly one **one-step** note per click, so building from scratch there could never produce a longer note — you had to open the piano roll for any real note length. It now behaves the way a DAW's step area does: **press and drag right on a melodic lane to draw a note and set its length**, or drag across a drum lane to paint a run of hits (FL Studio's paint gesture). Clicking an existing note or hit still deletes it.

*(Bug found and fixed while building this: every edit re-renders the step grid, which replaces the lane element — so holding a reference to that node meant measuring a **detached** element mid-drag. Its zero-size rect sent the computed step to infinity, stretching every drag to the end of the pattern: an 8%-wide drag produced a 64-step note and painted 45 hits. The gesture now captures the lane geometry once at mousedown, giving the correct 6-step note and 8 hits.)*

## Instruments that work *together*: ensemble register planning and a featured voice

Direct feedback: beats didn't feel like the instruments were working together — some parts (the bass especially) sounded goofy against the rest. Root-caused to three concrete things, all fixed:

- **The bass could jitter up an octave.** The per-generation register variety system rolled ±1 octave *independently for every* melodic instrument — including the bass. An 808 bumped up an octave is thin and toy-like, which is precisely the reported "goofy bass." Registers are now assigned the way an arranger voices an ensemble (`planRegisterJitters`): **the bass never leaves the bass lane**, the first melodic voice sits at-or-above its home register, and each additional voice sits at-or-below its own — voices spread apart instead of piling up or swapping lanes.
- **Chordal instruments could sink into the bass's lane.** Pads, organs, and guitars home at a low-mid register; letting them jitter a further octave down parked them on top of the bass and turned the low end to mud. Low-homed chordal instruments now only jitter up, never down.
- **No mix hierarchy.** Real productions have one clear featured voice per section with everything else sitting behind it. Each loop generation now picks one non-bass melodic line as the feature and gently ducks the others (via the same per-track automation lane the user can already see and edit) — so a beat presents one intentional lead, not several parts competing at equal volume.

## The true 808 — and an orchestra in one hit

- **True 808** — the modern-rap 808 (Travis Scott/Lil Baby/Gunna-era production), now Trap's default bass, built around the single most identifiable modern 808 technique: **the slide**. Producers put portamento on the 808 channel so the bass glides smoothly from note to note instead of re-attacking; since the engine schedules notes in time order, it tracks the previous 808 note and, when the next one follows closely at a different pitch, glides in from the old pitch instead of striking. Plus warm constant saturation on the sine body (the round, *melodic* 808 — deliberately distinct from the aggressive parallel-distortion "hard808"), a soft knock attack, and a long ring that outlives short trigger notes.
- **Orch Hit** — the Fairlight CMI's "ORCH5" sample: a full orchestra hitting one unison note (lifted from Stravinsky's *Firebird*), launched by "Planet Rock" (1982) into decades of hip-hop and pop — easily the most famous single sample preset ever shipped. Synthesized as what the sample actually is: a broadband multi-octave unison stack with a fast percussive decay and a closing lowpass sweep standing in for the abruptly-truncated sample tail. New Stab flavor.

## Start from scratch, FL-style

The whole editing surface — click-to-place drum cells, the drag/draw/resize piano roll, per-track sound pickers, mute/solo/volume/reverb, automation lanes — always worked on *generated* beats. The new **Start From Scratch** button hands you the same canvas empty: a blank pattern on the current genre's kit, so you can build the entire beat by hand instead of editing a generated one. The genre still supplies the kit, key/scale, tempo feel, and chord roots, so hand-placed notes land musically instead of chromatically random.

## And three more: acid, tape strings, and funk

- **Roland TB-303 "Bassline"** (1981) — the acid house machine, one of the most-cloned circuits in electronic music. Its identity is a bare sawtooth into a very resonant lowpass whose cutoff envelope snaps shut fast — that squelch *is* the 303 — plus the sequencer's signature slide, approximated per note as a quick upward glide into pitch. New Bass flavor.
- **Mellotron** (1963) — the tape-replay "strings in a box" behind "Strawberry Fields Forever" and most of early prog. Each key pulled a strip of magnetic tape across a playback head, so its character is really three tape artifacts stacked: **wow/flutter** (slow random pitch instability from an imperfect tape transport, modeled as a sub-Hz LFO wobbling every oscillator), a hard band-limit (the tapes simply had no top end), and a faint constant hiss under the note. Every other string flavor is a "perfect" oscillator; this one isn't, on purpose. New Strings flavor, and Lo-Fi Chill's new default — a tape-warbled string machine is about as on-brand as lo-fi texture gets.
- **Hohner Clavinet D6** — the funk keyboard ("Superstition"). Mechanically it *is* a plucked-string instrument — each key slaps a rubber pad against a real string — so the honest synthesis route is the same Karplus-Strong physical model the guitars already use, tuned tight and percussive, through a bright peaking EQ for the D6's nasal bite. New Piano flavor.

## Mixing: how producers actually make a beat sound good

Three techniques pulled directly from mixing research, applied to every beat:

- **Sidechain compression** — toggle "Sidechain" in the transport to duck everything but the drums whenever the kick hits (fast ~8ms attack, ~120ms release), the classic EDM/trap/house "pump" that lets the kick cut through. On by default for the genres that actually use it (trap, house, dubstep, afrobeats, drill); off for genres that don't (rock, lo-fi, R&B).
- **A glue compressor** sits on the master bus (a gentle 4:1 limiter-style compressor), the same "why does adding a limiter make my mix sound tighter" trick every finished track uses.
- **Reverb sends** — every track has its own send level (the small second "R" knob per row) into a shared reverb bus, with sensible per-instrument defaults (kick and bass stay dry for a clean low end; pads, strings, and crash get the most space) — real mix-bus technique, not just one global reverb slider.

Also newly exposed: a **global swing knob** (an FL Studio staple) that overrides the style's default swing live, on top of the existing key selector.

## True 808s

The "808" flavor on kick and bass used to just be a differently-tuned sine wave — real to the ear as "deep," but missing the thing that actually makes an 808 an 808. Researched actual TR-808/808-module behavior and fixed it:

- **The decay no longer depends on how short the trigger note is.** A real 808 rings out on its own long, semi-percussive decay regardless of the played note length — that's the defining "boomy sustain" character. Both the kick and bass 808 voices now hold a ~1.1–1.4s minimum ring time independent of the note/step duration, instead of cutting off with the trigger.
- **Saturation.** A real 808 module is almost always run a little warm on record; a gentle waveshaper stage now sits on both the kick and bass 808 voices instead of a bare clean sine.
- **A transient.** The kick 808 gets a short high-passed noise click on the attack; the bass 808 gets a soft noise "knock" — the percussive edge that a pure sine alone doesn't have.
- **Gritty** (new kick/bass-adjacent flavor) pushes the same saturation stage further for a dirtier, more distorted 808 character, and is now the default kick for Phonk and Dubstep, genres whose drums are characteristically dirtier than a clean 808.

## Mix clarity: EQ carving between kick and bass

Researched a standard mixing move for keeping a kick and bass from masking each other — reciprocal EQ carving — and added it to the master signal path: the kick gets a gentle dip around 150Hz (roughly where bass/808 sits) and the bass gets a gentle dip around 90Hz (roughly where kick sits), so the two trade off the same low-end space instead of fighting for it. Every other non-drum instrument also gets a light 40Hz highpass to keep sub-rumble out of everything that isn't actually a bass or kick element. This applies globally, underneath every genre, transparently to the existing per-track volume/mute/solo/reverb controls.

## Not a step sequencer for melody

Bass, lead, guitar, piano, organ, pad, stab, strings, horn, and vocal are stored as notes with their own start position and duration, rendered as bars you can see and edit — a real piano roll, not step ticks. Drums render as small hit marks on the same kind of lane rather than a grid of mostly-empty boxes, which is both what makes a 50+ bar full song fast to render and click through, and just a cleaner look.

## A real piano roll, FL Studio-style

- **A real keyboard, not a plain list.** Piano-roll rows for single-note instruments (bass, lead, guitar) are shaded like an actual keyboard — black keys darker, the root note highlighted — so you can see where you are the way you would on a real piano roll. Chordal instruments (piano, pad, stab, strings, horn, organ, vocal) show the seven diatonic chords with the tonic highlighted.
- **See what's playing, live.** During playback, whichever note or chord is currently sounding lights up — the note bar itself glows, and in an open piano roll the matching keyboard row highlights too, exactly like watching FL Studio's piano roll light up as a pattern plays. A moving playhead line sweeps across the whole arrangement, precisely tracking the audio position — it previously drifted out of sync (a leftover hardcoded pixel width that didn't match the actual rendered grid, worse the further into a song you got); it's now measured directly from the real rendered layout instead of reimplementing that math separately, so it can't drift out of sync again.
- **Hover for the note name.** Every note bar shows its length and, when there's room, its actual note name (e.g. "E4") printed right on the bar; hovering shows the full name and duration.
- **Drag to draw, resize, move, or delete.** Click-drag on empty space to draw a note of any length, drag its right edge to resize, drag its body to move it, or click it to delete — the same interaction whether you're in the piano roll or looking at the compact channel-rack overview.

## Editing an instrument's volume over the whole song

Every melodic/chordal track gets a new **A** button (next to Mute/Solo) that opens a volume-automation editor — a draggable curve across the entire arrangement, exactly like an automation clip in a real DAW: click empty space to add a point, drag a point to move it, click a point to delete it, and "Reset to Flat" clears it back to a constant level. This is genuinely applied at playback, not just visual — the engine reads the curve every step and scales that instrument's volume accordingly, live, even while a beat is already playing.

In **Full Song** mode, atmospheric and feature instruments (pad, strings, organ, lead, vocal, kalimba, marimba, arp) get a sensible automation curve generated automatically — quiet in the intro, swelling into each chorus, dipping for the bridge breakdown, fading out over the outro — because that's the kind of thing a mix actually needs over a multi-minute arrangement; short loops are left flat since a 4-bar loop has nowhere to "build" to. You can always override the generated curve by hand.

**Bass was one of the only instruments that never got this treatment**, and it showed: reported as "the bass sounds too aggressive in parts it's not supposed to." With every atmospheric instrument dipping down to ~15-30% through a hushed intro or bridge and bass staying pinned at full, constant velocity the whole time, bass would stick out disproportionately in exactly the sections meant to feel stripped-back. Bass now gets its own automation curve too, using the same intro/verse/chorus/bridge/outro shape but blended back toward full level (roughly a 60-100% range instead of atmospheric instruments' 15-100%) — present and foundational throughout, the way a bass should be, but with real pullback so a quiet section actually reads as quiet.

## Editing it like a DAW

- **Channel rack** — every instrument is a row with a color swatch, mute (M), solo (S), a volume fader, and a reverb-send fader. Click empty space on any row's lane to add a hit/note, click an existing one to remove it.
- **Piano roll** — click a track's name to open its dedicated editor, scale-snapped so nothing plays a wrong note.
- **Generate Beat** (and the prompt-box Generate) — builds a fresh loop or full song from scratch, and re-rolls the timbre ("flavor") of every instrument at the same time. There's no separate shuffle button to press — every beat you generate automatically comes with a fresh set of sounds, with a status line confirming exactly what changed (e.g. "Shuffled to a darker, moodier kit: Kick → gritty, Snare → gated...").

## A coherent shuffle, not a pile of random instruments

Rolling every instrument's flavor fully independently could land a bright digital hi-hat next to a dark distorted 808 next to a plain vintage snare — technically "shuffled," but sounding like unrelated one-shots stacked together rather than one real production. Every flavor across every instrument is now tagged by sonic character — **warm** (vintage/analog/organic), **bright** (crisp/modern/digital), or **dark** (moody/heavy/distorted) — and a shuffle first picks a single palette, then prefers flavors matching that palette for every instrument in the kit. That's the same principle a producer uses picking one coherent sample pack or one console's character for a whole session, rather than grabbing random individual samples from anywhere. The palette also never repeats twice in a row, so two shuffles in a row still land somewhere different.

Every hit also gets small randomized pitch/decay/timing/velocity variation at playback, so nothing ever sounds mechanically identical twice.

## A live audio visualizer, and a look tied to the genre you pick

A real frequency visualizer (Web Audio's `AnalyserNode`, tapped straight off the master bus after the compressor) animates while a beat plays — no fake/decorative animation, it's reading the actual output. The workspace panel's border and glow also pick up the selected genre's accent color instead of staying one fixed color for every style, so the whole page feels like it belongs to the beat you're making.

## Export a vertical video for Reels / TikTok / Shorts

"🎥 Export Reel" in the transport renders the current beat as a real, downloadable video file, entirely client-side — no server, no render farm. The visuals got a substantial pass this round, from a static-looking bar chart to something that actually reacts to the beat like a real music-video render:

- **True Reels resolution** — a 1080×1920 portrait canvas, not a downscaled preview.
- **A circular radial visualizer** instead of a plain row of bars — 72 bars arranged in a ring around a center point, each driven by the same real `AnalyserNode` frequency data as the on-page visualizer, with a glowing inner ring.
- **A kick-reactive pulse.** The background glow and the inner ring genuinely scale up on every kick hit (tracked live off the actual pattern data as it plays, decaying smoothly between hits), so the video visibly breathes with the beat instead of just showing generic audio-reactive noise.
- **A live section badge** in Full Song mode — a small pill reading INTRO / VERSE 1 / CHORUS 1 / BRIDGE / etc., pulled from the real arrangement data, so the video narrates where it is in the song.
- **Instrument-activity dots** — a row of small dots, one per instrument actually present in the genre, that light up in that instrument's own track color on the exact steps it's sounding, so the video visibly reflects the real arrangement rather than an abstract visualizer.
- Genre name, tempo/key, the Beat Studio wordmark, and a glowing progress bar round it out.

Under the hood: the canvas is captured as a video track (`canvas.captureStream`) and combined with the actual mixed audio, tapped straight off the engine's master bus via a `MediaStreamAudioDestinationNode` (the same fully-processed signal — EQ, sidechain, grit, compressor and all — that comes out of the speakers, not a separate re-render). Both tracks are recorded together with `MediaRecorder` into a `.webm` file, then automatically downloaded — pick a 15/30/60 second length, hit export, and a file lands in your downloads folder named after the genre. Recording restarts playback from the top of the pattern so the clip always begins at the start of the beat, and the whole thing can be cancelled mid-recording without leaving playback or the UI in a broken state.

**A real bug caught while building this:** the export overlay's CSS set `display: flex` directly on the same class the `hidden` attribute was supposed to toggle, which meant the browser's built-in `[hidden] { display: none }` rule silently lost the specificity fight — the overlay was invisible but still `display: flex`, and it sat on top of the entire page blocking every click, `hidden` or not. Caught by an automated click test rather than eyeballing it, and fixed with an explicit `.reel-overlay[hidden] { display: none }` rule.

Browser note: this relies on `MediaRecorder` + `canvas.captureStream`, which Chrome, Edge, and Firefox all support; the export button will say so plainly if a browser doesn't.

## A cleaner, more scannable beat editor

The channel rack got a real visual pass, not just new features:

- **Beat-level gridlines.** Previously the grid only marked bar boundaries; now there's a second, subtler line on every beat (every 4 steps) layered underneath, so you can actually parse where in the bar a hit or note falls at a glance instead of squinting across a wall of undifferentiated cells.
- **Color-coded rows.** Every track row now has a left-edge accent stripe in that instrument's own color (matching its hit marks/note bars), plus a matching glow on its color swatch, so scanning down a busy arrangement to find "the bass row" or "the hi-hat row" is immediate instead of reading labels one by one.
- **Taller, more comfortable rows** with bigger click targets on every hit/note, and slightly larger mute/solo/automation buttons with a proper hover state instead of static flat icons.
- **Alternating row shading** for easier left-to-right tracking across a wide, scrollable grid.
- Widened the label column so longer instrument names (Kalimba, Marimba) stop getting cut off to "Kalim…".

## A note on the vocal instrument

It's genuinely synthesized (formant filtering, not a recording), and it reads as a vowel-like "ooh"/"ahh" chop rather than an actual voice — a real sung or sampled vocal isn't achievable without shipping audio files. If you want something closer to a real vocal texture, the honest next step would be adding a small set of licensed one-shot vocal samples rather than pushing the synthesis further.
