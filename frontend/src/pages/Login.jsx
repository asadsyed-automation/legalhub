import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/FormField';
import logo from '../assets/logo.png';

export const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isUnverified, setIsUnverified] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const destination = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) {
      setErrorMessage(null);
      setIsLocked(false);
      setIsUnverified(false);
      setIsSuspended(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setIsLocked(false);
    setIsUnverified(false);
    setIsSuspended(false);

    try {
      await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      navigate(destination, { replace: true });
    } catch (error) {
      const detailCode = error.details?.[0]?.message;

      if (error.status === 403 && detailCode === 'EMAIL_NOT_VERIFIED') {
        setIsUnverified(true);
        setErrorMessage(error.message || 'Please verify your email address before logging in.');
      } else if (error.status === 403 && detailCode === 'ACCOUNT_SUSPENDED') {
        setIsSuspended(true);
        setErrorMessage(error.message || 'Your account is suspended. Please contact LegalHub administrative support.');
      } else {
        setErrorMessage(error.message || 'Authentication failed');
        if (error.code === 'ACCOUNT_LOCKED') {
          setIsLocked(true);
        }
      }
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
          <h2>Welcome Back to LegalHub</h2>
          <p>Sign in to your account</p>
        </div>

        {errorMessage && (
          <div
            className={`alert ${isLocked || isUnverified ? 'alert-warning' : 'alert-danger'}`}
            role="alert"
            style={{ marginBottom: 'var(--spacing-4)' }}
          >
            <strong>
              {isLocked
                ? 'Security Lockout:'
                : isUnverified
                ? 'Email Verification Required:'
                : isSuspended
                ? 'Account Suspended:'
                : 'Authentication Error:'}
            </strong>
            <span>{errorMessage}</span>
            {isLocked && (
              <span style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--spacing-1)' }}>
                Too many consecutive failed attempts. LegalHub locks accounts for 15 minutes to defeat brute-force attacks.
              </span>
            )}
            {isUnverified && (
              <div style={{ marginTop: 'var(--spacing-3)' }}>
                <Link
                  to={`/verify-email?email=${encodeURIComponent(formData.email.trim())}`}
                  className="btn btn-primary btn-block"
                  style={{ fontSize: 'var(--font-size-sm)' }}
                >
                  Verify Email Now
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <FormField
            label="Email Address"
            id="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="advocate@legalhub.pk"
            required
            disabled={loading}
          />

          <div className="form-group" style={{ marginBottom: 'var(--spacing-4)' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-2)',
              }}
            >
              <label
                htmlFor="password"
                style={{
                  fontWeight: 'var(--font-weight-medium)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                Password <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <Link
                to={`/forgot-password?email=${encodeURIComponent(formData.email.trim())}`}
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-primary)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: 'var(--spacing-3)',
                fontSize: 'var(--font-size-base)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ marginTop: 'var(--spacing-4)', padding: 'var(--spacing-3)' }}
          >
            {loading ? (
              <>
                <span className="spinner" /> Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-6)', fontSize: 'var(--font-size-sm)' }}>
          <p>
            Do not have an account?{' '}
            <Link to="/register" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
