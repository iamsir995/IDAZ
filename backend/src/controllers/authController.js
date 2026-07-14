const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'mock_client_id');

// 1. Tạo Access Token (Ngắn hạn - 15 phút)
const generateAccessToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret_key_tam_thoi_can_thay_doi', {
    expiresIn: '15m',
  });
};

// 2. Tạo Refresh Token (Dài hạn - 7 ngày)
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'refresh_secret_cuc_ky_bao_mat', {
    expiresIn: '7d',
  });
};

// ==========================================
// ĐĂNG KÝ (REGISTER)
// ==========================================
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Chính sách mật khẩu an toàn: Ít nhất 8 ký tự, có chứa chữ cái và số
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm cả chữ cái và số để đảm bảo an toàn.' 
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email này đã được sử dụng.' });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công. Vui lòng đăng nhập.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký.' });
  }
};

// ==========================================
// ĐĂNG NHẬP MASTER KEY (Lối tắt cho quản trị viên tối cao)
// ==========================================
exports.masterLogin = async (req, res) => {
  try {
    const { masterKey } = req.body;
    
    if (!masterKey) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp Master Key' });
    }

    // Mã hóa khóa người dùng gửi lên để so sánh với Hash trong .env
    const hashedInputKey = crypto.createHash('sha256').update(masterKey).digest('hex');
    const systemMasterHash = process.env.MASTER_KEY_HASH;

    if (!systemMasterHash || hashedInputKey !== systemMasterHash) {
      // Log lại nỗ lực truy cập bất hợp pháp
      await AuditLog.create({
        action: 'MASTER_LOGIN_FAILED',
        details: 'Cố gắng sử dụng Master Key không hợp lệ',
        ipAddress: req.ip
      });
      return res.status(401).json({ success: false, message: 'Master Key không hợp lệ hoặc bị từ chối' });
    }

    // Nếu key hợp lệ, tìm quản trị viên cao nhất
    let adminUser = await User.findOne({ role: 'superadmin' }).sort({ createdAt: 1 });
    
    // Nếu chưa có superadmin nào, lấy admin đầu tiên và nâng cấp
    if (!adminUser) {
      adminUser = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
      if (adminUser) {
        adminUser.role = 'superadmin';
        await adminUser.save();
      }
    }

    if (!adminUser) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản quản trị viên nào trong hệ thống.' });
    }

    // Cấp token cho Super Admin
    const accessToken = generateAccessToken(adminUser._id, adminUser.role);
    const refreshToken = generateRefreshToken(adminUser._id);

    // Lưu Refresh Token vào DB
    adminUser.refreshToken = refreshToken;
    await adminUser.save();

    // Ghi log bảo mật
    await AuditLog.create({
      userId: adminUser._id,
      action: 'MASTER_LOGIN_SUCCESS',
      details: 'Đăng nhập thành công bằng Master Key',
      ipAddress: req.ip
    });

    // Set Refresh Token vào HTTP-Only Cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
    });

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        avatar: adminUser.avatar,
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi đăng nhập bằng Master Key' });
  }
};

// ==========================================
// BƯỚC 1: ĐĂNG NHẬP & GỬI OTP (Nếu có 2FA)
// ==========================================
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Tìm user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng.' });
    }

    // Kiểm tra tài khoản có đang bị khóa tạm thời không
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainMins = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      return res.status(403).json({ 
        success: false, 
        message: `Tài khoản tạm thời bị khóa do nhập sai mật khẩu nhiều lần. Vui lòng thử lại sau ${remainMins} phút.` 
      });
    }

    if (!(await user.matchPassword(password))) {
      // Tăng số lần thử nhập sai
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000; // Khóa 15 phút
        user.loginAttempts = 0; // Reset số lần thử sau khi đã khóa
        await user.save();
        return res.status(403).json({ 
          success: false, 
          message: 'Nhập sai mật khẩu liên tiếp 5 lần. Tài khoản của bạn đã bị khóa tạm thời 15 phút.' 
        });
      }
      
      await user.save();
      const remainAttempts = 5 - user.loginAttempts;
      return res.status(401).json({ 
        success: false, 
        message: `Email hoặc mật khẩu không đúng. Bạn còn ${remainAttempts} lần thử trước khi tài khoản bị khóa.` 
      });
    }

    // Đăng nhập thành công -> Reset loginAttempts và lockUntil
    if (user.loginAttempts > 0 || user.lockUntil) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
    }

    // Nếu người dùng KHÔNG bật 2FA, cho đăng nhập thẳng
    if (!user.is2FAEnabled) {
      const accessToken = generateAccessToken(user._id, user.role);
      const refreshToken = generateRefreshToken(user._id);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      // Ghi log
      await AuditLog.create({
        action: 'LOGIN',
        userId: user._id,
        ip: req.ip,
        details: 'Đăng nhập thành công (Không cần 2FA)'
      });

      return res.status(200).json({
        success: true,
        require2FA: false,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          accessToken,
        }
      });
    }

    // NẾU CÓ 2FA: Giả lập tạo mã OTP 6 số
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Lưu OTP vào DB với hạn sử dụng 5 phút
    user.twoFactorCode = otpCode;
    user.twoFactorExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV-ONLY] Mã OTP 2FA cho ${email} là: ${otpCode}`);
    }

    // Gửi email thật
    await sendEmail({
      email: user.email,
      subject: 'Mã xác minh 2 bước (2FA)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #4f46e5; text-align: center;">Mã Xác Minh Bảo Mật</h2>
          <p>Chào <strong>${user.name}</strong>,</p>
          <p>Bạn đang cố gắng đăng nhập vào hệ thống. Vui lòng sử dụng mã xác minh gồm 6 chữ số dưới đây để tiếp tục:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b; background: #f1f5f9; padding: 10px 20px; border-radius: 8px;">
              ${otpCode}
            </span>
          </div>
          <p style="color: #64748b; font-size: 14px;">Mã này sẽ hết hạn sau 5 phút. Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email và đổi mật khẩu tài khoản ngay lập tức.</p>
        </div>
      `
    });

    res.status(200).json({
      success: true,
      require2FA: true,
      message: 'Mã OTP đã được gửi đến email của bạn.',
      ...(process.env.NODE_ENV !== 'production' && { devNote: `(DEV) OTP của bạn là: ${otpCode}` })
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi server khi đăng nhập.' });
  }
};

// ==========================================
// BƯỚC 2: XÁC MINH OTP & CẤP TOKEN
// ==========================================
exports.verify2FA = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const user = await User.findOne({ email }).select('+twoFactorCode +twoFactorExpires');
    
    if (!user || user.twoFactorCode !== otp || user.twoFactorExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'Mã OTP không hợp lệ hoặc đã hết hạn.' });
    }

    // Xóa OTP sau khi dùng thành công
    user.twoFactorCode = undefined;
    user.twoFactorExpires = undefined;
    await user.save();

    // Tạo Access & Refresh Token
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Gắn Refresh Token vào HTTP-Only Cookie (Bảo vệ chống XSS)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true nếu dùng https
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
    });

    // Ghi log
    await AuditLog.create({
      action: 'LOGIN_2FA',
      userId: user._id,
      ip: req.ip,
      details: 'Xác minh 2FA và đăng nhập thành công'
    });

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessToken, // Frontend chỉ giữ Access Token trong RAM
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xác minh 2FA.' });
  }
};

// ==========================================
// LÀM MỚI ACCESS TOKEN TỪ COOKIE
// ==========================================
exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Không có Refresh Token.' });
    }

    // Xác thực cookie
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret_cuc_ky_bao_mat');
    
    // Tìm user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User không tồn tại.' });
    }

    // Cấp Access Token mới
    const newAccessToken = generateAccessToken(user._id, user.role);

    res.status(200).json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Refresh Token không hợp lệ hoặc đã hết hạn.' });
  }
};

// ==========================================
// ĐĂNG XUẤT (XÓA COOKIE)
// ==========================================
exports.logoutUser = async (req, res) => {
  try {
    let token = req.cookies.refreshToken;
    if (token) {
      const decoded = jwt.decode(token); // Decode không cần verify signature vì chỉ để lấy userId ghi log
      if (decoded && decoded.id) {
        await AuditLog.create({
          action: 'LOGOUT',
          userId: decoded.id,
          ip: req.ip,
          details: 'Đăng xuất khỏi hệ thống'
        });
      }
    }
  } catch (error) {
    console.error('Lỗi ghi log logout:', error);
  }

  res.clearCookie('refreshToken');
  res.status(200).json({ success: true, message: 'Đăng xuất thành công.' });
};

// ==========================================
// ĐĂNG NHẬP GOOGLE
// ==========================================
exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    let decoded;
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'mock_client_id') {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        decoded = {
          email: payload.email,
          name: payload.name,
          sub: payload.sub,
          picture: payload.picture
        };
      } catch (err) {
        return res.status(400).json({ success: false, message: 'Google Token không hợp lệ hoặc đã hết hạn.' });
      }
    } else {
      // Chỉ cho phép mock decode ở môi trường phát triển nếu chưa cấu hình Client ID
      if (process.env.NODE_ENV === 'production') {
        return res.status(400).json({ success: false, message: 'Google Client ID chưa được cấu hình trên máy chủ.' });
      }
      decoded = jwt.decode(token);
    }

    if (!decoded || !decoded.email) {
      return res.status(400).json({ success: false, message: 'Google Token không hợp lệ.' });
    }

    const { email, name, sub, picture } = decoded;

    // Tìm user theo email
    let user = await User.findOne({ email });

    if (!user) {
      // Nếu chưa có, tạo user mới
      user = await User.create({
        name,
        email,
        googleId: sub,
        avatar: picture,
        role: 'client', // Mặc định
        is2FAEnabled: false
      });
    } else if (!user.googleId) {
      // Nếu có email nhưng chưa link Google
      user.googleId = sub;
      user.avatar = user.avatar || picture;
      await user.save();
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Ghi log
    await AuditLog.create({
      action: 'LOGIN_GOOGLE',
      userId: user._id,
      ip: req.ip,
      details: 'Đăng nhập bằng Google'
    });

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xác thực Google.' });
  }
};

// ==========================================
// QUÊN MẬT KHẨU (Gửi Email)
// ==========================================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Email không tồn tại trong hệ thống.' });
    }

    // Tạo token random
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Lưu token vào DB với thời hạn 10 phút
    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Link reset (Frontend URL)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #4f46e5; text-align: center;">Đặt Lại Mật Khẩu</h2>
        <p>Chào <strong>${user.name}</strong>,</p>
        <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản tại hệ thống của chúng tôi. Vui lòng bấm vào nút dưới đây để thiết lập mật khẩu mới:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Đặt lại mật khẩu
          </a>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Nếu nút trên không hoạt động, bạn hãy sao chép liên kết dưới đây và dán vào thanh địa chỉ trình duyệt:</p>
        <p style="word-break: break-all; color: #4f46e5; font-size: 13px;">${resetUrl}</p>
        <p style="color: #94a3b8; font-size: 12px; border-t: 1px solid #f1f5f9; padding-top: 15px; margin-top: 20px;">Link này sẽ hết hạn sau 10 phút. Nếu bạn không gửi yêu cầu này, bạn có thể bỏ qua email này.</p>
      </div>
    `;

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV-ONLY] Link reset mật khẩu cho ${email} là: ${resetUrl}`);
    }

    try {
      await sendEmail({
        email: user.email,
        subject: 'Yêu cầu đặt lại mật khẩu',
        html: htmlContent
      });

      res.status(200).json({ 
        success: true, 
        message: 'Email đặt lại mật khẩu đã được gửi thành công.',
        ...(process.env.NODE_ENV !== 'production' && { devNote: `(DEV) Link reset: ${resetUrl}` })
      });
    } catch (err) {
      // Fallback trong môi trường phát triển để tránh nghẽn khi không có SMTP
      if (process.env.NODE_ENV !== 'production') {
        return res.status(200).json({
          success: true,
          message: 'Hệ thống (Dev Mode) đã ghi nhận yêu cầu.',
          devNote: `(DEV Fallback) Link reset: ${resetUrl}`
        });
      }

      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ success: false, message: 'Không thể gửi email đặt lại mật khẩu. Vui lòng liên hệ Admin.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xử lý quên mật khẩu.' });
  }
};

// ==========================================
// ĐẶT LẠI MẬT KHẨU (Reset Password)
// ==========================================
exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }

    // Set mật khẩu mới
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
