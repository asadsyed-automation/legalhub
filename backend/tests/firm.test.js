const request = require('supertest');
const app = require('../src/app');
const {
  User,
  LawyerApplication,
  FirmMember,
  Case
} = require('../src/models');
const { generateToken } = require('../src/modules/auth/auth.service');
const { ROLES, APPLICATION_STATUS } = require('../src/constants');

const TEST_EMAIL_SUFFIX = '@test.legalhub.local';

describe('Law Firm Chamber & Team Assignment Integration Tests', () => {
  let firmUser, firmToken;
  let otherFirmUser, otherFirmToken;
  let lawyerUser, lawyerToken;
  let otherLawyerUser;
  let clientUser;
  let testCase;
  let createdMemberId;

  beforeAll(async () => {
    const ts = Date.now();

    // 1. Primary Law Firm User
    firmUser = await User.create({
      name: 'Asad & Associates Legal Chambers',
      email: `firm_test_${ts}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAW_FIRM,
      isActive: true,
      emailVerifiedAt: new Date()
    });
    firmToken = generateToken(firmUser);

    await LawyerApplication.create({
      userId: firmUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `FIRM-${ts}`,
      courtLevel: 'High Court',
      experienceYears: 15,
      city: 'Multan',
      practiceAreas: ['Civil', 'Corporate'],
      status: APPLICATION_STATUS.APPROVED
    });

    // 2. Second Law Firm User (for boundary tests)
    otherFirmUser = await User.create({
      name: 'Babar & Co Legal Firm',
      email: `firm2_test_${ts}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAW_FIRM,
      isActive: true,
      emailVerifiedAt: new Date()
    });
    otherFirmToken = generateToken(otherFirmUser);

    // 3. Practicing Associate Lawyer User
    lawyerUser = await User.create({
      name: 'Advocate Tariq Hassan',
      email: `assoc_lawyer_${ts}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER,
      isActive: true,
      emailVerifiedAt: new Date()
    });
    lawyerToken = generateToken(lawyerUser);

    await LawyerApplication.create({
      userId: lawyerUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `LWYR-${ts}`,
      courtLevel: 'High Court',
      experienceYears: 6,
      city: 'Multan',
      practiceAreas: ['Civil'],
      status: APPLICATION_STATUS.APPROVED
    });

    // 4. Other Lawyer User
    otherLawyerUser = await User.create({
      name: 'Advocate Shaheen Shah',
      email: `other_lawyer_${ts}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER,
      isActive: true,
      emailVerifiedAt: new Date()
    });

    // 5. Client User
    clientUser = await User.create({
      name: 'Litigant Citizen Riaz',
      email: `client_firm_${ts}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.CLIENT,
      isActive: true,
      emailVerifiedAt: new Date()
    });

    // 6. Test Case created by firmUser
    testCase = await Case.create({
      lawyerId: firmUser.id,
      clientId: clientUser.id,
      title: 'Commercial Chamber Dispute Suit',
      practiceArea: 'Corporate',
      court: 'High Court',
      status: 'In Progress'
    });
  });

  afterAll(async () => {
    // Cleanup
    if (testCase?.id) await Case.destroy({ where: { id: testCase.id } }).catch(() => { });
    if (firmUser?.id) await FirmMember.destroy({ where: { firmId: firmUser.id } }).catch(() => { });
    const appUserIds = [firmUser?.id, lawyerUser?.id].filter(Boolean);
    if (appUserIds.length > 0) {
      await LawyerApplication.destroy({ where: { userId: appUserIds } }).catch(() => { });
    }
    const userIds = [firmUser?.id, otherFirmUser?.id, lawyerUser?.id, otherLawyerUser?.id, clientUser?.id].filter(Boolean);
    if (userIds.length > 0) {
      await User.destroy({ where: { id: userIds } }).catch(() => { });
    }
  });

  describe('1. Access Control on /api/v1/firm', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/firm/members');
      expect(res.status).toBe(401);
    });

    it('should reject non-firm users (e.g. individual lawyer) with 403', async () => {
      const res = await request(app)
        .get('/api/v1/firm/members')
        .set('Authorization', `Bearer ${lawyerToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('2. Add Chamber Member (POST /api/v1/firm/members)', () => {
    it('should fail with 400 when neither email nor enrolmentNo is provided', async () => {
      const res = await request(app)
        .post('/api/v1/firm/members')
        .set('Authorization', `Bearer ${firmToken}`)
        .send({ designation: 'Associate' });
      expect(res.status).toBe(400);
    });

    it('should fail with 404 when lawyer email does not exist', async () => {
      const res = await request(app)
        .post('/api/v1/firm/members')
        .set('Authorization', `Bearer ${firmToken}`)
        .send({ lawyerEmail: 'nonexistent@nowhere.pk' });
      expect(res.status).toBe(404);
    });

    it('should successfully add an associate lawyer by email', async () => {
      const res = await request(app)
        .post('/api/v1/firm/members')
        .set('Authorization', `Bearer ${firmToken}`)
        .send({
          lawyerEmail: lawyerUser.email,
          designation: 'Senior Associate Counsel'
        });

      expect(res.status).toBe(201);
      expect(res.body.member).toBeDefined();
      expect(res.body.member.lawyerId).toBe(lawyerUser.id);
      expect(res.body.member.designation).toBe('Senior Associate Counsel');
      createdMemberId = res.body.member.id;
    });

    it('should return 409 Conflict when attempting to add the same associate again', async () => {
      const res = await request(app)
        .post('/api/v1/firm/members')
        .set('Authorization', `Bearer ${firmToken}`)
        .send({
          lawyerEmail: lawyerUser.email,
          designation: 'Partner'
        });

      expect(res.status).toBe(409);
    });
  });

  describe('3. List & Update Chamber Members', () => {
    it('should list firm members with bar council metadata and case count', async () => {
      const res = await request(app)
        .get('/api/v1/firm/members')
        .set('Authorization', `Bearer ${firmToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.members)).toBe(true);
      expect(res.body.members.length).toBe(1);
      expect(res.body.members[0].name).toBe(lawyerUser.name);
      expect(res.body.members[0].barCouncil).toBe('Punjab Bar Council');
    });

    it('should update member designation via PATCH /api/v1/firm/members/:id', async () => {
      const res = await request(app)
        .patch(`/api/v1/firm/members/${createdMemberId}`)
        .set('Authorization', `Bearer ${firmToken}`)
        .send({ designation: 'Partner & Senior Counsel' });

      expect(res.status).toBe(200);
      expect(res.body.member.designation).toBe('Partner & Senior Counsel');
    });
  });

  describe('4. Case Delegation / Assignment (PATCH /api/v1/firm/cases/:caseId/assign)', () => {
    it('should fail with 400 when assigning to an advocate not in the firm', async () => {
      const res = await request(app)
        .patch(`/api/v1/firm/cases/${testCase.id}/assign`)
        .set('Authorization', `Bearer ${firmToken}`)
        .send({ assignedLawyerId: otherLawyerUser.id });

      expect(res.status).toBe(400);
    });

    it('should fail with 404 when trying to assign a case owned by another firm', async () => {
      const res = await request(app)
        .patch(`/api/v1/firm/cases/${testCase.id}/assign`)
        .set('Authorization', `Bearer ${otherFirmToken}`)
        .send({ assignedLawyerId: lawyerUser.id });

      expect(res.status).toBe(404);
    });

    it('should successfully assign case to the associate lawyer', async () => {
      const res = await request(app)
        .patch(`/api/v1/firm/cases/${testCase.id}/assign`)
        .set('Authorization', `Bearer ${firmToken}`)
        .send({ assignedLawyerId: lawyerUser.id });

      expect(res.status).toBe(200);
      expect(res.body.case.assignedLawyerId).toBe(lawyerUser.id);
    });

    it('should allow the assigned associate lawyer to view the delegated case file', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}`)
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.case.id).toBe(testCase.id);
      expect(res.body.case.assignedLawyerId).toBe(lawyerUser.id);
    });

    it('should allow unassigning a case by sending null', async () => {
      const res = await request(app)
        .patch(`/api/v1/firm/cases/${testCase.id}/assign`)
        .set('Authorization', `Bearer ${firmToken}`)
        .send({ assignedLawyerId: null });

      expect(res.status).toBe(200);
      expect(res.body.case.assignedLawyerId).toBeNull();
    });
  });

  describe('5. Chamber Dashboard Metrics (GET /api/v1/firm/stats)', () => {
    it('should return aggregated chamber statistics', async () => {
      const res = await request(app)
        .get('/api/v1/firm/stats')
        .set('Authorization', `Bearer ${firmToken}`);

      expect(res.status).toBe(200);
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.totalAssociates).toBe(1);
      expect(res.body.stats.totalCases).toBeGreaterThanOrEqual(1);
    });
  });

  describe('6. Search Practicing Advocates (GET /api/v1/firm/lawyers/search)', () => {
    it('should find advocates matching keyword', async () => {
      const res = await request(app)
        .get('/api/v1/firm/lawyers/search?q=Tariq')
        .set('Authorization', `Bearer ${firmToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.lawyers)).toBe(true);
      expect(res.body.lawyers.some((l) => l.id === lawyerUser.id)).toBe(true);
    });
  });

  describe('7. Remove Member (DELETE /api/v1/firm/members/:id)', () => {
    it('should remove associate advocate and clear case assignments', async () => {
      // Re-assign case first
      await testCase.update({ assignedLawyerId: lawyerUser.id });

      const res = await request(app)
        .delete(`/api/v1/firm/members/${createdMemberId}`)
        .set('Authorization', `Bearer ${firmToken}`);

      expect(res.status).toBe(200);

      // Verify case assignment was cleared
      const refreshedCase = await Case.findByPk(testCase.id);
      expect(refreshedCase.assignedLawyerId).toBeNull();
    });
  });

  describe('8. Public Directory Filter by Practitioner Type', () => {
    it('should accept practitionerType=law_firm and return only firms', async () => {
      const res = await request(app).get('/api/v1/lawyers?practitionerType=law_firm');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.items)).toBe(true);
      res.body.items.forEach((item) => {
        expect(item.role).toBe(ROLES.LAW_FIRM);
      });
    });
  });
});
