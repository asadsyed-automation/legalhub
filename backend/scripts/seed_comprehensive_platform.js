/**
 * Comprehensive Testing Seed Script for LegalHub Pakistan
 * Seeds verified advocates across every filter (Court, City, Practice Area),
 * multiple verified client accounts, an admin account, and active Community Feed discussions.
 */

const bcrypt = require('bcryptjs');
const {
  sequelize,
  User,
  LawyerApplication,
  LawyerProfile,
  LawyerService,
  AvailabilityRule,
  CommunityQuestion,
  CommunityAnswer
} = require('../src/models');
const { APPLICATION_STATUS } = require('../src/constants');
const { SERVICE_MODES } = require('../src/constants/profile');

const DEFAULT_PASSWORD = 'Password123!';

const CLIENTS = [
  {
    name: 'Muhammad Aqeel',
    email: 'client.multan@demo.legalhub.local',
    role: 'client'
  },
  {
    name: 'Syed Asad',
    email: 'client.lahore@demo.legalhub.local',
    role: 'client'
  },
  {
    name: 'Mubashir Mehmood',
    email: 'client.karachi@demo.legalhub.local',
    role: 'client'
  }
];

const ADVOCATES = [
  {
    name: 'Adv. Fatima Noor',
    email: 'fatima.noor@demo.legalhub.local',
    city: 'Lahore',
    barCouncil: 'Punjab Bar Council',
    enrolmentNo: 'LHR-7721-PBC',
    courtLevel: 'Advocate High Court',
    practiceAreas: ['Family', 'Civil'],
    experienceYears: 8,
    chamberAddress: 'Chamber 44, High Court Bar Association, Mall Road, Lahore',
    headline: 'Advocate High Court | Family & Civil Rights Specialist',
    about: 'Experienced in family arbitration, custody disputes, khula decrees, inheritance partition, and civil injunctions across Lahore benches.',
    languages: ['Urdu', 'Punjabi', 'English'],
    slotMinutes: 30,
    services: [
      { mode: SERVICE_MODES.IN_CHAMBER, durationMinutes: 30, feePkr: 2500 },
      { mode: SERVICE_MODES.VIDEO, durationMinutes: 30, feePkr: 2000 },
      { mode: SERVICE_MODES.PHONE, durationMinutes: 15, feePkr: 1200 }
    ],
    schedule: [
      { weekday: 1, startTime: '09:00', endTime: '13:00' },
      { weekday: 3, startTime: '09:00', endTime: '13:00' },
      { weekday: 5, startTime: '09:00', endTime: '12:30' }
    ]
  },
  {
    name: 'Adv. Tariq Mehmood',
    email: 'tariq.mehmood@demo.legalhub.local',
    city: 'Multan',
    barCouncil: 'Punjab Bar Council',
    enrolmentNo: 'MUL-4412-PBC',
    courtLevel: 'Advocate High Court',
    practiceAreas: ['Civil', 'Corporate', 'Property'],
    experienceYears: 6,
    chamberAddress: 'Chamber 12, District Bar Association, Multan Courts',
    headline: 'Advocate High Court | Commercial Contracts & Land Title Counsel',
    about: 'Specialist in land revenue disputes, stay orders, mutation/intiqal scrutiny, and commercial dispute mediation in South Punjab.',
    languages: ['Urdu', 'Saraiki', 'English'],
    slotMinutes: 30,
    services: [
      { mode: SERVICE_MODES.IN_CHAMBER, durationMinutes: 30, feePkr: 3000 },
      { mode: SERVICE_MODES.PHONE, durationMinutes: 30, feePkr: 1800 },
      { mode: SERVICE_MODES.CHAT, durationMinutes: 15, feePkr: 1000 }
    ],
    schedule: [
      { weekday: 2, startTime: '10:00', endTime: '14:00' },
      { weekday: 4, startTime: '10:00', endTime: '14:00' },
      { weekday: 6, startTime: '10:00', endTime: '13:00' }
    ]
  },
  {
    name: 'Adv. Zulfiqar Ali Bhutto Jr.',
    email: 'zulfiqar.bhutto@demo.legalhub.local',
    city: 'Karachi',
    barCouncil: 'Sindh Bar Council',
    enrolmentNo: 'KHI-9981-SBC',
    courtLevel: 'Advocate Supreme Court',
    practiceAreas: ['Constitutional', 'Criminal'],
    experienceYears: 18,
    chamberAddress: 'Chamber 8A, Court Road, Opposite Sindh High Court, Karachi',
    headline: 'Advocate Supreme Court | Constitutional & Criminal Defense Counsel',
    about: 'Two decades of trial advocacy covering pre-arrest & post-arrest bail, constitutional writ petitions, and white-collar fraud defenses.',
    languages: ['Urdu', 'Sindhi', 'English'],
    slotMinutes: 45,
    services: [
      { mode: SERVICE_MODES.IN_CHAMBER, durationMinutes: 45, feePkr: 5000 },
      { mode: SERVICE_MODES.VIDEO, durationMinutes: 45, feePkr: 4500 }
    ],
    schedule: [
      { weekday: 1, startTime: '11:00', endTime: '15:00' },
      { weekday: 2, startTime: '11:00', endTime: '15:00' },
      { weekday: 3, startTime: '11:00', endTime: '15:00' }
    ]
  },
  {
    name: 'Adv. Zainab Rizvi',
    email: 'zainab.rizvi@demo.legalhub.local',
    city: 'Islamabad',
    barCouncil: 'Islamabad Bar Council',
    enrolmentNo: 'ISB-3310-IBC',
    courtLevel: 'Advocate High Court',
    practiceAreas: ['Corporate', 'Tax', 'Banking'],
    experienceYears: 10,
    chamberAddress: 'Suite 302, Evacuee Trust Complex, F-5/1, Islamabad',
    headline: 'Advocate High Court | Corporate Regulatory & FBR Tax Counsel',
    about: 'Expert advisory in SECP corporate filings, FBR tax appeals, banking recovery suits, and technology cross-border agreements.',
    languages: ['Urdu', 'English'],
    slotMinutes: 30,
    services: [
      { mode: SERVICE_MODES.VIDEO, durationMinutes: 30, feePkr: 4000 },
      { mode: SERVICE_MODES.IN_CHAMBER, durationMinutes: 30, feePkr: 4500 }
    ],
    schedule: [
      { weekday: 1, startTime: '09:00', endTime: '13:00' },
      { weekday: 3, startTime: '09:00', endTime: '13:00' }
    ]
  },
  {
    name: 'Adv. Malik Sher Afghan',
    email: 'malik.afghan@demo.legalhub.local',
    city: 'Peshawar',
    barCouncil: 'Khyber Pakhtunkhwa Bar Council',
    enrolmentNo: 'PEW-1205-KPBC',
    courtLevel: 'Advocate High Court',
    practiceAreas: ['Criminal', 'Property'],
    experienceYears: 12,
    chamberAddress: 'Chamber 19, Peshawar High Court Bar Association, Khyber Road, Peshawar',
    headline: 'Advocate High Court | Criminal Trial & Property Partition Counsel',
    about: 'Representing clients in Sessions Courts and Peshawar High Court in boundary demarcation, FIR quashment, and criminal appeals.',
    languages: ['Pashto', 'Urdu', 'English'],
    slotMinutes: 30,
    services: [
      { mode: SERVICE_MODES.IN_CHAMBER, durationMinutes: 30, feePkr: 2000 },
      { mode: SERVICE_MODES.PHONE, durationMinutes: 30, feePkr: 1500 }
    ],
    schedule: [
      { weekday: 2, startTime: '09:00', endTime: '13:00' },
      { weekday: 5, startTime: '09:00', endTime: '12:30' }
    ]
  },
  {
    name: 'Adv. Ayesha Gul',
    email: 'ayesha.gul@demo.legalhub.local',
    city: 'Rawalpindi',
    barCouncil: 'Punjab Bar Council',
    enrolmentNo: 'RWP-6190-PBC',
    courtLevel: 'Advocate Lower Courts',
    practiceAreas: ['Family', 'Consumer'],
    experienceYears: 4,
    chamberAddress: 'Chamber 29, District & Sessions Courts, Kachehri Chowk, Rawalpindi',
    headline: 'Advocate Lower Courts | Matrimonial Disputes & Consumer Redressal',
    about: 'Dedicated practitioner for family court litigation, maintenance suits, dowry return petitions, and consumer protection court complaints.',
    languages: ['Urdu', 'Punjabi', 'English'],
    slotMinutes: 30,
    services: [
      { mode: SERVICE_MODES.IN_CHAMBER, durationMinutes: 30, feePkr: 2000 },
      { mode: SERVICE_MODES.PHONE, durationMinutes: 30, feePkr: 1500 }
    ],
    schedule: [
      { weekday: 1, startTime: '14:00', endTime: '18:00' },
      { weekday: 3, startTime: '14:00', endTime: '18:00' }
    ]
  },
  {
    name: 'Adv. Mir Balakh Sher Mazari',
    email: 'balakh.mazari@demo.legalhub.local',
    city: 'Quetta',
    barCouncil: 'Balochistan Bar Council',
    enrolmentNo: 'QTA-8140-BBC',
    courtLevel: 'Advocate High Court',
    practiceAreas: ['Property', 'Constitutional'],
    experienceYears: 14,
    chamberAddress: 'Chamber 7, Balochistan Bar Association, High Court Complex, Quetta',
    headline: 'Advocate High Court | Land Revenue & Civil Litigation Specialist',
    about: 'Broad trial practice in tribal land disputes, boundary demarcations, state acquisition compensation, and Balochistan High Court writs.',
    languages: ['Urdu', 'English', 'Punjabi'],
    slotMinutes: 30,
    services: [
      { mode: SERVICE_MODES.IN_CHAMBER, durationMinutes: 30, feePkr: 3500 },
      { mode: SERVICE_MODES.PHONE, durationMinutes: 30, feePkr: 2000 }
    ],
    schedule: [
      { weekday: 3, startTime: '10:00', endTime: '14:00' },
      { weekday: 6, startTime: '10:00', endTime: '14:00' }
    ]
  },
  {
    name: 'Adv. Chaudhry Nisar Ahmed',
    email: 'nisar.ahmed@demo.legalhub.local',
    city: 'Faisalabad',
    barCouncil: 'Punjab Bar Council',
    enrolmentNo: 'FSD-3829-PBC',
    courtLevel: 'Advocate High Court',
    practiceAreas: ['Labor', 'Tax', 'Corporate'],
    experienceYears: 11,
    chamberAddress: 'Chamber 8, District & Sessions Court, Faisalabad',
    headline: 'Advocate High Court | Industrial Labor & Sales Tax Advisory',
    about: 'Advising industrial textile units and labor unions on worker compensation, EOBI compliance, wage tribunals, and FBR provincial tax litigation.',
    languages: ['Urdu', 'Punjabi', 'English'],
    slotMinutes: 30,
    services: [
      { mode: SERVICE_MODES.IN_CHAMBER, durationMinutes: 30, feePkr: 2500 },
      { mode: SERVICE_MODES.PHONE, durationMinutes: 30, feePkr: 1500 }
    ],
    schedule: [
      { weekday: 1, startTime: '10:00', endTime: '14:00' },
      { weekday: 4, startTime: '10:00', endTime: '14:00' }
    ]
  },
  {
    name: 'Adv. Barrister Daniyal Khan',
    email: 'daniyal.khan@demo.legalhub.local',
    city: 'Islamabad',
    barCouncil: 'Islamabad Bar Council',
    enrolmentNo: 'ISB-9901-IBC',
    courtLevel: 'Advocate Supreme Court',
    practiceAreas: ['Constitutional', 'Corporate', 'Banking'],
    experienceYears: 16,
    chamberAddress: 'Chambers at Blue Area, Sector F-6, Islamabad',
    headline: 'Advocate Supreme Court | Commercial Arbitration & Apex Writs',
    about: 'Specialized in international commercial arbitration, regulatory appeals before the Competition Commission, and constitutional writ petitions in the Supreme Court.',
    languages: ['Urdu', 'English', 'Pashto'],
    slotMinutes: 45,
    services: [
      { mode: SERVICE_MODES.VIDEO, durationMinutes: 45, feePkr: 6000 },
      { mode: SERVICE_MODES.IN_CHAMBER, durationMinutes: 45, feePkr: 7000 }
    ],
    schedule: [
      { weekday: 2, startTime: '11:00', endTime: '16:00' },
      { weekday: 4, startTime: '11:00', endTime: '16:00' }
    ]
  },
  {
    name: 'Adv. Saira Bano',
    email: 'saira.bano@demo.legalhub.local',
    city: 'Karachi',
    barCouncil: 'Sindh Bar Council',
    enrolmentNo: 'KHI-7123-SBC',
    courtLevel: 'Advocate High Court',
    practiceAreas: ['Family', 'Consumer', 'Civil'],
    experienceYears: 7,
    chamberAddress: 'Chamber 52, City Courts, MA Jinnah Road, Karachi',
    headline: 'Advocate High Court | Family Inheritance & Consumer Rights Counsel',
    about: 'Compassionate representation for khula, child custody, succession certificates, and defective product claims before consumer protection courts in Sindh.',
    languages: ['Urdu', 'Sindhi', 'English'],
    slotMinutes: 30,
    services: [
      { mode: SERVICE_MODES.IN_CHAMBER, durationMinutes: 30, feePkr: 2000 },
      { mode: SERVICE_MODES.VIDEO, durationMinutes: 30, feePkr: 1800 }
    ],
    schedule: [
      { weekday: 1, startTime: '09:30', endTime: '13:30' },
      { weekday: 3, startTime: '09:30', endTime: '13:30' }
    ]
  },
  {
    name: 'Adv. Sardar Sikandar Hayat',
    email: 'sikandar.hayat@demo.legalhub.local',
    city: 'Multan',
    barCouncil: 'Punjab Bar Council',
    enrolmentNo: 'MUL-6201-PBC',
    courtLevel: 'Advocate High Court',
    practiceAreas: ['Property', 'Banking', 'Civil'],
    experienceYears: 15,
    chamberAddress: 'Chamber 3, Old Bahawalpur Road, District Courts Multan',
    headline: 'Advocate High Court | Agricultural Land Revenue & Banking Recovery',
    about: 'Extensive litigation experience in rural land title disputes, agricultural tenancy, mutation cancellation suits, and financial institution recovery matters.',
    languages: ['Urdu', 'Saraiki', 'Punjabi', 'English'],
    slotMinutes: 30,
    services: [
      { mode: SERVICE_MODES.IN_CHAMBER, durationMinutes: 30, feePkr: 3000 },
      { mode: SERVICE_MODES.PHONE, durationMinutes: 30, feePkr: 1800 }
    ],
    schedule: [
      { weekday: 2, startTime: '10:00', endTime: '14:00' },
      { weekday: 4, startTime: '10:00', endTime: '14:00' }
    ]
  },
  {
    name: 'Adv. Muhammad Bilal Cheema',
    email: 'bilal.cheema@demo.legalhub.local',
    city: 'Gujranwala',
    barCouncil: 'Punjab Bar Council',
    enrolmentNo: 'GUJ-4011-PBC',
    courtLevel: 'Advocate High Court',
    practiceAreas: ['Civil', 'Property', 'Corporate'],
    experienceYears: 9,
    chamberAddress: 'Chamber 18, Sessions Court, Sialkot Road, Gujranwala',
    headline: 'Advocate High Court | Commercial Contracts & Real Estate Counsel',
    about: 'Advising small-to-medium manufacturing enterprises on commercial partnerships, breach of contract, property possession decrees, and execution proceedings.',
    languages: ['Urdu', 'Punjabi', 'English'],
    slotMinutes: 30,
    services: [
      { mode: SERVICE_MODES.IN_CHAMBER, durationMinutes: 30, feePkr: 2200 }
    ],
    schedule: [
      { weekday: 1, startTime: '09:00', endTime: '13:00' },
      { weekday: 3, startTime: '09:00', endTime: '13:00' }
    ]
  },
  {
    name: 'Adv. Khawaja Haroon Rasheed',
    email: 'haroon.rasheed@demo.legalhub.local',
    city: 'Sialkot',
    barCouncil: 'Punjab Bar Council',
    enrolmentNo: 'SKT-2918-PBC',
    courtLevel: 'Advocate High Court',
    practiceAreas: ['Corporate', 'Banking', 'Civil'],
    experienceYears: 13,
    chamberAddress: 'Chamber 14, Paris Road, District Court Complex, Sialkot',
    headline: 'Advocate High Court | Export Trade Agreements & Corporate Litigation',
    about: 'Dedicated counsel for export manufacturing businesses, handling Letters of Credit (LC) disputes, bill of exchange recovery, and customs clearance appeals.',
    languages: ['Urdu', 'Punjabi', 'English'],
    slotMinutes: 30,
    services: [
      { mode: SERVICE_MODES.IN_CHAMBER, durationMinutes: 30, feePkr: 3000 },
      { mode: SERVICE_MODES.VIDEO, durationMinutes: 30, feePkr: 2500 }
    ],
    schedule: [
      { weekday: 2, startTime: '10:00', endTime: '14:00' },
      { weekday: 5, startTime: '09:00', endTime: '12:30' }
    ]
  },
  {
    name: 'Adv. Sardar Aurangzeb',
    email: 'aurangzeb@demo.legalhub.local',
    city: 'Abbottabad',
    barCouncil: 'Khyber Pakhtunkhwa Bar Council',
    enrolmentNo: 'ABT-5102-KPBC',
    courtLevel: 'Advocate High Court',
    practiceAreas: ['Property', 'Civil', 'Constitutional'],
    experienceYears: 12,
    chamberAddress: 'Chamber 6, Abbottabad High Court Circuit Bench, Murree Road, Abbottabad',
    headline: 'Advocate High Court | Hazara Land Litigation & Civil Appellate Practice',
    about: 'Advocacy before Abbottabad High Court bench in revenue appeals, mountain land partition, stay applications, and writ petitions against local government bodies.',
    languages: ['Pashto', 'Urdu', 'English'],
    slotMinutes: 30,
    services: [
      { mode: SERVICE_MODES.IN_CHAMBER, durationMinutes: 30, feePkr: 2500 },
      { mode: SERVICE_MODES.PHONE, durationMinutes: 30, feePkr: 1500 }
    ],
    schedule: [
      { weekday: 1, startTime: '10:00', endTime: '14:00' },
      { weekday: 3, startTime: '10:00', endTime: '14:00' }
    ]
  }
];

async function seedComprehensive() {
  console.log('🏛️  Starting LegalHub Pakistan Comprehensive Platform Seeding...');
  
  // Connection retry for cloud PostgreSQL poolers
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await sequelize.authenticate();
      console.log('🔗 Database connected successfully.');
      break;
    } catch (err) {
      console.warn(`⏳ Database connection attempt ${attempt}/5 failed (${err.message}). Retrying in 2s...`);
      if (attempt === 5) throw err;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // 1. Seed / Upsert Admin User
  let admin = await User.findOne({ where: { email: 'admin@demo.legalhub.local' } });
  if (!admin) {
    admin = await User.create({
      name: 'System Administrator',
      email: 'admin@demo.legalhub.local',
      passwordHash,
      role: 'admin',
      emailVerifiedAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null
    });
    console.log(`✅ Admin Created: ${admin.email}`);
  } else {
    await admin.update({ passwordHash, emailVerifiedAt: new Date() });
    console.log(`ℹ️  Admin Updated: ${admin.email}`);
  }

  // 2. Seed / Upsert Clients
  const clientMap = {};
  for (const c of CLIENTS) {
    let client = await User.findOne({ where: { email: c.email } });
    if (!client) {
      client = await User.create({
        name: c.name,
        email: c.email,
        passwordHash,
        role: 'client',
        emailVerifiedAt: new Date()
      });
      console.log(`✅ Client Created: ${client.name} (${client.email})`);
    } else {
      await client.update({ name: c.name, passwordHash, emailVerifiedAt: new Date() });
      console.log(`ℹ️  Client Updated: ${client.name} (${client.email})`);
    }
    clientMap[c.email] = client;
  }

  // 3. Seed / Upsert Advocates
  const lawyerMap = {};
  for (const adv of ADVOCATES) {
    let user = await User.findOne({ where: { email: adv.email } });
    if (!user) {
      user = await User.create({
        name: adv.name,
        email: adv.email,
        passwordHash,
        role: 'lawyer',
        emailVerifiedAt: new Date()
      });
    } else {
      await user.update({ name: adv.name, passwordHash, emailVerifiedAt: new Date() });
    }
    lawyerMap[adv.email] = user;

    // Upsert Application
    let app = await LawyerApplication.findOne({ where: { userId: user.id } });
    const appData = {
      userId: user.id,
      barCouncil: adv.barCouncil,
      enrolmentNo: adv.enrolmentNo,
      courtLevel: adv.courtLevel,
      city: adv.city,
      practiceAreas: adv.practiceAreas,
      experienceYears: adv.experienceYears,
      chamberAddress: adv.chamberAddress,
      bio: adv.about,
      status: APPLICATION_STATUS.APPROVED,
      reviewedAt: new Date()
    };
    if (!app) {
      await LawyerApplication.create(appData);
    } else {
      await app.update(appData);
    }

    // Upsert Profile
    let profile = await LawyerProfile.findOne({ where: { userId: user.id } });
    const profileData = {
      userId: user.id,
      headline: adv.headline,
      about: adv.about,
      languages: adv.languages,
      slotMinutes: adv.slotMinutes,
      isPublic: true
    };
    if (!profile) {
      await LawyerProfile.create(profileData);
    } else {
      await profile.update(profileData);
    }

    // Upsert Services
    await LawyerService.destroy({ where: { lawyerId: user.id } });
    for (const s of adv.services) {
      await LawyerService.create({
        lawyerId: user.id,
        mode: s.mode,
        durationMinutes: s.durationMinutes,
        feePkr: s.feePkr,
        isActive: true
      });
    }

    // Upsert Availability Rules
    await AvailabilityRule.destroy({ where: { lawyerId: user.id } });
    for (const r of adv.schedule) {
      await AvailabilityRule.create({
        lawyerId: user.id,
        weekday: r.weekday,
        startTime: r.startTime,
        endTime: r.endTime
      });
    }

    console.log(`⚖️  Advocate Ready: ${adv.name} | ${adv.city} | ${adv.courtLevel} | Areas: ${adv.practiceAreas.join(', ')}`);
  }

  // 4. Seed Community Feed Questions and Answers
  const multanClient = clientMap['client.multan@demo.legalhub.local'];
  const lahoreClient = clientMap['client.lahore@demo.legalhub.local'];
  const karachiClient = clientMap['client.karachi@demo.legalhub.local'];

  const FEED_ITEMS = [
    {
      client: multanClient,
      title: 'Agricultural land inheritance mutation (Intiqal Wirasat) procedure in Multan',
      practiceArea: 'Civil',
      city: 'Multan',
      content: 'My late grandfather owned agricultural land in Tehsil Shujabad, District Multan. The patwari is delaying the inheritance mutation citing missing Fard Malkiyat. What legal remedy exists under the Punjab Land Revenue Act 1967?',
      status: 'open',
      answers: [
        {
          lawyerEmail: 'tariq.mehmood@demo.legalhub.local',
          content: 'Under Section 42 of the Punjab Land Revenue Act 1967, an inheritance mutation must be entered by the Revenue Officer upon acquiring right of succession without unreasonable delay. You can obtain the computerised Fard directly from the Arazi Record Center (PLRA) Shujabad without relying on field patwaris. If refused, file an application before the Tehsildar / Assistant Collector Grade-II.'
        }
      ]
    },
    {
      client: lahoreClient,
      title: 'Child custody and maintenance jurisdiction under Family Courts Act 1964',
      practiceArea: 'Family',
      city: 'Lahore',
      content: 'My sister separated from her husband who lives in Faisalabad, but she resides with her minor son in Model Town Lahore. Can she institute a suit for maintenance and custody in the Family Court at Lahore?',
      status: 'open',
      answers: [
        {
          lawyerEmail: 'fatima.noor@demo.legalhub.local',
          content: 'Yes, absolutely. Under Section 17 & the special provisions of the Family Courts Act 1964, as well as Rule 6 of the West Pakistan Family Courts Rules, a suit for maintenance and custody can be instituted in the Family Court where the wife or minor child currently resides. The Lahore Family Court has complete territorial jurisdiction.'
        }
      ]
    },
    {
      client: karachiClient,
      title: 'Pre-arrest bail (Bail Before Arrest) criteria in corporate fraud allegations',
      practiceArea: 'Criminal',
      city: 'Karachi',
      content: 'A commercial partner has lodged a fabricated FIR under Section 406/420 PPC at Saddar Police Station alleging breach of trust in import goods. What are the legal grounds required to obtain protective/pre-arrest bail before the Sessions Court?',
      status: 'open',
      answers: [
        {
          lawyerEmail: 'zulfiqar.bhutto@demo.legalhub.local',
          content: 'Under Section 498 CrPC and landmark Supreme Court precedents, pre-arrest bail requires demonstrating (1) genuine apprehension of arrest, (2) ulterior motive or malice on the part of the complainant/police to cause humiliation, and (3) that the dispute is prima facie of civil nature (commercial contract) rather than criminal fraud. You should immediately petition the Sessions Court for ad-interim pre-arrest bail.'
        }
      ]
    },
    {
      client: lahoreClient,
      title: 'Warranty claim rejection by smartphone manufacturer under Consumer Protection Act',
      practiceArea: 'Consumer',
      city: 'Rawalpindi',
      content: 'Purchased a laptop with 1-year official warranty in Saddar Rawalpindi. The motherboard failed within 3 months, but the vendor refused replacement citing unverified liquid damage. How do I proceed in the District Consumer Protection Court?',
      status: 'closed',
      answers: [
        {
          lawyerEmail: 'ayesha.gul@demo.legalhub.local',
          content: 'Under the Punjab Consumer Protection Act 2005 (applicable in Rawalpindi), you must first serve a 15-day statutory legal notice upon the manufacturer/vendor. If they fail to redress your grievance, file a consumer complaint before the District Consumer Court Rawalpindi within 30 days of the cause of action. You may claim replacement, refund, and damages for mental agony.'
        }
      ]
    }
  ];

  console.log('\n📝 Seeding Community Legal Feed Enquiries...');
  for (const item of FEED_ITEMS) {
    if (!item.client) continue;

    let question = await CommunityQuestion.findOne({
      where: { title: item.title, clientId: item.client.id }
    });

    if (!question) {
      question = await CommunityQuestion.create({
        clientId: item.client.id,
        title: item.title,
        practiceArea: item.practiceArea,
        city: item.city,
        content: item.content,
        status: item.status,
        answersCount: item.answers.length
      });
      console.log(`💬 Question Created: "${question.title.slice(0, 50)}..."`);
    } else {
      await question.update({
        practiceArea: item.practiceArea,
        city: item.city,
        content: item.content,
        status: item.status,
        answersCount: item.answers.length
      });
      console.log(`💬 Question Updated: "${question.title.slice(0, 50)}..."`);
    }

    // Seed Answers
    for (const ans of item.answers) {
      const lawyerUser = lawyerMap[ans.lawyerEmail];
      if (!lawyerUser) continue;

      let existingAns = await CommunityAnswer.findOne({
        where: { questionId: question.id, lawyerId: lawyerUser.id }
      });

      if (!existingAns) {
        await CommunityAnswer.create({
          questionId: question.id,
          lawyerId: lawyerUser.id,
          content: ans.content
        });
        console.log(`   └─ Answer Added by ${lawyerUser.name}`);
      }
    }
  }

  console.log('\n✨ Comprehensive LegalHub Platform Seed Completed Successfully!');
  console.log('-----------------------------------------------------------------');
  console.log('Credentials Summary:');
  console.log('Password for all test accounts: Password123!');
  console.log('Admin Account:   admin@demo.legalhub.local');
  console.log('Client Multan:   client.multan@demo.legalhub.local');
  console.log('Client Lahore:   client.lahore@demo.legalhub.local');
  console.log('Client Karachi:  client.karachi@demo.legalhub.local');
  console.log('Advocate Lahore: fatima.noor@demo.legalhub.local (High Court, Family/Civil)');
  console.log('Advocate Multan: tariq.mehmood@demo.legalhub.local (High Court, Civil/Corporate)');
  console.log('Advocate Khi:    zulfiqar.bhutto@demo.legalhub.local (Supreme Court, Criminal/Const)');
  console.log('Advocate Rwp:    ayesha.gul@demo.legalhub.local (Lower Courts, Family/Consumer)');
  console.log('-----------------------------------------------------------------');

  process.exit(0);
}

seedComprehensive().catch((err) => {
  console.error('❌ Seeding failed with error:', err);
  process.exit(1);
});
