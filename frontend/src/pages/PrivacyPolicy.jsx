import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';

function PrivacyPolicy() {
  return (
    <div style={{ fontFamily: 'var(--font-body)', backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      <PublicNavbar />

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '60px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '36px', fontWeight: 800, color: 'var(--color-secondary)', marginBottom: '12px' }}>
          Privacy Policy
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
          Last Updated: July 25, 2026
        </p>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', marginBottom: '32px' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', color: 'var(--color-text)', lineHeight: 1.7, fontSize: '15px' }}>
          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
              1. Information We Collect
            </h2>
            <p>
              LegalHub collects information necessary to provide SaaS legal practice management services in Pakistan. This includes personal registration details (Name, Email, Phone, Role, Bar Council ID), case details entered by lawyers, uploaded legal documents, fee tracking logs, and messages exchanged between advocates and clients.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
              2. How We Use Your Information
            </h2>
            <p>
              Your data is strictly used for platform operations:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
              <li>Managing advocate cause lists, hearing reminders, and case entries.</li>
              <li>Verifying lawyer identity for public marketplace listing.</li>
              <li>Processing real-time messaging between authorized case participants.</li>
              <li>Providing AI-driven legal summaries and petition organization.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
              3. Data Security & Storage
            </h2>
            <p>
              All user data is encrypted in transit (TLS 1.3) and stored securely on PostgreSQL databases (Supabase) with row-level role-based authorization. Document uploads are stored using Cloudinary with secure access tokens.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
              4. Third-Party Sharing
            </h2>
            <p>
              We do not sell, rent, or trade your personal or case information to third parties. Data is shared only with verified service infrastructure providers (Supabase, Cloudinary) solely to execute core platform services.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
              5. User Rights & Contact
            </h2>
            <p>
              Users may request export or deletion of their account data at any time by contacting our privacy compliance team at <strong>privacy@legalhub.pk</strong>.
            </p>
          </section>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}

export default PrivacyPolicy;
