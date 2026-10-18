const { sequelize } = require('../config/db');
const { initUserModel } = require('./user.model');

// Initialize models
const User = initUserModel(sequelize);

const db = {
  sequelize,
  User
};

// If associations are defined on models, invoke them
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
