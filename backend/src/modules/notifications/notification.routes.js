const express = require('express');
const router = express.Router();
const { getAll, markRead } = require('./notification.controller');
const verifyToken = require('../../middleware/auth.middleware');

router.get('/', verifyToken, getAll);
router.patch('/:id/read', verifyToken, markRead);

module.exports = router;