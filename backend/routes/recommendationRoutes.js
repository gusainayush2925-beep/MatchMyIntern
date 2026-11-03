const express = require('express');
const router = express.Router();
const { getRecommendedInternships } = require('../controllers/recommendationController');
const { protect } = require('../middleware/authMiddleware');
router.get('/', protect, getRecommendedInternships);
module.exports = router;