const express = require('express');
const router = express.Router();
const { create, updateStatus, getForCase } = require('./fee.controller');
const verifyToken = require('../../middleware/auth.middleware');
const requireRole = require('../../middleware/role.middleware');

router.post('/', verifyToken, requireRole('lawyer'), create);
router.patch('/:id/status', verifyToken, requireRole('lawyer'), updateStatus);
router.get('/case/:caseId', verifyToken, getForCase);

module.exports = router;