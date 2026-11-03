const express = require('express');
const router = express.Router();
const { createInternship, getAllInternships, getInternshipById, deleteInternship } = require('../controllers/internshipController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createInternship);
router.get('/', getAllInternships);
router.get('/:id', getInternshipById);
router.delete('/:id', protect, deleteInternship);

module.exports = router;