const request = require('supertest');
const app = require('../src/app');
const {
  User,
  LawyerApplication,
  LawyerProfile,
  LawyerService,
  AvailabilityRule,
  Booking,
  Enquiry
} = require('../src/models');
const { generateToken } = require('../src/modules/auth/auth.service');
const { ROLES, APPLICATION_STATUS, BOOKING_STATUS, ENQUIRY_STATUS } = require('../src/constants');

const TEST_EMAIL_SUFFIX = '@test.legalhub.local';

describe('Part G: Pre-Booking Enquiries & Lead Pipeline Tests', () => {
  let clientUser1, clientUser2, approvedLawyerUser, privateLawyerUser, unapprovedLawyerUser, adminUser;
  let client1Token, client2Token, lawyerToken, privateLawyerToken, unapprovedLawyerToken, adminToken;
  let lawyerApp, privateLawyerApp, unapprovedLawyerApp;
  let lawyerVideoService;

  const testSlotStartUtc = '2030-09-02T12:00:00.000Z'; // Monday 17:00 PKT

  beforeAll(async () => {
    const timestamp = Date.now();

    // 1. Client 1
    clientUser1 = await User.create({
      name: 'Client Asif',
      email: `client1_enq_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.CLIENT
    });
    client1Token = generateToken(clientUser1);

    // 2. Client 2
    clientUser2 = await User.create({
      name: 'Client Babar',
      email: `client2_enq_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.CLIENT
    });
    client2Token = generateToken(clientUser2);

    // 3. Admin User
    adminUser = await User.create({
      name: 'Admin Farooq',
      email: `admin_enq_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.ADMIN
    });
    adminToken = generateToken(adminUser);

    // 4. Approved & Public Lawyer
    approvedLawyerUser = await User.create({
      name: 'Advocate Tariq Multan',
      email: `lawyer_enq_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER
    });
    lawyerToken = generateToken(approvedLawyerUser);

    lawyerApp = await LawyerApplication.create({
      userId: approvedLawyerUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `PBC-ENQ-${timestamp}`,
      courtLevel: 'Advocate High Court',
      city: 'Multan',
      practiceAreas: ['Corporate', 'Civil'],
      experienceYears: 10,
      chamberAddress: 'Chamber 12, High Court Multan Bench',
      bio: 'Corporate counsel in Multan.',
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
      feePkr: 3000,
      isActive: true
    });

    await AvailabilityRule.create({
      lawyerId: approvedLawyerUser.id,
      weekday: 1, // Monday
      startTime: '17:00',
      endTime: '19:00'
    });

    // 5. Approved but Private (Hidden) Lawyer
    privateLawyerUser = await User.create({
      name: 'Advocate Private Lahore',
      email: `priv_enq_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER
    });
    privateLawyerToken = generateToken(privateLawyerUser);

    privateLawyerApp = await LawyerApplication.create({
      userId: privateLawyerUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `PBC-PRIV-${timestamp}`,
      courtLevel: 'Advocate High Court',
      city: 'Lahore',
      practiceAreas: ['Tax'],
      experienceYears: 8,
      chamberAddress: 'Mall Road, Lahore',
      bio: 'Tax lawyer taking sabbatical.',
      status: APPLICATION_STATUS.APPROVED
    });

    await LawyerProfile.create({
      userId: privateLawyerUser.id,
      headline: 'Tax Specialist',
      slotMinutes: 30,
      isPublic: false // Currently not accepting enquiries or bookings
    });

    // 6. Unapproved (Pending) Lawyer
    unapprovedLawyerUser = await User.create({
      name: 'Advocate Pending Enq',
      email: `pend_enq_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER
    });
    unapprovedLawyerToken = generateToken(unapprovedLawyerUser);

    unapprovedLawyerApp = await LawyerApplication.create({
      userId: unapprovedLawyerUser.id,
      barCouncil: 'Islamabad Bar Council',
      enrolmentNo: `IBC-PEND-${timestamp}`,
      courtLevel: 'Advocate Lower Courts',
      city: 'Islamabad',
      practiceAreas: ['Family'],
      experienceYears: 1,
      chamberAddress: 'F-8 Markaz, Islamabad',
      bio: 'New applicant.',
      status: APPLICATION_STATUS.PENDING
    });
  });

  afterAll(async () => {
    const userIds = [
      clientUser1?.id,
      clientUser2?.id,
      adminUser?.id,
      approvedLawyerUser?.id,
      privateLawyerUser?.id,
      unapprovedLawyerUser?.id
    ].filter(Boolean);

    if (userIds.length > 0) {
      await Enquiry.destroy({
        where: {
          [require('sequelize').Op.or]: [{ clientId: userIds }, { lawyerId: userIds }]
        }
      }).catch(() => {});
      await Booking.destroy({
        where: {
          [require('sequelize').Op.or]: [{ clientId: userIds }, { lawyerId: userIds }]
        }
      }).catch(() => {});
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
    it('should return 401 Unauthorized when submitting enquiry without token', async () => {
      const res = await request(app)
        .post('/api/v1/enquiries')
        .send({
          lawyerId: lawyerApp.id,
          practiceArea: 'Corporate',
          subject: 'Contract dispute guidance',
          message: 'Need help reviewing a cross-border software agreement.'
        });

      expect(res.status).toBe(401);
    });

    it('should return 403 Forbidden when advocate tries to submit enquiry as client', async () => {
      const res = await request(app)
        .post('/api/v1/enquiries')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          lawyerId: lawyerApp.id,
          practiceArea: 'Corporate',
          subject: 'Self query',
          message: 'Trying to submit an enquiry with lawyer account role.'
        });

      expect(res.status).toBe(403);
    });

    it('should return 403 Forbidden when client accesses lawyer enquiries endpoint', async () => {
      const res = await request(app)
        .get('/api/v1/lawyer/enquiries')
        .set('Authorization', `Bearer ${client1Token}`);

      expect(res.status).toBe(403);
    });

    it('should return 403 Forbidden when unapproved lawyer accesses lawyer enquiries', async () => {
      const res = await request(app)
        .get('/api/v1/lawyer/enquiries')
        .set('Authorization', `Bearer ${unapprovedLawyerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/approved/i);
    });
  });

  // =========================================================================
  // 2. Client Submitting Enquiries (Validation & Business Rules)
  // =========================================================================
  describe('2. Client Submitting Enquiries', () => {
    let createdEnquiryId;

    it('should successfully create an enquiry for an approved advocate', async () => {
      const res = await request(app)
        .post('/api/v1/enquiries')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({
          lawyerId: lawyerApp.id,
          practiceArea: 'Corporate',
          subject: 'Contract breach query',
          message: 'Our firm has a vendor that failed to deliver deliverables on time.'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.clientId).toBe(clientUser1.id);
      expect(res.body.practiceArea).toBe('Corporate');
      expect(res.body.status).toBe(ENQUIRY_STATUS.SUBMITTED);
      expect(res.body.lawyerReply).toBeNull();
      expect(res.body.repliedAt).toBeNull();
      createdEnquiryId = res.body.id;
    });

    it('should reject enquiry with 400 when missing required fields or invalid practice area', async () => {
      const res = await request(app)
        .post('/api/v1/enquiries')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({
          lawyerId: lawyerApp.id,
          practiceArea: 'MaritimeCrypto', // Invalid
          subject: 'Hi', // Too short (< 5 chars)
          message: 'Help' // Too short (< 10 chars)
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should reject enquiry with 404 when target lawyer is not approved', async () => {
      const res = await request(app)
        .post('/api/v1/enquiries')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({
          lawyerId: unapprovedLawyerApp.id,
          practiceArea: 'Family',
          subject: 'Family settlement query',
          message: 'Looking for advice on family inheritance division.'
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found or not approved/i);
    });

    it('should reject enquiry with 404 when target lawyer is hidden (isPublic: false)', async () => {
      const res = await request(app)
        .post('/api/v1/enquiries')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({
          lawyerId: privateLawyerApp.id,
          practiceArea: 'Tax',
          subject: 'Tax appeal filing query',
          message: 'Need help filing an appeal before the appellate tribunal.'
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not accepting new enquiries/i);
    });
  });

  // =========================================================================
  // 3. Anti-Spam Throttling (Max 3 Pending Enquiries Per Client-Lawyer Pair)
  // =========================================================================
  describe('3. Anti-Spam Throttling', () => {
    it('should enforce limit of 3 pending enquiries from a single client to an advocate', async () => {
      // clientUser2 creates 3 enquiries in sequence
      const sendEnquiry = (num) =>
        request(app)
          .post('/api/v1/enquiries')
          .set('Authorization', `Bearer ${client2Token}`)
          .send({
            lawyerId: lawyerApp.id,
            practiceArea: 'Civil',
            subject: `Inquiry number ${num} on property title`,
            message: `Detailed inquiry message number ${num} regarding property title deed verification.`
          });

      const res1 = await sendEnquiry(1);
      const res2 = await sendEnquiry(2);
      const res3 = await sendEnquiry(3);

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
      expect(res3.status).toBe(201);

      // 4th enquiry attempt must be blocked with 429
      const res4 = await sendEnquiry(4);
      expect(res4.status).toBe(429);
      expect(res4.body.error).toMatch(/limit of 3 pending enquiries/i);

      // Clean up client2's 3 test enquiries by closing one of them
      await request(app)
        .patch(`/api/v1/enquiries/${res1.body.id}/close`)
        .set('Authorization', `Bearer ${client2Token}`);

      // Now client2 can submit again because active pending count dropped to 2
      const res5 = await sendEnquiry(5);
      expect(res5.status).toBe(201);
    }, 60000);
  });

  // =========================================================================
  // 4. Listing, Filtering & Detail Endpoints
  // =========================================================================
  describe('4. Listing, Filtering & Detail Endpoints', () => {
    let client1EnquiryId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/enquiries')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({
          lawyerId: lawyerApp.id,
          practiceArea: 'Corporate',
          subject: 'Venture capital term sheet review',
          message: 'Need legal representation to examine liquidation preference and board seat clauses.'
        });
      client1EnquiryId = res.body.id;
    });

    it('should allow advocate to view their received enquiries with client details', async () => {
      const res = await request(app)
        .get('/api/v1/lawyer/enquiries?page=1&limit=10')
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('enquiries');
      expect(Array.isArray(res.body.enquiries)).toBe(true);
      expect(res.body.total).toBeGreaterThanOrEqual(1);

      const target = res.body.enquiries.find((e) => e.id === client1EnquiryId);
      expect(target).toBeDefined();
      expect(target.clientName).toBe('Client Asif');
      expect(target.clientEmail).toBe(clientUser1.email);
    });

    it('should filter lawyer enquiries by status', async () => {
      const res = await request(app)
        .get('/api/v1/lawyer/enquiries?status=submitted')
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.enquiries.every((e) => e.status === 'submitted')).toBe(true);
    });

    it('should allow client to view their submitted enquiries with lawyer info', async () => {
      const res = await request(app)
        .get('/api/v1/enquiries/my-enquiries')
        .set('Authorization', `Bearer ${client1Token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('enquiries');
      const target = res.body.enquiries.find((e) => e.id === client1EnquiryId);
      expect(target).toBeDefined();
      expect(target.lawyerName).toBe('Advocate Tariq Multan');
      expect(target.city).toBe('Multan');
    });

    it('should allow client, lawyer, and admin to view single enquiry details', async () => {
      // 1. Client views
      const clientView = await request(app)
        .get(`/api/v1/enquiries/${client1EnquiryId}`)
        .set('Authorization', `Bearer ${client1Token}`);
      expect(clientView.status).toBe(200);
      expect(clientView.body.id).toBe(client1EnquiryId);

      // 2. Lawyer views
      const lawyerView = await request(app)
        .get(`/api/v1/enquiries/${client1EnquiryId}`)
        .set('Authorization', `Bearer ${lawyerToken}`);
      expect(lawyerView.status).toBe(200);
      expect(lawyerView.body.id).toBe(client1EnquiryId);

      // 3. Admin views
      const adminView = await request(app)
        .get(`/api/v1/enquiries/${client1EnquiryId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminView.status).toBe(200);
      expect(adminView.body.id).toBe(client1EnquiryId);
    });

    it('should reject third-party client from viewing someone else enquiry with 403', async () => {
      const res = await request(app)
        .get(`/api/v1/enquiries/${client1EnquiryId}`)
        .set('Authorization', `Bearer ${client2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/permission/i);
    });
  });

  // =========================================================================
  // 5. Advocate Reply & Status Lifecycle
  // =========================================================================
  describe('5. Advocate Reply Lifecycle', () => {
    let enquiryId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/enquiries')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({
          lawyerId: lawyerApp.id,
          practiceArea: 'Corporate',
          subject: 'Shareholders agreement query',
          message: 'Need help drafting minority shareholder protection clauses.'
        });
      enquiryId = res.body.id;
    });

    it('should allow advocate to reply to incoming enquiry', async () => {
      const replyText =
        'I have reviewed your query. Please schedule a video consultation so we can examine the current clauses.';

      const res = await request(app)
        .patch(`/api/v1/lawyer/enquiries/${enquiryId}/reply`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({ reply: replyText });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(ENQUIRY_STATUS.ANSWERED);
      expect(res.body.lawyerReply).toBe(replyText);
      expect(res.body.repliedAt).not.toBeNull();
    });

    it('should reject reply if text is under 10 characters', async () => {
      const res = await request(app)
        .patch(`/api/v1/lawyer/enquiries/${enquiryId}/reply`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({ reply: 'Short' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should reject reply if attempted by a different lawyer', async () => {
      const res = await request(app)
        .patch(`/api/v1/lawyer/enquiries/${enquiryId}/reply`)
        .set('Authorization', `Bearer ${privateLawyerToken}`)
        .send({ reply: 'Unauthorized reply from another advocate in Lahore.' });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/only reply to enquiries sent to you/i);
    });
  });

  // =========================================================================
  // 6. Enquiry Closing & Lead Conversion to Booking
  // =========================================================================
  describe('6. Enquiry Closing & Lead Conversion', () => {
    it('should allow client to close an enquiry and prevent further replies', async () => {
      // 1. Create enquiry
      const enqRes = await request(app)
        .post('/api/v1/enquiries')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({
          lawyerId: lawyerApp.id,
          practiceArea: 'Civil',
          subject: 'Boundary dispute with neighbor',
          message: 'Notice received regarding garden boundary demarcation.'
        });
      const closedId = enqRes.body.id;

      // 2. Client closes enquiry
      const closeRes = await request(app)
        .patch(`/api/v1/enquiries/${closedId}/close`)
        .set('Authorization', `Bearer ${client1Token}`);

      expect(closeRes.status).toBe(200);
      expect(closeRes.body.status).toBe(ENQUIRY_STATUS.CLOSED);

      // 3. Attempting to reply to closed enquiry returns 400
      const replyRes = await request(app)
        .patch(`/api/v1/lawyer/enquiries/${closedId}/reply`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({ reply: 'Attempting to reply to a closed enquiry.' });

      expect(replyRes.status).toBe(400);
      expect(replyRes.body.error).toMatch(/cannot reply to a closed enquiry/i);

      // 4. Attempting to close again returns 400
      const recloseRes = await request(app)
        .patch(`/api/v1/enquiries/${closedId}/close`)
        .set('Authorization', `Bearer ${client1Token}`);

      expect(recloseRes.status).toBe(400);
      expect(recloseRes.body.error).toMatch(/already closed/i);
    });

    it('should convert an enquiry into a consultation booking seamlessly', async () => {
      // 1. Client creates enquiry
      const enqRes = await request(app)
        .post('/api/v1/enquiries')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({
          lawyerId: lawyerApp.id,
          practiceArea: 'Corporate',
          subject: 'Lead conversion consultation inquiry',
          message: 'We want to book a video consultation to finalize our legal strategy.'
        });
      const convertibleEnquiryId = enqRes.body.id;

      // 2. Advocate replies
      await request(app)
        .patch(`/api/v1/lawyer/enquiries/${convertibleEnquiryId}/reply`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          reply: 'Please proceed to book our 30-minute video slot on Monday 17:00 PKT.'
        });

      // 3. Client books appointment linking enquiryId
      const bookRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({
          lawyerId: lawyerApp.id,
          mode: 'video',
          startUtc: testSlotStartUtc,
          clientNotes: 'Following up on our pre-booking enquiry.',
          enquiryId: convertibleEnquiryId
        });

      expect(bookRes.status).toBe(201);
      const bookingId = bookRes.body.booking.id;

      // 4. Inspect enquiry to verify convertedBookingId link
      const checkEnqRes = await request(app)
        .get(`/api/v1/enquiries/${convertibleEnquiryId}`)
        .set('Authorization', `Bearer ${client1Token}`);

      expect(checkEnqRes.status).toBe(200);
      expect(checkEnqRes.body.convertedBooking).not.toBeNull();
      expect(checkEnqRes.body.convertedBooking.id).toBe(bookingId);
      expect(checkEnqRes.body.convertedBooking.mode).toBe('video');
    });
  });
});
