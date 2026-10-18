const { sequelize } = require('../src/models');

module.exports = async () => {
  try {
    await sequelize.close();
  } catch (error) {
    // Ignore teardown close errors
  }
};
