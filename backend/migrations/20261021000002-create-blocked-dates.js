'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('blocked_dates', {
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
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Blocked calendar date YYYY-MM-DD'
      },
      reason: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Optional reason e.g. Bar Council strike, Court recess, Personal leave'
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

    // Enforce unique (lawyerId, date) constraint so the same date cannot be blocked twice
    await queryInterface.addIndex('blocked_dates', ['lawyerId', 'date'], {
      unique: true,
      name: 'blocked_dates_lawyer_date_unique_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('blocked_dates');
  }
};
