import { Link } from 'react-router-dom';
import { APP_NAME } from '../config/brand';
import { ShieldIcon } from '../components/Icons';
import './LegalPage.css';

export const RefundPolicy = () => {
  return (
    <div className="legal-page-container">
      <div className="legal-page-header">
        <div className="legal-page-meta">
          <span className="legal-page-meta__badge">Financial Policy</span>
          <span>Last updated: October 2026</span>
          <span>Sandbox Simulated Ledger</span>
        </div>
        <h1>Refund &amp; Sandbox Payment Policy</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Explanation of simulated financial transactions, cancellation workflows, and sandbox ledger refunds on {APP_NAME}.
        </p>
      </div>

      <div className="legal-alert-box">
        <ShieldIcon size={20} color="#92400e" />
        <div>
          <strong>Zero Real Monetary Transactions:</strong> {APP_NAME} is an academic demonstration platform. All consultation bookings, fee agreements, and payment checkouts run strictly in a simulated sandbox environment. No actual money is debited or refunded to real bank accounts.
        </div>
      </div>

      <div className="legal-page-content">
        <section className="legal-section">
          <h2>1. Simulated Sandbox Architecture</h2>
          <p>
            To model the operational lifecycle of a modern legal chamber, {APP_NAME} provides a simulated payment gateway:
          </p>
          <ul>
            <li>Users can select simulated EasyPaisa, JazzCash, or Debit/Credit Card payment options.</li>
            <li>Successful checkout generates a test payment record with a unique transaction reference for demonstration purposes.</li>
            <li>No real bank routing, mobile wallet balance deductions, or card charges occur.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>2. Appointment Cancellation &amp; Simulated Refunds</h2>
          <p>
            The platform models clear cancellation rules for booked legal consultations:
          </p>
          <ul>
            <li>
              <strong>Client Cancellation:</strong> If a citizen cancels an appointment before the scheduled start time, the system automatically transitions the payment status to <code>refunded</code> and logs an audit trail event.
            </li>
            <li>
              <strong>Advocate Declination:</strong> If an advocate rejects a consultation request due to scheduling conflicts, the simulated fee record is marked as <code>refunded</code> immediately.
            </li>
            <li>
              <strong>Immediate Slot Release:</strong> Upon cancellation, the advocate&apos;s blocked calendar slot is instantly made available for re-booking by other citizens.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. Administrative Discretionary Refunds</h2>
          <p>
            In the simulated platform workflow, platform administrators retain the capability to issue simulated refunds for completed or confirmed bookings if technical failures occur (e.g., video link connection failure or accidental duplicate booking).
          </p>
          <p>
            Administrative refunds require a documented explanation of at least 10 characters to ensure full audit log traceability.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. Inquiries &amp; Questions</h2>
          <p>
            If you have questions regarding our simulated billing flow or appointment scheduling mechanics, please consult our <Link to="/terms">Terms of Service</Link> or contact the student development team via our <Link to="/contact">Contact Page</Link>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default RefundPolicy;
