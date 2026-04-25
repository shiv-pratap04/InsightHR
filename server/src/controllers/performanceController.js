const PerformanceRecord = require('../models/PerformanceRecord');
const Employee = require('../models/Employee');
const { computePerformanceScores } = require('../services/performanceEngine');
const { canAccessEmployee, getEmployeeForUser } = require('../utils/employeeAccess');

async function calculate(req, res) {
  try {
    if (req.user.role === 'employee') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const { employeeId, ...overrides } = req.body;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'employeeId required' });
    }
    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const computed = await computePerformanceScores(employee, overrides);
    const record = await PerformanceRecord.create({
      employeeId,
      attendanceScore: computed.attendanceScore,
      taskCompletionScore: computed.taskCompletionScore,
      deadlineAdherenceScore: computed.deadlineAdherenceScore,
      peerFeedbackScore: computed.peerFeedbackScore,
      weightedScore: computed.weightedScore,
      breakdown: computed.breakdown,
      remarks: overrides.remarks || '',
    });

    employee.performanceHistory = [
      ...(employee.performanceHistory || []).slice(-11),
      { date: new Date(), weightedScore: computed.weightedScore, remarks: record.breakdown?.explanation },
    ];
    await employee.save();

    return res.status(201).json({
      success: true,
      data: record,
      explanation: record.breakdown.explanation,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function byEmployee(req, res) {
  try {
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    if (!canAccessEmployee(req.user, employee)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const rows = await PerformanceRecord.find({ employeeId: req.params.employeeId })
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json({
      success: true,
      data: rows,
      explanation: 'Historical performance snapshots with stored breakdown for audit and charts.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function trends(req, res) {
  try {
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    if (!canAccessEmployee(req.user, employee)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const rows = await PerformanceRecord.find({ employeeId: req.params.employeeId })
      .sort({ createdAt: 1 })
      .limit(24)
      .select('weightedScore createdAt breakdown.explanation');
    const points = rows.map((r) => ({
      date: r.createdAt,
      score: r.weightedScore,
      reason: r.breakdown?.explanation || '',
    }));
    let changeSummary = 'Not enough history to compare periods.';
    if (points.length >= 2) {
      const last = points[points.length - 1].score;
      const prev = points[points.length - 2].score;
      const delta = last - prev;
      changeSummary = `Latest change vs prior record: ${delta >= 0 ? '+' : ''}${delta.toFixed(1)} points.`;
    }
    return res.json({
      success: true,
      data: points,
      explanation: changeSummary,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { calculate, byEmployee, trends };
