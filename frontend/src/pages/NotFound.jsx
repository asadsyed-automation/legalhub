import { Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';

function NotFound() {
  return (
    <div style={{ fontFamily: 'var(--font-body)', backgroundColor: 'var(--color-bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNavbar />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '480px' }}>
          <div style={{ fontSize: '72px', marginBottom: '16px' }}>⚖️ 404</div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 800, color: 'var(--color-secondary)', marginBottom: '12px' }}>
            Page Not Found
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', lineHeight: 1.6, marginBottom: '32px' }}>
            The case file or page you are looking for doesn't exist, has been moved, or you don't have access permissions.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/home" style={{
              backgroundColor: 'var(--color-primary)', color: '#FFFFFF',
              textDecoration: 'none', fontWeight: 600, fontSize: '14px',
              padding: '12px 24px', borderRadius: 'var(--radius-sm)',
              boxShadow: '0 2px 8px rgba(15,92,60,0.2)'
            }}>
              Go to Home →
            </Link>
            <Link to="/contact" style={{
              backgroundColor: 'transparent', color: 'var(--color-text)',
              textDecoration: 'none', fontWeight: 600, fontSize: '14px',
              padding: '12px 24px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)'
            }}>
              Report Issue
            </Link>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}

export default NotFound;
