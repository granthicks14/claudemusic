const engine = new BeatEngine();

const styleSelect = document.getElementById("style-select");
const workspace = document.getElementById("workspace");
const generateBtn = document.getElementById("generate-btn");
const shuffleBtn = document.getElementById("shuffle-btn");
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
const promptInput = document.getElementById("prompt-input");
const promptGenerateBtn = document.getElementById("prompt-generate");
const promptStatus = document.getElementById("prompt-status");

const DRUM_ORDER = ["kick", "snare", "hihat", "openhat", "tom", "perc", "crash"];
const MELODIC_ORDER = ["bass", "piano", "lead", "pad", "stab", "guitar", "strings", "horn", "organ", "vocal"];
const MONO_INSTRUMENTS = ["bass", "lead", "guitar"];

const TRACK_LABELS = {
  kick: "Kick", snare: "Snare", hihat: "Hi-Hat", openhat: "Open Hat", tom: "Tom", perc: "Perc", crash: "Crash",
  bass: "Bass", piano: "Piano", lead: "Melody", pad: "Pad", stab: "Stab", guitar: "Guitar", strings: "Strings", horn: "Horn",
  organ: "Organ", vocal: "Vocal",
};

const DEFAULT_LEN = { bass: 2, lead: 1, guitar: 2, piano: 2, pad: 8, stab: 1, strings: 4, horn: 1, organ: 4, vocal: 1 };

const STYLE_ACCENTS = {
  hiphop: "#ff6b6b", trap: "#a55eea", house: "#26de81", rock: "#fd9644", reggaeton: "#fed330", lofi: "#45aaf2",
  drill: "#c0392b", afrobeats: "#ffa502", dubstep: "#3742fa", rnb: "#ff6b9d",
};

const SIDECHAIN_DEFAULT_ON = new Set(["trap", "house", "dubstep", "afrobeats", "drill"]);

const TRACK_COLOR = {
  kick: "#ff6b6b", snare: "#feca57", hihat: "#48dbfb", openhat: "#0abde3", tom: "#ff9f43",
  perc: "#1dd1a1", crash: "#c8d6e5", bass: "#a55eea", piano: "#00d2d3", lead: "#ff9ff3", pad: "#54a0ff",
  stab: "#f368e0", guitar: "#ff6348", strings: "#7bed9f", horn: "#eccc68", organ: "#e58e26", vocal: "#ff7f9f",
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

  const swingPct = Math.round(baseStyle.swing * 100);
  swingSlider.value = swingPct;
  swingValue.textContent = swingPct;
  engine.setSwing(baseStyle.swing);

  const sidechainOn = SIDECHAIN_DEFAULT_ON.has(id);
  engine.setSidechain(sidechainOn);
  sidechainBtn.classList.toggle("on", sidechainOn);

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
  const reverbPct = engine.reverbSends[track]
    ? Math.round(engine.reverbSends[track].gain.value * 100)
    : Math.round((DEFAULT_REVERB_SEND[track] || 0) * 100);
  return `
    <span class="track-color" style="background:${TRACK_COLOR[track]}"></span>
    <button class="track-name" data-track="${track}" title="Open piano roll">${TRACK_LABELS[track]}</button>
    <button class="track-btn mute-btn ${state.muted ? "on" : ""}" data-action="mute" data-track="${track}">M</button>
    <button class="track-btn solo-btn ${state.solo ? "on" : ""}" data-action="solo" data-track="${track}">S</button>
    <input type="range" class="track-vol" data-track="${track}" min="0" max="100" value="${Math.round(state.volume * 100)}" title="Volume">
    <input type="range" class="track-rev" data-track="${track}" min="0" max="100" value="${reverbPct}" title="Reverb send">
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
  stepGrid.style.gridTemplateColumns = `225px repeat(${steps}, 1fr)`;
  sectionRow.style.gridTemplateColumns = `225px repeat(${steps}, 1fr)`;

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
  } else if (e.target.classList.contains("track-rev")) {
    engine.setReverbSend(e.target.dataset.track, Number(e.target.value) / 100);
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
  const changed = [];
  for (const inst of activeRows()) {
    const pool = FLAVOR_POOLS[inst];
    if (!pool || pool.length < 1) continue;
    const current = currentFlavors[inst];
    const choices = pool.length > 1 ? pool.filter((f) => f !== current) : pool;
    const next = choices[Math.floor(Math.random() * choices.length)];
    if (next !== current) changed.push(`${TRACK_LABELS[inst]} → ${next}`);
    currentFlavors[inst] = next;
  }

  shuffleBtn.classList.add("pulse");
  setTimeout(() => shuffleBtn.classList.remove("pulse"), 300);
  shuffleStatus.textContent = changed.length ? `Shuffled: ${changed.join(", ")}` : "Nothing to shuffle for this style.";
  clearTimeout(shuffleSounds._timer);
  shuffleSounds._timer = setTimeout(() => {
    shuffleStatus.textContent = "";
  }, 5000);
}

generateBtn.addEventListener("click", generatePattern);
shuffleBtn.addEventListener("click", shuffleSounds);
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
    selectedBars = Number(btn.dataset.bars);
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
    selectedBars = 8;
    for (const b of barsButtons) b.classList.toggle("selected", b.dataset.bars === "8");
    notes.push("built out an 8-bar arrangement");
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
