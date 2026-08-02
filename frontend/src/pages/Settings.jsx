import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMySubscription } from '../api/subscriptionApi';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';

const TABS = ['Account', 'Notifications', 'Subscription', 'Privacy & Security'];

function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Account');

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      {/* Page Title Header */}
      <div style={{ marginBottom: 'var(--spacing-3)' }}>
        <h1 style={{ margin: '0 0 var(--spacing-1)', fontFamily: 'var(--font-heading)', fontSize: '24px', color: 'var(--color-secondary)' }}>
          Account Settings
        </h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Manage your account preferences, notification alerts, subscription plans, and security settings.
        </p>
      </div>

      {/* Tab Navigation (Using CaseDetail.jsx pattern) */}
      <div style={{
        display: 'flex', gap: '0', marginBottom: 'var(--spacing-3)',
        borderBottom: '2px solid var(--color-border)',
        overflowX: 'auto'
      }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: activeTab === tab ? 700 : 500,
              fontSize: '14px',
              color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-2px',
              fontFamily: 'var(--font-body)',
              whiteSpace: 'nowrap'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'Account'            && <AccountTab user={user} />}
      {activeTab === 'Notifications'      && <NotificationsTab />}
      {activeTab === 'Subscription'       && <SubscriptionTab />}
      {activeTab === 'Privacy & Security' && <PrivacySecurityTab />}
    </div>
  );
}

/* ─── TAB 1: Account Tab ─────────────────────────────────────────────── */
function AccountTab({ user }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState('');

  function handleChangePassword(e) {
    e.preventDefault();
    setNotice('');
    if (newPassword !== confirmPassword) {
      setNotice('⚠️ New passwords do not match.');
      return;
    }
    // Flagged backend gap per requirements: No change-password endpoint exists yet on backend
    setNotice('ℹ️ Backend Notice: Logged-in password change endpoint (PATCH /auth/change-password) is pending backend implementation.');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card>
        <h3 style={{ margin: '0 0 16px', fontFamily: 'var(--font-heading)', fontSize: '16px', color: 'var(--color-secondary)' }}>
          Profile Information
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '5px' }}>
              Full Name
            </label>
            <input
              type="text"
              value={user?.name || ''}
              readOnly
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)', backgroundColor: '#F3F4F6',
                color: 'var(--color-text-secondary)', fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '5px' }}>
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ''}
              readOnly
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)', backgroundColor: '#F3F4F6',
                color: 'var(--color-text-secondary)', fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none'
              }}
            />
          </div>
        </div>

        <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
          ℹ️ Name and Email are read-only. Profile details are verified upon onboarding.
        </p>
      </Card>

      <Card>
        <h3 style={{ margin: '0 0 16px', fontFamily: 'var(--font-heading)', fontSize: '16px', color: 'var(--color-secondary)' }}>
          Change Password
        </h3>

        {notice && (
          <div style={{
            padding: '10px 14px', marginBottom: '14px', borderRadius: 'var(--radius-sm)',
            backgroundColor: '#EFF6FF', border: '1px solid #93C5FD', color: '#1E40AF',
            fontSize: '13px', lineHeight: 1.5
          }}>
            {notice}
          </div>
        )}

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            { label: 'Current Password *', val: currentPassword, setVal: setCurrentPassword },
            { label: 'New Password *', val: newPassword, setVal: setNewPassword },
            { label: 'Confirm New Password *', val: confirmPassword, setVal: setConfirmPassword },
          ].map((field) => (
            <div key={field.label}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '5px' }}>
                {field.label}
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={field.val}
                  onChange={(e) => field.setVal(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%', minHeight: '42px', padding: '0 40px 0 14px',
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
                    fontSize: '14px', fontFamily: 'var(--font-body)', color: 'var(--color-text)',
                    backgroundColor: '#FFFFFF', outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', background: 'none', border: 'none',
                    cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center'
                  }}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}

          <Button type="submit" style={{ marginTop: '4px', alignSelf: 'flex-start' }}>
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  );
}

/* ─── TAB 2: Notifications Tab ───────────────────────────────────────── */
function NotificationsTab() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [inAppNotifs, setInAppNotifs] = useState(true);
  const [gigNotifs, setGigNotifs] = useState(true);

  return (
    <Card>
      <h3 style={{ margin: '0 0 8px', fontFamily: 'var(--font-heading)', fontSize: '16px', color: 'var(--color-secondary)' }}>
        Notification Preferences
      </h3>
      <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: 'var(--color-text-secondary)' }}>
        Choose how and when you receive hearing alerts, cause list updates, and client message alerts.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[
          { id: 'email', label: 'Email Notifications', desc: 'Receive daily cause list reminders and hearing date updates via email.', value: emailNotifs, setter: setEmailNotifs },
          { id: 'inapp', label: 'In-App Notifications', desc: 'Receive real-time alerts for case status changes and instant messages.', value: inAppNotifs, setter: setInAppNotifs },
          { id: 'gigs', label: 'Marketplace Consultation Alerts', desc: 'Receive immediate notifications when clients inquire about legal gigs.', value: gigNotifs, setter: setGigNotifs },
        ].map((item) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: '#F9FAFB' }}>
            <div>
              <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '14px', color: 'var(--color-secondary)' }}>{item.label}</p>
              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>{item.desc}</p>
            </div>

            <button
              type="button"
              onClick={() => item.setter(!item.value)}
              style={{
                width: '46px', height: '24px', borderRadius: '12px', border: 'none',
                backgroundColor: item.value ? 'var(--color-primary)' : '#D1D5DB',
                position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s ease',
                flexShrink: 0
              }}
            >
              <span style={{
                position: 'absolute', top: '2px', left: item.value ? '24px' : '2px',
                width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s ease'
              }} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
          ℹ️ Notification toggles operate visually in local component state. (Backend persistence requires user preference fields in database).
        </p>
      </div>
    </Card>
  );
}

/* ─── TAB 3: Subscription Tab ────────────────────────────────────────── */
function SubscriptionTab() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSub();
  }, []);

  async function loadSub() {
    setLoading(true);
    try {
      const data = await getMySubscription();
      setSubscription(data);
    } catch {
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Card><p style={{ color: 'var(--color-text-secondary)' }}>Loading subscription details…</p></Card>;

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-heading)', fontSize: '18px', color: 'var(--color-secondary)' }}>
            Current Subscription Plan
          </h3>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-secondary)' }}>
            View your active membership tier and practice features.
          </p>
        </div>

        <a
          href="/home#pricing"
          style={{
            backgroundColor: 'var(--color-primary)', color: '#FFFFFF', textDecoration: 'none',
            fontWeight: 700, fontSize: '13px', padding: '8px 16px', borderRadius: 'var(--radius-sm)',
            boxShadow: '0 2px 8px rgba(15,92,60,0.2)'
          }}
        >
          View Plans & Upgrade →
        </a>
      </div>

      {subscription ? (
        <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', border: '2px solid var(--color-primary)', backgroundColor: '#F0FDF4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'capitalize' }}>
              {subscription.plan_type || 'Professional Advocate Plan'}
            </span>
            <Badge status={subscription.status || 'Active'} />
          </div>

          <p style={{ margin: '0 0 8px', fontSize: '13.5px', color: 'var(--color-text)' }}>
            Start Date: <strong>{new Date(subscription.created_at || subscription.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
          </p>

          <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Includes unlimited active cases, AI petition assistant research tools, priority marketplace verification, and firm collaboration.
          </p>
        </div>
      ) : (
        <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: '#F9FAFB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-secondary)' }}>
              Free Starter Plan
            </span>
            <span style={{ fontSize: '12px', fontWeight: 700, backgroundColor: '#E5E7EB', color: '#374151', padding: '3px 10px', borderRadius: '9999px' }}>
              Current Plan
            </span>
          </div>

          <p style={{ margin: '0 0 12px', fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            You are currently on the <strong>Free Plan</strong>. Upgrade to unlock unlimited case entries, AI petition drafting, and priority advocate verification.
          </p>

          <div style={{ display: 'flex', gap: '16px', fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
            <span>✓ Up to 5 Active Cases</span>
            <span>✓ Basic Hearing Reminders</span>
            <span>✓ Marketplace Profile</span>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ─── TAB 4: Privacy & Security Tab ──────────────────────────────────── */
function PrivacySecurityTab() {
  const [twoFactor, setTwoFactor] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 2FA Card */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-heading)', fontSize: '16px', color: 'var(--color-secondary)' }}>
              Two-Factor Authentication (2FA)
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Add an extra layer of security to your account using an authenticator app.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setTwoFactor(!twoFactor)}
            style={{
              width: '46px', height: '24px', borderRadius: '12px', border: 'none',
              backgroundColor: twoFactor ? 'var(--color-primary)' : '#D1D5DB',
              position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s ease',
              flexShrink: 0
            }}
          >
            <span style={{
              position: 'absolute', top: '2px', left: twoFactor ? '24px' : '2px',
              width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s ease'
            }} />
          </button>
        </div>

        <p style={{ margin: '12px 0 0', fontSize: '12px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
          ℹ️ 2FA operates visually in local component state. (Pending backend 2FA implementation).
        </p>
      </Card>

      {/* Danger Zone Card */}
      <div style={{
        backgroundColor: '#FFFFFF', padding: '24px', borderRadius: 'var(--radius-lg)',
        border: '2px solid var(--color-danger)', boxShadow: '0 2px 8px rgba(214,69,69,0.06)'
      }}>
        <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-heading)', fontSize: '16px', color: 'var(--color-danger)' }}>
          ⚠️ Danger Zone
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          Permanently delete your LegalHub account and erase all associated case files, cause lists, and message history.
        </p>

        <Button
          variant="danger"
          onClick={() => { setShowDeleteModal(true); setDeleteNotice(''); }}
          style={{ marginTop: 0 }}
        >
          Delete Account
        </Button>
      </div>

      {/* Confirmation Modal for Delete Account */}
      <AnimatePresence>
        {showDeleteModal && (
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
                width: '100%', maxWidth: '440px', padding: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)', position: 'relative'
              }}
            >
              <h3 style={{ margin: '0 0 8px', fontFamily: 'var(--font-heading)', fontSize: '18px', color: 'var(--color-danger)' }}>
                Delete Account Confirmation
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to delete your LegalHub account? This action cannot be undone and will permanently remove your case data.
              </p>

              {deleteNotice && (
                <div style={{
                  padding: '10px 12px', marginBottom: '14px', borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#FFF7ED', border: '1px solid var(--color-warning)', color: '#C2410C',
                  fontSize: '13px', fontWeight: 600
                }}>
                  {deleteNotice}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={() => setShowDeleteModal(false)} style={{ marginTop: 0 }}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setDeleteNotice('This feature is coming soon (Delete Account endpoint pending backend implementation)')}
                  style={{ marginTop: 0 }}
                >
                  Confirm Delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Settings;
