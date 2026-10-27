const messageService = require('./message.service');

const sendBookingMessage = async (req, res, next) => {
  try {
    const message = await messageService.sendBookingMessage(req.params.id, req.user, req.body);
    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    next(error);
  }
};

const getBookingMessages = async (req, res, next) => {
  try {
    const result = await messageService.getBookingMessages(req.params.id, req.user, req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const sendCaseMessage = async (req, res, next) => {
  try {
    const message = await messageService.sendCaseMessage(req.params.id, req.user, req.body);
    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    next(error);
  }
};

const getCaseMessages = async (req, res, next) => {
  try {
    const result = await messageService.getCaseMessages(req.params.id, req.user, req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendBookingMessage,
  getBookingMessages,
  sendCaseMessage,
  getCaseMessages
};
