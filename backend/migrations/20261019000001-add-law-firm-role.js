'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // In PostgreSQL, add 'law_firm' value to the existing enum_users_role type
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'enum_users_role' AND e.enumlabel = 'law_firm'
        ) THEN
          ALTER TYPE "enum_users_role" ADD VALUE 'law_firm';
        END IF;
      END$$;
    `);
  },

  async down(queryInterface, Sequelize) {
    // PostgreSQL does not support removing values from an enum without recreating the entire type.
    // For FYP development and testing, leaving the added enum value in place is standard and safe.
  }
};
