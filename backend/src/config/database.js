require('dotenv').config();
const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.DATABASE_URL) {
  // Render / Production PostgreSQL single connection string
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    logging: false,
  });
} else {
  // Local environment individual variables
  sequelize = new Sequelize(
    process.env.DB_NAME || 'legalhub',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      dialectOptions: process.env.DB_SSL === 'true' ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      } : {},
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      logging: false,
    }
  );
}

module.exports = sequelize;