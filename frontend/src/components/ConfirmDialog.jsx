import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { ShieldIcon } from './Icons';
import './ConfirmDialog.css';

export const ConfirmDialog = ({
  isOpen,
  title = 'Please Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const confirmBtnRef = useRef(null);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Auto focus primary action
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="confirm-overlay" onClick={isLoading ? undefined : onCancel} role="presentation">
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-dialog__header">
          <div className={`confirm-dialog__icon-badge ${isDanger ? 'confirm-dialog__icon-badge--danger' : ''}`}>
            <ShieldIcon size={20} color={isDanger ? '#dc2626' : 'var(--color-primary)'} />
          </div>
          <h3 id="confirm-dialog-title" className="confirm-dialog__title">
            {title}
          </h3>
        </div>

        <div id="confirm-dialog-message" className="confirm-dialog__body">
          {message}
        </div>

        <div className="confirm-dialog__footer">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className={`btn btn-sm ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string,
  message: PropTypes.node.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  isDanger: PropTypes.bool,
  isLoading: PropTypes.bool,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default ConfirmDialog;
