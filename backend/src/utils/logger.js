const AuditLog = require('../models/AuditLog');

const logAudit = async (user, action, details, req = null) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null;
    await AuditLog.create({
      user: user ? (user._id || user.id) : null,
      userName: user ? user.name : 'System',
      userRole: user ? user.role : 'system',
      action,
      details,
      ipAddress
    });
  } catch (err) {
    console.error('Lỗi khi lưu Audit Log:', err);
  }
};

module.exports = { logAudit };
