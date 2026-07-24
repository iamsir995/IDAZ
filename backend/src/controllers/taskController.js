const Task = require('../models/Task');
const Channel = require('../models/Channel');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');
const { isValidObjectId, parseObjectId } = require('../utils/objectIdHelper');

exports.getTasks = asyncHandler(async (req, res) => {
  const filter = {};
  
  const queryProjectId = parseObjectId(req.query.projectId);
  const queryAssignee = parseObjectId(req.query.assignee);

  if (req.user && req.user.role === 'client') {
    const clientProjects = await Project.find({ clientId: req.user.id }).select('_id');
    const projectIds = clientProjects.map(p => p._id.toString());
    
    if (queryProjectId) {
      if (!projectIds.includes(queryProjectId.toString())) {
        return res.status(403).json({ success: false, message: 'Không có quyền truy cập.' });
      }
      filter.projectId = queryProjectId;
    } else {
      filter.projectId = { $in: projectIds };
    }
  } else {
    if (queryProjectId) filter.projectId = queryProjectId;
  }
  
  if (queryAssignee) filter.assignee = queryAssignee;
  
  const tasks = await Task.find(filter)
    .populate('assignee', 'name avatar')
    .populate('projectId', 'title clientName')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: tasks });
});

exports.createTask = asyncHandler(async (req, res) => {
  const { title, role, status, project, projectId, assignee, dueDate, priority } = req.body;
  
  const cleanProjectId = parseObjectId(projectId);
  const cleanAssignee = parseObjectId(assignee);

  const newTask = await Task.create({
    title,
    role,
    status: status || 'todo',
    project,
    projectId: cleanProjectId,
    assignee: cleanAssignee,
    dueDate: dueDate || undefined,
    priority: priority || 'medium'
  });
  
  let targetUserId = cleanAssignee;
  if (!targetUserId) {
    const admin = await User.findOne({ role: { $in: ['admin', 'superadmin'] } });
    if (admin) targetUserId = admin._id;
  }
  
  if (targetUserId) {
    try {
      const newNotif = await Notification.create({
        recipient: targetUserId,
        sender: req.user ? req.user.id : null,
        type: 'task',
        title: 'Bạn được gán Nhiệm vụ mới',
        message: `Task "${title}" vừa được giao cho bạn`,
        link: '/admin/tasks'
      });
      
      const io = req.app.get('io');
      if (io) io.to(targetUserId.toString()).emit('new_notification', newNotif);
    } catch (notifErr) {
      console.warn('[createTask] Notification error:', notifErr.message);
    }
  }

  const populatedTask = await Task.findById(newTask._id)
    .populate('assignee', 'name avatar')
    .populate('projectId', 'title clientName');

  res.status(201).json({ success: true, data: populatedTask });
});

exports.updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'Task ID không hợp lệ.' });
  }

  const { title, role, projectId, assignee, dueDate, priority, status } = req.body;
  const cleanProjectId = parseObjectId(projectId);
  const cleanAssignee = parseObjectId(assignee);
  
  const oldTask = await Task.findById(id);
  if (!oldTask) return res.status(404).json({ success: false, message: 'Không tìm thấy Task' });

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (role !== undefined) updateData.role = role;
  if (status !== undefined) updateData.status = status;
  if (dueDate !== undefined) updateData.dueDate = dueDate;
  if (priority !== undefined) updateData.priority = priority;
  if (cleanProjectId !== undefined) updateData.projectId = cleanProjectId;
  if (cleanAssignee !== undefined) updateData.assignee = cleanAssignee;

  const task = await Task.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate('assignee', 'name avatar').populate('projectId', 'title');

  const effectiveProjectId = cleanProjectId || oldTask?.projectId;
  if (oldTask && status && oldTask.status !== status && effectiveProjectId) {
    try {
      const channel = await Channel.findOne({ projectId: effectiveProjectId, type: 'project' });
      if (channel) {
        const msg = await Message.create({
          senderId: req.user._id,
          senderName: 'Agency Bot',
          senderRole: 'system',
          senderAvatar: '🤖',
          channelId: channel._id,
          text: `Task "${task.title}" đã được chuyển sang trạng thái: ${status.toUpperCase()}`,
          systemMessage: true,
          readBy: [{ user: req.user._id }]
        });
        
        await Channel.findByIdAndUpdate(channel._id, { lastMessage: msg._id });
        
        const populatedMsg = await Message.findById(msg._id).populate('senderId', 'name avatar role');
        const io = req.app.get('io');
        if (io) {
          io.to(`channel_${channel._id}`).emit('receive_message', populatedMsg);
        }
      }
    } catch (msgErr) {
      console.warn('[updateTask] Channel bot notification error:', msgErr.message);
    }
  }

  res.status(200).json({ success: true, data: task });
});

exports.deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'Task ID không hợp lệ.' });
  }
  const task = await Task.findByIdAndDelete(id);
  if (!task) return res.status(404).json({ success: false, message: 'Không tìm thấy Task' });
  res.status(200).json({ success: true, message: 'Đã xóa Task' });
});

exports.updateTaskStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'Task ID không hợp lệ.' });
  }
  const { status } = req.body;

  const task = await Task.findByIdAndUpdate(id, { status }, { new: true }).populate('assignee', 'name avatar');
  
  if (!task) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy Task' });
  }

    const io = req.app.get('io');

    // ✅ Broadcast task_updated tới mọi client (Admin đang mở Kanban sẽ update realtime)
    if (io) {
      io.emit('task_updated', { taskId: id, status, task });
    }

    // Báo cho Assignee biết trạng thái vừa đổi
    if (task.assignee && req.user && task.assignee._id.toString() !== req.user.id) {
      const Notification = require('../models/Notification');
      const newNotif = await Notification.create({
        recipient: task.assignee._id,
        sender: req.user.id,
        type: 'task',
        title: 'Cập nhật trạng thái Task',
        message: `Task "${task.title}" của bạn vừa được đổi sang "${status}"`,
        link: '/admin/tasks'
      });
      if (io) io.to(task.assignee._id.toString()).emit('new_notification', newNotif);
    }

    res.status(200).json({ success: true, data: task });
});

// ==========================================
// CHECKLISTS
// ==========================================
exports.addChecklist = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'Task ID không hợp lệ.' });
  }
  const { title } = req.body;
  const task = await Task.findById(id);
  if (!task) return res.status(404).json({ success: false, message: 'Không tìm thấy Task' });
  
  task.checklists.push({ title, isCompleted: false });
  await task.save();
  
  res.status(200).json({ success: true, data: task });
});

exports.toggleChecklist = asyncHandler(async (req, res) => {
  const { id, checklistId } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'Task ID không hợp lệ.' });
  }
  const task = await Task.findById(id);
  if (!task) return res.status(404).json({ success: false, message: 'Không tìm thấy Task' });
  
  const checklist = task.checklists.id(checklistId);
  if (!checklist) return res.status(404).json({ success: false, message: 'Không tìm thấy Checklist' });
  
  checklist.isCompleted = !checklist.isCompleted;
  await task.save();
  
  res.status(200).json({ success: true, data: task });
});

// ==========================================
// COMMENTS
// ==========================================
exports.addComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'Task ID không hợp lệ.' });
  }
  const { text } = req.body;
  const task = await Task.findById(id);
  if (!task) return res.status(404).json({ success: false, message: 'Không tìm thấy Task' });
  
  task.comments.push({
    user: req.user.id,
    text
  });
  
  await task.save();
  const updatedTask = await Task.findById(id)
    .populate('assignee', 'name avatar')
    .populate('comments.user', 'name avatar');
    
  res.status(200).json({ success: true, data: updatedTask });
});

// ==========================================
// TIME TRACKING
// ==========================================
exports.startTimeTracking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'Task ID không hợp lệ.' });
  }
  const task = await Task.findById(id);
  if (!task) return res.status(404).json({ success: false, message: 'Không tìm thấy Task' });
  
  const activeSession = task.timeTracking.find(
    s => s.user.toString() === req.user.id && !s.endTime
  );
  if (activeSession) {
    return res.status(400).json({ success: false, message: 'Bạn đang có một phiên làm việc chưa kết thúc trên Task này' });
  }
  
  task.timeTracking.push({
    user: req.user.id,
    startTime: Date.now()
  });
  
  await task.save();
  res.status(200).json({ success: true, data: task });
});

exports.stopTimeTracking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'Task ID không hợp lệ.' });
  }
  const task = await Task.findById(id);
  if (!task) return res.status(404).json({ success: false, message: 'Không tìm thấy Task' });
  
  const activeSession = task.timeTracking.slice().reverse().find(
    s => s.user.toString() === req.user.id && !s.endTime
  );
  
  if (activeSession) {
    activeSession.endTime = Date.now();
    activeSession.duration = Math.floor((activeSession.endTime - activeSession.startTime) / 1000);
    await task.save();
  }
  
  res.status(200).json({ success: true, data: task });
});
