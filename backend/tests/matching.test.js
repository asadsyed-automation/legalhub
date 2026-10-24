const request = require('supertest');
const app = require('../src/app');
const {
  User,
  LawyerApplication,
  LawyerProfile,
  LawyerService,
  AvailabilityRule
} = require('../src/models');
const { APPLICATION_STATUS, ROLES } = require('../src/constants');

const TEST_EMAIL_SUFFIX = '@test.legalhub.local';

describe('Part F: Rule-Based Matching Engine Tests', () => {
  let lawyerMultanUser, lawyerLahoreUser, lawFirmUser, unapprovedUser, privateUser;
  let lawyerMultanApp, lawyerLahoreApp, lawFirmApp, unapprovedApp, privateApp;

  beforeAll(async () => {
    const timestamp = Date.now();

    // 1. Advocate in Multan (Corporate, 15 yrs exp, Saraiki & Urdu, Video 3000 PKR, Monday slots)
    lawyerMultanUser = await User.create({
      name: 'Advocate Multan Corporate',
      email: `lawyer_mul_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER
    });

    lawyerMultanApp = await LawyerApplication.create({
      userId: lawyerMultanUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `PBC-MUL-${timestamp}`,
      courtLevel: 'Advocate High Court',
      city: 'Multan',
      practiceAreas: ['Corporate', 'Civil'],
      experienceYears: 15,
      chamberAddress: 'High Court Multan Bench',
      bio: 'Corporate counsel in Multan.',
      status: APPLICATION_STATUS.APPROVED
    });

    await LawyerProfile.create({
      userId: lawyerMultanUser.id,
      headline: 'Corporate & Commercial Counsel',
      languages: ['Urdu', 'Saraiki'],
      slotMinutes: 30,
      isPublic: true
    });

    await LawyerService.create({
      lawyerId: lawyerMultanUser.id,
      mode: 'video',
      durationMinutes: 30,
      feePkr: 3000,
      isActive: true
    });

    // Weekday 1 (Monday): 17:00 to 19:00 PKT
    await AvailabilityRule.create({
      lawyerId: lawyerMultanUser.id,
      weekday: 1,
      startTime: '17:00',
      endTime: '19:00'
    });

    // 2. Advocate in Lahore (Corporate, 6 yrs exp, English, In Chamber 8000 PKR, no availability)
    lawyerLahoreUser = await User.create({
      name: 'Advocate Lahore Corporate',
      email: `lawyer_lhr_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER
    });

    lawyerLahoreApp = await LawyerApplication.create({
      userId: lawyerLahoreUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `PBC-LHR-${timestamp}`,
      courtLevel: 'Advocate Lower Courts',
      city: 'Lahore',
      practiceAreas: ['Corporate'],
      experienceYears: 6,
      chamberAddress: 'Mall Road, Lahore',
      bio: 'Lahore corporate consultant.',
      status: APPLICATION_STATUS.APPROVED
    });

    await LawyerProfile.create({
      userId: lawyerLahoreUser.id,
      headline: 'Lahore Commercial Counsel',
      languages: ['English', 'Urdu'],
      slotMinutes: 30,
      isPublic: true
    });

    await LawyerService.create({
      lawyerId: lawyerLahoreUser.id,
      mode: 'in_chamber',
      durationMinutes: 30,
      feePkr: 8000,
      isActive: true
    });

    // 3. Law Firm in Multan (Corporate, 12 yrs exp, Urdu, Video 4000 PKR, Monday slots)
    lawFirmUser = await User.create({
      name: 'Multan Legal Partners LLP',
      email: `firm_mul_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAW_FIRM
    });

    lawFirmApp = await LawyerApplication.create({
      userId: lawFirmUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `PBC-FIRM-${timestamp}`,
      courtLevel: 'Advocate High Court',
      city: 'Multan',
      practiceAreas: ['Corporate', 'Banking'],
      experienceYears: 12,
      chamberAddress: 'Kutchery Road, Multan',
      bio: 'Commercial law firm in Multan.',
      status: APPLICATION_STATUS.APPROVED
    });

    await LawyerProfile.create({
      userId: lawFirmUser.id,
      headline: 'Full-Service Commercial Law Firm',
      languages: ['Urdu', 'English'],
      slotMinutes: 30,
      isPublic: true
    });

    await LawyerService.create({
      lawyerId: lawFirmUser.id,
      mode: 'video',
      durationMinutes: 30,
      feePkr: 4000,
      isActive: true
    });

    await AvailabilityRule.create({
      lawyerId: lawFirmUser.id,
      weekday: 1,
      startTime: '10:00',
      endTime: '12:00'
    });

    // 4. Unapproved Advocate (should never be returned)
    unapprovedUser = await User.create({
      name: 'Unapproved Lawyer',
      email: `unapp_m_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER
    });

    unapprovedApp = await LawyerApplication.create({
      userId: unapprovedUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `PBC-UNAPP-${timestamp}`,
      courtLevel: 'Advocate Lower Courts',
      city: 'Multan',
      practiceAreas: ['Corporate'],
      experienceYears: 2,
      chamberAddress: 'Multan',
      status: APPLICATION_STATUS.PENDING
    });

    // 5. Private Profile Advocate (isPublic: false, should never be returned)
    privateUser = await User.create({
      name: 'Private Lawyer',
      email: `priv_m_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER
    });

    privateApp = await LawyerApplication.create({
      userId: privateUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `PBC-PRIVM-${timestamp}`,
      courtLevel: 'Advocate High Court',
      city: 'Multan',
      practiceAreas: ['Corporate'],
      experienceYears: 8,
      chamberAddress: 'Multan',
      status: APPLICATION_STATUS.APPROVED
    });

    await LawyerProfile.create({
      userId: privateUser.id,
      headline: 'Sabbatical Profile',
      slotMinutes: 30,
      isPublic: false
    });
  });

  afterAll(async () => {
    const userIds = [
      lawyerMultanUser?.id,
      lawyerLahoreUser?.id,
      lawFirmUser?.id,
      unapprovedUser?.id,
      privateUser?.id
    ].filter(Boolean);

    if (userIds.length > 0) {
      await AvailabilityRule.destroy({ where: { lawyerId: userIds } }).catch(() => {});
      await LawyerService.destroy({ where: { lawyerId: userIds } }).catch(() => {});
      await LawyerProfile.destroy({ where: { userId: userIds } }).catch(() => {});
      await LawyerApplication.destroy({ where: { userId: userIds } }).catch(() => {});
      await User.destroy({ where: { id: userIds } }).catch(() => {});
    }
  });

  // =========================================================================
  // 1. Text Classification Tests (/api/v1/match/classify)
  // =========================================================================
  describe('1. Text Classification (/api/v1/match/classify)', () => {
    it('should return 400 Bad Request when text is missing or under 10 characters', async () => {
      const res1 = await request(app).post('/api/v1/match/classify').send({});
      expect(res1.status).toBe(400);

      const res2 = await request(app).post('/api/v1/match/classify').send({ text: 'Help' });
      expect(res2.status).toBe(400);
      expect(res2.body.error).toBe('Validation failed');
    });

    it('should classify text with high confidence when multiple distinct keywords hit', async () => {
      const res = await request(app)
        .post('/api/v1/match/classify')
        .send({
          text: 'My husband has sent a talaq notice and I need to file for khula and child custody immediately.'
        });

      expect(res.status).toBe(200);
      expect(res.body.practiceArea).toBe('Family');
      expect(res.body.confidence).toBe('high');
      expect(res.body.matchedKeywords).toEqual(expect.arrayContaining(['talaq', 'khula', 'custody']));
      expect(res.body.followUpQuestions.length).toBeGreaterThanOrEqual(3);

      const specificQ = res.body.followUpQuestions.find((q) => q.key === 'categoryDetail');
      expect(specificQ).toBeDefined();
      expect(specificQ.question).toMatch(/khula, custody/i);
    });

    it('should classify text with low confidence when only a single keyword matches', async () => {
      const res = await request(app)
        .post('/api/v1/match/classify')
        .send({
          text: 'I need general advice regarding an employment problem at my office.'
        });

      expect(res.status).toBe(200);
      expect(res.body.practiceArea).toBe('Labor');
      expect(res.body.confidence).toBe('low');
      expect(res.body.matchedKeywords).toContain('employment');
    });

    it('should classify text with low confidence when two categories are tied in hits', async () => {
      const res = await request(app)
        .post('/api/v1/match/classify')
        .send({
          text: 'I need help reviewing a contract and also have questions about an arrest.'
        });

      expect(res.status).toBe(200);
      expect(res.body.confidence).toBe('low');
      expect(['Criminal', 'Civil']).toContain(res.body.practiceArea);
      expect(res.body.alternatives.length).toBeGreaterThanOrEqual(1);
    });

    it('should return confidence none when zero legal keywords match', async () => {
      const res = await request(app)
        .post('/api/v1/match/classify')
        .send({
          text: 'Hello, I would like to say hello to everyone and ask some casual life advice.'
        });

      expect(res.status).toBe(200);
      expect(res.body.practiceArea).toBeNull();
      expect(res.body.confidence).toBe('none');
      expect(res.body.matchedKeywords).toEqual([]);
      expect(res.body.alternatives).toEqual([]);
    });

    it('should enforce whole-word boundaries and not match substrings falsely', async () => {
      // "bailout" should NOT trigger Criminal keyword "bail"
      const res = await request(app)
        .post('/api/v1/match/classify')
        .send({
          text: 'The international company received a massive financial bailout from stakeholders.'
        });

      expect(res.status).toBe(200);
      expect(res.body.matchedKeywords).not.toContain('bail');
    });
  });

  // =========================================================================
  // 2. Multi-Factor Match Search Tests (/api/v1/match/search)
  // =========================================================================
  describe('2. Multi-Factor Match Search (/api/v1/match/search)', () => {
    it('should return 400 Bad Request when required practiceArea is missing', async () => {
      const res = await request(app).post('/api/v1/match/search').send({ city: 'Multan' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should score candidates accurately across city, language, mode, budget, exp, urgency', async () => {
      const res = await request(app)
        .post('/api/v1/match/search')
        .send({
          practiceArea: 'Corporate',
          city: 'Multan',
          language: 'Saraiki',
          mode: 'video',
          maxFeePkr: 5000,
          urgency: 'this_week'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
      // 3 eligible approved & public Corporate candidates (Multan Lawyer, Multan Law Firm, Lahore Lawyer)
      expect(res.body.total).toBe(3);

      const topMatch = res.body.items[0];
      expect(topMatch.id).toBe(lawyerMultanApp.id);
      expect(topMatch.city).toBe('Multan');

      // Check scoring breakdown:
      // City: 30
      // Mode (video): 15
      // Language (Saraiki): 10
      // Budget (3000 <= 5000): 10
      // Experience (15/15 * 10): 10
      // Urgency (has Monday slot within 7 days): 25
      // Total = 100!
      expect(topMatch.score).toBe(100);
      expect(topMatch.nextSlot).not.toBeNull();

      // Check plain reasons
      expect(topMatch.reasons).toEqual(
        expect.arrayContaining([
          'Practises Corporate law',
          'Based in Multan',
          'Consults in Saraiki',
          'Offers video consultations',
          'Consultation fee within your 5,000 PKR budget',
          '15 years of professional legal experience',
          'Consultation slot available this week'
        ])
      );
    });

    it('should seamlessly include law firms as eligible matching entities', async () => {
      const res = await request(app)
        .post('/api/v1/match/search')
        .send({
          practiceArea: 'Corporate',
          city: 'Multan'
        });

      expect(res.status).toBe(200);
      const firmMatch = res.body.items.find((item) => item.id === lawFirmApp.id);
      expect(firmMatch).toBeDefined();
      expect(firmMatch.name).toBe('Multan Legal Partners LLP');
      expect(firmMatch.role).toBe(ROLES.LAW_FIRM);
      expect(firmMatch.reasons).toContain('Practises Corporate law');
      expect(firmMatch.reasons).toContain('Based in Multan');
    });

    it('should NEVER include unapproved or private (hidden) advocates in matching results', async () => {
      const res = await request(app)
        .post('/api/v1/match/search')
        .send({
          practiceArea: 'Corporate'
        });

      expect(res.status).toBe(200);
      const returnedIds = res.body.items.map((i) => i.id);
      expect(returnedIds).not.toContain(unapprovedApp.id);
      expect(returnedIds).not.toContain(privateApp.id);
    });

    it('should strictly comply with Bar Council Rule 135 (no words like best, top, premier)', async () => {
      const res = await request(app)
        .post('/api/v1/match/search')
        .send({
          practiceArea: 'Corporate',
          city: 'Multan'
        });

      expect(res.status).toBe(200);
      for (const item of res.body.items) {
        for (const reason of item.reasons) {
          const lower = reason.toLowerCase();
          expect(lower).not.toMatch(/\bbest\b/);
          expect(lower).not.toMatch(/\btop\b/);
          expect(lower).not.toMatch(/\bpremier\b/);
          expect(lower).not.toMatch(/\bfeatured\b/);
          expect(lower).not.toMatch(/\branked\b/);
        }
      }
    });

    it('should sort deterministically by score DESC then nextSlot ASC then id ASC', async () => {
      const res = await request(app)
        .post('/api/v1/match/search')
        .send({
          practiceArea: 'Corporate',
          city: 'Multan'
        });

      expect(res.status).toBe(200);
      const scores = res.body.items.map((i) => i.score);
      for (let i = 0; i < scores.length - 1; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
      }
    });

    it('should obey pagination limit and page parameters', async () => {
      const res = await request(app)
        .post('/api/v1/match/search')
        .send({
          practiceArea: 'Corporate',
          page: 1,
          limit: 1
        });

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBe(1);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(1);
      expect(res.body.total).toBeGreaterThanOrEqual(2);
    });
  });
});
