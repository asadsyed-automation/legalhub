const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { User } = require('../src/models');
const { ROLES } = require('../src/constants/roles');
const { generateToken } = require('../src/modules/auth/auth.service');

const TEST_EMAIL_SUFFIX = '@test.legalhub.local';

describe('Part Q: Admin User Management & Suspension Integration Tests', () => {
  let adminUser;
  let adminToken;
  let clientUser;
  let clientToken;
  let lawyerUser;
  let lawyerToken;
  const commonPassword = 'SecurePassword123!';

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash(commonPassword, 10);

    // 1. Create Administrator
    adminUser = await User.create({
      name: 'Super Admin',
      email: `admin_q_${Date.now()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: ROLES.ADMIN,
      isActive: true,
      emailVerifiedAt: new Date()
    });
    adminToken = generateToken(adminUser);

    // 2. Create Regular Client
    clientUser = await User.create({
      name: 'Client Tariq',
      email: `client_q_${Date.now()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: ROLES.CLIENT,
      isActive: true,
      emailVerifiedAt: new Date()
    });
    clientToken = generateToken(clientUser);

    // 3. Create Regular Lawyer
    lawyerUser = await User.create({
      name: 'Advocate Bilawal',
      email: `lawyer_q_${Date.now()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: ROLES.LAWYER,
      isActive: true,
      emailVerifiedAt: new Date()
    });
    lawyerToken = generateToken(lawyerUser);
  });

  describe('1. GET /api/v1/admin/users (Listing & Filtering)', () => {
    it('should allow admin to list users with pagination metadata', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('users');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(5);
      expect(typeof res.body.pagination.total).toBe('number');
      expect(res.body.users.length).toBeGreaterThanOrEqual(1);

      // Verify sensitive passwordHash is never returned
      res.body.users.forEach((u) => {
        expect(u.passwordHash).toBeUndefined();
      });
    });

    it('should filter users by role', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/users?role=${ROLES.LAWYER}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.users.length).toBeGreaterThanOrEqual(1);
      res.body.users.forEach((u) => {
        expect(u.role).toBe(ROLES.LAWYER);
      });
    });

    it('should search users by keyword matching name or email', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users?search=Bilawal')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const found = res.body.users.some((u) => u.name.includes('Bilawal'));
      expect(found).toBe(true);
    });

    it('should reject non-admin access with 403 Forbidden', async () => {
      const clientRes = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(clientRes.status).toBe(403);

      const lawyerRes = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(lawyerRes.status).toBe(403);
    });

    it('should reject unauthenticated access with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/admin/users');
      expect(res.status).toBe(401);
    });
  });

  describe('2. PATCH /api/v1/admin/users/:id/status (Suspension & Reinstatement)', () => {
    let targetUser;

    beforeEach(async () => {
      const passwordHash = await bcrypt.hash(commonPassword, 10);
      targetUser = await User.create({
        name: 'Misbehaving User',
        email: `misbehaving_${Date.now()}_${Math.floor(Math.random() * 1000)}${TEST_EMAIL_SUFFIX}`,
        passwordHash,
        role: ROLES.CLIENT,
        isActive: true,
        emailVerifiedAt: new Date()
      });
    });

    it('should successfully suspend an active user with a reason', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${targetUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'suspended',
          reason: 'Multiple fraudulent consultation claims reported'
        });

      expect(res.status).toBe(200);
      expect(res.body.user.isActive).toBe(false);
      expect(res.body.user.suspensionReason).toBe('Multiple fraudulent consultation claims reported');
      expect(res.body.user.suspendedAt).not.toBeNull();

      // Verify database persistence
      const refreshed = await User.findByPk(targetUser.id);
      expect(refreshed.isActive).toBe(false);
      expect(refreshed.suspensionReason).toBe('Multiple fraudulent consultation claims reported');
    });

    it('should reject suspension without a reason (minimum 5 chars required)', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${targetUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'suspended',
          reason: 'Bad'
        });

      expect(res.status).toBe(400);
    });

    it('should prevent an admin from suspending their own account', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${adminUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'suspended',
          reason: 'Accidental self-suspension attempt'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('cannot suspend their own account');
    });

    it('should reinstate a suspended user back to active status', async () => {
      // 1. Suspend first
      await targetUser.update({
        isActive: false,
        suspensionReason: 'Suspended pending review',
        suspendedAt: new Date()
      });

      // 2. Reinstate
      const res = await request(app)
        .patch(`/api/v1/admin/users/${targetUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'active'
        });

      expect(res.status).toBe(200);
      expect(res.body.user.isActive).toBe(true);
      expect(res.body.user.suspensionReason).toBeNull();
      expect(res.body.user.suspendedAt).toBeNull();

      // Verify database persistence
      const refreshed = await User.findByPk(targetUser.id);
      expect(refreshed.isActive).toBe(true);
      expect(refreshed.suspensionReason).toBeNull();
    });
  });

  describe('3. Login & Active Session Revocation Guards', () => {
    let suspendedUser;
    let preGeneratedToken;

    beforeEach(async () => {
      const passwordHash = await bcrypt.hash(commonPassword, 10);
      suspendedUser = await User.create({
        name: 'Sanctioned Client',
        email: `sanctioned_${Date.now()}_${Math.floor(Math.random() * 1000)}${TEST_EMAIL_SUFFIX}`,
        passwordHash,
        role: ROLES.CLIENT,
        isActive: true,
        emailVerifiedAt: new Date()
      });

      // Generate a valid token while user is still active
      preGeneratedToken = generateToken(suspendedUser);

      // Now suspend the user
      await suspendedUser.update({
        isActive: false,
        suspensionReason: 'Ethical violations confirmed by admin committee',
        suspendedAt: new Date()
      });
    });

    it('should reject login attempt for suspended user with 403 ACCOUNT_SUSPENDED', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: suspendedUser.email,
          password: commonPassword
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Account is suspended');
      expect(res.body.details?.[0]?.message).toBe('ACCOUNT_SUSPENDED');
    });

    it('should block active sessions even if JWT token has not expired', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${preGeneratedToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Account is suspended');
      expect(res.body.details?.[0]?.message).toBe('ACCOUNT_SUSPENDED');
    });

    it('should allow login and session access once reinstated', async () => {
      // Admin reinstates user
      await request(app)
        .patch(`/api/v1/admin/users/${suspendedUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'active' });

      // User attempts login
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: suspendedUser.email,
          password: commonPassword
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body).toHaveProperty('token');
      expect(loginRes.body.user.isActive).toBe(true);

      // Reinstated user can hit /me
      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user.email).toBe(suspendedUser.email);
    });
  });
});
