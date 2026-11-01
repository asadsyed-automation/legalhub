import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { APP_NAME } from '../config/brand';
import {
  SearchIcon,
  ScalesIcon,
  CourtIcon,
  BriefcaseIcon,
  DocumentIcon,
  CalendarIcon,
  ShieldIcon,
  ChatIcon,
  CheckIcon,
  UsersIcon,
  ArrowRightIcon,
  SparklesIcon,
  LocationIcon,
} from '../components/Icons';
import { PRACTICE_AREAS, CITIES, COURT_LEVELS } from '../constants';
import './Home.css';

export const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [selectedPracticeArea, setSelectedPracticeArea] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCourtLevel, setSelectedCourtLevel] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedPracticeArea) params.set('practiceArea', selectedPracticeArea);
    if (selectedCity) params.set('city', selectedCity);
    if (selectedCourtLevel) params.set('courtLevel', selectedCourtLevel);
    navigate(`/lawyers?${params.toString()}`);
  };

  const handleQuickPill = (area, city = '') => {
    const params = new URLSearchParams();
    if (area) params.set('practiceArea', area);
    if (city) params.set('city', city);
    navigate(`/lawyers?${params.toString()}`);
  };

  // Sample community feed inquiries representing active legal advice
  const SAMPLE_FEED = [
    {
      id: 1,
      city: 'Multan',
      area: 'Property',
      title: 'Agricultural land inheritance mutation (Intiqal Wirasat) procedure in Multan',
      snippet: 'My late grandfather owned agricultural land in Tehsil Shujabad. The revenue staff is delaying the mutation citing missing Fard Malkiyat...',
      lawyer: 'Adv. Tariq Mehmood',
      court: 'Advocate High Court',
      answer: 'Under Section 42 of the Punjab Land Revenue Act 1967, obtain the computerised Fard directly from the Arazi Record Center (PLRA) Shujabad without field patwari delay.',
    },
    {
      id: 2,
      city: 'Lahore',
      area: 'Family',
      title: 'Child custody and maintenance jurisdiction under Family Courts Act 1964',
      snippet: 'My sister separated from her husband who lives in Faisalabad, but resides with her minor child in Model Town Lahore...',
      lawyer: 'Adv. Fatima Noor',
      court: 'Advocate High Court',
      answer: 'Under Section 17 of the Family Courts Act 1964 & Rule 6, a suit can be instituted where the wife or minor child currently resides. Lahore has full jurisdiction.',
    },
    {
      id: 3,
      city: 'Karachi',
      area: 'Criminal',
      title: 'Pre-arrest bail (Bail Before Arrest) criteria in commercial contract disputes',
      snippet: 'A commercial partner has lodged a fabricated FIR under Section 406/420 PPC at Saddar Police Station alleging breach of trust in goods...',
      lawyer: 'Adv. Zulfiqar Ali Bhutto Jr.',
      court: 'Advocate Supreme Court',
      answer: 'Under Section 498 CrPC, establish ulterior motive, malice, and show that the dispute is prima facie civil in nature to obtain ad-interim pre-arrest bail.',
    },
  ];

  return (
    <div className="home-page">
      {/* 1. Hero Section */}
      <section className="home-hero">
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div className="home-hero__badge">
            <ScalesIcon size={16} color="var(--color-primary)" />
            <span>Pakistan’s Sovereign Legal Access &amp; Digital Chamber Suite</span>
          </div>

          <h1 className="home-hero__title">
            Direct Access to <br />
            <span className="home-hero__title-accent">Admin-Reviewed Advocates</span> across Pakistan
          </h1>

          <p className="home-hero__subtitle">
            Discover verified legal practitioners enrolled with provincial Bar Councils, consult on transparent fee schedules, ask legal questions, and manage case hearing diaries through an unranked, merit-first platform.
          </p>

          {/* 3-Field Faceted Search Box */}
          <div className="home-search-box">
            <form onSubmit={handleSearchSubmit} className="home-search-form">
              <div className="home-search-field">
                <label htmlFor="hero-practice-area">Practice Discipline</label>
                <select
                  id="hero-practice-area"
                  value={selectedPracticeArea}
                  onChange={(e) => setSelectedPracticeArea(e.target.value)}
                >
                  <option value="">All Disciplines</option>
                  {PRACTICE_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area} Law
                    </option>
                  ))}
                </select>
              </div>

              <div className="home-search-field">
                <label htmlFor="hero-city">Station / City</label>
                <select
                  id="hero-city"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                >
                  <option value="">All Pakistan Cities</option>
                  {CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="home-search-field">
                <label htmlFor="hero-court">Judicial Tier</label>
                <select
                  id="hero-court"
                  value={selectedCourtLevel}
                  onChange={(e) => setSelectedCourtLevel(e.target.value)}
                >
                  <option value="">All Court Levels</option>
                  {COURT_LEVELS.map((court) => (
                    <option key={court} value={court}>
                      {court}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary home-search-btn">
                <SearchIcon size={16} />
                <span>Search Roster</span>
              </button>
            </form>
          </div>

          {/* Quick-Search Topic Pills */}
          <div className="home-pills-row">
            <span className="home-pills-label">Popular Searches:</span>
            <button
              type="button"
              className="home-pill"
              onClick={() => handleQuickPill('Property')}
            >
              🌾 Land Revenue &amp; Fard
            </button>
            <button
              type="button"
              className="home-pill"
              onClick={() => handleQuickPill('Family')}
            >
              👨‍👩‍👧 Family &amp; Khula
            </button>
            <button
              type="button"
              className="home-pill"
              onClick={() => handleQuickPill('Criminal')}
            >
              ⚖️ Bail Defense (497/498)
            </button>
            <button
              type="button"
              className="home-pill"
              onClick={() => handleQuickPill('Corporate')}
            >
              🏢 SECP &amp; Tax Advisory
            </button>
            <button
              type="button"
              className="home-pill"
              onClick={() => handleQuickPill('Consumer')}
            >
              🛒 Consumer Court Claims
            </button>
          </div>

          {/* Quick Action Links */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/lawyers" className="btn btn-primary" style={{ padding: '0.65rem 1.35rem' }}>
              <span>Browse Full Directory (120+ Advocates)</span>
            </Link>
            <Link to="/feed" className="btn btn-secondary" style={{ padding: '0.65rem 1.35rem' }}>
              <ChatIcon size={16} color="var(--color-primary)" />
              <span>Ask Free Legal Question</span>
            </Link>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '0.65rem 1.35rem' }}>
                <span>Access Dashboard ({user?.name})</span>
              </Link>
            ) : (
              <Link to="/register?role=lawyer" className="btn btn-secondary" style={{ padding: '0.65rem 1.35rem' }}>
                <BriefcaseIcon size={16} color="var(--color-primary)" />
                <span>Advocate Chamber Enrollment</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 2. Trust Metrics Strip */}
      <section className="home-stats-strip">
        <div className="home-stats-grid">
          <div className="home-stat-item">
            <div className="home-stat-num">120+</div>
            <div className="home-stat-label">Admin-Reviewed Advocates</div>
            <div className="home-stat-sub">Credentials verified against Bar records</div>
          </div>
          <div className="home-stat-item">
            <div className="home-stat-num">15</div>
            <div className="home-stat-label">Judicial Stations &amp; Benches</div>
            <div className="home-stat-sub">From Multan &amp; Lahore to Quetta &amp; Karachi</div>
          </div>
          <div className="home-stat-item">
            <div className="home-stat-num">5</div>
            <div className="home-stat-label">Statutory Bar Councils</div>
            <div className="home-stat-sub">Punjab, Sindh, KPK, Balochistan &amp; Islamabad</div>
          </div>
          <div className="home-stat-item">
            <div className="home-stat-num">100%</div>
            <div className="home-stat-label">Rule 135 Compliant</div>
            <div className="home-stat-sub">Unranked roster with zero paid advertising</div>
          </div>
        </div>
      </section>

      {/* 3. Community Legal Q&A Feed Highlight (Interactive Hook) */}
      <section className="home-feed-section">
        <div className="home-feed-container">
          <div className="home-section-header">
            <div className="home-section-tag">
              <SparklesIcon size={14} color="var(--color-primary)" />
              <span>Community Legal Q&amp;A Feed</span>
            </div>
            <h2 className="home-section-title">
              Legal Guidance from Enrolled Advocates
            </h2>
            <p className="home-section-subtitle">
              Post an enquiry regarding your legal issue in everyday language. Enrolled High Court and District Court advocates provide preliminary legal guidance in public view.
            </p>
          </div>

          <div className="home-feed-grid">
            {SAMPLE_FEED.map((item) => (
              <div key={item.id} className="home-feed-card">
                <div>
                  <div className="home-feed-card__meta">
                    <span className="badge badge-info">{item.city}</span>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                      {item.area} Law
                    </span>
                  </div>
                  <Link to="/feed" className="home-feed-card__title">
                    {item.title}
                  </Link>
                  <p className="home-feed-card__snippet">{item.snippet}</p>
                </div>

                <div className="home-feed-card__answer-box">
                  <div className="home-feed-card__lawyer-row">
                    <ShieldIcon size={14} color="#0F5C3C" />
                    <span>{item.lawyer}</span>
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
                      ({item.court})
                    </span>
                  </div>
                  <p className="home-feed-card__answer-text">
                    &ldquo;{item.answer}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/feed" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
              <span>View All Discussions on Q&amp;A Feed</span>
              <ArrowRightIcon size={16} />
            </Link>
            <Link to="/feed" className="btn btn-secondary" style={{ padding: '0.65rem 1.5rem' }}>
              <span>Ask Your Question Free</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Specialized Legal Practice Disciplines */}
      <section className="home-disciplines-section">
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="home-section-header">
            <div className="home-section-tag">
              <BriefcaseIcon size={14} color="var(--color-primary)" />
              <span>Practice Disciplines</span>
            </div>
            <h2 className="home-section-title">
              Comprehensive Legal Coverage Across Key Domains
            </h2>
            <p className="home-section-subtitle">
              Find advocates with specialized courtroom and advisory experience tailored to your exact statutory requirements.
            </p>
          </div>

          <div className="home-disciplines-grid">
            <Link to="/lawyers?practiceArea=Family" className="home-discipline-card">
              <div className="home-discipline-icon">
                <UsersIcon size={22} color="var(--color-primary)" />
              </div>
              <h3 className="home-discipline-title">Family &amp; Matrimonial</h3>
              <p className="home-discipline-desc">
                Khula decrees, child custody disputes under Guardian and Wards Act, recovery of dowry, and maintenance decrees.
              </p>
              <span className="home-discipline-link">
                <span>View Family Advocates</span>
                <ArrowRightIcon size={14} />
              </span>
            </Link>

            <Link to="/lawyers?practiceArea=Criminal" className="home-discipline-card">
              <div className="home-discipline-icon">
                <ScalesIcon size={22} color="var(--color-primary)" />
              </div>
              <h3 className="home-discipline-title">Criminal Defense</h3>
              <p className="home-discipline-desc">
                Pre-arrest &amp; post-arrest bail petitions (Sec 497/498 CrPC), trial defense, FIR quashment, and appellate appeals.
              </p>
              <span className="home-discipline-link">
                <span>View Criminal Counsel</span>
                <ArrowRightIcon size={14} />
              </span>
            </Link>

            <Link to="/lawyers?practiceArea=Property" className="home-discipline-card">
              <div className="home-discipline-icon">
                <LocationIcon size={22} color="var(--color-primary)" />
              </div>
              <h3 className="home-discipline-title">Land Revenue &amp; Property</h3>
              <p className="home-discipline-desc">
                Mutation (Intiqal) disputes, Fard verification, partition of agricultural land, stay injunctions, and title scrutiny.
              </p>
              <span className="home-discipline-link">
                <span>View Property Advocates</span>
                <ArrowRightIcon size={14} />
              </span>
            </Link>

            <Link to="/lawyers?practiceArea=Corporate" className="home-discipline-card">
              <div className="home-discipline-icon">
                <BriefcaseIcon size={22} color="var(--color-primary)" />
              </div>
              <h3 className="home-discipline-title">Corporate &amp; Commercial</h3>
              <p className="home-discipline-desc">
                SECP regulatory filings, commercial contract drafting, cross-border vendor agreements, and corporate structuring.
              </p>
              <span className="home-discipline-link">
                <span>View Corporate Counsel</span>
                <ArrowRightIcon size={14} />
              </span>
            </Link>

            <Link to="/lawyers?practiceArea=Constitutional" className="home-discipline-card">
              <div className="home-discipline-icon">
                <CourtIcon size={22} color="var(--color-primary)" />
              </div>
              <h3 className="home-discipline-title">Constitutional Writs</h3>
              <p className="home-discipline-desc">
                High Court Article 199 writ petitions, civil rights defense, judicial review of executive actions, and service matters.
              </p>
              <span className="home-discipline-link">
                <span>View High Court Counsel</span>
                <ArrowRightIcon size={14} />
              </span>
            </Link>

            <Link to="/lawyers?practiceArea=Tax" className="home-discipline-card">
              <div className="home-discipline-icon">
                <DocumentIcon size={22} color="var(--color-primary)" />
              </div>
              <h3 className="home-discipline-title">Taxation &amp; FBR</h3>
              <p className="home-discipline-desc">
                Direct and indirect taxes, sales tax tribunals, FBR show-cause notices, and appellate tax petitions.
              </p>
              <span className="home-discipline-link">
                <span>View Tax Specialists</span>
                <ArrowRightIcon size={14} />
              </span>
            </Link>

            <Link to="/lawyers?practiceArea=Banking" className="home-discipline-card">
              <div className="home-discipline-icon">
                <ShieldIcon size={22} color="var(--color-primary)" />
              </div>
              <h3 className="home-discipline-title">Banking &amp; Recovery</h3>
              <p className="home-discipline-desc">
                Banking Court proceedings under Financial Institutions Ordinance 2001, loan debt settlement, and mortgage defense.
              </p>
              <span className="home-discipline-link">
                <span>View Banking Advocates</span>
                <ArrowRightIcon size={14} />
              </span>
            </Link>

            <Link to="/lawyers?practiceArea=Consumer" className="home-discipline-card">
              <div className="home-discipline-icon">
                <CheckIcon size={22} color="var(--color-primary)" />
              </div>
              <h3 className="home-discipline-title">Consumer &amp; Labor</h3>
              <p className="home-discipline-desc">
                District Consumer Protection Court complaints, defective product claims, wrongful termination, and NIRC labor cases.
              </p>
              <span className="home-discipline-link">
                <span>View Consumer Counsel</span>
                <ArrowRightIcon size={14} />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Dual Value Proposition (Inspired by WakeelDesk Practice Management) */}
      <section className="home-dual-section">
        <div className="home-dual-grid">
          {/* Card for Citizens */}
          <div className="home-dual-card home-dual-card--primary">
            <div className="home-dual-card__header">
              <span className="home-dual-card__audience">For Citizens &amp; Litigants</span>
              <h3 className="home-dual-card__title">Transparent Legal Access</h3>
              <p className="home-dual-card__desc">
                Find the right advocate without navigating traditional touts, hidden fees, or biased referrals.
              </p>
            </div>

            <ul className="home-dual-card__features">
              <li className="home-dual-card__feature">
                <CheckIcon size={18} className="home-dual-card__feature-icon" />
                <span><strong>Unranked Directory:</strong> Sort advocates purely by experience or fee, free from sponsored advertising.</span>
              </li>
              <li className="home-dual-card__feature">
                <CheckIcon size={18} className="home-dual-card__feature-icon" />
                <span><strong>Fixed Consultation Rates:</strong> In-chamber, video, and audio consultation fees published openly.</span>
              </li>
              <li className="home-dual-card__feature">
                <CheckIcon size={18} className="home-dual-card__feature-icon" />
                <span><strong>Case Hearing Diary:</strong> Track formal case updates (*Roznamcha*) and next court hearing dates online.</span>
              </li>
              <li className="home-dual-card__feature">
                <CheckIcon size={18} className="home-dual-card__feature-icon" />
                <span><strong>Verified Credentials:</strong> Every advocate is scrutinized against provincial Bar Council registries.</span>
              </li>
            </ul>

            <Link to="/lawyers" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              <span>Search Advocate Roster</span>
            </Link>
          </div>

          {/* Card for Advocates */}
          <div className="home-dual-card home-dual-card--secondary">
            <div className="home-dual-card__header">
              <span className="home-dual-card__audience">For Legal Practitioners</span>
              <h3 className="home-dual-card__title">Digital Chamber Management</h3>
              <p className="home-dual-card__desc">
                Equip your chamber with contemporary practice management tools designed for Pakistan courts.
              </p>
            </div>

            <ul className="home-dual-card__features">
              <li className="home-dual-card__feature">
                <CheckIcon size={18} className="home-dual-card__feature-icon" />
                <span><strong>Digital Cause List &amp; Diary:</strong> Record daily courtroom proceedings and next adjournment dates.</span>
              </li>
              <li className="home-dual-card__feature">
                <CheckIcon size={18} className="home-dual-card__feature-icon" />
                <span><strong>Client Document Vault:</strong> Securely exchange petitions, case documents, and evidence sheets.</span>
              </li>
              <li className="home-dual-card__feature">
                <CheckIcon size={18} className="home-dual-card__feature-icon" />
                <span><strong>Calendar Availability:</strong> Define your consultation hours for in-chamber or virtual appointments.</span>
              </li>
              <li className="home-dual-card__feature">
                <CheckIcon size={18} className="home-dual-card__feature-icon" />
                <span><strong>Fee Agreements:</strong> Issue formal retainer milestones and transparent fee schedules without friction.</span>
              </li>
            </ul>

            <Link to="/register?role=lawyer" className="btn btn-secondary" style={{ alignSelf: 'flex-start', borderColor: '#2563EB', color: '#2563EB' }}>
              <span>Apply for Chamber Enrollment</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. 4-Step Citizen & Advocate Journey */}
      <section className="home-steps-section">
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="home-section-header">
            <div className="home-section-tag">
              <CalendarIcon size={14} color="var(--color-primary)" />
              <span>Procedural Journey</span>
            </div>
            <h2 className="home-section-title">How {APP_NAME} Operates</h2>
            <p className="home-section-subtitle">
              A straightforward, transparent process connecting citizens with advocates from initial consultation through case resolution.
            </p>
          </div>

          <div className="home-steps-grid">
            <div className="home-step-card">
              <div className="home-step-number">1</div>
              <h3 className="home-step-title">Discover or Enquire</h3>
              <p className="home-step-desc">
                Browse our directory filtered by city, court tier, and practice area, or post a question on the Community Q&amp;A Feed.
              </p>
            </div>

            <div className="home-step-card">
              <div className="home-step-number">2</div>
              <h3 className="home-step-title">Schedule Consultation</h3>
              <p className="home-step-desc">
                Select an open slot for an in-chamber meeting, video conference, or telephone consultation with transparent fees.
              </p>
            </div>

            <div className="home-step-card">
              <div className="home-step-number">3</div>
              <h3 className="home-step-title">Formalize Retainer</h3>
              <p className="home-step-desc">
                Establish a clear legal engagement with documented scope, agreed retainer milestones, and secure communications.
              </p>
            </div>

            <div className="home-step-card">
              <div className="home-step-number">4</div>
              <h3 className="home-step-title">Track Case Diary</h3>
              <p className="home-step-desc">
                Follow court hearing dates, interim order updates, and case document filings via your private digital portal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Institutional Compliance & Academic Disclosures */}
      <section style={{ padding: '0 1.5rem' }}>
        <div className="home-compliance-banner">
          <CourtIcon size={22} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Regulatory Compliance &amp; Institutional Governance:</strong> {APP_NAME} strictly adheres to Rule 135 of the Legal Practitioners and Bar Councils Rules 1976 prohibiting commercial touting or paid priority listings. All advocate profiles display admin-reviewed status based on submitted Bar Council certificates without statutory endorsement. Developed as an academic Final Year Project for BS Computer Science at <strong>Emerson University Multan</strong>.
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
