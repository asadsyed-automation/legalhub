import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuthLayout from '../components/AuthLayout';
import { verifyOtpApi, requestForgotPasswordApi } from '../api/authApi';

function OtpVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';
  const devCode = searchParams.get('devCode') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);

  const inputRefs = useRef([]);

  // Auto-fill dev code if available in query params for instant testing
  useEffect(() => {
    if (devCode && devCode.length === 6) {
      setOtp(devCode.split(''));
    }
  }, [devCode]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  function handleChange(index, value) {
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      setError('Please enter the full 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await verifyOtpApi({ email, code: fullOtp });
      navigate(`/reset-password?email=${encodeURIComponent(email)}&resetToken=${encodeURIComponent(res.resetToken)}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (timer > 0 || !email) return;
    setTimer(60);
    setError('');
    setOtp(['', '', '', '', '', '']);

    try {
      const res = await requestForgotPasswordApi({ email });
      if (res.devCode && res.devCode.length === 6) {
        setOtp(res.devCode.split(''));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend code.');
    }

    if (inputRefs.current[0]) inputRefs.current[0].focus();
  }

  return (
    <AuthLayout
      title="Verify Your Account"
      subtitle={`Enter the 6-digit verification code sent to ${email || 'your email'}`}
      heroTag="Email Verification"
      heroTitle="Two-Factor Account Verification"
      heroDesc="We protect advocate and client identity through instant 6-digit code verification."
    >
      <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {devCode && (
          <div style={{
            padding: '10px 14px', borderRadius: 'var(--radius-sm)',
            backgroundColor: '#EFF6FF', border: '1px solid #93C5FD', color: '#1E40AF',
            fontSize: '12.5px', fontWeight: 600, textAlign: 'center'
          }}>
            🔑 Dev Mode Notice: Verification Code <strong>{devCode}</strong> was generated and logged to backend console.
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '12px', textAlign: 'center' }}>
            6-Digit Security Code
          </label>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                style={{
                  width: '44px',
                  height: '50px',
                  fontSize: '22px',
                  fontWeight: 700,
                  textAlign: 'center',
                  borderRadius: 'var(--radius-sm)',
                  border: digit ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: digit ? 'rgba(15,92,60,0.04)' : '#FFFFFF',
                  color: 'var(--color-secondary)',
                  outline: 'none',
                  transition: 'all 0.15s ease'
                }}
              />
            ))}
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ color: 'var(--color-danger)', fontSize: '13px', textAlign: 'center' }}>
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
            opacity: loading ? 0.75 : 1, transition: 'background-color 0.15s ease'
          }}
        >
          {loading ? 'Verifying Code…' : 'Verify & Continue →'}
        </motion.button>

        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          Didn't receive the code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={timer > 0}
            style={{
              background: 'none', border: 'none',
              color: timer > 0 ? 'var(--color-text-secondary)' : 'var(--color-primary)',
              fontWeight: 700, cursor: timer > 0 ? 'not-allowed' : 'pointer', padding: 0
            }}
          >
            {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
          </button>
        </div>

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', textAlign: 'center' }}>
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
            ← Back to Sign In
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default OtpVerification;
