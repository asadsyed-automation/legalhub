import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CloseIcon, ChatIcon } from './Icons';
import './ReviewModal.css';

export const ReviewReplyModal = ({
  isOpen,
  review,
  isLoading,
  onSubmit,
  onCancel,
}) => {
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReply(review?.lawyerReply || '');
      setError('');
    }
  }, [isOpen, review]);

  if (!isOpen || !review) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reply.trim() || reply.trim().length < 5) {
      setError('Please provide a response of at least 5 characters.');
      return;
    }
    setError('');
    onSubmit(reply.trim());
  };

  return (
    <div className="rm-overlay" role="dialog" aria-modal="true" aria-labelledby="rrmTitle">
      <div className="rm-modal">
        {/* Header */}
        <div className="rm-header">
          <div>
            <h2 id="rrmTitle" className="rm-title">
              Chamber Response to Client Review
            </h2>
            <p className="rm-subtitle">
              Public response published under your verified advocate profile
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
          <div className="rm-body">
            {/* Original Review Excerpt */}
            <div
              style={{
                backgroundColor: 'var(--color-bg)',
                padding: 'var(--spacing-3) var(--spacing-4)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              <strong style={{ color: 'var(--color-text)', display: 'block', marginBottom: '4px' }}>
                Client Feedback ({review.rating} / 5 Stars):
              </strong>
              <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                &ldquo;{review.comment}&rdquo;
              </span>
            </div>

            {/* Response Area */}
            <div>
              <label
                htmlFor="rrmReplyText"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text)',
                  marginBottom: 'var(--spacing-1)',
                }}
              >
                <span>Official Advocate Chamber Reply</span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-subtle)' }}>
                  {reply.length} / 1000
                </span>
              </label>
              <textarea
                id="rrmReplyText"
                rows={4}
                maxLength={1000}
                placeholder="Thank the client for their feedback and state professional commitments..."
                value={reply}
                onChange={(e) => {
                  setReply(e.target.value);
                  if (error) setError('');
                }}
                className={`cne-textarea ${error ? 'bc-textarea--error' : ''}`}
                style={{ backgroundColor: 'var(--color-bg)' }}
              />
              {error && (
                <span style={{ color: '#ef4444', fontSize: 'var(--font-size-xs)', display: 'block', marginTop: '4px' }}>
                  {error}
                </span>
              )}
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
              {isLoading ? 'Posting Reply...' : 'Publish Chamber Reply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

ReviewReplyModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  review: PropTypes.object,
  isLoading: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default ReviewReplyModal;
