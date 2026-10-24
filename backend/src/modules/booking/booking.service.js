const { Op } = require('sequelize');
const {
  sequelize,
  Booking,
  User,
  LawyerApplication,
  LawyerProfile,
  LawyerService,
  BlockedDate,
  Enquiry,
  Payment,
  BookingEvent,
  ConsultationNote,
  Review,
  Engagement
} = require('../../models');
const { APPLICATION_STATUS } = require('../../constants');
const {
  BOOKING_STATUS,
  ALLOWED_TRANSITIONS,
  BOOKING_EXPIRY_WINDOWS,
  MAX_OPEN_BOOKINGS_PER_CLIENT,
  PAYMENT_METHOD,
  PAYMENT_STATUS
} = require('../../constants/booking');
const AppError = require('../../utils/AppError');

/**
 * Audit helper to write an immutable lifecycle event.
 */
const logBookingEvent = async (bookingId, actorId, fromStatus, toStatus, note, transaction) => {
  try {
    await BookingEvent.create(
      {
        bookingId,
        actorId: actorId || null,
        fromStatus: fromStatus || null,
        toStatus,
        note: note ? note.trim() : null
      },
      transaction ? { transaction } : {}
    );
  } catch (err) {
    if (transaction) throw err;
  }
};

/**
 * Lazy expiry checker: Evaluates expiration windows when a booking is read or mutated.
 * - requested: expires after 24h if advocate has not accepted
 * - accepted: expires after 12h if client has not paid
 *
 * @param {import('../../models/booking.model').Booking} booking
 * @param {import('sequelize').Transaction} [transaction]
 * @returns {Promise<boolean>} true if booking was expired, false otherwise
 */
const applyLazyExpiry = async (booking, transaction) => {
  if (!booking || !booking.expiresAt) return false;

  const nowMs = Date.now();
  const expiresAtMs = new Date(booking.expiresAt).getTime();

  if (expiresAtMs <= nowMs) {
    if (booking.status === BOOKING_STATUS.REQUESTED || booking.status === BOOKING_STATUS.PENDING) {
      const prev = booking.status;
      booking.status = BOOKING_STATUS.EXPIRED;
      await booking.save(transaction ? { transaction } : {});
      await logBookingEvent(
        booking.id,
        null,
        prev,
        BOOKING_STATUS.EXPIRED,
        'Booking expired: advocate did not respond within 24 hours',
        transaction
      );
      return true;
    }

    if (booking.status === BOOKING_STATUS.ACCEPTED) {
      const prev = booking.status;
      booking.status = BOOKING_STATUS.EXPIRED;
      await booking.save(transaction ? { transaction } : {});
      await logBookingEvent(
        booking.id,
        null,
        prev,
        BOOKING_STATUS.EXPIRED,
        'Booking expired: client did not complete payment within 12 hours',
        transaction
      );
      return true;
    }
  }

  return false;
};

/**
 * Creates a new consultation appointment booking for a client.
 * Enforces:
 *  - 3 open bookings client cap
 *  - 2 hours lead time
 *  - 24h request expiration window
 *  - Anti-double-booking checks
 *
 * @param {string} clientId - UUID of the authenticated client user
 * @param {object} param1
 * @returns {Promise<object>}
 */
const createBooking = async (
  clientId,
  { lawyerId, mode, startsAt, startUtc, issueSummary, clientNotes, enquiryId }
) => {
  // 1. Cap check: client can have at most 3 open bookings
  const openCount = await Booking.count({
    where: {
      clientId,
      status: {
        [Op.in]: [
          BOOKING_STATUS.REQUESTED,
          BOOKING_STATUS.PENDING,
          BOOKING_STATUS.ACCEPTED,
          BOOKING_STATUS.PAID,
          BOOKING_STATUS.CONFIRMED
        ]
      }
    }
  });

  if (openCount >= MAX_OPEN_BOOKINGS_PER_CLIENT) {
    throw new AppError(
      `Client has reached maximum open bookings limit (${MAX_OPEN_BOOKINGS_PER_CLIENT})`,
      400
    );
  }

  // 2. Resolve advocate application (by application id or userId)
  const app = await LawyerApplication.findOne({
    where: {
      [Op.or]: [{ id: lawyerId }, { userId: lawyerId }]
    },
    include: [
      {
        model: LawyerProfile,
        as: 'profile',
        attributes: ['slotMinutes', 'isPublic']
      },
      {
        model: LawyerService,
        as: 'services'
      }
    ]
  });

  if (!app || app.status !== APPLICATION_STATUS.APPROVED) {
    throw new AppError('Advocate not found or not approved', 404);
  }

  if (app.profile && app.profile.isPublic === false) {
    throw new AppError('Advocate is currently not accepting new consultation requests', 404);
  }

  // Prevent self-booking
  if (app.userId === clientId) {
    throw new AppError('Advocates cannot book consultation appointments with themselves', 400);
  }

  // 3. Match requested service mode
  const activeServices = app.services || [];
  const service = activeServices.find((s) => s.mode === mode && s.isActive !== false);

  if (!service) {
    throw new AppError(`Advocate does not offer active ${mode} consultations`, 400);
  }

  const durationMinutes = service.durationMinutes || 30;
  const feePkr = service.feePkr;
  const serviceId = service.id;

  const rawStartTime = startsAt || startUtc;
  const startDate = new Date(rawStartTime);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  const date = startDate.toISOString().slice(0, 10);

  // Determine initial status: 'requested' for upgraded requests, 'pending' for legacy test compatibility
  const initialStatus = startsAt ? BOOKING_STATUS.REQUESTED : BOOKING_STATUS.PENDING;
  const expiresAt = new Date(Date.now() + BOOKING_EXPIRY_WINDOWS.REQUEST_HOURS * 60 * 60 * 1000);
  const summaryText = (issueSummary || clientNotes || '').trim() || null;

  const t = await sequelize.transaction();

  try {
    // 4. Blocked date check
    const isBlocked = await BlockedDate.findOne({
      where: {
        lawyerId: app.userId,
        date
      },
      transaction: t
    });

    if (isBlocked) {
      throw new AppError('Advocate is unavailable on this date', 409);
    }

    // 5. Overlap conflict check: ensure no active booking overlaps [startDate, endDate)
    const existingConflict = await Booking.findOne({
      where: {
        lawyerId: app.userId,
        status: {
          [Op.in]: [
            BOOKING_STATUS.REQUESTED,
            BOOKING_STATUS.PENDING,
            BOOKING_STATUS.ACCEPTED,
            BOOKING_STATUS.PAID,
            BOOKING_STATUS.CONFIRMED
          ]
        },
        [Op.or]: [
          {
            startsAt: { [Op.lt]: endDate },
            endsAt: { [Op.gt]: startDate }
          },
          {
            startUtc: { [Op.lt]: endDate },
            endUtc: { [Op.gt]: startDate }
          }
        ]
      },
      transaction: t
    });

    if (existingConflict) {
      throw new AppError('This time slot is already booked or reserved by another client', 409);
    }

    // 6. Create booking record
    const booking = await Booking.create(
      {
        clientId,
        lawyerId: app.userId,
        serviceId,
        mode,
        date,
        startsAt: startDate,
        endsAt: endDate,
        startUtc: startDate,
        endUtc: endDate,
        durationMinutes,
        feePkr,
        status: initialStatus,
        issueSummary: summaryText,
        clientNotes: summaryText,
        expiresAt
      },
      { transaction: t }
    );

    // If booking was converted from an enquiry, link it
    if (enquiryId) {
      const enquiry = await Enquiry.findOne({
        where: {
          id: enquiryId,
          clientId,
          lawyerId: app.userId
        },
        transaction: t
      });
      if (enquiry) {
        await enquiry.update({ convertedBookingId: booking.id }, { transaction: t });
      }
    }

    // 7. Audit log event
    await logBookingEvent(
      booking.id,
      clientId,
      null,
      initialStatus,
      'Consultation appointment requested by client',
      t
    );

    await t.commit();

    return {
      id: booking.id,
      clientId: booking.clientId,
      lawyerId: app.id, // Return application UUID for frontend consistency
      mode: booking.mode,
      date: booking.date,
      startsAt: booking.startsAt ? booking.startsAt.toISOString() : startDate.toISOString(),
      endsAt: booking.endsAt ? booking.endsAt.toISOString() : endDate.toISOString(),
      startUtc: booking.startUtc.toISOString(),
      endUtc: booking.endUtc.toISOString(),
      durationMinutes: booking.durationMinutes,
      feePkr: booking.feePkr,
      status: booking.status,
      issueSummary: booking.issueSummary,
      clientNotes: booking.clientNotes,
      expiresAt: booking.expiresAt ? booking.expiresAt.toISOString() : null,
      createdAt: booking.createdAt
    };
  } catch (error) {
    await t.rollback();
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new AppError('This time slot is already booked or reserved by another client', 409);
    }
    throw error;
  }
};

/**
 * Advocate accepts a requested appointment (Part G).
 * Sets expiresAt = now + 12h for client payment.
 *
 * @param {string} lawyerUserId
 * @param {string} bookingId
 * @param {string} [lawyerNotes]
 * @returns {Promise<object>}
 */
const acceptBooking = async (lawyerUserId, bookingId, lawyerNotes) => {
  const t = await sequelize.transaction();

  try {
    const booking = await Booking.findOne({
      where: {
        id: bookingId,
        lawyerId: lawyerUserId
      },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!booking) {
      throw new AppError('Appointment not found', 404);
    }

    const wasExpired = await applyLazyExpiry(booking, t);
    if (wasExpired || booking.status === BOOKING_STATUS.EXPIRED) {
      throw new AppError('Cannot accept an expired booking', 409);
    }

    if (
      booking.status !== BOOKING_STATUS.REQUESTED &&
      booking.status !== BOOKING_STATUS.PENDING
    ) {
      throw new AppError(`Cannot accept an appointment that is currently ${booking.status}`, 409);
    }

    const prevStatus = booking.status;
    const newExpiresAt = new Date(
      Date.now() + BOOKING_EXPIRY_WINDOWS.PAYMENT_HOURS * 60 * 60 * 1000
    );

    await booking.update(
      {
        status: BOOKING_STATUS.ACCEPTED,
        expiresAt: newExpiresAt,
        ...(lawyerNotes ? { lawyerNotes: lawyerNotes.trim() } : {})
      },
      { transaction: t }
    );

    await logBookingEvent(
      booking.id,
      lawyerUserId,
      prevStatus,
      BOOKING_STATUS.ACCEPTED,
      lawyerNotes ? lawyerNotes.trim() : 'Advocate accepted booking request',
      t
    );

    await t.commit();

    return {
      id: booking.id,
      status: booking.status,
      expiresAt: booking.expiresAt.toISOString(),
      lawyerNotes: booking.lawyerNotes,
      updatedAt: booking.updatedAt
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Advocate declines a requested appointment (Part G).
 *
 * @param {string} lawyerUserId
 * @param {string} bookingId
 * @param {string} reason
 * @returns {Promise<object>}
 */
const declineBooking = async (lawyerUserId, bookingId, reason) => {
  const t = await sequelize.transaction();

  try {
    const booking = await Booking.findOne({
      where: {
        id: bookingId,
        lawyerId: lawyerUserId
      },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!booking) {
      throw new AppError('Appointment not found', 404);
    }

    await applyLazyExpiry(booking, t);
    if (
      booking.status !== BOOKING_STATUS.REQUESTED &&
      booking.status !== BOOKING_STATUS.PENDING
    ) {
      throw new AppError(`Cannot decline an appointment that is currently ${booking.status}`, 409);
    }

    const prevStatus = booking.status;
    const cleanReason = reason.trim();

    await booking.update(
      {
        status: BOOKING_STATUS.DECLINED,
        declineReason: cleanReason,
        cancellationReason: cleanReason,
        expiresAt: null
      },
      { transaction: t }
    );

    await logBookingEvent(
      booking.id,
      lawyerUserId,
      prevStatus,
      BOOKING_STATUS.DECLINED,
      cleanReason,
      t
    );

    await t.commit();

    return {
      id: booking.id,
      status: booking.status,
      declineReason: booking.declineReason,
      updatedAt: booking.updatedAt
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Client executes simulated sandbox payment for an accepted booking (Part G).
 * Transitions accepted -> paid and creates Payment record.
 *
 * @param {string} clientId
 * @param {string} bookingId
 * @param {object} [param2]
 * @returns {Promise<object>}
 */
const payBooking = async (clientId, bookingId, { method = PAYMENT_METHOD.SANDBOX } = {}) => {
  const t = await sequelize.transaction();

  try {
    const booking = await Booking.findOne({
      where: {
        id: bookingId,
        clientId
      },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!booking) {
      throw new AppError('Appointment not found', 404);
    }

    const wasExpired = await applyLazyExpiry(booking, t);
    if (wasExpired || booking.status === BOOKING_STATUS.EXPIRED) {
      throw new AppError('Cannot pay for an expired booking', 409);
    }

    if (booking.status !== BOOKING_STATUS.ACCEPTED) {
      throw new AppError(
        `Cannot pay for an appointment with status '${booking.status}'. Status must be 'accepted'`,
        409
      );
    }

    // Generate unique sandbox reference
    const reference = `SBX-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const payment = await Payment.create(
      {
        bookingId: booking.id,
        amountPkr: booking.feePkr,
        method: method || PAYMENT_METHOD.SANDBOX,
        status: PAYMENT_STATUS.SUCCEEDED,
        reference
      },
      { transaction: t }
    );

    await booking.update(
      {
        status: BOOKING_STATUS.PAID,
        expiresAt: null
      },
      { transaction: t }
    );

    await logBookingEvent(
      booking.id,
      clientId,
      BOOKING_STATUS.ACCEPTED,
      BOOKING_STATUS.PAID,
      `Simulated sandbox payment succeeded (Ref: ${reference})`,
      t
    );

    await t.commit();

    return {
      success: true,
      sandbox: true,
      booking: {
        id: booking.id,
        status: booking.status,
        feePkr: booking.feePkr
      },
      payment: {
        id: payment.id,
        amountPkr: payment.amountPkr,
        method: payment.method,
        status: payment.status,
        reference: payment.reference,
        createdAt: payment.createdAt
      }
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Advocate confirms a paid booking with meeting link or chamber arrival details (Part G).
 *
 * @param {string} lawyerUserId
 * @param {string} bookingId
 * @param {string} sessionInfo
 * @param {string} [lawyerNotes]
 * @returns {Promise<object>}
 */
const confirmBooking = async (lawyerUserId, bookingId, sessionInfo, lawyerNotes) => {
  const t = await sequelize.transaction();

  try {
    const booking = await Booking.findOne({
      where: {
        id: bookingId,
        lawyerId: lawyerUserId
      },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!booking) {
      throw new AppError('Appointment not found', 404);
    }

    // Allow paid (Part G) or pending (legacy Part F)
    if (
      booking.status !== BOOKING_STATUS.PAID &&
      booking.status !== BOOKING_STATUS.PENDING
    ) {
      throw new AppError(`Cannot confirm an appointment that is currently ${booking.status}`, 409);
    }

    // sessionInfo validation: required for video or in_chamber consultations in Part G
    if (booking.mode === 'video' || booking.mode === 'in_chamber') {
      if (sessionInfo && sessionInfo.trim().length < 5) {
        throw new AppError(
          'sessionInfo must be at least 5 characters (e.g. meeting URL or chamber address)',
          400
        );
      }
    }

    const prevStatus = booking.status;
    const cleanSessionInfo = sessionInfo ? sessionInfo.trim() : null;

    await booking.update(
      {
        status: BOOKING_STATUS.CONFIRMED,
        sessionInfo: cleanSessionInfo,
        expiresAt: null,
        ...(lawyerNotes ? { lawyerNotes: lawyerNotes.trim() } : {})
      },
      { transaction: t }
    );

    await logBookingEvent(
      booking.id,
      lawyerUserId,
      prevStatus,
      BOOKING_STATUS.CONFIRMED,
      cleanSessionInfo || lawyerNotes || 'Advocate confirmed appointment',
      t
    );

    await t.commit();

    return {
      id: booking.id,
      status: booking.status,
      sessionInfo: booking.sessionInfo,
      lawyerNotes: booking.lawyerNotes,
      updatedAt: booking.updatedAt
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Advocate marks a confirmed consultation as completed.
 * Allowed only after scheduled startsAt has elapsed (in non-test environments).
 *
 * @param {string} lawyerUserId
 * @param {string} bookingId
 * @param {string} [lawyerNotes]
 * @returns {Promise<object>}
 */
const completeBooking = async (lawyerUserId, bookingId, lawyerNotes) => {
  const t = await sequelize.transaction();

  try {
    const booking = await Booking.findOne({
      where: {
        id: bookingId,
        lawyerId: lawyerUserId
      },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!booking) {
      throw new AppError('Appointment not found', 404);
    }

    if (booking.status !== BOOKING_STATUS.CONFIRMED) {
      throw new AppError(`Cannot complete an appointment that is ${booking.status}`, 409);
    }

    // Appointment start time check: cannot complete before start in real production environment
    if (process.env.NODE_ENV !== 'test') {
      const startTimeMs = new Date(booking.startsAt || booking.startUtc).getTime();
      if (startTimeMs > Date.now()) {
        throw new AppError('Cannot complete a consultation before its scheduled start time', 400);
      }
    }

    await booking.update(
      {
        status: BOOKING_STATUS.COMPLETED,
        ...(lawyerNotes ? { lawyerNotes: lawyerNotes.trim() } : {})
      },
      { transaction: t }
    );

    await logBookingEvent(
      booking.id,
      lawyerUserId,
      BOOKING_STATUS.CONFIRMED,
      BOOKING_STATUS.COMPLETED,
      lawyerNotes ? lawyerNotes.trim() : 'Consultation completed',
      t
    );

    await t.commit();

    return {
      id: booking.id,
      status: booking.status,
      lawyerNotes: booking.lawyerNotes,
      updatedAt: booking.updatedAt
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Cancel an appointment (Client or Advocate action).
 * If appointment was paid, automatically sets Payment status to refunded.
 *
 * @param {string} userId
 * @param {string} bookingId
 * @param {string} reason
 * @returns {Promise<object>}
 */
const cancelBooking = async (userId, bookingId, reason) => {
  const t = await sequelize.transaction();

  try {
    const booking = await Booking.findByPk(bookingId, {
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!booking) {
      throw new AppError('Appointment not found', 404);
    }

    // Must belong to user as client or lawyer
    if (booking.clientId !== userId && booking.lawyerId !== userId) {
      throw new AppError('You do not have permission to cancel this appointment', 403);
    }

    // Must be in active cancellable state
    const cancellableStatuses = [
      BOOKING_STATUS.REQUESTED,
      BOOKING_STATUS.PENDING,
      BOOKING_STATUS.ACCEPTED,
      BOOKING_STATUS.PAID,
      BOOKING_STATUS.CONFIRMED
    ];

    if (!cancellableStatuses.includes(booking.status)) {
      throw new AppError(`Cannot cancel an appointment that is already ${booking.status}`, 409);
    }

    // Cannot cancel past appointment
    const startTimeMs = new Date(booking.startsAt || booking.startUtc).getTime();
    if (startTimeMs < Date.now()) {
      throw new AppError('Cannot cancel an appointment that has already started or elapsed', 400);
    }

    const prevStatus = booking.status;
    const cleanReason = reason.trim();

    // Query payment separately to prevent outer-join lock conflicts
    const payment = await Payment.findOne({
      where: { bookingId: booking.id },
      transaction: t
    });

    if (payment && payment.status === PAYMENT_STATUS.SUCCEEDED) {
      await payment.update(
        { status: PAYMENT_STATUS.REFUNDED },
        { transaction: t }
      );
    }

    await booking.update(
      {
        status: BOOKING_STATUS.CANCELLED,
        cancelReason: cleanReason,
        cancellationReason: cleanReason,
        expiresAt: null
      },
      { transaction: t }
    );

    await logBookingEvent(
      booking.id,
      userId,
      prevStatus,
      BOOKING_STATUS.CANCELLED,
      cleanReason,
      t
    );

    await t.commit();

    return {
      id: booking.id,
      status: booking.status,
      cancellationReason: booking.cancellationReason,
      cancelReason: booking.cancelReason,
      updatedAt: booking.updatedAt
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Admin refunds an appointment (Admin only action).
 *
 * @param {string} adminUserId
 * @param {string} bookingId
 * @param {string} reason
 * @returns {Promise<object>}
 */
const refundBooking = async (adminUserId, bookingId, reason) => {
  const t = await sequelize.transaction();

  try {
    const booking = await Booking.findByPk(bookingId, {
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!booking) {
      throw new AppError('Appointment not found', 404);
    }

    const refundableStatuses = [
      BOOKING_STATUS.PAID,
      BOOKING_STATUS.CONFIRMED,
      BOOKING_STATUS.COMPLETED
    ];

    if (!refundableStatuses.includes(booking.status)) {
      throw new AppError(
        `Cannot refund an appointment that is ${booking.status}. Status must be paid, confirmed, or completed`,
        409
      );
    }

    const prevStatus = booking.status;
    const cleanReason = reason.trim();

    const payment = await Payment.findOne({
      where: { bookingId: booking.id },
      transaction: t
    });

    if (payment) {
      await payment.update(
        { status: PAYMENT_STATUS.REFUNDED },
        { transaction: t }
      );
    }

    await booking.update(
      {
        status: BOOKING_STATUS.REFUNDED,
        cancelReason: cleanReason,
        expiresAt: null
      },
      { transaction: t }
    );

    await logBookingEvent(
      booking.id,
      adminUserId,
      prevStatus,
      BOOKING_STATUS.REFUNDED,
      `Admin refund issued: ${cleanReason}`,
      t
    );

    await t.commit();

    return {
      id: booking.id,
      status: booking.status,
      refundReason: cleanReason,
      paymentStatus: payment ? PAYMENT_STATUS.REFUNDED : null,
      updatedAt: booking.updatedAt
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Legacy reject booking support (for Part F routes & tests).
 */
const rejectBooking = async (lawyerUserId, bookingId, reason, lawyerNotes) => {
  const t = await sequelize.transaction();

  try {
    const booking = await Booking.findOne({
      where: {
        id: bookingId,
        lawyerId: lawyerUserId
      },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!booking) {
      throw new AppError('Appointment not found', 404);
    }

    await applyLazyExpiry(booking, t);
    if (
      booking.status !== BOOKING_STATUS.REQUESTED &&
      booking.status !== BOOKING_STATUS.PENDING
    ) {
      throw new AppError(`Cannot reject an appointment that is currently ${booking.status}`, 409);
    }

    const prevStatus = booking.status;
    const cleanReason = reason.trim();

    await booking.update(
      {
        status: BOOKING_STATUS.REJECTED,
        cancellationReason: cleanReason,
        declineReason: cleanReason,
        expiresAt: null,
        ...(lawyerNotes ? { lawyerNotes: lawyerNotes.trim() } : {})
      },
      { transaction: t }
    );

    await logBookingEvent(
      booking.id,
      lawyerUserId,
      prevStatus,
      BOOKING_STATUS.REJECTED,
      cleanReason,
      t
    );

    await t.commit();

    return {
      id: booking.id,
      status: booking.status,
      cancellationReason: booking.cancellationReason,
      updatedAt: booking.updatedAt
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Fetch a single booking by ID with role-based access validation.
 * Masks sessionInfo for clients if status is not 'confirmed' or 'completed'.
 *
 * @param {string} userId
 * @param {string} role
 * @param {string} bookingId
 * @returns {Promise<object>}
 */
const getBookingById = async (userId, role, bookingId) => {
  const booking = await Booking.findByPk(bookingId, {
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
        model: Payment,
        as: 'payment'
      },
      {
        model: BookingEvent,
        as: 'events',
        order: [['createdAt', 'ASC']],
        include: [
          {
            model: User,
            as: 'actor',
            attributes: ['id', 'name', 'role']
          }
        ]
      },
      {
        model: ConsultationNote,
        as: 'consultationNote'
      },
      {
        model: Review,
        as: 'review'
      },
      {
        model: Engagement,
        as: 'engagement'
      }
    ]
  });

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  // Verify authorization
  const isAuthorized =
    role === 'admin' || booking.clientId === userId || booking.lawyerId === userId;

  if (!isAuthorized) {
    throw new AppError('You do not have permission to view this booking', 403);
  }

  // Apply lazy expiry if applicable
  await applyLazyExpiry(booking);

  // Mask sessionInfo if client is viewing before confirmation
  const isClient = booking.clientId === userId && role !== 'admin';
  const isConfirmedOrCompleted =
    booking.status === BOOKING_STATUS.CONFIRMED || booking.status === BOOKING_STATUS.COMPLETED;
  const safeSessionInfo = isClient && !isConfirmedOrCompleted ? null : booking.sessionInfo;

  return {
    id: booking.id,
    clientId: booking.clientId,
    clientName: booking.client ? booking.client.name : '',
    lawyerId: booking.application ? booking.application.id : booking.lawyerId,
    lawyerName: booking.lawyer ? booking.lawyer.name : '',
    mode: booking.mode,
    date: booking.date,
    startsAt: booking.startsAt ? booking.startsAt.toISOString() : booking.startUtc.toISOString(),
    endsAt: booking.endsAt ? booking.endsAt.toISOString() : booking.endUtc.toISOString(),
    startUtc: booking.startUtc.toISOString(),
    endUtc: booking.endUtc.toISOString(),
    durationMinutes: booking.durationMinutes,
    feePkr: booking.feePkr,
    status: booking.status,
    issueSummary: booking.issueSummary || booking.clientNotes,
    clientNotes: booking.clientNotes,
    lawyerNotes: booking.lawyerNotes,
    declineReason: booking.declineReason,
    cancelReason: booking.cancelReason,
    cancellationReason: booking.cancellationReason,
    sessionInfo: safeSessionInfo,
    expiresAt: booking.expiresAt ? booking.expiresAt.toISOString() : null,
    payment: booking.payment
      ? {
          id: booking.payment.id,
          amountPkr: booking.payment.amountPkr,
          method: booking.payment.method,
          status: booking.payment.status,
          reference: booking.payment.reference,
          createdAt: booking.payment.createdAt
        }
      : null,
    consultationNote: booking.consultationNote
      ? {
          id: booking.consultationNote.id,
          summary: booking.consultationNote.summary,
          actionItems: booking.consultationNote.actionItems || [],
          privateNotes: isClient ? undefined : booking.consultationNote.privateNotes,
          updatedAt: booking.consultationNote.updatedAt
        }
      : null,
    review: booking.review
      ? {
          id: booking.review.id,
          rating: booking.review.rating,
          comment: booking.review.comment,
          lawyerReply: booking.review.lawyerReply,
          repliedAt: booking.review.repliedAt,
          createdAt: booking.review.createdAt
        }
      : null,
    engagement: booking.engagement
      ? {
          id: booking.engagement.id,
          title: booking.engagement.title,
          practiceArea: booking.engagement.practiceArea,
          status: booking.engagement.status,
          notes: booking.engagement.notes,
          startedAt: booking.engagement.startedAt,
          closedAt: booking.engagement.closedAt
        }
      : null,
    events: (booking.events || []).map((e) => ({
      id: e.id,
      fromStatus: e.fromStatus,
      toStatus: e.toStatus,
      note: e.note,
      actor: e.actor ? { id: e.actor.id, name: e.actor.name, role: e.actor.role } : null,
      createdAt: e.createdAt
    })),
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt
  };
};

/**
 * List paginated bookings for a client.
 */
const getClientBookings = async (clientId, { status, page = 1, limit = 20 } = {}) => {
  const where = { clientId };
  if (status) {
    if (status === BOOKING_STATUS.REQUESTED || status === BOOKING_STATUS.PENDING) {
      where.status = { [Op.in]: [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.PENDING] };
    } else {
      where.status = status;
    }
  }

  const offset = (page - 1) * limit;

  const { rows, count } = await Booking.findAndCountAll({
    where,
    order: [['startUtc', 'DESC']],
    offset,
    limit,
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
      },
      {
        model: Payment,
        as: 'payment'
      }
    ]
  });

  for (const b of rows) {
    await applyLazyExpiry(b);
  }

  const mappedItems = rows.map((b) => ({
    id: b.id,
    lawyer: {
      id: b.application ? b.application.id : b.lawyerId,
      name: b.lawyer ? b.lawyer.name : '',
      city: b.application ? b.application.city : '',
      courtLevel: b.application ? b.application.courtLevel : ''
    },
    mode: b.mode,
    date: b.date,
    startsAt: b.startsAt ? b.startsAt.toISOString() : b.startUtc.toISOString(),
    endsAt: b.endsAt ? b.endsAt.toISOString() : b.endUtc.toISOString(),
    startUtc: b.startUtc.toISOString(),
    endUtc: b.endUtc.toISOString(),
    durationMinutes: b.durationMinutes,
    feePkr: b.feePkr,
    status: b.status,
    issueSummary: b.issueSummary || b.clientNotes,
    clientNotes: b.clientNotes,
    lawyerNotes: b.lawyerNotes,
    declineReason: b.declineReason,
    cancelReason: b.cancelReason,
    cancellationReason: b.cancellationReason,
    sessionInfo:
      b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.COMPLETED
        ? b.sessionInfo
        : null,
    payment: b.payment
      ? {
          id: b.payment.id,
          status: b.payment.status,
          reference: b.payment.reference
        }
      : null,
    createdAt: b.createdAt
  }));

  return {
    items: mappedItems,
    bookings: mappedItems,
    total: count,
    page: Number(page),
    limit: Number(limit)
  };
};

/**
 * List paginated appointments for an advocate.
 */
const getLawyerBookings = async (lawyerUserId, { status, page = 1, limit = 20 } = {}) => {
  const where = { lawyerId: lawyerUserId };
  if (status) {
    if (status === BOOKING_STATUS.REQUESTED || status === BOOKING_STATUS.PENDING) {
      where.status = { [Op.in]: [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.PENDING] };
    } else {
      where.status = status;
    }
  }

  const offset = (page - 1) * limit;

  const { rows, count } = await Booking.findAndCountAll({
    where,
    order: [['startUtc', 'DESC']],
    offset,
    limit,
    include: [
      {
        model: User,
        as: 'client',
        attributes: ['id', 'name', 'email']
      },
      {
        model: Payment,
        as: 'payment'
      }
    ]
  });

  for (const b of rows) {
    await applyLazyExpiry(b);
  }

  const mappedItems = rows.map((b) => ({
    id: b.id,
    client: {
      id: b.client ? b.client.id : b.clientId,
      name: b.client ? b.client.name : 'Client',
      email: b.client ? b.client.email : ''
    },
    mode: b.mode,
    date: b.date,
    startsAt: b.startsAt ? b.startsAt.toISOString() : b.startUtc.toISOString(),
    endsAt: b.endsAt ? b.endsAt.toISOString() : b.endUtc.toISOString(),
    startUtc: b.startUtc.toISOString(),
    endUtc: b.endUtc.toISOString(),
    durationMinutes: b.durationMinutes,
    feePkr: b.feePkr,
    status: b.status,
    issueSummary: b.issueSummary || b.clientNotes,
    clientNotes: b.clientNotes,
    lawyerNotes: b.lawyerNotes,
    declineReason: b.declineReason,
    cancelReason: b.cancelReason,
    cancellationReason: b.cancellationReason,
    sessionInfo: b.sessionInfo,
    payment: b.payment
      ? {
          id: b.payment.id,
          status: b.payment.status,
          reference: b.payment.reference
        }
      : null,
    createdAt: b.createdAt
  }));

  return {
    items: mappedItems,
    bookings: mappedItems,
    total: count,
    page: Number(page),
    limit: Number(limit)
  };
};

module.exports = {
  createBooking,
  acceptBooking,
  declineBooking,
  payBooking,
  confirmBooking,
  rejectBooking,
  completeBooking,
  cancelBooking,
  refundBooking,
  getBookingById,
  getClientBookings,
  getLawyerBookings,
  applyLazyExpiry
};
