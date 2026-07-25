const express = require('express');
const router = express.Router();
const { getPending, approve, reject, verifyProfile, listAllUsers, listAllMarketplaceProfiles } = require('./admin.controller');
const verifyToken = require('../../middleware/auth.middleware');
const requireRole = require('../../middleware/role.middleware');

router.get('/lawyers/pending', verifyToken, requireRole('admin'), getPending);
router.patch('/lawyers/:id/approve', verifyToken, requireRole('admin'), approve);
router.patch('/lawyers/:id/reject', verifyToken, requireRole('admin'), reject);
router.patch('/marketplace-profiles/:id/verify', verifyToken, requireRole('admin'), verifyProfile);
router.get('/users', verifyToken, requireRole('admin'), listAllUsers);
router.get('/marketplace-profiles', verifyToken, requireRole('admin'), listAllMarketplaceProfiles);

module.exports = router;