'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('lawyer_services', {
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
      mode: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      durationMinutes: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      feePkr: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

    // Enforce unique (lawyerId, mode) constraint: only one service per mode per lawyer
    await queryInterface.addIndex('lawyer_services', ['lawyerId', 'mode'], {
      unique: true,
      name: 'lawyer_services_lawyer_id_mode_unique_idx'
    });

    // Add index on lawyerId and isActive for fast service lookups
    await queryInterface.addIndex('lawyer_services', ['lawyerId', 'isActive'], {
      name: 'lawyer_services_lawyer_id_active_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('lawyer_services');
  }
};
