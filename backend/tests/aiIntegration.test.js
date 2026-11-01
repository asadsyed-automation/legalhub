const request = require('supertest');
const app = require('../src/app');
const {
  User,
  Case,
  Document,
  CaseEntry,
  LawyerApplication
} = require('../src/models');
const { generateToken } = require('../src/modules/auth/auth.service');
const { ROLES, APPLICATION_STATUS } = require('../src/constants');
const aiService = require('../src/services/ai.service');

const TEST_EMAIL_SUFFIX = '@test.legalhub.local';

describe('Part R: AI Document Summarization & Bilingual Search Integration Tests', () => {
  let lawyerUser, otherLawyerUser;
  let clientUser, otherClientUser, adminUser;
  let lawyerToken, otherLawyerToken;
  let clientToken, otherClientToken, adminToken;
  let testCase;
  let sharedDoc, privateDoc;
  let diaryEntry;

  beforeAll(async () => {
    const ts = Date.now();

    // 1. Assigned Lawyer
    lawyerUser = await User.create({
      name: 'Advocate Hamza Ali',
      email: `hamza_ai_${ts}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER,
      isActive: true,
      emailVerifiedAt: new Date()
    });
    lawyerToken = generateToken(lawyerUser);

    await LawyerApplication.create({
      userId: lawyerUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `BC-AI-1-${ts}`,
      courtLevel: 'Advocate High Court',
      city: 'Multan',
      practiceAreas: ['Criminal', 'Civil'],
      experienceYears: 8,
      chamberAddress: 'Chamber 14, High Court Multan',
      status: APPLICATION_STATUS.APPROVED
    });

    // 2. Other Lawyer
    otherLawyerUser = await User.create({
      name: 'Advocate Kamran Shah',
      email: `kamran_ai_${ts}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER,
      isActive: true,
      emailVerifiedAt: new Date()
    });
    otherLawyerToken = generateToken(otherLawyerUser);

    // 3. Linked Client
    clientUser = await User.create({
      name: 'Chaudhry Riaz Client',
      email: `riaz_ai_${ts}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.CLIENT,
      isActive: true,
      emailVerifiedAt: new Date()
    });
    clientToken = generateToken(clientUser);

    // 4. Other Client
    otherClientUser = await User.create({
      name: 'Unrelated Client',
      email: `unrelated_ai_${ts}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.CLIENT,
      isActive: true,
      emailVerifiedAt: new Date()
    });
    otherClientToken = generateToken(otherClientUser);

    // 5. Administrator
    adminUser = await User.create({
      name: 'System Admin',
      email: `admin_ai_${ts}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.ADMIN,
      isActive: true,
      emailVerifiedAt: new Date()
    });
    adminToken = generateToken(adminUser);

    // 6. Test Case File
    testCase = await Case.create({
      lawyerId: lawyerUser.id,
      clientId: clientUser.id,
      title: 'State vs Tariq Mehmood Murder Trial',
      practiceArea: 'Criminal',
      court: 'Sessions Court Multan',
      caseOrFirNumber: 'SC-104/2026',
      status: 'active',
      stage: 'evidence'
    });

    // 7. Shared Document (FIR Copy)
    sharedDoc = await Document.create({
      caseId: testCase.id,
      uploadedBy: lawyerUser.id,
      originalName: 'certified_fir_copy_402.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 124000,
      docType: 'FIR Copy',
      tags: ['FIR', 'Bail', 'Section 302 PPC'],
      visibility: 'shared',
      publicId: `test_doc_fir_${ts}`,
      resourceType: 'raw'
    });

    // 8. Private Advocate Work Product Document
    privateDoc = await Document.create({
      caseId: testCase.id,
      uploadedBy: lawyerUser.id,
      originalName: 'internal_cross_examination_strategy.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 65000,
      docType: 'Evidence',
      tags: ['confidential', 'cross-examination'],
      visibility: 'private',
      publicId: `test_doc_strategy_${ts}`,
      resourceType: 'raw'
    });

    // 9. Case Diary Entry
    diaryEntry = await CaseEntry.create({
      caseId: testCase.id,
      entryDate: '2026-10-25',
      entryType: 'order',
      title: 'Post-Arrest Bail Hearing Arguments',
      body: 'Learned counsel argued application under Section 497 CrPC for grant of bail. Court issued notice to complainant.',
      visibility: 'shared'
    });
  });

  describe('1. POST /api/v1/cases/:id/documents/:documentId/summarize', () => {
    it('should allow assigned advocate to summarize a document with AI entity extraction', async () => {
      const legalText =
        'In the Lahore High Court, Multan Bench. ' +
        'Criminal Miscellaneous Petition under Section 497 CrPC for post-arrest bail. ' +
        'FIR No. 402/24 was registered under Section 302/34 PPC at PS Cantt Multan. ' +
        'Petitioner Tariq Mehmood asserts complete innocence and unexplained delay in registration. ' +
        'The Sessions Court dismissed the bail petition earlier. ' +
        'High Court directs release on bail subject to furnishing surety bonds.';

      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/documents/${sharedDoc.id}/summarize`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          text: legalText,
          language: 'auto',
          maxLength: 200
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('summary');
      expect(res.body).toHaveProperty('entities');
      expect(res.body).toHaveProperty('word_count');
      expect(res.body.documentId).toBe(sharedDoc.id);
      expect(res.body.originalName).toBe(sharedDoc.originalName);
      expect(res.body.word_count).toBeGreaterThan(20);
    });

    it('should allow linked client to summarize a shared document', async () => {
      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/documents/${sharedDoc.id}/summarize`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ maxLength: 150 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('summary');
      expect(res.body.documentId).toBe(sharedDoc.id);
    });

    it('should reject client attempting to summarize private advocate work product with 403', async () => {
      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/documents/${privateDoc.id}/summarize`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Clients cannot summarize private advocate work product');
    });

    it('should reject unrelated lawyer attempting to summarize with 403', async () => {
      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/documents/${sharedDoc.id}/summarize`)
        .set('Authorization', `Bearer ${otherLawyerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('own case files');
    });

    it('should reject administrator with 403 to protect case confidentiality', async () => {
      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/documents/${sharedDoc.id}/summarize`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('2. GET /api/v1/cases/:id/search-documents (Bilingual Search)', () => {
    it('should perform bilingual search and return ranked results with snippets', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}/search-documents?q=bail Section 497`)
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('results');
      expect(res.body).toHaveProperty('total_matches');
      expect(res.body.total_matches).toBeGreaterThanOrEqual(1);

      // Verify snippet exists
      const firstResult = res.body.results[0];
      expect(firstResult).toHaveProperty('snippet');
      expect(firstResult).toHaveProperty('score');
      expect(firstResult.score).toBeGreaterThan(0);
    });

    it('should reject search when query parameter "q" is missing with 400', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}/search-documents`)
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    it('should reject unrelated client accessing case search with 403', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}/search-documents?q=bail`)
        .set('Authorization', `Bearer ${otherClientToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('3. Graceful Heuristic Fallback Resilience', () => {
    it('should return deterministic heuristic summary when AI service is unavailable', () => {
      const sampleText =
        'The complainant filed suit for specific performance in Civil Court Lahore. ' +
        'The defendant failed to execute the registered sale deed despite receiving partial consideration. ' +
        'The court ordered notice to be issued.';

      const fallback = aiService.heuristicSummarize(sampleText, 100);
      expect(fallback.source).toBe('heuristic_fallback');
      expect(fallback.language).toBe('en');
      expect(fallback.summary.length).toBeGreaterThan(15);
      expect(fallback.word_count).toBeGreaterThan(10);
    });

    it('should return heuristic search matches when AI service is unavailable', () => {
      const docs = [
        { id: '1', title: 'Court Order', text: 'Injunction granted under Order 39 CPC.' },
        { id: '2', title: 'Police Report', text: 'Investigation completed under Section 173 CrPC.' }
      ];

      const searchResult = aiService.heuristicSearch('Injunction', docs);
      expect(searchResult.source).toBe('heuristic_fallback');
      expect(searchResult.total_matches).toBe(1);
      expect(searchResult.results[0].id).toBe('1');
    });
  });
});
