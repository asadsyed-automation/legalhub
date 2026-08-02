import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPublicCitizenProfile } from '../api/citizenApi';

const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

function CitizenProfileModal({ citizenId, isOpen, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && citizenId) {
      load();
    }
  }, [isOpen, citizenId]);

  async function load() {
    setLoading(true);
    try {
      const data = await getPublicCitizenProfile(citizenId);
      setProfile(data);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '20px'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          style={{
            backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)',
            width: '100%', maxWidth: '480px', padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative'
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '16px', right: '16px', border: 'none',
              background: 'none', fontSize: '20px', cursor: 'pointer', color: '#6B7280'
            }}
          >
            ×
          </button>

          {loading ? (
            <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', margin: '20px 0' }}>
              Loading client details…
            </p>
          ) : profile ? (
            <div>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
                <img
                  src={profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
                  alt={profile.citizen?.name}
                  style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary)' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--color-secondary)' }}>
                      {profile.citizen?.name || 'Client User'}
                    </h3>
                    <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#ECFDF5', color: '#065F46', padding: '2px 8px', borderRadius: '9999px' }}>
                      Verified Client
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPinIcon /> {profile.city}</span>
                    {profile.phone_number && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontWeight: 600 }}>
                        <PhoneIcon /> {profile.phone_number}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Legal Needs Box (Fiverr Buyer Brief style) */}
              <div style={{
                backgroundColor: '#F9FAFB', padding: '16px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)', marginBottom: '16px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  Client Requirement & Legal Need
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '13.5px', color: 'var(--color-secondary)', lineHeight: 1.5 }}>
                  "{profile.legal_summary || 'Seeking professional legal consultation and advocate representation.'}"
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-secondary)', borderTop: '1px solid #E5E7EB', paddingTop: '8px' }}>
                  <span>Area: <strong>{profile.preferred_specialization || 'General Assistance'}</strong></span>
                  <span>Budget: <strong>{profile.budget_range || 'Flexible'}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              {profile.phone_number && (
                <a
                  href={`https://wa.me/${profile.phone_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Assalam-o-Alaikum ${profile.citizen?.name || 'Client'}, this is regarding your legal inquiry on LegalHub.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    width: '100%', backgroundColor: '#25D366', color: '#FFF', textDecoration: 'none',
                    fontWeight: 700, fontSize: '13.5px', padding: '10px', borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 4px 12px rgba(37,211,102,0.3)', boxSizing: 'border-box'
                  }}
                >
                  💬 Open Direct WhatsApp Chat
                </a>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>
              Client profile unavailable.
            </p>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default CitizenProfileModal;
