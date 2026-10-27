import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import caseApi from '../api/case.api';
import EmptyState from './EmptyState';
import { ChatIcon } from './Icons';
import './CaseMessagesTab.css';

const MAX_MESSAGE_LENGTH = 5000;

export const CaseMessagesTab = ({ caseId, isLawyer }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fetchMessages = useCallback(
    async (isBackground = false) => {
      if (!isBackground) {
        setLoading(true);
        setError(null);
      }
      try {
        const res = await caseApi.getCaseMessages(caseId, { page: 1, limit: 100 });
        const data = res?.data || res || {};
        const list = Array.isArray(data.messages) ? data.messages : [];
        // Backend returns newest first; reverse for chronological top-to-bottom chat
        const chronological = [...list].reverse();
        setMessages(chronological);
      } catch (err) {
        if (!isBackground) {
          console.error('Failed to load case messages:', err);
          setError(
            err.response?.data?.message ||
              'Failed to retrieve case messages. Please try again.'
          );
        }
      } finally {
        if (!isBackground) {
          setLoading(false);
        }
      }
    },
    [caseId]
  );

  // Initial load
  useEffect(() => {
    fetchMessages(false);
  }, [fetchMessages]);

  // Auto-scroll when messages update
  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, loading]);

  // 15-second background polling
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || sending) return;

    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      setSendError(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }

    setSending(true);
    setSendError(null);
    try {
      await caseApi.sendCaseMessage(caseId, { content: trimmed });
      setInputText('');
      await fetchMessages(true);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to send case message:', err);
      setSendError(
        err.response?.data?.message ||
          'Failed to send message. Please ensure a client is linked to this case file.'
      );
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString('en-PK', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const formatMessageDate = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-PK', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="case-messages-tab">
      {/* Security & Confidentiality Notice Header */}
      <div className="case-messages-notice">
        <div>
          <strong>Privileged Communication:</strong> Direct messages are strictly restricted to the assigned counsel and linked client.
        </div>
        <div className="case-messages-poll-indicator" title="Polling for new incoming messages every 15 seconds">
          <span className="case-messages-poll-dot" />
          <span>Live (15s poll)</span>
        </div>
      </div>

      {/* Main Messages Body */}
      <div className="case-messages-body">
        {loading ? (
          <div style={{ margin: 'auto', textAlign: 'center', padding: 'var(--spacing-8)' }}>
            <div className="spinner" style={{ margin: '0 auto var(--spacing-3)' }} />
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
              Loading privileged case correspondence...
            </p>
          </div>
        ) : error ? (
          <div style={{ margin: 'auto', textAlign: 'center', padding: 'var(--spacing-6)' }}>
            <p style={{ color: 'var(--color-danger)', fontWeight: 'var(--font-weight-semibold)' }}>{error}</p>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => fetchMessages(false)}
              style={{ marginTop: 'var(--spacing-3)' }}
            >
              Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ margin: 'auto', width: '100%' }}>
            <EmptyState
              icon={<ChatIcon size={44} color="var(--color-text-muted)" />}
              title="No Messages Exchanged Yet"
              message={
                isLawyer
                  ? 'Send a direct message below to coordinate hearing appearances, document requisitions, or procedural updates with your client.'
                  : 'Send a message below to communicate directly with your appointed legal counsel regarding this case file.'
              }
            />
          </div>
        ) : (
          messages.map((msg) => {
            const isOutgoing = msg.senderId === user?.id;
            return (
              <div
                key={msg.id}
                className={`case-message-row ${
                  isOutgoing
                    ? 'case-message-row--outgoing'
                    : 'case-message-row--incoming'
                }`}
              >
                <div
                  className={`case-message-bubble ${
                    isOutgoing
                      ? 'case-message-bubble--outgoing'
                      : 'case-message-bubble--incoming'
                  }`}
                >
                  {msg.content}
                </div>
                <div className="case-message-meta">
                  <span className="case-message-sender-pill">
                    {isOutgoing ? 'You' : msg.sender?.name || (isLawyer ? 'Client' : 'Counsel')}
                  </span>
                  <span>•</span>
                  <span>
                    {formatMessageDate(msg.createdAt)} {formatMessageTime(msg.createdAt)}
                  </span>
                  {isOutgoing && (
                    <span style={{ fontSize: '10px' }}>
                      {msg.readAt ? '✓✓ Seen' : '✓ Sent'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Message Composer Area */}
      <div className="case-messages-composer">
        {sendError && (
          <div className="alert alert--danger" style={{ margin: '0 0 var(--spacing-2) 0', padding: '6px 12px', fontSize: '12px' }}>
            {sendError}
          </div>
        )}
        <form onSubmit={handleSendMessage} className="case-messages-composer-form">
          <textarea
            className="case-messages-textarea"
            placeholder={
              isLawyer
                ? 'Type privileged message to client... (Press Enter to send, Shift+Enter for new line)'
                : 'Type message to your advocate... (Press Enter to send, Shift+Enter for new line)'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={1}
          />
          <button
            type="submit"
            className="btn btn--primary case-messages-send-btn"
            disabled={sending || !inputText.trim()}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
        <div className="case-messages-char-counter">
          {inputText.length}/{MAX_MESSAGE_LENGTH} characters
        </div>
      </div>
    </div>
  );
};

CaseMessagesTab.propTypes = {
  caseId: PropTypes.string.isRequired,
  isLawyer: PropTypes.bool.isRequired,
};

export default CaseMessagesTab;
