const reviewService = require('./review.service');

const createReview = async (req, res, next) => {
  try {
    const review = await reviewService.createReview(req.params.id, req.user, req.body);
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

const getLawyerReviews = async (req, res, next) => {
  try {
    const result = await reviewService.getLawyerReviews(req.params.id, req.query);
    res.status(200).json({
      success: true,
      message: 'Reviews retrieved successfully',
      data: result,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

const replyToReview = async (req, res, next) => {
  try {
    const review = await reviewService.replyToReview(req.params.id, req.user, req.body.reply);
    res.status(200).json({
      success: true,
      message: 'Reply posted successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getLawyerReviews,
  replyToReview
};

