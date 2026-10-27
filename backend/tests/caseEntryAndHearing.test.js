const request = require('supertest');
const app = require('../src/app');
const {
  User,
  LawyerApplication,
  Case,
  CaseEntry,
  Hearing
} = require('../src/models');
const { generateToken } = require('../src/modules/auth/auth.service');
const { TEST_EMAIL_SUFFIX } = require('./setup');

describe('Phase 3 Part I: Case Entries & Court Hearings', () => {
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

  let testCase;
  let offlineCase;

  const uniqueSuffix = () => `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  beforeAll(async () => {
    const passwordHash = 'dummyhash';

    // 1. Owning Approved Advocate
    lawyerUser = await User.create({
      name: 'Adv. Sardar Sikandar Hayat',
      email: `sikandar_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: 'lawyer'
    });
    await LawyerApplication.create({
      userId: lawyerUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `PB-${uniqueSuffix()}`,
      courtLevel: 'High Court',
      city: 'Multan',
      practiceAreas: ['Property', 'Civil'],
      experienceYears: 14,
      chamberAddress: 'Chamber 14, District Courts Multan',
      status: 'approved'
    });
    lawyerToken = generateToken(lawyerUser);

    // 2. Another Approved Advocate
    otherLawyerUser = await User.create({
      name: 'Adv. Farooq Bajwa',
      email: `farooq_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: 'lawyer'
    });
    await LawyerApplication.create({
      userId: otherLawyerUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `PB-${uniqueSuffix()}`,
      courtLevel: 'High Court',
      city: 'Multan',
      practiceAreas: ['Criminal', 'Family'],
      experienceYears: 9,
      chamberAddress: 'Chamber 9, High Court Bar Multan',
      status: 'approved'
    });
    otherLawyerToken = generateToken(otherLawyerUser);

    // 3. Linked Litigant Client
    clientUser = await User.create({
      name: 'Chaudhry Riaz Ahmad',
      email: `riaz_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: 'client'
    });
    clientToken = generateToken(clientUser);

    // 4. Unlinked Client
    otherClientUser = await User.create({
      name: 'Mian Tariq Munir',
      email: `tariq_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: 'client'
    });
    otherClientToken = generateToken(otherClientUser);

    // 5. Administrator
    adminUser = await User.create({
      name: 'Court Registrar Multan',
      email: `registrar_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: 'admin'
    });
    adminToken = generateToken(adminUser);

    // 6. Linked Test Case
    testCase = await Case.create({
      lawyerId: lawyerUser.id,
      clientId: clientUser.id,
      title: 'Haji Ghulam Rasool Partition Suit',
      practiceArea: 'Property',
      court: 'District Court, Multan',
      caseOrFirNumber: 'Suit No. 204/2026',
      status: 'Active',
      stage: 'Pleadings'
    });

    // 7. Offline Walk-in Case (Lawyer Only, No Client)
    offlineCase = await Case.create({
      lawyerId: lawyerUser.id,
      clientId: null,
      title: 'Walk-in Private Revenue Appeal',
      practiceArea: 'Property',
      court: 'Lahore High Court',
      status: 'Prospect'
    });
  });

  // ==========================================
  // SECTION 1: Case Diary Entries (/cases/:id/entries)
  // ==========================================
  describe('1. Case Diary Entries Management', () => {
    let privateEntryId;
    let sharedEntryId;

    it('should reject unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/entries`)
        .send({
          entryDate: '2026-10-24',
          entryType: 'note',
          title: 'Preliminary Case Inspection',
          body: 'Reviewed revenue patwari records.'
        });

      expect(res.status).toBe(401);
    });

    it('should reject non-lawyer roles attempting to create entries with 403 Forbidden', async () => {
      const clientRes = await request(app)
        .post(`/api/v1/cases/${testCase.id}/entries`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          entryDate: '2026-10-24',
          entryType: 'note',
          title: 'Client Note',
          body: 'Attempting to inject note.'
        });
      expect(clientRes.status).toBe(403);

      const adminRes = await request(app)
        .post(`/api/v1/cases/${testCase.id}/entries`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          entryDate: '2026-10-24',
          entryType: 'order',
          title: 'Admin Directive',
          body: 'Admin note injection.'
        });
      expect(adminRes.status).toBe(403);
    });

    it('should reject creation by another lawyer with 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/entries`)
        .set('Authorization', `Bearer ${otherLawyerToken}`)
        .send({
          entryDate: '2026-10-24',
          entryType: 'note',
          title: 'Intruder Note',
          body: 'Viewing unauthorized case.'
        });

      expect(res.status).toBe(403);
    });

    it('should reject creation with missing required fields with 400 Bad Request', async () => {
      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/entries`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          entryDate: 'invalid-date-format',
          entryType: 'invalid_type',
          title: ''
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should successfully create a private entry by default (201 Created)', async () => {
      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/entries`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          entryDate: '2026-10-24',
          entryType: 'note',
          title: 'Chamber Confidential Strategy',
          body: 'Plaintiff witness cross-examination must focus on the registered sale deed of 1994.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.visibility).toBe('private');
      expect(res.body.data.title).toBe('Chamber Confidential Strategy');
      privateEntryId = res.body.data.id;
    });

    it('should successfully create a shared entry when visibility: shared is specified (201 Created)', async () => {
      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/entries`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          entryDate: '2026-10-24',
          entryType: 'order',
          title: 'Interim Status Quo Granted',
          body: 'Learned Civil Judge Multan was pleased to issue temporary injunction restraining respondents.',
          visibility: 'shared'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.visibility).toBe('shared');
      sharedEntryId = res.body.data.id;
    });

    it('should allow assigned lawyer to update an entry (200 OK)', async () => {
      const res = await request(app)
        .patch(`/api/v1/cases/${testCase.id}/entries/${privateEntryId}`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          title: 'Chamber Confidential Strategy (Amended)',
          body: 'Updated strategy to cross-examine Patwari Halqa.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Chamber Confidential Strategy (Amended)');
    });

    it('should list all entries (private and shared) for the owning advocate', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}/entries`)
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.items.some((e) => e.visibility === 'private')).toBe(true);
      expect(res.body.data.items.some((e) => e.visibility === 'shared')).toBe(true);
    });

    it('should list ONLY shared entries for the linked client (private entries shielded)', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}/entries`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].id).toBe(sharedEntryId);
      expect(res.body.data.items[0].visibility).toBe('shared');
      expect(res.body.data.items.some((e) => e.id === privateEntryId)).toBe(false);
    });

    it('should reject unlinked client from viewing entries with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}/entries`)
        .set('Authorization', `Bearer ${otherClientToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject administrator from viewing entries with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}/entries`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ==========================================
  // SECTION 2: Court Hearings & Scheduling
  // ==========================================
  describe('2. Court Hearings & Scheduling (/cases/:id/hearings)', () => {
    let pastHearingId;
    let upcomingHearingId;
    let privateHearingId;

    it('should reject scheduling by non-lawyer or other lawyer with 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/hearings`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          scheduledAt: '2026-11-15T09:30:00.000Z',
          stage: 'Issues'
        });
      expect(res.status).toBe(403);

      const otherLawyerRes = await request(app)
        .post(`/api/v1/cases/${testCase.id}/hearings`)
        .set('Authorization', `Bearer ${otherLawyerToken}`)
        .send({
          scheduledAt: '2026-11-15T09:30:00.000Z',
          stage: 'Issues'
        });
      expect(otherLawyerRes.status).toBe(403);
    });

    it('should successfully schedule an upcoming shared hearing (201 Created)', async () => {
      const scheduledTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days in future

      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/hearings`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          scheduledAt: scheduledTime,
          bench: 'Court Room No. 4',
          stage: 'Issues',
          note: 'Chamber memo: check defendant written statement for denials under Order 8.',
          clientExplanation: 'The court will frame issues based on pleadings of both sides.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.court).toBe('District Court, Multan'); // Inherited from case default
      expect(res.body.data.visibility).toBe('shared'); // Default is shared for hearings
      expect(res.body.data.note).toBe('Chamber memo: check defendant written statement for denials under Order 8.');
      upcomingHearingId = res.body.data.id;
    });

    it('should schedule a past hearing and a private hearing', async () => {
      // Past hearing
      const pastTime = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const pastRes = await request(app)
        .post(`/api/v1/cases/${testCase.id}/hearings`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          scheduledAt: pastTime,
          bench: 'Court Room No. 4',
          stage: 'Pleadings',
          outcome: 'Written statement submitted by respondent No. 1.',
          nextDate: '2026-11-15',
          adjournmentReason: 'Adjourned for replica',
          visibility: 'shared'
        });
      expect(pastRes.status).toBe(201);
      pastHearingId = pastRes.body.data.id;

      // Private hearing
      const privateFuture = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const privRes = await request(app)
        .post(`/api/v1/cases/${testCase.id}/hearings`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          scheduledAt: privateFuture,
          stage: 'Arguments',
          visibility: 'private',
          note: 'Private in-chamber preparation conference.'
        });
      expect(privRes.status).toBe(201);
      privateHearingId = privRes.body.data.id;
    });

    it('should update hearing details by owning lawyer (200 OK)', async () => {
      const res = await request(app)
        .patch(`/api/v1/cases/${testCase.id}/hearings/${upcomingHearingId}`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          bench: 'Court Room No. 2 (Transferred)',
          clientExplanation: 'Matter transferred to Court Room No. 2.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bench).toBe('Court Room No. 2 (Transferred)');
    });

    it('should allow quick outcome recording via PATCH /hearings/:id/outcome (200 OK)', async () => {
      const res = await request(app)
        .patch(`/api/v1/hearings/${upcomingHearingId}/outcome`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          outcome: 'Issues framed by Senior Civil Judge; fixed for Plaintiff evidence.',
          nextDate: '2026-11-28',
          adjournmentReason: 'Court time elapsed during cause list'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.outcome).toBe('Issues framed by Senior Civil Judge; fixed for Plaintiff evidence.');
      expect(res.body.data.nextDate).toBe('2026-11-28');
      expect(res.body.data.adjournmentReason).toBe('Court time elapsed during cause list');
    });

    it('should reject quick outcome by another lawyer with 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/v1/hearings/${upcomingHearingId}/outcome`)
        .set('Authorization', `Bearer ${otherLawyerToken}`)
        .send({
          outcome: 'Unauthorized modification'
        });

      expect(res.status).toBe(403);
    });

    it('should list all hearings for the owning advocate with full private notes intact', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}/hearings`)
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(3);
      const target = res.body.data.items.find((h) => h.id === upcomingHearingId);
      expect(target).toBeDefined();
      expect(target.note).toBeDefined();
    });

    it('should list ONLY shared hearings for linked client and SHIELD private note', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}/hearings`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      // Private hearing must be hidden
      expect(res.body.data.items.some((h) => h.id === privateHearingId)).toBe(false);

      // In shared hearings, client sees date, court, stage, outcome, clientExplanation, but NEVER note
      const sharedItem = res.body.data.items.find((h) => h.id === upcomingHearingId);
      expect(sharedItem).toBeDefined();
      expect(sharedItem.clientExplanation).toBe('Matter transferred to Court Room No. 2.');
      expect(sharedItem.note).toBeUndefined(); // STRICT CLIENT LEAK CHECK
    });
  });

  // ==========================================
  // SECTION 3: Dynamic nextHearing Calculation
  // ==========================================
  describe('3. Dynamic nextHearing Calculation on Cases API', () => {
    it('should dynamically return earliest future hearing on GET /cases/:id for lawyer', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}`)
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.nextHearing).not.toBeNull();
      expect(new Date(res.body.data.nextHearing.scheduledAt).getTime()).toBeGreaterThan(Date.now() - 1000);
      expect(res.body.data.nextHearing.note).toBeDefined(); // Lawyer sees note
    });

    it('should dynamically return earliest future hearing on GET /cases/:id for client without note', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.nextHearing).not.toBeNull();
      expect(res.body.data.nextHearing.note).toBeUndefined(); // Client NEVER receives note
      expect(res.body.data.nextHearing.court).toBe('District Court, Multan');
    });

    it('should return null nextHearing for a case with no scheduled future hearings', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${offlineCase.id}`)
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.nextHearing).toBeNull();
    });

    it('should populate nextHearing on GET /cases list items', async () => {
      const res = await request(app)
        .get('/api/v1/cases')
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      const caseItem = res.body.data.items.find((c) => c.id === testCase.id);
      expect(caseItem).toBeDefined();
      expect(caseItem.nextHearing).not.toBeNull();
    });
  });

  // ==========================================
  // SECTION 4: Cross-Case Cause List Query
  // ==========================================
  describe('4. Cross-Case Cause List Query (GET /api/v1/hearings)', () => {
    it('should return hearings across cases for lawyer with date and court filters', async () => {
      const from = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      const to = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .get(`/api/v1/hearings?from=${from}&to=${to}&court=Multan`)
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.items[0]).toHaveProperty('case');
      expect(res.body.data.items[0].case.id).toBe(testCase.id);
    });

    it('should allow linked client to query shared hearings across their cases (projected)', async () => {
      const res = await request(app)
        .get('/api/v1/hearings')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      // Verify every item is projected
      for (const item of res.body.data.items) {
        expect(item.visibility).toBe('shared');
        expect(item.note).toBeUndefined(); // Zero leak
      }
    });

    it('should reject admin access on cross-case hearings query with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/hearings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ==========================================
  // SECTION 5: Comprehensive 6-Role Permission Matrix & Client Leak Test
  // ==========================================
  describe('5. Comprehensive Permission Matrix & Leak Test', () => {
    it('Owner Lawyer: 200 OK across all read and write endpoints', async () => {
      const resEntries = await request(app)
        .get(`/api/v1/cases/${testCase.id}/entries`)
        .set('Authorization', `Bearer ${lawyerToken}`);
      expect(resEntries.status).toBe(200);

      const resHearings = await request(app)
        .get(`/api/v1/cases/${testCase.id}/hearings`)
        .set('Authorization', `Bearer ${lawyerToken}`);
      expect(resHearings.status).toBe(200);
    });

    it('Another Lawyer: 403 Forbidden across all endpoints for this case', async () => {
      const resEntries = await request(app)
        .get(`/api/v1/cases/${testCase.id}/entries`)
        .set('Authorization', `Bearer ${otherLawyerToken}`);
      expect(resEntries.status).toBe(403);

      const resHearings = await request(app)
        .get(`/api/v1/cases/${testCase.id}/hearings`)
        .set('Authorization', `Bearer ${otherLawyerToken}`);
      expect(resHearings.status).toBe(403);
    });

    it('Linked Client: 200 OK on GET shared items, 403 Forbidden on writes', async () => {
      const postEntry = await request(app)
        .post(`/api/v1/cases/${testCase.id}/entries`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          entryDate: '2026-10-24',
          entryType: 'note',
          title: 'Illegal Post',
          body: 'Client cannot write.'
        });
      expect(postEntry.status).toBe(403);

      const postHearing = await request(app)
        .post(`/api/v1/cases/${testCase.id}/hearings`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          scheduledAt: '2026-11-20T09:00:00.000Z'
        });
      expect(postHearing.status).toBe(403);
    });

    it('Unlinked Client: 403 Forbidden across all endpoints', async () => {
      const resEntries = await request(app)
        .get(`/api/v1/cases/${testCase.id}/entries`)
        .set('Authorization', `Bearer ${otherClientToken}`);
      expect(resEntries.status).toBe(403);

      const resHearings = await request(app)
        .get(`/api/v1/cases/${testCase.id}/hearings`)
        .set('Authorization', `Bearer ${otherClientToken}`);
      expect(resHearings.status).toBe(403);
    });

    it('Admin: 403 Forbidden across all case-scoped and hearing endpoints', async () => {
      const resEntries = await request(app)
        .get(`/api/v1/cases/${testCase.id}/entries`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resEntries.status).toBe(403);

      const resHearings = await request(app)
        .get(`/api/v1/cases/${testCase.id}/hearings`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resHearings.status).toBe(403);

      const resAllHearings = await request(app)
        .get('/api/v1/hearings')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resAllHearings.status).toBe(403);
    });

    it('No Token: 401 Unauthorized across all endpoints', async () => {
      const res1 = await request(app).get(`/api/v1/cases/${testCase.id}/entries`);
      expect(res1.status).toBe(401);

      const res2 = await request(app).get(`/api/v1/cases/${testCase.id}/hearings`);
      expect(res2.status).toBe(401);

      const res3 = await request(app).get('/api/v1/hearings');
      expect(res3.status).toBe(401);
    });
  });
});
