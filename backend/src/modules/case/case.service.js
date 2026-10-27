const { Op } = require('sequelize');
const { sequelize, Case, CaseParty, CaseStatusEvent, Booking, User, Hearing, Document } = require('../../models');
const AppError = require('../../utils/AppError');
const { ROLES } = require('../../constants/roles');
const { BOOKING_STATUS } = require('../../constants/booking');

/**
 * Resolves the earliest future hearing for a single case file.
 *
 * @param {string} caseId - Case UUID
 * @param {boolean} isClient - Whether requester is a client
 * @param {Function} [now] - Injectable clock
 * @returns {Promise<object|null>}
 */
const resolveNextHearingForCase = async (caseId, isClient = false, now = () => new Date()) => {
  const where = {
    caseId,
    scheduledAt: { [Op.gte]: now() }
  };
  if (isClient) {
    where.visibility = 'shared';
  }
  const hearing = await Hearing.findOne({
    where,
    order: [['scheduledAt', 'ASC']],
    attributes: [
      'id',
      'scheduledAt',
      'court',
      'bench',
      'stage',
      'outcome',
      'nextDate',
      'adjournmentReason',
      ...(isClient ? ['clientExplanation'] : ['note', 'clientExplanation']),
      'visibility'
    ]
  });
  return hearing ? (typeof hearing.toJSON === 'function' ? hearing.toJSON() : hearing) : null;
};

/**
 * Explicit Whitelist Projection Function for Clients.
 * Guarantees zero leakage of internal notes, booking internals, or unshared items.
 *
 * @param {object} caseRecord - Sequelize Case instance or plain object
 * @param {object|null} [nextHearing=null] - Earliest upcoming hearing
 * @returns {object} Whitelisted client-safe case projection
 */
const projectCaseForClient = (caseRecord, nextHearing = null, sharedDocumentsCount = null) => {
  const c = caseRecord.toJSON ? caseRecord.toJSON() : caseRecord;
  return {
    id: c.id,
    title: c.title,
    court: c.court,
    practiceArea: c.practiceArea,
    status: c.status,
    stage: c.stage || null,
    caseOrFirNumber: c.caseOrFirNumber || null,
    filingDate: c.filingDate || null,
    parties: (c.parties || []).map((p) => ({
      id: p.id,
      name: p.name,
      roleLabel: p.roleLabel
    })),
    nextHearing: nextHearing || null,
    ...(sharedDocumentsCount !== null ? { sharedDocumentsCount: Number(sharedDocumentsCount) } : {}),
    createdAt: c.createdAt,
    updatedAt: c.updatedAt
  };
};

/**
 * Format full case object for the owning lawyer.
 * Strictly prevents email leakage of opposite party while providing full litigation context.
 *
 * @param {object} caseRecord
 * @param {object|null} [nextHearing=null] - Earliest upcoming hearing
 * @returns {object} Full lawyer-safe case object
 */
const formatCaseForLawyer = (caseRecord, nextHearing = null) => {
  const c = caseRecord.toJSON ? caseRecord.toJSON() : caseRecord;
  return {
    id: c.id,
    lawyerId: c.lawyerId,
    clientId: c.clientId || null,
    bookingId: c.bookingId || null,
    title: c.title,
    court: c.court,
    practiceArea: c.practiceArea,
    status: c.status,
    stage: c.stage || null,
    caseOrFirNumber: c.caseOrFirNumber || null,
    filingDate: c.filingDate || null,
    parties: (c.parties || []).map((p) => ({
      id: p.id,
      name: p.name,
      roleLabel: p.roleLabel
    })),
    statusEvents: (c.statusEvents || []).map((e) => ({
      id: e.id,
      fromStatus: e.fromStatus,
      toStatus: e.toStatus,
      fromStage: e.fromStage,
      toStage: e.toStage,
      changedBy: e.changedBy,
      createdAt: e.createdAt
    })),
    client: c.client
      ? {
          id: c.client.id,
          name: c.client.name
        }
      : null,
    nextHearing: nextHearing || null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt
  };
};

/**
 * Creates a new case for an approved advocate.
 *
 * @param {object} user - Authenticated user session
 * @param {object} payload - Validated case creation data
 * @param {Function} [now] - Injectable clock for testability
 * @returns {Promise<object>}
 */
const createCase = async (user, payload, now = () => new Date()) => {
  if (user.role !== ROLES.LAWYER) {
    throw new AppError('Forbidden: Only approved advocates can create case files', 403);
  }

  let resolvedClientId = null;

  // Validate booking linking if provided
  if (payload.bookingId) {
    const booking = await Booking.findByPk(payload.bookingId);
    if (!booking) {
      throw new AppError('Consultation booking not found', 404);
    }

    if (booking.lawyerId !== user.id) {
      throw new AppError('Forbidden: You can only link consultation bookings assigned to your chamber', 403);
    }

    if (booking.status !== BOOKING_STATUS.COMPLETED) {
      throw new AppError(
        `Only completed consultation bookings can be linked to a case. Current booking status is '${booking.status}'`,
        400
      );
    }

    // Check if booking is already linked to another case
    const existingCase = await Case.findOne({ where: { bookingId: payload.bookingId } });
    if (existingCase) {
      throw new AppError('This consultation booking is already linked to an existing case file', 409);
    }

    resolvedClientId = booking.clientId;
  }

  const transaction = await sequelize.transaction();

  try {
    const initialStatus = payload.status || 'Prospect';
    const initialStage = payload.stage || null;

    const newCase = await Case.create(
      {
        lawyerId: user.id,
        clientId: resolvedClientId,
        bookingId: payload.bookingId || null,
        title: payload.title,
        practiceArea: payload.practiceArea,
        court: payload.court,
        caseOrFirNumber: payload.caseOrFirNumber || null,
        filingDate: payload.filingDate || null,
        status: initialStatus,
        stage: initialStage
      },
      { transaction }
    );

    // Save parties if provided
    let createdParties = [];
    if (Array.isArray(payload.parties) && payload.parties.length > 0) {
      createdParties = await CaseParty.bulkCreate(
        payload.parties.map((p) => ({
          caseId: newCase.id,
          name: p.name,
          roleLabel: p.roleLabel
        })),
        { transaction, returning: true }
      );
    }

    // Record initial status event
    const statusEvent = await CaseStatusEvent.create(
      {
        caseId: newCase.id,
        fromStatus: null,
        toStatus: initialStatus,
        fromStage: null,
        toStage: initialStage,
        changedBy: user.id,
        createdAt: now()
      },
      { transaction }
    );

    await transaction.commit();

    return getCaseById(newCase.id, user);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Retrieves a list of cases accessible to the authenticated user.
 * Role-aware: Advocates see their own cases; Clients see linked cases projected. Admins receive 403.
 *
 * @param {object} user - Authenticated user
 * @param {object} query - Query parameters (status, practiceArea, court, page, limit)
 * @returns {Promise<object>}
 */
const getCases = async (user, query = {}, now = () => new Date()) => {
  if (user.role === ROLES.ADMIN) {
    throw new AppError('Forbidden: Court administrators have no access to confidential case files', 403);
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
  const offset = (page - 1) * limit;

  const whereClause = {};

  if (user.role === ROLES.LAWYER) {
    whereClause.lawyerId = user.id;
  } else if (user.role === ROLES.CLIENT) {
    whereClause.clientId = user.id;
  } else {
    throw new AppError('Forbidden: Unauthorized role', 403);
  }

  if (query.status) {
    whereClause.status = query.status;
  }
  if (query.practiceArea) {
    whereClause.practiceArea = query.practiceArea;
  }
  if (query.court) {
    whereClause.court = query.court;
  }

  const { rows, count } = await Case.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: CaseParty,
        as: 'parties',
        attributes: ['id', 'name', 'roleLabel']
      },
      {
        model: CaseStatusEvent,
        as: 'statusEvents',
        attributes: ['id', 'fromStatus', 'toStatus', 'fromStage', 'toStage', 'changedBy', 'createdAt']
      },
      {
        model: User,
        as: 'client',
        attributes: ['id', 'name']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    distinct: true
  });

  const caseIds = rows.map((r) => r.id);
  const nextHearingWhere = {
    caseId: { [Op.in]: caseIds },
    scheduledAt: { [Op.gte]: now() }
  };
  if (user.role === ROLES.CLIENT) {
    nextHearingWhere.visibility = 'shared';
  }
  const upcomingHearings =
    caseIds.length > 0
      ? await Hearing.findAll({
          where: nextHearingWhere,
          order: [['scheduledAt', 'ASC']],
          attributes: [
            'id',
            'caseId',
            'scheduledAt',
            'court',
            'bench',
            'stage',
            'outcome',
            'nextDate',
            'adjournmentReason',
            ...(user.role === ROLES.CLIENT ? ['clientExplanation'] : ['note', 'clientExplanation']),
            'visibility'
          ]
        })
      : [];

  const nextHearingMap = new Map();
  for (const h of upcomingHearings) {
    if (!nextHearingMap.has(h.caseId)) {
      nextHearingMap.set(h.caseId, typeof h.toJSON === 'function' ? h.toJSON() : h);
    }
  }

  const totalPages = Math.ceil(count / limit) || 1;

  if (user.role === ROLES.CLIENT) {
    const projected = rows.map((r) => projectCaseForClient(r, nextHearingMap.get(r.id) || null));
    return {
      items: projected,
      cases: projected,
      total: count,
      page,
      limit,
      totalPages
    };
  }

  const formatted = rows.map((r) => formatCaseForLawyer(r, nextHearingMap.get(r.id) || null));
  return {
    items: formatted,
    cases: formatted,
    total: count,
    page,
    limit,
    totalPages
  };
};

/**
 * Retrieves a single case by ID with strict ownership and projection boundaries.
 *
 * @param {string} caseId - Case UUID
 * @param {object} user - Authenticated user
 * @param {Function} [now] - Injectable clock for testability
 * @returns {Promise<object>}
 */
const getCaseById = async (caseId, user, now = () => new Date()) => {
  if (user.role === ROLES.ADMIN) {
    throw new AppError('Forbidden: Court administrators have no access to confidential case files', 403);
  }

  const caseRecord = await Case.findByPk(caseId, {
    include: [
      {
        model: CaseParty,
        as: 'parties',
        attributes: ['id', 'name', 'roleLabel']
      },
      {
        model: CaseStatusEvent,
        as: 'statusEvents',
        attributes: ['id', 'fromStatus', 'toStatus', 'fromStage', 'toStage', 'changedBy', 'createdAt']
      },
      {
        model: User,
        as: 'client',
        attributes: ['id', 'name']
      }
    ]
  });

  if (!caseRecord) {
    throw new AppError('Case file not found', 404);
  }

  const nextHearing = await resolveNextHearingForCase(caseRecord.id, user.role === ROLES.CLIENT, now);

  // Permission boundary check
  if (user.role === ROLES.LAWYER) {
    if (caseRecord.lawyerId !== user.id) {
      throw new AppError('Forbidden: Only the assigned advocate can access this case file', 403);
    }
    return formatCaseForLawyer(caseRecord, nextHearing);
  }

  if (user.role === ROLES.CLIENT) {
    if (caseRecord.clientId !== user.id) {
      throw new AppError('Forbidden: You do not have access to this case file', 403);
    }
    const sharedDocumentsCount = await Document.count({
      where: { caseId: caseRecord.id, visibility: 'shared' }
    });
    return projectCaseForClient(caseRecord, nextHearing, sharedDocumentsCount);
  }

  throw new AppError('Forbidden: Unauthorized role', 403);
};

/**
 * Updates case fields, full replacement of parties, status/stage, and late client linking.
 * Lawyer only.
 *
 * @param {string} caseId - Case UUID
 * @param {object} user - Authenticated advocate
 * @param {object} payload - Update payload
 * @param {Function} [now] - Injectable clock for testability
 * @returns {Promise<object>}
 */
const updateCase = async (caseId, user, payload, now = () => new Date()) => {
  if (user.role !== ROLES.LAWYER) {
    throw new AppError('Forbidden: Only advocates can modify case files', 403);
  }

  const caseRecord = await Case.findByPk(caseId, {
    include: [
      {
        model: CaseParty,
        as: 'parties'
      },
      {
        model: CaseStatusEvent,
        as: 'statusEvents'
      },
      {
        model: User,
        as: 'client',
        attributes: ['id', 'name']
      }
    ]
  });

  if (!caseRecord) {
    throw new AppError('Case file not found', 404);
  }

  if (caseRecord.lawyerId !== user.id) {
    throw new AppError('Forbidden: Only the assigned advocate can modify this case file', 403);
  }

  const transaction = await sequelize.transaction();

  try {
    // 1. Linking booking/client later
    if (payload.bookingId !== undefined && payload.bookingId !== null) {
      if (caseRecord.clientId !== null) {
        throw new AppError('Conflict: This case is already linked to a client and cannot be re-linked', 409);
      }

      const booking = await Booking.findByPk(payload.bookingId);
      if (!booking) {
        throw new AppError('Consultation booking not found', 404);
      }

      if (booking.lawyerId !== user.id) {
        throw new AppError('Forbidden: You can only link consultation bookings assigned to your chamber', 403);
      }

      if (booking.status !== BOOKING_STATUS.COMPLETED) {
        throw new AppError(
          `Only completed consultation bookings can be linked to a case. Current booking status is '${booking.status}'`,
          400
        );
      }

      const existingCase = await Case.findOne({ where: { bookingId: payload.bookingId } });
      if (existingCase && existingCase.id !== caseRecord.id) {
        throw new AppError('This consultation booking is already linked to an existing case file', 409);
      }

      caseRecord.bookingId = payload.bookingId;
      caseRecord.clientId = booking.clientId;
    }

    // 2. Track status / stage transitions
    const oldStatus = caseRecord.status;
    const oldStage = caseRecord.stage;
    const newStatus = payload.status !== undefined ? payload.status : oldStatus;
    const newStage = payload.stage !== undefined ? payload.stage : oldStage;

    const hasStatusOrStageChanged = newStatus !== oldStatus || newStage !== oldStage;

    // 3. Update case attributes
    if (payload.title !== undefined) caseRecord.title = payload.title;
    if (payload.practiceArea !== undefined) caseRecord.practiceArea = payload.practiceArea;
    if (payload.court !== undefined) caseRecord.court = payload.court;
    if (payload.caseOrFirNumber !== undefined) caseRecord.caseOrFirNumber = payload.caseOrFirNumber;
    if (payload.filingDate !== undefined) caseRecord.filingDate = payload.filingDate;
    if (payload.status !== undefined) caseRecord.status = newStatus;
    if (payload.stage !== undefined) caseRecord.stage = newStage;

    await caseRecord.save({ transaction });

    // 4. Full replacement of parties if supplied
    if (Array.isArray(payload.parties)) {
      await CaseParty.destroy({ where: { caseId: caseRecord.id }, transaction });
      if (payload.parties.length > 0) {
        await CaseParty.bulkCreate(
          payload.parties.map((p) => ({
            caseId: caseRecord.id,
            name: p.name,
            roleLabel: p.roleLabel
          })),
          { transaction }
        );
      }
    }

    // 5. Write status event if status or stage changed
    if (hasStatusOrStageChanged) {
      await CaseStatusEvent.create(
        {
          caseId: caseRecord.id,
          fromStatus: oldStatus,
          toStatus: newStatus,
          fromStage: oldStage,
          toStage: newStage,
          changedBy: user.id,
          createdAt: now()
        },
        { transaction }
      );
    }

    await transaction.commit();

    // Reload with updated parties and status events
    const updatedCase = await Case.findByPk(caseId, {
      include: [
        {
          model: CaseParty,
          as: 'parties',
          attributes: ['id', 'name', 'roleLabel']
        },
        {
          model: CaseStatusEvent,
          as: 'statusEvents',
          attributes: ['id', 'fromStatus', 'toStatus', 'fromStage', 'toStage', 'changedBy', 'createdAt']
        },
        {
          model: User,
          as: 'client',
          attributes: ['id', 'name']
        }
      ]
    });

    return formatCaseForLawyer(updatedCase);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  createCase,
  getCases,
  getCaseById,
  updateCase,
  projectCaseForClient,
  formatCaseForLawyer
};
