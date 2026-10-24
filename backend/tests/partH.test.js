const request = require('supertest');
const app = require('../src/app');
const {
  User,
  LawyerApplication,
  LawyerProfile,
  LawyerService,
  Booking,
  ConsultationNote,
  Engagement,
  Review
} = require('../src/models');
const { generateToken } = require('../src/modules/auth/auth.service');
const {
  ROLES,
  APPLICATION_STATUS,
  BOOKING_STATUS,
  ENGAGEMENT_STATUS
} = require('../src/constants');

const TEST_EMAIL_SUFFIX = '@test.legalhub.local';

describe('Part H: Consultation Notes, Engagements & Verified Reviews', () => {
  let clientUser, otherClientUser, lawyerUser, otherLawyerUser, adminUser;
  let clientToken, otherClientToken, lawyerToken, otherLawyerToken, adminToken;
  let confirmedBooking, completedBooking, requestedBooking;
  let testService;

  beforeAll(async () => {
    const timestamp = Date.now();

    // 1. Client user
    clientUser = await User.create({
      name: 'Client Arshad Multan',
      email: `arshad_h_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.CLIENT
    });
    clientToken = generateToken(clientUser);

    // 2. Second Client
    otherClientUser = await User.create({
      name: 'Client Bilal Lahore',
      email: `bilal_h_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.CLIENT
    });
    otherClientToken = generateToken(otherClientUser);

    // 3. Approved Lawyer
    lawyerUser = await User.create({
      name: 'Advocate Hamza Lodhi',
      email: `hamza_h_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER
    });
    lawyerToken = generateToken(lawyerUser);

    await LawyerApplication.create({
      userId: lawyerUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `PBC-H-${timestamp}`,
      courtLevel: 'Advocate High Court',
      city: 'Multan',
      practiceAreas: ['Civil', 'Family'],
      experienceYears: 8,
      chamberAddress: 'Chamber 4, District Courts Multan',
      status: APPLICATION_STATUS.APPROVED
    });

    await LawyerProfile.create({
      userId: lawyerUser.id,
      headline: 'Civil & Family Litigation Specialist',
      isPublic: true
    });

    testService = await LawyerService.create({
      lawyerId: lawyerUser.id,
      mode: 'video',
      durationMinutes: 30,
      feePkr: 3500,
      isActive: true
    });

    // 4. Other Lawyer (not assigned to bookings)
    otherLawyerUser = await User.create({
      name: 'Advocate Noman Gill',
      email: `noman_h_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER
    });
    otherLawyerToken = generateToken(otherLawyerUser);

    await LawyerApplication.create({
      userId: otherLawyerUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `PBC-H2-${timestamp}`,
      courtLevel: 'Advocate High Court',
      city: 'Lahore',
      practiceAreas: ['Criminal'],
      experienceYears: 5,
      chamberAddress: 'Chamber 18, High Court Lahore',
      status: APPLICATION_STATUS.APPROVED
    });

    // 5. Admin user
    adminUser = await User.create({
      name: 'Admin Moderator',
      email: `admin_h_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.ADMIN
    });
    adminToken = generateToken(adminUser);

    // Create bookings in various statuses:
    // A. Confirmed booking
    confirmedBooking = await Booking.create({
      clientId: clientUser.id,
      lawyerId: lawyerUser.id,
      serviceId: testService.id,
      status: BOOKING_STATUS.CONFIRMED,
      mode: 'video',
      date: '2032-05-10',
      startUtc: new Date('2032-05-10T10:00:00.000Z'),
      endUtc: new Date('2032-05-10T10:30:00.000Z'),
      startsAt: new Date('2032-05-10T10:00:00.000Z'),
      endsAt: new Date('2032-05-10T10:30:00.000Z'),
      durationMinutes: 30,
      feePkr: 3500,
      totalFeePkr: 3500,
      issueSummary: 'Property boundary dispute consultation'
    });

    // B. Completed booking
    completedBooking = await Booking.create({
      clientId: clientUser.id,
      lawyerId: lawyerUser.id,
      serviceId: testService.id,
      status: BOOKING_STATUS.COMPLETED,
      mode: 'video',
      date: '2032-05-10',
      startUtc: new Date('2032-05-10T11:00:00.000Z'),
      endUtc: new Date('2032-05-10T11:30:00.000Z'),
      startsAt: new Date('2032-05-10T11:00:00.000Z'),
      endsAt: new Date('2032-05-10T11:30:00.000Z'),
      durationMinutes: 30,
      feePkr: 3500,
      totalFeePkr: 3500,
      issueSummary: 'Completed family settlement advice'
    });

    // C. Requested booking (pending lawyer accept)
    requestedBooking = await Booking.create({
      clientId: clientUser.id,
      lawyerId: lawyerUser.id,
      serviceId: testService.id,
      status: BOOKING_STATUS.REQUESTED,
      mode: 'video',
      date: '2032-05-10',
      startUtc: new Date('2032-05-10T12:00:00.000Z'),
      endUtc: new Date('2032-05-10T12:30:00.000Z'),
      startsAt: new Date('2032-05-10T12:00:00.000Z'),
      endsAt: new Date('2032-05-10T12:30:00.000Z'),
      durationMinutes: 30,
      feePkr: 3500,
      totalFeePkr: 3500,
      issueSummary: 'Preliminary inquiry'
    });
  });

  afterAll(async () => {
    try {
      const users = [clientUser, otherClientUser, lawyerUser, otherLawyerUser, adminUser].filter(Boolean);
      const userIds = users.map((u) => u.id);
      if (userIds.length > 0) {
        await User.destroy({ where: { id: userIds } }).catch(() => {});
      }
    } catch (_) {}
  });

  // =========================================================================
  // Slice 1: Consultation Notes (Advocate Case Diary / Basta)
  // =========================================================================
  describe('1. Consultation Notes (GET & PUT /api/v1/bookings/:id/notes)', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get(`/api/v1/bookings/${confirmedBooking.id}/notes`);
      expect(res.status).toBe(401);
    });

    it('should reject client accessing notes with 403 (strict advocate privacy)', async () => {
      const res = await request(app)
        .get(`/api/v1/bookings/${confirmedBooking.id}/notes`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject another lawyer accessing notes with 403', async () => {
      const res = await request(app)
        .get(`/api/v1/bookings/${confirmedBooking.id}/notes`)
        .set('Authorization', `Bearer ${otherLawyerToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject notes recording if booking is still in requested status (400)', async () => {
      const res = await request(app)
        .put(`/api/v1/bookings/${requestedBooking.id}/notes`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          summary: 'Premature notes before confirmation'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/confirmed or completed/i);
    });

    it('should return null or empty when notes have not been recorded yet', async () => {
      const res = await request(app)
        .get(`/api/v1/bookings/${confirmedBooking.id}/notes`)
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });

    it('should successfully record/upsert consultation notes by the assigned lawyer (200)', async () => {
      const payload = {
        summary: 'Client presented registry deeds for Multan Cantt land. Boundary wall dispute.',
        actionItems: [
          'Obtain certified copy of Aks-Shajra from Patwari',
          'File suit for permanent injunction in Civil Court'
        ],
        privateNotes: 'Check limitation period under Limitation Act 1908 before drafting.'
      };

      const res = await request(app)
        .put(`/api/v1/bookings/${confirmedBooking.id}/notes`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookingId).toBe(confirmedBooking.id);
      expect(res.body.data.summary).toBe(payload.summary);
      expect(res.body.data.actionItems).toEqual(payload.actionItems);
      expect(res.body.data.privateNotes).toBe(payload.privateNotes);
    });

    it('should retrieve existing consultation notes by the assigned lawyer', async () => {
      const res = await request(app)
        .get(`/api/v1/bookings/${confirmedBooking.id}/notes`)
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).not.toBeNull();
      expect(res.body.data.actionItems.length).toBe(2);
      expect(res.body.data.privateNotes).toContain('Limitation Act 1908');
    });

    it('should update existing consultation notes idempotently', async () => {
      const res = await request(app)
        .put(`/api/v1/bookings/${confirmedBooking.id}/notes`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          summary: 'Updated summary: Patwari verified the Aks-Shajra records.'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.summary).toBe('Updated summary: Patwari verified the Aks-Shajra records.');
      // Previous actionItems preserved
      expect(res.body.data.actionItems.length).toBe(2);
    });
  });

  // =========================================================================
  // Slice 2: Formal Engagements (Vakalatnama / Case Representation)
  // =========================================================================
  describe('2. Formal Engagements (/api/v1/engagements)', () => {
    let createdEngagementId;

    it('should reject unauthenticated engagement creation with 401', async () => {
      const res = await request(app).post('/api/v1/engagements').send({
        title: 'Civil Suit representation'
      });
      expect(res.status).toBe(401);
    });

    it('should reject invalid practiceArea with 400', async () => {
      const res = await request(app)
        .post('/api/v1/engagements')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          lawyerId: lawyerUser.id,
          title: 'Land Dispute Suit',
          practiceArea: 'NonExistentArea'
        });

      expect(res.status).toBe(400);
    });

    it('should successfully create an engagement initiated by a client (201)', async () => {
      const res = await request(app)
        .post('/api/v1/engagements')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          lawyerId: lawyerUser.id,
          bookingId: completedBooking.id,
          title: 'Civil Revision in Multan High Court Bench',
          practiceArea: 'Civil',
          notes: 'Converted from consultation. Vakalatnama signed.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.clientId).toBe(clientUser.id);
      expect(res.body.data.lawyerId).toBe(lawyerUser.id);
      expect(res.body.data.bookingId).toBe(completedBooking.id);
      expect(res.body.data.status).toBe(ENGAGEMENT_STATUS.ACTIVE);
      expect(res.body.data.startedAt).toBeDefined();
      expect(res.body.data.closedAt).toBeNull();

      createdEngagementId = res.body.data.id;
    });

    it('should successfully create an engagement initiated by an advocate (201)', async () => {
      const res = await request(app)
        .post('/api/v1/engagements')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          clientId: otherClientUser.id,
          title: 'Inheritance Partition Case',
          practiceArea: 'Family',
          notes: 'Direct client engagement for succession certificate.'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.clientId).toBe(otherClientUser.id);
      expect(res.body.data.lawyerId).toBe(lawyerUser.id);
      expect(res.body.data.status).toBe(ENGAGEMENT_STATUS.ACTIVE);
    });

    it('should list engagements for participating client', async () => {
      const res = await request(app)
        .get('/api/v1/engagements')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.data[0].lawyer).toBeDefined();
      expect(res.body.data[0].lawyer.name).toContain('Hamza');
    });

    it('should list engagements for participating lawyer', async () => {
      const res = await request(app)
        .get('/api/v1/engagements')
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data[0].client).toBeDefined();
    });

    it('should get engagement details for participant (200)', async () => {
      const res = await request(app)
        .get(`/api/v1/engagements/${createdEngagementId}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdEngagementId);
      expect(res.body.data.title).toContain('Civil Revision');
      expect(res.body.data.booking).toBeDefined();
    });

    it('should reject engagement details access for unrelated user with 403', async () => {
      const res = await request(app)
        .get(`/api/v1/engagements/${createdEngagementId}`)
        .set('Authorization', `Bearer ${otherClientToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow updating notes and closing an engagement (200)', async () => {
      const res = await request(app)
        .patch(`/api/v1/engagements/${createdEngagementId}`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          status: ENGAGEMENT_STATUS.CLOSED,
          notes: 'Matter successfully settled out of court. File closed.'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(ENGAGEMENT_STATUS.CLOSED);
      expect(res.body.data.closedAt).not.toBeNull();
      expect(res.body.data.notes).toContain('File closed');
    });
  });

  // =========================================================================
  // Slice 3: Verified Client Reviews & Ratings
  // =========================================================================
  describe('3. Verified Client Reviews (/api/v1/bookings/:id/review & /api/v1/lawyers/:id/reviews)', () => {
    it('should reject review submission if not authenticated (401)', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${completedBooking.id}/review`)
        .send({
          rating: 5,
          comment: 'Outstanding advocate with deep civil law acumen.'
        });

      expect(res.status).toBe(401);
    });

    it('should reject advocate reviewing themselves (403)', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${completedBooking.id}/review`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          rating: 5,
          comment: 'Self review attempt should be prohibited.'
        });

      expect(res.status).toBe(403);
    });

    it('should reject review submission for uncompleted booking (400)', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${confirmedBooking.id}/review`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          rating: 5,
          comment: 'Premature review before consultation is finished.'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/completed/i);
    });

    it('should reject invalid rating outside 1-5 with 400', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${completedBooking.id}/review`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          rating: 6,
          comment: 'Invalid 6 star rating attempt'
        });

      expect(res.status).toBe(400);
    });

    it('should reject comment shorter than 10 characters with 400', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${completedBooking.id}/review`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          rating: 4,
          comment: 'Good'
        });

      expect(res.status).toBe(400);
    });

    it('should successfully submit a verified review for completed booking (201)', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${completedBooking.id}/review`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          rating: 5,
          comment: 'Very professional consultation. Advocate Hamza explained the land registry process clearly.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookingId).toBe(completedBooking.id);
      expect(res.body.data.clientId).toBe(clientUser.id);
      expect(res.body.data.lawyerId).toBe(lawyerUser.id);
      expect(res.body.data.rating).toBe(5);
      expect(res.body.data.isPublic).toBe(true);
    });

    it('should reject duplicate review on the same booking with 409 Conflict', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${completedBooking.id}/review`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          rating: 4,
          comment: 'Second attempt to review same consultation'
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already been submitted/i);
    });

    it('should publicly retrieve lawyer reviews with statistical aggregates (200)', async () => {
      const res = await request(app).get(`/api/v1/lawyers/${lawyerUser.id}/reviews`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.lawyer.id).toBe(lawyerUser.id);
      expect(res.body.data.statistics.reviewCount).toBe(1);
      expect(res.body.data.statistics.avgRating).toBe(5);
      expect(res.body.data.statistics.ratingBreakdown['5']).toBe(1);
      expect(res.body.data.reviews.length).toBe(1);
      expect(res.body.data.reviews[0].client.name).toBe(clientUser.name);
      expect(res.body.pagination).toBeDefined();
    });
  });
});
