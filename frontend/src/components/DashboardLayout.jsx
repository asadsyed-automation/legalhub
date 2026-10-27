import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import StatusChip from './StatusChip';
import ConfirmDialog from './ConfirmDialog';
import { ROLES } from '../constants';
import logo from '../assets/logo.png';
import {
  DashboardIcon,
  SearchIcon,
  BriefcaseIcon,
  DocumentIcon,
  ShieldIcon,
  ScalesIcon,
  CalendarIcon,
  MenuIcon,
  CloseIcon,
  BellIcon,
} from './Icons';
import notificationApi from '../api/notification.api';
import './DashboardLayout.css';

export const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Background 60s poll for unread notifications
  useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      if (!user) return;
      try {
        const res = await notificationApi.getUnreadCount();
        if (isMounted) {
          setUnreadCount(res?.count || 0);
        }
      } catch (err) {
        // Silently pass in background polling
        console.debug('Failed to poll notification count:', err?.message);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user, location.pathname]);

  // Close mobile drawer upon navigating
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Role-based navigation links
  const getNavLinks = () => {
    const commonLinks = [
      { to: '/dashboard', label: 'Dashboard', icon: <DashboardIcon size={18} /> },
      { to: '/notifications', label: 'Notifications', icon: <BellIcon size={18} /> },
    ];

    if (user?.role === ROLES.CLIENT) {
      return [
        ...commonLinks,
        { to: '/cases', label: 'My Case Files', icon: <BriefcaseIcon size={18} /> },
        { to: '/calendar', label: 'Court Hearing Calendar', icon: <CalendarIcon size={18} /> },
        { to: '/bookings', label: 'My Consultations', icon: <CalendarIcon size={18} /> },
        { to: '/lawyers', label: 'Find Advocates', icon: <SearchIcon size={18} /> },
      ];
    }

    if (user?.role === ROLES.LAWYER) {
      return [
        ...commonLinks,
        { to: '/cases', label: 'Case Files & Diary', icon: <BriefcaseIcon size={18} /> },
        { to: '/calendar', label: 'Court Cause List & Calendar', icon: <CalendarIcon size={18} /> },
        { to: '/bookings', label: 'Client Appointments', icon: <CalendarIcon size={18} /> },
        { to: '/lawyer/profile', label: 'Chamber Profile & Fees', icon: <BriefcaseIcon size={18} /> },
        { to: '/lawyer/application', label: 'Licensing Verification', icon: <DocumentIcon size={18} /> },
        { to: '/lawyers', label: 'Public Directory', icon: <ScalesIcon size={18} /> },
      ];
    }

    if (user?.role === ROLES.ADMIN) {
      return [
        ...commonLinks,
        { to: '/bookings', label: 'Consultation Audits', icon: <CalendarIcon size={18} /> },
        { to: '/admin/queue', label: 'Verification Queue', icon: <ShieldIcon size={18} /> },
        { to: '/lawyers', label: 'Advocate Directory', icon: <ScalesIcon size={18} /> },
      ];
    }

    return commonLinks;
  };

  const navLinks = getNavLinks();

  return (
    <div className="dash-shell">
      {/* Topbar */}
      <header className="dash-topbar">
        <div className="dash-topbar__left">
          <button
            type="button"
            className="dash-topbar__menu-toggle"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
          </button>

          <NavLink to="/" className="dash-topbar__brand" title="LegalHub Homepage">
            <img
              src={logo}
              alt="LegalHub Pakistan"
              style={{
                height: '34px',
                width: 'auto',
                maxHeight: '34px',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </NavLink>
        </div>

        <div className="dash-topbar__right">
          {/* Notification Bell */}
          <NavLink
            to="/notifications"
            className="dash-topbar__bell-btn"
            title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
            aria-label="View notifications"
          >
            <BellIcon size={18} />
            {unreadCount > 0 && (
              <span className="dash-topbar__bell-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>

          <div className="dash-topbar__user-capsule">
            <span className="dash-topbar__user-name" title={user?.email}>
              {user?.name}
            </span>
            <StatusChip status={user?.role} size="sm" />
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm dash-topbar__logout-btn"
            onClick={() => setShowLogoutConfirm(true)}
            title="Sign out of LegalHub"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="dash-shell__body">
        {/* Mobile Backdrop */}
        {isMobileMenuOpen && (
          <div
            className="dash-mobile-backdrop"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside className={`dash-sidebar ${isMobileMenuOpen ? 'dash-sidebar--open' : ''}`}>
          <div className="dash-sidebar__inner">
            <div className="dash-sidebar__section-title">Navigation</div>
            <nav className="dash-sidebar__nav">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/dashboard'}
                  className={({ isActive }) =>
                    `dash-sidebar__link ${isActive ? 'dash-sidebar__link--active' : ''}`
                  }
                >
                  <span className="dash-sidebar__link-icon" aria-hidden="true">
                    {link.icon}
                  </span>
                  <span className="dash-sidebar__link-text">{link.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="dash-sidebar__footer">
              <div className="dash-sidebar__footer-info">
                <span className="dash-sidebar__footer-role">
                  Portal: <strong>{user?.role?.toUpperCase()}</strong>
                </span>
                <span className="dash-sidebar__footer-version">v1.0.0 (Rule 135 Compliant)</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Viewport Content */}
        <main className="dash-content">
          <div className="dash-content__inner">{children}</div>
        </main>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Sign Out Confirmation"
        message="Are you sure you want to sign out of your LegalHub portal session?"
        confirmText="Sign Out"
        cancelText="Stay Signed In"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};

DashboardLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default DashboardLayout;
