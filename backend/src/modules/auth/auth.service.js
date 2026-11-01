const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');
const config = require('../../config/env');
const AppError = require('../../utils/AppError');
const { ROLES } = require('../../constants/roles');
const { OTP_PURPOSES } = require('../../constants/auth');
const otpService = require('./otp.service');
const { sendEmail } = require('../../utils/mailer');

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
 * @returns {Promise<{ token?: string, user: object, emailVerificationRequired: boolean }>}
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

  // If email verification is required by environment, user starts with emailVerifiedAt = null
  const shouldRequireVerification = config.requireEmailVerification === true;
  const emailVerifiedAt = shouldRequireVerification ? null : new Date();

  // Persist user
  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash,
    role,
    failedLoginAttempts: 0,
    lockedUntil: null,
    emailVerifiedAt
  });

  if (shouldRequireVerification) {
    // Generate and dispatch verification token
    const { plainCode } = await otpService.generateOtp(user.id, OTP_PURPOSES.VERIFY_EMAIL);
    await sendEmail({
      to: normalizedEmail,
      subject: 'LegalHub Email Verification Code',
      text: `Your 6-digit email verification code is: ${plainCode}. This code is valid for 10 minutes.`
    });

    return {
      user: user.toJSON(),
      emailVerificationRequired: true
    };
  }

  const token = generateToken(user);

  return {
    token,
    user: user.toJSON(),
    emailVerificationRequired: false
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

  // Check if account is suspended
  if (user.isActive === false) {
    throw new AppError(
      user.suspensionReason
        ? `Account is suspended: ${user.suspensionReason}. Please contact LegalHub support.`
        : 'Account is suspended. Please contact LegalHub support.',
      403,
      [{ field: 'account', message: 'ACCOUNT_SUSPENDED' }]
    );
  }

  // If email verification is strictly required and user has not verified their email
  if (config.requireEmailVerification && !user.emailVerifiedAt) {
    throw new AppError('Please verify your email address before logging in', 403, [
      { field: 'account', message: 'EMAIL_NOT_VERIFIED' }
    ]);
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

  if (user.isActive === false) {
    throw new AppError(
      user.suspensionReason
        ? `Account is suspended: ${user.suspensionReason}. Access revoked.`
        : 'Account is suspended. Access revoked.',
      403,
      [{ field: 'account', message: 'ACCOUNT_SUSPENDED' }]
    );
  }

  return user.toJSON();
};

/**
 * Triggers a password reset OTP dispatch.
 * Enumeration-safe: Always returns HTTP 200 with generic message regardless of user existence.
 *
 * @param {object} payload - { email }
 * @param {object} [options] - { now }
 * @returns {Promise<{ message: string }>}
 */
const forgotPassword = async ({ email }, { now = new Date() } = {}) => {
  const normalizedEmail = email.trim().toLowerCase();
  const genericResponse = {
    message: 'If that email address is in our system, we have sent a 6-digit verification code to it.'
  };

  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    return genericResponse;
  }

  // Generate and dispatch reset token
  const { plainCode } = await otpService.generateOtp(
    user.id,
    OTP_PURPOSES.RESET_PASSWORD,
    { now }
  );

  await sendEmail({
    to: normalizedEmail,
    subject: 'LegalHub Password Reset Code',
    text: `Your 6-digit password reset code is: ${plainCode}. This code is valid for 10 minutes. If you did not request a password reset, please ignore this email.`
  });

  return genericResponse;
};

/**
 * Validates OTP code and resets user password.
 * Resets failed login attempts and unlocks account upon success.
 *
 * @param {object} payload - { email, code, newPassword }
 * @param {object} [options] - { now }
 * @returns {Promise<{ message: string }>}
 */
const resetPassword = async ({ email, code, newPassword }, { now = new Date() } = {}) => {
  const normalizedEmail = email.trim().toLowerCase();
  const genericError = new AppError('Invalid or expired verification code', 400);

  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    throw genericError;
  }

  // Validate and consume OTP
  await otpService.verifyAndConsumeOtp(
    user.id,
    OTP_PURPOSES.RESET_PASSWORD,
    code,
    { now }
  );

  // Hash new password and reset lockout flags
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.update({
    passwordHash,
    failedLoginAttempts: 0,
    lockedUntil: null
  });

  return {
    message: 'Password has been reset successfully. Please log in with your new password.'
  };
};

/**
 * Validates email verification code and marks account verified.
 * Returns JWT session token and user profile identical to login.
 *
 * @param {object} payload - { email, code }
 * @param {object} [options] - { now }
 * @returns {Promise<{ token: string, user: object }>}
 */
const verifyEmail = async ({ email, code }, { now = new Date() } = {}) => {
  const normalizedEmail = email.trim().toLowerCase();
  const genericError = new AppError('Invalid or expired verification code', 400);

  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    throw genericError;
  }

  // Validate and consume OTP
  await otpService.verifyAndConsumeOtp(
    user.id,
    OTP_PURPOSES.VERIFY_EMAIL,
    code,
    { now }
  );

  const verificationTime = now instanceof Date ? now : new Date(now);
  await user.update({
    emailVerifiedAt: verificationTime
  });

  const token = generateToken(user);

  return {
    token,
    user: user.toJSON()
  };
};

/**
 * Resends a fresh email verification code.
 *
 * @param {object} payload - { email }
 * @param {object} [options] - { now }
 * @returns {Promise<{ message: string }>}
 */
const resendVerificationCode = async ({ email }, { now = new Date() } = {}) => {
  const normalizedEmail = email.trim().toLowerCase();
  const genericResponse = {
    message: 'If that email address is in our system, a new verification code has been sent.'
  };

  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    return genericResponse;
  }

  if (user.emailVerifiedAt) {
    throw new AppError('Email address is already verified', 400);
  }

  const { plainCode } = await otpService.generateOtp(
    user.id,
    OTP_PURPOSES.VERIFY_EMAIL,
    { now }
  );

  await sendEmail({
    to: normalizedEmail,
    subject: 'LegalHub Email Verification Code',
    text: `Your 6-digit email verification code is: ${plainCode}. This code is valid for 10 minutes.`
  });

  return genericResponse;
};

module.exports = {
  register,
  login,
  getMe,
  generateToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationCode
};
