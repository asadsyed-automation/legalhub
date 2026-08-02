const express = require('express');
const router = express.Router();
const { register, login, googleAuth, setRole } = require('./auth.controller');
const verifyToken = require('../../middleware/auth.middleware');
const requireRole = require('../../middleware/role.middleware');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.patch('/set-role', verifyToken, setRole);

router.get('/test-protected', verifyToken, requireRole('lawyer'), (req, res) => {
  res.json({ message: 'You are a verified lawyer', userId: req.user.id });
});

module.exports = router;