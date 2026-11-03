const Application = require('../models/Application');
const Internship = require('../models/Internship');
const User = require('../models/User');
const { sendEmail, emailTemplates } = require('../config/emailService');

const applyForInternship = async (req, res) => {
  try {
    const { internshipId } = req.params;
    const { coverLetter } = req.body;

    if (!req.file) return res.status(400).json({ message: 'Resume required ❌' });

    const internship = await Internship.findById(internshipId);
    if (!internship) return res.status(404).json({ message: 'Internship not found ❌' });

    const existing = await Application.findOne({
      internship: internshipId, student: req.user.id,
    });
    if (existing) return res.status(400).json({ message: 'Already applied ⚠️' });

    const application = await Application.create({
      internship: internshipId,
      student: req.user.id,
      resume: req.file.path,
      coverLetter: coverLetter || '',
    });

    try {
      const student = await User.findById(req.user.id);
      const recruiter = await User.findById(internship.recruiter);
      const sT = emailTemplates.applicationReceived(student.name, internship.title, internship.company);
      sendEmail(student.email, sT.subject, sT.html);
      if (recruiter?.email) {
        const rT = emailTemplates.newApplicant(recruiter.name, student.name, internship.title);
        sendEmail(recruiter.email, rT.subject, rT.html);
      }
    } catch (e) { console.log('Email failed:', e.message); }

    res.status(201).json({ message: 'Applied successfully ✅', application });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ student: req.user.id })
      .populate('internship', 'title company location stipend')
      .sort({ createdAt: -1 });
    res.status(200).json({ count: applications.length, applications });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getRecruiterApplications = async (req, res) => {
  try {
    const internships = await Internship.find({ recruiter: req.user.id }).select('_id');
    const ids = internships.map(i => i._id);
    const applications = await Application.find({ internship: { $in: ids } })
      .populate('student', 'name email skills education')
      .populate('internship', 'title company')
      .sort({ createdAt: -1 });
    res.status(200).json({ count: applications.length, applications });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;
    if (!['pending', 'reviewed', 'accepted', 'rejected'].includes(status))
      return res.status(400).json({ message: 'Invalid status ❌' });

    const app = await Application.findById(applicationId).populate('internship');
    if (!app) return res.status(404).json({ message: 'Not found ❌' });
    if (app.internship.recruiter.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized ❌' });

    app.status = status;
    await app.save();

    try {
      const student = await User.findById(app.student);
      if (student?.email) {
        const t = emailTemplates.statusUpdate(student.name, app.internship.title, status);
        sendEmail(student.email, t.subject, t.html);
      }
    } catch (e) { console.log('Email failed:', e.message); }

    res.status(200).json({ message: `Application ${status} ✅`, application: app });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  applyForInternship, getMyApplications,
  getRecruiterApplications, updateApplicationStatus,
};