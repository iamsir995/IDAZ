const express = require('express');
const { getTasks, createTask, updateTaskStatus, deleteTask, updateTask, addChecklist, toggleChecklist, addComment, startTimeTracking, stopTimeTracking } = require('../controllers/taskController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // Bảo vệ mọi route task

router.route('/')
  .get(getTasks)
  .post(adminOnly, createTask);

router.route('/:id/status')
  .put(updateTaskStatus);

router.route('/:id')
  .put(adminOnly, updateTask)
  .delete(adminOnly, deleteTask);

router.route('/:id/checklists')
  .post(addChecklist);

router.route('/:id/checklists/:checklistId')
  .put(toggleChecklist);

router.route('/:id/comments')
  .post(addComment);

router.route('/:id/time/start')
  .post(startTimeTracking);

router.route('/:id/time/stop')
  .post(stopTimeTracking);

module.exports = router;
