const express = require('express');
const router = express.Router();
const { create, getForProfile } = require('./gig.controller');
const verifyToken = require('../../middleware/auth.middleware');
const requireRole = require('../../middleware/role.middleware');

router.post('/', verifyToken, requireRole('lawyer'), create);
router.get('/profile/:profileId', getForProfile); // public

module.exports = router;