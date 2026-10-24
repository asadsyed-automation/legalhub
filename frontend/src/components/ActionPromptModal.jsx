import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

export const ActionPromptModal = ({
  isOpen,
  title,
  subtitle,
  label = 'Reason / Details',
  placeholder = 'Please explain...',
  confirmText = 'Submit',
  cancelText = 'Cancel',
  isDanger = false,
  isLoading = false,
  minLength = 5,
  maxLength = 1000,
  initialValue = '',
  onConfirm,
  onCancel,
}) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      setError(null);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length < minLength) {
      setError(`Please provide at least ${minLength} characters.`);
      return;
    }
    setError(null);
    onConfirm(trimmed);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 'var(--spacing-4)',
      }}
      onClick={isLoading ? undefined : onCancel}
      role="presentation"
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          width: '100%',
          maxWidth: '520px',
          padding: 'var(--spacing-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-4)',
          border: '1px solid var(--color-border)',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div>
          <h3 style={{ margin: '0 0 var(--spacing-1) 0', fontSize: 'var(--font-size-lg)', color: 'var(--color-text)' }}>
            {title}
          </h3>
          {subtitle && (
            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
              {subtitle}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text)',
                marginBottom: 'var(--spacing-1)',
              }}
            >
              {label}
            </label>
            <textarea
              ref={textareaRef}
              rows={4}
              maxLength={maxLength}
              placeholder={placeholder}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError(null);
              }}
              style={{
                width: '100%',
                padding: 'var(--spacing-3)',
                borderRadius: 'var(--radius-md)',
                border: error ? '1px solid var(--color-danger)' : '1px solid var(--color-border)',
                fontFamily: 'inherit',
                fontSize: 'var(--font-size-sm)',
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text)',
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-1)', fontSize: '11px', color: 'var(--color-text-subtle)' }}>
              <span>{minLength > 0 ? `Minimum ${minLength} characters` : ''}</span>
              <span>{value.length} / {maxLength}</span>
            </div>
            {error && (
              <span style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)', marginTop: '4px', display: 'block' }}>
                {error}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelText}
            </button>
            <button
              type="submit"
              className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'} btn-sm`}
              disabled={isLoading || value.trim().length < minLength}
            >
              {isLoading ? 'Processing...' : confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

ActionPromptModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  isDanger: PropTypes.bool,
  isLoading: PropTypes.bool,
  minLength: PropTypes.number,
  maxLength: PropTypes.number,
  initialValue: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default ActionPromptModal;
