import { ROLE_LABELS, STATUS_LABELS } from '../constants';

export const StatusBadge = ({ status, role, label }) => {
  const item = status || role;

  // Determine badge styling palette
  const getBadgeStyle = () => {
    switch (item) {
      case 'approved':
      case 'admin':
        return {
          bg: 'var(--color-success-light)',
          color: 'var(--color-success)',
          border: '#BBF7D0',
        };
      case 'pending':
      case 'lawyer':
        return {
          bg: 'var(--color-warning-light)',
          color: 'var(--color-warning)',
          border: '#FDE68A',
        };
      case 'rejected':
        return {
          bg: 'var(--color-danger-light)',
          color: 'var(--color-danger)',
          border: '#FECACA',
        };
      case 'client':
      default:
        return {
          bg: 'var(--color-info-light)',
          color: 'var(--color-info)',
          border: '#BFDBFE',
        };
    }
  };

  const style = getBadgeStyle();
  const displayText =
    label ||
    (status ? STATUS_LABELS[status] : role ? ROLE_LABELS[role] : item);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.2rem 0.55rem',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 'var(--font-weight-semibold)',
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        lineHeight: 1.2,
      }}
    >
      {displayText}
    </span>
  );
};

export default StatusBadge;
