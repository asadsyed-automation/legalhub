const STATUS_COLORS = {
  Open:                { bg: '#EFF6FF', text: 'var(--color-info)' },
  'In Progress':       { bg: '#FFF7ED', text: 'var(--color-warning)' },
  'Hearing Scheduled': { bg: '#F0FDF4', text: 'var(--color-success)' },
  Adjourned:           { bg: '#FEF2F2', text: 'var(--color-danger)' },
  Decided:             { bg: '#F0FDF4', text: 'var(--color-success)' },
  Closed:              { bg: '#F3F4F6', text: '#6B7280' },
  Archived:            { bg: '#F3F4F6', text: '#9CA3AF' },
  Paid:                { bg: '#F0FDF4', text: 'var(--color-success)' },
  Unpaid:              { bg: '#FEF2F2', text: 'var(--color-danger)' },
  Pending:             { bg: '#FFF7ED', text: 'var(--color-warning)' },
};

function Badge({ status }) {
  const colors = STATUS_COLORS[status] || { bg: '#F3F4F6', text: '#6B7280' };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    >
      {status}
    </span>
  );
}

export default Badge;
