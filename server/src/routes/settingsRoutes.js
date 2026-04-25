const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const controller = require('../controllers/settingsController');
const { body } = require('express-validator');
const { handleValidation } = require('../middleware/validate');

const router = express.Router();
router.use(authMiddleware);

router.get('/weights', controller.getWeights);
router.put(
  '/weights',
  [
    body('w1').isFloat({ min: 0, max: 1 }),
    body('w2').isFloat({ min: 0, max: 1 }),
    body('w3').isFloat({ min: 0, max: 1 }),
    body('w4').isFloat({ min: 0, max: 1 }),
  ],
  handleValidation,
  controller.putWeights
);

module.exports = router;
