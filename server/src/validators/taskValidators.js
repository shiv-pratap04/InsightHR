const { body, param } = require('express-validator');

const createRules = [
  body('title').trim().notEmpty(),
  body('description').optional().isString(),
  body('requiredSkills').optional().isArray(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('deadline').isISO8601().toDate(),
  body('estimatedHours').optional().isFloat({ min: 0 }),
];

const idParam = [param('id').isMongoId()];
const taskIdParam = [param('taskId').isMongoId()];

module.exports = { createRules, idParam, taskIdParam };
