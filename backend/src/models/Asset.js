const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  originalName: String,
  url: {
    type: String, // Link hiển thị hoặc download
    required: false
  },
  filePath: {
    type: String, // Đường dẫn vật lý trên server (public/uploads/...)
    required: false
  },
  type: {
    type: String,
    enum: ['image', 'video', 'document', 'design', 'link', 'other'],
    default: 'link'
  },
  mimeType: String,
  fileSize: {
    type: Number, // Theo bytes
    default: 0
  },
  version: {
    type: Number,
    default: 1
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Không bắt buộc nếu Asset thuộc về nội bộ team
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true // Bắt buộc phải thuộc một dự án
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null // Nằm ngoài root nếu null
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Asset', assetSchema);
