const User = require('../models/User');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found ❌' });
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found ❌' });

    const fields = ['phone', 'bio', 'skills', 'education', 'experience',
      'projects', 'certifications', 'companyName', 'companyWebsite', 'designation'];

    fields.forEach(f => {
      if (req.body[f] !== undefined) user[f] = req.body[f];
    });

    await user.save();
    res.status(200).json({ message: 'Profile updated ✅', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getProfile, updateProfile };