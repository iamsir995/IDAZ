const Ticket = require('../models/Ticket');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Lấy tất cả tickets (Admin/Manager) hoặc của user hiện tại (Client)
// @route   GET /api/tickets
// @access  Private
exports.getTickets = asyncHandler(async (req, res) => {
  let tickets;
  if (['client'].includes(req.user.role)) {
    tickets = await Ticket.find({ userId: req.user._id }).sort({ createdAt: -1 });
  } else {
    tickets = await Ticket.find().populate('userId', 'name email').sort({ createdAt: -1 });
  }
  res.json({ success: true, data: tickets });
});

// @desc    Tạo ticket mới (Client)
// @route   POST /api/tickets
// @access  Private
exports.createTicket = asyncHandler(async (req, res) => {
  const { title, description, priority, projectId, attachments } = req.body;
  
  if (!title || !description) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đủ Tiêu đề và Mô tả' });
  }

  const ticket = await Ticket.create({
    title,
    description,
    priority: priority || 'medium',
    projectId: projectId || null,
    attachments: attachments || [],
    userId: req.user._id
  });

  res.status(201).json({ success: true, data: ticket });
});

// @desc    Cập nhật trạng thái ticket (Admin/Manager)
// @route   PUT /api/tickets/:id
// @access  Private
exports.updateTicket = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy Ticket' });
  }

  // Bảo mật: Client chỉ được xem, không được update status qua route này trừ phi muốn cho phép Client tự close
  if (req.user.role === 'client' && ticket.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Từ chối truy cập' });
  }

  if (status) ticket.status = status;

  await ticket.save();
  
  res.json({ success: true, data: ticket, message: 'Đã cập nhật Ticket' });
});

// @desc    Trả lời ticket (Client & Admin)
// @route   POST /api/tickets/:id/reply
// @access  Private
exports.replyToTicket = asyncHandler(async (req, res) => {
  const { message, attachments } = req.body;
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket không tồn tại' });

  if (req.user.role === 'client' && ticket.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Từ chối truy cập' });
  }

  ticket.replies.push({
    senderId: req.user._id,
    senderName: req.user.name,
    senderRole: req.user.role,
    senderAvatar: req.user.avatar,
    message,
    attachments: attachments || []
  });

  ticket.status = req.user.role === 'client' ? 'open' : 'in_progress';
  await ticket.save();

  res.json({ success: true, data: ticket });
});
