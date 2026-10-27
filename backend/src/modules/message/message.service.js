const { Op } = require('sequelize');
const { Message, Booking, Case, User } = require('../../models');
const { createNotification } = require('../notification/notification.service');
const { NOTIFICATION_TYPES } = require('../../constants/notification');
const AppError = require('../../utils/AppError');

/**
 * Sends a direct message within a booking context.
 */
const sendBookingMessage = async (bookingId, user, payload) => {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  const isClient = booking.clientId === user.id;
  const isLawyer = booking.lawyerId === user.id;

  if (!isClient && !isLawyer) {
    throw new AppError('Forbidden: You are not a participant in this booking', 403);
  }

  const recipientId = isClient ? booking.lawyerId : booking.clientId;

  const message = await Message.create({
    senderId: user.id,
    bookingId,
    caseId: null,
    content: payload.content,
    attachments: payload.attachments || null,
    readAt: null
  });

  // Notify counter-party asynchronously
  try {
    await createNotification({
      userId: recipientId,
      type: NOTIFICATION_TYPES.SYSTEM,
      title: 'New Booking Message',
      body: `${user.name || 'A user'} sent you a message: "${payload.content.slice(0, 80)}"`,
      link: `/bookings/${bookingId}`,
      sendEmail: true
    });
  } catch (err) {
    console.error('[MESSAGE_SERVICE] Notification dispatch failed:', err.message);
  }

  return message;
};

/**
 * Retrieves paginated messages for a booking and marks counter-party messages as read.
 */
const getBookingMessages = async (bookingId, user, { page = 1, limit = 20 } = {}) => {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  const isClient = booking.clientId === user.id;
  const isLawyer = booking.lawyerId === user.id;

  if (!isClient && !isLawyer) {
    throw new AppError('Forbidden: You are not a participant in this booking', 403);
  }

  // Auto-mark unread incoming messages as read
  await Message.update(
    { readAt: new Date() },
    {
      where: {
        bookingId,
        senderId: { [Op.ne]: user.id },
        readAt: null
      },
      validate: false
    }
  );

  const offset = (page - 1) * limit;

  const { count, rows } = await Message.findAndCountAll({
    where: { bookingId },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    include: [
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'name', 'role']
      }
    ]
  });

  const totalPages = Math.ceil(count / limit) || 1;

  return {
    messages: rows,
    pagination: {
      page,
      limit,
      total: count,
      totalPages
    }
  };
};

/**
 * Sends a direct message within an active case file context.
 */
const sendCaseMessage = async (caseId, user, payload) => {
  const caseFile = await Case.findByPk(caseId);
  if (!caseFile) {
    throw new AppError('Case not found', 404);
  }

  const isLawyer = caseFile.lawyerId === user.id;
  const isClient = caseFile.clientId === user.id;

  if (!isLawyer && !isClient) {
    throw new AppError('Forbidden: You are not authorized to message in this case file', 403);
  }

  if (isLawyer && !caseFile.clientId) {
    throw new AppError('Cannot send client message: Case has no linked client', 400);
  }

  const recipientId = isClient ? caseFile.lawyerId : caseFile.clientId;

  const message = await Message.create({
    senderId: user.id,
    bookingId: null,
    caseId,
    content: payload.content,
    attachments: payload.attachments || null,
    readAt: null
  });

  // Notify counter-party asynchronously
  try {
    await createNotification({
      userId: recipientId,
      type: NOTIFICATION_TYPES.SYSTEM,
      title: `New Case Message: ${caseFile.title}`,
      body: `${user.name || 'Counsel/Client'} sent a message: "${payload.content.slice(0, 80)}"`,
      link: `/cases/${caseId}`,
      sendEmail: true
    });
  } catch (err) {
    console.error('[MESSAGE_SERVICE] Notification dispatch failed:', err.message);
  }

  return message;
};

/**
 * Retrieves paginated messages for a case file and marks counter-party messages as read.
 */
const getCaseMessages = async (caseId, user, { page = 1, limit = 20 } = {}) => {
  const caseFile = await Case.findByPk(caseId);
  if (!caseFile) {
    throw new AppError('Case not found', 404);
  }

  const isLawyer = caseFile.lawyerId === user.id;
  const isClient = caseFile.clientId === user.id;

  if (!isLawyer && !isClient) {
    throw new AppError('Forbidden: You are not authorized to view messages for this case file', 403);
  }

  // Auto-mark unread incoming messages as read
  await Message.update(
    { readAt: new Date() },
    {
      where: {
        caseId,
        senderId: { [Op.ne]: user.id },
        readAt: null
      },
      validate: false
    }
  );

  const offset = (page - 1) * limit;

  const { count, rows } = await Message.findAndCountAll({
    where: { caseId },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    include: [
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'name', 'role']
      }
    ]
  });

  const totalPages = Math.ceil(count / limit) || 1;

  return {
    messages: rows,
    pagination: {
      page,
      limit,
      total: count,
      totalPages
    }
  };
};

module.exports = {
  sendBookingMessage,
  getBookingMessages,
  sendCaseMessage,
  getCaseMessages
};
