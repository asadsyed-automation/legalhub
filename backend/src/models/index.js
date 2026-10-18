const { sequelize } = require('../config/db');
const { initUserModel } = require('./user.model');
const { initLawyerApplicationModel } = require('./lawyerApplication.model');

// Initialize models
const User = initUserModel(sequelize);
const LawyerApplication = initLawyerApplicationModel(sequelize);

// Define Associations
User.hasOne(LawyerApplication, {
  foreignKey: 'userId',
  as: 'lawyerApplication',
  onDelete: 'CASCADE'
});

LawyerApplication.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

LawyerApplication.belongsTo(User, {
  foreignKey: 'reviewedBy',
  as: 'reviewer'
});

const db = {
  sequelize,
  User,
  LawyerApplication
};

module.exports = db;
