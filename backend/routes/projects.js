const express = require('express');
const { body } = require('express-validator');
const {
  createProject,
  getAllProjects,
  getProject,
  updateProject,
  deleteProject
} = require('../controllers/projectController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional().trim(),
  body('color').optional().trim()
], createProject);

router.get('/', auth, getAllProjects);
router.get('/:id', auth, getProject);

router.put('/:id', auth, [
  body('name').optional().trim().notEmpty().withMessage('Project name cannot be empty'),
  body('description').optional().trim(),
  body('status').optional().isIn(['active', 'completed', 'archived']).withMessage('Invalid status'),
  body('color').optional().trim()
], updateProject);

router.delete('/:id', auth, deleteProject);

module.exports = router;
