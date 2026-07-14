const Recording = require('../models/Recording');

exports.uploadRecording = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng tải lên file ghi âm/ghi hình' });
    }

    const { clientId, channelId, callType, duration } = req.body;
    
    // Lưu vào database
    const newRecording = await Recording.create({
      adminId: req.user._id,
      clientId: clientId || null,
      channelId: channelId || null,
      callType: callType || 'audio',
      fileUrl: `/uploads/recordings/${req.file.filename}`,
      fileSize: req.file.size,
      duration: duration ? parseFloat(duration) : 0
    });

    res.status(201).json({ success: true, data: newRecording });
  } catch (error) {
    console.error("Lỗi upload file ghi âm:", error);
    res.status(500).json({ success: false, message: 'Lỗi server khi upload file' });
  }
};

exports.getRecordings = async (req, res) => {
  try {
    const recordings = await Recording.find()
      .populate('adminId', 'name avatar email')
      .populate('clientId', 'name avatar email')
      .populate('channelId', 'name type')
      .sort({ createdAt: -1 });
      
    res.status(200).json({ success: true, count: recordings.length, data: recordings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách ghi âm' });
  }
};
