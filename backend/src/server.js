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

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'LegalHub Pakistan Backend Server Running' });
});

app.get('/api/v1', (req, res) => {
  res.json({ status: 'ok', message: 'LegalHub API v1 Operational' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const bcrypt = require('bcrypt');

async function seedDefaultAdmin() {
  try {
    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    if (!existingAdmin) {
      const password_hash = await bcrypt.hash('Admin@123456', 10);
      await User.create({
        name: 'System Administrator',
        email: 'admin@legalhub.pk',
        password_hash,
        role: 'admin',
        is_verified: true,
      });
      console.log('👑 Default Admin User created: admin@legalhub.pk / Admin@123456');
    } else {
      console.log('👑 Admin user ready in database:', existingAdmin.email);
    }
  } catch (err) {
    console.error('Failed to seed default admin:', err.message);
  }
}

async function seedMarketplaceDummyData() {
  try {
    const existingLawyer = await User.findOne({ where: { email: 'malik.law@legalhub.pk' } });
    if (existingLawyer) {
      console.log('⚖️ Marketplace dummy advocates already seeded.');
      return;
    }

    const defaultPasswordHash = await bcrypt.hash('Advocate@123', 10);

    // Advocate 1: Malik Ahmad Khan (Lahore)
    const lawyer1 = await User.create({
      name: 'Malik Ahmad Khan',
      email: 'malik.law@legalhub.pk',
      password_hash: defaultPasswordHash,
      role: 'lawyer',
      is_verified: true,
    });
    const profile1 = await MarketplaceProfile.create({
      lawyer_id: lawyer1.id,
      specialization: 'Constitutional Law & Criminal Defense',
      city: 'Lahore',
      court_level: 'Senior Advocate High Court',
      cases_won: 142,
      fee_structure: 'PKR 45,000 Retainer',
      bio: 'Senior High Court Advocate with 18+ years of expertise in Constitutional Writ Petitions, NAB Defense, and High Court Appellate Practice.',
      avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
      whatsapp_number: '923001234567',
      linkedin_url: 'https://linkedin.com/in/malik-ahmad-khan-advocate',
      twitter_url: 'https://twitter.com/malik_law_pk',
      is_verified: true,
      rating: 4.9,
    });
    const gig1 = await Gig.create({
      lawyer_id: lawyer1.id,
      title: 'High Court Writ Petition Drafting & Representation',
      description: 'Comprehensive drafting, filing, and oral arguments for Article 199 Constitutional Writ Petitions in Lahore High Court.',
      category: 'Constitutional Law',
      price: 45000.00,
    });
    await Review.create({
      gig_id: gig1.id,
      client_name: 'Chaudhry Usman Nawaz',
      rating: 5,
      comment: 'Outstanding advocate! Adv. Malik secured an interim stay order for our property case within 24 hours of filing.',
    });

    // Advocate 2: Syeda Fatima Zaidi (Karachi)
    const lawyer2 = await User.create({
      name: 'Syeda Fatima Zaidi',
      email: 'fatima.law@legalhub.pk',
      password_hash: defaultPasswordHash,
      role: 'lawyer',
      is_verified: true,
    });
    const profile2 = await MarketplaceProfile.create({
      lawyer_id: lawyer2.id,
      specialization: 'Corporate Contracts & Commercial Dispute',
      city: 'Karachi',
      court_level: 'High Court & Commercial Court Advocate',
      cases_won: 89,
      fee_structure: 'PKR 25,000 / Contract',
      bio: 'Commercial Counsel representing fintech startups, corporate groups, and international joint ventures across Sindh High Court.',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      whatsapp_number: '923219876543',
      linkedin_url: 'https://linkedin.com/in/fatima-zaidi-legal',
      is_verified: true,
      rating: 5.0,
    });
    const gig2 = await Gig.create({
      lawyer_id: lawyer2.id,
      title: 'Corporate Shareholder Agreement & Commercial Contract Review',
      description: 'Watertight legal drafting for partnership deeds, shareholder agreements, NDAs, and corporate compliance in Pakistan.',
      category: 'Corporate Law',
      price: 25000.00,
    });
    await Review.create({
      gig_id: gig2.id,
      client_name: 'Tariq Tech Ventures',
      rating: 5,
      comment: 'Flawless contract drafting. Fatima revised our investment agreement with extreme attention to detail.',
    });

    // Advocate 3: Chaudhry Tariq Mehmood (Islamabad)
    const lawyer3 = await User.create({
      name: 'Chaudhry Tariq Mehmood',
      email: 'tariq.law@legalhub.pk',
      password_hash: defaultPasswordHash,
      role: 'lawyer',
      is_verified: true,
    });
    const profile3 = await MarketplaceProfile.create({
      lawyer_id: lawyer3.id,
      specialization: 'Civil Litigation & Property Land Disputes',
      city: 'Islamabad',
      court_level: 'Supreme Court Advocate (ASC)',
      cases_won: 215,
      fee_structure: 'PKR 60,000 Case Retainer',
      bio: 'Supreme Court Advocate specializing in CDA land acquisitions, revenue court appeals, and complex real estate title disputes.',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      whatsapp_number: '923335557788',
      linkedin_url: 'https://linkedin.com/in/tariq-mehmood-asc',
      is_verified: true,
      rating: 4.8,
    });
    const gig3 = await Gig.create({
      lawyer_id: lawyer3.id,
      title: 'Property Title Verification & Land Dispute Litigation',
      description: 'Thorough revenue record audit (Fard, Aks Shajra, Registry) and High Court representation for land title recovery.',
      category: 'Property Law',
      price: 35000.00,
    });
    await Review.create({
      gig_id: gig3.id,
      client_name: 'Dr. Bilal Qureshi',
      rating: 5,
      comment: 'Very authoritative advocate in Islamabad revenue courts. Resolved our CDA plot dispute efficiently.',
    });

    console.log('✅ Marketplace dummy advocates & Fiverr gigs successfully seeded!');
  } catch (err) {
    console.error('Failed to seed marketplace dummy data:', err.message);
  }
}

sequelize.authenticate()
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Database connection failed:', err));

sequelize.sync({ alter: true })
  .then(async () => {
    console.log('Models synced');
    await seedDefaultAdmin();
    await seedMarketplaceDummyData();
  })
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