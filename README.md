# Beat Studio

Pick from 10 genres, get a full multi-instrument arrangement with real composed melodies — drums, bass, piano, lead, guitar, strings, horns, pads, and synth stabs — then edit and mix it like a mini DAW, right in the browser. Everything is synthesized live with the Web Audio API; no audio files or dependencies required.

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
- `js/app.js` — the channel rack UI and the free-form piano roll editor (drag to draw/resize/move notes).

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

Bass, lead, and guitar are generated the way songwriters build a hook: a short **motif** is composed once (targeting chord tones — root/3rd/5th — with occasional passing tones, in real rhythmic note values), then repeated across the arrangement with variation (transposition, inversion, truncation) — the repetition-with-variation principle behind real hooks and sample loops.

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
