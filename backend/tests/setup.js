process.env.NODE_ENV = 'test';

const { Op } = require('sequelize');
const {
  sequelize,
  User,
  LawyerApplication,
  LawyerProfile,
  LawyerService,
  AvailabilityRule,
  BlockedDate,
  Booking,
  Enquiry,
  Payment,
  BookingEvent,
  ConsultationNote,
  Engagement,
  Review
} = require('../src/models');

const TEST_EMAIL_SUFFIX = '@test.legalhub.local';

jest.setTimeout(90000);

const cleanTestData = async () => {
  try {
    await sequelize.query(`DELETE FROM users WHERE email LIKE '%${TEST_EMAIL_SUFFIX}'`);
  } catch (error) {
    try {
      const testUsers = await User.findAll({
        where: {
          email: {
            [Op.like]: `%${TEST_EMAIL_SUFFIX}`
          }
        },
        attributes: ['id']
      });
      const userIds = testUsers.map((u) => u.id);
      if (userIds.length > 0) {
        await User.destroy({ where: { id: userIds } });
      }
    } catch (_) {}
  }
};

beforeAll(async () => {
  try {
    await sequelize.authenticate();
    await cleanTestData();
  } catch (error) {
    // Retry once after 1.5s in case of transient remote TLS socket drop
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await sequelize.authenticate();
      await cleanTestData();
    } catch (retryError) {
      console.warn('DB connect warning (resilient fallback for middleware tests):', retryError.message);
    }
  }
}, 60000);

afterAll(async () => {
  await cleanTestData();
}, 60000);

module.exports = {
  TEST_EMAIL_SUFFIX
};
