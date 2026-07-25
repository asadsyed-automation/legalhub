import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCaseById, updateCaseStatus } from '../api/caseApi';
import { getHearings, addHearing } from '../api/hearingApi';
import { getEntries, addEntry } from '../api/entryApi';
import { getDocuments, uploadDocument } from '../api/documentApi';
import { getFees, addFee, updateFeeStatus } from '../api/feeApi';
import { Card, Badge, Button, Input } from '../components/ui';

const CASE_STATUSES = ['Open', 'In Progress', 'Hearing Scheduled', 'Adjourned', 'Decided', 'Closed', 'Archived'];
const TABS = ['Overview', 'Entries', 'Hearings', 'Documents', 'Fees'];

function CaseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const isLawyer = user?.role === 'lawyer';

  const [caseData, setCaseData] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getCaseById(id)
      .then(setCaseData)
      .catch((err) => setError(err.response?.data?.error || 'Failed to load case'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusChange(e) {
    try {
      const updated = await updateCaseStatus(id, e.target.value);
      setCaseData(updated);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  }

  if (loading) return <p style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)' }}>Loading case…</p>;
  if (error)   return <p style={{ padding: 'var(--spacing-3)', color: 'var(--color-danger)' }}>{error}</p>;
  if (!caseData) return <p style={{ padding: 'var(--spacing-3)', color: 'var(--color-danger)' }}>Case not found.</p>;

  return (
    <div>
      {/* Case Header Card */}
      <Card style={{ marginBottom: 'var(--spacing-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 4px', color: 'var(--color-secondary)' }}>
              {caseData.case_number}
            </h2>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              {caseData.court_name} · {caseData.case_type}
            </p>
          </div>
          <div>
            {isLawyer ? (
              <select
                value={caseData.status}
                onChange={handleStatusChange}
                style={{
                  padding: '8px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px',
                  fontFamily: 'var(--font-body)',
                  color: 'var(--color-text)',
                  backgroundColor: 'var(--color-surface)',
                  cursor: 'pointer',
                }}
              >
                {CASE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <Badge status={caseData.status} />
            )}
          </div>
        </div>
      </Card>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex', gap: '0', marginBottom: 'var(--spacing-3)',
        borderBottom: '2px solid var(--color-border)',
      }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: activeTab === tab ? 700 : 400,
              fontSize: '14px',
              color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-2px',
              fontFamily: 'var(--font-body)',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview'  && <OverviewTab  caseData={caseData} />}
      {activeTab === 'Entries'   && <EntriesTab   caseId={id} isLawyer={isLawyer} />}
      {activeTab === 'Hearings'  && <HearingsTab  caseId={id} isLawyer={isLawyer} />}
      {activeTab === 'Documents' && <DocumentsTab caseId={id} isLawyer={isLawyer} />}
      {activeTab === 'Fees'      && <FeesTab      caseId={id} isLawyer={isLawyer} />}
    </div>
  );
}

/* ─── Overview Tab ───────────────────────────────────────────────── */
function OverviewTab({ caseData }) {
  return (
    <Card>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Status</p>
          <Badge status={caseData.status} />
        </div>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Type</p>
          <p style={{ margin: 0 }}>{caseData.case_type}</p>
        </div>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Court</p>
          <p style={{ margin: 0 }}>{caseData.court_name}</p>
        </div>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Opened</p>
          <p style={{ margin: 0 }}>{new Date(caseData.created_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
    </Card>
  );
}

/* ─── Entries Tab ────────────────────────────────────────────────── */
function EntriesTab({ caseId, isLawyer }) {
  const [entries, setEntries] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getEntries(caseId)
      .then(setEntries)
      .catch((err) => setError(err.response?.data?.error || 'Failed to load entries'))
      .finally(() => setLoading(false));
  }, [caseId]);

  async function handleAdd() {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await addEntry({ case_id: caseId, entry_text: text.trim() });
      setText('');
      const updated = await getEntries(caseId);
      setEntries(updated);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add entry');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {isLawyer && (
        <Card style={{ marginBottom: 'var(--spacing-2)' }}>
          <Input
            label="New Entry"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Filed initial petition today…"
          />
          {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px' }}>{error}</p>}
          <Button onClick={handleAdd} disabled={submitting || !text.trim()}>
            {submitting ? 'Adding…' : 'Add Entry'}
          </Button>
        </Card>
      )}
      {loading && <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Loading entries…</p>}
      {entries.length === 0 && !loading && <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>No entries yet.</p>}
      {entries.map((entry) => (
        <Card key={entry.id} style={{ marginBottom: '8px' }}>
          <p style={{ margin: '0 0 6px' }}>{entry.entry_text}</p>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            {new Date(entry.created_at).toLocaleString('en-PK')}
          </p>
        </Card>
      ))}
    </div>
  );
}

/* ─── Hearings Tab ───────────────────────────────────────────────── */
function HearingsTab({ caseId, isLawyer }) {
  const [hearings, setHearings] = useState([]);
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getHearings(caseId)
      .then(setHearings)
      .catch((err) => setError(err.response?.data?.error || 'Failed to load hearings'))
      .finally(() => setLoading(false));
  }, [caseId]);

  async function handleAdd() {
    if (!date) return;
    setSubmitting(true);
    try {
      await addHearing({ case_id: caseId, hearing_date: date, notes });
      setDate(''); setNotes('');
      const updated = await getHearings(caseId);
      setHearings(updated);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add hearing');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {isLawyer && (
        <Card style={{ marginBottom: 'var(--spacing-2)' }}>
          <Input label="Hearing Date & Time" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Witness examination scheduled" />
          {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px' }}>{error}</p>}
          <Button onClick={handleAdd} disabled={submitting || !date}>
            {submitting ? 'Adding…' : 'Add Hearing'}
          </Button>
        </Card>
      )}
      {loading && <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Loading hearings…</p>}
      {hearings.length === 0 && !loading && <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>No hearings scheduled.</p>}
      {hearings.map((h) => (
        <Card key={h.id} style={{ marginBottom: '8px' }}>
          <p style={{ margin: '0 0 4px', fontWeight: 700 }}>
            📅 {new Date(h.hearing_date).toLocaleString('en-PK', { dateStyle: 'long', timeStyle: 'short' })}
          </p>
          {h.notes && <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px' }}>{h.notes}</p>}
        </Card>
      ))}
    </div>
  );
}

/* ─── Documents Tab ──────────────────────────────────────────────── */
function DocumentsTab({ caseId, isLawyer }) {
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);
  const [shared, setShared] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getDocuments(caseId)
      .then(setDocs)
      .catch((err) => setError(err.response?.data?.error || 'Failed to load documents'))
      .finally(() => setLoading(false));
  }, [caseId]);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('case_id', caseId);
      formData.append('is_shared_with_client', shared);
      await uploadDocument(formData);
      setFile(null); setShared(false);
      const updated = await getDocuments(caseId);
      setDocs(updated);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {isLawyer && (
        <Card style={{ marginBottom: 'var(--spacing-2)' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
              Choose File
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              style={{ fontSize: '14px' }}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '14px', cursor: 'pointer' }}>
            <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} />
            Share with client
          </label>
          {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px' }}>{error}</p>}
          <Button onClick={handleUpload} disabled={uploading || !file}>
            {uploading ? 'Uploading…' : 'Upload Document'}
          </Button>
        </Card>
      )}
      {loading && <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Loading documents…</p>}
      {docs.length === 0 && !loading && <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>No documents yet.</p>}
      {docs.map((doc) => (
        <Card key={doc.id} style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <a
              href={doc.file_url}
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none', fontSize: '14px' }}
            >
              📄 View Document
            </a>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              {new Date(doc.created_at).toLocaleDateString('en-PK')}
            </p>
          </div>
          {doc.is_shared_with_client && (
            <span style={{
              fontSize: '11px', fontWeight: 600, color: 'var(--color-success)',
              border: '1px solid var(--color-success)', borderRadius: '9999px', padding: '2px 8px',
            }}>
              Shared
            </span>
          )}
        </Card>
      ))}
    </div>
  );
}

/* ─── Fees Tab ───────────────────────────────────────────────────── */
function FeesTab({ caseId, isLawyer }) {
  const [fees, setFees] = useState([]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getFees(caseId)
      .then(setFees)
      .catch((err) => setError(err.response?.data?.error || 'Failed to load fees'))
      .finally(() => setLoading(false));
  }, [caseId]);

  async function handleAdd() {
    if (!amount) return;
    setSubmitting(true);
    try {
      await addFee({ case_id: caseId, amount: Number(amount) });
      setAmount('');
      const updated = await getFees(caseId);
      setFees(updated);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add fee');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarkPaid(feeId) {
    try {
      await updateFeeStatus(feeId, 'Paid');
      const updated = await getFees(caseId);
      setFees(updated);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to mark paid');
    }
  }

  const totalUnpaid = fees.filter((f) => f.status !== 'Paid').reduce((sum, f) => sum + Number(f.amount), 0);

  return (
    <div>
      {isLawyer && (
        <Card style={{ marginBottom: 'var(--spacing-2)' }}>
          <Input label="Amount (Rs.)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 5000" />
          {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px' }}>{error}</p>}
          <Button onClick={handleAdd} disabled={submitting || !amount}>
            {submitting ? 'Adding…' : 'Add Fee'}
          </Button>
        </Card>
      )}

      {totalUnpaid > 0 && (
        <div style={{
          padding: '10px 16px', marginBottom: '12px', borderRadius: 'var(--radius-sm)',
          backgroundColor: '#FFF7ED', border: '1px solid var(--color-warning)', fontSize: '14px',
        }}>
          Outstanding balance: <strong>Rs. {totalUnpaid.toLocaleString('en-PK')}</strong>
        </div>
      )}

      {loading && <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Loading fees…</p>}
      {fees.length === 0 && !loading && <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>No fees recorded.</p>}
      {fees.map((fee) => (
        <Card key={fee.id} style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontWeight: 700 }}>Rs. {Number(fee.amount).toLocaleString('en-PK')}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Badge status={fee.status} />
            {isLawyer && fee.status !== 'Paid' && (
              <Button variant="secondary" onClick={() => handleMarkPaid(fee.id)} style={{ marginTop: 0, fontSize: '12px', padding: '4px 10px' }}>
                Mark Paid
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

export default CaseDetail;