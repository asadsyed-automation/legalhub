import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { lawyerApi } from '../api/lawyer.api';
import FormField from '../components/FormField';
import StatusChip from '../components/StatusChip';
import { ShieldIcon, ClockIcon, CheckIcon } from '../components/Icons';
import {
  BAR_COUNCILS,
  COURT_LEVELS,
  CITIES,
  PRACTICE_AREAS,
  APPLICATION_STATUS,
} from '../constants';

export const LawyerApplication = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    barCouncil: BAR_COUNCILS[0],
    enrolmentNo: '',
    city: CITIES[0],
    courtLevel: COURT_LEVELS[0],
    practiceAreas: ['Civil'],
    experienceYears: 1,
    chamberAddress: '',
    bio: '',
  });

  const [generalError, setGeneralError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch current advocate application
  const fetchApplication = useCallback(async () => {
    setLoading(true);
    setGeneralError(null);
    try {
      const response = await lawyerApi.getApplication();
      const app = response?.application || response?.data?.application;
      if (app) {
        setApplication(app);
        // Pre-populate form in case of re-submission
        setFormData({
          barCouncil: app.barCouncil || BAR_COUNCILS[0],
          enrolmentNo: app.enrolmentNo || '',
          city: app.city || CITIES[0],
          courtLevel: app.courtLevel || COURT_LEVELS[0],
          practiceAreas: app.practiceAreas || ['Civil'],
          experienceYears: app.experienceYears ?? 1,
          chamberAddress: app.chamberAddress || '',
          bio: app.bio || '',
        });
        if (app.status === APPLICATION_STATUS.REJECTED) {
          setIsEditing(true);
        }
      }
    } catch (error) {
      if (error.status === 404) {
        // No application submitted yet -> Normal state for new advocate
        setApplication(null);
      } else {
        setGeneralError(error.message || 'Failed to load application status');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'experienceYears' ? parseInt(value, 10) || 0 : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handlePracticeAreaToggle = (area) => {
    setFormData((prev) => {
      const exists = prev.practiceAreas.includes(area);
      let updated;
      if (exists) {
        // Must maintain at least 1 practice area
        if (prev.practiceAreas.length === 1) return prev;
        updated = prev.practiceAreas.filter((item) => item !== area);
      } else {
        // Max 5 practice areas allowed by backend schema
        if (prev.practiceAreas.length >= 5) return prev;
        updated = [...prev.practiceAreas, area];
      }
      return { ...prev, practiceAreas: updated };
    });
    if (fieldErrors.practiceAreas) {
      setFieldErrors((prev) => ({ ...prev, practiceAreas: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setGeneralError(null);
    setFieldErrors({});
    setSuccessMessage(null);

    try {
      const payload = {
        barCouncil: formData.barCouncil,
        enrolmentNo: formData.enrolmentNo.trim(),
        city: formData.city,
        courtLevel: formData.courtLevel,
        practiceAreas: formData.practiceAreas,
        experienceYears: Number(formData.experienceYears),
        chamberAddress: formData.chamberAddress.trim(),
        bio: formData.bio.trim(),
      };

      let response;
      if (application && application.status === APPLICATION_STATUS.REJECTED) {
        // Re-submission lifecycle (PUT)
        response = await lawyerApi.updateApplication(payload);
        setSuccessMessage('Application successfully updated and re-submitted for review!');
      } else {
        // Initial submission lifecycle (POST)
        response = await lawyerApi.submitApplication(payload);
        setSuccessMessage('Application submitted successfully! Your credentials are now under review.');
      }

      const updatedApp = response?.application || response?.data?.application;
      if (updatedApp) {
        setApplication(updatedApp);
      }
      setIsEditing(false);
    } catch (error) {
      setGeneralError(error.message || 'Failed to submit application');
      if (Array.isArray(error.details)) {
        const errorMap = {};
        error.details.forEach((err) => {
          if (err.field) errorMap[err.field] = err.message;
        });
        setFieldErrors(errorMap);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-primary" style={{ width: '2.5rem', height: '2.5rem' }} />
        <p>Loading your advocate credentials and review status...</p>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
          <h1>Advocate Licensing Portal</h1>
          {application && <StatusChip status={application.status} />}
        </div>
        <p>Manage your provincial Bar Council credentials and public marketplace visibility.</p>
      </div>

      {successMessage && (
        <div className="alert alert-success" role="alert">
          <strong>Success:</strong> {successMessage}
        </div>
      )}

      {generalError && (
        <div className="alert alert-danger" role="alert">
          <strong>Notice:</strong> {generalError}
        </div>
      )}

      {/* Case 1: Application already exists and not currently editing */}
      {application && !isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          {/* Status Banners */}
          {application.status === APPLICATION_STATUS.PENDING && (
            <div className="alert alert-warning">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <ClockIcon size={16} color="var(--color-warning)" />
                <strong>Application Under Administrative Scrutiny</strong>
              </div>
              <span>
                Your enrollment details have been received and are currently queued for verification by the Court
                Administrator. Your profile will be automatically published to the public directory upon approval.
              </span>
            </div>
          )}

          {application.status === APPLICATION_STATUS.APPROVED && (
            <div className="alert alert-success">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <CheckIcon size={16} color="var(--color-success)" />
                <strong>Enrolled Advocate Profile Live</strong>
              </div>
              <span>
                Your licensing credentials have been reviewed. Your profile is live in the public lawyer
                directory.
              </span>
              <div style={{ marginTop: 'var(--spacing-3)' }}>
                <Link to={`/lawyers/${application.userId}`} className="btn btn-primary btn-sm">
                  View My Public Profile Card
                </Link>
              </div>
            </div>
          )}

          {application.status === APPLICATION_STATUS.REJECTED && (
            <div className="alert alert-danger">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldIcon size={16} color="var(--color-danger)" />
                <strong>Action Required: Application Rejected</strong>
              </div>
              <div style={{ marginTop: 'var(--spacing-2)', fontStyle: 'italic' }}>
                Administrative Review Reason: &ldquo;{application.rejectionReason}&rdquo;
              </div>
              <div style={{ marginTop: 'var(--spacing-3)' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="btn btn-danger btn-sm"
                >
                  Edit &amp; Re-submit Application
                </button>
              </div>
            </div>
          )}

          {/* Read-Only Details Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-3)' }}>
              <h3>Registered Bar Council Information</h3>
              {application.status === APPLICATION_STATUS.REJECTED && (
                <button onClick={() => setIsEditing(true)} className="btn btn-secondary btn-sm">
                  Edit Details
                </button>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 'var(--spacing-4)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              <div>
                <span style={{ color: 'var(--color-text-subtle)', display: 'block' }}>Bar Council:</span>
                <strong>{application.barCouncil}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-subtle)', display: 'block' }}>Enrolment License #:</span>
                <code>{application.enrolmentNo}</code>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-subtle)', display: 'block' }}>Practicing City:</span>
                <strong>{application.city}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-subtle)', display: 'block' }}>Court Jurisdiction:</span>
                <strong>{application.courtLevel}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-subtle)', display: 'block' }}>Experience:</span>
                <strong>{application.experienceYears} Years</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-subtle)', display: 'block' }}>Verification Status:</span>
                <StatusBadge status={application.status} />
              </div>
            </div>

            <div style={{ marginTop: 'var(--spacing-4)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-3)' }}>
              <span style={{ color: 'var(--color-text-subtle)', display: 'block', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-1)' }}>
                Practice Areas:
              </span>
              <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
                {application.practiceAreas?.map((area) => (
                  <span
                    key={area}
                    style={{
                      backgroundColor: 'var(--color-primary-light)',
                      color: 'var(--color-primary)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-medium)',
                    }}
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 'var(--spacing-4)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-3)' }}>
              <span style={{ color: 'var(--color-text-subtle)', display: 'block', fontSize: 'var(--font-size-sm)' }}>
                Chamber Address:
              </span>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
                {application.chamberAddress}
              </p>
            </div>

            <div style={{ marginTop: 'var(--spacing-4)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-3)' }}>
              <span style={{ color: 'var(--color-text-subtle)', display: 'block', fontSize: 'var(--font-size-sm)' }}>
                Professional Biography:
              </span>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text)', whiteSpace: 'pre-line' }}>
                {application.bio}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Case 2: New Application Form OR Editing a Rejected Application */
        <div className="card">
          <div style={{ marginBottom: 'var(--spacing-6)' }}>
            <h2>
              {application?.status === APPLICATION_STATUS.REJECTED
                ? 'Correct & Re-submit Application'
                : 'Submit Bar Council Verification Petition'}
            </h2>
            <p>
              Please enter your official legal licensing information exactly as it appears on your Bar Council ID card.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--spacing-4)' }}>
              <FormField
                label="Provincial Bar Council"
                id="barCouncil"
                type="select"
                value={formData.barCouncil}
                onChange={handleChange}
                options={BAR_COUNCILS}
                required
                disabled={submitting}
                error={fieldErrors.barCouncil}
              />

              <FormField
                label="Enrolment License Number"
                id="enrolmentNo"
                type="text"
                value={formData.enrolmentNo}
                onChange={handleChange}
                placeholder="e.g. LHC-2024-9871"
                required
                disabled={submitting}
                helpText="Must be unique under your selected Bar Council."
                error={fieldErrors.enrolmentNo}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--spacing-4)' }}>
              <FormField
                label="Practicing City"
                id="city"
                type="select"
                value={formData.city}
                onChange={handleChange}
                options={CITIES}
                required
                disabled={submitting}
                error={fieldErrors.city}
              />

              <FormField
                label="Court Jurisdiction"
                id="courtLevel"
                type="select"
                value={formData.courtLevel}
                onChange={handleChange}
                options={COURT_LEVELS}
                required
                disabled={submitting}
                error={fieldErrors.courtLevel}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--spacing-4)' }}>
              <FormField
                label="Years of Legal Experience"
                id="experienceYears"
                type="number"
                value={formData.experienceYears}
                onChange={handleChange}
                required
                disabled={submitting}
                helpText="Enter total years of active practice (0 to 60)."
                error={fieldErrors.experienceYears}
              />

              <FormField
                label="Chamber / Office Address"
                id="chamberAddress"
                type="text"
                value={formData.chamberAddress}
                onChange={handleChange}
                placeholder="Chamber 402, High Court Bar Association"
                required
                disabled={submitting}
                helpText="Kept private from public search engines."
                error={fieldErrors.chamberAddress}
              />
            </div>

            {/* Practice Areas Multi-Select Box */}
            <div style={{ marginBottom: 'var(--spacing-4)' }}>
              <label
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  marginBottom: 'var(--spacing-2)',
                }}
              >
                <span>
                  Legal Practice Areas <span style={{ color: 'var(--color-danger)' }}>*</span>
                </span>
                <span style={{ color: 'var(--color-text-subtle)', fontSize: 'var(--font-size-xs)' }}>
                  Selected: {formData.practiceAreas.length} / 5 (Min 1, Max 5)
                </span>
              </label>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: 'var(--spacing-2)',
                  padding: 'var(--spacing-3)',
                  backgroundColor: 'var(--color-surface-hover)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${fieldErrors.practiceAreas ? 'var(--color-border-error)' : 'var(--color-border)'}`,
                }}
              >
                {PRACTICE_AREAS.map((area) => {
                  const isChecked = formData.practiceAreas.includes(area);
                  return (
                    <label
                      key={area}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-2)',
                        fontSize: 'var(--font-size-xs)',
                        cursor: 'pointer',
                        padding: 'var(--spacing-1)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handlePracticeAreaToggle(area)}
                        disabled={submitting}
                      />
                      <span>{area}</span>
                    </label>
                  );
                })}
              </div>

              {fieldErrors.practiceAreas && (
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)', marginTop: 'var(--spacing-1)', display: 'block' }}>
                  {fieldErrors.practiceAreas}
                </span>
              )}
            </div>

            <FormField
              label="Professional Biography"
              id="bio"
              type="textarea"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Describe your legal focus, notable cases, education, and services offered to clients..."
              required
              disabled={submitting}
              helpText="This biography will be displayed on your public lawyer profile."
              error={fieldErrors.bio}
            />

            <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-6)' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ flex: 1 }}
              >
                {submitting ? (
                  <>
                    <span className="spinner" /> Submitting for Review...
                  </>
                ) : application?.status === APPLICATION_STATUS.REJECTED ? (
                  'Re-submit Application for Scrutiny'
                ) : (
                  'Submit Application for Scrutiny'
                )}
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default LawyerApplication;
