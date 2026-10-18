import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatusBadge from './StatusBadge';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show clean spinner while session status is verified against backend
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-primary" style={{ width: '2.5rem', height: '2.5rem' }} />
        <p style={{ marginTop: 'var(--spacing-3)', fontSize: 'var(--font-size-sm)' }}>
          Verifying security credentials with LegalHub...
        </p>
      </div>
    );
  }

  // Not logged in -> Redirect to login while preserving target route in state
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check: If route requires specific roles and user does not have permission
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="page-container" style={{ maxWidth: '600px', marginTop: 'var(--spacing-12)' }}>
        <div className="card" style={{ textAlign: 'center', borderColor: 'var(--color-danger)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-2)' }}>🚫</div>
          <h2 style={{ color: 'var(--color-danger)' }}>Access Restricted</h2>
          <p style={{ marginBottom: 'var(--spacing-4)' }}>
            This portal is restricted to authorized <strong>{allowedRoles.join(' / ')}</strong> accounts.
            Your current account is registered as a <StatusBadge role={user.role} />.
          </p>
          <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'center' }}>
            <Link to="/dashboard" className="btn btn-primary">
              Return to My Dashboard
            </Link>
            <Link to="/" className="btn btn-secondary">
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
