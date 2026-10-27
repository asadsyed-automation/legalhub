const { Case, CaseEntry } = require('../../models');
const { ROLES } = require('../../constants');
const AppError = require('../../utils/AppError');

/**
 * Whitelist projection function to shield internal advocate fields from clients.
 *
 * @param {object} entry - Raw CaseEntry model instance or plain object
 * @returns {object} Whitelisted client-safe entry representation
 */
const projectCaseEntryForClient = (entry) => {
  const e = typeof entry.toJSON === 'function' ? entry.toJSON() : entry;
  return {
    id: e.id,
    caseId: e.caseId,
    entryDate: e.entryDate,
    entryType: e.entryType,
    title: e.title,
    body: e.body,
    visibility: e.visibility,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt
  };
};

/**
 * Creates a case diary entry. Lawyer only.
 *
 * @param {string} caseId - UUID of the case
 * @param {object} user - Authenticated user
 * @param {object} payload - Validated entry payload
 * @returns {Promise<object>} Created case entry
 */
const createEntry = async (caseId, user, payload) => {
  if (user.role !== ROLES.LAWYER) {
    throw new AppError('Forbidden: Only advocates can create case diary entries', 403);
  }

  const caseRecord = await Case.findByPk(caseId);
  if (!caseRecord) {
    throw new AppError('Case file not found', 404);
  }

  if (caseRecord.lawyerId !== user.id) {
    throw new AppError('Forbidden: You can only add diary entries to your own case files', 403);
  }

  const entry = await CaseEntry.create({
    caseId,
    entryDate: payload.entryDate,
    entryType: payload.entryType,
    title: payload.title,
    body: payload.body,
    visibility: payload.visibility || 'private'
  });

  return entry;
};

/**
 * Retrieves case entries for a case with strict role-aware visibility.
 *
 * @param {string} caseId - UUID of the case
 * @param {object} user - Authenticated user
 * @param {object} query - Query parameters (page, limit, entryType, visibility)
 * @returns {Promise<object>} Paginated case entries
 */
const getEntries = async (caseId, user, query = {}) => {
  if (user.role === ROLES.ADMIN) {
    throw new AppError('Forbidden: Administrators have no access to confidential case diary entries', 403);
  }

  const caseRecord = await Case.findByPk(caseId);
  if (!caseRecord) {
    throw new AppError('Case file not found', 404);
  }

  if (user.role === ROLES.LAWYER && caseRecord.lawyerId !== user.id) {
    throw new AppError('Forbidden: You cannot access entries for a case belonging to another chamber', 403);
  }

  if (user.role === ROLES.CLIENT && caseRecord.clientId !== user.id) {
    throw new AppError('Forbidden: You cannot access entries for a case not linked to your account', 403);
  }

  const page = query.page || 1;
  const limit = query.limit || 10;
  const offset = (page - 1) * limit;

  const where = { caseId };

  if (user.role === ROLES.CLIENT) {
    where.visibility = 'shared';
  } else if (query.visibility) {
    where.visibility = query.visibility;
  }

  if (query.entryType) {
    where.entryType = query.entryType;
  }

  const { count, rows } = await CaseEntry.findAndCountAll({
    where,
    order: [
      ['entryDate', 'DESC'],
      ['createdAt', 'DESC']
    ],
    limit,
    offset
  });

  const totalPages = Math.ceil(count / limit) || 1;

  if (user.role === ROLES.CLIENT) {
    const projected = rows.map(projectCaseEntryForClient);
    return {
      items: projected,
      entries: projected,
      total: count,
      page,
      limit,
      totalPages
    };
  }

  return {
    items: rows,
    entries: rows,
    total: count,
    page,
    limit,
    totalPages
  };
};

/**
 * Modifies an existing case entry. Lawyer only.
 *
 * @param {string} caseId - UUID of the case
 * @param {string} entryId - UUID of the entry
 * @param {object} user - Authenticated user
 * @param {object} payload - Fields to update
 * @returns {Promise<object>} Updated case entry
 */
const updateEntry = async (caseId, entryId, user, payload) => {
  if (user.role !== ROLES.LAWYER) {
    throw new AppError('Forbidden: Only advocates can modify case diary entries', 403);
  }

  const caseRecord = await Case.findByPk(caseId);
  if (!caseRecord) {
    throw new AppError('Case file not found', 404);
  }

  if (caseRecord.lawyerId !== user.id) {
    throw new AppError('Forbidden: You can only modify entries in your own case files', 403);
  }

  const entry = await CaseEntry.findOne({
    where: { id: entryId, caseId }
  });

  if (!entry) {
    throw new AppError('Case diary entry not found', 404);
  }

  if (payload.entryDate !== undefined) entry.entryDate = payload.entryDate;
  if (payload.entryType !== undefined) entry.entryType = payload.entryType;
  if (payload.title !== undefined) entry.title = payload.title;
  if (payload.body !== undefined) entry.body = payload.body;
  if (payload.visibility !== undefined) entry.visibility = payload.visibility;

  await entry.save();
  return entry;
};

module.exports = {
  createEntry,
  getEntries,
  updateEntry,
  projectCaseEntryForClient
};
