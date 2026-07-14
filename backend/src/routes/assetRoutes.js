const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Cấu hình Multer (Step 31, 32)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = 'public/uploads/';
    if (req.body.folder || req.query.folder) {
      const subFolder = req.body.folder || req.query.folder;
      // Allow only specific safe folder names
      if (['projects', 'services', 'posts', 'chat', 'portfolios'].includes(subFolder)) {
        folder = `public/uploads/${subFolder}/`;
      }
    }
    const absoluteFolder = path.join(__dirname, '../../', folder);
    // Create directory if it doesn't exist
    if (!require('fs').existsSync(absoluteFolder)) {
      require('fs').mkdirSync(absoluteFolder, { recursive: true });
    }
    cb(null, absoluteFolder);
  },
  filename: function (req, file, cb) {
    // Generate unique name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Chỉ cho phép ảnh, video, tài liệu
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Chỉ hỗ trợ upload các định dạng: Ảnh, Video, Tài liệu an toàn.'));
  }
};

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Giới hạn chung
  fileFilter
});

const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Chỉ hỗ trợ upload các định dạng ảnh: JPG, PNG, GIF, WEBP.'));
  }
};

const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit cho ảnh
  fileFilter: imageFileFilter
});

router.get('/project/:projectId', protect, assetController.getProjectAssets);
router.post('/upload', protect, (req, res, next) => {
  upload.array('files', 10)(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, assetController.uploadAssets);

router.post('/upload-image', protect, (req, res, next) => {
  uploadImage.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, assetController.uploadSingleImage);
router.post('/link', protect, assetController.createLinkAsset);
router.put('/:id', protect, assetController.updateAsset);
router.post('/bulk-delete', protect, assetController.bulkDeleteAssets);
router.delete('/:id', protect, assetController.deleteAsset);
router.post('/upload-single', protect, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Không tìm thấy file tải lên.' });
  }
  res.status(200).json({
    success: true,
    data: {
      url: `/uploads/${req.file.filename}`,
      name: req.file.originalname,
      size: req.file.size
    }
  });
});

module.exports = router;
