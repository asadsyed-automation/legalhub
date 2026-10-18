import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { directoryApi } from '../api/directory.api';
import StatusBadge from '../components/StatusBadge';

export const LawyerProfile = () => {
  const { id } = useParams();
  const [lawyer, setLawyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchLawyer = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await directoryApi.getLawyerById(id);
      if (response && response.data && response.data.lawyer) {
        setLawyer(response.data.lawyer);
      } else {
        throw new Error('Lawyer profile not found');
      }
    } catch (error) {
      if (error.status === 404) {
        setErrorMessage(
          'This advocate profile is either unlisted, pending administrative verification, or does not exist.'
        );
      } else {
        setErrorMessage(error.message || 'Failed to load advocate profile');
      }
      setLawyer(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLawyer();
  }, [fetchLawyer]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-primary" style={{ width: '2.5rem', height: '2.5rem' }} />
        <p>Loading verified advocate profile...</p>
      </div>
    );
  }

  if (errorMessage || !lawyer) {
    return (
      <div className="page-container" style={{ maxWidth: '640px', textAlign: 'center', padding: 'var(--spacing-16) var(--spacing-4)' }}>
        <div className="card">
          <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-2)' }}>⚖️</div>
          <h2>Profile Unavailable</h2>
          <p style={{ marginTop: 'var(--spacing-2)', marginBottom: 'var(--spacing-6)' }}>
            {errorMessage || 'The requested advocate profile could not be retrieved.'}
          </p>
          <Link to="/lawyers" className="btn btn-primary">
            ← Return to Lawyer Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '860px' }}>
      {/* Back Link */}
      <div style={{ marginBottom: 'var(--spacing-4)' }}>
        <Link to="/lawyers" style={{ fontSize: 'var(--font-size-sm)', display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
          ← Back to All Lawyers
        </Link>
      </div>

      {/* Main Profile Card */}
      <div className="card" style={{ borderTop: '5px solid var(--color-primary)' }}>
        {/* Profile Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 'var(--spacing-4)',
            marginBottom: 'var(--spacing-6)',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: 'var(--spacing-6)',
          }}
        >
          <div style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
              }}
            >
              ⚖️
            </div>

            <div>
              <h1 style={{ fontSize: '1.875rem', marginBottom: '0.2rem', color: 'var(--color-text)' }}>
                {lawyer.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                  📍 {lawyer.city}, Pakistan
                </span>
                <span style={{ color: 'var(--color-border)' }}>•</span>
                <StatusBadge status="approved" label="Verified Advocate" />
              </div>
            </div>
          </div>
        </div>

        {/* Credentials Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--spacing-4)',
            marginBottom: 'var(--spacing-6)',
            padding: 'var(--spacing-4)',
            backgroundColor: 'var(--color-bg)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div>
            <span style={{ color: 'var(--color-text-subtle)', display: 'block', fontSize: 'var(--font-size-xs)' }}>
              Provincial Bar Council:
            </span>
            <strong style={{ fontSize: 'var(--font-size-sm)' }}>{lawyer.barCouncil}</strong>
          </div>

          <div>
            <span style={{ color: 'var(--color-text-subtle)', display: 'block', fontSize: 'var(--font-size-xs)' }}>
              Court Jurisdiction:
            </span>
            <strong style={{ fontSize: 'var(--font-size-sm)' }}>{lawyer.courtLevel}</strong>
          </div>

          <div>
            <span style={{ color: 'var(--color-text-subtle)', display: 'block', fontSize: 'var(--font-size-xs)' }}>
              Legal Experience:
            </span>
            <strong style={{ fontSize: 'var(--font-size-sm)' }}>{lawyer.experienceYears} Years of Practice</strong>
          </div>

          <div>
            <span style={{ color: 'var(--color-text-subtle)', display: 'block', fontSize: 'var(--font-size-xs)' }}>
              Scrutiny Status:
            </span>
            <span style={{ color: 'var(--color-success)', fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)' }}>
              ✓ Cleared by Court Admin
            </span>
          </div>
        </div>

        {/* Practice Areas */}
        <div style={{ marginBottom: 'var(--spacing-6)' }}>
          <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: 'var(--spacing-2)', color: 'var(--color-text)' }}>
            Specialized Practice Areas
          </h3>
          <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
            {lawyer.practiceAreas?.map((area) => (
              <span
                key={area}
                style={{
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  padding: '0.3rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                {area} Law
              </span>
            ))}
          </div>
        </div>

        {/* Professional Biography */}
        <div style={{ marginBottom: 'var(--spacing-6)' }}>
          <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: 'var(--spacing-2)', color: 'var(--color-text)' }}>
            Professional Biography
          </h3>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text)',
              lineHeight: 1.7,
              whiteSpace: 'pre-line',
            }}
          >
            {lawyer.bio}
          </p>
        </div>

        {/* Privacy Shield Notice */}
        <div
          style={{
            padding: 'var(--spacing-3) var(--spacing-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-surface-hover)',
            border: '1px solid var(--color-border)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-subtle)',
          }}
        >
          🔒 <strong>Privacy Shield Active:</strong> In accordance with Bar Council ethical standards and data protection rules, advocates&apos; personal email and internal license numbers are shielded from public crawlers.
        </div>
      </div>
    </div>
  );
};

export default LawyerProfile;
