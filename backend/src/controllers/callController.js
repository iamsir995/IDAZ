const CallLog = require('../models/CallLog');

exports.logCall = async (req, res) => {
  try {
    const { channelId, participants, startTime, endTime, duration, type, status, callerId } = req.body;
    const callLog = await CallLog.create({
      channelId: channelId || null,
      participants: participants || [],
      startTime: startTime || new Date(),
      endTime: endTime || new Date(),
      duration: duration || 0,
      type: type || 'video',
      status: status || 'completed',
      callerId: callerId || req.user._id
    });
    res.status(201).json({ success: true, data: callLog });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi ghi lịch sử cuộc gọi', error: error.message });
  }
};

exports.getCallHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    // Tìm các cuộc gọi mà user hiện tại tham gia
    const history = await CallLog.find({
      $or: [
        { callerId: userId },
        { 'participants.user': userId }
      ]
    })
    .populate('callerId', 'name avatar role')
    .populate('participants.user', 'name avatar role')
    .sort('-startTime')
    .limit(50);

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy lịch sử cuộc gọi', error: error.message });
  }
};
