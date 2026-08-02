import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';

const fadeUp = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 } };

const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const ScaleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/>
  </svg>
);

const CpuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>
  </svg>
);

const TargetIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);

function About() {
  return (
    <div style={{ fontFamily: 'var(--font-body)', backgroundColor: '#FFFFFF', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNavbar />

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #072E1E 0%, #0F5C3C 60%, #051F14 100%)',
        color: '#FFFFFF', padding: '75px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        <motion.div variants={fadeUp} initial="initial" animate="animate" transition={{ duration: 0.4 }} style={{ maxWidth: '800px', margin: '0 auto' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
            padding: '5px 14px', borderRadius: '9999px', backgroundColor: 'rgba(201,162,39,0.18)',
            color: '#C9A227', border: '1px solid rgba(201,162,39,0.3)', marginBottom: '18px'
          }}>
            <img src="https://flagcdn.com/w40/pk.png" alt="Pakistan Flag" style={{ width: '16px', height: '11px', borderRadius: '2px', objectFit: 'cover' }} />
            Enterprise Digital Legal Infrastructure
          </span>

          <h1 style={{ fontSize: 'clamp(32px, 4.5vw, 50px)', fontWeight: 800, marginBottom: '18px', fontFamily: 'var(--font-heading)', color: '#FFFFFF' }}>
            Empowering Pakistan's Legal Community
          </h1>
          <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.85)', maxWidth: '640px', margin: '0 auto', lineHeight: 1.65 }}>
            LegalHub provides state-of-the-art case management, cause list tracking, document vaulting, and verified advocate matching for lawyers, law firms, and citizens across Pakistan.
          </p>
        </motion.div>
      </section>

      {/* Platform Story & Mission */}
      <section style={{ padding: '80px 24px', maxWidth: '960px', margin: '0 auto' }}>
        <motion.div variants={fadeUp} initial="initial" whileInView="animate" viewport={{ once: true }} transition={{ duration: 0.4 }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Platform Overview
          </span>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-secondary)', margin: '8px 0 20px', fontFamily: 'var(--font-heading)' }}>
            Purpose-Built For Pakistani Legal Practice
          </h2>
          <p style={{ fontSize: '15.5px', lineHeight: 1.8, color: 'var(--color-text-secondary)', marginBottom: '18px' }}>
            LegalHub was engineered to eliminate paper-heavy workflows, untracked court cause list dates, and fragmented client communications across Pakistan's District, High Court, and Supreme Court jurisdictions.
          </p>
          <p style={{ fontSize: '15.5px', lineHeight: 1.8, color: 'var(--color-text-secondary)', marginBottom: '18px' }}>
            Our platform provides end-to-end case tracking, real-time cause list notifications, Cloudinary-backed evidence storage, automated retainer fee invoicing, and AI-driven petition precedent research.
          </p>
          <p style={{ fontSize: '15.5px', lineHeight: 1.8, color: 'var(--color-text-secondary)' }}>
            For citizens, LegalHub offers a transparent Marketplace to discover top verified advocates by specialization, city, court, and fee structures with authentic client reviews.
          </p>
        </motion.div>
      </section>

      {/* Architecture Highlights */}
      <section style={{ padding: '75px 24px', backgroundColor: '#F9FAFB', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Core Architecture
            </span>
            <h2 style={{ fontSize: '30px', fontWeight: 800, color: 'var(--color-secondary)', margin: '8px 0 0', fontFamily: 'var(--font-heading)' }}>
              Built On Modern SaaS Standards
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {[
              { icon: <ShieldIcon />, title: '256-Bit SSL Security', desc: 'Bank-grade encryption protecting all confidential case notes, power of attorney, and client files.' },
              { icon: <ScaleIcon />, title: 'High Court Compliance', desc: 'Workflow structures aligned with High Court Bar Association cause list procedures.' },
              { icon: <CpuIcon />, title: 'AI Precedent Engine', desc: 'Automated legal research summaries matched against Pakistan Law Decisions (PLD).' },
              { icon: <TargetIcon />, title: 'Verified Marketplace', desc: 'Rigorous admin verification for advocate profiles, specialized gigs, and consultation booking.' }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4, borderColor: 'var(--color-primary)', boxShadow: '0 0 0 2px var(--color-primary), 0 8px 20px rgba(15,92,60,0.1)' }}
                style={{
                  backgroundColor: '#FFFFFF', padding: '28px 22px', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)', transition: 'all 0.2s ease'
                }}
              >
                <div style={{ color: 'var(--color-primary)', marginBottom: '14px' }}>{item.icon}</div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-secondary)', margin: '0 0 8px', fontFamily: 'var(--font-heading)' }}>{item.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '75px 24px', backgroundColor: '#FFFFFF', textAlign: 'center' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-secondary)', margin: '0 0 16px', fontFamily: 'var(--font-heading)' }}>
            Ready to Modernize Your Law Practice?
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', marginBottom: '28px' }}>
            Join hundreds of advocates across Pakistan already managing their legal workspace on LegalHub.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
            <Link to="/register" style={{
              backgroundColor: 'var(--color-primary)', color: '#FFF', textDecoration: 'none',
              fontWeight: 700, fontSize: '15px', padding: '12px 28px', borderRadius: 'var(--radius-sm)',
              boxShadow: '0 4px 14px rgba(15,92,60,0.25)'
            }}>
              Get Started Free →
            </Link>
            <Link to="/contact" style={{
              backgroundColor: '#F3F4F6', color: 'var(--color-secondary)', textDecoration: 'none',
              fontWeight: 600, fontSize: '15px', padding: '12px 24px', borderRadius: 'var(--radius-sm)'
            }}>
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

export default About;
