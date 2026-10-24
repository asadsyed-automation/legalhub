import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { StarIcon, CloseIcon, ShieldIcon } from './Icons';
import './ReviewModal.css';

const RATING_DESCRIPTIONS = {
  1: 'Unsatisfactory consultation experience',
  2: 'Below expectations',
  3: 'Average legal guidance',
  4: 'Very helpful & professional counsel',
  5: 'Exceptional legal representation & clarity',
};

export const ReviewModal = ({
  isOpen,
  booking,
  isLoading,
  onSubmit,
  onCancel,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setHoverRating(0);
      setComment('');
      setValidationError('');
    }
  }, [isOpen]);

  if (!isOpen || !booking) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim() || comment.trim().length < 10) {
      setValidationError('Please share at least 10 characters describing your experience.');
      return;
    }
    setValidationError('');
    onSubmit({ rating, comment: comment.trim() });
  };

  const activeRating = hoverRating || rating;

  return (
    <div className="rm-overlay" role="dialog" aria-modal="true" aria-labelledby="rmTitle">
      <div className="rm-modal">
        {/* Header */}
        <div className="rm-header">
          <div>
            <h2 id="rmTitle" className="rm-title">
              Review Legal Consultation
            </h2>
            <p className="rm-subtitle">
              With {booking.lawyerName || 'Advocate'} • Appointment #{booking.id.slice(0, 8)}
            </p>
          </div>
          <button
            type="button"
            className="rm-close-btn"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Close review dialog"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rm-body">
            {/* Star Selector */}
            <div className="rm-stars-container">
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 'bold' }}>
                Rate Your Consultation Experience
              </span>
              <div className="rm-stars-row" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = star <= activeRating;
                  return (
                    <button
                      key={star}
                      type="button"
                      className="rm-star-btn"
                      onMouseEnter={() => setHoverRating(star)}
                      onClick={() => setRating(star)}
                      aria-label={`${star} star`}
                    >
                      <StarIcon
                        size={32}
                        color={isFilled ? '#f59e0b' : 'var(--color-border)'}
                        fill={isFilled ? '#f59e0b' : 'none'}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="rm-rating-label">
                {RATING_DESCRIPTIONS[activeRating] || ''}
              </div>
            </div>

            {/* Comment Area */}
            <div>
              <label
                htmlFor="rmComment"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text)',
                  marginBottom: 'var(--spacing-1)',
                }}
              >
                <span>Written Feedback &amp; Review</span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-subtle)' }}>
                  {comment.length} / 1000
                </span>
              </label>
              <textarea
                id="rmComment"
                rows={4}
                maxLength={1000}
                placeholder="Describe the advocate's legal guidance, punctuality, and preparedness during your consultation..."
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  if (validationError) setValidationError('');
                }}
                className={`cne-textarea ${validationError ? 'bc-textarea--error' : ''}`}
                style={{ backgroundColor: 'var(--color-bg)' }}
              />
              {validationError && (
                <span style={{ color: '#ef4444', fontSize: 'var(--font-size-xs)', display: 'block', marginTop: '4px' }}>
                  {validationError}
                </span>
              )}
            </div>

            {/* Bar Council Compliance Disclaimer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontSize: '11px',
                color: 'var(--color-text-subtle)',
                lineHeight: 1.4,
              }}
            >
              <ShieldIcon size={14} color="var(--color-primary)" />
              <span>
                Verified Review Policy: Reviews are published strictly from verified completed client consultations under fair evaluation standards. Commercial promotional solicitations are prohibited.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="rm-footer">
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
              {isLoading ? 'Submitting Review...' : 'Submit Verified Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

ReviewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  booking: PropTypes.object,
  isLoading: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default ReviewModal;
