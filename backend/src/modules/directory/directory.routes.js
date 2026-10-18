const { Router } = require('express');
const directoryController = require('./directory.controller');

const router = Router();

// Public directory routes (No authentication required)
router.get('/', directoryController.getPublicLawyers);
router.get('/:id', directoryController.getPublicLawyerById);

module.exports = router;
