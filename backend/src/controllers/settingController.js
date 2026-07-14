const Setting = require('../models/Setting');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Lấy Setting (Public - KHÔNG chứa thông tin nhạy cảm của Payment Gateways)
exports.getSettings = async (req, res) => {
  try {
    let setting = await Setting.findOne().select('-paymentGateways');
    if (!setting) {
      setting = await Setting.create({});
    }
    res.status(200).json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải cài đặt' });
  }
};

// Lấy Setting cho Admin (Private - Có chứa Payment Gateways)
exports.getAdminSettings = async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({});
    }
    res.status(200).json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải cài đặt admin' });
  }
};

// Cập nhật Setting (Admin only)
exports.updateSettings = async (req, res) => {
  try {
    const { agencyName, logoUrl, primaryColor, paymentGateways } = req.body;
    let setting = await Setting.findOne();
    
    if (!setting) {
      setting = await Setting.create({ agencyName, logoUrl, primaryColor, paymentGateways });
    } else {
      setting.agencyName = agencyName || setting.agencyName;
      setting.logoUrl = logoUrl !== undefined ? logoUrl : setting.logoUrl;
      setting.primaryColor = primaryColor || setting.primaryColor;
      if (paymentGateways) {
        setting.paymentGateways = { ...setting.paymentGateways, ...paymentGateways };
      }
      setting.updatedAt = Date.now();
      await setting.save();
    }
    
    res.status(200).json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật cài đặt' });
  }
};

// Lấy Cài đặt Hệ thống (Admin only)
exports.getSystemSettings = async (req, res) => {
  try {
    const port = process.env.PORT || 5000;
    const mongoUri = process.env.MONGO_URI || '';
    res.status(200).json({ success: true, data: { port, mongoUri } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải cài đặt hệ thống' });
  }
};

// Cập nhật Cài đặt Hệ thống (Ghi đè file .env)
exports.updateSystemSettings = async (req, res) => {
  try {
    const { port, mongoUri, adminPassword } = req.body;
    
    // Verify Admin Password for Highest Security
    if (!adminPassword) {
      return res.status(401).json({ success: false, message: 'Yêu cầu mật khẩu Quản trị viên cấp cao để thực hiện thay đổi Hệ thống.' });
    }

    const admin = await User.findById(req.user.id).select('+password');
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Truy cập bị từ chối.' });
    }

    const isMatch = await bcrypt.compare(adminPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Mật khẩu Quản trị viên không chính xác.' });
    }

    const envPath = path.join(__dirname, '../../.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    if (port) {
      if (envContent.match(/^PORT=/m)) {
        envContent = envContent.replace(/^PORT=.*/m, `PORT=${port}`);
      } else {
        envContent += `\nPORT=${port}`;
      }
    }

    if (mongoUri) {
      if (envContent.match(/^MONGO_URI=/m)) {
        // Handle URIs with special characters carefully
        envContent = envContent.replace(/^MONGO_URI=.*/m, `MONGO_URI=${mongoUri}`);
      } else {
        envContent += `\nMONGO_URI=${mongoUri}`;
      }
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n');

    res.status(200).json({ success: true, message: 'Cập nhật thành công. Vui lòng khởi động lại server.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật cấu hình hệ thống' });
  }
};
