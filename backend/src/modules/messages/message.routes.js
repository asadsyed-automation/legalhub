const express = require('express');
const router = express.Router();
const { create, getForCase } = require('./message.controller');
const verifyToken = require('../../middleware/auth.middleware');

router.post('/', verifyToken, create);
router.get('/case/:caseId', verifyToken, getForCase);

module.exports = router;