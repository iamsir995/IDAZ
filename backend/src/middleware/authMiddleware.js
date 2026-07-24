const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  // Kiểm tra Header Authorization có Bearer token không
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Tách token ra khỏi chữ "Bearer "
      token = req.headers.authorization.split(' ')[1];

      // Giải mã token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_tam_thoi_can_thay_doi');

      // Tìm user trong DB bằng ID giải mã (bỏ password đi)
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user || req.user.isActive === false) {
        return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại hoặc đã bị khóa/vô hiệu hóa.' });
      }
      
      next(); // Cho phép đi tiếp vào controller
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, code: 'TOKEN_EXPIRED', message: 'Token đã hết hạn.' });
      }
      return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Không có quyền truy cập, vui lòng đăng nhập.' });
  }
};

// Middleware kiểm tra quyền linh hoạt (RBAC)
exports.roleCheck = (roles) => {
  return (req, res, next) => {
    if (!req.user || req.user.isActive === false) {
      return res.status(403).json({ success: false, message: 'Từ chối truy cập. Tài khoản không hợp lệ hoặc đã bị khóa.' });
    }
    // Super Admin có quyền truy cập tất cả (Universal Access)
    if (req.user.role === 'superadmin') {
      return next();
    }
    if (!roles || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Từ chối truy cập. Bạn không có quyền thực hiện hành động này.' });
    }
    next();
  };
};

// Vẫn giữ adminOnly cho tương thích ngược
exports.adminOnly = exports.roleCheck(['superadmin', 'admin']);

// Quyền tối cao (Chỉ dành cho Super Admin)
exports.superAdminOnly = exports.roleCheck(['superadmin']);

