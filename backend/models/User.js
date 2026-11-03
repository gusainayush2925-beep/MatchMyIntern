const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'recruiter', 'admin'], default: 'student' },

  // ✅ Email Verification Fields
  isVerified: { type: Boolean, default: false },
  otp: { type: String, default: null },
  otpExpiry: { type: Date, default: null },

  phone: { type: String, default: '' },
  bio: { type: String, default: '' },

  // Student
  skills: [{ type: String }],
  education: [{ degree: String, college: String, year: String, cgpa: String }],
  experience: [{ title: String, company: String, duration: String, description: String }],
  projects: [{ title: String, description: String, link: String }],
  certifications: [{ type: String }],

  // Recruiter
  companyName: { type: String },
  companyWebsite: { type: String },
  designation: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);