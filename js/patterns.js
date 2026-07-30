const STEPS_PER_BAR = 16;

const REGISTER = { bass: 0, piano: 14, pad: 7, lead: 21, stab: 14 };

const FLAVOR_POOLS = {
  kick: ["boombap", "808", "fourfloor", "acoustic", "lofi"],
  snare: ["crisp", "clap", "fat", "rimshot"],
  hihat: ["bright", "dark", "vinyl"],
  perc: ["shaker", "conga"],
  bass: ["warm", "synth", "808"],
  piano: ["electric", "pluck", "grand"],
  lead: ["square", "saw", "bell"],
  pad: ["warm", "strings", "airy"],
  stab: ["pluck-chord", "square-chord", "bell-chord"],
};

function M(degreeOffset, len) {
  return { type: "mono", degreeOffset, len };
}
function C(degreeOffset, size, len) {
  return { type: "chord", degreeOffset, size, len };
}

const STYLES = {
  hiphop: {
    name: "Hip-Hop",
    description: "Boom bap: hard kick, snappy snare, dark swung hi-hats, moody minor chords.",
    tempo: { min: 82, max: 96, default: 90 },
    swing: 0.15,
    humanize: { timingMs: 6, velocityJitter: 0.18 },
    key: "C2",
    scale: "minor",
    progression: [0, 3, 4, 3],
    defaultFlavors: { kick: "boombap", snare: "crisp", hihat: "dark", perc: "shaker", bass: "warm", piano: "electric", stab: "pluck-chord" },
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "perc"],
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
      },
    },
    melodic: {
      instruments: ["bass", "piano", "stab"],
      bass: {
        core:     [M(0,3), 0,0,0, 0,0,M(0,3),0, 0,0,0,M(-1,1), 0,0,0,0],
        optional: [0,0,0,M(2,1), 0,0,0,0, 0,0,M(4,1),0, 0,0,0,0],
        optionalProbability: 0.3,
      },
      piano: {
        core:     [C(0,4,6),0,0,0, 0,0,0,0, C(0,4,6),0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,C(0,3,2),0],
        optionalProbability: 0.25,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,C(2,3,1), 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.2,
      },
    },
  },

  trap: {
    name: "Trap",
    description: "Sparse hard kick, sliding 808s, rapid hi-hat rolls, a hypnotic bell hook.",
    tempo: { min: 132, max: 150, default: 140 },
    swing: 0.04,
    humanize: { timingMs: 2, velocityJitter: 0.12 },
    key: "C2",
    scale: "minor",
    progression: [0, 5],
    defaultFlavors: { kick: "808", snare: "clap", hihat: "bright", bass: "808", lead: "bell", stab: "bell-chord" },
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "crash"],
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
      },
    },
    melodic: {
      instruments: ["bass", "lead", "stab"],
      bass: {
        core:     [M(0,3),0,0,0, 0,0,0,0, 0,0,M(0,2),0, 0,0,0,0],
        optional: [0,0,0,M(-2,1), 0,M(3,1),0,0, 0,0,0,M(5,1), 0,0,0,0],
        optionalProbability: 0.3,
      },
      lead: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [M(4,1),0,0,M(2,1), 0,0,M(0,1),0, 0,0,M(4,1),0, 0,M(-1,1),0,M(0,1)],
        optionalProbability: 0.3,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,C(0,3,1),0, 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.2,
      },
    },
  },

  house: {
    name: "House",
    description: "Four-on-the-floor kick, offbeat open hats, classic house piano stabs, a pad bed.",
    tempo: { min: 122, max: 128, default: 124 },
    swing: 0.03,
    humanize: { timingMs: 2, velocityJitter: 0.08 },
    key: "C2",
    scale: "dorian",
    progression: [0, 3, 4, 0],
    defaultFlavors: { kick: "fourfloor", snare: "clap", hihat: "bright", perc: "conga", bass: "synth", piano: "pluck", pad: "strings", stab: "square-chord" },
    drums: {
      instruments: ["kick", "snare", "hihat", "openhat", "perc", "crash"],
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
      },
    },
    melodic: {
      instruments: ["bass", "piano", "pad", "stab"],
      bass: {
        core:     [0,0,M(0,1),0, 0,0,M(0,1),0, 0,0,M(4,1),0, 0,0,M(0,1),0],
        optional: [M(0,1),0,0,0, M(0,1),0,0,0, M(2,1),0,0,0, M(0,1),0,0,0],
        optionalProbability: 0.35,
      },
      piano: {
        core:     [0,0,C(0,4,1),0, 0,0,C(0,4,1),0, 0,0,C(0,4,1),0, 0,0,C(0,4,1),0],
        optional: [0,0,0,0, 0,0,0,C(0,3,1), 0,0,0,0, 0,0,0,C(0,3,1)],
        optionalProbability: 0.3,
      },
      pad: {
        core:     [C(0,4,16),0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optionalProbability: 0,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,C(0,3,1)],
        optionalProbability: 0.2,
      },
    },
  },

  rock: {
    name: "Rock",
    description: "Backbeat snare, driving eighths, a synth riff hook, crash-out fills.",
    tempo: { min: 100, max: 130, default: 116 },
    swing: 0,
    humanize: { timingMs: 12, velocityJitter: 0.25 },
    key: "E2",
    scale: "major",
    progression: [0, 4, 5, 3],
    defaultFlavors: { kick: "acoustic", snare: "acoustic", hihat: "bright", bass: "synth", lead: "saw", stab: "square-chord" },
    drums: {
      instruments: ["kick", "snare", "hihat", "tom", "crash"],
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
      },
    },
    melodic: {
      instruments: ["bass", "lead", "stab"],
      bass: {
        core:     [M(0,2),0,0,0, 0,0,M(0,2),0, M(0,2),0,0,0, 0,0,M(4,2),0],
        optional: [0,0,M(0,1),0, 0,0,0,M(4,1), 0,0,M(0,1),0, 0,0,0,M(2,1)],
        optionalProbability: 0.3,
      },
      lead: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [M(0,1),0,M(2,1),0, 0,0,M(4,1),0, M(0,1),0,M(2,1),0, 0,M(4,1),0,0],
        optionalProbability: 0.3,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,C(0,3,1),0],
        optionalProbability: 0.2,
      },
    },
  },

  reggaeton: {
    name: "Reggaeton",
    description: "Dembow tresillo kick pattern with rimshot answers and a synth hook.",
    tempo: { min: 90, max: 100, default: 95 },
    swing: 0.05,
    humanize: { timingMs: 5, velocityJitter: 0.15 },
    key: "A1",
    scale: "minor",
    progression: [0, 3],
    defaultFlavors: { kick: "fourfloor", snare: "rimshot", hihat: "bright", perc: "conga", bass: "warm", lead: "saw", stab: "pluck-chord" },
    drums: {
      instruments: ["kick", "snare", "hihat", "tom", "perc", "crash"],
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
      },
    },
    melodic: {
      instruments: ["bass", "lead", "stab"],
      bass: {
        core:     [M(0,2),0,0,0, 0,0,M(0,2),0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,M(-2,1), 0,0,0,0, 0,0,M(4,1),0, 0,0,M(0,1),0],
        optionalProbability: 0.3,
      },
      lead: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,M(2,1),0,0, M(0,1),0,0,M(4,1), 0,M(2,1),0,0, M(0,1),0,0,0],
        optionalProbability: 0.3,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,C(0,3,1),0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.15,
      },
    },
  },

  lofi: {
    name: "Lo-Fi Chill",
    description: "Softened boom bap, jazzy 7th chords, a warm pad bed, vinyl crackle.",
    tempo: { min: 68, max: 84, default: 76 },
    swing: 0.18,
    humanize: { timingMs: 10, velocityJitter: 0.2 },
    key: "D2",
    scale: "dorian",
    progression: [0, 3, 4, 0],
    ambience: "vinyl",
    defaultFlavors: { kick: "lofi", snare: "fat", hihat: "vinyl", perc: "shaker", bass: "warm", piano: "electric", pad: "airy", stab: "pluck-chord" },
    drums: {
      instruments: ["kick", "snare", "hihat", "perc"],
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
      },
    },
    melodic: {
      instruments: ["bass", "piano", "pad", "stab"],
      bass: {
        core:     [M(0,4),0,0,0, 0,0,0,0, M(0,3),0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,M(2,1),0, 0,0,0,0, 0,0,M(4,1),0],
        optionalProbability: 0.25,
      },
      piano: {
        core:     [C(0,4,7),0,0,0, 0,0,0,0, 0,0,C(2,3,4),0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,C(0,3,1), 0,0,0,0, 0,0,0,0],
        optionalProbability: 0.2,
      },
      pad: {
        core:     [C(0,4,16),0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optionalProbability: 0,
      },
      stab: {
        core:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        optional: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,C(0,3,1),0],
        optionalProbability: 0.15,
      },
    },
  },
};

function rollTrack(core, optional, probability) {
  const base = core || new Array(STEPS_PER_BAR).fill(0);
  const opt = optional || new Array(STEPS_PER_BAR).fill(0);
  return base.map((hit, i) => {
    if (hit) return true;
    if (opt[i] && Math.random() < probability) return true;
    return false;
  });
}

function rollNoteTrack(core, optional, probability) {
  const base = core || new Array(STEPS_PER_BAR).fill(0);
  const opt = optional || new Array(STEPS_PER_BAR).fill(0);
  return base.map((spec, i) => {
    if (spec) return spec;
    if (opt[i] && Math.random() < probability) return opt[i];
    return null;
  });
}

function resolveMelodicBar(instKey, cfg, barRootDegree) {
  const raw = rollNoteTrack(cfg.core, cfg.optional, cfg.optionalProbability);
  const register = REGISTER[instKey];
  return raw.map((spec) => {
    if (!spec) return null;
    const root = barRootDegree + register + spec.degreeOffset;
    if (spec.type === "chord") return { degrees: chordDegrees(root, spec.size), len: spec.len };
    return { degree: root, len: spec.len };
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

function buildDrumBar(style, variant) {
  const m = style.drums.main;
  const bar = {};
  for (const inst of style.drums.instruments) {
    bar[inst] = rollTrack(m.core[inst], m.optional[inst], m.optionalProbability);
  }
  if (style.drums.instruments.includes("crash")) bar.crash = new Array(STEPS_PER_BAR).fill(false);

  if (variant === "intro") {
    for (const inst of style.drums.instruments) {
      if (inst !== "kick" && inst !== "snare" && inst !== "hihat") {
        bar[inst] = new Array(STEPS_PER_BAR).fill(false);
      } else {
        bar[inst] = m.core[inst] ? [...m.core[inst]].map(Boolean) : new Array(STEPS_PER_BAR).fill(false);
      }
    }
  }

  if (m.hihatRollSteps && bar.hihat && variant !== "intro") {
    for (const step of m.hihatRollSteps) {
      if (Math.random() < m.hihatRollProbability) bar.hihat[step] = "roll";
    }
  }

  if (variant === "fill") {
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
    if (bar.openhat) bar.openhat[15] = true;
  }

  return bar;
}

function buildMelodicBar(style, variant, barRootDegree) {
  const bar = {};
  for (const inst of style.melodic.instruments) {
    if (variant === "intro") {
      bar[inst] = new Array(STEPS_PER_BAR).fill(null);
      if (inst === "bass") bar[inst][0] = { degree: barRootDegree + REGISTER.bass, len: 8 };
      continue;
    }
    bar[inst] = resolveMelodicBar(inst, style.melodic[inst], barRootDegree);
    if (variant === "fill" && inst === "stab") {
      bar[inst][0] = { degrees: chordDegrees(barRootDegree + REGISTER.stab, 3), len: 2 };
    }
  }
  return bar;
}

function generateVariation(style, bars) {
  const structure = buildStructure(bars);
  const barRootDegrees = structure.map((_, i) => style.progression[i % style.progression.length]);

  const drumBars = structure.map((variant) => buildDrumBar(style, variant));
  const melodicBars = structure.map((variant, i) => buildMelodicBar(style, variant, barRootDegrees[i]));

  for (let i = 1; i < structure.length; i++) {
    if (structure[i - 1] === "fill" && drumBars[i].crash !== undefined) {
      drumBars[i].crash[0] = true;
    }
  }

  const instruments = {};
  for (const inst of style.drums.instruments) {
    instruments[inst] = [].concat(...drumBars.map((b) => b[inst] || new Array(STEPS_PER_BAR).fill(false)));
  }
  for (const inst of style.melodic.instruments) {
    instruments[inst] = [].concat(...melodicBars.map((b) => b[inst] || new Array(STEPS_PER_BAR).fill(null)));
  }

  return { instruments, structure, barRootDegrees };
}
