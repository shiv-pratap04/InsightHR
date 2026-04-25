const DEFAULT_METRIC = 70;

function clamp01FromPercent(value) {
  if (value == null || Number.isNaN(Number(value))) return null;
  const n = Number(value);
  return Math.min(100, Math.max(0, n)) / 100;
}

function percentFromRaw(value, defaultVal = DEFAULT_METRIC) {
  if (value == null || Number.isNaN(Number(value))) {
    return { value: defaultVal, usedDefault: true };
  }
  const n = Number(value);
  const clamped = Math.min(100, Math.max(0, n));
  return { value: clamped, usedDefault: false };
}

module.exports = { clamp01FromPercent, percentFromRaw, DEFAULT_METRIC };
