const Notification = require('../models/Notification');

// Lấy danh sách thông báo của user hiện tại
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
                                            .sort('-createdAt')
                                            .limit(50);
    
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải thông báo' });
  }
};

// Đánh dấu 1 thông báo là đã đọc
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user.id },
      { read: true },
      { new: true }
    );
    
    if (!notification) return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
    
    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật thông báo' });
  }
};

// Đánh dấu tất cả là đã đọc
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );
    
    res.status(200).json({ success: true, message: 'Đã đánh dấu đọc tất cả' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật' });
  }
};
