# Beat Generator

Pick a beat style and get a full multi-instrument arrangement you can play right in the browser. All sounds are synthesized live with the Web Audio API — no audio files or dependencies required.

## Run it

Open `index.html` in a browser, or serve the folder locally:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## How it works

- `js/patterns.js` — per-style genre templates (kick, snare, hi-hat, open hat, tom, percussion, bass, crash) and the arrangement builder that strings bars into an intro → main → fill structure.
- `js/audio-engine.js` — synthesizes every hit live (multiple sound "flavors" per instrument), applies swing/timing/velocity humanization, and drives hi-hat rolls and the bassline.
- `js/app.js` — wires up style selection, bar-length selection, pattern generation, and playback controls.

## Styles

Each style's groove is modeled on real production conventions for that genre:

- **Hip-Hop** — boom bap: hard kick, snappy snare, dark swung hi-hats (MPC-style ~58% swing).
- **Trap** — sparse kick, sliding 808 bass, and rapid hi-hat rolls at ~140 BPM.
- **House** — four-on-the-floor kick, clap on 2 & 4, offbeat open hats, syncopated bassline.
- **Rock** — backbeat snare, kick on 1 and the "and" of 3, driving eighths, crash-out fills with tom rolls.
- **Reggaeton** — dembow: the tresillo (3-3-2) kick pattern with rimshot answers and conga fills.
- **Lo-Fi Chill** — softened boom bap: muted layered kicks, dusty swung hats, a vinyl crackle bed.

## Arrangements, not loops

"Generate Beat" builds a 4- or 8-bar arrangement rather than a single repeating bar: a sparser intro bar, a groove that varies bar-to-bar, and a fill (extra tom/snare hits, hi-hat rolls) every 4th bar with a crash landing on the downbeat that follows it — the section labels above the grid show the structure. Every hit is synthesized with small randomized pitch/decay/timing/velocity variation, so no two generations — or even two hits of the same drum — sound identical.
