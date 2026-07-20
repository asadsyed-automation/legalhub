const Review = require('./review.model');

async function createReview({ gigId, citizenId, rating, comment }) {
  if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5');

  return await Review.create({ gig_id: gigId, citizen_id: citizenId, rating, comment });
}

async function getReviewsForGig(gigId) {
  return await Review.findAll({ where: { gig_id: gigId }, order: [['created_at', 'DESC']] });
}

module.exports = { createReview, getReviewsForGig };