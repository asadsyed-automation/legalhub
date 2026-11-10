const { Router } = require('express');
const feedController = require('./feed.controller');
const verifyToken = require('../../middleware/verifyToken');
const requireRole = require('../../middleware/requireRole');
const validate = require('../../middleware/validate');
const {
  createQuestionSchema,
  queryQuestionsSchema,
  createAnswerSchema,
  idParamSchema
} = require('./feed.schemas');
const { ROLES } = require('../../constants/roles');

const router = Router();

// Public community feed endpoints
router.get(
  '/',
  validate(queryQuestionsSchema, 'query'),
  feedController.listQuestions
);

router.get(
  '/:id',
  validate(idParamSchema, 'params'),
  feedController.getQuestionById
);

// Protected Client question creation
router.post(
  '/',
  verifyToken,
  requireRole(ROLES.CLIENT),
  validate(createQuestionSchema),
  feedController.createQuestion
);

// Protected Lawyer response to question (Advocates & Law Firms)
router.post(
  '/:id/answers',
  verifyToken,
  requireRole(ROLES.LAWYER, ROLES.LAW_FIRM),
  validate(createAnswerSchema),
  feedController.createAnswer
);

// Protected Client resolution/closure
router.patch(
  '/:id/close',
  verifyToken,
  requireRole(ROLES.CLIENT),
  validate(idParamSchema, 'params'),
  feedController.closeQuestion
);

// Protected Deletion (Admin moderation or Author Client)
router.delete(
  '/:id',
  verifyToken,
  validate(idParamSchema, 'params'),
  feedController.deleteQuestion
);

module.exports = router;

