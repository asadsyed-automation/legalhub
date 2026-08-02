import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuthLayout from '../components/AuthLayout';

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  }

  return (
    <AuthLayout
      title={!submitted ? "Reset Your Password" : "Check Your Email"}
      subtitle={!submitted ? "Enter the email associated with your LegalHub account and we'll send reset instructions." : `We sent reset instructions to ${email}`}
      heroTag="Account Recovery"
      heroTitle="Secure Account Recovery & Protection"
      heroDesc="LegalHub uses 256-bit encrypted verification tokens to ensure your case files and advocate profile remain protected."
    >
      {!submitted ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
              Email Address *
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon"><MailIcon /></span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="advocate@example.com"
                required
                className="auth-input"
              />
            </div>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ color: 'var(--color-danger)', fontSize: '13px' }}>
              {error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            style={{
              width: '100%', minHeight: '46px', backgroundColor: 'var(--color-primary)',
              color: '#FFFFFF', border: 'none', borderRadius: 'var(--radius-sm)',
              fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.75 : 1, transition: 'background-color 0.15s ease', marginTop: '6px'
            }}
          >
            {loading ? 'Sending Link…' : 'Send Reset Link'}
          </motion.button>

          <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '20px', paddingTop: '18px', textAlign: 'center' }}>
            <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
              ← Back to Sign In
            </Link>
          </div>
        </form>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(34,160,107,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
          }}>
            <CheckCircleIcon />
          </div>

          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
            Please check your email inbox and click on the password reset link to choose a new password.
          </p>

          <button
            type="button"
            onClick={() => setSubmitted(false)}
            style={{
              background: 'none', border: 'none', color: 'var(--color-primary)',
              fontWeight: 700, fontSize: '13px', cursor: 'pointer', marginBottom: '20px', display: 'block', margin: '0 auto 20px'
            }}
          >
            Didn't receive email? Try again
          </button>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '18px' }}>
            <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
              ← Back to Sign In
            </Link>
          </div>
        </motion.div>
      )}
    </AuthLayout>
  );
}

export default ForgotPassword;
