const { Op } = require('sequelize');
const { Case, Document, User } = require('../../models');
const { ROLES } = require('../../constants');
const AppError = require('../../utils/AppError');
const { validateFileSignature } = require('../../utils/fileSignature');
const { uploadFile, getFileStream, deleteFile } = require('../../services/storage/cloudinaryStorage');

/**
 * Whitelist projection function to shield internal storage IDs (publicId, resourceType)
 * from API consumers and clients.
 *
 * @param {object} doc - Raw Document model instance or plain object
 * @returns {object} Whitelisted client-safe document representation
 */
const projectDocument = (doc) => {
  const d = typeof doc.toJSON === 'function' ? doc.toJSON() : doc;
  return {
    id: d.id,
    caseId: d.caseId,
    originalName: d.originalName,
    mimeType: d.mimeType,
    sizeBytes: Number(d.sizeBytes),
    docType: d.docType,
    tags: d.tags || [],
    visibility: d.visibility,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt
  };
};

/**
 * Uploads a document to a case file. Assigned advocate only.
 *
 * @param {string} caseId - UUID of the case
 * @param {object} user - Authenticated user
 * @param {object} file - Uploaded multer file
 * @param {object} payload - Validated metadata (docType, visibility, tags)
 * @returns {Promise<object>} Whitelisted document metadata
 */
const uploadDocument = async (caseId, user, file, payload) => {
  if (user.role === ROLES.ADMIN) {
    throw new AppError('Forbidden: Administrators cannot upload case documents', 403);
  }

  if (user.role !== ROLES.LAWYER) {
    throw new AppError('Forbidden: Only approved advocates can upload case documents', 403);
  }

  if (!file || !file.buffer) {
    throw new AppError('Document file is required', 400);
  }

  const caseRecord = await Case.findByPk(caseId);
  if (!caseRecord) {
    throw new AppError('Case file not found', 404);
  }

  if (caseRecord.lawyerId !== user.id) {
    throw new AppError('Forbidden: You can only upload documents to your own case files', 403);
  }

  // Verify file size and magic bytes header
  const detected = validateFileSignature(file.buffer, file.mimetype, file.originalname);

  // Store file in private asset storage adapter
  const { publicId, resourceType, sizeBytes } = await uploadFile({
    buffer: file.buffer,
    originalName: file.originalname,
    mimeType: detected.mimeType
  });

  const doc = await Document.create({
    caseId,
    uploadedBy: user.id,
    originalName: file.originalname,
    mimeType: detected.mimeType,
    sizeBytes,
    docType: payload.docType,
    tags: payload.tags || [],
    visibility: payload.visibility || 'private',
    publicId,
    resourceType
  });

  return projectDocument(doc);
};

/**
 * Retrieves case documents with role-based filtering:
 * - Assigned advocate: sees all documents (both private and shared)
 * - Linked client: sees ONLY shared documents
 * - Admin or unlinked users: 403 Forbidden
 *
 * @param {string} caseId - UUID of the case
 * @param {object} user - Authenticated user
 * @param {object} [query={}] - Optional query filters (docType, visibility, tag)
 * @returns {Promise<{ items: object[], total: number }>}
 */
const getCaseDocuments = async (caseId, user, query = {}) => {
  if (user.role === ROLES.ADMIN) {
    throw new AppError('Forbidden: Administrators have no access to confidential case documents', 403);
  }

  const caseRecord = await Case.findByPk(caseId);
  if (!caseRecord) {
    throw new AppError('Case file not found', 404);
  }

  if (user.role === ROLES.LAWYER && caseRecord.lawyerId !== user.id) {
    throw new AppError('Forbidden: You cannot access documents for a case belonging to another chamber', 403);
  }

  if (user.role === ROLES.CLIENT && caseRecord.clientId !== user.id) {
    throw new AppError('Forbidden: You cannot access documents for a case not linked to your account', 403);
  }

  const where = { caseId };

  if (user.role === ROLES.CLIENT) {
    // Clients strictly restricted to shared documents
    where.visibility = 'shared';
  } else if (query.visibility) {
    where.visibility = query.visibility;
  }

  if (query.docType) {
    where.docType = query.docType;
  }

  const documents = await Document.findAll({
    where,
    order: [['createdAt', 'DESC']]
  });

  let filtered = documents;
  if (query.tag) {
    const searchTag = query.tag.toLowerCase();
    filtered = documents.filter((doc) =>
      Array.isArray(doc.tags) && doc.tags.some((t) => t.toLowerCase() === searchTag)
    );
  }

  const projected = filtered.map(projectDocument);
  return {
    items: projected,
    documents: projected,
    total: projected.length
  };
};

/**
 * Updates document metadata (docType, visibility, tags). Assigned advocate only.
 *
 * @param {string} documentId - UUID of the document
 * @param {object} user - Authenticated user
 * @param {object} payload - Fields to update
 * @returns {Promise<object>} Whitelisted updated document
 */
const updateDocument = async (documentId, user, payload) => {
  if (user.role === ROLES.ADMIN) {
    throw new AppError('Forbidden: Administrators cannot modify case documents', 403);
  }

  if (user.role !== ROLES.LAWYER) {
    throw new AppError('Forbidden: Only advocates can modify document metadata', 403);
  }

  const doc = await Document.findByPk(documentId, {
    include: [{ model: Case, as: 'case' }]
  });

  if (!doc) {
    throw new AppError('Document not found', 404);
  }

  if (doc.case.lawyerId !== user.id) {
    throw new AppError('Forbidden: You can only modify documents in your own case files', 403);
  }

  if (payload.docType) doc.docType = payload.docType;
  if (payload.visibility) doc.visibility = payload.visibility;
  if (payload.tags !== undefined) doc.tags = payload.tags;

  await doc.save();

  return projectDocument(doc);
};

/**
 * Streams document binary file for downloading.
 * Role-aware:
 * - Assigned advocate: allowed for all documents.
 * - Linked client: allowed ONLY IF visibility is 'shared'.
 * - Admin or others: 403 Forbidden.
 *
 * @param {string} documentId - UUID of the document
 * @param {object} user - Authenticated user
 * @returns {Promise<{ stream: import('stream').Readable, mimeType: string, originalName: string, sizeBytes: number }>}
 */
const streamDocumentFile = async (documentId, user) => {
  if (user.role === ROLES.ADMIN) {
    throw new AppError('Forbidden: Administrators have no access to confidential case files', 403);
  }

  const doc = await Document.findByPk(documentId, {
    include: [{ model: Case, as: 'case' }]
  });

  if (!doc) {
    throw new AppError('Document not found', 404);
  }

  if (user.role === ROLES.LAWYER) {
    if (doc.case.lawyerId !== user.id) {
      throw new AppError('Forbidden: You cannot download documents belonging to another chamber', 403);
    }
  } else if (user.role === ROLES.CLIENT) {
    if (doc.case.clientId !== user.id) {
      throw new AppError('Forbidden: You cannot download documents for a case not linked to your account', 403);
    }
    if (doc.visibility !== 'shared') {
      throw new AppError('Forbidden: Access denied to private case document', 403);
    }
  } else {
    throw new AppError('Forbidden: Access denied', 403);
  }

  const stream = await getFileStream(doc.publicId, doc.resourceType);

  return {
    stream,
    mimeType: doc.mimeType,
    originalName: doc.originalName,
    sizeBytes: Number(doc.sizeBytes)
  };
};

module.exports = {
  projectDocument,
  uploadDocument,
  getCaseDocuments,
  updateDocument,
  streamDocumentFile
};
