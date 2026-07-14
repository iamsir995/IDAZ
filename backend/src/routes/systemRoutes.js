const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Protect and require admin for system routes
router.get('/audit-logs', protect, adminOnly, systemController.getAuditLogs);
router.post('/backup', protect, adminOnly, systemController.triggerBackup);

module.exports = router;
