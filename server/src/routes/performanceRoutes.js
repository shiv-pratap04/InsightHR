const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const controller = require('../controllers/performanceController');
const { param, body } = require('express-validator');
const { handleValidation } = require('../middleware/validate');

const router = express.Router();
router.use(authMiddleware);

const employeeIdParam = [param('employeeId').isMongoId()];

router.post(
  '/calculate',
  [
    body('employeeId').isMongoId(),
    body('attendanceScore').optional().isFloat({ min: 0, max: 100 }),
    body('taskCompletionScore').optional().isFloat({ min: 0, max: 100 }),
    body('deadlineAdherenceScore').optional().isFloat({ min: 0, max: 100 }),
    body('peerFeedbackScore').optional().isFloat({ min: 0, max: 100 }),
  ],
  handleValidation,
  controller.calculate
);

router.get('/trends/:employeeId', employeeIdParam, handleValidation, controller.trends);
router.get('/:employeeId', employeeIdParam, handleValidation, controller.byEmployee);

module.exports = router;
