import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCases, createCase } from '../api/caseApi';
import { useAuth } from '../context/AuthContext';
import { Card, Badge, Button, Input } from '../components/ui';

const CASE_TYPES = [
  'Civil', 'Criminal', 'Family', 'Property / Land Dispute',
  'Corporate', 'Labor', 'Tax', 'Constitutional', 'Banking', 'Consumer',
];

function Cases() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [caseNumber, setCaseNumber] = useState('');
  const [courtName, setCourtName] = useState('');
  const [caseType, setCaseType] = useState(CASE_TYPES[0]);
  const [clientId, setClientId] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCases();
  }, []);

  async function fetchCases() {
    setLoading(true);
    setError('');
    try {
      const data = await getCases();
      setCases(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load cases');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!caseNumber.trim() || !courtName.trim()) {
      setFormError('Case number and court name are required.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await createCase({
        case_number: caseNumber,
        court_name: courtName,
        case_type: caseType,
        client_id: clientId.trim() || undefined,
      });
      setCaseNumber(''); setCourtName(''); setCaseType(CASE_TYPES[0]); setClientId('');
      setShowForm(false);
      await fetchCases();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create case');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-secondary)', margin: 0 }}>Cases</h2>
        {user?.role === 'lawyer' && (
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Case'}
          </Button>
        )}
      </div>

      {showForm && (
        <Card style={{ marginBottom: 'var(--spacing-3)' }}>
          <h3 style={{ margin: '0 0 var(--spacing-2)', fontFamily: 'var(--font-heading)' }}>Create New Case</h3>
          <form onSubmit={handleCreate}>
            <Input
              label="Case Number"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              placeholder="e.g. CIV-2026-001"
              required
            />
            <Input
              label="Court Name"
              value={courtName}
              onChange={(e) => setCourtName(e.target.value)}
              placeholder="e.g. Lahore High Court"
              required
            />
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
                Case Type
              </label>
              <select
                value={caseType}
                onChange={(e) => setCaseType(e.target.value)}
                style={{
                  display: 'block', width: '100%', padding: '9px 12px',
                  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                  fontSize: '14px', fontFamily: 'var(--font-body)', color: 'var(--color-text)',
                  backgroundColor: 'var(--color-surface)', boxSizing: 'border-box',
                }}
              >
                {CASE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <Input
              label="Client ID (optional)"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="UUID of the client user"
            />
            {formError && <p style={{ color: 'var(--color-danger)', fontSize: '13px' }}>{formError}</p>}
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Case'}
            </Button>
          </form>
        </Card>
      )}

      {loading && <p style={{ color: 'var(--color-text-secondary)' }}>Loading cases…</p>}
      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {!loading && cases.length === 0 && (
        <Card>
          <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>
            No cases yet. {user?.role === 'lawyer' ? 'Create your first case above.' : 'No cases assigned to you yet.'}
          </p>
        </Card>
      )}

      {cases.map((c) => (
        <Card
          key={c.id}
          style={{ marginBottom: '12px', cursor: 'pointer' }}
          onClick={() => navigate(`/cases/${c.id}`)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 700, margin: '0 0 4px', fontFamily: 'var(--font-heading)' }}>{c.case_number}</p>
              <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                {c.court_name} · {c.case_type}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {new Date(c.created_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>
            <Badge status={c.status} />
          </div>
        </Card>
      ))}
    </div>
  );
}

export default Cases;
