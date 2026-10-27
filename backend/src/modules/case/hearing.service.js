const { Op } = require('sequelize');
const { Case, Hearing } = require('../../models');
const { ROLES } = require('../../constants');
const AppError = require('../../utils/AppError');

/**
 * Whitelist projection function to shield internal advocate notes from clients.
 * Private note is strictly omitted.
 *
 * @param {object} hearing - Raw Hearing model instance or plain object
 * @returns {object} Whitelisted client-safe hearing representation
 */
const projectHearingForClient = (hearing) => {
  const h = typeof hearing.toJSON === 'function' ? hearing.toJSON() : hearing;
  const projected = {
    id: h.id,
    caseId: h.caseId,
    scheduledAt: h.scheduledAt,
    court: h.court,
    bench: h.bench || null,
    stage: h.stage || null,
    outcome: h.outcome || null,
    nextDate: h.nextDate || null,
    adjournmentReason: h.adjournmentReason || null,
    clientExplanation: h.clientExplanation || null,
    visibility: h.visibility,
    createdAt: h.createdAt,
    updatedAt: h.updatedAt
  };

  if (h.case) {
    projected.case = {
      id: h.case.id,
      title: h.case.title,
      court: h.case.court,
      status: h.case.status,
      caseOrFirNumber: h.case.caseOrFirNumber || null
    };
  }

  return projected;
};

/**
 * Schedules a new court hearing for a case. Lawyer only.
 *
 * @param {string} caseId - Case UUID
 * @param {object} user - Authenticated user
 * @param {object} payload - Validated hearing payload
 * @returns {Promise<object>} Created hearing
 */
const createHearing = async (caseId, user, payload) => {
  if (user.role !== ROLES.LAWYER) {
    throw new AppError('Forbidden: Only advocates can schedule court hearings', 403);
  }

  const caseRecord = await Case.findByPk(caseId);
  if (!caseRecord) {
    throw new AppError('Case file not found', 404);
  }

  if (caseRecord.lawyerId !== user.id) {
    throw new AppError('Forbidden: You can only schedule hearings for your own case files', 403);
  }

  const hearing = await Hearing.create({
    caseId,
    scheduledAt: payload.scheduledAt,
    court: payload.court || caseRecord.court,
    bench: payload.bench || null,
    stage: payload.stage || null,
    outcome: payload.outcome || null,
    nextDate: payload.nextDate || null,
    adjournmentReason: payload.adjournmentReason || null,
    note: payload.note || null,
    clientExplanation: payload.clientExplanation || null,
    visibility: payload.visibility || 'shared'
  });

  return hearing;
};

/**
 * Retrieves hearings for a specific case with strict role-aware visibility.
 *
 * @param {string} caseId - Case UUID
 * @param {object} user - Authenticated user
 * @param {object} query - Pagination and filter parameters
 * @returns {Promise<object>} Paginated hearings
 */
const getCaseHearings = async (caseId, user, query = {}) => {
  if (user.role === ROLES.ADMIN) {
    throw new AppError('Forbidden: Administrators have no access to confidential court hearings', 403);
  }

  const caseRecord = await Case.findByPk(caseId);
  if (!caseRecord) {
    throw new AppError('Case file not found', 404);
  }

  if (user.role === ROLES.LAWYER && caseRecord.lawyerId !== user.id) {
    throw new AppError('Forbidden: You cannot access hearings for a case belonging to another chamber', 403);
  }

  if (user.role === ROLES.CLIENT && caseRecord.clientId !== user.id) {
    throw new AppError('Forbidden: You cannot access hearings for a case not linked to your account', 403);
  }

  const page = query.page || 1;
  const limit = query.limit || 20;
  const offset = (page - 1) * limit;

  const where = { caseId };

  if (user.role === ROLES.CLIENT) {
    where.visibility = 'shared';
  } else if (query.visibility) {
    where.visibility = query.visibility;
  }

  const { count, rows } = await Hearing.findAndCountAll({
    where,
    order: [['scheduledAt', 'ASC']],
    limit,
    offset
  });

  const totalPages = Math.ceil(count / limit) || 1;

  if (user.role === ROLES.CLIENT) {
    const projected = rows.map(projectHearingForClient);
    return {
      items: projected,
      hearings: projected,
      total: count,
      page,
      limit,
      totalPages
    };
  }

  return {
    items: rows,
    hearings: rows,
    total: count,
    page,
    limit,
    totalPages
  };
};

/**
 * Updates full hearing details. Lawyer only.
 *
 * @param {string} caseId - Case UUID
 * @param {string} hearingId - Hearing UUID
 * @param {object} user - Authenticated advocate
 * @param {object} payload - Fields to update
 * @returns {Promise<object>} Updated hearing
 */
const updateHearing = async (caseId, hearingId, user, payload) => {
  if (user.role !== ROLES.LAWYER) {
    throw new AppError('Forbidden: Only advocates can modify court hearings', 403);
  }

  const caseRecord = await Case.findByPk(caseId);
  if (!caseRecord) {
    throw new AppError('Case file not found', 404);
  }

  if (caseRecord.lawyerId !== user.id) {
    throw new AppError('Forbidden: You can only modify hearings in your own case files', 403);
  }

  const hearing = await Hearing.findOne({
    where: { id: hearingId, caseId }
  });

  if (!hearing) {
    throw new AppError('Hearing record not found', 404);
  }

  if (payload.scheduledAt !== undefined) hearing.scheduledAt = payload.scheduledAt;
  if (payload.court !== undefined) hearing.court = payload.court;
  if (payload.bench !== undefined) hearing.bench = payload.bench;
  if (payload.stage !== undefined) hearing.stage = payload.stage;
  if (payload.outcome !== undefined) hearing.outcome = payload.outcome;
  if (payload.nextDate !== undefined) hearing.nextDate = payload.nextDate;
  if (payload.adjournmentReason !== undefined) hearing.adjournmentReason = payload.adjournmentReason;
  if (payload.note !== undefined) hearing.note = payload.note;
  if (payload.clientExplanation !== undefined) hearing.clientExplanation = payload.clientExplanation;
  if (payload.visibility !== undefined) hearing.visibility = payload.visibility;

  await hearing.save();
  return hearing;
};

/**
 * Quick outcome recording for a hearing (outcome, nextDate, adjournmentReason only). Lawyer only.
 *
 * @param {string} hearingId - Hearing UUID
 * @param {object} user - Authenticated advocate
 * @param {object} payload - { outcome, nextDate, adjournmentReason }
 * @returns {Promise<object>} Updated hearing
 */
const quickOutcomeHearing = async (hearingId, user, payload) => {
  if (user.role !== ROLES.LAWYER) {
    throw new AppError('Forbidden: Only advocates can record hearing outcomes', 403);
  }

  const hearing = await Hearing.findByPk(hearingId, {
    include: [{ model: Case, as: 'case' }]
  });

  if (!hearing) {
    throw new AppError('Hearing record not found', 404);
  }

  if (!hearing.case || hearing.case.lawyerId !== user.id) {
    throw new AppError('Forbidden: You can only record outcomes for your own chamber hearings', 403);
  }

  hearing.outcome = payload.outcome;
  if (payload.nextDate !== undefined) {
    hearing.nextDate = payload.nextDate;
  }
  if (payload.adjournmentReason !== undefined) {
    hearing.adjournmentReason = payload.adjournmentReason;
  }

  await hearing.save();
  return hearing;
};

/**
 * Cross-case cause list query: GET /hearings?from=&to=&court=
 * Lawyer sees hearings across own cases; Client sees shared hearings of linked cases (projected).
 *
 * @param {object} user - Authenticated user
 * @param {object} query - Filters (from, to, court, page, limit)
 * @returns {Promise<object>} Paginated list of hearings
 */
const listHearingsAcrossCases = async (user, query = {}) => {
  if (user.role === ROLES.ADMIN) {
    throw new AppError('Forbidden: Administrators have no access to confidential court hearings', 403);
  }

  const page = query.page || 1;
  const limit = query.limit || 20;
  const offset = (page - 1) * limit;

  const hearingWhere = {};
  const caseWhere = {};

  if (user.role === ROLES.LAWYER) {
    caseWhere.lawyerId = user.id;
  } else if (user.role === ROLES.CLIENT) {
    caseWhere.clientId = user.id;
    hearingWhere.visibility = 'shared';
  } else {
    throw new AppError('Forbidden: Unauthorized role', 403);
  }

  if (query.from || query.to) {
    hearingWhere.scheduledAt = {};
    if (query.from) {
      hearingWhere.scheduledAt[Op.gte] = new Date(query.from);
    }
    if (query.to) {
      hearingWhere.scheduledAt[Op.lte] = new Date(query.to);
    }
  }

  if (query.court) {
    hearingWhere.court = { [Op.iLike]: `%${query.court}%` };
  }

  const { count, rows } = await Hearing.findAndCountAll({
    where: hearingWhere,
    include: [
      {
        model: Case,
        as: 'case',
        where: caseWhere,
        attributes: ['id', 'title', 'court', 'status', 'caseOrFirNumber']
      }
    ],
    order: [['scheduledAt', 'ASC']],
    limit,
    offset
  });

  const totalPages = Math.ceil(count / limit) || 1;

  if (user.role === ROLES.CLIENT) {
    const projected = rows.map(projectHearingForClient);
    return {
      items: projected,
      hearings: projected,
      total: count,
      page,
      limit,
      totalPages
    };
  }

  return {
    items: rows,
    hearings: rows,
    total: count,
    page,
    limit,
    totalPages
  };
};

module.exports = {
  createHearing,
  getCaseHearings,
  updateHearing,
  quickOutcomeHearing,
  listHearingsAcrossCases,
  projectHearingForClient
};
