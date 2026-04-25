const Employee = require('../models/Employee');

async function getEmployeeForUser(userId) {
  return Employee.findOne({ userId });
}

function canAccessEmployee(user, employeeDoc) {
  if (user.role === 'admin' || user.role === 'manager') return true;
  if (!employeeDoc || !employeeDoc.userId) return false;
  return String(employeeDoc.userId) === String(user._id);
}

module.exports = { getEmployeeForUser, canAccessEmployee };
