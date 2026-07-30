const engine = new BeatEngine();

const styleSelect = document.getElementById("style-select");
const controls = document.getElementById("controls");
const generateBtn = document.getElementById("generate-btn");
const playBtn = document.getElementById("play-btn");
const tempoSlider = document.getElementById("tempo-slider");
const tempoValue = document.getElementById("tempo-value");
const stepGrid = document.getElementById("step-grid");

const TRACKS = ["kick", "snare", "hihat", "openhat"];
const TRACK_LABELS = { kick: "Kick", snare: "Snare", hihat: "Hi-Hat", openhat: "Open Hat" };

let selectedStyleId = null;
let currentPattern = null;

function renderStyleCards() {
  for (const id of Object.keys(STYLES)) {
    const style = STYLES[id];
    const card = document.createElement("button");
    card.className = "style-card";
    card.dataset.styleId = id;
    card.innerHTML = `<h3>${style.name}</h3><p>${style.description}</p>`;
    card.addEventListener("click", () => selectStyle(id));
    styleSelect.appendChild(card);
  }
}

function selectStyle(id) {
  selectedStyleId = id;
  const style = STYLES[id];

  for (const card of styleSelect.children) {
    card.classList.toggle("selected", card.dataset.styleId === id);
  }

  tempoSlider.min = style.tempo.min;
  tempoSlider.max = style.tempo.max;
  tempoSlider.value = style.tempo.default;
  tempoValue.textContent = style.tempo.default;

  controls.hidden = false;
  generatePattern();

  if (engine.isPlaying) {
    engine.stop();
    playBtn.textContent = "Play";
    playBtn.classList.remove("playing");
  }
}

function generatePattern() {
  currentPattern = generateVariation(selectedStyleId);
  renderStepGrid();
  if (engine.isPlaying) {
    engine.updatePattern(currentPattern);
  }
}

function renderStepGrid() {
  stepGrid.innerHTML = "";
  const steps = currentPattern.kick.length;

  for (const track of TRACKS) {
    const label = document.createElement("div");
    label.className = "track-label";
    label.textContent = TRACK_LABELS[track];
    stepGrid.appendChild(label);

    for (let i = 0; i < steps; i++) {
      const cell = document.createElement("div");
      cell.className = "step-cell";
      if (i % 4 === 0) cell.classList.add("beat-marker");
      if (currentPattern[track][i]) cell.classList.add("active");
      cell.dataset.track = track;
      cell.dataset.step = i;
      stepGrid.appendChild(cell);
    }
  }
}

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
    playBtn.textContent = "Play";
    playBtn.classList.remove("playing");
  } else {
    const style = STYLES[selectedStyleId];
    engine.onStep = highlightStep;
    engine.start(currentPattern, Number(tempoSlider.value), style.swing);
    playBtn.textContent = "Stop";
    playBtn.classList.add("playing");
  }
}

generateBtn.addEventListener("click", generatePattern);
playBtn.addEventListener("click", togglePlay);
tempoSlider.addEventListener("input", () => {
  tempoValue.textContent = tempoSlider.value;
  engine.updateTempo(Number(tempoSlider.value));
});

renderStyleCards();
