const express = require('express');
const router = express.Router();
const { create, getForProfile, getMine, update, remove } = require('./gig.controller');
const verifyToken = require('../../middleware/auth.middleware');
const requireRole = require('../../middleware/role.middleware');

router.post('/', verifyToken, requireRole('lawyer'), create);
router.get('/my-gigs', verifyToken, requireRole('lawyer'), getMine);
router.get('/profile/:profileId', getForProfile); // public
router.patch('/:id', verifyToken, requireRole('lawyer'), update);
router.delete('/:id', verifyToken, requireRole('lawyer'), remove);

module.exports = router;