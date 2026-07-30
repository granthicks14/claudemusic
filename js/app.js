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

const DRUM_ORDER = ["kick", "snare", "hihat", "openhat", "tom", "perc", "crash", "fx"];
const MELODIC_ORDER = ["bass", "piano", "lead", "pad", "stab", "guitar", "strings", "horn", "organ", "vocal", "kalimba", "marimba", "arp"];
const MONO_INSTRUMENTS = ["bass", "lead", "guitar", "kalimba", "marimba", "arp"];

const TRACK_LABELS = {
  kick: "Kick", snare: "Snare", hihat: "Hi-Hat", openhat: "Open Hat", tom: "Tom", perc: "Perc", crash: "Crash", fx: "FX Riser",
  bass: "Bass", piano: "Piano", lead: "Melody", pad: "Pad", stab: "Stab", guitar: "Guitar", strings: "Strings", horn: "Horn",
  organ: "Organ", vocal: "Vocal", kalimba: "Kalimba", marimba: "Marimba", arp: "Arp",
};

const DEFAULT_LEN = { bass: 2, lead: 1, guitar: 2, piano: 2, pad: 8, stab: 1, strings: 4, horn: 1, organ: 4, vocal: 1, kalimba: 1, marimba: 1, arp: 1 };

const STYLE_ACCENTS = {
  hiphop: "#ff6b6b", trap: "#a55eea", house: "#26de81", rock: "#fd9644", reggaeton: "#fed330", lofi: "#45aaf2",
  drill: "#c0392b", afrobeats: "#ffa502", dubstep: "#3742fa", rnb: "#ff6b9d",
  phonk: "#8e44ad", jerseyclub: "#00cec9", dnb: "#e17055", synthwave: "#fd79a8", rap: "#ffa801",
};

const SIDECHAIN_DEFAULT_ON = new Set(["trap", "house", "dubstep", "afrobeats", "drill", "phonk", "jerseyclub", "dnb", "synthwave", "rap"]);

const TRACK_COLOR = {
  kick: "#ff6b6b", snare: "#feca57", hihat: "#48dbfb", openhat: "#0abde3", tom: "#ff9f43",
  perc: "#1dd1a1", crash: "#c8d6e5", fx: "#c8d6e5", bass: "#a55eea", piano: "#00d2d3", lead: "#ff9ff3", pad: "#54a0ff",
  stab: "#f368e0", guitar: "#ff6348", strings: "#7bed9f", horn: "#eccc68", organ: "#e58e26", vocal: "#ff7f9f", kalimba: "#fdcb6e",
  marimba: "#55efc4", arp: "#74b9ff",
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
  currentPattern = arrangementMode === "song" ? generateSongVariation(activeStyle) : generateVariation(activeStyle, selectedBars);
  renderSectionRow();
  renderStepGrid();
  if (openPianoRollInst) renderPianoRoll();
  if (openAutomationInst) renderAutomation();
  pushAutomationToEngine();
  if (engine.isPlaying) engine.updatePattern(currentPattern);
}

function pushAutomationToEngine() {
  const automation = currentPattern.automation || {};
  for (const track of ALL_TRACKS) {
    engine.setAutomation(track, automation[track] || null);
  }
}

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
  return `
    <span class="track-color" style="background:${TRACK_COLOR[track]}"></span>
    <button class="track-name" data-track="${track}" title="Open piano roll">${TRACK_LABELS[track]}</button>
    <button class="track-btn mute-btn ${state.muted ? "on" : ""}" data-action="mute" data-track="${track}">M</button>
    <button class="track-btn solo-btn ${state.solo ? "on" : ""}" data-action="solo" data-track="${track}">S</button>
    ${automationBtn}
    <input type="range" class="track-vol" data-track="${track}" min="0" max="100" value="${Math.round(state.volume * 100)}" title="Volume">
    <input type="range" class="track-rev" data-track="${track}" min="0" max="100" value="${reverbPct}" title="Reverb send">
  `;
}

function barDividerBackground(bars) {
  const barPct = 100 / bars;
  return `repeating-linear-gradient(to right, rgba(255,255,255,0.09) 0, rgba(255,255,255,0.09) 1px, transparent 1px, transparent ${barPct}%)`;
}

function noteNameFor(track, note) {
  const rootMidi = noteNameToMidi(activeStyle.key);
  const degree = note.degree !== undefined ? note.degree : note.degrees[0];
  return degreeToLabel(rootMidi, activeStyle.scale, degree);
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
    bar.title = `${noteNameFor(track, note)} · ${note.len} step${note.len === 1 ? "" : "s"}`;
    if (note.len / steps > 0.03) {
      const label = document.createElement("span");
      label.className = "note-bar-label";
      label.textContent = noteNameFor(track, note);
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
  stepGrid.style.gridTemplateColumns = `248px repeat(${steps}, 1fr)`;
  sectionRow.style.gridTemplateColumns = `248px repeat(${steps}, 1fr)`;

  for (const track of activeRows()) {
    const header = document.createElement("div");
    header.className = "track-header";
    header.innerHTML = trackHeaderHTML(track);
    stepGrid.appendChild(header);

    const lane = document.createElement("div");
    lane.dataset.track = track;
    lane.style.gridColumn = `span ${steps}`;
    lane.style.backgroundImage = barDividerBackground(selectedBars);

    if (DRUM_ORDER.includes(track)) {
      lane.className = "rack-lane drum-lane";
      renderHitMarks(lane, track, steps);
    } else {
      lane.className = "rack-lane melodic-lane";
      if (openPianoRollInst === track) lane.classList.add("editing");
      renderNoteBars(lane, track, steps);
    }
    stepGrid.appendChild(lane);
  }

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
    togglePianoRoll(nameBtn.dataset.track);
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

  const lane = e.target.closest(".rack-lane");
  if (lane) {
    const steps = selectedBars * STEPS_PER_BAR;
    const rect = lane.getBoundingClientRect();
    const step = Math.max(0, Math.min(steps - 1, Math.floor(((e.clientX - rect.left) / rect.width) * steps)));
    const track = lane.dataset.track;
    if (!currentPattern.instruments[track][step]) {
      currentPattern.instruments[track][step] = DRUM_ORDER.includes(track) ? true : defaultNoteFor(track, step);
      renderStepGrid();
      if (openPianoRollInst === track) renderPianoRoll();
      if (engine.isPlaying) engine.updatePattern(currentPattern);
    }
    return;
  }
});

stepGrid.addEventListener("input", (e) => {
  if (e.target.classList.contains("track-vol")) {
    engine.setTrackVolume(e.target.dataset.track, Number(e.target.value) / 100);
  } else if (e.target.classList.contains("track-rev")) {
    engine.setReverbSend(e.target.dataset.track, Number(e.target.value) / 100);
  }
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
  const rootMidi = noteNameToMidi(activeStyle.key);

  const rows = [];
  if (isMono) {
    for (let d = register + 7; d >= register - 7; d--) rows.push(d);
  } else {
    for (let d = register + 6; d >= register; d--) rows.push(d);
  }

  pianoRollGrid.innerHTML = "";
  pianoRollGrid.style.gridTemplateColumns = "110px 1fr";

  rows.forEach((rowDegree, rowIdx) => {
    const noteLabel = degreeToLabel(rootMidi, activeStyle.scale, rowDegree);
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
      const midi = scaleDegreeToMidi(rootMidi, activeStyle.scale, rowDegree);
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
    renderRollNoteBar(lane, i, note.len, steps, track, degreeToLabel(rootMidi, activeStyle.scale, noteDegree));
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

function drawReelFrame(ctx, elapsedSec, durationSec) {
  const w = reelCanvas.width;
  const h = reelCanvas.height;
  const accent = STYLE_ACCENTS[selectedStyleId] || "#a55eea";

  ctx.fillStyle = "#0b0b12";
  ctx.fillRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(w / 2, h * 0.4, 30, w / 2, h * 0.4, h * 0.75);
  glow.addColorStop(0, accent + "50");
  glow.addColorStop(1, "#0b0b1200");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  if (engine.analyser) {
    const data = new Uint8Array(engine.analyser.frequencyBinCount);
    engine.analyser.getByteFrequencyData(data);
    const barCount = 36;
    const barGap = 7;
    const barWidth = (w - 100) / barCount - barGap;
    const baseY = h * 0.6;
    ctx.fillStyle = accent;
    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * data.length * 0.7);
      const value = data[dataIndex] / 255;
      const barHeight = Math.max(5, value * h * 0.24);
      const x = 50 + i * (barWidth + barGap);
      ctx.fillRect(x, baseY - barHeight, barWidth, barHeight * 2);
    }
  }

  const style = STYLES[selectedStyleId];
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 58px sans-serif";
  ctx.fillText(style ? style.name : "Beat Studio", w / 2, h * 0.2);

  ctx.font = "400 26px sans-serif";
  ctx.fillStyle = "#c9c9d8";
  const tempo = Math.round(Number(tempoSlider.value));
  const keyLabel = keySelect.value + (keySelect.dataset.octave || "");
  ctx.fillText(`${tempo} BPM  ·  ${keyLabel}`, w / 2, h * 0.26);

  ctx.font = "700 30px sans-serif";
  ctx.fillStyle = accent;
  ctx.fillText("BEAT STUDIO", w / 2, h * 0.92);

  const barY = h * 0.965;
  const barW = w * 0.7;
  const barX = (w - barW) / 2;
  ctx.fillStyle = "#2a2a3a";
  ctx.fillRect(barX, barY, barW, 6);
  ctx.fillStyle = accent;
  ctx.fillRect(barX, barY, barW * Math.min(1, elapsedSec / durationSec), 6);
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

  const duration = Number(reelDurationSelect.value);
  const ctx = reelCanvas.getContext("2d");

  exportReelBtn.disabled = true;
  reelCancelBtn.textContent = "Cancel";
  reelOverlay.hidden = false;
  reelStatus.textContent = "Starting recording…";

  if (engine.isPlaying) engine.stop();
  engine.onStep = highlightStep;
  engine.start(currentPattern, activeStyle, currentFlavors, Number(tempoSlider.value));
  playBtn.textContent = "■ Stop";
  playBtn.classList.add("playing");
  startVisualizer();

  const videoStream = reelCanvas.captureStream(30);
  const combined = new MediaStream([...videoStream.getVideoTracks(), ...engine.mediaStreamDest.stream.getAudioTracks()]);

  const mimeType = pickReelMimeType();
  const recorder = new MediaRecorder(combined, mimeType ? { mimeType } : undefined);
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
    drawReelFrame(ctx, elapsed, duration);
    reelStatus.textContent = `Recording… ${Math.min(duration, elapsed).toFixed(0)}s / ${duration}s`;
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
    const pool = FLAVOR_POOLS[inst];
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
});

swingSlider.addEventListener("input", () => {
  swingValue.textContent = swingSlider.value;
  engine.setSwing(Number(swingSlider.value) / 100);
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
      selectedBars = totalSongBars();
    } else {
      arrangementMode = "loop";
      selectedBars = Number(btn.dataset.bars);
    }
    for (const b of barsButtons) b.classList.toggle("selected", b === btn);
    if (selectedStyleId) generatePattern();
  });
}

// ---- Describe-a-beat: lightweight keyword/mood parsing, no ML involved ----

const GENRE_KEYWORDS = {
  drill: ["uk drill", "ny drill", "drill"],
  trap: ["trap"],
  dubstep: ["dubstep", "riddim", "wobble bass", "wobble"],
  afrobeats: ["amapiano", "afrobeats", "afrobeat", "log drum"],
  reggaeton: ["reggaeton", "dembow"],
  house: ["four on the floor", "house", "edm", "dance beat"],
  rock: ["rock", "punk", "guitar band"],
  rnb: ["neo-soul", "neo soul", "r&b", "r and b", "rnb", "soul"],
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
    selectedBars = totalSongBars();
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
