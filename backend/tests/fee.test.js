const request = require('supertest');
const app = require('../src/app');
const {
  User,
  LawyerApplication,
  Case,
  FeeAgreement,
  FeePayment
} = require('../src/models');
const { generateToken } = require('../src/modules/auth/auth.service');
const { TEST_EMAIL_SUFFIX } = require('./setup');

describe('Phase 3 Part K: Case Fees & Payment Ledger', () => {
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
  let freshCase;

  const uniqueSuffix = () => `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  beforeAll(async () => {
    const passwordHash = 'dummyhash';

    // 1. Owning Approved Advocate
    lawyerUser = await User.create({
      name: 'Adv. Mian Khurram Shahzad',
      email: `khurram_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
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
      experienceYears: 15,
      chamberAddress: 'Chamber 18, High Court Bar Multan',
      status: 'approved'
    });
    lawyerToken = generateToken(lawyerUser);

    // 2. Another Approved Advocate
    otherLawyerUser = await User.create({
      name: 'Adv. Rana Tanveer Ahmad',
      email: `tanveer_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
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
      experienceYears: 10,
      chamberAddress: 'Chamber 2, District Courts Multan',
      status: 'approved'
    });
    otherLawyerToken = generateToken(otherLawyerUser);

    // 3. Linked Litigant Client
    clientUser = await User.create({
      name: 'Chaudhry Ghulam Murtaza',
      email: `murtaza_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: 'client'
    });
    clientToken = generateToken(clientUser);

    // 4. Unlinked Client
    otherClientUser = await User.create({
      name: 'Sheikh Bilal Qureshi',
      email: `bilal_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: 'client'
    });
    otherClientToken = generateToken(otherClientUser);

    // 5. Administrator
    adminUser = await User.create({
      name: 'Multan Registry Admin',
      email: `admin_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: 'admin'
    });
    adminToken = generateToken(adminUser);

    // 6. Test Case File with Linked Client
    testCase = await Case.create({
      lawyerId: lawyerUser.id,
      clientId: clientUser.id,
      title: 'Ghulam Murtaza vs Revenue Board Multan',
      practiceArea: 'Property',
      court: 'District Court, Multan',
      caseOrFirNumber: 'Civil Suit No. 89/2026',
      status: 'Active',
      stage: 'Pleadings'
    });

    // 7. Fresh Case File without Fee Agreement
    freshCase = await Case.create({
      lawyerId: lawyerUser.id,
      clientId: clientUser.id,
      title: 'Fresh Declaratory Suit Without Fee Agreement',
      practiceArea: 'Civil',
      court: 'District Court, Multan',
      caseOrFirNumber: 'Suit No. 101/2026',
      status: 'Prospect',
      stage: 'Pleadings'
    });
  });

  describe('1. Fee Agreement Upsert (PUT /cases/:id/fee-agreement)', () => {
    it('allows assigned advocate to create an initial fee agreement', async () => {
      const res = await request(app)
        .put(`/api/v1/cases/${testCase.id}/fee-agreement`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          type: 'fixed',
          agreedAmountPkr: 150000,
          notes: 'Complete representation through final judgment'
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/Fee agreement saved successfully/i);
      expect(res.body.feeAgreement).toBeDefined();
      expect(res.body.feeAgreement.caseId).toBe(testCase.id);
      expect(res.body.feeAgreement.type).toBe('fixed');
      expect(res.body.feeAgreement.agreedAmountPkr).toBe(150000);
      expect(res.body.feeAgreement.notes).toBe('Complete representation through final judgment');
    });

    it('allows assigned advocate to update an existing fee agreement (upsert update)', async () => {
      const res = await request(app)
        .put(`/api/v1/cases/${testCase.id}/fee-agreement`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          type: 'stage_wise',
          agreedAmountPkr: 180000,
          notes: 'Updated terms: Rs. 60k pleadings, Rs. 60k evidence, Rs. 60k arguments'
        });

      expect(res.status).toBe(200);
      expect(res.body.feeAgreement.type).toBe('stage_wise');
      expect(res.body.feeAgreement.agreedAmountPkr).toBe(180000);
      expect(res.body.feeAgreement.notes).toMatch(/Updated terms/);

      // Verify database has exactly 1 fee agreement row for this case
      const count = await FeeAgreement.count({ where: { caseId: testCase.id } });
      expect(count).toBe(1);
    });

    it('rejects invalid agreement type', async () => {
      const res = await request(app)
        .put(`/api/v1/cases/${testCase.id}/fee-agreement`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          type: 'hourly',
          agreedAmountPkr: 50000
        });

      expect(res.status).toBe(400);
      expect(res.body.details.some((d) => /Agreement type must be one of/i.test(d.message))).toBe(true);
    });

    it('rejects negative agreed amount', async () => {
      const res = await request(app)
        .put(`/api/v1/cases/${testCase.id}/fee-agreement`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          type: 'fixed',
          agreedAmountPkr: -5000
        });

      expect(res.status).toBe(400);
      expect(res.body.details.some((d) => /cannot be less than 0/i.test(d.message))).toBe(true);
    });

    it('rejects agreed amount exceeding 100,000,000 PKR', async () => {
      const res = await request(app)
        .put(`/api/v1/cases/${testCase.id}/fee-agreement`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          type: 'fixed',
          agreedAmountPkr: 100000001
        });

      expect(res.status).toBe(400);
      expect(res.body.details.some((d) => /cannot exceed 100000000/i.test(d.message))).toBe(true);
    });

    it('rejects notes exceeding 500 characters', async () => {
      const res = await request(app)
        .put(`/api/v1/cases/${testCase.id}/fee-agreement`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          type: 'fixed',
          agreedAmountPkr: 50000,
          notes: 'A'.repeat(501)
        });

      expect(res.status).toBe(400);
      expect(res.body.details.some((d) => /notes cannot exceed 500 characters/i.test(d.message))).toBe(true);
    });
  });

  describe('2. Fee Payments Recording (POST /cases/:id/payments)', () => {
    it('allows assigned advocate to record a cash payment', async () => {
      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/payments`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          amountPkr: 50000,
          method: 'cash',
          paidOn: '2026-10-25',
          note: 'Chamber initial advance cash'
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toMatch(/Payment recorded successfully/i);
      expect(res.body.payment).toBeDefined();
      expect(res.body.payment.amountPkr).toBe(50000);
      expect(res.body.payment.method).toBe('cash');
      expect(res.body.payment.paidOn).toBe('2026-10-25');
      expect(res.body.payment.note).toBe('Chamber initial advance cash');
    });

    it('allows assigned advocate to record a bank transfer with reference', async () => {
      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/payments`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          amountPkr: 60000,
          method: 'bank',
          reference: 'HBL-IBFT-99881122',
          paidOn: '2026-10-26',
          note: 'Stage 2 bank transfer via online banking'
        });

      expect(res.status).toBe(201);
      expect(res.body.payment.amountPkr).toBe(60000);
      expect(res.body.payment.method).toBe('bank');
      expect(res.body.payment.reference).toBe('HBL-IBFT-99881122');
    });

    it('allows assigned advocate to record jazzcash and cheque payments', async () => {
      // JazzCash
      const jcRes = await request(app)
        .post(`/api/v1/cases/${testCase.id}/payments`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          amountPkr: 20000,
          method: 'jazzcash',
          reference: 'JC-882299',
          paidOn: '2026-10-26'
        });
      expect(jcRes.status).toBe(201);
      expect(jcRes.body.payment.method).toBe('jazzcash');

      // Cheque
      const chqRes = await request(app)
        .post(`/api/v1/cases/${testCase.id}/payments`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          amountPkr: 10000,
          method: 'cheque',
          reference: 'CHQ-004512',
          paidOn: '2026-10-27',
          note: 'Post-dated crossed cheque'
        });
      expect(chqRes.status).toBe(201);
      expect(chqRes.body.payment.method).toBe('cheque');
    });

    it('rejects payment with zero or negative amount', async () => {
      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/payments`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          amountPkr: 0,
          method: 'cash',
          paidOn: '2026-10-27'
        });

      expect(res.status).toBe(400);
      expect(res.body.details.some((d) => /amountPkr must be at least 1/i.test(d.message))).toBe(true);
    });

    it('rejects payment with invalid method', async () => {
      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/payments`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          amountPkr: 1000,
          method: 'bitcoin',
          paidOn: '2026-10-27'
        });

      expect(res.status).toBe(400);
      expect(res.body.details.some((d) => /method must be one of/i.test(d.message))).toBe(true);
    });

    it('rejects payment with invalid paidOn date format', async () => {
      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/payments`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          amountPkr: 1000,
          method: 'cash',
          paidOn: '27-10-2026'
        });

      expect(res.status).toBe(400);
      expect(res.body.details.some((d) => /YYYY-MM-DD/i.test(d.message))).toBe(true);
    });

    it('rejects payment with reference exceeding 60 chars', async () => {
      const res = await request(app)
        .post(`/api/v1/cases/${testCase.id}/payments`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          amountPkr: 1000,
          method: 'bank',
          paidOn: '2026-10-27',
          reference: 'R'.repeat(61)
        });

      expect(res.status).toBe(400);
      expect(res.body.details.some((d) => /reference cannot exceed 60 characters/i.test(d.message))).toBe(true);
    });
  });

  describe('3. Fee Ledger Retrieval & Dynamic Calculations (GET /cases/:id/fees)', () => {
    it('calculates agreed, paid sum, and remaining balance accurately', async () => {
      // Current state: agreed = 180,000; payments = 50,000 + 60,000 + 20,000 + 10,000 = 140,000; balance = 40,000
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}/fees`)
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.agreed).toBe(180000);
      expect(res.body.paid).toBe(140000);
      expect(res.body.balance).toBe(40000);
      expect(res.body.feeAgreement).toBeDefined();
      expect(res.body.feeAgreement.type).toBe('stage_wise');
      expect(Array.isArray(res.body.payments)).toBe(true);
      expect(res.body.payments.length).toBe(4);
    });

    it('displays negative balance as is when client payments exceed agreed amount (advance/overpayment)', async () => {
      // Record an additional payment of Rs. 50,000 (total paid = 190,000, agreed = 180,000)
      await request(app)
        .post(`/api/v1/cases/${testCase.id}/payments`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          amountPkr: 50000,
          method: 'bank',
          reference: 'ADVANCE-PAY-EXTRA',
          paidOn: '2026-10-27',
          note: 'Advance deposit covering future stage expenses'
        });

      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}/fees`)
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.agreed).toBe(180000);
      expect(res.body.paid).toBe(190000);
      // Balance is strictly agreed - paid: 180,000 - 190,000 = -10,000
      expect(res.body.balance).toBe(-10000);
    });

    it('returns zero agreed, zero paid, zero balance, and null feeAgreement when no agreement has been set', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${freshCase.id}/fees`)
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.agreed).toBe(0);
      expect(res.body.paid).toBe(0);
      expect(res.body.balance).toBe(0);
      expect(res.body.feeAgreement).toBeNull();
      expect(res.body.payments).toEqual([]);
    });

    it('allows linked client to retrieve the fee ledger (200 OK)', async () => {
      const res = await request(app)
        .get(`/api/v1/cases/${testCase.id}/fees`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.agreed).toBe(180000);
      expect(res.body.paid).toBe(190000);
      expect(res.body.balance).toBe(-10000);
      expect(res.body.feeAgreement).toBeDefined();
      expect(res.body.payments.length).toBe(5);
    });
  });

  describe('4. Strict 6-Role Permission Matrix & Admin Privacy Barrier', () => {
    it('forbids linked client from setting fee agreements or recording payments', async () => {
      const putRes = await request(app)
        .put(`/api/v1/cases/${testCase.id}/fee-agreement`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ type: 'fixed', agreedAmountPkr: 50000 });
      expect(putRes.status).toBe(403);

      const postRes = await request(app)
        .post(`/api/v1/cases/${testCase.id}/payments`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ amountPkr: 5000, method: 'cash', paidOn: '2026-10-27' });
      expect(postRes.status).toBe(403);
    });

    it('forbids an advocate from another chamber from accessing fee endpoints', async () => {
      const getRes = await request(app)
        .get(`/api/v1/cases/${testCase.id}/fees`)
        .set('Authorization', `Bearer ${otherLawyerToken}`);
      expect(getRes.status).toBe(403);

      const putRes = await request(app)
        .put(`/api/v1/cases/${testCase.id}/fee-agreement`)
        .set('Authorization', `Bearer ${otherLawyerToken}`)
        .send({ type: 'fixed', agreedAmountPkr: 50000 });
      expect(putRes.status).toBe(403);

      const postRes = await request(app)
        .post(`/api/v1/cases/${testCase.id}/payments`)
        .set('Authorization', `Bearer ${otherLawyerToken}`)
        .send({ amountPkr: 5000, method: 'cash', paidOn: '2026-10-27' });
      expect(postRes.status).toBe(403);
    });

    it('forbids an unlinked litigant client from accessing fee endpoints', async () => {
      const getRes = await request(app)
        .get(`/api/v1/cases/${testCase.id}/fees`)
        .set('Authorization', `Bearer ${otherClientToken}`);
      expect(getRes.status).toBe(403);
    });

    it('forbids platform administrator from accessing fee records (Financial Privacy Barrier)', async () => {
      const getRes = await request(app)
        .get(`/api/v1/cases/${testCase.id}/fees`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(getRes.status).toBe(403);
      expect(getRes.body.error).toMatch(/administrators have no access to confidential/i);

      const putRes = await request(app)
        .put(`/api/v1/cases/${testCase.id}/fee-agreement`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'fixed', agreedAmountPkr: 50000 });
      expect(putRes.status).toBe(403);

      const postRes = await request(app)
        .post(`/api/v1/cases/${testCase.id}/payments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amountPkr: 5000, method: 'cash', paidOn: '2026-10-27' });
      expect(postRes.status).toBe(403);
    });

    it('returns 401 Unauthorized when no JWT token is provided', async () => {
      const res = await request(app).get(`/api/v1/cases/${testCase.id}/fees`);
      expect(res.status).toBe(401);
    });

    it('returns 404 Not Found for non-existent case', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/v1/cases/${fakeUuid}/fees`)
        .set('Authorization', `Bearer ${lawyerToken}`);
      expect(res.status).toBe(404);
    });
  });
});
