process.env.NODE_ENV = 'test';

const { Op } = require('sequelize');
const { sequelize, User } = require('../src/models');

const TEST_EMAIL_SUFFIX = '@test.legalhub.local';

jest.setTimeout(30000);

beforeAll(async () => {
  try {
    await sequelize.authenticate();
    await User.destroy({
      where: {
        email: {
          [Op.like]: `%${TEST_EMAIL_SUFFIX}`
        }
      }
    });
  } catch (error) {
    console.error('Test DB setup error:', error.message);
    throw error;
  }
}, 30000);

afterAll(async () => {
  try {
    await User.destroy({
      where: {
        email: {
          [Op.like]: `%${TEST_EMAIL_SUFFIX}`
        }
      }
    });
  } catch (error) {
    console.error('Test DB cleanup error:', error.message);
  }
}, 30000);

module.exports = {
  TEST_EMAIL_SUFFIX
};
