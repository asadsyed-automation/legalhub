const dotenv = require('dotenv');
const path = require('path');

// Ensure backend/.env is loaded whether run from root or backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

const sslOptions = {
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
};

module.exports = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: sslOptions,
    logging: false
  },
  test: {
    url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: sslOptions,
    logging: false
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  }
};
