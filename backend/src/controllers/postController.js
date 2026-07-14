const Post = require('../models/Post');

// Lấy danh sách Public (chỉ published)
exports.getPublicPosts = async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const posts = await Post.find({ status: 'published' })
      .populate('author', 'name avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await Post.countDocuments({ status: 'published' });
    
    res.status(200).json({ 
      success: true, 
      data: posts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách bài viết' });
  }
};

// Chi tiết Public
exports.getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await Post.findOneAndUpdate(
      { slug, status: 'published' },
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author', 'name avatar role');
    
    if (!post) return res.status(404).json({ success: false, message: 'Bài viết không tồn tại' });
    
    res.status(200).json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ===================================
// ADMIN APIS
// ===================================

exports.getAllPostsAdmin = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách' });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { title, slug, content, excerpt, coverImage, tags, status, metaTitle, metaDescription } = req.body;
    
    // Nếu chưa có slug, tự sinh từ title
    let postSlug = slug;
    if (!postSlug) {
      postSlug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }

    const exist = await Post.findOne({ slug: postSlug });
    if (exist) {
      return res.status(400).json({ success: false, message: 'Slug (Đường dẫn) đã tồn tại' });
    }

    const post = await Post.create({
      title,
      slug: postSlug,
      content,
      excerpt,
      coverImage,
      tags,
      status,
      metaTitle,
      metaDescription,
      author: req.user.id
    });
    
    res.status(201).json({ success: true, data: post, message: 'Tạo bài viết thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi tạo bài viết' });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!post) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    res.status(200).json({ success: true, data: post, message: 'Cập nhật thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    await Post.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Xóa bài viết thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa' });
  }
};
