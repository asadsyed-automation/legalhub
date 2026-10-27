const request = require('supertest');
const app = require('../src/app');
const {
  User,
  LawyerApplication,
  Case,
  CaseParty,
  CaseStatusEvent,
  CaseEntry,
  Hearing,
  Document
} = require('../src/models');
const { generateToken } = require('../src/modules/auth/auth.service');
const { TEST_EMAIL_SUFFIX } = require('./setup');

describe('Phase 3 Part L: Case Timeline & Client View', () => {
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
  const privateHearingNoteText = 'CONFIDENTIAL_STRATEGY_CROSS_EXAMINE_PW1';

  const uniqueSuffix = () => `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  beforeAll(async () => {
    const passwordHash = 'dummyhash';

    // 1. Owning Advocate
    lawyerUser = await User.create({
      name: 'Adv. Mian Shahbaz Ahmad',
      email: `shahbaz_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: 'lawyer'
    });
    await LawyerApplication.create({
      userId: lawyerUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `PB-${uniqueSuffix()}`,
      courtLevel: 'High Court',
      city: 'Multan',
      practiceAreas: ['Civil', 'Family'],
      experienceYears: 16,
      chamberAddress: 'Chamber 12, High Court Multan',
      status: 'approved'
    });
    lawyerToken = generateToken(lawyerUser);

    // 2. Another Advocate
    otherLawyerUser = await User.create({
      name: 'Adv. Rana Mansoor Ali',
      email: `mansoor_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: 'lawyer'
    });
    await LawyerApplication.create({
      userId: otherLawyerUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `PB-${uniqueSuffix()}`,
      courtLevel: 'High Court',
      city: 'Multan',
      practiceAreas: ['Criminal'],
      experienceYears: 8,
      chamberAddress: 'Chamber 4, District Courts Multan',
      status: 'approved'
    });
    otherLawyerToken = generateToken(otherLawyerUser);

    // 3. Linked Litigant Client
    clientUser = await User.create({
      name: 'Haji Ghulam Shabbir',
      email: `shabbir_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: 'client'
    });
    clientToken = generateToken(clientUser);

    // 4. Unlinked Client
    otherClientUser = await User.create({
      name: 'Naveed Akhtar',
      email: `naveed_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: 'client'
    });
    otherClientToken = generateToken(otherClientUser);

    // 5. Administrator
    adminUser = await User.create({
      name: 'High Court Reader Admin',
      email: `admin_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: 'admin'
    });
    adminToken = generateToken(adminUser);

    // 6. Test Case File with Linked Client and Parties
    testCase = await Case.create({
      lawyerId: lawyerUser.id,
      clientId: clientUser.id,
      title: 'Ghulam Shabbir vs Municipal Corporation Multan',
      practiceArea: 'Civil',
      court: 'District Court, Multan',
      caseOrFirNumber: 'Suit No. 441/2026',
      status: 'Active',
      stage: 'Issues'
    });

    await CaseParty.create({
      caseId: testCase.id,
      name: 'Haji Ghulam Shabbir',
      roleLabel: 'Plaintiff'
    });

    await CaseParty.create({
      caseId: testCase.id,
      name: 'Municipal Corporation Multan',
      roleLabel: 'Defendant'
    });

    // Populate the 4 streams across different timestamps:
    // Event 1: Status Change (T - 4 days)
    await CaseStatusEvent.create({
      caseId: testCase.id,
      fromStatus: 'Prospect',
      toStatus: 'Active',
      fromStage: 'Pleadings',
      toStage: 'Issues',
      changedBy: lawyerUser.id,
      createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000)
    });

    // Event 2: Shared Entry (T - 3 days)
    await CaseEntry.create({
      caseId: testCase.id,
      entryDate: '2026-10-23',
      entryType: 'petition',
      title: 'Plaint & Injunctive Application Submitted',
      body: 'Formal plaint seeking permanent injunction registered in court.',
      visibility: 'shared',
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000)
    });

    // Event 3: Private Entry (T - 2.5 days)
    await CaseEntry.create({
      caseId: testCase.id,
      entryDate: '2026-10-24',
      entryType: 'note',
      title: 'Internal Chamber Strategy Memo',
      body: 'Focus on municipality jurisdiction deficit under Punjab Local Govt Act.',
      visibility: 'private',
      createdAt: new Date(Date.now() - 2.5 * 24 * 3600 * 1000)
    });

    // Event 4: Shared Hearing (T - 2 days)
    await Hearing.create({
      caseId: testCase.id,
      scheduledAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      court: 'District Court, Multan',
      bench: 'Court Room No. 2',
      stage: 'Pleadings',
      outcome: 'Notice issued to respondents',
      nextDate: '2026-11-05',
      clientExplanation: 'Court issued formal notice to municipal officers.',
      note: privateHearingNoteText,
      visibility: 'shared',
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000)
    });

    // Event 5: Private Hearing (T - 1.5 days)
    await Hearing.create({
      caseId: testCase.id,
      scheduledAt: new Date(Date.now() - 1.5 * 24 * 3600 * 1000),
      court: 'District Court, Multan',
      bench: 'In Chamber',
      stage: 'Evidence',
      outcome: 'Pre-trial conference',
      note: 'Witness coaching session',
      visibility: 'private',
      createdAt: new Date(Date.now() - 1.5 * 24 * 3600 * 1000)
    });

    // Event 6: Shared Document (T - 1 day)
    await Document.create({
      caseId: testCase.id,
      uploadedBy: lawyerUser.id,
      originalName: 'certified_stay_order.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 154000,
      docType: 'Court Order',
      tags: ['injunction', 'stay'],
      visibility: 'shared',
      publicId: 'test_doc_stay_order',
      resourceType: 'raw',
      createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000)
    });

    // Event 7: Private Document (T - 0.5 days)
    await Document.create({
      caseId: testCase.id,
      uploadedBy: lawyerUser.id,
      originalName: 'private_witness_deposition_draft.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 88000,
      docType: 'Evidence',
      tags: ['confidential'],
      visibility: 'private',
      publicId: 'test_doc_private_draft',
      resourceType: 'raw',
      createdAt: new Date(Date.now() - 0.5 * 24 * 3600 * 1000)
    });
  });

  describe('1. Unified Timeline Merging & Chronological Order (GET /cases/:id/timeline)', () => {
    it('allows advocate to view complete timeline including private chamber items', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}/timeline`)
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.items).toBeDefined();
      expect(res.body.total).toBe(7); // 1 status + 2 entries + 2 hearings + 2 documents

      // Check chronological descending order (newest first)
      const dates = res.body.items.map((item) => new Date(item.date).getTime());
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
      }

      // Check schema adherence on each item: { kind, date, title, summary, visibility, refId }
      for (const item of res.body.items) {
        expect(item).toHaveProperty('kind');
        expect(['entry', 'hearing', 'document', 'status_change']).toContain(item.kind);
        expect(item).toHaveProperty('date');
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('summary');
        expect(item).toHaveProperty('visibility');
        expect(item).toHaveProperty('refId');
      }

      // Advocate can see private items
      const visibilities = res.body.items.map((i) => i.visibility);
      expect(visibilities).toContain('private');
      expect(visibilities).toContain('shared');
    });

    it('filters timeline items by kind query parameter', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}/timeline?kind=document`)
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBe(2);
      expect(res.body.items.every((i) => i.kind === 'document')).toBe(true);
    });

    it('supports timeline pagination (page, limit)', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}/timeline?page=1&limit=3`)
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBe(3);
      expect(res.body.total).toBe(7);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(3);
      expect(res.body.totalPages).toBe(3);
    });
  });

  describe('2. Client View, Shared-Only Filtering & Strict Leak Test', () => {
    it('restricts linked client strictly to shared items (private items shielded)', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}/timeline`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      const items = res.body.items;

      // In test setup:
      // Status events (1) -> always shared
      // Shared entry (1)
      // Shared hearing (1)
      // Shared document (1)
      // Total shared items = 4 (Private entry, private hearing, private document omitted)
      expect(res.body.total).toBe(4);
      expect(items.length).toBe(4);

      // Verify that every single item returned to client is shared
      expect(items.every((i) => i.visibility === 'shared')).toBe(true);

      // Status change event is included
      expect(items.some((i) => i.kind === 'status_change')).toBe(true);
    });

    it('STRICT HEARING NOTE LEAK TEST: client receives structured hearing fields but NEVER the private note', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}/timeline?kind=hearing`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBe(1);

      const hearingItem = res.body.items[0];

      // 1. Client sees essential hearing properties
      expect(hearingItem).toHaveProperty('date');
      expect(hearingItem).toHaveProperty('court', 'District Court, Multan');
      expect(hearingItem).toHaveProperty('stage', 'Pleadings');
      expect(hearingItem).toHaveProperty('outcome', 'Notice issued to respondents');
      expect(hearingItem).toHaveProperty('clientExplanation', 'Court issued formal notice to municipal officers.');

      // 2. Client MUST NOT have 'note' property
      expect(hearingItem.note).toBeUndefined();

      // 3. String representation must not contain the private note text anywhere
      const stringified = JSON.stringify(res.body);
      expect(stringified).not.toContain(privateHearingNoteText);
    });
  });

  describe('3. Client View of Single Case (GET /cases/:id)', () => {
    it('returns whitelisted fields and accurate sharedDocumentsCount only', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;

      // Mandatory fields: title, court, status, stage, parties, nextHearing, sharedDocumentsCount
      expect(data).toHaveProperty('title', testCase.title);
      expect(data).toHaveProperty('court', testCase.court);
      expect(data).toHaveProperty('status', testCase.status);
      expect(data).toHaveProperty('stage', testCase.stage);
      expect(data).toHaveProperty('parties');
      expect(data.parties).toHaveLength(2);
      expect(data).toHaveProperty('nextHearing');
      expect(data).toHaveProperty('sharedDocumentsCount');

      // In our setup, exactly 1 shared document was uploaded (plus 1 private document)
      expect(data.sharedDocumentsCount).toBe(1);

      // Zero internal leakage
      expect(data.lawyerId).toBeUndefined();
      expect(data.clientId).toBeUndefined();
      expect(data.bookingId).toBeUndefined();
    });
  });

  describe('4. Strict 6-Role Permission Matrix & Admin Barrier', () => {
    it('forbids an advocate from another chamber from viewing timeline', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}/timeline`)
        .set('Authorization', `Bearer ${otherLawyerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/another chamber/i);
    });

    it('forbids an unlinked litigant client from viewing timeline', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}/timeline`)
        .set('Authorization', `Bearer ${otherClientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/not linked to your account/i);
    });

    it('forbids platform administrator from viewing timeline (Admin Privacy Barrier)', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}/timeline`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/administrators have no access to confidential/i);
    });

    it('returns 401 Unauthorized when no JWT token is supplied', async () => {
      const res = await request(app).get(`/api/v1/cases/${testCase.id}/timeline`);
      expect(res.status).toBe(401);
    });

    it('returns 404 Not Found for non-existent case UUID', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/v1/cases/${fakeUuid}/timeline`)
        .set('Authorization', `Bearer ${lawyerToken}`);
      expect(res.status).toBe(404);
    });
  });
});
