const Asset = require('../models/Asset');
const AuditLog = require('../models/AuditLog');
const Message = require('../models/Message');
const Project = require('../models/Project');
const fs = require('fs');
const path = require('path');

// Hàm Helper để xử lý trùng lặp tên file trong cùng Folder
const getUniqueFilename = async (originalName, projectId, folderId) => {
  let name = originalName;
  let counter = 1;
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);

  while (true) {
    const existing = await Asset.findOne({ 
      projectId, 
      folderId: folderId || null, 
      name 
    });
    
    if (!existing) break;
    
    name = `${baseName} (${counter})${ext}`;
    counter++;
  }
  return name;
};

// @desc    Lấy danh sách Asset theo Project (và tùy chọn thư mục)
// @route   GET /api/assets/project/:projectId?folderId=xxx
// @access  Private
exports.getProjectAssets = async (req, res) => {
  try {
    const { projectId } = req.params;
    let folderId = req.query.folderId;
    if (!folderId || folderId === 'undefined' || folderId === 'null' || folderId === 'root') {
      folderId = null;
    }

    const isGlobal = !projectId || projectId === 'global' || projectId === 'undefined' || projectId === 'null';
    const queryProjectId = isGlobal ? null : projectId;

    const mongoose = require('mongoose');
    if (queryProjectId && !mongoose.Types.ObjectId.isValid(queryProjectId)) {
      return res.status(400).json({ success: false, message: 'Project ID không hợp lệ.' });
    }

    const filter = { projectId: queryProjectId, folderId };
    
    // Nếu Client, chỉ lấy asset của Client đó (hoặc global)
    if (req.user && req.user.role === 'client') {
      // Kho global = tất cả client đều có thể thấy
      if (!isGlobal) {
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
          return res.status(400).json({ success: false, message: 'Project ID không hợp lệ.' });
        }
        const project = await Project.findById(projectId);
        if (!project || !project.clientId || project.clientId.toString() !== req.user._id.toString()) {
          return res.status(403).json({ success: false, message: 'Không có quyền truy cập.' });
        }
      }
      filter.$or = [{ userId: req.user._id }, { userId: null }];
    }

    const assets = await Asset.find(filter)
      .populate('userId', 'name avatar')
      .populate('uploadedBy', 'name avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: assets });
  } catch (error) {
    console.error('[getProjectAssets] Lỗi:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách file.', error: error.message });
  }
};

// @desc    Upload một hoặc nhiều file
// @route   POST /api/assets/upload
// @access  Private
exports.uploadAssets = async (req, res) => {
  try {
    let folderId = req.body.folderId;
    if (folderId === 'undefined' || folderId === 'null' || folderId === '') folderId = null;
    
    let userId = req.body.userId;
    if (userId === 'undefined' || userId === 'null' || userId === '') userId = null;

    const projectId = (!req.body.projectId || req.body.projectId === 'global' || req.body.projectId === 'undefined' || req.body.projectId === 'null') ? null : req.body.projectId;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy file tải lên.' });
    }

    const uploadedAssets = [];

    for (let file of files) {
      // Xác định loại file dựa vào mimetype
      let type = 'other';
      const mime = file.mimetype || '';
      if (mime.startsWith('image/')) type = 'image';
      else if (mime.startsWith('video/')) type = 'video';
      else if (
        mime.includes('pdf') ||
        mime.includes('word') ||
        mime.includes('excel') ||
        mime.includes('powerpoint') ||
        mime.includes('spreadsheet') ||
        mime.includes('presentation') ||
        mime.includes('opendocument')
      ) type = 'document';
      else if (mime.includes('zip') || mime.includes('rar') || mime.includes('7z')) type = 'archive';

      // Upload file qua hybrid uploader (Cloudinary CDN nếu có ENV, hoặc Local HTTPS URL)
      const { uploadToCloudOrLocal } = require('../utils/uploader');
      const uploadResult = await uploadToCloudOrLocal(file, req.body.folder || 'assets', req);
      const fileUrl = uploadResult.url;
      const filePath = uploadResult.filePath;

      // Xử lý trùng lặp tên
      const finalName = await getUniqueFilename(file.originalname, projectId, folderId);

      const asset = await Asset.create({
        name: finalName,
        originalName: file.originalname,
        url: fileUrl,
        filePath,
        type,
        mimeType: mime,
        fileSize: file.size,
        projectId,
        folderId: folderId || null,
        userId: userId || null,
        uploadedBy: req.user._id,
        version: 1
      });

      uploadedAssets.push(asset);

      // Audit Log
      await AuditLog.create({
        action: 'UPLOAD_ASSET',
        assetId: asset._id,
        userId: req.user._id,
        ip: req.ip,
        details: `Tải lên file: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
      });
    }

    // Bot Notification chỉ khi có project thật
    if (projectId && req.user.role !== 'client') {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(projectId)) {
        const project = await Project.findById(projectId);
        if (project) {
          await Message.create({
            projectId,
            senderId: '6a3e3798a84fb09a50dcb800',
            senderName: 'System Bot',
            senderRole: 'system',
            text: `[Cập nhật Tài sản] **${req.user.name}** vừa tải lên ${uploadedAssets.length} file mới vào dự án.`
          });
        }
      }
    }

    res.status(201).json({ success: true, data: uploadedAssets });
  } catch (error) {
    console.error('[uploadAssets] Lỗi:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi khi upload file.', error: error.message });
  }
};

// @desc    Upload một ảnh (dành cho cover, icon, avatar...)
// @route   POST /api/assets/upload-image
// @access  Private
exports.uploadSingleImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy file tải lên.' });
    }

    const folder = req.body.folder || 'posts';
    let folderId = req.body.folderId;
    if (folderId === 'undefined' || folderId === 'null' || folderId === '') folderId = null;

    let projectId = req.body.projectId;
    if (projectId === 'undefined' || projectId === 'null' || projectId === 'global' || projectId === '') projectId = null;
    
    const { uploadToCloudOrLocal } = require('../utils/uploader');
    const uploadResult = await uploadToCloudOrLocal(file, folder, req);
    const url = uploadResult.url;
    const filePath = uploadResult.filePath;
    
    // Auto create Global Asset if no projectId provided
    const asset = await Asset.create({
      name: file.originalname,
      originalName: file.originalname,
      url,
      filePath,
      type: 'image',
      mimeType: file.mimetype,
      fileSize: file.size,
      projectId: projectId || null,
      folderId: folderId || null,
      userId: req.user?._id || null,
      uploadedBy: req.user?._id || null,
      version: 1
    });

    res.status(201).json({
      success: true,
      data: {
        url,
        name: file.originalname,
        size: file.size,
        asset
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải ảnh lên.', error: error.message });
  }
};

// @desc    Upload single file general
// @route   POST /api/assets/upload-single
// @access  Private
exports.uploadSingle = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy file tải lên.' });
    }

    let type = 'other';
    if (file.mimetype.startsWith('image/')) type = 'image';
    else if (file.mimetype.startsWith('video/')) type = 'video';
    else if (file.mimetype.includes('pdf') || file.mimetype.includes('word') || file.mimetype.includes('excel')) type = 'document';

    let folderId = req.body.folderId;
    if (folderId === 'undefined' || folderId === 'null' || folderId === '') folderId = null;

    let projectId = req.body.projectId;
    if (projectId === 'undefined' || projectId === 'null' || projectId === 'global' || projectId === '') projectId = null;

    const { uploadToCloudOrLocal } = require('../utils/uploader');
    const uploadResult = await uploadToCloudOrLocal(file, req.body.folder || 'assets', req);
    const url = uploadResult.url;
    const filePath = uploadResult.filePath;
    
    const asset = await Asset.create({
      name: file.originalname,
      originalName: file.originalname,
      url,
      filePath,
      type,
      mimeType: file.mimetype,
      fileSize: file.size,
      projectId: projectId || null,
      folderId: folderId || null,
      userId: req.user?._id || null,
      uploadedBy: req.user?._id || null,
      version: 1
    });

    res.status(201).json({
      success: true,
      data: {
        url,
        name: file.originalname,
        size: file.size,
        asset
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải file lên.', error: error.message });
  }
};

// @desc    Tạo Link Asset (Figma, GDrive, ...)
// @route   POST /api/assets/link
// @access  Private
exports.createLinkAsset = async (req, res) => {
  try {
    let { name, url, type, folderId, userId } = req.body;
    let projectId = (!req.body.projectId || req.body.projectId === 'global' || req.body.projectId === 'undefined' || req.body.projectId === 'null') ? null : req.body.projectId;
    
    if (folderId === 'undefined' || folderId === 'null' || folderId === '') folderId = null;
    if (userId === 'undefined' || userId === 'null' || userId === '') userId = null;

    const finalName = await getUniqueFilename(name, projectId, folderId);

    const asset = await Asset.create({
      name: finalName,
      originalName: name,
      url,
      type: type || 'link',
      projectId,
      folderId: folderId || null,
      userId: userId || null,
      uploadedBy: req.user._id
    });
    
    res.status(201).json({ success: true, data: asset });
  } catch (error) {
    console.error('[createLinkAsset] Lỗi:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi tạo liên kết.', error: error.message });
  }
};

// @desc    Xóa Asset (kèm xóa file cứng nếu có)
// @route   DELETE /api/assets/:id
// @access  Private
exports.deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await Asset.findById(id);
    
    if (!asset) return res.status(404).json({ success: false, message: 'Không tìm thấy file.' });

    // Client không được xóa file của Agency
    if (req.user.role === 'client' && asset.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Không có quyền xóa file này.' });
    }

    // Xóa file vật lý nếu có
    if (asset.filePath) {
      const fullPath = path.join(__dirname, '../../', asset.filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    await Asset.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'Đã xóa file vĩnh viễn.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa file.' });
  }
};

// @desc    Sửa tên file / chuyển thư mục
// @route   PUT /api/assets/:id
// @access  Private
exports.updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, folderId } = req.body;
    
    const asset = await Asset.findById(id);
    if (!asset) return res.status(404).json({ success: false, message: 'Không tìm thấy file.' });

    // Client không được sửa file của Agency
    if (req.user.role === 'client' && asset.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Không có quyền sửa file này.' });
    }

    if (name) {
      // Check trùng tên
      const existing = await Asset.findOne({
        projectId: asset.projectId,
        folderId: folderId !== undefined ? (folderId || null) : asset.folderId,
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: asset._id }
      });
      if (existing) return res.status(400).json({ success: false, message: 'Tên file đã tồn tại trong thư mục này.' });
      asset.name = name;
    }

    if (folderId !== undefined) {
      asset.folderId = folderId || null;
    }

    await asset.save();
    res.status(200).json({ success: true, data: asset });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật file.' });
  }
};

// @desc    Xóa nhiều Asset cùng lúc
// @route   POST /api/assets/bulk-delete
// @access  Private
exports.bulkDeleteAssets = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ success: false, message: 'Danh sách ID không hợp lệ.' });
    }

    const assets = await Asset.find({ _id: { $in: ids } });
    
    // Validate quyền
    const hasUnauthorized = assets.some(asset => req.user.role === 'client' && asset.uploadedBy.toString() !== req.user._id.toString());
    if (hasUnauthorized) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa một số file trong danh sách này.' });
    }

    // Xóa file cứng
    assets.forEach(asset => {
      if (asset.filePath) {
        const fullPath = path.join(__dirname, '../../', asset.filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    });

    await Asset.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ success: true, message: `Đã xóa ${assets.length} file.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa hàng loạt.' });
  }
};
