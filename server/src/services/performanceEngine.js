const { percentFromRaw, DEFAULT_METRIC } = require('../utils/normalize');
const { getPerformanceWeights, normalizeWeights } = require('./settingsService');

function buildExplanation(labels, scores, weightedScore) {
  const entries = labels.map((label, i) => ({ label, score: scores[i] }));
  const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
  const above = entries.filter((e) => e.score >= mean + 5).map((e) => e.label);
  const below = entries.filter((e) => e.score <= mean - 5).map((e) => e.label);
  let text = `Score is ${weightedScore.toFixed(1)}/100 (weighted composite). `;
  if (above.length) {
    text += `Elevated by strong ${above.join(' and ')}. `;
  }
  if (below.length) {
    text += `${below.join(' and ')} ${below.length > 1 ? 'were' : 'was'} below your other metrics and reduced the final result.`;
  } else if (!above.length) {
    text += 'All factors are balanced around the team baseline.';
  }
  return text.trim();
}

async function computePerformanceScores(employee, overrides = {}) {
  const weightsRaw = await getPerformanceWeights();
  const w = normalizeWeights(weightsRaw);

  const defaultsUsed = [];
  const attendance = percentFromRaw(
    overrides.attendanceScore ?? employee.attendanceRate,
    DEFAULT_METRIC
  );
  if (attendance.usedDefault) defaultsUsed.push('attendanceRate');

  const taskC = percentFromRaw(
    overrides.taskCompletionScore ?? employee.taskCompletionRate,
    DEFAULT_METRIC
  );
  if (taskC.usedDefault) defaultsUsed.push('taskCompletionRate');

  const deadline = percentFromRaw(
    overrides.deadlineAdherenceScore ?? employee.deadlineAdherenceRate,
    DEFAULT_METRIC
  );
  if (deadline.usedDefault) defaultsUsed.push('deadlineAdherenceRate');

  const peer = percentFromRaw(overrides.peerFeedbackScore ?? employee.peerFeedbackScore, DEFAULT_METRIC);
  if (peer.usedDefault) defaultsUsed.push('peerFeedbackScore');

  const a = attendance.value / 100;
  const t = taskC.value / 100;
  const d = deadline.value / 100;
  const p = peer.value / 100;

  const contrib = {
    attendance: w.w1 * a * 100,
    taskCompletion: w.w2 * t * 100,
    deadlineAdherence: w.w3 * d * 100,
    peerFeedback: w.w4 * p * 100,
  };

  const weightedScore =
    w.w1 * a * 100 + w.w2 * t * 100 + w.w3 * d * 100 + w.w4 * p * 100;

  const labels = ['attendance', 'task completion', 'deadline adherence', 'peer feedback'];
  const rawScores = [attendance.value, taskC.value, deadline.value, peer.value];
  const explanation = buildExplanation(labels, rawScores, weightedScore);
  const defaultNote =
    defaultsUsed.length > 0
      ? ` Missing or invalid fields used safe defaults (${defaultsUsed.join(', ')} → ${DEFAULT_METRIC}).`
      : '';

  return {
    attendanceScore: attendance.value,
    taskCompletionScore: taskC.value,
    deadlineAdherenceScore: deadline.value,
    peerFeedbackScore: peer.value,
    weightedScore: Math.round(weightedScore * 10) / 10,
    breakdown: {
      weights: { w1: w.w1, w2: w.w2, w3: w.w3, w4: w.w4 },
      contributions: {
        attendance: Math.round(contrib.attendance * 10) / 10,
        taskCompletion: Math.round(contrib.taskCompletion * 10) / 10,
        deadlineAdherence: Math.round(contrib.deadlineAdherence * 10) / 10,
        peerFeedback: Math.round(contrib.peerFeedback * 10) / 10,
      },
      defaultsUsed,
      explanation: explanation + defaultNote,
    },
  };
}

module.exports = { computePerformanceScores };
