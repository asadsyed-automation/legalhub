'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add emailVerifiedAt to users table
    await queryInterface.addColumn('users', 'emailVerifiedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // 2. Mark existing users as verified so existing accounts/tests keep working
    await queryInterface.sequelize.query(
      'UPDATE users SET "emailVerifiedAt" = CURRENT_TIMESTAMP WHERE "emailVerifiedAt" IS NULL;'
    );

    // 3. Create email_otps table
    await queryInterface.createTable('email_otps', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      purpose: {
        type: Sequelize.ENUM('verify_email', 'reset_password'),
        allowNull: false
      },
      codeHash: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      attempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      consumedAt: {
        type: Sequelize.DATE,
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

    // 4. Create performance indexes
    await queryInterface.addIndex('email_otps', ['userId', 'purpose', 'createdAt'], {
      name: 'email_otps_user_purpose_created_idx'
    });

    await queryInterface.addIndex('email_otps', ['expiresAt'], {
      name: 'email_otps_expires_at_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('email_otps');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_email_otps_purpose";');
    await queryInterface.removeColumn('users', 'emailVerifiedAt');
  }
};
