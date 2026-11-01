'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add isActive to users table
    await queryInterface.addColumn('users', 'isActive', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    // 2. Add suspensionReason to users table
    await queryInterface.addColumn('users', 'suspensionReason', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null
    });

    // 3. Add suspendedAt to users table
    await queryInterface.addColumn('users', 'suspendedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null
    });

    // 4. Create composite index on (isActive, role)
    await queryInterface.addIndex('users', ['isActive', 'role'], {
      name: 'users_is_active_role_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('users', 'users_is_active_role_idx');
    await queryInterface.removeColumn('users', 'suspendedAt');
    await queryInterface.removeColumn('users', 'suspensionReason');
    await queryInterface.removeColumn('users', 'isActive');
  }
};
