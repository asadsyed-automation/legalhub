import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import bookingApi from '../api/booking.api';
import engagementApi from '../api/engagement.api';
import AdvocateAvatar from '../components/AdvocateAvatar';
import StatusChip from '../components/StatusChip';
import ActionPromptModal from '../components/ActionPromptModal';
import SandboxPaymentModal from '../components/SandboxPaymentModal';
import ConsultationNotesEditor from '../components/ConsultationNotesEditor';
import ReviewModal from '../components/ReviewModal';
import ReviewReplyModal from '../components/ReviewReplyModal';
import EngagementModal from '../components/EngagementModal';
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
  LocationIcon,
  CourtIcon,
  DocumentIcon,
  StarIcon,
} from '../components/Icons';
import { BOOKING_STATUS, SERVICE_MODES, SERVICE_MODE_LABELS, ROLES } from '../constants';
import './BookingDetail.css';

// Live Expiry Timer Pill Component
const ExpiryTimer = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
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

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt || !timeLeft) return null;

  return (
    <span
      className={`bd-expiry-pill ${isUrgent ? 'bd-expiry-pill--urgent' : ''}`}
      title="Reservation expiry countdown"
    >
      <ClockIcon size={13} />
      <span>Expires in: {timeLeft}</span>
    </span>
  );
};

export const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const isLawyer = user?.role === ROLES.LAWYER;
  const isAdmin = user?.role === ROLES.ADMIN;

  // Appointment Data State
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isReviewReplyModalOpen, setIsReviewReplyModalOpen] = useState(false);
  const [isEngagementModalOpen, setIsEngagementModalOpen] = useState(false);

  const [promptModal, setPromptModal] = useState({
    isOpen: false,
    actionType: null, // 'decline' | 'cancel' | 'confirm_session'
    title: '',
    subtitle: '',
    label: '',
    placeholder: '',
    confirmText: '',
    isDanger: false,
    minLength: 5,
  });

  // Fetch Booking Details
  const fetchBooking = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await bookingApi.getBookingById(id);
      const data = res?.booking || res?.data?.booking || res;
      setBooking(data);
    } catch (err) {
      showToast(err.message || 'Could not load appointment details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // Format Helper for Timestamps in Pakistan Standard Time (PKT)
  const formatDateTimePkt = (isoString) => {
    if (!isoString) return 'Not scheduled';
    try {
      return new Intl.DateTimeFormat('en-PK', {
        timeZone: 'Asia/Karachi',
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(new Date(isoString));
    } catch (e) {
      return isoString;
    }
  };

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------

  // Lawyer accepts request
  const handleAccept = async () => {
    setActionLoading(true);
    try {
      await bookingApi.acceptBooking(booking.id);
      showToast('Appointment accepted! Client notified to proceed with chamber payment.', 'success');
      await fetchBooking();
    } catch (err) {
      showToast(err.message || 'Failed to accept appointment request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Decline Modal
  const openDeclineModal = () => {
    setPromptModal({
      isOpen: true,
      actionType: 'decline',
      title: 'Decline Appointment Request',
      subtitle: 'Please provide a clear professional reason for the client record.',
      label: 'Decline Reason',
      placeholder: 'e.g., Prior trial commitments at Multan Bench; please select alternate slot.',
      confirmText: 'Decline Appointment',
      isDanger: true,
      minLength: 5,
    });
  };

  // Open Cancel Modal
  const openCancelModal = () => {
    setPromptModal({
      isOpen: true,
      actionType: 'cancel',
      title: 'Cancel Consultation Appointment',
      subtitle: 'Cancelling will revoke the slot reservation and log an audit entry.',
      label: 'Reason for Cancellation',
      placeholder: 'State the circumstance requiring cancellation...',
      confirmText: 'Confirm Cancellation',
      isDanger: true,
      minLength: 5,
    });
  };

  // Open Confirm Session Modal
  const openConfirmSessionModal = () => {
    setPromptModal({
      isOpen: true,
      actionType: 'confirm_session',
      title: 'Confirm Appointment & Provide Session Details',
      subtitle: 'Provide the meeting link or physical chamber office address for the client.',
      label: 'Session Access Information (Video URL or Chamber Address)',
      placeholder: 'e.g., Google Meet: https://meet.google.com/abc-defg-hij OR Chamber #12, District Courts.',
      confirmText: 'Confirm Consultation',
      isDanger: false,
      minLength: 10,
    });
  };

  // Submit Prompt Modal Actions
  const handlePromptSubmit = async (inputValue) => {
    setActionLoading(true);
    try {
      if (promptModal.actionType === 'decline') {
        await bookingApi.declineBooking(booking.id, { reason: inputValue });
        showToast('Appointment declined and recorded in timeline.', 'info');
      } else if (promptModal.actionType === 'cancel') {
        await bookingApi.cancelBooking(booking.id, { reason: inputValue });
        showToast('Appointment successfully cancelled.', 'info');
      } else if (promptModal.actionType === 'confirm_session') {
        await bookingApi.confirmBooking(booking.id, { sessionInfo: inputValue });
        showToast('Consultation confirmed! Meeting details provided to client.', 'success');
      }

      setPromptModal((prev) => ({ ...prev, isOpen: false }));
      await fetchBooking();
    } catch (err) {
      showToast(err.message || 'Failed to process request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Sandbox Payment
  const handleExecutePayment = async () => {
    setActionLoading(true);
    try {
      await bookingApi.payBooking(booking.id, { method: 'sandbox' });
      showToast('Sandbox payment verified! Chamber receipt generated.', 'success');
      setIsPaymentModalOpen(false);
      await fetchBooking();
    } catch (err) {
      showToast(err.message || 'Payment simulation failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Lawyer Marks Consultation Completed
  const handleComplete = async () => {
    setActionLoading(true);
    try {
      await bookingApi.completeBooking(booking.id);
      showToast('Consultation marked as completed!', 'success');
      await fetchBooking();
    } catch (err) {
      showToast(err.message || 'Failed to complete appointment', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Client Submits Review
  const handleReviewSubmit = async ({ rating, comment }) => {
    setActionLoading(true);
    try {
      await bookingApi.submitReview(booking.id, { rating, comment });
      showToast('Thank you! Your verified review has been published.', 'success');
      setIsReviewModalOpen(false);
      await fetchBooking();
    } catch (err) {
      showToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Advocate Replies to Review
  const handleReviewReplySubmit = async (reply) => {
    setActionLoading(true);
    try {
      await bookingApi.replyReview(booking.id, { reply });
      showToast('Chamber reply published successfully!', 'success');
      setIsReviewReplyModalOpen(false);
      await fetchBooking();
    } catch (err) {
      showToast(err.message || 'Failed to publish reply', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Client Initiates Legal Engagement
  const handleEngagementSubmit = async ({ title, practiceArea, notes }) => {
    setActionLoading(true);
    try {
      await engagementApi.createEngagement({
        bookingId: booking.id,
        lawyerId: booking.lawyerId,
        title,
        practiceArea,
        notes,
      });
      showToast('Legal case engagement initiated successfully!', 'success');
      setIsEngagementModalOpen(false);
      await fetchBooking();
    } catch (err) {
      showToast(err.message || 'Failed to initiate engagement', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Render Service Mode Icon
  const getModeIcon = (mode) => {
    switch (mode) {
      case SERVICE_MODES.VIDEO:
        return <VideoIcon size={16} />;
      case SERVICE_MODES.PHONE:
        return <PhoneIcon size={16} />;
      case SERVICE_MODES.CHAT:
        return <ChatIcon size={16} />;
      case SERVICE_MODES.IN_CHAMBER:
      default:
        return <BriefcaseIcon size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="bd-container" style={{ textAlign: 'center', padding: 'var(--spacing-16) 0' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            border: '3px solid var(--color-border)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'bd-spin 0.8s linear infinite',
            margin: '0 auto var(--spacing-3) auto',
          }}
        />
        <p style={{ color: 'var(--color-text-muted)' }}>Retrieving appointment dossier and audit history...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="bd-container">
        <div className="bd-card" style={{ textAlign: 'center', padding: 'var(--spacing-12)' }}>
          <BriefcaseIcon size={44} color="var(--color-text-subtle)" />
          <h2 style={{ marginTop: 'var(--spacing-3)' }}>Appointment Dossier Not Found</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-6)' }}>
            The requested appointment reference is invalid or you do not have permission to inspect it.
          </p>
          <Link to="/bookings" className="btn btn-primary">
            ← Return to Consultations
          </Link>
        </div>
      </div>
    );
  }

  const isClient = !isLawyer && !isAdmin;
  const isCancellable = [
    BOOKING_STATUS.REQUESTED,
    BOOKING_STATUS.PENDING,
    BOOKING_STATUS.ACCEPTED,
    BOOKING_STATUS.PAID,
    BOOKING_STATUS.CONFIRMED,
  ].includes(booking.status);

  return (
    <div className="bd-container">
      {/* Breadcrumb Navigation */}
      <nav className="bd-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/bookings">
          ← Back to Consultations
        </Link>
        <span style={{ color: 'var(--color-text-subtle)' }}>/</span>
        <span style={{ color: 'var(--color-text-muted)' }}>Dossier #{booking.id.slice(0, 8)}</span>
      </nav>

      {/* Main Header Card */}
      <div className="bd-header-card">
        <div className="bd-header-top">
          <div className="bd-header-title-block">
            <h1>Consultation Appointment Dossier</h1>
            <span className="bd-ref-text">Reference ID: {booking.id}</span>
          </div>

          <div className="bd-header-badges">
            <StatusChip status={booking.status} />
            {[BOOKING_STATUS.REQUESTED, BOOKING_STATUS.ACCEPTED].includes(booking.status) && (
              <ExpiryTimer expiresAt={booking.expiresAt} />
            )}
          </div>
        </div>

        {/* Action Controls Ribbon */}
        <div className="bd-actions-ribbon">
          {/* CLIENT ACTIONS */}
          {isClient && (
            <>
              {booking.status === BOOKING_STATUS.ACCEPTED && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setIsPaymentModalOpen(true)}
                  disabled={actionLoading}
                >
                  Pay Chamber Fee (Sandbox)
                </button>
              )}

              {isCancellable && (
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={openCancelModal}
                  disabled={actionLoading}
                >
                  Cancel Appointment
                </button>
              )}
            </>
          )}

          {/* LAWYER ACTIONS */}
          {isLawyer && (
            <>
              {[BOOKING_STATUS.REQUESTED, BOOKING_STATUS.PENDING].includes(booking.status) && (
                <>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleAccept}
                    disabled={actionLoading}
                  >
                    Accept Appointment
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={openDeclineModal}
                    disabled={actionLoading}
                  >
                    Decline Request
                  </button>
                </>
              )}

              {booking.status === BOOKING_STATUS.PAID && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={openConfirmSessionModal}
                  disabled={actionLoading}
                >
                  Confirm &amp; Provide Session Info
                </button>
              )}

              {booking.status === BOOKING_STATUS.CONFIRMED && (
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  onClick={handleComplete}
                  disabled={actionLoading}
                >
                  Mark Completed
                </button>
              )}

              {isCancellable && (
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={openCancelModal}
                  disabled={actionLoading}
                >
                  Cancel Appointment
                </button>
              )}
            </>
          )}

          {/* ADMIN VIEW ACTION */}
          {isAdmin && isCancellable && (
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={openCancelModal}
              disabled={actionLoading}
            >
              Admin Cancellation
            </button>
          )}
        </div>
      </div>

      {/* Two-Column Workspace Grid */}
      <div className="bd-grid">
        {/* Left / Main Column */}
        <div className="bd-main-col">
          {/* Confirmed Session Access Box */}
          {booking.status === BOOKING_STATUS.CONFIRMED && booking.sessionInfo && (
            <div className="bd-session-box">
              <div className="bd-session-box__header">
                <CheckIcon size={16} />
                <span>Confirmed Consultation Access Credentials</span>
              </div>
              <div className="bd-session-box__content">
                {booking.sessionInfo}
              </div>
            </div>
          )}

          {/* Paid Waiting Confirmation */}
          {booking.status === BOOKING_STATUS.PAID && (
            <div className="bd-session-box bd-session-box--pending">
              <div className="bd-session-box__header">
                <ClockIcon size={16} />
                <span>Chamber Escrow Secured — Waiting for Advocate Confirmation</span>
              </div>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#854d0e' }}>
                Payment has been credited. The advocate will verify their schedule and attach the video meeting link or chamber address directions.
              </p>
            </div>
          )}

          {/* Reason Alert if Declined or Cancelled */}
          {(booking.declineReason || booking.cancelReason || booking.cancellationReason) && (
            <div className="bd-reason-box">
              <div className="bd-reason-box__title">
                {booking.status === BOOKING_STATUS.DECLINED ? 'Advocate Decline Reason' : 'Cancellation Reason'}
              </div>
              <p className="bd-reason-box__text">
                {booking.declineReason || booking.cancelReason || booking.cancellationReason}
              </p>
            </div>
          )}

          {/* Key Appointment Details */}
          <div className="bd-card">
            <h2 className="bd-card-title">
              <CalendarIcon size={18} color="var(--color-primary)" />
              Consultation Specification
            </h2>

            <div className="bd-kv-grid">
              <div className="bd-kv-item">
                <span className="bd-kv-label">Consultation Mode</span>
                <span className="bd-kv-val">
                  {getModeIcon(booking.mode)}
                  {SERVICE_MODE_LABELS[booking.mode] || booking.mode}
                </span>
              </div>

              <div className="bd-kv-item">
                <span className="bd-kv-label">Scheduled Date &amp; Time (PKT)</span>
                <span className="bd-kv-val">
                  <ClockIcon size={14} />
                  {formatDateTimePkt(booking.startsAt || booking.startUtc)}
                </span>
              </div>

              <div className="bd-kv-item">
                <span className="bd-kv-label">Expected Duration</span>
                <span className="bd-kv-val">{booking.durationMinutes || 30} Minutes</span>
              </div>

              <div className="bd-kv-item">
                <span className="bd-kv-label">Professional Fee</span>
                <span className="bd-kv-val" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>
                  PKR {booking.feePkr?.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Issue Summary */}
            <div style={{ marginTop: 'var(--spacing-4)' }}>
              <span className="bd-kv-label" style={{ display: 'block', marginBottom: 'var(--spacing-1)' }}>
                Client Matter Summary
              </span>
              <div className="bd-notes-content">
                {booking.issueSummary || booking.clientNotes || 'No specific description provided by client.'}
              </div>
            </div>

            {/* Advocate Notes (if present) */}
            {booking.lawyerNotes && (
              <div style={{ marginTop: 'var(--spacing-4)' }}>
                <span className="bd-kv-label" style={{ display: 'block', marginBottom: 'var(--spacing-1)' }}>
                  Advocate Chamber Remarks
                </span>
                <div className="bd-notes-content">
                  {booking.lawyerNotes}
                </div>
              </div>
            )}
          </div>

          {/* Consultation Notes & Next Steps (Confirmed or Completed) */}
          {[BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.COMPLETED].includes(booking.status) && (
            <ConsultationNotesEditor
              booking={booking}
              isLawyer={isLawyer}
              onNotesSaved={fetchBooking}
            />
          )}

          {/* Verified Review Section (Completed consultations) */}
          {booking.status === BOOKING_STATUS.COMPLETED && (
            <div className="bd-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
                <h2 className="bd-card-title" style={{ margin: 0 }}>
                  <StarIcon size={18} color="#d97706" fill="#d97706" />
                  Verified Consultation Review
                </h2>
                {booking.review && isLawyer && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsReviewReplyModalOpen(true)}
                  >
                    {booking.review.lawyerReply ? 'Edit Chamber Reply' : 'Reply to Review'}
                  </button>
                )}
              </div>

              {booking.review ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <StarIcon
                          key={s}
                          size={16}
                          color={s <= booking.review.rating ? '#f59e0b' : 'var(--color-border)'}
                          fill={s <= booking.review.rating ? '#f59e0b' : 'none'}
                        />
                      ))}
                    </div>
                    <strong style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
                      {booking.review.rating} / 5 Stars
                    </strong>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)' }}>
                      • {formatDateTimePkt(booking.review.createdAt)}
                    </span>
                  </div>

                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                    &ldquo;{booking.review.comment}&rdquo;
                  </p>

                  {/* Official Chamber Reply */}
                  {booking.review.lawyerReply && (
                    <div
                      style={{
                        marginTop: 'var(--spacing-3)',
                        padding: 'var(--spacing-3) var(--spacing-4)',
                        backgroundColor: 'var(--color-bg)',
                        borderLeft: '3px solid var(--color-primary)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                          Official Chamber Response from Advocate
                        </span>
                        {booking.review.repliedAt && (
                          <span style={{ fontSize: '11px', color: 'var(--color-text-subtle)' }}>
                            {formatDateTimePkt(booking.review.repliedAt)}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
                        {booking.review.lawyerReply}
                      </p>
                    </div>
                  )}
                </div>
              ) : isClient ? (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-4)' }}>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-3)' }}>
                    Your consultation is completed. How was your experience with {booking.lawyerName || 'the advocate'}?
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setIsReviewModalOpen(true)}
                  >
                    ★ Rate &amp; Review Consultation
                  </button>
                </div>
              ) : (
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-subtle)', margin: 0 }}>
                  Awaiting verified client feedback for this consultation session.
                </p>
              )}
            </div>
          )}

          {/* Ongoing Legal Case Engagement */}
          {booking.status === BOOKING_STATUS.COMPLETED && (
            <div className="bd-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
                <h2 className="bd-card-title" style={{ margin: 0 }}>
                  <BriefcaseIcon size={18} color="var(--color-primary)" />
                  Ongoing Legal Case Representation
                </h2>
                {!booking.engagement && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsEngagementModalOpen(true)}
                  >
                    + Initiate Case Engagement
                  </button>
                )}
              </div>

              {booking.engagement ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text)' }}>
                      {booking.engagement.title}
                    </strong>
                    <span className="badge badge-success" style={{ textTransform: 'uppercase' }}>
                      {booking.engagement.status || 'Active'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    <span>Domain: {booking.engagement.practiceArea} Law</span>
                    <span>Started: {formatDateTimePkt(booking.engagement.startedAt)}</span>
                  </div>
                  {booking.engagement.notes && (
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text)', backgroundColor: 'var(--color-bg)', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-sm)', marginTop: '4px' }}>
                      {booking.engagement.notes}
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-subtle)', margin: 0 }}>
                  Need ongoing trial representation, Vakalatnama filing, or document drafting? You can formalize a legal engagement directly with this advocate.
                </p>
              )}
            </div>
          )}

          {/* Audit Timeline */}
          <div className="bd-card">
            <h2 className="bd-card-title">
              <ClockIcon size={18} color="var(--color-primary)" />
              Chronological Audit Trail
            </h2>

            {Array.isArray(booking.events) && booking.events.length > 0 ? (
              <div className="bd-timeline">
                {booking.events.map((event, idx) => {
                  const isCompleted = event.toStatus === BOOKING_STATUS.COMPLETED;
                  const isDeclined = event.toStatus === BOOKING_STATUS.DECLINED;
                  const isCancelled = event.toStatus === BOOKING_STATUS.CANCELLED;

                  return (
                    <div key={event.id || idx} className="bd-timeline-item">
                      <div
                        className={`bd-timeline-dot ${
                          isCompleted
                            ? 'bd-timeline-dot--completed'
                            : isDeclined
                            ? 'bd-timeline-dot--declined'
                            : isCancelled
                            ? 'bd-timeline-dot--cancelled'
                            : ''
                        }`}
                      />

                      <div className="bd-timeline-header">
                        <div className="bd-timeline-step-badge">
                          <span>
                            {event.fromStatus ? `${event.fromStatus} → ` : ''}
                            {event.toStatus}
                          </span>
                        </div>
                        <span className="bd-timeline-time">{formatDateTimePkt(event.createdAt)}</span>
                      </div>

                      {event.actor && (
                        <span className="bd-timeline-actor">
                          Actor: {event.actor.name} ({event.actor.role})
                        </span>
                      )}

                      {event.note && (
                        <div className="bd-timeline-note">
                          {event.note}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-subtle)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
                No state change events recorded yet.
              </p>
            )}
          </div>
        </div>

        {/* Right / Sidebar Column */}
        <div className="bd-sidebar-col">
          {/* Counterparty Card */}
          <div className="bd-card">
            <h3 className="bd-card-title" style={{ fontSize: 'var(--font-size-sm)' }}>
              {isLawyer ? 'Client Party' : 'Practicing Advocate'}
            </h3>

            {isLawyer ? (
              <div className="bd-party-capsule">
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                  }}
                >
                  {(booking.clientName || 'C')[0].toUpperCase()}
                </div>
                <div className="bd-party-info">
                  <span className="bd-party-name">{booking.clientName || 'Registered Citizen'}</span>
                  <span className="bd-party-sub">Client Reference</span>
                </div>
              </div>
            ) : (
              <div className="bd-party-capsule">
                <AdvocateAvatar
                  name={booking.lawyerName || 'Advocate'}
                  city=""
                  courtLevel=""
                  size={44}
                />
                <div className="bd-party-info">
                  <span className="bd-party-name">{booking.lawyerName || 'Advocate'}</span>
                  <span className="bd-party-sub">Chamber Legal Counsel</span>
                </div>
              </div>
            )}
          </div>

          {/* Payment Status Card */}
          <div className="bd-card">
            <h3 className="bd-card-title" style={{ fontSize: 'var(--font-size-sm)' }}>
              <ShieldIcon size={16} color="var(--color-primary)" />
              Chamber Payment Record
            </h3>

            {booking.payment ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                <div className="bd-kv-item">
                  <span className="bd-kv-label">Simulated Amount</span>
                  <span className="bd-kv-val" style={{ fontWeight: 'bold' }}>
                    PKR {booking.payment.amountPkr?.toLocaleString()}
                  </span>
                </div>

                <div className="bd-kv-item">
                  <span className="bd-kv-label">Gateway Method</span>
                  <span className="bd-kv-val" style={{ textTransform: 'uppercase' }}>
                    {booking.payment.method || 'SANDBOX'}
                  </span>
                </div>

                <div className="bd-kv-item">
                  <span className="bd-kv-label">Receipt Reference</span>
                  <span className="bd-kv-val" style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xs)' }}>
                    {booking.payment.reference}
                  </span>
                </div>

                <div className="bd-kv-item">
                  <span className="bd-kv-label">Settlement Date</span>
                  <span className="bd-kv-val" style={{ fontSize: 'var(--font-size-xs)' }}>
                    {formatDateTimePkt(booking.payment.createdAt)}
                  </span>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-subtle)', fontSize: 'var(--font-size-xs)', margin: 0 }}>
                {booking.status === BOOKING_STATUS.ACCEPTED
                  ? 'Consultation accepted. Awaiting simulated sandbox payment from client.'
                  : 'No payment transaction logged for this appointment.'}
              </p>
            )}
          </div>

          {/* Rule 135 Regulatory Notice */}
          <div
            style={{
              padding: 'var(--spacing-4)',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-subtle)',
              lineHeight: 1.5,
            }}
          >
            <strong>Regulatory Standard:</strong> Consultations conducted under Pakistan Bar Council Rule 135 professional standards. Fees are agreed directly between advocate and client for professional legal counsel.
          </div>
        </div>
      </div>

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
        isOpen={isPaymentModalOpen}
        booking={booking}
        isLoading={actionLoading}
        onPay={handleExecutePayment}
        onCancel={() => setIsPaymentModalOpen(false)}
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        booking={booking}
        isLoading={actionLoading}
        onSubmit={handleReviewSubmit}
        onCancel={() => setIsReviewModalOpen(false)}
      />

      {/* Review Reply Modal */}
      <ReviewReplyModal
        isOpen={isReviewReplyModalOpen}
        review={booking.review}
        isLoading={actionLoading}
        onSubmit={handleReviewReplySubmit}
        onCancel={() => setIsReviewReplyModalOpen(false)}
      />

      {/* Legal Engagement Modal */}
      <EngagementModal
        isOpen={isEngagementModalOpen}
        booking={booking}
        isLoading={actionLoading}
        onSubmit={handleEngagementSubmit}
        onCancel={() => setIsEngagementModalOpen(false)}
      />
    </div>
  );
};

export default BookingDetail;
