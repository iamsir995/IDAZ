const Message = require('../models/Message');
const User = require('../models/User');
const Channel = require('../models/Channel');
const { logAudit } = require('../utils/logger');

exports.getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params; // The ID of the user we are chatting with
    const currentUserId = req.user.id;

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId }
      ]
    }).sort({ createdAt: 1 }); // Sắp xếp cũ nhất lên trước để render UI từ trên xuống

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải lịch sử chat' });
  }
};

exports.getChatContacts = async (req, res) => {
  try {
    let query = { _id: { $ne: req.user._id } };
    if (!req.user || req.user.role !== 'superadmin') {
      query.role = { $ne: 'superadmin' };
    }
    const users = await User.find(query).select('name email role avatar');
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải danh bạ' });
  }
};

exports.getOrCreateSupportChannel = async (req, res) => {
  try {
    let supportChannel = await Channel.findOne({ type: 'support', members: req.user._id });
    
    if (!supportChannel) {
      const admins = await User.find({ role: { $in: ['admin', 'superadmin', 'manager'] } }).select('_id');
      const adminIds = admins.map(a => a._id);
      supportChannel = await Channel.create({
        name: `Hỗ trợ CSKH - ${req.user.name}`,
        type: 'support',
        members: [req.user._id, ...adminIds]
      });
    }
    
    res.status(200).json({ success: true, data: supportChannel });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải support channel' });
  }
};

// @desc    Lấy tin nhắn theo Channel (có phân trang)
// @route   GET /api/chat/channels/:channelId/messages
exports.getChannelMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 30; // Mặc định 30 tin nhắn mỗi trang
    const skip = (page - 1) * limit;

    // Kiểm tra quyền truy cập channel
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy channel' });
    }
    if (!channel.members.includes(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập channel này' });
    }

    let messageQuery = { channelId };
    if (req.user.role === 'client') {
      messageQuery.$or = [
        { private: { $ne: true } },
        { senderId: req.user._id },
        { recipientId: req.user._id }
      ];
    }

    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      if (messageQuery.$or) {
        messageQuery = {
          $and: [
            { channelId },
            { $or: messageQuery.$or },
            { text: searchRegex }
          ]
        };
      } else {
        messageQuery.text = searchRegex;
      }
    }

    const messages = await Message.find(messageQuery)
      .populate('senderId', 'name avatar role')
      .populate('replyTo', 'text senderName')
      .populate('readBy.user', 'name role')
      .sort({ createdAt: -1 }) // Lấy mới nhất trước để dễ skip
      .skip(skip)
      .limit(limit);

    // Revert mảng để trả về thứ tự cũ nhất -> mới nhất cho UI dễ render
    const reversedMessages = messages.reverse();

    res.status(200).json({ 
      success: true, 
      count: messages.length,
      data: reversedMessages 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải lịch sử tin nhắn channel' });
  }
};

// @desc    Gửi tin nhắn (qua API để lưu kèm attachments nếu cần)
// @route   POST /api/chat/messages
exports.sendMessage = async (req, res) => {
  try {
    const { channelId, text, attachments, replyTo, private: isPrivate, recipientId } = req.body;

    const message = await Message.create({
      senderId: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      senderAvatar: req.user.avatar,
      channelId,
      text,
      attachments: attachments || [],
      replyTo: replyTo || null,
      private: isPrivate || false,
      recipientId: recipientId || null,
      readBy: [{ user: req.user._id }]
    });

    // Update lastMessage in Channel
    if (channelId) {
      await Channel.findByIdAndUpdate(channelId, { lastMessage: message._id });
    }

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name avatar role')
      .populate('replyTo', 'text senderName')
      .populate('readBy.user', 'name role');

    // Broadcast tin nhắn tới những người trong channel (hoặc chỉ gửi bảo mật nếu là private)
    if (channelId) {
      const io = req.app.get('io');
      if (io) {
        if (message.private) {
          // Gửi cho người gửi
          io.to(req.user._id.toString()).emit('receive_message', populatedMessage);
          // Gửi cho người nhận
          if (recipientId) {
            io.to(recipientId.toString()).emit('receive_message', populatedMessage);
          }
          // Gửi cho các admin/manager để họ theo dõi support
          const staffMembers = await User.find({ role: { $in: ['admin', 'superadmin', 'manager'] } }).select('_id');
          staffMembers.forEach(staff => {
            if (staff._id.toString() !== req.user._id.toString() && staff._id.toString() !== (recipientId ? recipientId.toString() : '')) {
              io.to(staff._id.toString()).emit('receive_message', populatedMessage);
            }
          });
        } else {
          io.to(`channel_${channelId}`).emit('receive_message', populatedMessage);
        }
      }
    }

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi gửi tin nhắn', error: error.message });
  }
};

// @desc    Chỉnh sửa tin nhắn (chỉ cho phép trong vòng 5 phút)
// @route   PUT /api/chat/messages/:id
exports.updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tin nhắn' });
    }

    // Bảo mật: Chỉ chính người gửi được sửa
    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa tin nhắn này.' });
    }

    // Giới hạn thời gian sửa trong vòng 5 phút
    const diffMs = Date.now() - new Date(message.createdAt).getTime();
    const diffMins = diffMs / 1000 / 60;
    if (diffMins > 5) {
      return res.status(400).json({ success: false, message: 'Đã hết hạn 5 phút để chỉnh sửa tin nhắn này.' });
    }

    message.text = text || message.text;
    message.isEdited = true;
    await message.save();
    
    await logAudit(req.user, 'EDIT_MESSAGE', `Đã chỉnh sửa tin nhắn ID: ${id}. Nội dung mới: "${(text || '').substring(0, 100)}"`, req);

    const populatedMessage = await Message.findById(id)
      .populate('senderId', 'name avatar role')
      .populate('replyTo', 'text senderName')
      .populate('readBy.user', 'name role');

    // Socket.io Broadcast cập nhật cho toàn channel
    const io = req.app.get('io');
    if (io && message.channelId) {
      io.to(`channel_${message.channelId}`).emit('message_updated', populatedMessage);
    }

    res.status(200).json({ success: true, data: populatedMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi sửa tin nhắn' });
  }
};

// @desc    Xóa tin nhắn
// @route   DELETE /api/chat/messages/:id
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tin nhắn' });
    }

    // Bảo mật: Chỉ chính người gửi hoặc admin mới được xóa
    const isSender = message.senderId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    if (!isSender && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa tin nhắn này.' });
    }

    await Message.findByIdAndDelete(id);

    await logAudit(req.user, 'DELETE_MESSAGE', `Đã xóa tin nhắn ID: ${id}. Người thực hiện: ${req.user.name} (${req.user.role})`, req);

    // Socket.io Broadcast xóa tin nhắn
    const io = req.app.get('io');
    if (io && message.channelId) {
      io.to(`channel_${message.channelId}`).emit('message_deleted', { messageId: id, channelId: message.channelId });
    }

    res.status(200).json({ success: true, message: 'Đã xóa tin nhắn thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xóa tin nhắn' });
  }
};

// @desc    Ghim / Bỏ ghim tin nhắn
// @route   PUT /api/chat/messages/:id/pin
exports.togglePinMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tin nhắn' });
    }

    message.isPinned = !message.isPinned;
    if (message.isPinned) {
      message.pinnedAt = new Date();
      message.pinnedBy = req.user._id;
    } else {
      message.pinnedAt = undefined;
      message.pinnedBy = undefined;
    }
    await message.save();

    await logAudit(req.user, message.isPinned ? 'PIN_MESSAGE' : 'UNPIN_MESSAGE', `Đã ${message.isPinned ? 'ghim' : 'bỏ ghim'} tin nhắn ID: ${id}`, req);

    const populatedMessage = await Message.findById(id)
      .populate('senderId', 'name avatar role')
      .populate('replyTo', 'text senderName')
      .populate('pinnedBy', 'name')
      .populate('readBy.user', 'name role');

    // Socket.io Broadcast cập nhật ghim cho toàn channel
    const io = req.app.get('io');
    if (io && message.channelId) {
      io.to(`channel_${message.channelId}`).emit('message_updated', populatedMessage);
    }

    res.status(200).json({ success: true, data: populatedMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi ghim tin nhắn' });
  }
};

// @desc    Thả cảm xúc (Reactions) tin nhắn
// @route   PUT /api/chat/messages/:id/react
exports.reactToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp emoji' });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tin nhắn' });
    }

    const existingIndex = message.reactions.findIndex(
      r => r.user.toString() === req.user._id.toString()
    );

    if (existingIndex > -1) {
      if (message.reactions[existingIndex].emoji === emoji) {
        message.reactions.splice(existingIndex, 1);
      } else {
        message.reactions[existingIndex].emoji = emoji;
        message.reactions[existingIndex].userName = req.user.name;
      }
    } else {
      message.reactions.push({
        user: req.user._id,
        userName: req.user.name,
        emoji
      });
    }

    await message.save();

    const populatedMessage = await Message.findById(id)
      .populate('senderId', 'name avatar role')
      .populate('replyTo', 'text senderName')
      .populate('readBy.user', 'name role');

    const io = req.app.get('io');
    if (io && message.channelId) {
      io.to(`channel_${message.channelId}`).emit('message_updated', populatedMessage);
    }

    res.status(200).json({ success: true, data: populatedMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi thả cảm xúc' });
  }
};
