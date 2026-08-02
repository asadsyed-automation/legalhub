const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('./auth.model');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function registerUser({ name, email, password, role }) {
  const existing = await User.findOne({ where: { email } });
  if (existing) throw new Error('Email already registered');

  const password_hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password_hash, role });
  return user;
}

async function loginUser({ email, password }) {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new Error('Invalid credentials');

  if (user.locked_until && new Date() < user.locked_until) {
    throw new Error('Account temporarily locked. Try again later.');
  }

  if (!user.password_hash) {
    throw new Error('This account was created with Google Sign-In. Please sign in with Google.');
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    user.failed_login_attempts += 1;
    if (user.failed_login_attempts >= 5) {
      user.locked_until = new Date(Date.now() + 15 * 60 * 1000);
    }
    await user.save();
    throw new Error('Invalid credentials');
  }

  user.failed_login_attempts = 0;
  user.locked_until = null;
  await user.save();

  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || 'secret_key',
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || 'refresh_secret_key',
    { expiresIn: '7d' }
  );

  return { user, accessToken, refreshToken };
}

async function googleAuthUser({ idToken }) {
  if (!idToken) throw new Error('Google ID token is required');

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID || undefined,
    });
    payload = ticket.getPayload();
  } catch (err) {
    try {
      const ticket = await googleClient.verifyIdToken({ idToken });
      payload = ticket.getPayload();
    } catch {
      throw new Error('Failed to verify Google ID token: ' + err.message);
    }
  }

  if (!payload || !payload.email) {
    throw new Error('Invalid Google token payload');
  }

  if (payload.email_verified === false) {
    throw new Error('Google email is not verified');
  }

  const googleId = payload.sub;
  const email = payload.email;
  const name = payload.name || payload.given_name || email.split('@')[0];

  // Priority Matching:
  // 1. Existing user with matching google_id
  let user = await User.findOne({ where: { google_id: googleId } });

  // 2. Existing user with matching email (link Google ID)
  if (!user) {
    user = await User.findOne({ where: { email } });
    if (user) {
      user.google_id = googleId;
      await user.save();
    }
  }

  // 3. Create new user
  if (!user) {
    user = await User.create({
      name,
      email,
      google_id: googleId,
      password_hash: null,
      role: null,
    });
  }

  // If role is null/missing (brand new account), prompt for role selection
  if (!user.role) {
    const tempToken = jwt.sign(
      { id: user.id, role: null, pendingRole: true },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '30m' }
    );
    return {
      needsRole: true,
      tempToken,
      user: { id: user.id, name: user.name, email: user.email, role: null },
    };
  }

  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || 'secret_key',
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || 'refresh_secret_key',
    { expiresIn: '7d' }
  );

  return { user, accessToken, refreshToken };
}

async function setUserRole({ userId, role }) {
  if (!['lawyer', 'citizen'].includes(role)) {
    throw new Error('Invalid role specified. Must be "lawyer" or "citizen".');
  }

  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');

  user.role = role;
  await user.save();

  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || 'secret_key',
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || 'refresh_secret_key',
    { expiresIn: '7d' }
  );

  return { user, accessToken, refreshToken };
}

module.exports = { registerUser, loginUser, googleAuthUser, setUserRole };