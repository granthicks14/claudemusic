# Beat Generator

Pick a beat style and get a generated drum pattern you can play right in the browser. All sounds are synthesized live with the Web Audio API — no audio files or dependencies required.

## Run it

Open `index.html` in a browser, or serve the folder locally:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## How it works

- `js/patterns.js` — per-style templates (core hits + optional fills) for kick, snare, hi-hat, and open hat.
- `js/audio-engine.js` — schedules and synthesizes drum hits with the Web Audio API.
- `js/app.js` — wires up style selection, pattern generation, and playback controls.

Styles included: Hip-Hop, Trap, House, Rock, Reggaeton, Lo-Fi Chill. Click "Generate Beat" to get a new variation within the chosen style at any time.
