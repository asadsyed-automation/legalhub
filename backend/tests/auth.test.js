const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config/env');

const TEST_EMAIL_SUFFIX = '@test.legalhub.local';

describe('Authentication Module Integration Tests', () => {
  const testClient = {
    name: 'Ahmed Khan',
    email: `ahmed_${Date.now()}${TEST_EMAIL_SUFFIX}`,
    password: 'Password123!',
    role: 'client'
  };

  const testLawyer = {
    name: 'Fatima Ali Advocate',
    email: `fatima_${Date.now()}${TEST_EMAIL_SUFFIX}`,
    password: 'LawyerPassword123!',
    role: 'lawyer'
  };

  let clientToken = '';

  describe('POST /api/v1/auth/register', () => {
    it('should successfully register a client and return token and user without passwordHash', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testClient);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testClient.email.toLowerCase());
      expect(res.body.user.role).toBe('client');
      expect(res.body.user.name).toBe(testClient.name);
      expect(res.body.user.passwordHash).toBeUndefined();

      clientToken = res.body.token;
    });

    it('should successfully register a lawyer', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testLawyer);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.role).toBe('lawyer');
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('should reject registration with role admin (400)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Intruder Admin',
          email: `fakeadmin_${Date.now()}${TEST_EMAIL_SUFFIX}`,
          password: 'AdminPassword123!',
          role: 'admin'
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toBe('Validation failed');
      expect(res.body).toHaveProperty('details');
      expect(res.body.details.some((d) => d.field === 'role')).toBe(true);
    });

    it('should reject duplicate email registration with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testClient);

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('error', 'Email is already registered');
    });

    it('should reject weak password under 8 characters with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Short Pass User',
          email: `shortpass_${Date.now()}${TEST_EMAIL_SUFFIX}`,
          password: 'pass',
          role: 'client'
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Validation failed');
      expect(res.body.details.some((d) => d.field === 'password')).toBe(true);
    });

    it('should reject invalid email format with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Invalid Email User',
          email: 'not-an-email',
          password: 'ValidPassword123!',
          role: 'client'
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Validation failed');
      expect(res.body.details.some((d) => d.field === 'email')).toBe(true);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should successfully log in an existing user and return { token, user }', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testClient.email,
          password: testClient.password
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testClient.email.toLowerCase());
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('should return 401 with generic message for non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: `nonexistent_${Date.now()}${TEST_EMAIL_SUFFIX}`,
          password: 'SomePassword123!'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('should return 401 with identical generic message for wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testClient.email,
          password: 'WrongPassword456!'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('should lock the account for 15 minutes after 5 consecutive failed logins', async () => {
      const lockoutUser = {
        name: 'Lockout Test User',
        email: `lockout_${Date.now()}${TEST_EMAIL_SUFFIX}`,
        password: 'CorrectPassword123!',
        role: 'client'
      };

      // Register the test user first
      await request(app).post('/api/v1/auth/register').send(lockoutUser);

      // Attempt 1 through 4: Should fail with generic 401
      for (let i = 1; i <= 4; i++) {
        const attempt = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: lockoutUser.email,
            password: 'WrongPassword!'
          });
        expect(attempt.status).toBe(401);
        expect(attempt.body.error).toBe('Invalid email or password');
      }

      // 5th attempt: triggers the lockout
      const fifthAttempt = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: lockoutUser.email,
          password: 'WrongPassword!'
        });

      expect(fifthAttempt.status).toBe(401);
      expect(fifthAttempt.body.error).toMatch(/temporarily locked/i);

      // 6th attempt even with CORRECT password should be rejected while locked
      const sixthAttempt = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: lockoutUser.email,
          password: lockoutUser.password
        });

      expect(sixthAttempt.status).toBe(401);
      expect(sixthAttempt.body.error).toMatch(/temporarily locked/i);
    });
  });

  describe('GET /api/v1/auth/me and Middleware Tests', () => {
    it('should return authenticated user profile when valid token is provided', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testClient.email.toLowerCase());
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('should return 401 when Authorization header is missing', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/token is required/i);
    });

    it('should return 401 when token is invalid or malformed', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.payload');

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid or malformed/i);
    });

    it('should return 401 when token has expired', async () => {
      // Create an already-expired token (signed 10 seconds in the past with 1s expiry)
      const expiredToken = jwt.sign(
        { id: '00000000-0000-0000-0000-000000000000', email: 'exp@test.com', role: 'client' },
        config.jwtSecret,
        { expiresIn: -10 }
      );

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/expired/i);
    });
  });
});
