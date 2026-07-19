const express = require('express');
const sequelize = require('./config/database');

const User = require('./modules/auth/auth.model');
const authRoutes = require('./modules/auth/auth.routes');

const Firm = require('./modules/firms/firm.model');
const firmRoutes = require('./modules/firms/firm.routes');

const Case = require('./modules/cases/case.model');
const caseRoutes = require('./modules/cases/case.routes');

const Hearing = require('./modules/hearings/hearing.model');
const hearingRoutes = require('./modules/hearings/hearing.routes');

const CaseEntry = require('./modules/case-entries/entry.model');
const entryRoutes = require('./modules/case-entries/entry.routes');

const Fee = require('./modules/fees/fee.model');
const feeRoutes = require('./modules/fees/fee.routes');

const Document = require('./modules/documents/document.model');
const documentRoutes = require('./modules/documents/document.routes');

const app = express();
app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/firms', firmRoutes);
app.use('/api/v1/cases', caseRoutes);
app.use('/api/v1/hearings', hearingRoutes);
app.use('/api/v1/case-entries', entryRoutes);
app.use('/api/v1/fees', feeRoutes);
app.use('/api/v1/documents', documentRoutes);

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