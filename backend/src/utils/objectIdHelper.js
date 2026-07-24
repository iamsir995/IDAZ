const mongoose = require('mongoose');

/**
 * Kiểm tra một chuỗi có phải là ObjectId hợp lệ của MongoDB hay không.
 * Tự động loại bỏ các từ khóa đặc biệt như 'null', 'undefined', 'global', 'root', 'all'.
 * 
 * @param {string} id - Chuỗi ID cần kiểm tra
 * @returns {boolean}
 */
const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  const normalized = id.trim().toLowerCase();
  if (['null', 'undefined', 'global', 'root', 'all'].includes(normalized)) {
    return false;
  }
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Trả về Mongoose ObjectId nếu hợp lệ, ngược lại trả về null.
 * 
 * @param {string} id - Chuỗi ID cần parse
 * @returns {mongoose.Types.ObjectId|null}
 */
const parseObjectId = (id) => {
  if (!isValidObjectId(id)) return null;
  return new mongoose.Types.ObjectId(id);
};

module.exports = {
  isValidObjectId,
  parseObjectId,
};
