/**
 * Realistic Marketplace Seed Script for LegalHub Pakistan
 * Seeds verified advocates across major cities, specialities, fee ranges, and available schedules.
 */

const bcrypt = require('bcryptjs');
const {
  sequelize,
  User,
  LawyerApplication,
  LawyerProfile,
  LawyerService,
  AvailabilityRule
} = require('../src/models');
const { APPLICATION_STATUS } = require('../src/constants');
const { SERVICE_MODES } = require('../src/constants/profile');

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
      { weekday: 1, startTime: '09:00', endTime: '13:00' }, // Monday
      { weekday: 1, startTime: '15:00', endTime: '18:00' },
      { weekday: 3, startTime: '09:00', endTime: '13:00' }, // Wednesday
      { weekday: 3, startTime: '15:00', endTime: '18:00' },
      { weekday: 5, startTime: '09:00', endTime: '12:30' }  // Friday
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
      { weekday: 2, startTime: '10:00', endTime: '14:00' }, // Tuesday
      { weekday: 2, startTime: '16:00', endTime: '19:00' },
      { weekday: 4, startTime: '10:00', endTime: '14:00' }, // Thursday
      { weekday: 4, startTime: '16:00', endTime: '19:00' },
      { weekday: 6, startTime: '10:00', endTime: '13:00' }  // Saturday
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
      { weekday: 1, startTime: '11:00', endTime: '15:00' }, // Monday
      { weekday: 2, startTime: '11:00', endTime: '15:00' }, // Tuesday
      { weekday: 3, startTime: '11:00', endTime: '15:00' }  // Wednesday
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
      { mode: SERVICE_MODES.IN_CHAMBER, durationMinutes: 30, feePkr: 4500 },
      { mode: SERVICE_MODES.PHONE, durationMinutes: 30, feePkr: 2500 }
    ],
    schedule: [
      { weekday: 1, startTime: '09:00', endTime: '13:00' },
      { weekday: 2, startTime: '09:00', endTime: '13:00' },
      { weekday: 3, startTime: '09:00', endTime: '13:00' },
      { weekday: 4, startTime: '09:00', endTime: '13:00' }
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
      { weekday: 2, startTime: '15:00', endTime: '17:30' },
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
      { mode: SERVICE_MODES.PHONE, durationMinutes: 30, feePkr: 1500 },
      { mode: SERVICE_MODES.VIDEO, durationMinutes: 30, feePkr: 1800 },
      { mode: SERVICE_MODES.IN_CHAMBER, durationMinutes: 30, feePkr: 2000 }
    ],
    schedule: [
      { weekday: 1, startTime: '14:00', endTime: '18:00' },
      { weekday: 3, startTime: '14:00', endTime: '18:00' },
      { weekday: 4, startTime: '14:00', endTime: '18:00' }
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
    chamberAddress: 'Chamber 7, Balochistan Bar Association, High Court Complex, Hali Road, Quetta',
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
      { mode: SERVICE_MODES.VIDEO, durationMinutes: 30, feePkr: 1800 },
      { mode: SERVICE_MODES.PHONE, durationMinutes: 15, feePkr: 1000 }
    ],
    schedule: [
      { weekday: 1, startTime: '09:30', endTime: '13:30' },
      { weekday: 3, startTime: '09:30', endTime: '13:30' },
      { weekday: 5, startTime: '09:30', endTime: '12:30' }
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
      { weekday: 4, startTime: '10:00', endTime: '14:00' },
      { weekday: 6, startTime: '10:00', endTime: '13:00' }
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
      { mode: SERVICE_MODES.IN_CHAMBER, durationMinutes: 30, feePkr: 2200 },
      { mode: SERVICE_MODES.PHONE, durationMinutes: 30, feePkr: 1200 }
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

async function seedMarketplace() {
  console.log('🌱 Starting Realistic Marketplace Seed for LegalHub Pakistan...');
  const passwordHash = await bcrypt.hash('Password123!', 10);

  for (const adv of ADVOCATES) {
    const t = await sequelize.transaction();
    try {
      // 1. Upsert User
      let user = await User.findOne({ where: { email: adv.email }, transaction: t });
      if (!user) {
        user = await User.create(
          {
            name: adv.name,
            email: adv.email,
            passwordHash,
            role: 'lawyer'
          },
          { transaction: t }
        );
      } else {
        await user.update({ name: adv.name, passwordHash }, { transaction: t });
      }

      // 2. Upsert LawyerApplication
      let app = await LawyerApplication.findOne({ where: { userId: user.id }, transaction: t });
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
        app = await LawyerApplication.create(appData, { transaction: t });
      } else {
        await app.update(appData, { transaction: t });
      }

      // 3. Upsert LawyerProfile
      let profile = await LawyerProfile.findOne({ where: { userId: user.id }, transaction: t });
      const profileData = {
        userId: user.id,
        headline: adv.headline,
        about: adv.about,
        languages: adv.languages,
        slotMinutes: adv.slotMinutes,
        isPublic: true
      };

      if (!profile) {
        profile = await LawyerProfile.create(profileData, { transaction: t });
      } else {
        await profile.update(profileData, { transaction: t });
      }

      // 4. Upsert Services
      await LawyerService.destroy({ where: { lawyerId: user.id }, transaction: t });
      for (const s of adv.services) {
        await LawyerService.create(
          {
            lawyerId: user.id,
            mode: s.mode,
            durationMinutes: s.durationMinutes,
            feePkr: s.feePkr,
            isActive: true
          },
          { transaction: t }
        );
      }

      // 5. Upsert Availability Rules
      await AvailabilityRule.destroy({ where: { lawyerId: user.id }, transaction: t });
      for (const r of adv.schedule) {
        await AvailabilityRule.create(
          {
            lawyerId: user.id,
            weekday: r.weekday,
            startTime: r.startTime,
            endTime: r.endTime
          },
          { transaction: t }
        );
      }

      await t.commit();
      console.log(`✅ Seeded: ${adv.name} (${adv.city} - ${adv.courtLevel})`);
    } catch (err) {
      await t.rollback();
      console.error(`❌ Failed seeding ${adv.name}:`, err.message);
    }
  }

  console.log('🎉 Marketplace Seed Completed Successfully!');
  process.exit(0);
}

seedMarketplace().catch((err) => {
  console.error('Fatal seeding error:', err);
  process.exit(1);
});
