const nodemailer = require('nodemailer');

let cachedTransporter = null;

function canSendEmail() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM
  );
}

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return cachedTransporter;
}

async function sendOtpEmail({ to, otp, name }) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM;

  await transporter.sendMail({
    from,
    to,
    subject: 'InsightHR signup verification code',
    text: `Hello ${name}, your InsightHR OTP is ${otp}. It expires in 10 minutes.`,
    html: `<p>Hello ${name},</p><p>Your InsightHR OTP is <b>${otp}</b>.</p><p>This code expires in 10 minutes.</p>`,
  });
}

module.exports = { canSendEmail, sendOtpEmail };
