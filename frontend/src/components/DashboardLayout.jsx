import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { Logo } from './ui';

// ── Energetic Vector SVG Icons for Sidebar & Header ────────────────────────
const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
  </svg>
);

const FolderIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 8.07 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
  </svg>
);

const MessageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>
);

const StoreIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/>
  </svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const BuildingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const LogOutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
  </svg>
);

/* ── Sidebar nav link ──────────────────────────────────────────────────── */
function NavLink({ to, icon: Icon, children }) {
  const location = useLocation();
  const active = to === '/marketplace'
    ? location.pathname === '/marketplace'
    : location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <Link
      to={to}
      style={{
        color: active ? '#FFFFFF' : 'rgba(255,255,255,0.78)',
        textDecoration: 'none',
        fontSize: '13.5px',
        fontWeight: active ? 700 : 500,
        padding: '9px 12px',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        position: 'relative',
        transition: 'all 0.15s ease',
        backgroundColor: active ? 'rgba(255,255,255,0.18)' : 'transparent',
        borderLeft: active ? '3.5px solid var(--color-accent)' : '3.5px solid transparent',
      }}
    >
      <span style={{ color: active ? 'var(--color-accent)' : 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center' }}>
        {Icon && <Icon />}
      </span>
      <span>{children}</span>
    </Link>
  );
}

/* ── Section label ────────────────────────────────────────────────────── */
const SectionLabel = ({ children }) => (
  <p style={{
    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.12em', color: 'rgba(255,255,255,0.45)',
    marginTop: '18px', marginBottom: '6px', paddingLeft: '12px',
  }}>
    {children}
  </p>
);

/* ── Sidebar content ─────────────────────────────────────────────────── */
function SidebarContent({ role, onClose }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px 12px' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', paddingLeft: '4px' }}>
        <Logo variant="light" height="34px" style={{ maxWidth: '150px', objectFit: 'contain' }} />
        {onClose && (
          <button onClick={onClose} style={{
            marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.6)', fontSize: '20px', padding: '4px', lineHeight: 1,
          }}>×</button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
        <SectionLabel>Core Workspace</SectionLabel>
        <NavLink to="/dashboard" icon={DashboardIcon}>Dashboard</NavLink>
        <NavLink to="/cases" icon={FolderIcon}>Cases</NavLink>
        <NavLink to="/messages" icon={MessageIcon}>Messages</NavLink>
        <NavLink to="/notifications" icon={BellIcon}>Notifications</NavLink>

        <SectionLabel>Marketplace</SectionLabel>
        <NavLink to="/marketplace" icon={StoreIcon}>Browse Marketplace</NavLink>
        {role === 'lawyer' && <NavLink to="/marketplace/profile" icon={UserIcon}>Advocate Profile</NavLink>}
        {role === 'citizen' && <NavLink to="/citizen/profile" icon={UserIcon}>My Client Profile</NavLink>}

        {role === 'lawyer' && (
          <>
            <SectionLabel>Firm Management</SectionLabel>
            <NavLink to="/firm" icon={BuildingIcon}>Firm Management</NavLink>
          </>
        )}

        <SectionLabel>Preferences</SectionLabel>
        <NavLink to="/settings" icon={SettingsIcon}>Settings</NavLink>

        {role === 'admin' && (
          <>
            <SectionLabel>Administration</SectionLabel>
            <NavLink to="/admin" icon={SettingsIcon}>Admin Panel</NavLink>
          </>
        )}
      </nav>
    </div>
  );
}

/* ── Main layout ─────────────────────────────────────────────────────── */
function DashboardLayout() {
  const { user, logout } = useAuth();
  const role = user?.role;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      {/* ── Desktop Sidebar (Deep Emerald Green as locked in tokens) ───── */}
      {!isMobile && (
        <aside style={{
          width: '240px',
          flexShrink: 0,
          background: 'linear-gradient(180deg, #072E1E 0%, #0F5C3C 100%)',
          backgroundColor: 'var(--color-primary)',
          color: '#FFFFFF',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <SidebarContent role={role} />
        </aside>
      )}

      {/* ── Mobile Drawer Overlay ───────────────────────────────────────── */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              style={{
                position: 'fixed', inset: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 40,
              }}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.22 }}
              style={{
                position: 'fixed', top: 0, left: 0, bottom: 0,
                width: '260px',
                background: 'linear-gradient(180deg, #072E1E 0%, #0F5C3C 100%)',
                backgroundColor: 'var(--color-primary)',
                color: '#FFFFFF',
                zIndex: 50,
              }}
            >
              <SidebarContent role={role} onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Content Area ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <header style={{
          height: '60px',
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--spacing-3)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '20px', color: 'var(--color-text)', padding: '4px',
                  display: 'flex', alignItems: 'center',
                }}
                aria-label="Open sidebar"
              >
                ≡
              </button>
            )}
            <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              LegalHub Workspace
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: 'var(--color-secondary)', lineHeight: 1.2 }}>
                {user?.name || 'User'}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600, textTransform: 'capitalize' }}>
                {role === 'lawyer' ? '⚖️ Verified Advocate' : role === 'admin' ? '⚙️ Admin' : '👤 Citizen Client'}
              </span>
            </div>

            <button
              onClick={logout}
              style={{
                backgroundColor: 'rgba(214,69,69,0.08)',
                color: 'var(--color-danger)',
                border: '1px solid rgba(214,69,69,0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 12px',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <LogOutIcon /> Sign Out
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ flex: 1, padding: 'var(--spacing-3)', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;