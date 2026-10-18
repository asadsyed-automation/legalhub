const bcrypt = require('bcryptjs');
const config = require('../src/config/env');
const { sequelize, User } = require('../src/models');
const { ROLES } = require('../src/constants/roles');

const SALT_ROUNDS = 12;

const seedAdmin = async () => {
  try {
    console.log('--- LegalHub Admin Seeding Script ---');

    if (!config.adminEmail || !config.adminPassword) {
      console.error('❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD must be defined in your environment.');
      process.exit(1);
    }

    if (config.adminPassword.length < 8) {
      console.error('❌ Error: ADMIN_PASSWORD must be at least 8 characters long.');
      process.exit(1);
    }

    await sequelize.authenticate();
    console.log('Connected to database.');

    const email = config.adminEmail.trim().toLowerCase();

    const existingAdmin = await User.findOne({ where: { email } });

    if (existingAdmin) {
      console.log(`ℹ️  Admin with email ${email} already exists (ID: ${existingAdmin.id}). No changes made.`);
      await sequelize.close();
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(config.adminPassword, SALT_ROUNDS);

    const admin = await User.create({
      name: 'System Administrator',
      email,
      passwordHash,
      role: ROLES.ADMIN,
      failedLoginAttempts: 0,
      lockedUntil: null
    });

    console.log(`✅ Admin account created successfully!`);
    console.log(`   User ID: ${admin.id}`);
    console.log(`   Email:   ${admin.email}`);
    console.log(`   Role:    ${admin.role}`);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message);
    try {
      await sequelize.close();
    } catch (_) {}
    process.exit(1);
  }
};

seedAdmin();
