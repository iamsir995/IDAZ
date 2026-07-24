/**
 * Global Error Handler Middleware
 * Bịt các chi tiết lỗi nhạy cảm (stack trace, internal message) khi chạy ở môi trường Production.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status;
  if (!statusCode || statusCode < 400) {
    statusCode = res.statusCode >= 400 ? res.statusCode : 500;
  }

  const isProduction = process.env.NODE_ENV === 'production';

  console.error(`[Error Handler] ${req.method} ${req.originalUrl}:`, err);

  const message = isProduction && statusCode === 500
    ? 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.'
    : (err.message || 'Lỗi không xác định');

  res.status(statusCode).json({
    success: false,
    message,
    ...(!isProduction && { stack: err.stack, detail: err.message })
  });
};

module.exports = errorHandler;

