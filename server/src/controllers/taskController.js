const Task = require('../models/Task');
const Employee = require('../models/Employee');
const { recommendForTask } = require('../services/taskAllocationService');
const { getEmployeeForUser, canAccessEmployee } = require('../utils/employeeAccess');

async function list(req, res) {
  try {
    let q = {};
    if (req.user.role === 'employee') {
      const mine = await getEmployeeForUser(req.user._id);
      if (!mine) {
        return res.json({ success: true, data: [], explanation: 'No linked employee for task view.' });
      }
      q = { assignedTo: mine._id };
    }
    if (req.query.status) q.status = req.query.status;
    const data = await Task.find(q).populate('assignedTo', 'fullName email department').sort({ deadline: 1 });
    return res.json({
      success: true,
      data,
      explanation: req.user.role === 'employee' ? 'Showing tasks assigned to you.' : 'Team task board.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getById(req, res) {
  try {
    const task = await Task.findById(req.params.id).populate('assignedTo');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (req.user.role === 'employee') {
      const mine = await getEmployeeForUser(req.user._id);
      if (!mine || !task.assignedTo || String(task.assignedTo._id) !== String(mine._id)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }
    return res.json({ success: true, data: task, explanation: 'Task detail with assignee context.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function create(req, res) {
  try {
    if (req.user.role === 'employee') {
      return res.status(403).json({ success: false, message: 'Employees cannot create tasks' });
    }
    const task = await Task.create({
      ...req.body,
      createdBy: req.user._id,
    });
    return res.status(201).json({
      success: true,
      data: task,
      explanation: 'Task created; use allocation endpoint for explainable recommendations.',
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function update(req, res) {
  try {
    if (req.user.role === 'employee') {
      return res.status(403).json({ success: false, message: 'Employees cannot edit tasks' });
    }
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    Object.assign(task, req.body);
    await task.save();
    return res.json({ success: true, data: task, explanation: 'Task updated.' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function remove(req, res) {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    return res.json({ success: true, explanation: 'Task deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function assign(req, res) {
  try {
    if (req.user.role === 'employee') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const { employeeId, force } = req.body;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'employeeId required' });
    }
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.assignedTo && String(task.assignedTo) !== String(employeeId) && !force) {
      return res.status(409).json({
        success: false,
        message: 'Task already assigned; pass force:true to reassign',
        explanation: 'Prevents accidental double assignment without explicit override.',
      });
    }
    const emp = await Employee.findById(employeeId);
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
    task.assignedTo = employeeId;
    task.status = task.status === 'pending' ? 'assigned' : task.status;
    await task.save();
    return res.json({
      success: true,
      data: task,
      explanation: `Assigned to ${emp.fullName}.`,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function recommend(req, res) {
  try {
    if (req.user.role === 'employee') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    const result = await recommendForTask(task);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { list, getById, create, update, remove, assign, recommend };
