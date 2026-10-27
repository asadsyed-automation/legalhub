const request = require('supertest');
const app = require('../src/app');
const {
  User,
  LawyerApplication,
  LawyerService,
  Booking,
  Case,
  Message,
  Notification
} = require('../src/models');
const { generateToken } = require('../src/modules/auth/auth.service');
const { TEST_EMAIL_SUFFIX } = require('./setup');

describe('Phase 3 Part N: Direct Messages (Booking & Case Contexts)', () => {
  let lawyerUser;
  let otherLawyerUser;
  let clientUser;
  let otherClientUser;
  let adminUser;

  let lawyerToken;
  let otherLawyerToken;
  let clientToken;
  let otherClientToken;
  let adminToken;

  let testService;
  let testBooking;
  let testCase;
  let unlinkedCase;

  const uniqueSuffix = () => `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  beforeAll(async () => {
    const passwordHash = 'dummyhash';

    // 1. Owning Advocate
    lawyerUser = await User.create({
      name: 'Adv. Sardar Zulfiqar Ali',
      email: `zulfiqar_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: 'lawyer'
    });
    await LawyerApplication.create({
      userId: lawyerUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `PB-${uniqueSuffix()}`,
      courtLevel: 'High Court',
      city: 'Multan',
      practiceAreas: ['Civil', 'Criminal'],
      experienceYears: 15,
      chamberAddress: 'Chamber 44, High Court Multan',
      status: 'approved'
    });
    lawyerToken = generateToken(lawyerUser);

    // 2. Another Advocate
    otherLawyerUser = await User.create({
      name: 'Adv. Farhan Qureshi',
      email: `farhan_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: 'lawyer'
    });
    await LawyerApplication.create({
      userId: otherLawyerUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `PB-${uniqueSuffix()}`,
      courtLevel: 'High Court',
      city: 'Multan',
      practiceAreas: ['Corporate'],
      experienceYears: 7,
      chamberAddress: 'Chamber 12, District Court Multan',
      status: 'approved'
    });
    otherLawyerToken = generateToken(otherLawyerUser);

    // 3. Client
    clientUser = await User.create({
      name: 'Haji Ghulam Rasool',
      email: `ghulam_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: 'client'
    });
    clientToken = generateToken(clientUser);

    // 4. Other Client
    otherClientUser = await User.create({
      name: 'Nawaz Sharif Gujjar',
      email: `nawaz_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: 'client'
    });
    otherClientToken = generateToken(otherClientUser);

    // 5. Admin
    adminUser = await User.create({
      name: 'Platform Overseer',
      email: `admin_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: 'admin'
    });
    adminToken = generateToken(adminUser);

    // Create Service & Booking
    testService = await LawyerService.create({
      lawyerId: lawyerUser.id,
      mode: 'in_chamber',
      durationMinutes: 30,
      feePkr: 5000,
      isActive: true
    });

    const now = Date.now();
    testBooking = await Booking.create({
      clientId: clientUser.id,
      lawyerId: lawyerUser.id,
      serviceId: testService.id,
      mode: 'in_chamber',
      date: '2026-10-28',
      startsAt: new Date(now + 86400000),
      endsAt: new Date(now + 86400000 + 1800000),
      startUtc: new Date(now + 86400000),
      endUtc: new Date(now + 86400000 + 1800000),
      durationMinutes: 30,
      feePkr: 5000,
      totalFeePkr: 5000,
      status: 'confirmed'
    });


    // Create Case with linked client
    testCase = await Case.create({
      lawyerId: lawyerUser.id,
      clientId: clientUser.id,
      title: 'Mian Ghulam v. Revenue Board',
      court: 'District Court, Multan',
      practiceArea: 'Property',
      status: 'Active',
      stage: 'Pleadings'
    });

    // Create Case without client (walk-in chamber draft)
    unlinkedCase = await Case.create({
      lawyerId: lawyerUser.id,
      clientId: null,
      title: 'Internal Legal Research Memo',
      court: 'Lahore High Court',
      practiceArea: 'Constitutional',
      status: 'Draft',
      stage: 'Filing'
    });
  });

  describe('1. Booking Context Direct Messaging (POST & GET /bookings/:id/messages)', () => {
    let clientSentMessageId;

    it('allows client to send a direct message to advocate in a booking context', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${testBooking.id}/messages`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          content: 'Assalam-o-Alaikum Sir, I have arranged the certified copy of the registry for our meeting.',
          attachments: [
            { name: 'registry_fard.pdf', url: 'https://storage/registry_fard.pdf', mimeType: 'application/pdf', sizeBytes: 154000 }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        bookingId: testBooking.id,
        senderId: clientUser.id,
        content: 'Assalam-o-Alaikum Sir, I have arranged the certified copy of the registry for our meeting.',
        readAt: null
      });
      clientSentMessageId = res.body.data.id;

      // Verify counter-party in-app notification was dispatched to advocate
      const notif = await Notification.findOne({
        where: {
          userId: lawyerUser.id,
          link: `/bookings/${testBooking.id}`
        }
      });
      expect(notif).not.toBeNull();
      expect(notif.title).toContain('Booking Message');
    });

    it('allows advocate to send a reply message to client in the booking context', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${testBooking.id}/messages`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          content: 'Walaikum Assalam. Excellent. Please bring the original CNIC as well.'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.senderId).toBe(lawyerUser.id);

      // Verify notification was dispatched to client
      const notif = await Notification.findOne({
        where: {
          userId: clientUser.id,
          link: `/bookings/${testBooking.id}`
        }
      });
      expect(notif).not.toBeNull();
    });

    it('retrieves booking messages and auto-marks incoming unread messages as read', async () => {
      // Lawyer views messages: client's unread message should be marked as read
      const res = await request(app)
        .get(`/api/v1/bookings/${testBooking.id}/messages?page=1&limit=10`)
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.messages.length).toBeGreaterThanOrEqual(2);
      expect(res.body.pagination).toMatchObject({
        page: 1,
        limit: 10
      });

      // Check DB: client message should now have non-null readAt
      const refreshedClientMsg = await Message.findByPk(clientSentMessageId);
      expect(refreshedClientMsg.readAt).not.toBeNull();
    });

    it('rejects sending empty message content (400 Bad Request)', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${testBooking.id}/messages`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ content: '' });

      expect(res.status).toBe(400);
      expect(res.body.details.some((d) => d.field === 'content')).toBe(true);
    });

    it('rejects sending message with content exceeding 2000 characters', async () => {
      const longContent = 'A'.repeat(2001);
      const res = await request(app)
        .post(`/api/v1/bookings/${testBooking.id}/messages`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ content: longContent });

      expect(res.status).toBe(400);
    });
  });

  describe('2. Case Context Direct Messaging (POST & GET /cases/:id/messages)', () => {
    let lawyerSentCaseMessageId;

    it('allows assigned advocate to send a message to linked client in active case', async () => {
      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/messages`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          content: 'Notice has been served on the respondent. Court has fixed 18th November for written statement.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        caseId: testCase.id,
        senderId: lawyerUser.id,
        readAt: null
      });
      lawyerSentCaseMessageId = res.body.data.id;

      // Verify client received notification
      const notif = await Notification.findOne({
        where: {
          userId: clientUser.id,
          link: `/cases/${testCase.id}`
        }
      });
      expect(notif).not.toBeNull();
      expect(notif.title).toContain('New Case Message');
    });

    it('allows linked client to reply to advocate in the case file context', async () => {
      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/messages`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          content: 'Thank you Advocate Sahib. Will we need any witnesses on that day?'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.senderId).toBe(clientUser.id);
    });

    it('retrieves case messages and auto-marks incoming messages as read', async () => {
      // Client views case messages: lawyer's message should be marked as read
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}/messages?page=1&limit=20`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.messages.length).toBeGreaterThanOrEqual(2);

      // Verify lawyer message is marked read in DB
      const refreshedMsg = await Message.findByPk(lawyerSentCaseMessageId);
      expect(refreshedMsg.readAt).not.toBeNull();
    });

    it('rejects sending a case message if case has no linked client (400 Bad Request)', async () => {
      const res = await request(app)
        .post(`/api/v1/cases/${unlinkedCase.id}/messages`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({ content: 'Chamber draft message' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Case has no linked client');
    });
  });

  describe('3. Strict 6-Role Permission Matrix & Privileged Boundary Barriers', () => {
    it('forbids another lawyer from posting messages to a booking (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${testBooking.id}/messages`)
        .set('Authorization', `Bearer ${otherLawyerToken}`)
        .send({ content: 'Intruding lawyer message' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('forbids an unlinked client from viewing booking messages (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/v1/bookings/${testBooking.id}/messages`)
        .set('Authorization', `Bearer ${otherClientToken}`);

      expect(res.status).toBe(403);
    });

    it('forbids another lawyer from posting messages to a case file (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/messages`)
        .set('Authorization', `Bearer ${otherLawyerToken}`)
        .send({ content: 'External lawyer snooping' });

      expect(res.status).toBe(403);
    });

    it('forbids an unlinked client from viewing case messages (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}/messages`)
        .set('Authorization', `Bearer ${otherClientToken}`);

      expect(res.status).toBe(403);
    });

    it('forbids platform administrator from accessing booking or case messages (Attorney-Client Privacy Barrier)', async () => {
      const bookingMsgRes = await request(app)
        .get(`/api/v1/bookings/${testBooking.id}/messages`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(bookingMsgRes.status).toBe(403);

      const caseMsgRes = await request(app)
        .get(`/api/v1/cases/${testCase.id}/messages`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(caseMsgRes.status).toBe(403);
    });

    it('returns 401 Unauthorized across all messaging endpoints when token is missing', async () => {
      const bookingPost = await request(app)
        .post(`/api/v1/bookings/${testBooking.id}/messages`)
        .send({ content: 'No token' });
      expect(bookingPost.status).toBe(401);

      const casePost = await request(app)
        .post(`/api/v1/cases/${testCase.id}/messages`)
        .send({ content: 'No token' });
      expect(casePost.status).toBe(401);

      const bookingGet = await request(app)
        .get(`/api/v1/bookings/${testBooking.id}/messages`);
      expect(bookingGet.status).toBe(401);

      const caseGet = await request(app)
        .get(`/api/v1/cases/${testCase.id}/messages`);
      expect(caseGet.status).toBe(401);
    });

    it('returns 404 Not Found for non-existent booking or case IDs', async () => {
      const nonExistentBooking = await request(app)
        .post('/api/v1/bookings/00000000-0000-0000-0000-000000000000/messages')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({ content: 'Hello' });
      expect(nonExistentBooking.status).toBe(404);

      const nonExistentCase = await request(app)
        .post('/api/v1/cases/00000000-0000-0000-0000-000000000000/messages')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({ content: 'Hello' });
      expect(nonExistentCase.status).toBe(404);
    });
  });
});
