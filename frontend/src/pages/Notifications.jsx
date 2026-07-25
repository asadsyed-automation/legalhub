import { useState, useEffect } from 'react';
import { getNotifications, markNotificationRead } from '../api/notificationApi';
import { Card, Badge, Button } from '../components/ui';

const TYPE_LABELS = {
  new_message:      { label: '💬 Message', color: 'var(--color-info)' },
  hearing_reminder: { label: '📅 Hearing', color: 'var(--color-warning)' },
  fee_update:       { label: '💰 Fee',     color: 'var(--color-success)' },
};

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [marking, setMarking] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    setLoading(true);
    setError('');
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
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark as read');
    } finally {
      setMarking(null);
    }
  }

  async function handleMarkAllRead() {
    const unread = notifications.filter((n) => !n.is_read);
    for (const n of unread) {
      await handleMarkRead(n.id);
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-secondary)', margin: 0 }}>
          Notifications {unreadCount > 0 && (
            <span style={{
              marginLeft: '8px', padding: '2px 8px', borderRadius: '9999px',
              backgroundColor: 'var(--color-danger)', color: '#fff',
              fontSize: '12px', fontWeight: 700, verticalAlign: 'middle',
            }}>
              {unreadCount}
            </span>
          )}
        </h2>
        {unreadCount > 0 && (
          <Button variant="secondary" onClick={handleMarkAllRead}>
            Mark All Read
          </Button>
        )}
      </div>

      {loading && <p style={{ color: 'var(--color-text-secondary)' }}>Loading…</p>}
      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {!loading && notifications.length === 0 && (
        <Card>
          <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>You have no notifications yet.</p>
        </Card>
      )}

      {notifications.map((n) => {
        const typeInfo = TYPE_LABELS[n.type] || { label: n.type, color: 'var(--color-text-secondary)' };
        return (
          <Card
            key={n.id}
            style={{
              marginBottom: '10px',
              opacity: n.is_read ? 0.65 : 1,
              borderLeft: n.is_read ? '4px solid var(--color-border)' : `4px solid var(--color-primary)`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: typeInfo.color }}>
                    {typeInfo.label}
                  </span>
                  {!n.is_read && <Badge status="Open" />}
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text)' }}>{n.message}</p>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  {new Date(n.created_at).toLocaleString('en-PK', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
              {!n.is_read && (
                <Button
                  variant="secondary"
                  onClick={() => handleMarkRead(n.id)}
                  disabled={marking === n.id}
                  style={{ marginTop: 0, marginLeft: '12px', fontSize: '12px', padding: '5px 12px' }}
                >
                  {marking === n.id ? '…' : 'Mark Read'}
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export default Notifications;
