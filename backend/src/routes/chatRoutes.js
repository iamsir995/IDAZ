const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/contacts', protect, chatController.getChatContacts);
router.get('/support-channel', protect, chatController.getOrCreateSupportChannel);
router.get('/:userId', protect, chatController.getChatHistory); // backward compatibility
router.get('/channels/:channelId/messages', protect, chatController.getChannelMessages);
router.post('/messages', protect, chatController.sendMessage);
router.put('/messages/:id', protect, chatController.updateMessage);
router.delete('/messages/:id', protect, chatController.deleteMessage);
router.put('/messages/:id/pin', protect, chatController.togglePinMessage);
router.put('/messages/:id/react', protect, chatController.reactToMessage);

module.exports = router;
