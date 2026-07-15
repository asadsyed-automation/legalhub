const express = require('express');
const sequelize = require('./config/database');
const User = require('./modules/auth/auth.model');
const authRoutes = require('./modules/auth/auth.routes');

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

sequelize.authenticate()
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Database connection failed:', err));

sequelize.sync({ alter: true })
  .then(() => console.log('Models synced'))
  .catch(err => console.error('Sync failed:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});