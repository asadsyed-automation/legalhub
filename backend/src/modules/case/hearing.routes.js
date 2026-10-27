const { Router } = require('express');
const hearingController = require('./hearing.controller');
const verifyToken = require('../../middleware/verifyToken');
const requireApprovedLawyer = require('../../middleware/requireApprovedLawyer');
const validate = require('../../middleware/validate');
const {
  quickOutcomeHearingSchema,
  queryHearingSchema
} = require('./hearing.schemas');

const router = Router();

// Protect all hearing endpoints with JWT authentication
router.use(verifyToken);

// Quick outcome recording: PATCH /api/v1/hearings/:id/outcome (Lawyer only)
router.patch(
  '/:id/outcome',
  requireApprovedLawyer,
  validate(quickOutcomeHearingSchema),
  hearingController.quickOutcomeHearing
);

// Cross-case cause list query: GET /api/v1/hearings?from=&to=&court=
router.get(
  '/',
  validate(queryHearingSchema, 'query'),
  hearingController.listHearingsAcrossCases
);

module.exports = router;
