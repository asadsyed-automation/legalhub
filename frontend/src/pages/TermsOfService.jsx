import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';

function TermsOfService() {
  return (
    <div style={{ fontFamily: 'var(--font-body)', backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      <PublicNavbar />

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '60px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '36px', fontWeight: 800, color: 'var(--color-secondary)', marginBottom: '12px' }}>
          Terms of Service
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
          Effective Date: July 25, 2026
        </p>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', marginBottom: '32px' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', color: 'var(--color-text)', lineHeight: 1.7, fontSize: '15px' }}>
          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
              1. Acceptance of Terms
            </h2>
            <p>
              By creating an account or accessing LegalHub, you agree to comply with and be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our services.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
              2. Lawyer Verification & Professional Conduct
            </h2>
            <p>
              Advocates registering on LegalHub warrant that they hold valid license to practice law issued by their respective Bar Council (e.g. Punjab Bar Council, Sindh Bar Council). LegalHub reserves the right to reject or suspend profiles failing administrative verification.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
              3. Marketplace & Review Guidelines
            </h2>
            <p>
              Reviews submitted by citizens must represent genuine client experiences. Fraudulent, defamatory, or abusive reviews will be removed by platform administrators.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
              4. Prohibited Activities
            </h2>
            <p>
              Users agree not to upload malicious software, misrepresent legal outcomes, impersonate judicial officers, or use messaging tools to harass or transmit illegal materials under Pakistani law.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
              5. Subscription & Payment Terms
            </h2>
            <p>
              Paid subscription plans for lawyers and firms are billed on a recurring monthly or annual basis. Fees are non-refundable except as required by law.
            </p>
          </section>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}

export default TermsOfService;
