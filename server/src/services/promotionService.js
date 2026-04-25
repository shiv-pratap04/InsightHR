const Employee = require('../models/Employee');
const PerformanceRecord = require('../models/PerformanceRecord');

async function latestWeightedScore(employeeId) {
  const r = await PerformanceRecord.findOne({ employeeId }).sort({ createdAt: -1 });
  return r?.weightedScore ?? null;
}

async function promotionWindowScores(employeeId) {
  const rows = await PerformanceRecord.find({ employeeId }).sort({ createdAt: -1 }).limit(6).lean();
  return rows.map((r) => r.weightedScore);
}

function trendScore(values) {
  if (values.length < 2) return 0;
  const recent = values.slice(0, 3);
  const older = values.slice(3);
  if (!older.length) return 0;
  const r = recent.reduce((a, b) => a + b, 0) / recent.length;
  const o = older.reduce((a, b) => a + b, 0) / older.length;
  return r - o;
}

async function scoreEmployeeForPromotion(employee) {
  const latest = await latestWeightedScore(employee._id);
  const window = await promotionWindowScores(employee._id);
  const perf = latest ?? 70;

  let score = 0;
  const factors = [];

  if (perf >= 82) {
    score += 30;
    factors.push('Consistently strong latest composite performance.');
  } else if (perf >= 72) {
    score += 20;
    factors.push('Solid performance level.');
  } else {
    factors.push('Performance needs strengthening before promotion.');
  }

  const tr = trendScore(window);
  if (tr > 5) {
    score += 20;
    factors.push('Positive improvement trend in recent records.');
  } else if (tr < -5) {
    score -= 10;
    factors.push('Declining trend in recent records.');
  }

  const leadership = Number(employee.peerFeedbackScore) || 0;
  if (leadership >= 80) {
    score += 15;
    factors.push('Peer feedback suggests leadership/ collaboration strength.');
  }

  const att = Number(employee.attendanceRate) || 0;
  if (att >= 90) {
    score += 15;
    factors.push('High attendance consistency.');
  } else if (att < 75) {
    score -= 8;
    factors.push('Attendance inconsistency reduces readiness.');
  }

  const skills = (employee.skills || []).length;
  if (skills >= 5) {
    score += 10;
    factors.push('Broad skill coverage indicates growth.');
  }

  const exp = Number(employee.experienceYears) || 0;
  if (exp >= 3) {
    score += 10;
    factors.push('Sufficient tenure for expanded responsibility.');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const explanation = `Promotion readiness score ${score}/100 based on performance level, trend, peer signal, attendance, skills breadth, and tenure. ${factors.join(
    ' '
  )}`;

  return { employee, promotionScore: score, explanation, factors };
}

async function recommendPromotions({ department, limit = 5 } = {}) {
  const q = { status: 'active' };
  if (department) q.department = department;
  const employees = await Employee.find(q);
  const ranked = [];
  for (const e of employees) {
    ranked.push(await scoreEmployeeForPromotion(e));
  }
  ranked.sort((a, b) => b.promotionScore - a.promotionScore);
  const top = ranked.slice(0, limit).filter((r) => r.promotionScore >= 45);

  return {
    recommendedCandidates: top.map((r) => ({
      employeeId: r.employee._id,
      fullName: r.employee.fullName,
      department: r.employee.department,
      designation: r.employee.designation,
      promotionScore: r.promotionScore,
      explanation: r.explanation,
    })),
    explanation:
      top.length > 0
        ? `Ranked ${top.length} candidate(s) by explainable weighted criteria. Threshold ≥45.`
        : 'No candidates met the minimum readiness threshold; review inputs or lower criteria manually.',
    method: 'rule-based scoring (ML-ready feature structure)',
  };
}

module.exports = { recommendPromotions, scoreEmployeeForPromotion };
