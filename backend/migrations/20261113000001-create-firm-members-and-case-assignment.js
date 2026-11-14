'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create firm_members table
    await queryInterface.createTable('firm_members', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      firmId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      designation: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'Associate Advocate'
      },
      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'active'
      },
      joinedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
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

    // Unique index: a lawyer can be added once per firm
    await queryInterface.addIndex('firm_members', ['firmId', 'lawyerId'], {
      unique: true,
      name: 'firm_members_firm_lawyer_unique'
    });

    await queryInterface.addIndex('firm_members', ['lawyerId'], {
      name: 'firm_members_lawyer_idx'
    });

    // 2. Add assignedLawyerId to cases table if not exists
    const tableDefinition = await queryInterface.describeTable('cases');
    if (!tableDefinition.assignedLawyerId) {
      await queryInterface.addColumn('cases', 'assignedLawyerId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });

      await queryInterface.addIndex('cases', ['assignedLawyerId'], {
        name: 'cases_assigned_lawyer_idx'
      });
    }
  },

  async down(queryInterface) {
    const tableDefinition = await queryInterface.describeTable('cases');
    if (tableDefinition.assignedLawyerId) {
      await queryInterface.removeColumn('cases', 'assignedLawyerId');
    }
    await queryInterface.dropTable('firm_members');
  }
};

