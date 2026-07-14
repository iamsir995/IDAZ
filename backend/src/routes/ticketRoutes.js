const express = require('express');
const { getTickets, createTicket, updateTicket, replyToTicket } = require('../controllers/ticketController');
const { protect, roleCheck } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // Yêu cầu đăng nhập

router.route('/')
  .get(getTickets)
  .post(createTicket);

// Client có thể tự sửa trạng thái ticket của họ nếu cần, hoặc Admin sửa
router.route('/:id')
  .put(updateTicket);

// Gửi reply cho ticket
router.post('/:id/reply', replyToTicket);

module.exports = router;
