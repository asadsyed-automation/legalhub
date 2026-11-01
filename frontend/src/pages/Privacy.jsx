import { Link } from 'react-router-dom';
import { APP_NAME } from '../config/brand';
import './LegalPage.css';

export const Privacy = () => {
  return (
    <div className="legal-page-container">
      <div className="legal-page-header">
        <div className="legal-page-meta">
          <span className="legal-page-meta__badge">Privacy Policy</span>
          <span>Last updated: October 2026</span>
          <span>Role-Based Data Isolation</span>
        </div>
        <h1>Privacy Policy</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          How {APP_NAME} collects, secures, and isolates citizen and advocate data under ethical legal standards.
        </p>
      </div>

      <div className="legal-page-content">
        <section className="legal-section">
          <h2>1. Information We Collect</h2>
          <p>
            {APP_NAME} collects only the minimal data points necessary to authenticate accounts, coordinate consultation schedules, and manage legal case files:
          </p>
          <ul>
            <li>
              <strong>Account Authentication Data:</strong> Full name, verified email address, role (Client or Advocate), and securely salted password hashes.
            </li>
            <li>
              <strong>Advocate Professional Credentials:</strong> Provincial Bar Council name, enrolment number, high court or lower court standing, station/city, practice areas, and chamber address submitted for administrative review.
            </li>
            <li>
              <strong>Consultation Booking Information:</strong> Selected consultation format (In-Chamber, Video, or Phone), scheduled time slots, and legal inquiry summaries provided by citizens.
            </li>
            <li>
              <strong>Case Management Metadata:</strong> Case title, court name, FIR/suit number, parties, procedural diary entries (*Roznamcha*), and uploaded documents.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>2. How We Use Collected Data</h2>
          <p>Data collected on {APP_NAME} is utilized strictly for:</p>
          <ul>
            <li>Authenticating user sessions via cryptographically signed JSON Web Tokens (JWT).</li>
            <li>Enabling citizens to schedule appointments with practicing advocates.</li>
            <li>Allowing advocates to maintain chronological case diaries and upload pleadings.</li>
            <li>Administrative verification of advocate credentials before directory inclusion.</li>
            <li>Simulated sandbox billing ledger accounting.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. Role-Based Confidentiality &amp; Privilege Shields</h2>
          <p>
            Respecting the sanctity of advocate-client confidentiality under Pakistani legal practice, {APP_NAME} enforces strict architectural boundaries:
          </p>
          <ul>
            <li>
              <strong>Chamber Strategy Isolation:</strong> Diary entries marked as &quot;Private (Chamber Only)&quot; are strictly accessible to the assigned advocate. They are excluded from client queries.
            </li>
            <li>
              <strong>Administrator Access Barrier:</strong> Platform administrators have no technical authorization to browse confidential case files, case documents, or private chamber strategy notes. Disciplinary oversight is restricted to account status.
            </li>
            <li>
              <strong>Binary Document Verification:</strong> Uploaded case documents are validated against strict MIME and binary signature rules to protect system integrity.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Third-Party Sharing &amp; Commercial Non-Sale Policy</h2>
          <p>
            {APP_NAME} does not sell, trade, rent, or lease personal or case information to commercial data brokers, advertising networks, or third-party marketing services.
          </p>
          <p>
            All AI document processing runs on local microservice infrastructure within the application boundary; no client legal notes or pleadings are transmitted to public cloud LLM endpoints.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Data Security &amp; User Rights</h2>
          <p>
            Users retain the right to inspect their personal profile details, correct inaccuracies, or request account closure. Inquiries regarding data processing may be submitted via our <Link to="/contact">Contact Page</Link>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;
