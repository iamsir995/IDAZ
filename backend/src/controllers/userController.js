const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// ==========================================
// ADMIN APIS
// ==========================================

// Lấy danh sách tất cả người dùng (Có phân trang, tìm kiếm, lọc)
exports.getAllUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    // Chỉ lấy tài khoản đang active
    let query = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Ẩn các tài khoản Super Admin nếu người gửi request không phải là Super Admin
    if (!req.user || req.user.role !== 'superadmin') {
      query.role = { $ne: 'superadmin' };
    }
    
    if (role) {
      if (role === 'superadmin' && (!req.user || req.user.role !== 'superadmin')) {
        return res.status(200).json({ success: true, data: [], pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), totalPages: 0 } });
      }
      query.role = role;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: order === 'desc' ? -1 : 1 };

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -twoFactorCode -twoFactorExpires')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({ 
      success: true, 
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách user.' });
  }
};

// Tạo người dùng mới
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, company, phone, customerStatus, revenue } = req.body;
    
    // Check exist
    const existUser = await User.findOne({ email });
    if (existUser) {
      return res.status(400).json({ success: false, message: 'Email đã tồn tại' });
    }

    // Check permission for assigning superadmin role
    if (role === 'superadmin' && (!req.user || req.user.role !== 'superadmin')) {
      return res.status(403).json({ success: false, message: 'Chỉ Super Admin mới được tạo tài khoản Super Admin' });
    }

    // Nếu không truyền pass, tự động tạo random 6 số
    const autoPassword = password || Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash bằng SHA-256 nếu là autoPassword (để đồng nhất với hash từ frontend trước khi bcrypt)
    const passwordToSave = password ? password : crypto.createHash('sha256').update(autoPassword).digest('hex');

    const user = await User.create({
      name,
      email,
      password: passwordToSave,
      role: role || 'client',
      company,
      phone,
      customerStatus,
      revenue
    });

    // Gửi email thông báo mật khẩu
    const sendEmail = require('../utils/sendEmail');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    try {
      await sendEmail({
        email,
        subject: 'Thông tin tài khoản IDAZ Agency',
        html: `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #4f46e5; text-align: center;">Chào mừng đến với IDAZ Agency</h2>
          <p>Tài khoản của bạn đã được tạo thành công.</p>
          <p><strong>Email đăng nhập:</strong> ${email}</p>
          <p><strong>Mật khẩu:</strong> ${autoPassword}</p>
          <p>Vui lòng đăng nhập và đổi mật khẩu sau khi truy cập.</p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="${frontendUrl}/login" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Đăng Nhập Ngay
            </a>
          </div>
        </div>`
      });
    } catch (emailError) {
      console.error('Lỗi gửi email tạo user:', emailError);
      // Tiếp tục dù lỗi email để không ảnh hưởng luồng chính
    }

    res.status(201).json({ success: true, data: user, message: 'Tạo tài khoản thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tạo user mới' });
  }
};

// Cập nhật người dùng (Admin sửa)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, phone, company, customerStatus, revenue } = req.body;
    
    const targetUser = await User.findById(id);
    if (!targetUser) return res.status(404).json({ success: false, message: 'Không tìm thấy user' });

    const currentUserRole = req.user.role;
    if (currentUserRole !== 'superadmin') {
      if (targetUser.role === 'superadmin') {
        return res.status(403).json({ success: false, message: 'Admin không có quyền sửa thông tin Super Admin.' });
      }
      if (role === 'superadmin') {
        return res.status(403).json({ success: false, message: 'Chỉ Super Admin mới có thể cấp quyền Super Admin.' });
      }
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      { name, email, role, phone, company, customerStatus, revenue },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({ success: true, data: user, message: 'Cập nhật thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật user' });
  }
};

// Xóa người dùng (Soft Delete / Deactivate)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const targetUser = await User.findById(id);
    if (!targetUser) return res.status(404).json({ success: false, message: 'Không tìm thấy user' });

    const currentUserRole = req.user.role;
    if (currentUserRole !== 'superadmin' && targetUser.role === 'superadmin') {
      return res.status(403).json({ success: false, message: 'Không thể vô hiệu hoá Super Admin' });
    }

    // Khóa tài khoản thay vì xóa vĩnh viễn (để giữ liên kết dữ liệu Hóa đơn, Tasks...)
    const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });

    res.status(200).json({ success: true, message: 'Đã vô hiệu hóa (Soft Delete) người dùng' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi vô hiệu hóa user' });
  }
};

// Lấy chi tiết Khách hàng & Thống kê Công nợ/Doanh thu
exports.getClientProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    
    if (!user || user.role !== 'client') {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });
    }

    const Invoice = require('../models/Invoice');
    const Project = require('../models/Project');

    const [invoices, projects] = await Promise.all([
      Invoice.find({ userId: id }),
      Project.find({ clientId: id })
    ]);

    let totalRevenue = 0; // Đã thanh toán
    let totalDebt = 0;    // Chưa thanh toán

    invoices.forEach(inv => {
      if (inv.status === 'paid') totalRevenue += inv.amount;
      if (inv.status === 'pending') totalDebt += inv.amount;
    });

    res.status(200).json({
      success: true,
      data: {
        profile: user,
        stats: {
          totalRevenue,
          totalDebt,
          totalProjects: projects.length,
          totalInvoices: invoices.length
        },
        recentInvoices: invoices.slice(0, 5),
        recentProjects: projects.slice(0, 5)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy thông tin Khách hàng' });
  }
};

// Bật/Tắt 2FA (Admin hoặc User tự gạt)
exports.toggle2FA = async (req, res) => {
  try {
    const { id } = req.params;
    const { is2FAEnabled } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { is2FAEnabled },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy user.' });

    res.status(200).json({ success: true, message: `Đã ${is2FAEnabled ? 'bật' : 'tắt'} 2FA thành công.`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi thay đổi 2FA.' });
  }
};


// ==========================================
// PROFILE APIS (For Logged-in User)
// ==========================================

// Lấy thông tin User hiện tại
exports.getMe = async (req, res) => {
  try {
    // Lấy ID từ middleware auth (req.user.id)
    const userId = req.user?.id; 
    
    if (!userId) {
      // Fallback cho logic cũ nếu thiếu middleware
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_tam_thoi_can_thay_doi');
      const user = await User.findById(decoded.id).select('-password -twoFactorCode -twoFactorExpires');
      return res.status(200).json({ success: true, data: user });
    }

    const user = await User.findById(userId).select('-password -twoFactorCode -twoFactorExpires');
    if (!user) return res.status(404).json({ success: false, message: 'User không tồn tại' });
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token không hợp lệ' });
  }
};

// Cập nhật Profile Cá nhân
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, bio, socialLinks, skills, statusText, company } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        name, 
        phone, 
        bio,
        company,
        ...(socialLinks && { socialLinks }),
        ...(skills && { skills }),
        ...(statusText && { statusText })
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({ success: true, data: user, message: 'Cập nhật Profile thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật profile' });
  }
};

// Người dùng tự Bật/Tắt 2FA
exports.toggleMy2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { is2FAEnabled } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { is2FAEnabled },
      { new: true }
    ).select('-password');

    res.status(200).json({ success: true, message: `Đã ${is2FAEnabled ? 'bật' : 'tắt'} xác minh 2 bước.`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi thay đổi 2FA.' });
  }
};

// Đổi mật khẩu cá nhân
exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(userId).select('+password');
    
    // Kiểm tra MK cũ
    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Mật khẩu cũ không chính xác' });
    }

    // Gán MK mới (pre-save hook sẽ tự hash)
    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi đổi mật khẩu' });
  }
};

// Cập nhật Avatar Cá nhân
exports.updateAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy file ảnh' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({ success: true, data: user, message: 'Cập nhật Avatar thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật Avatar' });
  }
};

// Cập nhật Ảnh bìa Cá nhân
exports.updateCoverImage = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy file ảnh' });
    }

    const coverUrl = `/uploads/avatars/${req.file.filename}`;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { coverImage: coverUrl },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({ success: true, data: user, message: 'Cập nhật Ảnh bìa thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật Ảnh bìa' });
  }
};

// Cập nhật vị trí GPS (Check-in)
exports.updateLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lat, lng, address } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Thiếu tọa độ GPS' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        lastLocation: { lat, lng, address, updatedAt: Date.now() },
        $push: { 
          activityLog: { 
            action: `Check-in tại tọa độ (${lat.toFixed(4)}, ${lng.toFixed(4)})`, 
            timestamp: Date.now() 
          } 
        }
      },
      { new: true }
    ).select('-password');

    res.status(200).json({ success: true, message: 'Đã cập nhật vị trí check-in', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi check-in vị trí' });
  }
};
