import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createFirm, getFirmById, addFirmMember, getFirmMembers } from '../api/firmApi';
import { motion } from 'framer-motion';
import { Card, Button, Input } from '../components/ui';

function FirmManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [firm, setFirm] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create firm
  const [firmName, setFirmName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Add member
  const [memberEmail, setMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState('');
  const [memberSuccess, setMemberSuccess] = useState('');

  const isOwner = firm && firm.owner_id === user?.id;

  // Redirect non-lawyers away
  useEffect(() => {
    if (user && user.role !== 'lawyer') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    loadFirm();
  }, [user?.firm_id]);

  async function loadFirm() {
    if (!user?.firm_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [firmData, membersData] = await Promise.all([
        getFirmById(user.firm_id),
        getFirmMembers(user.firm_id),
      ]);
      setFirm(firmData);
      setMembers(membersData);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load firm');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateFirm(e) {
    e.preventDefault();
    if (!firmName.trim()) { setCreateError('Firm name is required'); return; }
    setCreating(true);
    setCreateError('');
    try {
      const created = await createFirm(firmName.trim());
      // Update user object in localStorage with the new firm_id so subsequent loads work
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      storedUser.firm_id = created.id;
      localStorage.setItem('user', JSON.stringify(storedUser));
      setFirm(created);
      setMembers([]);
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create firm');
    } finally {
      setCreating(false);
    }
  }

  async function handleAddMember(e) {
    e.preventDefault();
    if (!memberEmail.trim()) return;
    setAddingMember(true);
    setMemberError('');
    setMemberSuccess('');
    try {
      const added = await addFirmMember(firm.id, memberEmail.trim());
      setMemberEmail('');
      setMemberSuccess(`${added.name} (${added.email}) added successfully.`);
      // Refresh members
      const updated = await getFirmMembers(firm.id);
      setMembers(updated);
    } catch (err) {
      setMemberError(err.response?.data?.error || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  }

  if (loading) return <p style={{ color: 'var(--color-text-secondary)' }}>Loading…</p>;
  if (error)   return <p style={{ color: 'var(--color-danger)' }}>{error}</p>;

  // ── No firm yet: show create form ─────────────────────────────────────────
  if (!firm) {
    return (
      <div>
        <h2 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 var(--spacing-3)', color: 'var(--color-secondary)' }}>
          Firm Management
        </h2>
        <Card style={{ maxWidth: '480px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 var(--spacing-2)', fontSize: '16px' }}>
            Create Your Firm
          </h3>
          <p style={{ margin: '0 0 var(--spacing-2)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Create a firm to collaborate with other lawyers, share cases, and build your practice.
          </p>
          <form onSubmit={handleCreateFirm}>
            <Input
              label="Firm Name *"
              value={firmName}
              onChange={(e) => setFirmName(e.target.value)}
              placeholder="e.g. Hassan & Associates"
              required
            />
            {createError && <p style={{ color: 'var(--color-danger)', fontSize: '13px' }}>{createError}</p>}
            <Button type="submit" disabled={creating}>
              {creating ? 'Creating…' : 'Create Firm'}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  // ── Has firm: show details + members ─────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 var(--spacing-3)', color: 'var(--color-secondary)' }}>
        Firm Management
      </h2>

      {/* Firm info */}
      <Card style={{ marginBottom: 'var(--spacing-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 4px', color: 'var(--color-secondary)' }}>
              {firm.name}
            </h3>
            <p style={{ margin: '0 0 2px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Firm ID: {firm.id}
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Created: {new Date(firm.created_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {isOwner && (
            <span style={{
              padding: '3px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700,
              backgroundColor: '#F0FDF4', color: 'var(--color-success)',
              border: '1px solid var(--color-success)',
            }}>
              Owner
            </span>
          )}
        </div>
      </Card>

      {/* Add member form — only for owner */}
      {isOwner && (
        <Card style={{ marginBottom: 'var(--spacing-3)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 var(--spacing-2)', fontSize: '15px' }}>
            Add a Member
          </h3>
          <p style={{ margin: '0 0 var(--spacing-2)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Enter the email address of a registered lawyer to add them to your firm.
          </p>
          <form onSubmit={handleAddMember}>
            <Input
              label="Lawyer Email *"
              type="email"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="lawyer@example.com"
              required
            />
            {memberError   && <p style={{ color: 'var(--color-danger)',  fontSize: '13px' }}>{memberError}</p>}
            {memberSuccess && <p style={{ color: 'var(--color-success)', fontSize: '13px' }}>{memberSuccess}</p>}
            <Button type="submit" disabled={addingMember || !memberEmail.trim()}>
              {addingMember ? 'Adding…' : 'Add Member'}
            </Button>
          </form>
        </Card>
      )}

      {/* Members list */}
      <h3 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 var(--spacing-2)', color: 'var(--color-secondary)' }}>
        Members ({members.length})
      </h3>

      {members.length === 0 && (
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
          {isOwner ? 'No members yet. Add lawyers using the form above.' : 'No other members in this firm.'}
        </p>
      )}

      {members.map((m) => (
        <Card key={m.id} style={{ marginBottom: '8px', padding: '12px var(--spacing-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 2px', fontWeight: 700 }}>{m.name}</p>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>{m.email}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{
                padding: '2px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600,
                backgroundColor: '#EFF6FF', color: 'var(--color-info)',
              }}>
                {m.role}
              </span>
              {m.id === firm.owner_id && (
                <span style={{
                  padding: '2px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600,
                  backgroundColor: '#F0FDF4', color: 'var(--color-success)',
                }}>
                  Owner
                </span>
              )}
            </div>
          </div>
        </Card>
      ))}
    </motion.div>
  );
}

export default FirmManagement;
