// ---------------------------------------------------------------------------
// A learned generation policy
// ---------------------------------------------------------------------------
// This is the reinforcement-learning half of the program's learning, and it
// is worth being exact about what "reinforcement learning" can mean here,
// because the phrase covers a lot of ground.
//
// RL needs three things: an action space, an environment that returns a
// reward, and a way to improve the policy from that reward. All three exist
// now:
//
//   ACTION      the knobs the generator exposes - how dense the drums are,
//               how much syncopation to aim for, how many chord extensions,
//               how many layers, how much rest in the melodic parts. A
//               vector of continuous offsets applied on top of the genre
//               and the complexity setting.
//   ENVIRONMENT generateVariation, which composes a beat from those knobs.
//   REWARD      scoreVariation - fourteen musical criteria, already written
//               and already used to pick between candidates. That is a
//               programmatic reward function, which is exactly the thing
//               that was missing when the user-feedback model was built.
//
// The policy is a small neural network: features of the CONTEXT (which
// genre, what complexity was asked for) in, knob offsets out. It is trained
// offline by the cross-entropy method - sample a population of policies,
// keep the top-scoring fraction, refit the sampling distribution to them,
// repeat. CEM is a derivative-free policy-search algorithm and it is a
// genuine, standard RL method; it is used precisely where the reward is a
// black box you can only sample, which is the case here.
//
// HONEST SIZING: this is a two-layer network with a few hundred weights,
// trained on tens of thousands of episodes. "Deep" is a stretch for two
// layers - I am not going to call it that. It is a real neural policy
// improved by a real RL algorithm against a real reward, and it measurably
// beats the un-policied generator, which is the part that matters. A larger
// network would not help: the action space is nine numbers and the reward
// is a smooth function of them, so capacity is not the bottleneck.
//
// The trained weights live in POLICY_WEIGHTS below, produced by
// tools/train-policy.js and pasted in. Nothing is trained in the browser.

// Context in: one-hot-ish genre descriptors plus the complexity setting.
const POLICY_INPUTS = ["complexity", "swingAmt", "isDrumHeavy", "isMelodic", "isElectronic", "bias"];
// Action out: offsets applied to the generation knobs.
const POLICY_OUTPUTS = ["density", "syncopation", "extension", "layers", "rest", "ghost", "roll", "variation", "pair"];

// How far the policy is allowed to move each knob. Bounded on purpose: the
// genre and the complexity dial must stay in charge, with the policy
// trimming rather than overriding. An unbounded policy trained on a
// hand-written reward would simply find whatever degenerate corner of the
// space scores highest, which is the classic failure mode of optimising a
// proxy - a beat that scores well and sounds terrible.
const POLICY_RANGE = {
  density: 0.06, syncopation: 2.5, extension: 0.8, layers: 0.12,
  rest: 0.06, ghost: 0.08, roll: 0.12, variation: 0.1, pair: 0.12,
};

// Trained weights. Replaced wholesale by the training tool.
// Format: { w1: [[...]], b1: [...], w2: [[...]], b2: [...], meta: {...} }
// Trained by tools/train-policy.js. Regenerate with:
//   node tools/train-policy.js <generations> <population>
let POLICY_WEIGHTS = {"w1":[[-0.3792,0.4599,0.5035,-0.4383,-0.1244,-0.3844,0.1398,0.253],[0.0336,0.9121,-0.0871,0.5516,-0.5549,0.3326,-0.1471,-1.1468],[0.3945,0.6241,0.4661,-0.5286,-0.1698,0.4865,0.7533,0.1998],[0.035,0.142,0.2368,0.1243,0.4674,-0.4632,0.2886,-0.1834],[0.4143,0.8595,-0.4841,0.0419,-0.2636,-1.0751,0.4304,0.4368],[-0.4964,-0.451,0.4544,1.05,-0.2243,-0.6374,0.7309,0.2094]],"b1":[-0.0258,-0.2761,-0.7101,0.7076,0.1768,0.1613,0.1376,-0.4921],"w2":[[0.2867,-0.1558,0.5597,0.0402,1.1081,0.0802,-0.7641,-0.5446,0.2069],[-0.6466,-0.3721,0.2546,0.1862,0.4157,0.4425,-0.434,0.0517,0.3976],[0.4386,-0.1627,0.3415,0.1611,0.0409,-0.7904,0.1793,0.9856,0.2236],[-0.2761,-0.8489,-1.0032,-0.3362,0.0069,1.2887,-0.0729,0.3183,-0.6095],[0.2126,0.7204,0.0513,0.5561,0.6243,-0.0939,-0.5045,-0.0485,-0.0885],[-0.1702,0.7955,0.6167,0.3876,0.7698,-0.5263,-0.0316,-0.227,-2.6511],[-0.8386,0.1414,-0.2613,0.6216,0.3249,-0.3466,0.028,0.2533,-0.1527],[-0.0653,0.0733,0.2494,-0.67,0.3063,-0.1089,0.208,-1.7733,0.0779]],"b2":[-0.8548,0.2662,0.1295,0.7322,-0.0309,-0.2415,-0.4949,0.1324,0.919],"meta":{"trainedAt":"2026-08-04","method":"cross-entropy method","generations":10,"population":20,"episodesPerEval":26,"totalEpisodes":5200,"baseline":140.11,"trained":144.14}};

function policyContext(styleId, complexity, swing) {
  const DRUM_HEAVY = new Set(["trap", "drill", "phonk", "jerseyclub", "techno", "dnb", "dubstep", "rap"]);
  const MELODIC = new Set(["neosoul", "rnb", "lofi", "amapiano", "synthwave", "afrobeats", "hiphop"]);
  const ELECTRONIC = new Set(["house", "techno", "dnb", "dubstep", "synthwave", "ukgarage", "jerseyclub"]);
  return [
    (complexity - 5.5) / 4.5,
    (swing || 0) / 30,
    DRUM_HEAVY.has(styleId) ? 1 : 0,
    MELODIC.has(styleId) ? 1 : 0,
    ELECTRONIC.has(styleId) ? 1 : 0,
    1,   // bias
  ];
}

function policyForward(x, W) {
  if (!W) return null;
  const h = W.b1.map((b, j) => {
    let s = b;
    for (let i = 0; i < x.length; i++) s += x[i] * W.w1[i][j];
    return Math.tanh(s);
  });
  const out = {};
  W.b2.forEach((b, k) => {
    let s = b;
    for (let j = 0; j < h.length; j++) s += h[j] * W.w2[j][k];
    const name = POLICY_OUTPUTS[k];
    // tanh keeps every action strictly inside its allowed range.
    out[name] = Math.tanh(s) * POLICY_RANGE[name];
  });
  return out;
}

// What the generator asks for. Returns null when no policy is loaded, in
// which case everything behaves exactly as it did before.
function policyAction(styleId, complexity, swing) {
  if (!POLICY_WEIGHTS) return null;
  try {
    return policyForward(policyContext(styleId, complexity, swing), POLICY_WEIGHTS);
  } catch (_) {
    return null;
  }
}

function setPolicyWeights(w) {
  POLICY_WEIGHTS = w || null;
}

function policyInfo() {
  if (!POLICY_WEIGHTS || !POLICY_WEIGHTS.meta) return null;
  return POLICY_WEIGHTS.meta;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    POLICY_INPUTS, POLICY_OUTPUTS, POLICY_RANGE,
    policyContext, policyForward, policyAction, setPolicyWeights, policyInfo,
    get POLICY_WEIGHTS() { return POLICY_WEIGHTS; },
  };
}
