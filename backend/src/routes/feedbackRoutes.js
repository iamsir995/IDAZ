const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/files', feedbackController.getClientFiles);
router.get('/files/:fileId', feedbackController.getFileFeedbacks);
router.post('/', feedbackController.createFeedback);
router.put('/:id', feedbackController.updateFeedback);
router.put('/:id/resolve', feedbackController.resolveFeedback);
router.delete('/:id', feedbackController.deleteFeedback);

module.exports = router;
