const request = require('supertest');
const app = require('../src/app');
const {
  User,
  LawyerApplication,
  LawyerProfile,
  LawyerService,
  AvailabilityRule,
  BlockedDate,
  Booking
} = require('../src/models');
const { generateToken } = require('../src/modules/auth/auth.service');
const { ROLES, APPLICATION_STATUS, BOOKING_STATUS } = require('../src/constants');

const TEST_EMAIL_SUFFIX = '@test.legalhub.local';

describe('Part F: Consultation Bookings & Appointment Lifecycle Tests', () => {
  let clientUser1, clientUser2, approvedLawyerUser, unapprovedLawyerUser;
  let client1Token, client2Token, lawyerToken, unapprovedLawyerToken;
  let lawyerApp, unapprovedLawyerApp;
  let lawyerVideoService, lawyerChamberService;

  // A future date for scheduling: Monday 2030-08-12
  const appointmentDate = '2030-08-12';
  // 17:00 PKT (UTC+5) is 12:00 UTC
  const slotStartUtc = '2030-08-12T12:00:00.000Z';
  const slotEndUtc = '2030-08-12T12:30:00.000Z';

  beforeAll(async () => {
    const timestamp = Date.now();

    // 1. Client 1
    clientUser1 = await User.create({
      name: 'Client Aslam',
      email: `client1_bk_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.CLIENT
    });
    client1Token = generateToken(clientUser1);

    // 2. Client 2
    clientUser2 = await User.create({
      name: 'Client Bilal',
      email: `client2_bk_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.CLIENT
    });
    client2Token = generateToken(clientUser2);

    // 3. Approved Lawyer
    approvedLawyerUser = await User.create({
      name: 'Advocate Waqas Multan',
      email: `lawyer_bk_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER
    });
    lawyerToken = generateToken(approvedLawyerUser);

    lawyerApp = await LawyerApplication.create({
      userId: approvedLawyerUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `PBC-BK-${timestamp}`,
      courtLevel: 'Advocate High Court',
      city: 'Multan',
      practiceAreas: ['Corporate', 'Civil'],
      experienceYears: 12,
      chamberAddress: 'Chamber 18, High Court Multan Bench',
      bio: 'Corporate and civil counsel.',
      status: APPLICATION_STATUS.APPROVED
    });

    await LawyerProfile.create({
      userId: approvedLawyerUser.id,
      headline: 'Corporate Specialist Multan',
      slotMinutes: 30,
      isPublic: true
    });

    lawyerVideoService = await LawyerService.create({
      lawyerId: approvedLawyerUser.id,
      mode: 'video',
      durationMinutes: 30,
      feePkr: 3500,
      isActive: true
    });

    lawyerChamberService = await LawyerService.create({
      lawyerId: approvedLawyerUser.id,
      mode: 'in_chamber',
      durationMinutes: 30,
      feePkr: 5000,
      isActive: true
    });

    // Configure Monday availability: 17:00 to 19:00 PKT (weekday 1)
    await AvailabilityRule.create({
      lawyerId: approvedLawyerUser.id,
      weekday: 1, // Monday
      startTime: '17:00',
      endTime: '19:00'
    });

    // 4. Unapproved (Pending) Lawyer
    unapprovedLawyerUser = await User.create({
      name: 'Advocate Pending BK',
      email: `pending_bk_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER
    });
    unapprovedLawyerToken = generateToken(unapprovedLawyerUser);

    unapprovedLawyerApp = await LawyerApplication.create({
      userId: unapprovedLawyerUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `PBC-PENDBK-${timestamp}`,
      courtLevel: 'Advocate Lower Courts',
      city: 'Lahore',
      practiceAreas: ['Criminal'],
      experienceYears: 2,
      chamberAddress: 'Lahore Katchery',
      bio: 'Junior lawyer.',
      status: APPLICATION_STATUS.PENDING
    });
  });

  afterAll(async () => {
    // Cleanup
    const userIds = [
      clientUser1?.id,
      clientUser2?.id,
      approvedLawyerUser?.id,
      unapprovedLawyerUser?.id
    ].filter(Boolean);

    if (userIds.length > 0) {
      await Booking.destroy({
        where: {
          [require('sequelize').Op.or]: [{ clientId: userIds }, { lawyerId: userIds }]
        }
      }).catch(() => {});
      await BlockedDate.destroy({ where: { lawyerId: userIds } }).catch(() => {});
      await AvailabilityRule.destroy({ where: { lawyerId: userIds } }).catch(() => {});
      await LawyerService.destroy({ where: { lawyerId: userIds } }).catch(() => {});
      await LawyerProfile.destroy({ where: { userId: userIds } }).catch(() => {});
      await LawyerApplication.destroy({ where: { userId: userIds } }).catch(() => {});
      await User.destroy({ where: { id: userIds } }).catch(() => {});
    }
  });

  // =========================================================================
  // 1. RBAC & Authentication Guards
  // =========================================================================
  describe('1. RBAC & Authentication Guards', () => {
    it('should return 401 Unauthorized when booking appointment without token', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .send({ lawyerId: lawyerApp.id, mode: 'video', startUtc: slotStartUtc });
      expect(res.status).toBe(401);
    });

    it('should return 403 Forbidden when a lawyer attempts to create a client booking', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({ lawyerId: lawyerApp.id, mode: 'video', startUtc: slotStartUtc });
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/You do not have permission/i);
    });

    it('should return 403 Forbidden when a client attempts to view lawyer appointment dashboard', async () => {
      const res = await request(app)
        .get('/api/v1/lawyer/appointments')
        .set('Authorization', `Bearer ${client1Token}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/You do not have permission/i);
    });

    it('should return 403 Forbidden when an unapproved lawyer accesses lawyer appointment dashboard', async () => {
      const res = await request(app)
        .get('/api/v1/lawyer/appointments')
        .set('Authorization', `Bearer ${unapprovedLawyerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Only approved advocates can manage/i);
    });
  });

  // =========================================================================
  // 2. Booking Creation & Concurrency/Conflict Tests (POST /api/v1/bookings)
  // =========================================================================
  describe('2. Booking Creation & Conflict Prevention', () => {
    let createdBookingId;

    it('should reject booking when startUtc is less than 2 hours ahead of now (400 Bad Request)', async () => {
      const nowPlus30Min = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({
          lawyerId: lawyerApp.id,
          mode: 'video',
          startUtc: nowPlus30Min
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details.some((d) => /2 hours/i.test(d.message))).toBe(true);
    });

    it('should reject booking for an unapproved advocate with 404 Not Found', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({
          lawyerId: unapprovedLawyerApp.id,
          mode: 'video',
          startUtc: slotStartUtc
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found or not approved/i);
    });

    it('should reject booking for a consultation mode the lawyer does not offer (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({
          lawyerId: lawyerApp.id,
          mode: 'chat', // Lawyer only configured video & in_chamber
          startUtc: slotStartUtc
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/does not offer active chat/i);
    });

    it('should successfully create a pending booking (201 Created)', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({
          lawyerId: lawyerApp.id,
          mode: 'video',
          startUtc: slotStartUtc,
          clientNotes: 'Seeking legal opinion on civil property inheritance suit.'
        });

      expect(res.status).toBe(201);
      expect(res.body.booking).toBeDefined();
      expect(res.body.booking.status).toBe(BOOKING_STATUS.PENDING);
      expect(res.body.booking.mode).toBe('video');
      expect(res.body.booking.feePkr).toBe(3500); // Locked fee from service
      expect(res.body.booking.durationMinutes).toBe(30);
      expect(res.body.booking.startUtc).toBe(slotStartUtc);
      expect(res.body.booking.endUtc).toBe(slotEndUtc);
      createdBookingId = res.body.booking.id;
    });

    it('should prevent double-booking: second client attempting to book the SAME slot returns 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${client2Token}`)
        .send({
          lawyerId: lawyerApp.id,
          mode: 'video',
          startUtc: slotStartUtc,
          clientNotes: 'Second client attempting to book same slot.'
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already booked or reserved/i);
    });

    it('should immediately omit the booked slot from public slot query (GET /lawyers/:id/slots)', async () => {
      // Monday 2030-08-12 window: 17:00 to 19:00 PKT (4 slots: 17:00, 17:30, 18:00, 18:30)
      // 17:00 PKT (12:00 UTC) is now booked
      // Exactly 3 remaining slots should be visible: 17:30, 18:00, 18:30
      const res = await request(app).get(
        `/api/v1/lawyers/${lawyerApp.id}/slots?from=${appointmentDate}&to=${appointmentDate}`
      );

      expect(res.status).toBe(200);
      expect(res.body.slots.length).toBe(3);
      expect(res.body.slots.some((s) => s.startLocal === '17:00')).toBe(false);
      expect(res.body.slots.some((s) => s.startLocal === '17:30')).toBe(true);
      expect(res.body.slots.some((s) => s.startLocal === '18:00')).toBe(true);
      expect(res.body.slots.some((s) => s.startLocal === '18:30')).toBe(true);
    });

    it('should reject booking on a lawyer blocked date with 409 Conflict', async () => {
      // Block Tuesday 2030-08-13
      await BlockedDate.create({
        lawyerId: approvedLawyerUser.id,
        date: '2030-08-13',
        reason: 'Bar Council strike'
      });

      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({
          lawyerId: lawyerApp.id,
          mode: 'video',
          startUtc: '2030-08-13T12:00:00.000Z'
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/unavailable on this date/i);
    });
  });

  // =========================================================================
  // 3. Appointment Management & Lifecycle Transitions
  // =========================================================================
  describe('3. Appointment Management & Lifecycle Transitions', () => {
    let bookingId;

    beforeAll(async () => {
      // Client 1 creates a booking for 17:30 PKT (12:30 UTC)
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({
          lawyerId: lawyerApp.id,
          mode: 'in_chamber',
          startUtc: '2030-08-12T12:30:00.000Z',
          clientNotes: 'In-person chamber conference.'
        });
      bookingId = res.body.booking.id;
    });

    it('should allow advocate to view incoming appointments (GET /api/v1/lawyer/appointments)', async () => {
      const res = await request(app)
        .get('/api/v1/lawyer/appointments')
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.items).toBeDefined();
      expect(res.body.items.length).toBeGreaterThan(0);
      const found = res.body.items.find((b) => b.id === bookingId);
      expect(found).toBeDefined();
      expect(found.client.name).toBe(clientUser1.name);
      expect(found.mode).toBe('in_chamber');
    });

    it('should allow advocate to confirm appointment (PATCH /api/v1/lawyer/appointments/:id/confirm)', async () => {
      const res = await request(app)
        .patch(`/api/v1/lawyer/appointments/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({ lawyerNotes: 'Case file reviewed; chamber meeting confirmed.' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(BOOKING_STATUS.CONFIRMED);
      expect(res.body.lawyerNotes).toMatch(/chamber meeting confirmed/i);
    });

    it('should return 409 Conflict if advocate attempts to confirm an ALREADY confirmed appointment', async () => {
      const res = await request(app)
        .patch(`/api/v1/lawyer/appointments/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/Cannot confirm an appointment that is currently confirmed/i);
    });

    it('should allow client to view appointment details (GET /api/v1/bookings/:id)', async () => {
      const res = await request(app)
        .get(`/api/v1/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${client1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.booking.id).toBe(bookingId);
      expect(res.body.booking.status).toBe(BOOKING_STATUS.CONFIRMED);
      expect(res.body.booking.lawyerName).toBe(approvedLawyerUser.name);
    });

    it('should return 403 Forbidden when an unrelated user attempts to view the booking', async () => {
      const res = await request(app)
        .get(`/api/v1/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${client2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/You do not have permission/i);
    });

    it('should allow advocate to complete a confirmed appointment (PATCH /api/v1/lawyer/appointments/:id/complete)', async () => {
      const res = await request(app)
        .patch(`/api/v1/lawyer/appointments/${bookingId}/complete`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({ lawyerNotes: 'Consultation concluded; drafted notice issued.' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(BOOKING_STATUS.COMPLETED);
    });

    it('should return 409 Conflict when attempting to cancel an already completed appointment', async () => {
      const res = await request(app)
        .patch(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${client1Token}`)
        .send({ reason: 'Want to cancel now' });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/Cannot cancel an appointment that is already completed/i);
    });
  });

  // =========================================================================
  // 4. Rejection and Cancellation Slot Release Tests
  // =========================================================================
  describe('4. Rejection & Cancellation Slot Release Lifecycle', () => {
    let rejectableBookingId;
    const testSlotStartUtc = '2030-08-12T13:00:00.000Z'; // 18:00 PKT

    it('should create booking and verify slot is locked', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({
          lawyerId: lawyerApp.id,
          mode: 'video',
          startUtc: testSlotStartUtc
        });

      expect(res.status).toBe(201);
      rejectableBookingId = res.body.booking.id;

      // Slot 18:00 should not be in public directory
      const slotsRes = await request(app).get(
        `/api/v1/lawyers/${lawyerApp.id}/slots?from=${appointmentDate}&to=${appointmentDate}`
      );
      expect(slotsRes.body.slots.some((s) => s.startLocal === '18:00')).toBe(false);
    });

    it('should require rejection reason with at least 5 chars (400 Bad Request)', async () => {
      const res = await request(app)
        .patch(`/api/v1/lawyer/appointments/${rejectableBookingId}/reject`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({ status: 'rejected', reason: 'No' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should successfully reject booking with reason', async () => {
      const res = await request(app)
        .patch(`/api/v1/lawyer/appointments/${rejectableBookingId}/reject`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          status: 'rejected',
          reason: 'Advocate has prior High Court division bench appearance at this hour.'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(BOOKING_STATUS.REJECTED);
      expect(res.body.cancellationReason).toMatch(/High Court division bench/i);
    });

    it('should automatically release slot when rejected: 18:00 slot is once again visible in public slot query', async () => {
      const slotsRes = await request(app).get(
        `/api/v1/lawyers/${lawyerApp.id}/slots?from=${appointmentDate}&to=${appointmentDate}`
      );

      expect(slotsRes.status).toBe(200);
      expect(slotsRes.body.slots.some((s) => s.startLocal === '18:00')).toBe(true);
    });

    it('should allow client to cancel an appointment and release slot', async () => {
      // 1. Client 2 books 18:00
      const bookRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${client2Token}`)
        .send({
          lawyerId: lawyerApp.id,
          mode: 'video',
          startUtc: testSlotStartUtc
        });
      const cancellableId = bookRes.body.booking.id;

      // 2. Client 2 cancels
      const cancelRes = await request(app)
        .patch(`/api/v1/bookings/${cancellableId}/cancel`)
        .set('Authorization', `Bearer ${client2Token}`)
        .send({ reason: 'Client unable to attend due to personal travel.' });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.status).toBe(BOOKING_STATUS.CANCELLED);

      // 3. Slot 18:00 is visible again
      const slotsRes = await request(app).get(
        `/api/v1/lawyers/${lawyerApp.id}/slots?from=${appointmentDate}&to=${appointmentDate}`
      );
      expect(slotsRes.body.slots.some((s) => s.startLocal === '18:00')).toBe(true);
    });
  });
});
