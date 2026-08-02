import { Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';

function Maintenance() {
  return (
    <div style={{ fontFamily: 'var(--font-body)', backgroundColor: 'var(--color-bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNavbar />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '520px', backgroundColor: '#FFF', padding: '40px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛠️</div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 800, color: 'var(--color-secondary)', marginBottom: '12px' }}>
            Scheduled System Maintenance
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
            LegalHub is currently undergoing routine maintenance and database optimizations to serve Pakistani law firms better.
          </p>

          <div style={{
            backgroundColor: 'rgba(226,163,61,0.12)', border: '1px solid var(--color-warning)',
            padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '28px', textAlign: 'left'
          }}>
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#92400E', marginBottom: '4px' }}>
              ⏱️ Expected Uptime:
            </div>
            <div style={{ fontSize: '14px', color: '#B45309', fontWeight: 600 }}>
              Today at 10:00 PM PKT (Estimated downtime: 45 minutes)
            </div>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
            Need urgent assistance regarding a court hearing today? Contact support at <strong>support@legalhub.pk</strong>.
          </p>

          <Link to="/home" style={{
            backgroundColor: 'var(--color-primary)', color: '#FFFFFF',
            textDecoration: 'none', fontWeight: 600, fontSize: '14px',
            padding: '12px 24px', borderRadius: 'var(--radius-sm)',
            display: 'inline-block'
          }}>
            Back to Home Page
          </Link>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}

export default Maintenance;
