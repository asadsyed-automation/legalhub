'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('availability_rules', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      lawyerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      weekday: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '1=Monday, 2=Tuesday, ..., 7=Sunday (ISO-8601)'
      },
      startTime: {
        type: Sequelize.STRING(5),
        allowNull: false,
        comment: '24-hour time HH:MM (Asia/Karachi)'
      },
      endTime: {
        type: Sequelize.STRING(5),
        allowNull: false,
        comment: '24-hour time HH:MM (Asia/Karachi)'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add index on lawyerId and weekday for fast schedule lookups
    await queryInterface.addIndex('availability_rules', ['lawyerId', 'weekday'], {
      name: 'availability_rules_lawyer_weekday_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('availability_rules');
  }
};
