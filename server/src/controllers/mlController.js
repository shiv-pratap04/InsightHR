const Task = require('../models/Task');
const { predictAttrition } = require('../services/attritionService');
const { detectAnomaliesForEmployee } = require('../services/anomalyService');
const { recommendPromotions } = require('../services/promotionService');
const { recommendForTask } = require('../services/taskAllocationService');
const Employee = require('../models/Employee');
const { canAccessEmployee } = require('../utils/employeeAccess');

async function attrition(req, res) {
  try {
    if (req.user.role === 'employee') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ success: false, message: 'employeeId required' });
    const result = await predictAttrition(employeeId);
    if (result.error) return res.status(404).json({ success: false, message: result.error });
    const emp = await Employee.findById(employeeId);
    if (emp) {
      emp.attritionRisk = { level: result.riskLevel, score: result.riskScore, lastUpdated: new Date() };
      await emp.save();
    }
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function anomaly(req, res) {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ success: false, message: 'employeeId required' });
    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    if (!canAccessEmployee(req.user, employee)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const result = await detectAnomaliesForEmployee(employeeId);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function promotion(req, res) {
  try {
    if (req.user.role === 'employee') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const { department, limit } = req.body;
    const result = await recommendPromotions({ department, limit: limit || 5 });
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function taskMatch(req, res) {
  try {
    if (req.user.role === 'employee') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const { taskId } = req.body;
    if (!taskId) return res.status(400).json({ success: false, message: 'taskId required' });
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    const result = await recommendForTask(task);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { attrition, anomaly, promotion, taskMatch };
