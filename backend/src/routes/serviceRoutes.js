const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { protect, roleCheck } = require('../middleware/authMiddleware');

// Public route
router.get('/public', serviceController.getServices);

// Admin routes
router.use(protect);
router.use(roleCheck(['superadmin', 'admin', 'manager']));

router.route('/')
  .get(serviceController.getAllServicesAdmin)
  .post(serviceController.createService);

router.route('/:id')
  .put(serviceController.updateService)
  .delete(serviceController.deleteService);

module.exports = router;
