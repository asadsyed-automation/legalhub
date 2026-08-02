const express = require('express');
const router = express.Router();
const { create, getForCase, fetchAISummary } = require('./entry.controller');
const verifyToken = require('../../middleware/auth.middleware');
const requireRole = require('../../middleware/role.middleware');

router.post('/', verifyToken, requireRole('lawyer'), create);
router.get('/case/:caseId', verifyToken, getForCase);
router.get('/case/:caseId/ai-summary', verifyToken, fetchAISummary);

module.exports = router;