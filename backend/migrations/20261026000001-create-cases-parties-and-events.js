'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create cases table
    await queryInterface.createTable('cases', {
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
      clientId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      bookingId: {
        type: Sequelize.UUID,
        allowNull: true,
        unique: true,
        references: {
          model: 'bookings',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      title: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      practiceArea: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      court: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      caseOrFirNumber: {
        type: Sequelize.STRING(60),
        allowNull: true
      },
      filingDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'Prospect'
      },
      stage: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    // 2. Create case_parties table
    await queryInterface.createTable('case_parties', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
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
      name: {
        type: Sequelize.STRING(120),
        allowNull: false
      },
      roleLabel: {
        type: Sequelize.STRING(40),
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    // 3. Create case_status_events table
    await queryInterface.createTable('case_status_events', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
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
      fromStatus: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      toStatus: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      fromStage: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      toStage: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      changedBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    // 4. Create Indexes
    await queryInterface.addIndex('cases', ['lawyerId'], {
      name: 'cases_lawyer_id_idx'
    });
    await queryInterface.addIndex('cases', ['clientId'], {
      name: 'cases_client_id_idx'
    });
    await queryInterface.addIndex('cases', ['lawyerId', 'status'], {
      name: 'cases_lawyer_status_idx'
    });
    await queryInterface.addIndex('case_parties', ['caseId'], {
      name: 'case_parties_case_id_idx'
    });
    await queryInterface.addIndex('case_status_events', ['caseId'], {
      name: 'case_status_events_case_id_idx'
    });
    await queryInterface.addIndex('case_status_events', ['changedBy'], {
      name: 'case_status_events_changed_by_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('case_status_events');
    await queryInterface.dropTable('case_parties');
    await queryInterface.dropTable('cases');
  }
};
