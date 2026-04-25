const express = require('express');
const { authMiddleware, requireRoles } = require('../middleware/auth');
const controller = require('../controllers/taskController');
const { createRules, idParam, taskIdParam } = require('../validators/taskValidators');
const { handleValidation } = require('../middleware/validate');

const router = express.Router();

router.use(authMiddleware);

router.get('/recommend/:taskId', requireRoles('admin', 'manager'), taskIdParam, handleValidation, controller.recommend);

router.get('/', controller.list);
router.get('/:id', idParam, handleValidation, controller.getById);
router.post('/', requireRoles('admin', 'manager'), createRules, handleValidation, controller.create);
router.put('/:id', requireRoles('admin', 'manager'), idParam, handleValidation, controller.update);
router.delete('/:id', requireRoles('admin', 'manager'), idParam, handleValidation, controller.remove);
router.post('/:id/assign', requireRoles('admin', 'manager'), idParam, handleValidation, controller.assign);

module.exports = router;
