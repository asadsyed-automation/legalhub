const { Booking, Review, User } = require('../../models');
const AppError = require('../../utils/AppError');
const { BOOKING_STATUS } = require('../../constants/booking');
const { ROLES } = require('../../constants/roles');

/**
 * Submits a verified review for a completed booking.
 *
 * @param {string} bookingId
 * @param {object} user
 * @param {{ rating: number, comment: string }} data
 * @returns {Promise<Review>}
 */
const createReview = async (bookingId, user, { rating, comment }) => {
  const booking = await Booking.findByPk(bookingId);

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  // Only the client who booked the consultation can submit a review
  if (booking.clientId !== user.id) {
    throw new AppError(
      'Forbidden: Only the client who booked this consultation can submit a review',
      403
    );
  }

  // Reviews are only allowed for completed consultations
  if (booking.status !== BOOKING_STATUS.COMPLETED) {
    throw new AppError(
      `Reviews can only be submitted for completed consultations. Current status is '${booking.status}'`,
      400
    );
  }

  // Check for duplicate review
  const existingReview = await Review.findOne({
    where: { bookingId }
  });

  if (existingReview) {
    throw new AppError('A review has already been submitted for this consultation', 409);
  }

  const review = await Review.create({
    bookingId,
    clientId: user.id,
    lawyerId: booking.lawyerId,
    rating,
    comment,
    isPublic: true
  });

  return review;
};

/**
 * Retrieves public reviews and aggregate rating statistics for a lawyer/firm.
 *
 * @param {string} lawyerId
 * @param {{ page?: number, limit?: number }} query
 * @returns {Promise<object>}
 */
const getLawyerReviews = async (lawyerId, { page = 1, limit = 10 } = {}) => {
  const lawyer = await User.findByPk(lawyerId, {
    attributes: ['id', 'name', 'role']
  });

  if (!lawyer || (lawyer.role !== ROLES.LAWYER && lawyer.role !== ROLES.LAW_FIRM)) {
    throw new AppError('Legal practitioner not found', 404);
  }

  const offset = (page - 1) * limit;

  // Retrieve paginated reviews with client summary
  const { count, rows: reviews } = await Review.findAndCountAll({
    where: {
      lawyerId,
      isPublic: true
    },
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

  // Calculate aggregates over all public reviews for this practitioner
  const allReviews = await Review.findAll({
    where: {
      lawyerId,
      isPublic: true
    },
    attributes: ['rating']
  });

  const totalReviews = allReviews.length;
  let avgRating = 0;
  const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  if (totalReviews > 0) {
    const sum = allReviews.reduce((acc, r) => {
      ratingBreakdown[r.rating] = (ratingBreakdown[r.rating] || 0) + 1;
      return acc + r.rating;
    }, 0);
    avgRating = Math.round((sum / totalReviews) * 10) / 10;
  }

  const totalPages = Math.ceil(count / limit) || 1;

  return {
    lawyer: {
      id: lawyer.id,
      name: lawyer.name,
      role: lawyer.role
    },
    statistics: {
      avgRating,
      reviewCount: totalReviews,
      ratingBreakdown
    },
    reviews,
    pagination: {
      total: count,
      page,
      limit,
      totalPages
    }
  };
};

/**
 * Advocate replies to a review on their consultation.
 *
 * @param {string} bookingId
 * @param {object} user
 * @param {string} reply
 * @returns {Promise<Review>}
 */
const replyToReview = async (bookingId, user, reply) => {
  const review = await Review.findOne({
    where: { bookingId }
  });

  if (!review) {
    throw new AppError('Review not found for this consultation', 404);
  }

  // Only the advocate of this booking can reply
  if (review.lawyerId !== user.id) {
    throw new AppError('Forbidden: Only the assigned advocate can reply to this review', 403);
  }

  if (!reply || !reply.trim()) {
    throw new AppError('Reply cannot be empty', 400);
  }

  review.lawyerReply = reply.trim();
  review.repliedAt = new Date();
  await review.save();

  return review;
};

module.exports = {
  createReview,
  getLawyerReviews,
  replyToReview
};

