import PropTypes from 'prop-types';
import './Toast.css';

const TYPE_ICONS = {
  success: '✓',
  error: '✕',
  warning: '!',
  info: 'ℹ',
};

export const Toast = ({ id, message, type = 'success', onClose }) => {
  return (
    <div className={`toast toast--${type}`} role="alert" aria-live="polite">
      <div className="toast__icon" aria-hidden="true">
        {TYPE_ICONS[type] || '•'}
      </div>
      <div className="toast__message">{message}</div>
      <button
        type="button"
        className="toast__close"
        onClick={() => onClose(id)}
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
};

Toast.propTypes = {
  id: PropTypes.string.isRequired,
  message: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  onClose: PropTypes.func.isRequired,
};

export default Toast;
