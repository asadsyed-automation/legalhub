import { useState } from 'react';
import PropTypes from 'prop-types';
import { ShieldIcon, CheckIcon, CloseIcon } from './Icons';
import { SERVICE_MODE_LABELS } from '../constants';
import './SandboxPaymentModal.css';

export const SandboxPaymentModal = ({
  isOpen,
  booking,
  onPay,
  onCancel,
  isLoading = false,
}) => {
  const [selectedMethod, setSelectedMethod] = useState('1link_sandbox');

  if (!isOpen || !booking) return null;

  const handleSimulatePayment = (e) => {
    e.preventDefault();
    onPay('sandbox');
  };

  const formatSlotTime = (isoStr) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('en-PK', {
        timeZone: 'Asia/Karachi',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="spm-overlay" onClick={isLoading ? undefined : onCancel} role="presentation">
      <div className="spm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {/* Prominent Sandbox Test Mode Banner */}
        <div className="spm-banner" role="alert">
          <div className="spm-banner__badge">TEST MODE / SANDBOX SIMULATION</div>
          <p className="spm-banner__text">
            No real credit card or bank funds will be charged. This environment simulates the State Bank of Pakistan 1LINK &amp; PayFast payment gateway in test mode for academic evaluation.
          </p>
        </div>

        {/* Modal Header */}
        <div className="spm-header">
          <div>
            <h3 className="spm-title">Consultation Chamber Fee</h3>
            <p className="spm-subtitle">Confirm simulated token payment to reserve your consultation</p>
          </div>
          <button
            type="button"
            className="spm-close-btn"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Close"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Consultation Breakdown Card */}
        <div className="spm-summary-card">
          <div className="spm-summary-row">
            <span className="spm-label">Advocate:</span>
            <strong className="spm-val">{booking.lawyerName || 'Appointed Advocate'}</strong>
          </div>
          <div className="spm-summary-row">
            <span className="spm-label">Scheduled Time:</span>
            <span className="spm-val">{formatSlotTime(booking.startsAt || booking.startUtc)}</span>
          </div>
          <div className="spm-summary-row">
            <span className="spm-label">Consultation Mode:</span>
            <span className="spm-val">{SERVICE_MODE_LABELS[booking.mode] || booking.mode} ({booking.durationMinutes || 30} mins)</span>
          </div>
          <div className="spm-summary-divider" />
          <div className="spm-summary-row spm-summary-row--total">
            <span>Total Payable Fee:</span>
            <span className="spm-total-amount">PKR {Number(booking.feePkr || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Payment Simulation Form */}
        <form onSubmit={handleSimulatePayment} className="spm-form">
          <label className="spm-method-label">Select Simulated Gateway:</label>
          <div className="spm-methods-grid">
            <label className={`spm-method-card ${selectedMethod === '1link_sandbox' ? 'spm-method-card--active' : ''}`}>
              <input
                type="radio"
                name="method"
                value="1link_sandbox"
                checked={selectedMethod === '1link_sandbox'}
                onChange={() => setSelectedMethod('1link_sandbox')}
              />
              <div className="spm-method-info">
                <strong>1LINK / PayFast Sandbox</strong>
                <span>Instant simulated approval</span>
              </div>
              {selectedMethod === '1link_sandbox' && <CheckIcon size={16} color="var(--color-primary)" />}
            </label>

            <label className={`spm-method-card ${selectedMethod === 'mock_bank' ? 'spm-method-card--active' : ''}`}>
              <input
                type="radio"
                name="method"
                value="mock_bank"
                checked={selectedMethod === 'mock_bank'}
                onChange={() => setSelectedMethod('mock_bank')}
              />
              <div className="spm-method-info">
                <strong>Mock Bank Transfer (Raast)</strong>
                <span>Direct account simulation</span>
              </div>
              {selectedMethod === 'mock_bank' && <CheckIcon size={16} color="var(--color-primary)" />}
            </label>
          </div>

          {/* Security & Regulatory Footnote */}
          <div className="spm-security-note">
            <ShieldIcon size={16} color="var(--color-text-subtle)" />
            <span>
              Transactions in LegalHub Sandbox are strictly for testing advocate calendar locking and meeting confirmation.
            </span>
          </div>

          <div className="spm-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm spm-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Processing Simulation...' : `Simulate Payment (PKR ${Number(booking.feePkr || 0).toLocaleString()})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

SandboxPaymentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  booking: PropTypes.object,
  onPay: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default SandboxPaymentModal;
