const { Op } = require('sequelize');
const { sequelize, LawyerApplication, User, LawyerProfile, LawyerService } = require('../../models');
const { APPLICATION_STATUS } = require('../../constants');
const AppError = require('../../utils/AppError');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/**
 * Projects a raw LawyerApplication database record into the strictly sanitized
 * public-facing directory item. Never exposes email, enrolmentNo, or chamberAddress.
 *
 * @param {LawyerApplication} app
 * @returns {object}
 */
const projectPublicDirectoryItem = (app) => {
  const activeServices = (app.services || []).filter((s) => s.isActive !== false);
  const activeFees = activeServices
    .map((s) => s.feePkr)
    .filter((f) => typeof f === 'number' && !isNaN(f));
  const feeFrom = activeFees.length > 0 ? Math.min(...activeFees) : null;
  const modes = Array.from(new Set(activeServices.map((s) => s.mode)));

  return {
    id: app.id,
    name: app.user ? app.user.name : '',
    city: app.city,
    practiceAreas: app.practiceAreas || [],
    experienceYears: app.experienceYears,
    barCouncil: app.barCouncil,
    courtLevel: app.courtLevel,
    bio: app.bio,
    headline: app.profile ? app.profile.headline : null,
    languages:
      app.profile && Array.isArray(app.profile.languages)
        ? app.profile.languages
        : ['Urdu', 'English'],
    modes,
    feeFrom
  };
};

/**
 * Projects an approved lawyer record into full public detail with about and services.
 *
 * @param {LawyerApplication} app
 * @returns {object}
 */
const projectPublicLawyerDetail = (app) => {
  const base = projectPublicDirectoryItem(app);
  const activeServices = (app.services || [])
    .filter((s) => s.isActive !== false)
    .map((s) => ({
      id: s.id,
      mode: s.mode,
      durationMinutes: s.durationMinutes,
      feePkr: s.feePkr
    }));

  return {
    ...base,
    about: app.profile ? app.profile.about : null,
    slotMinutes: app.profile ? app.profile.slotMinutes : 30,
    services: activeServices
  };
};

/**
 * Query public directory of approved lawyers with pagination, enriched filters, and sorting.
 *
 * @param {object} queryParams
 * @returns {Promise<{ items: Array<object>, total: number, page: number, limit: number }>}
 */
const getPublicLawyers = async (queryParams = {}) => {
  const {
    city,
    practiceArea,
    language,
    mode,
    minFee,
    maxFee,
    courtLevel,
    sort = 'experience',
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT
  } = queryParams;

  const parsedPage = Math.max(1, parseInt(page, 10) || DEFAULT_PAGE);
  let parsedLimit = parseInt(limit, 10) || DEFAULT_LIMIT;
  if (parsedLimit < 1) parsedLimit = DEFAULT_LIMIT;
  if (parsedLimit > MAX_LIMIT) parsedLimit = MAX_LIMIT;
  const offset = (parsedPage - 1) * parsedLimit;

  // Strict Rule 1: ONLY approved lawyers can ever appear in the public directory
  const where = {
    status: APPLICATION_STATUS.APPROVED
  };

  // Strict Rule 2: Omit advocates where profile.isPublic === false
  where[Op.and] = where[Op.and] || [];
  where[Op.and].push(
    sequelize.literal(`NOT EXISTS (
      SELECT 1 FROM lawyer_profiles 
      WHERE lawyer_profiles."userId" = "LawyerApplication"."userId" 
      AND lawyer_profiles."isPublic" = false
    )`)
  );

  // Filter by City
  if (city && city.trim() !== '') {
    where.city = city.trim();
  }

  // Filter by Court Level
  if (courtLevel && courtLevel.trim() !== '') {
    where.courtLevel = courtLevel.trim();
  }

  // Filter by Practice Area
  if (practiceArea && practiceArea.trim() !== '') {
    where.practiceAreas = {
      [Op.contains]: [practiceArea.trim()]
    };
  }

  // Filter by Language
  if (language && language.trim() !== '') {
    const trimmedLang = language.trim();
    if (['Urdu', 'English'].includes(trimmedLang)) {
      where[Op.and].push(
        sequelize.literal(`(
          EXISTS (
            SELECT 1 FROM lawyer_profiles 
            WHERE lawyer_profiles."userId" = "LawyerApplication"."userId" 
            AND ${sequelize.escape(trimmedLang)} = ANY(lawyer_profiles."languages")
          )
          OR NOT EXISTS (
            SELECT 1 FROM lawyer_profiles 
            WHERE lawyer_profiles."userId" = "LawyerApplication"."userId"
          )
        )`)
      );
    } else {
      where[Op.and].push(
        sequelize.literal(`EXISTS (
          SELECT 1 FROM lawyer_profiles 
          WHERE lawyer_profiles."userId" = "LawyerApplication"."userId" 
          AND ${sequelize.escape(trimmedLang)} = ANY(lawyer_profiles."languages")
        )`)
      );
    }
  }

  // Filter by Consultation Mode
  if (mode && mode.trim() !== '') {
    where[Op.and].push(
      sequelize.literal(`EXISTS (
        SELECT 1 FROM lawyer_services 
        WHERE lawyer_services."lawyerId" = "LawyerApplication"."userId" 
        AND lawyer_services."isActive" = true 
        AND lawyer_services."mode" = ${sequelize.escape(mode.trim())}
      )`)
    );
  }

  // Filter by Minimum Fee
  if (minFee !== undefined && minFee !== null && !isNaN(Number(minFee))) {
    where[Op.and].push(
      sequelize.literal(`(
        SELECT MIN("feePkr") FROM lawyer_services 
        WHERE lawyer_services."lawyerId" = "LawyerApplication"."userId" 
        AND lawyer_services."isActive" = true
      ) >= ${Number(minFee)}`)
    );
  }

  // Filter by Maximum Fee
  if (maxFee !== undefined && maxFee !== null && !isNaN(Number(maxFee))) {
    where[Op.and].push(
      sequelize.literal(`(
        SELECT MIN("feePkr") FROM lawyer_services 
        WHERE lawyer_services."lawyerId" = "LawyerApplication"."userId" 
        AND lawyer_services."isActive" = true
      ) <= ${Number(maxFee)}`)
    );
  }

  // Sorting: experience (default), fee_asc, fee_desc, newest
  let orderClause;
  switch (sort) {
    case 'newest':
      orderClause = [['createdAt', 'DESC'], ['id', 'ASC']];
      break;
    case 'fee_asc':
      orderClause = [
        [
          sequelize.literal(`(
            SELECT MIN("feePkr") FROM lawyer_services 
            WHERE lawyer_services."lawyerId" = "LawyerApplication"."userId" 
            AND lawyer_services."isActive" = true
          )`),
          'ASC NULLS LAST'
        ],
        ['id', 'ASC']
      ];
      break;
    case 'fee_desc':
      orderClause = [
        [
          sequelize.literal(`(
            SELECT MIN("feePkr") FROM lawyer_services 
            WHERE lawyer_services."lawyerId" = "LawyerApplication"."userId" 
            AND lawyer_services."isActive" = true
          )`),
          'DESC NULLS LAST'
        ],
        ['id', 'ASC']
      ];
      break;
    case 'experience':
    default:
      orderClause = [['experienceYears', 'DESC'], ['id', 'ASC']];
      break;
  }

  const { count, rows } = await LawyerApplication.findAndCountAll({
    where,
    limit: parsedLimit,
    offset,
    distinct: true,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['name']
      },
      {
        model: LawyerProfile,
        as: 'profile',
        attributes: ['headline', 'about', 'languages', 'slotMinutes', 'isPublic'],
        required: false
      },
      {
        model: LawyerService,
        as: 'services',
        attributes: ['id', 'mode', 'durationMinutes', 'feePkr', 'isActive'],
        where: { isActive: true },
        required: false
      }
    ],
    order: orderClause
  });

  const items = rows.map(projectPublicDirectoryItem);

  return {
    items,
    total: count,
    page: parsedPage,
    limit: parsedLimit
  };
};

/**
 * Retrieve public details of a single approved lawyer by Application ID or User ID.
 * Returns 404 if not found, if not approved, or if profile isPublic === false.
 *
 * @param {string} id - Application UUID or User UUID
 * @returns {Promise<object>}
 */
const getPublicLawyerById = async (id) => {
  const application = await LawyerApplication.findOne({
    where: {
      [Op.or]: [{ id }, { userId: id }],
      status: APPLICATION_STATUS.APPROVED
    },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['name']
      },
      {
        model: LawyerProfile,
        as: 'profile',
        attributes: ['headline', 'about', 'languages', 'slotMinutes', 'isPublic'],
        required: false
      },
      {
        model: LawyerService,
        as: 'services',
        attributes: ['id', 'mode', 'durationMinutes', 'feePkr', 'isActive'],
        where: { isActive: true },
        required: false
      }
    ]
  });

  if (!application) {
    throw new AppError('Lawyer not found', 404);
  }

  if (application.profile && application.profile.isPublic === false) {
    throw new AppError('Lawyer profile is currently private', 404);
  }

  return projectPublicLawyerDetail(application);
};

module.exports = {
  getPublicLawyers,
  getPublicLawyerById,
  projectPublicDirectoryItem,
  projectPublicLawyerDetail
};
