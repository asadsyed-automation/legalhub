import { useState, useEffect } from 'react';
import { getNotifications, markNotificationRead } from '../api/notificationApi';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

// Energetic Vector Icons
const BellIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>
);

const MessageIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
);

const CreditCardIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
  </svg>
);

const TYPE_LABELS = {
  new_message:      { label: 'Message Alert', icon: <MessageIcon />, color: 'var(--color-info)' },
  hearing_reminder: { label: 'Hearing Date', icon: <CalendarIcon />, color: 'var(--color-warning)' },
  fee_update:       { label: 'Fee Ledger',   icon: <CreditCardIcon />, color: 'var(--color-success)' },
};

const pageVariants = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };
const listVariants = { animate: { transition: { staggerChildren: 0.03 } } };
const itemVariants = { initial: { opacity: 0, x: -8 }, animate: { opacity: 1, x: 0, transition: { duration: 0.2 } } };

function Skel({ w = '100%', h = '16px', style }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: 'var(--radius-sm)', ...style }} />;
}

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [marking, setMarking] = useState(null);

  useEffect(() => { fetchNotifications(); }, []);

  async function fetchNotifications() {
    setLoading(true); setError('');
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id) {
    setMarking(id);
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark as read');
    } finally {
      setMarking(null);
    }
  }

  async function handleMarkAllRead() {
    const unread = notifications.filter((n) => !n.is_read);
    for (const n of unread) await handleMarkRead(n.id);
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 700, color: 'var(--color-secondary)', margin: 0 }}>
            Notifications & Cause List Alerts
          </h1>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              style={{
                padding: '2px 9px', borderRadius: '9999px',
                backgroundColor: 'var(--color-danger)', color: '#fff',
                fontSize: '12px', fontWeight: 700,
              }}
            >
              {unreadCount}
            </motion.span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" onClick={handleMarkAllRead} style={{ marginTop: 0 }}>
            ✓ Mark All Read
          </Button>
        )}
      </div>

      {error && <p style={{ color: 'var(--color-danger)', marginBottom: '16px' }}>{error}</p>}

      {/* Skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <Skel w="20%" h="12px" style={{ marginBottom: '10px' }} />
                  <Skel w="80%" h="14px" style={{ marginBottom: '6px' }} />
                  <Skel w="30%" h="11px" />
                </div>
                <Skel w="80px" h="30px" style={{ marginLeft: '12px', borderRadius: 'var(--radius-sm)' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && notifications.length === 0 && (
        <Card>
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ color: 'var(--color-primary)', display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <BellIcon size={36} />
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0 }}>You're all caught up! No unread cause list or case alerts.</p>
          </div>
        </Card>
      )}

      {!loading && (
        <motion.div variants={listVariants} initial="initial" animate="animate">
          <AnimatePresence>
            {notifications.map((n) => {
              const typeInfo = TYPE_LABELS[n.type] || { label: n.type, icon: <BellIcon size={14} />, color: 'var(--color-text-secondary)' };
              return (
                <motion.div
                  key={n.id}
                  variants={itemVariants}
                  layout
                  animate={{ opacity: n.is_read ? 0.6 : 1 }}
                  transition={{ opacity: { duration: 0.3 } }}
                >
                  <div style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderLeft: n.is_read ? '4px solid var(--color-border)' : '4px solid var(--color-primary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px 20px',
                    marginBottom: '10px',
                    transition: 'opacity 0.3s ease',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: typeInfo.color, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {typeInfo.icon} {typeInfo.label}
                          </span>
                          {!n.is_read && <Badge status="Open" />}
                        </div>
                        <p style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.5 }}>{n.message}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          {new Date(n.created_at).toLocaleString('en-PK', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!n.is_read && (
                        <Button
                          variant="secondary"
                          onClick={() => handleMarkRead(n.id)}
                          disabled={marking === n.id}
                          style={{ marginTop: 0, fontSize: '12px', padding: '5px 12px', whiteSpace: 'nowrap', flexShrink: 0 }}
                        >
                          {marking === n.id ? '…' : 'Mark Read'}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}

export default Notifications;
