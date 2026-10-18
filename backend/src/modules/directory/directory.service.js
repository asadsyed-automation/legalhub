const { Op } = require('sequelize');
const { LawyerApplication, User } = require('../../models');
const { APPLICATION_STATUS } = require('../../constants');
const AppError = require('../../utils/AppError');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/**
 * Projects a raw LawyerApplication database record into the strictly sanitized
 * public-facing representation. Permanently omits email, enrolmentNo, and chamberAddress.
 *
 * @param {LawyerApplication} app
 * @returns {object}
 */
const projectPublicLawyer = (app) => ({
  id: app.id,
  name: app.user ? app.user.name : '',
  city: app.city,
  practiceAreas: app.practiceAreas,
  experienceYears: app.experienceYears,
  barCouncil: app.barCouncil,
  courtLevel: app.courtLevel,
  bio: app.bio
});

/**
 * Query public directory of approved lawyers with pagination and filters.
 *
 * @param {object} params - { city, practiceArea, page, limit }
 * @returns {Promise<{ items: Array<object>, total: number, page: number, limit: number }>}
 */
const getPublicLawyers = async ({ city, practiceArea, page, limit }) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || DEFAULT_PAGE);
  let parsedLimit = parseInt(limit, 10) || DEFAULT_LIMIT;

  if (parsedLimit < 1) parsedLimit = DEFAULT_LIMIT;
  if (parsedLimit > MAX_LIMIT) parsedLimit = MAX_LIMIT;

  const offset = (parsedPage - 1) * parsedLimit;

  // Strict Rule: ONLY approved lawyers can ever appear in the public directory
  const where = {
    status: APPLICATION_STATUS.APPROVED
  };

  if (city && city.trim() !== '') {
    where.city = city.trim();
  }

  if (practiceArea && practiceArea.trim() !== '') {
    where.practiceAreas = {
      [Op.contains]: [practiceArea.trim()]
    };
  }

  const { count, rows } = await LawyerApplication.findAndCountAll({
    where,
    limit: parsedLimit,
    offset,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['name']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  const items = rows.map(projectPublicLawyer);

  return {
    items,
    total: count,
    page: parsedPage,
    limit: parsedLimit
  };
};

/**
 * Retrieve public details of a single approved lawyer by ID.
 * Returns 404 if not found or if not in 'approved' status.
 *
 * @param {string} id - Application UUID
 * @returns {Promise<object>}
 */
const getPublicLawyerById = async (id) => {
  const application = await LawyerApplication.findOne({
    where: {
      id,
      status: APPLICATION_STATUS.APPROVED
    },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['name']
      }
    ]
  });

  if (!application) {
    throw new AppError('Lawyer not found', 404);
  }

  return projectPublicLawyer(application);
};

module.exports = {
  getPublicLawyers,
  getPublicLawyerById
};
