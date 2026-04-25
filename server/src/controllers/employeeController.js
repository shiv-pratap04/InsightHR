const Employee = require('../models/Employee');
const { getEmployeeForUser, canAccessEmployee } = require('../utils/employeeAccess');

async function list(req, res) {
  try {
    let query = {};
    if (req.user.role === 'employee') {
      const mine = await getEmployeeForUser(req.user._id);
      if (!mine) {
        return res.json({
          success: true,
          data: [],
          explanation: 'No employee profile linked to this user yet.',
        });
      }
      return res.json({
        success: true,
        data: [mine],
        explanation: 'Employees see only their own profile.',
      });
    }
    if (req.query.department) {
      query.department = req.query.department;
    }
    if (req.query.status) {
      query.status = req.query.status;
    }
    const data = await Employee.find(query).sort({ fullName: 1 });
    return res.json({
      success: true,
      data,
      explanation: 'Directory listing filtered by your role and query parameters.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getById(req, res) {
  try {
    const doc = await Employee.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Employee not found' });
    if (!canAccessEmployee(req.user, doc)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    return res.json({
      success: true,
      data: doc,
      explanation: 'Employee detail retrieved with field-level explainability hooks in analytics APIs.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function create(req, res) {
  try {
    if (req.user.role === 'employee') {
      return res.status(403).json({ success: false, message: 'Employees cannot create profiles' });
    }
    const body = req.body;
    const doc = await Employee.create(body);
    return res.status(201).json({
      success: true,
      data: doc,
      explanation: 'Employee record created; link userId optionally for portal login.',
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function update(req, res) {
  try {
    const doc = await Employee.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Employee not found' });
    if (req.user.role === 'employee') {
      if (!doc.userId || String(doc.userId) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }
    Object.assign(doc, req.body);
    await doc.save();
    return res.json({
      success: true,
      data: doc,
      explanation: 'Employee updated; downstream scores refresh on next analytics run.',
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function remove(req, res) {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can delete' });
    }
    const doc = await Employee.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Employee not found' });
    return res.json({
      success: true,
      explanation: 'Employee removed from directory (tasks may need reassignment).',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { list, getById, create, update, remove };
