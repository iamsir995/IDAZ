const User = require('../models/User');
const crypto = require('crypto');
const sendErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const { isValidObjectId } = require('../utils/objectIdHelper');
const { buildPagination, buildSearchQuery } = require('../utils/queryHelper');

// ==========================================
// ADMIN APIS
// ==========================================

// Lấy danh sách tất cả người dùng (Có phân trang, tìm kiếm, lọc)
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { search, role } = req.query;
  const pagination = buildPagination(req.query, 20);

  let query = { isActive: true };

  if (search) {
    Object.assign(query, buildSearchQuery(search, ['name', 'email', 'company']));
  }

  if (!req.user || req.user.role !== 'superadmin') {
    query.role = { $ne: 'superadmin' };
  }

  if (role) {
    if (role === 'superadmin' && (!req.user || req.user.role !== 'superadmin')) {
      return res.status(200).json({
        success: true,
        ...pagination.formatResult([], 0)
      });
    }
    query.role = role;
  }

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('-password -twoFactorCode -twoFactorExpires')
    .sort(pagination.sort)
    .skip(pagination.skip)
    .limit(pagination.limit);

  res.status(200).json({
    success: true,
    ...pagination.formatResult(users, total)
  });
});

// Tạo người dùng mới
exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, jobTitle, company, phone, customerStatus, revenue } = req.body;

  const existUser = await User.findOne({ email });
  if (existUser) {
    return res.status(400).json({ success: false, message: 'Email đã tồn tại' });
  }

  if (role === 'superadmin' && (!req.user || req.user.role !== 'superadmin')) {
    return res.status(403).json({ success: false, message: 'Chỉ Super Admin mới được tạo tài khoản Super Admin' });
  }

  const autoPassword = password || Math.floor(100000 + Math.random() * 900000).toString();
  const passwordToSave = password ? password : crypto.createHash('sha256').update(autoPassword).digest('hex');

  const user = await User.create({
    name,
    email,
    password: passwordToSave,
    role: role || 'client',
    jobTitle,
    company,
    phone,
    customerStatus,
    revenue
  });

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
  }

  res.status(201).json({ success: true, data: user, message: 'Tạo tài khoản thành công!' });
});

// Cập nhật người dùng (Admin sửa)
exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ' });
  }

  const { name, email, role, jobTitle, phone, company, customerStatus, revenue } = req.body;

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

  const updateObj = {};
  if (name !== undefined) updateObj.name = name;
  if (email !== undefined) updateObj.email = email;
  if (role !== undefined) updateObj.role = role;
  if (jobTitle !== undefined) updateObj.jobTitle = jobTitle;
  if (phone !== undefined) updateObj.phone = phone;
  if (company !== undefined) updateObj.company = company;
  if (customerStatus !== undefined) updateObj.customerStatus = customerStatus;
  if (revenue !== undefined && revenue !== "") updateObj.revenue = Number(revenue);

  const user = await User.findByIdAndUpdate(
    id,
    updateObj,
    { new: true, runValidators: true }
  ).select('-password');

  res.status(200).json({ success: true, data: user, message: 'Cập nhật thành công!' });
});

// Xóa người dùng (Soft Delete / Deactivate)
exports.deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ' });
  }

  const targetUser = await User.findById(id);
  if (!targetUser) return res.status(404).json({ success: false, message: 'Không tìm thấy user' });

  const currentUserRole = req.user.role;
  if (currentUserRole !== 'superadmin' && targetUser.role === 'superadmin') {
    return res.status(403).json({ success: false, message: 'Không thể vô hiệu hoá Super Admin' });
  }

  await User.findByIdAndUpdate(id, { isActive: false }, { new: true });

  res.status(200).json({ success: true, message: 'Đã vô hiệu hóa (Soft Delete) người dùng' });
});

// Lấy chi tiết Khách hàng & Thống kê Công nợ/Doanh thu
exports.getClientProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ' });
  }

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

  let totalRevenue = 0;
  let totalDebt = 0;

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
});

// Bật/Tắt 2FA (Admin hoặc User tự gạt)
exports.toggle2FA = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ' });
  }

  const { is2FAEnabled } = req.body;

  const user = await User.findByIdAndUpdate(
    id,
    { is2FAEnabled },
    { new: true }
  ).select('-password');

  if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy user.' });

  res.status(200).json({ success: true, message: `Đã ${is2FAEnabled ? 'bật' : 'tắt'} 2FA thành công.`, data: user });
});

// ==========================================
// PROFILE APIS (For Logged-in User)
// ==========================================

// Lấy thông tin User hiện tại
exports.getMe = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
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
});

// Cập nhật Profile Cá nhân
exports.updateProfile = asyncHandler(async (req, res) => {
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
});

// Người dùng tự Bật/Tắt 2FA
exports.toggleMy2FA = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { is2FAEnabled } = req.body;

  const user = await User.findByIdAndUpdate(
    userId,
    { is2FAEnabled },
    { new: true }
  ).select('-password');

  res.status(200).json({ success: true, message: `Đã ${is2FAEnabled ? 'bật' : 'tắt'} xác minh 2 bước.`, data: user });
});

// Đổi mật khẩu cá nhân
exports.updatePassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(userId).select('+password');

  if (user.password) {
    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Mật khẩu cũ không chính xác' });
    }
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công!' });
});

// Cập nhật Avatar Cá nhân
exports.updateAvatar = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Không tìm thấy file ảnh' });
  }

  const { uploadToCloudOrLocal } = require('../utils/uploader');
  const uploadResult = await uploadToCloudOrLocal(req.file, 'avatars', req);
  const avatarUrl = uploadResult.url;

  const user = await User.findByIdAndUpdate(
    userId,
    { avatar: avatarUrl },
    { new: true, runValidators: true }
  ).select('-password');

  res.status(200).json({ success: true, data: user, message: 'Cập nhật Avatar thành công!' });
});

// Cập nhật Ảnh bìa Cá nhân
exports.updateCoverImage = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Không tìm thấy file ảnh' });
  }

  const { uploadToCloudOrLocal } = require('../utils/uploader');
  const uploadResult = await uploadToCloudOrLocal(req.file, 'avatars', req);
  const coverUrl = uploadResult.url;

  const user = await User.findByIdAndUpdate(
    userId,
    { coverImage: coverUrl },
    { new: true, runValidators: true }
  ).select('-password');

  res.status(200).json({ success: true, data: user, message: 'Cập nhật Ảnh bìa thành công!' });
});

// Cập nhật vị trí GPS (Check-in)
exports.updateLocation = asyncHandler(async (req, res) => {
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
});
