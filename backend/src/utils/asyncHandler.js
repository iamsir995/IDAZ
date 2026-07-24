/**
 * Helper asyncHandler cho Express Controllers.
 * Bọc các hàm async để tự động bắt lỗi (catch) và chuyển tiếp đến errorHandler middleware của Express.
 * Giúp loại bỏ các khối try-catch lặp đi lặp lại trong controller.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
