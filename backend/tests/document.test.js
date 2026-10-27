const request = require('supertest');
const app = require('../src/app');
const {
  User,
  LawyerApplication,
  Case,
  Document
} = require('../src/models');
const { generateToken } = require('../src/modules/auth/auth.service');
const { TEST_EMAIL_SUFFIX } = require('./setup');

describe('Phase 3 Part J: Case Documents & Private Asset Storage', () => {
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

  const uniqueSuffix = () => `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  // Helpers to generate valid file buffers
  const makePdfBuffer = (text = 'Valid PDF Content') =>
    Buffer.from(`%PDF-1.4\n1 0 obj\n<< /Title (${text}) >>\nendobj\ntrailer\n<<>>\n%%EOF`);

  const makeJpegBuffer = () =>
    Buffer.concat([
      Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]),
      Buffer.alloc(64, 0xAA)
    ]);

  const makePngBuffer = () =>
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
      Buffer.alloc(64, 0xBB)
    ]);

  const makeDocxBuffer = () =>
    Buffer.concat([
      Buffer.from([0x50, 0x4B, 0x03, 0x04]),
      Buffer.alloc(64, 0xCC)
    ]);

  beforeAll(async () => {
    const passwordHash = 'dummyhash';

    // 1. Owning Approved Advocate
    lawyerUser = await User.create({
      name: 'Adv. Ch. Aitzaz Ahsan Multani',
      email: `aitzaz_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: 'lawyer'
    });
    await LawyerApplication.create({
      userId: lawyerUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `PB-${uniqueSuffix()}`,
      courtLevel: 'High Court',
      city: 'Multan',
      practiceAreas: ['Civil', 'Property'],
      experienceYears: 18,
      chamberAddress: 'Chamber 22, High Court Multan',
      status: 'approved'
    });
    lawyerToken = generateToken(lawyerUser);

    // 2. Another Approved Advocate
    otherLawyerUser = await User.create({
      name: 'Adv. Mian Ali Raza',
      email: `aliraza_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
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
      experienceYears: 7,
      chamberAddress: 'Chamber 5, District Courts Multan',
      status: 'approved'
    });
    otherLawyerToken = generateToken(otherLawyerUser);

    // 3. Linked Litigant Client
    clientUser = await User.create({
      name: 'Malik Jahangir Khan',
      email: `jahangir_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: 'client'
    });
    clientToken = generateToken(clientUser);

    // 4. Unlinked Client
    otherClientUser = await User.create({
      name: 'Sheikh Noman Bashir',
      email: `noman_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: 'client'
    });
    otherClientToken = generateToken(otherClientUser);

    // 5. Administrator
    adminUser = await User.create({
      name: 'LegalHub Multan Super Admin',
      email: `admin_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: 'admin'
    });
    adminToken = generateToken(adminUser);

    // 6. Test Case File
    testCase = await Case.create({
      lawyerId: lawyerUser.id,
      clientId: clientUser.id,
      title: 'Mian Bashir vs Province of Punjab',
      practiceArea: 'Civil',
      court: 'Lahore High Court',
      caseOrFirNumber: 'W.P. No. 1104/2026',
      status: 'Active',
      stage: 'Pleadings'
    });
  });

  describe('1. File Upload & Magic Bytes Verification', () => {
    it('allows assigned advocate to upload a valid PDF document with metadata', async () => {
      const pdfBuffer = makePdfBuffer('Writ Petition Draft');

      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/documents`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .attach('file', pdfBuffer, 'writ_petition.pdf')
        .field('docType', 'Petition')
        .field('visibility', 'private')
        .field('tags', JSON.stringify(['writ', 'urgent']));

      expect(res.status).toBe(201);
      expect(res.body.message).toMatch(/Document uploaded successfully/i);
      expect(res.body.document).toBeDefined();
      expect(res.body.document.originalName).toBe('writ_petition.pdf');
      expect(res.body.document.mimeType).toBe('application/pdf');
      expect(res.body.document.docType).toBe('Petition');
      expect(res.body.document.visibility).toBe('private');
      expect(res.body.document.tags).toEqual(['writ', 'urgent']);
      expect(res.body.document.sizeBytes).toBe(pdfBuffer.length);

      // Strict projection test: Ensure storage internals are NEVER leaked
      expect(res.body.document.publicId).toBeUndefined();
      expect(res.body.document.resourceType).toBeUndefined();
    });

    it('rejects upload when magic bytes do not match declared PDF extension (fake PDF)', async () => {
      const fakePdfBuffer = Buffer.from('This is fake text pretending to be a PDF document.');

      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/documents`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .attach('file', fakePdfBuffer, 'malicious.pdf')
        .field('docType', 'Petition');

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/unsupported file format or invalid file signature/i);
    });

    it('rejects upload when file extension does not match magic byte content (JPEG named as .pdf)', async () => {
      const jpegBuffer = makeJpegBuffer();

      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/documents`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .attach('file', jpegBuffer, 'deceptive_name.pdf')
        .field('docType', 'Evidence');

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/does not match the actual file signature content/i);
    });

    it('rejects upload exceeding the 10 MB size limit', async () => {
      // 10 MB + 1024 bytes buffer
      const hugeBuffer = Buffer.alloc(10 * 1024 * 1024 + 1024);

      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/documents`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .attach('file', hugeBuffer, 'huge_file.pdf')
        .field('docType', 'Evidence');

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/limit|exceed/i);
    });

    it('successfully uploads other supported formats (JPEG, PNG, DOCX)', async () => {
      // JPEG
      const jpegRes = await request(app)
        .post(`/api/v1/cases/${testCase.id}/documents`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .attach('file', makeJpegBuffer(), 'site_photo.jpeg')
        .field('docType', 'Evidence')
        .field('visibility', 'shared');
      expect(jpegRes.status).toBe(201);
      expect(jpegRes.body.document.mimeType).toBe('image/jpeg');

      // PNG
      const pngRes = await request(app)
        .post(`/api/v1/cases/${testCase.id}/documents`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .attach('file', makePngBuffer(), 'fard_malkiat.png')
        .field('docType', 'Evidence')
        .field('visibility', 'shared');
      expect(pngRes.status).toBe(201);
      expect(pngRes.body.document.mimeType).toBe('image/png');

      // DOCX
      const docxRes = await request(app)
        .post(`/api/v1/cases/${testCase.id}/documents`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .attach('file', makeDocxBuffer(), 'affidavit_draft.docx')
        .field('docType', 'Affidavit')
        .field('visibility', 'private');
      expect(docxRes.status).toBe(201);
      expect(docxRes.body.document.mimeType).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
    });

    it('rejects uploads with invalid docType', async () => {
      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/documents`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .attach('file', makePdfBuffer(), 'doc.pdf')
        .field('docType', 'InvalidType');

      expect(res.status).toBe(400);
      expect(res.body.details.some((d) => /docType must be one of/i.test(d.message))).toBe(true);
    });

    it('rejects uploads exceeding the 5 tags limit', async () => {
      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/documents`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .attach('file', makePdfBuffer(), 'doc.pdf')
        .field('docType', 'Evidence')
        .field('tags', JSON.stringify(['one', 'two', 'three', 'four', 'five', 'six']));

      expect(res.status).toBe(400);
      expect(res.body.details.some((d) => /Cannot attach more than 5 tags/i.test(d.message))).toBe(true);
    });
  });

  describe('2. Document Listing & Role-Aware Visibility', () => {
    let privateDoc;
    let sharedDoc;

    beforeAll(async () => {
      // Create explicit private document
      const privRes = await request(app)
        .post(`/api/v1/cases/${testCase.id}/documents`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .attach('file', makePdfBuffer('Confidential Advocate Notes'), 'advocate_strategy.pdf')
        .field('docType', 'Other')
        .field('visibility', 'private')
        .field('tags', JSON.stringify(['strategy', 'confidential']));
      privateDoc = privRes.body.document;

      // Create explicit shared document
      const sharedRes = await request(app)
        .post(`/api/v1/cases/${testCase.id}/documents`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .attach('file', makePdfBuffer('Certified Court Order'), 'interim_injunction.pdf')
        .field('docType', 'Court Order')
        .field('visibility', 'shared')
        .field('tags', JSON.stringify(['stay_order', 'injunction']));
      sharedDoc = sharedRes.body.document;
    });

    it('allows assigned advocate to view all documents (private and shared)', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}/documents`)
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.items).toBeDefined();
      const ids = res.body.items.map((d) => d.id);
      expect(ids).toContain(privateDoc.id);
      expect(ids).toContain(sharedDoc.id);
    });

    it('restricts linked client strictly to shared documents (private documents hidden)', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}/documents`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      const items = res.body.items;
      const ids = items.map((d) => d.id);

      // Client sees shared document
      expect(ids).toContain(sharedDoc.id);
      // Client DOES NOT see private document
      expect(ids).not.toContain(privateDoc.id);

      // Verify all items visible to client are shared
      expect(items.every((d) => d.visibility === 'shared')).toBe(true);

      // Verify no internal storage keys leaked to client
      expect(items.every((d) => d.publicId === undefined && d.resourceType === undefined)).toBe(true);
    });

    it('filters documents by docType and tag query parameters', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}/documents?docType=Court Order&tag=stay_order`)
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.items.every((d) => d.docType === 'Court Order')).toBe(true);
    });
  });

  describe('3. Metadata Update (PATCH /documents/:id)', () => {
    let docToUpdate;

    beforeAll(async () => {
      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/documents`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .attach('file', makePdfBuffer('Initial Draft Document'), 'draft_v1.pdf')
        .field('docType', 'Other')
        .field('visibility', 'private');
      docToUpdate = res.body.document;
    });

    it('allows assigned advocate to update document visibility from private to shared', async () => {
      const res = await request(app)
        .patch(`/api/v1/documents/${docToUpdate.id}`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          visibility: 'shared',
          docType: 'Evidence',
          tags: ['shared_evidence', 'verified']
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/Document updated successfully/i);
      expect(res.body.document.visibility).toBe('shared');
      expect(res.body.document.docType).toBe('Evidence');
      expect(res.body.document.tags).toEqual(['shared_evidence', 'verified']);

      // Now client can also see this updated document
      const clientListRes = await request(app)
        .get(`/api/v1/cases/${testCase.id}/documents`)
        .set('Authorization', `Bearer ${clientToken}`);

      const ids = clientListRes.body.items.map((d) => d.id);
      expect(ids).toContain(docToUpdate.id);
    });

    it('forbids client from modifying document metadata', async () => {
      const res = await request(app)
        .patch(`/api/v1/documents/${docToUpdate.id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ visibility: 'private' });

      expect(res.status).toBe(403);
    });

    it('forbids another lawyer from modifying document metadata', async () => {
      const res = await request(app)
        .patch(`/api/v1/documents/${docToUpdate.id}`)
        .set('Authorization', `Bearer ${otherLawyerToken}`)
        .send({ visibility: 'private' });

      expect(res.status).toBe(403);
    });
  });

  describe('4. File Streaming (GET /documents/:id/file)', () => {
    let sharedPdfDoc;
    let privatePdfDoc;
    const testContent = 'Authentic Certified Court Judgment Stream Test';

    beforeAll(async () => {
      const sharedRes = await request(app)
        .post(`/api/v1/cases/${testCase.id}/documents`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .attach('file', makePdfBuffer(testContent), 'certified_copy.pdf')
        .field('docType', 'Court Order')
        .field('visibility', 'shared');
      sharedPdfDoc = sharedRes.body.document;

      const privRes = await request(app)
        .post(`/api/v1/cases/${testCase.id}/documents`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .attach('file', makePdfBuffer('Private Chamber Diary File'), 'internal_notes.pdf')
        .field('docType', 'Other')
        .field('visibility', 'private');
      privatePdfDoc = privRes.body.document;
    });

    it('allows assigned advocate to stream any document file', async () => {
      const res = await request(app)
        .get(`/api/v1/documents/${privatePdfDoc.id}/file`)
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toMatch(/inline; filename="internal_notes.pdf"/);
      expect(res.body).toBeDefined();
    });

    it('allows linked client to stream a shared document file', async () => {
      const res = await request(app)
        .get(`/api/v1/documents/${sharedPdfDoc.id}/file`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toMatch(/inline; filename="certified_copy.pdf"/);
    });

    it('forbids linked client from streaming a private document file', async () => {
      const res = await request(app)
        .get(`/api/v1/documents/${privatePdfDoc.id}/file`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/access denied to private case document/i);
    });
  });

  describe('5. Strict 6-Role Permission Matrix & Admin Privacy Barrier', () => {
    let sampleDoc;

    beforeAll(async () => {
      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/documents`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .attach('file', makePdfBuffer('Permission Matrix Sample'), 'sample.pdf')
        .field('docType', 'Petition')
        .field('visibility', 'shared');
      sampleDoc = res.body.document;
    });

    it('forbids administrator from uploading documents (Admin Barrier)', async () => {
      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/documents`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', makePdfBuffer(), 'admin_doc.pdf')
        .field('docType', 'Petition');

      expect(res.status).toBe(403);
    });

    it('forbids administrator from listing case documents (Admin Barrier)', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}/documents`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/administrators have no access to confidential/i);
    });

    it('forbids administrator from streaming case document files (Admin Barrier)', async () => {
      const res = await request(app)
        .get(`/api/v1/documents/${sampleDoc.id}/file`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/administrators have no access to confidential/i);
    });

    it('forbids an advocate from another chamber from listing or downloading documents', async () => {
      const listRes = await request(app)
        .get(`/api/v1/cases/${testCase.id}/documents`)
        .set('Authorization', `Bearer ${otherLawyerToken}`);
      expect(listRes.status).toBe(403);

      const streamRes = await request(app)
        .get(`/api/v1/documents/${sampleDoc.id}/file`)
        .set('Authorization', `Bearer ${otherLawyerToken}`);
      expect(streamRes.status).toBe(403);
    });

    it('forbids an unlinked litigant client from listing or downloading documents', async () => {
      const listRes = await request(app)
        .get(`/api/v1/cases/${testCase.id}/documents`)
        .set('Authorization', `Bearer ${otherClientToken}`);
      expect(listRes.status).toBe(403);

      const streamRes = await request(app)
        .get(`/api/v1/documents/${sampleDoc.id}/file`)
        .set('Authorization', `Bearer ${otherClientToken}`);
      expect(streamRes.status).toBe(403);
    });

    it('returns 401 Unauthorized when no JWT token is supplied', async () => {
      const listRes = await request(app)
        .get(`/api/v1/cases/${testCase.id}/documents`);
      expect(listRes.status).toBe(401);

      const streamRes = await request(app)
        .get(`/api/v1/documents/${sampleDoc.id}/file`);
      expect(streamRes.status).toBe(401);
    });

    it('returns 404 Not Found for non-existent case or document', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const listRes = await request(app)
        .get(`/api/v1/cases/${fakeUuid}/documents`)
        .set('Authorization', `Bearer ${lawyerToken}`);
      expect(listRes.status).toBe(404);

      const streamRes = await request(app)
        .get(`/api/v1/documents/${fakeUuid}/file`)
        .set('Authorization', `Bearer ${lawyerToken}`);
      expect(streamRes.status).toBe(404);
    });
  });
});
