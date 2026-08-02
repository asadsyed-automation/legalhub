import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCases, createCase } from '../api/caseApi';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const CASE_TYPES = [
  'Civil', 'Criminal', 'Family', 'Property / Land Dispute',
  'Corporate', 'Labor', 'Tax', 'Constitutional', 'Banking', 'Consumer',
];

const pageVariants = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };
const listVariants = { animate: { transition: { staggerChildren: 0.04 } } };
const itemVariants = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

function Skel({ w = '100%', h = '16px', style }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: 'var(--radius-sm)', ...style }} />;
}

const selectStyle = {
  display: 'block', width: '100%', padding: '10px 13px',
  border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
  fontSize: '14px', fontFamily: 'var(--font-body)', color: 'var(--color-text)',
  backgroundColor: 'var(--color-surface)', boxSizing: 'border-box',
  outline: 'none', minHeight: '42px', marginBottom: '14px',
  transition: 'border-color 0.15s ease',
};

function Cases() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [caseNumber, setCaseNumber] = useState('');
  const [courtName, setCourtName] = useState('');
  const [caseType, setCaseType] = useState(CASE_TYPES[0]);
  const [clientId, setClientId] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchCases(); }, []);

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
    if (!caseNumber.trim() || !courtName.trim()) { setFormError('Case number and court name are required.'); return; }
    setSubmitting(true); setFormError('');
    try {
      await createCase({ case_number: caseNumber, court_name: courtName, case_type: caseType, client_id: clientId.trim() || undefined });
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
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 700, color: 'var(--color-secondary)', margin: '0 0 2px' }}>Cases</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
            {loading ? '…' : `${cases.length} total case${cases.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {user?.role === 'lawyer' && (
          <Button onClick={() => setShowForm(!showForm)} style={{ marginTop: 0 }}>
            {showForm ? '✕ Cancel' : '+ New Case'}
          </Button>
        )}
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', marginBottom: '24px' }}
          >
            <Card>
              <h3 style={{ margin: '0 0 16px', fontFamily: 'var(--font-heading)', fontSize: '16px', color: 'var(--color-secondary)' }}>
                Create New Case
              </h3>
              <form onSubmit={handleCreate}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0 16px' }}>
                  <Input label="Case Number" value={caseNumber} onChange={(e) => setCaseNumber(e.target.value)} placeholder="e.g. CIV-2026-001" required />
                  <Input label="Court Name" value={courtName} onChange={(e) => setCourtName(e.target.value)} placeholder="e.g. Lahore High Court" required />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>Case Type</label>
                  <select value={caseType} onChange={(e) => setCaseType(e.target.value)} style={selectStyle}>
                    {CASE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <Input label="Client ID (optional)" value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="UUID of the client user" />
                {formError && (
                  <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '10px', padding: '8px 12px', backgroundColor: 'rgba(214,69,69,0.08)', borderRadius: 'var(--radius-sm)' }}>
                    {formError}
                  </p>
                )}
                <Button type="submit" disabled={submitting} style={{ marginTop: 0 }}>
                  {submitting ? 'Creating…' : 'Create Case'}
                </Button>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p style={{ color: 'var(--color-danger)', marginBottom: '16px' }}>{error}</p>}

      {/* Skeleton loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <Skel w="35%" h="16px" style={{ marginBottom: '8px' }} />
                <Skel w="55%" h="12px" style={{ marginBottom: '6px' }} />
                <Skel w="25%" h="11px" />
              </div>
              <Skel w="64px" h="22px" style={{ borderRadius: '9999px' }} />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && cases.length === 0 && (
        <Card>
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <p style={{ fontSize: '36px', marginBottom: '12px' }}>📂</p>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              {user?.role === 'lawyer' ? 'No cases yet. Create your first case above.' : 'No cases assigned to you yet.'}
            </p>
          </div>
        </Card>
      )}

      {/* Cases list with stagger */}
      {!loading && cases.length > 0 && (
        <motion.div variants={listVariants} initial="initial" animate="animate">
          {cases.map((c) => (
            <motion.div key={c.id} variants={itemVariants}>
              <Card
                style={{ marginBottom: '12px' }}
                onClick={() => navigate(`/cases/${c.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, margin: '0 0 4px', fontFamily: 'var(--font-heading)', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.case_number}
                    </p>
                    <p style={{ margin: '0 0 3px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                      {c.court_name} · {c.case_type}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      {new Date(c.created_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <Badge status={c.status} />
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

export default Cases;
