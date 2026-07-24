const mongoose = require('mongoose');

/**
 * Middleware kiểm tra ObjectId hợp lệ trong req.params để ngăn ngừa Mongoose CastError và NoSQL Injection
 * @param {string|string[]} paramNames - Tên các params cần kiểm tra (mặc định là 'id')
 */
const validateObjectId = (paramNames = ['id']) => {
  return (req, res, next) => {
    const paramsToCheck = Array.isArray(paramNames) ? paramNames : [paramNames];
    for (const param of paramsToCheck) {
      const id = req.params[param];
      if (id && !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: `Tham số '${param}' không hợp lệ.`
        });
      }
    }
    next();
  };
};

module.exports = validateObjectId;
