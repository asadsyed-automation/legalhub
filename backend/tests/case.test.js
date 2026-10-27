const request = require('supertest');
const app = require('../src/app');
const {
  User,
  LawyerApplication,
  LawyerProfile,
  LawyerService,
  Booking,
  Case,
  CaseParty,
  CaseStatusEvent
} = require('../src/models');
const { generateToken } = require('../src/modules/auth/auth.service');
const {
  ROLES,
  APPLICATION_STATUS,
  BOOKING_STATUS,
  PRACTICE_AREAS,
  COURTS,
  CASE_STATUSES,
  CASE_STAGES
} = require('../src/constants');

const TEST_EMAIL_SUFFIX = '@test.legalhub.local';

describe('Phase 3 Part H: Cases, Parties, Status Events & Access Boundaries', () => {
  let lawyerUser, otherLawyerUser, unapprovedLawyerUser;
  let clientUser, otherClientUser, adminUser;
  let lawyerToken, otherLawyerToken, unapprovedLawyerToken;
  let clientToken, otherClientToken, adminToken;

  let completedBooking, requestedBooking, otherLawyerBooking;
  let lawyerService;

  beforeAll(async () => {
    const ts = Date.now();

    // 1. Approved Lawyer
    lawyerUser = await User.create({
      name: 'Advocate Sardar Sikandar Hayat',
      email: `sikandar_case_${ts}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER
    });
    lawyerToken = generateToken(lawyerUser);

    await LawyerApplication.create({
      userId: lawyerUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `BC-CASE-1-${ts}`,
      courtLevel: 'Advocate High Court',
      city: 'Multan',
      practiceAreas: ['Civil', 'Property'],
      experienceYears: 12,
      chamberAddress: 'Chamber 12, District Courts Multan',
      status: APPLICATION_STATUS.APPROVED
    });

    lawyerService = await LawyerService.create({
      lawyerId: lawyerUser.id,
      mode: 'in_chamber',
      durationMinutes: 30,
      feePkr: 3000,
      isActive: true
    });

    // 2. Second Approved Lawyer
    otherLawyerUser = await User.create({
      name: 'Advocate Tariq Mehmood',
      email: `tariq_case_${ts}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER
    });
    otherLawyerToken = generateToken(otherLawyerUser);

    await LawyerApplication.create({
      userId: otherLawyerUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `BC-CASE-2-${ts}`,
      courtLevel: 'Advocate High Court',
      city: 'Lahore',
      practiceAreas: ['Corporate', 'Civil'],
      experienceYears: 8,
      chamberAddress: 'Chamber 44, High Court Lahore',
      status: APPLICATION_STATUS.APPROVED
    });

    // 3. Unapproved (Pending) Lawyer
    unapprovedLawyerUser = await User.create({
      name: 'Advocate Pending Kasuri',
      email: `pending_case_${ts}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER
    });
    unapprovedLawyerToken = generateToken(unapprovedLawyerUser);

    await LawyerApplication.create({
      userId: unapprovedLawyerUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `BC-CASE-3-${ts}`,
      courtLevel: 'Advocate Lower Courts',
      city: 'Multan',
      practiceAreas: ['Civil'],
      experienceYears: 2,
      chamberAddress: 'Chamber 9, Multan',
      status: APPLICATION_STATUS.PENDING
    });

    // 4. Linked Client
    clientUser = await User.create({
      name: 'Citizen Ahmad Raza',
      email: `ahmad_case_${ts}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.CLIENT
    });
    clientToken = generateToken(clientUser);

    // 5. Unlinked Client
    otherClientUser = await User.create({
      name: 'Citizen Babar Khan',
      email: `babar_case_${ts}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.CLIENT
    });
    otherClientToken = generateToken(otherClientUser);

    // 6. Court Administrator
    adminUser = await User.create({
      name: 'Court Administrator',
      email: `admin_case_${ts}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.ADMIN
    });
    adminToken = generateToken(adminUser);

    // 7. Completed Booking (Assigned to lawyerUser, booked by clientUser)
    completedBooking = await Booking.create({
      clientId: clientUser.id,
      lawyerId: lawyerUser.id,
      serviceId: lawyerService.id,
      mode: 'in_chamber',
      date: '2026-10-20',
      startsAt: new Date(Date.now() - 48 * 3600 * 1000),
      endsAt: new Date(Date.now() - 47 * 3600 * 1000),
      startUtc: new Date(Date.now() - 48 * 3600 * 1000),
      endUtc: new Date(Date.now() - 47 * 3600 * 1000),
      durationMinutes: 30,
      feePkr: 3000,
      totalFeePkr: 3000,
      status: BOOKING_STATUS.COMPLETED,
      issueSummary: 'Ancestral land boundary dispute'
    });

    // 8. Uncompleted Booking (Requested status)
    requestedBooking = await Booking.create({
      clientId: clientUser.id,
      lawyerId: lawyerUser.id,
      serviceId: lawyerService.id,
      mode: 'in_chamber',
      date: '2026-10-28',
      startsAt: new Date(Date.now() + 48 * 3600 * 1000),
      endsAt: new Date(Date.now() + 49 * 3600 * 1000),
      startUtc: new Date(Date.now() + 48 * 3600 * 1000),
      endUtc: new Date(Date.now() + 49 * 3600 * 1000),
      durationMinutes: 30,
      feePkr: 3000,
      totalFeePkr: 3000,
      status: BOOKING_STATUS.REQUESTED,
      issueSummary: 'Pending review'
    });

    // 9. Booking assigned to otherLawyerUser
    otherLawyerBooking = await Booking.create({
      clientId: otherClientUser.id,
      lawyerId: otherLawyerUser.id,
      mode: 'in_chamber',
      date: '2026-10-20',
      startsAt: new Date(Date.now() - 24 * 3600 * 1000),
      endsAt: new Date(Date.now() - 23 * 3600 * 1000),
      startUtc: new Date(Date.now() - 24 * 3600 * 1000),
      endUtc: new Date(Date.now() - 23 * 3600 * 1000),
      durationMinutes: 30,
      feePkr: 2500,
      totalFeePkr: 2500,
      status: BOOKING_STATUS.COMPLETED,
      issueSummary: 'Corporate contract issue'
    });
  });

  // ==========================================
  // SECTION 1: Case Creation Rules & Validation
  // ==========================================
  describe('1. Case Creation Rules & Validation (POST /api/v1/cases)', () => {
    it('should reject unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/cases')
        .send({ title: 'Test Case' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject non-lawyer roles (client and admin) with 403 Forbidden', async () => {
      const clientRes = await request(app)
        .post('/api/v1/cases')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          title: 'Client Attempt Case',
          practiceArea: 'Civil',
          court: 'District Court, Multan'
        });
      expect(clientRes.status).toBe(403);

      const adminRes = await request(app)
        .post('/api/v1/cases')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Attempt Case',
          practiceArea: 'Civil',
          court: 'District Court, Multan'
        });
      expect(adminRes.status).toBe(403);
    });

    it('should reject advocate with pending or unapproved status with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/cases')
        .set('Authorization', `Bearer ${unapprovedLawyerToken}`)
        .send({
          title: 'Pending Lawyer Case',
          practiceArea: 'Civil',
          court: 'District Court, Multan'
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/approved/i);
    });

    it('should reject creation with missing or invalid fields (400 Bad Request)', async () => {
      // Missing title
      const res1 = await request(app)
        .post('/api/v1/cases')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          practiceArea: 'Civil',
          court: 'District Court, Multan'
        });
      expect(res1.status).toBe(400);

      // Invalid practice area
      const res2 = await request(app)
        .post('/api/v1/cases')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          title: 'Valid Title',
          practiceArea: 'NonExistentArea',
          court: 'District Court, Multan'
        });
      expect(res2.status).toBe(400);

      // Invalid court
      const res3 = await request(app)
        .post('/api/v1/cases')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          title: 'Valid Title',
          practiceArea: 'Civil',
          court: 'Imaginary Bench, Narnia'
        });
      expect(res3.status).toBe(400);
    });

    it('should reject creation if parties array exceeds 10 members', async () => {
      const excessiveParties = Array.from({ length: 11 }, (_, i) => ({
        name: `Person ${i + 1}`,
        roleLabel: 'Respondent'
      }));

      const res = await request(app)
        .post('/api/v1/cases')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          title: 'Excessive Parties Case',
          practiceArea: 'Civil',
          court: 'District Court, Multan',
          parties: excessiveParties
        });

      expect(res.status).toBe(400);
      expect(res.body.details.some((d) => /10 parties/i.test(d.message))).toBe(true);
    });

    it('should successfully create an advocate-only case without bookingId (201 Created)', async () => {
      const res = await request(app)
        .post('/api/v1/cases')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          title: 'Chamber Walk-in Revenue Suit',
          practiceArea: 'Property',
          court: 'District Court, Multan',
          caseOrFirNumber: 'Suit No. 104/2026',
          filingDate: '2026-10-15',
          parties: [
            { name: 'Haji Ghulam Rasool', roleLabel: 'Plaintiff' },
            { name: 'Muhammad Akhtar', roleLabel: 'Defendant' }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.lawyerId).toBe(lawyerUser.id);
      expect(res.body.data.clientId).toBeNull();
      expect(res.body.data.bookingId).toBeNull();
      expect(res.body.data.status).toBe('Prospect');
      expect(res.body.data.stage).toBeNull();
      expect(res.body.data.parties).toHaveLength(2);
      expect(res.body.data.parties[0].name).toBe('Haji Ghulam Rasool');
      expect(res.body.data.nextHearing).toBeNull();

      // Verify status event created
      expect(res.body.data.statusEvents).toHaveLength(1);
      expect(res.body.data.statusEvents[0].toStatus).toBe('Prospect');
      expect(res.body.data.statusEvents[0].changedBy).toBe(lawyerUser.id);
    });
  });

  // ==========================================
  // SECTION 2: Booking Linkage Rules
  // ==========================================
  describe('2. Booking Linkage Rules & Validation', () => {
    let linkedCaseId;

    it('should reject linking a non-existent booking (404 Not Found)', async () => {
      const res = await request(app)
        .post('/api/v1/cases')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          title: 'Missing Booking Case',
          practiceArea: 'Civil',
          court: 'District Court, Multan',
          bookingId: '00000000-0000-0000-0000-000000000000'
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/booking not found/i);
    });

    it('should reject linking a booking belonging to another advocate (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/cases')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          title: 'Stolen Booking Case',
          practiceArea: 'Civil',
          court: 'District Court, Multan',
          bookingId: otherLawyerBooking.id
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/assigned to your chamber/i);
    });

    it('should reject linking an uncompleted booking (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/v1/cases')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          title: 'Premature Booking Case',
          practiceArea: 'Civil',
          court: 'District Court, Multan',
          bookingId: requestedBooking.id
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/completed/i);
    });

    it('should successfully link completed booking and resolve clientId automatically (201 Created)', async () => {
      const res = await request(app)
        .post('/api/v1/cases')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          title: 'Dispute Over Agricultural Mutation',
          practiceArea: 'Property',
          court: 'District Court, Multan',
          caseOrFirNumber: 'FIR 108/2026',
          filingDate: '2026-10-22',
          bookingId: completedBooking.id,
          status: 'Active',
          stage: 'Pleadings',
          parties: [
            { name: 'Citizen Ahmad Raza', roleLabel: 'Complainant' },
            { name: 'State', roleLabel: 'Prosecution' }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.data.bookingId).toBe(completedBooking.id);
      expect(res.body.data.clientId).toBe(clientUser.id);
      expect(res.body.data.status).toBe('Active');
      expect(res.body.data.stage).toBe('Pleadings');

      linkedCaseId = res.body.data.id;
    });

    it('should reject duplicate linking: one booking links to one case only (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/v1/cases')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          title: 'Duplicate Booking Case',
          practiceArea: 'Property',
          court: 'District Court, Multan',
          bookingId: completedBooking.id
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already linked/i);
    });
  });

  // ==========================================
  // SECTION 3: Modifying Cases & Late Linking
  // ==========================================
  describe('3. Modifying Cases & Late Linking (PATCH /api/v1/cases/:id)', () => {
    let unlinkedCaseId;

    beforeAll(async () => {
      const c = await Case.create({
        lawyerId: lawyerUser.id,
        title: 'Chamber Matter for Late Linking',
        practiceArea: 'Civil',
        court: 'District Court, Multan',
        status: 'Prospect'
      });
      unlinkedCaseId = c.id;
    });

    it('should reject modification by another lawyer (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/v1/cases/${unlinkedCaseId}`)
        .set('Authorization', `Bearer ${otherLawyerToken}`)
        .send({ title: 'Hijacked Title' });

      expect(res.status).toBe(403);
    });

    it('should allow assigned lawyer to update fields and perform full replacement of parties (200 OK)', async () => {
      const res = await request(app)
        .patch(`/api/v1/cases/${unlinkedCaseId}`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          title: 'Updated Civil Revision Title',
          caseOrFirNumber: 'Rev. 44/2026',
          parties: [
            { name: 'Sole Petitioner', roleLabel: 'Petitioner' }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Civil Revision Title');
      expect(res.body.data.caseOrFirNumber).toBe('Rev. 44/2026');
      expect(res.body.data.parties).toHaveLength(1);
      expect(res.body.data.parties[0].name).toBe('Sole Petitioner');
    });

    it('should record case_status_events when status or stage transitions', async () => {
      const res = await request(app)
        .patch(`/api/v1/cases/${unlinkedCaseId}`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          status: 'Active',
          stage: 'Issues'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('Active');
      expect(res.body.data.stage).toBe('Issues');

      // Check database event row
      const event = await CaseStatusEvent.findOne({
        where: { caseId: unlinkedCaseId, toStatus: 'Active', toStage: 'Issues' }
      });
      expect(event).not.toBeNull();
      expect(event.fromStatus).toBe('Prospect');
      expect(event.changedBy).toBe(lawyerUser.id);
    });

    it('should allow late client linking via PATCH while the case has no client', async () => {
      // Create a fresh completed booking for late linking
      const secondCompletedBooking = await Booking.create({
        clientId: clientUser.id,
        lawyerId: lawyerUser.id,
        serviceId: lawyerService.id,
        mode: 'in_chamber',
        date: '2026-10-21',
        startsAt: new Date(Date.now() - 36 * 3600 * 1000),
        endsAt: new Date(Date.now() - 35 * 3600 * 1000),
        startUtc: new Date(Date.now() - 36 * 3600 * 1000),
        endUtc: new Date(Date.now() - 35 * 3600 * 1000),
        durationMinutes: 30,
        feePkr: 3000,
        totalFeePkr: 3000,
        status: BOOKING_STATUS.COMPLETED,
        issueSummary: 'Second consultation'
      });

      const res = await request(app)
        .patch(`/api/v1/cases/${unlinkedCaseId}`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          bookingId: secondCompletedBooking.id
        });

      expect(res.status).toBe(200);
      expect(res.body.data.bookingId).toBe(secondCompletedBooking.id);
      expect(res.body.data.clientId).toBe(clientUser.id);
    });

    it('should reject re-linking when case is already linked to a client (409 Conflict)', async () => {
      const res = await request(app)
        .patch(`/api/v1/cases/${unlinkedCaseId}`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          bookingId: completedBooking.id
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already linked to a client/i);
    });
  });

  // ==========================================
  // SECTION 4: Querying & Filters (GET /api/v1/cases)
  // ==========================================
  describe('4. Querying & Filters (GET /api/v1/cases)', () => {
    it('should list cases for the owning advocate with pagination metadata', async () => {
      const res = await request(app)
        .get('/api/v1/cases?page=1&limit=10')
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data.total).toBeGreaterThanOrEqual(2);
      expect(res.body.data.items[0]).toHaveProperty('lawyerId', lawyerUser.id);
    });

    it('should filter lawyer cases by status and court', async () => {
      const res = await request(app)
        .get('/api/v1/cases?status=Active&court=District Court, Multan')
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      res.body.data.items.forEach((c) => {
        expect(c.status).toBe('Active');
        expect(c.court).toBe('District Court, Multan');
      });
    });

    it('should allow linked client to list only cases linked to them', async () => {
      const res = await request(app)
        .get('/api/v1/cases')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);

      // Verify each item is projected
      res.body.data.items.forEach((c) => {
        expect(c).toHaveProperty('title');
        expect(c).toHaveProperty('court');
        expect(c).toHaveProperty('status');
        expect(c).not.toHaveProperty('lawyerId');
        expect(c).not.toHaveProperty('clientId');
        expect(c).not.toHaveProperty('bookingId');
      });
    });

    it('should return empty list for unlinked client with 0 linked cases', async () => {
      const res = await request(app)
        .get('/api/v1/cases')
        .set('Authorization', `Bearer ${otherClientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toEqual([]);
      expect(res.body.data.total).toBe(0);
    });
  });

  // ==========================================
  // SECTION 5: Permission Matrix & Client Projection Leak Test
  // ==========================================
  describe('5. Comprehensive Permission Matrix & Client Projection Leak Test', () => {
    let testCase;

    beforeAll(async () => {
      testCase = await Case.create({
        lawyerId: lawyerUser.id,
        clientId: clientUser.id,
        bookingId: null,
        title: 'Sensitive Family Custody Petition',
        practiceArea: 'Family',
        court: 'District Court, Multan',
        caseOrFirNumber: 'Guardianship 99/2026',
        filingDate: '2026-10-18',
        status: 'Active',
        stage: 'Evidence'
      });

      await CaseParty.create({
        caseId: testCase.id,
        name: 'Mst. Razia Sultana',
        roleLabel: 'Mother / Guardian'
      });
    });

    it('Owner Lawyer: 200 OK on get single case with full unprojected model', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}`)
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('lawyerId', lawyerUser.id);
      expect(res.body.data).toHaveProperty('clientId', clientUser.id);
      expect(res.body.data).toHaveProperty('parties');
      expect(res.body.data).toHaveProperty('client');
      expect(res.body.data.client).toHaveProperty('name', 'Citizen Ahmad Raza');
      expect(res.body.data.client).not.toHaveProperty('email'); // Never leak email
    });

    it('Another Lawyer: 403 Forbidden on get single case', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}`)
        .set('Authorization', `Bearer ${otherLawyerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/assigned advocate/i);
    });

    it('Unlinked Client: 403 Forbidden on get single case', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}`)
        .set('Authorization', `Bearer ${otherClientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/do not have access/i);
    });

    it('Admin: 403 Forbidden on get single case and list cases', async () => {
      const singleRes = await request(app)
        .get(`/api/v1/cases/${testCase.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(singleRes.status).toBe(403);
      expect(singleRes.body.error).toMatch(/administrators have no access/i);

      const listRes = await request(app)
        .get('/api/v1/cases')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(listRes.status).toBe(403);
    });

    it('No Token: 401 Unauthorized across all endpoints', async () => {
      const r1 = await request(app).post('/api/v1/cases').send({});
      expect(r1.status).toBe(401);

      const r2 = await request(app).get('/api/v1/cases');
      expect(r2.status).toBe(401);

      const r3 = await request(app).get(`/api/v1/cases/${testCase.id}`);
      expect(r3.status).toBe(401);

      const r4 = await request(app).patch(`/api/v1/cases/${testCase.id}`).send({});
      expect(r4.status).toBe(401);
    });

    it('STRICT CLIENT PROJECTION LEAK TEST: Linked Client MUST receive only whitelisted fields', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;

      // 1. Mandatory Whitelisted Fields Present
      expect(data).toHaveProperty('id', testCase.id);
      expect(data).toHaveProperty('title', 'Sensitive Family Custody Petition');
      expect(data).toHaveProperty('court', 'District Court, Multan');
      expect(data).toHaveProperty('practiceArea', 'Family');
      expect(data).toHaveProperty('status', 'Active');
      expect(data).toHaveProperty('stage', 'Evidence');
      expect(data).toHaveProperty('caseOrFirNumber', 'Guardianship 99/2026');
      expect(data).toHaveProperty('filingDate', '2026-10-18');
      expect(data).toHaveProperty('parties');
      expect(data.parties).toHaveLength(1);
      expect(data.parties[0]).toHaveProperty('name', 'Mst. Razia Sultana');
      expect(data.parties[0]).toHaveProperty('roleLabel', 'Mother / Guardian');
      expect(data).toHaveProperty('nextHearing', null);
      expect(data).toHaveProperty('createdAt');
      expect(data).toHaveProperty('updatedAt');

      // 2. Strict Zero Leakage Checks (MUST NOT be present)
      expect(data).not.toHaveProperty('lawyerId');
      expect(data).not.toHaveProperty('clientId');
      expect(data).not.toHaveProperty('bookingId');
      expect(data).not.toHaveProperty('statusEvents');
      expect(data).not.toHaveProperty('client');
      expect(data).not.toHaveProperty('lawyer');
      expect(data).not.toHaveProperty('notes');
      expect(data).not.toHaveProperty('privateNotes');

      // 3. String representation must not leak email
      const stringified = JSON.stringify(data);
      expect(stringified).not.toContain('@');
      expect(stringified).not.toContain('sikandar_case_');
      expect(stringified).not.toContain('ahmad_case_');
    });
  });
});
