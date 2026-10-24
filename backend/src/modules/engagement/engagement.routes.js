const { Router } = require('express');
const engagementController = require('./engagement.controller');
const verifyToken = require('../../middleware/verifyToken');
const validate = require('../../middleware/validate');
const {
  createEngagementSchema,
  updateEngagementSchema,
  listEngagementsQuerySchema
} = require('./engagement.schemas');

const router = Router();

// Protect all engagement routes with authentication
router.use(verifyToken);

router.post(
  '/',
  validate(createEngagementSchema),
  engagementController.createEngagement
);

router.get(
  '/',
  validate(listEngagementsQuerySchema, 'query'),
  engagementController.listEngagements
);

router.get('/:id', engagementController.getEngagementById);

router.patch(
  '/:id',
  validate(updateEngagementSchema),
  engagementController.updateEngagement
);

module.exports = router;
