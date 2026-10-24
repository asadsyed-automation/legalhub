const request = require('supertest');
const app = require('../src/app');
const {
  User,
  LawyerApplication,
  LawyerProfile,
  AvailabilityRule,
  BlockedDate
} = require('../src/models');
const { generateToken } = require('../src/modules/auth/auth.service');
const { ROLES, APPLICATION_STATUS } = require('../src/constants');
const {
  generateSlots,
  timeStrToMinutes,
  minutesToTimeStr,
  getIsoWeekday
} = require('../src/modules/availability/slotEngine');
const {
  getTodayKarachiDateStr
} = require('../src/modules/availability/availability.schemas');

const TEST_EMAIL_SUFFIX = '@test.legalhub.local';

describe('Part E: Availability Rules, Blocked Dates, and Real-Time Slot Generator', () => {
  let clientUser, pendingLawyerUser, rejectedLawyerUser, approvedLawyer1, approvedLawyer2;
  let clientToken, pendingToken, rejectedToken, lawyer1Token, lawyer2Token;
  let lawyer1App, lawyer2App;

  beforeAll(async () => {
    const timestamp = Date.now();

    // 1. Client user
    clientUser = await User.create({
      name: 'Client Tariq',
      email: `client_avail_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.CLIENT
    });
    clientToken = generateToken(clientUser);

    // 2. Pending lawyer
    pendingLawyerUser = await User.create({
      name: 'Advocate Pending Avail',
      email: `pending_avail_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER
    });
    pendingToken = generateToken(pendingLawyerUser);
    await LawyerApplication.create({
      userId: pendingLawyerUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `PBC-PEND-AV-${timestamp}`,
      courtLevel: 'Advocate High Court',
      city: 'Multan',
      practiceAreas: ['Civil'],
      experienceYears: 4,
      chamberAddress: 'Chamber 4, District Courts Multan',
      bio: 'Civil disputes lawyer.',
      status: APPLICATION_STATUS.PENDING
    });

    // 3. Rejected lawyer
    rejectedLawyerUser = await User.create({
      name: 'Advocate Rejected Avail',
      email: `rej_avail_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER
    });
    rejectedToken = generateToken(rejectedLawyerUser);
    await LawyerApplication.create({
      userId: rejectedLawyerUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `PBC-REJ-AV-${timestamp}`,
      courtLevel: 'Advocate Lower Courts',
      city: 'Lahore',
      practiceAreas: ['Tax'],
      experienceYears: 2,
      chamberAddress: 'Chamber 12, Lahore High Court',
      bio: 'Tax consultant.',
      status: APPLICATION_STATUS.REJECTED,
      rejectionReason: 'Invalid Bar enrollment documents.'
    });

    // 4. Approved lawyer 1 (Main test advocate, 30 min slots)
    approvedLawyer1 = await User.create({
      name: 'Advocate Haris Rauf',
      email: `haris_avail_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER
    });
    lawyer1Token = generateToken(approvedLawyer1);
    lawyer1App = await LawyerApplication.create({
      userId: approvedLawyer1.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `PBC-APP1-AV-${timestamp}`,
      courtLevel: 'Advocate High Court',
      city: 'Multan',
      practiceAreas: ['Corporate', 'Property'],
      experienceYears: 10,
      chamberAddress: 'Chamber 22, High Court Multan Bench',
      bio: 'Corporate counsel.',
      status: APPLICATION_STATUS.APPROVED
    });
    await LawyerProfile.create({
      userId: approvedLawyer1.id,
      headline: 'Corporate Counsel Multan',
      about: 'Advising corporations and individuals.',
      languages: ['Urdu', 'English'],
      slotMinutes: 30,
      isPublic: true
    });

    // 5. Approved lawyer 2 (Private schedule advocate for visibility test)
    approvedLawyer2 = await User.create({
      name: 'Advocate Private Schedule',
      email: `private_avail_${timestamp}${TEST_EMAIL_SUFFIX}`,
      passwordHash: 'dummyhash',
      role: ROLES.LAWYER
    });
    lawyer2Token = generateToken(approvedLawyer2);
    lawyer2App = await LawyerApplication.create({
      userId: approvedLawyer2.id,
      barCouncil: 'Sindh Bar Council',
      enrolmentNo: `SBC-APP2-AV-${timestamp}`,
      courtLevel: 'Advocate High Court',
      city: 'Karachi',
      practiceAreas: ['Banking'],
      experienceYears: 8,
      chamberAddress: 'City Courts Karachi',
      bio: 'Banking counsel.',
      status: APPLICATION_STATUS.APPROVED
    });
    await LawyerProfile.create({
      userId: approvedLawyer2.id,
      headline: 'Banking Specialist',
      slotMinutes: 60,
      isPublic: false // Private
    });
  });

  afterAll(async () => {
    // Cleanup created test records
    const userIds = [clientUser?.id, pendingLawyerUser?.id, rejectedLawyerUser?.id, approvedLawyer1?.id, approvedLawyer2?.id].filter(Boolean);
    if (userIds.length > 0) {
      await BlockedDate.destroy({ where: { lawyerId: userIds } }).catch(() => {});
      await AvailabilityRule.destroy({ where: { lawyerId: userIds } }).catch(() => {});
      await LawyerProfile.destroy({ where: { userId: userIds } }).catch(() => {});
      await LawyerApplication.destroy({ where: { userId: userIds } }).catch(() => {});
      await User.destroy({ where: { id: userIds } }).catch(() => {});
    }
  });

  // =========================================================================
  // 1. RBAC & Status Guards
  // =========================================================================
  describe('1. RBAC & Status Guards', () => {
    it('should return 401 Unauthorized when accessing availability without token', async () => {
      const res = await request(app).get('/api/v1/lawyer/availability');
      expect(res.status).toBe(401);
    });

    it('should return 403 Forbidden when a client attempts to access availability routes', async () => {
      const res = await request(app)
        .get('/api/v1/lawyer/availability')
        .set('Authorization', `Bearer ${clientToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/You do not have permission to perform this action/i);
    });

    it('should return 403 Forbidden when a pending advocate accesses availability', async () => {
      const res = await request(app)
        .get('/api/v1/lawyer/availability')
        .set('Authorization', `Bearer ${pendingToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Only approved advocates can manage professional profiles/i);
    });

    it('should return 403 Forbidden when a rejected advocate accesses blocked dates', async () => {
      const res = await request(app)
        .get('/api/v1/lawyer/blocked-dates')
        .set('Authorization', `Bearer ${rejectedToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Only approved advocates can manage professional profiles/i);
    });
  });

  // =========================================================================
  // 2. Weekly Availability Rules Lifecycle (GET/PUT)
  // =========================================================================
  describe('2. Weekly Availability Rules Lifecycle', () => {
    it('should initially return empty rules array for approved advocate', async () => {
      const res = await request(app)
        .get('/api/v1/lawyer/availability')
        .set('Authorization', `Bearer ${lawyer1Token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it('should successfully save weekly rules (e.g. Mon & Wed morning + evening windows)', async () => {
      const payload = {
        rules: [
          { weekday: 1, startTime: '09:00', endTime: '12:00' }, // Mon morning
          { weekday: 1, startTime: '16:00', endTime: '19:00' }, // Mon evening
          { weekday: 3, startTime: '14:00', endTime: '18:00' }  // Wed afternoon
        ]
      };

      const res = await request(app)
        .put('/api/v1/lawyer/availability')
        .set('Authorization', `Bearer ${lawyer1Token}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3);
      expect(res.body[0].weekday).toBe(1);
      expect(res.body[0].startTime).toBe('09:00');
      expect(res.body[1].startTime).toBe('16:00');
      expect(res.body[2].weekday).toBe(3);
    });

    it('should reject invalid weekday (e.g. 0 or 8) with 400 Bad Request', async () => {
      const res = await request(app)
        .put('/api/v1/lawyer/availability')
        .set('Authorization', `Bearer ${lawyer1Token}`)
        .send({
          rules: [{ weekday: 8, startTime: '09:00', endTime: '12:00' }]
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should reject invalid time format (e.g. "9:00" or "25:00") with 400 Bad Request', async () => {
      const res = await request(app)
        .put('/api/v1/lawyer/availability')
        .set('Authorization', `Bearer ${lawyer1Token}`)
        .send({
          rules: [{ weekday: 1, startTime: '9:00', endTime: '12:00' }]
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should reject rule where endTime is before or equal to startTime with 400 Bad Request', async () => {
      const res = await request(app)
        .put('/api/v1/lawyer/availability')
        .set('Authorization', `Bearer ${lawyer1Token}`)
        .send({
          rules: [{ weekday: 1, startTime: '17:00', endTime: '15:00' }]
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details.some((d) => /after startTime/i.test(d.message))).toBe(true);
    });

    it('should reject overlapping windows on the same weekday with 400 Bad Request', async () => {
      const res = await request(app)
        .put('/api/v1/lawyer/availability')
        .set('Authorization', `Bearer ${lawyer1Token}`)
        .send({
          rules: [
            { weekday: 1, startTime: '09:00', endTime: '13:00' },
            { weekday: 1, startTime: '12:00', endTime: '15:00' } // Overlaps 12:00-13:00
          ]
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details.some((d) => /Overlapping/i.test(d.message))).toBe(true);
    });

    it('should reject more than 3 windows on a single weekday with 400 Bad Request', async () => {
      const res = await request(app)
        .put('/api/v1/lawyer/availability')
        .set('Authorization', `Bearer ${lawyer1Token}`)
        .send({
          rules: [
            { weekday: 1, startTime: '08:00', endTime: '10:00' },
            { weekday: 1, startTime: '11:00', endTime: '13:00' },
            { weekday: 1, startTime: '14:00', endTime: '16:00' },
            { weekday: 1, startTime: '17:00', endTime: '19:00' } // 4th window
          ]
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details.some((d) => /exceeds maximum of 3/i.test(d.message))).toBe(true);
    });
  });

  // =========================================================================
  // 3. Blocked Dates Lifecycle (GET/POST/DELETE)
  // =========================================================================
  describe('3. Blocked Dates Lifecycle', () => {
    let createdBlockedId;
    const futureDate1 = '2030-05-15';
    const futureDate2 = '2030-05-16';

    it('should initially return empty blocked dates array', async () => {
      const res = await request(app)
        .get('/api/v1/lawyer/blocked-dates')
        .set('Authorization', `Bearer ${lawyer1Token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it('should successfully add a blocked date with a reason (201 Created)', async () => {
      const res = await request(app)
        .post('/api/v1/lawyer/blocked-dates')
        .set('Authorization', `Bearer ${lawyer1Token}`)
        .send({
          date: futureDate1,
          reason: 'High Court Summer Vacation'
        });

      expect(res.status).toBe(201);
      expect(res.body.date).toBe(futureDate1);
      expect(res.body.reason).toBe('High Court Summer Vacation');
      expect(res.body.id).toBeDefined();
      createdBlockedId = res.body.id;
    });

    it('should reject adding a duplicate blocked date for the same advocate with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/lawyer/blocked-dates')
        .set('Authorization', `Bearer ${lawyer1Token}`)
        .send({
          date: futureDate1,
          reason: 'Duplicate block attempt'
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already blocked/i);
    });

    it('should reject blocking a date in the past with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/lawyer/blocked-dates')
        .set('Authorization', `Bearer ${lawyer1Token}`)
        .send({
          date: '2020-01-01',
          reason: 'Past date'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details.some((d) => /past/i.test(d.message))).toBe(true);
    });

    it('should list configured blocked dates in chronological order', async () => {
      // Add second future date
      await request(app)
        .post('/api/v1/lawyer/blocked-dates')
        .set('Authorization', `Bearer ${lawyer1Token}`)
        .send({
          date: futureDate2,
          reason: 'District Bar Association Strike'
        });

      const res = await request(app)
        .get('/api/v1/lawyer/blocked-dates')
        .set('Authorization', `Bearer ${lawyer1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0].date).toBe(futureDate1);
      expect(res.body[1].date).toBe(futureDate2);
    });

    it('should successfully delete a blocked date by ID', async () => {
      const res = await request(app)
        .delete(`/api/v1/lawyer/blocked-dates/${createdBlockedId}`)
        .set('Authorization', `Bearer ${lawyer1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/removed successfully/i);

      // Verify count decremented
      const checkRes = await request(app)
        .get('/api/v1/lawyer/blocked-dates')
        .set('Authorization', `Bearer ${lawyer1Token}`);
      expect(checkRes.body.length).toBe(1);
    });

    it('should return 404 when deleting a non-existent or other advocate blocked date', async () => {
      const res = await request(app)
        .delete('/api/v1/lawyer/blocked-dates/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${lawyer1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });
  });

  // =========================================================================
  // 4. Public Slot Query API (GET /api/v1/lawyers/:id/slots)
  // =========================================================================
  describe('4. Public Slot Query API', () => {
    const todayStr = getTodayKarachiDateStr();

    it('should return 400 Bad Request when from or to query param is missing', async () => {
      const res = await request(app).get(`/api/v1/lawyers/${lawyer1App.id}/slots`);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should return 400 Bad Request when from date is in the past', async () => {
      const res = await request(app).get(
        `/api/v1/lawyers/${lawyer1App.id}/slots?from=2021-01-01&to=2021-01-05`
      );
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details.some((d) => /past/i.test(d.message))).toBe(true);
    });

    it('should return 400 Bad Request when to is earlier than from', async () => {
      const res = await request(app).get(
        `/api/v1/lawyers/${lawyer1App.id}/slots?from=2030-01-10&to=2030-01-05`
      );
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details.some((d) => /earlier/i.test(d.message))).toBe(true);
    });

    it('should return 400 Bad Request when date range exceeds 14 days', async () => {
      const res = await request(app).get(
        `/api/v1/lawyers/${lawyer1App.id}/slots?from=2030-01-01&to=2030-01-20`
      );
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details.some((d) => /cannot exceed 14 days/i.test(d.message))).toBe(true);
    });

    it('should return 404 when querying slots for an unapproved or non-existent advocate', async () => {
      const res = await request(app).get(
        `/api/v1/lawyers/00000000-0000-0000-0000-000000000000/slots?from=2030-01-01&to=2030-01-05`
      );
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/Advocate profile not found/i);
    });

    it('should return 404 when querying slots for an advocate whose isPublic is false', async () => {
      const res = await request(app).get(
        `/api/v1/lawyers/${lawyer2App.id}/slots?from=2030-01-01&to=2030-01-05`
      );
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/schedule is currently not available/i);
    });

    it('should return sliced slots for approved advocate matching weekday rules', async () => {
      // 2030-06-03 is a Monday (ISO weekday 1)
      // 2030-06-05 is a Wednesday (ISO weekday 3)
      // lawyer1 has:
      // Mon 09:00-12:00 (3 hrs = 6 slots of 30 min) + 16:00-19:00 (3 hrs = 6 slots) -> 12 slots
      // Tue (no rules) -> 0 slots
      // Wed 14:00-18:00 (4 hrs = 8 slots) -> 8 slots
      // Total expected across Mon to Wed: 20 slots
      const res = await request(app).get(
        `/api/v1/lawyers/${lawyer1App.id}/slots?from=2030-06-03&to=2030-06-05`
      );

      expect(res.status).toBe(200);
      expect(res.body.lawyerId).toBe(lawyer1App.id);
      expect(res.body.slotMinutes).toBe(30);
      expect(res.body.timezone).toBe('Asia/Karachi');
      expect(res.body.slots.length).toBe(20);

      // Verify slot structure
      const firstSlot = res.body.slots[0];
      expect(firstSlot.date).toBe('2030-06-03');
      expect(firstSlot.startLocal).toBe('09:00');
      expect(firstSlot.endLocal).toBe('09:30');
      // 09:00 PKT (UTC+5) is 04:00 UTC
      expect(firstSlot.startUtc).toBe('2030-06-03T04:00:00.000Z');
      expect(firstSlot.endUtc).toBe('2030-06-03T04:30:00.000Z');
    });

    it('should omit all slots on a date that is marked as blocked', async () => {
      // Block Monday 2030-06-03
      await request(app)
        .post('/api/v1/lawyer/blocked-dates')
        .set('Authorization', `Bearer ${lawyer1Token}`)
        .send({
          date: '2030-06-03',
          reason: 'Bar Council Youm-e-Ehtijaj'
        });

      // Now query the same range Mon-Wed: Mon has 0 slots (blocked), Wed has 8 slots
      const res = await request(app).get(
        `/api/v1/lawyers/${lawyer1App.id}/slots?from=2030-06-03&to=2030-06-05`
      );

      expect(res.status).toBe(200);
      expect(res.body.slots.length).toBe(8);
      // All remaining slots belong to Wednesday 2030-06-05
      for (const slot of res.body.slots) {
        expect(slot.date).toBe('2030-06-05');
      }
    });
  });

  // =========================================================================
  // 5. Pure Slot Generator Engine Unit Tests
  // =========================================================================
  describe('5. Pure Slot Generator Engine Unit Tests', () => {
    it('should convert time string to minutes and back accurately', () => {
      expect(timeStrToMinutes('00:00')).toBe(0);
      expect(timeStrToMinutes('09:30')).toBe(570);
      expect(timeStrToMinutes('23:59')).toBe(1439);

      expect(minutesToTimeStr(0)).toBe('00:00');
      expect(minutesToTimeStr(570)).toBe('09:30');
      expect(minutesToTimeStr(1439)).toBe('23:59');
    });

    it('should correctly calculate ISO weekdays (Monday = 1, Sunday = 7)', () => {
      expect(getIsoWeekday('2026-10-19')).toBe(1); // Monday
      expect(getIsoWeekday('2026-10-20')).toBe(2); // Tuesday
      expect(getIsoWeekday('2026-10-25')).toBe(7); // Sunday
    });

    it('should enforce MIN_LEAD_MINUTES (120 min) and discard slots within 2 hours of simulated clock', () => {
      // Simulate current time: Monday 2026-10-19 at 10:15 AM PKT (05:15 UTC)
      const simulatedNow = () => new Date('2026-10-19T05:15:00.000Z');

      const rules = [
        { weekday: 1, startTime: '09:00', endTime: '14:00' } // Monday 09:00 - 14:00
      ];

      // Earliest permitted slot must be >= 10:15 + 2 hours = 12:15 PM PKT
      // Slots generated:
      // 09:00, 09:30, 10:00, 10:30, 11:00, 11:30, 12:00 -> ALL DISCARDED (< 12:15)
      // 12:30 -> KEPT
      // 13:00 -> KEPT
      // 13:30 -> KEPT (ends at 14:00)
      const slots = generateSlots({
        rules,
        blockedDates: [],
        busyIntervals: [],
        slotMinutes: 30,
        fromDateStr: '2026-10-19',
        toDateStr: '2026-10-19',
        now: simulatedNow
      });

      expect(slots.length).toBe(3);
      expect(slots[0].startLocal).toBe('12:30');
      expect(slots[1].startLocal).toBe('13:00');
      expect(slots[2].startLocal).toBe('13:30');
    });

    it('should filter out slots that overlap with busy intervals', () => {
      const simulatedNow = () => new Date('2026-10-19T00:00:00.000Z'); // midnight
      const rules = [{ weekday: 1, startTime: '09:00', endTime: '11:00' }]; // 4 slots: 09:00, 09:30, 10:00, 10:30

      // Busy interval: 09:30 to 10:00 PKT (04:30 to 05:00 UTC)
      const busyIntervals = [
        {
          startUtc: '2026-10-19T04:30:00.000Z',
          endUtc: '2026-10-19T05:00:00.000Z'
        }
      ];

      const slots = generateSlots({
        rules,
        blockedDates: [],
        busyIntervals,
        slotMinutes: 30,
        fromDateStr: '2026-10-19',
        toDateStr: '2026-10-19',
        now: simulatedNow
      });

      expect(slots.length).toBe(3);
      expect(slots.map((s) => s.startLocal)).toEqual(['09:00', '10:00', '10:30']);
    });

    it('should generate slots correctly with different slot durations (15m, 60m)', () => {
      const simulatedNow = () => new Date('2026-10-19T00:00:00.000Z');
      const rules = [{ weekday: 1, startTime: '10:00', endTime: '12:00' }]; // 2 hours

      // 15-minute slots: 2 hours * 4 = 8 slots
      const slots15 = generateSlots({
        rules,
        slotMinutes: 15,
        fromDateStr: '2026-10-19',
        toDateStr: '2026-10-19',
        now: simulatedNow
      });
      expect(slots15.length).toBe(8);
      expect(slots15[0].startLocal).toBe('10:00');
      expect(slots15[0].endLocal).toBe('10:15');

      // 60-minute slots: 2 hours / 1 = 2 slots
      const slots60 = generateSlots({
        rules,
        slotMinutes: 60,
        fromDateStr: '2026-10-19',
        toDateStr: '2026-10-19',
        now: simulatedNow
      });
      expect(slots60.length).toBe(2);
      expect(slots60[0].startLocal).toBe('10:00');
      expect(slots60[0].endLocal).toBe('11:00');
      expect(slots60[1].startLocal).toBe('11:00');
      expect(slots60[1].endLocal).toBe('12:00');
    });
  });
});
