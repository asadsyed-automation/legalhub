import { useState } from 'react';
import { motion } from 'framer-motion';
import { setRoleRequest } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

function RoleSelectionModal({ tempToken, user, onComplete, onError }) {
  const [selectedRole, setSelectedRole] = useState('lawyer');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  async function handleRoleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const data = await setRoleRequest(selectedRole, tempToken);
      login(data);
      if (onComplete) onComplete(data);
    } catch (err) {
      if (onError) onError(err.response?.data?.error || err.message || 'Failed to set account role.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '24px'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          padding: '36px 32px',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          border: '1px solid var(--color-border)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span style={{ fontSize: '32px' }}>👋</span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800, color: 'var(--color-text)', margin: '12px 0 6px' }}>
            Welcome, {user?.name || 'there'}!
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
            To complete your Google Sign-In, please choose how you will be using LegalHub:
          </p>
        </div>

        <form onSubmit={handleRoleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
            {/* Option 1: Lawyer */}
            <div
              onClick={() => setSelectedRole('lawyer')}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '14px',
                padding: '16px', borderRadius: 'var(--radius-md)',
                border: `2px solid ${selectedRole === 'lawyer' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                backgroundColor: selectedRole === 'lawyer' ? 'rgba(15,92,60,0.04)' : '#FFFFFF',
                cursor: 'pointer', transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontSize: '24px', marginTop: '2px' }}>⚖️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-secondary)', marginBottom: '2px' }}>
                  I'm a Lawyer / Law Firm
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  Manage cases, court hearing dates, client messages & practice billing.
                </div>
              </div>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%',
                border: `2px solid ${selectedRole === 'lawyer' ? 'var(--color-primary)' : '#BDC3C7'}`,
                backgroundColor: selectedRole === 'lawyer' ? 'var(--color-primary)' : 'transparent',
                marginTop: '4px'
              }} />
            </div>

            {/* Option 2: Citizen */}
            <div
              onClick={() => setSelectedRole('citizen')}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '14px',
                padding: '16px', borderRadius: 'var(--radius-md)',
                border: `2px solid ${selectedRole === 'citizen' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                backgroundColor: selectedRole === 'citizen' ? 'rgba(15,92,60,0.04)' : '#FFFFFF',
                cursor: 'pointer', transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontSize: '24px', marginTop: '2px' }}>👤</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-secondary)', marginBottom: '2px' }}>
                  I Need Legal Help / Citizen
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  Find verified Pakistani advocates, track case status & communicate.
                </div>
              </div>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%',
                border: `2px solid ${selectedRole === 'citizen' ? 'var(--color-primary)' : '#BDC3C7'}`,
                backgroundColor: selectedRole === 'citizen' ? 'var(--color-primary)' : 'transparent',
                marginTop: '4px'
              }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', minHeight: '48px',
              backgroundColor: 'var(--color-primary)', color: '#FFFFFF',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.75 : 1,
              boxShadow: '0 4px 12px rgba(15,92,60,0.2)'
            }}
          >
            {loading ? 'Setting Role…' : 'Complete Setup & Continue →'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default RoleSelectionModal;
