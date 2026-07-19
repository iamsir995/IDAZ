const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  clientName: {
    type: String,
    trim: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'designing', 'coding', 'done'],
    default: 'pending'
  },
  deadline: {
    type: Date
  },
  progress: {
    type: Number,
    default: 0
  },
  revenue: {
    type: Number,
    default: 0
  },
  briefId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brief'
  },
  brief: {
    type: String
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  imageUrl: {
    type: String,
    required: false
  },
  projectUrl: {
    type: String
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Project', projectSchema);
