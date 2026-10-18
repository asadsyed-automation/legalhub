const { Sequelize } = require('sequelize');
const config = require('./env');

const dialectOptions = config.dbSsl
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  : {};

const sequelize = new Sequelize(config.databaseUrl, {
  dialect: 'postgres',
  dialectOptions,
  logging: config.env === 'development' ? (msg) => console.log(`[Sequelize] ${msg}`) : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = { sequelize };
