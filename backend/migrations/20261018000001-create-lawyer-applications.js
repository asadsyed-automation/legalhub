'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('lawyer_applications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      barCouncil: {
        type: Sequelize.STRING,
        allowNull: false
      },
      enrolmentNo: {
        type: Sequelize.STRING,
        allowNull: false
      },
      courtLevel: {
        type: Sequelize.STRING,
        allowNull: false
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false
      },
      practiceAreas: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: false
      },
      experienceYears: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      chamberAddress: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      rejectionReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      reviewedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      reviewedAt: {
        type: Sequelize.DATE,
        allowNull: true
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

    // Composite unique index on (barCouncil, enrolmentNo)
    await queryInterface.addIndex('lawyer_applications', ['barCouncil', 'enrolmentNo'], {
      unique: true,
      name: 'lawyer_applications_bar_enrolment_unique'
    });

    // Index on status for fast directory filtering of approved lawyers
    await queryInterface.addIndex('lawyer_applications', ['status'], {
      name: 'lawyer_applications_status_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('lawyer_applications');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_lawyer_applications_status";');
  }
};
