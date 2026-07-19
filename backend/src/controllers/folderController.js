const Folder = require('../models/Folder');
const Asset = require('../models/Asset');
const fs = require('fs');
const path = require('path');

// @desc    Tạo thư mục mới
// @route   POST /api/folders
// @access  Private (Admin/Manager)
exports.createFolder = async (req, res) => {
  try {
    const { name, parentId } = req.body;
    const projectId = req.body.projectId === 'global' ? null : req.body.projectId;
    
    // Check trùng tên thư mục trong cùng parent
    const existing = await Folder.findOne({ 
      projectId, 
      parentId: parentId || null, 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Tên thư mục đã tồn tại trong cấp này' });
    }

    const folder = await Folder.create({
      name,
      projectId,
      parentId: parentId || null,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, data: folder });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi tạo thư mục', error: error.message });
  }
};

// @desc    Lấy danh sách thư mục theo Project (Cấu trúc phẳng, FE sẽ tự dựng cây)
// @route   GET /api/folders/project/:projectId
// @access  Private
exports.getProjectFolders = async (req, res) => {
  try {
    const { projectId } = req.params;
    const queryProjectId = projectId === 'global' ? null : projectId;
    
    if (queryProjectId && req.user && req.user.role === 'client') {
      const Project = require('../models/Project');
      const project = await Project.findById(queryProjectId);
      if (!project || project.clientId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Không có quyền truy cập.' });
      }
    }
    
    const folders = await Folder.find({ projectId: queryProjectId }).sort('name');
    res.status(200).json({ success: true, data: folders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách thư mục' });
  }
};

// @desc    Đổi tên thư mục
// @route   PUT /api/folders/:id
// @access  Private (Admin/Manager)
exports.updateFolder = async (req, res) => {
  try {
    const { name, parentId } = req.body;
    const folder = await Folder.findById(req.params.id);
    
    if (!folder) return res.status(404).json({ success: false, message: 'Không tìm thấy thư mục' });

    // Check trùng tên nếu có đổi tên hoặc đổi parentId
    if (name && (name !== folder.name || (parentId !== undefined && parentId !== folder.parentId?.toString()))) {
      const existing = await Folder.findOne({
        projectId: folder.projectId,
        parentId: parentId !== undefined ? (parentId || null) : folder.parentId,
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: folder._id }
      });

      if (existing) return res.status(400).json({ success: false, message: 'Tên thư mục đã tồn tại' });
    }

    if (name) folder.name = name;
    if (parentId !== undefined) folder.parentId = parentId || null;
    
    await folder.save();

    res.status(200).json({ success: true, data: folder });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật thư mục' });
  }
};

// @desc    Xóa thư mục (Xóa luôn cả folder con và file bên trong)
// @route   DELETE /api/folders/:id
// @access  Private (Admin/Manager)
exports.deleteFolder = async (req, res) => {
  try {
    const folderId = req.params.id;
    
    // Hàm đệ quy lấy tất cả folder con
    const getAllChildrenIds = async (fId) => {
      const children = await Folder.find({ parentId: fId });
      let ids = [fId];
      for (let child of children) {
        const childIds = await getAllChildrenIds(child._id);
        ids = ids.concat(childIds);
      }
      return ids;
    };

    const folderIdsToDelete = await getAllChildrenIds(folderId);

    // Xóa vật lý tất cả file trong các thư mục này
    const assetsToDelete = await Asset.find({ folderId: { $in: folderIdsToDelete } });
    assetsToDelete.forEach(asset => {
      if (asset.filePath) {
        const fullPath = path.join(__dirname, '../../', asset.filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    });

    // Xóa record Asset
    await Asset.deleteMany({ folderId: { $in: folderIdsToDelete } });
    
    // Xóa record Folder
    await Folder.deleteMany({ _id: { $in: folderIdsToDelete } });

    res.status(200).json({ success: true, message: 'Đã xóa thư mục và các nội dung bên trong' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa thư mục', error: error.message });
  }
};
