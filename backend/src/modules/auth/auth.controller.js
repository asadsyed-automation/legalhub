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

module.exports = {
  healthCheck,
  register,
  login,
  getMe
};
