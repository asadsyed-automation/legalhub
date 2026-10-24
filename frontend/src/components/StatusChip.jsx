import PropTypes from 'prop-types';
import './StatusChip.css';

const STATUS_CONFIGS = {
  // Application statuses
  pending: { label: 'Under Review', className: 'status-chip--warning' },
  approved: { label: 'Admin-Reviewed', className: 'status-chip--success' },
  rejected: { label: 'Action Required', className: 'status-chip--danger' },

  // Booking statuses
  requested: { label: 'Requested', className: 'status-chip--warning' },
  accepted: { label: 'Accepted', className: 'status-chip--info' },
  paid: { label: 'Payment Succeeded', className: 'status-chip--info' },
  confirmed: { label: 'Confirmed', className: 'status-chip--success' },
  completed: { label: 'Completed', className: 'status-chip--neutral' },
  declined: { label: 'Declined', className: 'status-chip--danger' },
  cancelled: { label: 'Cancelled', className: 'status-chip--neutral' },
  expired: { label: 'Expired', className: 'status-chip--neutral' },
  refunded: { label: 'Refunded', className: 'status-chip--info' },

  // Engagement & Enquiry statuses
  active: { label: 'Active', className: 'status-chip--success' },
  closed: { label: 'Closed', className: 'status-chip--neutral' },
  answered: { label: 'Answered', className: 'status-chip--success' },

  // Roles
  client: { label: 'Client', className: 'status-chip--neutral' },
  lawyer: { label: 'Advocate', className: 'status-chip--primary' },
  admin: { label: 'Court Administrator', className: 'status-chip--danger' },
};

export const StatusChip = ({ status, customLabel = null, size = 'md' }) => {
  if (!status) return null;

  const key = String(status).toLowerCase();
  const config = STATUS_CONFIGS[key] || {
    label: customLabel || status,
    className: 'status-chip--neutral',
  };

  const displayText = customLabel || config.label;
  const sizeClass = size === 'sm' ? 'status-chip--sm' : 'status-chip--md';

  return (
    <span
      className={`status-chip ${config.className} ${sizeClass}`}
      role="status"
      aria-label={`Status: ${displayText}`}
    >
      <span className="status-chip__dot" aria-hidden="true" />
      <span className="status-chip__text">{displayText}</span>
    </span>
  );
};

StatusChip.propTypes = {
  status: PropTypes.string,
  customLabel: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md']),
};

export default StatusChip;
