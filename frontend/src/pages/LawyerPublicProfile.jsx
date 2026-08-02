import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import {
  getProfileById,
  getGigsForProfile,
  getReviewsForGig,
  createReview,
} from '../api/marketplaceApi';
import { Card, Badge, Button, Input } from '../components/ui';

function Stars({ rating }) {
  return (
    <span style={{ color: '#F59E0B', fontSize: '15px', letterSpacing: '2px' }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

function LawyerPublicProfile() {
  const { profileId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [reviewsMap, setReviewsMap] = useState({}); // gigId -> array of reviews
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Review Form State
  const [selectedGigId, setSelectedGigId] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    if (profileId) {
      loadProfileData();
    }
  }, [profileId]);

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? '' : prev));
    }, 4000);
  }

  async function loadProfileData() {
    setLoading(true);
    setError('');
    try {
      const prof = await getProfileById(profileId);
      setProfile(prof);

      const gigList = await getGigsForProfile(profileId);
      setGigs(gigList);
      if (gigList.length > 0) {
        setSelectedGigId(gigList[0].id);
      }

      // Fetch reviews for each gig
      const map = {};
      for (const gig of gigList) {
        const revs = await getReviewsForGig(gig.id).catch(() => []);
        map[gig.id] = revs;
      }
      setReviewsMap(map);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load lawyer profile.');
    } finally {
      setLoading(false);
    }
  }

  // Combine all reviews across all gigs for aggregate calculation & display
  const allReviews = Object.values(reviewsMap).flat();
  const avgRating = allReviews.length > 0
    ? (allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1)
    : null;

  async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!selectedGigId) { setReviewError('Please select a service gig'); return; }
    setSubmittingReview(true);
    setReviewError('');
    try {
      await createReview({
        gig_id: selectedGigId,
        rating: Number(reviewRating),
        comment: reviewComment.trim() || undefined,
      });
      setReviewComment('');
      setShowReviewForm(false);
      showToast('⭐ Thank you! Your review has been published.');
      await loadProfileData();
    } catch (err) {
      setReviewError(err.response?.data?.error || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  }

  function handleConsultationRequest(gigTitle) {
    if (!user) {
      navigate(`/login?redirect=/marketplace/${profileId}`);
      return;
    }
    showToast(`📩 Consultation request submitted for "${gigTitle}". Adv. ${profile?.lawyer?.name || 'the advocate'} will respond shortly.`);
  }

  const isCitizen = user && user.role === 'citizen';

  const pageContent = (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '10px 0 40px' }}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              padding: '12px 18px',
              marginBottom: '20px',
              backgroundColor: '#ECFDF5',
              border: '1px solid var(--color-success)',
              color: '#065F46',
              borderRadius: 'var(--radius-sm)',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065F46' }}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <Link
        to="/marketplace"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          color: 'var(--color-primary)', textDecoration: 'none',
          fontWeight: 600, fontSize: '14px', marginBottom: '20px'
        }}
      >
        ← Back to Marketplace
      </Link>

      {loading && <p style={{ color: 'var(--color-text-secondary)' }}>Loading lawyer profile…</p>}
      {error && <p style={{ color: 'var(--color-danger)', fontSize: '15px' }}>{error}</p>}

      {profile && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {/* ── 1. HEADER HERO CARD ─────────────────────────────────────── */}
          <Card style={{ marginBottom: '24px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <img
                  src={profile.avatar_url || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=160&auto=format&fit=crop&q=80'}
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=160&auto=format&fit=crop&q=80'; }}
                  alt={profile.lawyer?.name || 'Advocate'}
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-primary)' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <h1 style={{ fontFamily: 'var(--font-heading)', margin: 0, fontSize: '26px', fontWeight: 800, color: 'var(--color-secondary)' }}>
                      Adv. {profile.lawyer?.name || 'Advocate'}
                    </h1>
                    <Badge status="Paid" label="Verified Advocate" />
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)' }}>
                    ⚖️ {profile.specialization}
                  </p>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
                    <span>📍 High Court Bar / Lahore</span>
                    <span>🏆 <strong>{profile.cases_won}</strong> Cases Won</span>
                    {avgRating ? (
                      <span style={{ color: '#D97706', fontWeight: 700 }}>
                        ⭐ {avgRating} / 5 ({allReviews.length} review{allReviews.length !== 1 ? 's' : ''})
                      </span>
                    ) : (
                      <span>⭐ New Verified Advocate</span>
                    )}
                  </div>
                </div>
              </div>

              {profile.fee_structure && (
                <div style={{
                  backgroundColor: 'rgba(15,92,60,0.06)', padding: '16px 20px',
                  borderRadius: 'var(--radius-md)', border: '1px solid rgba(15,92,60,0.15)',
                  textAlign: 'right'
                }}>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                    Fee Structure
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-primary)' }}>
                    💰 {profile.fee_structure}
                  </span>
                </div>
              )}
            </div>

            {profile.bio && (
              <div style={{ marginTop: '24px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, margin: '0 0 8px', color: 'var(--color-secondary)' }}>
                  About the Advocate
                </h3>
                <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.7', color: 'var(--color-text)' }}>
                  {profile.bio}
                </p>
              </div>
            )}
          </Card>

          {/* ── 2. GIGS & SERVICES SECTION ─────────────────────────────── */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 800, color: 'var(--color-secondary)', margin: '0 0 16px' }}>
              Legal Services & Consultation Packages
            </h2>

            {gigs.length === 0 ? (
              <Card>
                <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>No service packages listed by this advocate yet.</p>
              </Card>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {gigs.map((gig) => (
                  <Card key={gig.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '0', overflow: 'hidden' }}>
                    <div style={{ height: '140px', width: '100%', backgroundColor: '#E5E7EB', overflow: 'hidden', position: 'relative' }}>
                      <img
                        src={gig.thumbnail_url || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80'}
                        alt={gig.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                        <span style={{
                          backgroundColor: 'rgba(0,0,0,0.75)', color: '#FFF', fontSize: '13px',
                          fontWeight: 700, padding: '4px 10px', borderRadius: '9999px', backdropFilter: 'blur(4px)'
                        }}>
                          Rs. {Number(gig.price).toLocaleString('en-PK')}
                        </span>
                      </div>
                    </div>

                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, margin: '0 0 8px', color: 'var(--color-secondary)' }}>
                          {gig.title}
                        </h3>
                        {gig.description && (
                          <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: 1.55, margin: '0 0 16px' }}>
                            {gig.description}
                          </p>
                        )}
                      </div>

                      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px', marginTop: '12px' }}>
                        <Button
                          variant="primary"
                          onClick={() => handleConsultationRequest(gig.title)}
                          style={{ width: '100%', marginTop: 0 }}
                        >
                          Request Consultation →
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* ── 3. CLIENT REVIEWS SECTION ──────────────────────────────── */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 800, color: 'var(--color-secondary)', margin: 0 }}>
                  Client Reviews & Ratings
                </h2>
                {avgRating && (
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    Overall <strong style={{ color: '#D97706' }}>{avgRating} / 5.0</strong> based on {allReviews.length} verified review{allReviews.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {isCitizen ? (
                <Button onClick={() => setShowReviewForm(!showReviewForm)} style={{ marginTop: 0 }}>
                  {showReviewForm ? 'Cancel' : '+ Write a Review'}
                </Button>
              ) : !user ? (
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  <Link to={`/login?redirect=/marketplace/${profileId}`} style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
                    Sign in
                  </Link> as a citizen to write a review.
                </span>
              ) : null}
            </div>

            {/* Leave Review Form */}
            {showReviewForm && isCitizen && (
              <Card style={{ marginBottom: '24px', maxWidth: '560px', backgroundColor: '#F9FAFB', border: '1px solid var(--color-primary)' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, margin: '0 0 14px' }}>
                  Write a Review for Adv. {profile.lawyer?.name || ''}
                </h3>
                <form onSubmit={handleReviewSubmit}>
                  {gigs.length > 0 && (
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Select Service Package *</label>
                      <select
                        value={selectedGigId}
                        onChange={(e) => setSelectedGigId(e.target.value)}
                        style={{
                          width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)', fontSize: '14px', fontFamily: 'var(--font-body)'
                        }}
                      >
                        {gigs.map((g) => (
                          <option key={g.id} value={g.id}>{g.title} (Rs. {g.price})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Rating *</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          style={{
                            fontSize: '22px', background: 'none', border: 'none', cursor: 'pointer',
                            color: star <= reviewRating ? '#F59E0B' : '#D1D5DB', padding: '0 4px'
                          }}
                        >
                          ★
                        </button>
                      ))}
                      <span style={{ fontSize: '14px', fontWeight: 700, marginLeft: '8px', alignSelf: 'center' }}>
                        {reviewRating} / 5 Stars
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Comment / Feedback</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience working with this advocate…"
                      rows={3}
                      style={{
                        display: 'block', width: '100%', padding: '10px 12px',
                        border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                        fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none'
                      }}
                    />
                  </div>

                  {reviewError && <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '10px' }}>{reviewError}</p>}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Button type="submit" disabled={submittingReview}>
                      {submittingReview ? 'Submitting…' : 'Publish Review'}
                    </Button>
                    <Button variant="secondary" onClick={() => setShowReviewForm(false)}>Cancel</Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Reviews List */}
            {allReviews.length === 0 ? (
              <Card>
                <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>No client reviews published yet.</p>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {allReviews.map((rev) => (
                  <Card key={rev.id} style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <Stars rating={rev.rating} />
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        {new Date(rev.created_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    {rev.comment && (
                      <p style={{ margin: '0 0 8px', fontSize: '14px', lineHeight: 1.5, color: 'var(--color-text)' }}>
                        "{rev.comment}"
                      </p>
                    )}
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                      Verified Client Review
                    </span>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );

  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
        <PublicNavbar />
        <div style={{ flex: 1, padding: '30px 24px' }}>
          {pageContent}
        </div>
        <PublicFooter />
      </div>
    );
  }

  return pageContent;
}

export default LawyerPublicProfile;
