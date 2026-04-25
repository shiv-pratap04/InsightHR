const Employee = require('../models/Employee');

async function departmentAverageSalary(department, excludeId) {
  const rows = await Employee.find({
    department,
    _id: { $ne: excludeId },
  }).select('salary');
  if (!rows.length) return null;
  const sum = rows.reduce((s, r) => s + (r.salary || 0), 0);
  return sum / rows.length;
}

function performanceTrendScore(employee) {
  const hist = employee.performanceHistory || [];
  if (hist.length < 2) return { trend: 0, note: 'insufficient history; trend neutral' };
  const recent = hist.slice(-3);
  const older = hist.slice(-6, -3);
  if (!older.length) return { trend: 0, note: 'limited history' };
  const rAvg = recent.reduce((s, p) => s + (p.weightedScore || 0), 0) / recent.length;
  const oAvg = older.reduce((s, p) => s + (p.weightedScore || 0), 0) / older.length;
  return { trend: rAvg - oAvg, note: 'compared last 3 records vs prior window' };
}

function monthsSince(date) {
  if (!date) return 999;
  const d = new Date(date);
  const now = new Date();
  return (now - d) / (1000 * 60 * 60 * 24 * 30);
}

async function predictAttrition(employeeId) {
  const employee = await Employee.findById(employeeId);
  if (!employee) return { error: 'Employee not found' };

  let score = 0;
  const reasons = [];
  const actions = [];

  const att = Number(employee.attendanceRate);
  if (Number.isFinite(att) && att < 75) {
    score += 18;
    reasons.push('Attendance rate is below 75%, indicating disengagement risk.');
    actions.push('Schedule a 1:1 to discuss schedule flexibility or blockers.');
  }

  const workload = Number(employee.currentWorkload);
  if (Number.isFinite(workload) && workload > 85) {
    score += 20;
    reasons.push('Current workload index is very high (overload signal).');
    actions.push('Rebalance tasks or add temporary capacity.');
  }

  const { trend, note } = performanceTrendScore(employee);
  if (trend < -8) {
    score += 22;
    reasons.push(`Performance trend is declining (${note}).`);
    actions.push('Set clear goals and offer mentoring or training.');
  }

  const deptAvg = await departmentAverageSalary(employee.department, employee._id);
  if (deptAvg && employee.salary > 0 && employee.salary < deptAvg * 0.88) {
    score += 15;
    reasons.push('Salary is materially below department average (equity risk).');
    actions.push('Review compensation band and recognition.');
  }

  const engage = Number(employee.engagementScore);
  if (Number.isFinite(engage) && engage < 45) {
    score += 12;
    reasons.push('Engagement proxy score is low.');
    actions.push('Increase visibility on impact and career path.');
  }

  const promoLag = monthsSince(employee.lastPromotionDate || employee.joiningDate);
  if (promoLag > 36 && (employee.promotionScore || 0) > 60) {
    score += 10;
    reasons.push('High promotion readiness score but long time since last promotion.');
    actions.push('Discuss growth opportunities and succession planning.');
  }

  score = Math.min(100, Math.round(score));
  let riskLevel = 'Low';
  if (score >= 65) riskLevel = 'High';
  else if (score >= 40) riskLevel = 'Medium';

  const explanation = `Attrition risk is ${riskLevel} (score ${score}/100) using a rule-based logistic-style additive model. ${
    reasons.length ? reasons.join(' ') : 'No strong negative signals detected.'
  }`;

  return {
    employeeId: employee._id,
    riskLevel,
    riskScore: score,
    reasons,
    recommendedActions: actions.length
      ? actions
      : ['Maintain regular check-ins and document engagement.'],
    explanation,
    method: 'rule-based (fallback) — transparent weighted factors, ML-compatible feature vector',
  };
}

module.exports = { predictAttrition };
