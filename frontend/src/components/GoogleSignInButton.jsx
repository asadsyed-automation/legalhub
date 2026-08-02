import { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1048293049281-placeholder.apps.googleusercontent.com';

function GoogleSignInButton({ onSuccess, onError, text = 'signin_with' }) {
  const [loading, setLoading] = useState(false);
  const isPlaceholder = GOOGLE_CLIENT_ID.includes('placeholder');

  async function handleGoogleSuccess(credentialResponse) {
    if (!credentialResponse.credential) return;
    setLoading(true);
    try {
      await onSuccess(credentialResponse.credential);
    } catch (err) {
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSimulatedGoogle() {
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
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        {!isPlaceholder ? (
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              if (onError) onError(new Error('Google sign-in was cancelled or failed.'));
            }}
            text={text}
            shape="rectangular"
            theme="outline"
            size="large"
            width="100%"
          />
        ) : (
          <button
            type="button"
            onClick={handleSimulatedGoogle}
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
            <span>Sign in with Google</span>
          </button>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

export default GoogleSignInButton;
