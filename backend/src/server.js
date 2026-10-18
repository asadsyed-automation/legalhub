const app = require('./app');
const config = require('./config/env');
const { sequelize } = require('./models');

const startServer = async () => {
  try {
    // Verify database connectivity
    await sequelize.authenticate();
    console.log('✅ PostgreSQL database connection established successfully.');

    // Start HTTP server listener
    const server = app.listen(config.port, () => {
      console.log(`🚀 LegalHub Backend running on port ${config.port} [NODE_ENV=${config.env}]`);
      console.log(`🔗 Health check available at http://localhost:${config.port}/api/v1/health`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        try {
          await sequelize.close();
          console.log('Database connections closed.');
          process.exit(0);
        } catch (err) {
          console.error('Error during database teardown:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server due to database connection error:', error.message);
    process.exit(1);
  }
};

startServer();
