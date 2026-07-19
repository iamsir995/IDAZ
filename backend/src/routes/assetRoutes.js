const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Cấu hình Multer (Step 31, 32)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    let folder = `public/uploads/${yearMonth}/`;
    
    if (req.body.folder || req.query.folder) {
      const subFolder = req.body.folder || req.query.folder;
      if (['projects', 'services', 'posts', 'chat', 'portfolios'].includes(subFolder)) {
        folder = `public/uploads/${subFolder}/${yearMonth}/`;
      }
    }
    const absoluteFolder = path.join(__dirname, '../../', folder);
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
  // Cho phép nhiều định dạng file agency hơn, và bỏ check mimetype strict vì hay lỗi
  const allowedExts = /jpeg|jpg|png|gif|webp|svg|mp4|webm|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|ai|psd|eps|csv|txt|json|fig|sketch|xd/;
  const extname = allowedExts.test(path.extname(file.originalname).toLowerCase());

  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('Định dạng file không được hỗ trợ.'));
  }
};

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Giới hạn chung
  fileFilter
});

const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg|heic|heif|pdf|doc|docx|xls|xlsx|ppt|pptx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('Chỉ hỗ trợ upload: JPG, PNG, GIF, WEBP, SVG, HEIC và các file Văn phòng (PDF, DOC, XLS, PPT).'));
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
router.post('/upload-single', protect, upload.single('file'), assetController.uploadSingle);

module.exports = router;
