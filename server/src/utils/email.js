const nodemailer = require('nodemailer');

let cachedTransporter = null;

function envValue(primary, fallback) {
  return process.env[primary] || process.env[fallback];
}

function mailConfig() {
  const host = envValue('SMTP_HOST', 'MAIL_HOST');
  const user = envValue('SMTP_USER', 'MAIL_USER');
  const pass = envValue('SMTP_PASS', 'MAIL_PASS');
  const from = process.env.SMTP_FROM || process.env.MAIL_FROM || user;
  const secureRaw = process.env.SMTP_SECURE || process.env.MAIL_SECURE;
  const secure = String(secureRaw || 'false').toLowerCase() === 'true';
  const defaultPort = secure ? 465 : 587;
  const port = Number(process.env.SMTP_PORT || process.env.MAIL_PORT || defaultPort);
  return { host, port, secure, user, pass, from };
}

function canSendEmail() {
  const config = mailConfig();
  return Boolean(
    config.host &&
      config.port &&
      config.user &&
      config.pass &&
      config.from
  );
}

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const config = mailConfig();

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  return cachedTransporter;
}

async function sendOtpEmail({ to, otp, name }) {
  const transporter = getTransporter();
  const { from } = mailConfig();

  await transporter.sendMail({
    from,
    to,
    subject: 'InsightHR signup verification code',
    text: `Hello ${name}, your InsightHR OTP is ${otp}. It expires in 10 minutes.`,
    html: `<p>Hello ${name},</p><p>Your InsightHR OTP is <b>${otp}</b>.</p><p>This code expires in 10 minutes.</p>`,
  });
}

module.exports = { canSendEmail, sendOtpEmail };
