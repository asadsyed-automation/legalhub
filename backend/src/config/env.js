const dotenv = require('dotenv');
const path = require('path');

// Determine which env file to attempt to load
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// In test mode, fallback to .env as well if .env.test does not exist or lacks variables
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

// In test environment, ensure safe defaults if not explicitly set
if (process.env.NODE_ENV === 'test') {
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test_secret_key_at_least_32_characters_long_for_security';
  }
  if (!process.env.PORT) {
    process.env.PORT = '4001';
  }
  if (!process.env.ADMIN_EMAIL) {
    process.env.ADMIN_EMAIL = 'admin@test.legalhub.local';
  }
  if (!process.env.ADMIN_PASSWORD) {
    process.env.ADMIN_PASSWORD = 'AdminTestPassword123!';
  }
}

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD'
];

const errors = [];

for (const varName of requiredEnvVars) {
  if (!process.env[varName] || process.env[varName].trim() === '') {
    // If in test mode and TEST_DATABASE_URL is set, DATABASE_URL is satisfied
    if (varName === 'DATABASE_URL' && process.env.NODE_ENV === 'test' && process.env.TEST_DATABASE_URL) {
      continue;
    }
    errors.push(`Missing required environment variable: ${varName}`);
  }
}

if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  errors.push('JWT_SECRET must be at least 32 characters long for security');
}

if (errors.length > 0) {
  console.error('\n============================================================');
  console.error('❌ ENVIRONMENT VALIDATION FAILED:');
  errors.forEach(err => console.error(`   - ${err}`));
  console.error('\nPlease check your .env file against .env.example.');
  console.error('============================================================\n');
  process.exit(1);
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 4000,
  databaseUrl: (process.env.NODE_ENV === 'test' && process.env.TEST_DATABASE_URL)
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL,
  dbSsl: process.env.DB_SSL === 'true',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
  frontendUrls: process.env.FRONTEND_URLS
    ? process.env.FRONTEND_URLS.split(',').map(url => url.trim()).filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:5173'],
  adminEmail: (process.env.ADMIN_EMAIL || '').trim().toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD
};

module.exports = config;
