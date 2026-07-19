const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, roleCheck } = require('../middleware/authMiddleware');

const adminOnly = roleCheck(['superadmin', 'admin', 'manager', 'sales']);

// Route public cho khách hàng gửi form trên landing page
router.post('/', bookingController.createBooking);

// Route quản trị cho admin xem danh sách
router.get('/', protect, adminOnly, bookingController.getAllBookings);

module.exports = router;
