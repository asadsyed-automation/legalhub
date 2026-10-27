import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import caseApi from '../api/case.api';
import bookingApi from '../api/booking.api';
import { PlusIcon, TrashIcon } from '../components/Icons';
import {
  COURTS,
  PRACTICE_AREAS,
  CASE_STATUSES,
  CASE_STATUS_LABELS,
  CASE_STAGES,
  CASE_STAGE_LABELS,
} from '../constants';
import './NewCase.css';

export const NewCase = () => {
  const navigate = useNavigate();

  // Form Fields State
  const [title, setTitle] = useState('');
  const [practiceArea, setPracticeArea] = useState(PRACTICE_AREAS[0] || 'Civil');
  const [court, setCourt] = useState(COURTS[0] || 'District Court, Lahore');
  const [caseOrFirNumber, setCaseOrFirNumber] = useState('');
  const [filingDate, setFilingDate] = useState('');
  const [status, setStatus] = useState('Prospect');
  const [stage, setStage] = useState('');
  const [bookingId, setBookingId] = useState('');

  // Parties dynamic list
  const [parties, setParties] = useState([
    { name: '', roleLabel: 'Plaintiff / Petitioner' },
    { name: '', roleLabel: 'Defendant / Respondent' },
  ]);

  // Bookings state for optional linkage
  const [completedBookings, setCompletedBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Status & Error state
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    const fetchCompletedBookings = async () => {
      setLoadingBookings(true);
      try {
        const res = await bookingApi.getBookings({ status: 'completed' });
        const list = Array.isArray(res) ? res : res?.bookings || res?.data?.bookings || [];
        setCompletedBookings(list);
      } catch {
        // Silently tolerate if no bookings exist yet
        setCompletedBookings([]);
      } finally {
        setLoadingBookings(false);
      }
    };
    fetchCompletedBookings();
  }, []);

  const handleAddParty = () => {
    if (parties.length >= 10) return;
    setParties((prev) => [...prev, { name: '', roleLabel: '' }]);
  };

  const handleRemoveParty = (index) => {
    setParties((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handlePartyChange = (index, field, value) => {
    setParties((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Case title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (title.trim().length > 150) {
      newErrors.title = 'Title cannot exceed 150 characters';
    }

    if (!practiceArea) {
      newErrors.practiceArea = 'Practice area is required';
    }

    if (!court) {
      newErrors.court = 'Court is required';
    }

    if (caseOrFirNumber && caseOrFirNumber.trim().length > 60) {
      newErrors.caseOrFirNumber = 'Case/FIR number cannot exceed 60 characters';
    }

    // Validate party rows: exclude completely empty rows, but require roleLabel if name is given
    const filteredParties = parties.filter((p) => p.name.trim() || p.roleLabel.trim());
    for (let i = 0; i < filteredParties.length; i++) {
      if (!filteredParties[i].name.trim()) {
        newErrors[`party_name_${i}`] = 'Party name cannot be empty';
      }
      if (!filteredParties[i].roleLabel.trim()) {
        newErrors[`party_role_${i}`] = 'Role label cannot be empty';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) return;

    // Filter valid parties
    const validParties = parties
      .filter((p) => p.name.trim() && p.roleLabel.trim())
      .map((p) => ({
        name: p.name.trim(),
        roleLabel: p.roleLabel.trim(),
      }));

    const payload = {
      title: title.trim(),
      practiceArea,
      court,
      status: status || 'Prospect',
      stage: stage || null,
      caseOrFirNumber: caseOrFirNumber.trim() || null,
      filingDate: filingDate || null,
      bookingId: bookingId || null,
      parties: validParties.length > 0 ? validParties : undefined,
    };

    setSubmitting(true);
    try {
      const res = await caseApi.createCase(payload);
      const createdCase = res?.data;
      if (createdCase?.id) {
        navigate(`/cases/${createdCase.id}`);
      } else {
        navigate('/cases');
      }
    } catch (err) {
      setApiError(err.message || 'Failed to create case file. Please verify inputs and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="new-case-page">
      <div className="new-case-header">
        <h1>Register New Case File (*Basta*)</h1>
        <p>
          Open an official litigation brief in your digital chamber. Track parties, procedural stages, and court hearings.
        </p>
      </div>

      <form className="new-case-form" onSubmit={handleSubmit} noValidate>
        {apiError && (
          <div
            style={{
              backgroundColor: 'var(--color-danger-light, #fee2e2)',
              border: '1px solid var(--color-danger, #ef4444)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--spacing-3) var(--spacing-4)',
              color: 'var(--color-danger-dark, #991b1b)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {apiError}
          </div>
        )}

        {/* Section 1: Matter Essentials */}
        <div className="new-case-section">
          <h2 className="new-case-section__title">1. Litigation Brief Essentials</h2>
          <p className="new-case-section__desc">
            Define the suit title, practice jurisdiction, and judicial forum.
          </p>

          <div className="new-case-field">
            <label htmlFor="case-title">Case Title *</label>
            <input
              id="case-title"
              type="text"
              placeholder="e.g. Mian Channu Agricultural Land Partition Suit"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
              }}
              maxLength={150}
              required
            />
            {errors.title && <span className="new-case-field__error">{errors.title}</span>}
          </div>

          <div className="new-case-grid-2">
            <div className="new-case-field">
              <label htmlFor="case-practice-area">Practice Area *</label>
              <select
                id="case-practice-area"
                value={practiceArea}
                onChange={(e) => setPracticeArea(e.target.value)}
              >
                {PRACTICE_AREAS.map((pa) => (
                  <option key={pa} value={pa}>
                    {pa}
                  </option>
                ))}
              </select>
            </div>

            <div className="new-case-field">
              <label htmlFor="case-court">Court Forum *</label>
              <select
                id="case-court"
                value={court}
                onChange={(e) => setCourt(e.target.value)}
              >
                {COURTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="new-case-grid-2">
            <div className="new-case-field">
              <label htmlFor="case-fir-number">Case / FIR / Suit Number (Optional)</label>
              <input
                id="case-fir-number"
                type="text"
                placeholder="e.g. Suit No. 412/2026 or FIR 102/2026"
                value={caseOrFirNumber}
                onChange={(e) => setCaseOrFirNumber(e.target.value)}
                maxLength={60}
              />
              {errors.caseOrFirNumber && (
                <span className="new-case-field__error">{errors.caseOrFirNumber}</span>
              )}
            </div>

            <div className="new-case-field">
              <label htmlFor="case-filing-date">Filing Date (Optional)</label>
              <input
                id="case-filing-date"
                type="date"
                value={filingDate}
                onChange={(e) => setFilingDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Procedural Status & Stage */}
        <div className="new-case-section">
          <h2 className="new-case-section__title">2. Initial Status & Procedural Stage</h2>
          <p className="new-case-section__desc">
            Specify the intake status and current procedural stage of the matter.
          </p>

          <div className="new-case-grid-2">
            <div className="new-case-field">
              <label htmlFor="case-status">Initial Status</label>
              <select
                id="case-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {CASE_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {CASE_STATUS_LABELS[st] || st}
                  </option>
                ))}
              </select>
            </div>

            <div className="new-case-field">
              <label htmlFor="case-stage">Current Stage (Optional)</label>
              <select
                id="case-stage"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
              >
                <option value="">No Stage Assigned</option>
                {CASE_STAGES.map((stg) => (
                  <option key={stg} value={stg}>
                    {CASE_STAGE_LABELS[stg] || stg}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Litigant Parties */}
        <div className="new-case-section">
          <h2 className="new-case-section__title">3. Litigant Parties (Max 10)</h2>
          <p className="new-case-section__desc">
            Record the opposing or co-parties involved in this dispute.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            {parties.map((party, idx) => (
              <div key={idx} className="new-case-party-row">
                <div className="new-case-field">
                  <label htmlFor={`party-name-${idx}`}>Party Name</label>
                  <input
                    id={`party-name-${idx}`}
                    type="text"
                    placeholder="e.g. Chaudhry Riaz Ahmad"
                    value={party.name}
                    onChange={(e) => handlePartyChange(idx, 'name', e.target.value)}
                    maxLength={120}
                  />
                  {errors[`party_name_${idx}`] && (
                    <span className="new-case-field__error">{errors[`party_name_${idx}`]}</span>
                  )}
                </div>

                <div className="new-case-field">
                  <label htmlFor={`party-role-${idx}`}>Role / Capacity</label>
                  <input
                    id={`party-role-${idx}`}
                    type="text"
                    placeholder="e.g. Plaintiff, Respondent No. 1"
                    value={party.roleLabel}
                    onChange={(e) => handlePartyChange(idx, 'roleLabel', e.target.value)}
                    maxLength={40}
                  />
                  {errors[`party_role_${idx}`] && (
                    <span className="new-case-field__error">{errors[`party_role_${idx}`]}</span>
                  )}
                </div>

                {parties.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleRemoveParty(idx)}
                    title="Remove this party"
                    style={{ height: '38px', padding: '0 var(--spacing-3)' }}
                  >
                    <TrashIcon size={14} color="var(--color-danger)" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="new-case-party-actions">
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)' }}>
              {parties.length} of 10 maximum parties added
            </span>

            {parties.length < 10 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddParty}
              >
                <PlusIcon size={14} />
                <span>Add Another Party</span>
              </button>
            )}
          </div>
        </div>

        {/* Section 4: Optional Client Consultation Linkage */}
        <div className="new-case-section">
          <h2 className="new-case-section__title">4. Link Completed Consultation (Optional)</h2>
          <p className="new-case-section__desc">
            Link an existing completed client booking to give the verified citizen read-only portal access.
          </p>

          <div className="new-case-field">
            <label htmlFor="link-booking">Completed Consultation Appointment</label>
            <select
              id="link-booking"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              disabled={loadingBookings}
            >
              <option value="">No Consultation Linked (Chamber Walk-in Brief)</option>
              {completedBookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.client?.name || 'Citizen Client'} — {b.date || 'Appointment'} ({b.practiceArea || 'Consultation'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="new-case-actions">
          <Link to="/cases" className="btn btn-secondary">
            Cancel
          </Link>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Creating Case File...' : 'Open Case File (*Basta*)'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewCase;
