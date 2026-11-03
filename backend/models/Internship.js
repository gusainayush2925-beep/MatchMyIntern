const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  stipend: { type: String },
  skillsRequired: [{ type: String }],
  duration: { type: String, default: '3 months' },
  openings: { type: Number, default: 1 },
  deadline: { type: Date },
  status: { type: String, enum: ['open', 'closed', 'expired'], default: 'open' },
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Internship', internshipSchema);