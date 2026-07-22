const express = require('express');
const router = express.Router();
const { create, getOne, addMember, getMembers } = require('./firm.controller');
const verifyToken = require('../../middleware/auth.middleware');
const requireRole = require('../../middleware/role.middleware');

router.post('/', verifyToken, requireRole('lawyer'), create);
router.get('/:id', verifyToken, getOne);
router.post('/:id/members', verifyToken, requireRole('lawyer'), addMember);
router.get('/:id/members', verifyToken, getMembers);

module.exports = router;