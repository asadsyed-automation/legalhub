function Card({ children, style }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-3)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default Card;
