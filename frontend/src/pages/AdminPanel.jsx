import { useState, useEffect } from 'react';
import {
  getSystemMetrics,
  getPendingLawyers,
  approveLawyer,
  rejectLawyer,
  getSystemLogs,
  getAllMarketplaceProfilesAdmin,
  verifyMarketplaceProfile,
} from '../api/adminApi';
import { Card, Button, Badge, Input } from '../components/ui';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics' | 'lawyers' | 'verification' | 'logs'
  const [toastMessage, setToastMessage] = useState('');

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--spacing-3)' }}>
        <h1 style={{ margin: '0 0 var(--spacing-1)', fontFamily: 'var(--font-heading)', fontSize: '24px' }}>
          Admin Panel
        </h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          System oversight, advocate verification, and administrative audit log.
        </p>
      </div>

      {toastMessage && (
        <div style={{
          padding: '12px 18px', marginBottom: 'var(--spacing-3)', borderRadius: 'var(--radius-sm)',
          backgroundColor: '#ECFDF5', border: '1px solid var(--color-success)', color: '#065F46',
          fontWeight: 600, fontSize: '14px'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Tab Navigation Pills */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', marginBottom: 'var(--spacing-3)' }}>
        {[
          { id: 'metrics', label: '📊 System Health' },
          { id: 'verification', label: '🛡️ Profile Verification' },
          { id: 'lawyers', label: '⚖️ Lawyer Registrations' },
          { id: 'logs', label: '📜 Audit Logs' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: 'none',
              cursor: 'pointer', fontWeight: activeTab === tab.id ? 700 : 500, fontSize: '13.5px',
              backgroundColor: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
              color: activeTab === tab.id ? '#FFFFFF' : 'var(--color-text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'metrics' && <MetricsTab />}
      {activeTab === 'verification' && <ProfileVerificationTab showToast={showToast} />}
      {activeTab === 'lawyers' && <PendingLawyersTab showToast={showToast} />}
      {activeTab === 'logs' && <LogsTab />}
    </div>
  );
}

// ─── Tab: Metrics ─────────────────────────────────────────────────────────────
function MetricsTab() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await getSystemMetrics();
        setMetrics(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load system metrics');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p style={{ color: 'var(--color-text-secondary)' }}>Loading metrics…</p>;
  if (error) return <p style={{ color: 'var(--color-danger)' }}>{error}</p>;
  if (!metrics) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-2)' }}>
      {[
        { label: 'Total Users', value: metrics.total_users },
        { label: 'Lawyers', value: metrics.total_lawyers },
        { label: 'Citizens', value: metrics.total_citizens },
        { label: 'Cases', value: metrics.total_cases },
        { label: 'Verified Marketplace Profiles', value: metrics.verified_marketplace_profiles },
        { label: 'Unverified Profiles', value: metrics.unverified_marketplace_profiles },
      ].map((item) => (
        <Card key={item.label} style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 var(--spacing-1)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            {item.label}
          </p>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: 'var(--color-primary)' }}>
            {item.value ?? 0}
          </p>
        </Card>
      ))}
    </div>
  );
}

// ─── Tab: Pending Lawyer Registrations ────────────────────────────────────────
function PendingLawyersTab({ showToast }) {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getPendingLawyers();
      setLawyers(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load pending lawyers');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id) {
    setActionError('');
    try {
      setLawyers((prev) => prev.filter((l) => l.id !== id));
      await approveLawyer(id);
      showToast('✅ Lawyer approved successfully!');
    } catch (err) {
      setActionError(err.response?.data?.error || 'Approval failed');
      await load();
    }
  }

  async function handleRejectSubmit(e) {
    e.preventDefault();
    if (!rejectReason.trim()) return;
    setRejecting(true);
    setActionError('');
    try {
      setLawyers((prev) => prev.filter((l) => l.id !== rejectingId));
      await rejectLawyer(rejectingId, rejectReason.trim());
      showToast('⚠️ Lawyer registration rejected.');
      setRejectingId(null);
      setRejectReason('');
    } catch (err) {
      setActionError(err.response?.data?.error || 'Rejection failed');
      await load();
    } finally {
      setRejecting(false);
    }
  }

  return (
    <div>
      {loading && <p style={{ color: 'var(--color-text-secondary)' }}>Loading…</p>}
      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}
      {actionError && <p style={{ color: 'var(--color-danger)', marginBottom: '12px' }}>{actionError}</p>}

      {!loading && lawyers.length === 0 && (
        <Card><p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>No pending lawyer approvals.</p></Card>
      )}

      {lawyers.map((lawyer) => (
        <Card key={lawyer.id} style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <p style={{ margin: '0 0 2px', fontWeight: 700 }}>{lawyer.name}</p>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>{lawyer.email}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button onClick={() => handleApprove(lawyer.id)} style={{ marginTop: 0, fontSize: '13px', padding: '6px 14px' }}>
                Approve
              </Button>
              <Button
                variant="danger"
                onClick={() => { setRejectingId(lawyer.id); setRejectReason(''); }}
                style={{ marginTop: 0, fontSize: '13px', padding: '6px 14px' }}
              >
                Reject
              </Button>
            </div>
          </div>

          {rejectingId === lawyer.id && (
            <form onSubmit={handleRejectSubmit} style={{ marginTop: 'var(--spacing-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-2)' }}>
              <Input
                label="Rejection reason *"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Documents incomplete"
                required
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button type="submit" variant="danger" disabled={rejecting || !rejectReason.trim()} style={{ marginTop: 0 }}>
                  {rejecting ? 'Rejecting…' : 'Confirm Reject'}
                </Button>
                <Button variant="secondary" onClick={() => setRejectingId(null)} style={{ marginTop: 0 }}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </Card>
      ))}
    </div>
  );
}

// ─── Tab: Marketplace Profile Verification (With Direct WhatsApp Link) ───────
function ProfileVerificationTab({ showToast }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getAllMarketplaceProfilesAdmin();
      setProfiles(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(id) {
    setVerifying(id);
    setError('');
    try {
      setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, is_verified: true } : p)));
      await verifyMarketplaceProfile(id);
      showToast('🎉 Marketplace profile verified successfully!');
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
      await load();
    } finally {
      setVerifying(null);
    }
  }

  const unverifiedCount = profiles.filter((p) => !p.is_verified).length;

  return (
    <div>
      {unverifiedCount > 0 && (
        <div style={{
          padding: '10px 16px', marginBottom: 'var(--spacing-2)', borderRadius: 'var(--radius-sm)',
          backgroundColor: '#FFF7ED', border: '1px solid var(--color-warning)', fontSize: '13px',
        }}>
          ⏳ <strong>{unverifiedCount}</strong> profile{unverifiedCount !== 1 ? 's' : ''} pending verification.
        </div>
      )}

      {loading && <p style={{ color: 'var(--color-text-secondary)' }}>Loading profiles…</p>}
      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {!loading && profiles.length === 0 && (
        <Card><p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>No marketplace profiles found.</p></Card>
      )}

      {profiles.map((profile) => {
        const lawyerName = profile.lawyer?.name || 'Advocate';
        const rawPhone = profile.whatsapp_number ? profile.whatsapp_number.replace(/[^0-9]/g, '') : '';
        const defaultMsg = `Assalam-o-Alaikum Adv. ${lawyerName}, this is LegalHub Admin Team verifying your lawyer marketplace profile application. Please provide your Bar Council License copy.`;
        const waLink = rawPhone ? `https://wa.me/${rawPhone}?text=${encodeURIComponent(defaultMsg)}` : null;

        return (
          <Card key={profile.id} style={{ marginBottom: '14px', borderLeft: profile.is_verified ? '4px solid var(--color-success)' : '4px solid var(--color-warning)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ flex: 1, minWidth: '260px' }}>
                <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '16px' }}>{profile.specialization}</p>
                <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {profile.bio ? `${profile.bio.slice(0, 100)}…` : 'No bio provided'}
                </p>
                <p style={{ margin: '0 0 6px', fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
                  Fee Structure: <strong>{profile.fee_structure || 'Not specified'}</strong> · Cases Won: <strong>{profile.cases_won}</strong>
                </p>
                
                <div style={{
                  padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: '#F3F4F6',
                  border: '1px solid var(--color-border)', display: 'inline-flex', alignItems: 'center', gap: '10px', marginTop: '4px'
                }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-secondary)' }}>
                    📱 WhatsApp Verification: <strong>{profile.whatsapp_number || 'Not provided'}</strong> ({lawyerName})
                  </span>
                  
                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        backgroundColor: '#25D366', color: '#FFFFFF', textDecoration: 'none',
                        fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '4px',
                        display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 6px rgba(37,211,102,0.3)'
                      }}
                    >
                      💬 Send WhatsApp Verification Message
                    </a>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Badge status={profile.is_verified ? 'Paid' : 'Pending'} />
                {!profile.is_verified && (
                  <Button
                    onClick={() => handleVerify(profile.id)}
                    disabled={verifying === profile.id}
                    style={{ marginTop: 0, fontSize: '13px', padding: '6px 14px' }}
                  >
                    {verifying === profile.id ? 'Verifying…' : 'Approve Verification'}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Tab: Audit Logs ──────────────────────────────────────────────────────────
function LogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await getSystemLogs();
        setLogs(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load system logs');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p style={{ color: 'var(--color-text-secondary)' }}>Loading logs…</p>;
  if (error) return <p style={{ color: 'var(--color-danger)' }}>{error}</p>;

  return (
    <div>
      {logs.length === 0 && (
        <Card><p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>No audit logs recorded yet.</p></Card>
      )}

      {logs.map((log) => (
        <Card key={log.id} style={{ marginBottom: '8px', padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>
              [{log.action}] {log.details}
            </span>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
              {new Date(log.createdAt).toLocaleString()}
            </span>
          </div>
          {log.ip_address && (
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              IP: {log.ip_address}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}

export default AdminPanel;
