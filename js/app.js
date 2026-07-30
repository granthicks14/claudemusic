const engine = new BeatEngine();

const styleSelect = document.getElementById("style-select");
const workspace = document.getElementById("workspace");
const generateBtn = document.getElementById("generate-btn");
const shuffleBtn = document.getElementById("shuffle-btn");
const playBtn = document.getElementById("play-btn");
const tempoSlider = document.getElementById("tempo-slider");
const tempoValue = document.getElementById("tempo-value");
const masterSlider = document.getElementById("master-slider");
const keySelect = document.getElementById("key-select");
const barsButtons = document.querySelectorAll("#bars-select button");
const sectionRow = document.getElementById("section-row");
const stepGrid = document.getElementById("step-grid");
const pianoRollPanel = document.getElementById("piano-roll");
const pianoRollTitle = document.getElementById("piano-roll-title");
const pianoRollGrid = document.getElementById("piano-roll-grid");
const pianoRollClose = document.getElementById("piano-roll-close");

const DRUM_ORDER = ["kick", "snare", "hihat", "openhat", "tom", "perc", "crash"];
const MELODIC_ORDER = ["bass", "piano", "lead", "pad", "stab"];
const MONO_INSTRUMENTS = ["bass", "lead"];

const TRACK_LABELS = {
  kick: "Kick", snare: "Snare", hihat: "Hi-Hat", openhat: "Open Hat", tom: "Tom",
  perc: "Perc", crash: "Crash", bass: "Bass", piano: "Piano", lead: "Lead", pad: "Pad", stab: "Stab",
};

const STYLE_ACCENTS = {
  hiphop: "#ff6b6b", trap: "#a55eea", house: "#26de81", rock: "#fd9644", reggaeton: "#fed330", lofi: "#45aaf2",
};

const TRACK_COLOR = {
  kick: "#ff6b6b", snare: "#feca57", hihat: "#48dbfb", openhat: "#0abde3", tom: "#ff9f43",
  perc: "#1dd1a1", crash: "#c8d6e5", bass: "#a55eea", piano: "#00d2d3", lead: "#ff9ff3", pad: "#54a0ff", stab: "#f368e0",
};

let selectedStyleId = null;
let baseStyle = null;
let activeStyle = null;
let currentFlavors = {};
let currentPattern = null;
let selectedBars = 4;
let openPianoRollInst = null;

function activeRows() {
  return [
    ...DRUM_ORDER.filter((i) => activeStyle.drums.instruments.includes(i)),
    ...MELODIC_ORDER.filter((i) => activeStyle.melodic.instruments.includes(i)),
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

function selectStyle(id) {
  selectedStyleId = id;
  baseStyle = STYLES[id];
  activeStyle = Object.assign({}, baseStyle, { key: baseStyle.key });
  currentFlavors = Object.assign({}, baseStyle.defaultFlavors);

  for (const card of styleSelect.children) {
    card.classList.toggle("selected", card.dataset.styleId === id);
  }

  engine.ensureContext();
  engine.setMasterVolume(Number(masterSlider.value) / 100);

  populateKeySelect(baseStyle.key);
  tempoSlider.min = baseStyle.tempo.min;
  tempoSlider.max = baseStyle.tempo.max;
  tempoSlider.value = baseStyle.tempo.default;
  tempoValue.textContent = baseStyle.tempo.default;

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
  currentPattern = generateVariation(activeStyle, selectedBars);
  renderSectionRow();
  renderStepGrid();
  if (openPianoRollInst) renderPianoRoll();
  if (engine.isPlaying) engine.updatePattern(currentPattern);
}

function renderSectionRow() {
  sectionRow.innerHTML = "";
  const spacer = document.createElement("div");
  spacer.className = "track-header spacer";
  sectionRow.appendChild(spacer);

  for (const section of currentPattern.structure) {
    const cell = document.createElement("div");
    cell.className = "section-cell section-" + section;
    cell.textContent = section;
    cell.style.gridColumn = `span ${STEPS_PER_BAR}`;
    sectionRow.appendChild(cell);
  }
}

function trackHeaderHTML(track) {
  const state = engine.trackState[track];
  return `
    <span class="track-color" style="background:${TRACK_COLOR[track]}"></span>
    <button class="track-name" data-track="${track}" title="Open piano roll">${TRACK_LABELS[track]}</button>
    <button class="track-btn mute-btn ${state.muted ? "on" : ""}" data-action="mute" data-track="${track}">M</button>
    <button class="track-btn solo-btn ${state.solo ? "on" : ""}" data-action="solo" data-track="${track}">S</button>
    <input type="range" class="track-vol" data-track="${track}" min="0" max="100" value="${Math.round(state.volume * 100)}">
  `;
}

function isStepActive(track, value) {
  if (DRUM_ORDER.includes(track)) return Boolean(value);
  return Boolean(value);
}

function renderStepGrid() {
  stepGrid.innerHTML = "";
  const steps = selectedBars * STEPS_PER_BAR;
  stepGrid.style.gridTemplateColumns = `190px repeat(${steps}, 1fr)`;
  sectionRow.style.gridTemplateColumns = `190px repeat(${steps}, 1fr)`;

  for (const track of activeRows()) {
    const header = document.createElement("div");
    header.className = "track-header";
    header.innerHTML = trackHeaderHTML(track);
    stepGrid.appendChild(header);

    for (let i = 0; i < steps; i++) {
      const cell = document.createElement("div");
      cell.className = "step-cell";
      cell.dataset.track = track;
      cell.dataset.step = i;
      if (i % STEPS_PER_BAR === 0) cell.classList.add("bar-start");
      if (i % 4 === 0) cell.classList.add("beat-marker");

      const value = currentPattern.instruments[track][i];
      if (isStepActive(track, value)) {
        cell.classList.add("active");
        cell.style.background = TRACK_COLOR[track];
        if (value === "roll") cell.classList.add("roll");
      }
      if (openPianoRollInst === track) cell.classList.add("editing");
      stepGrid.appendChild(cell);
    }
  }
}

function defaultNoteFor(track, step) {
  const barIndex = Math.floor(step / STEPS_PER_BAR);
  const barRoot = currentPattern.barRootDegrees[barIndex];
  const register = REGISTER[track];
  if (MONO_INSTRUMENTS.includes(track)) {
    return { degree: barRoot + register, len: track === "bass" ? 2 : 1 };
  }
  const len = track === "pad" ? 8 : track === "piano" ? 2 : 1;
  return { degrees: chordDegrees(barRoot + register, 3), len };
}

function handleStepClick(track, step) {
  const arr = currentPattern.instruments[track];
  if (DRUM_ORDER.includes(track)) {
    arr[step] = !arr[step];
  } else {
    arr[step] = arr[step] ? null : defaultNoteFor(track, step);
  }
  renderStepGrid();
  if (openPianoRollInst) renderPianoRoll();
  if (engine.isPlaying) engine.updatePattern(currentPattern);
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
    togglePianoRoll(nameBtn.dataset.track);
    return;
  }
  const cell = e.target.closest(".step-cell");
  if (cell) handleStepClick(cell.dataset.track, Number(cell.dataset.step));
});

stepGrid.addEventListener("input", (e) => {
  if (e.target.classList.contains("track-vol")) {
    engine.setTrackVolume(e.target.dataset.track, Number(e.target.value) / 100);
  }
});

function togglePianoRoll(track) {
  if (openPianoRollInst === track) {
    closePianoRoll();
    return;
  }
  openPianoRollInst = track;
  pianoRollPanel.hidden = false;
  pianoRollTitle.textContent = `${TRACK_LABELS[track]} — click to place notes`;
  renderPianoRoll();
  renderStepGrid();
}

function closePianoRoll() {
  openPianoRollInst = null;
  pianoRollPanel.hidden = true;
}

function renderPianoRoll() {
  const track = openPianoRollInst;
  const steps = selectedBars * STEPS_PER_BAR;
  const isMono = MONO_INSTRUMENTS.includes(track);
  const register = REGISTER[track];
  const rootMidi = noteNameToMidi(activeStyle.key);

  const rows = [];
  if (isMono) {
    for (let d = register + 7; d >= register - 7; d--) rows.push(d);
  } else {
    for (let d = register + 6; d >= register; d--) rows.push(d);
  }

  pianoRollGrid.innerHTML = "";
  pianoRollGrid.style.gridTemplateColumns = `90px repeat(${steps}, 1fr)`;

  for (const rowDegree of rows) {
    const label = document.createElement("div");
    label.className = "roll-label";
    if (isMono) {
      label.textContent = degreeToLabel(rootMidi, activeStyle.scale, rowDegree);
      if (rowDegree === register) label.classList.add("root-row");
    } else {
      label.textContent = `${romanForDegree(rowDegree - register)} · ${degreeToLabel(rootMidi, activeStyle.scale, rowDegree)}`;
      if (rowDegree === register) label.classList.add("root-row");
    }
    pianoRollGrid.appendChild(label);

    for (let i = 0; i < steps; i++) {
      const cell = document.createElement("div");
      cell.className = "roll-cell";
      cell.dataset.track = track;
      cell.dataset.step = i;
      cell.dataset.degree = rowDegree;
      if (i % STEPS_PER_BAR === 0) cell.classList.add("bar-start");
      if (i % 4 === 0) cell.classList.add("beat-marker");

      const value = currentPattern.instruments[track][i];
      const noteDegree = value ? (isMono ? value.degree : value.degrees[0]) : null;
      if (noteDegree === rowDegree) {
        cell.classList.add("active");
        cell.style.background = TRACK_COLOR[track];
      }

      pianoRollGrid.appendChild(cell);
    }
  }
}

pianoRollGrid.addEventListener("click", (e) => {
  const cell = e.target.closest(".roll-cell");
  if (!cell) return;
  const track = cell.dataset.track;
  const step = Number(cell.dataset.step);
  const rowDegree = Number(cell.dataset.degree);
  const arr = currentPattern.instruments[track];
  const existing = arr[step];
  const isMono = MONO_INSTRUMENTS.includes(track);
  const currentDegree = existing ? (isMono ? existing.degree : existing.degrees[0]) : null;

  if (currentDegree === rowDegree) {
    arr[step] = null;
  } else if (isMono) {
    arr[step] = { degree: rowDegree, len: existing ? existing.len : track === "bass" ? 2 : 1 };
  } else {
    const size = existing ? existing.degrees.length : 3;
    const len = existing ? existing.len : track === "pad" ? 8 : track === "piano" ? 2 : 1;
    arr[step] = { degrees: chordDegrees(rowDegree, size), len };
  }

  renderPianoRoll();
  renderStepGrid();
  if (engine.isPlaying) engine.updatePattern(currentPattern);
});

pianoRollClose.addEventListener("click", closePianoRoll);

function highlightStep(step) {
  const cells = stepGrid.querySelectorAll(".step-cell");
  for (const cell of cells) {
    cell.classList.toggle("playing", Number(cell.dataset.step) === step);
  }
}

function togglePlay() {
  if (!currentPattern) return;
  if (engine.isPlaying) {
    engine.stop();
    playBtn.textContent = "▶ Play";
    playBtn.classList.remove("playing");
  } else {
    engine.onStep = highlightStep;
    engine.start(currentPattern, activeStyle, currentFlavors, Number(tempoSlider.value));
    playBtn.textContent = "■ Stop";
    playBtn.classList.add("playing");
  }
}

function shuffleSounds() {
  for (const inst of activeRows()) {
    const pool = FLAVOR_POOLS[inst];
    if (pool && pool.length) {
      currentFlavors[inst] = pool[Math.floor(Math.random() * pool.length)];
    }
  }
  shuffleBtn.classList.add("pulse");
  setTimeout(() => shuffleBtn.classList.remove("pulse"), 300);
}

generateBtn.addEventListener("click", generatePattern);
shuffleBtn.addEventListener("click", shuffleSounds);
playBtn.addEventListener("click", togglePlay);

tempoSlider.addEventListener("input", () => {
  tempoValue.textContent = tempoSlider.value;
  engine.updateTempo(Number(tempoSlider.value));
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
    selectedBars = Number(btn.dataset.bars);
    for (const b of barsButtons) b.classList.toggle("selected", b === btn);
    if (selectedStyleId) generatePattern();
  });
}

renderStyleCards();
