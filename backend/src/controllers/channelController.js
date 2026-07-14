const Channel = require('../models/Channel');
const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Lấy danh sách các channel của user hiện tại
// @route   GET /api/channels
// @access  Private
exports.getUserChannels = async (req, res) => {
  try {
    const channels = await Channel.find({ members: req.user._id })
      .populate('lastMessage')
      .populate('projectId', 'title imageUrl status')
      .sort('-updatedAt');
      
    res.status(200).json({ success: true, data: channels });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// @desc    Tạo hoặc lấy channel cho một Project
// @route   POST /api/channels/project
// @access  Private
exports.createOrGetProjectChannel = async (req, res) => {
  try {
    const { projectId } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp projectId' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy dự án' });
    }

    // Kiểm tra xem channel cho project này đã tồn tại chưa
    let channel = await Channel.findOne({ projectId, type: 'project' });
    
    if (!channel) {
      // Lấy danh sách admin và manager để add vào channel mặc định
      const adminsAndManagers = await User.find({ role: { $in: ['admin', 'manager'] } }).select('_id');
      const adminIds = adminsAndManagers.map(u => u._id);
      
      const members = [...new Set([...adminIds, project.clientId, req.user._id])];

      channel = await Channel.create({
        name: `Dự án: ${project.title}`,
        type: 'project',
        projectId: project._id,
        members: members
      });
    }

    // Đảm bảo user hiện tại là member của channel này
    if (!channel.members.includes(req.user._id)) {
      channel.members.push(req.user._id);
      await channel.save();
    }

    res.status(200).json({ success: true, data: channel });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};
