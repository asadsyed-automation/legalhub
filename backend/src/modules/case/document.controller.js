const documentService = require('./document.service');

/**
 * Handles uploading a document to a case file.
 * Responds with 201 Created and whitelisted document metadata.
 */
const uploadDocument = async (req, res, next) => {
  try {
    const document = await documentService.uploadDocument(
      req.params.id,
      req.user,
      req.file,
      req.body
    );

    res.status(201).json({
      message: 'Document uploaded successfully',
      document
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles listing documents for a case file.
 * Role-aware: advocates see all, clients see only shared.
 */
const getCaseDocuments = async (req, res, next) => {
  try {
    const result = await documentService.getCaseDocuments(
      req.params.id,
      req.user,
      req.query
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Handles updating document metadata (docType, visibility, tags).
 */
const updateDocument = async (req, res, next) => {
  try {
    const document = await documentService.updateDocument(
      req.params.id,
      req.user,
      req.body
    );

    res.status(200).json({
      message: 'Document updated successfully',
      document
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles binary document streaming for viewing or downloading.
 * Pipes readable storage stream with correct MIME headers.
 */
const downloadDocumentFile = async (req, res, next) => {
  try {
    const { stream, mimeType, originalName, sizeBytes } =
      await documentService.streamDocumentFile(req.params.id, req.user);

    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(originalName)}"`
    );
    if (sizeBytes) {
      res.setHeader('Content-Length', sizeBytes);
    }

    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDocument,
  getCaseDocuments,
  updateDocument,
  downloadDocumentFile
};
