const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const { protect, roleCheck } = require('../middleware/authMiddleware');

// Public routes
router.get('/public', portfolioController.getPublicPortfolios);
router.get('/public/:slug', portfolioController.getPortfolioBySlug);

// Admin routes
router.get('/', protect, roleCheck(['admin', 'manager', 'superadmin']), portfolioController.getAllPortfoliosAdmin);
router.post('/', protect, roleCheck(['admin', 'manager', 'superadmin']), portfolioController.createPortfolio);
router.put('/:id', protect, roleCheck(['admin', 'manager', 'superadmin']), portfolioController.updatePortfolio);
router.delete('/:id', protect, roleCheck(['admin', 'superadmin']), portfolioController.deletePortfolio);

module.exports = router;
