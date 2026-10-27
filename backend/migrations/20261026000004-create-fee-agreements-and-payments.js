'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create fee_agreements table
    await queryInterface.createTable('fee_agreements', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false
      },
      caseId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'cases',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.STRING(30),
        allowNull: false
      },
      agreedAmountPkr: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      notes: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('fee_agreements', ['caseId'], {
      unique: true,
      name: 'fee_agreements_case_id_uk'
    });

    // 2. Create fee_payments table
    await queryInterface.createTable('fee_payments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false
      },
      caseId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'cases',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      amountPkr: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      method: {
        type: Sequelize.STRING(30),
        allowNull: false
      },
      reference: {
        type: Sequelize.STRING(60),
        allowNull: true
      },
      paidOn: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      note: {
        type: Sequelize.STRING(300),
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('fee_payments', ['caseId'], {
      name: 'fee_payments_case_id_idx'
    });

    await queryInterface.addIndex('fee_payments', ['paidOn'], {
      name: 'fee_payments_paid_on_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('fee_payments');
    await queryInterface.dropTable('fee_agreements');
  }
};
