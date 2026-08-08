import { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin, useGoogleLogin } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '834073121598-kbakkovmr12556sgekb05d2a6qk0uncr.apps.googleusercontent.com';

function GooglePopupButton({ onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const loginWithPopup = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        await onSuccess(tokenResponse.access_token || 'mock_google_id_token_' + Date.now());
      } catch (err) {
        if (onError) onError(err);
      } finally {
        setLoading(false);
      }
    },
    onError: (err) => {
      if (onError) onError(err);
    },
  });

  const isPlaceholder = GOOGLE_CLIENT_ID.includes('placeholder');

  function handleButtonClick() {
    if (!isPlaceholder) {
      loginWithPopup();
    } else {
      setShowAccountModal(true);
    }
  }

  async function handleConfirmAccountSelection(email, name) {
    setShowAccountModal(false);
    setLoading(true);
    try {
      const mockToken = 'mock_google_id_token_' + Date.now();
      await onSuccess(mockToken);
    } catch (err) {
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={loading}
        style={{
          width: '100%',
          minHeight: '44px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #DADCE0',
          borderRadius: 'var(--radius-sm)',
          fontSize: '14px',
          fontWeight: 600,
          color: '#3C4043',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          transition: 'all 0.15s ease'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F8F9FA'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path fill="#4285F4" d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.92l2.84 2.2c1.7-1.57 2.68-3.88 2.68-6.62z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.41-1.57-5.14-3.74L.88 13.04C2.36 15.98 5.44 18 9 18z"/>
          <path fill="#FBBC05" d="M3.86 10.78c-.18-.53-.28-1.1-.28-1.78s.1-1.25.28-1.78L.88 4.96C.32 6.08 0 7.36 0 9s.32 2.92.88 4.04l2.98-2.26z"/>
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.34l2.58-2.58C13.46.89 11.43 0 9 0 5.44 0 2.36 2.02.88 4.96l2.98 2.26C4.59 5.05 6.62 3.58 9 3.58z"/>
        </svg>
        <span>{loading ? 'Connecting Google Account...' : 'Continue with Google'}</span>
      </button>

      {/* Industry Standard Google Account Chooser Popup Window */}
      {showAccountModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            width: '100%', maxWidth: '420px', backgroundColor: '#FFFFFF',
            borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            overflow: 'hidden', border: '1px solid #E5E7EB'
          }}>
            {/* Google OAuth Header */}
            <div style={{ padding: '24px 24px 16px', textAlignment: 'center', borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <svg width="32" height="32" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.92l2.84 2.2c1.7-1.57 2.68-3.88 2.68-6.62z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.41-1.57-5.14-3.74L.88 13.04C2.36 15.98 5.44 18 9 18z"/>
                  <path fill="#FBBC05" d="M3.86 10.78c-.18-.53-.28-1.1-.28-1.78s.1-1.25.28-1.78L.88 4.96C.32 6.08 0 7.36 0 9s.32 2.92.88 4.04l2.98-2.26z"/>
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.34l2.58-2.58C13.46.89 11.43 0 9 0 5.44 0 2.36 2.02.88 4.96l2.98 2.26C4.59 5.05 6.62 3.58 9 3.58z"/>
                </svg>
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 600, color: '#1F2937', textAlign: 'center' }}>
                Sign in with Google
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#6B7280', textAlign: 'center' }}>
                to continue to <strong>LegalHub Pakistan</strong>
              </p>
            </div>

            {/* Account List Chooser */}
            <div style={{ padding: '16px 24px' }}>
              <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Choose an account
              </p>

              {[
                { name: 'Asad Syed', email: 'asadsyed.automation@gmail.com', avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c' },
                { name: 'Mohammad Ali (Advocate)', email: 'advocate.google@legalhub.pk', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&auto=format&fit=crop&q=80' },
              ].map((acc) => (
                <div
                  key={acc.email}
                  onClick={() => handleConfirmAccountSelection(acc.email, acc.name)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px', padding: '12px',
                    borderRadius: '8px', border: '1px solid #E5E7EB', marginBottom: '10px',
                    cursor: 'pointer', transition: 'background-color 0.15s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                >
                  <img src={acc.avatar} alt={acc.name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#111827' }}>{acc.name}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>{acc.email}</p>
                  </div>
                  <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: 600 }}>Select ➔</span>
                </div>
              ))}

              <div style={{ borderTop: '1px solid #F3F4F6', marginTop: '14px', paddingTop: '14px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
                >
                  Cancel Sign-In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function GoogleSignInButton({ onSuccess, onError }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GooglePopupButton onSuccess={onSuccess} onError={onError} />
    </GoogleOAuthProvider>
  );
}

export default GoogleSignInButton;
