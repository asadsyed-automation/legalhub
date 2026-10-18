import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatusBadge from './StatusBadge';
import { ROLES } from '../constants';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header
      style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div
        style={{
          maxWidth: 'var(--max-width-container)',
          margin: '0 auto',
          padding: 'var(--spacing-3) var(--spacing-4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)',
            textDecoration: 'none',
          }}
        >
          <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>⚖️</span>
          <span
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-primary)',
              letterSpacing: '-0.025em',
            }}
          >
            LegalHub
          </span>
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-subtle)',
              backgroundColor: 'var(--color-primary-light)',
              padding: '0.15rem 0.4rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            Pakistan
          </span>
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-5)' }}>
          <Link
            to="/"
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: isActive('/') ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
              color: isActive('/') ? 'var(--color-primary)' : 'var(--color-text)',
            }}
          >
            Home
          </Link>

          <Link
            to="/lawyers"
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: isActive('/lawyers') ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
              color: isActive('/lawyers') ? 'var(--color-primary)' : 'var(--color-text)',
            }}
          >
            Find Lawyers
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: isActive('/dashboard') ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
                  color: isActive('/dashboard') ? 'var(--color-primary)' : 'var(--color-text)',
                }}
              >
                Dashboard
              </Link>

              {user?.role === ROLES.LAWYER && (
                <Link
                  to="/lawyer/application"
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: isActive('/lawyer/application') ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
                    color: isActive('/lawyer/application') ? 'var(--color-primary)' : 'var(--color-text)',
                  }}
                >
                  My Application
                </Link>
              )}

              {user?.role === ROLES.ADMIN && (
                <Link
                  to="/admin/queue"
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: isActive('/admin/queue') ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
                    color: isActive('/admin/queue') ? 'var(--color-primary)' : 'var(--color-text)',
                  }}
                >
                  Admin Queue
                </Link>
              )}

              {/* User Profile Capsule & Logout */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-3)',
                  paddingLeft: 'var(--spacing-3)',
                  borderLeft: '1px solid var(--color-border)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text)' }}>
                    {user?.name}
                  </span>
                  <StatusBadge role={user?.role} />
                </div>

                <button
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                  title="Sign out of LegalHub"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
