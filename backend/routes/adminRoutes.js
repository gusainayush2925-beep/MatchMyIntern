const express = require('express');
const router = express.Router();
const {
  getDashboardStats, getAllUsers, deleteUser,
  getAllInternshipsAdmin, deleteInternshipAdmin, getAllApplicationsAdmin,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

router.get('/stats', protect, isAdmin, getDashboardStats);
router.get('/users', protect, isAdmin, getAllUsers);
router.delete('/users/:userId', protect, isAdmin, deleteUser);
router.get('/internships', protect, isAdmin, getAllInternshipsAdmin);
router.delete('/internships/:internshipId', protect, isAdmin, deleteInternshipAdmin);
router.get('/applications', protect, isAdmin, getAllApplicationsAdmin);
module.exports = router;