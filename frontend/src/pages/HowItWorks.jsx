import { useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME } from '../config/brand';
import {
  SearchIcon,
  BriefcaseIcon,
  CourtIcon,
} from '../components/Icons';
import './HowItWorks.css';

export const HowItWorks = () => {
  const [activeTab, setActiveTab] = useState('citizen'); // 'citizen' or 'lawyer'

  return (
    <div className="how-page">
      {/* Hero Section */}
      <section className="how-hero">
        <div className="how-hero__container">
          <div className="how-badge">
            <CourtIcon size={16} color="var(--color-primary)" />
            <span>Operational Chamber Blueprint</span>
          </div>

          <h1>
            How {APP_NAME} <br />
            <span style={{ color: 'var(--color-primary)' }}>Works for You</span>
          </h1>

          <p>
            Whether you are a citizen seeking trusted legal counsel or an enrolled advocate managing a digital chamber, {APP_NAME} provides a structured, transparent, and legally compliant journey.
          </p>

          {/* Perspective Switcher Tabs */}
          <div className="how-tab-switcher" role="tablist">
            <button
              type="button"
              className={`how-tab-btn ${activeTab === 'citizen' ? 'how-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('citizen')}
              role="tab"
              aria-selected={activeTab === 'citizen'}
            >
              For Citizens &amp; Clients
            </button>
            <button
              type="button"
              className={`how-tab-btn ${activeTab === 'lawyer' ? 'how-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('lawyer')}
              role="tab"
              aria-selected={activeTab === 'lawyer'}
            >
              For Practicing Advocates
            </button>
          </div>
        </div>
      </section>

      {/* Steps Section: Citizen Journey */}
      {activeTab === 'citizen' && (
        <section className="how-steps-container">
          <div className="how-step-card">
            <div className="how-step-badge">
              <span>01</span>
            </div>
            <div className="how-step-content">
              <span className="how-step-tag">Step 1 • Discovery</span>
              <h3>Search Admin-Reviewed Advocates</h3>
              <p>
                Browse practicing advocates by your city (Lahore, Multan, Karachi, Islamabad, etc.), practice area (Family, Criminal, Civil, Corporate, Property), and court standing (Lower Courts, High Court, Supreme Court). Every advocate displays an <strong>Admin-Reviewed</strong> credential badge.
              </p>
            </div>
          </div>

          <div className="how-step-card">
            <div className="how-step-badge">
              <span>02</span>
            </div>
            <div className="how-step-content">
              <span className="how-step-tag">Step 2 • Scheduling</span>
              <h3>Book a Consultation with Transparent Rates</h3>
              <p>
                View the advocate&apos;s real-time open calendar slots. Select your preferred consultation format (In-Chamber meeting, Video call, or Phone advisory) with standardized published rates and complete a simulated sandbox test checkout.
              </p>
            </div>
          </div>

          <div className="how-step-card">
            <div className="how-step-badge">
              <span>03</span>
            </div>
            <div className="how-step-content">
              <span className="how-step-tag">Step 3 • Community Advisory</span>
              <h3>Ask in the Public Legal Q&amp;A Feed</h3>
              <p>
                Not ready to book yet? Post a preliminary legal question in our public Legal Q&amp;A Feed. Multiple enrolled advocates can review your question and provide legal opinions. You can evaluate their legal acumen and click &quot;Consult Advocate&quot; to hire them directly.
              </p>
            </div>
          </div>

          <div className="how-step-card">
            <div className="how-step-badge">
              <span>04</span>
            </div>
            <div className="how-step-content">
              <span className="how-step-tag">Step 4 • Connected Case Management</span>
              <h3>Follow Your Case Timeline &amp; Court Hearings</h3>
              <p>
                If you retain the advocate for formal representation, your digital case file tracks every procedural milestone. Receive updates on court hearing dates, access shared pleadings, and review chronological case diary entries (*Roznamcha*).
              </p>
            </div>
          </div>

          {/* Citizen CTA Banner */}
          <div className="how-cta-banner" style={{ borderRadius: 'var(--radius-xl)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'var(--font-weight-bold)', margin: '0 0 var(--spacing-2) 0' }}>
              Ready to find an Advocate for your legal matter?
            </h2>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', margin: '0 0 var(--spacing-4) 0' }}>
              Browse the neutral directory or post a question in the community feed today.
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/lawyers" className="btn btn-primary">
                <SearchIcon size={16} />
                <span>Find an Advocate</span>
              </Link>
              <Link to="/feed" className="btn btn-secondary">
                <span>Browse Legal Q&amp;A Feed</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Steps Section: Advocate Journey */}
      {activeTab === 'lawyer' && (
        <section className="how-steps-container">
          <div className="how-step-card">
            <div className="how-step-badge">
              <span>01</span>
            </div>
            <div className="how-step-content">
              <span className="how-step-tag">Step 1 • Onboarding</span>
              <h3>Submit Chamber &amp; Bar Council Credentials</h3>
              <p>
                Register as an Advocate and submit your Provincial Bar Council enrolment number, court standing level, chamber address, and practice areas. Your submission enters the administrative verification queue for review.
              </p>
            </div>
          </div>

          <div className="how-step-card">
            <div className="how-step-badge">
              <span>02</span>
            </div>
            <div className="how-step-content">
              <span className="how-step-tag">Step 2 • Chamber Setup</span>
              <h3>Configure Services &amp; Weekly Availability</h3>
              <p>
                Publish consultation services tailored to your practice (In-Chamber sessions, Video meetings, or Telephone advisory) along with your standard fee rates and weekly working hours.
              </p>
            </div>
          </div>

          <div className="how-step-card">
            <div className="how-step-badge">
              <span>03</span>
            </div>
            <div className="how-step-content">
              <span className="how-step-tag">Step 3 • Community Authority</span>
              <h3>Answer Citizen Inquiries on the Public Feed</h3>
              <p>
                Demonstrate your legal expertise by answering questions posted in the community Q&amp;A Feed. Your verified profile card appears alongside every legal answer with a direct booking button for interested citizens.
              </p>
            </div>
          </div>

          <div className="how-step-card">
            <div className="how-step-badge">
              <span>04</span>
            </div>
            <div className="how-step-content">
              <span className="how-step-tag">Step 4 • Digital Chamber Practice</span>
              <h3>Manage Case Diaries with AI Assistant</h3>
              <p>
                Record procedural pleadings in the chronological *Roznamcha* diary. When creating new entries, the integrated local AI assistant provides a non-blocking synopsis of previous hearings to accelerate drafting.
              </p>
            </div>
          </div>

          {/* Advocate CTA Banner */}
          <div className="how-cta-banner" style={{ borderRadius: 'var(--radius-xl)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'var(--font-weight-bold)', margin: '0 0 var(--spacing-2) 0' }}>
              Expand Your Legal Chamber with {APP_NAME}
            </h2>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', margin: '0 0 var(--spacing-4) 0' }}>
              Enrol today to receive appointments, track court cause lists, and collaborate with clients securely.
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register?role=lawyer" className="btn btn-primary">
                <BriefcaseIcon size={16} />
                <span>Apply for Chamber Enrollment</span>
              </Link>
              <Link to="/login" className="btn btn-secondary">
                <span>Advocate Login</span>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HowItWorks;
