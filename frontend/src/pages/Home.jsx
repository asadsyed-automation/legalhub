import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--spacing-4)',
            }}
          >
            🇵🇰 Pakistan's Verified Legal Ecosystem
          </div>

          <h1
            style={{
              fontSize: '2.75rem',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text)',
              lineHeight: 1.15,
              marginBottom: 'var(--spacing-4)',
            }}
          >
            Connecting Citizens with <br />
            <span style={{ color: 'var(--color-primary)' }}>Verified Advocates</span> Across Pakistan
          </h1>

          <p
            style={{
              fontSize: 'var(--font-size-lg)',
              color: 'var(--color-text-muted)',
              marginBottom: 'var(--spacing-8)',
              lineHeight: 1.6,
            }}
          >
            LegalHub connects you with vetted legal professionals licensed by provincial Bar Councils.
            Search by city, legal specialization, and court jurisdiction with complete transparency.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 'var(--spacing-4)',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link to="/lawyers" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: 'var(--font-size-base)' }}>
              🔍 Find a Verified Lawyer
            </Link>

            {!isAuthenticated ? (
              <Link to="/register?role=lawyer" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', fontSize: 'var(--font-size-base)' }}>
                ⚖️ Register as an Advocate
              </Link>
            ) : (
              <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', fontSize: 'var(--font-size-base)' }}>
                Go to Dashboard ({user?.name})
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Trust Pillars */}
      <section className="page-container" style={{ padding: 'var(--spacing-12) var(--spacing-4)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-2)' }}>Why Choose LegalHub?</h2>
        <p style={{ textAlign: 'center', marginBottom: 'var(--spacing-8)' }}>
          Built specifically to eliminate fraudulent practitioners and bring transparency to Pakistan's legal sector.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--spacing-6)',
          }}
        >
          <div className="card">
            <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-2)' }}>📜</div>
            <h3>Bar Council Verification</h3>
            <p>
              Every lawyer profile is rigorously cross-checked with their provincial Bar Council enrollment number
              before becoming visible to the public.
            </p>
          </div>

          <div className="card">
            <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-2)' }}>🏛️</div>
            <h3>Multan to Islamabad Coverage</h3>
            <p>
              Filter advocates practicing across Lahore High Court, Sindh High Court, Supreme Court, or District
              courts in over 15 major cities.
            </p>
          </div>

          <div className="card">
            <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-2)' }}>🔒</div>
            <h3>Strict Privacy Protection</h3>
            <p>
              Advocates' personal email addresses and enrollment details are never leaked to public search engines,
              ensuring maximum data security.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
