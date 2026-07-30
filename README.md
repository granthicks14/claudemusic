# Beat Studio

Pick a style, get a full multi-instrument arrangement — drums, bass, melody, chords, pads, and synth stabs — then edit it like a mini DAW, right in the browser. Everything is synthesized live with the Web Audio API; no audio files or dependencies required.

## Run it

Open `index.html` in a browser, or serve the folder locally:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## How it works

- `js/theory.js` — scales, keys, chord building, and note-name/frequency conversion.
- `js/patterns.js` — per-style genre templates for drums *and* melodic instruments (bass, piano, lead, pad, synth stab), each style's key/scale/chord progression, the sound-flavor pools used by "Shuffle Sounds," and the arrangement builder (intro → main → fill).
- `js/audio-engine.js` — synthesizes every instrument live (multiple timbre "flavors" each), runs the per-track mixer (volume/mute/solo), applies swing/timing/velocity humanization, and drives hi-hat rolls and melodic voices.
- `js/app.js` — the channel rack UI: style/key/tempo/bar-length selection, click-to-edit step cells, the piano roll editor, and sound shuffling.

## Styles

Each style's groove, chord progression, and instrumentation is modeled on real production conventions:

- **Hip-Hop** — boom bap kick/snare with ~58% MPC-style swing, moody minor piano chords.
- **Trap** — sparse kick, sliding 808 bass, rapid hi-hat rolls, a hypnotic bell melody hook.
- **House** — four-on-the-floor kick, offbeat open hats, classic off-beat house piano stabs, a pad bed.
- **Rock** — backbeat snare, driving eighths, a synth riff hook, crash-out fills with tom rolls.
- **Reggaeton** — the dembow tresillo (3-3-2) kick pattern with rimshot answers and a synth hook.
- **Lo-Fi Chill** — softened boom bap, jazzy 7th-chord piano, a warm pad bed, vinyl crackle.

## Editing it like a DAW

- **Channel rack** — every instrument is a row with a color swatch, mute (M), solo (S), a volume fader, and a step lane. Click any cell to toggle it on/off directly.
- **Piano roll** — click a track's name to open a dedicated note editor for it, snapped to the song's scale so nothing plays a wrong note. Melodic instruments (bass, lead) show individual pitches; chordal instruments (piano, pad, stab) show the seven diatonic chords to choose from.
- **Key & scale** — change the key from the transport bar at any time; the whole arrangement transposes instantly.
- **Shuffle Sounds** — re-rolls the timbre ("flavor") of every instrument — different kick punch, different piano character (electric/pluck/grand), different lead tone (square/saw/bell) — without touching your edits or the pattern.
- **Generate Beat** — builds a fresh 4- or 8-bar arrangement (a sparser intro, an evolving groove, and a fill with extra hits every 4th bar, capped with a crash) from scratch.

Every hit also gets small randomized pitch/decay/timing/velocity variation at playback, so nothing ever sounds mechanically identical twice.
