# Beat Studio

Describe the beat you want in plain English, or pick from 10 genres, and get a full multi-instrument arrangement with real composed melodies — drums, bass, piano, organ, lead, guitar, strings, horns, vocal chops, pads, and synth stabs — then edit and mix it like a mini DAW, right in the browser. Everything is synthesized live with the Web Audio API; no audio files or dependencies required.

## Run it

Open `index.html` in a browser, or serve the folder locally:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## How it works

- `js/theory.js` — scales (including phrygian for drill's dark mode), keys, chord building, note-name/frequency conversion.
- `js/patterns.js` — per-genre templates for drums and chordal instruments, each style's key/scale/chord progression, the sound-flavor pools used by "Shuffle Sounds," the arrangement builder (intro → main → fill), and the **motif-based melody generator** that drives bass, lead, and guitar.
- `js/audio-engine.js` — synthesizes every instrument live (including a distorted guitar voice, a vibrato string voice, an Amapiano-style log-drum bass, and an LFO wobble bass), runs the mixer (volume/mute/solo/reverb send per track), and the mix bus: sidechain ducking, a glue compressor, and a reverb send effect.
- `js/app.js` — the channel rack UI, the free-form piano roll editor (drag to draw/resize/move notes), and the "describe your beat" prompt parser.

## Describe the beat you want

Type something like *"dark energetic trap with vocal chops"* or *"chill lofi piano beat"* into the box at the top and hit Generate. This is a lightweight keyword/mood parser, not a language model: it matches genre names and aliases (including things like "boom bap," "amapiano," "dembow," "four on the floor"), then layers on mood words —

- **dark/moody/sad** → shifts a major-scale style into a darker minor key
- **happy/bright/uplifting** → shifts a minor-scale style into a brighter major key
- **chill/relaxed/slow** vs **hype/energetic/hard** → pushes the tempo to the bottom or top of the genre's range
- **long/extended/epic** → builds an 8-bar arrangement instead of 4
- **vocal/vocals/choir/singing** → adds a vocal-chop track *if the matched genre doesn't already have one*, per the brief to only add vocals "if that beat needs one"

If nothing matches a known genre, it says so and falls back to the closest reasonable genre rather than silently guessing.

## Genres

Ten styles, each modeled on real production conventions researched for this build, with instrumentation chosen to actually fit the genre (no synth stabs on a rock track, no four-on-the-floor kick pretending to be a dembow):

- **Hip-Hop** — boom bap kick/snare, ~58%-swing hi-hats, a soulful sustained melody and pitched string stabs (Kanye-style soul-sample chord loops).
- **Trap** — sparse kick, sliding 808, rolling hi-hats, a spacious bell hook (Metro Boomin-style restraint).
- **House** — four-on-the-floor kick, offbeat open hats, a tightly-looped arp and off-beat piano stabs (Daft Punk-style repetition).
- **Rock** — backbeat snare, a real guitar riff with an actual distortion circuit, no synths where a guitar/bass band wouldn't have them.
- **Reggaeton** — the dembow tresillo kick pattern, rimshot answers, horn stabs.
- **Lo-Fi Chill** — softened boom bap, jazzy extended chords, vinyl crackle, a wandering melody with lots of space (Nujabes/J Dilla).
- **Drill** *(new)* — a dark phrygian scale, sparse spacious kick, snare locked on beat 3, a tight sliding 808, a single moody piano line — distinct from trap's busier, brighter hook (researched from UK drill production breakdowns).
- **Afrobeats** *(new)* — syncopated kick, continuous 16th-note shakers, an Amapiano-style log-drum bass (a hybrid kick/808/percussion tone) that follows the chord root, a highlife guitar hook.
- **Dubstep** *(new)* — half-time drums (kick on 1, snare on 3), an LFO-modulated wobble bass with a layered sub, built the way dubstep basses are actually sound-designed.
- **R&B / Soul** *(new)* — a laid-back live-feel groove, lush 7th-chord Rhodes, orchestral string swells, a smooth vocal-style top-line melody.

## Real melodies, not random notes

Bass, lead, and guitar are generated the way hit songs actually build a hook, based on melody-writing research:

- **A small, reused pitch pool.** Most pop hooks use only 3–4 distinct notes, not a fresh pitch every time — so each motif draws from a constrained pool of chord/passing tones instead of sampling freely.
- **An arc contour.** Melodies read as "a tune" when they leap up and step back down rather than wander; each phrase is shaped into that rise-then-fall arc.
- **Question and answer.** Phrases come in pairs — the first "asks," and every second repeat "answers" by resolving its final note back to the tonic, the call-and-response structure behind most memorable hooks.
- **Repetition with variation.** The motif is stated once, then repeated across the arrangement with transposition, inversion, or truncation, so it reads as a recognizable, evolving theme instead of independent random notes.

## New instruments: pianos, guitars, organ, and a synthesized vocal chop

- **Piano** now has six voices: electric, pluck, grand, Rhodes, Wurlitzer (bright and reedy), and upright (soft, dark, acoustic).
- **Guitar** has five: clean, power (with a real distortion circuit), muted, nylon, and acoustic (a bright detuned steel-string pluck).
- **Organ** *(new instrument)* — a Hammond-style drawbar stack (sine partials at the classic fundamental/octave/octave+fifth ratios), with a driven "gospel" voice that adds overdrive and Leslie-style tremolo. Added where it's genuinely idiomatic: gospel-sample hip-hop, Fela Kuti-style Afrobeat, and classic Rhodes+organ R&B/soul.
- **Vocal** *(new instrument)* — since real vocal samples aren't available in a dependency-free browser app, this is built with **formant synthesis**: a sawtooth source through three parallel bandpass filters tuned to vowel formant frequencies (an "ooh" and an "ahh" preset), the same technique speech synthesizers use to fake a sung vowel. Present by default on the genres where vocal chops are a genuine signature sound (house, trap, reggaeton, dubstep), and addable to any other genre via the prompt box.

## Mixing: how producers actually make a beat sound good

Three techniques pulled directly from mixing research, applied to every beat:

- **Sidechain compression** — toggle "Sidechain" in the transport to duck everything but the drums whenever the kick hits (fast ~8ms attack, ~120ms release), the classic EDM/trap/house "pump" that lets the kick cut through. On by default for the genres that actually use it (trap, house, dubstep, afrobeats, drill); off for genres that don't (rock, lo-fi, R&B).
- **A glue compressor** sits on the master bus (a gentle 4:1 limiter-style compressor), the same "why does adding a limiter make my mix sound tighter" trick every finished track uses.
- **Reverb sends** — every track has its own send level (the small second "R" knob per row) into a shared reverb bus, with sensible per-instrument defaults (kick and bass stay dry for a clean low end; pads, strings, and crash get the most space) — real mix-bus technique, not just one global reverb slider.

Also newly exposed: a **global swing knob** (an FL Studio staple) that overrides the style's default swing live, on top of the existing key selector.

## Not a step sequencer for melody

Bass, lead, guitar, piano, pad, stab, strings, and horn are stored as notes with their own start position and duration, rendered as bars you can see and edit — a real piano roll, not step ticks. Drums stay on a step grid, since a drum hit is a discrete trigger rather than a sustained note.

## Editing it like a DAW

- **Channel rack** — every instrument is a row with a color swatch, mute (M), solo (S), a volume fader, and a reverb-send fader. Drum rows are click-to-toggle step cells; melodic rows show their notes as bars.
- **Piano roll** — click a track's name to open its dedicated editor, scale-snapped so nothing plays a wrong note. Drag to draw a note of any length, drag its right edge to resize, drag its body to move it, or click it to delete.
- **Shuffle Sounds** — re-rolls the timbre ("flavor") of every instrument, guaranteed to pick something different each time, with a status line confirming exactly what changed (e.g. "Kick → 808, Snare → clap...").
- **Generate Beat** — builds a fresh 4- or 8-bar arrangement from scratch.

Every hit also gets small randomized pitch/decay/timing/velocity variation at playback, so nothing ever sounds mechanically identical twice.

## A note on the vocal instrument

It's genuinely synthesized (formant filtering, not a recording), and it reads as a vowel-like "ooh"/"ahh" chop rather than an actual voice — a real sung or sampled vocal isn't achievable without shipping audio files. If you want something closer to a real vocal texture, the honest next step would be adding a small set of licensed one-shot vocal samples rather than pushing the synthesis further.
