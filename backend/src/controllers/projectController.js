const Project = require('../models/Project');
const aiService = require('../services/aiService');

// Lấy tất cả dự án (Admin)
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate('clientId', 'name email avatar');
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// Lấy dự án theo ClientId (Admin xem trong CRM Drawer)
exports.getProjectsByClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const projects = await Project.find({ clientId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// Lấy dự án của Client (Client)
exports.getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({ clientId: req.user._id });
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// Lấy thống kê tổng quan (Client)
exports.getMyDashboardStats = async (req, res) => {
  try {
    const Task = require('../models/Task');
    const [projectsCount, projects] = await Promise.all([
      Project.countDocuments({ clientId: req.user._id, status: { $ne: 'done' } }),
      Project.find({ clientId: req.user._id }).select('_id')
    ]);
    const projectIds = projects.map(p => p._id);
    const tasksCount = await Task.countDocuments({
      projectId: { $in: projectIds },
      status: { $ne: 'done' }
    });
    res.status(200).json({ success: true, data: { activeProjects: projectsCount, pendingTasks: tasksCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// Tạo dự án mới (Admin)
exports.createProject = async (req, res) => {
  try {
    const project = await Project.create(req.body);
    
    const io = req.app.get('io');
    if (io) io.emit('dashboard_refresh');

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Lỗi tạo dự án', error: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndUpdate(id, req.body, { new: true });
    if (!project) return res.status(404).json({ success: false, message: 'Không tìm thấy dự án' });

    const io = req.app.get('io');
    if (io) {
      io.emit('project_updated', project);
      io.emit('dashboard_refresh'); // Trigger reload dashboard cho cả admin và client
    }

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Lỗi cập nhật dự án' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndDelete(id);
    if (!project) return res.status(404).json({ success: false, message: 'Không tìm thấy dự án' });

    // Xoá dây chuyền (Cascading Deletes)
    const Task = require('../models/Task');
    const Invoice = require('../models/Invoice');
    const Channel = require('../models/Channel');
    const Message = require('../models/Message');

    await Task.deleteMany({ projectId: id });
    await Invoice.deleteMany({ projectId: id });
    
    const channel = await Channel.findOne({ projectId: id });
    if (channel) {
      await Message.deleteMany({ channelId: channel._id });
      await Channel.findByIdAndDelete(channel._id);
    }

    const io = req.app.get('io');
    if (io) io.emit('dashboard_refresh');

    res.status(200).json({ success: true, message: 'Xóa dự án thành công' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Lỗi xóa dự án' });
  }
};

exports.aiGenerateDescription = async (req, res) => {
  try {
    const { topic } = req.body;
    const generatedContent = await aiService.generateProjectDescription(topic);
    res.status(200).json({ success: true, data: generatedContent });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi sinh nội dung AI', error: error.message });
  }
};
