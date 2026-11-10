const request = require('supertest');
const app = require('../src/app');
const {
  User,
  LawyerApplication,
  LawyerProfile,
  CommunityQuestion,
  CommunityAnswer
} = require('../src/models');
const { generateToken } = require('../src/modules/auth/auth.service');
const { ROLES, APPLICATION_STATUS } = require('../src/constants');

const TEST_EMAIL_SUFFIX = '@test.legalhub.local';

describe('Public Legal Q&A Feed Module Integration Tests', () => {
  let clientUser, otherClientUser;
  let clientToken, otherClientToken;
  let approvedLawyerUser, unapprovedLawyerUser;
  let approvedLawyerToken, unapprovedLawyerToken;
  let adminUser, adminToken;
  let testQuestion;

  beforeAll(async () => {
    const ts = Date.now();

    // 1. Client User
    clientUser = await User.create({
      name: 'Chaudhry Riaz Client',
      email: `client_feed_${ts}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.CLIENT,
      isActive: true,
      emailVerifiedAt: new Date()
    });
    clientToken = generateToken(clientUser);

    // 2. Other Client User
    otherClientUser = await User.create({
      name: 'Babar Azam Client',
      email: `client2_feed_${ts}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.CLIENT,
      isActive: true,
      emailVerifiedAt: new Date()
    });
    otherClientToken = generateToken(otherClientUser);

    // 3. Approved Lawyer User
    approvedLawyerUser = await User.create({
      name: 'Advocate Fatima Noor',
      email: `lawyer_feed_${ts}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER,
      isActive: true,
      emailVerifiedAt: new Date()
    });
    approvedLawyerToken = generateToken(approvedLawyerUser);

    await LawyerApplication.create({
      userId: approvedLawyerUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `BC-FEED-${ts}`,
      courtLevel: 'Advocate High Court',
      city: 'Multan',
      practiceAreas: ['Family', 'Civil'],
      experienceYears: 8,
      chamberAddress: 'Chamber 12, District Courts Multan',
      status: APPLICATION_STATUS.APPROVED
    });

    await LawyerProfile.create({
      userId: approvedLawyerUser.id,
      headline: 'Advocate High Court | Family & Civil Specialist',
      about: 'Extensive experience in family disputes, custody, and inheritance partition.',
      languages: ['Urdu', 'English'],
      slotMinutes: 30,
      isPublic: true
    });

    // 4. Unapproved Lawyer User
    unapprovedLawyerUser = await User.create({
      name: 'Unapproved Lawyer',
      email: `unapp_lawyer_${ts}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER,
      isActive: true,
      emailVerifiedAt: new Date()
    });
    unapprovedLawyerToken = generateToken(unapprovedLawyerUser);

    await LawyerApplication.create({
      userId: unapprovedLawyerUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `BC-UNAPP-${ts}`,
      courtLevel: 'Advocate Lower Courts',
      city: 'Lahore',
      practiceAreas: ['Criminal'],
      experienceYears: 1,
      chamberAddress: 'Chamber 5, Sessions Court Lahore',
      status: APPLICATION_STATUS.PENDING
    });

    // 5. Admin User
    adminUser = await User.create({
      name: 'System Admin',
      email: `admin_feed_${ts}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.ADMIN,
      isActive: true,
      emailVerifiedAt: new Date()
    });
    adminToken = generateToken(adminUser);
  });

  describe('1. GET /api/v1/feed (Public listing)', () => {
    it('should allow unauthenticated visitors to list questions', async () => {
      const res = await request(app).get('/api/v1/feed');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('limit');
    });
  });

  describe('2. POST /api/v1/feed (Client creates a question)', () => {
    it('should allow authenticated client to post a legal question', async () => {
      const payload = {
        title: 'Dispute over inheritance property partition in Multan',
        practiceArea: 'Family',
        city: 'Multan',
        content: 'My grandfather passed away leaving agricultural land. One uncle refuses partition. What legal remedies are available?'
      };

      const res = await request(app)
        .post('/api/v1/feed')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('question');
      expect(res.body.question.title).toBe(payload.title);
      expect(res.body.question.practiceArea).toBe('Family');
      expect(res.body.question.status).toBe('open');

      testQuestion = res.body.question;
    });

    it('should reject question with missing fields with 400', async () => {
      const res = await request(app)
        .post('/api/v1/feed')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ title: 'Short' });

      expect(res.status).toBe(400);
    });

    it('should reject lawyer attempting to create a client question with 403', async () => {
      const res = await request(app)
        .post('/api/v1/feed')
        .set('Authorization', `Bearer ${approvedLawyerToken}`)
        .send({
          title: 'Lawyer asking question',
          practiceArea: 'Civil',
          content: 'This should be rejected because only clients post questions.'
        });

      expect(res.status).toBe(403);
    });
  });

  describe('3. GET /api/v1/feed/:id (Public question detail)', () => {
    it('should allow public visitors to read question details with masked client name', async () => {
      const res = await request(app).get(`/api/v1/feed/${testQuestion.id}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(testQuestion.id);
      expect(res.body.clientName).toContain('Chaudhry');
      expect(res.body).toHaveProperty('answers');
      expect(Array.isArray(res.body.answers)).toBe(true);
    });
  });

  describe('4. POST /api/v1/feed/:id/answers (Lawyer answers question)', () => {
    it('should allow approved advocate to post an answer', async () => {
      const payload = {
        content: 'Under the Partition Act 1893 and West Pakistan Land Revenue Act, you should file a suit for partition before the Civil Court or Revenue Officer.'
      };

      const res = await request(app)
        .post(`/api/v1/feed/${testQuestion.id}/answers`)
        .set('Authorization', `Bearer ${approvedLawyerToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('answer');
      expect(res.body.answer.content).toBe(payload.content);
    });

    it('should reject unapproved lawyer with 403', async () => {
      const res = await request(app)
        .post(`/api/v1/feed/${testQuestion.id}/answers`)
        .set('Authorization', `Bearer ${unapprovedLawyerToken}`)
        .send({
          content: 'Unapproved advice that should not be published.'
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Only admin-reviewed approved advocates');
    });

    it('should reject client attempting to answer a legal question with 403', async () => {
      const res = await request(app)
        .post(`/api/v1/feed/${testQuestion.id}/answers`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          content: 'Clients cannot provide formal legal advice on feed.'
        });

      expect(res.status).toBe(403);
    });

    it('should verify answer is included with lawyer card metadata in GET /api/v1/feed/:id', async () => {
      const res = await request(app).get(`/api/v1/feed/${testQuestion.id}`);
      expect(res.status).toBe(200);
      expect(res.body.answersCount).toBe(1);
      expect(res.body.answers.length).toBe(1);

      const firstAns = res.body.answers[0];
      expect(firstAns.lawyer.name).toBe('Advocate Fatima Noor');
      expect(firstAns.lawyer.barCouncil).toBe('Punjab Bar Council');
      expect(firstAns.lawyer.courtLevel).toBe('Advocate High Court');
      expect(firstAns.lawyer.isApproved).toBe(true);
    });
  });

  describe('5. PATCH /api/v1/feed/:id/close (Client closes question)', () => {
    it('should reject non-owner client attempting to close question with 403', async () => {
      const res = await request(app)
        .patch(`/api/v1/feed/${testQuestion.id}/close`)
        .set('Authorization', `Bearer ${otherClientToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow owner client to close their question', async () => {
      const res = await request(app)
        .patch(`/api/v1/feed/${testQuestion.id}/close`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.question.status).toBe('closed');
    });

    it('should reject subsequent lawyer answers on closed question with 400', async () => {
      const res = await request(app)
        .post(`/api/v1/feed/${testQuestion.id}/answers`)
        .set('Authorization', `Bearer ${approvedLawyerToken}`)
        .send({
          content: 'Attempting to answer closed question.'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('closed');
    });
  });

  describe('6. DELETE /api/v1/feed/:id (Admin moderation & Owner deletion)', () => {
    let questionToDelete;

    beforeEach(async () => {
      questionToDelete = await CommunityQuestion.create({
        clientId: clientUser.id,
        title: 'Temporary question for deletion tests',
        practiceArea: 'Civil',
        city: 'Lahore',
        content: 'This question will be deleted in the test suite.',
        status: 'open',
        answersCount: 0
      });
    });

    it('should reject unauthenticated deletion with 401', async () => {
      const res = await request(app).delete(`/api/v1/feed/${questionToDelete.id}`);
      expect(res.status).toBe(401);
    });

    it('should reject non-owner client attempting to delete with 403', async () => {
      const res = await request(app)
        .delete(`/api/v1/feed/${questionToDelete.id}`)
        .set('Authorization', `Bearer ${otherClientToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow author client to delete their own question with 200', async () => {
      const res = await request(app)
        .delete(`/api/v1/feed/${questionToDelete.id}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted');

      const found = await CommunityQuestion.findByPk(questionToDelete.id);
      expect(found).toBeNull();
    });

    it('should allow administrator to delete suspicious question under moderation with 200', async () => {
      const res = await request(app)
        .delete(`/api/v1/feed/${questionToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('moderation');

      const found = await CommunityQuestion.findByPk(questionToDelete.id);
      expect(found).toBeNull();
    });

    it('should return 404 when deleting a non-existent question', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .delete(`/api/v1/feed/${fakeUuid}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
