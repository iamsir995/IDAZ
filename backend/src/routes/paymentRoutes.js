const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/methods', protect, paymentController.getPaymentMethods);
router.post('/checkout', protect, paymentController.createCheckoutSession);
// Webhook không dùng protect middleware vì được gọi từ hệ thống bên thứ 3
router.get('/webhook/:method', paymentController.webhookCallback); 
router.post('/webhook/:method', paymentController.webhookCallback);

module.exports = router;
