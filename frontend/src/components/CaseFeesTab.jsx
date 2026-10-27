import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import caseApi from '../api/case.api';
import EmptyState from './EmptyState';
import {
  BriefcaseIcon,
  CheckIcon,
  PlusIcon,
  CloseIcon,
  DocumentIcon,
} from './Icons';
import {
  FEE_AGREEMENT_TYPES,
  FEE_AGREEMENT_TYPE_LABELS,
  FEE_PAYMENT_METHODS,
  FEE_PAYMENT_METHOD_LABELS,
  FEE_LIMITS,
} from '../constants';
import './CaseFeesTab.css';

export const CaseFeesTab = ({ caseId, isLawyer }) => {
  const [feeData, setFeeData] = useState({
    agreed: 0,
    paid: 0,
    balance: 0,
    feeAgreement: null,
    payments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Agreement Editor State (Advocate)
  const [isEditingAgreement, setIsEditingAgreement] = useState(false);
  const [agreementType, setAgreementType] = useState('fixed');
  const [agreedAmount, setAgreedAmount] = useState('');
  const [agreementNotes, setAgreementNotes] = useState('');
  const [savingAgreement, setSavingAgreement] = useState(false);
  const [agreementError, setAgreementError] = useState(null);
  const [agreementSuccess, setAgreementSuccess] = useState(null);

  // Record Payment Modal State (Advocate)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [paymentNote, setPaymentNote] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  const fetchFees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await caseApi.getFees(caseId);
      const data = res?.data || res || {};
      setFeeData({
        agreed: Number(data.agreed) || 0,
        paid: Number(data.paid) || 0,
        balance: Number(data.balance) || 0,
        feeAgreement: data.feeAgreement || null,
        payments: Array.isArray(data.payments) ? data.payments : [],
      });

      // Populate agreement editor fields
      if (data.feeAgreement) {
        setAgreementType(data.feeAgreement.type || 'fixed');
        setAgreedAmount(String(data.feeAgreement.agreedAmountPkr || '0'));
        setAgreementNotes(data.feeAgreement.notes || '');
        setIsEditingAgreement(false);
      } else {
        setAgreementType('fixed');
        setAgreedAmount('');
        setAgreementNotes('');
        setIsEditingAgreement(isLawyer); // Open by default if no agreement exists
      }
    } catch (err) {
      console.error('Failed to load case fee ledger:', err);
      setError(
        err.response?.data?.message ||
          'Failed to load fee agreement and payment ledger. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [caseId, isLawyer]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  // Helpers
  const formatPkr = (val) => {
    const num = Number(val) || 0;
    return `PKR ${num.toLocaleString('en-PK')}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Save Agreement Handler (Lawyer)
  const handleSaveAgreement = async (e) => {
    e.preventDefault();
    setAgreementError(null);
    setAgreementSuccess(null);

    const amountNum = parseInt(agreedAmount, 10);
    if (isNaN(amountNum) || amountNum < FEE_LIMITS.MIN_AGREED_AMOUNT_PKR) {
      setAgreementError('Please enter a valid agreed fee amount in PKR.');
      return;
    }
    if (amountNum > FEE_LIMITS.MAX_FEE_PKR) {
      setAgreementError(
        `Agreed amount cannot exceed ${formatPkr(FEE_LIMITS.MAX_FEE_PKR)}.`
      );
      return;
    }
    if (
      agreementNotes.length > FEE_LIMITS.MAX_AGREEMENT_NOTES_LENGTH
    ) {
      setAgreementError(
        `Notes cannot exceed ${FEE_LIMITS.MAX_AGREEMENT_NOTES_LENGTH} characters.`
      );
      return;
    }

    setSavingAgreement(true);
    try {
      await caseApi.upsertFeeAgreement(caseId, {
        type: agreementType,
        agreedAmountPkr: amountNum,
        notes: agreementNotes.trim() || null,
      });

      setAgreementSuccess('Fee agreement terms saved successfully.');
      setIsEditingAgreement(false);
      await fetchFees();
    } catch (err) {
      console.error('Failed to save fee agreement:', err);
      setAgreementError(
        err.response?.data?.message ||
          'Failed to update fee agreement. Please check inputs.'
      );
    } finally {
      setSavingAgreement(false);
    }
  };

  // Record Payment Handler (Lawyer)
  const handleSavePayment = async (e) => {
    e.preventDefault();
    setPaymentError(null);

    const amountNum = parseInt(paymentAmount, 10);
    if (isNaN(amountNum) || amountNum < FEE_LIMITS.MIN_PAYMENT_PKR) {
      setPaymentError(
        `Payment amount must be at least ${formatPkr(FEE_LIMITS.MIN_PAYMENT_PKR)}.`
      );
      return;
    }
    if (amountNum > FEE_LIMITS.MAX_FEE_PKR) {
      setPaymentError(
        `Payment amount cannot exceed ${formatPkr(FEE_LIMITS.MAX_FEE_PKR)}.`
      );
      return;
    }
    if (!paymentDate) {
      setPaymentError('Payment date is required.');
      return;
    }
    if (
      paymentRef &&
      paymentRef.length > FEE_LIMITS.MAX_PAYMENT_REF_LENGTH
    ) {
      setPaymentError(
        `Reference cannot exceed ${FEE_LIMITS.MAX_PAYMENT_REF_LENGTH} characters.`
      );
      return;
    }
    if (
      paymentNote &&
      paymentNote.length > FEE_LIMITS.MAX_PAYMENT_NOTE_LENGTH
    ) {
      setPaymentError(
        `Remarks cannot exceed ${FEE_LIMITS.MAX_PAYMENT_NOTE_LENGTH} characters.`
      );
      return;
    }

    setSavingPayment(true);
    try {
      await caseApi.recordPayment(caseId, {
        amountPkr: amountNum,
        method: paymentMethod,
        reference: paymentRef.trim() || null,
        paidOn: paymentDate,
        note: paymentNote.trim() || null,
      });

      setPaymentSuccess(
        `Payment installment of ${formatPkr(amountNum)} recorded successfully.`
      );
      setIsPaymentModalOpen(false);
      setPaymentAmount('');
      setPaymentRef('');
      setPaymentNote('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      await fetchFees();
    } catch (err) {
      console.error('Failed to record payment:', err);
      setPaymentError(
        err.response?.data?.message ||
          'Failed to record payment. Please check required fields.'
      );
    } finally {
      setSavingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="tab-loading-state" style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto var(--spacing-3)' }} />
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
          Loading fee agreement and chamber ledger...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tab-error-state" style={{ padding: 'var(--spacing-6)', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-danger)', fontWeight: 'var(--font-weight-semibold)' }}>{error}</p>
        <button
          type="button"
          className="btn btn--outline"
          onClick={fetchFees}
          style={{ marginTop: 'var(--spacing-3)' }}
        >
          Retry Loading Fees
        </button>
      </div>
    );
  }

  const isSettled = feeData.agreed > 0 && feeData.balance <= 0;
  const isPending = feeData.agreed > 0 && feeData.balance > 0;

  return (
    <div className="fees-tab">
      {/* ===================================================================
          1. TOP SUMMARY METRIC CARDS (Agreed, Paid, Chamber Balance Due)
          =================================================================== */}
      <div className="fees-metrics-grid">
        {/* Agreed Total */}
        <div className="fees-metric-card fees-metric-card--agreed">
          <div className="fees-metric-card__header">
            <span className="fees-metric-card__label">Total Agreed Fee</span>
            <div className="fees-metric-card__icon-wrapper">
              <DocumentIcon size={18} />
            </div>
          </div>
          <div className="fees-metric-card__value">
            {formatPkr(feeData.agreed)}
          </div>
          <span className="fees-metric-card__status-pill" style={{ backgroundColor: '#eff6ff', color: '#1e40af' }}>
            {feeData.feeAgreement
              ? FEE_AGREEMENT_TYPE_LABELS[feeData.feeAgreement.type] || feeData.feeAgreement.type
              : 'Agreement Not Set'}
          </span>
        </div>

        {/* Total Paid */}
        <div className="fees-metric-card fees-metric-card--paid">
          <div className="fees-metric-card__header">
            <span className="fees-metric-card__label">Total Paid to Date</span>
            <div className="fees-metric-card__icon-wrapper">
              <CheckIcon size={18} />
            </div>
          </div>
          <div className="fees-metric-card__value">
            {formatPkr(feeData.paid)}
          </div>
          <span className="fees-metric-card__status-pill" style={{ backgroundColor: '#ecfdf5', color: '#065f46' }}>
            {feeData.payments.length} installment{feeData.payments.length === 1 ? '' : 's'} recorded
          </span>
        </div>

        {/* Chamber Balance Due */}
        <div
          className={`fees-metric-card ${
            isSettled
              ? 'fees-metric-card--settled'
              : isPending
              ? 'fees-metric-card--pending'
              : 'fees-metric-card--agreed'
          }`}
        >
          <div className="fees-metric-card__header">
            <span className="fees-metric-card__label">Chamber Balance Due</span>
            <div className="fees-metric-card__icon-wrapper">
              <BriefcaseIcon size={18} />
            </div>
          </div>
          <div className="fees-metric-card__value">
            {formatPkr(feeData.balance)}
          </div>
          {isSettled && (
            <span className="fees-metric-card__status-pill fees-metric-card__status-pill--settled">
              Account Fully Settled
            </span>
          )}
          {isPending && (
            <span className="fees-metric-card__status-pill fees-metric-card__status-pill--pending">
              Outstanding Balance
            </span>
          )}
          {!isSettled && !isPending && (
            <span className="fees-metric-card__status-pill" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>
              Pending Terms
            </span>
          )}
        </div>
      </div>

      {/* Global Alerts */}
      {paymentSuccess && (
        <div className="alert alert--success" style={{ margin: 0 }}>
          {paymentSuccess}
        </div>
      )}

      {/* ===================================================================
          2. FEE AGREEMENT TERMS PANEL (Editor / Read-Only Display)
          =================================================================== */}
      <div className="fees-agreement-panel">
        <div className="fees-panel-header">
          <div className="fees-panel-header__title-group">
            <h3 className="fees-panel-header__title">Fee Agreement & Retainer Terms</h3>
            {feeData.feeAgreement && !isEditingAgreement && (
              <span className="fees-panel-header__badge">
                {FEE_AGREEMENT_TYPE_LABELS[feeData.feeAgreement.type] || feeData.feeAgreement.type}
              </span>
            )}
          </div>
          {isLawyer && !isEditingAgreement && (
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => {
                setAgreementError(null);
                setAgreementSuccess(null);
                setIsEditingAgreement(true);
              }}
            >
              {feeData.feeAgreement ? 'Edit Agreement Terms' : 'Set Fee Agreement'}
            </button>
          )}
        </div>

        {agreementSuccess && isEditingAgreement && (
          <div className="alert alert--success" style={{ margin: 0 }}>
            {agreementSuccess}
          </div>
        )}
        {agreementError && (
          <div className="alert alert--danger" style={{ margin: 0 }}>
            {agreementError}
          </div>
        )}

        {/* Read-Only Display (for Clients, or Lawyers not currently editing) */}
        {!isEditingAgreement ? (
          feeData.feeAgreement ? (
            <div className="fees-agreement-display">
              <div className="fees-info-block">
                <span className="fees-info-block__label">Agreement Structure</span>
                <span className="fees-info-block__value">
                  {FEE_AGREEMENT_TYPE_LABELS[feeData.feeAgreement.type] || feeData.feeAgreement.type}
                </span>
                <span className="fees-info-block__label" style={{ marginTop: 'var(--spacing-3)' }}>
                  Total Agreed Retainer
                </span>
                <span className="fees-info-block__value" style={{ fontSize: 'var(--font-size-base)', color: '#065f46' }}>
                  {formatPkr(feeData.feeAgreement.agreedAmountPkr)}
                </span>
              </div>
              <div className="fees-info-block">
                <span className="fees-info-block__label">Chamber Notes & Payment Schedule</span>
                <div className="fees-info-block__notes">
                  {feeData.feeAgreement.notes || 'No custom payment schedule notes specified for this agreement.'}
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
              {isLawyer
                ? 'No formal fee agreement has been recorded for this case file yet. Click "Set Fee Agreement" above to document retainer terms.'
                : 'Fee agreement details have not been finalized by the appointed advocate yet.'}
            </p>
          )
        ) : (
          /* Advocate Agreement Editor Form */
          <form onSubmit={handleSaveAgreement}>
            <div className="fees-form-grid">
              <div className="fees-form-group">
                <label htmlFor="agreementTypeSelect">Fee Structure Type *</label>
                <select
                  id="agreementTypeSelect"
                  value={agreementType}
                  onChange={(e) => setAgreementType(e.target.value)}
                  disabled={savingAgreement}
                >
                  {FEE_AGREEMENT_TYPES.map((typeKey) => (
                    <option key={typeKey} value={typeKey}>
                      {FEE_AGREEMENT_TYPE_LABELS[typeKey] || typeKey}
                    </option>
                  ))}
                </select>
              </div>

              <div className="fees-form-group">
                <label htmlFor="agreedAmountInput">Agreed Total Fee (PKR) *</label>
                <div className="fees-input-prefix-wrapper">
                  <span className="fees-input-prefix">PKR</span>
                  <input
                    id="agreedAmountInput"
                    type="number"
                    min={FEE_LIMITS.MIN_AGREED_AMOUNT_PKR}
                    max={FEE_LIMITS.MAX_FEE_PKR}
                    placeholder="e.g. 150000"
                    value={agreedAmount}
                    onChange={(e) => setAgreedAmount(e.target.value)}
                    disabled={savingAgreement}
                    required
                  />
                </div>
              </div>

              <div className="fees-form-group fees-form-group--full">
                <label htmlFor="agreementNotesTextarea">
                  Terms, Retainer Schedule & Chamber Notes ({agreementNotes.length}/{FEE_LIMITS.MAX_AGREEMENT_NOTES_LENGTH})
                </label>
                <textarea
                  id="agreementNotesTextarea"
                  rows={3}
                  maxLength={FEE_LIMITS.MAX_AGREEMENT_NOTES_LENGTH}
                  placeholder="Specify milestone schedule (e.g. 50% advance upon filing, 25% upon framing of issues, 25% at final arguments), miscellaneous court expense allocations, or peshi terms..."
                  value={agreementNotes}
                  onChange={(e) => setAgreementNotes(e.target.value)}
                  disabled={savingAgreement}
                />
              </div>
            </div>

            <div className="fees-form-actions">
              {feeData.feeAgreement && (
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={() => setIsEditingAgreement(false)}
                  disabled={savingAgreement}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="btn btn--primary btn--sm"
                disabled={savingAgreement}
              >
                {savingAgreement ? 'Saving Terms...' : 'Save Fee Agreement'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ===================================================================
          3. PAYMENTS LEDGER & INSTALLMENTS TABLE
          =================================================================== */}
      <div className="fees-ledger-panel">
        <div className="fees-ledger-header">
          <div>
            <h3 className="fees-panel-header__title">Payments Ledger & Receipts</h3>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Verified installments received against this case brief
            </span>
          </div>
          {isLawyer && (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => {
                setPaymentError(null);
                setIsPaymentModalOpen(true);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <PlusIcon size={16} />
              Record Client Payment
            </button>
          )}
        </div>

        {feeData.payments.length === 0 ? (
          <div style={{ padding: 'var(--spacing-6)' }}>
            <EmptyState
              icon={<BriefcaseIcon size={44} color="var(--color-text-muted)" />}
              title="No Payment Installments Recorded"
              message={
                isLawyer
                  ? 'No fee payments have been credited to this case file yet. Click "Record Client Payment" above to register an installment.'
                  : 'No fee payments have been recorded for this case file yet.'
              }
            />
          </div>
        ) : (
          <div className="fees-ledger-table-wrapper">
            <table className="fees-table">
              <thead>
                <tr>
                  <th>Paid Date</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Reference / TID</th>
                  <th>Remarks / Notes</th>
                </tr>
              </thead>
              <tbody>
                {feeData.payments.map((payment) => {
                  const methodClass =
                    payment.method === 'cash'
                      ? 'fees-method-badge--cash'
                      : payment.method === 'bank'
                      ? 'fees-method-badge--bank'
                      : payment.method === 'jazzcash'
                      ? 'fees-method-badge--jazzcash'
                      : payment.method === 'easypaisa'
                      ? 'fees-method-badge--easypaisa'
                      : 'fees-method-badge--cheque';

                  return (
                    <tr key={payment.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {formatDate(payment.paidOn)}
                      </td>
                      <td className="fees-table__amount">
                        {formatPkr(payment.amountPkr)}
                      </td>
                      <td>
                        <span className={`fees-method-badge ${methodClass}`}>
                          {FEE_PAYMENT_METHOD_LABELS[payment.method] || payment.method}
                        </span>
                      </td>
                      <td>
                        {payment.reference ? (
                          <span className="fees-table__ref">{payment.reference}</span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        {payment.note || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================================================================
          4. RECORD PAYMENT MODAL (Advocate Only)
          =================================================================== */}
      {isPaymentModalOpen && isLawyer && (
        <div
          className="fees-modal-overlay"
          onClick={() => !savingPayment && setIsPaymentModalOpen(false)}
        >
          <div
            className="fees-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="recordPaymentModalTitle"
          >
            <div className="fees-modal__header">
              <h3 id="recordPaymentModalTitle" className="fees-modal__title">
                Record Client Fee Installment
              </h3>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => !savingPayment && setIsPaymentModalOpen(false)}
                aria-label="Close modal"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePayment}>
              <div className="fees-modal__body">
                {paymentError && (
                  <div className="alert alert--danger" style={{ margin: 0 }}>
                    {paymentError}
                  </div>
                )}

                <div className="fees-form-group">
                  <label htmlFor="paymentAmountInput">Payment Amount (PKR) *</label>
                  <div className="fees-input-prefix-wrapper">
                    <span className="fees-input-prefix">PKR</span>
                    <input
                      id="paymentAmountInput"
                      type="number"
                      min={FEE_LIMITS.MIN_PAYMENT_PKR}
                      max={FEE_LIMITS.MAX_FEE_PKR}
                      placeholder="e.g. 50000"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      disabled={savingPayment}
                      required
                    />
                  </div>
                </div>

                <div className="fees-form-grid" style={{ gap: 'var(--spacing-3)' }}>
                  <div className="fees-form-group">
                    <label htmlFor="paymentMethodSelect">Payment Channel *</label>
                    <select
                      id="paymentMethodSelect"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      disabled={savingPayment}
                    >
                      {FEE_PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {FEE_PAYMENT_METHOD_LABELS[m] || m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="fees-form-group">
                    <label htmlFor="paymentDateInput">Date Received *</label>
                    <input
                      id="paymentDateInput"
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      disabled={savingPayment}
                      required
                    />
                  </div>
                </div>

                <div className="fees-form-group">
                  <label htmlFor="paymentRefInput">
                    Transaction Reference / Cheque No. ({paymentRef.length}/{FEE_LIMITS.MAX_PAYMENT_REF_LENGTH})
                  </label>
                  <input
                    id="paymentRefInput"
                    type="text"
                    maxLength={FEE_LIMITS.MAX_PAYMENT_REF_LENGTH}
                    placeholder="e.g. Cheque # 849201 or JazzCash TID # 981240"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    disabled={savingPayment}
                  />
                </div>

                <div className="fees-form-group">
                  <label htmlFor="paymentNoteInput">
                    Receipt Remarks / Chamber Notes ({paymentNote.length}/{FEE_LIMITS.MAX_PAYMENT_NOTE_LENGTH})
                  </label>
                  <textarea
                    id="paymentNoteInput"
                    rows={2}
                    maxLength={FEE_LIMITS.MAX_PAYMENT_NOTE_LENGTH}
                    placeholder="e.g. Advance payment received towards suit filing fee."
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    disabled={savingPayment}
                  />
                </div>
              </div>

              <div className="fees-modal__footer">
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={() => setIsPaymentModalOpen(false)}
                  disabled={savingPayment}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary btn--sm"
                  disabled={savingPayment}
                >
                  {savingPayment ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

CaseFeesTab.propTypes = {
  caseId: PropTypes.string.isRequired,
  isLawyer: PropTypes.bool.isRequired,
};

export default CaseFeesTab;
