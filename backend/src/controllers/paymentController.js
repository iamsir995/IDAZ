const Setting = require('../models/Setting');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const Project = require('../models/Project');
const crypto = require('crypto');
const querystring = require('querystring');

exports.getPaymentMethods = async (req, res) => {
  try {
    const setting = await Setting.findOne();
    if (!setting || !setting.paymentGateways) {
      return res.status(200).json({ success: true, data: [] });
    }

    const gateways = setting.paymentGateways;
    const availableMethods = [];

    if (gateways.bankTransfer?.enabled) {
      availableMethods.push({
        id: 'bankTransfer',
        name: 'Chuyển khoản Ngân hàng',
        icon: 'Building',
        details: {
          accountName: gateways.bankTransfer.accountName,
          accountNumber: gateways.bankTransfer.accountNumber,
          bankCode: gateways.bankTransfer.bankCode
        }
      });
    }

    if (gateways.vnpay?.enabled) {
      availableMethods.push({
        id: 'vnpay',
        name: 'Thanh toán VNPay',
        icon: 'CreditCard'
      });
    }

    if (gateways.momo?.enabled) {
      availableMethods.push({
        id: 'momo',
        name: 'Ví MoMo',
        icon: 'Wallet'
      });
    }

    res.status(200).json({ success: true, data: availableMethods });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải phương thức thanh toán' });
  }
};

exports.createCheckoutSession = async (req, res) => {
  try {
    const { invoiceId, method } = req.body;
    const invoice = await Invoice.findById(invoiceId).populate('userId');

    if (!invoice) return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn.' });
    if (invoice.status === 'paid') return res.status(400).json({ success: false, message: 'Hóa đơn đã được thanh toán.' });

    // Client security
    if (req.user.role === 'client' && invoice.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập.' });
    }

    const setting = await Setting.findOne();
    const gateways = setting?.paymentGateways || {};

    let checkoutUrl = '';
    let checkoutData = null;

    if (method === 'vnpay' && gateways.vnpay?.enabled) {
      // VNPay Logic
      let ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const tmnCode = gateways.vnpay.tmnCode;
      const secretKey = gateways.vnpay.hashSecret;
      let vnpUrl = gateways.vnpay.url || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
      const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/client/invoices/${invoice._id}?vnpay_return=true`;

      let date = new Date();
      let createDate = date.toISOString().replace(/T|:|-|\..+/g, '').substring(0,14);

      // Using simple orderInfo
      let orderId = invoice.invoiceNumber + '_' + Date.now();

      let vnp_Params = {
        'vnp_Version': '2.1.0',
        'vnp_Command': 'pay',
        'vnp_TmnCode': tmnCode,
        'vnp_Locale': 'vn',
        'vnp_CurrCode': 'VND',
        'vnp_TxnRef': orderId,
        'vnp_OrderInfo': `Thanh toan hoa don ${invoice.invoiceNumber}`,
        'vnp_OrderType': 'other',
        'vnp_Amount': invoice.amount * 100, // VNPay requires amount * 100
        'vnp_ReturnUrl': returnUrl,
        'vnp_IpAddr': ipAddr,
        'vnp_CreateDate': createDate
      };

      vnp_Params = Object.keys(vnp_Params).sort().reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
      }, {});

      const signData = querystring.stringify(vnp_Params, { encode: false });
      const hmac = crypto.createHmac('sha512', secretKey);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex'); 
      vnp_Params['vnp_SecureHash'] = signed;
      vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

      checkoutUrl = vnpUrl;
      
    } else if (method === 'bankTransfer' && gateways.bankTransfer?.enabled) {
      // Generate VietQR format
      const { bankCode, accountNumber, accountName } = gateways.bankTransfer;
      const qrData = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png?amount=${invoice.amount}&addInfo=${invoice.invoiceNumber}&accountName=${encodeURIComponent(accountName)}`;
      checkoutData = { qrUrl: qrData };
    } else {
      return res.status(400).json({ success: false, message: 'Phương thức thanh toán không hỗ trợ hoặc chưa được bật.' });
    }

    res.status(200).json({ success: true, url: checkoutUrl, data: checkoutData });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tạo thanh toán', error: error.message });
  }
};

exports.webhookCallback = async (req, res) => {
  try {
    const { method } = req.params;
    const setting = await Setting.findOne();
    const gateways = setting?.paymentGateways || {};

    if (method === 'vnpay') {
      const vnp_Params = req.query || req.body;
      const secureHash = vnp_Params['vnp_SecureHash'];

      delete vnp_Params['vnp_SecureHash'];
      delete vnp_Params['vnp_SecureHashType'];

      const sortedParams = Object.keys(vnp_Params).sort().reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
      }, {});

      const secretKey = gateways.vnpay?.hashSecret;
      if (!secretKey) return res.status(400).json({ RspCode: '99', Message: 'System not config' });

      const signData = querystring.stringify(sortedParams, { encode: false });
      const hmac = crypto.createHmac('sha512', secretKey);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      if (secureHash === signed) {
        if (vnp_Params['vnp_ResponseCode'] === '00') {
          // Thanh toán thành công
          const txnRef = vnp_Params['vnp_TxnRef'];
          const invoiceNumber = txnRef.split('_')[0];

          const invoice = await Invoice.findOne({ invoiceNumber });
          if (invoice && invoice.status !== 'paid') {
            invoice.status = 'paid';
            await invoice.save();

            await User.findByIdAndUpdate(invoice.userId, { $inc: { revenue: invoice.amount } });
            if (invoice.projectId) {
              await Project.findByIdAndUpdate(invoice.projectId, { $inc: { revenue: invoice.amount } });
            }

            // Real-time Notification
            const io = req.app.get('io');
            if (io) {
              io.emit('new_notification', {
                _id: `sys-${Date.now()}`,
                type: 'invoice',
                title: 'Thanh toán thành công qua VNPay 💰',
                message: `Khách hàng vừa thanh toán hóa đơn ${invoice.invoiceNumber}.`,
                createdAt: new Date(),
                read: false
              });
              io.emit('invoice_paid', invoice);
              io.emit('dashboard_refresh');
            }
          }
          return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
        } else {
          return res.status(200).json({ RspCode: '00', Message: 'Success with error code' });
        }
      } else {
        return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
      }
    }

    if (method === 'sepay') {
      const apiKey = gateways.bankTransfer?.sepayWebhookKey;
      if (!apiKey) return res.status(400).json({ success: false, message: 'SePay is not configured' });

      // Verify Authorization Header
      const authHeader = req.headers['authorization'];
      if (!authHeader || authHeader !== `Apikey ${apiKey}`) {
        return res.status(401).json({ success: false, message: 'Unauthorized webhook' });
      }

      const { transferAmount, content } = req.body;
      if (!content || transferAmount === undefined) {
        return res.status(400).json({ success: false, message: 'Invalid payload' });
      }

      // Extract invoice number using Regex, assuming format INV-xxxxxx
      const match = content.match(/(INV-\d+)/i);
      if (!match) {
        return res.status(200).json({ success: true, message: 'No invoice code found in content' });
      }
      
      const invoiceNumber = match[1].toUpperCase();
      const invoice = await Invoice.findOne({ invoiceNumber });

      if (!invoice) {
        return res.status(200).json({ success: true, message: 'Invoice not found' });
      }

      if (invoice.status === 'paid') {
        return res.status(200).json({ success: true, message: 'Invoice already paid' });
      }

      if (Number(transferAmount) >= invoice.amount) {
        invoice.status = 'paid';
        await invoice.save();

        await User.findByIdAndUpdate(invoice.userId, { $inc: { revenue: invoice.amount } });
        if (invoice.projectId) {
          await Project.findByIdAndUpdate(invoice.projectId, { $inc: { revenue: invoice.amount } });
        }

        // Real-time Notification
        const io = req.app.get('io');
        if (io) {
          io.emit('new_notification', {
            _id: `sys-${Date.now()}`,
            type: 'invoice',
            title: 'Thanh toán thành công qua Chuyển khoản (SePay) 💰',
            message: `Khách hàng vừa chuyển khoản thanh toán hóa đơn ${invoice.invoiceNumber}.`,
            createdAt: new Date(),
            read: false
          });
          io.emit('invoice_paid', invoice);
          io.emit('dashboard_refresh');
        }
        return res.status(200).json({ success: true, message: 'Payment confirmed' });
      } else {
        return res.status(200).json({ success: true, message: 'Transfer amount less than invoice amount' });
      }
    }

    res.status(400).json({ success: false, message: 'Webhook không hợp lệ' });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
