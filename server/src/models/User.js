const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    googleId: { type: String, sparse: true, unique: true },
    role: {
      type: String,
      enum: ['admin', 'manager', 'employee'],
      default: 'employee',
    },
    avatar: { type: String },
  },
  { timestamps: true }
);

userSchema.pre('validate', function validatePassword(next) {
  if (!this.password && !this.googleId) {
    this.invalidate('password', 'Password or Google login required');
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
