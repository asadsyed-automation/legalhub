import { motion } from 'framer-motion';
import { Logo } from './ui';

const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const ScaleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/>
  </svg>
);

function AuthLayout({
  children,
  title,
  subtitle,
  heroTag = "Built For Advocates & Citizens in Pakistan",
  heroTitle = "Pakistan's Digital Legal Workspace",
  heroDesc = "Manage court cases, cause lists, client messaging, and verified advocate marketplace listings seamlessly.",
  heroWidget,
  showMobileLogo = true
}) {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#FFFFFF',
      fontFamily: 'var(--font-body)',
      overflowX: 'hidden'
    }}>
      <style>{`
        .auth-left-panel {
          display: flex;
        }
        .auth-mobile-logo {
          display: none;
        }
        @media (max-width: 960px) {
          .auth-left-panel {
            display: none !important;
          }
          .auth-mobile-logo {
            display: flex !important;
          }
        }
        .auth-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .auth-input-icon {
          position: absolute;
          left: 14px;
          color: #9CA3AF;
          display: flex;
          align-items: center;
          pointer-events: none;
        }
        .auth-input {
          width: 100%;
          min-height: 44px;
          padding: 0 14px 0 42px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-border);
          font-size: 14px;
          font-family: var(--font-body);
          color: var(--color-text);
          outline: none;
          background-color: #FFFFFF;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          box-sizing: border-box;
        }
        .auth-input:focus {
          border-color: var(--color-primary) !important;
          box-shadow: 0 0 0 3px rgba(15, 92, 60, 0.12) !important;
        }
      `}</style>

      {/* ── LEFT BRANDING & DECORATIVE PRODUCT PANEL (50% Desktop) ────────── */}
      <div
        className="auth-left-panel"
        style={{
          flex: '1 1 50%',
          background: 'linear-gradient(135deg, #072E1E 0%, #0F5C3C 60%, #051F14 100%)',
          color: '#FFFFFF',
          padding: '40px 48px',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Ambient Gradient Lighting & Blobs */}
        <div style={{
          position: 'absolute', top: '-100px', right: '-100px', width: '420px', height: '420px',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,162,39,0.22) 0%, rgba(201,162,39,0) 70%)',
          filter: 'blur(50px)', pointerEvents: 'none'
        }} />

        <div style={{
          position: 'absolute', bottom: '-80px', left: '-80px', width: '360px', height: '360px',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.18) 0%, rgba(52,211,153,0) 70%)',
          filter: 'blur(45px)', pointerEvents: 'none'
        }} />

        {/* Top: Brand Logo */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Logo variant="light" height="38px" />
        </div>

        {/* Middle: Unique Left Panel Content */}
        <div style={{ position: 'relative', zIndex: 2, margin: '28px 0' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
            padding: '4px 12px', borderRadius: '9999px', backgroundColor: 'rgba(201,162,39,0.18)',
            color: '#C9A227', border: '1px solid rgba(201,162,39,0.3)', marginBottom: '14px'
          }}>
            <img src="https://flagcdn.com/w40/pk.png" alt="Pakistan Flag" style={{ width: '14px', height: '10px', borderRadius: '2px', objectFit: 'cover' }} />
            {heroTag}
          </span>

          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(26px, 2.8vw, 36px)',
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: '14px',
            color: '#FFFFFF'
          }}>
            {heroTitle}
          </h1>

          <p style={{
            fontSize: '14.5px',
            color: 'rgba(255, 255, 255, 0.85)',
            lineHeight: 1.6,
            marginBottom: '24px',
            maxWidth: '460px'
          }}>
            {heroDesc}
          </p>

          {/* Frosted Glass Floating UI Product Widget */}
          {heroWidget || (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.07)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
                maxWidth: '440px',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
                pointerEvents: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34D399', display: 'inline-block' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>High Court Cause List — Bench II</span>
                </div>
                <span style={{ fontSize: '11px', color: '#C9A227', fontWeight: 600 }}>Active Case #9421</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong>Title:</strong> Ahmed vs. State (Constitutional Petition)</span>
                  <span style={{ color: '#34D399', fontWeight: 600 }}>Hearing Tomorrow</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong>Court Room:</strong> Court 4, Lahore High Court</span>
                  <span><strong>Status:</strong> Arguments Pending</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Bottom: Testimonial & Trust Footer */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.68)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><ShieldIcon /> 256-Bit Data Encryption</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><ScaleIcon /> High Court Compliant</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL (50% Desktop, 100% Mobile) ──────────────────── */}
      <div style={{
        flex: '1 1 50%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
        backgroundColor: '#FFFFFF',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        {/* Mobile Header Logo */}
        {showMobileLogo && (
          <div className="auth-mobile-logo" style={{ marginBottom: '16px', justifyContent: 'center' }}>
            <Logo to="/home" height="36px" />
          </div>
        )}

        {/* Centered Auth Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ width: '100%', maxWidth: '420px', margin: '0 auto' }}
        >
          {/* Header Title & Subtitle */}
          {(title || subtitle) && (
            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
              {title && (
                <h2 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '24px',
                  fontWeight: 800,
                  color: 'var(--color-secondary)',
                  margin: '0 0 4px'
                }}>
                  {title}
                </h2>
              )}
              {subtitle && (
                <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Form Content */}
          {children}
        </motion.div>
      </div>
    </div>
  );
}

export default AuthLayout;
