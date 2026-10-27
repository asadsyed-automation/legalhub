import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { BellIcon, CheckIcon, ArrowRightIcon } from '../components/Icons';
import notificationApi from '../api/notification.api';
import './Notifications.css';

export const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 20,
      };
      if (unreadOnly) {
        params.unreadOnly = 'true';
      }

      const res = await notificationApi.getNotifications(params);
      const data = res?.data || res || {};

      setNotifications(Array.isArray(data.items) ? data.items : []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError(
        err.response?.data?.message ||
          'Failed to load notifications inbox. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [page, unreadOnly]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n
        )
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await notificationApi.markAllAsRead();
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const formatTimestamp = (isoStr) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  const hasUnread = notifications.some((n) => !n.readAt);

  return (
    <div className="notifications-page">
      <PageHeader
        title="Notifications Inbox"
        subtitle="Real-time case alerts, hearing schedule notices, and appointment updates."
        actions={
          hasUnread && (
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={handleMarkAllAsRead}
              disabled={markingAll || loading}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckIcon size={16} />
              {markingAll ? 'Marking All...' : 'Mark All as Read'}
            </button>
          )
        }
      />

      {/* Filter Tabs */}
      <div className="notifications-controls">
        <div className="notifications-filter-group">
          <button
            type="button"
            className={`btn btn--sm ${!unreadOnly ? 'btn--primary' : 'btn--outline'}`}
            onClick={() => {
              setUnreadOnly(false);
              setPage(1);
            }}
          >
            All Notifications
          </button>
          <button
            type="button"
            className={`btn btn--sm ${unreadOnly ? 'btn--primary' : 'btn--outline'}`}
            onClick={() => {
              setUnreadOnly(true);
              setPage(1);
            }}
          >
            Unread Only
          </button>
        </div>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          {totalCount} total alert{totalCount === 1 ? '' : 's'}
        </span>
      </div>

      {/* Error state */}
      {error && (
        <div className="alert alert--danger" style={{ margin: 0 }}>
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto var(--spacing-3)' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Loading notification alerts...
          </p>
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<BellIcon size={44} color="var(--color-text-muted)" />}
          title={unreadOnly ? 'No Unread Notifications' : 'No Notifications on Record'}
          message={
            unreadOnly
              ? 'You have read all pending case alerts and appointment updates.'
              : 'When hearings are fixed, messages sent, or payments logged, alerts will appear here.'
          }
        />
      ) : (
        <div className="notifications-list">
          {notifications.map((item) => {
            const isUnread = !item.readAt;
            return (
              <div
                key={item.id}
                className={`notification-card ${
                  isUnread ? 'notification-card--unread' : ''
                }`}
              >
                <div className="notification-card__main">
                  <div className="notification-card__meta">
                    <span
                      className={`notification-type-pill ${
                        item.type?.toLowerCase().includes('case')
                          ? 'notification-type-pill--case'
                          : item.type?.toLowerCase().includes('booking')
                          ? 'notification-type-pill--booking'
                          : 'notification-type-pill--system'
                      }`}
                    >
                      {item.type || 'Notice'}
                    </span>
                    <span>•</span>
                    <span>{formatTimestamp(item.createdAt)}</span>
                    {isUnread && (
                      <span
                        style={{
                          color: 'var(--color-primary)',
                          fontWeight: 'bold',
                          marginLeft: '4px',
                        }}
                      >
                        (New)
                      </span>
                    )}
                  </div>

                  <h4 className="notification-card__title">{item.title}</h4>
                  <p className="notification-card__body">{item.body}</p>
                </div>

                <div className="notification-card__actions">
                  {item.link && (
                    <Link
                      to={item.link}
                      className="btn btn--primary btn--sm"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                      }}
                      onClick={() => isUnread && handleMarkAsRead(item.id)}
                    >
                      <span>View</span>
                      <ArrowRightIcon size={14} />
                    </Link>
                  )}

                  {isUnread && (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}
                      onClick={() => handleMarkAsRead(item.id)}
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 'var(--spacing-4)',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page <= 1 || loading}
          >
            Previous
          </button>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page >= totalPages || loading}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Notifications;
