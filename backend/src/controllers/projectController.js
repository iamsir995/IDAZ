const Project = require('../models/Project');
const Task = require('../models/Task');
const Invoice = require('../models/Invoice');
const Channel = require('../models/Channel');
const Message = require('../models/Message');
const aiService = require('../services/aiService');
const asyncHandler = require('../utils/asyncHandler');
const { isValidObjectId } = require('../utils/objectIdHelper');

// Lấy tất cả dự án (Admin)
exports.getAllProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find().populate('clientId', 'name email avatar').sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: projects });
});

// Lấy dự án theo ClientId (Admin xem trong CRM Drawer)
exports.getProjectsByClient = asyncHandler(async (req, res) => {
  const { clientId } = req.params;
  if (!isValidObjectId(clientId)) {
    return res.status(400).json({ success: false, message: 'Client ID không hợp lệ' });
  }
  const projects = await Project.find({ clientId }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: projects });
});

// Lấy dự án của Client (Client)
exports.getMyProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ clientId: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: projects });
});

// Lấy thống kê tổng quan (Client)
exports.getMyDashboardStats = asyncHandler(async (req, res) => {
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
});

// Tạo dự án mới (Admin)
exports.createProject = asyncHandler(async (req, res) => {
  const project = await Project.create(req.body);

  const io = req.app.get('io');
  if (io) io.emit('dashboard_refresh');

  res.status(201).json({ success: true, data: project });
});

// Cập nhật dự án (Admin)
exports.updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'Project ID không hợp lệ' });
  }
  const project = await Project.findByIdAndUpdate(id, req.body, { new: true });
  if (!project) return res.status(404).json({ success: false, message: 'Không tìm thấy dự án' });

  const io = req.app.get('io');
  if (io) {
    io.emit('project_updated', project);
    io.emit('dashboard_refresh');
  }

  res.status(200).json({ success: true, data: project });
});

// Xóa dự án và cascading deletes (Admin)
exports.deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'Project ID không hợp lệ' });
  }
  const project = await Project.findByIdAndDelete(id);
  if (!project) return res.status(404).json({ success: false, message: 'Không tìm thấy dự án' });

  // Xoá dây chuyền (Cascading Deletes)
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
});

// Generates AI description
exports.aiGenerateDescription = asyncHandler(async (req, res) => {
  const { topic } = req.body;
  const generatedContent = await aiService.generateProjectDescription(topic);
  res.status(200).json({ success: true, data: generatedContent });
});
