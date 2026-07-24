/**
 * Safe Error Response Helper cho Controller
 * Che giấu thông tin lỗi chi tiết trong môi trường Production để chống lộ thông tin hệ thống (Information Disclosure).
 */
const sendErrorResponse = (res, statusCode = 500, userMessage = 'Đã xảy ra lỗi máy chủ.', error = null) => {
  if (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[Controller Error ${statusCode}] ${userMessage}:`, error);
    } else {
      console.error(`[Controller Error ${statusCode}] ${userMessage}:`, error.message);
    }
  }

  const isProduction = process.env.NODE_ENV === 'production';

  return res.status(statusCode).json({
    success: false,
    message: userMessage,
    ...(!isProduction && error && { detail: error.message })
  });
};

module.exports = sendErrorResponse;
