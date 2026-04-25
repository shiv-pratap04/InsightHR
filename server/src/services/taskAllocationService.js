const Employee = require('../models/Employee');
const Task = require('../models/Task');

function skillMatchScore(requiredSkills, employeeSkills) {
  if (!requiredSkills || requiredSkills.length === 0) return 50;
  const req = requiredSkills.map((s) => s.toLowerCase());
  const have = new Set((employeeSkills || []).map((s) => s.toLowerCase()));
  const matched = req.filter((s) => have.has(s)).length;
  return (matched / req.length) * 100;
}

function availabilityScore(currentWorkload) {
  const w = Number(currentWorkload) || 0;
  return Math.max(0, 100 - w);
}

function workloadPenalty(currentWorkload, activeTaskCount) {
  const w = Number(currentWorkload) || 0;
  const t = Number(activeTaskCount) || 0;
  return Math.min(80, w * 0.35 + t * 8);
}

async function countActiveTasksForEmployee(employeeId) {
  return Task.countDocuments({
    assignedTo: employeeId,
    status: { $in: ['assigned', 'in-progress'] },
  });
}

function explainRecommendation(emp, reqSkills, matchPct, avail, penalty, activeCount) {
  const matched = (reqSkills || []).filter((s) =>
    (emp.skills || []).map((x) => x.toLowerCase()).includes(s.toLowerCase())
  ).length;
  const total = (reqSkills || []).length || 1;
  const workloadNote =
    emp.currentWorkload < 40
      ? 'workload is relatively low'
      : emp.currentWorkload < 70
        ? 'workload is moderate'
        : 'workload is high';
  return `${emp.fullName} selected because ${matched}/${total} required skills matched, ${workloadNote} (capacity ~${avail.toFixed(
    0
  )}), and active assignments (${activeCount}) produced a workload penalty of ${penalty.toFixed(1)}.`;
}

async function recommendForTask(task) {
  const employees = await Employee.find({ status: 'active' });
  if (!employees.length) {
    return {
      recommendations: [],
      manualReviewRequired: true,
      explanation: 'No active employees in the directory. Manual review required.',
    };
  }

  const requiredSkills = task.requiredSkills || [];
  const scored = [];

  for (const emp of employees) {
    const activeCount = await countActiveTasksForEmployee(emp._id);
    const sm = skillMatchScore(requiredSkills, emp.skills);
    const av = availabilityScore(emp.currentWorkload);
    const pen = workloadPenalty(emp.currentWorkload, activeCount);
    const finalMatch = sm + av - pen;
    scored.push({
      employee: emp,
      skillMatchScore: Math.round(sm * 10) / 10,
      availabilityScore: Math.round(av * 10) / 10,
      workloadPenalty: Math.round(pen * 10) / 10,
      finalMatchScore: Math.round(finalMatch * 10) / 10,
      activeAssignments: activeCount,
      explanation: explainRecommendation(emp, requiredSkills, sm, av, pen, activeCount),
    });
  }

  scored.sort((a, b) => b.finalMatchScore - a.finalMatchScore);
  const top = scored.slice(0, 3);

  const best = top[0];
  const manualReviewRequired = !best || best.skillMatchScore < 30 || best.finalMatchScore < 20;

  const summary =
    top.length > 0
      ? `Top match: ${top[0].employee.fullName} (final match ${top[0].finalMatchScore}). ${
          manualReviewRequired
            ? 'Confidence is low — manual review recommended.'
            : 'Allocation confidence is acceptable for auto-assign.'
        }`
      : 'Manual review required.';

  return {
    recommendations: top.map((row) => ({
      employeeId: row.employee._id,
      fullName: row.employee.fullName,
      department: row.employee.department,
      skills: row.employee.skills,
      currentWorkload: row.employee.currentWorkload,
      skillMatchScore: row.skillMatchScore,
      availabilityScore: row.availabilityScore,
      workloadPenalty: row.workloadPenalty,
      finalMatchScore: row.finalMatchScore,
      explanation: row.explanation,
    })),
    manualReviewRequired,
    explanation: summary,
  };
}

async function assignTaskToEmployee(taskId, employeeId, userId) {
  const task = await Task.findById(taskId);
  if (!task) return { error: 'Task not found' };
  if (task.assignedTo && String(task.assignedTo) !== String(employeeId)) {
    return { error: 'Task is already assigned to another employee' };
  }
  const emp = await Employee.findById(employeeId);
  if (!emp) return { error: 'Employee not found' };
  task.assignedTo = employeeId;
  task.status = task.status === 'pending' ? 'assigned' : task.status;
  await task.save();
  return { task, employee: emp };
}

module.exports = {
  recommendForTask,
  assignTaskToEmployee,
  skillMatchScore,
};
