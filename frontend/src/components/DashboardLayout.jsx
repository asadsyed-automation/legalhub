import { useAuth } from '../context/AuthContext';
import { Link, Outlet } from 'react-router-dom';

const linkStyle = { color: 'white', textDecoration: 'none', fontSize: '14px', padding: '4px 0' };
const sectionLabelStyle = {
  fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginTop: '8px',
};

function DashboardLayout() {
  const { user, logout } = useAuth();
  const role = user?.role;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: '240px', backgroundColor: 'var(--color-secondary)', color: 'white',
        padding: 'var(--spacing-3)', display: 'flex', flexDirection: 'column', gap: '6px',
        flexShrink: 0,
      }}>
        <h3 style={{ color: 'var(--color-accent)', margin: '0 0 var(--spacing-2)', fontFamily: 'var(--font-heading)' }}>
          LegalHub
        </h3>

        {/* ── Core ── */}
        <p style={sectionLabelStyle}>Core</p>
        <Link to="/dashboard" style={linkStyle}>Dashboard</Link>
        <Link to="/cases" style={linkStyle}>Cases</Link>
        <Link to="/messages" style={linkStyle}>Messages</Link>
        <Link to="/notifications" style={linkStyle}>Notifications</Link>

        {/* ── Marketplace ── always visible */}
        <p style={sectionLabelStyle}>Marketplace</p>
        <Link to="/marketplace" style={linkStyle}>Browse</Link>
        {role === 'lawyer' && (
          <Link to="/marketplace/profile" style={linkStyle}>My Profile</Link>
        )}

        {/* ── Firm — lawyers only ── */}
        {role === 'lawyer' && (
          <>
            <p style={sectionLabelStyle}>Firm</p>
            <Link to="/firm" style={linkStyle}>Firm Management</Link>
          </>
        )}

        {/* ── Admin — admin role only ── */}
        {role === 'admin' && (
          <>
            <p style={sectionLabelStyle}>Administration</p>
            <Link to="/admin" style={linkStyle}>Admin Panel</Link>
          </>
        )}
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{
          height: '64px', backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--spacing-3)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            {user?.name}{' '}
            <span style={{
              padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700,
              backgroundColor: '#EFF6FF', color: 'var(--color-info)',
            }}>
              {user?.role}
            </span>
          </span>
          <button
            onClick={logout}
            style={{
              padding: '7px 16px', cursor: 'pointer',
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-surface)', fontFamily: 'var(--font-body)',
              fontSize: '13px', fontWeight: 600, color: 'var(--color-danger)',
            }}
          >
            Logout
          </button>
        </header>

        <main style={{ flex: 1, padding: 'var(--spacing-3)', backgroundColor: 'var(--color-bg)', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;