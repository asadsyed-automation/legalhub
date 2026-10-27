'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create case_entries table
    await queryInterface.createTable('case_entries', {
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
      entryDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      entryType: {
        type: Sequelize.STRING(30),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      visibility: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'private'
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

    await queryInterface.addIndex('case_entries', ['caseId'], {
      name: 'case_entries_case_id_idx'
    });

    await queryInterface.addIndex('case_entries', ['caseId', 'visibility'], {
      name: 'case_entries_case_visibility_idx'
    });

    await queryInterface.addIndex('case_entries', ['entryDate'], {
      name: 'case_entries_entry_date_idx'
    });

    // 2. Create hearings table
    await queryInterface.createTable('hearings', {
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
      scheduledAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      court: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      bench: {
        type: Sequelize.STRING(120),
        allowNull: true
      },
      stage: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      outcome: {
        type: Sequelize.STRING(300),
        allowNull: true
      },
      nextDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      adjournmentReason: {
        type: Sequelize.STRING(300),
        allowNull: true
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      clientExplanation: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      visibility: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'shared'
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

    await queryInterface.addIndex('hearings', ['caseId'], {
      name: 'hearings_case_id_idx'
    });

    await queryInterface.addIndex('hearings', ['scheduledAt'], {
      name: 'hearings_scheduled_at_idx'
    });

    await queryInterface.addIndex('hearings', ['court'], {
      name: 'hearings_court_idx'
    });

    await queryInterface.addIndex('hearings', ['caseId', 'visibility'], {
      name: 'hearings_case_visibility_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('hearings');
    await queryInterface.dropTable('case_entries');
  }
};
