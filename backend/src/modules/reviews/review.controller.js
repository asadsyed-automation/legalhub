const { createReview, getReviewsForGig } = require('./review.service');

async function create(req, res) {
  try {
    const review = await createReview({
      gigId: req.body.gig_id,
      citizenId: req.user.id,
      rating: req.body.rating,
      comment: req.body.comment,
    });
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getForGig(req, res) {
  try {
    const reviews = await getReviewsForGig(req.params.gigId);
    res.json(reviews);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { create, getForGig };