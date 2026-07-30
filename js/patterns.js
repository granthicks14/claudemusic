const STYLES = {
  hiphop: {
    name: "Hip-Hop",
    description: "Laid-back boom bap groove with a swung hi-hat.",
    tempo: { min: 80, max: 95, default: 88 },
    swing: 0.12,
    steps: 16,
    core: {
      kick:    [1,0,0,0, 0,0,1,0, 0,0,0,1, 0,0,0,0],
      snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hihat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
      openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    },
    optional: {
      kick:    [0,0,1,0, 0,1,0,0, 1,0,0,0, 0,1,0,0],
      snare:   [0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
      openhat: [0,0,0,1, 0,0,0,0, 0,0,0,1, 0,0,0,0],
    },
    optionalProbability: 0.35,
  },

  trap: {
    name: "Trap",
    description: "Hard 808 kicks with fast rolling hi-hats.",
    tempo: { min: 130, max: 150, default: 140 },
    swing: 0.06,
    steps: 16,
    core: {
      kick:    [1,0,0,0, 0,0,0,1, 0,0,1,0, 0,0,0,0],
      snare:   [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
      hihat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
      openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
    },
    optional: {
      kick:    [0,0,1,0, 0,1,0,0, 0,0,0,1, 1,0,0,0],
      snare:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
      hihat:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      openhat: [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0],
    },
    optionalProbability: 0.4,
  },

  house: {
    name: "House",
    description: "Steady four-on-the-floor kick with off-beat open hats.",
    tempo: { min: 122, max: 128, default: 124 },
    swing: 0.04,
    steps: 16,
    core: {
      kick:    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
      snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hihat:   [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
      openhat: [0,0,0,0, 0,1,0,0, 0,0,0,0, 0,1,0,0],
    },
    optional: {
      kick:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      hihat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
      openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
    },
    optionalProbability: 0.3,
  },

  rock: {
    name: "Rock",
    description: "Driving backbeat with steady eighth-note hats.",
    tempo: { min: 100, max: 130, default: 116 },
    swing: 0,
    steps: 16,
    core: {
      kick:    [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,1,0],
      snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hihat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
      openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    },
    optional: {
      kick:    [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,1],
      hihat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
      openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,0],
    },
    optionalProbability: 0.3,
  },

  reggaeton: {
    name: "Reggaeton",
    description: "Dembow riddim: kick-kick-snare syncopation.",
    tempo: { min: 90, max: 100, default: 95 },
    swing: 0.05,
    steps: 16,
    core: {
      kick:    [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0],
      snare:   [0,0,1,0, 0,1,0,0, 0,0,1,0, 0,1,0,0],
      hihat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
      openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    },
    optional: {
      kick:    [0,1,0,0, 0,0,0,1, 0,1,0,0, 0,0,0,1],
      openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
    },
    optionalProbability: 0.3,
  },

  lofi: {
    name: "Lo-Fi Chill",
    description: "Sparse, dusty groove with a relaxed swing.",
    tempo: { min: 70, max: 85, default: 76 },
    swing: 0.18,
    steps: 16,
    core: {
      kick:    [1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
      snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hihat:   [1,0,1,0, 1,0,0,1, 1,0,1,0, 1,0,0,0],
      openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    },
    optional: {
      kick:    [0,0,1,0, 0,0,1,0, 0,0,0,0, 0,0,1,0],
      hihat:   [0,1,0,1, 0,1,0,0, 0,1,0,1, 0,1,0,1],
      snare:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
    },
    optionalProbability: 0.25,
  },
};

function generateVariation(styleId) {
  const style = STYLES[styleId];
  const steps = style.steps;
  const pattern = {};

  for (const track of ["kick", "snare", "hihat", "openhat"]) {
    const core = style.core[track] || new Array(steps).fill(0);
    const optional = style.optional[track] || new Array(steps).fill(0);
    pattern[track] = core.map((hit, i) => {
      if (hit) return true;
      if (optional[i] && Math.random() < style.optionalProbability) return true;
      return false;
    });
  }

  return pattern;
}
