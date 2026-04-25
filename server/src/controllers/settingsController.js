const { getPerformanceWeights, updatePerformanceWeights, normalizeWeights } = require('../services/settingsService');

async function getWeights(req, res) {
  try {
    const w = await getPerformanceWeights();
    const normalized = normalizeWeights(w);
    return res.json({
      success: true,
      data: { raw: w, normalized },
      explanation: 'Weights are renormalized to sum to 1 for scoring transparency.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function putWeights(req, res) {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can change weights' });
    }
    const { w1, w2, w3, w4 } = req.body;
    const updated = await updatePerformanceWeights({ w1, w2, w3, w4 });
    const normalized = normalizeWeights(updated);
    return res.json({
      success: true,
      data: { raw: updated, normalized },
      explanation: 'Performance scoring engine will use these weights on next calculation.',
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = { getWeights, putWeights };
