import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import FormField from '../components/FormField';
import logo from '../assets/logo.png';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [formData, setFormData] = useState({
    email: initialEmail,
    code: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    const finalValue = name === 'code' ? value.replace(/\D/g, '').slice(0, 6) : value;

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = 'Registered email address is required.';
    }
    if (!formData.code || formData.code.length !== 6) {
      errors.code = 'Verification code must be exactly 6 digits.';
    }
    if (!formData.newPassword || formData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters long.';
    }
    if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      const response = await authApi.resetPassword({
        email: formData.email.trim().toLowerCase(),
        code: formData.code.trim(),
        newPassword: formData.newPassword,
      });

      setSuccessMessage(
        response?.message ||
          'Password has been reset successfully. Please log in with your new password.'
      );
    } catch (error) {
      setErrorMessage(error.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-6)' }}>
          <img
            src={logo}
            alt="LegalHub"
            style={{
              height: '42px',
              width: 'auto',
              margin: '0 auto var(--spacing-3) auto',
              display: 'block',
              objectFit: 'contain',
            }}
          />
          <h2>Set a New Password</h2>
          <p>Enter the verification code sent to your email</p>
        </div>

        {successMessage ? (
          <div>
            <div className="alert alert-success" role="status" style={{ marginBottom: 'var(--spacing-6)' }}>
              <strong>Success:</strong>
              <span>{successMessage}</span>
            </div>

            <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-6)' }}>
              Your account password has been updated and any temporary security lockouts have been cleared. You can now sign in immediately.
            </p>

            <Link
              to="/login"
              className="btn btn-primary btn-block"
              style={{ padding: 'var(--spacing-3)', textAlign: 'center', display: 'block' }}
            >
              Sign In with New Password
            </Link>
          </div>
        ) : (
          <>
            {errorMessage && (
              <div className="alert alert-danger" role="alert" style={{ marginBottom: 'var(--spacing-4)' }}>
                <strong>Notice:</strong>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Explicit Password & Security Rules */}
            <div
              style={{
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-3) var(--spacing-4)',
                marginBottom: 'var(--spacing-4)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
              }}
            >
              <strong style={{ display: 'block', color: 'var(--color-text)', marginBottom: 'var(--spacing-1)' }}>
                Security Requirements:
              </strong>
              <ul style={{ paddingLeft: 'var(--spacing-4)', margin: 0 }}>
                <li>Code must be the 6-digit number sent to your email.</li>
                <li>Password must be at least 8 characters long.</li>
                <li>Both passwords must match exactly.</li>
                <li>Maximum 5 attempts allowed before code is locked.</li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <FormField
                label="Registered Email Address"
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="advocate@legalhub.pk"
                required
                error={fieldErrors.email}
                disabled={loading}
              />

              <div className="form-group" style={{ marginBottom: 'var(--spacing-4)' }}>
                <label
                  htmlFor="code"
                  style={{
                    display: 'block',
                    fontWeight: 'var(--font-weight-medium)',
                    marginBottom: 'var(--spacing-2)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  6-Digit Verification Code <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="123456"
                  disabled={loading}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-3)',
                    fontSize: 'var(--font-size-xl)',
                    letterSpacing: '0.3em',
                    textAlign: 'center',
                    fontWeight: 'var(--font-weight-bold)',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${fieldErrors.code ? 'var(--color-danger)' : 'var(--color-border)'}`,
                    backgroundColor: 'var(--color-surface)',
                    outline: 'none',
                  }}
                />
                {fieldErrors.code && (
                  <span
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-danger)',
                      marginTop: 'var(--spacing-1)',
                    }}
                  >
                    {fieldErrors.code}
                  </span>
                )}
              </div>

              <FormField
                label="New Password"
                id="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Minimum 8 characters"
                required
                error={fieldErrors.newPassword}
                disabled={loading}
              />

              <FormField
                label="Confirm New Password"
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your new password"
                required
                error={fieldErrors.confirmPassword}
                disabled={loading}
              />

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
                style={{ marginTop: 'var(--spacing-4)', padding: 'var(--spacing-3)' }}
              >
                {loading ? (
                  <>
                    <span className="spinner" /> Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 'var(--spacing-6)', fontSize: 'var(--font-size-sm)' }}>
              <Link to="/login" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                Remember your password? Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
