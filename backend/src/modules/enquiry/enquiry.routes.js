const { Router } = require('express');
const enquiryController = require('./enquiry.controller');
const verifyToken = require('../../middleware/verifyToken');
const requireRole = require('../../middleware/requireRole');
const validate = require('../../middleware/validate');
const {
  createEnquirySchema,
  listEnquiriesQuerySchema,
  enquiryIdParamSchema
} = require('./enquiry.schemas');
const { ROLES } = require('../../constants/roles');

const router = Router();

// Protect all enquiry routes with authentication
router.use(verifyToken);

// Client enquiry endpoints
router.post(
  '/',
  requireRole(ROLES.CLIENT),
  validate(createEnquirySchema),
  enquiryController.createEnquiry
);

router.get(
  '/my-enquiries',
  requireRole(ROLES.CLIENT),
  validate(listEnquiriesQuerySchema, 'query'),
  enquiryController.getMyEnquiries
);

router.get(
  '/:id',
  validate(enquiryIdParamSchema, 'params'),
  enquiryController.getEnquiryById
);

router.patch(
  '/:id/close',
  validate(enquiryIdParamSchema, 'params'),
  enquiryController.closeEnquiry
);

module.exports = router;
