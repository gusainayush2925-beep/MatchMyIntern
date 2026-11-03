const User = require('../models/User');
const Internship = require('../models/Internship');
const { calculateMatchScore } = require('../services/skillMatchService');

const getRecommendedInternships = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    if (!student) return res.status(404).json({ message: 'Not found ❌' });

    const internships = await Internship.find().populate('recruiter', 'name companyName');

    const scored = internships.map(i => ({
      ...i.toObject(),
      matchScore: calculateMatchScore(student.skills, i.skillsRequired),
    }));
    scored.sort((a, b) => b.matchScore - a.matchScore);

    res.status(200).json({
      count: scored.slice(0, 10).length,
      studentSkills: student.skills,
      recommendations: scored.slice(0, 10),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getRecommendedInternships };