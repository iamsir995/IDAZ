const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { protect, roleCheck } = require('../middleware/authMiddleware');

// Public routes
router.get('/public', postController.getPublicPosts);
router.get('/public/:slug', postController.getPostBySlug);

// Admin routes
router.get('/', protect, roleCheck(['admin', 'manager', 'superadmin']), postController.getAllPostsAdmin);
router.post('/', protect, roleCheck(['admin', 'manager', 'superadmin']), postController.createPost);
router.put('/:id', protect, roleCheck(['admin', 'manager', 'superadmin']), postController.updatePost);
router.delete('/:id', protect, roleCheck(['admin', 'superadmin']), postController.deletePost);

module.exports = router;
