const jwt = require('jsonwebtoken');

function getJwtSecret() {
  const configured = process.env.JWT_SECRET;
  if (configured) return configured;

  if (process.env.NODE_ENV !== 'production') {
    return 'insighthr-dev-jwt-secret';
  }

  throw new Error('JWT_SECRET is not set');
}

function signToken(payload) {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function verifyToken(token) {
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
}

module.exports = { signToken, verifyToken };
