const { sequelize } = require('../src/models');

async function migrate() {
  try {
    await sequelize.query(`
      ALTER TABLE reviews 
      ADD COLUMN IF NOT EXISTS "lawyerReply" TEXT,
      ADD COLUMN IF NOT EXISTS "repliedAt" TIMESTAMP WITH TIME ZONE;
    `);
    console.log('✅ Added lawyerReply and repliedAt columns to reviews table');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
