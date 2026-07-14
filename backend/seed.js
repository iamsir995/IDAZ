const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

const seedDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/agency_platform_db');
    
    console.log('Đã kết nối MongoDB để tạo tài khoản mẫu...');

    // Mã hóa mật khẩu chung
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    // 1. Tạo Admin
    const adminExists = await User.findOne({ email: 'admin@agency.com' });
    if (!adminExists) {
      await User.create({
        name: 'Giám đốc Admin',
        email: 'admin@agency.com',
        password: hashedPassword,
        role: 'admin',
        is2FAEnabled: false
      });
      console.log('✅ Đã tạo tài khoản Admin: admin@agency.com / pass: 123456');
    } else {
      console.log('ℹ️ Tài khoản Admin đã tồn tại.');
    }

    // 2. Tạo User Mẫu
    const clientExists = await User.findOne({ email: 'client@agency.com' });
    if (!clientExists) {
      await User.create({
        name: 'Khách hàng VIP',
        email: 'client@agency.com',
        password: hashedPassword,
        role: 'client',
        is2FAEnabled: false
      });
      console.log('✅ Đã tạo tài khoản Khách hàng: client@agency.com / pass: 123456');
    } else {
      console.log('ℹ️ Tài khoản Khách hàng đã tồn tại.');
    }

    console.log('Hoàn tất!');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi tạo tài khoản:', error);
    process.exit(1);
  }
};

seedDB();
