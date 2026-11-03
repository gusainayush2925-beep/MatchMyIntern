const express = require('express');
const router = express.Router();
const {
  applyForInternship, getMyApplications,
  getRecruiterApplications, updateApplicationStatus,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/apply/:internshipId', protect, upload.single('resume'), applyForInternship);
router.get('/my', protect, getMyApplications);
router.get('/recruiter/all', protect, getRecruiterApplications);
router.put('/:applicationId/status', protect, updateApplicationStatus);
module.exports = router;