const request = require('supertest');
const app = require('../src/app');
const {
  User,
  LawyerApplication,
  LawyerProfile,
  LawyerService,
  AvailabilityRule,
  BlockedDate,
  Booking,
  Payment,
  BookingEvent
} = require('../src/models');
const { generateToken } = require('../src/modules/auth/auth.service');
const { ROLES, APPLICATION_STATUS, BOOKING_STATUS, PAYMENT_STATUS } = require('../src/constants');

const TEST_EMAIL_SUFFIX = '@test.legalhub.local';

describe('Part G: Upgraded Booking Lifecycle, FSM, Simulated Payment & Event Audits', () => {
  let clientUser1, clientUser2, approvedLawyerUser, adminUser;
  let client1Token, client2Token, lawyerToken, adminToken;
  let lawyerApp;
  let videoService, chamberService;

  // Monday 2032-05-10
  const mondayDate = '2032-05-10';
  // 17:00 PKT (UTC+5) is 12:00 UTC
  const slot1StartsAt = '2032-05-10T12:00:00.000Z';
  const slot2StartsAt = '2032-05-10T12:30:00.000Z';
  const slot3StartsAt = '2032-05-10T13:00:00.000Z';
  const slot4StartsAt = '2032-05-10T13:30:00.000Z';

  beforeAll(async () => {
    const timestamp = Date.now();

    // 1. Client 1
    clientUser1 = await User.create({
      name: 'Client Zahid Multan',
      email: `zahid_g_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.CLIENT
    });
    client1Token = generateToken(clientUser1);

    // 2. Client 2
    clientUser2 = await User.create({
      name: 'Client Kamran Lahore',
      email: `kamran_g_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.CLIENT
    });
    client2Token = generateToken(clientUser2);

    // 3. Approved Advocate
    approvedLawyerUser = await User.create({
      name: 'Advocate Tariq Khan',
      email: `tariq_g_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER
    });
    lawyerToken = generateToken(approvedLawyerUser);

    // 4. Admin
    adminUser = await User.create({
      name: 'Admin Supervisor',
      email: `admin_g_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.ADMIN
    });
    adminToken = generateToken(adminUser);

    lawyerApp = await LawyerApplication.create({
      userId: approvedLawyerUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `PBC-G-${timestamp}`,
      courtLevel: 'Advocate High Court',
      city: 'Multan',
      practiceAreas: ['Corporate', 'Civil'],
      experienceYears: 10,
      chamberAddress: 'Chamber 12, High Court Multan Bench',
      bio: 'Corporate and civil dispute resolution.',
      status: APPLICATION_STATUS.APPROVED
    });

    await LawyerProfile.create({
      userId: approvedLawyerUser.id,
      headline: 'Corporate Counsel Multan',
      slotMinutes: 30,
      isPublic: true
    });

    videoService = await LawyerService.create({
      lawyerId: approvedLawyerUser.id,
      mode: 'video',
      durationMinutes: 30,
      feePkr: 4000,
      isActive: true
    });

    chamberService = await LawyerService.create({
      lawyerId: approvedLawyerUser.id,
      mode: 'in_chamber',
      durationMinutes: 30,
      feePkr: 6000,
      isActive: true
    });

    // Configure Monday availability: 17:00 to 19:30 PKT (weekday 1)
    await AvailabilityRule.create({
      lawyerId: approvedLawyerUser.id,
      weekday: 1, // Monday
      startTime: '17:00',
      endTime: '19:30'
    });
  });

  afterAll(async () => {
    const userIds = [
      clientUser1?.id,
      clientUser2?.id,
      approvedLawyerUser?.id,
      adminUser?.id
    ].filter(Boolean);

    if (userIds.length > 0) {
      const bookings = await Booking.findAll({
        where: {
          [require('sequelize').Op.or]: [{ clientId: userIds }, { lawyerId: userIds }]
        },
        attributes: ['id']
      });
      const bookingIds = bookings.map((b) => b.id);

      if (bookingIds.length > 0) {
        await Payment.destroy({ where: { bookingId: bookingIds } }).catch(() => {});
        await BookingEvent.destroy({ where: { bookingId: bookingIds } }).catch(() => {});
      }

      await Booking.destroy({ where: { clientId: userIds } }).catch(() => {});
      await Booking.destroy({ where: { lawyerId: userIds } }).catch(() => {});
      await AvailabilityRule.destroy({ where: { lawyerId: userIds } }).catch(() => {});
      await LawyerService.destroy({ where: { lawyerId: userIds } }).catch(() => {});
      await LawyerProfile.destroy({ where: { userId: userIds } }).catch(() => {});
      await LawyerApplication.destroy({ where: { userId: userIds } }).catch(() => {});
      await User.destroy({ where: { id: userIds } }).catch(() => {});
    }
  });

  // =========================================================================
  // 1. RBAC & Open Booking Limits
  // =========================================================================
  describe('1. RBAC & Client Open Bookings Cap', () => {
    it('should return 401 when booking without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .send({
          lawyerId: lawyerApp.id,
          mode: 'video',
          startsAt: slot1StartsAt,
          issueSummary: 'Corporate restructuring and tax advisory query.'
        });
      expect(res.status).toBe(401);
    });

    it('should enforce client open bookings cap of 3 (400 Bad Request on 4th booking)', async () => {
      // Create 3 open bookings for client 2 across distinct slots
      const b1 = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${client2Token}`)
        .send({
          lawyerId: lawyerApp.id,
          mode: 'video',
          startsAt: slot1StartsAt,
          issueSummary: 'First booking inquiry on contract law dispute.'
        });
      expect(b1.status).toBe(201);
      expect(b1.body.booking.status).toBe(BOOKING_STATUS.REQUESTED);

      const b2 = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${client2Token}`)
        .send({
          lawyerId: lawyerApp.id,
          mode: 'video',
          startsAt: slot2StartsAt,
          issueSummary: 'Second booking inquiry on family property inheritance.'
        });
      expect(b2.status).toBe(201);

      const b3 = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${client2Token}`)
        .send({
          lawyerId: lawyerApp.id,
          mode: 'video',
          startsAt: slot3StartsAt,
          issueSummary: 'Third booking inquiry on commercial tenant rent notice.'
        });
      expect(b3.status).toBe(201);

      // Attempt 4th open booking for client 2 -> must be rejected
      const b4 = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${client2Token}`)
        .send({
          lawyerId: lawyerApp.id,
          mode: 'video',
          startsAt: slot4StartsAt,
          issueSummary: 'Fourth booking inquiry which exceeds maximum limit.'
        });

      expect(b4.status).toBe(400);
      expect(b4.body.error).toMatch(/maximum open bookings limit \(3\)/i);

      // Clean up client 2 bookings so they don't block subsequent tests
      await BookingEvent.destroy({ where: { bookingId: [b1.body.booking.id, b2.body.booking.id, b3.body.booking.id] } });
      await Booking.destroy({ where: { id: [b1.body.booking.id, b2.body.booking.id, b3.body.booking.id] } });
    });
  });

  // =========================================================================
  // 2. Booking Creation, 24h Expiry & Partial Unique Index (Race Conditions)
  // =========================================================================
  describe('2. Booking Creation & Concurrency Guarantee', () => {
    let createdBookingId;

    it('should create booking in requested status with 24h expiry and initial audit event', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({
          lawyerId: lawyerApp.id,
          mode: 'video',
          startsAt: slot1StartsAt,
          issueSummary: 'Client seeking legal advice on multan property partition deed.'
        });

      expect(res.status).toBe(201);
      expect(res.body.booking).toBeDefined();
      expect(res.body.booking.status).toBe(BOOKING_STATUS.REQUESTED);
      expect(res.body.booking.startsAt).toBe(slot1StartsAt);
      expect(res.body.booking.feePkr).toBe(4000);
      expect(res.body.booking.expiresAt).toBeDefined();

      createdBookingId = res.body.booking.id;

      // Verify audit event
      const events = await BookingEvent.findAll({ where: { bookingId: createdBookingId } });
      expect(events.length).toBe(1);
      expect(events[0].toStatus).toBe(BOOKING_STATUS.REQUESTED);
      expect(events[0].actorId).toBe(clientUser1.id);
    });

    it('should return 409 Conflict when another client attempts to book the same slot (Partial Unique Index)', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${client2Token}`)
        .send({
          lawyerId: lawyerApp.id,
          mode: 'video',
          startsAt: slot1StartsAt,
          issueSummary: 'Second client attempting to book duplicate time slot.'
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already booked or reserved/i);
    });
  });

  // =========================================================================
  // 3. Status Machine & Payment Simulation (Happy Path)
  // =========================================================================
  describe('3. Happy Path: requested -> accepted -> paid -> confirmed -> completed', () => {
    let bookingId;

    beforeAll(async () => {
      // Create a clean booking on slot 2
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({
          lawyerId: lawyerApp.id,
          mode: 'video',
          startsAt: slot2StartsAt,
          issueSummary: 'Complete consultation workflow test from booking to completion.'
        });
      bookingId = res.body.booking.id;
    });

    it('should allow advocate to accept booking and reset expiry to 12 hours (PATCH /bookings/:id/accept)', async () => {
      const res = await request(app)
        .patch(`/api/v1/bookings/${bookingId}/accept`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({ lawyerNotes: 'Available to consult on civil partition matter.' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(BOOKING_STATUS.ACCEPTED);
      expect(res.body.expiresAt).toBeDefined();

      // Check event
      const latestEvent = await BookingEvent.findOne({
        where: { bookingId, toStatus: BOOKING_STATUS.ACCEPTED }
      });
      expect(latestEvent).toBeDefined();
      expect(latestEvent.actorId).toBe(approvedLawyerUser.id);
    });

    it('should mask sessionInfo from client view when booking is accepted but not yet confirmed', async () => {
      const res = await request(app)
        .get(`/api/v1/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${client1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.booking.status).toBe(BOOKING_STATUS.ACCEPTED);
      expect(res.body.booking.sessionInfo).toBeNull();
    });

    it('should allow client to execute simulated sandbox checkout (POST /bookings/:id/pay)', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/pay`)
        .set('Authorization', `Bearer ${client1Token}`)
        .send({ method: 'sandbox' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.sandbox).toBe(true);
      expect(res.body.booking.status).toBe(BOOKING_STATUS.PAID);
      expect(res.body.payment).toBeDefined();
      expect(res.body.payment.amountPkr).toBe(4000);
      expect(res.body.payment.status).toBe(PAYMENT_STATUS.SUCCEEDED);
      expect(res.body.payment.reference).toMatch(/^SBX-/);

      // Verify payment in database
      const dbPayment = await Payment.findOne({ where: { bookingId } });
      expect(dbPayment).toBeDefined();
      expect(dbPayment.status).toBe(PAYMENT_STATUS.SUCCEEDED);
    });

    it('should return 409 Conflict if advocate attempts to complete a paid booking before confirmation', async () => {
      const res = await request(app)
        .patch(`/api/v1/bookings/${bookingId}/complete`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({ lawyerNotes: 'Trying to complete prematurely' });

      expect(res.status).toBe(409);
    });

    it('should allow advocate to confirm paid booking with meeting link (PATCH /bookings/:id/confirm)', async () => {
      const sessionUrl = 'https://meet.jit.si/legalhub-multan-civil-case-98';
      const res = await request(app)
        .patch(`/api/v1/bookings/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          sessionInfo: sessionUrl,
          lawyerNotes: 'Please join 5 minutes early with property tax records.'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(BOOKING_STATUS.CONFIRMED);
      expect(res.body.sessionInfo).toBe(sessionUrl);
    });

    it('should reveal sessionInfo to client now that booking is confirmed', async () => {
      const res = await request(app)
        .get(`/api/v1/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${client1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.booking.sessionInfo).toBe('https://meet.jit.si/legalhub-multan-civil-case-98');
    });

    it('should allow advocate to complete the confirmed consultation appointment (PATCH /bookings/:id/complete)', async () => {
      const res = await request(app)
        .patch(`/api/v1/bookings/${bookingId}/complete`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({ lawyerNotes: 'Consultation concluded; drafted notice issued to opposing counsel.' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(BOOKING_STATUS.COMPLETED);

      // Verify audit events trail includes all 4 transitions
      const detailRes = await request(app)
        .get(`/api/v1/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${client1Token}`);

      const eventStatuses = detailRes.body.booking.events.map((e) => e.toStatus);
      expect(eventStatuses).toContain(BOOKING_STATUS.REQUESTED);
      expect(eventStatuses).toContain(BOOKING_STATUS.ACCEPTED);
      expect(eventStatuses).toContain(BOOKING_STATUS.PAID);
      expect(eventStatuses).toContain(BOOKING_STATUS.CONFIRMED);
      expect(eventStatuses).toContain(BOOKING_STATUS.COMPLETED);
    });
  });

  // =========================================================================
  // 4. Decline & Expiry Lifecycle Transitions
  // =========================================================================
  describe('4. Decline & Lazy Expiry Transitions', () => {
    let bookingToDeclineId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({
          lawyerId: lawyerApp.id,
          mode: 'video',
          startsAt: slot3StartsAt,
          issueSummary: 'Consultation to test advocate decline and reason enforcement.'
        });
      bookingToDeclineId = res.body.booking.id;
    });

    it('should require decline reason of at least 10 characters (400 Bad Request)', async () => {
      const res = await request(app)
        .patch(`/api/v1/bookings/${bookingToDeclineId}/decline`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({ reason: 'Short' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should allow advocate to decline booking with valid reason (PATCH /bookings/:id/decline)', async () => {
      const res = await request(app)
        .patch(`/api/v1/bookings/${bookingToDeclineId}/decline`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({ reason: 'Advocate is appearing in High Court Division Bench on this date.' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(BOOKING_STATUS.DECLINED);
      expect(res.body.declineReason).toMatch(/High Court Division Bench/i);
    });

    it('should return 409 Conflict if client attempts to pay for a declined booking', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${bookingToDeclineId}/pay`)
        .set('Authorization', `Bearer ${client1Token}`)
        .send({ method: 'sandbox' });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/Cannot pay for an appointment with status 'declined'/i);
    });

    it('should lazily transition a booking with elapsed expiresAt to expired status', async () => {
      // Create a booking with an expired timestamp (1 hour in past)
      const pastDate = new Date(Date.now() - 60 * 60 * 1000);
      const expiredBooking = await Booking.create({
        clientId: clientUser1.id,
        lawyerId: approvedLawyerUser.id,
        serviceId: videoService.id,
        mode: 'video',
        date: mondayDate,
        startsAt: slot4StartsAt,
        endsAt: new Date(new Date(slot4StartsAt).getTime() + 30 * 60 * 1000),
        startUtc: slot4StartsAt,
        endUtc: new Date(new Date(slot4StartsAt).getTime() + 30 * 60 * 1000),
        durationMinutes: 30,
        feePkr: 4000,
        status: BOOKING_STATUS.REQUESTED,
        expiresAt: pastDate
      });

      // Reading the booking triggers lazy expiry evaluation
      const res = await request(app)
        .get(`/api/v1/bookings/${expiredBooking.id}`)
        .set('Authorization', `Bearer ${client1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.booking.status).toBe(BOOKING_STATUS.EXPIRED);

      // Verify audit log has expired event
      const event = await BookingEvent.findOne({
        where: { bookingId: expiredBooking.id, toStatus: BOOKING_STATUS.EXPIRED }
      });
      expect(event).toBeDefined();
      expect(event.note).toMatch(/did not respond within 24 hours/i);
    });
  });

  // =========================================================================
  // 5. Cancellation with Payment Refund & Admin Refund
  // =========================================================================
  describe('5. Cancellation with Payment Refund & Admin Refund', () => {
    let cancelBookingId, adminRefundBookingId;

    it('should automatically set Payment to refunded when client cancels a paid appointment', async () => {
      // 1. Create booking on future Tuesday
      const tuesdaySlot = '2032-05-11T12:00:00.000Z';
      const bRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({
          lawyerId: lawyerApp.id,
          mode: 'video',
          startsAt: tuesdaySlot,
          issueSummary: 'Consultation booking to test automatic payment refund upon cancellation.'
        });
      cancelBookingId = bRes.body.booking.id;

      // 2. Lawyer accepts
      await request(app)
        .patch(`/api/v1/bookings/${cancelBookingId}/accept`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({ lawyerNotes: 'Accepted' });

      // 3. Client pays
      await request(app)
        .post(`/api/v1/bookings/${cancelBookingId}/pay`)
        .set('Authorization', `Bearer ${client1Token}`)
        .send({ method: 'sandbox' });

      // Verify payment succeeded
      const p1 = await Payment.findOne({ where: { bookingId: cancelBookingId } });
      expect(p1.status).toBe(PAYMENT_STATUS.SUCCEEDED);

      // 4. Client cancels before appointment start
      const cancelRes = await request(app)
        .patch(`/api/v1/bookings/${cancelBookingId}/cancel`)
        .set('Authorization', `Bearer ${client1Token}`)
        .send({ reason: 'Emergency medical treatment abroad scheduled.' });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.status).toBe(BOOKING_STATUS.CANCELLED);

      // 5. Verify payment status is refunded
      const p2 = await Payment.findOne({ where: { bookingId: cancelBookingId } });
      expect(p2.status).toBe(PAYMENT_STATUS.REFUNDED);
    });

    it('should allow admin to issue refund for a paid/confirmed appointment (PATCH /admin/bookings/:id/refund)', async () => {
      // 1. Create booking
      const wednesdaySlot = '2032-05-12T12:00:00.000Z';
      const bRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({
          lawyerId: lawyerApp.id,
          mode: 'video',
          startsAt: wednesdaySlot,
          issueSummary: 'Consultation to test admin refund capability for client dispute.'
        });
      adminRefundBookingId = bRes.body.booking.id;

      // 2. Lawyer accepts & client pays
      await request(app)
        .patch(`/api/v1/bookings/${adminRefundBookingId}/accept`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send();
      await request(app)
        .post(`/api/v1/bookings/${adminRefundBookingId}/pay`)
        .set('Authorization', `Bearer ${client1Token}`)
        .send({ method: 'sandbox' });

      // 3. Admin issues refund
      const refundRes = await request(app)
        .patch(`/api/v1/admin/bookings/${adminRefundBookingId}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Administrative resolution: Technical connectivity failure during video session.' });

      expect(refundRes.status).toBe(200);
      expect(refundRes.body.status).toBe(BOOKING_STATUS.REFUNDED);
      expect(refundRes.body.paymentStatus).toBe(PAYMENT_STATUS.REFUNDED);

      // Verify event audit trail records admin refund
      const refundEvent = await BookingEvent.findOne({
        where: { bookingId: adminRefundBookingId, toStatus: BOOKING_STATUS.REFUNDED }
      });
      expect(refundEvent).toBeDefined();
      expect(refundEvent.actorId).toBe(adminUser.id);
      expect(refundEvent.note).toMatch(/Technical connectivity failure/i);
    });
  });
});
