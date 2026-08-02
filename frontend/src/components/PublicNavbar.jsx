import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './ui';

function PublicNavbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NAV_ITEMS = [
    { label: 'Home', path: '/home' },
    { label: 'About', path: '/about' },
    { label: 'Marketplace', path: '/marketplace' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'Contact', path: '/contact' },
  ];

  function isActive(path) {
    if (path === '/home' && (location.pathname === '/' || location.pathname === '/home')) return true;
    if (path !== '/home' && location.pathname.startsWith(path)) return true;
    return false;
  }

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--color-border)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      transition: 'all 0.2s ease'
    }}>
      <style>{`
        .nav-item-link {
          position: relative;
          color: var(--color-text-secondary);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          padding: 8px 14px;
          border-radius: var(--radius-sm);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .nav-item-link:hover {
          color: var(--color-primary);
          background-color: rgba(15, 92, 60, 0.06);
        }
        .nav-item-link.active {
          color: var(--color-primary);
          font-weight: 700;
          background-color: rgba(15, 92, 60, 0.1);
        }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-toggle { display: none !important; }
          .mobile-menu { display: none !important; }
        }
      `}</style>

      <div style={{
        maxWidth: '1280px', margin: '0 auto', padding: '0 24px',
        height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px'
      }}>
        {/* Brand Logo */}
        <Logo to="/home" height="42px" />

        {/* Desktop Nav Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="desktop-nav">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item-link ${active ? 'active' : ''}`}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Auth / Dashboard CTA Buttons & Mobile Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user ? (
            <Link to="/dashboard" style={{
              backgroundColor: 'var(--color-primary)', color: '#FFFFFF',
              textDecoration: 'none', fontSize: '14px', fontWeight: 600,
              padding: '9px 20px', borderRadius: 'var(--radius-sm)',
              boxShadow: '0 2px 8px rgba(15,92,60,0.25)',
              transition: 'all 0.2s ease',
              display: 'inline-flex', alignItems: 'center', gap: '6px'
            }}>
              <span>Go to Dashboard</span>
              <span style={{ fontSize: '15px' }}>→</span>
            </Link>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className="desktop-nav">
              <Link to="/login" style={{
                color: 'var(--color-primary)', textDecoration: 'none',
                fontSize: '14px', fontWeight: 600, padding: '8px 16px',
                borderRadius: 'var(--radius-sm)', transition: 'background-color 0.2s ease'
              }}>
                Sign In
              </Link>
              <Link to="/register" style={{
                backgroundColor: 'var(--color-primary)', color: '#FFFFFF',
                textDecoration: 'none', fontSize: '14px', fontWeight: 600,
                padding: '9px 18px', borderRadius: 'var(--radius-sm)',
                boxShadow: '0 2px 8px rgba(15,92,60,0.25)'
              }}>
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-toggle"
            aria-label="Toggle Navigation Menu"
            style={{
              display: 'none', background: 'none', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: '18px',
              cursor: 'pointer', color: 'var(--color-secondary)'
            }}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mobile-menu"
            style={{
              backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--color-border)',
              padding: '16px 24px 24px', overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      padding: '10px 16px', borderRadius: 'var(--radius-sm)',
                      textDecoration: 'none', fontSize: '15px',
                      fontWeight: active ? 700 : 500,
                      color: active ? 'var(--color-primary)' : 'var(--color-secondary)',
                      backgroundColor: active ? 'rgba(15, 92, 60, 0.08)' : 'transparent',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <span>{item.label}</span>
                    {active && <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>✓</span>}
                  </Link>
                );
              })}
            </div>

            {!user && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    textAlign: 'center', padding: '10px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-primary)', color: 'var(--color-primary)',
                    textDecoration: 'none', fontWeight: 600, fontSize: '14px'
                  }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    textAlign: 'center', padding: '10px', borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-primary)', color: '#FFFFFF',
                    textDecoration: 'none', fontWeight: 600, fontSize: '14px'
                  }}
                >
                  Get Started
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default PublicNavbar;
