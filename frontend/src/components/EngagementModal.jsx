import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CloseIcon, BriefcaseIcon } from './Icons';
import { PRACTICE_AREAS } from '../constants';
import './EngagementModal.css';

export const EngagementModal = ({
  isOpen,
  booking,
  isLoading,
  onSubmit,
  onCancel,
}) => {
  const [title, setTitle] = useState('');
  const [practiceArea, setPracticeArea] = useState('Civil');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && booking) {
      setTitle(`Representation in ${booking.issueSummary ? booking.issueSummary.slice(0, 45) + '...' : 'Court Matter'}`);
      setPracticeArea('Civil');
      setNotes('');
      setError('');
    }
  }, [isOpen, booking]);

  if (!isOpen || !booking) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 5) {
      setError('Please provide a descriptive case engagement title (min 5 characters).');
      return;
    }
    setError('');
    onSubmit({
      title: title.trim(),
      practiceArea,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="em-overlay" role="dialog" aria-modal="true" aria-labelledby="emTitle">
      <div className="em-modal">
        {/* Header */}
        <div className="em-header">
          <div>
            <h2 id="emTitle" className="em-title">
              Request Ongoing Legal Case Engagement
            </h2>
            <p className="em-subtitle">
              With {booking.lawyerName || 'Advocate'} • Transitioning from Consultation #{booking.id.slice(0, 8)}
            </p>
          </div>
          <button
            type="button"
            className="rm-close-btn"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Close dialog"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="em-body">
            {/* Title */}
            <div className="em-field">
              <label htmlFor="emTitleInput" className="em-label">
                Case Matter / Engagement Title *
              </label>
              <input
                id="emTitleInput"
                type="text"
                maxLength={200}
                placeholder="e.g. Partition Suit &amp; Injunction Application before Senior Civil Judge"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="em-input"
                required
              />
            </div>

            {/* Practice Area */}
            <div className="em-field">
              <label htmlFor="emPracticeArea" className="em-label">
                Primary Legal Domain *
              </label>
              <select
                id="emPracticeArea"
                value={practiceArea}
                onChange={(e) => setPracticeArea(e.target.value)}
                className="em-select"
              >
                {PRACTICE_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area} Law
                  </option>
                ))}
              </select>
            </div>

            {/* Scope / Terms Notes */}
            <div className="em-field">
              <label htmlFor="emNotes" className="em-label">
                Proposed Scope &amp; Special Instructions (Optional)
              </label>
              <textarea
                id="emNotes"
                rows={3}
                maxLength={1000}
                placeholder="Specify agreed chamber scope, court appearance stages, vakalatnama requirements..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="cne-textarea"
                style={{ backgroundColor: 'var(--color-bg)' }}
              />
            </div>

            {error && (
              <span style={{ color: '#ef4444', fontSize: 'var(--font-size-xs)' }}>
                {error}
              </span>
            )}

            {/* Formal Notice */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontSize: '11px',
                color: 'var(--color-text-subtle)',
                lineHeight: 1.4,
                backgroundColor: 'var(--color-bg)',
                padding: 'var(--spacing-3)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
              }}
            >
              <BriefcaseIcon size={14} color="var(--color-primary)" />
              <span>
                Formal Vakalatnama Protocol: Initiating an engagement generates an active matter record. Power of Attorney (Vakalatnama) and court fee stamps are executed directly between advocate and client under Bar Council regulations.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="em-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Submitting Request...' : 'Initiate Legal Engagement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

EngagementModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  booking: PropTypes.object,
  isLoading: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default EngagementModal;
