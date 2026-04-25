const PerformanceRecord = require('../models/PerformanceRecord');

function meanStd(values) {
  const n = values.length;
  if (!n) return { mean: 0, std: 1 };
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const varSum = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const std = Math.sqrt(varSum) || 1;
  return { mean, std };
}

function zScore(value, mean, std) {
  return (value - mean) / std;
}

async function detectAnomaliesForEmployee(employeeId) {
  const records = await PerformanceRecord.find({ employeeId })
    .sort({ createdAt: -1 })
    .limit(12)
    .lean();

  const anomalies = [];

  const scores = records.map((r) => r.weightedScore);
  const attendance = records.map((r) => r.attendanceScore);
  const taskC = records.map((r) => r.taskCompletionScore);

  if (scores.length >= 3) {
    const hist = scores.slice(1);
    const { mean, std } = meanStd(hist);
    const z = zScore(scores[0], mean, std);
    if (z < -2) {
      anomalies.push({
        anomalyType: 'sudden_performance_drop',
        severity: 'high',
        reason: `Latest weighted score (${scores[0].toFixed(
          1
        )}) is more than 2σ below prior mean (${mean.toFixed(1)}).`,
        suggestedAction: 'Review recent workload and blockers with the employee.',
        explanation: `Z-score on performance composite is ${z.toFixed(2)} (threshold -2).`,
      });
    } else if (z < -1.5) {
      anomalies.push({
        anomalyType: 'sudden_performance_drop',
        severity: 'medium',
        reason: `Performance dipped relative to personal baseline (z=${z.toFixed(2)}).`,
        suggestedAction: 'Light-touch coaching and shorter feedback cycles.',
        explanation: 'Statistical deviation on recent performance records.',
      });
    }
  }

  if (attendance.length >= 2) {
    const drop = attendance[0] - attendance[1];
    if (drop < -15) {
      anomalies.push({
        anomalyType: 'attendance_drop',
        severity: drop < -25 ? 'high' : 'medium',
        reason: `Attendance score fell by ${Math.abs(drop).toFixed(1)} points period-over-period.`,
        suggestedAction: 'Check for health, scheduling, or morale issues.',
        explanation: 'Rule: threshold breach on consecutive attendance scores.',
      });
    }
  }

  if (taskC.length >= 2) {
    const variance =
      taskC.reduce((s, v, i, arr) => {
        if (i === 0) return s;
        return s + Math.abs(v - arr[i - 1]);
      }, 0) /
      (taskC.length - 1);
    if (variance > 25) {
      anomalies.push({
        anomalyType: 'task_completion_irregularity',
        severity: 'medium',
        reason: `Task completion score oscillates (avg step change ${variance.toFixed(1)}).`,
        suggestedAction: 'Clarify task definitions and estimation accuracy.',
        explanation: 'Heuristic irregularity detector on task completion time series.',
      });
    }
  }

  if (records.length === 0) {
    anomalies.push({
      anomalyType: 'inactivity',
      severity: 'low',
      reason: 'No performance records found for this employee.',
      suggestedAction: 'Start capturing periodic performance snapshots.',
      explanation: 'Fallback rule when analytics history is empty.',
    });
  }

  const explanation =
    anomalies.length === 0
      ? 'No anomalies detected with current thresholds and history depth.'
      : `Found ${anomalies.length} signal(s) using z-score and deterministic rules.`;

  return { employeeId, anomalies, explanation, method: 'z-score + rule thresholds (explainable)' };
}

module.exports = { detectAnomaliesForEmployee };
