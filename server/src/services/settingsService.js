const AppSettings = require('../models/AppSettings');

const DEFAULT_WEIGHTS = { w1: 0.25, w2: 0.35, w3: 0.25, w4: 0.15 };

async function getOrCreateSettings() {
  let doc = await AppSettings.findOne({ key: 'global' });
  if (!doc) {
    doc = await AppSettings.create({ key: 'global', performanceWeights: { ...DEFAULT_WEIGHTS } });
  }
  return doc;
}

async function getPerformanceWeights() {
  const s = await getOrCreateSettings();
  return s.performanceWeights || DEFAULT_WEIGHTS;
}

async function updatePerformanceWeights(weights) {
  const s = await getOrCreateSettings();
  s.performanceWeights = {
    w1: Number(weights.w1),
    w2: Number(weights.w2),
    w3: Number(weights.w3),
    w4: Number(weights.w4),
  };
  await s.save();
  return s.performanceWeights;
}

function normalizeWeights(w) {
  const sum = w.w1 + w.w2 + w.w3 + w.w4;
  if (sum <= 0) return { ...DEFAULT_WEIGHTS };
  return {
    w1: w.w1 / sum,
    w2: w.w2 / sum,
    w3: w.w3 / sum,
    w4: w.w4 / sum,
  };
}

module.exports = {
  getPerformanceWeights,
  updatePerformanceWeights,
  normalizeWeights,
  DEFAULT_WEIGHTS,
};
