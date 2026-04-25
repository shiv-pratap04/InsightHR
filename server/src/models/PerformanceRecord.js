const mongoose = require('mongoose');

const performanceRecordSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    attendanceScore: { type: Number, required: true, min: 0, max: 100 },
    taskCompletionScore: { type: Number, required: true, min: 0, max: 100 },
    deadlineAdherenceScore: { type: Number, required: true, min: 0, max: 100 },
    peerFeedbackScore: { type: Number, required: true, min: 0, max: 100 },
    weightedScore: { type: Number, required: true, min: 0, max: 100 },
    breakdown: {
      weights: {
        w1: Number,
        w2: Number,
        w3: Number,
        w4: Number,
      },
      contributions: {
        attendance: Number,
        taskCompletion: Number,
        deadlineAdherence: Number,
        peerFeedback: Number,
      },
      defaultsUsed: [{ type: String }],
      explanation: { type: String },
    },
    remarks: { type: String, default: '' },
  },
  { timestamps: true }
);

performanceRecordSchema.index({ employeeId: 1, createdAt: -1 });

module.exports = mongoose.model('PerformanceRecord', performanceRecordSchema);
