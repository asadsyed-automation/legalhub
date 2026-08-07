const { addFee, updateFeeStatus, submitPaymentReceipt, verifyPaymentReceipt, getFeesForCase } = require('./fee.service');

async function create(req, res) {
  try {
    const fee = await addFee({ caseId: req.body.case_id, lawyerId: req.user.id, amount: req.body.amount });
    res.status(201).json(fee);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function updateStatus(req, res) {
  try {
    const fee = await updateFeeStatus({ feeId: req.params.id, lawyerId: req.user.id, newStatus: req.body.status });
    res.json(fee);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function submitReceipt(req, res) {
  try {
    const fee = await submitPaymentReceipt({
      feeId: req.params.id,
      clientId: req.user.id,
      receiptUrl: req.body.receipt_url,
      paymentMethod: req.body.payment_method,
      transactionId: req.body.transaction_id,
    });
    res.json(fee);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function verifyReceipt(req, res) {
  try {
    const fee = await verifyPaymentReceipt({
      feeId: req.params.id,
      lawyerId: req.user.id,
      approved: req.body.approved,
      rejectionReason: req.body.rejection_reason,
    });
    res.json(fee);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getForCase(req, res) {
  try {
    const fees = await getFeesForCase({ caseId: req.params.caseId, userId: req.user.id, role: req.user.role });
    res.json(fees);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { create, updateStatus, submitReceipt, verifyReceipt, getForCase };