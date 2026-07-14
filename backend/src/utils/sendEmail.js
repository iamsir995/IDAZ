const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Cấu hình transporter (Dùng Mailtrap cho Dev hoặc Gmail cho Prod)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    auth: {
      user: process.env.SMTP_EMAIL || 'user123', // Thay bằng biến môi trường
      pass: process.env.SMTP_PASSWORD || 'pass123'
    }
  });

  const message = {
    from: `${process.env.FROM_NAME || 'Agency System'} <${process.env.FROM_EMAIL || 'noreply@agency.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || undefined // Hỗ trợ gửi HTML email
  };

  try {
    // Check if using default mock credentials
    if (!process.env.SMTP_HOST || process.env.SMTP_HOST === 'sandbox.smtp.mailtrap.io' || !process.env.SMTP_EMAIL) {
      console.log(`[MOCK EMAIL] To: ${options.email} | Subject: ${options.subject}`);
      console.log(`[MOCK EMAIL CONTENT]: ${options.message || options.html}`);
      return;
    }

    const info = await transporter.sendMail(message);
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Lỗi khi gửi email:', error.message);
  }
};

module.exports = sendEmail;
