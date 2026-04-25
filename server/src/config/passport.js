const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

function configurePassport() {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL;

  if (!clientID || !clientSecret || !callbackURL) {
    return { googleEnabled: false };
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          const googleId = profile.id;
          const name = profile.displayName || email || 'Google User';
          const avatar = profile.photos?.[0]?.value;

          let user = await User.findOne({ $or: [{ googleId }, { email }] });
          if (user) {
            if (!user.googleId) user.googleId = googleId;
            if (avatar && !user.avatar) user.avatar = avatar;
            if (name && user.name !== name) user.name = name;
            await user.save();
            return done(null, user);
          }

          user = await User.create({
            name,
            email: email || `${googleId}@google.oauth.local`,
            googleId,
            avatar,
            password: undefined,
            role: 'employee',
          });
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  return { googleEnabled: true };
}

module.exports = { configurePassport };
