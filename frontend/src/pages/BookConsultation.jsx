import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import directoryApi from '../api/directory.api';
import bookingApi from '../api/booking.api';
import AdvocateAvatar from '../components/AdvocateAvatar';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  BriefcaseIcon,
  VideoIcon,
  PhoneIcon,
  ChatIcon,
  CalendarIcon,
  ClockIcon,
  CourtIcon,
  LocationIcon,
  CheckIcon,
  ShieldIcon,
  ArrowRightIcon,
} from '../components/Icons';
import ConsultationCalendar from '../components/ConsultationCalendar';
import { SERVICE_MODES, SERVICE_MODE_LABELS, ROLES } from '../constants';
import './BookConsultation.css';

export const BookConsultation = () => {
  const { lawyerId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Advocate & Schedule Data
  const [lawyer, setLawyer] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Form State
  const [selectedService, setSelectedService] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [issueSummary, setIssueSummary] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch Advocate Details
  const fetchLawyer = useCallback(async () => {
    setLoading(true);
    try {
      const res = await directoryApi.getLawyerById(lawyerId);
      const data = res?.lawyer || res?.data?.lawyer || res;
      setLawyer(data);
      if (Array.isArray(data.services) && data.services.length > 0) {
        setSelectedService(data.services[0]);
      }
    } catch (err) {
      showToast(err.message || 'Advocate profile could not be loaded', 'error');
      setLawyer(null);
    } finally {
      setLoading(false);
    }
  }, [lawyerId, showToast]);

  // Fetch Available Slots (14-day lookahead starting from target date or today)
  const fetchSlots = useCallback(async (targetDate = new Date()) => {
    if (!lawyerId) return;
    setSlotsLoading(true);
    try {
      const now = new Date();
      const getKarachiDateStr = (d) =>
        new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Karachi',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(d);

      const isCurrentMonth =
        targetDate.getFullYear() === now.getFullYear() &&
        targetDate.getMonth() === now.getMonth();

      const startDate = isCurrentMonth
        ? now
        : new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);

      const fromStr = getKarachiDateStr(startDate);
      const toStr = getKarachiDateStr(new Date(startDate.getTime() + 13 * 24 * 60 * 60 * 1000));

      const res = await directoryApi.getSlots(lawyerId, fromStr, toStr);
      const list = Array.isArray(res) ? res : res?.slots || [];
      setSlots(list);
    } catch (err) {
      console.warn('Failed to load slots:', err.message);
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [lawyerId]);

  useEffect(() => {
    fetchLawyer();
    fetchSlots();
  }, [fetchLawyer, fetchSlots]);

  // Helper to extract ISO timestamp string from slot
  const getSlotIso = (s) => {
    if (!s) return null;
    if (typeof s === 'string') return s;
    return s.startsAt || s.startUtc || s.startTime || null;
  };

  // Format Pakistan Standard Time slot
  const formatSlot = (slotOrIso) => {
    try {
      const isoStr = getSlotIso(slotOrIso);
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
      return String(slotOrIso);
    }
  };

  const getSlotDayLabel = (slotOrIso) => {
    try {
      const isoStr = getSlotIso(slotOrIso);
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-PK', {
        timeZone: 'Asia/Karachi',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return '';
    }
  };

  const getSlotTimeOnly = (slotOrIso) => {
    try {
      if (typeof slotOrIso === 'object' && slotOrIso !== null && (slotOrIso.localTime || slotOrIso.startLocal)) {
        return slotOrIso.localTime || slotOrIso.startLocal;
      }
      const isoStr = getSlotIso(slotOrIso);
      const d = new Date(isoStr);
      return d.toLocaleTimeString('en-PK', {
        timeZone: 'Asia/Karachi',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  // Group slots by date
  const groupedSlots = slots.reduce((acc, slot) => {
    const rawTime = getSlotIso(slot);
    const dateKey = getSlotDayLabel(rawTime) || 'Upcoming Slots';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(slot);
    return acc;
  }, {});

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verification guards
    if (!isAuthenticated) {
      showToast('Please sign in or register as a citizen client to book a consultation', 'warning');
      navigate('/login', { state: { from: { pathname: `/book/${lawyerId}` } } });
      return;
    }

    if (user?.role === ROLES.LAWYER) {
      showToast('Advocates cannot book consultations with other advocates. Please use a client account.', 'warning');
      return;
    }

    const errors = {};
    if (!selectedService) {
      errors.service = 'Please select a consultation service mode.';
    }
    if (!selectedSlot) {
      errors.slot = 'Please select an available calendar time slot.';
    }
    if (!issueSummary.trim() || issueSummary.trim().length < 10) {
      errors.issueSummary = 'Please describe your legal issue in at least 10 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Please complete all required consultation booking details.', 'warning');
      return;
    }

    setValidationErrors({});
    setSubmitting(true);

    try {
      const slotTimeIso = getSlotIso(selectedSlot);
      const payload = {
        lawyerId: lawyer.id || lawyerId,
        mode: selectedService.mode,
        startsAt: new Date(slotTimeIso).toISOString(),
        issueSummary: issueSummary.trim(),
        clientNotes: clientNotes.trim() || undefined,
      };

      const res = await bookingApi.createBooking(payload);
      showToast('Consultation request submitted! The advocate has been notified to review your appointment.', 'success');
      const bookingId = res?.booking?.id || res?.data?.booking?.id;
      if (bookingId) {
        navigate(`/bookings/${bookingId}`);
      } else {
        navigate('/bookings');
      }
    } catch (err) {
      // Graceful 409 Slot Conflict Handling
      if (err.status === 409 || err.code === '409' || err.message?.toLowerCase().includes('already booked')) {
        showToast('This slot was just reserved by another client. Refreshing open slots...', 'warning');
        setSelectedSlot(null);
        await fetchSlots();
      } else {
        showToast(err.message || 'Failed to submit consultation booking', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ maxWidth: '720px', margin: 'var(--spacing-12) auto', textAlign: 'center', padding: 'var(--spacing-12)' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            border: '3px solid var(--color-border)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'll-spin 0.8s linear infinite',
            margin: '0 auto var(--spacing-3) auto',
          }}
        />
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Loading advocate schedule and consultation options...
        </p>
      </div>
    );
  }

  if (!lawyer) {
    return (
      <div className="page-container" style={{ maxWidth: '640px', textAlign: 'center', padding: 'var(--spacing-16) var(--spacing-4)' }}>
        <div className="card" style={{ padding: 'var(--spacing-8)' }}>
          <h2>Advocate Unavailable</h2>
          <p style={{ marginTop: 'var(--spacing-2)', marginBottom: 'var(--spacing-6)', color: 'var(--color-text-muted)' }}>
            The requested advocate profile is not available for bookings.
          </p>
          <Link to="/lawyers" className="btn btn-primary">
            ← Return to Advocate Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bc-container">
      {/* Back Link */}
      <div>
        <Link to={`/lawyers/${lawyerId}`} className="bc-back-link">
          ← Back to Advocate Profile
        </Link>
      </div>

      <div className="bc-layout">
        {/* Left Column: Booking Form */}
        <div className="bc-form-col">
          <div className="card bc-card">
            <div className="bc-card__header">
              <h1 className="bc-title">Schedule a Legal Consultation</h1>
              <p className="bc-subtitle">
                Reserve an appointment with {lawyer.name}. Review chamber rates and select an open time slot.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="bc-form">
              {/* Step 1: Select Service Mode */}
              <div className="bc-section">
                <label className="bc-section-title">
                  <span>1. Select Consultation Offering</span>
                </label>
                {Array.isArray(lawyer.services) && lawyer.services.length > 0 ? (
                  <div className="bc-services-grid">
                    {lawyer.services.map((service, idx) => {
                      const isSelected = selectedService?.mode === service.mode;
                      return (
                        <div
                          key={idx}
                          className={`bc-service-card ${isSelected ? 'bc-service-card--active' : ''}`}
                          onClick={() => {
                            setSelectedService(service);
                            if (validationErrors.service) {
                              setValidationErrors((prev) => ({ ...prev, service: null }));
                            }
                          }}
                        >
                          <div className="bc-service-header">
                            <div className="bc-service-mode-icon">
                              {service.mode === SERVICE_MODES.VIDEO && <VideoIcon size={18} />}
                              {service.mode === SERVICE_MODES.PHONE && <PhoneIcon size={18} />}
                              {service.mode === SERVICE_MODES.CHAT && <ChatIcon size={18} />}
                              {service.mode === SERVICE_MODES.IN_CHAMBER && <BriefcaseIcon size={18} />}
                            </div>
                            <span className="bc-service-duration">{service.durationMinutes} Mins</span>
                          </div>
                          <strong className="bc-service-name">
                            {SERVICE_MODE_LABELS[service.mode] || service.mode}
                          </strong>
                          <div className="bc-service-fee">
                            PKR {Number(service.feePkr || 0).toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                    Standard consultation rate applies (finalized on booking confirmation).
                  </p>
                )}
                {validationErrors.service && (
                  <span className="bc-error-text">{validationErrors.service}</span>
                )}
              </div>

              {/* Step 2: Pick Available Slot via Calendar */}
              <div className="bc-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
                  <label className="bc-section-title" style={{ margin: 0 }}>
                    <span>2. Select Calendar Slot</span>
                  </label>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => fetchSlots(currentMonth)}
                    disabled={slotsLoading}
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                  >
                    {slotsLoading ? 'Refreshing...' : 'Refresh Slots'}
                  </button>
                </div>

                <ConsultationCalendar
                  slots={slots}
                  selectedSlot={selectedSlot}
                  onSelectSlot={(slot) => {
                    setSelectedSlot(slot);
                    if (validationErrors.slot) {
                      setValidationErrors((prev) => ({ ...prev, slot: null }));
                    }
                  }}
                  currentMonth={currentMonth}
                  onMonthChange={(newMonth) => {
                    setCurrentMonth(newMonth);
                    fetchSlots(newMonth);
                  }}
                  isLoading={slotsLoading}
                />

                {validationErrors.slot && (
                  <span className="bc-error-text">{validationErrors.slot}</span>
                )}
              </div>

              {/* Step 3: Issue Summary */}
              <div className="bc-section">
                <label htmlFor="bcIssueSummary" className="bc-section-title">
                  <span>3. Brief Summary of Legal Issue</span>
                </label>
                <p className="bc-field-hint">
                  Provide a clear summary of your dispute, notice, or requirement. This allows the advocate to check their cause list for conflicts of interest before accepting.
                </p>
                <textarea
                  id="bcIssueSummary"
                  rows={4}
                  maxLength={1000}
                  placeholder="e.g. Received an ex-parte civil decree regarding commercial inheritance in Lahore. Need urgent stay order application before the High Court..."
                  value={issueSummary}
                  onChange={(e) => {
                    setIssueSummary(e.target.value);
                    if (validationErrors.issueSummary) {
                      setValidationErrors((prev) => ({ ...prev, issueSummary: null }));
                    }
                  }}
                  className={`bc-textarea ${validationErrors.issueSummary ? 'bc-textarea--error' : ''}`}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-subtle)' }}>
                  <span>Minimum 10 characters required</span>
                  <span>{issueSummary.length} / 1000</span>
                </div>
                {validationErrors.issueSummary && (
                  <span className="bc-error-text">{validationErrors.issueSummary}</span>
                )}
              </div>

              {/* Step 4: Client Notes (Optional) */}
              <div className="bc-section">
                <label htmlFor="bcClientNotes" className="bc-section-title">
                  <span>4. Additional Client Notes (Optional)</span>
                </label>
                <input
                  id="bcClientNotes"
                  type="text"
                  maxLength={1000}
                  placeholder="e.g. Prefer phone call if video connection is weak; documents already scanned in PDF"
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  className="bc-input"
                />
              </div>

              {/* Submit CTA */}
              <div className="bc-form-footer">
                <button
                  type="submit"
                  className="btn btn-primary bc-submit-btn"
                  disabled={submitting || slots.length === 0}
                >
                  {submitting ? 'Submitting Request...' : 'Send Consultation Request'}
                  <ArrowRightIcon size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Advocate Capsule & Booking Summary */}
        <aside className="bc-summary-col">
          <div className="card bc-advocate-summary-card">
            <div className="bc-advocate-header">
              <AdvocateAvatar
                name={lawyer.name}
                courtLevel={lawyer.courtLevel}
                size={60}
              />
              <div>
                <h3 className="bc-advocate-name">{lawyer.name}</h3>
                <div className="bc-advocate-standing">
                  <CourtIcon size={13} color="var(--color-primary)" />
                  <span>{lawyer.courtLevel}</span>
                </div>
                <div className="bc-advocate-station">
                  <LocationIcon size={13} color="var(--color-text-muted)" />
                  <span>{lawyer.city}, Pakistan</span>
                </div>
              </div>
            </div>

            <div className="bc-summary-divider" />

            <div className="bc-summary-details">
              <div className="bc-summary-item">
                <span className="bc-item-label">Bar Council:</span>
                <span className="bc-item-val">{lawyer.barCouncil}</span>
              </div>
              <div className="bc-summary-item">
                <span className="bc-item-label">Selected Mode:</span>
                <span className="bc-item-val">
                  {selectedService ? SERVICE_MODE_LABELS[selectedService.mode] : 'Not Selected'}
                </span>
              </div>
              <div className="bc-summary-item">
                <span className="bc-item-label">Chosen Slot:</span>
                <span className="bc-item-val">
                  {selectedSlot ? formatSlot(selectedSlot.startTime || selectedSlot) : 'Select a time slot'}
                </span>
              </div>
              <div className="bc-summary-item bc-summary-item--fee">
                <span>Chamber Fee:</span>
                <strong>
                  {selectedService ? `PKR ${Number(selectedService.feePkr || 0).toLocaleString()}` : '—'}
                </strong>
              </div>
            </div>

            <div className="bc-trust-box">
              <ShieldIcon size={16} color="var(--color-primary)" />
              <span>
                <strong>Confidential Chamber Reservation:</strong> The advocate will review your issue summary and accept. You only remit the fee once accepted.
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default BookConsultation;
