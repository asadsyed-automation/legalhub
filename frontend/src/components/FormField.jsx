export const FormField = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  helpText,
  options = [],
  children,
}) => {
  const isSelect = type === 'select';
  const isTextarea = type === 'textarea';

  return (
    <div style={{ marginBottom: 'var(--spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-1)',
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}

      {isSelect ? (
        <select
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          style={{
            padding: 'var(--spacing-3)',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${error ? 'var(--color-border-error)' : 'var(--color-border)'}`,
            backgroundColor: disabled ? 'var(--color-surface-hover)' : 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: 'var(--font-size-sm)',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        >
          {options.length > 0
            ? options.map((opt) => (
                <option key={opt.value ?? opt} value={opt.value ?? opt}>
                  {opt.label ?? opt}
                </option>
              ))
            : children}
        </select>
      ) : isTextarea ? (
        <textarea
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={4}
          style={{
            padding: 'var(--spacing-3)',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${error ? 'var(--color-border-error)' : 'var(--color-border)'}`,
            backgroundColor: disabled ? 'var(--color-surface-hover)' : 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: 'var(--font-size-sm)',
            outline: 'none',
            fontFamily: 'inherit',
            resize: 'vertical',
          }}
        />
      ) : (
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          style={{
            padding: 'var(--spacing-3)',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${error ? 'var(--color-border-error)' : 'var(--color-border)'}`,
            backgroundColor: disabled ? 'var(--color-surface-hover)' : 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: 'var(--font-size-sm)',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
      )}

      {helpText && !error && (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)' }}>
          {helpText}
        </span>
      )}

      {error && (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)', fontWeight: 'var(--font-weight-medium)' }}>
          {error}
        </span>
      )}
    </div>
  );
};

export default FormField;
