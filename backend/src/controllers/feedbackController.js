const Feedback = require('../models/Feedback');
const Asset = require('../models/Asset');

exports.getClientFiles = async (req, res) => {
  try {
    const assets = await Asset.find({ userId: req.user._id, type: { $in: ['image', 'design'] } }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: assets });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.getFileFeedbacks = async (req, res) => {
  try {
    const { fileId } = req.params;
    const feedbacks = await Feedback.find({ fileId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: feedbacks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.createFeedback = async (req, res) => {
  try {
    const { fileId, coordinateX, coordinateY, content } = req.body;
    const newFeedback = await Feedback.create({
      fileId,
      creatorId: req.user._id,
      creatorName: req.user.name,
      coordinateX,
      coordinateY,
      content
    });
    res.status(201).json({ success: true, data: newFeedback });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi tạo feedback' });
  }
};

exports.updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const feedback = await Feedback.findOneAndUpdate(
      { _id: id, creatorId: req.user._id },
      { content },
      { new: true }
    );
    if (!feedback) return res.status(404).json({ success: false, message: 'Không tìm thấy feedback' });
    res.status(200).json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.resolveFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findById(id);
    if (!feedback) return res.status(404).json({ success: false, message: 'Không tìm thấy feedback' });
    feedback.status = 'resolved';
    await feedback.save();
    res.status(200).json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findOneAndDelete({ _id: id, creatorId: req.user._id });
    if (!feedback) return res.status(404).json({ success: false, message: 'Không tìm thấy feedback' });
    res.status(200).json({ success: true, message: 'Đã xóa feedback' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
