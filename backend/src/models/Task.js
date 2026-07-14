const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['account', 'designer', 'developer', 'copywriter', 'manager']
  },
  status: {
    type: String,
    required: true,
    enum: ['todo', 'in_progress', 'reviewing', 'done'],
    default: 'todo'
  },
  project: {
    type: String,
    default: 'Dự án chung'
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  dueDate: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['urgent', 'high', 'normal', 'low'],
    default: 'normal'
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  checklists: [{
    title: String,
    isCompleted: { type: Boolean, default: false }
  }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  timeTracking: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startTime: Date,
    endTime: Date,
    duration: Number // in seconds
  }],
  assets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  }]
});

module.exports = mongoose.model('Task', taskSchema);
