const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');
const config = require('../../config/env');
const AppError = require('../../utils/AppError');
const { ROLES } = require('../../constants/roles');

const SALT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/**
 * Generates a signed JWT token containing user identity and role.
 *
 * @param {object} user - User instance or object
 * @returns {string} JWT string
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn
    }
  );
};

/**
 * Register a new user (Client or Lawyer).
 *
 * @param {object} data - Validated registration payload { name, email, password, role }
 * @returns {Promise<{ token: string, user: object }>}
 */
const register = async ({ name, email, password, role }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // Strict defense-in-depth: Admin accounts can NEVER be created through the API
  if (role === ROLES.ADMIN) {
    throw new AppError('Admin registration is strictly forbidden through the API', 400);
  }

  // Check for duplicate email
  const existingUser = await User.findOne({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw new AppError('Email is already registered', 409);
  }

  // Hash password with salt rounds = 12
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Persist user
  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash,
    role,
    failedLoginAttempts: 0,
    lockedUntil: null
  });

  const token = generateToken(user);

  return {
    token,
    user: user.toJSON()
  };
};

/**
 * Authenticate user credentials and return a session token.
 * Enforces timing attack mitigation, 5-attempt lockout, and consistent 401 messages.
 *
 * @param {object} credentials - { email, password }
 * @returns {Promise<{ token: string, user: object }>}
 */
const login = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const genericErrorMessage = 'Invalid email or password';

  const user = await User.findOne({ where: { email: normalizedEmail } });

  // If user does not exist, run a dummy bcrypt compare to prevent timing side-channel attacks
  if (!user) {
    // Computes a dummy hash comparison to consume equal CPU cycles
    await bcrypt.compare(
      password,
      '$2a$12$K.0DkE/t1g9rX0d19fS.6.E4UoE4X8V0/8vN0C.Z2z2V1c7R/Fh1W'
    );
    throw new AppError(genericErrorMessage, 401);
  }

  // Check if account is currently locked
  if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
    const remainingMinutes = Math.ceil(
      (new Date(user.lockedUntil).getTime() - Date.now()) / (1000 * 60)
    );
    throw new AppError(
      `Account is temporarily locked due to too many failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
      401
    );
  }

  // Compare password against stored hash
  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    const currentAttempts = (user.failedLoginAttempts || 0) + 1;
    let lockedUntil = user.lockedUntil;

    if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
      lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
    }

    await user.update({
      failedLoginAttempts: currentAttempts,
      lockedUntil
    });

    if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
      throw new AppError(
        `Account is temporarily locked due to too many failed login attempts. Please try again in ${LOCKOUT_MINUTES} minute(s).`,
        401
      );
    }

    throw new AppError(genericErrorMessage, 401);
  }

  // Password matched: reset failed attempts and lockout window
  if (user.failedLoginAttempts > 0 || user.lockedUntil !== null) {
    await user.update({
      failedLoginAttempts: 0,
      lockedUntil: null
    });
  }

  const token = generateToken(user);

  return {
    token,
    user: user.toJSON()
  };
};

/**
 * Retrieve user profile by ID.
 *
 * @param {string} userId
 * @returns {Promise<object>} User object without passwordHash
 */
const getMe = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user.toJSON();
};

module.exports = {
  register,
  login,
  getMe,
  generateToken
};
