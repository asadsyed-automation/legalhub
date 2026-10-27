import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SearchIcon, ScalesIcon, CourtIcon, ShieldIcon, BriefcaseIcon } from '../components/Icons';

export const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, var(--color-bg) 100%)',
          borderBottom: '1px solid var(--color-border)',
          padding: 'var(--spacing-16) var(--spacing-4)',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              padding: '0.4rem 1rem',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--spacing-4)',
              border: '1px solid var(--color-border)',
            }}
          >
            <ScalesIcon size={16} color="var(--color-primary)" />
            <span>Direct Access to Practicing Advocates Across Pakistan</span>
          </div>

          <h1
            style={{
              fontSize: '2.75rem',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text)',
              lineHeight: 1.18,
              marginBottom: 'var(--spacing-4)',
              letterSpacing: '-0.02em',
            }}
          >
            Connect Directly with <br />
            <span style={{ color: 'var(--color-primary)' }}>Practicing Advocates</span> in Pakistan
          </h1>

          <p
            style={{
              fontSize: 'var(--font-size-lg)',
              color: 'var(--color-text-muted)',
              marginBottom: 'var(--spacing-8)',
              lineHeight: 1.65,
              maxWidth: '720px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Schedule consultations with enrolled High Court and District Court advocates in Lahore, Multan, Karachi, Islamabad, and nationwide. Review transparent chamber fee schedules and book appointments with complete confidence.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 'var(--spacing-4)',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link
              to="/lawyers"
              className="btn btn-primary"
              style={{
                padding: '0.75rem 1.75rem',
                fontSize: 'var(--font-size-base)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)',
              }}
            >
              <SearchIcon size={18} />
              <span>Find an Advocate</span>
            </Link>

            {!isAuthenticated ? (
              <Link
                to="/register?role=lawyer"
                className="btn btn-secondary"
                style={{
                  padding: '0.75rem 1.75rem',
                  fontSize: 'var(--font-size-base)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-2)',
                }}
              >
                <BriefcaseIcon size={18} />
                <span>Join as an Advocate</span>
              </Link>
            ) : (
              <Link
                to="/dashboard"
                className="btn btn-secondary"
                style={{
                  padding: '0.75rem 1.75rem',
                  fontSize: 'var(--font-size-base)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-2)',
                }}
              >
                <span>Go to Dashboard ({user?.name})</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Trust & Chamber Pillars */}
      <section className="page-container" style={{ padding: 'var(--spacing-12) var(--spacing-4)' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto var(--spacing-8) auto' }}>
          <h2 style={{ marginBottom: 'var(--spacing-2)', fontSize: '1.875rem' }}>
            A Modern Chamber for Legal Consultations
          </h2>
          <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: 'var(--font-size-base)' }}>
            Transparent discovery, clear fee schedules, and direct calendar reservations for individuals and businesses.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--spacing-6)',
          }}
        >
          <div className="card" style={{ padding: 'var(--spacing-6)' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--spacing-4)',
              }}
            >
              <BriefcaseIcon size={24} />
            </div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-2)' }}>
              Transparent Chamber Fees
            </h3>
            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, fontSize: 'var(--font-size-sm)' }}>
              Review standardized consultation rates for in-chamber meetings, video sessions, and phone advisories before booking. No unexpected hidden consultation costs.
            </p>
          </div>

          <div className="card" style={{ padding: 'var(--spacing-6)' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--spacing-4)',
              }}
            >
              <CourtIcon size={24} />
            </div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-2)' }}>
              Nationwide Court Standing
            </h3>
            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, fontSize: 'var(--font-size-sm)' }}>
              Find practicing advocates enrolled across Provincial Bar Councils with standing before District Courts, High Court Benches, and the Supreme Court of Pakistan.
            </p>
          </div>

          <div className="card" style={{ padding: 'var(--spacing-6)' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--spacing-4)',
              }}
            >
              <ShieldIcon size={24} />
            </div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-2)' }}>
              Client Confidentiality
            </h3>
            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, fontSize: 'var(--font-size-sm)' }}>
              Private scheduling and consultation notes. Personal contact numbers and case facts remain confidential between you and your appointed legal counsel.
            </p>
          </div>
        </div>

        {/* Regulatory Note */}
        <div
          style={{
            marginTop: 'var(--spacing-10)',
            padding: 'var(--spacing-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-3)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-subtle)',
          }}
        >
          <ScalesIcon size={20} color="var(--color-text-subtle)" />
          <span>
            <strong>Legal Practitioners &amp; Bar Councils Rules (Rule 135):</strong> LegalHub operates as a neutral directory and chamber appointment platform. Advocates are listed strictly by practice area, station, and verified availability without paid commercial rankings or advertisements.
          </span>
        </div>
      </section>
    </div>
  );
};

export default Home;
