function Input({ label, type = 'text', value, onChange, placeholder, required }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: '4px',
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
        style={{
          display: 'block',
          width: '100%',
          padding: '9px 12px',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '14px',
          fontFamily: 'var(--font-body)',
          color: 'var(--color-text)',
          backgroundColor: 'var(--color-surface)',
          boxSizing: 'border-box',
          outline: 'none',
        }}
      />
    </div>
  );
}

export default Input;
