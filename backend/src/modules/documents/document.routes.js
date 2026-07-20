const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../../config/cloudinary');
const { create, getForCase } = require('./document.controller');
const verifyToken = require('../../middleware/auth.middleware');
const requireRole = require('../../middleware/role.middleware');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/', verifyToken, requireRole('lawyer'), upload.single('file'), create);
router.get('/case/:caseId', verifyToken, getForCase);

module.exports = router;