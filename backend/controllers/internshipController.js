const Internship = require('../models/Internship');
const Application = require('../models/Application');

const createInternship = async (req, res) => {
  try {
    const data = { ...req.body, recruiter: req.user.id };
    const internship = await Internship.create(data);
    res.status(201).json({ message: 'Internship created ✅', internship });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllInternships = async (req, res) => {
  try {
    const { search, location, skills, company, sort, page = 1, limit = 50 } = req.query;
    let query = {};

    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
    if (location) query.location = { $regex: location, $options: 'i' };
    if (company) query.company = { $regex: company, $options: 'i' };
    if (skills) {
      const arr = skills.split(',').map(s => s.trim());
      query.skillsRequired = { $in: arr.map(s => new RegExp(s, 'i')) };
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'title') sortOption = { title: 1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Internship.countDocuments(query);
    const internships = await Internship.find(query)
      .populate('recruiter', 'name companyName email')
      .sort(sortOption).skip(skip).limit(parseInt(limit));

    res.status(200).json({
      count: internships.length, total, page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)), internships,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getInternshipById = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id)
      .populate('recruiter', 'name companyName email');
    if (!internship) return res.status(404).json({ message: 'Not found ❌' });
    res.status(200).json({ internship });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ NEW: Delete Internship (Recruiter/Admin only)
const deleteInternship = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) return res.status(404).json({ message: 'Not found ❌' });

    if (internship.recruiter.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized ❌' });

    await Application.deleteMany({ internship: internship._id });
    await Internship.findByIdAndDelete(req.params.id);

    res.json({ message: 'Internship deleted ✅' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createInternship, getAllInternships, getInternshipById, deleteInternship };