const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // May be null for system/anonymous actions
  },
  userName: {
    type: String,
    required: false
  },
  userRole: {
    type: String,
    required: false
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  details: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
