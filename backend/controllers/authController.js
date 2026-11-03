const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEmail, emailTemplates } = require('../config/emailService');

// Helper: Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Register a new user (sends OTP)
const registerUser = async (req, res) => {
  try {
    let { name, email, password, role, companyName, adminCode } = req.body;

    name = name?.trim();
    email = email?.toLowerCase().trim();

    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields required ❌' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be 6+ chars ❌' });

    const exists = await User.findOne({ email });
    if (exists) {
      if (exists.isVerified) {
        return res.status(400).json({ message: 'User already exists' });
      }
      // Agar user verify nahi hua, toh OTP dobara bhejo
      const otp = generateOTP();
      exists.otp = otp;
      exists.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await exists.save();

      const t = emailTemplates.sendOTP(name, otp);
      await sendEmail(email, t.subject, t.html);

      return res.status(200).json({
        message: 'OTP sent to your email again ✅',
        requiresVerification: true,
        email,
      });
    }

    // Admin code check
    let finalRole = role || 'student';
    if (role === 'admin') {
      if (adminCode !== process.env.ADMIN_SECRET_CODE) {
        return res.status(403).json({ message: 'Invalid Admin Code ❌' });
      }
      finalRole = 'admin';
    }

    const hashed = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    const user = await User.create({
      name, email, password: hashed,
      role: finalRole,
      companyName: companyName?.trim() || '',
      isVerified: false,
      otp,
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
    });

    try {
      const t = emailTemplates.sendOTP(name, otp);
      await sendEmail(email, t.subject, t.html);
    } catch (e) {
      console.log('Email failed:', e.message);
    }

    res.status(201).json({
      message: 'OTP sent to your email ✅ Please verify to continue',
      requiresVerification: true,
      email,
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Verify OTP
const verifyOTP = async (req, res) => {
  try {
    let { email, otp } = req.body;
    email = email?.toLowerCase().trim();

    if (!email || !otp)
      return res.status(400).json({ message: 'Email and OTP required ❌' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found ❌' });

    if (user.isVerified)
      return res.status(400).json({ message: 'User already verified ✅' });

    if (user.otp !== otp)
      return res.status(400).json({ message: 'Invalid OTP ❌' });

    if (new Date() > user.otpExpiry)
      return res.status(400).json({ message: 'OTP expired ❌ Please register again' });

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.status(200).json({
      message: 'Email verified successfully ✅ You can now login',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Resend OTP
const resendOTP = async (req, res) => {
  try {
    let { email } = req.body;
    email = email?.toLowerCase().trim();

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found ❌' });
    if (user.isVerified)
      return res.status(400).json({ message: 'User already verified ✅' });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const t = emailTemplates.sendOTP(user.name, otp);
    await sendEmail(email, t.subject, t.html);

    res.status(200).json({ message: 'OTP resent successfully ✅' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Login user (only if verified)
const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'All fields required ❌' });

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email first ❌',
        requiresVerification: true,
        email,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful ✅',
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        role: user.role, skills: user.skills, companyName: user.companyName,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { registerUser, verifyOTP, resendOTP, loginUser };