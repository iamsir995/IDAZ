const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', settingController.getSettings); // Public route để apply CSS
router.get('/admin', protect, adminOnly, settingController.getAdminSettings); // Lấy cho Admin (có payment gateways)
router.put('/', protect, adminOnly, settingController.updateSettings);

router.get('/system', protect, adminOnly, settingController.getSystemSettings); // Cấu hình hệ thống (.env)
router.put('/system', protect, adminOnly, settingController.updateSystemSettings);

module.exports = router;
