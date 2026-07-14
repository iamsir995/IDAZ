const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, roleCheck } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Multer config cho Avatar
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/avatars/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB cho avatar
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép upload hình ảnh.'));
    }
  }
});

// Profile APIs (Self)
router.get('/me', protect, userController.getMe);
router.put('/me/profile', protect, userController.updateProfile);
router.put('/me/password', protect, userController.updatePassword);
router.post('/me/avatar', protect, upload.single('avatar'), userController.updateAvatar);
router.post('/me/cover', protect, upload.single('coverImage'), userController.updateCoverImage);
router.put('/me/location', protect, userController.updateLocation);
router.put('/me/2fa', protect, userController.toggleMy2FA);

// Admin & Manager APIs (Role Check)
router.get('/', protect, roleCheck(['admin', 'manager']), userController.getAllUsers);
router.post('/', protect, roleCheck(['admin', 'manager']), userController.createUser);
router.get('/:id', protect, roleCheck(['admin', 'manager']), userController.getClientProfile); // getClientProfile
router.put('/:id', protect, roleCheck(['admin', 'manager']), userController.updateUser);
router.delete('/:id', protect, roleCheck(['admin']), userController.deleteUser);
router.put('/:id/2fa', protect, roleCheck(['admin']), userController.toggle2FA);

module.exports = router;
