import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCaseById, updateCaseStatus } from '../api/caseApi';
import { getHearings, addHearing } from '../api/hearingApi';
import { getEntries, addEntry, getAISummary } from '../api/entryApi';
import { getDocuments, uploadDocument } from '../api/documentApi';
import { getFees, addFee, updateFeeStatus, submitPaymentReceiptApi, verifyPaymentReceiptApi } from '../api/feeApi';
import { Card, Badge, Button, Input } from '../components/ui';
import CitizenProfileModal from '../components/CitizenProfileModal';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [showClientModal, setShowClientModal] = useState(false);

  return (
    <>
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

          {caseData.client_id && (
            <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
              <button
                type="button"
                onClick={() => setShowClientModal(true)}
                style={{
                  backgroundColor: 'rgba(15,92,60,0.1)', color: 'var(--color-primary)',
                  border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-sm)',
                  padding: '8px 14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '6px'
                }}
              >
                <span>👤</span> View Client Profile (Fiverr / Freelancer Buyer Card)
              </button>
            </div>
          )}
        </div>
      </Card>

      <CitizenProfileModal
        citizenId={caseData.client_id}
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
      />
    </>
  );
}

/* ─── Entries Tab with AI Petition Summarization ─────────────────── */
function EntriesTab({ caseId, isLawyer }) {
  const [entries, setEntries] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // AI Summary State
  const [aiState, setAiState] = useState({ loading: false, data: null, unavailable: false });

  useEffect(() => {
    setLoading(true);
    getEntries(caseId)
      .then((data) => {
        setEntries(data);
        if (data && data.length > 0 && isLawyer) {
          fetchAi(caseId);
        }
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load entries'))
      .finally(() => setLoading(false));
  }, [caseId, isLawyer]);

  async function fetchAi(id) {
    setAiState({ loading: true, data: null, unavailable: false });
    try {
      const res = await getAISummary(id);
      if (res && res.available && res.summary) {
        setAiState({ loading: false, data: res, unavailable: false });
      } else {
        setAiState({ loading: false, data: null, unavailable: !res?.isFirstEntry });
      }
    } catch {
      setAiState({ loading: false, data: null, unavailable: true });
    }
  }

  async function handleAdd() {
    if (!text.trim()) return;
    setSubmitting(true); setError('');
    try {
      const created = await addEntry(caseId, { entry_text: text.trim() });
      const updatedEntries = [created, ...entries];
      setEntries(updatedEntries);
      setText('');
      if (updatedEntries.length > 0 && isLawyer) {
        fetchAi(caseId);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add entry');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {isLawyer && (
        <Card style={{ marginBottom: 'var(--spacing-3)' }}>
          <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: '15px', color: 'var(--color-secondary)' }}>
            Add Case Update
          </p>

          {/* AI Petition Summary Box (Only shown if case has 1+ previous entries) */}
          {entries.length > 0 && (
            <AnimatePresence mode="wait">
              {aiState.loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    backgroundColor: 'rgba(201,162,39,0.1)',
                    border: '1px solid rgba(201,162,39,0.35)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 16px',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13px',
                    color: 'var(--color-secondary)'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>✨</span>
                  <span><strong>AI is analyzing previous petition entries...</strong></span>
                </motion.div>
              )}

              {!aiState.loading && aiState.data && (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    backgroundColor: '#FEFCE8',
                    border: '1.5px solid #FDE047',
                    borderRadius: 'var(--radius-sm)',
                    padding: '14px 16px',
                    marginBottom: '14px',
                    boxShadow: '0 2px 8px rgba(201,162,39,0.12)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700, color: '#854D0E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <span>✨</span> Last Hearing Summary (AI Generated)
                    </div>
                    <span style={{ fontSize: '11px', color: '#A16207', fontWeight: 600, backgroundColor: '#FEF9C3', padding: '2px 8px', borderRadius: '9999px' }}>
                      falconsai/summarization
                    </span>
                  </div>

                  <p style={{ margin: '0 0 8px', fontSize: '13.5px', color: '#1E293B', lineHeight: 1.55 }}>
                    {aiState.data.summary}
                  </p>

                  {aiState.data.keywords && aiState.data.keywords.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      {aiState.data.keywords.map((kw, i) => (
                        <span key={i} style={{ fontSize: '11px', fontWeight: 600, backgroundColor: 'rgba(201,162,39,0.2)', color: '#854D0E', padding: '2px 7px', borderRadius: '4px' }}>
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}

                  <p style={{ margin: 0, fontSize: '11px', color: '#A16207', fontStyle: 'italic' }}>
                    ℹ️ This summary was generated by AI. Please confirm against your own records.
                  </p>
                </motion.div>
              )}

              {!aiState.loading && aiState.unavailable && (
                <motion.div
                  key="unavailable"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    backgroundColor: '#F3F4F6',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    marginBottom: '14px',
                    fontSize: '12.5px',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  ℹ️ AI summary is not available right now. Please enter manually.
                </motion.div>
              )}
            </AnimatePresence>
          )}

          <textarea
            value={text} onChange={(e) => setText(e.target.value)}
            rows={3} placeholder="Record new progress or court notes..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
          />
          {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px', margin: '4px 0' }}>{error}</p>}
          <Button onClick={handleAdd} disabled={submitting || !text.trim()}>
            {submitting ? 'Saving…' : 'Add Entry'}
          </Button>
        </Card>
      )}

      {loading && <p style={{ color: 'var(--color-text-secondary)' }}>Loading entries…</p>}
      {!loading && entries.length === 0 && <Card><p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>No entries recorded yet.</p></Card>}

      {entries.map((entry) => (
        <Card key={entry.id} style={{ marginBottom: '10px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '14px', lineHeight: 1.5 }}>{entry.entry_text}</p>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            {new Date(entry.entry_date || entry.createdAt).toLocaleString('en-PK')}
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
    setSubmitting(true); setError('');
    try {
      const created = await addHearing(caseId, { hearing_date: date, notes: notes.trim() });
      setHearings([created, ...hearings]);
      setDate(''); setNotes('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to schedule hearing');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {isLawyer && (
        <Card style={{ marginBottom: 'var(--spacing-3)' }}>
          <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: '14px' }}>Schedule New Hearing</p>
          <Input label="Hearing Date & Time *" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
          <Input label="Notes / Bench Details" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Arguments on stay application" />
          {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px', margin: '4px 0' }}>{error}</p>}
          <Button onClick={handleAdd} disabled={submitting || !date}>
            {submitting ? 'Scheduling…' : 'Schedule Hearing'}
          </Button>
        </Card>
      )}

      {loading && <p style={{ color: 'var(--color-text-secondary)' }}>Loading hearings…</p>}
      {!loading && hearings.length === 0 && <Card><p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>No hearings scheduled.</p></Card>}

      {hearings.map((h) => (
        <Card key={h.id} style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '14px' }}>
                📅 {new Date(h.hearing_date).toLocaleString('en-PK')}
              </p>
              {h.notes && <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>{h.notes}</p>}
            </div>
            <Badge status={h.outcome || 'Scheduled'} />
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ─── Documents Tab ──────────────────────────────────────────────── */
function DocumentsTab({ caseId, isLawyer }) {
  const [documents, setDocuments] = useState([]);
  const [name, setName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getDocuments(caseId)
      .then(setDocuments)
      .catch((err) => setError(err.response?.data?.error || 'Failed to load documents'))
      .finally(() => setLoading(false));
  }, [caseId]);

  async function handleUpload() {
    if (!name.trim() || !fileUrl.trim()) return;
    setSubmitting(true); setError('');
    try {
      const created = await uploadDocument(caseId, { document_name: name.trim(), file_url: fileUrl.trim() });
      setDocuments([created, ...documents]);
      setName(''); setFileUrl('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to attach document');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {isLawyer && (
        <Card style={{ marginBottom: 'var(--spacing-3)' }}>
          <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: '14px' }}>Attach Document</p>
          <Input label="Document Title *" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Power of Attorney (Vakalatnama)" required />
          <Input label="File URL / Cloud Link *" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://..." required />
          {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px', margin: '4px 0' }}>{error}</p>}
          <Button onClick={handleUpload} disabled={submitting || !name.trim() || !fileUrl.trim()}>
            {submitting ? 'Attaching…' : 'Attach Document'}
          </Button>
        </Card>
      )}

      {loading && <p style={{ color: 'var(--color-text-secondary)' }}>Loading documents…</p>}
      {!loading && documents.length === 0 && <Card><p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>No documents attached.</p></Card>}

      {documents.map((doc) => (
        <Card key={doc.id} style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '14px' }}>📄 {doc.document_name}</p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                Uploaded {new Date(doc.uploaded_at || doc.createdAt).toLocaleDateString('en-PK')}
              </p>
            </div>
            {doc.file_url && (
              <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '13px' }}>
                Open Document →
              </a>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ─── Fees Tab ───────────────────────────────────────────────────── */
function FeesTab({ caseId, isLawyer }) {
  const [fees, setFees] = useState([]);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Receipt Modal State for Client
  const [selectedFeeForReceipt, setSelectedFeeForReceipt] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('JazzCash');
  const [transactionId, setTransactionId] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptSubmitting, setReceiptSubmitting] = useState(false);

  // Lawyer Verification Action
  const [verifyingFeeId, setVerifyingFeeId] = useState(null);

  useEffect(() => {
    loadFees();
  }, [caseId]);

  function loadFees() {
    setLoading(true);
    getFees(caseId)
      .then(setFees)
      .catch((err) => setError(err.response?.data?.error || 'Failed to load fee ledger'))
      .finally(() => setLoading(false));
  }

  async function handleAdd() {
    if (!amount || isNaN(amount)) return;
    setSubmitting(true); setError('');
    try {
      const created = await addFee({ case_id: caseId, amount: Number(amount), description: desc.trim() });
      setFees([created, ...fees]);
      setAmount(''); setDesc('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add fee record');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitReceipt(e) {
    e.preventDefault();
    if (!selectedFeeForReceipt || !receiptUrl.trim()) return;
    setReceiptSubmitting(true);
    try {
      const updated = await submitPaymentReceiptApi(selectedFeeForReceipt.id, {
        receipt_url: receiptUrl.trim(),
        payment_method: paymentMethod,
        transaction_id: transactionId.trim() || 'TID-' + Math.floor(100000 + Math.random() * 900000),
      });
      setFees(fees.map((f) => (f.id === selectedFeeForReceipt.id ? updated : f)));
      setSelectedFeeForReceipt(null);
      setReceiptUrl(''); setTransactionId('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit payment receipt');
    } finally {
      setReceiptSubmitting(false);
    }
  }

  async function handleVerifyReceipt(feeId, approved, rejectionReason = '') {
    setVerifyingFeeId(feeId);
    try {
      const updated = await verifyPaymentReceiptApi(feeId, { approved, rejection_reason: rejectionReason });
      setFees(fees.map((f) => (f.id === feeId ? updated : f)));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to verify payment receipt');
    } finally {
      setVerifyingFeeId(null);
    }
  }

  return (
    <div>
      {isLawyer && (
        <Card style={{ marginBottom: 'var(--spacing-3)' }}>
          <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: '14px' }}>Add Fee / Retainer Invoice</p>
          <Input label="Amount (PKR) *" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50000" required />
          <Input label="Fee Description" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. High Court Writ Petition Retainer Fee" />
          {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px', margin: '4px 0' }}>{error}</p>}
          <Button onClick={handleAdd} disabled={submitting || !amount}>
            {submitting ? 'Adding…' : 'Issue Fee Invoice'}
          </Button>
        </Card>
      )}

      {loading && <p style={{ color: 'var(--color-text-secondary)' }}>Loading fee ledger…</p>}
      {!loading && fees.length === 0 && <Card><p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>No fee entries recorded for this case.</p></Card>}

      {fees.map((fee) => {
        const isPendingVerification = fee.status === 'Pending_Verification';
        const isPaid = fee.status === 'Paid';
        const isRejected = fee.status === 'Rejected';

        return (
          <Card key={fee.id} style={{ marginBottom: '12px', borderLeft: isPaid ? '4px solid #10B981' : isPendingVerification ? '4px solid #F59E0B' : isRejected ? '4px solid #EF4444' : '4px solid #3B82F6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 800, fontSize: '16px', color: 'var(--color-primary)' }}>
                  PKR {Number(fee.amount).toLocaleString('en-PK')}
                </p>
                {fee.description && <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{fee.description}</p>}
                
                {fee.payment_method && (
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    💳 Method: <strong>{fee.payment_method}</strong> {fee.transaction_id && `(TID: ${fee.transaction_id})`}
                  </p>
                )}

                {fee.receipt_url && (
                  <div style={{ marginTop: '8px' }}>
                    <a href={fee.receipt_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'underline' }}>
                      📄 View Uploaded Payment Receipt Proof ↗
                    </a>
                  </div>
                )}

                {isRejected && fee.rejection_reason && (
                  <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#DC2626', backgroundColor: '#FEF2F2', padding: '6px 10px', borderRadius: '4px' }}>
                    ⚠️ Rejection Reason: {fee.rejection_reason}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <Badge status={isPendingVerification ? 'Pending Verification' : fee.status} />

                {/* Client Receipt Upload Action */}
                {!isLawyer && (fee.status === 'Pending' || isRejected) && (
                  <Button
                    onClick={() => setSelectedFeeForReceipt(fee)}
                    style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: 'var(--color-primary)' }}
                  >
                    💳 Upload Payment Receipt
                  </Button>
                )}

                {/* Lawyer Verification Actions */}
                {isLawyer && isPendingVerification && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <Button
                      onClick={() => handleVerifyReceipt(fee.id, true)}
                      disabled={verifyingFeeId === fee.id}
                      style={{ fontSize: '12px', padding: '5px 10px', backgroundColor: '#10B981' }}
                    >
                      ✓ Approve Payment
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const reason = prompt('Enter rejection reason for client:', 'Receipt image unreadable or invalid transaction ID.');
                        if (reason) handleVerifyReceipt(fee.id, false, reason);
                      }}
                      disabled={verifyingFeeId === fee.id}
                      style={{ fontSize: '12px', padding: '5px 10px', color: '#DC2626', borderColor: '#FCA5A5' }}
                    >
                      ✕ Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}

      {/* Client Receipt Upload Modal */}
      {selectedFeeForReceipt && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <Card style={{ width: '100%', maxWidth: '480px', backgroundColor: '#FFFFFF' }}>
            <h3 style={{ margin: '0 0 12px', color: 'var(--color-primary)', fontSize: '16px' }}>Upload Payment Receipt</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              Invoice Amount: <strong>PKR {Number(selectedFeeForReceipt.amount).toLocaleString('en-PK')}</strong>
            </p>

            <form onSubmit={handleSubmitReceipt} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                >
                  <option value="JazzCash">JazzCash Mobile Transfer</option>
                  <option value="EasyPaisa">EasyPaisa Account</option>
                  <option value="Bank Transfer">Online Bank Transfer / Raast</option>
                </select>
              </div>

              <Input
                label="Transaction ID / Reference Number *"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. TID-984210394"
                required
              />

              <Input
                label="Receipt Image URL / File Link *"
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                placeholder="https://example.com/receipt.jpg"
                required
              />

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <Button variant="secondary" type="button" onClick={() => setSelectedFeeForReceipt(null)}>Cancel</Button>
                <Button type="submit" disabled={receiptSubmitting}>
                  {receiptSubmitting ? 'Submitting…' : 'Submit Receipt for Verification'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

export default CaseDetail;