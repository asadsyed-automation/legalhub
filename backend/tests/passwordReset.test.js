const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const config = require('../src/config/env');
const { User, EmailOtp, OTP_PURPOSES } = require('../src/models');
const { getOutbox, clearOutbox } = require('../src/utils/mailer');
const otpService = require('../src/modules/auth/otp.service');

const TEST_EMAIL_SUFFIX = '@test.legalhub.local';

describe('Part P: Email OTP & Password Reset Integration Tests', () => {
  let testUser;
  let testEmail;
  const initialPassword = 'InitialSecurePassword123!';
  const newPassword = 'NewResetPassword456!';

  beforeEach(async () => {
    clearOutbox();
    testEmail = `user_otp_${Date.now()}_${Math.floor(Math.random() * 1000)}${TEST_EMAIL_SUFFIX}`;

    const passwordHash = await bcrypt.hash(initialPassword, 10);
    testUser = await User.create({
      name: 'Malik Tariq Client',
      email: testEmail,
      passwordHash,
      role: 'client',
      emailVerifiedAt: new Date()
    });
  });

  describe('1. Forgot Password & User Enumeration Safety', () => {
    it('should return identical 200 message for non-existent email address (no enumeration)', async () => {
      const nonExistentEmail = `nonexistent_${Date.now()}${TEST_EMAIL_SUFFIX}`;

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: nonExistentEmail });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe(
        'If that email address is in our system, we have sent a 6-digit verification code to it.'
      );

      // Verify no email was dispatched
      const outbox = getOutbox();
      expect(outbox.filter((m) => m.to === nonExistentEmail)).toHaveLength(0);
    });

    it('should return identical 200 message for registered user and dispatch 6-digit OTP', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testEmail });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe(
        'If that email address is in our system, we have sent a 6-digit verification code to it.'
      );

      // Verify email was dispatched via test outbox
      const outbox = getOutbox();
      const sentEmail = outbox.find((m) => m.to === testEmail);
      expect(sentEmail).toBeDefined();
      expect(sentEmail.subject).toBe('LegalHub Password Reset Code');

      // Verify 6-digit code exists in email text
      const codeMatch = sentEmail.text.match(/\b\d{6}\b/);
      expect(codeMatch).not.toBeNull();
      const plainCode = codeMatch[0];

      // Verify stored OTP in database is SHA-256 hashed (never plain text)
      const storedOtp = await EmailOtp.findOne({
        where: { userId: testUser.id, purpose: OTP_PURPOSES.RESET_PASSWORD },
        order: [['createdAt', 'DESC']]
      });

      expect(storedOtp).toBeDefined();
      expect(storedOtp.codeHash).not.toBe(plainCode);
      expect(storedOtp.codeHash).toHaveLength(64);
      expect(storedOtp.attempts).toBe(0);
      expect(storedOtp.consumedAt).toBeNull();
    });
  });

  describe('2. Code Expiry & Fake Clock Testing', () => {
    it('should reject reset attempt if code has expired past 10 minutes', async () => {
      // Generate OTP
      await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testEmail });

      const sentEmail = getOutbox().find((m) => m.to === testEmail);
      const code = sentEmail.text.match(/\b\d{6}\b/)[0];

      // Simulate expired code by setting expiresAt 11 minutes in the past
      const storedOtp = await EmailOtp.findOne({
        where: { userId: testUser.id, purpose: OTP_PURPOSES.RESET_PASSWORD },
        order: [['createdAt', 'DESC']]
      });
      await storedOtp.update({
        expiresAt: new Date(Date.now() - 11 * 60 * 1000)
      });

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          email: testEmail,
          code,
          newPassword
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid or expired verification code');
    });
  });

  describe('3. Max 5 Wrong Attempts (Dead Code Rule)', () => {
    it('should lock out code after 5 wrong attempts and reject subsequent attempts even if correct', async () => {
      // 1. Generate legitimate OTP
      await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testEmail });

      const sentEmail = getOutbox().find((m) => m.to === testEmail);
      const correctCode = sentEmail.text.match(/\b\d{6}\b/)[0];
      const wrongCode = '999999' === correctCode ? '888888' : '999999';

      // 2. Submit wrong code 5 times
      for (let i = 1; i <= 5; i++) {
        const failRes = await request(app)
          .post('/api/v1/auth/reset-password')
          .send({
            email: testEmail,
            code: wrongCode,
            newPassword
          });
        expect(failRes.status).toBe(400);
        expect(failRes.body.error).toBe('Invalid or expired verification code');
      }

      // 3. Verify attempts count and dead status in database
      const storedOtp = await EmailOtp.findOne({
        where: { userId: testUser.id, purpose: OTP_PURPOSES.RESET_PASSWORD },
        order: [['createdAt', 'DESC']]
      });
      expect(storedOtp.attempts).toBe(5);
      expect(storedOtp.consumedAt).not.toBeNull(); // Code marked dead

      // 4. Attempt with the CORRECT code on 6th try -> Must be rejected because code is dead
      const sixthRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          email: testEmail,
          code: correctCode,
          newPassword
        });

      expect(sixthRes.status).toBe(400);
      expect(sixthRes.body.error).toBe('Invalid or expired verification code');
    });
  });

  describe('4. 60-Second Cooldown on Code Resend', () => {
    it('should reject resend request within 60 seconds with 429 Too Many Requests', async () => {
      // First request
      const firstRes = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testEmail });
      expect(firstRes.status).toBe(200);

      // Immediate second request within 60 seconds
      const secondRes = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testEmail });

      expect(secondRes.status).toBe(429);
      expect(secondRes.body.error).toMatch(/Please wait at least/);
    });
  });

  describe('5. Password Reset Happy Path & Account Unlock', () => {
    it('should successfully reset password, reset lockout, consume code, and allow login with new password', async () => {
      // 1. Lock the account by simulating failed logins
      await testUser.update({
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000)
      });

      // 2. Request forgot-password OTP
      await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testEmail });

      const sentEmail = getOutbox().find((m) => m.to === testEmail);
      const code = sentEmail.text.match(/\b\d{6}\b/)[0];

      // 3. Submit valid reset request
      const resetRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          email: testEmail,
          code,
          newPassword
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.message).toMatch(/Password has been reset successfully/);

      // 4. Verify user record is unlocked in DB
      await testUser.reload();
      expect(testUser.failedLoginAttempts).toBe(0);
      expect(testUser.lockedUntil).toBeNull();

      // 5. Verify code is marked consumed
      const storedOtp = await EmailOtp.findOne({
        where: { userId: testUser.id, purpose: OTP_PURPOSES.RESET_PASSWORD },
        order: [['createdAt', 'DESC']]
      });
      expect(storedOtp.consumedAt).not.toBeNull();

      // 6. Old password must fail
      const oldLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: initialPassword });
      expect(oldLoginRes.status).toBe(401);

      // 7. New password must succeed
      const newLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: newPassword });
      expect(newLoginRes.status).toBe(200);
      expect(newLoginRes.body).toHaveProperty('token');
    });

    it('should reject reusing a consumed code a second time', async () => {
      // Request OTP
      await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testEmail });

      const sentEmail = getOutbox().find((m) => m.to === testEmail);
      const code = sentEmail.text.match(/\b\d{6}\b/)[0];

      // Use it once
      const firstUse = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          email: testEmail,
          code,
          newPassword
        });
      expect(firstUse.status).toBe(200);

      // Use it second time
      const secondUse = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          email: testEmail,
          code,
          newPassword: 'AnotherPassword789!'
        });
      expect(secondUse.status).toBe(400);
      expect(secondUse.body.error).toBe('Invalid or expired verification code');
    });
  });

  describe('6. Email Verification Endpoints (verify-email & resend-code)', () => {
    it('should verify email with valid code and return token like login', async () => {
      // Create unverified user
      const unverifiedEmail = `unverified_${Date.now()}${TEST_EMAIL_SUFFIX}`;
      const unverifiedUser = await User.create({
        name: 'Unverified Citizen',
        email: unverifiedEmail,
        passwordHash: await bcrypt.hash('SecurePassword123!', 10),
        role: 'client',
        emailVerifiedAt: null
      });

      // Dispatch verify code
      const { plainCode } = await otpService.generateOtp(unverifiedUser.id, OTP_PURPOSES.VERIFY_EMAIL);

      // Submit verification
      const verifyRes = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({
          email: unverifiedEmail,
          code: plainCode
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body).toHaveProperty('token');
      expect(verifyRes.body).toHaveProperty('user');
      expect(verifyRes.body.user.email).toBe(unverifiedEmail);

      // Verify DB column updated
      await unverifiedUser.reload();
      expect(unverifiedUser.emailVerifiedAt).not.toBeNull();
    });

    it('should reject resending verification code if user is already verified', async () => {
      const res = await request(app)
        .post('/api/v1/auth/resend-code')
        .send({ email: testEmail }); // testEmail is already verified in beforeEach

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email address is already verified');
    });
  });

  describe('7. Unverified User Login Guard', () => {
    it('should return 403 EMAIL_NOT_VERIFIED when requireEmailVerification is active', async () => {
      const unverifiedEmail = `gatekeeper_${Date.now()}${TEST_EMAIL_SUFFIX}`;
      await User.create({
        name: 'Gatekeeper Test',
        email: unverifiedEmail,
        passwordHash: await bcrypt.hash('GatekeeperPassword123!', 10),
        role: 'client',
        emailVerifiedAt: null
      });

      // Temporarily toggle requireEmailVerification flag
      const originalFlag = config.requireEmailVerification;
      config.requireEmailVerification = true;

      try {
        const loginRes = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: unverifiedEmail,
            password: 'GatekeeperPassword123!'
          });

        expect(loginRes.status).toBe(403);
        expect(loginRes.body.error).toBe('Please verify your email address before logging in');
        expect(loginRes.body.details).toEqual([
          { field: 'account', message: 'EMAIL_NOT_VERIFIED' }
        ]);
      } finally {
        config.requireEmailVerification = originalFlag;
      }
    });
  });
});
