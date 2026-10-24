const enquiryService = require('./enquiry.service');

/**
 * Client submits a pre-booking enquiry to an advocate.
 */
const createEnquiry = async (req, res, next) => {
  try {
    const result = await enquiryService.createEnquiry(req.user.id, req.body);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Client fetches their submitted enquiries.
 */
const getMyEnquiries = async (req, res, next) => {
  try {
    const result = await enquiryService.getClientEnquiries(req.user.id, req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch a single enquiry by ID.
 */
const getEnquiryById = async (req, res, next) => {
  try {
    const result = await enquiryService.getEnquiryById(
      req.user.id,
      req.user.role,
      req.params.id
    );
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Close an active enquiry.
 */
const closeEnquiry = async (req, res, next) => {
  try {
    const result = await enquiryService.closeEnquiry(
      req.user.id,
      req.user.role,
      req.params.id
    );
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Advocate retrieves incoming enquiries from clients.
 */
const getLawyerEnquiries = async (req, res, next) => {
  try {
    const result = await enquiryService.getLawyerEnquiries(req.user.id, req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Advocate replies to an incoming client enquiry.
 */
const replyToEnquiry = async (req, res, next) => {
  try {
    const result = await enquiryService.replyToEnquiry(
      req.user.id,
      req.params.id,
      req.body.reply
    );
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEnquiry,
  getMyEnquiries,
  getEnquiryById,
  closeEnquiry,
  getLawyerEnquiries,
  replyToEnquiry
};
