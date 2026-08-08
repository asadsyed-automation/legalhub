import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

// SVG Icons for Homepage
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const ScaleIcon = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/>
  </svg>
);

// Suit & Tie Lawyer Advocate Icon for 500+ Lawyers Stat Card
const UserSuitIcon = ({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="10" cy="7" r="4"/>
    <path d="m17 11 2 2 4-4"/>
  </svg>
);

const FolderIcon = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 8.07 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
  </svg>
);

const CalendarIcon = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
);

const BotIcon = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/>
  </svg>
);

const StoreIcon = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/>
  </svg>
);

const UserIcon = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const LockIcon = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const CreditCardIcon = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
  </svg>
);

const MessageSquareIcon = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const MapPinIcon = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const StarIcon = ({ size = 16, fill = "#C9A227" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const SEARCH_PHRASES = [
  'Search for a family lawyer in Lahore',
  'Search for a criminal lawyer in Karachi',
  'Search for a property dispute lawyer',
  'Search for a corporate lawyer in Islamabad'
];

function useTypingPlaceholder(phrases = [], { typeSpeed = 65, deleteSpeed = 35, delay = 2200 } = {}) {
  const [placeholder, setPlaceholder] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!phrases || phrases.length === 0) return;

    let prefersReducedMotion = false;
    try {
      prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      prefersReducedMotion = false;
    }

    if (prefersReducedMotion) {
      setPlaceholder(phrases[0] || 'Search lawyers, specializations, or cities...');
      return;
    }

    const currentPhrase = phrases[phraseIdx % phrases.length] || '';
    if (!currentPhrase) return;

    let timer;

    if (!isDeleting) {
      if (placeholder.length < currentPhrase.length) {
        timer = setTimeout(() => {
          setPlaceholder(currentPhrase.slice(0, placeholder.length + 1));
        }, typeSpeed);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, delay);
      }
    } else {
      if (placeholder.length > 0) {
        timer = setTimeout(() => {
          setPlaceholder(currentPhrase.slice(0, placeholder.length - 1));
        }, deleteSpeed);
      } else {
        setIsDeleting(false);
        setPhraseIdx((prev) => (prev + 1) % phrases.length);
      }
    }

    return () => clearTimeout(timer);
  }, [placeholder, isDeleting, phraseIdx, phrases, typeSpeed, deleteSpeed, delay]);

  return placeholder || (phrases && phrases[0] ? phrases[0] : 'Search lawyers, specializations, or cities...');
}

function Home() {
  const navigate = useNavigate();
  const [howItWorksRole, setHowItWorksRole] = useState('lawyer');
  const [searchQuery, setSearchQuery] = useState('');
  
  const heroRef = useRef(null);
  const glowRef = useRef(null);

  const animatedPlaceholder = useTypingPlaceholder(SEARCH_PHRASES);

  const [isSmallMobile, setIsSmallMobile] = useState(window.innerWidth <= 640);

  useEffect(() => {
    function handleResize() {
      setIsSmallMobile(window.innerWidth <= 640);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  let prefersReducedMotion = false;
  try {
    prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    prefersReducedMotion = false;
  }

  useEffect(() => {
    const heroEl = heroRef.current;
    const glowEl = glowRef.current;
    if (!heroEl || !glowEl) return;

    let isFinePointer = true;
    try {
      isFinePointer = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    } catch {
      isFinePointer = true;
    }

    if (!isFinePointer || prefersReducedMotion) {
      glowEl.style.display = 'none';
      return;
    }

    let rafId = null;

    const handleMouseMove = (e) => {
      const rect = heroEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (glowEl) {
          glowEl.style.transform = `translate3d(${x - 175}px, ${y - 175}px, 0)`;
          glowEl.style.opacity = '1';
        }
      });
    };

    const handleMouseLeave = () => {
      if (glowEl) glowEl.style.opacity = '1';
    };

    heroEl.addEventListener('mousemove', handleMouseMove);
    heroEl.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      heroEl.removeEventListener('mousemove', handleMouseMove);
      heroEl.removeEventListener('mouseleave', handleMouseLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [prefersReducedMotion]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    const query = searchQuery.trim() || animatedPlaceholder;
    navigate(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <div style={{ fontFamily: 'var(--font-body)', backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      <PublicNavbar />

      {/* ── 1. HERO SECTION (Balanced Height & Proportional Layout) ── */}
      <section
        ref={heroRef}
        style={{
          background: 'linear-gradient(135deg, #0A2B1D 0%, #0F5C3C 55%, #072619 100%)',
          color: '#FFFFFF',
          padding: '60px 24px 65px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Cursor Spotlight Glow */}
        <div
          ref={glowRef}
          aria-hidden="true"
          style={{
            position: 'absolute', left: 0, top: 0, width: '350px', height: '350px',
            borderRadius: '0%',
            background: 'radial-gradient(circle, rgba(201,162,39,0.35) 0%, rgba(201,162,39,0) 70%)',
            filter: 'blur(45px)', pointerEvents: 'none', zIndex: 1, opacity: 0,
            transition: 'opacity 0.3s ease', willChange: 'transform'
          }}
        />

        {/* Geometric Accent Shapes */}
        <motion.div
          aria-hidden="true"
          initial={prefersReducedMotion ? { opacity: 0.3, scale: 1 } : { opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{
            position: 'absolute', right: '-40px', top: '-30px', width: '440px', height: '440px',
            borderRadius: '28%', background: 'linear-gradient(135deg, rgba(201,162,39,0.4) 0%, rgba(201,162,39,0.05) 100%)',
            filter: 'blur(35px)', pointerEvents: 'none', zIndex: 1
          }}
        />

        <div style={{ maxWidth: '1180px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <motion.div variants={fadeUp} initial="initial" animate="animate" transition={{ duration: 0.4, ease: 'easeOut' }}>
            
            {/* Top Tag */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
              padding: '5px 16px', borderRadius: '9999px', backgroundColor: 'rgba(201,162,39,0.18)',
              color: '#C9A227', border: '1px solid rgba(201,162,39,0.35)', marginBottom: '16px'
            }}>
              <img src="https://flagcdn.com/w40/pk.png" alt="Pakistan Flag" style={{ width: '15px', height: '10px', borderRadius: '2px', objectFit: 'cover' }} />
              Pakistan's First Digital Legal Workspace
            </span>

            {/* Headline */}
            <h1 style={{
              fontSize: 'clamp(32px, 4.8vw, 50px)',
              fontWeight: 800,
              lineHeight: 1.16,
              margin: '0 auto 16px',
              maxWidth: '840px',
              fontFamily: 'var(--font-heading)',
              color: '#FFFFFF'
            }}>
              Streamline Case Management & Legal Practice
            </h1>
            
            {/* Subtitle */}
            <p style={{
              fontSize: 'clamp(15px, 1.8vw, 17.5px)',
              color: 'rgba(255,255,255,0.85)',
              maxWidth: '800px',
              margin: '0 auto 28px',
              lineHeight: 1.6
            }}>
              LegalHub empowers Pakistani advocates and law firms to track court cause lists, manage case files, coordinate with clients, and list verified services on the Marketplace.
            </p>

            {/* Search Bar (Single-Row Layout with Right-Side Circular Search Icon Button) */}
            <form onSubmit={handleSearchSubmit} style={{ maxWidth: '640px', margin: '0 auto 28px', position: 'relative', zIndex: 3 }}>
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: '9999px',
                padding: '5px 6px 5px 20px',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.28)',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={animatedPlaceholder}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: 'none',
                    outline: 'none',
                    fontSize: '14px',
                    fontFamily: 'var(--font-body)',
                    color: 'var(--color-secondary)',
                    backgroundColor: 'transparent',
                    padding: '8px 0'
                  }}
                />
                <button
                  type="submit"
                  aria-label="Search"
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(15,92,60,0.3)',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <SearchIcon />
                </button>
              </div>
            </form>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '28px' }}>
              <Link to="/register" style={{
                backgroundColor: 'var(--color-accent)',
                color: '#1A1A1A',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '15px',
                padding: '13px 28px',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 14px rgba(201,162,39,0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                I'm a Lawyer – Start Free →
              </Link>
              <Link to="/marketplace" style={{
                backgroundColor: 'rgba(255,255,255,0.12)',
                color: '#FFFFFF',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '15px',
                padding: '13px 26px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255,255,255,0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                Browse Lawyer Marketplace
              </Link>
            </div>

            {/* Trust Indicators Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', fontSize: '13px', color: 'rgba(255,255,255,0.78)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ScaleIcon size={16} /> High Court Compliant
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ShieldIcon /> 256-Bit SSL Data Encryption
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <CheckIcon /> 500+ Verified Advocates
              </span>
            </div>

          </motion.div>
        </div>
      </section>

      {/* ── 2. STATS BAR (With Suit & Tie Lawyer Icon for 500+ Lawyers) ─────── */}
      <section style={{ backgroundColor: '#F9FAFB', padding: '44px 24px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px',
            textAlign: 'center'
          }}>
            {[
              { number: '500+', label: 'Registered Lawyers', icon: <UserSuitIcon size={30} /> },
              { number: '12,500+', label: 'Active Cases Managed', icon: <FolderIcon size={30} /> },
              { number: '35+', label: 'Cities Covered', icon: <MapPinIcon size={30} /> },
              {
                number: '4.9/5',
                label: 'Client Satisfaction',
                customStars: true
              }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                variants={fadeUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '24px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ color: 'var(--color-primary)', display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                  {stat.icon || (
                    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} size={18} fill="#C9A227" />
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-heading)', margin: '0 0 4px' }}>
                  {stat.number}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. HOW IT WORKS ─────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', backgroundColor: '#FFFFFF' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Simple & Transparent
          </span>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-secondary)', margin: '8px 0 16px', fontFamily: 'var(--font-heading)' }}>
            How LegalHub Works
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', maxWidth: '600px', margin: '0 auto 32px' }}>
            Choose your workflow to see how LegalHub makes legal practice and finding legal assistance simple.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '48px' }}>
            <div style={{ display: 'inline-flex', backgroundColor: '#F3F4F6', padding: '4px', borderRadius: '9999px', border: '1px solid var(--color-border)' }}>
              <button
                onClick={() => setHowItWorksRole('lawyer')}
                style={{
                  padding: '10px 28px', borderRadius: '9999px', border: 'none',
                  cursor: 'pointer', fontWeight: 600, fontSize: '14px',
                  backgroundColor: howItWorksRole === 'lawyer' ? 'var(--color-primary)' : 'transparent',
                  color: howItWorksRole === 'lawyer' ? '#FFF' : 'var(--color-text-secondary)',
                  transition: 'all 0.2s ease'
                }}
              >
                For Lawyers & Law Firms
              </button>
              <button
                onClick={() => setHowItWorksRole('citizen')}
                style={{
                  padding: '10px 28px', borderRadius: '9999px', border: 'none',
                  cursor: 'pointer', fontWeight: 600, fontSize: '14px',
                  backgroundColor: howItWorksRole === 'citizen' ? 'var(--color-primary)' : 'transparent',
                  color: howItWorksRole === 'citizen' ? '#FFF' : 'var(--color-text-secondary)',
                  transition: 'all 0.2s ease'
                }}
              >
                For Citizens & Clients
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', textAlign: 'left' }}>
            {(howItWorksRole === 'lawyer' 
              ? [
                  { step: '01', title: 'Create Profile & Register Practice', desc: 'Sign up as a Lawyer, verify your credentials, and list your specialized legal gigs or practice areas.' },
                  { step: '02', title: 'Manage Cases & Hearings', desc: 'Add case entries, set court hearing dates, upload documents, and track fees with automated notifications.' },
                  { step: '03', title: 'Collaborate & Expand', desc: 'Message clients directly, invite associates to your law firm, and grow your legal reputation.' }
                ] 
              : [
                  { step: '01', title: 'Search & Browse Verified Lawyers', desc: 'Explore top verified Pakistani lawyers by specialization, city, court, and fee structure.' },
                  { step: '02', title: 'Review Gigs & Ratings', desc: 'Compare legal services, check ratings, and read authentic reviews from previous clients.' },
                  { step: '03', title: 'Get Legal Help & Direct Messaging', desc: 'Hire a lawyer, stay updated on your case progress, and communicate through secure messaging.' }
                ]
            ).map((st, idx) => (
              <motion.div
                key={st.step}
                variants={fadeUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
                style={{
                  backgroundColor: '#F9FAFB',
                  padding: '32px 24px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div style={{
                  fontSize: '14px', fontWeight: 800, color: 'var(--color-accent)',
                  backgroundColor: 'rgba(201,162,39,0.12)', padding: '4px 12px',
                  borderRadius: '9999px', display: 'inline-block', marginBottom: '16px'
                }}>
                  Step {st.step}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-secondary)', margin: '0 0 10px', fontFamily: 'var(--font-heading)' }}>
                  {st.title}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {st.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. FEATURES SECTION ──────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', backgroundColor: '#F9FAFB', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Comprehensive Platform
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-secondary)', margin: '8px 0 16px', fontFamily: 'var(--font-heading)' }}>
              Built specifically for Pakistani practice requirements
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
            {[
              { icon: <FolderIcon size={26} />, title: 'Case Management', desc: 'Centralized repository for all civil, criminal, constitutional, and corporate cases.' },
              { icon: <CalendarIcon size={26} />, title: 'Hearing Reminders', desc: 'Never miss a cause list date with automated email and real-time notification alerts.' },
              { icon: <BotIcon size={26} />, title: 'AI Petition Tracker', desc: 'AI-driven analysis for case progression, petition tracking, and law research summaries.' },
              { icon: <StoreIcon size={26} />, title: 'Lawyer Marketplace', desc: 'Public platform for verified advocates to showcase expertise and acquire clients.' },
              { icon: <UserIcon size={26} />, title: 'Citizen Portal', desc: 'Empowering clients to track case status, view transparent fee structures, and leave reviews.' },
              { icon: <LockIcon size={26} />, title: 'Document Storage', desc: 'Cloud storage for court orders, power of attorney, and evidence files.' },
              { icon: <CreditCardIcon size={26} />, title: 'Fee Tracking', desc: 'Track retainer fees, court costs, pending client invoices, and payment statuses.' },
              { icon: <MessageSquareIcon size={26} />, title: 'Real-Time Messaging', desc: 'Socket.io powered instant messaging between advocate and client per case.' }
            ].map((feat, idx) => (
              <motion.div
                key={idx}
                variants={fadeUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
                whileHover={{
                  y: -4,
                  borderColor: 'var(--color-primary)',
                  boxShadow: '0 0 0 0.5px var(--color-primary), 0 8px 24px rgba(15, 92, 60, 0.12)'
                }}
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '28px 24px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease'
                }}
              >
                <div style={{ color: 'var(--color-primary)', marginBottom: '14px' }}>{feat.icon}</div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-secondary)', margin: '0 0 8px', fontFamily: 'var(--font-heading)' }}>
                  {feat.title}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. AI FEATURE FLAGSHIP SHOWCASE SECTION ─────────────────── */}
      <section style={{
        padding: '85px 24px',
        background: 'linear-gradient(135deg, #051A10 0%, #0F5C3C 100%)',
        color: '#FFFFFF'
      }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '48px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <span style={{
              fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)',
              backgroundColor: 'rgba(201,162,39,0.18)', padding: '5px 14px', borderRadius: '9999px',
              textTransform: 'uppercase', letterSpacing: '0.1em', display: 'inline-flex', alignItems: 'center', gap: '6px'
            }}>
              <BotIcon size={16} /> Next-Gen AI Legal Assistant
            </span>

            <h2 style={{ fontSize: '34px', fontWeight: 800, margin: '18px 0 16px', fontFamily: 'var(--font-heading)', color: '#FFF', lineHeight: 1.25 }}>
              AI Petition & Case Research Assistant
            </h2>

            <p style={{ fontSize: '15.5px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, marginBottom: '28px' }}>
              LegalHub includes specialized AI designed for Pakistani legal proceedings — draft petitions, generate hearing summaries, analyze case precedents, and extract key arguments effortlessly.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                <span style={{ color: 'var(--color-accent)' }}><CheckIcon /></span> Automated Petition & Stay Order Drafting
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                <span style={{ color: 'var(--color-accent)' }}><CheckIcon /></span> Cause List & Hearing Date Analysis
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                <span style={{ color: 'var(--color-accent)' }}><CheckIcon /></span> Pakistan Law Decisions (PLD) Precedent Extraction
              </div>
            </div>

            <Link to="/register" style={{
              backgroundColor: 'var(--color-accent)', color: '#1A1A1A',
              padding: '13px 26px', borderRadius: 'var(--radius-sm)',
              fontWeight: 700, textDecoration: 'none', fontSize: '14.5px', display: 'inline-block'
            }}>
              Try AI Legal Tools Free →
            </Link>
          </div>

          <div style={{
            flex: 1, minWidth: '320px', backgroundColor: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', color: '#C9A227', fontWeight: 700, textTransform: 'uppercase' }}>
                AI Legal Assistant · Active Session
              </span>
              <span style={{ fontSize: '11px', color: '#34D399', fontWeight: 600 }}>Ready</span>
            </div>

            <div style={{
              backgroundColor: '#FFFFFF', color: '#1A1A1A', padding: '16px',
              borderRadius: 'var(--radius-sm)', fontSize: '13.5px', marginBottom: '12px', lineHeight: 1.55,
              borderLeft: '4px solid var(--color-primary)'
            }}>
              <strong>Generated Hearing Summary:</strong> Civil Petition #CP-2026-88 before High Court Lahore. Next hearing set for 14th Aug 2026 regarding interim stay order.
            </div>

            <div style={{
              backgroundColor: 'rgba(0,0,0,0.25)', color: '#FFF', padding: '12px 16px',
              borderRadius: 'var(--radius-sm)', fontSize: '12.5px', border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <span style={{ color: '#C9A227' }}><BotIcon size={16} /></span>
              <span>AI Analysis: 3 Precedents matched from Pakistan Law Decisions (PLD).</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. MARKETPLACE PREVIEW SECTION ──────────────────────────── */}
      <section style={{ padding: '80px 24px', backgroundColor: '#FFFFFF' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Top Verified Advocates
              </span>
              <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-secondary)', margin: '8px 0 0', fontFamily: 'var(--font-heading)' }}>
                Lawyer Marketplace Preview
              </h2>
            </div>
            <Link to="/marketplace" style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none', fontSize: '14px' }}>
              Explore All Advocates →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              { name: 'Adv. M. Ali Khan', spec: 'Corporate & Commercial Law', city: 'Lahore', rating: '5.0 (42 reviews)', won: '140+ Cases', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80' },
              { name: 'Adv. Sara Ahmed', spec: 'Family & Property Disputes', city: 'Karachi', rating: '4.9 (28 reviews)', won: '95+ Cases', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80' },
              { name: 'Adv. Kamran Shah', spec: 'Criminal Litigation & Constitutional', city: 'Islamabad', rating: '4.9 (35 reviews)', won: '180+ Cases', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80' }
            ].map((lawyer, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4, borderColor: 'var(--color-primary)' }}
                style={{
                  backgroundColor: '#F9FAFB', padding: '24px',
                  borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)', transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <img
                    src={lawyer.avatar}
                    alt={lawyer.name}
                    style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary)' }}
                  />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-secondary)' }}>{lawyer.name}</h4>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPinIcon size={13} /> {lawyer.city}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '8px' }}>
                  {lawyer.spec}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#D97706', fontWeight: 600 }}>
                    <StarIcon size={14} /> {lawyer.rating}
                  </span>
                  <span>🏆 {lawyer.won}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. PRICING SECTION ─────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', backgroundColor: '#F9FAFB', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Transparent Pricing
          </span>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-secondary)', margin: '8px 0 16px', fontFamily: 'var(--font-heading)' }}>
            Plans for Individual Advocates & Law Firms
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', marginBottom: '48px' }}>
            Simple monthly subscription plans with no hidden fees.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', textAlign: 'left' }}>
            {[
              { title: 'Free Trial', price: 'PKR 0', period: '14 Days Free', features: ['Up to 5 Active Cases', 'Basic Hearing Alerts', 'Marketplace Profile Listing', 'Standard Document Storage'], cta: 'Start Free Trial', popular: false },
              { title: 'Professional Lawyer', price: 'PKR 2,500', period: '/ month', features: ['Unlimited Active Cases', 'AI Petition Tracker & Summaries', 'Priority Marketplace Verification', 'Real-Time Client Messaging', 'Full Fee Tracking & Invoicing'], cta: 'Get Started', popular: true },
              { title: 'Enterprise Law Firm', price: 'PKR 8,000', period: '/ month', features: ['Multi-Lawyer Firm Account', 'Unlimited Associate seats', 'Shared Case & Document Vault', 'Dedicated Admin Controls', '24/7 Priority Support'], cta: 'Contact Sales', popular: false }
            ].map((plan, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '36px 28px',
                  borderRadius: 'var(--radius-lg)',
                  border: plan.popular ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  position: 'relative',
                  boxShadow: plan.popular ? '0 8px 24px rgba(15,92,60,0.12)' : '0 2px 8px rgba(0,0,0,0.03)'
                }}
              >
                {plan.popular && (
                  <span style={{
                    position: 'absolute', top: '-14px', right: '24px',
                    backgroundColor: 'var(--color-primary)', color: '#FFF',
                    fontSize: '11px', fontWeight: 700, padding: '4px 12px',
                    borderRadius: '9999px', textTransform: 'uppercase'
                  }}>
                    Most Popular
                  </span>
                )}
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-secondary)', margin: '0 0 12px' }}>{plan.title}</h3>
                <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '4px', fontFamily: 'var(--font-heading)' }}>
                  {plan.price} <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 400 }}>{plan.period}</span>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '20px 0' }} />
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center' }}><CheckIcon /></span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/register')}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)',
                    border: plan.popular ? 'none' : '1px solid var(--color-primary)',
                    backgroundColor: plan.popular ? 'var(--color-primary)' : 'transparent',
                    color: plan.popular ? '#FFF' : 'var(--color-primary)',
                    fontWeight: 700, cursor: 'pointer', fontSize: '14px'
                  }}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. TESTIMONIALS SECTION ─────────────────────────────────── */}
      <section style={{ padding: '80px 24px', backgroundColor: '#FFFFFF' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-secondary)', margin: '0 0 40px', fontFamily: 'var(--font-heading)' }}>
            Trusted by Advocates Across Pakistan
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px', textAlign: 'left' }}>
            {[
              { name: 'Adv. Hammad Raza', role: 'High Court Advocate', organization: 'Lahore High Court Bar Association', quote: 'LegalHub has made our cause list and client communication effortless. The real-time messaging per case is a game changer.', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80' },
              { name: 'Adv. Fatima Noor', role: 'Family Law Specialist', organization: 'Karachi Bar Association', quote: 'Clients love being able to see verified reviews and transparent fee structures on the Marketplace. Highly recommended!', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80' },
              { name: 'Rashid Mahmood', role: 'Corporate Client User', quote: 'Finding a reliable advocate and staying updated on my case hearings was so stress-free using LegalHub.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80' }
            ].map((test, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#F9FAFB', padding: '28px', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', gap: '3px', marginBottom: '14px' }}>
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} size={16} fill="#C9A227" />
                    ))}
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.65, fontStyle: 'italic', marginBottom: '20px' }}>
                    "{test.quote}"
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                  <img
                    src={test.avatar}
                    alt={test.name}
                    style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-secondary)' }}>{test.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{test.role}</div>
                    {test.organization && (
                      <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600 }}>{test.organization}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

export default Home;
