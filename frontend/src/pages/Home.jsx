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
} from '../components/Icons';
import { PRACTICE_AREAS, CITIES } from '../constants';

export const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [selectedPracticeArea, setSelectedPracticeArea] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedPracticeArea) params.set('practiceArea', selectedPracticeArea);
    if (selectedCity) params.set('city', selectedCity);
    navigate(`/lawyers?${params.toString()}`);
  };

  return (
    <div>
      {/* Honest Hero Section */}
      <section
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, var(--color-bg) 100%)',
          borderBottom: '1px solid var(--color-border)',
          padding: 'var(--spacing-12) var(--spacing-4) var(--spacing-16) var(--spacing-4)',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              padding: '0.4rem 1rem',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--spacing-4)',
              border: '1px solid var(--color-border)',
            }}
          >
            <ScalesIcon size={16} color="var(--color-primary)" />
            <span>Digital Chamber Access &amp; Case Procedural Registry</span>
          </div>

          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text)',
              lineHeight: 1.2,
              marginBottom: 'var(--spacing-4)',
              letterSpacing: '-0.02em',
            }}
          >
            Connect Directly with <br />
            <span style={{ color: 'var(--color-primary)' }}>Practicing Advocates</span> in Pakistan
          </h1>

          <p
            style={{
              fontSize: 'var(--font-size-base)',
              color: 'var(--color-text-muted)',
              marginBottom: 'var(--spacing-8)',
              lineHeight: 1.65,
              maxWidth: '680px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Schedule consultations with enrolled High Court and District Court advocates across Lahore, Multan, Karachi, Islamabad, and nationwide stations. Review transparent chamber fee schedules and manage procedural case records.
          </p>

          {/* Practice Area & City Picker */}
          <div
            style={{
              maxWidth: '720px',
              margin: '0 auto var(--spacing-6) auto',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-4)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            }}
          >
            <form
              onSubmit={handleSearchSubmit}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr auto',
                gap: 'var(--spacing-3)',
                alignItems: 'center',
              }}
            >
              <div>
                <label
                  htmlFor="hero-practice-area"
                  style={{
                    display: 'block',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-muted)',
                    marginBottom: 'var(--spacing-1)',
                  }}
                >
                  Practice Area
                </label>
                <select
                  id="hero-practice-area"
                  value={selectedPracticeArea}
                  onChange={(e) => setSelectedPracticeArea(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-2) var(--spacing-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: 'var(--font-size-sm)',
                    backgroundColor: 'var(--color-bg)',
                    color: 'var(--color-text)',
                  }}
                >
                  <option value="">All Practice Areas</option>
                  {PRACTICE_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area} Law
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="hero-city"
                  style={{
                    display: 'block',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-muted)',
                    marginBottom: 'var(--spacing-1)',
                  }}
                >
                  City / Station
                </label>
                <select
                  id="hero-city"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-2) var(--spacing-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: 'var(--font-size-sm)',
                    backgroundColor: 'var(--color-bg)',
                    color: 'var(--color-text)',
                  }}
                >
                  <option value="">All Cities in Pakistan</option>
                  {CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ alignSelf: 'flex-end' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '0.6rem 1.25rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-2)',
                    whiteSpace: 'nowrap',
                    width: '100%',
                    justifyContent: 'center',
                  }}
                >
                  <SearchIcon size={16} />
                  <span>Search Advocates</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Action Links */}
          <div style={{ display: 'flex', gap: 'var(--spacing-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/lawyers" className="btn btn-secondary btn-sm">
              <span>View Full Directory</span>
            </Link>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-secondary btn-sm">
                <span>Go to Dashboard ({user?.name})</span>
              </Link>
            ) : (
              <Link to="/register?role=lawyer" className="btn btn-secondary btn-sm">
                <span>Advocate Chamber Registration</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 3-Step Citizen Guide */}
      <section className="page-container" style={{ padding: 'var(--spacing-16) var(--spacing-4)' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto var(--spacing-10) auto' }}>
          <h2 style={{ marginBottom: 'var(--spacing-2)', fontSize: '1.875rem', fontWeight: 'var(--font-weight-bold)' }}>
            How {APP_NAME} Works
          </h2>
          <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>
            Three simple procedural steps to discover legal counsel, book verified consultations, and follow case milestones.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--spacing-6)',
          }}
        >
          {/* Step 1 */}
          <div className="card" style={{ padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SearchIcon size={20} />
            </div>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', margin: 0 }}>
              1. Find an Advocate
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', lineHeight: 1.65, margin: 0 }}>
              Browse practicing advocates enrolled with provincial Bar Councils. Filter by practice area (Criminal, Civil, Family, Corporate) and court level without commercial advertising distortion.
            </p>
          </div>

          {/* Step 2 */}
          <div className="card" style={{ padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CalendarIcon size={20} />
            </div>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', margin: 0 }}>
              2. Request a Consultation
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', lineHeight: 1.65, margin: 0 }}>
              Review transparent consultation rates for in-chamber, video, or telephone meetings. Reserve open calendar slots with simulated sandbox test checkouts.
            </p>
          </div>

          {/* Step 3 */}
          <div className="card" style={{ padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DocumentIcon size={20} />
            </div>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', margin: 0 }}>
              3. Follow Your Case
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', lineHeight: 1.65, margin: 0 }}>
              Once engaged, track formal case records, procedural diary entries (*Roznamcha*), and upcoming court hearing dates directly through your private client portal.
            </p>
          </div>
        </div>
      </section>

      {/* For Lawyers Call-to-Action */}
      <section
        style={{
          backgroundColor: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)',
          padding: 'var(--spacing-12) var(--spacing-4)',
        }}
      >
        <div
          style={{
            maxWidth: '860px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--spacing-6)',
          }}
        >
          <div style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
              <BriefcaseIcon size={20} color="var(--color-primary)" />
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-primary)' }}>
                For Legal Practitioners
              </span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'var(--font-weight-bold)', margin: '0 0 var(--spacing-2) 0' }}>
              Are you an Advocate practicing in Pakistan?
            </h2>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
              Enroll your chamber on {APP_NAME}. Submit your provincial Bar Council enrolment credentials for administrative scrutiny to accept consultations, manage digital case diaries, and communicate with clients securely.
            </p>
          </div>

          <div>
            <Link to="/register?role=lawyer" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
              <span>Apply for Chamber Enrollment</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Regulatory & Institutional Banner */}
      <section className="page-container" style={{ padding: 'var(--spacing-8) var(--spacing-4)' }}>
        <div
          style={{
            padding: 'var(--spacing-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--spacing-3)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-subtle)',
            lineHeight: 1.6,
          }}
        >
          <CourtIcon size={20} color="var(--color-text-subtle)" />
          <div>
            <strong>Bar Council Rule 135 &amp; Academic Transparency:</strong> {APP_NAME} operates as an unranked directory and chamber management tool developed as a Final Year Project at Emerson University Multan. Advocate profiles are Admin-Reviewed based on submitted credentials and are not statutory Bar Council endorsements. Transactions operate in an academic sandbox without real money.
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
