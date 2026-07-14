const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Client Routes
router.get('/my-projects', protect, projectController.getMyProjects);
router.get('/my-stats', protect, projectController.getMyDashboardStats);

// Admin Routes
router.get('/', protect, adminOnly, projectController.getAllProjects);
router.get('/client/:clientId', protect, adminOnly, projectController.getProjectsByClient);
router.post('/', protect, adminOnly, projectController.createProject);
router.post('/ai-generate', protect, adminOnly, projectController.aiGenerateDescription);
router.put('/:id', protect, adminOnly, projectController.updateProject);
router.delete('/:id', protect, adminOnly, projectController.deleteProject);

module.exports = router;
