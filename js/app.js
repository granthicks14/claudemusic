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
const MELODIC_ORDER = ["bass", "piano", "lead", "pad", "stab", "guitar", "strings", "horn"];
const MONO_INSTRUMENTS = ["bass", "lead", "guitar"];

const TRACK_LABELS = {
  kick: "Kick", snare: "Snare", hihat: "Hi-Hat", openhat: "Open Hat", tom: "Tom", perc: "Perc", crash: "Crash",
  bass: "Bass", piano: "Piano", lead: "Melody", pad: "Pad", stab: "Stab", guitar: "Guitar", strings: "Strings", horn: "Horn",
};

const DEFAULT_LEN = { bass: 2, lead: 1, guitar: 2, piano: 2, pad: 8, stab: 1, strings: 4, horn: 1 };

const STYLE_ACCENTS = {
  hiphop: "#ff6b6b", trap: "#a55eea", house: "#26de81", rock: "#fd9644", reggaeton: "#fed330", lofi: "#45aaf2",
};

const TRACK_COLOR = {
  kick: "#ff6b6b", snare: "#feca57", hihat: "#48dbfb", openhat: "#0abde3", tom: "#ff9f43",
  perc: "#1dd1a1", crash: "#c8d6e5", bass: "#a55eea", piano: "#00d2d3", lead: "#ff9ff3", pad: "#54a0ff",
  stab: "#f368e0", guitar: "#ff6348", strings: "#7bed9f", horn: "#eccc68",
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

function barDividerBackground(bars) {
  const barPct = 100 / bars;
  return `repeating-linear-gradient(to right, rgba(255,255,255,0.09) 0, rgba(255,255,255,0.09) 1px, transparent 1px, transparent ${barPct}%)`;
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
    bar.style.background = TRACK_COLOR[track];
    lane.appendChild(bar);
  }
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

    if (DRUM_ORDER.includes(track)) {
      for (let i = 0; i < steps; i++) {
        const cell = document.createElement("div");
        cell.className = "step-cell";
        cell.dataset.track = track;
        cell.dataset.step = i;
        if (i % STEPS_PER_BAR === 0) cell.classList.add("bar-start");
        if (i % 4 === 0) cell.classList.add("beat-marker");
        const value = currentPattern.instruments[track][i];
        if (value) {
          cell.classList.add("active");
          cell.style.background = TRACK_COLOR[track];
          if (value === "roll") cell.classList.add("roll");
        }
        stepGrid.appendChild(cell);
      }
    } else {
      const lane = document.createElement("div");
      lane.className = "melodic-lane";
      lane.dataset.track = track;
      lane.style.gridColumn = `span ${steps}`;
      lane.style.backgroundImage = barDividerBackground(selectedBars);
      if (openPianoRollInst === track) lane.classList.add("editing");
      renderNoteBars(lane, track, steps);
      stepGrid.appendChild(lane);
    }
  }
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
    togglePianoRoll(nameBtn.dataset.track);
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

  const lane = e.target.closest(".melodic-lane");
  if (lane) {
    const steps = selectedBars * STEPS_PER_BAR;
    const rect = lane.getBoundingClientRect();
    const step = Math.max(0, Math.min(steps - 1, Math.floor(((e.clientX - rect.left) / rect.width) * steps)));
    const track = lane.dataset.track;
    if (!currentPattern.instruments[track][step]) {
      currentPattern.instruments[track][step] = defaultNoteFor(track, step);
      renderStepGrid();
      if (openPianoRollInst === track) renderPianoRoll();
      if (engine.isPlaying) engine.updatePattern(currentPattern);
    }
    return;
  }

  const cell = e.target.closest(".step-cell");
  if (cell) {
    const arr = currentPattern.instruments[cell.dataset.track];
    arr[Number(cell.dataset.step)] = !arr[Number(cell.dataset.step)];
    renderStepGrid();
    if (engine.isPlaying) engine.updatePattern(currentPattern);
  }
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
  pianoRollTitle.textContent = `${TRACK_LABELS[track]} — drag to draw a note, drag its right edge to resize, drag its body to move, click to delete`;
  renderPianoRoll();
  renderStepGrid();
}

function closePianoRoll() {
  openPianoRollInst = null;
  pianoRollPanel.hidden = true;
}

function renderRollNoteBar(lane, step, len, steps, track) {
  const bar = document.createElement("div");
  bar.className = "roll-note";
  bar.dataset.step = step;
  bar.dataset.track = track;
  bar.style.left = (step / steps) * 100 + "%";
  bar.style.width = (len / steps) * 100 + "%";
  bar.style.background = TRACK_COLOR[track];
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
  const rootMidi = noteNameToMidi(activeStyle.key);

  const rows = [];
  if (isMono) {
    for (let d = register + 7; d >= register - 7; d--) rows.push(d);
  } else {
    for (let d = register + 6; d >= register; d--) rows.push(d);
  }

  pianoRollGrid.innerHTML = "";
  pianoRollGrid.style.gridTemplateColumns = "110px 1fr";

  for (const rowDegree of rows) {
    const label = document.createElement("div");
    label.className = "roll-label";
    label.textContent = isMono
      ? degreeToLabel(rootMidi, activeStyle.scale, rowDegree)
      : `${romanForDegree(rowDegree - register)} · ${degreeToLabel(rootMidi, activeStyle.scale, rowDegree)}`;
    if (rowDegree === register) label.classList.add("root-row");
    pianoRollGrid.appendChild(label);

    const lane = document.createElement("div");
    lane.className = "roll-lane";
    lane.dataset.track = track;
    lane.dataset.degree = rowDegree;
    lane.style.backgroundImage = barDividerBackground(selectedBars);
    pianoRollGrid.appendChild(lane);
  }

  const arr = currentPattern.instruments[track];
  for (let i = 0; i < steps; i++) {
    const note = arr[i];
    if (!note) continue;
    const noteDegree = isMono ? note.degree : note.degrees[0];
    const rowIndex = rows.indexOf(noteDegree);
    if (rowIndex === -1) continue;
    const lane = pianoRollGrid.children[rowIndex * 2 + 1];
    renderRollNoteBar(lane, i, note.len, steps, track);
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
