const Task = require('../models/Task');
const Channel = require('../models/Channel');
const Message = require('../models/Message');

exports.getTasks = async (req, res) => {
  try {
    const filter = {};
    
    if (req.user && req.user.role === 'client') {
      const Project = require('../models/Project');
      const clientProjects = await Project.find({ clientId: req.user.id }).select('_id');
      const projectIds = clientProjects.map(p => p._id.toString());
      
      if (req.query.projectId) {
        if (!projectIds.includes(req.query.projectId)) {
          return res.status(403).json({ success: false, message: 'Không có quyền truy cập.' });
        }
        filter.projectId = req.query.projectId;
      } else {
        filter.projectId = { $in: projectIds };
      }
    } else {
      if (req.query.projectId) filter.projectId = req.query.projectId;
    }
    
    if (req.query.assignee) filter.assignee = req.query.assignee;
    
    const tasks = await Task.find(filter).populate('assignee', 'name avatar').populate('projectId', 'title clientName').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách Task' });
  }
};


exports.createTask = async (req, res) => {
  try {
    const { title, role, status, project, projectId, assignee, dueDate, priority } = req.body;
    const newTask = await Task.create({ title, role, status, project, projectId, assignee, dueDate, priority });
    
    // Nếu có gán người, báo cho người đó, nếu không báo cho admin
    const User = require('../models/User');
    const Notification = require('../models/Notification');
    
    let targetUserId = assignee;
    if (!targetUserId) {
      const admin = await User.findOne({ role: { $in: ['admin', 'superadmin'] } });
      if (admin) targetUserId = admin._id;
    }
    
    if (targetUserId) {
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
    }

    // Populate để trả về FE có data assignee và projectId
    const populatedTask = await Task.findById(newTask._id).populate('assignee', 'name avatar').populate('projectId', 'title clientName');

    res.status(201).json({ success: true, data: populatedTask });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo Task' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, role, projectId, assignee, dueDate, priority, status } = req.body;
    
    // Lấy task cũ để so sánh status
    const oldTask = await Task.findById(id);

    const task = await Task.findByIdAndUpdate(
      id,
      { title, role, projectId, assignee, dueDate, priority, status },
      { new: true, runValidators: true }
    ).populate('assignee', 'name avatar').populate('projectId', 'title');
    
    if (!task) return res.status(404).json({ success: false, message: 'Không tìm thấy Task' });

    // ==== Gửi System Message vào Project Channel nếu chuyển trạng thái ====
    const effectiveProjectId = projectId || oldTask?.projectId;
    if (oldTask && status && oldTask.status !== status && effectiveProjectId) {
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
    }
    // ======================================================================

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật Task' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);
    if (!task) return res.status(404).json({ success: false, message: 'Không tìm thấy Task' });
    res.status(200).json({ success: true, message: 'Đã xóa Task' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xóa Task' });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
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
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật Task' });
  }
};

// ==========================================
// CHECKLISTS
// ==========================================
exports.addChecklist = async (req, res) => {
  try {
    const { title } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    
    task.checklists.push({ title, isCompleted: false });
    await task.save();
    
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi thêm checklist' });
  }
};

exports.toggleChecklist = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    
    const checklist = task.checklists.id(req.params.checklistId);
    if (!checklist) return res.status(404).json({ success: false, message: 'Checklist not found' });
    
    checklist.isCompleted = !checklist.isCompleted;
    await task.save();
    
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi toggle checklist' });
  }
};

// ==========================================
// COMMENTS
// ==========================================
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    
    task.comments.push({
      user: req.user.id,
      text
    });
    
    await task.save();
    const updatedTask = await Task.findById(req.params.id)
      .populate('assignee', 'name avatar')
      .populate('comments.user', 'name avatar');
      
    res.status(200).json({ success: true, data: updatedTask });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi thêm comment' });
  }
};

// ==========================================
// TIME TRACKING
// ==========================================
exports.startTimeTracking = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    
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
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi start timer' });
  }
};

exports.stopTimeTracking = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    
    // Tìm session chưa có endTime của user hiện tại
    const activeSession = task.timeTracking.slice().reverse().find(
      s => s.user.toString() === req.user.id && !s.endTime
    );
    
    if (activeSession) {
      activeSession.endTime = Date.now();
      activeSession.duration = Math.floor((activeSession.endTime - activeSession.startTime) / 1000);
      await task.save();
    }
    
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi stop timer' });
  }
};
