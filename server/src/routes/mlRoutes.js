const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const controller = require('../controllers/mlController');
const { body } = require('express-validator');
const { handleValidation } = require('../middleware/validate');

const router = express.Router();
router.use(authMiddleware);

router.post('/attrition', [body('employeeId').isMongoId()], handleValidation, controller.attrition);
router.post('/anomaly', [body('employeeId').isMongoId()], handleValidation, controller.anomaly);
router.post(
  '/promotion',
  [body('department').optional().isString(), body('limit').optional().isInt({ min: 1, max: 50 })],
  handleValidation,
  controller.promotion
);
router.post('/task-match', [body('taskId').isMongoId()], handleValidation, controller.taskMatch);

module.exports = router;
