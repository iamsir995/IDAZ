const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getUserChannels,
  createOrGetProjectChannel
} = require('../controllers/channelController');

router.use(protect);

router.route('/')
  .get(getUserChannels);

router.route('/project')
  .post(createOrGetProjectChannel);

module.exports = router;
