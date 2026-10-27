import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import directoryApi from '../api/directory.api';
import AdvocateAvatar from '../components/AdvocateAvatar';
import {
  CourtIcon,
  LocationIcon,
  BriefcaseIcon,
  ScalesIcon,
  CalendarIcon,
  ClockIcon,
  StarIcon,
  ShieldIcon,
  VideoIcon,
  PhoneIcon,
  ChatIcon,
} from '../components/Icons';
import { SERVICE_MODES, SERVICE_MODE_LABELS } from '../constants';

export const LawyerProfile = () => {
  const { id } = useParams();

  const [lawyer, setLawyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Slots State
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Reviews State
  const [reviewsData, setReviewsData] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Fetch Public Profile Details
  const fetchLawyer = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await directoryApi.getLawyerById(id);
      const lawyerData = response?.lawyer || response?.data?.lawyer || response;
      if (lawyerData) {
        setLawyer(lawyerData);
      } else {
        throw new Error('Advocate profile not found');
      }
    } catch (error) {
      if (error.status === 404 || error.response?.status === 404) {
        setErrorMessage(
          'This advocate profile is either unlisted, currently inactive, or does not exist.'
        );
      } else {
        setErrorMessage(error.message || 'Failed to load advocate profile');
      }
      setLawyer(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch Slots (14-day lookahead)
  const fetchSlots = useCallback(async () => {
    if (!id) return;
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
      const fromStr = getKarachiDateStr(now);
      const toStr = getKarachiDateStr(new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000));

      const res = await directoryApi.getSlots(id, fromStr, toStr);
      const slotsList = Array.isArray(res) ? res : res?.slots || [];
      setSlots(slotsList);
    } catch (err) {
      console.warn('Could not load calendar slots:', err.message);
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [id]);

  // Fetch Reviews
  const fetchReviews = useCallback(async () => {
    if (!id) return;
    setReviewsLoading(true);
    try {
      const res = await directoryApi.getReviews(id, 1, 10);
      setReviewsData(res);
    } catch (err) {
      console.warn('Could not load reviews:', err.message);
      setReviewsData(null);
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLawyer();
    fetchSlots();
    fetchReviews();
  }, [fetchLawyer, fetchSlots, fetchReviews]);

  // Format Pakistan Standard Time slot
  const formatSlotTime = (slotOrIso) => {
    try {
      const raw =
        typeof slotOrIso === 'object' && slotOrIso !== null
          ? slotOrIso.startsAt || slotOrIso.startUtc || slotOrIso.startTime || slotOrIso.date
          : slotOrIso;
      const d = new Date(raw);
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

  if (loading) {
    return (
      <div className="card" style={{ maxWidth: '800px', margin: 'var(--spacing-12) auto', textAlign: 'center', padding: 'var(--spacing-12)' }}>
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
          Loading advocate credentials and chamber schedule...
        </p>
      </div>
    );
  }

  if (errorMessage || !lawyer) {
    return (
      <div className="page-container" style={{ maxWidth: '640px', textAlign: 'center', padding: 'var(--spacing-16) var(--spacing-4)' }}>
        <div className="card" style={{ padding: 'var(--spacing-8)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing-3)' }}>
            <ScalesIcon size={44} color="var(--color-text-subtle)" />
          </div>
          <h2>Advocate Profile Unavailable</h2>
          <p style={{ marginTop: 'var(--spacing-2)', marginBottom: 'var(--spacing-6)', color: 'var(--color-text-muted)' }}>
            {errorMessage || 'The requested advocate profile could not be retrieved.'}
          </p>
          <Link to="/lawyers" className="btn btn-primary">
            ← Return to Advocate Directory
          </Link>
        </div>
      </div>
    );
  }

  const ratingAvg = reviewsData?.stats?.avgRating ?? reviewsData?.avgRating ?? null;
  const reviewCount = reviewsData?.stats?.reviewCount ?? reviewsData?.total ?? 0;

  return (
    <div className="page-container" style={{ maxWidth: '960px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      {/* Back Link */}
      <div>
        <Link
          to="/lawyers"
          style={{
            fontSize: 'var(--font-size-sm)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--spacing-1)',
            color: 'var(--color-primary)',
            textDecoration: 'none',
            fontWeight: 'var(--font-weight-medium)',
          }}
        >
          ← Return to Advocate Directory
        </Link>
      </div>

      {/* Main Profile Card */}
      <div className="card" style={{ borderTop: '5px solid var(--color-primary)', padding: 'var(--spacing-6)' }}>
        {/* Profile Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 'var(--spacing-4)',
            marginBottom: 'var(--spacing-6)',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: 'var(--spacing-6)',
          }}
        >
          <div style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'center' }}>
            {/* Advocate Portrait Avatar */}
            <AdvocateAvatar
              name={lawyer.name}
              courtLevel={lawyer.courtLevel}
              size={76}
            />

            <div>
              <h1 style={{ fontSize: '1.875rem', margin: '0 0 var(--spacing-1) 0', color: 'var(--color-text)' }}>
                {lawyer.name}
              </h1>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-primary)',
                  marginBottom: 'var(--spacing-2)',
                }}
              >
                <CourtIcon size={16} color="var(--color-primary)" />
                <span>{lawyer.courtLevel}</span>
              </div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', margin: '0 0 var(--spacing-2) 0' }}>
                {lawyer.headline || `${lawyer.courtLevel} based in ${lawyer.city}`}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
                <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <LocationIcon size={12} /> {lawyer.city}, Pakistan
                </span>
                <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <ScalesIcon size={12} /> {lawyer.barCouncil}
                </span>
                {ratingAvg !== null && (
                  <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} title="Verified client review average">
                    <StarIcon size={12} color="#15803d" fill="#15803d" />
                    <span>{ratingAvg.toFixed(1)} ({reviewCount} verified review{reviewCount === 1 ? '' : 's'})</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <Link
            to={`/book/${lawyer.id}`}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.625rem 1.25rem' }}
          >
            <CalendarIcon size={18} />
            <span>Book Consultation</span>
          </Link>
        </div>

        {/* Credentials Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--spacing-4)',
            marginBottom: 'var(--spacing-6)',
            padding: 'var(--spacing-4)',
            backgroundColor: 'var(--color-bg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div>
            <span style={{ color: 'var(--color-text-subtle)', display: 'block', fontSize: 'var(--font-size-xs)' }}>
              Provincial Bar Council:
            </span>
            <strong style={{ fontSize: 'var(--font-size-sm)' }}>{lawyer.barCouncil}</strong>
          </div>

          <div>
            <span style={{ color: 'var(--color-text-subtle)', display: 'block', fontSize: 'var(--font-size-xs)' }}>
              Court Standing:
            </span>
            <strong style={{ fontSize: 'var(--font-size-sm)' }}>{lawyer.courtLevel}</strong>
          </div>

          <div>
            <span style={{ color: 'var(--color-text-subtle)', display: 'block', fontSize: 'var(--font-size-xs)' }}>
              Active Bar Experience:
            </span>
            <strong style={{ fontSize: 'var(--font-size-sm)' }}>{lawyer.experienceYears} Years of Practice</strong>
          </div>

          <div>
            <span style={{ color: 'var(--color-text-subtle)', display: 'block', fontSize: 'var(--font-size-xs)' }}>
              Consultation Languages:
            </span>
            <strong style={{ fontSize: 'var(--font-size-sm)' }}>
              {Array.isArray(lawyer.languages) ? lawyer.languages.join(', ') : 'Urdu, English'}
            </strong>
          </div>
        </div>

        {/* Practice Areas */}
        <div style={{ marginBottom: 'var(--spacing-6)' }}>
          <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-2)', color: 'var(--color-text)' }}>
            Specialized Legal Practice Areas
          </h2>
          <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
            {lawyer.practiceAreas?.map((area) => (
              <span key={area} className="badge badge-info" style={{ padding: '0.3rem 0.75rem' }}>
                {area} Law
              </span>
            ))}
          </div>
        </div>

        {/* Professional Biography */}
        <div style={{ marginBottom: 'var(--spacing-6)' }}>
          <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-2)', color: 'var(--color-text)' }}>
            Chamber Background &amp; Profile
          </h2>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text)',
              lineHeight: 1.7,
              whiteSpace: 'pre-line',
              margin: 0,
            }}
          >
            {lawyer.about || lawyer.bio || 'Advocate practicing in Pakistani subordinate and superior courts.'}
          </p>
        </div>

        {/* =========================================================================
            CONSULTATION SERVICES & SCHEDULE
            ========================================================================= */}
        <div style={{ marginBottom: 'var(--spacing-6)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-3)' }}>
            <BriefcaseIcon size={20} color="var(--color-primary)" />
            <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', margin: 0, color: 'var(--color-text)' }}>
              Consultation Offerings &amp; Chamber Rates (PKR)
            </h2>
          </div>

          {Array.isArray(lawyer.services) && lawyer.services.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-4)' }}>
              {lawyer.services.map((s, idx) => (
                <div key={idx} className="card" style={{ backgroundColor: 'var(--color-bg)', padding: 'var(--spacing-4)', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {s.mode === SERVICE_MODES.VIDEO && <VideoIcon size={16} />}
                      {s.mode === SERVICE_MODES.PHONE && <PhoneIcon size={16} />}
                      {s.mode === SERVICE_MODES.CHAT && <ChatIcon size={16} />}
                      {s.mode === SERVICE_MODES.IN_CHAMBER && <BriefcaseIcon size={16} />}
                      <strong style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
                        {SERVICE_MODE_LABELS[s.mode] || s.mode}
                      </strong>
                    </div>
                    <span className="badge badge-info">{s.durationMinutes} Mins</span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: 'var(--spacing-3)' }}>
                    PKR {s.feePkr?.toLocaleString()}
                  </div>
                  <Link
                    to={`/book/${lawyer.id}?mode=${s.mode}`}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', display: 'block', textAlign: 'center' }}
                  >
                    Book This Consultation
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-subtle)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
              Consultation rates are finalized upon initial formal enquiry.
            </p>
          )}
        </div>

        {/* =========================================================================
            UPCOMING AVAILABLE CALENDAR SLOTS
            ========================================================================= */}
        <div style={{ marginBottom: 'var(--spacing-6)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-3)' }}>
            <CalendarIcon size={20} color="var(--color-primary)" />
            <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', margin: 0, color: 'var(--color-text)' }}>
              Upcoming Consultation Slots (Next 14 Days)
            </h2>
          </div>

          {slotsLoading ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>Loading available slots...</p>
          ) : slots.length > 0 ? (
            <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
              {slots.slice(0, 8).map((slot, idx) => (
                <Link
                  key={idx}
                  to={`/book/${lawyer.id}`}
                  style={{
                    padding: 'var(--spacing-2) var(--spacing-3)',
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-medium)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    textDecoration: 'none',
                    transition: 'background-color 0.15s ease',
                  }}
                  title="Schedule this consultation slot"
                >
                  <ClockIcon size={13} />
                  <span>{formatSlotTime(slot.startTime || slot)}</span>
                </Link>
              ))}
              {slots.length > 8 && (
                <span style={{ alignSelf: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)' }}>
                  +{slots.length - 8} more slots
                </span>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-subtle)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
              No automated slots open in the next 14 days. You may submit a direct consultation enquiry.
            </p>
          )}
        </div>

        {/* =========================================================================
            VERIFIED CLIENT REVIEWS
            ========================================================================= */}
        <div style={{ marginBottom: 'var(--spacing-6)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <StarIcon size={20} color="#d97706" fill="#d97706" />
              <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', margin: 0, color: 'var(--color-text)' }}>
                Client Reviews ({reviewCount})
              </h2>
            </div>
            {ratingAvg !== null && (
              <strong style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-sm)' }}>
                Average Rating: {ratingAvg.toFixed(1)} / 5.0
              </strong>
            )}
          </div>

          {reviewsLoading ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>Loading client reviews...</p>
          ) : reviewsData?.reviews?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
              {reviewsData.reviews.map((rev) => (
                <div key={rev.id} className="card" style={{ padding: 'var(--spacing-3)', backgroundColor: 'var(--color-bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-1)' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          size={14}
                          color="#d97706"
                          fill={i < rev.rating ? '#d97706' : 'none'}
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)' }}>
                      Verified Consultation
                    </span>
                  </div>
                  {rev.comment && (
                    <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text)', fontStyle: 'italic' }}>
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  )}
                  {rev.lawyerReply && (
                    <div
                      style={{
                        marginTop: 'var(--spacing-2)',
                        padding: 'var(--spacing-2) var(--spacing-3)',
                        backgroundColor: 'var(--color-surface)',
                        borderLeft: '3px solid var(--color-primary)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--font-size-xs)',
                      }}
                    >
                      <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: '2px' }}>
                        Advocate Chamber Response:
                      </strong>
                      <span style={{ color: 'var(--color-text)' }}>{rev.lawyerReply}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-subtle)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
              No public reviews recorded yet for this practitioner.
            </p>
          )}
        </div>

        {/* Regulatory & Scrutiny Notice */}
        <div
          style={{
            padding: 'var(--spacing-3) var(--spacing-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-surface-hover)',
            border: '1px solid var(--color-border)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-3)',
          }}
        >
          <ShieldIcon size={20} color="var(--color-text-subtle)" />
          <span>
            <strong>Regulatory Standing Notice:</strong> In compliance with Rule 135 of the Legal Practitioners and Bar Councils Rules 1976, advocate credentials and review metrics are displayed objectively. Listing on LegalHub does not constitute a statutory Bar Council endorsement.
          </span>
        </div>
      </div>
    </div>
  );
};

export default LawyerProfile;
