const express = require('express');
const router = express.Router();
const { protect, roleCheck } = require('../middleware/authMiddleware');
const {
  createFolder,
  getProjectFolders,
  updateFolder,
  deleteFolder
} = require('../controllers/folderController');

router.use(protect);

router.post('/', roleCheck(['admin', 'manager']), createFolder);
router.get('/project/:projectId', getProjectFolders);
router.put('/:id', roleCheck(['admin', 'manager']), updateFolder);
router.delete('/:id', roleCheck(['admin', 'manager']), deleteFolder);

module.exports = router;
