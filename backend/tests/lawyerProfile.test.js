const request = require('supertest');
const app = require('../src/app');
const { User, LawyerApplication, LawyerProfile, LawyerService } = require('../src/models');
const { generateToken } = require('../src/modules/auth/auth.service');
const { ROLES, APPLICATION_STATUS } = require('../src/constants');

const TEST_EMAIL_SUFFIX = '@test.legalhub.local';

describe('Part D: Lawyer Profile, Consultation Services, and Enriched Directory Tests', () => {
  let clientUser, pendingLawyerUser, rejectedLawyerUser, approvedLawyer1, approvedLawyer2;
  let clientToken, pendingToken, rejectedToken, lawyer1Token, lawyer2Token;
  let lawyer1App, lawyer2App;

  beforeAll(async () => {
    const timestamp = Date.now();

    // 1. Create client
    clientUser = await User.create({
      name: 'Test Citizen Client',
      email: `client_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.CLIENT
    });
    clientToken = generateToken(clientUser);

    // 2. Create pending lawyer
    pendingLawyerUser = await User.create({
      name: 'Advocate Pending',
      email: `pending_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER
    });
    pendingToken = generateToken(pendingLawyerUser);
    await LawyerApplication.create({
      userId: pendingLawyerUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `PBC-PEND-${timestamp}`,
      courtLevel: 'Advocate High Court',
      city: 'Multan',
      practiceAreas: ['Civil'],
      experienceYears: 5,
      chamberAddress: 'Chamber 10, Multan Katchery',
      bio: 'Civil law practitioner.',
      status: APPLICATION_STATUS.PENDING
    });

    // 3. Create rejected lawyer
    rejectedLawyerUser = await User.create({
      name: 'Advocate Rejected',
      email: `rejected_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER
    });
    rejectedToken = generateToken(rejectedLawyerUser);
    await LawyerApplication.create({
      userId: rejectedLawyerUser.id,
      barCouncil: 'Sindh Bar Council',
      enrolmentNo: `SBC-REJ-${timestamp}`,
      courtLevel: 'Advocate Lower Courts',
      city: 'Karachi',
      practiceAreas: ['Criminal'],
      experienceYears: 3,
      chamberAddress: 'City Courts Karachi',
      bio: 'Criminal defense lawyer.',
      status: APPLICATION_STATUS.REJECTED,
      rejectionReason: 'Enrollment card photocopy was illegible.'
    });

    // 4. Create approved lawyer 1 (Senior Multan advocate: High Court, 15 yrs)
    approvedLawyer1 = await User.create({
      name: 'Advocate Tariq Multani',
      email: `tariq_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER
    });
    lawyer1Token = generateToken(approvedLawyer1);
    lawyer1App = await LawyerApplication.create({
      userId: approvedLawyer1.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `PBC-APP1-${timestamp}`,
      courtLevel: 'Advocate High Court',
      city: 'Multan',
      practiceAreas: ['Family', 'Civil'],
      experienceYears: 15,
      chamberAddress: 'Chamber 55, High Court Bench Multan',
      bio: 'Seasoned family appellate advocate.',
      status: APPLICATION_STATUS.APPROVED
    });

    // 5. Create approved lawyer 2 (Junior Lahore advocate: Lower Courts, 4 yrs)
    approvedLawyer2 = await User.create({
      name: 'Advocate Zainab Lahore',
      email: `zainab_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER
    });
    lawyer2Token = generateToken(approvedLawyer2);
    lawyer2App = await LawyerApplication.create({
      userId: approvedLawyer2.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `PBC-APP2-${timestamp}`,
      courtLevel: 'Advocate Lower Courts',
      city: 'Lahore',
      practiceAreas: ['Corporate'],
      experienceYears: 4,
      chamberAddress: 'Aiwan-e-Adal, Lahore',
      bio: 'Commercial and corporate counsel.',
      status: APPLICATION_STATUS.APPROVED
    });
  });

  afterAll(async () => {
    // Clean up created entities
    try {
      const userIds = [
        clientUser?.id,
        pendingLawyerUser?.id,
        rejectedLawyerUser?.id,
        approvedLawyer1?.id,
        approvedLawyer2?.id
      ].filter(Boolean);

      if (userIds.length > 0) {
        await LawyerService.destroy({ where: { lawyerId: userIds } }).catch(() => {});
        await LawyerProfile.destroy({ where: { userId: userIds } }).catch(() => {});
        await LawyerApplication.destroy({ where: { userId: userIds } }).catch(() => {});
        await User.destroy({ where: { id: userIds } }).catch(() => {});
      }
    } catch (_) {}
  });

  // =========================================================================
  // 1. RBAC & Status Guards
  // =========================================================================
  describe('1. RBAC & Approved Status Guards', () => {
    it('should return 401 Unauthorized when accessing profile without token', async () => {
      const res = await request(app).get('/api/v1/lawyer/profile');
      expect(res.status).toBe(401);
    });

    it('should return 403 Forbidden when a client accesses lawyer profile routes', async () => {
      const res = await request(app)
        .get('/api/v1/lawyer/profile')
        .set('Authorization', `Bearer ${clientToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/You do not have permission to perform this action/i);
    });

    it('should return 403 Forbidden when an advocate with pending application accesses profile', async () => {
      const res = await request(app)
        .get('/api/v1/lawyer/profile')
        .set('Authorization', `Bearer ${pendingToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Only approved advocates can manage professional profiles/i);
      expect(res.body.error).toMatch(/pending/i);
    });

    it('should return 403 Forbidden when an advocate with rejected application accesses services', async () => {
      const res = await request(app)
        .get('/api/v1/lawyer/services')
        .set('Authorization', `Bearer ${rejectedToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Only approved advocates can manage professional profiles/i);
      expect(res.body.error).toMatch(/rejected/i);
    });
  });

  // =========================================================================
  // 2. Profile Upsert Lifecycle (GET & PUT /api/v1/lawyer/profile)
  // =========================================================================
  describe('2. Profile Upsert Lifecycle', () => {
    it('should return default profile when approved advocate fetches unconfigured profile', async () => {
      const res = await request(app)
        .get('/api/v1/lawyer/profile')
        .set('Authorization', `Bearer ${lawyer1Token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('profile');
      expect(res.body.profile.slotMinutes).toBe(30);
      expect(res.body.profile.isPublic).toBe(true);
      expect(res.body.profile.languages).toEqual(['Urdu', 'English']);
    });

    it('should successfully upsert profile with valid attributes', async () => {
      const payload = {
        headline: 'Senior High Court Advocate specializing in Family & Property Disputes',
        about: 'Over 15 years representing clients across Multan and South Punjab appellate courts.',
        languages: ['Urdu', 'Punjabi', 'Saraiki'],
        slotMinutes: 45,
        isPublic: true
      };

      const res = await request(app)
        .put('/api/v1/lawyer/profile')
        .set('Authorization', `Bearer ${lawyer1Token}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.profile.headline).toBe(payload.headline);
      expect(res.body.profile.about).toBe(payload.about);
      expect(res.body.profile.languages).toEqual(['Urdu', 'Punjabi', 'Saraiki']);
      expect(res.body.profile.slotMinutes).toBe(45);
      expect(res.body.profile.isPublic).toBe(true);
    });

    it('should reject profile update with invalid slotMinutes (400)', async () => {
      const res = await request(app)
        .put('/api/v1/lawyer/profile')
        .set('Authorization', `Bearer ${lawyer1Token}`)
        .send({
          slotMinutes: 25,
          languages: ['Urdu']
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should reject profile update with unsupported language (400)', async () => {
      const res = await request(app)
        .put('/api/v1/lawyer/profile')
        .set('Authorization', `Bearer ${lawyer1Token}`)
        .send({
          languages: ['French'],
          slotMinutes: 30
        });

      expect(res.status).toBe(400);
    });

    it('should reject profile update with empty languages array (400)', async () => {
      const res = await request(app)
        .put('/api/v1/lawyer/profile')
        .set('Authorization', `Bearer ${lawyer1Token}`)
        .send({
          languages: []
        });

      expect(res.status).toBe(400);
    });

    it('should reject headline exceeding 120 characters (400)', async () => {
      const res = await request(app)
        .put('/api/v1/lawyer/profile')
        .set('Authorization', `Bearer ${lawyer1Token}`)
        .send({
          headline: 'A'.repeat(121),
          languages: ['Urdu']
        });

      expect(res.status).toBe(400);
    });
  });

  // =========================================================================
  // 3. Consultation Services Replacement (GET & PUT /api/v1/lawyer/services)
  // =========================================================================
  describe('3. Consultation Services Replacement', () => {
    it('should return empty services list initially', async () => {
      const res = await request(app)
        .get('/api/v1/lawyer/services')
        .set('Authorization', `Bearer ${lawyer1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.services).toEqual([]);
    });

    it('should successfully save full set of consultation services', async () => {
      const payload = {
        services: [
          {
            mode: 'in_chamber',
            durationMinutes: 45,
            feePkr: 5000,
            isActive: true
          },
          {
            mode: 'video',
            durationMinutes: 30,
            feePkr: 3500,
            isActive: true
          },
          {
            mode: 'phone',
            durationMinutes: 15,
            feePkr: 1500,
            isActive: true
          }
        ]
      };

      const res = await request(app)
        .put('/api/v1/lawyer/services')
        .set('Authorization', `Bearer ${lawyer1Token}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.services.length).toBe(3);

      const modes = res.body.services.map((s) => s.mode);
      expect(modes).toContain('in_chamber');
      expect(modes).toContain('video');
      expect(modes).toContain('phone');
    });

    it('should reject duplicate consultation modes in services array (400)', async () => {
      const payload = {
        services: [
          { mode: 'video', durationMinutes: 30, feePkr: 2000 },
          { mode: 'video', durationMinutes: 60, feePkr: 4000 }
        ]
      };

      const res = await request(app)
        .put('/api/v1/lawyer/services')
        .set('Authorization', `Bearer ${lawyer1Token}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.details.some((d) => d.message.includes('Duplicate'))).toBe(true);
    });

    it('should reject more than 4 services (400)', async () => {
      const payload = {
        services: [
          { mode: 'chat', durationMinutes: 15, feePkr: 1000 },
          { mode: 'phone', durationMinutes: 15, feePkr: 1500 },
          { mode: 'video', durationMinutes: 30, feePkr: 2500 },
          { mode: 'in_chamber', durationMinutes: 45, feePkr: 4000 },
          { mode: 'chat', durationMinutes: 30, feePkr: 2000 } // 5th item
        ]
      };

      const res = await request(app)
        .put('/api/v1/lawyer/services')
        .set('Authorization', `Bearer ${lawyer1Token}`)
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('should reject negative fee or fee exceeding 200,000 PKR (400)', async () => {
      const resNegative = await request(app)
        .put('/api/v1/lawyer/services')
        .set('Authorization', `Bearer ${lawyer1Token}`)
        .send({
          services: [{ mode: 'chat', durationMinutes: 15, feePkr: -500 }]
        });
      expect(resNegative.status).toBe(400);

      const resExcessive = await request(app)
        .put('/api/v1/lawyer/services')
        .set('Authorization', `Bearer ${lawyer1Token}`)
        .send({
          services: [{ mode: 'chat', durationMinutes: 15, feePkr: 250000 }]
        });
      expect(resExcessive.status).toBe(400);
    });

    it('should configure lawyer 2 with lower fee services for sorting tests', async () => {
      // Lawyer 2: Lahore, Civil/Corporate, fee PKR 800
      await request(app)
        .put('/api/v1/lawyer/profile')
        .set('Authorization', `Bearer ${lawyer2Token}`)
        .send({
          headline: 'Corporate & Contract Advisory',
          about: 'Specialized in tech corporate law and commercial registration.',
          languages: ['English', 'Urdu'],
          slotMinutes: 30,
          isPublic: true
        });

      const res = await request(app)
        .put('/api/v1/lawyer/services')
        .set('Authorization', `Bearer ${lawyer2Token}`)
        .send({
          services: [
            { mode: 'chat', durationMinutes: 15, feePkr: 800, isActive: true },
            { mode: 'video', durationMinutes: 30, feePkr: 1800, isActive: true }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.services.length).toBe(2);
    });
  });

  // =========================================================================
  // 4. Enriched Public Directory (Filters, Aggregates, Sorting)
  // =========================================================================
  describe('4. Enriched Public Directory', () => {
    it('should return enriched directory fields (headline, languages, modes, feeFrom)', async () => {
      const res = await request(app).get('/api/v1/lawyers?city=Multan');
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThanOrEqual(1);

      const lawyer1Item = res.body.items.find((item) => item.id === lawyer1App.id);
      expect(lawyer1Item).toBeDefined();
      expect(lawyer1Item.headline).toBe('Senior High Court Advocate specializing in Family & Property Disputes');
      expect(lawyer1Item.languages).toEqual(['Urdu', 'Punjabi', 'Saraiki']);
      expect(lawyer1Item.feeFrom).toBe(1500); // Lowest of [5000, 3500, 1500]
      expect(lawyer1Item.modes).toEqual(expect.arrayContaining(['in_chamber', 'video', 'phone']));
    });

    it('should filter by spoken language (e.g. Saraiki)', async () => {
      const res = await request(app).get('/api/v1/lawyers?language=Saraiki');
      expect(res.status).toBe(200);
      expect(res.body.items.some((l) => l.id === lawyer1App.id)).toBe(true);
      expect(res.body.items.some((l) => l.id === lawyer2App.id)).toBe(false);
    });

    it('should filter by consultation mode (e.g. in_chamber)', async () => {
      const res = await request(app).get('/api/v1/lawyers?mode=in_chamber');
      expect(res.status).toBe(200);
      expect(res.body.items.some((l) => l.id === lawyer1App.id)).toBe(true);
      expect(res.body.items.some((l) => l.id === lawyer2App.id)).toBe(false);
    });

    it('should filter by minFee and maxFee correctly', async () => {
      // Lawyer 1 min fee is 1500, Lawyer 2 min fee is 800
      const resUnder1000 = await request(app).get('/api/v1/lawyers?maxFee=1000');
      expect(resUnder1000.status).toBe(200);
      expect(resUnder1000.body.items.some((l) => l.id === lawyer2App.id)).toBe(true);
      expect(resUnder1000.body.items.some((l) => l.id === lawyer1App.id)).toBe(false);

      const resOver1200 = await request(app).get('/api/v1/lawyers?minFee=1200');
      expect(resOver1200.status).toBe(200);
      expect(resOver1200.body.items.some((l) => l.id === lawyer1App.id)).toBe(true);
      expect(resOver1200.body.items.some((l) => l.id === lawyer2App.id)).toBe(false);
    });

    it('should filter by courtLevel', async () => {
      const resHC = await request(app).get('/api/v1/lawyers?courtLevel=Advocate%20High%20Court');
      expect(resHC.status).toBe(200);
      expect(resHC.body.items.some((l) => l.id === lawyer1App.id)).toBe(true);
      expect(resHC.body.items.some((l) => l.id === lawyer2App.id)).toBe(false);
    });

    it('should sort deterministically by experience (descending)', async () => {
      const res = await request(app).get('/api/v1/lawyers?sort=experience');
      expect(res.status).toBe(200);
      const items = res.body.items;
      const idx1 = items.findIndex((i) => i.id === lawyer1App.id);
      const idx2 = items.findIndex((i) => i.id === lawyer2App.id);
      expect(idx1).toBeLessThan(idx2); // 15 years before 4 years
    });

    it('should sort deterministically by fee_asc (lowest starting fee first)', async () => {
      const res = await request(app).get('/api/v1/lawyers?sort=fee_asc');
      expect(res.status).toBe(200);
      const items = res.body.items;
      const idx1 = items.findIndex((i) => i.id === lawyer1App.id);
      const idx2 = items.findIndex((i) => i.id === lawyer2App.id);
      expect(idx2).toBeLessThan(idx1); // 800 PKR before 1500 PKR
    });

    it('should sort deterministically by fee_desc (highest starting fee first)', async () => {
      const res = await request(app).get('/api/v1/lawyers?sort=fee_desc');
      expect(res.status).toBe(200);
      const items = res.body.items;
      const idx1 = items.findIndex((i) => i.id === lawyer1App.id);
      const idx2 = items.findIndex((i) => i.id === lawyer2App.id);
      expect(idx1).toBeLessThan(idx2); // 1500 PKR before 800 PKR
    });
  });

  // =========================================================================
  // 5. Visibility Toggle (isPublic = false)
  // =========================================================================
  describe('5. Profile Visibility Guard (isPublic = false)', () => {
    it('should hide lawyer from directory when isPublic is set to false', async () => {
      // Set lawyer 1 to private
      await request(app)
        .put('/api/v1/lawyer/profile')
        .set('Authorization', `Bearer ${lawyer1Token}`)
        .send({
          isPublic: false,
          languages: ['Urdu']
        });

      const listRes = await request(app).get('/api/v1/lawyers');
      expect(listRes.status).toBe(200);
      expect(listRes.body.items.some((l) => l.id === lawyer1App.id)).toBe(false);

      // Public detail should also return 404
      const detailRes = await request(app).get(`/api/v1/lawyers/${lawyer1App.id}`);
      expect(detailRes.status).toBe(404);
    });

    it('should restore lawyer visibility when isPublic is set back to true', async () => {
      await request(app)
        .put('/api/v1/lawyer/profile')
        .set('Authorization', `Bearer ${lawyer1Token}`)
        .send({
          isPublic: true,
          languages: ['Urdu', 'Punjabi', 'Saraiki']
        });

      const listRes = await request(app).get('/api/v1/lawyers');
      expect(listRes.status).toBe(200);
      expect(listRes.body.items.some((l) => l.id === lawyer1App.id)).toBe(true);

      const detailRes = await request(app).get(`/api/v1/lawyers/${lawyer1App.id}`);
      expect(detailRes.status).toBe(200);
      expect(detailRes.body.lawyer.id).toBe(lawyer1App.id);
    });
  });

  // =========================================================================
  // 6. Strict Privacy Shield Verification
  // =========================================================================
  describe('6. Strict Privacy Shield Verification', () => {
    it('should NEVER leak email, enrolmentNo, or chamberAddress in public detail or list', async () => {
      const listRes = await request(app).get('/api/v1/lawyers');
      expect(listRes.status).toBe(200);
      for (const item of listRes.body.items) {
        expect(item).not.toHaveProperty('email');
        expect(item).not.toHaveProperty('enrolmentNo');
        expect(item).not.toHaveProperty('chamberAddress');
        expect(item).not.toHaveProperty('rejectionReason');
        expect(item).not.toHaveProperty('reviewedBy');
      }

      const detailRes = await request(app).get(`/api/v1/lawyers/${lawyer1App.id}`);
      expect(detailRes.status).toBe(200);
      const lawyer = detailRes.body.lawyer;
      expect(lawyer).not.toHaveProperty('email');
      expect(lawyer).not.toHaveProperty('enrolmentNo');
      expect(lawyer).not.toHaveProperty('chamberAddress');
      expect(lawyer).not.toHaveProperty('rejectionReason');
      expect(lawyer).not.toHaveProperty('reviewedBy');
      expect(lawyer).toHaveProperty('about');
      expect(lawyer).toHaveProperty('services');
      expect(Array.isArray(lawyer.services)).toBe(true);
    });
  });
});
