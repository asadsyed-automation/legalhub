const engagementService = require('./engagement.service');

const createEngagement = async (req, res, next) => {
  try {
    const engagement = await engagementService.createEngagement(req.user, req.body);
    res.status(201).json({
      success: true,
      message: 'Engagement created successfully',
      data: engagement
    });
  } catch (error) {
    next(error);
  }
};

const listEngagements = async (req, res, next) => {
  try {
    const result = await engagementService.listEngagements(req.user, req.query);
    res.status(200).json({
      success: true,
      message: 'Engagements retrieved successfully',
      data: result.engagements,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

const getEngagementById = async (req, res, next) => {
  try {
    const engagement = await engagementService.getEngagementById(req.params.id, req.user);
    res.status(200).json({
      success: true,
      message: 'Engagement retrieved successfully',
      data: engagement
    });
  } catch (error) {
    next(error);
  }
};

const updateEngagement = async (req, res, next) => {
  try {
    const engagement = await engagementService.updateEngagement(
      req.params.id,
      req.user,
      req.body
    );
    res.status(200).json({
      success: true,
      message: 'Engagement updated successfully',
      data: engagement
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEngagement,
  listEngagements,
  getEngagementById,
  updateEngagement
};
