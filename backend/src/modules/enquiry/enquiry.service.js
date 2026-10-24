const {
  Enquiry,
  User,
  LawyerApplication,
  LawyerProfile,
  Booking
} = require('../../models');
const { APPLICATION_STATUS } = require('../../constants');
const { ENQUIRY_STATUS, MAX_PENDING_ENQUIRIES_PER_PAIR } = require('../../constants/enquiry');
const AppError = require('../../utils/AppError');

/**
 * Creates a new pre-booking enquiry from a client to an advocate.
 *
 * @param {string} clientId - UUID of the authenticated client
 * @param {object} param1
 * @param {string} param1.lawyerId - UUID of the LawyerApplication (or lawyer User ID)
 * @param {string} param1.practiceArea
 * @param {string} param1.subject
 * @param {string} param1.message
 * @returns {Promise<object>}
 */
const createEnquiry = async (clientId, { lawyerId, practiceArea, subject, message }) => {
  let app = await LawyerApplication.findByPk(lawyerId, {
    include: [
      {
        model: LawyerProfile,
        as: 'profile',
        attributes: ['isPublic']
      }
    ]
  });

  if (!app) {
    app = await LawyerApplication.findOne({
      where: { userId: lawyerId },
      include: [
        {
          model: LawyerProfile,
          as: 'profile',
          attributes: ['isPublic']
        }
      ]
    });
  }

  if (!app || app.status !== APPLICATION_STATUS.APPROVED) {
    throw new AppError('Advocate not found or not approved', 404);
  }

  if (app.profile && app.profile.isPublic === false) {
    throw new AppError('Advocate is currently not accepting new enquiries', 404);
  }

  // Prevent self-enquiry
  if (app.userId === clientId) {
    throw new AppError('Advocates cannot submit enquiries to themselves', 400);
  }

  // Anti-spam check: ensure client does not exceed active pending enquiries per lawyer
  const pendingCount = await Enquiry.count({
    where: {
      clientId,
      lawyerId: app.userId,
      status: ENQUIRY_STATUS.SUBMITTED
    }
  });

  if (pendingCount >= MAX_PENDING_ENQUIRIES_PER_PAIR) {
    throw new AppError(
      `You have reached the maximum limit of ${MAX_PENDING_ENQUIRIES_PER_PAIR} pending enquiries for this advocate. Please await a reply or close prior enquiries.`,
      429
    );
  }

  const enquiry = await Enquiry.create({
    clientId,
    lawyerId: app.userId,
    practiceArea,
    subject: subject.trim(),
    message: message.trim(),
    status: ENQUIRY_STATUS.SUBMITTED
  });

  return {
    id: enquiry.id,
    clientId: enquiry.clientId,
    lawyerId: app.id,
    practiceArea: enquiry.practiceArea,
    subject: enquiry.subject,
    message: enquiry.message,
    status: enquiry.status,
    lawyerReply: enquiry.lawyerReply,
    repliedAt: enquiry.repliedAt,
    convertedBookingId: enquiry.convertedBookingId,
    createdAt: enquiry.createdAt
  };
};

/**
 * Fetch paginated enquiries submitted by the authenticated client.
 *
 * @param {string} clientId
 * @param {object} param1
 * @param {string} [param1.status]
 * @param {number} [param1.page=1]
 * @param {number} [param1.limit=20]
 * @returns {Promise<object>}
 */
const getClientEnquiries = async (clientId, { status, page = 1, limit = 20 }) => {
  const where = { clientId };
  if (status) {
    where.status = status;
  }

  const offset = (Number(page) - 1) * Number(limit);

  const { count, rows } = await Enquiry.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'lawyer',
        attributes: ['id', 'name']
      },
      {
        model: LawyerApplication,
        as: 'application',
        attributes: ['id', 'city', 'courtLevel', 'practiceAreas']
      }
    ],
    order: [['createdAt', 'DESC']],
    offset,
    limit: Number(limit)
  });

  return {
    enquiries: rows.map((e) => ({
      id: e.id,
      clientId: e.clientId,
      lawyerId: e.application ? e.application.id : e.lawyerId,
      lawyerName: e.lawyer ? e.lawyer.name : '',
      city: e.application ? e.application.city : null,
      courtLevel: e.application ? e.application.courtLevel : null,
      practiceArea: e.practiceArea,
      subject: e.subject,
      message: e.message,
      status: e.status,
      lawyerReply: e.lawyerReply,
      repliedAt: e.repliedAt,
      convertedBookingId: e.convertedBookingId,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt
    })),
    total: count,
    page: Number(page),
    limit: Number(limit)
  };
};

/**
 * Fetch paginated enquiries received by the authenticated advocate.
 *
 * @param {string} lawyerUserId
 * @param {object} param1
 * @param {string} [param1.status]
 * @param {number} [param1.page=1]
 * @param {number} [param1.limit=20]
 * @returns {Promise<object>}
 */
const getLawyerEnquiries = async (lawyerUserId, { status, page = 1, limit = 20 }) => {
  const where = { lawyerId: lawyerUserId };
  if (status) {
    where.status = status;
  }

  const offset = (Number(page) - 1) * Number(limit);

  const { count, rows } = await Enquiry.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'client',
        attributes: ['id', 'name', 'email']
      }
    ],
    order: [['createdAt', 'DESC']],
    offset,
    limit: Number(limit)
  });

  return {
    enquiries: rows.map((e) => ({
      id: e.id,
      clientId: e.clientId,
      clientName: e.client ? e.client.name : '',
      clientEmail: e.client ? e.client.email : '',
      practiceArea: e.practiceArea,
      subject: e.subject,
      message: e.message,
      status: e.status,
      lawyerReply: e.lawyerReply,
      repliedAt: e.repliedAt,
      convertedBookingId: e.convertedBookingId,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt
    })),
    total: count,
    page: Number(page),
    limit: Number(limit)
  };
};

/**
 * Fetch a single enquiry by ID with role-based access validation.
 *
 * @param {string} userId
 * @param {string} role
 * @param {string} enquiryId
 * @returns {Promise<object>}
 */
const getEnquiryById = async (userId, role, enquiryId) => {
  const enquiry = await Enquiry.findByPk(enquiryId, {
    include: [
      {
        model: User,
        as: 'client',
        attributes: ['id', 'name', 'email']
      },
      {
        model: User,
        as: 'lawyer',
        attributes: ['id', 'name']
      },
      {
        model: LawyerApplication,
        as: 'application',
        attributes: ['id', 'city', 'courtLevel', 'practiceAreas']
      },
      {
        model: Booking,
        as: 'convertedBooking',
        attributes: ['id', 'status', 'startUtc', 'mode']
      }
    ]
  });

  if (!enquiry) {
    throw new AppError('Enquiry not found', 404);
  }

  const isAuthorized =
    role === 'admin' || enquiry.clientId === userId || enquiry.lawyerId === userId;

  if (!isAuthorized) {
    throw new AppError('You do not have permission to view this enquiry', 403);
  }

  return {
    id: enquiry.id,
    clientId: enquiry.clientId,
    clientName: enquiry.client ? enquiry.client.name : '',
    clientEmail: enquiry.client ? enquiry.client.email : '',
    lawyerId: enquiry.application ? enquiry.application.id : enquiry.lawyerId,
    lawyerName: enquiry.lawyer ? enquiry.lawyer.name : '',
    city: enquiry.application ? enquiry.application.city : null,
    courtLevel: enquiry.application ? enquiry.application.courtLevel : null,
    practiceArea: enquiry.practiceArea,
    subject: enquiry.subject,
    message: enquiry.message,
    status: enquiry.status,
    lawyerReply: enquiry.lawyerReply,
    repliedAt: enquiry.repliedAt,
    convertedBooking: enquiry.convertedBooking
      ? {
          id: enquiry.convertedBooking.id,
          status: enquiry.convertedBooking.status,
          startUtc: enquiry.convertedBooking.startUtc,
          mode: enquiry.convertedBooking.mode
        }
      : null,
    createdAt: enquiry.createdAt,
    updatedAt: enquiry.updatedAt
  };
};

/**
 * Advocate replies to an enquiry from a client.
 *
 * @param {string} lawyerUserId
 * @param {string} enquiryId
 * @param {string} reply
 * @returns {Promise<object>}
 */
const replyToEnquiry = async (lawyerUserId, enquiryId, reply) => {
  const enquiry = await Enquiry.findByPk(enquiryId);

  if (!enquiry) {
    throw new AppError('Enquiry not found', 404);
  }

  if (enquiry.lawyerId !== lawyerUserId) {
    throw new AppError('You can only reply to enquiries sent to you', 403);
  }

  if (enquiry.status === ENQUIRY_STATUS.CLOSED) {
    throw new AppError('Cannot reply to a closed enquiry', 400);
  }

  enquiry.lawyerReply = reply.trim();
  enquiry.status = ENQUIRY_STATUS.ANSWERED;
  enquiry.repliedAt = new Date();
  await enquiry.save();

  return {
    id: enquiry.id,
    clientId: enquiry.clientId,
    lawyerId: enquiry.lawyerId,
    practiceArea: enquiry.practiceArea,
    subject: enquiry.subject,
    message: enquiry.message,
    status: enquiry.status,
    lawyerReply: enquiry.lawyerReply,
    repliedAt: enquiry.repliedAt,
    convertedBookingId: enquiry.convertedBookingId,
    updatedAt: enquiry.updatedAt
  };
};

/**
 * Close an enquiry (by client, lawyer, or admin).
 *
 * @param {string} userId
 * @param {string} role
 * @param {string} enquiryId
 * @returns {Promise<object>}
 */
const closeEnquiry = async (userId, role, enquiryId) => {
  const enquiry = await Enquiry.findByPk(enquiryId);

  if (!enquiry) {
    throw new AppError('Enquiry not found', 404);
  }

  const isAuthorized =
    role === 'admin' || enquiry.clientId === userId || enquiry.lawyerId === userId;

  if (!isAuthorized) {
    throw new AppError('You do not have permission to close this enquiry', 403);
  }

  if (enquiry.status === ENQUIRY_STATUS.CLOSED) {
    throw new AppError('Enquiry is already closed', 400);
  }

  enquiry.status = ENQUIRY_STATUS.CLOSED;
  await enquiry.save();

  return {
    message: 'Enquiry closed successfully',
    id: enquiry.id,
    status: enquiry.status
  };
};

module.exports = {
  createEnquiry,
  getClientEnquiries,
  getLawyerEnquiries,
  getEnquiryById,
  replyToEnquiry,
  closeEnquiry
};
