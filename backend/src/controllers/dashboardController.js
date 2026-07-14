const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Invoice = require('../models/Invoice');

exports.getSummary = async (req, res) => {
  try {
    const isClient = req.user && req.user.role === 'client';
    const userId = req.user ? req.user.id : null;

    // Build queries based on role
    const projectQuery = isClient ? { clientId: userId } : {};
    const taskQuery = isClient ? { /* Client might not see tasks or only tasks linked to their project */ } : {};
    const invoiceQuery = isClient ? { userId } : {};

    // 1. Stats
    const totalUsers = await User.countDocuments();
    
    const activeProjects = await Project.countDocuments({ ...projectQuery, status: { $ne: 'done' } });
    const pendingTasks = await Task.countDocuments({ ...taskQuery, status: { $ne: 'done' } });
    
    // Invoices
    const paidInvoices = await Invoice.find({ ...invoiceQuery, status: 'paid' });
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const pendingInvoicesCount = await Invoice.countDocuments({ ...invoiceQuery, status: 'pending' });

    // Conversion rate (Khách hàng từ lead -> active/vip)
    const totalClients = await User.countDocuments({ role: 'client' });
    const convertedClients = await User.countDocuments({ role: 'client', status: { $in: ['active', 'vip'] } });
    const conversionRate = totalClients === 0 ? 0 : Math.round((convertedClients / totalClients) * 100);

    const stats = {
      totalRevenue: totalRevenue,
      activeProjects: activeProjects,
      pendingTasks: pendingTasks,
      teamMembers: totalUsers,
      pendingInvoices: pendingInvoicesCount,
      conversionRate: conversionRate
    };

    // 2. Revenue Data (Thực tế từ MongoDB)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1); // Ngày 1 của 6 tháng trước

    const revenueAggregation = await Invoice.aggregate([
      {
        $match: {
          ...invoiceQuery,
          status: 'paid',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalRevenue: { $sum: "$amount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Tạo mảng 6 tháng gần nhất
    const revenueData = [];
    const currentMonth = new Date().getMonth() + 1; // 1-12
    for (let i = 5; i >= 0; i--) {
      let m = currentMonth - i;
      if (m <= 0) m += 12;
      const found = revenueAggregation.find(r => r._id === m);
      const rev = found ? found.totalRevenue : 0;
      revenueData.push({
        month: `T${m}`,
        revenue: rev,
        profit: rev * 0.7 // Giả sử lợi nhuận 70%
      });
    }

    // 3. Task Status Data
    const doneTasks = await Task.countDocuments({ ...taskQuery, status: 'done' });
    const inProgressTasks = await Task.countDocuments({ ...taskQuery, status: 'in_progress' });
    const todoTasks = await Task.countDocuments({ ...taskQuery, status: 'todo' });
    
    const taskStatusData = [
      { name: 'Hoàn thành', value: doneTasks || 1, color: '#10b981' }, 
      { name: 'Đang làm', value: inProgressTasks || 1, color: '#4f46e5' }, 
      { name: 'Chờ xử lý', value: todoTasks || 1, color: '#f59e0b' }
    ];

    // 4. Recent Activities
    const recentTasks = await Task.find(taskQuery).sort({ createdAt: -1 }).limit(3).populate('assignee', 'name');
    const recentActivities = recentTasks.map(t => ({
      id: t._id,
      action: "Tạo nhiệm vụ",
      target: t.title,
      time: new Date(t.createdAt).toLocaleDateString('vi-VN'),
      user: t.assignee ? t.assignee.name : "Hệ thống",
      type: "task"
    }));

    // 5. Top Projects by revenue
    const topProjects = await Project.find({ revenue: { $gt: 0 } })
      .sort({ revenue: -1 }).limit(5).select('title revenue progress');

    res.status(200).json({
      success: true,
      data: {
        stats,
        revenueData,
        taskStatusData,
        recentActivities,
        topProjects
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải thống kê', error: error.message });
  }
};
