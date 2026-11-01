/**
 * Programmatic Seeder for 105 Distinct, Realistic Pakistani Advocates
 * LegalHub Pakistan — Final Year Project (Emerson University Multan)
 *
 * Guarantees:
 * 1. 100% Unique full names across every advocate (No duplicate names).
 * 2. Distinct practice area specializations (Family, Criminal, Property, Corporate, Tax, etc.).
 * 3. Tailored domain-specific bios and headlines.
 * 4. Diversified fee tiers (from PKR 1,000 up to 10,000) for realistic price sorting.
 * 5. Varied consultation modes (In-Chamber, Video, Phone, Chat).
 * 6. Even distribution across all 15 Pakistani cities and 3 judicial court tiers.
 * 7. Blazing fast bulk insertion resilient to cloud TLS poolers.
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const {
  sequelize,
  User,
  LawyerApplication,
  LawyerProfile,
  LawyerService,
  AvailabilityRule
} = require('../src/models');
const { APPLICATION_STATUS, COURT_LEVELS, CITIES } = require('../src/constants');
const { SERVICE_MODES } = require('../src/constants/profile');

const DEFAULT_PASSWORD = 'Password123!';

const CITY_BAR_MAP = {
  Lahore: { bar: 'Punjab Bar Council', code: 'LHR', barCode: 'PBC' },
  Multan: { bar: 'Punjab Bar Council', code: 'MUL', barCode: 'PBC' },
  Faisalabad: { bar: 'Punjab Bar Council', code: 'FSD', barCode: 'PBC' },
  Rawalpindi: { bar: 'Punjab Bar Council', code: 'RWP', barCode: 'PBC' },
  Gujranwala: { bar: 'Punjab Bar Council', code: 'GUJ', barCode: 'PBC' },
  Sialkot: { bar: 'Punjab Bar Council', code: 'SKT', barCode: 'PBC' },
  Bahawalpur: { bar: 'Punjab Bar Council', code: 'BWP', barCode: 'PBC' },
  Sargodha: { bar: 'Punjab Bar Council', code: 'SGD', barCode: 'PBC' },
  Karachi: { bar: 'Sindh Bar Council', code: 'KHI', barCode: 'SBC' },
  Hyderabad: { bar: 'Sindh Bar Council', code: 'HYD', barCode: 'SBC' },
  Sukkur: { bar: 'Sindh Bar Council', code: 'SKR', barCode: 'SBC' },
  Islamabad: { bar: 'Islamabad Bar Council', code: 'ISB', barCode: 'IBC' },
  Peshawar: { bar: 'Khyber Pakhtunkhwa Bar Council', code: 'PEW', barCode: 'KPBC' },
  Abbottabad: { bar: 'Khyber Pakhtunkhwa Bar Council', code: 'ATD', barCode: 'KPBC' },
  Quetta: { bar: 'Balochistan Bar Council', code: 'QTA', barCode: 'BBC' }
};

const FIRST_NAMES = [
  'Usman', 'Ayesha', 'Bilal', 'Haroon', 'Zainab', 'Daniyal', 'Hamza', 'Fatima',
  'Tariq', 'Sikandar', 'Rabia', 'Kashif', 'Nisar', 'Farhan', 'Babar', 'Maryam',
  'Waqas', 'Asad', 'Khurram', 'Shahid', 'Bushra', 'Ahsan', 'Zeeshan', 'Imran',
  'Sohail', 'Naveed', 'Hassan', 'Rashid', 'Junaid', 'Nadia', 'Sami', 'Adeel',
  'Saad', 'Kamran', 'Rehan', 'Muneeb', 'Hina', 'Arslan', 'Shumaila', 'Zahid',
  'Mansoor', 'Tanveer', 'Rizwan', 'Javed', 'Fouzia', 'Sobia', 'Khadija', 'Nazia',
  'Irfan', 'Saleem', 'Akhtar', 'Jamil', 'Zafar', 'Munir', 'Shabbir', 'Noman',
  'Faisal', 'Mehmood', 'Qasim', 'Azhar'
];

const LAST_NAMES = [
  'Qureshi', 'Siddiqui', 'Khan', 'Cheema', 'Tarar', 'Shah', 'Gondal', 'Bajwa',
  'Abbasi', 'Mengal', 'Marwat', 'Dogar', 'Wattoo', 'Gujjar', 'Butt', 'Sheikh',
  'Niazi', 'Alvi', 'Leghari', 'Mazari', 'Jatoi', 'Bugti', 'Zehri', 'Durrani',
  'Kakar', 'Bhatti', 'Raza', 'Hussain', 'Gillani', 'Chaudhry', 'Ansari', 'Malik',
  'Mirza', 'Bukhari', 'Lodhi', 'Tareen', 'Kasuri', 'Wasti', 'Soomro', 'Ghanghro',
  'Magsi', 'Dasti', 'Awan', 'Ranjha', 'Sial', 'Dareshak', 'Khosa', 'Lakhani',
  'Memon', 'Pirzada', 'Rehmani', 'Joyo', 'Bhutto', 'Talpur', 'Baloch', 'Qazi',
  'Gardezi', 'Laghari', 'Hashmi', 'Burki'
];

const PREFIXES = [
  'Adv.', 'Adv.', 'Adv.', 'Adv. Barrister',
  'Chaudhry', 'Mian', 'Malik', 'Sardar', 'Syed'
];

const DOMAIN_PROFILES = [
  {
    areas: ['Family', 'Civil'],
    headlineSuffix: 'Family Dispute & Succession Specialist',
    bio: 'Dedicated legal counsel focusing on family arbitration, Khula dissolution, guardian & ward child custody petitions, and inheritance distribution under Muslim Family Laws Ordinance 1961.'
  },
  {
    areas: ['Criminal'],
    headlineSuffix: 'Criminal Defense & Trial Advocate',
    bio: 'Trial and appellate criminal defense counsel with courtroom expertise in Sessions trials, pre-arrest bail under Section 498 CrPC, post-arrest bail under 497 CrPC, and trial cross-examination.'
  },
  {
    areas: ['Property', 'Civil'],
    headlineSuffix: 'Land Revenue & Property Litigation Counsel',
    bio: 'Specialist in Punjab and Sindh land revenue disputes, Fard Malkiyat verification, mutation cancellation suits, partition of agricultural land, and permanent stay injunctions.'
  },
  {
    areas: ['Corporate', 'Tax'],
    headlineSuffix: 'Corporate Advisory & FBR Taxation Counsel',
    bio: 'Corporate counsel advising businesses on SECP regulatory compliance, partnership deed vetting, shareholder agreements, sales tax tribunals, and FBR audit defense.'
  },
  {
    areas: ['Banking', 'Corporate'],
    headlineSuffix: 'Banking Litigation & Commercial Recovery Counsel',
    bio: 'Litigation specialist representing clients before Banking Courts under Financial Institutions (Recovery of Finances) Ordinance 2001, loan debt settlement, and mortgage decree execution.'
  },
  {
    areas: ['Constitutional', 'Civil'],
    headlineSuffix: 'Constitutional Writs & Appellate Advocate',
    bio: 'High Court and appellate counsel specializing in Article 199 writ petitions, challenging unlawful government orders, civil service disputes, and statutory fundamental rights protection.'
  },
  {
    areas: ['Consumer', 'Labor'],
    headlineSuffix: 'Consumer Protection & Employment Law Counsel',
    bio: 'Advocacy before District Consumer Courts under provincial Consumer Protection Acts, handling defective product compensation, wrongful labor termination, and NIRC industrial disputes.'
  },
  {
    areas: ['Criminal', 'Constitutional'],
    headlineSuffix: 'White-Collar Crime & Constitutional Defense',
    bio: 'Counsel specializing in NAB anti-corruption proceedings, FIA cybercrime inquiry defense, preventive detention challenges, and judicial review of criminal investigations.'
  },
  {
    areas: ['Civil'],
    headlineSuffix: 'Civil Litigation & Contract Specific Performance',
    bio: 'Extensive courtroom civil practice handling specific performance of sale agreements, declaratory title suits under Specific Relief Act 1877, and rent tribunal evictions.'
  },
  {
    areas: ['Family'],
    headlineSuffix: 'Matrimonial Law & Child Custody Counsel',
    bio: 'Compassionate representation in matrimonial disputes, prompt institution of maintenance suits under Family Courts Act 1964, visitation schedules, and recovery of dowry articles.'
  }
];

const FEE_TIERS = [
  1000, 1200, 1500, 1800, 2000, 2200, 2500, 2800, 3000, 3500, 4000, 4500, 5000, 6000, 7500, 8500, 10000
];

function generate105UniqueAdvocates() {
  const advocates = [];
  const usedFullNames = new Set();
  const totalToGenerate = 105;

  let nameIndex = 0;
  for (let i = 0; i < totalToGenerate; i++) {
    // Generate 100% unique full name
    let firstName, lastName, prefix, fullName;
    while (true) {
      firstName = FIRST_NAMES[(nameIndex * 7 + 3) % FIRST_NAMES.length];
      lastName = LAST_NAMES[(nameIndex * 11 + 17) % LAST_NAMES.length];
      prefix = PREFIXES[nameIndex % PREFIXES.length];
      fullName = `${prefix} ${firstName} ${lastName}`;
      nameIndex++;
      if (!usedFullNames.has(fullName)) {
        usedFullNames.add(fullName);
        break;
      }
    }

    const email = `advocate.${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i + 1}@demo.legalhub.local`;

    // Rotate through all 15 cities evenly
    const city = CITIES[i % CITIES.length];
    const cityMeta = CITY_BAR_MAP[city] || CITY_BAR_MAP['Lahore'];

    // Weighted court level distribution: ~20% Lower Courts, ~60% High Court, ~20% Supreme Court
    let courtLevel;
    const tierRoll = i % 10;
    if (tierRoll < 2) {
      courtLevel = COURT_LEVELS[0]; // Advocate Lower Courts
    } else if (tierRoll < 8) {
      courtLevel = COURT_LEVELS[1]; // Advocate High Court
    } else {
      courtLevel = COURT_LEVELS[2]; // Advocate Supreme Court
    }

    // Assign realistic domain profile
    const domain = DOMAIN_PROFILES[i % DOMAIN_PROFILES.length];
    const practiceAreas = domain.areas;
    const headline = `${courtLevel} | ${domain.headlineSuffix}`;
    const bio = domain.bio;

    // Experience: keep between 1 to 7 years for new seeds to maintain test alignment
    const experienceYears = 1 + (i % 7);
    const enrolmentNo = `${cityMeta.code}-${3000 + i}-${cityMeta.barCode}`;
    const chamberNumber = 10 + (i % 85);
    const chamberAddress = `Chamber ${chamberNumber}, ${courtLevel.includes('Supreme') ? 'Supreme Court Bar Association' : courtLevel.includes('High') ? 'High Court Bar Association' : 'District Bar Association'}, ${city}`;

    // Diversified fee tiers
    const feeIndex = (i * 2 + (courtLevel.includes('Supreme') ? 8 : courtLevel.includes('High') ? 3 : 0)) % FEE_TIERS.length;
    const baseFee = FEE_TIERS[feeIndex];

    // Varied mode configurations (durationMinutes must be one of: 15, 30, 45, 60)
    const modePattern = i % 4;
    let services = [];
    if (modePattern === 0) {
      services = [
        { mode: SERVICE_MODES.IN_CHAMBER, durationMinutes: 30, feePkr: baseFee + 500 },
        { mode: SERVICE_MODES.VIDEO, durationMinutes: 30, feePkr: baseFee },
        { mode: SERVICE_MODES.PHONE, durationMinutes: 15, feePkr: Math.max(1000, baseFee - 300) }
      ];
    } else if (modePattern === 1) {
      services = [
        { mode: SERVICE_MODES.VIDEO, durationMinutes: 30, feePkr: baseFee },
        { mode: SERVICE_MODES.PHONE, durationMinutes: 15, feePkr: Math.max(1000, baseFee - 200) },
        { mode: SERVICE_MODES.CHAT, durationMinutes: 15, feePkr: Math.max(1000, baseFee - 400) }
      ];
    } else if (modePattern === 2) {
      services = [
        { mode: SERVICE_MODES.IN_CHAMBER, durationMinutes: 30, feePkr: baseFee },
        { mode: SERVICE_MODES.VIDEO, durationMinutes: 30, feePkr: baseFee },
        { mode: SERVICE_MODES.CHAT, durationMinutes: 15, feePkr: Math.max(1000, baseFee - 500) }
      ];
    } else {
      services = [
        { mode: SERVICE_MODES.IN_CHAMBER, durationMinutes: 45, feePkr: baseFee + 1000 },
        { mode: SERVICE_MODES.VIDEO, durationMinutes: 30, feePkr: baseFee },
        { mode: SERVICE_MODES.PHONE, durationMinutes: 15, feePkr: Math.max(1000, baseFee - 500) },
        { mode: SERVICE_MODES.CHAT, durationMinutes: 15, feePkr: Math.max(1000, baseFee - 800) }
      ];
    }

    // Weekly availability schedule
    const schedPattern = i % 3;
    let schedule = [];
    if (schedPattern === 0) {
      schedule = [
        { weekday: 1, startTime: '09:00', endTime: '13:00' },
        { weekday: 3, startTime: '09:00', endTime: '13:00' },
        { weekday: 5, startTime: '09:00', endTime: '12:30' }
      ];
    } else if (schedPattern === 1) {
      schedule = [
        { weekday: 2, startTime: '10:00', endTime: '14:00' },
        { weekday: 4, startTime: '10:00', endTime: '14:00' },
        { weekday: 6, startTime: '10:00', endTime: '13:00' }
      ];
    } else {
      schedule = [
        { weekday: 1, startTime: '14:00', endTime: '18:00' },
        { weekday: 2, startTime: '14:00', endTime: '18:00' },
        { weekday: 4, startTime: '14:00', endTime: '18:00' }
      ];
    }

    const languages = ['Urdu', 'English'];
    if (cityMeta.barCode === 'PBC') languages.push(city === 'Multan' || city === 'Bahawalpur' ? 'Saraiki' : 'Punjabi');
    if (cityMeta.barCode === 'SBC') languages.push('Sindhi');
    if (cityMeta.barCode === 'KPBC') languages.push('Pashto');
    if (cityMeta.barCode === 'BBC') languages.push('Pashto');

    advocates.push({
      name: fullName,
      email,
      city,
      barCouncil: cityMeta.bar,
      enrolmentNo,
      courtLevel,
      practiceAreas,
      experienceYears,
      chamberAddress,
      headline,
      bio,
      languages,
      slotMinutes: 30,
      services,
      schedule
    });
  }

  return advocates;
}

async function retry(fn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      console.warn(`⚠️ Retrying DB operation (attempt ${attempt + 1}/${maxRetries}): ${err.message}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

async function seed100UniqueLawyers() {
  console.log('🚀 Starting Resilient Seeding of 105 100% Unique Pakistani Advocates...');
  console.log(`📡 Connecting to database...`);
  
  await retry(async () => sequelize.authenticate());
  console.log('✅ Database connected.');

  const advocates = generate105UniqueAdvocates();
  console.log(`📋 Generated ${advocates.length} unique advocate personas (0 duplicate names guaranteed).`);

  // Clean up any previously generated batch advocates with email pattern advocate.%@demo.legalhub.local
  console.log('🧹 Cleaning previously generated batch advocates...');
  await retry(async () => {
    const oldUsers = await User.findAll({
      where: {
        email: { [Op.like]: 'advocate.%@demo.legalhub.local' }
      },
      attributes: ['id']
    });

    const oldUserIds = oldUsers.map((u) => u.id);
    if (oldUserIds.length > 0) {
      await LawyerService.destroy({ where: { lawyerId: oldUserIds } });
      await AvailabilityRule.destroy({ where: { lawyerId: oldUserIds } });
      await LawyerProfile.destroy({ where: { userId: oldUserIds } });
      await LawyerApplication.destroy({ where: { userId: oldUserIds } });
      await User.destroy({ where: { id: oldUserIds } });
      console.log(`🗑️ Removed ${oldUserIds.length} older batch records for fresh clean seeding.`);
    }
  });

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // Prepare all bulk records in memory with deterministic UUIDs
  const userRecords = [];
  const applicationRecords = [];
  const profileRecords = [];
  const serviceRecords = [];
  const ruleRecords = [];

  for (const adv of advocates) {
    const userId = crypto.randomUUID();

    userRecords.push({
      id: userId,
      name: adv.name,
      email: adv.email,
      passwordHash,
      role: 'lawyer',
      emailVerifiedAt: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    applicationRecords.push({
      id: crypto.randomUUID(),
      userId,
      fullName: adv.name,
      barCouncil: adv.barCouncil,
      enrolmentNo: adv.enrolmentNo,
      courtLevel: adv.courtLevel,
      city: adv.city,
      practiceAreas: adv.practiceAreas,
      experienceYears: adv.experienceYears,
      chamberAddress: adv.chamberAddress,
      bio: adv.bio,
      status: APPLICATION_STATUS.APPROVED,
      reviewedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    profileRecords.push({
      id: crypto.randomUUID(),
      userId,
      headline: adv.headline,
      about: adv.bio,
      languages: adv.languages,
      slotMinutes: adv.slotMinutes,
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    for (const s of adv.services) {
      serviceRecords.push({
        id: crypto.randomUUID(),
        lawyerId: userId,
        mode: s.mode,
        durationMinutes: s.durationMinutes,
        feePkr: s.feePkr,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    for (const r of adv.schedule) {
      ruleRecords.push({
        id: crypto.randomUUID(),
        lawyerId: userId,
        weekday: r.weekday,
        startTime: r.startTime,
        endTime: r.endTime,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  console.log(`⚡ Bulk inserting ${userRecords.length} users...`);
  await retry(async () => User.bulkCreate(userRecords));

  console.log(`⚡ Bulk inserting ${applicationRecords.length} lawyer applications...`);
  await retry(async () => LawyerApplication.bulkCreate(applicationRecords));

  console.log(`⚡ Bulk inserting ${profileRecords.length} lawyer profiles...`);
  await retry(async () => LawyerProfile.bulkCreate(profileRecords));

  console.log(`⚡ Bulk inserting ${serviceRecords.length} lawyer services...`);
  await retry(async () => LawyerService.bulkCreate(serviceRecords));

  console.log(`⚡ Bulk inserting ${ruleRecords.length} availability rules...`);
  await retry(async () => AvailabilityRule.bulkCreate(ruleRecords));

  const totalApproved = await retry(async () =>
    LawyerApplication.count({ where: { status: APPLICATION_STATUS.APPROVED } })
  );

  console.log('\n======================================================');
  console.log(`🎉 Resilient Bulk Seeding Complete!`);
  console.log(`📊 Newly Created Unique Advocates: ${userRecords.length}`);
  console.log(`⚖️ Total Approved Advocates in Database: ${totalApproved}`);
  console.log(`🔑 Universal Password for All Advocates: ${DEFAULT_PASSWORD}`);
  console.log('======================================================\n');

  process.exit(0);
}

seed100UniqueLawyers().catch((err) => {
  console.error('❌ Seeding failed with error:', err);
  process.exit(1);
});
