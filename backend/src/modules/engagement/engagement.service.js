const { Op } = require('sequelize');
const { Engagement, Booking, User } = require('../../models');
const AppError = require('../../utils/AppError');
const { ROLES } = require('../../constants/roles');
const { ENGAGEMENT_STATUS } = require('../../constants/engagement');

/**
 * Creates a formal legal engagement between a client and an advocate/firm.
 *
 * @param {object} user
 * @param {object} data
 * @returns {Promise<Engagement>}
 */
const createEngagement = async (user, data) => {
  let { clientId, lawyerId, bookingId, title, practiceArea, notes } = data;

  // Derive missing participant from booking if provided
  if (bookingId) {
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      throw new AppError('Linked booking not found', 404);
    }

    if (user.role === ROLES.CLIENT) {
      if (booking.clientId !== user.id) {
        throw new AppError('Forbidden: Linked booking does not belong to your client account', 403);
      }
      lawyerId = booking.lawyerId;
    } else if (user.role === ROLES.LAWYER || user.role === ROLES.LAW_FIRM) {
      if (booking.lawyerId !== user.id) {
        throw new AppError('Forbidden: Linked booking is not assigned to your legal practice', 403);
      }
      clientId = booking.clientId;
    }
  }

  // Determine participant IDs based on authenticated actor role
  if (user.role === ROLES.CLIENT) {
    clientId = user.id;
    if (!lawyerId) {
      throw new AppError('lawyerId is required when initiating an engagement as a client', 400);
    }
  } else if (user.role === ROLES.LAWYER || user.role === ROLES.LAW_FIRM) {
    lawyerId = user.id;
    if (!clientId) {
      throw new AppError('clientId is required when initiating an engagement as a practitioner', 400);
    }
  } else if (user.role === ROLES.ADMIN) {
    if (!clientId || !lawyerId) {
      throw new AppError('Both clientId and lawyerId are required when an administrator creates an engagement', 400);
    }
  } else {
    throw new AppError('Forbidden: Role not authorized to initiate legal engagements', 403);
  }

  // Verify client user exists and is a client
  const clientUser = await User.findByPk(clientId);
  if (!clientUser || clientUser.role !== ROLES.CLIENT) {
    throw new AppError('Client user not found or invalid client account', 404);
  }

  // Verify lawyer user exists and is an advocate / law firm
  const lawyerUser = await User.findByPk(lawyerId);
  if (!lawyerUser || (lawyerUser.role !== ROLES.LAWYER && lawyerUser.role !== ROLES.LAW_FIRM)) {
    throw new AppError('Legal practitioner not found or invalid account', 404);
  }

  const engagement = await Engagement.create({
    clientId,
    lawyerId,
    bookingId: bookingId || null,
    title,
    practiceArea,
    status: ENGAGEMENT_STATUS.ACTIVE,
    startedAt: new Date(),
    closedAt: null,
    notes: notes || null
  });

  return engagement;
};

/**
 * Retrieves paginated engagements for the authenticated participant.
 *
 * @param {object} user
 * @param {{ status?: string, page?: number, limit?: number }} query
 * @returns {Promise<object>}
 */
const listEngagements = async (user, { status, page = 1, limit = 10 } = {}) => {
  const where = {};

  if (user.role === ROLES.ADMIN) {
    // Admin can see all or filter by status
    if (status) where.status = status;
  } else {
    // Participant filter (Client or Legal Practitioner)
    where[Op.or] = [{ clientId: user.id }, { lawyerId: user.id }];
    if (status) where.status = status;
  }

  const offset = (page - 1) * limit;

  const { count, rows: engagements } = await Engagement.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'client',
        attributes: ['id', 'name', 'email']
      },
      {
        model: User,
        as: 'lawyer',
        attributes: ['id', 'name', 'email', 'role']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  const totalPages = Math.ceil(count / limit) || 1;

  return {
    engagements,
    pagination: {
      total: count,
      page,
      limit,
      totalPages
    }
  };
};

/**
 * Retrieves a single engagement by ID with authorization check.
 *
 * @param {string} id
 * @param {object} user
 * @returns {Promise<Engagement>}
 */
const getEngagementById = async (id, user) => {
  const engagement = await Engagement.findByPk(id, {
    include: [
      {
        model: User,
        as: 'client',
        attributes: ['id', 'name', 'email']
      },
      {
        model: User,
        as: 'lawyer',
        attributes: ['id', 'name', 'email', 'role']
      },
      {
        model: Booking,
        as: 'booking',
        attributes: ['id', 'status', 'startsAt', 'endsAt', 'feePkr']
      }
    ]
  });

  if (!engagement) {
    throw new AppError('Engagement not found', 404);
  }

  if (
    user.role !== ROLES.ADMIN &&
    engagement.clientId !== user.id &&
    engagement.lawyerId !== user.id
  ) {
    throw new AppError('Forbidden: You are not a participant in this engagement', 403);
  }

  return engagement;
};

/**
 * Updates an engagement (notes, title, or status closure).
 *
 * @param {string} id
 * @param {object} user
 * @param {{ title?: string, status?: string, notes?: string }} data
 * @returns {Promise<Engagement>}
 */
const updateEngagement = async (id, user, { title, status, notes }) => {
  const engagement = await Engagement.findByPk(id);

  if (!engagement) {
    throw new AppError('Engagement not found', 404);
  }

  if (
    user.role !== ROLES.ADMIN &&
    engagement.clientId !== user.id &&
    engagement.lawyerId !== user.id
  ) {
    throw new AppError('Forbidden: You are not a participant in this engagement', 403);
  }

  if (title !== undefined) engagement.title = title;
  if (notes !== undefined) engagement.notes = notes;

  if (status !== undefined && status !== engagement.status) {
    engagement.status = status;
    if (status === ENGAGEMENT_STATUS.CLOSED) {
      engagement.closedAt = new Date();
    } else if (status === ENGAGEMENT_STATUS.ACTIVE) {
      engagement.closedAt = null;
    }
  }

  await engagement.save();

  return engagement;
};

module.exports = {
  createEngagement,
  listEngagements,
  getEngagementById,
  updateEngagement
};
