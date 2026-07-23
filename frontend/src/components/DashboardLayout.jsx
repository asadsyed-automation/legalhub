import { useAuth } from '../context/AuthContext';
import { Link, Outlet } from 'react-router-dom';

function DashboardLayout() {
  const { user, logout } = useAuth();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: '240px', backgroundColor: 'var(--color-secondary)', color: 'white',
        padding: 'var(--spacing-3)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)',
      }}>
        <h3 style={{ color: 'var(--color-accent)' }}>LegalHub</h3>
        <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</Link>
        <Link to="/cases" style={{ color: 'white', textDecoration: 'none' }}>Cases</Link>
        <Link to="/messages" style={{ color: 'white', textDecoration: 'none' }}>Messages</Link>
        <Link to="/notifications" style={{ color: 'white', textDecoration: 'none' }}>Notifications</Link>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{
          height: '64px', backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--spacing-3)',
        }}>
          <span>{user?.name} ({user?.role})</span>
          <button onClick={logout} style={{ padding: '8px 16px', cursor: 'pointer' }}>Logout</button>
        </header>

        <main style={{ flex: 1, padding: 'var(--spacing-3)', backgroundColor: 'var(--color-bg)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;