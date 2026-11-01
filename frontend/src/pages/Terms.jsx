import { Link } from 'react-router-dom';
import { APP_NAME } from '../config/brand';
import { ShieldIcon } from '../components/Icons';
import './LegalPage.css';

export const Terms = () => {
  return (
    <div className="legal-page-container">
      <div className="legal-page-header">
        <div className="legal-page-meta">
          <span className="legal-page-meta__badge">Platform Terms</span>
          <span>Last updated: October 2026</span>
          <span>Academic FYP Edition</span>
        </div>
        <h1>Terms of Service</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Please review the operational conditions, simulated sandbox parameters, and user commitments governing access to {APP_NAME}.
        </p>
      </div>

      <div className="legal-alert-box">
        <ShieldIcon size={20} color="#92400e" />
        <div>
          <strong>Sandbox Notice:</strong> All consultation fee transactions, checkout sequences, and financial entries on {APP_NAME} operate in a test sandbox environment. No actual fiat currency (PKR), bank accounts, or credit balances are debited.
        </div>
      </div>

      <div className="legal-page-content">
        <section className="legal-section">
          <h2>1. Platform Role &amp; Technical Intermediary Scope</h2>
          <p>
            {APP_NAME} is an academic web application developed as a Final Year Project at Emerson University Multan. The platform functions exclusively as a digital directory, consultation scheduling conduit, and case procedural diary (*Roznamcha*) management system.
          </p>
          <p>
            {APP_NAME} is not a law firm, does not engage in statutory practice of law, and does not provide formal legal representation before any Pakistani court, tribunal, or statutory authority.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Advocate Status &amp; Administrative Credential Screening</h2>
          <p>
            Advocate profiles displaying an <strong>Admin-Reviewed</strong> status badge reflect that platform staff have reviewed the practitioner&apos;s submitted Bar Council enrolment card, CNIC, and chamber details for platform directory eligibility.
          </p>
          <ul>
            <li>
              <strong>No Statutory Endorsement:</strong> Platform review does not constitute an official verification, statutory guarantee, or endorsement by the Pakistan Bar Council, Punjab Bar Council, or any Provincial Bar Council.
            </li>
            <li>
              <strong>Independent Advocate Retainers:</strong> Any substantive legal engagement, power of attorney (*Wakalatnama*), or formal court fee retainer arranged subsequent to an initial consultation constitutes a private legal contract solely between the citizen and the advocate.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. Simulated Sandbox Payments &amp; Consultation Bookings</h2>
          <p>
            The booking lifecycle incorporates payment simulation gateways (mock EasyPaisa, JazzCash, and Card payment methods) to demonstrate end-to-end checkout mechanics:
          </p>
          <ul>
            <li>No real monetary charges or banking deductions occur at any point.</li>
            <li>Users may cancel unconfirmed appointments without financial penalty.</li>
            <li>Refund requests for cancelled or rejected bookings transition simulated ledgers to &quot;refunded&quot; status for audit trail demonstration.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Case Diary &amp; AI Pleading Summaries</h2>
          <p>
            Advocates utilize the case diary system to organize procedural notes, pleadings, and court orders:
          </p>
          <ul>
            <li>
              <strong>Informational AI Summaries:</strong> Automated document and hearing summaries generated via the local AI microservice are intended solely as drafting aids. They are non-binding and must be independently verified by the licensed legal practitioner.
            </li>
            <li>
              <strong>Confidentiality Safeguards:</strong> Chamber private work product is shielded by role-based database queries from citizen client views and platform administrators.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. User Account Responsibilities</h2>
          <p>
            All registered users (citizens, advocates, and administrators) agree to maintain truthful account profiles, safeguard their authentication credentials, and abstain from transmitting unlawful, harassing, or fraudulent materials across platform channels.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Inquiries &amp; Academic Feedback</h2>
          <p>
            For questions concerning these platform terms, please visit our <Link to="/contact">Contact Page</Link> or review our <Link to="/disclaimer">Regulatory Disclaimer</Link>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Terms;
