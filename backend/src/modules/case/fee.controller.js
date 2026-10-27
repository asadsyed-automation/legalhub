const feeService = require('./fee.service');

/**
 * Handles upserting (creating or updating) the fee agreement for a case file.
 * Responds with 200 OK.
 */
const upsertFeeAgreement = async (req, res, next) => {
  try {
    const feeAgreement = await feeService.upsertFeeAgreement(
      req.params.id,
      req.user,
      req.body
    );

    res.status(200).json({
      message: 'Fee agreement saved successfully',
      feeAgreement
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles recording a client payment against a case file.
 * Responds with 201 Created.
 */
const recordFeePayment = async (req, res, next) => {
  try {
    const payment = await feeService.recordFeePayment(
      req.params.id,
      req.user,
      req.body
    );

    res.status(201).json({
      message: 'Payment recorded successfully',
      payment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles retrieving the complete fee ledger (agreed, paid, balance, payments).
 * Responds with 200 OK.
 */
const getCaseFees = async (req, res, next) => {
  try {
    const result = await feeService.getCaseFees(req.params.id, req.user);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upsertFeeAgreement,
  recordFeePayment,
  getCaseFees
};
