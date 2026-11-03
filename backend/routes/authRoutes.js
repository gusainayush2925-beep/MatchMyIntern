const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { registerUser, verifyOTP, resendOTP, loginUser } = require('../controllers/authController');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ message: errors.array()[0].msg });
  next();
};

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required ❌'),
  body('email').isEmail().withMessage('Valid email required ❌'),
  body('password').isLength({ min: 6 }).withMessage('Password must be 6+ chars ❌'),
], validate, registerUser);

router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email required ❌'),
  body('password').notEmpty().withMessage('Password required ❌'),
], validate, loginUser);

module.exports = router;