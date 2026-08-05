// ---------------------------------------------------------------------------
// Kit combinations that measured well
// ---------------------------------------------------------------------------
// With 380 kits, "these go together" is easy to assert and hard to justify.
// This table is not asserted. Every entry was produced by tools/research-kits.js,
// which assembles random kit combinations, renders each one offline through the
// real audio graph, and scores it with the same rating engine used everywhere
// else - BS.1770 loudness, spectral balance, stereo, crest, plus the structural
// terms. Each combination is judged across two independently generated patterns
// so a combination is not credited for one lucky draw.
//
// WHAT THIS IS EVIDENCE OF, AND WHAT IT IS NOT
//
// The choice of kits genuinely matters: across the genres the gap between the
// best and worst combination found averaged about 19 points out of 100, which
// is a fifth of the whole scale. So this is not noise.
//
// But the reward is the rating equation, and that equation measures BALANCE -
// loudness on target, no band swamping another, real dynamics, a findable
// pulse. It does not measure taste. A combination in this table is one that
// sits together cleanly, not one that is beautiful, and the two are not the
// same thing. Use it as a starting point that is known not to be muddy, then
// change whatever you like.
//
// The search is also random rather than exhaustive - a genre with nine tracks
// and twenty candidate kits each is more combinations than there are seconds
// in the age of the universe - so these are good regions, not global optima.
//
// Regenerate with:  node tools/research-kits.js [samplesPerGenre]
const KIT_PRESETS = {};

// Replaced wholesale by the research tool.
const KIT_PRESET_META = { generatedAt: null, samplesPerGenre: 0 };

function loadKitPresets(data) {
  if (!data || !data.presets) return 0;
  for (const k of Object.keys(KIT_PRESETS)) delete KIT_PRESETS[k];
  Object.assign(KIT_PRESETS, data.presets);
  KIT_PRESET_META.generatedAt = data.generatedAt || null;
  KIT_PRESET_META.samplesPerGenre = data.samplesPerGenre || 0;
  return Object.keys(KIT_PRESETS).length;
}

// The measured-best combination for a genre, or null when the search has not
// covered it. Null is a real answer here: offering a "best" that was never
// measured would be exactly the assertion this whole file exists to avoid.
function bestKitsFor(genreId) {
  const p = KIT_PRESETS[genreId];
  return p && p.kits ? Object.assign({}, p.kits) : null;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { KIT_PRESETS, KIT_PRESET_META, loadKitPresets, bestKitsFor };
}
