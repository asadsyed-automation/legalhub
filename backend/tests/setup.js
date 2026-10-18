process.env.NODE_ENV = 'test';

const { Op } = require('sequelize');
const { sequelize, User, LawyerApplication } = require('../src/models');

const TEST_EMAIL_SUFFIX = '@test.legalhub.local';

jest.setTimeout(30000);

const cleanTestData = async () => {
  try {
    await LawyerApplication.destroy({
      where: {},
      include: [
        {
          model: User,
          as: 'user',
          where: {
            email: {
              [Op.like]: `%${TEST_EMAIL_SUFFIX}`
            }
          }
        }
      ]
    }).catch(() => {});

    await User.destroy({
      where: {
        email: {
          [Op.like]: `%${TEST_EMAIL_SUFFIX}`
        }
      }
    }).catch(() => {});
  } catch (_) {}
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
}, 30000);

afterAll(async () => {
  await cleanTestData();
}, 30000);

module.exports = {
  TEST_EMAIL_SUFFIX
};
