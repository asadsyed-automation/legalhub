import { Link } from 'react-router-dom';
import { APP_NAME, PROJECT_METADATA } from '../config/brand';
import {
  ScalesIcon,
  ShieldIcon,
  CourtIcon,
  BriefcaseIcon,
  DocumentIcon,
  UsersIcon,
  SearchIcon,
} from '../components/Icons';
import './About.css';

export const About = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero__container">
          <div className="about-badge">
            <ScalesIcon size={16} color="var(--color-primary)" />
            <span>Academic Final Year Project • Emerson University Multan</span>
          </div>

          <h1>
            Democratizing Legal Access <br />
            <span style={{ color: 'var(--color-primary)' }}>Across Pakistan</span>
          </h1>

          <p>
            {APP_NAME} is an academic digital chamber access and procedural case tracking platform. We connect citizens with enrolled, admin-reviewed advocates across Pakistan with transparent consultation schedules, digital case diaries, and absolute regulatory integrity.
          </p>

          <div style={{ display: 'flex', gap: 'var(--spacing-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/lawyers" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem' }}>
              <SearchIcon size={18} />
              <span>Explore Verified Advocates</span>
            </Link>
            <Link to="/how-it-works" className="btn btn-secondary" style={{ padding: '0.75rem 1.75rem' }}>
              <span>How It Works</span>
            </Link>
          </div>
        </div>
      </section>

      {/* The Challenge & Our Purpose */}
      <section className="about-section">
        <div className="about-section-header">
          <h2>The Problem We Address</h2>
          <p>
            Traditional legal discovery in Pakistan often relies on informal word-of-mouth recommendations without verifiable fee schedules, court standing verification, or structured procedural tracking.
          </p>
        </div>

        <div className="about-pillars-grid">
          <div className="about-pillar-card">
            <div className="about-pillar-icon">
              <ShieldIcon size={22} />
            </div>
            <h3>1. Admin-Reviewed Scrutiny</h3>
            <p>
              Unlike unverified classifieds, every advocate profile on {APP_NAME} undergoes administrative scrutiny of their submitted Provincial Bar Council enrolment card, court level, and chamber address before directory inclusion.
            </p>
          </div>

          <div className="about-pillar-card">
            <div className="about-pillar-icon">
              <BriefcaseIcon size={22} />
            </div>
            <h3>2. Transparent Chamber Fees</h3>
            <p>
              Advocates publish structured fee schedules for In-Chamber meetings, Video consultations, and Telephone advisories. Citizens review exact rates prior to scheduling without hidden costs.
            </p>
          </div>

          <div className="about-pillar-card">
            <div className="about-pillar-icon">
              <DocumentIcon size={22} />
            </div>
            <h3>3. Connected Case Diary (*Roznamcha*)</h3>
            <p>
              Once engaged, clients and advocates collaborate through private digital case files with chronological procedural entries, court hearing cause lists, and secure document vaults.
            </p>
          </div>

          <div className="about-pillar-card">
            <div className="about-pillar-icon">
              <CourtIcon size={22} />
            </div>
            <h3>4. Strict Rule 135 Compliance</h3>
            <p>
              Under Rule 135 of the Legal Practitioners and Bar Councils Rules 1976, Pakistani advocates are prohibited from commercial solicitation. {APP_NAME} operates purely as a neutral, unranked directory with zero paid priority placement.
            </p>
          </div>
        </div>
      </section>

      {/* Academic Attribution & Institution Section */}
      <section className="about-section" style={{ paddingTop: 0 }}>
        <div className="about-academic-box">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto var(--spacing-6) auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)', color: 'var(--color-primary)', marginBottom: 'var(--spacing-2)' }}>
              <UsersIcon size={20} />
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Academic Project Profile
              </span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)', margin: '0 0 var(--spacing-2) 0' }}>
              {PROJECT_METADATA.institution}
            </h2>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.6 }}>
              This platform was conceptualized, architected, and built as the Final Year Project (FYP) for the Bachelor of Science in Computer Science (BS CS) degree program at Emerson University Multan.
            </p>
          </div>

          <div className="about-team-grid">
            {PROJECT_METADATA.developers.map((dev) => (
              <div key={dev.name} className="about-team-card">
                <h4>{dev.name}</h4>
                <span>{dev.role}</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  BS Computer Science • FYP 2026
                </p>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 'var(--spacing-6)',
              paddingTop: 'var(--spacing-4)',
              borderTop: '1px solid var(--color-border)',
              textAlign: 'center',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-subtle)',
            }}
          >
            Supervised by the Faculty of Computing &amp; Information Technology, {PROJECT_METADATA.institution}, Multan, Pakistan.
          </div>
        </div>
      </section>

      {/* Strong Call to Action */}
      <section className="about-cta-band">
        <div className="about-cta-container">
          <h2 style={{ fontSize: '1.875rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)', margin: 0 }}>
            Join the Modern Legal Ecosystem in Pakistan
          </h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.6 }}>
            Whether you are a citizen needing consultation or a licensed advocate expanding your chamber, {APP_NAME} provides the transparent, secure digital gateway.
          </p>

          <div style={{ display: 'flex', gap: 'var(--spacing-4)', justifyContent: 'center', flexWrap: 'wrap', marginTop: 'var(--spacing-2)' }}>
            <Link to="/lawyers" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem' }}>
              <SearchIcon size={18} />
              <span>Find an Advocate</span>
            </Link>
            <Link to="/register?role=lawyer" className="btn btn-secondary" style={{ padding: '0.75rem 1.75rem' }}>
              <BriefcaseIcon size={18} />
              <span>Chamber Enrollment</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;

