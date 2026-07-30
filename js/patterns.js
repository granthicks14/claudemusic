const STEPS_PER_BAR = 16;

function freqFromSemi(root, semi) {
  return root * Math.pow(2, semi / 12);
}

const STYLES = {
  hiphop: {
    name: "Hip-Hop",
    description: "Boom bap: hard kick, snappy snare, dark swung hi-hats (MPC-style ~58% swing).",
    tempo: { min: 82, max: 96, default: 90 },
    swing: 0.15,
    humanize: { timingMs: 6, velocityJitter: 0.18 },
    instruments: ["kick", "snare", "hihat", "openhat", "bass", "perc"],
    flavors: { kick: "boombap", snare: "crisp", hihat: "dark", perc: "shaker", bass: "warm" },
    root: 55, // A1
    ambience: null,
    main: {
      core: {
        kick:    [1,0,0,0, 0,0,1,0, 0,0,0,1, 0,0,0,0],
        snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
        hihat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
        openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        perc:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      },
      optional: {
        kick:    [0,0,1,0, 0,1,0,0, 1,0,0,0, 0,1,0,0],
        snare:   [0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
        openhat: [0,0,0,1, 0,0,0,0, 0,0,0,1, 0,0,0,0],
        perc:    [0,1,0,0, 0,0,1,0, 0,1,0,0, 0,0,1,0],
      },
      optionalProbability: 0.35,
      bass: [
        { semi: 0, len: 3 }, null, null, null,
        null, null, { semi: 0, len: 3 }, null,
        null, null, null, { semi: -5, len: 1 },
        null, null, null, null,
      ],
      bassOptional: [
        null, null, null, { semi: 3, len: 1 },
        null, null, null, null,
        null, null, { semi: 7, len: 1 }, null,
        null, null, null, null,
      ],
      bassOptionalProbability: 0.3,
    },
  },

  trap: {
    name: "Trap",
    description: "Sparse hard-hitting kick, sliding 808s, and rapid-fire hi-hat rolls at ~140 BPM.",
    tempo: { min: 132, max: 150, default: 140 },
    swing: 0.04,
    humanize: { timingMs: 2, velocityJitter: 0.12 },
    instruments: ["kick", "snare", "hihat", "openhat", "bass", "crash"],
    flavors: { kick: "808", snare: "clap", hihat: "bright", bass: "808" },
    root: 41.2, // E1
    ambience: null,
    main: {
      core: {
        kick:    [1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
        snare:   [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
        hihat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
        openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
      },
      optional: {
        kick:    [0,0,1,0, 0,1,0,0, 0,0,0,1, 1,0,0,0],
        snare:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
        openhat: [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0],
      },
      optionalProbability: 0.4,
      hihatRollSteps: [7, 15],
      hihatRollProbability: 0.45,
      bass: [
        { semi: 0, len: 3 }, null, null, null,
        null, null, null, null,
        null, null, { semi: 0, len: 2 }, null,
        null, null, null, null,
      ],
      bassOptional: [
        null, null, null, { semi: -2, len: 1 },
        null, { semi: 3, len: 1 }, null, null,
        null, null, null, { semi: 5, len: 1 },
        null, null, null, null,
      ],
      bassOptionalProbability: 0.3,
    },
  },

  house: {
    name: "House",
    description: "Four-on-the-floor kick, clap on 2 & 4, offbeat open hats, syncopated bassline.",
    tempo: { min: 122, max: 128, default: 124 },
    swing: 0.03,
    humanize: { timingMs: 2, velocityJitter: 0.08 },
    instruments: ["kick", "snare", "hihat", "openhat", "perc", "bass", "crash"],
    flavors: { kick: "fourfloor", snare: "clap", hihat: "bright", perc: "conga", bass: "synth" },
    root: 65.4, // C2
    ambience: null,
    main: {
      core: {
        kick:    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
        snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
        hihat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
        openhat: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
        perc:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      },
      optional: {
        hihat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
        perc:    [0,0,1,0, 0,1,0,0, 0,0,1,0, 0,1,0,0],
      },
      optionalProbability: 0.3,
      bass: [
        null, null, { semi: 0, len: 2 }, null,
        null, null, { semi: 0, len: 2 }, null,
        null, null, { semi: 7, len: 2 }, null,
        null, null, { semi: 0, len: 2 }, null,
      ],
      bassOptional: [
        { semi: 0, len: 1 }, null, null, null,
        { semi: 0, len: 1 }, null, null, null,
        { semi: 5, len: 1 }, null, null, null,
        { semi: 0, len: 1 }, null, null, null,
      ],
      bassOptionalProbability: 0.35,
    },
  },

  rock: {
    name: "Rock",
    description: "Backbeat snare, kick on 1 & the 'and' of 3, driving eighths, crash-out fills.",
    tempo: { min: 100, max: 130, default: 116 },
    swing: 0,
    humanize: { timingMs: 12, velocityJitter: 0.25 },
    instruments: ["kick", "snare", "hihat", "tom", "bass", "crash"],
    flavors: { kick: "acoustic", snare: "acoustic", hihat: "bright", tom: "tom", bass: "synth" },
    root: 41.2, // E1
    ambience: null,
    main: {
      core: {
        kick:  [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,1,0],
        snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
        hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
        tom:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      },
      optional: {
        kick:  [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,1],
        snare: [0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
        hihat: [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
      },
      optionalProbability: 0.3,
      bass: [
        { semi: 0, len: 2 }, null, null, null,
        null, null, { semi: 0, len: 2 }, null,
        { semi: 0, len: 2 }, null, null, null,
        null, null, { semi: 5, len: 2 }, null,
      ],
      bassOptional: [
        null, null, { semi: 0, len: 1 }, null,
        null, null, null, { semi: 7, len: 1 },
        null, null, { semi: 0, len: 1 }, null,
        null, null, null, { semi: 3, len: 1 },
      ],
      bassOptionalProbability: 0.3,
    },
  },

  reggaeton: {
    name: "Reggaeton",
    description: "Dembow: tresillo (3-3-2) kick pattern with rimshot answers, steady hats, conga fills.",
    tempo: { min: 90, max: 100, default: 95 },
    swing: 0.05,
    humanize: { timingMs: 5, velocityJitter: 0.15 },
    instruments: ["kick", "snare", "hihat", "tom", "perc", "bass", "crash"],
    flavors: { kick: "fourfloor", snare: "rimshot", hihat: "bright", perc: "conga", tom: "tom", bass: "warm" },
    root: 55, // A1
    ambience: null,
    main: {
      core: {
        kick:  [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0],
        snare: [0,0,1,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
        hihat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
        perc:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      },
      optional: {
        kick:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0],
        snare: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,1,0],
        perc:  [0,1,0,1, 0,1,0,0, 0,1,0,1, 0,1,0,0],
      },
      optionalProbability: 0.35,
      bass: [
        { semi: 0, len: 2 }, null, null, null,
        null, null, { semi: 0, len: 2 }, null,
        null, null, null, null,
        null, null, null, null,
      ],
      bassOptional: [
        null, null, null, { semi: -2, len: 1 },
        null, null, null, null,
        null, null, { semi: 5, len: 1 }, null,
        null, null, { semi: 0, len: 1 }, null,
      ],
      bassOptionalProbability: 0.3,
    },
  },

  lofi: {
    name: "Lo-Fi Chill",
    description: "Boom-bap bones softened: muted layered kicks, dusty swung hats, vinyl crackle bed.",
    tempo: { min: 68, max: 84, default: 76 },
    swing: 0.18,
    humanize: { timingMs: 10, velocityJitter: 0.2 },
    instruments: ["kick", "snare", "hihat", "perc", "bass"],
    flavors: { kick: "lofi", snare: "fat", hihat: "vinyl", perc: "shaker", bass: "warm" },
    root: 73.4, // D2
    ambience: "vinyl",
    main: {
      core: {
        kick:  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
        snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
        hihat: [1,0,1,0, 1,0,0,1, 1,0,1,0, 1,0,0,0],
        perc:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      },
      optional: {
        kick:  [0,0,1,0, 0,0,1,0, 0,0,0,0, 0,0,1,0],
        hihat: [0,1,0,1, 0,1,0,0, 0,1,0,1, 0,1,0,1],
        snare: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
        perc:  [0,0,1,0, 0,0,0,1, 0,0,1,0, 0,0,0,0],
      },
      optionalProbability: 0.25,
      bass: [
        { semi: 0, len: 4 }, null, null, null,
        null, null, null, null,
        { semi: -5, len: 4 }, null, null, null,
        null, null, null, null,
      ],
      bassOptional: [
        null, null, null, null,
        null, null, { semi: 3, len: 1 }, null,
        null, null, null, null,
        null, null, { semi: 0, len: 1 }, null,
      ],
      bassOptionalProbability: 0.25,
    },
  },
};

function rollTrack(core, optional, probability, length) {
  const base = core || new Array(length).fill(0);
  const opt = optional || new Array(length).fill(0);
  return base.map((hit, i) => {
    if (hit) return true;
    if (opt[i] && Math.random() < probability) return true;
    return false;
  });
}

function rollBassTrack(core, optional, probability) {
  return core.map((note, i) => {
    if (note) return note;
    if (optional[i] && Math.random() < probability) return optional[i];
    return null;
  });
}

function buildStructure(bars) {
  const seq = [];
  for (let i = 0; i < bars; i++) {
    if (i === 0 && bars >= 4) seq.push("intro");
    else if ((i + 1) % 4 === 0) seq.push("fill");
    else seq.push("main");
  }
  return seq;
}

function buildMainBar(style) {
  const m = style.main;
  const bar = {};
  for (const inst of style.instruments) {
    if (inst === "bass" || inst === "crash") continue;
    bar[inst] = rollTrack(m.core[inst], m.optional[inst], m.optionalProbability, STEPS_PER_BAR);
  }
  if (style.instruments.includes("crash")) {
    bar.crash = new Array(STEPS_PER_BAR).fill(false);
  }
  if (m.hihatRollSteps && bar.hihat) {
    for (const step of m.hihatRollSteps) {
      if (Math.random() < m.hihatRollProbability) bar.hihat[step] = "roll";
    }
  }
  bar.bass = rollBassTrack(m.bass, m.bassOptional, m.bassOptionalProbability);
  return bar;
}

function buildIntroBar(style) {
  const bar = {};
  for (const inst of style.instruments) {
    if (inst === "bass") continue;
    if (inst === "kick" || inst === "snare" || inst === "hihat") {
      bar[inst] = style.main.core[inst] ? [...style.main.core[inst]] : new Array(STEPS_PER_BAR).fill(false);
    } else {
      bar[inst] = new Array(STEPS_PER_BAR).fill(false);
    }
  }
  bar.bass = new Array(STEPS_PER_BAR).fill(null);
  return bar;
}

function buildFillBar(style) {
  const bar = buildMainBar(style);
  if (bar.tom) {
    bar.tom[12] = true;
    bar.tom[13] = Math.random() < 0.5;
    bar.tom[14] = true;
  } else if (bar.snare) {
    bar.snare[12] = true;
    bar.snare[14] = true;
  }
  if (bar.hihat) {
    bar.hihat[14] = "roll";
    bar.hihat[15] = "roll";
  }
  if (bar.openhat) {
    bar.openhat[15] = true;
  }
  return bar;
}

function generateVariation(styleId, bars) {
  const style = STYLES[styleId];
  const structure = buildStructure(bars);
  const perBar = structure.map((variant, i) => {
    let bar;
    if (variant === "intro") bar = buildIntroBar(style);
    else if (variant === "fill") bar = buildFillBar(style);
    else bar = buildMainBar(style);

    if (i > 0 && structure[i - 1] === "fill" && style.instruments.includes("crash")) {
      bar.crash = bar.crash || new Array(STEPS_PER_BAR).fill(false);
      bar.crash[0] = true;
    }
    return bar;
  });

  const instruments = {};
  for (const inst of style.instruments) {
    instruments[inst] = [].concat(...perBar.map((b) => b[inst] || new Array(STEPS_PER_BAR).fill(false)));
  }

  const bass = [].concat(...perBar.map((b) => b.bass)).map((note) =>
    note ? { freq: freqFromSemi(style.root, note.semi), len: note.len } : null
  );

  return { instruments, bass, structure };
}
