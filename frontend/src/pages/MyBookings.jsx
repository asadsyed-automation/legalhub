import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import bookingApi from '../api/booking.api';
import AdvocateAvatar from '../components/AdvocateAvatar';
import StatusChip from '../components/StatusChip';
import EmptyState from '../components/EmptyState';
import ActionPromptModal from '../components/ActionPromptModal';
import SandboxPaymentModal from '../components/SandboxPaymentModal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  CalendarIcon,
  ClockIcon,
  VideoIcon,
  PhoneIcon,
  ChatIcon,
  BriefcaseIcon,
  ArrowRightIcon,
  CheckIcon,
  CloseIcon,
  ShieldIcon,
} from '../components/Icons';
import { BOOKING_STATUS, SERVICE_MODES, SERVICE_MODE_LABELS, ROLES } from '../constants';
import './MyBookings.css';

// Live Expiry Timer Capsule Component
const ExpiryCountdown = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    const calc = () => {
      const now = Date.now();
      const exp = new Date(expiresAt).getTime();
      const diff = exp - now;

      if (diff <= 0) {
        setTimeLeft('Window Expired');
        setIsUrgent(true);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setIsUrgent(hours < 2);
      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt || !timeLeft) return null;

  return (
    <span
      className={`mb-expiry-badge ${isUrgent ? 'mb-expiry-badge--urgent' : ''}`}
      title="Automatic reservation window"
    >
      <ClockIcon size={12} />
      <span>{timeLeft}</span>
    </span>
  );
};

export const MyBookings = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const isLawyer = user?.role === ROLES.LAWYER;

  // Data State
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'requested' | 'accepted' | 'paid' | 'confirmed' | 'completed' | 'cancelled'
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    requested: 0,
    accepted: 0,
    paid: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  });

  // Modals State
  const [paymentModalBooking, setPaymentModalBooking] = useState(null);
  const [promptModal, setPromptModal] = useState({
    isOpen: false,
    actionType: null, // 'decline' | 'cancel' | 'confirm_session'
    booking: null,
    title: '',
    subtitle: '',
    label: '',
    placeholder: '',
    confirmText: '',
    isDanger: false,
    minLength: 5,
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Unfiltered Counts for All Tabs
  const fetchCounts = useCallback(async () => {
    try {
      const res = isLawyer
        ? await bookingApi.getLawyerAppointments({ page: 1, limit: 100 })
        : await bookingApi.getClientBookings({ page: 1, limit: 100 });

      const items =
        res?.items ||
        res?.bookings ||
        res?.data?.items ||
        res?.data?.bookings ||
        (Array.isArray(res) ? res : []);

      setTabCounts({
        all: items.length,
        requested: items.filter(
          (b) => b.status === BOOKING_STATUS.REQUESTED || b.status === BOOKING_STATUS.PENDING
        ).length,
        accepted: items.filter((b) => b.status === BOOKING_STATUS.ACCEPTED).length,
        paid: items.filter((b) => b.status === BOOKING_STATUS.PAID).length,
        confirmed: items.filter((b) => b.status === BOOKING_STATUS.CONFIRMED).length,
        completed: items.filter((b) => b.status === BOOKING_STATUS.COMPLETED).length,
        cancelled: items.filter(
          (b) =>
            b.status === BOOKING_STATUS.CANCELLED ||
            b.status === BOOKING_STATUS.DECLINED ||
            b.status === BOOKING_STATUS.REJECTED ||
            b.status === BOOKING_STATUS.REFUNDED ||
            b.status === BOOKING_STATUS.EXPIRED
        ).length,
      });
    } catch {
      // ignore counts error
    }
  }, [isLawyer]);

  // Fetch Appointments
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: 10,
      };
      if (activeFilter !== 'all') {
        params.status = activeFilter;
      }

      const res = isLawyer
        ? await bookingApi.getLawyerAppointments(params)
        : await bookingApi.getClientBookings(params);

      const items =
        res?.items ||
        res?.bookings ||
        res?.data?.items ||
        res?.data?.bookings ||
        (Array.isArray(res) ? res : []);
      const total = res?.total ?? res?.pagination?.total ?? items.length;
      const totalPages = res?.totalPages ?? res?.pagination?.totalPages ?? Math.max(1, Math.ceil(total / 10));

      setBookings(items);
      setPagination((prev) => ({ ...prev, total, totalPages }));
    } catch (err) {
      showToast(err.message || 'Failed to load consultation appointments', 'error');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [isLawyer, activeFilter, pagination.page, showToast]);

  useEffect(() => {
    fetchAppointments();
    fetchCounts();
  }, [fetchAppointments, fetchCounts]);

  // Format Pakistan Standard Time
  const formatSlotTime = (isoStr) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('en-PK', {
        timeZone: 'Asia/Karachi',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoStr;
    }
  };

  // -------------------------------------------------------------
  // ACTION HANDLERS
  // -------------------------------------------------------------

  // Advocate Accepts Booking
  const handleLawyerAccept = async (booking) => {
    setActionLoading(true);
    try {
      await bookingApi.acceptBooking(booking.id);
      showToast('Appointment request accepted! Client has 12 hours to remit the consultation fee.', 'success');
      await Promise.all([fetchAppointments(), fetchCounts()]);
    } catch (err) {
      showToast(err.message || 'Failed to accept appointment', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Advocate Completes Booking
  const handleLawyerComplete = async (booking) => {
    setActionLoading(true);
    try {
      await bookingApi.completeBooking(booking.id);
      showToast('Consultation session marked as completed.', 'success');
      await Promise.all([fetchAppointments(), fetchCounts()]);
    } catch (err) {
      showToast(err.message || 'Failed to complete appointment', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Decline Modal (Lawyer)
  const openDeclineModal = (booking) => {
    setPromptModal({
      isOpen: true,
      actionType: 'decline',
      booking,
      title: 'Decline Consultation Request',
      subtitle: `Please provide a reason to ${booking.clientName || 'the client'} (e.g. conflict of interest, full cause list).`,
      label: 'Decline Reason (Required)',
      placeholder: 'e.g. Schedule conflict with ongoing Supreme Court bench hearing on this date...',
      confirmText: 'Decline Appointment',
      isDanger: true,
      minLength: 10,
    });
  };

  // Open Cancel Modal (Client or Lawyer)
  const openCancelModal = (booking) => {
    setPromptModal({
      isOpen: true,
      actionType: 'cancel',
      booking,
      title: 'Cancel Consultation Appointment',
      subtitle: 'Please state the reason for cancelling this appointment.',
      label: 'Cancellation Reason',
      placeholder: 'e.g. Emergency personal leave, matter settled privately, etc.',
      confirmText: 'Confirm Cancellation',
      isDanger: true,
      minLength: 5,
    });
  };

  // Open Confirm Session Modal (Lawyer)
  const openConfirmSessionModal = (booking) => {
    setPromptModal({
      isOpen: true,
      actionType: 'confirm_session',
      booking,
      title: 'Confirm Consultation Session',
      subtitle: `Provide meeting credentials or chamber location for ${booking.clientName || 'the client'}.`,
      label: 'Session Details (Meeting URL or Chamber Room)',
      placeholder: booking.mode === 'video'
        ? 'e.g. https://meet.google.com/xyz-abc-qrs (Meeting code: xyz)'
        : 'e.g. Chamber 44, High Court Bar Association, Mall Road, Lahore',
      confirmText: 'Confirm Session',
      isDanger: false,
      minLength: 5,
    });
  };

  // Execute Action from Prompt Modal
  const handlePromptSubmit = async (textValue) => {
    const { actionType, booking } = promptModal;
    if (!booking) return;

    setActionLoading(true);
    try {
      if (actionType === 'decline') {
        await bookingApi.declineBooking(booking.id, { reason: textValue });
        showToast('Appointment request has been declined.', 'info');
      } else if (actionType === 'cancel') {
        await bookingApi.cancelBooking(booking.id, { reason: textValue });
        showToast('Appointment has been cancelled.', 'info');
      } else if (actionType === 'confirm_session') {
        await bookingApi.confirmBooking(booking.id, { sessionInfo: textValue });
        showToast('Session information sent to client! Appointment confirmed.', 'success');
      }

      setPromptModal((prev) => ({ ...prev, isOpen: false }));
      await Promise.all([fetchAppointments(), fetchCounts()]);
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Client Simulated Payment
  const handleExecutePayment = async () => {
    if (!paymentModalBooking) return;
    setActionLoading(true);
    try {
      await bookingApi.payBooking(paymentModalBooking.id, { method: 'sandbox' });
      showToast('Simulated sandbox payment confirmed! Appointment is now marked as Paid.', 'success');
      setPaymentModalBooking(null);
      await Promise.all([fetchAppointments(), fetchCounts()]);
    } catch (err) {
      showToast(err.message || 'Payment simulation failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="mb-container">
      {/* Page Header */}
      <div className="mb-header">
        <div>
          <h1 className="mb-title">
            {isLawyer ? 'Advocate Consultation Roster' : 'My Legal Consultations'}
          </h1>
          <p className="mb-subtitle">
            {isLawyer
              ? 'Manage incoming consultation requests, confirm session coordinates, and record completed proceedings.'
              : 'Track your consultation appointments, complete fee payments, and view session details.'}
          </p>
        </div>

        {!isLawyer && (
          <Link to="/lawyers" className="btn btn-primary btn-sm mb-new-btn">
            <span>Find &amp; Book Advocates</span>
            <ArrowRightIcon size={14} />
          </Link>
        )}
      </div>

      {/* Filter Tabs */}
      <nav className="mb-filter-tabs" aria-label="Appointment status filter">
        {[
          { id: 'all', label: 'All Appointments' },
          { id: BOOKING_STATUS.REQUESTED, label: 'Requested' },
          { id: BOOKING_STATUS.ACCEPTED, label: 'Accepted (Fee Pending)' },
          { id: BOOKING_STATUS.PAID, label: 'Paid' },
          { id: BOOKING_STATUS.CONFIRMED, label: 'Confirmed' },
          { id: BOOKING_STATUS.COMPLETED, label: 'Completed' },
          { id: BOOKING_STATUS.CANCELLED, label: 'Cancelled' },
        ].map((tab) => {
          const count = tabCounts[tab.id] || 0;
          return (
            <button
              key={tab.id}
              type="button"
              className={`mb-filter-tab ${activeFilter === tab.id ? 'mb-filter-tab--active' : ''}`}
              onClick={() => {
                setActiveFilter(tab.id);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            >
              {tab.label}
              {count > 0 ? ` (${count})` : ''}
            </button>
          );
        })}
      </nav>

      {/* Appointments List */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-12)' }}>
          <div className="ll-loader-spinner" />
          <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--spacing-3)', marginBottom: 0 }}>
            Loading consultation appointments...
          </p>
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon size={44} color="var(--color-text-subtle)" />}
          title="No Appointments Found"
          description={
            activeFilter === 'all'
              ? isLawyer
                ? 'You have no scheduled consultation appointments on record.'
                : 'You have not booked any advocate consultations yet.'
              : `No appointments match the "${activeFilter}" status filter.`
          }
          action={
            !isLawyer && activeFilter === 'all' ? (
              <Link to="/lawyers" className="btn btn-primary">
                Browse Practicing Advocates
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="mb-grid">
          {bookings.map((booking) => {
            const oppositeName = isLawyer ? booking.clientName || 'Citizen Client' : booking.lawyerName || 'Appointed Advocate';
            const scheduledTime = booking.startsAt || booking.startUtc;

            return (
              <article key={booking.id} className="card mb-card">
                {/* Top Row: Opposite Party & Status */}
                <div className="mb-card__header">
                  <div className="mb-user-capsule">
                    <AdvocateAvatar
                      name={oppositeName}
                      courtLevel={booking.courtLevel || ''}
                      size={48}
                      showBadge={!isLawyer}
                    />
                    <div>
                      <h2 className="mb-user-name">
                        <Link to={`/bookings/${booking.id}`} className="mb-user-link">
                          {oppositeName}
                        </Link>
                      </h2>
                      <span className="mb-role-tag">
                        {isLawyer ? 'Client Consultation' : booking.courtLevel || 'Advocate'}
                      </span>
                    </div>
                  </div>

                  <div className="mb-status-group">
                    <StatusChip status={booking.status} size="sm" />
                    {booking.expiresAt && <ExpiryCountdown expiresAt={booking.expiresAt} />}
                  </div>
                </div>

                {/* Details Row */}
                <div className="mb-card__meta">
                  <div className="mb-meta-item">
                    <CalendarIcon size={14} color="var(--color-primary)" />
                    <strong>{formatSlotTime(scheduledTime)}</strong>
                  </div>

                  <div className="mb-meta-item">
                    {booking.mode === SERVICE_MODES.VIDEO && <VideoIcon size={14} />}
                    {booking.mode === SERVICE_MODES.PHONE && <PhoneIcon size={14} />}
                    {booking.mode === SERVICE_MODES.CHAT && <ChatIcon size={14} />}
                    {booking.mode === SERVICE_MODES.IN_CHAMBER && <BriefcaseIcon size={14} />}
                    <span>{SERVICE_MODE_LABELS[booking.mode] || booking.mode} ({booking.durationMinutes || 30} mins)</span>
                  </div>

                  <div className="mb-meta-item mb-meta-item--fee">
                    <span>Chamber Fee:</span>
                    <strong>PKR {Number(booking.feePkr || 0).toLocaleString()}</strong>
                  </div>
                </div>

                {/* Issue Summary Snippet */}
                {booking.issueSummary && (
                  <div className="mb-issue-snippet">
                    <span className="mb-snippet-label">Issue:</span>
                    <p className="mb-snippet-text">{booking.issueSummary}</p>
                  </div>
                )}

                {/* Session Info if Confirmed */}
                {booking.sessionInfo && (
                  <div className="mb-session-box">
                    <strong>Session Info:</strong>
                    <span>{booking.sessionInfo}</span>
                  </div>
                )}

                {/* Actions Bar */}
                <div className="mb-card__actions">
                  <Link to={`/bookings/${booking.id}`} className="btn btn-secondary btn-sm">
                    View Details &amp; Timeline
                  </Link>

                  {/* ------------------------------------------- */}
                  {/* CLIENT ROLE ACTIONS */}
                  {/* ------------------------------------------- */}
                  {!isLawyer && (
                    <>
                      {/* Pay consultation fee in sandbox */}
                      {booking.status === BOOKING_STATUS.ACCEPTED && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setPaymentModalBooking(booking)}
                          disabled={actionLoading}
                        >
                          Pay Chamber Fee (Sandbox)
                        </button>
                      )}

                      {/* Cancel active appointment */}
                      {[
                        BOOKING_STATUS.REQUESTED,
                        BOOKING_STATUS.PENDING,
                        BOOKING_STATUS.ACCEPTED,
                        BOOKING_STATUS.PAID,
                        BOOKING_STATUS.CONFIRMED,
                      ].includes(booking.status) && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => openCancelModal(booking)}
                          disabled={actionLoading}
                        >
                          Cancel
                        </button>
                      )}
                    </>
                  )}

                  {/* ------------------------------------------- */}
                  {/* ADVOCATE ROLE ACTIONS */}
                  {/* ------------------------------------------- */}
                  {isLawyer && (
                    <>
                      {/* Accept incoming request */}
                      {(booking.status === BOOKING_STATUS.REQUESTED || booking.status === BOOKING_STATUS.PENDING) && (
                        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleLawyerAccept(booking)}
                            disabled={actionLoading}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openDeclineModal(booking)}
                            disabled={actionLoading}
                          >
                            Decline
                          </button>
                        </div>
                      )}

                      {/* Confirm paid session with location / link */}
                      {booking.status === BOOKING_STATUS.PAID && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => openConfirmSessionModal(booking)}
                          disabled={actionLoading}
                        >
                          Confirm Session Info
                        </button>
                      )}

                      {/* Mark Completed */}
                      {booking.status === BOOKING_STATUS.CONFIRMED && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleLawyerComplete(booking)}
                          disabled={actionLoading}
                        >
                          Mark Completed
                        </button>
                      )}

                      {/* Cancel active appointment */}
                      {[
                        BOOKING_STATUS.REQUESTED,
                        BOOKING_STATUS.PENDING,
                        BOOKING_STATUS.ACCEPTED,
                        BOOKING_STATUS.PAID,
                        BOOKING_STATUS.CONFIRMED,
                      ].includes(booking.status) && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => openCancelModal(booking)}
                          disabled={actionLoading}
                        >
                          Cancel
                        </button>
                      )}
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="mb-pagination">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={pagination.page <= 1}
            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
          >
            Previous
          </button>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
          >
            Next
          </button>
        </div>
      )}

      {/* Action Prompt Modal (Decline / Cancel / Confirm Session) */}
      <ActionPromptModal
        isOpen={promptModal.isOpen}
        title={promptModal.title}
        subtitle={promptModal.subtitle}
        label={promptModal.label}
        placeholder={promptModal.placeholder}
        confirmText={promptModal.confirmText}
        isDanger={promptModal.isDanger}
        minLength={promptModal.minLength}
        isLoading={actionLoading}
        onConfirm={handlePromptSubmit}
        onCancel={() => setPromptModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Sandbox Payment Modal */}
      <SandboxPaymentModal
        isOpen={Boolean(paymentModalBooking)}
        booking={paymentModalBooking}
        isLoading={actionLoading}
        onPay={handleExecutePayment}
        onCancel={() => setPaymentModalBooking(null)}
      />
    </div>
  );
};

export default MyBookings;
