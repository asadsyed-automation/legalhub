import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAllProfiles,
  getProfileById,
  getGigsForProfile,
  getReviewsForGig,
  createReview,
} from '../api/marketplaceApi';
import { Card, Badge, Button, Input } from '../components/ui';

// ─── Star rating display ──────────────────────────────────────────────────────
function Stars({ rating }) {
  return (
    <span style={{ color: 'var(--color-accent)', fontSize: '15px' }}>
      {Array.from({ length: 5 }, (_, i) => (i < rating ? '★' : '☆')).join('')}
    </span>
  );
}

// ─── Leave-a-review form (citizens only) ─────────────────────────────────────
function ReviewForm({ gigId, onReviewAdded }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await createReview({ gig_id: gigId, rating: Number(rating), comment: comment.trim() });
      setComment('');
      setRating(5);
      onReviewAdded();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 'var(--spacing-2)' }}>
      <h4 style={{ margin: '0 0 8px', fontFamily: 'var(--font-heading)', fontSize: '14px' }}>Leave a Review</h4>
      <div style={{ marginBottom: '8px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '4px' }}>
          Rating
        </label>
        <select
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          style={{
            padding: '7px 12px', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)', fontSize: '14px',
            fontFamily: 'var(--font-body)', backgroundColor: 'var(--color-surface)',
          }}
        >
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>{r} Star{r !== 1 ? 's' : ''}</option>
          ))}
        </select>
      </div>
      <Input
        label="Comment (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience…"
      />
      {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px' }}>{error}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit Review'}
      </Button>
    </form>
  );
}

// ─── Gig card with reviews ────────────────────────────────────────────────────
function GigDetail({ gig, isCitizen }) {
  const [reviews, setReviews] = useState([]);
  const [showReviews, setShowReviews] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  async function loadReviews() {
    setLoadingReviews(true);
    try {
      const data = await getReviewsForGig(gig.id);
      setReviews(data);
    } catch {
      // silent fail — reviews are non-critical
    } finally {
      setLoadingReviews(false);
    }
  }

  function handleToggle() {
    if (!showReviews) loadReviews();
    setShowReviews(!showReviews);
    setShowReviewForm(false);
  }

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <Card style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '15px' }}>{gig.title}</p>
          {gig.description && (
            <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{gig.description}</p>
          )}
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-primary)' }}>
            Rs. {Number(gig.price).toLocaleString('en-PK')}
          </p>
        </div>
        <Button variant="secondary" onClick={handleToggle} style={{ marginTop: 0, fontSize: '12px', padding: '5px 12px' }}>
          {showReviews ? 'Hide Reviews' : 'Reviews'}
        </Button>
      </div>

      {showReviews && (
        <div style={{ marginTop: 'var(--spacing-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-2)' }}>
          {loadingReviews && <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Loading reviews…</p>}
          {!loadingReviews && reviews.length === 0 && (
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>No reviews yet.</p>
          )}
          {avgRating && (
            <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              Average: <Stars rating={Math.round(avgRating)} /> ({avgRating} / 5 from {reviews.length} review{reviews.length !== 1 ? 's' : ''})
            </p>
          )}
          {reviews.map((r) => (
            <div key={r.id} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--color-border)' }}>
              <Stars rating={r.rating} />
              {r.comment && <p style={{ margin: '4px 0 0', fontSize: '13px' }}>{r.comment}</p>}
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                {new Date(r.created_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>
          ))}

          {isCitizen && (
            <>
              <Button
                variant="secondary"
                onClick={() => setShowReviewForm(!showReviewForm)}
                style={{ marginTop: 0, fontSize: '12px', padding: '5px 12px' }}
              >
                {showReviewForm ? 'Cancel' : '+ Write a Review'}
              </Button>
              {showReviewForm && (
                <ReviewForm
                  gigId={gig.id}
                  onReviewAdded={() => { setShowReviewForm(false); loadReviews(); }}
                />
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Profile detail view ──────────────────────────────────────────────────────
function ProfileDetail({ profile, onBack, isCitizen }) {
  const [gigs, setGigs] = useState([]);
  const [loadingGigs, setLoadingGigs] = useState(true);
  const [gigError, setGigError] = useState('');

  useEffect(() => {
    getGigsForProfile(profile.id)
      .then(setGigs)
      .catch(() => setGigError('Failed to load gigs'))
      .finally(() => setLoadingGigs(false));
  }, [profile.id]);

  return (
    <div>
      <Button variant="secondary" onClick={onBack} style={{ marginTop: 0, marginBottom: 'var(--spacing-2)' }}>
        ← Back to Marketplace
      </Button>

      <Card style={{ marginBottom: 'var(--spacing-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 6px', color: 'var(--color-secondary)' }}>
              {profile.specialization}
            </h2>
            {profile.fee_structure && (
              <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Fee: {profile.fee_structure}
              </p>
            )}
            <p style={{ margin: '0 0 4px', fontSize: '13px' }}>
              Won {profile.cases_won} cases
            </p>
          </div>
          <Badge status="Open" />
        </div>
        {profile.bio && (
          <p style={{ marginTop: 'var(--spacing-2)', fontSize: '14px', lineHeight: '1.6', color: 'var(--color-text)' }}>
            {profile.bio}
          </p>
        )}
      </Card>

      <h3 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 var(--spacing-2)', color: 'var(--color-secondary)' }}>
        Gigs & Services
      </h3>
      {loadingGigs && <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Loading gigs…</p>}
      {gigError && <p style={{ color: 'var(--color-danger)', fontSize: '13px' }}>{gigError}</p>}
      {!loadingGigs && gigs.length === 0 && (
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>No gigs listed yet.</p>
      )}
      {gigs.map((gig) => (
        <GigDetail key={gig.id} gig={gig} isCitizen={isCitizen} />
      ))}
    </div>
  );
}

// ─── Main browse page ─────────────────────────────────────────────────────────
function MarketplaceBrowse() {
  const { user } = useAuth();
  const isCitizen = user?.role === 'citizen';

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAllProfiles()
      .then(setProfiles)
      .catch(() => setError('Failed to load marketplace profiles'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = profiles.filter(
    (p) =>
      p.specialization.toLowerCase().includes(search.toLowerCase()) ||
      (p.bio && p.bio.toLowerCase().includes(search.toLowerCase()))
  );

  if (selectedProfile) {
    return (
      <ProfileDetail
        profile={selectedProfile}
        onBack={() => setSelectedProfile(null)}
        isCitizen={isCitizen}
      />
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', margin: 0, color: 'var(--color-secondary)' }}>
          Lawyer Marketplace
        </h2>
        <div style={{ width: '260px' }}>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by specialization…"
          />
        </div>
      </div>

      {loading && <p style={{ color: 'var(--color-text-secondary)' }}>Loading profiles…</p>}
      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}
      {!loading && filtered.length === 0 && (
        <Card>
          <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>
            No verified lawyer profiles found{search ? ` matching "${search}"` : ''}.
          </p>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-2)' }}>
        {filtered.map((profile) => (
          <Card
            key={profile.id}
            style={{ cursor: 'pointer' }}
            onClick={() => setSelectedProfile(profile)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0, fontSize: '16px', color: 'var(--color-secondary)' }}>
                {profile.specialization}
              </h3>
              <Badge status="Open" />
            </div>
            {profile.bio && (
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.5',
                overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {profile.bio}
              </p>
            )}
            {profile.fee_structure && (
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--color-text)' }}>
                💰 {profile.fee_structure}
              </p>
            )}
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              {profile.cases_won} cases won
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default MarketplaceBrowse;
