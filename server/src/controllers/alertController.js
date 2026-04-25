const Alert = require('../models/Alert');
const Employee = require('../models/Employee');
const { canAccessEmployee, getEmployeeForUser } = require('../utils/employeeAccess');

async function list(req, res) {
  try {
    let q = {};
    if (req.user.role === 'employee') {
      const mine = await getEmployeeForUser(req.user._id);
      if (!mine) {
        return res.json({ success: true, data: [], explanation: 'No alerts without employee link.' });
      }
      q.employeeId = mine._id;
    }
    if (req.query.type) q.type = req.query.type;
    const data = await Alert.find(q).sort({ createdAt: -1 }).limit(100).populate('employeeId', 'fullName');
    return res.json({
      success: true,
      data,
      explanation: 'Alerts power dashboard widgets and review queues.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function markRead(req, res) {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    const emp = await Employee.findById(alert.employeeId);
    if (!canAccessEmployee(req.user, emp)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    alert.isRead = true;
    await alert.save();
    return res.json({
      success: true,
      data: alert,
      explanation: 'Alert marked read for reporting hygiene.',
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = { list, markRead };
