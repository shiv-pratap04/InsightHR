const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    type: {
      type: String,
      enum: ['anomaly', 'attrition', 'performance-drop', 'promotion'],
      required: true,
    },
    message: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    isRead: { type: Boolean, default: false },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

alertSchema.index({ employeeId: 1, createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
