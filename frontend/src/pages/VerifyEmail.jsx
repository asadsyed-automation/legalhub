import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth.api';
import FormField from '../components/FormField';
import { ROLES } from '../constants';
import logo from '../assets/logo.png';

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const emailFromQuery = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailFromQuery);
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [infoMessage, setInfoMessage] = useState(
    emailFromQuery
      ? `We have dispatched a 6-digit verification code to ${emailFromQuery}.`
      : null
  );

  const { setSessionFromToken } = useAuth();
  const navigate = useNavigate();
  const timerRef = useRef(null);

  // 60-second countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [countdown]);

  const handleCodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(val);
    if (errorMessage) setErrorMessage(null);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errorMessage) setErrorMessage(null);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }
    if (code.length !== 6) {
      setErrorMessage('Verification code must be exactly 6 digits.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await authApi.verifyEmail({
        email: email.trim().toLowerCase(),
        code: code.trim(),
      });

      const authToken = response?.token;
      const verifiedUser = response?.user;

      if (!authToken || !verifiedUser) {
        throw new Error('Verification completed, but server did not return a session.');
      }

      // Establish session with verified credentials
      setSessionFromToken(authToken, verifiedUser);

      // Role-guided navigation
      if (verifiedUser.role === ROLES.LAWYER) {
        navigate('/lawyer/application', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      setErrorMessage(error.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    if (!email.trim()) {
      setErrorMessage('Please enter your registered email address to receive a new code.');
      return;
    }

    setResending(true);
    setErrorMessage(null);

    try {
      const res = await authApi.resendCode({
        email: email.trim().toLowerCase(),
      });
      setInfoMessage(res?.message || 'A new 6-digit verification code has been dispatched to your email.');
      setCountdown(60);
    } catch (error) {
      setErrorMessage(error.message || 'Unable to resend code. Please try again.');
    } finally {
      setResending(false);
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
          <h2>Check Your Email</h2>
          <p>Verify your email address to access your LegalHub account</p>
        </div>

        {infoMessage && (
          <div className="alert alert-info" role="status" style={{ marginBottom: 'var(--spacing-4)' }}>
            <strong>Email Notice:</strong>
            <span>{infoMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: 'var(--spacing-4)' }}>
            <strong>Verification Notice:</strong>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleVerify} noValidate>
          <FormField
            label="Registered Email Address"
            id="email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="advocate@legalhub.pk"
            required
            disabled={loading || resending}
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
              6-Digit Verification Code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={handleCodeChange}
              placeholder="123456"
              disabled={loading}
              autoFocus
              style={{
                width: '100%',
                padding: 'var(--spacing-3)',
                fontSize: 'var(--font-size-2xl)',
                letterSpacing: '0.4em',
                textAlign: 'center',
                fontWeight: 'var(--font-weight-bold)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                outline: 'none',
              }}
            />
            <span
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
                marginTop: 'var(--spacing-1)',
              }}
            >
              Enter the 6-digit code sent to your email. Codes expire after 10 minutes.
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading || code.length !== 6}
            style={{ padding: 'var(--spacing-3)' }}
          >
            {loading ? (
              <>
                <span className="spinner" /> Verifying Code...
              </>
            ) : (
              'Verify & Continue'
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: 'var(--spacing-6)',
            paddingTop: 'var(--spacing-4)',
            borderTop: '1px solid var(--color-border)',
            textAlign: 'center',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <p style={{ marginBottom: 'var(--spacing-2)' }}>Did not receive the code?</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleResend}
            disabled={countdown > 0 || resending || loading}
            style={{ fontSize: 'var(--font-size-sm)' }}
          >
            {resending ? (
              <>
                <span className="spinner" /> Sending...
              </>
            ) : countdown > 0 ? (
              `Resend code in ${countdown}s`
            ) : (
              'Resend Code'
            )}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-6)', fontSize: 'var(--font-size-sm)' }}>
          <p>
            Already verified or need to sign in?{' '}
            <Link to="/login" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
