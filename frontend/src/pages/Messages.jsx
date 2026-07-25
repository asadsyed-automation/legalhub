import { useState, useEffect, useRef } from 'react';
import { getCases } from '../api/caseApi';
import { getMessages, sendMessage } from '../api/messageApi';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/ui';

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

  useEffect(() => {
    getCases()
      .then(setCases)
      .catch(() => setError('Failed to load cases'))
      .finally(() => setLoadingCases(false));
  }, []);

  useEffect(() => {
    if (!selectedCase) return;
    setLoadingMsgs(true);
    setError('');
    getMessages(selectedCase.id)
      .then(setMessages)
      .catch((err) => setError(err.response?.data?.error || 'Failed to load messages'))
      .finally(() => setLoadingMsgs(false));
  }, [selectedCase]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !selectedCase) return;
    setSending(true);
    setError('');
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

  return (
    <div style={{ display: 'flex', gap: 'var(--spacing-3)', height: 'calc(100vh - 130px)' }}>

      {/* Case List Panel */}
      <div style={{ width: '280px', flexShrink: 0, overflowY: 'auto' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 var(--spacing-2)', color: 'var(--color-secondary)' }}>
          Select a Case
        </h3>
        {loadingCases && <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Loading…</p>}
        {cases.length === 0 && !loadingCases && (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>No cases available.</p>
        )}
        {cases.map((c) => (
          <div
            key={c.id}
            onClick={() => setSelectedCase(c)}
            style={{
              padding: '12px',
              marginBottom: '8px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              backgroundColor: selectedCase?.id === c.id ? 'var(--color-primary)' : 'var(--color-surface)',
              color: selectedCase?.id === c.id ? '#FFFFFF' : 'var(--color-text)',
              border: '1px solid var(--color-border)',
              transition: 'background-color 0.15s',
            }}
          >
            <p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>{c.case_number}</p>
            <p style={{
              margin: '2px 0 0', fontSize: '12px',
              color: selectedCase?.id === c.id ? 'rgba(255,255,255,0.75)' : 'var(--color-text-secondary)',
            }}>
              {c.court_name}
            </p>
          </div>
        ))}
      </div>

      {/* Message Thread Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {!selectedCase ? (
          <Card style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>← Select a case to view messages</p>
          </Card>
        ) : (
          <>
            <Card style={{ marginBottom: 'var(--spacing-2)', padding: '12px var(--spacing-3)' }}>
              <p style={{ margin: 0, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                {selectedCase.case_number}
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                {selectedCase.court_name} · {selectedCase.case_type}
              </p>
            </Card>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
              gap: '10px', paddingBottom: '12px',
            }}>
              {loadingMsgs && <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', textAlign: 'center' }}>Loading messages…</p>}
              {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px', textAlign: 'center' }}>{error}</p>}
              {!loadingMsgs && messages.length === 0 && (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>
                  No messages yet. Send the first message below.
                </p>
              )}
              {messages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} style={{
                    display: 'flex',
                    justifyContent: isMine ? 'flex-end' : 'flex-start',
                  }}>
                    <div style={{
                      maxWidth: '70%',
                      padding: '10px 14px',
                      borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      backgroundColor: isMine ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: isMine ? '#FFFFFF' : 'var(--color-text)',
                      border: isMine ? 'none' : '1px solid var(--color-border)',
                      fontSize: '14px',
                    }}>
                      <p style={{ margin: '0 0 4px' }}>{msg.message_text}</p>
                      <p style={{
                        margin: 0, fontSize: '11px',
                        color: isMine ? 'rgba(255,255,255,0.65)' : 'var(--color-text-secondary)',
                        textAlign: 'right',
                      }}>
                        {new Date(msg.sent_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Compose Box */}
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message…"
                style={{
                  flex: 1, padding: '10px 14px',
                  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                  fontSize: '14px', fontFamily: 'var(--font-body)', color: 'var(--color-text)',
                  backgroundColor: 'var(--color-surface)', outline: 'none',
                }}
              />
              <Button type="submit" disabled={sending || !text.trim()} style={{ marginTop: 0 }}>
                {sending ? 'Sending…' : 'Send'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default Messages;
