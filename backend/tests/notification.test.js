const request = require('supertest');
const app = require('../src/app');
const {
  User,
  LawyerApplication,
  Case,
  Hearing,
  Notification
} = require('../src/models');
const { generateToken } = require('../src/modules/auth/auth.service');
const { createNotification } = require('../src/modules/notification/notification.service');
const { runReminderSweep, calculateMilestoneTimestamps } = require('../src/modules/notification/reminder.service');
const { getOutbox, clearOutbox } = require('../src/utils/mailer');
const { NOTIFICATION_TYPES, REMINDER_MILESTONES, EMAIL_STATUSES } = require('../src/constants/notification');
const { TEST_EMAIL_SUFFIX } = require('./setup');

describe('Phase 3 Part M: Notifications, Email Delivery & Reminders', () => {
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

  const uniqueSuffix = () => `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  beforeAll(async () => {
    const passwordHash = 'dummyhash';

    // 1. Advocate User
    lawyerUser = await User.create({
      name: 'Adv. Tariq Mehmood Khokhar',
      email: `tariq_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
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
      experienceYears: 12,
      chamberAddress: 'Chamber 8, District Court Multan',
      status: 'approved'
    });
    lawyerToken = generateToken(lawyerUser);

    // 2. Another Advocate User
    otherLawyerUser = await User.create({
      name: 'Adv. Bilal Hassan',
      email: `bilal_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: 'lawyer'
    });
    await LawyerApplication.create({
      userId: otherLawyerUser.id,
      barCouncil: 'Punjab Bar Council',
      enrolmentNo: `PB-${uniqueSuffix()}`,
      courtLevel: 'High Court',
      city: 'Multan',
      practiceAreas: ['Corporate'],
      experienceYears: 8,
      chamberAddress: 'Chamber 21, High Court Multan',
      status: 'approved'
    });
    otherLawyerToken = generateToken(otherLawyerUser);

    // 3. Client User
    clientUser = await User.create({
      name: 'Chaudhry Riaz Ahmad',
      email: `riaz_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: 'client'
    });
    clientToken = generateToken(clientUser);

    // 4. Other Client User
    otherClientUser = await User.create({
      name: 'Malik Zafar Iqbal',
      email: `zafar_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: 'client'
    });
    otherClientToken = generateToken(otherClientUser);

    // 5. Admin User
    adminUser = await User.create({
      name: 'System Admin',
      email: `admin_${uniqueSuffix()}${TEST_EMAIL_SUFFIX}`,
      passwordHash,
      role: 'admin'
    });
    adminToken = generateToken(adminUser);
  });

  beforeEach(() => {
    clearOutbox();
  });

  describe('1. In-App Notification Listing & Pagination (GET /api/v1/notifications)', () => {
    beforeAll(async () => {
      // Seed notifications for lawyerUser
      await Notification.bulkCreate([
        {
          userId: lawyerUser.id,
          type: NOTIFICATION_TYPES.BOOKING_CREATED,
          title: 'New Consultation Booking',
          body: 'Client Malik has booked a 30-min consultation slot.',
          readAt: null
        },
        {
          userId: lawyerUser.id,
          type: NOTIFICATION_TYPES.DOCUMENT_UPLOADED,
          title: 'Document Uploaded',
          body: 'New certified copy of plaint uploaded.',
          readAt: null
        },
        {
          userId: lawyerUser.id,
          type: NOTIFICATION_TYPES.PAYMENT_RECEIVED,
          title: 'Fee Payment Received',
          body: 'Received Rs. 50,000 via bank transfer.',
          readAt: new Date() // Read
        },
        {
          userId: otherLawyerUser.id,
          type: NOTIFICATION_TYPES.SYSTEM,
          title: 'Chamber Notice',
          body: 'Chamber dues reminder.',
          readAt: null
        }
      ]);
    });

    it('returns paginated notifications for the authenticated user only', async () => {
      const res = await request(app)
        .get('/api/v1/notifications?page=1&limit=2')
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.notifications).toHaveLength(2);
      expect(res.body.pagination).toMatchObject({
        page: 1,
        limit: 2
      });
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(3);
      // Verify all returned notifications belong to the authenticated user
      res.body.notifications.forEach((n) => {
        expect(n.userId).toBe(lawyerUser.id);
      });
    });

    it('filters notifications by read=false (unread only)', async () => {
      const res = await request(app)
        .get('/api/v1/notifications?read=false')
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.notifications.length).toBeGreaterThanOrEqual(2);
      res.body.notifications.forEach((n) => {
        expect(n.readAt).toBeNull();
      });
    });

    it('filters notifications by read=true (read only)', async () => {
      const res = await request(app)
        .get('/api/v1/notifications?read=true')
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.notifications.length).toBeGreaterThanOrEqual(1);
      res.body.notifications.forEach((n) => {
        expect(n.readAt).not.toBeNull();
      });
    });

    it('filters notifications by type', async () => {
      const res = await request(app)
        .get(`/api/v1/notifications?type=${NOTIFICATION_TYPES.PAYMENT_RECEIVED}`)
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.notifications.length).toBeGreaterThanOrEqual(1);
      res.body.notifications.forEach((n) => {
        expect(n.type).toBe(NOTIFICATION_TYPES.PAYMENT_RECEIVED);
      });
    });
  });

  describe('2. Unread Badge Counter (GET /api/v1/notifications/unread-count)', () => {
    it('accurately counts unread notifications for the caller', async () => {
      // Clear out previous notifications for clientUser
      await Notification.destroy({ where: { userId: clientUser.id } });

      await Notification.bulkCreate([
        {
          userId: clientUser.id,
          type: NOTIFICATION_TYPES.CASE_ASSIGNED,
          title: 'Case Assigned',
          body: 'Adv. Tariq Mehmood has accepted your case representation.',
          readAt: null
        },
        {
          userId: clientUser.id,
          type: NOTIFICATION_TYPES.HEARING_SCHEDULED,
          title: 'Hearing Scheduled',
          body: 'Court date scheduled for 15 Nov.',
          readAt: null
        },
        {
          userId: clientUser.id,
          type: NOTIFICATION_TYPES.DOCUMENT_UPLOADED,
          title: 'Stay Order Shared',
          body: 'Interim stay order copy shared.',
          readAt: new Date() // Read
        }
      ]);

      const res = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ count: 2 });
    });
  });

  describe('3. Mark Notification as Read (PATCH /api/v1/notifications/:id/read)', () => {
    let unreadNotification;

    beforeEach(async () => {
      unreadNotification = await Notification.create({
        userId: clientUser.id,
        type: NOTIFICATION_TYPES.SYSTEM,
        title: 'Security Alert',
        body: 'New login detected from Multan IP.',
        readAt: null
      });
    });

    it('successfully marks an unread notification as read', async () => {
      const res = await request(app)
        .patch(`/api/v1/notifications/${unreadNotification.id}/read`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.readAt).not.toBeNull();

      // Verify in DB
      const refreshed = await Notification.findByPk(unreadNotification.id);
      expect(refreshed.readAt).not.toBeNull();
    });

    it('is idempotent when called multiple times on an already read notification', async () => {
      // First call
      const res1 = await request(app)
        .patch(`/api/v1/notifications/${unreadNotification.id}/read`)
        .set('Authorization', `Bearer ${clientToken}`);
      expect(res1.status).toBe(200);
      const originalReadAt = res1.body.data.readAt;

      // Second call
      const res2 = await request(app)
        .patch(`/api/v1/notifications/${unreadNotification.id}/read`)
        .set('Authorization', `Bearer ${clientToken}`);
      expect(res2.status).toBe(200);
      expect(new Date(res2.body.data.readAt).getTime()).toBe(new Date(originalReadAt).getTime());
    });

    it('forbids another user from marking a notification as read (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/v1/notifications/${unreadNotification.id}/read`)
        .set('Authorization', `Bearer ${otherClientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('returns 404 Not Found for non-existent notification UUID', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/00000000-0000-0000-0000-000000000000/read')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('4. Mark All as Read (PATCH /api/v1/notifications/read-all)', () => {
    it('marks all unread notifications for caller as read', async () => {
      // Ensure clientUser has unread items
      await Notification.bulkCreate([
        {
          userId: clientUser.id,
          type: NOTIFICATION_TYPES.BOOKING_CONFIRMED,
          title: 'Booking Confirmed',
          body: 'Your slot is confirmed.',
          readAt: null
        },
        {
          userId: clientUser.id,
          type: NOTIFICATION_TYPES.DOCUMENT_UPLOADED,
          title: 'Power of Attorney',
          body: 'Vakalatnama ready for signature.',
          readAt: null
        }
      ]);

      const res = await request(app)
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.updatedCount).toBeGreaterThanOrEqual(2);

      // Verify unread count is now 0
      const countRes = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${clientToken}`);
      expect(countRes.body.count).toBe(0);
    });
  });

  describe('5. Mailer Integration & Email Dispatch', () => {
    it('dispatches email to in-memory test outbox when sendEmail is true', async () => {
      const created = await createNotification({
        userId: clientUser.id,
        type: NOTIFICATION_TYPES.BOOKING_CONFIRMED,
        title: 'Chamber Appointment Confirmed',
        body: 'Please arrive at Chamber 8 at 11:00 AM on Monday.',
        sendEmail: true,
        emailSubject: 'Court Appointment Confirmation'
      });

      expect(created.emailStatus).toBe(EMAIL_STATUSES.SENT);

      const outbox = getOutbox();
      expect(outbox.length).toBe(1);
      expect(outbox[0].to).toBe(clientUser.email);
      expect(outbox[0].subject).toBe('Court Appointment Confirmation');
      expect(outbox[0].text).toContain('Please arrive at Chamber 8');
    });

    it('skips email dispatch when sendEmail is false', async () => {
      const created = await createNotification({
        userId: clientUser.id,
        type: NOTIFICATION_TYPES.BOOKING_CONFIRMED,
        title: 'Silent In-App Alert',
        body: 'In-app notification only.',
        sendEmail: false
      });

      expect(created.emailStatus).toBe(EMAIL_STATUSES.SKIPPED);
      expect(getOutbox().length).toBe(0);
    });
  });

  describe('6. Court Hearing Reminder Sweep (runReminderSweep)', () => {
    let testCase;
    let hearingShared;
    let hearingPrivate;

    // Hearing date: 2026-11-10 10:00:00 PKT (05:00:00 UTC)
    const hearingScheduledAt = new Date(Date.UTC(2026, 10, 10, 5, 0, 0));

    beforeAll(async () => {
      testCase = await Case.create({
        lawyerId: lawyerUser.id,
        clientId: clientUser.id,
        title: 'Ghulam Rasool v. Revenue Patwari (Title Dispute)',
        court: 'District Court, Multan',
        practiceArea: 'Property',
        status: 'Active',
        stage: 'Arguments'
      });

      // Hearing 1: Shared hearing
      hearingShared = await Hearing.create({
        caseId: testCase.id,
        scheduledAt: hearingScheduledAt,
        court: 'District Court, Multan',
        bench: 'Court Room No. 3',
        stage: 'Arguments',
        visibility: 'shared',
        note: 'CONFIDENTIAL: Focus cross-examination on boundary demarcation',
        clientExplanation: 'Arguments scheduled on boundary survey report'
      });

      // Hearing 2: Private chamber hearing
      hearingPrivate = await Hearing.create({
        caseId: testCase.id,
        scheduledAt: hearingScheduledAt,
        court: 'Chamber / Pre-trial Conference',
        stage: 'Chamber Review',
        visibility: 'private',
        note: 'Internal advocate prep conference',
        clientExplanation: null
      });
    });

    it('calculates accurate milestone trigger timestamps in Pakistan Standard Time (UTC+5)', () => {
      const milestones = calculateMilestoneTimestamps(hearingScheduledAt);

      // Milestone 1: 3 Days Prior -> 2026-11-07 09:00:00 PKT (04:00:00 UTC)
      expect(milestones[REMINDER_MILESTONES.THREE_DAYS_PRIOR].toISOString()).toBe(
        '2026-11-07T04:00:00.000Z'
      );

      // Milestone 2: Night Before -> 2026-11-09 20:00:00 PKT (15:00:00 UTC)
      expect(milestones[REMINDER_MILESTONES.NIGHT_BEFORE].toISOString()).toBe(
        '2026-11-09T15:00:00.000Z'
      );

      // Milestone 3: Morning Of -> 2026-11-10 07:00:00 PKT (02:00:00 UTC)
      expect(milestones[REMINDER_MILESTONES.MORNING_OF].toISOString()).toBe(
        '2026-11-10T02:00:00.000Z'
      );
    });

    it('dispatches reminders at 3_days_prior milestone to lawyer and client (shared hearing)', async () => {
      // Set evaluation clock to 2026-11-07 09:05:00 PKT (04:05:00 UTC)
      const sweepNow = new Date(Date.UTC(2026, 10, 7, 4, 5, 0));

      const result = await runReminderSweep(sweepNow);
      expect(result.remindersSent).toBeGreaterThanOrEqual(2);

      // Verify lawyer received the reminder
      const lawyerNotification = await Notification.findOne({
        where: {
          userId: lawyerUser.id,
          type: NOTIFICATION_TYPES.HEARING_REMINDER,
          'metadata.hearingId': hearingShared.id,
          'metadata.milestone': REMINDER_MILESTONES.THREE_DAYS_PRIOR
        }
      });
      expect(lawyerNotification).not.toBeNull();
      expect(lawyerNotification.title).toContain('Upcoming Hearing in 3 Days');

      // Verify client received the reminder for shared hearing
      const clientNotification = await Notification.findOne({
        where: {
          userId: clientUser.id,
          type: NOTIFICATION_TYPES.HEARING_REMINDER,
          'metadata.hearingId': hearingShared.id,
          'metadata.milestone': REMINDER_MILESTONES.THREE_DAYS_PRIOR
        }
      });
      expect(clientNotification).not.toBeNull();
      expect(clientNotification.title).toContain('Upcoming Hearing in 3 Days');
      // STRICT PRIVACY: Client body must NOT leak the private chamber note
      expect(clientNotification.body).not.toContain('CONFIDENTIAL: Focus cross-examination');
      expect(clientNotification.body).toContain('Arguments scheduled on boundary survey report');
    });

    it('NEVER sends reminder to client for private hearing (Confidentiality Protection)', async () => {
      // Check client notifications for hearingPrivate
      const clientPrivateReminder = await Notification.findOne({
        where: {
          userId: clientUser.id,
          type: NOTIFICATION_TYPES.HEARING_REMINDER,
          'metadata.hearingId': hearingPrivate.id
        }
      });
      expect(clientPrivateReminder).toBeNull();
    });

    it('is strictly idempotent — second sweep at same time generates 0 new reminders', async () => {
      const sweepNow = new Date(Date.UTC(2026, 10, 7, 4, 5, 0));
      const secondSweep = await runReminderSweep(sweepNow);
      expect(secondSweep.remindersSent).toBe(0);
    });
  });

  describe('7. Authentication & Security Boundaries', () => {
    it('returns 401 Unauthorized across all notification endpoints when token is missing', async () => {
      const listRes = await request(app).get('/api/v1/notifications');
      expect(listRes.status).toBe(401);

      const countRes = await request(app).get('/api/v1/notifications/unread-count');
      expect(countRes.status).toBe(401);

      const readAllRes = await request(app).patch('/api/v1/notifications/read-all');
      expect(readAllRes.status).toBe(401);

      const readOneRes = await request(app).patch(
        '/api/v1/notifications/00000000-0000-0000-0000-000000000000/read'
      );
      expect(readOneRes.status).toBe(401);
    });
  });
});
