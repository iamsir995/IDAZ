const Invoice = require('../models/Invoice');
const User = require('../models/User');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');
const asyncHandler = require('../utils/asyncHandler');
const { isValidObjectId } = require('../utils/objectIdHelper');

// Lấy danh sách hóa đơn của User hiện tại
exports.getMyInvoices = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({ userId: req.user.id }).populate('projectId', 'title').sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: invoices });
});

// Admin: Lấy tất cả hóa đơn
exports.getAllInvoices = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find().populate('userId', 'name email').populate('projectId', 'title').sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: invoices });
});

// Tạo hóa đơn mới
exports.createInvoice = asyncHandler(async (req, res) => {
  const { userId, projectId, title, amount, dueDate, paymentUrl } = req.body;
  const invoiceNumber = req.body.invoiceNumber || `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  if (!userId) return res.status(400).json({ success: false, message: 'Thiếu userId.' });
  if (!title) return res.status(400).json({ success: false, message: 'Thiếu tiêu đề hóa đơn.' });
  if (!amount) return res.status(400).json({ success: false, message: 'Thiếu số tiền.' });
  if (!dueDate) return res.status(400).json({ success: false, message: 'Thiếu hạn thanh toán.' });

  const invoice = await Invoice.create({
    userId,
    projectId: projectId || undefined,
    invoiceNumber,
    title,
    amount: Number(amount),
    dueDate,
    paymentUrl
  });

  const populatedInvoice = await Invoice.findById(invoice._id)
    .populate('userId', 'name email')
    .populate('projectId', 'title');

  // Gửi thông báo + email — bọc trong try riêng để không crash route chính
  try {
    const newNotif = await Notification.create({
      recipient: userId,
      sender: req.user ? req.user.id : null,
      type: 'invoice',
      title: 'Hóa đơn mới từ Agency',
      message: `Bạn có hóa đơn mới: ${title} - ${Number(amount).toLocaleString('vi-VN')} ₫. Hạn thanh toán: ${dueDate ? new Date(dueDate).toLocaleDateString('vi-VN') : 'Chưa xác định'}.`,
      link: '/client/invoices'
    });

    const io = req.app.get('io');
    if (io) io.to(userId.toString()).emit('new_notification', newNotif);

    if (populatedInvoice.userId?.email) {
      await sendEmail({
        email: populatedInvoice.userId.email,
        subject: `Hóa đơn mới: ${title}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:20px;border:1px solid #e2e8f0;border-radius:10px;">
          <h2 style="color:#4f46e5;">Bạn có Hóa đơn mới</h2>
          <p>Chào <strong>${populatedInvoice.userId.name}</strong>,</p>
          <p>Agency vừa tạo hóa đơn mới dành cho bạn:</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:8px;background:#f8fafc;font-weight:bold;">Tiêu đề</td><td style="padding:8px;">${title}</td></tr>
            <tr><td style="padding:8px;background:#f8fafc;font-weight:bold;">Số tiền</td><td style="padding:8px;color:#e11d48;font-size:18px;font-weight:bold;">${Number(amount).toLocaleString('vi-VN')} ₫</td></tr>
            <tr><td style="padding:8px;background:#f8fafc;font-weight:bold;">Số hóa đơn</td><td style="padding:8px;">${invoiceNumber}</td></tr>
            ${dueDate ? `<tr><td style="padding:8px;background:#f8fafc;font-weight:bold;">Hạn thanh toán</td><td style="padding:8px;">${new Date(dueDate).toLocaleDateString('vi-VN')}</td></tr>` : ''}
          </table>
          <p style="color:#64748b;font-size:14px;">Vui lòng đăng nhập vào hệ thống để xem chi tiết và thực hiện thanh toán.</p>
        </div>`
      });
    }
  } catch (notifErr) {
    console.warn('[createInvoice] Notification/Email error (non-fatal):', notifErr.message);
  }

  res.status(201).json({ success: true, data: populatedInvoice });
});

// Thanh toán thành công (Webhook mô phỏng)
exports.markAsPaid = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'ID hóa đơn không hợp lệ.' });
  }

  const invoice = await Invoice.findById(id);
  if (!invoice) return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn.' });

  if (req.user.role === 'client' && invoice.userId.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Không có quyền truy cập hóa đơn này.' });
  }

  invoice.status = 'paid';
  await invoice.save();

  await User.findByIdAndUpdate(invoice.userId, { $inc: { revenue: invoice.amount } });

  if (invoice.projectId) {
    await Project.findByIdAndUpdate(invoice.projectId, { $inc: { revenue: invoice.amount } });
  }

  const io = req.app.get('io');
  if (io) {
    io.emit('new_notification', {
      _id: `sys-${Date.now()}`,
      type: 'invoice',
      title: 'Thanh toán thành công 💰',
      message: `Khách hàng vừa thanh toán hóa đơn ${invoice.invoiceNumber}.`,
      createdAt: new Date(),
      read: false
    });
    io.emit('invoice_paid', invoice);
    io.emit('dashboard_refresh');
  }

  res.status(200).json({ success: true, message: 'Thanh toán thành công.', data: invoice });
});

exports.deleteInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'ID hóa đơn không hợp lệ.' });
  }
  const invoice = await Invoice.findByIdAndDelete(id);
  if (!invoice) return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn.' });
  res.status(200).json({ success: true, message: 'Đã xóa hóa đơn.' });
});

exports.cancelInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'ID hóa đơn không hợp lệ.' });
  }
  const invoice = await Invoice.findByIdAndUpdate(id, { status: 'cancelled' }, { new: true })
    .populate('userId', 'name email').populate('projectId', 'title');
  if (!invoice) return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn.' });
  res.status(200).json({ success: true, data: invoice, message: 'Đã huỷ hóa đơn.' });
});

exports.updateInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'ID hóa đơn không hợp lệ.' });
  }
  const { userId, projectId, invoiceNumber, title, amount, dueDate, paymentUrl, status } = req.body;

  let invoice = await Invoice.findById(id);
  if (!invoice) return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn.' });

  invoice.userId = userId || invoice.userId;
  invoice.projectId = projectId || invoice.projectId;
  invoice.invoiceNumber = invoiceNumber || invoice.invoiceNumber;
  invoice.title = title || invoice.title;
  invoice.amount = amount !== undefined ? amount : invoice.amount;
  invoice.dueDate = dueDate || invoice.dueDate;
  invoice.paymentUrl = paymentUrl || invoice.paymentUrl;
  if (status) {
    invoice.status = status;
  }

  await invoice.save();

  const populatedInvoice = await Invoice.findById(invoice._id).populate('userId', 'name email').populate('projectId', 'title');

  res.status(200).json({ success: true, data: populatedInvoice, message: 'Đã cập nhật hóa đơn.' });
});
