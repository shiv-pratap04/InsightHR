const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const controller = require('../controllers/alertController');
const { param } = require('express-validator');
const { handleValidation } = require('../middleware/validate');

const router = express.Router();
router.use(authMiddleware);

router.get('/', controller.list);
router.put('/:id/read', [param('id').isMongoId()], handleValidation, controller.markRead);

module.exports = router;
