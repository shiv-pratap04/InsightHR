const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Employee = require('../models/Employee');
const RegistrationOtp = require('../models/RegistrationOtp');
const { signToken } = require('../utils/token');
const { COOKIE_NAME } = require('../middleware/auth');
const { canSendEmail, sendOtpEmail } = require('../utils/email');

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
});

const OTP_TTL_MS = 10 * 60 * 1000;

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

function makeOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function requestRegisterOtp(req, res) {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const otp = makeOtp();
    const passwordHash = await bcrypt.hash(password, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await RegistrationOtp.findOneAndUpdate(
      { email: normalizedEmail },
      {
        email: normalizedEmail,
        name,
        passwordHash,
        otpHash: hashOtp(otp),
        expiresAt,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (canSendEmail()) {
      await sendOtpEmail({ to: normalizedEmail, otp, name });
    } else {
      console.log(`Signup OTP for ${normalizedEmail}: ${otp}`);
    }

    const response = {
      success: true,
      message: 'OTP sent successfully',
      explanation: 'Enter the 6-digit OTP sent to your email to complete registration.',
    };

    if (process.env.NODE_ENV !== 'production' && !canSendEmail()) {
      response.devOtp = otp;
      response.explanation =
        'SMTP is not configured. OTP is returned in dev mode for local testing.';
    }

    return res.json(response);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to send OTP' });
  }
}

async function verifyRegisterOtp(req, res) {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase();
    const pending = await RegistrationOtp.findOne({ email: normalizedEmail });

    if (!pending) {
      return res.status(400).json({
        success: false,
        message: 'OTP request not found',
        explanation: 'Please request a new OTP and try again.',
      });
    }

    if (pending.expiresAt.getTime() < Date.now()) {
      await RegistrationOtp.deleteOne({ _id: pending._id });
      return res.status(400).json({
        success: false,
        message: 'OTP expired',
        explanation: 'Please request a new OTP.',
      });
    }

    if (pending.otpHash !== hashOtp(otp)) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      await RegistrationOtp.deleteOne({ _id: pending._id });
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name: pending.name,
      email: normalizedEmail,
      password: pending.passwordHash,
      role: 'employee',
    });

    await RegistrationOtp.deleteOne({ _id: pending._id });

    const token = signToken({ sub: user._id.toString(), role: user.role });
    res.cookie(COOKIE_NAME, token, cookieOptions());
    return res.status(201).json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      explanation: 'OTP verified. Account created and session started.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'OTP verification failed' });
  }
}

async function register(req, res) {
  return verifyRegisterOtp(req, res);
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = signToken({ sub: user._id.toString(), role: user.role });
    res.cookie(COOKIE_NAME, token, cookieOptions());
    return res.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      explanation: 'Login successful. Token stored in HTTP-only cookie.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Login failed' });
  }
}

function logout(req, res) {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: 0 });
  return res.json({
    success: true,
    explanation: 'Session cleared; authentication cookie removed.',
  });
}

async function me(req, res) {
  return res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar,
    },
    explanation: 'Current session user resolved from JWT.',
  });
}

function googleCallback(req, res) {
  const user = req.user;
  if (!user) {
    const client = process.env.CLIENT_URL || 'http://localhost:5173';
    return res.redirect(`${client}/login?error=oauth`);
  }
  const token = signToken({ sub: user._id.toString(), role: user.role });
  res.cookie(COOKIE_NAME, token, cookieOptions());
  const client = process.env.CLIENT_URL || 'http://localhost:5173';
  return res.redirect(`${client}/auth/callback`);
}

module.exports = {
  requestRegisterOtp,
  verifyRegisterOtp,
  register,
  login,
  logout,
  me,
  googleCallback,
};
