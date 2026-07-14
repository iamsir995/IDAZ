const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const recordingController = require('../controllers/recordingController');
const { protect, roleCheck } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/recordings');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'rec-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.post('/upload', protect, roleCheck(['superadmin', 'admin', 'manager']), upload.single('recording'), recordingController.uploadRecording);
router.get('/', protect, roleCheck(['superadmin', 'admin', 'manager']), recordingController.getRecordings);

module.exports = router;
