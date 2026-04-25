const { body, param } = require('express-validator');

const createRules = [
  body('fullName').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('department').trim().notEmpty(),
  body('designation').trim().notEmpty(),
  body('skills').optional().isArray(),
  body('experienceYears').optional().isFloat({ min: 0 }),
  body('salary').optional().isFloat({ min: 0 }),
  body('joiningDate').isISO8601().toDate(),
  body('currentWorkload').optional().isFloat({ min: 0, max: 100 }),
  body('attendanceRate').optional().isFloat({ min: 0, max: 100 }),
  body('taskCompletionRate').optional().isFloat({ min: 0, max: 100 }),
  body('deadlineAdherenceRate').optional().isFloat({ min: 0, max: 100 }),
  body('peerFeedbackScore').optional().isFloat({ min: 0, max: 100 }),
];

const idParam = [param('id').isMongoId()];

module.exports = { createRules, idParam };
