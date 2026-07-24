import SHA256 from "crypto-js/sha256";

/**
 * Hash mật khẩu bằng SHA256 đồng nhất ở Frontend trước khi gửi lên API
 * @param {string} password 
 * @returns {string}
 */
export const hashPassword = (password) => {
  if (!password) return "";
  return SHA256(password).toString();
};
