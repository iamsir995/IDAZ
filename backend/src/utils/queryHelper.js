/**
 * Helper cho Query Filtering, Search và Pagination chuẩn hóa trong Mongoose.
 */

/**
 * Xây dựng thông số phân trang chuẩn cho Mongoose queries
 * 
 * @param {Object} query - Object req.query từ Express
 * @param {number} defaultLimit - Số lượng item mặc định mỗi trang (mặc định 20)
 * @param {string} defaultSortBy - Trường sắp xếp mặc định ('createdAt')
 * @param {string} defaultOrder - Hướng sắp xếp ('desc' | 'asc')
 */
const buildPagination = (query = {}, defaultLimit = 20, defaultSortBy = 'createdAt', defaultOrder = 'desc') => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || defaultLimit));
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || defaultSortBy;
  const order = query.order === 'asc' ? 1 : -1;

  return {
    page,
    limit,
    skip,
    sort: { [sortBy]: order },
    formatResult: (items, total) => ({
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  };
};

/**
 * Tạo điều kiện tìm kiếm $or theo Regex từ từ khóa
 * 
 * @param {string} search - Từ khóa tìm kiếm
 * @param {string[]} fields - Các trường cần tìm kiếm theo regex
 */
const buildSearchQuery = (search, fields = []) => {
  if (!search || typeof search !== 'string' || !fields.length) return {};
  const trimmed = search.trim();
  if (!trimmed) return {};
  const regex = { $regex: trimmed, $options: 'i' };
  return {
    $or: fields.map(field => ({ [field]: regex }))
  };
};

module.exports = {
  buildPagination,
  buildSearchQuery,
};
