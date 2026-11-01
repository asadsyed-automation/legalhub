import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import FormField from '../components/FormField';
import logo from '../assets/logo.png';

export const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await authApi.forgotPassword({
        email: email.trim().toLowerCase(),
      });

      // Always shows the enumeration-safe generic response
      setFeedbackMessage(
        response?.message ||
          'If that email address is in our system, we have sent a 6-digit verification code to it.'
      );
      setSubmitted(true);
    } catch (error) {
      // Even in error, unless network fails, backend returns 200
      setErrorMessage(error.message || 'Unable to process your request. Please try again.');
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
          <h2>Reset Your Password</h2>
          <p>Recover access to your LegalHub account</p>
        </div>

        {errorMessage && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: 'var(--spacing-4)' }}>
            <strong>Notice:</strong>
            <span>{errorMessage}</span>
          </div>
        )}

        {submitted ? (
          <div>
            <div className="alert alert-info" role="status" style={{ marginBottom: 'var(--spacing-6)' }}>
              <strong>Dispatched Notice:</strong>
              <span>{feedbackMessage}</span>
            </div>

            <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-6)' }}>
              Please check your inbox (and spam folder) for the 6-digit verification code. The code remains valid for 10 minutes.
            </p>

            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() =>
                navigate(`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`)
              }
              style={{ padding: 'var(--spacing-3)', marginBottom: 'var(--spacing-4)' }}
            >
              Enter Code & Reset Password
            </button>

            <div style={{ textAlign: 'center', fontSize: 'var(--font-size-sm)' }}>
              <Link to="/login" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <FormField
              label="Account Email Address"
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="advocate@legalhub.pk"
              required
              disabled={loading}
              helpText="We will send a 6-digit cryptographic verification code to this address."
            />

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || !email.trim()}
              style={{ marginTop: 'var(--spacing-4)', padding: 'var(--spacing-3)' }}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Sending Code...
                </>
              ) : (
                'Send Verification Code'
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: 'var(--spacing-6)', fontSize: 'var(--font-size-sm)' }}>
              <Link to="/login" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                Remember your password? Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
