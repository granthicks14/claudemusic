const engine = new BeatEngine();

const styleSelect = document.getElementById("style-select");
const workspace = document.getElementById("workspace");
const generateBtn = document.getElementById("generate-btn");
const playBtn = document.getElementById("play-btn");
const tempoSlider = document.getElementById("tempo-slider");
const tempoValue = document.getElementById("tempo-value");
const masterSlider = document.getElementById("master-slider");
const swingSlider = document.getElementById("swing-slider");
const swingValue = document.getElementById("swing-value");
const sidechainBtn = document.getElementById("sidechain-btn");
const shuffleStatus = document.getElementById("shuffle-status");
const keySelect = document.getElementById("key-select");
const barsButtons = document.querySelectorAll("#bars-select button");
const sectionRow = document.getElementById("section-row");
const stepGrid = document.getElementById("step-grid");
const pianoRollPanel = document.getElementById("piano-roll");
const pianoRollTitle = document.getElementById("piano-roll-title");
const pianoRollGrid = document.getElementById("piano-roll-grid");
const pianoRollClose = document.getElementById("piano-roll-close");
const automationPanel = document.getElementById("automation-panel");
const automationTitle = document.getElementById("automation-title");
const automationLane = document.getElementById("automation-lane");
const automationClose = document.getElementById("automation-close");
const automationClearBtn = document.getElementById("automation-clear");
const promptInput = document.getElementById("prompt-input");
const promptGenerateBtn = document.getElementById("prompt-generate");
const promptStatus = document.getElementById("prompt-status");
const exportReelBtn = document.getElementById("export-reel-btn");
const reelDurationSelect = document.getElementById("reel-duration");
const reelOverlay = document.getElementById("reel-overlay");
const reelCanvas = document.getElementById("reel-canvas");
const reelStatus = document.getElementById("reel-status");
const reelCancelBtn = document.getElementById("reel-cancel");
const scratchBtn = document.getElementById("scratch-btn");
const chordInput = document.getElementById("chord-input");
const chordClearBtn = document.getElementById("chord-clear-btn");
const chordChips = document.getElementById("chord-chips");

// Widened from 264px to fit the new per-track flavor picker alongside the
// name/mute/solo/automation/volume/reverb controls without squeezing the
// track name to nothing.
const TRACK_HEADER_WIDTH = 356;

const DRUM_ORDER = ["kick", "snare", "hihat", "openhat", "tom", "perc", "crash", "fx"];
const MELODIC_ORDER = ["bass", "piano", "lead", "pad", "stab", "guitar", "strings", "horn", "organ", "vocal", "kalimba", "marimba", "arp", "autolead", "sax"];
const MONO_INSTRUMENTS = ["bass", "lead", "guitar", "kalimba", "marimba", "arp", "autolead", "sax"];

const TRACK_LABELS = {
  kick: "Kick", snare: "Snare", hihat: "Hi-Hat", openhat: "Open Hat", tom: "Tom", perc: "Perc", crash: "Crash", fx: "FX Riser",
  bass: "Bass", piano: "Piano", lead: "Melody", pad: "Pad", stab: "Stab", guitar: "Guitar", strings: "Strings", horn: "Horn",
  organ: "Organ", vocal: "Vocal", kalimba: "Kalimba", marimba: "Marimba", arp: "Arp", autolead: "Auto Lead", sax: "Sax",
};

const DEFAULT_LEN = { bass: 2, lead: 1, guitar: 2, piano: 2, pad: 8, stab: 1, strings: 4, horn: 1, organ: 4, vocal: 1, kalimba: 1, marimba: 1, arp: 1, autolead: 3, sax: 2 };

// Flavors are otherwise only ever set by a genre's defaults or by the
// random shuffle - there was no way to deliberately reach for, say, "I
// want the TR-909 kit" or "give this a DMX snare" by name. Every track
// with a FLAVOR_POOLS entry gets a real dropdown in its header instead, so
// every researched kit/instrument color in the app is directly choosable,
// not just something you might land on by luck.
const FLAVOR_LABELS = {
  "909": "TR-909", "909snare": "TR-909", linn: "LinnDrum", "707": "TR-707", "606": "TR-606", dmx: "DMX",
  timpani: "Timpani", clarinet: "Clarinet", frenchhorn: "French Horn", oboe: "Oboe", cr78: "CR-78",
  simmons: "Simmons SDS-V", "808": "808", sp1200: "SP-1200", talkingdrum: "Talking Drum", moog: "Moog",
  dx7ep: "DX7 E.Piano", juno: "Juno-106", vocoder: "Vocoder",
  "303": "TB-303", mellotron: "Mellotron", clav: "Clavinet",
  true808: "True 808", orchhit: "Orch Hit",
  ride: "Ride", rimclick: "Cross-Stick", woodblock: "Woodblock", slap: "Slap", whistle: "Whistle", glock: "Glockenspiel",
  // Four more documented drum machines.
  lm1: "Linn LM-1", rz1: "Casio RZ-1", hr16: "Alesis HR-16", r8: "Roland R-8",
  // World percussion.
  tabla: "Tabla", cabasa: "Cabasa", guiro: "Güiro", agogo: "Agogô", vibraslap: "Vibraslap",
  cajon: "Cajón", djembe: "Djembe", timbale: "Timbales", roto: "Roto-Tom", taiko: "Taiko",
  // Synths and keyboards.
  sh101: "SH-101", fretless: "Fretless", m1organbass: "M1 Organ Bass",
  m1piano: "M1 Piano", cp70: "CP-70", honkytonk: "Honky-Tonk",
  solina: "Solina Strings", cs80: "CS-80", voxhumana: "Vox Humana",
  farfisa: "Farfisa", accordion: "Accordion", harmonium: "Harmonium", m1organ: "M1 Organ",
  // Winds and free reeds.
  theremin: "Theremin", panflute: "Pan Flute", harmonica: "Harmonica", ocarina: "Ocarina",
  trombone: "Trombone", tuba: "Tuba", flugelhorn: "Flugelhorn", piccolo: "Piccolo",
  alto: "Alto Sax", bari: "Baritone Sax",
  // Strings, plucked and bowed.
  sitar: "Sitar", banjo: "Banjo", mandolin: "Mandolin", ukulele: "Ukulele", slide: "Slide Guitar",
  cello: "Cello Section", spiccato: "Spiccato", harp: "Harp",
  // Tuned percussion.
  hangdrum: "Handpan", balafon: "Balafon", kora: "Kora",
  xylophone: "Xylophone", tubularbell: "Tubular Bells",
};
function flavorLabel(key) {
  if (FLAVOR_LABELS[key]) return FLAVOR_LABELS[key];
  return key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const STYLE_ACCENTS = {
  hiphop: "#ff6b6b", trap: "#a55eea", house: "#26de81", rock: "#fd9644", reggaeton: "#fed330", lofi: "#45aaf2",
  drill: "#c0392b", afrobeats: "#ffa502", dubstep: "#3742fa", rnb: "#ff6b9d",
  phonk: "#8e44ad", jerseyclub: "#00cec9", dnb: "#e17055", synthwave: "#fd79a8", rap: "#ffa801",
  amapiano: "#e1b12c", ukgarage: "#00a8ff", techno: "#9c88ff", neosoul: "#e84393",
};

const SIDECHAIN_DEFAULT_ON = new Set(["trap", "house", "dubstep", "afrobeats", "drill", "phonk", "jerseyclub", "dnb", "synthwave", "rap", "amapiano", "ukgarage", "techno"]);

const TRACK_COLOR = {
  kick: "#ff6b6b", snare: "#feca57", hihat: "#48dbfb", openhat: "#0abde3", tom: "#ff9f43",
  perc: "#1dd1a1", crash: "#c8d6e5", fx: "#c8d6e5", bass: "#a55eea", piano: "#00d2d3", lead: "#ff9ff3", pad: "#54a0ff",
  stab: "#f368e0", guitar: "#ff6348", strings: "#7bed9f", horn: "#eccc68", organ: "#e58e26", vocal: "#ff7f9f", kalimba: "#fdcb6e",
  marimba: "#55efc4", arp: "#74b9ff", autolead: "#ff5e78", sax: "#ffb142",
};

let selectedStyleId = null;
let baseStyle = null;
let activeStyle = null;
let currentFlavors = {};
let currentPattern = null;
let selectedBars = 4;
let arrangementMode = "loop";
let openPianoRollInst = null;
let openAutomationInst = null;
let customChords = null; // parsed chord array, or null to use the genre's own progressions - sticks across genre switches on purpose

function activeRows() {
  return [
    ...DRUM_ORDER.filter((i) => activeStyle.drums.instruments.includes(i)),
    ...MELODIC_ORDER.filter((i) => activeStyle.melodic.monoInstruments.includes(i) || activeStyle.melodic.chordInstruments.includes(i)),
  ];
}

function renderStyleCards() {
  for (const id of Object.keys(STYLES)) {
    const style = STYLES[id];
    const card = document.createElement("button");
    card.className = "style-card";
    card.dataset.styleId = id;
    card.style.setProperty("--accent", STYLE_ACCENTS[id]);
    card.innerHTML = `<h3>${style.name}</h3><p>${style.description}</p>`;
    card.addEventListener("click", () => selectStyle(id));
    styleSelect.appendChild(card);
  }
}

function populateKeySelect(keyStr) {
  const letter = keyStr.match(/^[A-G]#?/)[0];
  const octave = keyStr.match(/-?\d+$/)[0];
  keySelect.innerHTML = "";
  keySelect.dataset.octave = octave;
  for (const name of NOTE_NAMES) {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    if (name === letter) opt.selected = true;
    keySelect.appendChild(opt);
  }
}

// Tempo/key/swing used to reset to the exact same genre-default numbers on
// every single generation, which is a big part of why repeated beats in
// the same genre could feel like "the same vibe every time" - the melody
// notes and instrument timbres varied, but the tempo, the key the whole
// song was in, and the feel of the swing never did. Real songs in the same
// genre are absolutely not all in the same key at the same BPM, so all
// three now roll fresh within a sensible range on every generation instead
// of only being changeable by hand.
function randomizeKey(baseKeyStr) {
  const octave = baseKeyStr.match(/-?\d+$/)[0];
  const letter = NOTE_NAMES[Math.floor(Math.random() * NOTE_NAMES.length)];
  return letter + octave;
}

function randomizeTempo(tempoRange) {
  return Math.round(tempoRange.min + Math.random() * (tempoRange.max - tempoRange.min));
}

function randomizeSwing(baseSwing) {
  const jitter = (Math.random() * 2 - 1) * 0.04;
  return Math.max(0, Math.min(0.3, baseSwing + jitter));
}

function rollTempoKeySwing(baseStyle) {
  const key = randomizeKey(baseStyle.key);
  populateKeySelect(key);
  activeStyle.key = key;
  engine.updateKey(activeStyle);

  const tempo = randomizeTempo(baseStyle.tempo);
  tempoSlider.min = baseStyle.tempo.min;
  tempoSlider.max = baseStyle.tempo.max;
  tempoSlider.value = tempo;
  tempoValue.textContent = tempo;
  engine.updateTempo(tempo);

  const swing = randomizeSwing(baseStyle.swing);
  const swingPct = Math.round(swing * 100);
  swingSlider.value = swingPct;
  swingValue.textContent = swingPct;
  engine.setSwing(swing);
}

function selectStyle(id) {
  selectedStyleId = id;
  baseStyle = STYLES[id];
  activeStyle = Object.assign({}, baseStyle, { key: baseStyle.key });
  currentFlavors = Object.assign({}, baseStyle.defaultFlavors);

  for (const card of styleSelect.children) {
    card.classList.toggle("selected", card.dataset.styleId === id);
  }
  workspace.style.setProperty("--style-accent", STYLE_ACCENTS[id]);

  engine.ensureContext();
  engine.setMasterVolume(Number(masterSlider.value) / 100);

  rollTempoKeySwing(baseStyle);

  const sidechainOn = SIDECHAIN_DEFAULT_ON.has(id);
  engine.setSidechain(sidechainOn);
  sidechainBtn.classList.toggle("on", sidechainOn);

  engine.setGrit(baseStyle.grit || 0);

  shuffleStatus.textContent = "";
  refreshReelDurations();
  workspace.hidden = false;
  closePianoRoll();
  generatePattern();

  if (engine.isPlaying) {
    engine.stop();
    playBtn.textContent = "▶ Play";
    playBtn.classList.remove("playing");
  }
}

function generatePattern() {
  activeStyle.customChords = customChords;
  currentPattern = arrangementMode === "song" ? generateSongVariation(activeStyle) : generateVariation(activeStyle, selectedBars);
  renderSectionRow();
  renderStepGrid();
  if (openPianoRollInst) renderPianoRoll();
  if (openAutomationInst) renderAutomation();
  pushAutomationToEngine();
  if (engine.isPlaying) engine.updatePattern(currentPattern);
  // Reel length is derived from the pattern, so it can only be computed
  // once the new pattern exists - refreshing any earlier (on the bars
  // button, say) reads the previous arrangement and shows a stale time.
  refreshReelDurations();
}

// "Start From Scratch" - a blank canvas on the current genre's kit. The
// whole editing surface (click-to-place cells, the drag/resize piano
// roll, per-track flavors, mixers, automation) already works FL-Studio-
// style on generated beats; this simply hands the user an empty pattern
// so they can build the entire beat by hand instead of editing a
// generated one. The genre still supplies the kit, key/scale, tempo feel,
// and default chord roots, so hand-placed notes land musically.
function startFromScratch() {
  if (!activeStyle) return;
  const bars = selectedBars;
  const totalSteps = bars * STEPS_PER_BAR;
  const structure = arrangementMode === "song" ? currentPattern.structure : new Array(bars).fill("main");
  const progression = (activeStyle.progressions && activeStyle.progressions[0]) || [0];
  const barRootDegrees = new Array(structure.length).fill(0).map((_, i) => progression[i % progression.length]);
  const instruments = {};
  for (const inst of activeStyle.drums.instruments) instruments[inst] = new Array(totalSteps).fill(false);
  for (const inst of [...activeStyle.melodic.monoInstruments, ...activeStyle.melodic.chordInstruments]) {
    instruments[inst] = new Array(totalSteps).fill(null);
  }
  currentPattern = { instruments, structure, barRootDegrees, automation: {} };
  renderSectionRow();
  renderStepGrid();
  if (openPianoRollInst) renderPianoRoll();
  if (openAutomationInst) renderAutomation();
  pushAutomationToEngine();
  if (engine.isPlaying) engine.updatePattern(currentPattern);
  refreshReelDurations();
  shuffleStatus.textContent = "Blank canvas — click cells to place drums, click a track name to draw notes in its piano roll.";
}

scratchBtn.addEventListener("click", startFromScratch);

function pushAutomationToEngine() {
  const automation = currentPattern.automation || {};
  const filters = currentPattern.filterAutomation || {};
  for (const track of ALL_TRACKS) {
    engine.setAutomation(track, automation[track] || null);
    engine.setFilterAutomation(track, filters[track] || null);
  }
}

// Custom chord input: typing "Cm7 Fm7 Ab Bb7" and picking, say, Trap builds
// a trap beat around exactly those chords (one per bar, cycling to fill the
// arrangement) instead of one of Trap's own random progressions - the
// drum groove, swing, and melodic rhythm feel all stay genre-authored, only
// the harmony changes. Sticks across genre switches on purpose, so you can
// audition the same chords in several styles.
function renderChordChips(chords, invalid) {
  chordChips.innerHTML = "";
  for (const c of chords) {
    const chip = document.createElement("span");
    chip.className = "chord-chip";
    chip.textContent = c.label;
    chordChips.appendChild(chip);
  }
  for (const tok of invalid) {
    const chip = document.createElement("span");
    chip.className = "chord-chip invalid";
    chip.textContent = `? ${tok}`;
    chip.title = "Couldn't parse this as a chord - try things like Cm7, F#, Bb7, Asus4, Gdim7";
    chordChips.appendChild(chip);
  }
}

function applyChordInput(regenerate) {
  const text = chordInput.value.trim();
  if (!text) {
    customChords = null;
    renderChordChips([], []);
    if (regenerate && activeStyle) generatePattern();
    return;
  }
  const { chords, invalid } = parseChordProgression(text);
  renderChordChips(chords, invalid);
  customChords = chords.length ? chords : null;
  if (regenerate && activeStyle) generatePattern();
}

let chordInputTimer = null;
chordInput.addEventListener("input", () => {
  clearTimeout(chordInputTimer);
  chordInputTimer = setTimeout(() => applyChordInput(true), 550);
});
chordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    clearTimeout(chordInputTimer);
    applyChordInput(true);
  }
});
chordClearBtn.addEventListener("click", () => {
  chordInput.value = "";
  applyChordInput(true);
});

function sectionTypeClass(label) {
  const l = label.toLowerCase();
  if (l.includes("chorus")) return "section-chorus";
  if (l.includes("bridge")) return "section-bridge";
  if (l.includes("outro")) return "section-outro";
  if (l.includes("fill")) return "section-fill";
  if (l.includes("intro")) return "section-intro";
  return "";
}

function renderSectionRow() {
  sectionRow.innerHTML = "";
  const spacer = document.createElement("div");
  spacer.className = "track-header spacer";
  sectionRow.appendChild(spacer);

  const labels = currentPattern.structure;
  let i = 0;
  while (i < labels.length) {
    let j = i;
    while (j + 1 < labels.length && labels[j + 1] === labels[i]) j++;
    const cell = document.createElement("div");
    cell.className = `section-cell ${sectionTypeClass(labels[i])}`.trim();
    cell.textContent = labels[i];
    cell.style.gridColumn = `span ${(j - i + 1) * STEPS_PER_BAR}`;
    sectionRow.appendChild(cell);
    i = j + 1;
  }
}

function trackHeaderHTML(track) {
  const state = engine.trackState[track];
  const reverbPct = engine.reverbSends[track]
    ? Math.round(engine.reverbSends[track].gain.value * 100)
    : Math.round((DEFAULT_REVERB_SEND[track] || 0) * 100);
  const isMelodic = MELODIC_ORDER.includes(track);
  const hasAutomation = currentPattern && currentPattern.automation && currentPattern.automation[track] && currentPattern.automation[track].length;
  const automationBtn = isMelodic
    ? `<button class="track-btn auto-btn ${hasAutomation ? "has-automation" : ""} ${openAutomationInst === track ? "on" : ""}" data-action="automation" data-track="${track}" title="Edit volume over the song">A</button>`
    : "";
  const pool = FLAVOR_POOLS[track];
  // The picker groups kits into the ones that belong in this genre (what
  // the shuffle draws from) and everything else. Both stay selectable -
  // deliberately putting a sitar on a techno track is a creative choice,
  // and only the *automatic* shuffle should be stopped from doing it.
  const fits = pool ? pool.filter((f) => flavorFitsGenre(f, selectedStyleId)) : [];
  const rest = pool ? pool.filter((f) => !flavorFitsGenre(f, selectedStyleId)) : [];
  const opts = (list) => list
    .map((f) => `<option value="${f}" ${currentFlavors[track] === f ? "selected" : ""}>${flavorLabel(f)}</option>`)
    .join("");
  const flavorPicker = pool
    ? `<select class="track-flavor" data-track="${track}" title="Instrument sound / kit">` +
      (rest.length
        ? `<optgroup label="Fits this genre">${opts(fits)}</optgroup><optgroup label="Other kits">${opts(rest)}</optgroup>`
        : opts(fits)) +
      `</select>`
    : "";
  return `
    <span class="track-color" style="background:${TRACK_COLOR[track]};box-shadow:0 0 5px 1px ${TRACK_COLOR[track]}"></span>
    <button class="track-name" data-track="${track}" ${isMelodic ? 'title="Open piano roll"' : 'disabled title="Drum lanes have no pitch — place hits on the grid"'}>${TRACK_LABELS[track]}</button>
    ${flavorPicker}
    <button class="track-btn mute-btn ${state.muted ? "on" : ""}" data-action="mute" data-track="${track}">M</button>
    <button class="track-btn solo-btn ${state.solo ? "on" : ""}" data-action="solo" data-track="${track}">S</button>
    ${automationBtn}
    <input type="range" class="track-vol" data-track="${track}" min="0" max="100" value="${Math.round(state.volume * 100)}" title="Volume">
    <input type="range" class="track-rev" data-track="${track}" min="0" max="100" value="${reverbPct}" title="Reverb send">
  `;
}

// Two layered grids: a faint line on every beat (quarter-note, every 4
// steps) so the eye can actually parse rhythm placement at a glance
// instead of a wall of undifferentiated cells, plus the stronger existing
// line on every bar boundary on top.
function barDividerBackground(bars) {
  const barPct = 100 / bars;
  const beatPct = 100 / (bars * 4);
  return [
    `repeating-linear-gradient(to right, rgba(255,255,255,0.055) 0, rgba(255,255,255,0.055) 1px, transparent 1px, transparent ${beatPct}%)`,
    `repeating-linear-gradient(to right, rgba(255,255,255,0.12) 0, rgba(255,255,255,0.12) 1.5px, transparent 1.5px, transparent ${barPct}%)`,
  ].join(", ");
}

// Custom chords give each bar its own {rootMidi, scale}; everything else
// still keys off a single fixed genre key/scale for the whole pattern.
function contextForStep(step) {
  const contexts = currentPattern && currentPattern.barChordContexts;
  if (contexts && contexts.length) {
    const barIdx = Math.floor(step / STEPS_PER_BAR) % contexts.length;
    return contexts[barIdx];
  }
  return { rootMidi: noteNameToMidi(activeStyle.key), scale: activeStyle.scale };
}

function noteNameFor(track, note, step) {
  const ctx = contextForStep(step || 0);
  const degree = note.degree !== undefined ? note.degree : note.degrees[0];
  return degreeToLabel(ctx.rootMidi, ctx.scale, degree);
}

function renderNoteBars(lane, track, steps) {
  const arr = currentPattern.instruments[track];
  for (let i = 0; i < steps; i++) {
    const note = arr[i];
    if (!note) continue;
    const bar = document.createElement("div");
    bar.className = "note-bar";
    bar.dataset.step = i;
    bar.dataset.track = track;
    bar.style.left = (i / steps) * 100 + "%";
    bar.style.width = (note.len / steps) * 100 + "%";
    bar.style.background = `linear-gradient(180deg, ${TRACK_COLOR[track]}, ${TRACK_COLOR[track]}cc)`;
    bar.title = `${noteNameFor(track, note, i)} · ${note.len} step${note.len === 1 ? "" : "s"}`;
    if (note.len / steps > 0.03) {
      const label = document.createElement("span");
      label.className = "note-bar-label";
      label.textContent = noteNameFor(track, note, i);
      bar.appendChild(label);
    }
    lane.appendChild(bar);
  }
}

function renderHitMarks(lane, track, steps) {
  const arr = currentPattern.instruments[track];
  for (let i = 0; i < steps; i++) {
    const value = arr[i];
    if (!value) continue;
    const mark = document.createElement("div");
    mark.className = "hit-mark";
    if (value === "roll") mark.classList.add("roll");
    mark.dataset.step = i;
    mark.dataset.track = track;
    mark.style.left = (i / steps) * 100 + "%";
    mark.style.width = Math.max(100 / steps, 0.4) + "%";
    mark.style.background = TRACK_COLOR[track];
    lane.appendChild(mark);
  }
}

function renderStepGrid() {
  stepGrid.innerHTML = "";
  const steps = selectedBars * STEPS_PER_BAR;
  stepGrid.style.gridTemplateColumns = `${TRACK_HEADER_WIDTH}px repeat(${steps}, 1fr)`;
  sectionRow.style.gridTemplateColumns = `${TRACK_HEADER_WIDTH}px repeat(${steps}, 1fr)`;

  activeRows().forEach((track, rowIndex) => {
    const header = document.createElement("div");
    header.className = "track-header" + (rowIndex % 2 ? " alt" : "");
    header.style.borderLeftColor = TRACK_COLOR[track] || "transparent";
    header.innerHTML = trackHeaderHTML(track);
    stepGrid.appendChild(header);

    const lane = document.createElement("div");
    lane.dataset.track = track;
    lane.style.gridColumn = `span ${steps}`;
    lane.style.backgroundImage = barDividerBackground(selectedBars);

    if (DRUM_ORDER.includes(track)) {
      lane.className = "rack-lane drum-lane" + (rowIndex % 2 ? " alt" : "");
      renderHitMarks(lane, track, steps);
    } else {
      lane.className = "rack-lane melodic-lane" + (rowIndex % 2 ? " alt" : "");
      if (openPianoRollInst === track) lane.classList.add("editing");
      renderNoteBars(lane, track, steps);
    }
    stepGrid.appendChild(lane);
  });

  const playhead = document.createElement("div");
  playhead.id = "playhead";
  playhead.className = "playhead";
  playhead.hidden = true;
  stepGrid.appendChild(playhead);
}

function defaultNoteFor(track, step) {
  const barIndex = Math.floor(step / STEPS_PER_BAR);
  const barRoot = currentPattern.barRootDegrees[barIndex];
  const register = REGISTER[track];
  const len = DEFAULT_LEN[track] || 1;
  if (MONO_INSTRUMENTS.includes(track)) {
    return { degree: barRoot + register, len };
  }
  return { degrees: chordDegrees(barRoot + register, 3), len };
}

stepGrid.addEventListener("click", (e) => {
  const muteBtn = e.target.closest(".mute-btn");
  if (muteBtn) {
    const on = engine.toggleMute(muteBtn.dataset.track);
    muteBtn.classList.toggle("on", on);
    return;
  }
  const soloBtn = e.target.closest(".solo-btn");
  if (soloBtn) {
    const on = engine.toggleSolo(soloBtn.dataset.track);
    soloBtn.classList.toggle("on", on);
    return;
  }
  const nameBtn = e.target.closest(".track-name");
  if (nameBtn) {
    // A piano roll for a drum lane is meaningless - drum hits carry no
    // pitch at all, so the roll's note renderer had nothing to read and
    // threw. Drum lanes are edited on the step grid instead.
    if (MELODIC_ORDER.includes(nameBtn.dataset.track)) togglePianoRoll(nameBtn.dataset.track);
    return;
  }

  const autoBtn = e.target.closest(".auto-btn");
  if (autoBtn) {
    toggleAutomation(autoBtn.dataset.track);
    return;
  }

  const noteBar = e.target.closest(".note-bar");
  if (noteBar) {
    currentPattern.instruments[noteBar.dataset.track][Number(noteBar.dataset.step)] = null;
    renderStepGrid();
    if (openPianoRollInst === noteBar.dataset.track) renderPianoRoll();
    if (engine.isPlaying) engine.updatePattern(currentPattern);
    return;
  }

  const hitMark = e.target.closest(".hit-mark");
  if (hitMark) {
    currentPattern.instruments[hitMark.dataset.track][Number(hitMark.dataset.step)] = false;
    renderStepGrid();
    if (engine.isPlaying) engine.updatePattern(currentPattern);
    return;
  }

  // A plain click on empty lane space is handled by the mousedown/drag
  // handler below (which covers both the click case and the drag case);
  // suppressing it here avoids placing the note twice.
});

// ---- Drag to draw in the channel rack ----
// The rack used to place exactly one one-step note per click, so building
// a beat from scratch there could never produce a note longer than a
// single step - you had to open the piano roll to get any real note
// length. Now the rack behaves the way a DAW's step area does: press and
// drag right across a melodic lane to draw a note of that length, or drag
// across a drum lane to paint a run of hits (FL Studio's "paint" gesture).
let rackDrag = null;

// The lane's geometry is captured once at mousedown and reused for the
// whole gesture: every edit re-renders the step grid, which replaces the
// lane element, so holding the node itself would leave us measuring a
// detached element (a zero-size rect, which sends the computed step to
// infinity and stretches every drag to the end of the pattern).
function stepFromX(geom, clientX) {
  return Math.max(0, Math.min(geom.steps - 1, Math.floor(((clientX - geom.left) / geom.width) * geom.steps)));
}

stepGrid.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;
  // Existing notes/hits and every header control keep their own behavior.
  if (e.target.closest(".note-bar") || e.target.closest(".hit-mark") || e.target.closest(".track-header")) return;
  const lane = e.target.closest(".rack-lane");
  if (!lane) return;
  e.preventDefault();

  const track = lane.dataset.track;
  const rect = lane.getBoundingClientRect();
  const geom = { left: rect.left, width: rect.width, steps: selectedBars * STEPS_PER_BAR };
  if (!geom.width) return;
  const startStep = stepFromX(geom, e.clientX);
  const isDrum = DRUM_ORDER.includes(track);

  if (isDrum) {
    if (!currentPattern.instruments[track][startStep]) currentPattern.instruments[track][startStep] = true;
  } else {
    if (currentPattern.instruments[track][startStep]) return;
    currentPattern.instruments[track][startStep] = defaultNoteFor(track, startStep);
  }
  rackDrag = { track, geom, isDrum, startStep };
  renderStepGrid();
  if (openPianoRollInst === track) renderPianoRoll();
  if (engine.isPlaying) engine.updatePattern(currentPattern);
});

window.addEventListener("mousemove", (e) => {
  if (!rackDrag) return;
  const steps = rackDrag.geom.steps;
  const step = stepFromX(rackDrag.geom, e.clientX);
  const arr = currentPattern.instruments[rackDrag.track];

  if (rackDrag.isDrum) {
    // Paint hits across every step the pointer has swept over.
    const lo = Math.min(rackDrag.startStep, step);
    const hi = Math.max(rackDrag.startStep, step);
    let changed = false;
    for (let s = lo; s <= hi; s++) {
      if (!arr[s]) { arr[s] = true; changed = true; }
    }
    if (!changed) return;
  } else {
    // Stretch the note being drawn out to the pointer, clamped so it
    // never runs past the pattern or over an existing note.
    const note = arr[rackDrag.startStep];
    if (!note) return;
    let len = Math.max(1, step - rackDrag.startStep + 1);
    for (let s = rackDrag.startStep + 1; s < rackDrag.startStep + len; s++) {
      if (s >= steps || arr[s]) { len = s - rackDrag.startStep; break; }
    }
    len = Math.max(1, Math.min(len, steps - rackDrag.startStep));
    if (note.len === len) return;
    note.len = len;
  }
  renderStepGrid();
  if (openPianoRollInst === rackDrag.track) renderPianoRoll();
  if (engine.isPlaying) engine.updatePattern(currentPattern);
});

window.addEventListener("mouseup", () => {
  if (!rackDrag) return;
  rackDrag = null;
});

stepGrid.addEventListener("input", (e) => {
  if (e.target.classList.contains("track-vol")) {
    engine.setTrackVolume(e.target.dataset.track, Number(e.target.value) / 100);
  } else if (e.target.classList.contains("track-rev")) {
    engine.setReverbSend(e.target.dataset.track, Number(e.target.value) / 100);
  }
});

stepGrid.addEventListener("change", (e) => {
  if (!e.target.classList.contains("track-flavor")) return;
  // Mutate in place rather than reassigning currentFlavors - the engine
  // holds the same object reference once playback has started, so a
  // flavor swap takes effect on the very next hit, live, mid-song.
  currentFlavors[e.target.dataset.track] = e.target.value;
});

function togglePianoRoll(track) {
  if (openPianoRollInst === track) {
    closePianoRoll();
    return;
  }
  closeAutomation();
  openPianoRollInst = track;
  pianoRollPanel.hidden = false;
  pianoRollTitle.textContent = `${TRACK_LABELS[track]} — drag to draw a note, drag its right edge to resize, drag its body to move, click to delete`;
  renderPianoRoll();
  renderStepGrid();
}

function closePianoRoll() {
  openPianoRollInst = null;
  pianoRollPanel.hidden = true;
}

function toggleAutomation(track) {
  if (openAutomationInst === track) {
    closeAutomation();
    return;
  }
  closePianoRoll();
  openAutomationInst = track;
  automationPanel.hidden = false;
  automationTitle.textContent = `${TRACK_LABELS[track]} — volume over the arrangement`;
  renderAutomation();
  renderStepGrid();
}

function closeAutomation() {
  if (!openAutomationInst) return;
  openAutomationInst = null;
  automationPanel.hidden = true;
  renderStepGrid();
}

function renderAutomation() {
  const track = openAutomationInst;
  const steps = selectedBars * STEPS_PER_BAR;
  const points = ((currentPattern.automation && currentPattern.automation[track]) || []).slice().sort((a, b) => a.step - b.step);

  automationLane.innerHTML = "";
  automationLane.dataset.track = track;
  automationLane.style.backgroundImage = barDividerBackground(selectedBars);

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.classList.add("automation-svg");

  if (points.length) {
    const polyline = document.createElementNS(svgNS, "polyline");
    polyline.setAttribute("points", points.map((p) => `${(p.step / steps) * 100},${(1 - p.value) * 100}`).join(" "));
    polyline.setAttribute("class", "automation-line");
    svg.appendChild(polyline);
    for (const p of points) {
      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", (p.step / steps) * 100);
      circle.setAttribute("cy", (1 - p.value) * 100);
      circle.setAttribute("r", 1.7);
      circle.setAttribute("class", "automation-point");
      circle.dataset.step = p.step;
      svg.appendChild(circle);
    }
  }
  automationLane.appendChild(svg);
}

automationLane.addEventListener("mousedown", (e) => {
  const track = openAutomationInst;
  if (!track) return;
  e.preventDefault();

  const steps = selectedBars * STEPS_PER_BAR;
  const rect = automationLane.getBoundingClientRect();
  const isPoint = e.target.classList.contains("automation-point");
  const downX = e.clientX;
  const downY = e.clientY;

  const stepAt = (clientX) => Math.max(0, Math.min(steps - 1, Math.round(((clientX - rect.left) / rect.width) * steps)));
  const valueAt = (clientY) => Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));

  const points = ((currentPattern.automation && currentPattern.automation[track]) || []).map((p) => ({ ...p }));
  let draggedIndex = null;
  if (isPoint) {
    const clickedStep = Number(e.target.dataset.step);
    draggedIndex = points.findIndex((p) => p.step === clickedStep);
  }

  const onUp = (upEvent) => {
    document.removeEventListener("mouseup", onUp);
    const moved = Math.abs(upEvent.clientX - downX) > 4 || Math.abs(upEvent.clientY - downY) > 4;

    if (draggedIndex !== null && !moved) {
      points.splice(draggedIndex, 1);
    } else if (draggedIndex !== null) {
      points[draggedIndex] = { step: stepAt(upEvent.clientX), value: valueAt(upEvent.clientY) };
    } else {
      points.push({ step: stepAt(upEvent.clientX), value: valueAt(upEvent.clientY) });
    }
    points.sort((a, b) => a.step - b.step);

    if (!currentPattern.automation) currentPattern.automation = {};
    currentPattern.automation[track] = points;
    engine.setAutomation(track, points);
    renderAutomation();
    renderStepGrid();
  };

  document.addEventListener("mouseup", onUp);
});

automationClose.addEventListener("click", closeAutomation);
automationClearBtn.addEventListener("click", () => {
  const track = openAutomationInst;
  if (!track) return;
  if (!currentPattern.automation) currentPattern.automation = {};
  currentPattern.automation[track] = [];
  engine.setAutomation(track, null);
  renderAutomation();
  renderStepGrid();
});

const BLACK_KEY_SEMITONES = new Set([1, 3, 6, 8, 10]);

function renderRollNoteBar(lane, step, len, steps, track, label) {
  const bar = document.createElement("div");
  bar.className = "roll-note";
  bar.dataset.step = step;
  bar.dataset.track = track;
  bar.style.left = (step / steps) * 100 + "%";
  bar.style.width = (len / steps) * 100 + "%";
  bar.style.background = `linear-gradient(180deg, ${TRACK_COLOR[track]}, ${TRACK_COLOR[track]}cc)`;
  bar.title = `${label} · ${len} step${len === 1 ? "" : "s"}`;
  if (len / steps > 0.02) {
    const text = document.createElement("span");
    text.className = "note-bar-label";
    text.textContent = label;
    bar.appendChild(text);
  }
  const handle = document.createElement("div");
  handle.className = "resize-handle";
  bar.appendChild(handle);
  lane.appendChild(bar);
}

function renderPianoRoll() {
  const track = openPianoRollInst;
  const steps = selectedBars * STEPS_PER_BAR;
  const isMono = MONO_INSTRUMENTS.includes(track);
  const register = REGISTER[track];
  // Under custom chords, a "row" no longer maps to one fixed pitch (bar 2's
  // degree 0 can be a different note than bar 1's) - row labels/black-key
  // shading fall back to the first bar's chord as a best-effort reference
  // rather than showing something actively wrong for every other bar.
  const { rootMidi, scale } = contextForStep(0);

  const rows = [];
  if (isMono) {
    for (let d = register + 7; d >= register - 7; d--) rows.push(d);
  } else {
    for (let d = register + 6; d >= register; d--) rows.push(d);
  }

  pianoRollGrid.innerHTML = "";
  pianoRollGrid.style.gridTemplateColumns = "110px 1fr";

  rows.forEach((rowDegree, rowIdx) => {
    const noteLabel = degreeToLabel(rootMidi, scale, rowDegree);
    const label = document.createElement("div");
    label.className = "roll-label";
    label.textContent = isMono ? noteLabel : `${romanForDegree(rowDegree - register)} · ${noteLabel}`;
    if (rowDegree === register) label.classList.add("root-row");

    const lane = document.createElement("div");
    lane.className = "roll-lane";
    lane.dataset.track = track;
    lane.dataset.degree = rowDegree;
    lane.style.backgroundImage = barDividerBackground(selectedBars);

    if (isMono) {
      const midi = scaleDegreeToMidi(rootMidi, scale, rowDegree);
      const semitone = ((midi % 12) + 12) % 12;
      if (BLACK_KEY_SEMITONES.has(semitone)) {
        label.classList.add("black-key");
        lane.classList.add("black-key-row");
      }
    } else if (rowIdx % 2 === 1) {
      lane.classList.add("alt-row");
    }

    pianoRollGrid.appendChild(label);
    pianoRollGrid.appendChild(lane);
  });

  const arr = currentPattern.instruments[track];
  for (let i = 0; i < steps; i++) {
    const note = arr[i];
    if (!note) continue;
    const noteDegree = isMono ? note.degree : note.degrees[0];
    const rowIndex = rows.indexOf(noteDegree);
    if (rowIndex === -1) continue;
    const lane = pianoRollGrid.children[rowIndex * 2 + 1];
    const noteCtx = contextForStep(i);
    renderRollNoteBar(lane, i, note.len, steps, track, degreeToLabel(noteCtx.rootMidi, noteCtx.scale, noteDegree));
  }
}

pianoRollGrid.addEventListener("mousedown", (e) => {
  const resizeHandle = e.target.closest(".resize-handle");
  const noteBar = e.target.closest(".roll-note");
  const lane = e.target.closest(".roll-lane") || (noteBar && noteBar.closest(".roll-lane"));
  if (!lane) return;
  e.preventDefault();

  const steps = selectedBars * STEPS_PER_BAR;
  const rect = lane.getBoundingClientRect();
  const track = lane.dataset.track;
  const rowDegree = Number(lane.dataset.degree);
  const downX = e.clientX;
  const isMono = MONO_INSTRUMENTS.includes(track);

  const stepAt = (clientX) => Math.max(0, Math.min(steps - 1, Math.floor(((clientX - rect.left) / rect.width) * steps)));

  const onUp = (upEvent) => {
    document.removeEventListener("mouseup", onUp);
    const arr = currentPattern.instruments[track];

    if (resizeHandle) {
      const origStep = Number(noteBar.dataset.step);
      const newLen = Math.max(1, stepAt(upEvent.clientX) - origStep + 1);
      if (arr[origStep]) arr[origStep] = { ...arr[origStep], len: newLen };
    } else if (noteBar) {
      const origStep = Number(noteBar.dataset.step);
      const moved = Math.abs(upEvent.clientX - downX) > 6;
      if (!moved) {
        arr[origStep] = null;
      } else {
        const deltaSteps = stepAt(upEvent.clientX) - stepAt(downX);
        const newStart = Math.max(0, Math.min(steps - 1, origStep + deltaSteps));
        if (newStart !== origStep && arr[origStep]) {
          const note = arr[origStep];
          arr[origStep] = null;
          arr[newStart] = note;
        }
      }
    } else {
      const startStep = stepAt(downX);
      const endStep = stepAt(upEvent.clientX);
      const start = Math.min(startStep, endStep);
      const len = Math.abs(endStep - startStep) + 1;
      arr[start] = isMono ? { degree: rowDegree, len } : { degrees: chordDegrees(rowDegree, 3), len };
    }

    renderPianoRoll();
    renderStepGrid();
    if (engine.isPlaying) engine.updatePattern(currentPattern);
  };

  document.addEventListener("mouseup", onUp);
});

pianoRollClose.addEventListener("click", closePianoRoll);

function getActiveNoteAt(track, step) {
  const arr = currentPattern.instruments[track];
  if (!arr) return null;
  if (DRUM_ORDER.includes(track)) {
    return arr[step] ? { startStep: step, note: arr[step] } : null;
  }
  const maxLen = 16;
  for (let s = step; s >= 0 && s > step - maxLen; s--) {
    const note = arr[s];
    if (note && s + note.len > step) return { startStep: s, note };
  }
  return null;
}

function updatePlayhead(step, steps) {
  const playhead = document.getElementById("playhead");
  if (!playhead) return;
  // Measure the real rendered lane geometry instead of reimplementing the
  // grid's label-width/gap math in JS - that duplication is what let this
  // drift out of sync with the actual note positions in the first place.
  const lane = stepGrid.querySelector(".rack-lane");
  if (!lane) {
    playhead.hidden = true;
    return;
  }
  const gridRect = stepGrid.getBoundingClientRect();
  const laneRect = lane.getBoundingClientRect();
  const laneLeft = laneRect.left - gridRect.left;
  playhead.style.left = laneLeft + (step / steps) * laneRect.width + "px";
  playhead.hidden = false;
}

function highlightStep(step) {
  const steps = selectedBars * STEPS_PER_BAR;
  stepGrid.querySelectorAll(".now-playing").forEach((el) => el.classList.remove("now-playing"));
  pianoRollGrid.querySelectorAll(".now-playing, .now-playing-row").forEach((el) => el.classList.remove("now-playing", "now-playing-row"));

  for (const track of activeRows()) {
    const active = getActiveNoteAt(track, step);
    if (!active) continue;
    const el = stepGrid.querySelector(`.rack-lane[data-track="${track}"] [data-step="${active.startStep}"]`);
    if (el) el.classList.add("now-playing");

    if (openPianoRollInst === track && active.note) {
      const degree = active.note.degree !== undefined ? active.note.degree : active.note.degrees[0];
      const rollNote = pianoRollGrid.querySelector(`.roll-note[data-step="${active.startStep}"]`);
      if (rollNote) rollNote.classList.add("now-playing");
      const rollLane = pianoRollGrid.querySelector(`.roll-lane[data-degree="${degree}"]`);
      if (rollLane) rollLane.classList.add("now-playing-row");
    }
  }

  updatePlayhead(step, steps);
}

function togglePlay() {
  if (!currentPattern) return;
  if (engine.isPlaying) {
    engine.stop();
    playBtn.textContent = "▶ Play";
    playBtn.classList.remove("playing");
    stepGrid.querySelectorAll(".now-playing").forEach((el) => el.classList.remove("now-playing"));
    pianoRollGrid.querySelectorAll(".now-playing, .now-playing-row").forEach((el) => el.classList.remove("now-playing", "now-playing-row"));
    const playhead = document.getElementById("playhead");
    if (playhead) playhead.hidden = true;
    stopVisualizer();
  } else {
    engine.onStep = highlightStep;
    engine.start(currentPattern, activeStyle, currentFlavors, Number(tempoSlider.value));
    playBtn.textContent = "■ Stop";
    playBtn.classList.add("playing");
    startVisualizer();
  }
}

// ---- Live audio visualizer ----

const visualizerCanvas = document.getElementById("visualizer");
const visualizerCtx = visualizerCanvas.getContext("2d");
let visualizerRAF = null;

function drawVisualizer() {
  visualizerRAF = requestAnimationFrame(drawVisualizer);
  if (!engine.analyser) return;

  const data = new Uint8Array(engine.analyser.frequencyBinCount);
  engine.analyser.getByteFrequencyData(data);

  const w = visualizerCanvas.width;
  const h = visualizerCanvas.height;
  visualizerCtx.clearRect(0, 0, w, h);

  const barCount = 64;
  const barGap = 2;
  const barWidth = w / barCount - barGap;
  const gradient = visualizerCtx.createLinearGradient(0, h, 0, 0);
  gradient.addColorStop(0, "#a55eea");
  gradient.addColorStop(0.6, "#00d2d3");
  gradient.addColorStop(1, "#ff9ff3");
  visualizerCtx.fillStyle = gradient;

  for (let i = 0; i < barCount; i++) {
    const dataIndex = Math.floor((i / barCount) * data.length * 0.65);
    const value = data[dataIndex] / 255;
    const barHeight = Math.max(2, value * h);
    const x = i * (barWidth + barGap);
    visualizerCtx.fillRect(x, h - barHeight, barWidth, barHeight);
  }
}

function startVisualizer() {
  if (visualizerRAF) return;
  const displayWidth = visualizerCanvas.clientWidth;
  if (displayWidth && visualizerCanvas.width !== displayWidth) {
    visualizerCanvas.width = displayWidth;
  }
  drawVisualizer();
}

function stopVisualizer() {
  if (visualizerRAF) {
    cancelAnimationFrame(visualizerRAF);
    visualizerRAF = null;
  }
  visualizerCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
}

// ---- Export to a vertical (9:16) video for Reels/TikTok/Shorts ----
// Draws an animated, genre-branded visualizer to a portrait canvas, taps
// the real mixed audio straight out of the engine's master bus via a
// MediaStreamAudioDestinationNode, and records both together with
// MediaRecorder - a real, playable video file the browser can produce
// entirely client-side, no server/render farm needed.

function pickReelMimeType() {
  if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return "";
  const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

// Kick-driven "pulse" and per-step active-instrument tracking, read by the
// reel's animation loop so the video actually reacts to the beat instead
// of just showing a generic, beat-agnostic visualizer - the difference
// between a real music-video look and a stock audio-bars gif.
let reelPulse = 0;
const reelActiveInstruments = new Set();
const REEL_DOT_INSTRUMENTS = ["kick", "snare", "hihat", "bass", "lead", "piano", "guitar", "vocal"];

// ---- Falling-note view for the exported video ----
// A radial visualiser reacts to audio but shows nothing about the music
// itself. What makes a beat video watchable is SEEING the notes arrive -
// the "falling notes" format (piano-roll scrolling into a strike line)
// is the single most-watched way music is visualised online, because the
// viewer can anticipate each hit a moment before they hear it. That
// anticipation is the whole appeal, so the note field is now the
// centrepiece of the frame rather than a decoration.
// Short lane codes - full instrument names collide once a genre has ten
// tracks across a 1080px-wide frame.
const REEL_LANE_LABEL = {
  kick: "KICK", snare: "SNR", hihat: "HAT", openhat: "OPEN", tom: "TOM", perc: "PERC",
  crash: "CRSH", fx: "FX", bass: "BASS", piano: "PIANO", lead: "LEAD", pad: "PAD",
  stab: "STAB", guitar: "GTR", strings: "STR", horn: "HORN", organ: "ORG", vocal: "VOX",
  kalimba: "KLMB", marimba: "MRMB", arp: "ARP", autolead: "AUTO", sax: "SAX",
};

// The reel used to run for a fixed 15/30/60s regardless of what the beat
// actually was, so a 4-bar loop got chopped mid-phrase or repeated a
// ragged number of times. Length is now derived from the pattern itself,
// so a video always contains a whole number of loops and never cuts off
// in the middle of a bar.
function reelLoopSeconds() {
  // Prefer the pattern that actually exists - a song arrangement can end
  // up a different length than the nominal bar count.
  let steps = selectedBars * STEPS_PER_BAR;
  if (currentPattern) {
    const any = Object.values(currentPattern.instruments).find((a) => Array.isArray(a) && a.length);
    if (any) steps = any.length;
  }
  const stepDur = 60 / Number(tempoSlider.value) / 4;
  // Swing lengthens every odd step, so half the steps run long.
  const swing = Number(swingSlider.value) / 100;
  return steps * stepDur * (1 + swing / 2);
}

function formatReelTime(sec) {
  const s = Math.round(sec);
  return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : `${s}s`;
}

function refreshReelDurations() {
  if (!activeStyle) return;
  const loop = reelLoopSeconds();
  const prev = reelDurationSelect.value;
  reelDurationSelect.innerHTML = "";
  const opts = arrangementMode === "song"
    ? [[1, `Full song (${formatReelTime(loop)})`]]
    : [[1, `1 loop (${formatReelTime(loop)})`],
       [2, `2 loops (${formatReelTime(loop * 2)})`],
       [4, `4 loops (${formatReelTime(loop * 4)})`],
       [8, `8 loops (${formatReelTime(loop * 8)})`]];
  for (const [mult, label] of opts) {
    const o = document.createElement("option");
    o.value = String(mult);
    o.textContent = label;
    reelDurationSelect.appendChild(o);
  }
  const match = [...reelDurationSelect.options].find((o) => o.value === prev);
  reelDurationSelect.value = match ? prev : (arrangementMode === "song" ? "1" : "2");
}

let reelLanes = [];
let reelStepStartMs = 0;
let reelStepMs = 125;
let reelHitFlash = {};

function buildReelLanes() {
  reelLanes = [];
  if (!currentPattern || !activeStyle) return;
  const order = [
    ...DRUM_ORDER.filter((i) => activeStyle.drums.instruments.includes(i)),
    ...MELODIC_ORDER.filter((i) => activeStyle.melodic.monoInstruments.includes(i) || activeStyle.melodic.chordInstruments.includes(i)),
  ];
  for (const inst of order) {
    const arr = currentPattern.instruments[inst];
    if (!arr || !arr.some(Boolean)) continue;
    // Melodic lanes place each note horizontally by pitch within the
    // lane, so the viewer can read the shape of the line, not just its
    // rhythm.
    let lo = Infinity, hi = -Infinity;
    for (const n of arr) {
      if (!n || n === true || n === "roll" || n === "ghost") continue;
      const d = n.degree !== undefined ? n.degree : (n.degrees ? n.degrees[0] : null);
      if (d === null) continue;
      lo = Math.min(lo, d); hi = Math.max(hi, d);
    }
    reelLanes.push({
      inst,
      melodic: lo !== Infinity,
      lo: lo === Infinity ? 0 : lo,
      hi: hi === -Infinity ? 1 : Math.max(hi, lo + 1),
      color: TRACK_COLOR[inst] || "#a55eea",
    });
  }
}

function reelStepHook(step) {
  const pattern = currentPattern;
  if (!pattern) return;
  reelStepStartMs = performance.now();
  reelStepMs = (60 / Number(tempoSlider.value) / 4) * 1000;
  if (pattern.instruments.kick && pattern.instruments.kick[step]) reelPulse = 1;
  // Crashes and kicks are the two hits that physically move a room, so
  // they are the two that shake the frame.
  if (pattern.instruments.crash && pattern.instruments.crash[step]) reelShake = 1;
  else if (pattern.instruments.kick && pattern.instruments.kick[step]) reelShake = Math.max(reelShake, 0.35);
  reelActiveInstruments.clear();
  for (const inst of REEL_DOT_INSTRUMENTS) {
    const track = pattern.instruments[inst];
    if (track && track[step]) reelActiveInstruments.add(inst);
  }
  // Flash any lane whose note lands on this step - the moment of impact -
  // and queue a spark burst. Geometry isn't known here, so the burst is
  // resolved to an x position when the note field is drawn.
  for (const lane of reelLanes) {
    const v = pattern.instruments[lane.inst] && pattern.instruments[lane.inst][step];
    if (!v) continue;
    reelHitFlash[lane.inst] = 1;
    // Ghost notes barely register audibly, so they barely spark.
    const power = v === "ghost" ? 0.35
      : v === "roll" ? 1.15
      : lane.inst === "kick" || lane.inst === "snare" || lane.inst === "crash" ? 1.25
      : (v && v.vel) ? 0.6 + v.vel * 0.6
      : 0.85;
    reelBurstQueue.push({ inst: lane.inst, value: v, power });
  }
}

// The chord sounding right now, named - so a viewer can actually follow
// the harmony rather than just watching shapes move.
function reelChordName(step) {
  if (!currentPattern || !activeStyle) return "";
  const bar = Math.floor(step / STEPS_PER_BAR);
  const roots = currentPattern.barRootDegrees || [];
  if (!roots.length) return "";
  const rootDeg = roots[bar % roots.length];
  const ctx2 = contextForStep(step);
  const name = degreeToLabel(ctx2.rootMidi, ctx2.scale, rootDeg).replace(/-?\d+$/, "");
  const scale = Array.isArray(ctx2.scale) ? ctx2.scale : SCALES[ctx2.scale];
  // Third above the root tells us whether this chord is major or minor.
  const third = scaleDegreeToMidi(ctx2.rootMidi, ctx2.scale, rootDeg + 2) - scaleDegreeToMidi(ctx2.rootMidi, ctx2.scale, rootDeg);
  return name + (third <= 3 ? "m" : "");
}

// ---- Reel visual system -------------------------------------------------
// The exported video is what most people will actually see of a beat, so
// it gets the same treatment as the audio: layered, reactive, composed.
// Every element below is driven by either the pattern itself or the live
// analyser, so the picture moves *with* the music instead of sitting on
// top of it as decoration.
//
// Layers, back to front:
//   1. drifting two-tone bloom background + vignette + film grain
//   2. mirrored spectrum ribbon (real FFT data, smoothed)
//   3. falling-note field with tails, glow and per-lane colour
//   4. strike line, impact ripples and particle sparks
//   5. type layer: title, chord, section, bar counter, progress
// The whole stack is drawn inside a kick-driven zoom/shake transform so
// the frame itself breathes on the downbeat.

let reelParticles = [];
let reelBurstQueue = [];
let reelRipples = [];
let reelShake = 0;
let reelBgPhase = 0;
let reelQuality = 1;
let reelSmoothMs = 16;
let reelGrainTile = null;
let reelSpectrum = new Float32Array(72);
let reelLastChord = "";
let reelChordChangeMs = 0;

// --- colour helpers: one accent per genre, everything else derived ---
function reelRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function reelHex(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}
// Rotating the accent's hue gives a second, harmonically related colour
// for gradients - far richer than a flat single-colour wash.
function reelShiftHue(hex, deg) {
  let [r, g, b] = reelRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hh = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) hh = ((g - b) / d) % 6;
    else if (max === g) hh = (b - r) / d + 2;
    else hh = (r - g) / d + 4;
  }
  hh = (hh * 60 + deg + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = l - c / 2;
  let rr = 0, gg = 0, bb = 0;
  if (hh < 60) [rr, gg, bb] = [c, x, 0];
  else if (hh < 120) [rr, gg, bb] = [x, c, 0];
  else if (hh < 180) [rr, gg, bb] = [0, c, x];
  else if (hh < 240) [rr, gg, bb] = [0, x, c];
  else if (hh < 300) [rr, gg, bb] = [x, 0, c];
  else [rr, gg, bb] = [c, 0, x];
  return reelHex((rr + m) * 255, (gg + m) * 255, (bb + m) * 255);
}
function reelAlpha(hex, a) {
  return hex + Math.max(0, Math.min(255, Math.round(a * 255))).toString(16).padStart(2, "0");
}

// A single 128px noise tile, generated once and tiled. Grain is what
// stops large flat gradients from banding on compressed video, and it is
// the cheapest possible way to make a canvas render look filmed rather
// than drawn.
function reelGrain() {
  if (reelGrainTile) return reelGrainTile;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const img = g.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + Math.random() * 145;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  reelGrainTile = c;
  return c;
}

function resetReelVisuals() {
  reelParticles = [];
  reelBurstQueue = [];
  reelRipples = [];
  reelShake = 0;
  reelBgPhase = Math.random() * 100;
  reelQuality = 1;
  reelSpectrum = new Float32Array(72);
  reelLastChord = "";
  reelChordChangeMs = 0;
  reelSmoothMs = 16;
}

function spawnReelBurst(x, y, color, power) {
  // Deliberately restrained. Sparks are punctuation: enough of them to
  // mark an impact, few enough that eight lanes firing sixteenths don't
  // bury the note field under confetti.
  const n = Math.max(2, Math.round((4 + power * 8) * reelQuality));
  for (let i = 0; i < n; i++) {
    // They fan upward from the strike line, then gravity pulls them back
    // down through it - reads as an impact, not a firework.
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.05;
    const sp = (3 + Math.random() * 11) * power;
    reelParticles.push({
      x: x + (Math.random() - 0.5) * 16,
      y,
      vx: Math.cos(a) * sp * 1.3,
      vy: Math.sin(a) * sp,
      life: 1,
      decay: 0.028 + Math.random() * 0.03,
      size: 2.2 + Math.random() * 5 * power,
      color,
    });
  }
  if (reelParticles.length > 420) reelParticles.splice(0, reelParticles.length - 420);
}

function drawReelParticles(ctx, floorY) {
  if (!reelParticles.length) return;
  ctx.save();
  // Additive blending so overlapping sparks bloom instead of muddying.
  ctx.globalCompositeOperation = "lighter";
  for (let i = reelParticles.length - 1; i >= 0; i--) {
    const p = reelParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.5;
    p.vx *= 0.988;
    p.life -= p.decay;
    // Retired once they fall past the lane labels - sparks drifting down
    // over the chord readout just look like dirt on the lens.
    if (p.life <= 0 || (floorY && p.y > floorY)) { reelParticles.splice(i, 1); continue; }
    ctx.globalAlpha = p.life * 0.8;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (0.35 + p.life * 0.65), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawReelRipples(ctx) {
  if (!reelRipples.length) return;
  ctx.save();
  for (let i = reelRipples.length - 1; i >= 0; i--) {
    const r = reelRipples[i];
    r.t += 0.075;
    if (r.t >= 1) { reelRipples.splice(i, 1); continue; }
    ctx.globalAlpha = (1 - r.t) * 0.8;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 3 * (1 - r.t) + 0.5;
    ctx.beginPath();
    ctx.ellipse(r.x, r.y, r.rx * r.t, r.ry * r.t, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// Two slow-drifting colour blooms over near-black, then a vignette to
// pull the eye to the centre column where the notes live.
function drawReelBackground(ctx, w, h, accent, accent2) {
  ctx.fillStyle = "#05050a";
  ctx.fillRect(0, 0, w, h);

  reelBgPhase += 0.0045;
  const blooms = [
    { x: w * (0.5 + 0.30 * Math.sin(reelBgPhase)), y: h * (0.20 + 0.06 * Math.cos(reelBgPhase * 0.8)), r: h * 0.46, c: accent, a: 0.30 + 0.14 * reelPulse },
    { x: w * (0.5 - 0.34 * Math.sin(reelBgPhase * 0.73)), y: h * (0.70 + 0.07 * Math.sin(reelBgPhase * 1.1)), r: h * 0.42, c: accent2, a: 0.22 + 0.10 * reelPulse },
  ];
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const b of blooms) {
    const g = ctx.createRadialGradient(b.x, b.y, 10, b.x, b.y, b.r);
    g.addColorStop(0, reelAlpha(b.c, b.a));
    g.addColorStop(0.55, reelAlpha(b.c, b.a * 0.28));
    g.addColorStop(1, reelAlpha(b.c, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();

  // Vignette
  const v = ctx.createRadialGradient(w / 2, h * 0.5, h * 0.22, w / 2, h * 0.5, h * 0.72);
  v.addColorStop(0, "#00000000");
  v.addColorStop(1, "#000000b0");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

function drawReelGrain(ctx, w, h) {
  const tile = reelGrain();
  const pat = ctx.createPattern(tile, "repeat");
  if (!pat) return;
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = 0.05;
  // Jitter the tile origin each frame so the grain shimmers instead of
  // sitting still like a texture stuck to the lens.
  ctx.translate(-Math.floor(Math.random() * 128), -Math.floor(Math.random() * 128));
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, w + 128, h + 128);
  ctx.restore();
}

// Mirrored spectrum ribbon. Real FFT data, exponentially smoothed so it
// glides; a raw analyser read flickers badly at 30fps.
function drawReelSpectrum(ctx, w, h, centerY, accent, accent2) {
  if (!engine.analyser) return;
  const data = new Uint8Array(engine.analyser.frequencyBinCount);
  engine.analyser.getByteFrequencyData(data);
  const bars = reelSpectrum.length;
  const padX = w * 0.06;
  const usable = w - padX * 2;
  const bw = usable / bars;
  const maxH = h * 0.052;
  for (let i = 0; i < bars; i++) {
    // Log-ish bin spacing: linear indexing wastes most of the ribbon on
    // high frequencies nothing in a beat actually occupies.
    const t = i / bars;
    const idx = Math.floor(Math.pow(t, 1.7) * data.length * 0.82);
    const raw = data[idx] / 255;
    reelSpectrum[i] += (raw - reelSpectrum[i]) * 0.32;
  }
  ctx.save();
  for (let i = 0; i < bars; i++) {
    const v = reelSpectrum[i];
    const bh = Math.max(h * 0.0022, v * maxH);
    const x = padX + i * bw;
    const g = ctx.createLinearGradient(0, centerY - bh, 0, centerY + bh);
    g.addColorStop(0, reelAlpha(accent2, 0.25 + v * 0.75));
    g.addColorStop(0.5, reelAlpha(accent, 0.85));
    g.addColorStop(1, reelAlpha(accent2, 0.25 + v * 0.75));
    ctx.fillStyle = g;
    if (v > 0.55) { ctx.shadowColor = accent; ctx.shadowBlur = 14 * v; }
    const bwd = Math.max(1, bw * 0.62);
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x + (bw - bwd) / 2, centerY - bh, bwd, bh * 2, bwd / 2);
      ctx.fill();
    } else {
      ctx.fillRect(x + (bw - bwd) / 2, centerY - bh, bwd, bh * 2);
    }
    ctx.shadowBlur = 0;
  }
  // Centre hairline ties the two halves together.
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = reelAlpha(accent, 0.5);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX, centerY);
  ctx.lineTo(w - padX, centerY);
  ctx.stroke();
  ctx.restore();
}

function drawReelNotes(ctx, w, h, step, accent) {
  if (!reelLanes.length || !currentPattern) return;
  const top = h * 0.290;
  const strikeY = h * 0.795;
  const field = strikeY - top;
  const LOOKAHEAD = 16; // one full bar visible above the strike line
  const total = currentPattern.instruments[reelLanes[0].inst].length;

  // Smooth sub-step scrolling so notes glide instead of snapping.
  const frac = Math.max(0, Math.min(1, (performance.now() - reelStepStartMs) / reelStepMs));
  const nowPos = step + frac;

  const padX = w * 0.06;
  const laneW = (w - padX * 2) / reelLanes.length;

  const laneCenterX = (lane, i, v) => {
    const laneX = padX + i * laneW;
    if (!lane.melodic || !v || v === true) return laneX + laneW / 2;
    const d = v.degree !== undefined ? v.degree : (v.degrees ? v.degrees[0] : lane.lo);
    const t = (d - lane.lo) / Math.max(1, lane.hi - lane.lo);
    return laneX + laneW * 0.08 + t * laneW * 0.84 + laneW * 0.25;
  };

  // Queued impacts from reelStepHook get their geometry here, where lane
  // widths are known, and turn into sparks + a ripple on the strike line.
  while (reelBurstQueue.length) {
    const b = reelBurstQueue.shift();
    const i = reelLanes.findIndex((l) => l.inst === b.inst);
    if (i < 0) continue;
    const lane = reelLanes[i];
    const x = laneCenterX(lane, i, b.value);
    spawnReelBurst(x, strikeY, lane.color, b.power);
    reelRipples.push({ x, y: strikeY, rx: laneW * 0.85, ry: h * 0.011, t: 0, color: lane.color });
  }

  // Scrim behind the whole field. The background blooms are deliberately
  // strong, but left unchecked they tint the note field and the notes
  // stop reading as their own colours.
  const scrim = ctx.createLinearGradient(0, top, 0, strikeY);
  scrim.addColorStop(0, "#05050a66");
  scrim.addColorStop(0.5, "#05050aaa");
  scrim.addColorStop(1, "#05050a80");
  ctx.fillStyle = scrim;
  ctx.fillRect(padX, top, w - padX * 2, field);

  // Lane columns, tinted with the lane's own colour so the field reads as
  // instruments rather than as an anonymous grid.
  reelLanes.forEach((lane, i) => {
    const x = padX + i * laneW;
    const f = reelHitFlash[lane.inst] || 0;
    const g = ctx.createLinearGradient(0, top, 0, strikeY);
    g.addColorStop(0, reelAlpha(lane.color, 0.012));
    g.addColorStop(1, reelAlpha(lane.color, 0.05 + f * 0.14));
    ctx.fillStyle = g;
    ctx.fillRect(x, top, laneW, field);
    if (i > 0) {
      ctx.strokeStyle = "#ffffff0c";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, strikeY);
      ctx.stroke();
    }
  });

  // Beat grid scrolling with the notes - gives the eye a pulse to track.
  for (let k = -1; k < LOOKAHEAD + 4; k++) {
    const s2 = Math.floor(nowPos) + k;
    if (((s2 % 4) + 4) % 4 !== 0) continue;
    const y = strikeY - ((s2 - nowPos) / LOOKAHEAD) * field;
    if (y < top || y > strikeY) continue;
    const isBar = ((s2 % 16) + 16) % 16 === 0;
    ctx.strokeStyle = isBar ? reelAlpha(accent, 0.35) : "#ffffff10";
    ctx.lineWidth = isBar ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(padX, y);
    ctx.lineTo(w - padX, y);
    ctx.stroke();
  }

  // Falling notes
  reelLanes.forEach((lane, i) => {
    const arr = currentPattern.instruments[lane.inst];
    const laneX = padX + i * laneW;
    for (let k = -2; k < LOOKAHEAD + 2; k++) {
      const s2 = Math.floor(nowPos) + k;
      // The pattern loops, so lookahead has to wrap with it - otherwise
      // the view empties out right before the loop turns over.
      const idx = ((s2 % total) + total) % total;
      const v = arr[idx];
      if (!v) continue;
      const len = v.len || 1;
      const yEnd = strikeY - ((s2 - nowPos) / LOOKAHEAD) * field;
      const yStart = strikeY - ((s2 + len - nowPos) / LOOKAHEAD) * field;
      const barH = Math.max(h * 0.007, yEnd - yStart);
      const yTop = yEnd - barH;
      if (yEnd < top - 20 || yTop > strikeY + 20) continue;

      // Pitch position within the lane for melodic parts.
      let bx = laneX + laneW * 0.16;
      let bw = laneW * 0.68;
      if (lane.melodic) {
        const d = v.degree !== undefined ? v.degree : (v.degrees ? v.degrees[0] : lane.lo);
        const t = (d - lane.lo) / Math.max(1, lane.hi - lane.lo);
        bw = laneW * 0.5;
        bx = laneX + laneW * 0.08 + t * (laneW * 0.84 - bw);
      }

      const clippedTop = Math.max(yTop, top);
      const clippedH = Math.min(yEnd, strikeY + 6) - clippedTop;
      if (clippedH <= 0) continue;

      // Notes brighten as they approach the strike line.
      const prox = 1 - Math.max(0, Math.min(1, (strikeY - yEnd) / field));

      // Motion tail: a short gradient streak trailing the note upward,
      // which is what sells the sense of speed on a 30fps export.
      if (prox > 0.25) {
        const tailH = Math.min(field * 0.10, barH * 2.2) * prox;
        const tg = ctx.createLinearGradient(0, clippedTop - tailH, 0, clippedTop);
        tg.addColorStop(0, reelAlpha(lane.color, 0));
        tg.addColorStop(1, reelAlpha(lane.color, 0.28 * prox));
        ctx.fillStyle = tg;
        ctx.fillRect(bx, Math.max(top, clippedTop - tailH), bw, Math.min(tailH, clippedTop - top));
      }

      // The white core only blooms in as a note nears the strike line -
      // hold it high everywhere and distant notes wash out to grey and
      // stop reading as their instrument.
      const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
      g.addColorStop(0, reelAlpha(lane.color, 0.9));
      g.addColorStop(0.42, "#ffffff" + Math.round((0.05 + prox * prox * 0.75) * 255).toString(16).padStart(2, "0"));
      g.addColorStop(1, reelAlpha(lane.color, 0.9));
      ctx.globalAlpha = 0.4 + prox * 0.6;
      ctx.fillStyle = g;
      if (prox > 0.82) {
        ctx.shadowColor = lane.color;
        ctx.shadowBlur = 14 + 22 * (prox - 0.82) / 0.18;
      }
      const r = Math.min(7, bw / 2, clippedH / 2);
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(bx, clippedTop, bw, clippedH, r);
        ctx.fill();
      } else {
        ctx.fillRect(bx, clippedTop, bw, clippedH);
      }
      ctx.shadowBlur = 0;
      // Bright cap on the leading edge - the part that will hit next.
      if (clippedH > 6) {
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = (0.25 + prox * 0.6);
        ctx.fillRect(bx, Math.min(yEnd, strikeY) - 2.5, bw, 2.5);
      }
      ctx.globalAlpha = 1;
    }
  });

  drawReelRipples(ctx);

  // The strike line, plus a burst on every lane that just fired.
  const lineG = ctx.createLinearGradient(padX, 0, w - padX, 0);
  lineG.addColorStop(0, reelAlpha(accent, 0.15));
  lineG.addColorStop(0.5, "#ffffffee");
  lineG.addColorStop(1, reelAlpha(accent, 0.15));
  ctx.strokeStyle = lineG;
  ctx.lineWidth = 3;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.moveTo(padX, strikeY);
  ctx.lineTo(w - padX, strikeY);
  ctx.stroke();
  ctx.shadowBlur = 0;

  reelLanes.forEach((lane, i) => {
    const f = reelHitFlash[lane.inst] || 0;
    if (f <= 0.02) return;
    const laneX = padX + i * laneW;
    const gh = field * 0.20 * f;
    const g = ctx.createLinearGradient(0, strikeY - gh, 0, strikeY);
    g.addColorStop(0, reelAlpha(lane.color, 0));
    g.addColorStop(1, reelAlpha(lane.color, 0.8));
    ctx.globalAlpha = f;
    ctx.fillStyle = g;
    ctx.fillRect(laneX, strikeY - gh, laneW, gh);
    // Impact glow on the line itself
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = lane.color;
    ctx.shadowBlur = 30 * f;
    ctx.fillRect(laneX + laneW * 0.06, strikeY - 3, laneW * 0.88, 6);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  });

  drawReelParticles(ctx, strikeY + h * 0.012);

  // Lane labels under the strike line
  ctx.textAlign = "center";
  const labelSize = Math.max(h * 0.008, Math.min(h * 0.014, laneW * 0.26));
  ctx.font = `700 ${Math.round(labelSize)}px sans-serif`;
  if (laneW > w * 0.045) {
    reelLanes.forEach((lane, i) => {
      const f = reelHitFlash[lane.inst] || 0;
      ctx.fillStyle = f > 0.1 ? lane.color : "#ffffff45";
      ctx.fillText(REEL_LANE_LABEL[lane.inst] || lane.inst.slice(0, 4).toUpperCase(), padX + i * laneW + laneW / 2, strikeY + h * 0.024);
    });
  }

  for (const k of Object.keys(reelHitFlash)) reelHitFlash[k] *= 0.82;
}

function reelSectionLabel(step) {
  if (!currentPattern || !currentPattern.structure) return "";
  const barIndex = Math.floor(step / STEPS_PER_BAR);
  const label = currentPattern.structure[barIndex];
  if (!label) return "";
  if (arrangementMode !== "song") return "";
  return label;
}

// Rounded-rect pill used for the section badge and the genre tag.
function reelPill(ctx, cx, y, text, font, fill, stroke, textColor) {
  ctx.font = font;
  const padX = ctx.measureText("MM").width;
  const textW = ctx.measureText(text).width;
  const pillW = textW + padX * 2;
  const pillH = parseInt(font.match(/(\d+)px/)[1], 10) * 1.9;
  const r = pillH / 2;
  const x = cx - pillW / 2;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, pillW, pillH, r);
  else ctx.rect(x, y, pillW, pillH);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.fillText(text, cx, y + pillH * 0.70);
  return pillH;
}

// Letter-spaced text - canvas has no letterSpacing in every browser, and
// wide tracking is what makes an all-caps label look designed.
function reelTrackedText(ctx, text, cx, y, spacing) {
  const chars = [...text];
  let total = 0;
  for (const c of chars) total += ctx.measureText(c).width + spacing;
  total -= spacing;
  let x = cx - total / 2;
  const prev = ctx.textAlign;
  ctx.textAlign = "left";
  for (const c of chars) {
    ctx.fillText(c, x, y);
    x += ctx.measureText(c).width + spacing;
  }
  ctx.textAlign = prev;
}

function drawReelFrame(ctx, elapsedSec, durationSec, step) {
  const w = reelCanvas.width;
  const h = reelCanvas.height;
  const accent = STYLE_ACCENTS[selectedStyleId] || "#a55eea";
  const accent2 = reelShiftHue(accent, 58);
  const cx = w / 2;
  const now = performance.now();

  // Adaptive quality: if frames start costing too much, thin the particle
  // system rather than dropping the frame rate of the recording. This
  // watches how long the *draw* takes, not the gap between frames - the
  // gap also reflects browser throttling we can't do anything about, and
  // reacting to it would strip the visuals for no reason.
  if (reelSmoothMs > 12) reelQuality = Math.max(0.25, reelQuality - 0.02);
  else if (reelSmoothMs < 8) reelQuality = Math.min(1, reelQuality + 0.01);

  reelPulse *= 0.9;
  reelShake *= 0.86;

  drawReelBackground(ctx, w, h, accent, accent2);

  // Everything from here breathes with the kick: a small zoom plus a
  // decaying shake. Subtle at 1.5% - enough to feel, not enough to read
  // as a glitch.
  ctx.save();
  const zoom = 1 + 0.015 * reelPulse;
  const shakeX = (Math.random() - 0.5) * reelShake * 10;
  const shakeY = (Math.random() - 0.5) * reelShake * 10;
  ctx.translate(cx + shakeX, h / 2 + shakeY);
  ctx.scale(zoom, zoom);
  ctx.translate(-cx, -h / 2);

  const style = STYLES[selectedStyleId];
  ctx.textAlign = "center";

  // --- header block -------------------------------------------------
  ctx.font = `700 ${Math.round(h * 0.0125)}px sans-serif`;
  ctx.fillStyle = reelAlpha(accent, 0.85);
  reelTrackedText(ctx, "BEAT STUDIO", cx, h * 0.043, h * 0.007);

  ctx.font = `800 ${Math.round(h * 0.040)}px sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = reelAlpha(accent, 0.8);
  ctx.shadowBlur = 26;
  ctx.fillText(style ? style.name : "Beat Studio", cx, h * 0.088);
  ctx.shadowBlur = 0;

  const tempo = Math.round(Number(tempoSlider.value));
  const keyLabel = keySelect.value + (keySelect.dataset.octave || "");
  const total = currentPattern ? (currentPattern.instruments[Object.keys(currentPattern.instruments)[0]] || []).length : 0;
  const totalBars = Math.max(1, Math.round(total / STEPS_PER_BAR));
  ctx.font = `600 ${Math.round(h * 0.0155)}px sans-serif`;
  ctx.fillStyle = "#b9b9cc";
  reelTrackedText(ctx, `${tempo} BPM   ·   ${keyLabel}   ·   ${totalBars} BARS`, cx, h * 0.118, h * 0.0024);

  // --- spectrum ribbon ----------------------------------------------
  drawReelSpectrum(ctx, w, h, h * 0.175, accent, accent2);

  // --- bar / beat counter -------------------------------------------
  const barIdx = Math.floor(step / STEPS_PER_BAR);
  const beatInBar = Math.floor((step % STEPS_PER_BAR) / 4);
  ctx.font = `700 ${Math.round(h * 0.0135)}px sans-serif`;
  ctx.fillStyle = "#8f8fa6";
  ctx.textAlign = "left";
  ctx.fillText(`BAR ${Math.min(totalBars, barIdx + 1)} / ${totalBars}`, w * 0.06, h * 0.243);
  ctx.textAlign = "center";
  // Four beat dots, the current one lit and swollen.
  for (let b = 0; b < 4; b++) {
    const on = b === beatInBar;
    const dx = w * 0.94 - (3 - b) * w * 0.032;
    const rr = on ? h * 0.0060 : h * 0.0036;
    ctx.beginPath();
    ctx.arc(dx, h * 0.2385, rr, 0, Math.PI * 2);
    ctx.fillStyle = on ? accent : "#ffffff28";
    if (on) { ctx.shadowColor = accent; ctx.shadowBlur = 18; }
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Section badge (Full Song mode only) - so the video narrates where in
  // the arrangement it currently is.
  const section = step !== undefined ? reelSectionLabel(step) : "";
  if (section) {
    reelPill(ctx, cx, h * 0.2275, section.toUpperCase(),
      `700 ${Math.round(h * 0.0145)}px sans-serif`,
      reelAlpha(accent, 0.22), accent, "#ffffff");
  }

  // --- the note field -----------------------------------------------
  drawReelNotes(ctx, w, h, step === undefined ? 0 : step, accent);

  // --- chord readout -------------------------------------------------
  const chordNow = step !== undefined ? reelChordName(step) : "";
  if (chordNow) {
    if (chordNow !== reelLastChord) { reelLastChord = chordNow; reelChordChangeMs = now; }
    // A quick scale-in on every chord change makes the harmony legible
    // as *movement*, which is the whole point of showing it.
    const since = Math.min(1, (now - reelChordChangeMs) / 260);
    const pop = 1 + 0.13 * (1 - since) * (1 - since);
    ctx.save();
    ctx.translate(cx, h * 0.885);
    ctx.scale(pop, pop);
    ctx.font = `800 ${Math.round(h * 0.055)}px sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = accent;
    ctx.shadowBlur = 30 + 24 * (1 - since);
    ctx.fillText(chordNow, 0, 0);
    ctx.restore();
    ctx.shadowBlur = 0;
    ctx.font = `600 ${Math.round(h * 0.0125)}px sans-serif`;
    ctx.fillStyle = "#7d7d95";
    reelTrackedText(ctx, "CHORD", cx, h * 0.906, h * 0.006);
  }

  // --- progress ------------------------------------------------------
  // Two readouts, because they answer different questions. The segmented
  // bar is a bar counter: it shows where you are inside the loop, and
  // resets with it. The hairline pinned to the very bottom edge is the
  // scrubber - how much of the video is left - which is what a viewer
  // deciding whether to keep watching actually looks for.
  const barY = h * 0.947;
  const barW = w * 0.76;
  const barX = cx - barW / 2;
  const barH = h * 0.0045;
  const progress = Math.min(1, elapsedSec / durationSec);
  const loops = Number(reelDurationSelect.value || 1);
  // Past ~16 bars the segments shrink to dots and stop being readable,
  // so a full-song arrangement gets one continuous bar instead.
  const segs = totalBars <= 16 ? totalBars : 1;
  const segGap = segs > 1 ? Math.min(6, barW / (segs * 6)) : 0;
  const segW = (barW - segGap * (segs - 1)) / segs;
  const barsDone = progress * totalBars * loops;
  for (let b = 0; b < segs; b++) {
    const x = barX + b * (segW + segGap);
    const local = segs === 1
      ? (barsDone % totalBars) / totalBars
      : Math.max(0, Math.min(1, (barsDone % totalBars) - b));
    ctx.fillStyle = "#ffffff18";
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, barY, segW, barH, barH / 2); ctx.fill(); }
    else ctx.fillRect(x, barY, segW, barH);
    if (local > 0) {
      ctx.fillStyle = accent;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 12;
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, barY, segW * local, barH, barH / 2); ctx.fill(); }
      else ctx.fillRect(x, barY, segW * local, barH);
      ctx.shadowBlur = 0;
    }
  }

  ctx.font = `700 ${Math.round(h * 0.0125)}px sans-serif`;
  ctx.fillStyle = "#6f6f88";
  reelTrackedText(ctx, "MADE WITH BEAT STUDIO", cx, h * 0.972, h * 0.005);

  ctx.restore();

  // Overall scrubber, drawn outside the kick zoom so it stays welded to
  // the bottom edge of the frame instead of bobbing with the beat.
  ctx.fillStyle = "#ffffff14";
  ctx.fillRect(0, h - 6, w, 6);
  ctx.fillStyle = accent;
  ctx.fillRect(0, h - 6, w * progress, 6);

  drawReelGrain(ctx, w, h);

  // --- title card / end card -----------------------------------------
  // A beat video that just starts mid-pattern gives a scroller nothing to
  // latch onto. 1.4s of title and 1.4s of sign-off frame the loop.
  const INTRO = 1.4;
  const OUTRO = 1.4;
  if (elapsedSec < INTRO) {
    const t = elapsedSec / INTRO;
    const fade = t < 0.65 ? 1 : 1 - (t - 0.65) / 0.35;
    drawReelCard(ctx, w, h, accent, accent2, fade, style ? style.name : "Beat Studio",
      `${tempo} BPM   ·   ${keyLabel}`, 1 + 0.05 * (1 - t));
  } else if (elapsedSec > durationSec - OUTRO) {
    const t = Math.min(1, (elapsedSec - (durationSec - OUTRO)) / OUTRO);
    drawReelCard(ctx, w, h, accent, accent2, t, style ? style.name : "Beat Studio",
      `${tempo} BPM   ·   ${keyLabel}`, 1 + 0.05 * t);
  }

  reelSmoothMs += ((performance.now() - now) - reelSmoothMs) * 0.1;
}

function drawReelCard(ctx, w, h, accent, accent2, alpha, title, sub, scale) {
  if (alpha <= 0.01) return;
  const cx = w / 2;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#05050ae0");
  g.addColorStop(0.5, "#05050af5");
  g.addColorStop(1, "#05050ae0");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const rg = ctx.createRadialGradient(cx, h * 0.5, 10, cx, h * 0.5, h * 0.4);
  rg.addColorStop(0, reelAlpha(accent, 0.30));
  rg.addColorStop(1, reelAlpha(accent, 0));
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, w, h);

  ctx.translate(cx, h * 0.5);
  ctx.scale(scale, scale);
  ctx.textAlign = "center";

  ctx.font = `700 ${Math.round(h * 0.0135)}px sans-serif`;
  ctx.fillStyle = reelAlpha(accent, 0.9);
  reelTrackedText(ctx, "BEAT STUDIO", 0, -h * 0.085, h * 0.008);

  ctx.font = `800 ${Math.round(h * 0.062)}px sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = accent;
  ctx.shadowBlur = 40;
  ctx.fillText(title, 0, 0);
  ctx.shadowBlur = 0;

  // Accent rule under the title
  const rw = h * 0.055;
  const lg = ctx.createLinearGradient(-rw, 0, rw, 0);
  lg.addColorStop(0, reelAlpha(accent, 0));
  lg.addColorStop(0.5, accent2);
  lg.addColorStop(1, reelAlpha(accent, 0));
  ctx.fillStyle = lg;
  ctx.fillRect(-rw, h * 0.020, rw * 2, 3);

  ctx.font = `600 ${Math.round(h * 0.019)}px sans-serif`;
  ctx.fillStyle = "#c9c9dd";
  reelTrackedText(ctx, sub, 0, h * 0.055, h * 0.003);
  ctx.restore();
}

let reelAnimFrame = null;

async function exportReel() {
  if (!currentPattern || !selectedStyleId) return;

  engine.ensureContext();

  if (!window.MediaRecorder || !reelCanvas.captureStream || !engine.mediaStreamDest) {
    reelOverlay.hidden = false;
    reelStatus.textContent = "Sorry, video export isn't supported in this browser. Try Chrome, Edge, or Firefox.";
    reelCancelBtn.textContent = "Close";
    reelCancelBtn.onclick = () => { reelOverlay.hidden = true; };
    return;
  }

  // Whole loops only, so the video never ends mid-phrase.
  const duration = reelLoopSeconds() * Number(reelDurationSelect.value || 1);
  const ctx = reelCanvas.getContext("2d");

  exportReelBtn.disabled = true;
  reelCancelBtn.textContent = "Cancel";
  reelOverlay.hidden = false;
  reelStatus.textContent = "Starting recording…";

  if (engine.isPlaying) engine.stop();
  reelPulse = 0;
  reelActiveInstruments.clear();
  reelHitFlash = {};
  resetReelVisuals();
  buildReelLanes();
  let reelCurrentStep = 0;
  engine.onStep = (step) => {
    highlightStep(step);
    reelStepHook(step);
    reelCurrentStep = step;
  };
  engine.start(currentPattern, activeStyle, currentFlavors, Number(tempoSlider.value));
  playBtn.textContent = "■ Stop";
  playBtn.classList.add("playing");
  startVisualizer();

  // 60fps: the note field scrolls continuously, and at 30fps the motion
  // strobes badly against the beat grid. Bitrate is pushed well past the
  // default too - 1080x1920 of gradients and glow is exactly the content
  // that a conservative default bitrate turns into blocky mush.
  const videoStream = reelCanvas.captureStream(60);
  const combined = new MediaStream([...videoStream.getVideoTracks(), ...engine.mediaStreamDest.stream.getAudioTracks()]);

  const mimeType = pickReelMimeType();
  const recorder = new MediaRecorder(combined, Object.assign(
    { videoBitsPerSecond: 12000000, audioBitsPerSecond: 192000 },
    mimeType ? { mimeType } : {},
  ));
  const chunks = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  let cancelled = false;
  reelCancelBtn.onclick = () => {
    cancelled = true;
    if (recorder.state !== "inactive") recorder.stop();
  };

  const finished = new Promise((resolve) => {
    recorder.onstop = resolve;
  });

  const startTime = performance.now();
  function frame() {
    const elapsed = (performance.now() - startTime) / 1000;
    drawReelFrame(ctx, elapsed, duration, reelCurrentStep);
    reelStatus.textContent = `Recording… ${Math.min(duration, elapsed).toFixed(0)}s / ${duration.toFixed(0)}s`;
    if (elapsed < duration && !cancelled) {
      reelAnimFrame = requestAnimationFrame(frame);
    } else if (recorder.state !== "inactive") {
      recorder.stop();
    }
  }

  recorder.start();
  reelAnimFrame = requestAnimationFrame(frame);

  await finished;
  if (reelAnimFrame) {
    cancelAnimationFrame(reelAnimFrame);
    reelAnimFrame = null;
  }

  engine.stop();
  playBtn.textContent = "▶ Play";
  playBtn.classList.remove("playing");
  stopVisualizer();
  exportReelBtn.disabled = false;

  if (cancelled || !chunks.length) {
    reelStatus.textContent = cancelled ? "Cancelled." : "Recording failed - no data captured.";
    setTimeout(() => { reelOverlay.hidden = true; }, 1200);
    return;
  }

  const blob = new Blob(chunks, { type: mimeType || "video/webm" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `beatstudio-${selectedStyleId}-reel.webm`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);

  reelStatus.textContent = "Downloaded! Check your downloads folder.";
  setTimeout(() => { reelOverlay.hidden = true; }, 1800);
}

exportReelBtn.addEventListener("click", exportReel);

// Every explicit "give me a beat" action (Generate Beat, or the prompt
// box) re-rolls each instrument's sound alongside the new pattern, so a
// fresh beat always comes with a fresh timbre instead of needing a
// separate manual shuffle step. Rather than rolling every instrument's
// flavor fully independently - which can land a bright digital hi-hat next
// to a dark distorted 808 next to a plain vintage snare, sounding like
// unrelated one-shots instead of a real production - the shuffle first
// picks a single sonic "palette" (warm/bright/dark) and then, for every
// instrument, prefers a flavor tagged with that same palette. That's the
// same principle as picking one coherent sample pack or one console's
// character for a whole mix, rather than grabbing random individual
// samples from anywhere.
let lastPalette = null;
const PALETTE_LABELS = { warm: "a warmer, vintage-leaning", bright: "a brighter, modern-leaning", dark: "a darker, moodier" };

function shuffleFlavors() {
  const choices = FLAVOR_PALETTES.filter((p) => p !== lastPalette);
  const palette = choices[Math.floor(Math.random() * choices.length)];
  lastPalette = palette;

  const changed = [];
  for (const inst of activeRows()) {
    // Only kits that belong in this genre - see FLAVOR_GENRES. Without
    // this the shuffle would eventually hand a techno track a banjo.
    const pool = poolForGenre(inst, selectedStyleId);
    if (!pool || pool.length < 1) continue;
    const tags = FLAVOR_TAGS[inst] || {};
    const current = currentFlavors[inst];

    let matching = pool.filter((f) => tags[f] === palette && f !== current);
    if (!matching.length) matching = pool.filter((f) => tags[f] === palette);
    if (!matching.length) matching = pool.filter((f) => f !== current);
    if (!matching.length) matching = pool;

    const next = matching[Math.floor(Math.random() * matching.length)];
    if (next !== current) changed.push(`${TRACK_LABELS[inst]} → ${next}`);
    currentFlavors[inst] = next;
  }
  return { changed, palette };
}

function showShuffleStatus({ changed, palette }) {
  shuffleStatus.textContent = changed.length ? `Shuffled to ${PALETTE_LABELS[palette]} kit: ${changed.join(", ")}` : "";
  clearTimeout(showShuffleStatus._timer);
  showShuffleStatus._timer = setTimeout(() => {
    shuffleStatus.textContent = "";
  }, 6000);
}

generateBtn.addEventListener("click", () => {
  rollTempoKeySwing(baseStyle);
  showShuffleStatus(shuffleFlavors());
  generatePattern();
});
playBtn.addEventListener("click", togglePlay);

tempoSlider.addEventListener("input", () => {
  tempoValue.textContent = tempoSlider.value;
  engine.updateTempo(Number(tempoSlider.value));
  refreshReelDurations();
});

swingSlider.addEventListener("input", () => {
  swingValue.textContent = swingSlider.value;
  engine.setSwing(Number(swingSlider.value) / 100);
  refreshReelDurations();
});

sidechainBtn.addEventListener("click", () => {
  const enabled = !engine.sidechainEnabled;
  engine.setSidechain(enabled);
  sidechainBtn.classList.toggle("on", enabled);
});

masterSlider.addEventListener("input", () => {
  engine.setMasterVolume(Number(masterSlider.value) / 100);
});

keySelect.addEventListener("change", () => {
  activeStyle.key = keySelect.value + keySelect.dataset.octave;
  engine.updateKey(activeStyle);
  if (openPianoRollInst) renderPianoRoll();
});

for (const btn of barsButtons) {
  btn.addEventListener("click", () => {
    if (btn.dataset.bars === "song") {
      arrangementMode = "song";
      selectedBars = totalSongBars(activeStyle);
    } else {
      arrangementMode = "loop";
      selectedBars = Number(btn.dataset.bars);
    }
    refreshReelDurations();
    for (const b of barsButtons) b.classList.toggle("selected", b === btn);
    if (selectedStyleId) generatePattern();
  });
}

// ---- Describe-a-beat: lightweight keyword/mood parsing, no ML involved ----

const GENRE_KEYWORDS = {
  drill: ["uk drill", "ny drill", "drill"],
  trap: ["trap"],
  dubstep: ["dubstep", "riddim", "wobble bass", "wobble"],
  afrobeats: ["afrobeats", "afrobeat", "highlife"],
  amapiano: ["amapiano", "log drum", "private school"],
  ukgarage: ["uk garage", "2-step", "two step", "ukg", "garage"],
  techno: ["techno", "acid house", "warehouse", "berlin"],
  neosoul: ["neo-soul", "neo soul", "neosoul", "dilla"],
  reggaeton: ["reggaeton", "dembow"],
  house: ["four on the floor", "house", "edm", "dance beat"],
  rock: ["rock", "punk", "guitar band"],
  rnb: ["r&b", "r and b", "rnb", "soul"],
  lofi: ["chillhop", "chill hop", "study beat", "lo-fi", "lo fi", "lofi"],
  hiphop: ["boom bap", "boombap", "hip-hop", "hip hop", "hiphop", "rap beat"],
};

const GENERIC_VOCAL_CHORDS = {
  core: new Array(STEPS_PER_BAR).fill(0),
  optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,C(0,1,1),0],
  optionalProbability: 0.2,
};

function parsePrompt(text) {
  const lower = text.toLowerCase();
  let styleId = null;
  let matchedKeyword = "";
  for (const [id, keywords] of Object.entries(GENRE_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw) && kw.length > matchedKeyword.length) {
        styleId = id;
        matchedKeyword = kw;
      }
    }
  }

  const has = (words) => words.some((w) => lower.includes(w));
  const mood = {
    dark: has(["dark", "moody", "sad", "eerie", "evil", "scary", "sinister", "menacing"]),
    bright: has(["happy", "bright", "uplifting", "joyful", "sunny", "cheerful"]),
    chill: has(["chill", "relax", "mellow", "slow", "calm", "laid back", "laid-back"]),
    hype: has(["hype", "energetic", "energy", "fast", "hard", "aggressive", "intense", "banger"]),
    long: has(["long", "extended", "full song", "epic"]),
    wantsVocal: has(["vocal chops", "vocal chop", "vocals", "vocal", "choir", "singing", "sing", "voice"]),
  };

  let fallback = false;
  if (!styleId) {
    fallback = true;
    if (mood.dark) styleId = "drill";
    else if (mood.chill) styleId = "lofi";
    else if (mood.hype) styleId = "house";
    else styleId = "hiphop";
  }

  return { styleId, fallback, mood };
}

function generateFromPrompt() {
  const text = promptInput.value.trim();
  if (!text) {
    promptStatus.textContent = 'Type a description first, e.g. "dark energetic trap with vocal chops".';
    return;
  }

  const { styleId, fallback, mood } = parsePrompt(text);
  selectStyle(styleId);
  shuffleFlavors();

  const notes = [];
  if (fallback) notes.push(`no exact genre match, so here's ${STYLES[styleId].name} as the closest fit`);

  if (mood.dark && activeStyle.scale === "major") {
    activeStyle.scale = "minor";
    notes.push("shifted to a darker minor key");
  } else if (mood.bright && activeStyle.scale !== "major") {
    activeStyle.scale = "major";
    notes.push("shifted to a brighter major key");
  }

  if (mood.hype) {
    tempoSlider.value = tempoSlider.max;
    notes.push("pushed the tempo up");
  } else if (mood.chill) {
    tempoSlider.value = tempoSlider.min;
    notes.push("eased the tempo down");
  }
  tempoValue.textContent = tempoSlider.value;
  engine.updateTempo(Number(tempoSlider.value));

  if (mood.long) {
    arrangementMode = "song";
    selectedBars = totalSongBars(activeStyle);
    for (const b of barsButtons) b.classList.toggle("selected", b.dataset.bars === "song");
    notes.push("built out a full-length verse/chorus arrangement");
  }

  if (mood.wantsVocal && !activeStyle.melodic.chordInstruments.includes("vocal")) {
    activeStyle.melodic = { ...activeStyle.melodic, chordInstruments: [...activeStyle.melodic.chordInstruments, "vocal"] };
    activeStyle.chords = { ...activeStyle.chords, vocal: GENERIC_VOCAL_CHORDS };
    currentFlavors.vocal = mood.dark ? "ahh" : "ooh";
    notes.push("added vocal chops");
  }

  generatePattern();
  const article = /^[aeiou]/i.test(STYLES[styleId].name) ? "an" : "a";
  promptStatus.textContent = `Generated ${article} ${STYLES[styleId].name} beat${notes.length ? " — " + notes.join(", ") : ""}.`;
}

promptGenerateBtn.addEventListener("click", generateFromPrompt);
promptInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") generateFromPrompt();
});

renderStyleCards();
