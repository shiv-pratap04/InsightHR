const mongoose = require('mongoose');

const performancePointSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    weightedScore: { type: Number },
    remarks: { type: String },
  },
  { _id: false }
);

const employeeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    department: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    skills: [{ type: String, trim: true }],
    experienceYears: { type: Number, default: 0, min: 0 },
    salary: { type: Number, default: 0, min: 0 },
    joiningDate: { type: Date, required: true },
    reportingManager: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    currentWorkload: { type: Number, default: 0, min: 0, max: 100 },
    attendanceRate: { type: Number, default: 0, min: 0, max: 100 },
    taskCompletionRate: { type: Number, default: 0, min: 0, max: 100 },
    deadlineAdherenceRate: { type: Number, default: 0, min: 0, max: 100 },
    peerFeedbackScore: { type: Number, default: 0, min: 0, max: 100 },
    performanceHistory: [performancePointSchema],
    attritionRisk: {
      level: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
      score: { type: Number, default: 0, min: 0, max: 100 },
      lastUpdated: { type: Date },
    },
    promotionScore: { type: Number, default: 0, min: 0, max: 100 },
    lastPromotionDate: { type: Date },
    engagementScore: { type: Number, default: 50, min: 0, max: 100 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', employeeSchema);
