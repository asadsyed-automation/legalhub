const matchingService = require('./matching.service');

/**
 * Classifies legal problem text description into practice areas with confidence.
 */
const classify = async (req, res, next) => {
  try {
    const result = matchingService.classifyText(req.body.text);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Executes multi-factor match search returning scored candidates and plain reasons.
 */
const search = async (req, res, next) => {
  try {
    const result = await matchingService.searchMatches(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  classify,
  search
};
