const feedService = require('./feed.service');

const listQuestions = async (req, res, next) => {
  try {
    const result = await feedService.listQuestions(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getQuestionById = async (req, res, next) => {
  try {
    const result = await feedService.getQuestionById(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const createQuestion = async (req, res, next) => {
  try {
    const result = await feedService.createQuestion(req.user.id, req.body);
    res.status(201).json({
      message: 'Your legal question has been posted to the public feed successfully.',
      question: result
    });
  } catch (error) {
    next(error);
  }
};

const createAnswer = async (req, res, next) => {
  try {
    const result = await feedService.createAnswer(req.user.id, req.params.id, req.body);
    res.status(201).json({
      message: 'Your legal answer has been posted successfully.',
      answer: result
    });
  } catch (error) {
    next(error);
  }
};

const closeQuestion = async (req, res, next) => {
  try {
    const result = await feedService.closeQuestion(req.user.id, req.params.id);
    res.status(200).json({
      message: 'Legal question marked as resolved/closed.',
      question: result
    });
  } catch (error) {
    next(error);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    const result = await feedService.deleteQuestion(req.user, req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listQuestions,
  getQuestionById,
  createQuestion,
  createAnswer,
  closeQuestion,
  deleteQuestion
};

