import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatusBadge from './StatusBadge';
import { MenuIcon, CloseIcon } from './Icons';
import { ROLES } from '../constants';
import logo from '../assets/logo.png';
import './Navbar.css';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer whenever location/route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <header className="navbar" role="banner">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand" title="LegalHub Pakistan">
          <img
            src={logo}
            alt="LegalHub Pakistan"
            className="navbar-logo"
          />
        </Link>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          className="navbar-toggle"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
        </button>

        {/* Desktop Navigation */}
        <nav className="navbar-nav" aria-label="Main Navigation">
          <div className="navbar-links">
            <Link
              to="/"
              className={`navbar-link ${isActive('/') ? 'navbar-link--active' : ''}`}
            >
              Home
            </Link>

            <Link
              to="/lawyers"
              className={`navbar-link ${isActive('/lawyers') ? 'navbar-link--active' : ''}`}
            >
              Find Lawyers
            </Link>

            <Link
              to="/feed"
              className={`navbar-link ${isActive('/feed') ? 'navbar-link--active' : ''}`}
            >
              Legal Q&amp;A Feed
            </Link>

            <Link
              to="/how-it-works"
              className={`navbar-link ${isActive('/how-it-works') ? 'navbar-link--active' : ''}`}
            >
              How It Works
            </Link>

            <Link
              to="/about"
              className={`navbar-link ${isActive('/about') ? 'navbar-link--active' : ''}`}
            >
              About Us
            </Link>

            <Link
              to="/contact"
              className={`navbar-link ${isActive('/contact') ? 'navbar-link--active' : ''}`}
            >
              Contact
            </Link>
          </div>

          {/* Desktop Auth Controls */}
          <div className="navbar-auth">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={`navbar-link ${isActive('/dashboard') ? 'navbar-link--active' : ''}`}
                >
                  Dashboard
                </Link>

                <Link
                  to="/bookings"
                  className={`navbar-link ${isActive('/bookings') ? 'navbar-link--active' : ''}`}
                >
                  Consultations
                </Link>

                {user?.role === ROLES.LAWYER && (
                  <Link
                    to="/lawyer/application"
                    className={`navbar-link ${isActive('/lawyer/application') ? 'navbar-link--active' : ''}`}
                  >
                    My Application
                  </Link>
                )}

                {user?.role === ROLES.ADMIN && (
                  <Link
                    to="/admin/queue"
                    className={`navbar-link ${isActive('/admin/queue') ? 'navbar-link--active' : ''}`}
                  >
                    Admin Queue
                  </Link>
                )}

                <div className="navbar-user-profile">
                  <div className="navbar-user-info">
                    <span className="navbar-user-name">{user?.name}</span>
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
              <>
                <Link to="/login" className="btn btn-secondary btn-sm">
                  Log In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>

      {/* Mobile Collapsible Drawer Menu */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-drawer" role="navigation" aria-label="Mobile Navigation">
          <div className="navbar-mobile-links">
            <Link
              to="/"
              className={`navbar-mobile-link ${isActive('/') ? 'navbar-mobile-link--active' : ''}`}
            >
              Home
            </Link>

            <Link
              to="/lawyers"
              className={`navbar-mobile-link ${isActive('/lawyers') ? 'navbar-mobile-link--active' : ''}`}
            >
              Find Lawyers
            </Link>

            <Link
              to="/feed"
              className={`navbar-mobile-link ${isActive('/feed') ? 'navbar-mobile-link--active' : ''}`}
            >
              Legal Q&amp;A Feed
            </Link>

            <Link
              to="/how-it-works"
              className={`navbar-mobile-link ${isActive('/how-it-works') ? 'navbar-mobile-link--active' : ''}`}
            >
              How It Works
            </Link>

            <Link
              to="/about"
              className={`navbar-mobile-link ${isActive('/about') ? 'navbar-mobile-link--active' : ''}`}
            >
              About Us
            </Link>

            <Link
              to="/contact"
              className={`navbar-mobile-link ${isActive('/contact') ? 'navbar-mobile-link--active' : ''}`}
            >
              Contact
            </Link>
          </div>

          <div className="navbar-mobile-auth">
            {isAuthenticated ? (
              <>
                <div className="navbar-mobile-user">
                  <span className="navbar-user-name">{user?.name}</span>
                  <StatusBadge role={user?.role} />
                </div>

                <Link to="/dashboard" className="btn btn-secondary btn-sm" style={{ width: '100%', textAlign: 'center' }}>
                  Dashboard
                </Link>

                <Link to="/bookings" className="btn btn-secondary btn-sm" style={{ width: '100%', textAlign: 'center' }}>
                  My Consultations
                </Link>

                <button
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', marginTop: 'var(--spacing-1)' }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-2)' }}>
                <Link to="/login" className="btn btn-secondary btn-sm" style={{ textAlign: 'center' }}>
                  Log In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm" style={{ textAlign: 'center' }}>
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
