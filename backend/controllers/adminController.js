const User = require('../models/User');
const Internship = require('../models/Internship');
const Application = require('../models/Application');

const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalRecruiters = await User.countDocuments({ role: 'recruiter' });
    const totalInternships = await Internship.countDocuments();
    const totalApplications = await Application.countDocuments();
    const pendingApplications = await Application.countDocuments({ status: 'pending' });
    res.json({ totalUsers, totalStudents, totalRecruiters, totalInternships, totalApplications, pendingApplications });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ count: users.length, users });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'Not found ❌' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot delete admin ❌' });
    await User.findByIdAndDelete(req.params.userId);
    res.json({ message: 'User deleted ✅' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const getAllInternshipsAdmin = async (req, res) => {
  try {
    const internships = await Internship.find()
      .populate('recruiter', 'name email companyName').sort({ createdAt: -1 });
    res.json({ count: internships.length, internships });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const deleteInternshipAdmin = async (req, res) => {
  try {
    await Application.deleteMany({ internship: req.params.internshipId });
    await Internship.findByIdAndDelete(req.params.internshipId);
    res.json({ message: 'Internship deleted ✅' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const getAllApplicationsAdmin = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate('student', 'name email')
      .populate('internship', 'title company')
      .sort({ createdAt: -1 });
    res.json({ count: applications.length, applications });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

module.exports = {
  getDashboardStats, getAllUsers, deleteUser,
  getAllInternshipsAdmin, deleteInternshipAdmin, getAllApplicationsAdmin,
};