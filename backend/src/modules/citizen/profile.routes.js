const express = require('express');
const router = express.Router();
const profileController = require('./profile.controller');
const authMiddleware = require('../../middleware/auth.middleware');

router.get('/me', authMiddleware, profileController.getMyProfile);
router.patch('/me', authMiddleware, profileController.updateMyProfile);
router.get('/:citizenId', authMiddleware, profileController.getPublicCitizenProfile);

module.exports = router;
