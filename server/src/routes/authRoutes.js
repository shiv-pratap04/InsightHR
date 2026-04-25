const express = require('express');
const passport = require('passport');
const { register, login, logout, me, googleCallback } = require('../controllers/authController');
const { registerRules, loginRules } = require('../validators/authValidators');
const { handleValidation } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function googleEnabled() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL
  );
}

router.post('/register', registerRules, handleValidation, register);
router.post('/login', loginRules, handleValidation, login);
router.post('/logout', logout);
router.get('/me', authMiddleware, me);

router.get('/google', (req, res, next) => {
  if (!googleEnabled()) {
    return res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured',
      explanation: 'Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL in server/.env',
    });
  }
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

router.get(
  '/google/callback',
  (req, res, next) => {
    if (!googleEnabled()) {
      return res.status(503).json({ success: false, message: 'Google OAuth not configured' });
    }
    const client = process.env.CLIENT_URL || 'http://localhost:5173';
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${client}/login?error=oauth`,
    })(req, res, next);
  },
  googleCallback
);

module.exports = router;
