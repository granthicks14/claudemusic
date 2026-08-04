# Beat Studio

Describe the beat you want in plain English, or pick from 19 genres, and get either a quick loop or a full ~2-minute song with a real intro/verse/chorus/bridge/outro arrangement — drums, bass, piano, organ, lead, guitar, kalimba, marimba, arp, strings, horns, vocal chops, pads, synth stabs, and FX — then edit and mix it like a mini DAW, right in the browser, and export it as a vertical video for Reels/TikTok/Shorts. Everything is synthesized live with the Web Audio API; no audio files or dependencies required.

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

## Chord progressions, chosen by functional harmony

Progressions were a flat pool per genre, drawn from uniformly. But not all chord successions are equally strong, and the reasons are well established rather than matters of taste — so the pools got bigger *and* the draw got smarter.

**The pools grew from 76 to 119 progressions**, adding the named progressions real music is built from: the **axis** family (I–V–vi–IV and its rotations, the most-used progression in modern pop), **50s doo-wop** (I–vi–IV–V), the **Andalusian cadence** (i–VII–VI–V, the flamenco descent), **ii–V–I** and its extensions for the jazz-leaning genres, the **backdoor cadence** (♭VII–I), circle-of-fifths walks, and the Dorian **i–IV** modal vamp that defines deep house and much of lo-fi.

Selection is now weighted by three properties from functional harmony:

- **Root motion.** Descending-fifth motion (vi→ii→V→I) is the strongest progression in tonal music; descending thirds and ascending steps come next; ascending fifths are weakest and can sound like the harmony is sliding backwards.
- **Function.** Western harmony moves Tonic → Predominant → Dominant → Tonic. A progression that walks that arc feels purposeful; one that wanders between functions feels aimless.
- **Stating the key.** A loop that begins on the tonic establishes where home is immediately.

Crucially the draw stays *random*, just weighted — every authored progression remains reachable, so variety is preserved while generations land more often on harmony that actually goes somewhere.

## Chords that sound like their genre

Every chord used to resolve to a plain stack of thirds — correct, but generic. Real genres have characteristic chord *qualities*, and that colour is a large part of what identifies a style. Each genre now has a chord-colour profile:

- **Neo-Soul and R&B** are built on 7ths, 9ths, and 11ths — plain triads genuinely sound wrong there. Neo-Soul now voices 5–6 note chords the majority of the time.
- **House, Techno, and UK Garage** lean on **suspended** voicings, which replace the third with the fourth and withhold the major/minor quality entirely — that open, unresolved sound is a genre signature.
- **Rock, Trap, and Drill** stay deliberately bare, so the harmony doesn't get in the way of the riff or the 808.

## The reel now shows the notes

A radial visualiser reacts to audio but says nothing about the music. What makes a beat video watchable is *seeing the notes arrive* — the falling-note format is the most-watched way music is visualised online precisely because the viewer can anticipate each hit a moment before hearing it. That anticipation is the entire appeal, so the note field is now the centrepiece of the frame rather than a decoration.

- **A lane per instrument**, coloured to match the editor, with notes falling toward a strike line.
- **Melodic lanes place each note horizontally by pitch**, so the viewer reads the *shape* of the line, not just its rhythm.
- **Notes brighten as they approach the strike line**, and each lane fires a coloured burst at the moment of impact.
- **A scrolling beat grid** (brighter on the bar line) gives the eye a pulse to track.
- **The current chord is named on screen** — large, under the note field — so a viewer can follow the harmony. Major/minor quality is detected from the actual third above the root, so a Dorian tonic correctly reads as minor.
- **Smooth sub-step scrolling** so notes glide rather than snapping between steps.

The activity-dot row was removed: the lanes now show everything it did, more clearly.

*(Bug found while building this: the lookahead didn't wrap with the loop, so the upper half of the note field emptied out right before the pattern turned over — exactly when a viewer most wants to see what's coming. The lookahead now wraps around the loop.)*

## What the program knows about each instrument

Every melodic part used to be an abstract stream of scale degrees: a stack of thirds, transposed by a register offset, played by whichever synth voice the track happened to be. That is not how any of these instruments work.

A tenor saxophone cannot play a chord. A guitar cannot play the close stacked-third voicing a pianist's right hand plays — six strings tuned in fourths and a third physically cannot reach those notes. A string section doubles its bottom voice an octave down; a horn section does not. And every instrument has a range outside which it either does not exist or sounds wrong.

`js/instruments.js` is that knowledge written down, and it is consumed in two places: **patterns.js** decides *which* chord tones an instrument plays and how they are spaced, in the scale-degree domain; **audio-engine.js** clamps the result into the instrument's real range once the key is finally known.

**Per-instrument profiles** carry a physical range, the "sweet" register arrangers actually write in, a real simultaneous-note capacity (a wind instrument is 1; a four-piece horn section is 4 because it is four players), a voicing character, and whether the instrument sustains or decays.

**Voicing character** is applied per instrument, not globally:

| Instrument | Voicing | Why |
|---|---|---|
| Piano, stab, vocal | close | stacked thirds, the keyboard/SATB default |
| Pad, marimba | spread | second-lowest voice lifted an octave — open position |
| Horn section | drop-2 | voice close, drop the second-from-top an octave; the standard four-part section voicing, because it opens the chord without any player leaving their warm register |
| Guitar | root–5th–octave–10th | the shapes that exist on a fretboard; close thirds down low do not |
| Strings | section + octave double | spread evenly, basses doubling the cellos an octave down — their traditional role |
| Organ | drawbar | Hammond drawbars are literally an octave-doubling device, so the organ adds the octave rather than another third |
| Sax, lead, arp, autolead | mono | one note. Always. |

**The low interval limit.** Two notes close together in a low register stop being heard as an interval and start being heard as mud — below a certain pitch there is a real risk the sound simply will not work in a normal harmonic context, because the partials beat against each other faster than the ear can separate them. Arrangers work from a chart of the lowest pitch at which each interval stays clear (a minor 3rd down to C3, a major 3rd to Bb2, a perfect 5th to Bb1, an octave to E1). That chart is now encoded, and any voicing that violates it has its upper note lifted an octave — or dropped, if that would leave the instrument's range.

*(A note on sourcing: the concept and the underlying acoustics are well documented, but the specific published chart tables were behind servers that refused automated fetches, so the encoded values are the standard arranging figures rather than a table transcribed from a page I was able to read.)*

**Measured across 19 genres × 12 generations (~9,400 notes, ~2,700 chords):**

| | before | after |
|---|---|---|
| Voicings that violate the low interval limit | 58 | **0** |
| Notes outside the instrument's real range | 261 | **0** |
| Chords exceeding the instrument's physical polyphony | 38 | **0** |

*(Bug found while measuring: the DJ-intro stab fill built its chord with a raw `chordDegrees()` call that bypassed the voicing layer, so a large extension roll could produce an eight-note stab no four-piece section could ever play. It now goes through `shapeVoicing` like every other chord.)*

## Fifty new kits, and where each one belongs

Kits went from 165 to **220**, and every one of them was researched before it was built — not "a filter setting that sounds vaguely like X" but what physically makes the sound.

**Four more documented drum machines.** The Linn **LM-1** (1980) was the first machine to use samples of real acoustic drums rather than analog synthesis — the whole point of it was realism, so it is dry and tight with a beater click and none of an 808's tail. The Casio **RZ-1** (1986) sampled at 12-bit/~32kHz, which is genuinely lo-fi: it does not sound like a real drum, it sounds electronic and slightly broken, which is exactly why hip-hop and house producers kept using it. The Alesis **HR-16** (1987) went the other way with 16-bit acoustic samples. The Roland **R-8** (1989) was a PCM machine built for rock and big-room kits, so it gets the heaviest reverb send of any kick here.

**World percussion, built from the physics.** The **tabla**'s head is loaded with a tuning paste, which makes it strongly *harmonic* — near-integer overtones and a real pitch, unlike almost any other drum — and the heel-pressure pitch bend is modelled directly. The **cabasa** and **güiro** are *scraped*, so they are many small impacts in sequence rather than one transient (the güiro slower and discrete, so you hear individual teeth). The **vibraslap** is a wooden block struck to set loose pins buzzing, so its decay stutters irregularly rather than fading smoothly. **Agogô** bells get a deliberately inharmonic ratio set — that clang is the instrument. Plus **cajón** (bass port vs corner slap), **djembe** (three canonical tones, because a djembe part is a melody of timbres), **timbales**, **roto-toms** and **taiko**.

**The Solina, built to its actual circuit.** The ARP String Ensemble's sound is three bucket-brigade delay lines modulated by two three-phase generators — one slow "chorus", one fast "vibrato" — with BBD1 fed the 0° outputs, BBD2 the 120° and BBD3 the 240°. Crucially **the dry signal is not heard at all**: only the summed output of the three delays. That is why a Solina sounds like a swirling ensemble rather than like a synth with chorus on it, and it is implemented exactly that way here.

**The sitar** is two things, and neither is the scale it is played in. The **jawari** — a wide, curved bridge the string grazes as it vibrates — continuously re-excites the upper partials instead of letting them decay, which is the buzz. The **sympathetic strings** (eleven to thirteen of them) are never plucked and just ring in response. Both are modelled, and the sympathetic strings deliberately do not share the note's attack.

**A xylophone and a marimba differ by one undercut.** A marimba bar is arched so its first overtone tunes two octaves above the fundamental (4:1), which sounds round. A xylophone bar is cut so it tunes to a twelfth (3:1) instead, which is what makes it hard and hollow. Same material, one partial retuned, completely different instrument — and that is exactly how the two voices differ in code.

**Free reeds beat against themselves.** An accordion has multiple reed banks per note tuned slightly apart (musette tuning), and the beating between them *is* the instrument's voice — the same principle a tremolo harmonica uses. A harmonium has no musette detune and is hand-pumped, so it breathes instead. A **Farfisa** is a transistor combo organ with no sine content at all, which is why it sounds thin and nasal next to a Hammond, and exactly why garage and ska records used it.

**Brass is a bore shape plus a pair of lips.** A cylindrical bore (trumpet, **trombone**) reflects high harmonics and sounds bright and edgy; a conical one (**flugelhorn**, **tuba**) spreads out and sounds dark. Brass also gets brighter as it gets *louder*, so the filter opens with velocity — a brass patch with a fixed filter always sounds like a synth.

**Also added:** Korg **M1 Piano** and **Organ 2** (the piano-house and deep-house presets, and the Robin S. bass organ), **CP-70** electric grand (real strings, piezo pickups, no soundboard — so it is modelled with a physical string model straight into an amp-like EQ), **honky-tonk** (an upright out of tune *with itself*), **SH-101**, **fretless** bass, **theremin** (no frets or keys, so every note is slid into and vibrato is always present — the portamento *is* the sound), **pan flute** (a stopped pipe, so odd harmonics only), **harmonica**, **ocarina** (a vessel flute, so essentially no overtones at all), **banjo** (a drum with strings on it — membrane, not soundboard), **mandolin** (paired courses beating against each other), **ukulele**, **slide guitar**, **cello section**, **spiccato**, **harp**, **handpan** (dimples tuned to exact octave and twelfth), **balafon** (the gourd's membrane buzz is considered essential, not a defect), **kora**, **tubular bells** (the pitch you hear is not actually present — the ear infers a missing fundamental), **CS-80**, **Vox Humana**, **piccolo**, and **alto/baritone sax** (the body formant sits lower on a bigger horn, and that formant is how the ear tells them apart).

**Every kit is placed in the genres that actually use it.** This mattered more than the kits themselves: the shuffle draws from the shared pools, so without a genre map a techno track would sooner or later be handed a banjo. Timbre alone is not enough knowledge about an instrument — *where* it is used is part of what the instrument is. A sitar belongs in psychedelic-leaning hip-hop and lo-fi, not UK garage; a Korg M1 organ is the sound of house specifically; spiccato strings and tubular bells are drill and trap devices; a kora and a balafon are West African and belong with Afrobeats and Amapiano. The track's kit dropdown groups them into "Fits this genre" and "Other kits" — both stay selectable, because deliberately putting a sitar on a techno track is a creative choice and only the *automatic* shuffle should be stopped from doing it.

**Verified by rendering every kit.** All 220 flavors are triggered through an `OfflineAudioContext` and measured: none silent, none broken, none clipping (loudest peak 0.82). Then 19 genres × 6 shuffles each are played through the live engine — 165 distinct kits actually sounded, zero console errors.

*(Bug found by that regression: clicking a **drum** track's name opened a piano roll for it, and the roll's note renderer read `note.degrees[0]` off a drum hit — which is just `true` — and threw. Drum lanes carry no pitch at all, so their names no longer open a roll.)*


## Six genres had no solo voice at all

Before adding anything, I checked which genres actually had a melodic lead — a solo line, as opposed to chords and a bass. Six did not: **rock, drill, dubstep, Jersey club, amapiano and neo-soul**. Rock had a rhythm guitar and nothing to play over it. That measurement decided what got built.

### Woodwind — the saxophone's siblings

A new mono track, and the family splits on a single acoustic fact. A **conical** bore (saxophone, oboe, bassoon, English horn) supports the complete harmonic series — every integer multiple is present, which is why those instruments sound rich and reedy. A **cylindrical** bore closed at one end — the clarinet — only supports the **odd** harmonics; the even ones are physically absent. That missing half of the spectrum is exactly why a clarinet sounds hollow and woody next to an oboe, and why it over-blows to a twelfth instead of an octave. Flutes are open at both ends and edge-blown rather than reed-driven, so they get the full series but with very weak upper partials and a much larger proportion of breath noise — the air jet splitting on the edge is a large part of what you actually hear, and leaving it out is most of why synthesised flutes sound like sine waves.

Twelve kits: **Concert Flute**, **Alto Flute**, **Recorder**, **Shakuhachi**, **Bansuri**, **Clarinet**, **Bass Clarinet**, **Oboe**, **English Horn**, **Bassoon**, **Soprano Sax**, **Duduk** (an Armenian double reed with an exceptionally large reed for its bore, which is why it is so dark and breathy despite being a double reed).

Placement is idiomatic, not decorative: amapiano is built on **live sax and flute over the log drum** — the genre's "private school" strain uses live guitar, saxophone, violin and trumpet — and dark flute and duduk lines are a UK drill signature.

### Lead Guitar — a separate performance from rhythm guitar

On real records these are two different tracks: rhythm sits in open position holding the harmony, the lead plays single notes up the neck through a hotter amp. The program only had one guitar, so rock could never have both. Lead guitar is now its own mono track, voiced an octave above rhythm because solos live on the top strings.

Seven kits: **Overdrive**, **Fuzz**, **Wah** (a resonant bandpass swept by the player's foot — the sweep *is* the instrument; a static wah is just a honk), **Feedback Sustain** (fed enough energy that the string does not decay at all, which is how a note gets held forever on a record), **Octave Lead**, **Clean Lead**, and **Pinch Harmonics** (the picking hand damps the string at a node so the fundamental is genuinely cancelled and a high partial speaks instead — a squeal, not a note).

The two lines are also *phrased* differently, not just voiced differently: a wind player breathes, so woodwind parts get long note values and a 52% rest probability and land at 6–8 notes per four bars. A lead guitarist does not, so lead guitar runs denser at 10–13.

## Nine more classic synths

- **Hoover** — originally a preset called "What The" on the Roland Alpha Juno, written by Eric Persing *as a joke*, and then used on Human Resource's "Dominator", The Prodigy's "Charly" and most of early-90s hardcore and jungle. Four things make it: a **PWM sawtooth** (a saw with flat segments of varying width cut into it — the Alpha Juno's unusual oscillator, which no other synth of the era had), that PWM run at a high rate for the rasp, a sub-oscillator, and a fast up-then-down **pitch envelope**, which is the discordant swoop everyone actually recognises. All four are implemented.
- **MS-20** — Korg's filter is a **Sallen-Key** design rather than a Moog-style transistor ladder. It self-oscillates in both lowpass and highpass and avoids the volume drop the ladder suffers when resonance is pushed, which is why it stays aggressive instead of thinning out. The sound is the filter screaming, not the oscillator.
- **D-50** — Roland's **LA synthesis**. Memory was expensive in 1987, so rather than sample a whole instrument they sampled only the **attack transient** — the hardest part of a sound to program — and let ordinary subtractive synthesis carry the sustain. A short 8-bit-ish burst spliced onto a synth body is literally the architecture, and it is why D-50 patches sound simultaneously synthetic and oddly real.
- **Prophet-5** — **poly-mod**: oscillator B and the filter envelope routed into oscillator A's frequency, giving a hard, brassy, slightly unstable sweep no simple saw stack has.
- **OB-Xa** — two discrete voice boards per key in unison. Thicker and blunter than the Prophet; the "Jump" brass sound.
- **CZ Phase Distortion** — Casio's trick: instead of filtering a rich wave, the oscillator's own **read rate** through the wavetable is warped. The giveaway is that brightness sweeps while level stays completely flat, which no analog filter does.
- **Jupiter-8** — stacks every voice in unison with per-voice detune, so one key is eight oscillators spread apart.
- **Polysix** — smaller and softer; its character is mostly its onboard ensemble chorus, so it runs through the same three-tap ensemble as the Solina at lower depth.
- **PPG Wave** — a **wavetable** synth. Its oscillator scans a table of very different single-cycle waveforms, so the harmonics do not just roll off, they *rearrange* — movement no filter sweep can imitate, plus the grit of 8-bit ROMs.

**Totals:** 248 kits across 17 melodic and 8 drum tracks. Every one is triggered through an `OfflineAudioContext` and measured — none silent, none broken, none clipping. Across 19 genres × 6 shuffles played live, 184 distinct kits actually sounded with zero console errors, and every genre now has a solo lead voice.


## Why every beat in a genre sounded the same

Reported about R&B: the saxophone was the thing you noticed every time, and it made each beat feel like the last one. Measuring it showed the problem was not R&B's and not the saxophone's — **it was every genre**.

Instrumentation was **fixed per genre**. Only the *timbre* shuffled. Across 30 generations of each of the 19 genres:

| | before |
|---|---|
| Genres that played the identical solo instrument in 100% of generations | **19 of 19** |
| Genres with only one solo instrument in existence | **12 of 19** |
| Average distinct solo instruments per genre | **1.4** |

R&B had `monoInstruments: ["bass", "sax"]`. There was no mechanism by which it could ever produce anything else. Changing the saxophone's reed cannot fix that; the ear latches onto whatever carries the top line, and it was always the same thing.

**Instrumentation is now chosen per generation.** Each genre declares a weighted **pool** of solo voices that genuinely belong in it, and each generation draws one or two. Chordal parts vary too — the first two are kept because they carry the harmony, and the rest are each rolled for, so the supporting cast changes shape as well.

Every instrument also needed a melodic profile for genres that had never written one, so there is now a shared `DEFAULT_MELODY` table written from how each instrument is actually played: wind players breathe (long notes, lots of rest), mallet and plucked instruments cannot sustain so they move, an arp is continuous motion by definition.

**After (60 generations per genre):**

| | before | after |
|---|---|---|
| Genres locked to one solo instrument | 19 of 19 | **0 of 19** |
| Average distinct solo instruments per genre | 1.4 | **4.5** |
| Share of generations using the most-common voice | 100% | **50%** |
| Distinct track line-ups per 8 generations (measured in the browser) | 1 | **5.8** |

R&B specifically went from *saxophone, 100% of the time* to six voices sharing the top line — woodwind 30%, lead guitar 30%, sax 25%, vibraphone 22%, talkbox 18%, synth lead 15% — and **8 different track line-ups across 8 generations**.

*(Two bugs found while building this. The refinement pass took the genre's **nominal** instrument list rather than the line-up the chosen candidate actually used, so it tried to refine parts that did not exist and wrote `undefined` into the pattern, which then crashed the scorer. And instrumentation was initially planned per candidate inside the best-of-12 search — which meant the **scorer** was choosing the line-up, and because it rewards interplay it simply always picked the busiest option, quietly undoing most of the variety. Instrumentation is a creative decision, not something to optimise, so it is now planned once, above the search, and every candidate shares it.)*

*(One edge case the change introduces, now handled: a piano roll or automation lane can be left open on a track the next generation does not have. Those panels close themselves rather than render an editor for a part that no longer exists.)*

### Talk Box

Added as part of this, because R&B and funk needed a top-line voice that was missing entirely. The talkbox and the vocoder are constantly confused and they are **opposites**: a vocoder makes a *voice* sound like an instrument by analysing it and reimposing its spectrum on a synth; a talkbox makes an *instrument* sound like a voice, mechanically — a horn driver sends the synth's audio up a plastic tube into the player's mouth, the player silently shapes vowels, and a microphone in front of their mouth picks up the result.

So the right model is not a vocoder bank. It is a synth tone through resonant formant filters that **move**, because the player is continuously changing vowel while the note sustains — a static formant filter sounds like a wah pedal left in one position, which is the mistake that makes fake talkboxes sound wrong. Roger Troutman of Zapp, the definitive user, fed his through a Minimoog and later a DX100, which is why the underlying tone is a fat analog lead rather than anything vocal. Four kits sweep different vowel paths: **Zapp** ("ee"→"oh"), **G-Funk** (the wider "aw"→"ee" drawl), **Robot** (deliberately narrow and static), **Bright** ("ah"→"ee" up high).

**252 kits total.** All rendered offline — none silent, none clipping. 19 genres × 8 generations played live with zero console errors.


## Beat complexity, 1–10

A slider in the transport, from **1 Skeletal** to **10 Maximal**.

"Complexity" is easy to fake badly — just add more notes — and that produces clutter, not sophistication. What actually separates a simple beat from an intricate one is measurable, and it is mostly **syncopation**: *where* onsets sit relative to the metric grid, not how many there are.

### The measure

The model used is **Longuet-Higgins & Lee (1984)**, the standard formal measure of rhythmic syncopation. It works from the metric weight hierarchy every listener implicitly carries for a 4/4 bar — the downbeat strongest, then the half-bar, then the remaining quarters, then the 8ths, the 16ths weakest. A syncopation is a **note-then-rest pair where the note lands on a weak position and the following rest sits on a stronger one**: the listener expected the strong position to be marked and it was not. Each pair scores the difference between the two weights, and the bar's syncopation is the sum.

*(Sourcing note: the published weight tables are behind servers that refuse automated fetches, so the values encoded are the standard binary-subdivision hierarchy the accessible literature describes — level 0 for the downbeat, one level down per subdivision — rather than a table transcribed from a page I could read.)*

### What the dial moves

One knob, derived coherently across the whole arrangement rather than turning up a single parameter:

- **Subdivision** — at 1 nothing lands off the quarter-note grid at all. This is what actually makes a beat read as simple: not fewer hits, but hits only in obvious places. The coarsening is *graded* (each level also has a probability that an off-grid hit survives) because hard buckets per subdivision made whole pairs of levels identical.
- **Deliberate syncopation** — onsets are *displaced* off strong positions onto the weak step before. The onset count does not change at all, only where the hits sit. The kick keeps its anchor at every level: a beat whose pulse cannot be found is not complex, it is broken.
- **Harmony** — triads at the bottom of the dial, 7ths in the middle, 9ths and 11ths at the top, plus faster harmonic rhythm and more anticipation.
- **Melody** — simple settings rest more, repeat more and stay on chord tones; complex ones move more, vary the motif more and use more passing tones. The bass is deliberately exempt — a bassline that will not hold still stops being a foundation at any complexity.
- **Layers** — how likely a second solo voice is, and how much of the supporting chordal cast is kept.

### It is a target, not just a bias

The best-of-12 candidate search is the program's one real chance to be deliberate, so the setting is not merely a set of generation probabilities — **the scorer aims at it**. Every candidate is measured with the LHL model and by onset density and scored on how close it lands to what was asked for. Without this the dial would only nudge the odds; with it, the program keeps looking until it finds a beat that genuinely is that complex.

### Measured, 19 genres × 6 generations at each level

| Level | LHL sync/bar | Drum density | Drum onsets/bar | Melodic notes/bar | Chord tones/hit |
|---|---|---|---|---|---|
| 1 | 2.4 | 0.127 | 9.1 | 9.8 | 3.60 |
| 2 | 4.6 | 0.168 | 12.0 | 10.1 | 3.65 |
| 3 | 5.2 | 0.205 | 14.7 | 10.7 | 3.73 |
| 4 | 6.7 | 0.232 | 16.6 | 10.8 | 4.47 |
| 5 | 8.6 | 0.279 | 20.0 | 11.4 | 4.41 |
| 6 | 9.4 | 0.296 | 21.2 | 11.3 | 4.97 |
| 7 | 10.4 | 0.305 | 21.8 | 11.9 | 4.96 |
| 8 | 11.9 | 0.312 | 22.3 | 12.7 | 5.12 |
| 9 | 12.4 | 0.318 | 22.7 | 13.6 | 5.11 |
| 10 | 13.4 | 0.334 | 23.9 | 13.4 | 5.15 |

Every level is distinct and every measure moves monotonically. Syncopation spans 5.6×, chord density goes from plain triads to 9ths and 11ths.

Complexity changes the composition rather than a playback parameter, so it takes effect on the next **Generate Beat** — regenerating instantly would throw away hand edits.

*(Bug found by the complexity work: the chord fitter lifted a too-close voice by an octave without re-sorting, so the lifted note could end up above the next one. The following comparison then came out negative and was silently treated as clear. Bigger chords at high complexity made it show up. The clarity pass now re-sorts and repeats until nothing moves — 0 violations at complexity 1, 5 and 10.)*

## Thirty more kits

**Seven more documented drum machines.** The E-mu **Drumulator** (1983) was the SP-12's direct ancestor and the reason early E-mu gear sounds crunchy. Sequential's **DrumTraks** (1984) was its tunable rival with a notably deep kick. The Yamaha **RX5** (1986) was clean 12-bit PCM aimed at studios. Roland's **CR-8000** (1981) is pure analog CompuRhythm, closer to a CR-78 than a 909. The Korg **KR-55** (1979) is a preset analog box with a soft round kick. The Boss **DR-110** (1983) is tiny, with almost no low end. The Akai **MPC60** (1988) — Roger Linn's design after the LinnDrum — is the machine golden-era hip-hop was built on.

**Ten layering percussion instruments**, added specifically to serve the complexity dial: a genuinely intricate beat is built from several interlocking parts at different densities, and that needs instruments that can carry a fast subdivision without fighting the kit for the same frequencies.

- **Shekere / ganzá / caxixi** — three shaken vessels distinguished by what rattles against what: hard beads on a hard gourd (loud, low-mid, with a thump when struck), metal shot in a metal tube (bright, continuous), seeds in a woven basket (dry, dark).
- **Udu** — a clay pot with a side hole, so a Helmholtz resonator. Striking the hole changes the effective air volume and therefore the pitch, which is why one hand can play a two-note bass melody on it.
- **Pandeiro / tamborim** — both Brazilian, both fast-wrist, both essential to samba's interlocking layers. The tamborim is a 6" frame drum hit with a plastic stick: extremely high, extremely dry, no jingles at all.
- **Repinique / surdo** — the two ends of a samba bateria: the huge low drum that carries the pulse, and the high metal-shelled drum that calls the changes.
- **Batá** — a double-headed hourglass drum played on both ends at once, so a single stroke is genuinely two pitches, which is why batá patterns sound like conversation.
- **Cuíca** — a friction drum: a stick inside the shell is rubbed and drags the head with it, and the player changes pitch by pressing from outside. It squeaks and slides.

**282 kits total.** All rendered through an `OfflineAudioContext` — none silent, none clipping. 19 genres generated and played at complexity 1, 5 and 10 with zero console errors, plus song mode and scratch mode.


## Why the piano and guitar sounded fake

Reported as the biggest thing separating this from real music. It was not the timbre. It was one line in the scheduler:

```js
for (const midi of voiced) {
  const vel = ...;
  this.playPianoVoice(t, freq, noteDur, vel, flavor);   // every note at the same t
}
```

**Every note of every chord started at exactly the same timestamp.** No pianist has ever done that — ten fingers cannot strike within a microsecond of each other — and a guitarist physically *cannot*, because a pick crosses six strings one at a time. Simultaneous, equal-velocity onsets are the single most recognisable "this is not a person" cue in programmed music, and no amount of better synthesis fixes it.

`js/performance.js` turns a chord from an **event** into a **gesture**: each note gets its own time offset, its own velocity and its own length.

**Measured across 19 genres, instrumenting every voice call:**

| | before | after |
|---|---|---|
| Chords that were simultaneous *and* equal-velocity | **89%** | **0%** |
| Median onset spread across a chord | **0 ms** | **24 ms** |
| Average velocity span within a chord | 0.018 (random jitter only) | **0.20** (musical roles) |

### What the layer models

- **Melody lead.** On a block chord the top voice is struck slightly *ahead* of the rest and played harder. That is how a pianist makes a melody read as a melody rather than as the top of a chord.
- **Strum direction.** A strumming hand keeps moving in a constant down-up cycle whether or not it hits the strings, so the stroke is not a free choice: downbeats get downstrokes, the "and" gets upstrokes. **An upstroke starts at the thin strings, only catches the top few, and is quieter** — that asymmetry is most of what a strummed part's groove actually *is*.
- **Real articulations** rather than one gesture for everything: rolled chords, broken chords (bass note on the beat, the rest a moment later — the ballad left hand), arpeggios spread across the note's full length, stride (the left hand literally striding between registers), the funk 16th-note **chuck**, and **Travis picking** (an alternating thumb bass with fingers interlocking between the beats — two independent rhythms from one hand).
- **The sustain pedal.** Notes ring past their written length and blur into the next chord. Without it every piano part sounds staccato and separated no matter how good the voicing is.
- **Rootless voicings.** When the bass already states the root, keyboard players drop it rather than doubling it — standard practice from Bill Evans onward and the basis of jazz, R&B and neo-soul comping. Doubling the bass an octave up is exactly what makes programmed keyboard parts sound thick and undefined.

Which articulation each part uses is chosen **per generation**, so a strummed guitar and a fingerpicked one are different performances of the same chords — a bigger difference than any kit change.

*(Two bugs in my own new code, caught by inspecting the generated events rather than by listening: the strum's timing jitter could produce a **negative** delay, which would schedule a note before the beat — Web Audio silently drops anything requested in the past. And Travis picking stepped the treble fingers by a half beat instead of a whole one, so they landed *on* the alternating thumb bass instead of interlocking between it. 63,000 generated events now contain zero negative delays.)*

## Six more piano and guitar voices

- **Felt piano** — a strip of felt between hammers and strings kills the attack and rolls the top off hard. The defining detail is that the **key noise becomes proportionally loud**, because the note under it is now so quiet; that mechanical action sound is why felt piano recordings feel intimate rather than like a piano in a room.
- **Tack piano** — drawing pins pushed into the hammer felts, so metal hits the string instead of wool. Huge high-frequency attack, almost no sustain.
- **Jazz grand** — close-miked with the lid up, modelled with a real physical string model into a soundboard resonance rather than an oscillator stack, because the string itself is what a jazz pianist is listening for.
- **Open chords** — unfretted strings ring on, and those open strings are fixed pitches that *do not move with the chord*, so an open-position part has a drone running under the harmony. That is why it sounds so much bigger than the same chord as a barre further up the neck.
- **Resonator** — no wooden soundboard at all; a spun metal cone radiates instead, with a strong narrow resonance and a metallic ring. It cuts through an acoustic band in a way a wooden guitar cannot.
- **Baritone guitar** — tuned a fourth or fifth below standard with a longer scale so the strings stay tight, occupying the gap between guitar and bass.

**288 kits total**, all rendered offline with none silent or clipping; 19 genres played at complexity 1, 5 and 10 with zero console errors.


## Teaching it your taste

Every "Generate" already composes twelve beats and keeps the best one — but the scorer's opinions were hand-written by me, identical for everyone. Two buttons (**👍 More like this** / **👎 Less like this**) close that loop: the program measures what the liked beats have in common that the disliked ones do not, and that difference steers both the candidate search *and* the generation parameters.

**What this is, precisely:** online preference learning with a linear model over twelve hand-designed features (syncopation, drum density, chord size, layers, register spread, brightness…), weights being the standardised difference between the liked and disliked groups, with confidence that ramps as ratings accumulate. It persists to `localStorage` and can be reset.

**What it is not: deep reinforcement learning.** A deep RL agent needs either a simulator with a programmatic reward or a large offline dataset of rated examples, and neither exists here — the only reward signal is a human pressing a button, which arrives a few dozen times, not a few million. A network trained on thirty examples would do nothing but memorise them. A linear model over meaningful features is the honest choice at this data volume: it learns from the very first rating, it cannot overfit into nonsense, and it can explain itself — the panel literally tells you *"you seem to prefer busier drums, more syncopated"*, which a neural net would not let it do.

**Verified with a simulated listener.** A synthetic user who consistently prefers syncopated, dense, rich-chord beats rated 60 beats, split at the median so the preference actually discriminated:

| | result |
|---|---|
| Top learned weights | **drumDensity 0.69, syncopation 0.60** — two of the three planted preferences, far ahead of everything else |
| Generated syncopation | 0.476 → **0.534** |
| Generated drum density | 0.604 → **0.664** |
| Preferred-feature average | 0.618 → **0.659 (+6.6%)** |

*(Two fixes were needed to get there, both found by measuring rather than assuming. The first model used raw mean differences, so a feature that barely varies across beats — harmonic rhythm — still contributed its noise to the weight vector and outranked real preferences; dividing by each feature's standard deviation turns the weight into "how many standard deviations apart are the two groups", which identified the right features immediately. The second: selection alone did nothing, because the search can only pick from the twelve candidates it was handed — if none of them lean the right way, re-weighting the scorer changes nothing. Taste now also nudges the same generation knobs the complexity dial uses.)*

## Type beats

Type in an artist and the program configures a session the way a producer would before writing anything: genre, tempo range, key preference, scale, swing, complexity, kit choices and which solo voices belong. **112 profiles** across all 19 genres, each with a one-line note on what actually characterises the sound. An unrecognised name falls back to the genre-keyword parser, so "some random drill guy" still produces a drill beat.

| genre | profiles | | genre | profiles |
|---|---|---|---|---|
| trap | 20 | | rock | 7 |
| hiphop | 10 | | lofi | 6 |
| synthwave | 8 | | drill | 6 |
| neosoul | 8 | | afrobeats | 6 |
| house | 7 | | rnb | 5 |
| ukgarage | 5 | | techno | 5 |
| dnb | 4 | | reggaeton | 4 |
| dubstep | 3 | | amapiano | 3 |
| phonk | 2 | | jerseyclub | 2 |
| rap | 1 | | | |

Every profile is validated at build time: the genre must exist, every kit it names must be in that track's pool *and* allowed in that genre, every solo instrument must be real, and the tempo range must be sane. That check caught eleven broken profiles on the first run — kits referenced on the wrong track (`ms20` is a lead flavor, not a bass one; `606` is a hi-hat, not a snare) and five cases where the kit genuinely belonged but the genre map was too narrow (liquid D&B does use string machines and piano house piano; darksynth is built on hoovers).

### Credit, and what it actually does

There is a credit panel under the type-beat box, and it exists because two things get conflated constantly.

**What naming an artist does:** using a name to *describe a style* is ordinary descriptive use, and it is the established convention of the entire type-beat scene — the format was created by producers on YouTube and BeatStars because it is how buyers search, and it describes the style of the beat rather than implying endorsement or affiliation. The panel states that explicitly, and there is a one-click **"Copy upload title + description"** that writes the standard type-beat upload text with the influence credited and the composition's originality stated plainly.

**What it does not do:** credit is not a licence. Naming a rights holder does not grant permission to reproduce their recording — attribution and permission are separate things, and they always have been. So crediting an artist could not make it lawful to take their song's audio, strip the vocal and republish it.

That distinction is why this program is on solid ground: everything it outputs is composed from scratch by its own engine, so there is nothing of anyone else's in it to need a licence for. The credit text exists because being clear about influence is good practice and because the naming convention wants the artist in the title — not as a shield.

## MIDI export

The request was for FL Studio's own `.flp` format. That is proprietary and undocumented — there is no published specification, and a guessed `.flp` would at best fail to open. **MIDI is what the industry actually uses to move musical ideas between programs, and FL Studio imports it natively** (File ▸ Import ▸ MIDI file), so that is what this exports — which also works in Ableton, Logic, Reaper and everything else.

Format 1 SMF: a tempo track plus one track per instrument, drums on channel 10 with General MIDI note numbers, melodic parts with a GM program approximating each instrument. Validated by parsing the output back with an independent parser: **exact byte consumption, every note properly closed, no structural problems.**

## A real bug this round surfaced

Flavor names are namespaced per track — the hi-hat's `bright` and the talkbox's `bright` are unrelated sounds that merely share a word. But `FLAVOR_GENRES` was keyed by the bare name, so a restriction written for one instrument silently applied to every other instrument with the same flavor name.

The talkbox's `bright` vowel path is house/R&B-only. That quietly made **the plain bright hi-hat — one of the most common hat sounds there is — unavailable in fifteen of nineteen genres**, and did the same to the lead synth's `flute` preset. Keys may now be written `track:flavor`, and an instrument-specific entry wins over the bare name. Found by validating that every artist profile's kit reference actually resolves.


## The reel is as long as your beat

The reel used to run for a fixed 15, 30, or 60 seconds regardless of what the beat actually was, which is the wrong unit entirely: a 4-bar loop got chopped mid-phrase, and a full song got truncated a third of the way in. **Length is now derived from the pattern**, so a video always contains a whole number of loops and never cuts off in the middle of a bar.

- **4 bars / 8 bars** → the picker offers 1, 2, 4, or 8 loops, each labelled with its real running time at the current tempo (`2 loops (15s)`).
- **Full Song** → one option, the whole arrangement, labelled with its actual duration (`Full song (1:37)`).
- The times account for **swing**, which lengthens every odd step, and are recomputed live whenever the tempo, swing, bar count, or generated pattern changes.

*(Bug found while building this: the durations were refreshed on the bars button, which fires **before** the new pattern is generated — so the label showed the length of the *previous* arrangement. Switching 4 → 8 bars showed 7s instead of 15s, and Full Song showed 14s instead of 1:37. The refresh now happens at the end of `generatePattern()`, the one place where a new pattern is guaranteed to exist.)*

## Making the video worth watching

The exported video is what most people will actually see of a beat, so it now gets the same treatment as the audio: layered, reactive, composed. Every element is driven by either the pattern itself or the live analyser, so the picture moves *with* the music instead of sitting on top of it as decoration.

**The frame, back to front:**

- **A drifting two-tone background.** The genre accent is rotated 58° around the colour wheel to derive a second, harmonically related colour, and the two blooms drift on slow independent sine paths. A vignette pulls the eye to the centre column.
- **Film grain.** A 128px noise tile, generated once and re-tiled with a jittered origin each frame. This is not just texture — large flat gradients *band* badly under video compression, and grain is the cheapest possible fix. It also stops the render looking drawn rather than filmed.
- **A mirrored spectrum ribbon** on real FFT data, exponentially smoothed (a raw analyser read flickers badly) with roughly logarithmic bin spacing, because linear indexing wastes most of the ribbon on high frequencies nothing in a beat occupies.
- **The note field**, now with a dark scrim behind it so the background blooms can be strong without tinting the notes; per-lane colour-tinted columns; **motion tails** trailing each note, which is what sells speed; a **bright leading-edge cap** on the part about to hit; and a white core that only blooms in as a note nears the strike line — held high everywhere, distant notes washed out to grey and stopped reading as their instrument.
- **Impact sparks and ripples.** Every hit fires a small burst of additively-blended particles and an expanding ellipse on the strike line. Spark count scales with how loud the hit actually is: ghost notes barely register, rolls and kick/snare/crash hit hardest. They're deliberately restrained and retired the moment they fall past the lane labels — sparks drifting over the chord readout just look like dirt on the lens.
- **The whole stack breathes.** Kick hits drive a 1.5% zoom on the entire frame; crashes add a decaying shake. Subtle enough to feel, not enough to read as a glitch.
- **A type layer** with letter-spaced all-caps labels (canvas has no reliable `letterSpacing`, so it's drawn glyph by glyph), a live bar counter, four beat dots with the current beat lit, the section pill, and a chord readout that **scale-pops on every chord change** — which makes the harmony legible as *movement*, the whole point of showing it.
- **A title card and an end card**, 1.4s each. A beat video that just starts mid-pattern gives a scroller nothing to latch onto.

**Two progress readouts, because they answer different questions.** The segmented bar above the footer is a *bar counter* — where you are inside the loop, resetting with it (and collapsing to one continuous bar past 16 bars, where segments shrink to unreadable dots). The hairline welded to the very bottom edge is the *scrubber* — how much of the video is left, which is what a viewer deciding whether to keep watching actually looks for. It's drawn outside the kick-zoom transform so it stays pinned to the edge instead of bobbing with the beat.

**Recording quality** went up too: 60fps capture instead of 30 (the note field scrolls continuously, and at 30fps the motion strobes against the beat grid), 12 Mbps video and 192 kbps audio instead of the browser defaults — 1080×1920 of gradients and glow is exactly the content a conservative default bitrate turns into blocky mush.

**An adaptive-quality guard** thins the particle system if frames get expensive, rather than dropping the recording's frame rate. *(Bug found while building this: the first version measured the **gap between frames**, which also reflects browser throttling you can't do anything about — under a headless test harness it read 88ms per frame and stripped the visuals to minimum quality while the actual draw was costing 1.9ms. It now measures the draw itself.)*

## Why the guitar sounded wrong: there was no speaker

The guitar had a physical string model, real strumming, and double-tracking — and still sounded bad, because the most important component of an electric guitar's sound was missing entirely: **the speaker cabinet.**

A real guitar speaker produces essentially nothing below ~80 Hz or above ~5 kHz, and that steep top-end rolloff is precisely what makes a distorted guitar sound like a guitar rather than like fizzing noise. Distortion generates enormous amounts of harsh high-frequency content; a physical speaker simply cannot reproduce it, so on every record you have ever heard, it is gone. Sending raw distortion straight to the output — which is what was happening — keeps all of it.

The guitar now runs a real signal chain, in the order a real rig does:

**string → tightening EQ → distortion → speaker cabinet**

- **The pre-distortion highpass** is standard high-gain practice: low frequencies hitting a distortion stage intermodulate into mud, so engineers tighten the low end *before* the gain, never after.
- **The cabinet** is two cascaded lowpasses (approximating the steep acoustic rolloff), a presence peak at 2.6 kHz for the upper-mid bite every speaker has, a low-mid bump for cabinet resonance, and a highpass to remove sub content a 12" driver can't move.
- **Acoustic and nylon guitars get a body instead** — the Helmholtz air resonance near 104 Hz and the top-plate resonance near 205 Hz, which is most of what separates a real acoustic from a bare plucked string.
- **Pick noise** — the plectrum scraping the wound string before the note speaks — is on every picked flavor, and deliberately absent from nylon, which is played fingerstyle.
- **Clean electric still goes through a cab**, because a clean tone played direct sounds thin and clinical; even clean guitar tracks are mic'd cabs.

## Every instrument can play chords now

The engine used to split instruments into two fixed camps: chordal parts that always played block chords, and melodic parts that could only ever play one note at a time. Real arrangements don't work that way — a rhythm guitar strums full triads, a lead is harmonised in 3rds, a sax section plays block harmony, a bassist jumps octaves.

Any melodic line can now carry a stack of scale-degree offsets alongside its root note, so the same motif logic produces a single line or a chord depending on what the part calls for. Voicings available: triad, seventh, third, sixth, fifth, octave.

Crucially, **harmony is applied to structural notes rather than to every passing sixteenth**, which is how players actually voice things: you strum the chord on the strong beat and single-note the runs in between. Short passing notes stay single so a run doesn't turn into chord soup. Each part's setting matches how it's really played — Rock guitar strums triads 85% of the time, Neo-Soul guitar comps 7th chords, Afrobeats highlife guitar stays mostly single-note, Synthwave leads harmonise in 3rds, Rap's Auto-Tune hook stacks harmony the way stacked vocals do, and House/Techno basslines jump octaves occasionally.

## Every beat is composed, not just rolled

The most important change in the whole project. Generating one random pattern and shipping it means the program never actually *tries* to make a good beat — it accepts whatever the dice produced. Real producers write several versions of an idea and keep the one that works, so that's what happens now: **each request composes twelve complete candidate beats, judges each against real musical criteria, and returns the strongest.**

Nothing scored is a proxy for novelty; every criterion is a property music is actually judged on:

- **Harmonic coherence** (weighted heaviest). A note sounding on a strong beat should belong to the chord underneath it. Dissonance on a weak beat is passing colour; dissonance on a downbeat is a wrong note. Weak beats are scored toward ~65% consonance rather than 100%, because an all-chord-tone melody is bland.
- **Bass anchoring the harmony** — the bass under a bar's downbeat should be that chord's root. That's what makes a progression read *as* the progression.
- **Register separation** between melodic voices, so parts don't fight for the same octave.
- **Interlock, not collision** — voices sharing a step ~20% of the time reads as an ensemble; constant overlap is clutter, zero overlap is incoherent.
- **Density sweet spot**, **singable range** (~an octave), **contour** (mostly steps, occasional leaps), **hook recurrence** (bar 3 restating bar 1), and **chords actually sounding** rather than rolling their way into silence.

**And then it reworks what it chose.** Picking the best of several candidates is only half of how music gets made; the other half is iteration. A producer keeps the take, then reworks the bassline, then the hook, auditioning each change *against everything already in place*. So after selection, each melodic part is re-composed several times and the version that makes the **whole arrangement** score best is kept, one instrument at a time, twice through. Because every trial is judged in context, the parts end up fitting each other rather than merely being individually acceptable — which is exactly the difference between a pile of decent parts and an arrangement.

The scoring also judges the harmony itself, not just the melody over it: **chordal parts are checked against the progression** (a comping part on the wrong chord is far more damaging than a melody note doing it, because the chord *is* the harmony), **low-end mud** is penalised (more than one voice in the bass octave at once is the most common way an arrangement turns to soup), and **harmony density** is targeted near 30% (some chord-voiced notes give body; every note voiced as a chord is a wall).

Measured across all 19 genres:

| | Random first attempt | Composed + refined |
|---|---|---|
| Overall musical quality | — | **+21%** |
| Melody on strong beats that are chord tones | 90.0% | **99.6%** |
| Bass downbeats on the chord root | 82.3% | **99.9%** |
| Low-end mud (2+ voices in the bass octave) | 3.2% | **2.2%** |
| Identical beats between generations | — | **0.0%** |

Beats got dramatically more intentional while generation-to-generation variety *improved*. The whole compose-and-refine pass costs **~11ms** in the browser — imperceptible, because it's array math, not audio.

## Ten techniques taken from how records are actually made

1. **Filter sweeps as arrangement** (house, techno, dubstep, DnB, UK garage, synthwave). In club music a resonant lowpass opening across a section *is* the arrangement — it does the work that adding instruments does elsewhere. Every melodic track now has a filter that automation drives, with per-section curves: closed and rising through intros and builds, wide open in choruses, pulled back for the bridge. Cutoff is mapped exponentially, because a linear sweep sounds like nothing and then lurches.
2. **Double-tracked, hard-panned rock guitars.** The single biggest missing piece of a real rock sound. Two genuinely *separate* performances — each with its own strum timing and detune — panned hard left and right. Copying one track to both sides does not work; the width comes precisely from the differences between two human takes.
3. **Gated reverb** on the Synthwave snare — a big bright reverb slammed shut by a noise gate before it can decay. Discovered by accident at Townhouse Studios and instantly became *the* 80s drum sound. The abrupt cut is the point, so the tail is held flat and then killed rather than faded.
4. **Ghost notes** — quiet snare taps between the backbeats, which real drummers play almost constantly and whose absence is much of why programmed drums sound stiff. Applied only to the genres whose drum language actually uses them (rock, R&B, neo-soul, hip-hop, lo-fi, DnB, garage), never to an 808 pattern.
5. **Per-instrument timing pockets.** A single global humanize value can only make everything equally sloppy; real ensembles sit in *different* pockets simultaneously. The Dilla/Questlove feel is drums dragging while the bass stays forward — a relationship between parts. Neo-Soul now runs its snare 16ms late and its bass 3ms early.
6. **The pre-chorus drop-out** — one beat of near-silence right before the chorus, leaving only the riser. The cheapest and most reliable trick in arrangement, and it always works.
7. **Sub/mid bass separation** for Reese and growl basses. A clean sine sub carries the low end while the mangled layer carries the character, high-passed so the two never share an octave — without the split, the detuning phase-cancels in the sub and the low end goes soft.
8. **Vocal stacking.** A solo synthesized vowel sounds thin because records almost never use one. A quiet doubled voice — slightly detuned and delayed, the way a second take differs — now sits under every single-voice vocal.
9. **Tresillo-aware kick mutation** for Reggaeton, Afrobeats, and Amapiano. Those kicks articulate the 3+3+2 cell underlying dembow and most Afro-diasporic dance rhythm; mutating them generically smears the very figure that defines the groove, so mutation is now constrained to positions inside the cell.
10. **DJ-length intros and outros** for House, Techno, and UK Garage — 8 bars of drums at each end. Club records are built to be mixed, which is why they don't open on the hook.

## A measured audit, and the ten fixes that came out of it

Rather than guessing at what sounded off, ~6,000 generated beats across all 19 genres were measured against how real records are built. Every number below is before → after.

- **Melodies spanned 2–3 octaves; real hooks span about one.** Register jitter, the answer-phrase octave drop, and motif transposition were all widening the range at once. Notes are now folded by whole octaves back into a singable window (which preserves each note's scale identity, so harmony is untouched), the octave drop dropped from a coin flip to an occasional contrast, and register jitter became home-aware so high-sitting leads never get pushed higher. **Within-phrase span 17 → 12–16 semitones; top end 2794 Hz → ~1100 Hz.**
- **There was no metric accenting at all** — velocity was pure random jitter with no idea where in the bar a hit landed, which is most of why programmed drums read as machine-like. Hits now follow the metric hierarchy (downbeat strongest, then backbeat, then remaining quarters, with 8th- and 16th-offbeats progressively softer). On a 16th-note hi-hat line that loud/soft alternation is essentially the whole difference between grooving and buzzing.
- **The crash cymbal never fired in loop mode** — a real bug. Placement looked for a bar *after* a fill, but a loop always ends on its fill, so there was never one. Playback wraps, so the fill now resolves onto bar 1's downbeat. **0.00 → 1.00 crashes per loop.**
- **Rock lost its backbeat half the time.** Its two grooves were different *feels* — one with the snare on 2 and 4, one half-time on beat 3 — so half of all Rock generations abandoned the genre's most defining trait. Both grooves now keep the backbeat and vary the kick and ghost notes instead. **Snare on 2 and 4: 73%/59% → 100%/100%.** Amapiano (which flipped between beat 3 and 2-and-4) and Techno (whose variant dropped the beat-2 clap) had the same problem and got the same treatment.
- **The chorus barely lifted in 13 of 19 genres, and Dubstep's chorus was actually quieter than its verse.** Sections now scale how many optional hits land — choruses fire more, verses hold back — and the sparse trap-family genres get their lift the way real records do, through more hi-hat rolls rather than more instruments. **Every genre now clears a 1.15 lift; Dubstep 0.98 → 1.19, Rap → 1.42.**
- **Everything summed dead-center mono.** Kick, snare, bass, and lead stay up the middle; supporting parts now spread across the stereo field so each has its own space.
- **Chords were always root-position stacks of thirds**, so a progression read as unrelated blocks. Each chord now picks the inversion that sits closest to the previous one — common tones stay put, the rest step. **3 → 9 distinct voicing shapes, average movement 1.15 scale degrees.**
- **The featured-voice hierarchy only worked in loop mode** — full-song mode overwrote it. It's now applied on top of the arrangement curves, where an intentional lead matters most.
- **Loops were rhythmically static** (86–100% bar-to-bar onset similarity) because two of the four motif variations only moved pitch. Two rhythm-changing transforms were added: dropping a note to open space, and displacing the phrase off its grid position.
- **Per-genre:** Afrobeats' relentless 16th shaker (the app's most cluttered texture) moved to 8ths with 16ths as optional fills (**16.0 → 10.6 hits/bar**); Dubstep's bass could descend to 23 Hz, inaudible on phones while still eating headroom, and anything under 33 Hz is now lifted an octave (**audible floor 23 → 55 Hz**); Drum & Bass's tempo floor moved from 160 to 165 BPM to match the genre's real center; intros now layer in gradually across the bar instead of being near-silent throughout.

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
- **A kick-reactive pulse.** The visuals genuinely scale up on every kick hit (tracked live off the actual pattern data as it plays, decaying smoothly between hits), so the video visibly breathes with the beat instead of just showing generic audio-reactive noise.
- **A live section badge** in Full Song mode — a small pill reading INTRO / VERSE 1 / CHORUS 1 / BRIDGE / etc., pulled from the real arrangement data, so the video narrates where it is in the song.
- Genre name, tempo/key, the Beat Studio wordmark, and a progress bar round it out.

*(The radial ring visualiser and the instrument-activity dot row described here were later replaced — see "The reel now shows the notes" and "Making the video worth watching" above for what the frame looks like now.)*

Under the hood: the canvas is captured as a video track (`canvas.captureStream`) and combined with the actual mixed audio, tapped straight off the engine's master bus via a `MediaStreamAudioDestinationNode` (the same fully-processed signal — EQ, sidechain, grit, compressor and all — that comes out of the speakers, not a separate re-render). Both tracks are recorded together with `MediaRecorder` into a `.webm` file, then automatically downloaded — pick how many loops (or the full song), hit export, and a file lands in your downloads folder named after the genre. Recording restarts playback from the top of the pattern so the clip always begins at the start of the beat, and the whole thing can be cancelled mid-recording without leaving playback or the UI in a broken state.

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
