const timelineService = require('./timeline.service');

/**
 * Handles retrieving the unified chronological timeline for a case file.
 * Responds with 200 OK and paginated timeline items.
 */
const getCaseTimeline = async (req, res, next) => {
  try {
    const result = await timelineService.getCaseTimeline(
      req.params.id,
      req.user,
      req.query
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCaseTimeline
};
