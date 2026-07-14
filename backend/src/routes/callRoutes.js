const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');
const { protect } = require('../middleware/authMiddleware');

router.post('/log', protect, callController.logCall);
router.get('/history', protect, callController.getCallHistory);

module.exports = router;
