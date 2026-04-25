const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { signToken } = require('../utils/token');
const { COOKIE_NAME } = require('../middleware/auth');

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
});

async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hash,
      role: 'employee',
    });
    const token = signToken({ sub: user._id.toString(), role: user.role });
    res.cookie(COOKIE_NAME, token, cookieOptions());
    return res.status(201).json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      explanation: 'Account created. JWT issued in HTTP-only cookie for secure sessions.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Registration failed' });
  }
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
  register,
  login,
  logout,
  me,
  googleCallback,
};
