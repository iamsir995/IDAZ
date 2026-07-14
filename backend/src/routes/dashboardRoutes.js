const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect, roleCheck } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/summary', roleCheck(['admin', 'manager']), dashboardController.getSummary);

module.exports = router;
