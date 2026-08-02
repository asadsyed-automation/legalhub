const express = require('express');
const router = express.Router();
const {
  register,
  login,
  googleAuth,
  setRole,
  forgotPassword,
  verifyOtp,
  resetPassword,
  changePassword,
} = require('./auth.controller');
const verifyToken = require('../../middleware/auth.middleware');
const requireRole = require('../../middleware/role.middleware');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.patch('/set-role', verifyToken, setRole);

router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.patch('/change-password', verifyToken, changePassword);

router.get('/test-protected', verifyToken, requireRole('lawyer'), (req, res) => {
  res.json({ message: 'You are a verified lawyer', userId: req.user.id });
});

module.exports = router;