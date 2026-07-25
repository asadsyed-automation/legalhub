const VARIANTS = {
  primary: {
    backgroundColor: 'var(--color-primary)',
    color: '#FFFFFF',
    border: 'none',
  },
  secondary: {
    backgroundColor: 'transparent',
    color: 'var(--color-primary)',
    border: '1px solid var(--color-primary)',
  },
  danger: {
    backgroundColor: 'var(--color-danger)',
    color: '#FFFFFF',
    border: 'none',
  },
};

function Button({ children, onClick, variant = 'primary', type = 'button', disabled = false, style }) {
  const variantStyles = VARIANTS[variant] || VARIANTS.primary;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '8px 18px',
        borderRadius: 'var(--radius-sm)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-body)',
        fontSize: '14px',
        fontWeight: 600,
        opacity: disabled ? 0.6 : 1,
        marginTop: '8px',
        ...variantStyles,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export default Button;
