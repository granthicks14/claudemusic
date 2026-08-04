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

// Context in: what the policy is allowed to know about the situation.
//
// The first version could see six things and, notably, TEMPO WAS NOT ONE OF
// THEM. A 174 BPM drum and bass beat and a 70 BPM ballad looked identical to
// it, even though how dense a pattern should be depends enormously on how
// fast it goes - the same sixteenth-note rate is a gentle shuffle at 70 and a
// blur at 174. It also could not tell that an artist was being imitated, so
// it pushed the same offsets whether or not a profile was already pulling the
// knobs somewhere specific, and the two could quietly fight each other.
const POLICY_INPUTS = [
  "complexity", "swingAmt", "tempoNorm",
  "isDrumHeavy", "isMelodic", "isElectronic", "isHalfTime",
  "artistDensity", "artistSync", "artistLayers", "hasArtist",
  "bias",
];
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
let POLICY_WEIGHTS = {"w1":[[-0.9468174586238876,-0.40684816079382324,-0.2895890934131182,0.5834797635728975,0.9058776963843794,0.6969640445108845,0.002015848725610983,-0.11211207652758097,0.6177683209306994,-0.255065103253117,-0.020731841950143805,0.1354843017612867,0.05419185943639289,1.1176833727468263,-0.1762058428714451,0.5349535078134562],[-0.256510457562556,-1.0246191370701725,1.0442267932601936,-0.6644024803232254,0.21155837804423946,0.6243378854993585,0.45046773251996514,-0.34018407315876564,0.22481146683457537,0.2496940668722762,0.2185692803072769,-0.3918676610129496,-0.1019789850995009,0.3267928618945995,-0.4259845672349137,-0.05123742365636534],[0.49497387476334004,0.275849624755452,-0.2551701737432651,-1.2559382666131764,0.5489554004909956,-0.1104977729354967,-0.3656200870598006,-0.6950621720952819,0.5937083384782729,-0.40011034123428324,-0.7953588907187285,0.13584686647236513,-0.4204062843608149,0.3026264322085276,0.763288930178571,0.11215157224892403],[-0.48206286175146873,0.15707007659041955,0.6489920246059077,-1.1845387004424661,1.2916791428381529,0.7836834045430736,-0.09585455655330494,-0.019404719956924648,0.5838757752798094,-0.852126050379017,-1.539966768275639,-1.397291434917136,0.9350471811140044,0.020131760943426974,-0.5129372990816715,1.0699248367100744],[-1.0299386276973785,0.006693413420832156,-0.06055593667235688,0.3889441058162496,-0.31294519652445224,-1.0165782068387248,0.41964469744523225,-1.1975521812809222,-0.16544087316973188,-0.20693461809033797,1.171550460888818,-0.3028716642694313,0.6812153375034031,0.25309472209850725,-0.6830173462767652,1.0348338105872028],[-0.035109381844271134,-0.8638681737253002,-0.4724252522417605,0.16198961795381683,0.34781354546154963,0.36561557511115256,0.48613041564263293,0.02023122345813318,-0.12513045382261492,0.3370461366974108,0.7373593246710557,-0.24814002232064017,-0.41696216606131536,-0.43653090682111007,-0.15798787561189684,0.32861521416549033],[1.095357343460781,0.05309573104488814,-0.2922438986691153,0.4352716377691951,-0.6635488254739501,0.6774839362897302,-0.0031789216723800027,-0.3408539440809587,-0.7724772256107608,0.40676382745056927,-0.5965822970918601,-0.08813404140499982,0.44048936507067904,0.1856579880977627,0.1600208536412218,-0.9075253261073316],[-0.6800019923255007,-0.3626662549688653,0.7410620585319391,-0.23517707988615352,0.21909740869914424,-0.21889092600075202,0.9890798524744027,-0.5277019318670342,1.2184614623384022,-0.5047339644382024,-0.36090065058893744,-0.26051760910484717,-0.6779486949534024,0.37517315763426556,0.14910938377335523,-0.5362242674762252],[0.13916156199035637,-0.21659495187874303,-0.21790925772747577,0.5770974751847758,0.09123817406676685,0.22561849437787745,0.22970043501015858,1.0465965034260534,-0.5793886408755434,1.1963061857099049,-0.4336861867874794,0.6546748395588132,0.17832018690263257,-0.32952385496752634,0.024191625738943918,-0.3425809676192103],[-0.15189758693646396,0.45565813127913046,-0.194648097573135,0.23232080170127398,-0.8528122301555268,-0.3522772486384106,0.1877247281538352,0.15760103104837894,-1.3746246256046035,0.7463730800712252,-0.23721064988924784,0.45953617015912124,0.33316551263968186,-0.6309451809595119,0.9028586218113783,-0.25111126699461506],[-0.8297516448143194,0.1535684807294233,0.8112596363299002,-0.5507938396925987,-0.8706211564096147,1.2351396775247199,-0.73512896886868,0.745291805539032,0.32188504973215837,0.28128208934385734,-0.31658177457646,0.1983491427029151,0.6299100145675199,-0.10077592051867001,-0.25524818452141157,0.5452387558423301],[0.12854578668779368,-0.2321636226239478,-0.19484173878697655,0.25900748723237266,-0.4193568451721311,-0.2436122367392331,0.03613214799796682,0.5292161057060956,-0.18156213749014743,-0.035975173334551615,0.7359803761186366,2.0195674593795117,0.025907321946647337,0.1191348355591961,-1.2630211831284328,1.1864650053582204]],"b1":[1.7455145923778819,0.30664404829775693,1.4968964548415475,0.08000108200046649,-0.2096613544241274,-1.6686986443805665,-0.03273111585938752,0.38228143665699216,-0.4593945255558453,-0.8178745770098095,0.07389281771297126,0.6816579196472217,0.31599280095731663,-0.9832407887419696,0.7121970001125758,-0.04384983366323877],"w2":[[0.07976012261823916,0.2243274340832544,-0.9349936816474431,0.09210565878623803,-0.15140393105856442,-1.313009147375141,-0.021536704551053203,-0.9437675271704435,-1.1541359998659189],[-0.4649508152501166,-0.14160538576932807,-0.2283428275864769,0.01142028305212427,0.00866055350597351,-0.02838663102319528,0.5446177388649641,0.11513474333883988,-0.5764909830310502],[-0.5256279640981446,-1.1358153323587294,0.16182591816446143,-0.6759240036401994,-0.2494599693498004,0.05213808130245877,0.12336119380315065,-0.43666054695192547,0.2994180567957307],[0.16635869256809208,1.2073520206453405,1.0500994918894075,-0.13371983226908263,-0.4281363915631949,0.792113452976616,0.5001128631501106,0.0063869008599943934,-0.38184337805684726],[0.031466822895062016,0.23096329094186324,-0.11723759001045238,0.2785491484409009,0.39229825879268193,-1.2689540973406834,0.02104732575500878,0.30710161616789594,0.0707019427861982],[0.2501879583625728,-1.2286665831930756,0.6023386214490327,0.06991554038765045,1.649926211712706,0.06636871633885355,1.0890220927677516,0.18696795675735847,-0.04190834155550234],[0.45755432365035376,0.22860550090084913,-0.40603569367746256,0.25240048567628565,-0.18909770935287992,-0.16308861101877586,0.11850327355836014,-0.07526933244428097,0.11195977740819765],[-0.8356946912799345,0.6943985129494097,0.3504441600829434,0.4419678900875483,-0.6943897642478367,0.1515147657242209,0.6044953137258391,0.05914672125929563,0.9934467758720867],[-1.3086840568777844,0.30221750498814653,0.836045232683251,-0.12710681377807426,0.00457062300120136,-0.6055817823439076,0.8976726774468491,0.37247135904945783,-0.7648237522686282],[-0.1976330777395518,-0.34411334813470246,0.3880631979349435,0.033881641156553385,0.5375222425989581,-0.8588625672907186,0.36492416831771496,-0.32482564155089627,-0.1975937986600807],[-0.010231963354069774,0.8009874745960829,0.2634019025231772,0.5823992977711072,-0.3520359285127557,-0.1273755810395378,0.31734139751812984,-0.8313272475176225,-0.062324607166518976],[-0.44784341890800405,0.03862166277582681,-0.23946164285426397,0.2929322665079924,0.3961977661002226,-0.5205883925407332,0.13711181956857893,-0.21410576641818496,0.8109430642549883],[0.4194968992213429,0.5991754261031434,0.5963071776972555,0.42372869013092435,-0.12224061771292143,0.7561714961677201,-0.03520748119824764,0.06701522089245998,0.6685428745633688],[-0.4196976391102269,-0.15567337665129094,0.2797338404497684,-0.1617490783743005,0.45790334623740286,0.46700816211874424,-0.2397979951179133,-0.2556563799397291,0.6258307964309517],[-0.8162630476680697,-0.9713376147706878,0.82910915319856,-0.20788026028646475,-0.2373669914153132,-0.032336978221270934,-1.2873061125566647,0.9708134660025978,-0.28281644952834745],[0.0182738579254914,0.8428033010454031,-0.10627787434104993,0.21603808273437278,-0.5056429629484659,-0.3171840180612149,0.4492990863176793,0.39562127093680344,-0.34885576067177093]],"b2":[0.009336130898599821,-0.927919646813737,-1.268301095955612,0.23279644520841938,0.3987409858341357,-0.41497302318688983,-0.5248725343882812,0.7712329154147948,1.3076530782150488],"meta":{"trainedAt":"2026-08-04","method":"cross-entropy method","generations":24,"population":40,"episodesPerEval":40,"totalEpisodes":38400,"hidden":16,"inputs":12,"artistAware":true,"baseline":138.23,"trained":142.84}};

const DRUM_HEAVY = new Set(["trap", "drill", "phonk", "jerseyclub", "techno", "dnb", "dubstep", "rap"]);
const MELODIC = new Set(["neosoul", "rnb", "lofi", "amapiano", "synthwave", "afrobeats", "hiphop"]);
const ELECTRONIC = new Set(["house", "techno", "dnb", "dubstep", "synthwave", "ukgarage", "jerseyclub"]);
// Genres written at double their felt tempo. The number on the slider says
// 140 but the beat lands half-time, so the policy needs to be told that 140
// here is not the 140 of a house record.
const HALF_TIME = new Set(["trap", "drill", "phonk", "dubstep", "jerseyclub"]);

function policyContext(styleId, complexity, swing, tempo, artistKnobs) {
  const A = artistKnobs || null;
  // Scaled by roughly the artist knobs' own bounds so each lands in [-1, 1].
  const aDen = A ? Math.max(-1, Math.min(1, (A.density || 0) / 0.175)) : 0;
  const aSyn = A ? Math.max(-1, Math.min(1, (A.sync || 0) / 7.5)) : 0;
  const aLay = A ? Math.max(-1, Math.min(1, (A.layers || 0) / 0.5)) : 0;
  return [
    (complexity - 5.5) / 4.5,
    (swing || 0) / 30,
    // Centred on 120 and scaled so the 60-190 range the program covers lands
    // inside roughly [-1, 1]. Coerced defensively: a caller once passed the
    // {min,max,default} range OBJECT here instead of a number, which made
    // this input NaN and silently turned every output into NaN.
    ((Number.isFinite(tempo) ? tempo : 110) - 120) / 60,
    DRUM_HEAVY.has(styleId) ? 1 : 0,
    MELODIC.has(styleId) ? 1 : 0,
    ELECTRONIC.has(styleId) ? 1 : 0,
    HALF_TIME.has(styleId) ? 1 : 0,
    aDen, aSyn, aLay,
    A ? 1 : 0,
    1,   // bias
  ];
}

function policyForward(x, W) {
  if (!W) return null;
  // A single non-finite input propagates through every weight and returns an
  // action of all-NaN, which the generator then adds to its targets without
  // complaint. Refuse instead: no policy is a defined behaviour, a NaN
  // policy is not.
  for (let i = 0; i < x.length; i++) if (!Number.isFinite(x[i])) return null;
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
    const v = Math.tanh(s) * POLICY_RANGE[name];
    if (!Number.isFinite(v)) return null;
    out[name] = v;
  });
  return out;
}

// What the generator asks for. Returns null when no policy is loaded, in
// which case everything behaves exactly as it did before.
function policyAction(styleId, complexity, swing, tempo, artistKnobs) {
  if (!POLICY_WEIGHTS) return null;
  try {
    const x = policyContext(styleId, complexity, swing, tempo, artistKnobs);
    // A weight file trained on a different input count would silently read
    // garbage, so refuse it rather than acting on nonsense.
    if (!POLICY_WEIGHTS.w1 || POLICY_WEIGHTS.w1.length !== x.length) return null;
    return policyForward(x, POLICY_WEIGHTS);
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
