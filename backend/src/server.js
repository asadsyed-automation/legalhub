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
    const defaultPasswordHash = await bcrypt.hash('Advocate@123', 10);

    const DUMMY_LAWYERS = [
      {
        name: 'Malik Ahmad Khan',
        email: 'malik.law@legalhub.pk',
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
        gigs: [
          { title: 'High Court Writ Petition Drafting & Oral Representation', description: 'Comprehensive drafting, filing, and oral arguments for Article 199 Constitutional Writ Petitions in Lahore High Court.', category: 'Constitutional Law', price: 45000.00 },
          { title: 'Bail & High Court Criminal Appellate Defense', description: 'Pre-arrest and post-arrest bail petitions, NAB investigation defense, and High Court criminal appeals.', category: 'Criminal Law', price: 30000.00 }
        ]
      },
      {
        name: 'Syeda Fatima Zaidi',
        email: 'fatima.law@legalhub.pk',
        specialization: 'Corporate Contracts & Commercial Dispute',
        city: 'Karachi',
        court_level: 'High Court & Commercial Court Advocate',
        cases_won: 89,
        fee_structure: 'PKR 25,000 / Contract',
        bio: 'Commercial Counsel representing fintech startups, corporate groups, and international joint ventures across Sindh High Court.',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
        whatsapp_number: '923219876543',
        linkedin_url: 'https://linkedin.com/in/fatima-zaidi-legal',
        gigs: [
          { title: 'Corporate Shareholder Agreement & Commercial Contract Review', description: 'Watertight legal drafting for partnership deeds, shareholder agreements, NDAs, and corporate compliance in Pakistan.', category: 'Corporate Law', price: 25000.00 },
          { title: 'FBR Tax Audit & Corporate Regulatory Legal Advisory', description: 'Expert legal consultation and reply drafting for FBR tax notices, SECP compliance, and corporate regulatory audits.', category: 'Corporate Law', price: 50000.00 }
        ]
      },
      {
        name: 'Chaudhry Tariq Mehmood',
        email: 'tariq.law@legalhub.pk',
        specialization: 'Civil Litigation & Property Land Disputes',
        city: 'Islamabad',
        court_level: 'Supreme Court Advocate (ASC)',
        cases_won: 215,
        fee_structure: 'PKR 60,000 Case Retainer',
        bio: 'Supreme Court Advocate specializing in CDA land acquisitions, revenue court appeals, and complex real estate title disputes.',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        whatsapp_number: '923335557788',
        linkedin_url: 'https://linkedin.com/in/tariq-mehmood-asc',
        gigs: [
          { title: 'Property Title Verification & Land Dispute Litigation', description: 'Thorough revenue record audit (Fard, Aks Shajra, Registry) and High Court representation for land title recovery.', category: 'Property Law', price: 35000.00 },
          { title: 'CDA Plot Transfer & Inheritance Title Legal Clearance', description: 'Legal representation for CDA Islamabad plot transfers, family settlement deeds, and succession certificate filings.', category: 'Property Law', price: 20000.00 }
        ]
      },
      {
        name: 'Adv. Sarah Jehangir',
        email: 'sarah.law@legalhub.pk',
        specialization: 'Family Law & Child Custody Specialist',
        city: 'Peshawar',
        court_level: 'High Court & Family Court Advocate',
        cases_won: 76,
        fee_structure: 'PKR 20,000 Retainer',
        bio: 'Dedicated family lawyer specializing in Khula, dower recovery, child custody guardianship petitions, and maintenance claims.',
        avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
        whatsapp_number: '923112223344',
        gigs: [
          { title: 'Family Court Khula & Maintenance Petition Filing', description: 'Fast-track legal representation in Family Courts for Khula, maintenance allowance, and dowry articles recovery.', category: 'Family Law', price: 20000.00 },
          { title: 'Child Custody & Guardianship Legal Representation', description: 'Guardian court petition drafting and interim custody visitation order applications for parents.', category: 'Family Law', price: 30000.00 }
        ]
      },
      {
        name: 'Adv. Zaid Barrister',
        email: 'zaid.law@legalhub.pk',
        specialization: 'Banking & Financial Fraud Defense',
        city: 'Quetta',
        court_level: 'High Court Advocate',
        cases_won: 64,
        fee_structure: 'PKR 40,000 Retainer',
        bio: 'Barrister at Law representing corporate clients, financial institutions, and individuals in Banking Court recovery suits and FIA cybercrime defense.',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        whatsapp_number: '923456667777',
        gigs: [
          { title: 'Banking Court Recovery Suit & FIA Cyber Crime Defense', description: 'Legal defense in Banking Tribunal recovery notices, loan restructuring agreements, and FIA cybercrime inquiries.', category: 'Banking Law', price: 40000.00 }
        ]
      }
    ];

    for (const item of DUMMY_LAWYERS) {
      let lawyer = await User.findOne({ where: { email: item.email } });
      if (!lawyer) {
        lawyer = await User.create({
          name: item.name,
          email: item.email,
          password_hash: defaultPasswordHash,
          role: 'lawyer',
          is_verified: true,
        });
      } else {
        lawyer.is_verified = true;
        await lawyer.save();
      }

      let profile = await MarketplaceProfile.findOne({ where: { lawyer_id: lawyer.id } });
      if (!profile) {
        profile = await MarketplaceProfile.create({
          lawyer_id: lawyer.id,
          specialization: item.specialization,
          city: item.city,
          court_level: item.court_level,
          cases_won: item.cases_won,
          fee_structure: item.fee_structure,
          bio: item.bio,
          avatar_url: item.avatar_url,
          whatsapp_number: item.whatsapp_number,
          linkedin_url: item.linkedin_url,
          twitter_url: item.twitter_url,
          is_verified: true,
          rating: 4.9,
        });
      } else {
        await profile.update({ is_verified: true, city: item.city, court_level: item.court_level });
      }

      for (const g of item.gigs) {
        const existingGig = await Gig.findOne({ where: { lawyer_id: lawyer.id, title: g.title } });
        if (!existingGig) {
          const createdGig = await Gig.create({
            lawyer_id: lawyer.id,
            profile_id: profile.id,
            title: g.title,
            description: g.description,
            category: g.category,
            price: g.price,
          });
          await Review.create({
            gig_id: createdGig.id,
            client_name: 'Verified LegalHub Client',
            rating: 5,
            comment: `Outstanding professional legal service provided by ${item.name}. Prompt response and clear advice!`,
          }).catch(() => {});
        }
      }
    }

    // Now ensure EVERY registered lawyer in database has a MarketplaceProfile and default gigs
    const allLawyers = await User.findAll({ where: { role: 'lawyer' } });
    for (const l of allLawyers) {
      let prof = await MarketplaceProfile.findOne({ where: { lawyer_id: l.id } });
      if (!prof) {
        prof = await MarketplaceProfile.create({
          lawyer_id: l.id,
          specialization: 'High Court Practice & Legal Advisory',
          city: 'Lahore',
          court_level: 'High Court Advocate',
          cases_won: 25,
          fee_structure: 'PKR 15,000 Consultation',
          bio: `Verified Advocate ${l.name} on LegalHub Pakistan providing legal counsel, court representation, and agreement drafting.`,
          avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
          is_verified: true,
          rating: 5.0,
        });
      }
      const gigs = await Gig.findAll({ where: { lawyer_id: l.id } });
      if (gigs.length === 0) {
        await Gig.create({
          lawyer_id: l.id,
          profile_id: prof.id,
          title: `Legal Consultation & Case Advisory with Adv. ${l.name}`,
          description: `Comprehensive 60-minute legal consultation, document review, and litigation action plan with Adv. ${l.name}.`,
          category: 'Civil Litigation',
          price: 15000.00,
        });
        await Gig.create({
          lawyer_id: l.id,
          profile_id: prof.id,
          title: `High Court & District Court Legal Filing & Representation`,
          description: `Professional legal representation, petition drafting, and court hearing appearance by Adv. ${l.name}.`,
          category: 'Constitutional Law',
          price: 35000.00,
        });
      }
    }

    console.log('✅ All advocate profiles & Fiverr service gigs verified & seeded!');
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

module.exports = { app, server, seedMarketplaceDummyData };