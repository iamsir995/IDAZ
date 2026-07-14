const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String
  },
  icon: {
    type: String
  },
  price: {
    type: String,
    default: "Liên hệ báo giá"
  },
  content: {
    type: String,
    default: ""
  },
  features: [{
    type: String
  }],
  benefits: [{
    type: String
  }],
  deliverables: [{
    type: String
  }],
  pricingPlans: [{
    name: String,
    price: String,
    description: String,
    isPopular: { type: Boolean, default: false },
    features: [String]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Service', serviceSchema);
