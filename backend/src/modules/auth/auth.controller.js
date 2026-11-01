const authService = require('./auth.service');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * Health check handler.
 */
const healthCheck = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

/**
 * Controller to handle new user registration.
 */
const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

/**
 * Controller to handle user login.
 */
const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.status(200).json(result);
});

/**
 * Controller to get current authenticated user profile.
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  res.status(200).json({ user });
});

/**
 * Controller to trigger password reset code dispatch.
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body);
  res.status(200).json(result);
});

/**
 * Controller to reset password using verified OTP code.
 */
const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  res.status(200).json(result);
});

/**
 * Controller to verify email with OTP code.
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(req.body);
  res.status(200).json(result);
});

/**
 * Controller to resend email verification OTP code.
 */
const resendCode = asyncHandler(async (req, res) => {
  const result = await authService.resendVerificationCode(req.body);
  res.status(200).json(result);
});

module.exports = {
  healthCheck,
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendCode
};
