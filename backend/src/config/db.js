const { Sequelize } = require('sequelize');
const config = require('./env');

const dialectOptions = config.dbSsl
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      keepAlive: true
    }
  : {};

const sequelize = new Sequelize(config.databaseUrl, {
  dialect: 'postgres',
  dialectOptions,
  logging: config.env === 'development' ? (msg) => console.log(`[Sequelize] ${msg}`) : false,
  pool: {
    max: 10,
    min: 1,
    acquire: 60000,
    idle: 60000,
    evict: 30000
  }
});

module.exports = { sequelize };
