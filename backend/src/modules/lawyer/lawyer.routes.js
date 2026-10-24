const { Router } = require('express');
const lawyerController = require('./lawyer.controller');
const lawyerProfileController = require('./lawyerProfile.controller');
const availabilityController = require('../availability/availability.controller');
const bookingController = require('../booking/booking.controller');
const enquiryController = require('../enquiry/enquiry.controller');
const verifyToken = require('../../middleware/verifyToken');
const requireRole = require('../../middleware/requireRole');
const requireApprovedLawyer = require('../../middleware/requireApprovedLawyer');
const validate = require('../../middleware/validate');
const { applicationSchema } = require('./lawyer.schemas');
const { updateProfileSchema, updateServicesSchema } = require('./lawyerProfile.schemas');
const {
  setAvailabilityRulesSchema,
  createBlockedDateSchema
} = require('../availability/availability.schemas');
const {
  respondBookingSchema,
  completeBookingSchema,
  listBookingsQuerySchema
} = require('../booking/booking.schemas');
const {
  replyEnquirySchema,
  listEnquiriesQuerySchema,
  enquiryIdParamSchema
} = require('../enquiry/enquiry.schemas');
const { ROLES } = require('../../constants/roles');

const router = Router();

// Protect all lawyer endpoints with token verification and lawyer role requirement
router.use(verifyToken, requireRole(ROLES.LAWYER));

// Application submission and status routes
router.post('/application', validate(applicationSchema), lawyerController.submitApplication);
router.get('/application', lawyerController.getMyApplication);
router.put('/application', validate(applicationSchema), lawyerController.updateApplication);

// Professional Profile and Services (Guarded: Only approved advocates permitted)
router.get('/profile', requireApprovedLawyer, lawyerProfileController.getProfile);
router.put('/profile', requireApprovedLawyer, validate(updateProfileSchema), lawyerProfileController.upsertProfile);
router.get('/services', requireApprovedLawyer, lawyerProfileController.getServices);
router.put('/services', requireApprovedLawyer, validate(updateServicesSchema), lawyerProfileController.updateServices);

// Availability Rules & Blocked Dates (Guarded: Only approved advocates permitted)
router.get('/availability', requireApprovedLawyer, availabilityController.getRules);
router.put('/availability', requireApprovedLawyer, validate(setAvailabilityRulesSchema), availabilityController.putRules);
router.get('/blocked-dates', requireApprovedLawyer, availabilityController.getBlockedDates);
router.post('/blocked-dates', requireApprovedLawyer, validate(createBlockedDateSchema), availabilityController.postBlockedDate);
router.delete('/blocked-dates/:id', requireApprovedLawyer, availabilityController.deleteBlockedDate);

// Consultation Appointments (Guarded: Only approved advocates permitted)
router.get('/appointments', requireApprovedLawyer, validate(listBookingsQuerySchema, 'query'), bookingController.getLawyerAppointments);
router.patch('/appointments/:id/confirm', requireApprovedLawyer, bookingController.confirmAppointment);
router.patch('/appointments/:id/reject', requireApprovedLawyer, validate(respondBookingSchema), bookingController.rejectAppointment);
router.patch('/appointments/:id/complete', requireApprovedLawyer, validate(completeBookingSchema), bookingController.completeAppointment);

// Pre-Booking Enquiries (Guarded: Only approved advocates permitted)
router.get('/enquiries', requireApprovedLawyer, validate(listEnquiriesQuerySchema, 'query'), enquiryController.getLawyerEnquiries);
router.patch('/enquiries/:id/reply', requireApprovedLawyer, validate(enquiryIdParamSchema, 'params'), validate(replyEnquirySchema), enquiryController.replyToEnquiry);

module.exports = router;

