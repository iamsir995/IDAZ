const mongoose = require('mongoose');

const PortfolioSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  clientName: {
    type: String,
    default: '',
  },
  challenge: {
    type: String, // Thách thức
    default: '',
  },
  solution: {
    type: String, // Giải pháp
    default: '',
  },
  results: {
    type: String, // Kết quả đạt được
    default: '',
  },
  projectUrl: {
    type: String,
    default: '',
  },
  coverImage: {
    type: String,
    required: true,
  },
  images: [{
    type: String,
  }],
  isFeatured: {
    type: Boolean,
    default: false,
  },
  tags: [{
    type: String,
    trim: true,
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Portfolio', PortfolioSchema);
