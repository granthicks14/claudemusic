# Beat Studio

Pick a style, get a full multi-instrument arrangement with real composed melodies — drums, bass, piano, lead, guitar, strings, horns, pads, and synth stabs — then edit it like a mini DAW, right in the browser. Everything is synthesized live with the Web Audio API; no audio files or dependencies required.

## Run it

Open `index.html` in a browser, or serve the folder locally:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## How it works

- `js/theory.js` — scales, keys, chord building, and note-name/frequency conversion.
- `js/patterns.js` — per-style genre templates for drums and chordal instruments (piano, pad, stab, strings, horn), each style's key/scale/chord progression, the sound-flavor pools used by "Shuffle Sounds," the arrangement builder (intro → main → fill), and the **motif-based melody generator** that drives bass, lead, and guitar.
- `js/audio-engine.js` — synthesizes every instrument live (multiple timbre "flavors" each, including a distorted guitar voice and a vibrato string voice), runs the per-track mixer (volume/mute/solo), applies swing/timing/velocity humanization, and drives hi-hat rolls and melodic voices.
- `js/app.js` — the channel rack UI and the free-form piano roll editor (drag to draw/resize/move notes).

## Real melodies, not random notes

Bass, lead, and guitar are generated the way real songwriters build a hook: a short **motif** is composed once (a handful of notes targeting chord tones — root/3rd/5th — with occasional passing tones, in a rhythm of real note values, not fixed step-ticks), then repeated across the arrangement with small variations (transposition, inversion, truncation) so it reads as a recognizable, evolving theme rather than independent random hits per step — the same repetition-with-variation principle used in pop songwriting and sampling-based hip-hop. Each style's melody parameters (motif length, rest density, chord-tone bias, register) are tuned to genre conventions:

- **Hip-Hop** — a soulful, sustained "sampled vocal" style melody and chipmunk-soul-style pitched string stabs, in the spirit of Kanye West-style soul-sample chord loops.
- **Trap** — a sparse, spacious bell hook (Metro Boomin-style restraint) over a sliding 808 bassline.
- **House** — a tightly-looped, mostly-unchanged arpeggio riff and off-beat piano stabs, the way Daft Punk-style house loops repeat with minimal variation.
- **Rock** — a real guitar riff (clean/power/muted/nylon voices, including an actual distortion circuit) built from chord-tone targeting, the standard riff-writing technique.
- **Reggaeton** — a short, catchy synth hook plus horn stabs on the off-beats.
- **Lo-Fi Chill** — a gentle, wandering melody with lots of space, and jazzy extended (7th/9th-style) chords, in the Nujabes/J Dilla tradition.

## Not a step sequencer for melody

Bass, lead, guitar, piano, pad, stab, strings, and horn are no longer locked to fixed-length step ticks — each note is stored as its own start position and duration and rendered as a bar you can see and edit, exactly like a real DAW's piano roll, so a note can ring out for a beat, a bar, or longer wherever the music calls for it. Drums stay on a step grid, since a drum hit is a discrete trigger, not a sustained note.

## Editing it like a DAW

- **Channel rack** — every instrument is a row with a color swatch, mute (M), solo (S), a volume fader, and its pattern. Drum rows are click-to-toggle step cells; melodic rows show their notes as bars — click empty space to add a default note, click a note to delete it.
- **Piano roll** — click a track's name to open its dedicated editor, scale-snapped so nothing plays a wrong note. **Drag to draw a note of any length, drag its right edge to resize, drag its body to move it, or click it to delete** — melodic instruments show individual pitches; chordal instruments show the seven diatonic chords.
- **Key selector** — change the key from the transport bar at any time; the whole arrangement transposes instantly.
- **Shuffle Sounds** — re-rolls the timbre ("flavor") of every instrument — a different kick punch, a different guitar tone, a different string character — without touching your edits or the pattern.
- **Generate Beat** — builds a fresh 4- or 8-bar arrangement (a sparser intro, an evolving groove, and a fill every 4th bar capped with a crash) from scratch.

Every hit also gets small randomized pitch/decay/timing/velocity variation at playback, so nothing ever sounds mechanically identical twice.
