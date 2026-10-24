'use strict';

const ENGAGEMENT_STATUS = Object.freeze({
  ACTIVE: 'active',
  CLOSED: 'closed'
});

const ALLOWED_ENGAGEMENT_STATUSES = Object.freeze(Object.values(ENGAGEMENT_STATUS));

const REVIEW_CONSTANTS = Object.freeze({
  MIN_RATING: 1,
  MAX_RATING: 5,
  MIN_COMMENT_LENGTH: 10,
  MAX_COMMENT_LENGTH: 1000
});

module.exports = {
  ENGAGEMENT_STATUS,
  ALLOWED_ENGAGEMENT_STATUSES,
  REVIEW_CONSTANTS
};
