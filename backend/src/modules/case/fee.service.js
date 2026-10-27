const { Case, FeeAgreement, FeePayment } = require('../../models');
const { ROLES } = require('../../constants');
const AppError = require('../../utils/AppError');

/**
 * Upserts (creates or updates) the fee agreement for a case file.
 * Restricted strictly to the assigned advocate.
 *
 * @param {string} caseId - UUID of the case
 * @param {object} user - Authenticated user
 * @param {object} payload - Fee agreement terms (type, agreedAmountPkr, notes)
 * @returns {Promise<object>} Saved FeeAgreement
 */
const upsertFeeAgreement = async (caseId, user, payload) => {
  if (user.role === ROLES.ADMIN) {
    throw new AppError('Forbidden: Administrators cannot modify fee agreements', 403);
  }

  if (user.role !== ROLES.LAWYER) {
    throw new AppError('Forbidden: Only approved advocates can set fee agreements', 403);
  }

  const caseRecord = await Case.findByPk(caseId);
  if (!caseRecord) {
    throw new AppError('Case file not found', 404);
  }

  if (caseRecord.lawyerId !== user.id) {
    throw new AppError('Forbidden: You can only set fee agreements for your own case files', 403);
  }

  let agreement = await FeeAgreement.findOne({ where: { caseId } });

  if (agreement) {
    agreement.type = payload.type;
    agreement.agreedAmountPkr = payload.agreedAmountPkr;
    if (payload.notes !== undefined) {
      agreement.notes = payload.notes;
    }
    await agreement.save();
  } else {
    agreement = await FeeAgreement.create({
      caseId,
      type: payload.type,
      agreedAmountPkr: payload.agreedAmountPkr,
      notes: payload.notes || null
    });
  }

  return agreement;
};

/**
 * Records a client payment against a case file.
 * Restricted strictly to the assigned advocate.
 *
 * @param {string} caseId - UUID of the case
 * @param {object} user - Authenticated user
 * @param {object} payload - Payment details (amountPkr, method, reference, paidOn, note)
 * @returns {Promise<object>} Created FeePayment
 */
const recordFeePayment = async (caseId, user, payload) => {
  if (user.role === ROLES.ADMIN) {
    throw new AppError('Forbidden: Administrators cannot record fee payments', 403);
  }

  if (user.role !== ROLES.LAWYER) {
    throw new AppError('Forbidden: Only approved advocates can record fee payments', 403);
  }

  const caseRecord = await Case.findByPk(caseId);
  if (!caseRecord) {
    throw new AppError('Case file not found', 404);
  }

  if (caseRecord.lawyerId !== user.id) {
    throw new AppError('Forbidden: You can only record fee payments for your own case files', 403);
  }

  const payment = await FeePayment.create({
    caseId,
    amountPkr: payload.amountPkr,
    method: payload.method,
    reference: payload.reference || null,
    paidOn: payload.paidOn,
    note: payload.note || null
  });

  return payment;
};

/**
 * Retrieves the complete fee ledger for a case file.
 * Visible to the assigned advocate and the linked litigant client.
 *
 * @param {string} caseId - UUID of the case
 * @param {object} user - Authenticated user
 * @returns {Promise<{ agreed: number, paid: number, balance: number, feeAgreement: object|null, payments: object[] }>}
 */
const getCaseFees = async (caseId, user) => {
  if (user.role === ROLES.ADMIN) {
    throw new AppError(
      'Forbidden: Administrators have no access to confidential case fee records',
      403
    );
  }

  const caseRecord = await Case.findByPk(caseId);
  if (!caseRecord) {
    throw new AppError('Case file not found', 404);
  }

  if (user.role === ROLES.LAWYER && caseRecord.lawyerId !== user.id) {
    throw new AppError(
      'Forbidden: You cannot access fee records for a case belonging to another chamber',
      403
    );
  }

  if (user.role === ROLES.CLIENT && caseRecord.clientId !== user.id) {
    throw new AppError(
      'Forbidden: You cannot access fee records for a case not linked to your account',
      403
    );
  }

  const [agreement, payments] = await Promise.all([
    FeeAgreement.findOne({ where: { caseId } }),
    FeePayment.findAll({
      where: { caseId },
      order: [
        ['paidOn', 'DESC'],
        ['createdAt', 'DESC']
      ]
    })
  ]);

  const agreed = agreement ? Number(agreement.agreedAmountPkr) : 0;
  const paid = payments.reduce((sum, p) => sum + Number(p.amountPkr), 0);
  const balance = agreed - paid;

  return {
    agreed,
    paid,
    balance,
    feeAgreement: agreement,
    payments
  };
};

module.exports = {
  upsertFeeAgreement,
  recordFeePayment,
  getCaseFees
};
