const { Router } = require('express');
const directoryController = require('./directory.controller');
const availabilityController = require('../availability/availability.controller');
const reviewController = require('../review/review.controller');
const validate = require('../../middleware/validate');
const { directoryQuerySchema } = require('./directory.schemas');
const { slotsQuerySchema } = require('../availability/availability.schemas');
const { listReviewsQuerySchema } = require('../review/review.schemas');

const router = Router();

// Public directory routes (No authentication required)
router.get('/', validate(directoryQuerySchema, 'query'), directoryController.getPublicLawyers);
router.get('/:id', directoryController.getPublicLawyerById);
router.get('/:id/slots', validate(slotsQuerySchema, 'query'), availabilityController.getPublicSlots);
router.get('/:id/reviews', validate(listReviewsQuerySchema, 'query'), reviewController.getLawyerReviews);

module.exports = router;

