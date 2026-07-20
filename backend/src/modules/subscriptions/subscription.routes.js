const express = require('express');
const router = express.Router();
const { create, getMine } = require('./subscription.controller');
const verifyToken = require('../../middleware/auth.middleware');

router.post('/', verifyToken, create);
router.get('/me', verifyToken, getMine);

module.exports = router;