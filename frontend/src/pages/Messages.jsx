import { useState, useEffect, useRef } from 'react';
import { getCases } from '../api/caseApi';
import { getMessages, sendMessage } from '../api/messageApi';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import CitizenProfileModal from '../components/CitizenProfileModal';

const pageVariants = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };

function Skel({ w = '100%', h = '16px', style }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: 'var(--radius-sm)', ...style }} />;
}

function Messages() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  // Client Profile Modal State (Fiverr/Freelancer Buyer Profile)
  const [selectedClientModalId, setSelectedClientModalId] = useState(null);

  // Mobile: track which panel is visible
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);
  const [showThread, setShowThread] = useState(false);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    getCases()
      .then(setCases)
      .catch(() => setError('Failed to load cases'))
      .finally(() => setLoadingCases(false));
  }, []);

  useEffect(() => {
    if (!selectedCase) return;
    setLoadingMsgs(true); setError('');
    getMessages(selectedCase.id)
      .then(setMessages)
      .catch((err) => setError(err.response?.data?.error || 'Failed to load messages'))
      .finally(() => setLoadingMsgs(false));
  }, [selectedCase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !selectedCase) return;
    setSending(true); setError('');
    try {
      await sendMessage({ case_id: selectedCase.id, message_text: text.trim() });
      setText('');
      const updated = await getMessages(selectedCase.id);
      setMessages(updated);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  function selectCase(c) {
    setSelectedCase(c);
    if (isMobile) setShowThread(true);
  }

  /* ── Case list panel ───────────────────────────────── */
  const CaseListPanel = (
    <div style={{
      width: isMobile ? '100%' : '280px',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: 'var(--color-secondary)' }}>
        Select a Case Thread
      </h2>
      {loadingCases && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <Skel w="70%" h="14px" style={{ marginBottom: '6px' }} />
              <Skel w="50%" h="11px" />
            </div>
          ))}
        </div>
      )}
      {!loadingCases && cases.length === 0 && (
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>No active case threads.</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto' }}>
        {cases.map((c) => {
          const active = selectedCase?.id === c.id;
          return (
            <div
              key={c.id}
              onClick={() => selectCase(c)}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: active ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: active ? 'rgba(15, 92, 60, 0.08)' : 'var(--color-surface)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <p style={{ fontWeight: active ? 700 : 600, margin: '0 0 2px', fontSize: '13.5px', color: active ? 'var(--color-primary)' : 'var(--color-secondary)' }}>
                {c.case_number}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {c.court_name}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ── Thread / Messages panel ───────────────────────── */
  const ThreadPanel = (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '16px',
      height: '560px',
    }}>
      {isMobile && (
        <button
          onClick={() => setShowThread(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 600, fontSize: '13px', marginBottom: '8px', textAlign: 'left' }}
        >
          ← Back to Cases
        </button>
      )}

      {!selectedCase ? (
        <Card style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0 }}>
            Select a case on the left to start messaging.
          </p>
        </Card>
      ) : (
        <>
          {/* Case header with Client Profile button */}
          <div style={{
            backgroundColor: '#F9FAFB', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: '12px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px'
          }}>
            <div>
              <p style={{ margin: '0 0 2px', fontWeight: 700, fontFamily: 'var(--font-heading)', fontSize: '14px', color: 'var(--color-secondary)' }}>
                {selectedCase.case_number}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {selectedCase.court_name} · {selectedCase.case_type}
              </p>
            </div>

            {selectedCase.client_id && (
              <button
                type="button"
                onClick={() => setSelectedClientModalId(selectedCase.client_id)}
                style={{
                  backgroundColor: 'rgba(15,92,60,0.1)', color: 'var(--color-primary)',
                  border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-sm)',
                  padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 6px rgba(15,92,60,0.1)'
                }}
              >
                <span>👤</span> View Client Profile
              </button>
            )}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '12px', minHeight: 0 }}>
            {loadingMsgs && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 0' }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ display: 'flex', justifyContent: i % 2 === 0 ? 'flex-end' : 'flex-start' }}>
                    <Skel w="55%" h="48px" style={{ borderRadius: '16px' }} />
                  </div>
                ))}
              </div>
            )}
            {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px', textAlign: 'center' }}>{error}</p>}
            {!loadingMsgs && messages.length === 0 && (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>
                No messages yet. Send the first message below.
              </p>
            )}
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}
                  >
                    <div style={{
                      maxWidth: '72%', padding: '10px 14px',
                      borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      backgroundColor: isMine ? 'var(--color-primary)' : '#F3F4F6',
                      color: isMine ? '#FFFFFF' : 'var(--color-text)',
                      border: isMine ? 'none' : '1px solid var(--color-border)',
                      fontSize: '14px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    }}>
                      <p style={{ margin: '0 0 4px', lineHeight: 1.5 }}>{msg.message_text}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: isMine ? 'rgba(255,255,255,0.7)' : 'var(--color-text-secondary)', textAlign: 'right' }}>
                        {new Date(msg.sent_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          {/* Compose */}
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', marginTop: '8px', flexShrink: 0 }}>
            <input
              type="text" value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message…"
              style={{
                flex: 1, padding: '10px 14px',
                border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                fontSize: '14px', fontFamily: 'var(--font-body)', color: 'var(--color-text)',
                backgroundColor: 'var(--color-surface)', outline: 'none',
                transition: 'border-color 0.15s ease', minHeight: '42px',
              }}
            />
            <Button type="submit" disabled={sending || !text.trim()} style={{ marginTop: 0, minHeight: '42px' }}>
              {sending ? 'Sending…' : 'Send'}
            </Button>
          </form>
        </>
      )}
    </div>
  );

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 700, margin: '0 0 4px', color: 'var(--color-secondary)' }}>
          Case Messaging
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0 }}>
          Real-time updates and secure client-advocate messaging per case.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {!isMobile && CaseListPanel}
        {!isMobile && ThreadPanel}

        {isMobile && !showThread && CaseListPanel}
        {isMobile && showThread && ThreadPanel}
      </div>

      {/* Fiverr / Freelancer Style Client Profile Popup Modal */}
      <CitizenProfileModal
        citizenId={selectedClientModalId}
        isOpen={Boolean(selectedClientModalId)}
        onClose={() => setSelectedClientModalId(null)}
      />
    </motion.div>
  );
}

export default Messages;
