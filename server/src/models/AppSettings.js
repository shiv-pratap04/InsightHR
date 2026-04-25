const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'global' },
    performanceWeights: {
      w1: { type: Number, default: 0.25, min: 0, max: 1 },
      w2: { type: Number, default: 0.35, min: 0, max: 1 },
      w3: { type: Number, default: 0.25, min: 0, max: 1 },
      w4: { type: Number, default: 0.15, min: 0, max: 1 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AppSettings', appSettingsSchema);
