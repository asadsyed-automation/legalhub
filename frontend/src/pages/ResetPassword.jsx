import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuthLayout from '../components/AuthLayout';

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const KeyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function getPasswordStrength(pwd) {
    if (!pwd) return { score: 0, label: '', color: '#E5E7EB' };
    if (pwd.length < 6) return { score: 1, label: 'Weak', color: '#EF4444' };
    if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return { score: 3, label: 'Strong', color: '#10B981' };
    return { score: 2, label: 'Medium', color: '#F59E0B' };
  }

  const pwdStrength = getPasswordStrength(password);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1200);
  }

  return (
    <AuthLayout
      title={!success ? "Set New Password" : "Password Updated"}
      subtitle={!success ? "Please choose a strong password to secure your account." : "Your password has been successfully reset."}
      heroTag="Credentials Security"
      heroTitle="Create a New Secure Password"
      heroDesc="Ensure your password contains at least 8 characters with numbers and uppercase letters to keep your advocate workspace secure."
    >
      {!success ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
              New Password *
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon"><LockIcon /></span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="auth-input"
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', background: 'none', border: 'none',
                  cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            {password && (
              <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '4px', backgroundColor: '#E5E7EB', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${(pwdStrength.score / 3) * 100}%`,
                    backgroundColor: pwdStrength.color,
                    transition: 'all 0.2s ease'
                  }} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: pwdStrength.color }}>
                  {pwdStrength.label}
                </span>
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
              Confirm New Password *
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon"><KeyIcon /></span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="auth-input"
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', background: 'none', border: 'none',
                  cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
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
            {loading ? 'Updating Password…' : 'Reset Password'}
          </motion.button>
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
            Your account password has been updated successfully. You can now sign in with your new password.
          </p>

          <motion.button
            onClick={() => navigate('/login')}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%', minHeight: '46px', backgroundColor: 'var(--color-primary)',
              color: '#FFFFFF', border: 'none', borderRadius: 'var(--radius-sm)',
              fontSize: '15px', fontWeight: 700, cursor: 'pointer'
            }}
          >
            Sign In Now →
          </motion.button>
        </motion.div>
      )}
    </AuthLayout>
  );
}

export default ResetPassword;
