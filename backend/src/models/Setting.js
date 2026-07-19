const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  agencyName: {
    type: String,
    default: 'Agency'
  },
  logoUrl: {
    type: String,
    default: ''
  },
  primaryColor: {
    type: String,
    default: '#4f46e5' // default indigo-600
  },
  googleClientId: {
    type: String,
    default: ''
  },
  paymentGateways: {
    bankTransfer: {
      enabled: { type: Boolean, default: true },
      accountName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      bankCode: { type: String, default: '' }, // VD: VCB, TCB, MB
      sepayWebhookKey: { type: String, default: '' } // API Key for SePay integration
    },
    vnpay: {
      enabled: { type: Boolean, default: false },
      tmnCode: { type: String, default: '' },
      hashSecret: { type: String, default: '' },
      url: { type: String, default: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html' }
    },
    momo: {
      enabled: { type: Boolean, default: false },
      partnerCode: { type: String, default: '' },
      accessKey: { type: String, default: '' },
      secretKey: { type: String, default: '' }
    }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Setting', settingSchema);
