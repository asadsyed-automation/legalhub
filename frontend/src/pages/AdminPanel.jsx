import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getPendingLawyers,
  approveLawyer,
  rejectLawyer,
  verifyMarketplaceProfile,
  getAllUsers,
  getAllMarketplaceProfilesAdmin,
} from '../api/adminApi';
import { Card, Badge, Button, Input } from '../components/ui';

const TABS = ['Pending Lawyers', 'Profile Verification', 'All Users'];

function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Hard redirect if not admin — do not just hide the link
  if (user?.role !== 'admin') {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const [activeTab, setActiveTab] = useState('Pending Lawyers');

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 var(--spacing-3)', color: 'var(--color-secondary)' }}>
        Admin Panel
      </h2>

      {/* Tab navigation */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--color-border)', marginBottom: 'var(--spacing-3)' }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: activeTab === tab ? 700 : 400, fontSize: '14px',
              fontFamily: 'var(--font-body)',
              color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-2px',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Pending Lawyers'      && <PendingLawyersTab />}
      {activeTab === 'Profile Verification' && <ProfileVerificationTab />}
      {activeTab === 'All Users'            && <AllUsersTab />}
    </div>
  );
}

// ─── Tab: Pending Lawyer Approvals ───────────────────────────────────────────
function PendingLawyersTab() {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  // Rejection modal state
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
      await approveLawyer(id);
      setLawyers((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      setActionError(err.response?.data?.error || 'Approval failed');
    }
  }

  async function handleRejectSubmit(e) {
    e.preventDefault();
    if (!rejectReason.trim()) return;
    setRejecting(true);
    setActionError('');
    try {
      await rejectLawyer(rejectingId, rejectReason.trim());
      setLawyers((prev) => prev.filter((l) => l.id !== rejectingId));
      setRejectingId(null);
      setRejectReason('');
    } catch (err) {
      setActionError(err.response?.data?.error || 'Rejection failed');
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

          {/* Inline rejection form */}
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

// ─── Tab: Marketplace Profile Verification ───────────────────────────────────
function ProfileVerificationTab() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      // Uses the new admin-only endpoint that returns ALL profiles (verified + unverified)
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
      await verifyMarketplaceProfile(id);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
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

      {loading && <p style={{ color: 'var(--color-text-secondary)' }}>Loading…</p>}
      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {!loading && profiles.length === 0 && (
        <Card><p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>No marketplace profiles found.</p></Card>
      )}

      {profiles.map((profile) => (
        <Card key={profile.id} style={{ marginBottom: '10px', borderLeft: profile.is_verified ? '4px solid var(--color-success)' : '4px solid var(--color-warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <p style={{ margin: '0 0 2px', fontWeight: 700 }}>{profile.specialization}</p>
              <p style={{ margin: '0 0 2px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                Bio: {profile.bio ? `${profile.bio.slice(0, 60)}…` : '—'}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                Cases Won: {profile.cases_won} · ID: {profile.id}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Badge status={profile.is_verified ? 'Paid' : 'Pending'} />
              {!profile.is_verified && (
                <Button
                  onClick={() => handleVerify(profile.id)}
                  disabled={verifying === profile.id}
                  style={{ marginTop: 0, fontSize: '13px', padding: '6px 14px' }}
                >
                  {verifying === profile.id ? 'Verifying…' : 'Verify'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Tab: All Users ──────────────────────────────────────────────────────────
function AllUsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    getAllUsers()
      .then(setUsers)
      .catch((err) => setError(err.response?.data?.error || 'Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const ROLE_COLORS = {
    lawyer:  { bg: '#EFF6FF', text: 'var(--color-info)' },
    citizen: { bg: '#F0FDF4', text: 'var(--color-success)' },
    admin:   { bg: '#FEF2F2', text: 'var(--color-danger)' },
    firm:    { bg: '#FFF7ED', text: 'var(--color-warning)' },
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: 'var(--spacing-2)', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600 }}>Filter by Role</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
              fontSize: '14px', fontFamily: 'var(--font-body)', backgroundColor: 'var(--color-surface)',
            }}
          >
            <option value="all">All roles</option>
            <option value="lawyer">Lawyer</option>
            <option value="citizen">Citizen</option>
            <option value="admin">Admin</option>
            <option value="firm">Firm</option>
          </select>
        </div>
      </div>

      {loading && <p style={{ color: 'var(--color-text-secondary)' }}>Loading…</p>}
      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
        Showing {filtered.length} of {users.length} users
      </p>

      {/* Responsive table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
              {['Name', 'Email', 'Role', 'Verified', 'Joined'].map((h) => (
                <th key={h} style={{
                  textAlign: 'left', padding: '8px 12px', fontWeight: 700,
                  color: 'var(--color-text-secondary)', fontSize: '12px', textTransform: 'uppercase',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const roleStyle = ROLE_COLORS[u.role] || { bg: '#F3F4F6', text: '#6B7280' };
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{u.name}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 10px', borderRadius: '9999px',
                      fontSize: '12px', fontWeight: 600,
                      backgroundColor: roleStyle.bg, color: roleStyle.text,
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      fontSize: '12px', fontWeight: 600,
                      color: u.is_verified ? 'var(--color-success)' : 'var(--color-warning)',
                    }}>
                      {u.is_verified ? '✓ Yes' : '✗ No'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                    {new Date(u.created_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && !loading && (
          <p style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No users match your filters.</p>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
