const express = require('express');
const { authMiddleware, requireRoles } = require('../middleware/auth');
const controller = require('../controllers/employeeController');
const { createRules, idParam } = require('../validators/employeeValidators');
const { handleValidation } = require('../middleware/validate');

const router = express.Router();

router.use(authMiddleware);

router.get('/', controller.list);
router.get('/:id', idParam, handleValidation, controller.getById);
router.post('/', requireRoles('admin', 'manager'), createRules, handleValidation, controller.create);
router.put('/:id', idParam, handleValidation, controller.update);
router.delete('/:id', requireRoles('admin'), idParam, handleValidation, controller.remove);

module.exports = router;
