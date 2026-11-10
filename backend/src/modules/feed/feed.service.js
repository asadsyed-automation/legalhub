const { Op } = require('sequelize');
const {
  CommunityQuestion,
  CommunityAnswer,
  User,
  LawyerApplication,
  LawyerProfile
} = require('../../models');
const { APPLICATION_STATUS } = require('../../constants');
const { ROLES } = require('../../constants/roles');
const AppError = require('../../utils/AppError');

/**
 * Masks client full name to protect citizen privacy on public legal forum.
 * e.g., "Muhammad Aqeel" -> "Muhammad A."
 */
const maskClientName = (fullName) => {
  if (!fullName || typeof fullName !== 'string') return 'Anonymous Citizen';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0].toUpperCase();
  return `${first} ${lastInitial}.`;
};

/**
 * Lists public community questions with optional filtering and pagination.
 *
 * @param {object} params
 * @returns {Promise<object>}
 */
const listQuestions = async (params = {}) => {
  const page = Number(params.page) || 1;
  const limit = Math.min(Number(params.limit) || 20, 50);
  const offset = (page - 1) * limit;

  const where = {};

  if (params.status && params.status !== 'all') {
    where.status = params.status;
  } else if (!params.status) {
    where.status = 'open';
  }

  if (params.practiceArea) {
    where.practiceArea = params.practiceArea;
  }

  if (params.city) {
    where.city = { [Op.iLike]: `%${params.city.trim()}%` };
  }

  if (params.clientId) {
    where.clientId = params.clientId;
  }

  if (params.q && params.q.trim()) {
    const query = `%${params.q.trim()}%`;
    where[Op.or] = [
      { title: { [Op.iLike]: query } },
      { content: { [Op.iLike]: query } }
    ];
  }

  const { count, rows } = await CommunityQuestion.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'client',
        attributes: ['id', 'name']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  const totalPages = Math.ceil(count / limit) || 1;

  const formattedItems = rows.map((q) => ({
    id: q.id,
    title: q.title,
    practiceArea: q.practiceArea,
    city: q.city,
    content: q.content,
    status: q.status,
    answersCount: q.answersCount,
    clientName: maskClientName(q.client ? q.client.name : null),
    createdAt: q.createdAt,
    updatedAt: q.updatedAt
  }));

  return {
    items: formattedItems,
    total: count,
    page,
    limit,
    totalPages
  };
};

/**
 * Retrieves a single community question and all verified advocate answers.
 *
 * @param {string} id - Question UUID
 * @returns {Promise<object>}
 */
const getQuestionById = async (id) => {
  const question = await CommunityQuestion.findByPk(id, {
    include: [
      {
        model: User,
        as: 'client',
        attributes: ['id', 'name']
      },
      {
        model: CommunityAnswer,
        as: 'answers',
        include: [
          {
            model: User,
            as: 'lawyer',
            attributes: ['id', 'name'],
            include: [
              {
                model: LawyerApplication,
                as: 'lawyerApplication',
                attributes: ['id', 'barCouncil', 'courtLevel', 'city', 'practiceAreas', 'status']
              },
              {
                model: LawyerProfile,
                as: 'profile',
                attributes: ['headline', 'about', 'isPublic']
              }
            ]
          }
        ]
      }
    ],
    order: [[{ model: CommunityAnswer, as: 'answers' }, 'createdAt', 'ASC']]
  });

  if (!question) {
    throw new AppError('Legal feed question not found', 404);
  }

  const formattedAnswers = (question.answers || []).map((ans) => {
    const lawyerUser = ans.lawyer || {};
    const app = lawyerUser.lawyerApplication || {};
    const profile = lawyerUser.profile || {};

    return {
      id: ans.id,
      content: ans.content,
      createdAt: ans.createdAt,
      updatedAt: ans.updatedAt,
      lawyer: {
        id: lawyerUser.id,
        name: lawyerUser.name,
        barCouncil: app.barCouncil || null,
        courtLevel: app.courtLevel || null,
        city: app.city || null,
        practiceAreas: app.practiceAreas || [],
        headline: profile.headline || null,
        about: profile.about || null,
        isApproved: app.status === APPLICATION_STATUS.APPROVED
      }
    };
  });

  return {
    id: question.id,
    title: question.title,
    practiceArea: question.practiceArea,
    city: question.city,
    content: question.content,
    status: question.status,
    answersCount: question.answersCount,
    clientName: maskClientName(question.client ? question.client.name : null),
    clientId: question.clientId,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
    answers: formattedAnswers
  };
};

/**
 * Creates a new community legal question. (Clients only)
 *
 * @param {string} clientId
 * @param {object} payload
 * @returns {Promise<object>}
 */
const createQuestion = async (clientId, payload) => {
  const question = await CommunityQuestion.create({
    clientId,
    title: payload.title.trim(),
    practiceArea: payload.practiceArea,
    city: payload.city ? payload.city.trim() : null,
    content: payload.content.trim(),
    status: 'open',
    answersCount: 0
  });

  return question;
};

/**
 * Submits an advocate answer to a community question. (Approved Lawyers only)
 *
 * @param {string} lawyerUserId
 * @param {string} questionId
 * @param {object} payload
 * @returns {Promise<object>}
 */
const createAnswer = async (lawyerUserId, questionId, payload) => {
  const question = await CommunityQuestion.findByPk(questionId);
  if (!question) {
    throw new AppError('Question not found', 404);
  }

  if (question.status === 'closed') {
    throw new AppError('This legal question has been closed and is no longer accepting answers', 400);
  }

  // Ensure lawyer has an approved application
  const app = await LawyerApplication.findOne({
    where: {
      userId: lawyerUserId,
      status: APPLICATION_STATUS.APPROVED
    }
  });

  if (!app) {
    throw new AppError('Only admin-reviewed approved advocates can provide legal opinions on the public feed', 403);
  }

  const answer = await CommunityAnswer.create({
    questionId,
    lawyerId: lawyerUserId,
    content: payload.content.trim()
  });

  // Increment answers count on question
  await question.increment('answersCount');

  return answer;
};

/**
 * Closes a community question. (Client owner only)
 *
 * @param {string} clientId
 * @param {string} questionId
 * @returns {Promise<object>}
 */
const closeQuestion = async (clientId, questionId) => {
  const question = await CommunityQuestion.findByPk(questionId);
  if (!question) {
    throw new AppError('Question not found', 404);
  }

  if (question.clientId !== clientId) {
    throw new AppError('Forbidden: You can only close legal questions that you submitted', 403);
  }

  question.status = 'closed';
  await question.save();

  return question;
};

/**
 * Deletes a community question and its associated answers.
 * Permitted for:
 * 1. Admin (disciplinary / moderation oversight)
 * 2. Author citizen who submitted the question
 *
 * @param {object} user - Authenticated user object from req.user
 * @param {string} questionId
 * @returns {Promise<{ id: string, message: string }>}
 */
const deleteQuestion = async (user, questionId) => {
  const question = await CommunityQuestion.findByPk(questionId);
  if (!question) {
    throw new AppError('Question not found', 404);
  }

  const isAdmin = user && user.role === ROLES.ADMIN;
  const isOwner = user && user.id === question.clientId;

  if (!isAdmin && !isOwner) {
    throw new AppError('Forbidden: Only an administrator or the question author may delete this inquiry', 403);
  }

  // Delete associated answers first, then question
  await CommunityAnswer.destroy({ where: { questionId } });
  await question.destroy();

  return {
    id: questionId,
    message: isAdmin
      ? 'Question and all associated answers removed by administrator moderation'
      : 'Question deleted successfully by author'
  };
};

module.exports = {
  listQuestions,
  getQuestionById,
  createQuestion,
  createAnswer,
  closeQuestion,
  deleteQuestion,
  maskClientName
};
