const express = require('express');
const router = express.Router();
const { create, getOne } = require('./firm.controller');
const verifyToken = require('../../middleware/auth.middleware');
const requireRole = require('../../middleware/role.middleware');

router.post('/', verifyToken, requireRole('lawyer'), create);
router.get('/:id', verifyToken, getOne);

module.exports = router;