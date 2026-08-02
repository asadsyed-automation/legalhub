import { useState } from 'react';
import { motion } from 'framer-motion';

function Card({ children, style, onClick, className }) {
  const isClickable = !!onClick;
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={className}
      animate={{
        y: isClickable && hovered ? -2 : 0,
        boxShadow: isClickable && hovered
          ? '0 8px 24px rgba(0,0,0,0.10)'
          : '0 1px 4px rgba(0,0,0,0.05)',
      }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-3)',
        cursor: isClickable ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

export default Card;
