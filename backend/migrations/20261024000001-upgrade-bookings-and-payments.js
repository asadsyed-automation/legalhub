'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add new columns to bookings table
    const tableInfo = await queryInterface.describeTable('bookings');

    if (!tableInfo.startsAt && !tableInfo.starts_at) {
      await queryInterface.addColumn('bookings', 'startsAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!tableInfo.endsAt && !tableInfo.ends_at) {
      await queryInterface.addColumn('bookings', 'endsAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!tableInfo.issueSummary && !tableInfo.issue_summary) {
      await queryInterface.addColumn('bookings', 'issueSummary', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }

    if (!tableInfo.declineReason && !tableInfo.decline_reason) {
      await queryInterface.addColumn('bookings', 'declineReason', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }

    if (!tableInfo.cancelReason && !tableInfo.cancel_reason) {
      await queryInterface.addColumn('bookings', 'cancelReason', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }

    if (!tableInfo.sessionInfo && !tableInfo.session_info) {
      await queryInterface.addColumn('bookings', 'sessionInfo', {
        type: Sequelize.STRING(300),
        allowNull: true
      });
    }

    if (!tableInfo.expiresAt && !tableInfo.expires_at) {
      await queryInterface.addColumn('bookings', 'expiresAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    // 2. Backfill startsAt, endsAt, issueSummary, cancelReason from legacy columns
    await queryInterface.sequelize.query(`
      UPDATE bookings
      SET "startsAt" = COALESCE("startsAt", "startUtc"),
          "endsAt" = COALESCE("endsAt", "endUtc"),
          "issueSummary" = COALESCE("issueSummary", "clientNotes"),
          "cancelReason" = COALESCE("cancelReason", "cancellationReason")
      WHERE "startsAt" IS NULL OR "endsAt" IS NULL;
    `);

    // 3. Create partial unique index on (lawyerId, startsAt) for open booking statuses
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS bookings_lawyer_open_slot_idx
      ON bookings ("lawyerId", "startsAt")
      WHERE status IN ('requested', 'accepted', 'paid', 'confirmed', 'pending');
    `);

    // 4. Create payments table
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      bookingId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'bookings',
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
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'sandbox'
      },
      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'succeeded'
      },
      reference: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
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

    // 5. Create booking_events table
    await queryInterface.createTable('booking_events', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      bookingId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'bookings',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      actorId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      fromStatus: {
        type: Sequelize.STRING(30),
        allowNull: true
      },
      toStatus: {
        type: Sequelize.STRING(30),
        allowNull: false
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex('booking_events', ['bookingId', 'createdAt'], {
      name: 'booking_events_booking_created_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('booking_events');
    await queryInterface.dropTable('payments');
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS bookings_lawyer_open_slot_idx;
    `);
    await queryInterface.removeColumn('bookings', 'expiresAt');
    await queryInterface.removeColumn('bookings', 'sessionInfo');
    await queryInterface.removeColumn('bookings', 'cancelReason');
    await queryInterface.removeColumn('bookings', 'declineReason');
    await queryInterface.removeColumn('bookings', 'issueSummary');
    await queryInterface.removeColumn('bookings', 'endsAt');
    await queryInterface.removeColumn('bookings', 'startsAt');
  }
};
