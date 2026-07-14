const Invoice = require('../models/Invoice');

// Lấy danh sách hóa đơn của User hiện tại
exports.getMyInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.user.id }).populate('projectId', 'title').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi tải hóa đơn.' });
  }
};

// Admin: Lấy tất cả hóa đơn
exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().populate('userId', 'name email').populate('projectId', 'title').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi tải danh sách hóa đơn.' });
  }
};
exports.createInvoice = async (req, res) => {
  try {
    const { userId, projectId, invoiceNumber, title, amount, dueDate, paymentUrl } = req.body;
    
    const invoice = await Invoice.create({
      userId,
      projectId,
      invoiceNumber,
      title,
      amount,
      dueDate,
      paymentUrl
    });

    const populatedInvoice = await Invoice.findById(invoice._id).populate('userId', 'name email').populate('projectId', 'title');
    
    // Gửi thông báo realtime cho Client
    const Notification = require('../models/Notification');
    const sendEmail = require('../utils/sendEmail');

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

    // Gửi email thông báo cho khách hàng
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

    res.status(201).json({ success: true, data: populatedInvoice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi tạo hóa đơn.' });
  }
};

// Thanh toán thành công (Webhook mô phỏng)
exports.markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);
    
    if (!invoice) return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn.' });

    // Bảo mật: Client chỉ được thanh toán hóa đơn của chính mình
    if (req.user.role === 'client' && invoice.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập hóa đơn này.' });
    }

    invoice.status = 'paid';
    await invoice.save();

    // Cập nhật doanh thu khách hàng
    const User = require('../models/User');
    await User.findByIdAndUpdate(invoice.userId, { $inc: { revenue: invoice.amount } });

    // Cập nhật doanh thu Dự án nếu có
    if (invoice.projectId) {
      const Project = require('../models/Project');
      await Project.findByIdAndUpdate(invoice.projectId, { $inc: { revenue: invoice.amount } });
    }

    // Bắn thông báo Real-time lên Admin Dashboard
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
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật thanh toán.' });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findByIdAndDelete(id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn.' });
    res.status(200).json({ success: true, message: 'Đã xóa hóa đơn.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xóa hóa đơn.' });
  }
};

exports.cancelInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findByIdAndUpdate(id, { status: 'cancelled' }, { new: true })
      .populate('userId', 'name email').populate('projectId', 'title');
    if (!invoice) return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn.' });
    res.status(200).json({ success: true, data: invoice, message: 'Đã huỷ hóa đơn.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi huỷ hóa đơn.' });
  }
};

exports.updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
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
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật hóa đơn.' });
  }
};
