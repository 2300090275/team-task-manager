const express = require('express');
const { body } = require('express-validator');
const {
  createTask,
  getAllTasks,
  getTask,
  updateTask,
  deleteTask,
  getDashboardStats
} = require('../controllers/taskController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('description').optional().trim(),
  body('project').notEmpty().withMessage('Project ID is required'),
  body('status').optional().isIn(['todo', 'in-progress', 'review', 'done']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority')
], createTask);

router.get('/dashboard/stats', auth, getDashboardStats);
router.get('/', auth, getAllTasks);
router.get('/:id', auth, getTask);

router.put('/:id', auth, [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim(),
  body('status').optional().isIn(['todo', 'in-progress', 'review', 'done']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority')
], updateTask);

router.delete('/:id', auth, deleteTask);

module.exports = router;
