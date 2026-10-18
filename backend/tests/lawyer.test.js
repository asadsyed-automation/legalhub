const request = require('supertest');
const app = require('../src/app');
const { User, LawyerApplication } = require('../src/models');
const { generateToken } = require('../src/modules/auth/auth.service');
const { ROLES, APPLICATION_STATUS } = require('../src/constants');

const TEST_EMAIL_SUFFIX = '@test.legalhub.local';

describe('Part B: Lawyer Onboarding, Admin Review, and Public Directory Tests', () => {
  let clientUser, lawyer1User, lawyer2User, adminUser;
  let clientToken, lawyer1Token, lawyer2Token, adminToken;
  let lawyer1AppId, lawyer2AppId;

  const validAppPayload1 = {
    barCouncil: 'Punjab Bar Council',
    enrolmentNo: `PBC-${Date.now()}-1`,
    courtLevel: 'Advocate High Court',
    city: 'Lahore',
    practiceAreas: ['Corporate', 'Civil'],
    experienceYears: 8,
    chamberAddress: 'Chamber 42, High Court Bar Association, Lahore',
    bio: 'Experienced High Court advocate specializing in corporate contracts and civil litigation.'
  };

  const validAppPayload2 = {
    barCouncil: 'Sindh Bar Council',
    enrolmentNo: `SBC-${Date.now()}-2`,
    courtLevel: 'Advocate Lower Courts',
    city: 'Karachi',
    practiceAreas: ['Criminal', 'Family'],
    experienceYears: 4,
    chamberAddress: 'Suite 105, City Courts Chambers, Karachi',
    bio: 'Dedicated advocate handling bail petitions, trial advocacy, and family law disputes.'
  };

  beforeAll(async () => {
    // Create isolated test users
    clientUser = await User.create({
      name: 'Test Client',
      email: `client_${Date.now()}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.CLIENT
    });

    lawyer1User = await User.create({
      name: 'Advocate Tariq Hassan',
      email: `lawyer1_${Date.now()}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER
    });

    lawyer2User = await User.create({
      name: 'Advocate Ayesha Malik',
      email: `lawyer2_${Date.now()}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER
    });

    adminUser = await User.create({
      name: 'Registrar Admin',
      email: `admin_${Date.now()}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.ADMIN
    });

    clientToken = generateToken(clientUser);
    lawyer1Token = generateToken(lawyer1User);
    lawyer2Token = generateToken(lawyer2User);
    adminToken = generateToken(adminUser);
  }, 30000);

  describe('1. Role-Based Access Control (RBAC) & Authentication Guards', () => {
    it('should return 401 Unauthorized when accessing lawyer routes without a token', async () => {
      const res = await request(app).get('/api/v1/lawyer/application');
      expect(res.status).toBe(401);
    });

    it('should return 403 Forbidden when a client attempts to submit a lawyer application', async () => {
      const res = await request(app)
        .post('/api/v1/lawyer/application')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(validAppPayload1);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('You do not have permission to perform this action');
    });

    it('should return 403 Forbidden when a lawyer attempts to access admin application review', async () => {
      const res = await request(app)
        .get('/api/v1/admin/applications')
        .set('Authorization', `Bearer ${lawyer1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('You do not have permission to perform this action');
    });
  });

  describe('2. Lawyer Application Submission & Validation (POST /api/v1/lawyer/application)', () => {
    it('should successfully submit an application with status pending', async () => {
      const res = await request(app)
        .post('/api/v1/lawyer/application')
        .set('Authorization', `Bearer ${lawyer1Token}`)
        .send(validAppPayload1);

      expect(res.status).toBe(201);
      expect(res.body.application).toHaveProperty('id');
      expect(res.body.application.userId).toBe(lawyer1User.id);
      expect(res.body.application.status).toBe(APPLICATION_STATUS.PENDING);
      expect(res.body.application.barCouncil).toBe(validAppPayload1.barCouncil);
      expect(res.body.application.enrolmentNo).toBe(validAppPayload1.enrolmentNo);

      lawyer1AppId = res.body.application.id;
    });

    it('should return 409 Conflict if lawyer attempts to submit a second application', async () => {
      const res = await request(app)
        .post('/api/v1/lawyer/application')
        .set('Authorization', `Bearer ${lawyer1Token}`)
        .send(validAppPayload1);

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already submitted/i);
    });

    it('should return 409 Conflict if another lawyer attempts to use the same (barCouncil, enrolmentNo)', async () => {
      const res = await request(app)
        .post('/api/v1/lawyer/application')
        .set('Authorization', `Bearer ${lawyer2Token}`)
        .send({
          ...validAppPayload2,
          barCouncil: validAppPayload1.barCouncil,
          enrolmentNo: validAppPayload1.enrolmentNo // duplicate
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already exists/i);
    });

    it('should reject application with invalid city (400)', async () => {
      const res = await request(app)
        .post('/api/v1/lawyer/application')
        .set('Authorization', `Bearer ${lawyer2Token}`)
        .send({
          ...validAppPayload2,
          city: 'London' // Not a Pakistani city in starter list
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details.some((d) => d.field === 'city')).toBe(true);
    });

    it('should reject application with more than 5 practice areas (400)', async () => {
      const res = await request(app)
        .post('/api/v1/lawyer/application')
        .set('Authorization', `Bearer ${lawyer2Token}`)
        .send({
          ...validAppPayload2,
          practiceAreas: ['Criminal', 'Civil', 'Family', 'Property', 'Corporate', 'Tax'] // 6 areas
        });

      expect(res.status).toBe(400);
      expect(res.body.details.some((d) => d.field === 'practiceAreas')).toBe(true);
    });

    it('should reject application with negative experience years or > 60 years (400)', async () => {
      const res = await request(app)
        .post('/api/v1/lawyer/application')
        .set('Authorization', `Bearer ${lawyer2Token}`)
        .send({
          ...validAppPayload2,
          experienceYears: 75
        });

      expect(res.status).toBe(400);
      expect(res.body.details.some((d) => d.field === 'experienceYears')).toBe(true);
    });

    it('should allow lawyer 2 to submit a valid application', async () => {
      const res = await request(app)
        .post('/api/v1/lawyer/application')
        .set('Authorization', `Bearer ${lawyer2Token}`)
        .send(validAppPayload2);

      expect(res.status).toBe(201);
      lawyer2AppId = res.body.application.id;
    });

    it('should allow lawyer to fetch their own application via GET /api/v1/lawyer/application', async () => {
      const res = await request(app)
        .get('/api/v1/lawyer/application')
        .set('Authorization', `Bearer ${lawyer1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.application.id).toBe(lawyer1AppId);
    });
  });

  describe('3. Public Directory Hiding Unapproved Lawyers', () => {
    it('pending lawyer should NOT appear in public directory GET /api/v1/lawyers', async () => {
      const res = await request(app).get('/api/v1/lawyers');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
      const found = res.body.items.some((item) => item.id === lawyer1AppId || item.id === lawyer2AppId);
      expect(found).toBe(false);
    });

    it('pending lawyer should return 404 on public detail GET /api/v1/lawyers/:id', async () => {
      const res = await request(app).get(`/api/v1/lawyers/${lawyer1AppId}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Lawyer not found');
    });
  });

  describe('4. Admin Review Lifecycle (Approve & Reject with Status Guards)', () => {
    it('admin should list pending applications via GET /api/v1/admin/applications?status=pending', async () => {
      const res = await request(app)
        .get('/api/v1/admin/applications?status=pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('applications');
      expect(Array.isArray(res.body.applications)).toBe(true);
      const app1 = res.body.applications.find((a) => a.id === lawyer1AppId);
      expect(app1).toBeDefined();
      expect(app1.user.name).toBe(lawyer1User.name);
    });

    it('admin should successfully approve lawyer 1 and record audit fields', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/applications/${lawyer1AppId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.application.status).toBe(APPLICATION_STATUS.APPROVED);
      expect(res.body.application.reviewedBy).toBe(adminUser.id);
      expect(res.body.application.reviewedAt).toBeDefined();
    });

    it('admin attempting to approve an ALREADY approved application should return 409 Conflict', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/applications/${lawyer1AppId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/only pending applications can be approved/i);
    });

    it('admin rejecting without a reason or with < 10 characters should return 400 Bad Request', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/applications/${lawyer2AppId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rejectionReason: 'Too short' });

      expect(res.status).toBe(400);
      expect(res.body.details.some((d) => d.field === 'rejectionReason')).toBe(true);
    });

    it('admin should successfully reject lawyer 2 with a valid 10+ character explanation', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/applications/${lawyer2AppId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          rejectionReason: 'Enrolment number could not be verified with Sindh Bar Council registry.'
        });

      expect(res.status).toBe(200);
      expect(res.body.application.status).toBe(APPLICATION_STATUS.REJECTED);
      expect(res.body.application.rejectionReason).toMatch(/Sindh Bar Council/);
      expect(res.body.application.reviewedBy).toBe(adminUser.id);
    });

    it('admin attempting to reject an ALREADY rejected application should return 409 Conflict', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/applications/${lawyer2AppId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          rejectionReason: 'Another rejection attempt on already rejected'
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/only pending applications can be rejected/i);
    });
  });

  describe('5. Lawyer Re-submission Lifecycle (PUT /api/v1/lawyer/application)', () => {
    it('lawyer 1 (approved) attempting to PUT should receive 409 Conflict', async () => {
      const res = await request(app)
        .put('/api/v1/lawyer/application')
        .set('Authorization', `Bearer ${lawyer1Token}`)
        .send(validAppPayload1);

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/only be modified when rejected/i);
    });

    it('lawyer 2 (rejected) should successfully update application, resetting status to pending and clearing rejectionReason', async () => {
      const updatedPayload = {
        ...validAppPayload2,
        enrolmentNo: `SBC-CORRECTED-${Date.now()}`,
        experienceYears: 5
      };

      const res = await request(app)
        .put('/api/v1/lawyer/application')
        .set('Authorization', `Bearer ${lawyer2Token}`)
        .send(updatedPayload);

      expect(res.status).toBe(200);
      expect(res.body.application.status).toBe(APPLICATION_STATUS.PENDING);
      expect(res.body.application.rejectionReason).toBeNull();
      expect(res.body.application.enrolmentNo).toBe(updatedPayload.enrolmentNo);
      expect(res.body.application.experienceYears).toBe(5);
    });
  });

  describe('6. Public Directory & Strict Privacy Leakage Tests', () => {
    it('approved lawyer 1 MUST appear in public directory GET /api/v1/lawyers', async () => {
      const res = await request(app).get('/api/v1/lawyers');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page', 1);
      expect(res.body).toHaveProperty('limit', 20);

      const lawyer = res.body.items.find((item) => item.id === lawyer1AppId);
      expect(lawyer).toBeDefined();
      expect(lawyer.name).toBe(lawyer1User.name);
      expect(lawyer.city).toBe('Lahore');
      expect(lawyer.practiceAreas).toEqual(expect.arrayContaining(['Corporate', 'Civil']));

      // CRITICAL PRIVACY CHECKS: NEVER leak email, enrolmentNo, chamberAddress
      expect(lawyer.email).toBeUndefined();
      expect(lawyer.enrolmentNo).toBeUndefined();
      expect(lawyer.chamberAddress).toBeUndefined();
      expect(lawyer.userId).toBeUndefined();
      expect(lawyer.rejectionReason).toBeUndefined();
      expect(lawyer.reviewedBy).toBeUndefined();
    });

    it('approved lawyer 1 MUST be viewable on public detail GET /api/v1/lawyers/:id without private fields', async () => {
      const res = await request(app).get(`/api/v1/lawyers/${lawyer1AppId}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('lawyer');
      const lawyer = res.body.lawyer;

      expect(lawyer.id).toBe(lawyer1AppId);
      expect(lawyer.name).toBe(lawyer1User.name);
      expect(lawyer.city).toBe('Lahore');
      expect(lawyer.experienceYears).toBe(8);
      expect(lawyer.barCouncil).toBe('Punjab Bar Council');
      expect(lawyer.courtLevel).toBe('Advocate High Court');

      // CRITICAL PRIVACY CHECKS
      expect(lawyer.email).toBeUndefined();
      expect(lawyer.enrolmentNo).toBeUndefined();
      expect(lawyer.chamberAddress).toBeUndefined();
    });

    it('city filter should return lawyer when matching and empty when non-matching', async () => {
      const matchRes = await request(app).get('/api/v1/lawyers?city=Lahore');
      expect(matchRes.status).toBe(200);
      expect(matchRes.body.items.some((l) => l.id === lawyer1AppId)).toBe(true);

      const noMatchRes = await request(app).get('/api/v1/lawyers?city=Quetta');
      expect(noMatchRes.status).toBe(200);
      expect(noMatchRes.body.items.some((l) => l.id === lawyer1AppId)).toBe(false);
    });

    it('practiceArea filter should return lawyer when matching and empty when non-matching', async () => {
      const matchRes = await request(app).get('/api/v1/lawyers?practiceArea=Corporate');
      expect(matchRes.status).toBe(200);
      expect(matchRes.body.items.some((l) => l.id === lawyer1AppId)).toBe(true);

      const noMatchRes = await request(app).get('/api/v1/lawyers?practiceArea=Tax');
      expect(noMatchRes.status).toBe(200);
      expect(noMatchRes.body.items.some((l) => l.id === lawyer1AppId)).toBe(false);
    });

    it('pagination should obey limit and page parameters', async () => {
      const res = await request(app).get('/api/v1/lawyers?page=1&limit=5');
      expect(res.status).toBe(200);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(5);
    });
  });
});
