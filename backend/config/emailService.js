const nodemailer = require('nodemailer');

// ✅ Brevo SMTP Configuration
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_LOGIN,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    if (!process.env.BREVO_SMTP_LOGIN || !process.env.BREVO_SMTP_KEY) {
      console.log('⚠️ Brevo credentials not set, skipping email');
      return false;
    }
    const info = await transporter.sendMail({
      from: `"MatchMyIntern" <${process.env.BREVO_SENDER_EMAIL}>`,
      to, subject, html,
    });
    console.log('📧 Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email error:', error.message);
    return false;
  }
};

const emailTemplates = {
  sendOTP: (name, otp) => ({
    subject: `🔐 Your OTP for MatchMyIntern Verification`,
    html: `
      <div style="font-family:Arial;max-width:600px;margin:auto;padding:40px;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);border-radius:16px;">
        <div style="background:white;padding:40px;border-radius:12px;">
          <h1 style="color:#6366f1;text-align:center;">🚀 MatchMyIntern</h1>
          <h2 style="color:#0f172a;">Hi ${name}! 👋</h2>
          <p>Please use the OTP below to verify your email:</p>
          <div style="background:linear-gradient(135deg,#eef2ff 0%,#e0e7ff 100%);padding:24px;border-radius:12px;text-align:center;margin:24px 0;">
            <div style="font-size:40px;font-weight:800;letter-spacing:8px;color:#4f46e5;font-family:monospace;">${otp}</div>
          </div>
          <p style="color:#dc2626;font-size:13px;text-align:center;">⏰ This OTP will expire in 10 minutes.</p>
          <p style="color:#6366f1;font-weight:bold;text-align:center;">Team MatchMyIntern 🚀</p>
        </div>
      </div>`,
  }),

  applicationReceived: (studentName, internshipTitle, company) => ({
    subject: `✅ Application Received - ${internshipTitle}`,
    html: `<div style="font-family:Arial;padding:30px;background:#f8f9ff;border-radius:12px;"><h2 style="color:#667eea;">Hi ${studentName}! 👋</h2><p>Your application for <strong>${internshipTitle}</strong> at <strong>${company}</strong> has been received.</p><p style="color:#667eea;font-weight:bold;">Team MatchMyIntern 🚀</p></div>`,
  }),

  newApplicant: (recruiterName, studentName, internshipTitle) => ({
    subject: `📩 New Applicant for ${internshipTitle}`,
    html: `<div style="font-family:Arial;padding:30px;background:#f8f9ff;border-radius:12px;"><h2 style="color:#667eea;">Hi ${recruiterName}! 👋</h2><p><strong>${studentName}</strong> applied for <strong>${internshipTitle}</strong>.</p><p style="color:#667eea;font-weight:bold;">Team MatchMyIntern 🚀</p></div>`,
  }),

  statusUpdate: (studentName, internshipTitle, status) => ({
    subject: `🎉 Application ${status.toUpperCase()} - ${internshipTitle}`,
    html: `<div style="font-family:Arial;padding:30px;background:#f8f9ff;border-radius:12px;"><h2 style="color:#667eea;">Hi ${studentName}! 👋</h2><p>Your application for <strong>${internshipTitle}</strong> has been <strong>${status.toUpperCase()}</strong>.</p><p style="color:#667eea;font-weight:bold;">Team MatchMyIntern 🚀</p></div>`,
  }),
};

module.exports = { sendEmail, emailTemplates };