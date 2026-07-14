const mongoose = require('mongoose');

const briefSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  industry: {
    type: String,
    required: true
  },
  targetAudience: {
    type: String
  },
  brandPersonality: [{
    type: String // Ví dụ: 'Sang trọng', 'Tối giản', 'Năng động'
  }],
  competitors: {
    type: String
  },
  additionalNotes: {
    type: String
  },
  budget: {
    type: String // Ví dụ: "50tr - 100tr"
  },
  timeline: {
    type: String // Ví dụ: "1 tháng", "Ngay lập tức"
  },
  serviceIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  attachments: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['draft', 'submitted', 'reviewed', 'approved', 'rejected'],
    default: 'submitted'
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Brief', briefSchema);
