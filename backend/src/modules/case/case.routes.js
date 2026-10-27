const { Router } = require('express');
const caseController = require('./case.controller');
const caseEntryController = require('./caseEntry.controller');
const hearingController = require('./hearing.controller');
const documentController = require('./document.controller');
const verifyToken = require('../../middleware/verifyToken');
const requireApprovedLawyer = require('../../middleware/requireApprovedLawyer');
const validate = require('../../middleware/validate');
const multer = require('multer');
const { DOCUMENT_LIMITS } = require('../../constants/case');
const {
  createCaseSchema,
  updateCaseSchema,
  listCasesQuerySchema
} = require('./case.schemas');
const {
  createCaseEntrySchema,
  updateCaseEntrySchema,
  queryCaseEntrySchema
} = require('./caseEntry.schemas');
const {
  createHearingSchema,
  updateHearingSchema
} = require('./hearing.schemas');
const {
  uploadDocumentSchema,
  queryDocumentSchema
} = require('./document.schemas');
const feeController = require('./fee.controller');
const {
  upsertFeeAgreementSchema,
  createFeePaymentSchema
} = require('./fee.schemas');
const timelineController = require('./timeline.controller');
const { timelineQuerySchema } = require('./timeline.schemas');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: DOCUMENT_LIMITS.MAX_FILE_SIZE_BYTES
  }
});

const router = Router();

// Protect all case endpoints with JWT authentication
router.use(verifyToken);

// Create new case file (Approved advocates only)
router.post(
  '/',
  requireApprovedLawyer,
  validate(createCaseSchema),
  caseController.createCase
);

// List cases (Role-aware: lawyer gets own cases, client gets linked cases)
router.get(
  '/',
  validate(listCasesQuerySchema, 'query'),
  caseController.getCases
);

// Get single case file by ID (Strict ownership and projected client view)
router.get(
  '/:id',
  caseController.getCaseById
);

// Modify case fields, replace parties, update status/stage (Assigned advocate only)
router.patch(
  '/:id',
  requireApprovedLawyer,
  validate(updateCaseSchema),
  caseController.updateCase
);

// ==========================================
// Case Diary Entries (/cases/:id/entries)
// ==========================================

router.post(
  '/:id/entries',
  requireApprovedLawyer,
  validate(createCaseEntrySchema),
  caseEntryController.createEntry
);

router.get(
  '/:id/entries',
  validate(queryCaseEntrySchema, 'query'),
  caseEntryController.getEntries
);

router.patch(
  '/:id/entries/:entryId',
  requireApprovedLawyer,
  validate(updateCaseEntrySchema),
  caseEntryController.updateEntry
);

// ==========================================
// Court Hearings (/cases/:id/hearings)
// ==========================================

router.post(
  '/:id/hearings',
  requireApprovedLawyer,
  validate(createHearingSchema),
  hearingController.createHearing
);

router.get(
  '/:id/hearings',
  hearingController.getCaseHearings
);

router.patch(
  '/:id/hearings/:hearingId',
  requireApprovedLawyer,
  validate(updateHearingSchema),
  hearingController.updateHearing
);

// ==========================================
// Case Documents (/cases/:id/documents)
// ==========================================

router.post(
  '/:id/documents',
  requireApprovedLawyer,
  upload.single('file'),
  validate(uploadDocumentSchema),
  documentController.uploadDocument
);

router.get(
  '/:id/documents',
  validate(queryDocumentSchema, 'query'),
  documentController.getCaseDocuments
);

// ==========================================
// Case Fees & Payments (/cases/:id/fee-agreement, /cases/:id/payments, /cases/:id/fees)
// ==========================================

router.put(
  '/:id/fee-agreement',
  requireApprovedLawyer,
  validate(upsertFeeAgreementSchema),
  feeController.upsertFeeAgreement
);

router.post(
  '/:id/payments',
  requireApprovedLawyer,
  validate(createFeePaymentSchema),
  feeController.recordFeePayment
);

router.get(
  '/:id/fees',
  feeController.getCaseFees
);

// ==========================================
// Case Timeline (/cases/:id/timeline)
// ==========================================

router.get(
  '/:id/timeline',
  validate(timelineQuerySchema, 'query'),
  timelineController.getCaseTimeline
);

// ==========================================
// Direct Messages (/cases/:id/messages)
// ==========================================
const messageController = require('../message/message.controller');
const {
  createMessageSchema,
  getMessagesQuerySchema,
  targetIdParamSchema
} = require('../message/message.schemas');

router.post(
  '/:id/messages',
  validate({ params: targetIdParamSchema, body: createMessageSchema }),
  messageController.sendCaseMessage
);

router.get(
  '/:id/messages',
  validate({ params: targetIdParamSchema, query: getMessagesQuerySchema }),
  messageController.getCaseMessages
);

module.exports = router;


