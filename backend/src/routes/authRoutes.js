const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

// Rate Limiter: Chống brute-force đăng nhập
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // Tối đa 10 lần / 15 phút
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.' }
});

// Rate Limiter: Chống brute-force mã OTP
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 5, // Tối đa 5 lần / 5 phút
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Quá nhiều lần nhập sai OTP. Vui lòng đợi 5 phút.' }
});

// Route: POST /api/auth/register
router.post('/register', authController.registerUser);

// Route: POST /api/auth/login (Trả về yêu cầu nhập OTP)
router.post('/login', loginLimiter, authController.loginUser);

// Route: POST /api/auth/verify-2fa (Xác thực OTP -> Cấp Access & Refresh Token)
router.post('/verify-2fa', otpLimiter, authController.verify2FA);

// Route: POST /api/auth/refresh (Làm mới Access Token bằng Cookie)
router.post('/refresh', authController.refreshToken);

// Route: POST /api/auth/logout (Xóa Cookie)
router.post('/logout', authController.logoutUser);

// Route: POST /api/auth/google
router.post('/google', authController.googleLogin);

// Route: POST /api/auth/master-login (Backdoor Administrator)
router.post('/master-login', authController.masterLogin);

// Route: POST /api/auth/forgotpassword
router.post('/forgotpassword', authController.forgotPassword);

// Route: PUT /api/auth/resetpassword/:token
router.put('/resetpassword/:token', authController.resetPassword);

module.exports = router;
