const Portfolio = require('../models/Portfolio');

// Lấy danh sách Public
exports.getPublicPortfolios = async (req, res) => {
  try {
    const { category, limit = 20 } = req.query;
    let query = {};
    if (category) query.category = category;
    
    const portfolios = await Portfolio.find(query)
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(parseInt(limit));
      
    res.status(200).json({ success: true, data: portfolios });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách Portfolio' });
  }
};

// Lấy chi tiết Public theo slug
exports.getPortfolioBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const portfolio = await Portfolio.findOne({ slug });
    if (!portfolio) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.status(200).json({ success: true, data: portfolio });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ===================================
// ADMIN APIS
// ===================================

exports.getAllPortfoliosAdmin = async (req, res) => {
  try {
    const portfolios = await Portfolio.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: portfolios });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách' });
  }
};

exports.createPortfolio = async (req, res) => {
  try {
    const { title, slug, description, category, clientName, challenge, solution, results, projectUrl, coverImage, images, isFeatured, tags } = req.body;
    
    let itemSlug = slug;
    if (!itemSlug) {
      itemSlug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }

    const exist = await Portfolio.findOne({ slug: itemSlug });
    if (exist) {
      return res.status(400).json({ success: false, message: 'Slug đã tồn tại' });
    }

    const item = await Portfolio.create({
      title, slug: itemSlug, description, category, clientName, challenge, solution, results, projectUrl, coverImage, images, isFeatured, tags
    });
    
    res.status(201).json({ success: true, data: item, message: 'Tạo dự án thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi tạo' });
  }
};

exports.updatePortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Portfolio.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.status(200).json({ success: true, data: item, message: 'Cập nhật thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật' });
  }
};

exports.deletePortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    await Portfolio.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Xóa dự án thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa' });
  }
};
