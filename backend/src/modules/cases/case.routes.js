const express = require('express');
const router = express.Router();
const { create, getAll, getOne, updateStatus } = require('./case.controller');
const verifyToken = require('../../middleware/auth.middleware');
const requireRole = require('../../middleware/role.middleware');

router.post('/', verifyToken, create);
router.get('/', verifyToken, getAll);
router.get('/:id', verifyToken, getOne);
router.patch('/:id/status', verifyToken, requireRole('lawyer'), updateStatus);

module.exports = router;