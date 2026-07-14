const express = require('express');
const router = express.Router();
const briefController = require('../controllers/briefController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Client: Lấy bản khảo sát của khách hàng đang đăng nhập
router.get('/my-brief', protect, briefController.getMyBrief);

// Client: Gửi bản khảo sát mới
router.post('/', protect, briefController.createBrief);

// Client: Cập nhật bản khảo sát
router.put('/', protect, briefController.updateBrief);

// Admin: Lấy tất cả bản khảo sát
router.get('/', protect, adminOnly, briefController.getAllBriefs);

// Admin: Cập nhật bản khảo sát
router.put('/:id', protect, adminOnly, briefController.updateBriefAdmin);

// Admin: Nhờ AI tóm tắt bản khảo sát của khách hàng
router.get('/:id/ai-summary', protect, adminOnly, briefController.getBriefAISummary);

module.exports = router;
