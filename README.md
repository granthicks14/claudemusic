# Beat Studio

Describe the beat you want in plain English, or pick from 15 genres, and get either a quick loop or a full ~2-minute song with a real intro/verse/chorus/bridge/outro arrangement — drums, bass, piano, organ, lead, guitar, kalimba, strings, horns, vocal chops, pads, synth stabs, and an FX riser — then edit and mix it like a mini DAW, right in the browser. Everything is synthesized live with the Web Audio API; no audio files or dependencies required.

## Run it

Open `index.html` in a browser, or serve the folder locally:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## How it works

- `js/theory.js` — scales (including phrygian for drill's dark mode), keys, chord building, note-name/frequency conversion.
- `js/patterns.js` — per-genre templates for drums and chordal instruments, each style's key/scale/chord progression, the per-instrument sound-flavor pools that get auto-shuffled on every generation, two arrangement builders (a short intro/main/fill loop, and a full verse/chorus **song structure**), and the **motif-based melody generator** that drives bass, lead, and guitar.
- `js/audio-engine.js` — synthesizes every instrument live (including a distorted guitar voice, a vibrato string voice, an Amapiano-style log-drum bass, and an LFO wobble bass), runs the mixer (volume/mute/solo/reverb send per track), and the mix bus: sidechain ducking, a glue compressor, and a reverb send effect.
- `js/app.js` — the channel rack UI, the free-form piano roll editor (drag to draw/resize/move notes), and the "describe your beat" prompt parser.

## Describe the beat you want

Type something like *"dark energetic trap with vocal chops"* or *"chill lofi piano beat"* into the box at the top and hit Generate. This is a lightweight keyword/mood parser, not a language model: it matches genre names and aliases (including things like "boom bap," "amapiano," "dembow," "four on the floor"), then layers on mood words —

- **dark/moody/sad** → shifts a major-scale style into a darker minor key
- **happy/bright/uplifting** → shifts a minor-scale style into a brighter major key
- **chill/relaxed/slow** vs **hype/energetic/hard** → pushes the tempo to the bottom or top of the genre's range
- **long/extended/epic** → builds a full-length verse/chorus arrangement instead of a 4-bar loop
- **vocal/vocals/choir/singing** → adds a vocal-chop track *if the matched genre doesn't already have one*, per the brief to only add vocals "if that beat needs one"

If nothing matches a known genre, it says so and falls back to the closest reasonable genre rather than silently guessing.

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
- **Rap** *(new)* — researched specifically from Kanye West and Lil Baby's production. Deep 808 bass (the *808s & Heartbreak* legacy: TR-808-driven, minor-key, minimalist), sparse drums that deliberately leave room for the hook rather than competing with it (Lil Baby-style "less is more"), a bouncy triplet-feel kick/hi-hat pattern approximating the 1/12-note ("triplet") quantization Lil Baby's records are known for, an Auto-Tune-style sung vocal hook, and a repeating kalimba melody — the kalimba/melodic-loop sound that's become a signature of modern melodic trap.

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

That's over 110 total instrument/flavor combinations, every one of them a real, distinct signal path rather than a palette swap.

## New instruments: pianos, guitars, organ, kalimba, an FX riser, and a synthesized vocal chop

- **Organ** — a Hammond-style drawbar stack (sine partials at the classic fundamental/octave/octave+fifth ratios), with a driven "gospel" voice that adds overdrive and Leslie-style tremolo. Added where it's genuinely idiomatic: gospel-sample hip-hop, Fela Kuti-style Afrobeat, and classic Rhodes+organ R&B/soul.
- **Vocal** — since real vocal samples aren't available in a dependency-free browser app, this is built with **formant synthesis**: a sawtooth source through three parallel bandpass filters tuned to vowel formant frequencies (three vowel presets now: "ooh," "ahh," "ay"), the same technique speech synthesizers use to fake a sung vowel. Present by default on the genres where vocal chops are a genuine signature sound (house, trap, reggaeton, dubstep, phonk, Jersey Club, Rap), and addable to any other genre via the prompt box.
- **Kalimba** *(new)* — a plucked-tine tuned-percussion voice (a noise "thumb pluck" transient plus inharmonic sine partials, with a "Music Box" variant), driven by a *different* melody generator than the other lead instruments: low variation, tight rhythm, so it repeats as a genuine ostinato loop rather than an evolving motif — matching how kalimba/melodic-loop hooks actually function in modern rap and Afrobeats records, where they're a hypnotic repeating figure, not a developing melody.
- **FX Riser** *(new)* — a rising bandpass-filtered noise sweep, the classic pre-drop/pre-chorus transition effect. In Full Song mode it's placed automatically one bar before every chorus, regardless of that bar's instrument density, because a section-change riser is a deliberate arrangement choice, not something that should get masked out by the general layering system.

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
- **See what's playing, live.** During playback, whichever note or chord is currently sounding lights up — the note bar itself glows, and in an open piano roll the matching keyboard row highlights too, exactly like watching FL Studio's piano roll light up as a pattern plays. A moving playhead line sweeps across the whole arrangement.
- **Hover for the note name.** Every note bar shows its length and, when there's room, its actual note name (e.g. "E4") printed right on the bar; hovering shows the full name and duration.
- **Drag to draw, resize, move, or delete.** Click-drag on empty space to draw a note of any length, drag its right edge to resize, drag its body to move it, or click it to delete — the same interaction whether you're in the piano roll or looking at the compact channel-rack overview.

## Editing an instrument's volume over the whole song

Every melodic/chordal track gets a new **A** button (next to Mute/Solo) that opens a volume-automation editor — a draggable curve across the entire arrangement, exactly like an automation clip in a real DAW: click empty space to add a point, drag a point to move it, click a point to delete it, and "Reset to Flat" clears it back to a constant level. This is genuinely applied at playback, not just visual — the engine reads the curve every step and scales that instrument's volume accordingly, live, even while a beat is already playing.

In **Full Song** mode, atmospheric and feature instruments (pad, strings, organ, lead, vocal, kalimba) get a sensible automation curve generated automatically — quiet in the intro, swelling into each chorus, dipping for the bridge breakdown, fading out over the outro — because that's the kind of thing a mix actually needs over a multi-minute arrangement; short loops are left flat since a 4-bar loop has nowhere to "build" to. You can always override the generated curve by hand.

## Editing it like a DAW

- **Channel rack** — every instrument is a row with a color swatch, mute (M), solo (S), a volume fader, and a reverb-send fader. Click empty space on any row's lane to add a hit/note, click an existing one to remove it.
- **Piano roll** — click a track's name to open its dedicated editor, scale-snapped so nothing plays a wrong note.
- **Generate Beat** (and the prompt-box Generate) — builds a fresh loop or full song from scratch, and re-rolls the timbre ("flavor") of every instrument at the same time, guaranteed to pick something different from what's currently playing. There's no separate shuffle button to press — every beat you generate automatically comes with a fresh set of sounds, with a status line confirming exactly what changed (e.g. "Kick → 808, Snare → clap...").

Every hit also gets small randomized pitch/decay/timing/velocity variation at playback, so nothing ever sounds mechanically identical twice.

## A live audio visualizer, and a look tied to the genre you pick

A real frequency visualizer (Web Audio's `AnalyserNode`, tapped straight off the master bus after the compressor) animates while a beat plays — no fake/decorative animation, it's reading the actual output. The workspace panel's border and glow also pick up the selected genre's accent color instead of staying one fixed color for every style, so the whole page feels like it belongs to the beat you're making.

## A note on the vocal instrument

It's genuinely synthesized (formant filtering, not a recording), and it reads as a vowel-like "ooh"/"ahh" chop rather than an actual voice — a real sung or sampled vocal isn't achievable without shipping audio files. If you want something closer to a real vocal texture, the honest next step would be adding a small set of licensed one-shot vocal samples rather than pushing the synthesis further.
