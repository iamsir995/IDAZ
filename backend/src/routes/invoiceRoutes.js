const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { protect, roleCheck } = require('../middleware/authMiddleware');

// Client: Xem danh sách hóa đơn của mình
router.get('/my-invoices', protect, invoiceController.getMyInvoices);

// Admin/Manager: Xác nhận thanh toán (Mô phỏng Webhook từ cổng thanh toán)
router.put('/:id/pay', protect, roleCheck(['admin', 'manager']), invoiceController.markAsPaid);

// Admin/Manager: Xem tất cả hóa đơn
router.get('/', protect, roleCheck(['admin', 'manager']), invoiceController.getAllInvoices);

// Admin/Manager: Tạo hóa đơn mới
router.post('/', protect, roleCheck(['admin', 'manager']), invoiceController.createInvoice);

// Admin/Manager: Xóa hóa đơn
router.delete('/:id', protect, roleCheck(['admin', 'manager']), invoiceController.deleteInvoice);

// Admin/Manager: Huỷ hóa đơn
router.put('/:id/cancel', protect, roleCheck(['admin', 'manager']), invoiceController.cancelInvoice);

// Admin/Manager: Cập nhật hóa đơn
router.put('/:id', protect, roleCheck(['admin', 'manager']), invoiceController.updateInvoice);

module.exports = router;
