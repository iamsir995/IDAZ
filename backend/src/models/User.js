const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    minlength: 6,
    select: false // Mặc định không trả về password khi query
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'manager', 'developer', 'designer', 'account', 'copywriter', 'marketing', 'sales', 'client'],
    default: 'client'
  },
  avatar: {
    type: String,
    default: ''
  },
  coverImage: {
    type: String,
    default: ''
  },
  statusText: {
    type: String,
    default: 'Đang làm việc'
  },
  phone: {
    type: String,
    default: ''
  },
  company: {
    type: String,
    default: ''
  },
  customerStatus: {
    type: String,
    enum: ['lead', 'active', 'vip'],
    default: 'lead'
  },
  revenue: {
    type: Number,
    default: 0
  },
  bio: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  is2FAEnabled: {
    type: Boolean,
    default: false // Mặc định tắt cho người mới
  },
  twoFactorCode: {
    type: String,
    select: false // Không trả về khi query
  },
  twoFactorExpires: {
    type: Date,
    select: false
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  socialLinks: {
    linkedin: { type: String, default: '' },
    facebook: { type: String, default: '' },
    portfolio: { type: String, default: '' }
  },
  skills: [{ type: String }],
  activityLog: [{
    action: String,
    timestamp: { type: Date, default: Date.now }
  }],
  lastLocation: {
    lat: Number,
    lng: Number,
    address: String,
    updatedAt: Date
  },
  loginAttempts: {
    type: Number,
    required: true,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password trước khi lưu vào database
userSchema.pre('save', async function() {
  // Nếu password không bị thay đổi hoặc không có password thì bỏ qua
  if (!this.isModified('password') || !this.password) return;

  // Tạo chuỗi salt với độ khó 12
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// So sánh password khi đăng nhập
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
