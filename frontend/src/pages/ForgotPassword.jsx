import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuthLayout from '../components/AuthLayout';
import { requestForgotPasswordApi } from '../api/authApi';

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await requestForgotPasswordApi({ email: email.trim() });
      if (res.devCode) {
        // Dev mode auto-pass code via query params for instant testing
        navigate(`/verify-otp?email=${encodeURIComponent(email.trim())}&devCode=${res.devCode}`);
      } else {
        navigate(`/verify-otp?email=${encodeURIComponent(email.trim())}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send verification code. Check email address.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Reset Your Password"
      subtitle="Enter the email associated with your LegalHub account and we'll send a 6-digit verification code."
      heroTag="Account Recovery"
      heroTitle="Secure Account Recovery & Protection"
      heroDesc="LegalHub uses 256-bit encrypted verification tokens to ensure your case files and advocate profile remain protected."
    >
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
          {loading ? 'Sending Code…' : 'Send Verification Code →'}
        </motion.button>

        <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '20px', paddingTop: '18px', textAlign: 'center' }}>
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
            ← Back to Sign In
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default ForgotPassword;
