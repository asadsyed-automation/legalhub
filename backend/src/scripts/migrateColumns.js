require('dotenv').config();
const sequelize = require('../config/database');

async function migrateColumns() {
  try {
    console.log('Connecting to DB to add missing columns...');
    await sequelize.authenticate();
    console.log('Database connected.');

    // Add columns to marketplace_profiles if not exists
    await sequelize.query(`
      ALTER TABLE marketplace_profiles
      ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(255),
      ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
    `);
    console.log('Successfully altered marketplace_profiles table.');

    // Add thumbnail_url column to gigs if not exists
    await sequelize.query(`
      ALTER TABLE gigs
      ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500);
    `);
    console.log('Successfully altered gigs table.');

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrateColumns();
