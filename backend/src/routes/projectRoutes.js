const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { protect, adminOnly, roleCheck } = require('../middleware/authMiddleware');

const allStaff = roleCheck(['superadmin', 'admin', 'manager', 'developer', 'designer', 'account', 'copywriter', 'marketing', 'sales']);
const projectManagers = roleCheck(['superadmin', 'admin', 'manager', 'account', 'sales']);

// Client Routes
router.get('/my-projects', protect, projectController.getMyProjects);
router.get('/my-stats', protect, projectController.getMyDashboardStats);

// Admin / Staff Routes
router.get('/', protect, allStaff, projectController.getAllProjects);
router.get('/client/:clientId', protect, allStaff, projectController.getProjectsByClient);
router.post('/', protect, projectManagers, projectController.createProject);
router.post('/ai-generate', protect, projectManagers, projectController.aiGenerateDescription);
router.put('/:id', protect, projectManagers, projectController.updateProject);
router.delete('/:id', protect, projectManagers, projectController.deleteProject);

module.exports = router;
