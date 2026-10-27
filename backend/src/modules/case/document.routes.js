const { Router } = require('express');
const documentController = require('./document.controller');
const verifyToken = require('../../middleware/verifyToken');
const requireApprovedLawyer = require('../../middleware/requireApprovedLawyer');
const validate = require('../../middleware/validate');
const { updateDocumentSchema } = require('./document.schemas');

const router = Router();

// Protect all document endpoints with JWT authentication
router.use(verifyToken);

// Update document metadata (Assigned advocate only)
router.patch(
  '/:id',
  requireApprovedLawyer,
  validate(updateDocumentSchema),
  documentController.updateDocument
);

// Stream document file (Role-aware: advocate all, client shared only)
router.get(
  '/:id/file',
  documentController.downloadDocumentFile
);

module.exports = router;
