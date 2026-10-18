const { Router } = require('express');
const adminController = require('./admin.controller');
const verifyToken = require('../../middleware/verifyToken');
const requireRole = require('../../middleware/requireRole');
const validate = require('../../middleware/validate');
const {
  rejectApplicationSchema,
  listApplicationsQuerySchema
} = require('./admin.schemas');
const { ROLES } = require('../../constants/roles');

const router = Router();

// Protect all admin endpoints with token verification and admin role requirement
router.use(verifyToken, requireRole(ROLES.ADMIN));

router.get(
  '/applications',
  validate(listApplicationsQuerySchema, 'query'),
  adminController.listApplications
);

router.patch(
  '/applications/:id/approve',
  adminController.approveApplication
);

router.patch(
  '/applications/:id/reject',
  validate(rejectApplicationSchema),
  adminController.rejectApplication
);

module.exports = router;
