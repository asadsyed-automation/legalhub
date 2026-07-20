const express = require('express');
const router = express.Router();
const { create, getForGig } = require('./review.controller');
const verifyToken = require('../../middleware/auth.middleware');
const requireRole = require('../../middleware/role.middleware');

router.post('/', verifyToken, requireRole('citizen'), create);
router.get('/gig/:gigId', getForGig); // public

module.exports = router;