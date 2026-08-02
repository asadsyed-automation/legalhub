import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import GoogleSignInButton from '../components/GoogleSignInButton';
import AuthLayout from '../components/AuthLayout';

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

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

const ScaleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/>
  </svg>
);

function Register() {
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('lawyer');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const namePlaceholder = role === 'lawyer' ? 'Adv. Mohammad Ali' : 'Mohammad Ali';
  const emailPlaceholder = role === 'lawyer' ? 'advocate@example.com' : 'client@example.com';

  function getPasswordStrength(pwd) {
    if (!pwd) return { score: 0, label: '', color: '#E5E7EB' };
    if (pwd.length < 6) return { score: 1, label: 'Weak', color: '#EF4444' };
    if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return { score: 3, label: 'Strong', color: '#10B981' };
    return { score: 2, label: 'Medium', color: '#F59E0B' };
  }

  const pwdStrength = getPasswordStrength(password);

  async function handleSubmit(e) {
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
    try {
      await register({ name, email, password, role });
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credential) {
    setError('');
    setLoading(true);
    try {
      await googleLogin(credential);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Google registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join thousands of advocates, law firms, and citizens across Pakistan."
      heroTag="Advocate & Client Onboarding"
      heroTitle="Join Pakistan's Premier Legal Workspace"
      heroDesc="Set up your verified advocate profile, create specialized legal gigs, manage court hearings, and connect with clients."
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Role Selector Pill */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '5px' }}>
            Account Type *
          </label>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
            backgroundColor: '#F3F4F6', padding: '4px', borderRadius: 'var(--radius-sm)'
          }}>
            <button
              type="button"
              onClick={() => setRole('lawyer')}
              style={{
                padding: '7px 10px', borderRadius: '6px', border: 'none',
                backgroundColor: role === 'lawyer' ? 'var(--color-primary)' : 'transparent',
                color: role === 'lawyer' ? '#FFFFFF' : 'var(--color-text-secondary)',
                fontWeight: role === 'lawyer' ? 700 : 500, fontSize: '12.5px', cursor: 'pointer',
                transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              <ScaleIcon /> Lawyer / Advocate
            </button>
            <button
              type="button"
              onClick={() => setRole('citizen')}
              style={{
                padding: '7px 10px', borderRadius: '6px', border: 'none',
                backgroundColor: role === 'citizen' ? 'var(--color-primary)' : 'transparent',
                color: role === 'citizen' ? '#FFFFFF' : 'var(--color-text-secondary)',
                fontWeight: role === 'citizen' ? 700 : 500, fontSize: '12.5px', cursor: 'pointer',
                transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              <UserIcon /> Client / Citizen
            </button>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '5px' }}>
            Full Name *
          </label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon"><UserIcon /></span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={namePlaceholder}
              required
              className="auth-input"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '5px' }}>
            Email Address *
          </label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon"><MailIcon /></span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={emailPlaceholder}
              required
              className="auth-input"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '5px' }}>
            Password *
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
            <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
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

        {/* Confirm Password */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '5px' }}>
            Confirm Password *
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
            />
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ color: 'var(--color-danger)', fontSize: '13px', padding: '8px 12px', backgroundColor: 'rgba(214,69,69,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(214,69,69,0.2)' }}>
            {error}
          </motion.div>
        )}

        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          style={{
            width: '100%', minHeight: '44px', backgroundColor: 'var(--color-primary)',
            color: '#FFFFFF', border: 'none', borderRadius: 'var(--radius-sm)',
            fontSize: '14.5px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.75 : 1, display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(15, 92, 60, 0.25)',
            marginTop: '4px'
          }}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </motion.button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
          <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
        </div>

        <GoogleSignInButton onSuccess={handleGoogleSuccess} text="signup_with" />

        <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '10px', paddingTop: '10px', textAlign: 'center', fontSize: '13.5px', color: 'var(--color-text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>
            Sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default Register;