import { Link } from 'react-router-dom';
import { APP_NAME } from '../config/brand';
import { ScalesIcon } from '../components/Icons';
import './LegalPage.css';

export const Disclaimer = () => {
  return (
    <div className="legal-page-container">
      <div className="legal-page-header">
        <div className="legal-page-meta">
          <span className="legal-page-meta__badge">Regulatory Compliance</span>
          <span>Last updated: October 2026</span>
          <span>Legal Practitioners &amp; Bar Councils Rules 1976</span>
        </div>
        <h1>Regulatory &amp; Legal Disclaimer</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Statutory boundaries, advocate listing neutrality, and technological limitations governing {APP_NAME}.
        </p>
      </div>

      <div className="legal-alert-box">
        <ScalesIcon size={20} color="#92400e" />
        <div>
          <strong>Rule 135 Compliance:</strong> Under Rule 135 of the Legal Practitioners and Bar Councils Rules 1976, advocates enrolled in Pakistan are prohibited from soliciting clients or engaging in commercial advertising. {APP_NAME} operates strictly as a neutral directory and chamber coordination tool.
        </div>
      </div>

      <div className="legal-page-content">
        <section className="legal-section">
          <h2>1. Not a Law Firm &amp; No Legal Advice</h2>
          <p>
            {APP_NAME} is an academic software system developed at Emerson University Multan. The platform does not constitute a law firm, legal partnership, or legal advisory entity.
          </p>
          <p>
            No material, guidance, automated text, or directory content on this website constitutes legal counsel or creates an attorney-client relationship. Citizens requiring legal representation must directly consult a licensed advocate.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Non-Commercial Directory &amp; Zero Paid Rankings</h2>
          <p>
            In strict compliance with statutory Bar Council regulations across Punjab, Sindh, Khyber Pakhtunkhwa, Balochistan, and Islamabad:
          </p>
          <ul>
            <li>No advocate can pay for priority placement, homepage spotlighting, or &quot;Featured&quot; badges.</li>
            <li>The platform completely rejects subjective promotional classifications such as &quot;Top Lawyer&quot;, &quot;Best Criminal Advocate&quot;, or &quot;Premier Chamber&quot;.</li>
            <li>Directory search results are sorted purely by objective filter criteria (practice area, court station, and verified calendar availability).</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. Scope of &quot;Admin-Reviewed&quot; Advocate Status</h2>
          <p>
            Advocate listings indicate an <strong>&quot;Admin-Reviewed&quot;</strong> or <strong>&quot;Credentials Reviewed&quot;</strong> designation:
          </p>
          <ul>
            <li>This label certifies solely that platform administrators have examined the submitted provincial Bar Council enrolment card, CNIC, and chamber details for platform registration sanity.</li>
            <li>It does <strong>not</strong> represent an official endorsement, statutory guarantee, or direct verification from the Pakistan Bar Council or any statutory Bar Council.</li>
            <li>Citizens remain responsible for independently verifying an advocate&apos;s active standing before entering formal legal representation agreements.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. AI Document &amp; Hearing Summarization Notice</h2>
          <p>
            The integrated AI document summarization engine produces automated extractive summaries of previous court hearings and legal documents:
          </p>
          <ul>
            <li>These summaries are generated algorithmically as preliminary chamber drafting aids.</li>
            <li>They do not substitute for human professional legal judgment.</li>
            <li>Advocates must verify all extracted statutes, sections, and dates against original court records (*Zimniat*) before relying on them in judicial proceedings.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Sandbox Payments &amp; Simulated Financial Transactions</h2>
          <p>
            All payment interfaces, simulated receipts, and checkout pages are test sandbox environments designed for academic demonstration. No real financial currency is accepted or transferred through {APP_NAME}. For further details, refer to our <Link to="/refund-policy">Refund &amp; Sandbox Policy</Link>.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Contact for Inquiries</h2>
          <p>
            For regulatory or academic inquiries concerning platform compliance, please reach out via our <Link to="/contact">Contact Page</Link>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Disclaimer;
