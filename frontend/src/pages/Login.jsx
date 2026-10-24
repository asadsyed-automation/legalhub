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
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setIsLocked(false);

    try {
      await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      navigate(destination, { replace: true });
    } catch (error) {
      setErrorMessage(error.message || 'Authentication failed');
      if (error.code === 'ACCOUNT_LOCKED') {
        setIsLocked(true);
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
            className={`alert ${isLocked ? 'alert-warning' : 'alert-danger'}`}
            role="alert"
          >
            <strong>{isLocked ? 'Security Lockout:' : 'Authentication Error:'}</strong>
            <span>{errorMessage}</span>
            {isLocked && (
              <span style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--spacing-1)' }}>
                Too many consecutive failed attempts. LegalHub locks accounts for 15 minutes to defeat brute-force attacks.
              </span>
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

          <FormField
            label="Password"
            id="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
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
