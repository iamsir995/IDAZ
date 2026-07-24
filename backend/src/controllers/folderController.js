const Folder = require('../models/Folder');
const Asset = require('../models/Asset');
const Project = require('../models/Project');
const fs = require('fs');
const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const { isValidObjectId } = require('../utils/objectIdHelper');

// @desc    Tạo thư mục mới
// @route   POST /api/folders
// @access  Private (Admin/Manager)
exports.createFolder = asyncHandler(async (req, res) => {
  const { name, parentId } = req.body;
  const projectId = req.body.projectId === 'global' ? null : req.body.projectId;

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
});

// @desc    Lấy danh sách thư mục theo Project (Cấu trúc phẳng)
// @route   GET /api/folders/project/:projectId
// @access  Private
exports.getProjectFolders = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const isGlobal = !projectId || projectId === 'global' || projectId === 'undefined' || projectId === 'null';
  const queryProjectId = isGlobal ? null : projectId;

  if (queryProjectId && !isValidObjectId(queryProjectId)) {
    return res.status(400).json({ success: false, message: 'Project ID không hợp lệ.' });
  }

  if (queryProjectId && req.user && req.user.role === 'client') {
    const project = await Project.findById(queryProjectId);
    if (!project || project.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập.' });
    }
  }

  const folders = await Folder.find({ projectId: queryProjectId }).sort('name');
  res.status(200).json({ success: true, data: folders });
});

// @desc    Đổi tên thư mục
// @route   PUT /api/folders/:id
// @access  Private (Admin/Manager)
exports.updateFolder = asyncHandler(async (req, res) => {
  const { name, parentId } = req.body;
  const folder = await Folder.findById(req.params.id);

  if (!folder) return res.status(404).json({ success: false, message: 'Không tìm thấy thư mục' });

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
});

// @desc    Xóa thư mục (Xóa luôn cả folder con và file bên trong)
// @route   DELETE /api/folders/:id
// @access  Private (Admin/Manager)
exports.deleteFolder = asyncHandler(async (req, res) => {
  const folderId = req.params.id;

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

  const assetsToDelete = await Asset.find({ folderId: { $in: folderIdsToDelete } });
  assetsToDelete.forEach(asset => {
    if (asset.filePath) {
      const fullPath = path.join(__dirname, '../../', asset.filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
  });

  await Asset.deleteMany({ folderId: { $in: folderIdsToDelete } });
  await Folder.deleteMany({ _id: { $in: folderIdsToDelete } });

  res.status(200).json({ success: true, message: 'Đã xóa thư mục và các nội dung bên trong' });
});
