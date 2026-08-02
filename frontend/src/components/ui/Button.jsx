import { motion } from 'framer-motion';

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
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={{ duration: 0.1 }}
      style={{
        padding: '9px 18px',
        borderRadius: 'var(--radius-sm)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-body)',
        fontSize: '14px',
        fontWeight: 600,
        opacity: disabled ? 0.6 : 1,
        marginTop: '8px',
        transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease',
        lineHeight: 1.4,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        minHeight: '38px',
        ...variantStyles,
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
}

export default Button;
