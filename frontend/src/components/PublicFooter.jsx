import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './ui';

// SVG Vector Icons for Footer
const MapPinIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

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

function PublicFooter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  function handleSubscribe(e) {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  }

  return (
    <footer style={{
      backgroundColor: '#051810',
      color: '#E5E7EB',
      padding: '56px 24px 32px',
      fontSize: '14px',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        .footer-link {
          color: rgba(255, 255, 255, 0.72);
          text-decoration: none;
          font-size: 13.5px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }
        .footer-link:hover {
          color: #C9A227;
          transform: translateX(4px);
        }
        .social-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF !important;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          transition: all 0.2s ease;
        }
        .social-btn:hover {
          background-color: var(--color-primary) !important;
          border-color: #34D399 !important;
          color: #FFFFFF !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(15, 92, 60, 0.4);
        }
      `}</style>

      {/* Top Ambient Glow Decorator */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '700px', height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(201,162,39,0.5), transparent)'
      }} />

      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* ── COHESIVE 5-COLUMN FOOTER GRID (With Top Alignment) ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '32px',
          alignItems: 'start',
          marginBottom: '48px'
        }}>
          
          {/* Col 1: Brand & Compact Description */}
          <div>
            <div style={{ marginBottom: '10px' }}>
              <Logo variant="light" height="34px" />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: '13px', lineHeight: 1.55, marginBottom: '14px', maxWidth: '240px' }}>
              Pakistan's Digital Legal Workspace — automated case tracking and verified advocate matching.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#C9A227', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <img src="https://flagcdn.com/w40/pk.png" alt="Pakistan Flag" style={{ width: '16px', height: '11px', borderRadius: '2px', objectFit: 'cover' }} />
                Built Specifically for Pakistan
              </span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldIcon /> 256-Bit SSL Data Encryption
              </span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ScaleIcon /> High Court Compliant
              </span>
            </div>
          </div>

          {/* Col 2: Platform Navigation */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 700, margin: '0 0 14px', fontFamily: 'var(--font-heading)' }}>
              Platform
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '9px' }}>
              <li><Link to="/home" className="footer-link">Home Page</Link></li>
              <li><Link to="/about" className="footer-link">About & Vision</Link></li>
              <li><Link to="/marketplace" className="footer-link">Lawyer Marketplace</Link></li>
              <li><Link to="/pricing" className="footer-link">Pricing Plans</Link></li>
              <li><Link to="/search" className="footer-link">Global Case Search</Link></li>
              <li><Link to="/login" className="footer-link">Advocate Sign In</Link></li>
            </ul>
          </div>

          {/* Col 3: Legal & Resources */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 700, margin: '0 0 14px', fontFamily: 'var(--font-heading)' }}>
              Resources & Legal
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '9px' }}>
              <li><Link to="/privacy" className="footer-link">Privacy Policy</Link></li>
              <li><Link to="/terms" className="footer-link">Terms of Service</Link></li>
              <li><Link to="/maintenance" className="footer-link">System Status & SLA</Link></li>
              <li><Link to="/contact" className="footer-link">Help & Support</Link></li>
            </ul>
          </div>

          {/* Col 4: Contact Information */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 700, margin: '0 0 14px', fontFamily: 'var(--font-heading)' }}>
              Contact
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.72)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ color: '#C9A227', marginTop: '2px' }}><MapPinIcon /></span>
                <span>High Court Bar Area, Lahore, Pakistan</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#C9A227' }}><MailIcon /></span>
                <a href="mailto:support@legalhub.pk" style={{ color: '#E5E7EB', textDecoration: 'none' }}>support@legalhub.pk</a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#C9A227' }}><ClockIcon /></span>
                <span>Response: &lt; 24 hrs</span>
              </div>
            </div>
          </div>

          {/* Col 5: Integrated Newsletter Column & Social Media Icons */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 700, margin: '0 0 10px', fontFamily: 'var(--font-heading)' }}>
              LegalHub Insider
            </h4>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12.5px', margin: '0 0 12px', lineHeight: 1.45 }}>
              Receive cause list alerts & legaltech updates.
            </p>

            <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'row', gap: '6px', marginBottom: '16px' }}>
              {subscribed ? (
                <div style={{
                  backgroundColor: 'rgba(34,160,107,0.2)', border: '1px solid var(--color-success)',
                  color: '#34D399', padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                  fontSize: '12.5px', fontWeight: 600, textAlign: 'center', width: '100%'
                }}>
                  ✓ Subscribed! Thank you.
                </div>
              ) : (
                <>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="advocate@example.com"
                    required
                    style={{
                      flex: 1, padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(255,255,255,0.18)', backgroundColor: 'rgba(0,0,0,0.35)',
                      color: '#FFF', fontSize: '12.5px', fontFamily: 'var(--font-body)', outline: 'none',
                      boxSizing: 'border-box', minWidth: '0'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      backgroundColor: 'var(--color-primary)', color: '#FFF', border: 'none',
                      borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontWeight: 700,
                      fontSize: '12.5px', cursor: 'pointer', whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(15,92,60,0.3)', flexShrink: 0
                    }}
                  >
                    Subscribe
                  </button>
                </>
              )}
            </form>

            {/* Social Media Buttons */}
            <div>
              <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Follow Us
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="social-btn" title="LinkedIn">in</a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-btn" title="Twitter / X">𝕏</a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-btn" title="Facebook">f</a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="social-btn" title="YouTube">▶</a>
              </div>
            </div>
          </div>

        </div>

        {/* ── BOTTOM BAR ──────────────────────────────────────────────── */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: '20px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: '16px', fontSize: '12.5px',
          color: 'rgba(255,255,255,0.5)'
        }}>
          <div>
            © {new Date().getFullYear()} <strong>LegalHub Pakistan</strong>. All rights reserved.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#34D399' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#34D399', display: 'inline-block', boxShadow: '0 0 6px #34D399' }} />
            <span>All Systems Operational</span>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <Link to="/privacy" className="footer-link" style={{ fontSize: '12px' }}>Privacy Policy</Link>
            <Link to="/terms" className="footer-link" style={{ fontSize: '12px' }}>Terms of Service</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default PublicFooter;
