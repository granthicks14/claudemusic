# Beat Studio

Describe the beat you want in plain English, or pick from 15 genres, and get either a quick loop or a full ~2-minute song with a real intro/verse/chorus/bridge/outro arrangement — drums, bass, piano, organ, lead, guitar, kalimba, marimba, arp, strings, horns, vocal chops, pads, synth stabs, and FX — then edit and mix it like a mini DAW, right in the browser, and export it as a vertical video for Reels/TikTok/Shorts. Everything is synthesized live with the Web Audio API; no audio files or dependencies required.

## Run it

Open `index.html` in a browser, or serve the folder locally:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## How it works

- `js/theory.js` — scales (including phrygian for drill's dark mode), keys, chord building, note-name/frequency conversion.
- `js/patterns.js` — per-genre templates for drums and chordal instruments, each style's key/scale/chord progression, the per-instrument sound-flavor pools that get auto-shuffled on every generation, two arrangement builders (a short intro/main/fill loop, and a full verse/chorus **song structure**), and the **motif-based melody generator** that drives bass, lead, and guitar.
- `js/audio-engine.js` — synthesizes every instrument live, including a **Karplus-Strong physically-modeled plucked string** for every guitar and pluck-style bass voice, a vibrato string voice, an Amapiano-style log-drum bass, and an LFO wobble bass. Also runs the mixer (volume/mute/solo/reverb send per track) and the mix bus: sidechain ducking, a glue compressor, and a reverb send effect.
- `js/app.js` — the channel rack UI, the free-form piano roll editor (drag to draw/resize/move notes), the "describe your beat" prompt parser, and the vertical-video exporter (`MediaRecorder` + `canvas.captureStream`).

## Describe the beat you want

Type something like *"dark energetic trap with vocal chops"* or *"chill lofi piano beat"* into the box at the top and hit Generate. This is a lightweight keyword/mood parser, not a language model: it matches genre names and aliases (including things like "boom bap," "amapiano," "dembow," "four on the floor"), then layers on mood words —

- **dark/moody/sad** → shifts a major-scale style into a darker minor key
- **happy/bright/uplifting** → shifts a minor-scale style into a brighter major key
- **chill/relaxed/slow** vs **hype/energetic/hard** → pushes the tempo to the bottom or top of the genre's range
- **long/extended/epic** → builds a full-length verse/chorus arrangement instead of a 4-bar loop
- **vocal/vocals/choir/singing** → adds a vocal-chop track *if the matched genre doesn't already have one*, per the brief to only add vocals "if that beat needs one"

If nothing matches a known genre, it says so and falls back to the closest reasonable genre rather than silently guessing.

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

Fifteen styles, each modeled on real production conventions researched for this build, with instrumentation chosen to actually fit the genre (no synth stabs on a rock track, no four-on-the-floor kick pretending to be a dembow):

- **Hip-Hop** — boom bap kick/snare, ~58%-swing hi-hats, a soulful sustained melody and pitched string stabs (Kanye-style soul-sample chord loops).
- **Trap** — sparse kick, sliding 808, rolling hi-hats, a spacious bell hook (Metro Boomin-style restraint).
- **House** — four-on-the-floor kick, offbeat open hats, a tightly-looped arp and off-beat piano stabs (Daft Punk-style repetition).
- **Rock** — backbeat snare, a real guitar riff with an actual distortion circuit, no synths where a guitar/bass band wouldn't have them.
- **Reggaeton** — the dembow tresillo kick pattern, rimshot answers, horn stabs.
- **Lo-Fi Chill** — softened boom bap, jazzy extended chords, vinyl crackle, a wandering melody with lots of space (Nujabes/J Dilla).
- **Drill** — a dark phrygian scale, sparse spacious kick, snare locked on beat 3, a tight sliding 808, a single moody piano line — distinct from trap's busier, brighter hook (researched from UK drill production breakdowns).
- **Afrobeats** — syncopated kick, continuous 16th-note shakers, an Amapiano-style log-drum bass (a hybrid kick/808/percussion tone) that follows the chord root, a highlife guitar hook.
- **Dubstep** — half-time drums (kick on 1, snare on 3), a gritty saturated kick, an LFO-modulated wobble bass with a layered sub, built the way dubstep basses are actually sound-designed.
- **R&B / Soul** — a laid-back live-feel groove, lush 7th-chord Rhodes, a formant-synthesized choir pad, orchestral string swells, a smooth vocal-style top-line melody.
- **Phonk** *(new)* — a gritty, saturated 808 kick that doubles as the bassline, a hypnotic 808-style cowbell (two detuned square oscillators through a resonant bandpass filter, the real circuit trick), an eerie bell hook and vocal chops.
- **Jersey Club** *(new)* — a bouncy triplet-feel "kick-back" pattern (approximated on the 16-step grid the way most club edits actually chop it), heavily chopped vocal hooks as the lead element, dry and punchy.
- **Drum & Bass** *(new)* — fast syncopated breakbeat-style drums at ~172 BPM and a growling Reese bass (a stack of four detuned sawtooths beating against each other — the real technique behind the classic DnB bass sound).
- **Synthwave** *(new)* — 80s gated drums, an analog synth bass and a brass-lead hook (a resonant bandpass-emphasized saw, the 80s synth-brass-stab timbre synthwave leans on), a lush arpeggiated pad/stab bed.
- **Rap** — researched from Kanye West and Lil Baby's *808s & Heartbreak*-era minimalism, plus a second pass researching current hard-trap/rage production (Travis Scott, Future, Playboi Carti-adjacent) to make it hit harder: a genuinely distorted 808 (parallel distortion — a clean sub layer for low-end power plus a heavily saturated layer blended on top purely for harmonic bite, so it stays powerful instead of just getting louder), a saturated kick, hi-hat rolls that fire far more often and on more subdivisions than before, and a touch of master-bus saturation (see below) — while keeping the sparse arrangement and the Auto-Tune-style vocal hook and kalimba ostinato that make it feel like a real melodic-trap record, not just louder drums.

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

In **Full Song** mode, atmospheric and feature instruments (pad, strings, organ, lead, vocal, kalimba) get a sensible automation curve generated automatically — quiet in the intro, swelling into each chorus, dipping for the bridge breakdown, fading out over the outro — because that's the kind of thing a mix actually needs over a multi-minute arrangement; short loops are left flat since a 4-bar loop has nowhere to "build" to. You can always override the generated curve by hand.

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

"🎥 Export Reel" in the transport renders the current beat as a real, downloadable video file, entirely client-side — no server, no render farm:

- A portrait (9:16) canvas draws a genre-branded animation live while the beat plays: a frequency visualizer driven by the same real `AnalyserNode` data as the on-page visualizer, the genre name, current tempo/key, and a progress bar.
- The canvas is captured as a video track (`canvas.captureStream`) and combined with the actual mixed audio, tapped straight off the engine's master bus via a `MediaStreamAudioDestinationNode` (the same fully-processed signal — EQ, sidechain, grit, compressor and all — that comes out of the speakers, not a separate re-render).
- Both tracks are recorded together with `MediaRecorder` into a `.webm` file, then automatically downloaded — pick a 15/30/60 second length, hit export, and a file lands in your downloads folder named after the genre.

Recording restarts playback from the top of the pattern so the clip always begins at the start of the beat, and the whole thing can be cancelled mid-recording without leaving playback or the UI in a broken state. Browser note: this relies on `MediaRecorder` + `canvas.captureStream`, which Chrome, Edge, and Firefox all support; the export button will say so plainly if a browser doesn't.

## A note on the vocal instrument

It's genuinely synthesized (formant filtering, not a recording), and it reads as a vowel-like "ooh"/"ahh" chop rather than an actual voice — a real sung or sampled vocal isn't achievable without shipping audio files. If you want something closer to a real vocal texture, the honest next step would be adding a small set of licensed one-shot vocal samples rather than pushing the synthesis further.
