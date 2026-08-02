import { useState } from 'react';

function Input({ label, type = 'text', value, onChange, placeholder, required, disabled }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: '14px' }}>
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: '5px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--color-text)',
          }}
        >
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          display: 'block',
          width: '100%',
          padding: '10px 13px',
          border: `1.5px solid ${focused ? 'var(--color-primary)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-sm)',
          fontSize: '14px',
          fontFamily: 'var(--font-body)',
          color: 'var(--color-text)',
          backgroundColor: disabled ? '#F9FAFB' : 'var(--color-surface)',
          boxSizing: 'border-box',
          outline: 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          boxShadow: focused ? '0 0 0 3px rgba(15,92,60,0.12)' : 'none',
          minHeight: '42px',
          cursor: disabled ? 'not-allowed' : 'text',
          opacity: disabled ? 0.7 : 1,
        }}
      />
    </div>
  );
}

export default Input;
