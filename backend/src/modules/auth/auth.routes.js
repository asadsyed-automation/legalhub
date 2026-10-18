const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('./auth.controller');
const validate = require('../../middleware/validate');
const verifyToken = require('../../middleware/verifyToken');
const { registerSchema, loginSchema } = require('./auth.schemas');

const router = Router();

// Rate limiter for authentication routes: disabled during tests
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Max 50 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    error: 'Too many requests from this IP address, please try again after 15 minutes',
    details: []
  }
});

router.use(authRateLimiter);

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', verifyToken, authController.getMe);

module.exports = router;
