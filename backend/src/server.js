const express = require('express');
const sequelize = require('./config/database');
const cors = require('cors');

const User = require('./modules/auth/auth.model');
const OtpCode = require('./modules/auth/otp.model');
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

const Notification = require('./modules/notifications/notification.model');
const notificationRoutes = require('./modules/notifications/notification.routes');

const Message = require('./modules/messages/message.model');
const messageRoutes = require('./modules/messages/message.routes');

const MarketplaceProfile = require('./modules/marketplace/profile.model');
const profileRoutes = require('./modules/marketplace/profile.routes');

const Gig = require('./modules/gigs/gig.model');
const gigRoutes = require('./modules/gigs/gig.routes');

const Review = require('./modules/reviews/review.model');
const reviewRoutes = require('./modules/reviews/review.routes');

const Subscription = require('./modules/subscriptions/subscription.model');
const subscriptionRoutes = require('./modules/subscriptions/subscription.routes');

const CitizenProfile = require('./modules/citizen/profile.model');
const citizenProfileRoutes = require('./modules/citizen/profile.routes');

const adminRoutes = require('./modules/admin/admin.routes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/firms', firmRoutes);
app.use('/api/v1/cases', caseRoutes);
app.use('/api/v1/hearings', hearingRoutes);
app.use('/api/v1/case-entries', entryRoutes);
app.use('/api/v1/fees', feeRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/marketplace-profiles', profileRoutes);
app.use('/api/v1/citizen-profiles', citizenProfileRoutes);
app.use('/api/v1/gigs', gigRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

sequelize.authenticate()
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Database connection failed:', err));

sequelize.sync({ alter: true })
  .then(() => console.log('Models synced'))
  .catch(err => console.error('Sync failed:', err));

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }, // tighten this to your frontend URL once deployed
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_case', (caseId) => {
    socket.join(caseId); // creates a "room" per case
    console.log(`Socket ${socket.id} joined case room ${caseId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.set('io', io); // makes io accessible inside controllers via req.app.get('io')

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});