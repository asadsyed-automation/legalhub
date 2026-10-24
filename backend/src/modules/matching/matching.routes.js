const { Router } = require('express');
const matchingController = require('./matching.controller');
const validate = require('../../middleware/validate');
const { classifySchema, searchMatchSchema } = require('./matching.schemas');

const router = Router();

// Public Rule-Based Matching Endpoints
router.post('/classify', validate(classifySchema), matchingController.classify);
router.post('/search', validate(searchMatchSchema), matchingController.search);

module.exports = router;
