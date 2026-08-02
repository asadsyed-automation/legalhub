const express = require('express');
const router = express.Router();
const { create, getAll, getOne, getMine, update } = require('./profile.controller');
const verifyToken = require('../../middleware/auth.middleware');
const requireRole = require('../../middleware/role.middleware');

router.post('/', verifyToken, requireRole('lawyer'), create);
router.get('/', getAll); // public — no auth needed to browse marketplace
router.get('/me', verifyToken, requireRole('lawyer'), getMine); // lawyer's own profile (verified or pending)
router.get('/:id', getOne); // public
router.patch('/', verifyToken, requireRole('lawyer'), update);

module.exports = router;